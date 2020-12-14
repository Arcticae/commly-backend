import { PrismaClient } from '@prisma/client';
import express from 'express';
import authMiddleware from '../../modules/auth/authMiddleware';
import { apiCollection } from './utils';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, username: true } });
  return apiCollection(res, users);
});

export default router;
