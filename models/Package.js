import mongoose from "mongoose";

const PackageSchema = new mongoose.Schema(
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
        sessionPrice: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    validityInMonths: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

PackageSchema.index({ clinicId: 1, name: 1 }, { unique: true });

// Ensure schema updates take effect in Next.js dev by resetting the cached model
delete mongoose.models.Package;

export default mongoose.models.Package || mongoose.model("Package", PackageSchema);

