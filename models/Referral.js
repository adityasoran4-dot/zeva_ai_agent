import mongoose from "mongoose";

const ReferralSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    referralPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    addExpense: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

ReferralSchema.index({ clinicId: 1, phone: 1 });

delete mongoose.models.Referral;
export default mongoose.models.Referral || mongoose.model("Referral", ReferralSchema);
