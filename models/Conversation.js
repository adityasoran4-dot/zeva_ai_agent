import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    }, // ✅ Clinic that owns this Conversation

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },
    status: {
      type: String,
      enum: ["open", "closed", "trashed", "blocked", "archived"],
      default: "open",
    },
    recentMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    unreadMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
  },
  { timestamps: true },
);

// Prevent model recompilation error in development
delete mongoose.models.Conversation;

export default mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);
