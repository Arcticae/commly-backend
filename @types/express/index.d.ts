import { User } from '@prisma/client';
import { ConversationWithUsers } from '../../src/routes/api/conversations/:id';

declare global {
  namespace Express {
    interface Request {
      currentUser: User,
      conversation?: ConversationWithUsers
    }
  }
}
