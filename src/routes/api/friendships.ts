import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../../modules/auth/authMiddleware';
import { apiCollection } from './utils';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.post('/', async (req, res) => {
  const { userId, inviteMessage } = req.body;
  if (!userId) {
    return res.status(400).send({ userId: 'userId is required' });
  }
  if (req.currentUser.id === userId) {
    return res.status(400).send({ userId: 'Cannot create friendship to self' });
  }

  // This gets protected by SQL constraint, but we can catch it pre-emptively to provide informative error
  const friendshipExists = await prisma.friendship.findFirst({
    where: {
      OR: [
        {
          fromUserId: req.currentUser.id,
          toUserId: userId as number,
        },
        {
          fromUserId: userId as number,
          toUserId: req.currentUser.id,
        },
      ],
    },
  });

  if (friendshipExists) {
    return res.status(400).send({ userId: 'Friendship already exists' });
  }

  try {
    const friendship = await prisma.friendship.create({
      data: {
        fromUser: { connect: { id: req.currentUser.id } },
        toUser: { connect: { id: userId as number } },
        inviteMessage: inviteMessage || null,
      },
    });
    return res.status(201).send(friendship);
  } catch (e) {
    return res.status(400).send({ userId: 'Wrong id provided' });
  }
});

router.get('/', async (req, res) => {
  const myFriendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { fromUserId: { equals: req.currentUser.id } },
        { toUserId: { equals: req.currentUser.id } },
      ],
    },
    include: {
      toUser: { select: { username: true } },
      fromUser: { select: { username: true } },
    },
  });

  return apiCollection(res, myFriendships);
});

router.get('/active', async (req, res) => {
  const equalsMyId = { equals: req.currentUser.id };
  const selectOnlyUsername = { select: { username: true } };

  const myFriendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { fromUserId: equalsMyId },
        { toUserId: equalsMyId },
      ],
      active: true,
    },
    include: { toUser: selectOnlyUsername, fromUser: selectOnlyUsername },
  });

  return apiCollection(res, myFriendships);
});

router.get('/outbound', async (req, res) => {
  const myFriendships = await prisma.friendship.findMany({
    where: { fromUserId: { equals: req.currentUser.id }, active: false },
    include: { toUser: { select: { username: true } } },
  });

  return apiCollection(res, myFriendships);
});

router.get('/inbound', async (req, res) => {
  const myFriendships = await prisma.friendship.findMany({
    where: { toUserId: { equals: req.currentUser.id }, active: false },
    include: { fromUser: { select: { username: true } } },
  });

  return apiCollection(res, myFriendships);
});

router.post('/:id/accept/', async (req, res) => {
  const { id } = req.params;

  const accepted = await prisma.friendship.updateMany({
    where: { toUserId: req.currentUser.id, id: parseInt(id, 10) },
    data: { active: true },
  });

  if (accepted.count) {
    return res.status(204).end();
  }
  return res.status(404).send({ error: 'Matching friendship not found' });
});

export default router;
