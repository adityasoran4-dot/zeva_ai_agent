// models/AgentProfile.ts
import mongoose from "mongoose";

const AgentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    agentCode: { type: String, unique: true },
    emergencyPhone: String,
    relativePhone: String,

    idType: { type: String, enum: ["aadhaar", "pan", "passport"] },
    idNumber: String,
    idDocumentUrl: String,
    idDocumentFrontUrl: String,
    idDocumentBackUrl: String,

    passportNumber: String,
    passportDocumentUrl: String,
    passportDocumentFrontUrl: String,
    passportDocumentBackUrl: String,

    contractUrl: String,
    contractFrontUrl: String,
    contractBackUrl: String,
    contractType: { type: String, enum: ["full", "part"] },

    baseSalary: { type: Number, default: 0 },

    /** ✅ Commission preference (NOT calculation) */
    commissionType: {
      type: String,
      enum: [
        "flat",
        "after_deduction",
        "target_based",
        "target_plus_expense",
      ],
      default: "flat",
    },
    
    commissionPercentage: { type: Number, default: 0 },

    targetMultiplier: { type: Number, default: 1 },
    targetAmount: { type: Number, default: 0 },

    discountType: {
      type: String,
      enum: ["percentage", "fixed_amount", ""],
      default: "",
    },
    discountAmount: { type: Number, default: 0 },

    emergencyName: String,
    joiningDate: Date,
    isActive: { type: Boolean, default: true },

    employeeVisaFrontUrl: String,
    employeeVisaBackUrl: String,
    otherDocuments: [
      {
        name: String,
        url: String,
      },
    ],
    bankPermissions: {
      card: { type: Boolean, default: false },
      bankTransfer: { type: Boolean, default: false },
      tabby: { type: Boolean, default: false },
      tamara: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

AgentProfileSchema.index({ userId: 1 });

export default mongoose.models.AgentProfile ||
  mongoose.model("AgentProfile", AgentProfileSchema);
