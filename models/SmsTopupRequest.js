import mongoose from "mongoose";

const SmsTopupRequestSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ownerType: { type: String, enum: ["clinic", "doctor"], required: true },
    credits: { type: Number, required: true },
    note: { type: String },
    adminNote: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.models.SmsTopupRequest || mongoose.model("SmsTopupRequest", SmsTopupRequestSchema);

