class ConversationFlowError extends Error {
  constructor(message: string) {
    super(`Conversation Flow Error: ${message}`);
  }
}

export default ConversationFlowError;
