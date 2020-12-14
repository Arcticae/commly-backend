import * as bcrypt from 'bcrypt';

const saltRounds = 10;

export const hashPassword = (plaintext: string): Promise<string> => bcrypt.hash(plaintext, saltRounds);

export const comparePassword = (
  plaintext: string,
  hashedPassword: string,
): Promise<boolean> => bcrypt.compare(plaintext, hashedPassword);
