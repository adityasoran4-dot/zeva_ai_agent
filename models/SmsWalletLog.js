import mongoose from "mongoose";

const SmsWalletLogSchema = new mongoose.Schema(
  {
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: "SmsWallet", required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ownerType: { type: String, enum: ["clinic", "doctor"], required: true },
    direction: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    reason: { type: String, default: "general" },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.models.SmsWalletLog || mongoose.model("SmsWalletLog", SmsWalletLogSchema);

