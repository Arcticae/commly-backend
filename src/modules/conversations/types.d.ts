import { Conversation as PrismaConversation, ConversationCreateInput, ConversationUpdateInput } from '@prisma/client';
import { ConversationStateValue } from './values';

export type ConversationState = ConversationStateValue | null;

type NarrowedDownState = {
  callState: ConversationState
}

export type CustomConversation = Omit<PrismaConversation, 'callState'> & NarrowedDownState;

export type CustomConversationCreateInput = Omit<ConversationCreateInput, 'callState'> & NarrowedDownState;

export type CustomConversationUpdateInput = Omit<ConversationUpdateInput, 'callState'> & NarrowedDownState;
