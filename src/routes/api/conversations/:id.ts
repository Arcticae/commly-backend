import {
  PrismaClient,
} from '@prisma/client';
import express, { NextFunction, Request, Response } from 'express';
import { FatalError } from '../../../utils/serverErrors';
import { ConversationStateValue } from '../../../modules/conversations/values';

const routerForId = (id?: string) => {
  if (!id) {
    throw new FatalError('Routing chain was not executed properly');
  }
  const parsedId = parseInt(id, 10);

  const router = express.Router();
  const prisma = new PrismaClient();

  const withConversationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    if (!parsedId) {
      return res.status(404).end();
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
      return res.status(404).send({ id: 'Did not find the conversation with this ID' });
    }
    req.conversation = conversation;
    return next();
  };

  router.use(withConversationMiddleware);

  router.post('/end', async (req: Request, res) => {
    if (!req.conversation) {
      throw new FatalError('Middleware chain was not executed properly');
    }

    const userParticipatingInCall = req.conversation.friendship.fromUser.id === req.currentUser.id
      || req.conversation.friendship.toUser.id === req.currentUser.id;

    const callInProgress = req.conversation.callState === ConversationStateValue.IN_PROGRESS;
    const callIsPending = req.conversation.callState === ConversationStateValue.PENDING;

    if (userParticipatingInCall && callInProgress) {
      const result = await prisma.conversation.update({
        where: {
          id: parseInt(id, 10),
        },
        data: {
          callEnd: new Date(),
          callState: ConversationStateValue.FINISHED,
        },
      });
      return res.status(200).send(result);
    }

    if (userParticipatingInCall && callIsPending) {
      const result = await prisma.conversation.update({
        where: {
          id: parseInt(id, 10),
        },
        data: {
          callEnd: new Date(),
          callState: ConversationStateValue.FAILED,
        },
      });
      return res.status(200).send(result);
    }

    return res.status(400).send({ error: 'Cannot end this conversation' });
  });
  return router;
};
export default routerForId;
