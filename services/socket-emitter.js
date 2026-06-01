import socketService from "./socket-service";

// For backward compatibility - re-export your original functions
export async function emitIncomingMessageToUser(userId, message) {
  console.log("Emitting incoming message to user:", {
    userId,
    messageId: message._id,
    socketService,
  });

  const result = await socketService.emitToUser(
    userId,
    "incomingMessage",
    message
  );

  if (!result) {
    console.warn(
      `Failed to emit incoming message to user ${userId}: User offline or socket not found`
    );
  }

  return result;
}

export async function emitMessageStatusUpdateToUser(userId, message) {
  console.log("Emitting status update to user:", {
    userId,
    messageId: message._id,
    status: message.status,
  });

  const result = await socketService.emitToUser(
    userId,
    "messageStatusUpdate",
    message
  );

  if (!result) {
    console.warn(
      `Failed to emit status update to user ${userId}: User offline`
    );
  }

  return result;
}

// New emit functions
export async function emitMessageReactionToUser(userId, reactionData) {
  return await socketService.emitToUser(
    userId,
    "messageReactionUpdated",
    reactionData
  );
}

export async function emitConversationUpdateToUser(userId, conversationData) {
  return await socketService.emitToUser(
    userId,
    "conversationUpdated",
    conversationData
  );
}

export async function emitNewMessageToUser(userId, messageData) {
  return await socketService.emitToUser(userId, "newMessage", messageData);
}

// Bulk emit functions
export async function emitToMultipleUsers(userIds, event, data) {
  return await socketService.emitToUsers(userIds, event, data);
}

// Check if user is online
export async function isUserOnline(userId) {
  return await socketService.isUserOnline(userId);
}
