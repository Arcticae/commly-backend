import { ConversationWhereInput, PrismaClient } from '@prisma/client';
import express from 'express';
import authMiddleware from '../../../modules/auth/authMiddleware';
import { apiCollection } from '../utils';
import { CustomConversationCreateInput } from '../../../modules/conversations/types';
import { ConversationStateValue } from '../../../modules/conversations/values';
import routerForId from './:id';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.post('/', async (req, res) => {
  const { friendshipId } = req.body;

  const targetFriendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
    include: {
      fromUser: {
        select: {
          id: true,
        },
      },
      toUser: {
        select: {
          id: true,
        },
      },
    },
  });

  if (targetFriendship?.fromUser.id !== req.currentUser.id) {
    return res.status(401).send({ friendshipId: 'Operation not allowed for this user' });
  }

  const currentUsersOutgoingConvo = await prisma.conversation.findFirst({
    where: {
      friendship: {
        fromUserId: req.currentUser.id,
      },
      callState: {
        in: ['pending', 'in-progress'],
      },
    },
  });

  if (currentUsersOutgoingConvo) {
    return res.status(400).send({ error: 'User cannot open two conversations at once' });
  }

  const otherUsersOpenConvo = await prisma.conversation.findFirst({
    where: {
      AND: [{
        OR: [{
          friendship: {
            fromUserId: targetFriendship.toUserId,
          },
        },
        {
          friendship: {
            toUserId: targetFriendship.toUserId,
          },
        }],
      },
      { callState: 'in-progress' },
      ],
    },
  });

  if (otherUsersOpenConvo) {
    const conversation = await prisma.conversation.create({
      data: {
        callState: 'failed',
        callEnd: new Date(),
        friendship: { connect: { id: friendshipId as number } },
      },
    });

    return res.status(201).send({ error: 'Failed: Other user is in a call', conversation });
  }

  try {
    const conversation = await prisma.conversation.create({
      data: {
        friendship: { connect: { id: friendshipId as number } },
        callState: ConversationStateValue.PENDING,
      } as CustomConversationCreateInput,
    });

    return res.status(201).send(conversation);
  } catch (e) {
    return res.status(400).send({ friendshipId: 'Invalid friendshipId provided' });
  }
});

router.get('/:type(outgoing|incoming|all)$', async (req, res) => {
  const { type } = req.params;
  let where: ConversationWhereInput | null;

  switch (type) {
    case 'outgoing':
      where = { friendship: { fromUserId: { equals: req.currentUser.id } } };
      break;
    case 'incoming':
      where = { friendship: { toUserId: { equals: req.currentUser.id } } };
      break;
    case 'all':
      where = {
        OR: [
          { friendship: { fromUserId: { equals: req.currentUser.id } } },
          { friendship: { toUserId: { equals: req.currentUser.id } } },
        ],
      };
      break;
    default:
      where = null;
      break;
  }
  if (!where) {
    return res.status(400).send({ error: 'Path does not match any of the conditions' });
  }

  const { callState } = req.query;

  if (callState) {
    if (typeof callState === 'string' && Object.values<string>(ConversationStateValue).includes(callState)) {
      where.callState = callState;
    } else {
      return res.status(400).send({ callState: 'Invalid filter value' });
    }
  }

  const myConversations = await prisma.conversation.findMany({
    where,
    include: {
      friendship: {
        select: {
          fromUser: {
            select: {
              username: true,
            },
          },

          toUser: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  });

  return apiCollection(res, myConversations);
});

router.use('/:id(\\d+)', (req, res, next) => {
  const { id } = req.params;
  return routerForId(id)(req, res, next);
});

export default router;
