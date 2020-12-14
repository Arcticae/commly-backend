import express from 'express';
import accountsRouter from './accounts';
import friendshipsRouter from './friendships';
import usersRouter from './users';
import conversationsRouter from './conversations';

const router = express.Router();
router.use(express.json());
router.use('/accounts', accountsRouter);
router.use('/friendships', friendshipsRouter);
router.use('/users', usersRouter);
router.use('/conversations', conversationsRouter);

export default router;
