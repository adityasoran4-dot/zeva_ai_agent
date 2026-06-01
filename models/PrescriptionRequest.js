import mongoose from "mongoose";

const PrescriptionRequestSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    healthIssue: {
      type: String,
      required: true,
    },
    symptoms: {
      type: String,
      required: false,
    },
    prescription: {
      type: String,
      required: false,
    },
    prescriptionDate: {
      type: Date,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
PrescriptionRequestSchema.index({ user: 1, doctor: 1 });
PrescriptionRequestSchema.index({ doctor: 1, status: 1 });
PrescriptionRequestSchema.index({ user: 1, status: 1 });

export default mongoose.models.PrescriptionRequest ||
  mongoose.model("PrescriptionRequest", PrescriptionRequestSchema);

