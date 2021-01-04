import { PrismaClient, User } from '@prisma/client';
import WebSocket from 'ws';
import { verifyJWT } from './modules/auth/jwt';

const prisma = new PrismaClient();

type WSSession = { socket: WebSocket, user: User, conversationId?: number };

const connectionStore: Record<number, WSSession> = {};

const removeSession = (socket: WebSocket) => {
  const matchingSessionKeys = Object.entries(connectionStore)
    .filter(([_, session]) => (session.socket === socket)).map(([key]) => key);
  matchingSessionKeys.forEach((userId) => {
    delete connectionStore[parseInt(userId, 10)];
  });
};

const sendError = (error: string, socket: WebSocket) => {
  socket.send(JSON.stringify({ error }));
};

const socketException = (error: string, socket: WebSocket) => {
  removeSession(socket);
  sendError(error, socket);
  socket.close();
};

const authorizeSocket = async (message: any, socket: WebSocket): Promise<User> => {
  if (!message.token || !(typeof message.token === 'string')) {
    throw new Error('Unauthorized: Token is required for each request');
  }

  const { username } = verifyJWT(message.token);
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    throw new Error('Unauthorized: Invalid credentials');
  }
  connectionStore[user.id] = { socket, user };
  return user;
};

const findPeerSession = (conversationId: number, userId: number): WSSession | null => {
  const matchingEntry = Object.entries(connectionStore)
    .find(
      ([otherUserId, session]) => (
        userId !== parseInt(otherUserId, 10) && session.conversationId === conversationId
      ),
    );

  if (!matchingEntry) {
    return null;
  }
  return matchingEntry[1];
};

const handleMessage = async (message: any, socket: WebSocket, user: User) => {
  // Look for a peer to post the message to, and see if the conversation is open
  if (!message.conversationId) {
    throw new Error('No conversationId provided');
  }
  // Find the conversation and send the message to peer, if connected.
  const peerSession = findPeerSession(message.conversationId, user.id);
  if (!peerSession) {
    sendError('Peer is not connected yet', socket);
    return;
  }
  peerSession.socket.send(message);
};

export const handleWebsocketMessages = (ws: WebSocket) => {
  ws.on('message', async (message) => {
    if (typeof message === 'string') {
      const parsedMessage = JSON.parse(message);
      try {
        const user = await authorizeSocket(parsedMessage, ws);
        await handleMessage(parsedMessage, ws, user);
      } catch (e) {
        socketException(e.message, ws);
      }
    }
  });
  ws.on('error', async (d) => socketException(d.message, ws));
  ws.on('close', async () => removeSession(ws));
};
