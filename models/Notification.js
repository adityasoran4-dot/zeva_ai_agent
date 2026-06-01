import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },

    // Optional: Link to acknowledgment tracker item
    relatedAcknowledgment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Acknowledgment",
    },

    // Optional: Link this notification to a job application if relevant
    relatedJobApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobApplication",
    },
    relatedJob: { type: mongoose.Schema.Types.ObjectId, ref: "JobPosting" },

    relatedComment: { type: mongoose.Schema.Types.ObjectId },

    // Optional: For blog reply notifications
    relatedBlog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
    },

    // Optional: For chat/prescription notifications
    relatedChat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    relatedPrescriptionRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PrescriptionRequest",
    },

    type: {
      type: String,
      enum: ["blog-reply", "job-status", "chat-message", "prescription", "acknowledgment"],
    },
  },
  { timestamps: true }
);

delete mongoose.models.Notification;

export default mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
