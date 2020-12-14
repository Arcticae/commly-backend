import * as jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { parseToken } from './jwt';

const prisma = new PrismaClient();

const authMiddleware = async (req: Request, res: Response, next: () => void) => {
  // Token stored in Authorization header
  const { authorization } = req.headers;

  try {
    const token = parseToken(authorization);

    if (token) {
      const user = await prisma.user.findFirst({
        where: {
          username: token.username,
        },
      });
      if (user) {
        req.currentUser = user;
        return next();
      }
    } else {
      return res.status(401).send({ error: 'Bearer token missing' });
    }
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return res.status(401).end();
    }
  }
  return res.status(400).end();
};

export default authMiddleware;
