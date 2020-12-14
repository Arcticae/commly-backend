import { PrismaClient } from '@prisma/client';
import * as express from 'express';
import { getToken } from '../../modules/auth/jwt';
import { comparePassword, hashPassword } from '../../modules/auth/passwords';

const router = express.Router();
const prisma = new PrismaClient();

// POST Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!(username && password)) {
    const errors = {
      username: !username ? 'Username is not present' : undefined,
      password: !password ? 'Password is not present' : undefined,
    };
    return res.status(401).send(errors);
  }

  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (!existingUser) {
    return res.status(401).send({
      error: 'Wrong username or password',
    });
  }

  const passwordMatches = await comparePassword(password, existingUser.password);
  if (!passwordMatches) {
    return res.status(401).send({
      error: 'Wrong username or password',
    });
  }

  const token = getToken({ username });

  return res.status(200).send({ token });
});

// POST Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!(username && password)) {
    const errors = {
      username: !username ? 'Username is not present' : undefined,
      password: !password ? 'Password is not present' : undefined,
    };

    return res.status(401).send(errors);
  }

  const existingUser = await prisma.user.findUnique({ where: { username } });

  if (existingUser) {
    return res.status(400).send({
      username: 'User with this name already exists',
    });
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      password: hashedPassword,
      username,
    },
  });
  try {
    return res.send({ username: user.username });
  } catch (e) {
    return res.status(500).send({ error: e.message });
  }
});

export default router;
