import {
  Conversation,
  Conversation as PrismaConversation,
  ConversationCreateInput,
  ConversationUpdateInput, Friendship, User,
} from '@prisma/client';
import { ConversationStateValue } from './values';

export type ConversationState = ConversationStateValue | null;

type NarrowedDownState = {
  callState: ConversationState
}

export type CustomConversation = Omit<PrismaConversation, 'callState'> & NarrowedDownState;

export type CustomConversationCreateInput = Omit<ConversationCreateInput, 'callState'> & NarrowedDownState;

export type CustomConversationUpdateInput = Omit<ConversationUpdateInput, 'callState'> & NarrowedDownState;

export type ConversationWithUsers = Conversation
  & { friendship: Friendship & { toUser: Omit<User, 'password'>, fromUser: Omit<User, 'password'> } };
