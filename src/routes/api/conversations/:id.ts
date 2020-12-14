import { PrismaClient } from '@prisma/client';
import express, { Request, Response } from 'express';
import { FatalError } from '../../../utils/serverErrors';

const routerForId = async (outerReq: Request, outerRes: Response, id?: string) => {
  const router = express.Router();
  const prisma = new PrismaClient();

  if (!id) {
    throw new FatalError('Routing chain was not executed properly');
  }
  const parsedId = parseInt(id, 10);
  if (!parsedId) {
    outerRes.status(404);
    return null;
  }

  const conversation = await prisma.conversation.findUnique({
    where: {
      id: parsedId,
    },
    include: {
      friendship: {
        include: {
          fromUser: {
            select: {
              id: true,
              username: true,
            },
          },
          toUser: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    outerRes.status(404).send({ id: 'Did not find the conversation with this ID' });
    return null;
  }

  const usersIncomingCall = (conversation.friendship.toUser.id === outerReq.currentUser.id)
    && conversation.callState === 'pending';

  router.post('/end', async (req: Request, res) => {
    const userParticipatingInCall = conversation.friendship.fromUser.id === req.currentUser.id
      || conversation.friendship.toUser.id === req.currentUser.id;

    const callInProgress = conversation.callState === 'in-progress';
    if (userParticipatingInCall && callInProgress) {
      const result = await prisma.conversation.update({
        where: {
          id: parseInt(id, 10),
        },
        data: {
          callEnd: new Date(),
          callState: 'failed',
        },
      });
      return res.status(200).send(result);
    }
    return res.status(400).send({ error: 'Cannot end this conversation' });
  });

  router.post('/accept', async (req: Request, res) => {
    if (usersIncomingCall) {
      const result = await prisma.conversation.update({
        where: {
          id: parseInt(id, 10),
        },
        data: {
          callStart: new Date(),
          callState: 'in-progress',
        },
      });
      return res.status(200).send(result);
    }
    // This will happen if conversation is not pending, or the wrong user is trying to accept
    return res.status(400).send({ error: 'Cannot accept this conversation' });
  });

  router.post('/reject', async (req: Request, res) => {
    if (usersIncomingCall) {
      const result = await prisma.conversation.update({
        where: {
          id: parseInt(id, 10),
        },
        data: {
          callState: 'failed',
        },
      });

      return res.status(200).send(result);
    }
    // This will happen if conversation is not pending, or the wrong user is trying to reject
    return res.status(400).send({ error: 'Cannot reject this conversation' });
  });

  return router;
};

export default routerForId;
