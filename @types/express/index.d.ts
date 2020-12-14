import { User } from '@prisma/client';
import { CustomConversation } from '../../src/modules/conversations/types';

declare global {
  namespace Express {
    interface Request {
      currentUser: User,
      conversation?: CustomConversation
    }
  }
}
