import { PrismaClient, User } from '@prisma/client';
import WebSocket from 'ws';
import { verifyJWT } from './modules/auth/jwt';

const prisma = new PrismaClient();

type WSSession = { socket: WebSocket, user: User };

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

const handleMessage = async (message: any, socket: WebSocket) => {
  // Find the conversation and send the message to peer, if connected.
  if (!message.toUserId || (typeof message.toUserId !== 'number')) {
    sendError('toUserId is missing from the request body or is in the wrong format', socket);
    return;
  }

  const peerSession = connectionStore[message.toUserId as number];
  if (!peerSession) {
    socket.send(JSON.stringify({
      activeUsers: 1,
    }));
    return;
  }
  peerSession.socket.send(JSON.stringify(message));
};

// eslint-disable-next-line import/prefer-default-export
export const handleWebsocketMessages = (ws: WebSocket) => {
  ws.on('message', async (message) => {
    if (typeof message === 'string') {
      let parsedMessage;
      try {
        parsedMessage = JSON.parse(message);
      } catch (e) {
        socketException(`JSON parsing error: ${e.message}`, ws);
        return;
      }

      try {
        await authorizeSocket(parsedMessage, ws);
        await handleMessage(parsedMessage, ws);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e.message);
        // eslint-disable-next-line no-console
        console.error(e.stack);
        socketException(e.message, ws);
      }
    }
  });
  ws.on('error', async (d) => socketException(d.message, ws));
  ws.on('close', async () => removeSession(ws));
};
