import mongoose from "mongoose";

const MembershipPlanSchema = new mongoose.Schema(
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
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    durationMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    benefits: {
      freeConsultations: {
        type: Number,
        default: 0,
        min: 0,
      },
      discountPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      priorityBooking: {
        type: Boolean,
        default: false,
      },
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

MembershipPlanSchema.index({ clinicId: 1, name: 1 }, { unique: true });

delete mongoose.models.MembershipPlan;
export default mongoose.models.MembershipPlan || mongoose.model("MembershipPlan", MembershipPlanSchema);
