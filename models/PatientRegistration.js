import mongoose from "mongoose";

/* ==============================
   Payment History Schema
================================ */
const paymentHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  paid: { type: Number, required: true, min: 0 },
  advance: { type: Number, default: 0, min: 0 },
  pending: { type: Number, required: true, min: 0 },
  paying: { type: Number, default: 0, min: 0 },
  paymentMethod: {
    type: String,
    enum: ["Cash", "Card", "BT", "Tabby", "Tamara"],
    required: true,
  },
  status: {
    type: String,
    enum: ["Active", "Cancelled", "Completed", "Rejected", "Released"],
  },
  rejectionNote: { type: String, trim: true },
  advanceClaimStatus: {
    type: String,
    enum: ["Pending", "Released", "Cancelled", "Approved by doctor"],
  },
  advanceClaimCancellationRemark: { type: String, trim: true },
  updatedAt: { type: Date, default: Date.now },
});

/* ==============================
   Patient Registration Schema
================================ */
const patientRegistrationSchema = new mongoose.Schema(
  {
    // Auto-generated fields
    invoiceNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    invoicedDate: { type: Date, default: Date.now },
    invoicedBy: { type: String, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      index: true,
    },

    // Patient Details
    emrNumber: { type: String, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    email: { type: String, trim: true, lowercase: true },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },
    referredBy: { type: String, trim: true },
    patientType: {
      type: String,
      enum: ["New", "Old"],
      default: "New",
    },

    // Insurance Section
    insurance: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    insuranceType: {
      type: String,
      enum: ["Paid", "Advance"],
      default: "Paid",
    },
    advanceGivenAmount: { type: Number, default: 0, min: 0 },
    coPayPercent: { type: Number, default: 0, min: 0, max: 100 },
    needToPay: { type: Number, default: 0, min: 0 },
    advanceClaimStatus: {
      type: String,
      enum: ["Pending", "Released", "Cancelled", "Approved by doctor"],
      default: function () {
        return this.insurance === "Yes" ? "Pending" : null;
      },
    },
    advanceClaimReleaseDate: { type: Date },
    advanceClaimReleasedBy: { type: String, trim: true },
    advanceClaimCancellationRemark: { type: String, trim: true },

    // Status & Notes
    membership: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    membershipStartDate: { type: Date },
    membershipEndDate: { type: Date },
    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
    },
    package: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package" },
    packageTotalPrice: { type: Number, default: 0 },
    packagePaidAmount: { type: Number, default: 0 },
    packagePaymentStatus: { type: String, enum: ["Unpaid", "Partial", "Full"], default: "Unpaid" },
    packagePaymentMethod: { type: String, default: "" },
    notes: { type: String, trim: true },
    rejectionNote: { type: String, trim: true },

    // Payment History
    paymentHistory: [paymentHistorySchema],
    memberships: [
      {
        membershipId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MembershipPlan",
        },
        startDate: { type: Date },
        endDate: { type: Date },
        paymentStatus: { type: String, enum: ["Unpaid", "Partial", "Full"], default: "Unpaid" },
        paidAmount: { type: Number, default: 0 },
        paymentMethod: { type: String, default: "" },
      },
    ],
    packages: [
      {
        packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package" },
        packageName: { type: String, trim: true }, // Store package name for quick display
        packageSoldBy: { type: String, trim: true }, // Name of the person who added the package
        assignedDate: { type: Date, default: Date.now },
        validityInMonths: { type: Number, default: 0 },
        startDate: { type: Date },
        endDate: { type: Date },
        totalPrice: { type: Number, default: 0 },
        paidAmount: { type: Number, default: 0 },
        paymentStatus: { type: String, enum: ["Unpaid", "Partial", "Full"], default: "Unpaid" },
        paymentMethod: { type: String, default: "" },
      },
    ],
    userPackages: [
      {
        packageId: { type: mongoose.Schema.Types.ObjectId, ref: "UserPackage" },
        packageName: { type: String, trim: true },
        packageSoldBy: { type: String, trim: true }, // Name of the person who added the package
        totalSessions: { type: Number, min: 0 },
        remainingSessions: { type: Number, min: 0 },
        totalPrice: { type: Number, min: 0 },
        assignedDate: { type: Date, default: Date.now },
        approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
      },
    ],
    membershipTransfers: [
      {
        type: { type: String, enum: ["in", "out"], required: true },
        membershipId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MembershipPlan",
          required: true,
        },
        membershipName: { type: String, trim: true },
        fromPatientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PatientRegistration",
        },
        toPatientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PatientRegistration",
        },
        startDate: { type: Date },
        endDate: { type: Date },
        transferredFreeConsultations: { type: Number, default: 0, min: 0 },
        discountPercentageTransferred: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        paymentStatus: { type: String, enum: ["Unpaid", "Partial", "Full"], default: "Unpaid" },
        paidAmount: { type: Number, default: 0 },
        paymentMethod: { type: String, default: "" },
        transferDate: { type: Date, default: Date.now },
      },
    ],
    packageTransfers: [
      {
        type: { type: String, enum: ["in", "out"], required: true },
        packageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Package",
          required: true,
        },
        packageName: { type: String, trim: true },
        fromPatientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PatientRegistration",
        },
        toPatientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PatientRegistration",
        },
        transferredSessions: { type: Number, default: 0, min: 0 },
        paymentStatus: { type: String, enum: ["Unpaid", "Partial", "Full"], default: "Unpaid" },
        paidAmount: { type: Number, default: 0 },
        paymentMethod: { type: String, default: "" },
        transferDate: { type: Date, default: Date.now },
      },
    ],
    hasTransferredOut: { type: Boolean, default: false },
    transferredOutMembershipPriority: { type: Boolean, default: false },

    // Wallet Balance & Credit System
    walletBalance: { type: Number, default: 0, min: 0 },
    walletCreditExpiry: { type: Date, default: null },
    walletTransactions: [
      {
        amount: { type: Number, required: true, min: 0 },
        type: { type: String, enum: ['credit', 'debit'], required: true },
        source: { type: String, enum: ['cashback', 'refund', 'manual', 'payment'], required: true },
        offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
        offerName: { type: String, default: null },
        billingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Billing', default: null },
        invoiceNumber: { type: String, default: null },
        description: { type: String, trim: true, default: '' },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    // map with lead
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },
  },
  { timestamps: true },
);

/* ==============================
   Pre-save Hook
================================ */
patientRegistrationSchema.pre("save", function (next) {
  this.advanceGivenAmount = Number(this.advanceGivenAmount ?? 0);
  this.coPayPercent = Number(this.coPayPercent ?? 0);

  if (this.insurance === "Yes") {
    const coPayAmount = (this.advanceGivenAmount * this.coPayPercent) / 100;
    this.needToPay = Math.max(0, this.advanceGivenAmount - coPayAmount);
  } else {
    this.needToPay = 0;
  }

  next();
});

/* ==============================
   Indexes
================================ */
patientRegistrationSchema.index({ firstName: 1, lastName: 1 });
patientRegistrationSchema.index({ mobileNumber: 1 });

/* ==============================
   Model Export (Hot Reload Safe)
================================ */
if (mongoose.models.PatientRegistration) {
  delete mongoose.models.PatientRegistration;
}

export default mongoose.model("PatientRegistration", patientRegistrationSchema);
