import mongoose from "mongoose";

const SmsResultSchema = new mongoose.Schema(
  {
    to: { type: String, required: true },
    status: { type: String, default: "queued" },
    error: { type: String, default: "" },
  },
  { _id: false }
);

const SmsMarketingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["clinic", "doctor", "agent", "admin"], required: true },
    message: { type: String, required: true },
    mediaUrl: { type: String },
    recipients: [{ type: String, required: true }],
    creditsUsed: { type: Number, default: 0 },
    results: [SmsResultSchema],
  },
  { timestamps: true }
);

export default mongoose.models.SmsMarketing || mongoose.model("SmsMarketing", SmsMarketingSchema);

