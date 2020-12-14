import * as jwt from 'jsonwebtoken';
import env from '../../utils/env';

interface JWT {
  username: string;
  iat: number;
  exp: number;
}

export const getToken = (payload: Record<string, any>) => jwt.sign(payload, env('JWT_KEY'), {
  algorithm: 'HS256',
  expiresIn: parseInt(env('TOKEN_EXPIRING_TIME'), 10),
});

export const parseToken = (authorization?: string): JWT | null => {
  if (authorization) {
    const matchData = authorization.match(/^Bearer (.*)$/);
    if (matchData?.[1]) {
      return jwt.verify(matchData[1], env('JWT_KEY')) as JWT;
    }
  }
  return null;
};
