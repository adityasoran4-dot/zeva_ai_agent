import mongoose from "mongoose";

const UserPackageSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PatientRegistration",
    required: true,
    index: true,
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clinic",
    required: true,
    index: true,
  },
  packageName: {
    type: String,
    required: true,
    trim: true,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  totalSessions: {
    type: Number,
    required: true,
    min: 1,
  },
  remainingSessions: {
    type: Number,
    required: true,
    min: 0,
  },
  sessionPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  treatments: [
    {
      treatmentName: String,
      treatmentSlug: String,
      allocatedPrice: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      sessions: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
      },
      usedSessions: {
        type: Number,
        default: 0,
        min: 0,
      },
      sessionPrice: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
    },
  ],
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "completed", "expired", "cancelled"],
    default: "active",
  },
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["paid", "pending", "partial"],
    default: "paid",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

UserPackageSchema.index({ patientId: 1, clinicId: 1 });
UserPackageSchema.index({ status: 1 });

// Ensure schema updates take effect in Next.js dev by resetting the cached model
delete mongoose.models.UserPackage;

export default mongoose.models.UserPackage || mongoose.model("UserPackage", UserPackageSchema);