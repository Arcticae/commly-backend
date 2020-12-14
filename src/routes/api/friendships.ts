import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../../modules/auth/authMiddleware';
import { apiCollection } from './utils';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.post('/', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).send({ userId: 'userId is required' });
  }

  try {
    const friendship = await prisma.friendship.create({
      data: {
        fromUser: { connect: { id: req.currentUser.id } },
        toUser: { connect: { id: userId as number } },
      },
    });
    return res.status(201).send(friendship);
  } catch (e) {
    return res.status(400).send({ userId: 'Wrong id provided' });
  }
});

router.get('/', async (req, res) => {
  const myFriendships = await prisma.friendship.findMany({
    where: { fromUserId: { equals: req.currentUser.id } },
    include: { toUser: { select: { username: true } } },
  });

  return apiCollection(res, myFriendships);
});

export default router;
