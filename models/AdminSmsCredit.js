import mongoose from "mongoose";

const AdminSmsCreditSchema = new mongoose.Schema(
  {
    availableCredits: { type: Number, default: 0 },
    totalAdded: { type: Number, default: 0 },
    totalConsumed: { type: Number, default: 0 },
    lowThreshold: { type: Number, default: 1000 },
    lastTopupAt: { type: Date },
    note: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.AdminSmsCredit || mongoose.model("AdminSmsCredit", AdminSmsCreditSchema);

