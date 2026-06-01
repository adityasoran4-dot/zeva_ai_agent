import mongoose from "mongoose";

const SmsWalletSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ownerType: { type: String, enum: ["clinic", "doctor"], required: true },
    balance: { type: Number, default: 0 },
    totalSent: { type: Number, default: 0 },
    totalPurchased: { type: Number, default: 0 },
    lastTopupAt: { type: Date },
    lowBalanceNotifiedAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SmsWalletSchema.index({ ownerId: 1, ownerType: 1 }, { unique: true });

export default mongoose.models.SmsWallet || mongoose.model("SmsWallet", SmsWalletSchema);
