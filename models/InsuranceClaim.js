import mongoose from "mongoose";

const InsuranceClaimSchema = new mongoose.Schema(
  {
    // References
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientRegistration",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Insurance Details (mandatory when insurance=Yes)
    insuranceProvider: {
      type: String,
      required: true,
      trim: true,
    },
    policyNumber: {
      type: String,
      required: true,
      trim: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    insuranceCardFile: {
      type: String,
      default: "",
    },
    tableOfBenefitsFile: {
      type: String,
      default: "",
    },

    // Claim Source
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    departmentName: {
      type: String,
      default: "",
      trim: true,
    },
    services: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
          default: null,
        },
        serviceName: {
          type: String,
          default: "",
          trim: true,
        },
      },
    ],
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorName: {
      type: String,
      default: "",
      trim: true,
    },

    // Claim Details
    claimAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    claimType: {
      type: String,
      enum: ["Paid", "Advance"],
      required: true,
    },
    coPayPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    coPayType: {
      type: String,
      enum: ["Patient Pays", "Deduct from Claim", "Clinic Adjusts"],
      default: "Patient Pays",
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    treatmentPlan: {
      type: String,
      default: "",
      trim: true,
    },
    documentFiles: [
      {
        type: String,
        default: "",
      },
    ],

    // Advance-specific fields
    advanceStatus: {
      type: String,
      enum: ["Full Pay", "Partial Pay"],
      default: null,
    },
    advanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Status & Approval
    status: {
      type: String,
      enum: ["Under Review", "Approved", "Rejected", "Released"],
      default: "Under Review",
      index: true,
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: "",
      trim: true,
    },

    // Rejection tracking from pass-claims
    rejectedFromPassClaims: {
      type: Boolean,
      default: false,
    },
    rejectedFromPassClaimsAt: {
      type: Date,
      default: null,
    },
    rejectedFromPassClaimsBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedFromPassClaimsByName: {
      type: String,
      default: "",
    },
    rejectedFromPassClaimsByRole: {
      type: String,
      default: "",
    },

    // Approval tracking (by doctorStaff in all-claims)
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedByName: {
      type: String,
      default: "",
    },
    approvedByRole: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
      default: null,
    },

    // Rejection tracking (by doctorStaff in all-claims)
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedByName: {
      type: String,
      default: "",
    },
    rejectedByRole: {
      type: String,
      default: "",
    },
    rejectedAt: {
      type: Date,
      default: null,
    },

    // Release tracking (by clinic/agent in pass-claims)
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    releasedByName: {
      type: String,
      default: "",
    },
    releasedByRole: {
      type: String,
      default: "",
    },
    releasedAt: {
      type: Date,
      default: null,
    },

    // Pending claim amount (remaining amount for Advance + Partial Pay type)
    pendingClaim: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Patient info denormalized for quick display
    patientFirstName: {
      type: String,
      default: "",
      trim: true,
    },
    patientLastName: {
      type: String,
      default: "",
      trim: true,
    },
    patientMobileNumber: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for common queries
InsuranceClaimSchema.index({ clinicId: 1, status: 1 });
InsuranceClaimSchema.index({ doctorId: 1, status: 1 });
InsuranceClaimSchema.index({ patientId: 1, createdAt: -1 });

// Pre-save hook: auto-calculate advanceAmount
InsuranceClaimSchema.pre("save", function (next) {
  if (this.claimType === "Advance" && this.advanceStatus) {
    if (this.advanceStatus === "Full Pay") {
      this.advanceAmount = this.claimAmount;
    } else if (this.advanceStatus === "Partial Pay") {
      this.advanceAmount = this.claimAmount * 0.5;
    }
  }
  next();
});

if (mongoose.models.InsuranceClaim) {
  delete mongoose.models.InsuranceClaim;
}

export default mongoose.model("InsuranceClaim", InsuranceClaimSchema);
