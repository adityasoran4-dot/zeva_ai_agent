import mongoose from "mongoose";

const PayPerSessionSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    serviceSlug: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 5,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

PayPerSessionSchema.index({ clinicId: 1, name: 1 }, { unique: true });

delete mongoose.models.PayPerSession;
export default mongoose.models.PayPerSession || mongoose.model("PayPerSession", PayPerSessionSchema);
