import { User, PrismaClient } from '@prisma/client';
import { ConversationWithUsers } from './types';
import ConversationFlowError from './ConversationFlowError';

const isUsersIncomingCall = (
  conversation: ConversationWithUsers, currentUser: User,
) => (conversation.friendship.toUser.id === currentUser.id) && conversation.callState === 'pending';

const prisma = new PrismaClient();

export const accept = async (conversation: ConversationWithUsers, currentUser: User) => {
  if (!isUsersIncomingCall(conversation, currentUser)) {
    // This will happen if conversation is not pending, or the wrong user is trying to accept
    throw new ConversationFlowError('Cannot accept this conversation');
  }

  return prisma.conversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      callStart: new Date(),
      callState: 'in-progress',
    },
  });
};

export const reject = async (conversation: ConversationWithUsers, currentUser: User) => {
  if (!isUsersIncomingCall(conversation, currentUser)) {
    // This will happen if conversation is not pending, or the wrong user is trying to reject
    throw new ConversationFlowError('Cannot reject this conversation');
  }
  return prisma.conversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      callState: 'failed',
    },
  });
};
