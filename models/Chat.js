// /models/Chat.js
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["user", "doctor"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "prescription"],
      default: "text",
    },
    prescription: {
      type: String,
      required: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    prescriptionRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PrescriptionRequest",
      required: true,
    },
    messages: [MessageSchema],
    lastMessage: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ChatSchema.index({ user: 1, doctor: 1 });
ChatSchema.index({ doctor: 1, lastMessage: -1 });
ChatSchema.index({ user: 1, lastMessage: -1 });
ChatSchema.index({ prescriptionRequest: 1 });

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);

