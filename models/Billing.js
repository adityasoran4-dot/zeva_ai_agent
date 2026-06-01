import mongoose from "mongoose";

const multiplePaymentSchema = new mongoose.Schema(
  {
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "BT", "Tabby", "Tamara", "Advance Balance", "Insurance Claim", "Pending Claim", "Cashback Wallet"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    paidAt: { type: Date },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    transactionType: {
      type: String,
      enum: ["PAYMENT", "ADVANCE_USAGE", "CLAIM_USAGE", "PENDING_CLEARANCE", "CASHBACK_USAGE"]
    },
    notes: { type: String }
  },
  { _id: false },
);

const paymentHistorySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    paid: { type: Number, required: true, min: 0 },
    pending: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "BT", "Tabby", "Tamara"],
    },
    multiplePayments: [multiplePaymentSchema],
    status: {
      type: String,
      enum: ["Active", "Cancelled", "Completed", "Rejected", "Released", "Partial"],
    },
    updatedAt: { type: Date, default: Date.now },
    // Enterprise-grade audit trail fields
    transactionType: {
      type: String,
      enum: ["PAYMENT", "PENDING_CLEARANCE", "REGULAR_PAYMENT", "ADVANCE_USAGE", "CLAIM_USAGE", "FULL_PAYMENT", "PARTIAL_PAYMENT"]
    },
    amountPaid: { type: Number, default: 0 },
    advanceAmountUsed: { type: Number, default: 0 },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paidByName: { type: String },
    remainingPending: { type: Number, default: 0 }
  },
  { _id: false },
);

const billingSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientRegistration",
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    invoicedDate: {
      type: Date,
      default: Date.now,
    },
    invoicedBy: {
      type: String,
      required: true,
      trim: true,
    },
    // ID of the user who created the billing (agent / doctorStaff / clinic owner)
    invoicedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    // Doctor (doctorStaff) assigned to the appointment
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    // Service details
    service: {
      type: String,
      enum: ["Package", "Treatment", "Service"],
      required: true,
    },
    treatment: {
      type: String,
      trim: true,
    },
    package: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    sessions: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Package-specific: Track which treatments and their sessions
    selectedPackageTreatments: [
      {
        treatmentName: { type: String, trim: true },
        treatmentSlug: { type: String, trim: true },
        sessions: { type: Number, min: 0, default: 0 },
        _id: false,
      },
    ],
    // Track unpaid packages that were paid in this billing
    unpaidPackagesPaid: [
      {
        packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package" },
        packageSubId: { type: mongoose.Schema.Types.ObjectId },
        packageName: { type: String, trim: true },
        amount: { type: Number, min: 0, default: 0 },
        _id: false,
      },
    ],
    // Payment details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paid: {
      type: Number,
      required: true,
      min: 0,
    },
    // Amount of previous advance applied to this invoice
    advanceUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Amount of insurance claim used for this invoice
    claimAmountUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Amount of previous pending cleared in this invoice
    pendingUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Amount of pending claim cleared in this invoice
    pendingClaimUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    pending: {
      type: Number,
      required: true,
      min: 0,
    },
    advance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Amount of previous advance applied to this invoice
    pastAdvance: {
      type: Number,
      default: 0,
      min: 0,
    },
    pastAdvanceUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    pastAdvanceType: {
      type: String,
      enum: ["50% Offer", "54% Offer", "159 Flat", ""],
      default: "",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "BT", "Tabby", "Tamara"],
      required: true,
    },
    // Multiple payment methods for split payments
    multiplePayments: [multiplePaymentSchema],
    paymentHistory: [paymentHistorySchema],
    // Additional fields
    notes: {
      type: String,
      trim: true,
    },
    // Membership free consultation tracking
    isFreeConsultation: {
      type: Boolean,
      default: false,
    },
    freeConsultationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    membershipDiscountApplied: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDoctorDiscountApplied: {
      type: Boolean,
      default: false,
    },
    doctorDiscountType: {
      type: String,
    },
    doctorDiscountAmount: {
      type: Number,
      default: 0,
    },
    isAgentDiscountApplied: {
      type: Boolean,
      default: false,
    },
    agentDiscountType: {
      type: String,
    },
    agentDiscountAmount: {
      type: Number,
      default: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    originalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isAdvanceOnly: {
      type: Boolean,
      default: false,
    },
    // Pending balance payment screenshots/proof images
    pendingBalanceImage: {
      type: [String],
      default: [],
    },
    offerApplied: {
  type: Boolean,
  default: false
},

offerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Offer"
},

offerName: String,

offerType: {
  type: String,
  enum: ["instant_discount", "cashback", "bundle"]
},

offerDiscountAmount: {
  type: Number,
  default: 0
},

cashbackEarned: {
  type: Number,
  default: 0
},

// Detailed cashback offer tracking fields
isCashbackApplied: {
  type: Boolean,
  default: false
},

cashbackOfferId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Offer",
  default: null
},

cashbackOfferName: {
  type: String,
  default: null
},

cashbackAmount: {
  type: Number,
  default: 0,
  min: 0
},

// Cashback validity period
cashbackStartDate: {
  type: Date,
  default: null
},

cashbackEndDate: {
  type: Date,
  default: null
},

// Cashback WALLET usage (when patient uses previously earned cashback)
cashbackWalletUsed: {
  type: Number,
  default: 0,
  min: 0
},

bundleSessionsAdded: {
  type: Number,
  default: 0
},

offerOverrideUsed: {
  type: Boolean,
  default: false
},

offerOverrideReason: String,

offerFreeSession: {
  type: [String],
  default: []
},

freeOfferSessionCount: {
  type: Number,
  default: 0,
  min: 0
},

// Free sessions consumed in this billing (redemptions from previous bundle offers)
usedFreeSessions: {
  type: [String],
  default: []
},

usedFreeSessionCount: {
  type: Number,
  default: 0,
  min: 0
},

// Offer refund tracking fields
isOfferRefunded: {
  type: Boolean,
  default: false
},

refundedAt: {
  type: Date,
  default: null
},

refundedBy: {
  type: String,
  trim: true,
  default: null
},

refundedAmount: {
  type: Number,
  default: 0,
  min: 0
},

// Track what offers were refunded
refundedOffers: [{
  offerType: {
    type: String,
    enum: ['instant_discount', 'cashback', 'bundle'],
    required: true
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    default: null
  },
  offerName: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    default: 0
  },
  freeSessionsRefunded: {
    type: [String],
    default: []
  },
  freeSessionsRestored: {
    type: [String],
    default: []
  },
  cashbackRefunded: {
    type: Number,
    default: 0
  },
  cashbackWalletUsageReversed: {
    type: Number,
    default: 0
  }
}]
  },
  { timestamps: true },
);

// Pre-save hook to calculate pending
billingSchema.pre("save", function (next) {
  this.amount = Number(this.amount ?? 0);
  this.paid = Number(this.paid ?? 0);
  this.advanceUsed = Number(this.advanceUsed ?? 0);
  this.claimAmountUsed = Number(this.claimAmountUsed ?? 0);
  this.pendingUsed = Number(this.pendingUsed ?? 0);
  this.advance = Number(this.advance ?? 0);

  if (this.advanceUsed < 0) this.advanceUsed = 0;
  if (this.claimAmountUsed < 0) this.claimAmountUsed = 0;
  if (this.pendingUsed < 0) this.pendingUsed = 0;

  // Check if pending was directly modified, if so skip calculation
  // This allows explicit pending updates from APIs like pay-invoice-pending
  if (this.isModified('pending')) {
    // Only recalculate advance based on paid and pendingUsed
    const totalCreditsUsed = this.advanceUsed + this.claimAmountUsed;
    const effectiveDue = Math.max(0, this.amount - totalCreditsUsed);
    // New advance generated if paid exceeds effective due (minus pending cleared)
    this.advance = Math.max(0, this.paid - effectiveDue - this.pendingUsed);
    return next();
  }

  // For new documents (isNew), use the provided pending value if it's a partial payment
  // This prevents recalculation when creating billing records with explicit pending amounts
  if (this.isNew) {
    // For partial payments, the pending was already set correctly
    // We still need to ensure paid, advanceUsed, etc. are properly reflected
    const totalCreditsUsed = this.advanceUsed + this.claimAmountUsed;
    const effectiveDue = Math.max(0, this.amount - totalCreditsUsed);
    // Only recalculate pending if it wasn't explicitly set (i.e., equals effectiveDue - paid)
    // For package billing with partial payment, pending is already set correctly
    // Calculate advance: new advance generated if paid exceeds effective due
    this.advance = Math.max(0, this.paid - effectiveDue);
    return next();
  }

  // Effective due after applying previous advance AND insurance claim to this invoice
  const totalCreditsUsed = this.advanceUsed + this.claimAmountUsed;
  const effectiveDue = Math.max(0, this.amount - totalCreditsUsed);
  // Pending is any remaining due after today's payment
  this.pending = Math.max(0, effectiveDue - this.paid);
  // New advance generated if paid exceeds effective due
  // If pendingUsed is provided, it reduces the amount that can be converted to advance
  this.advance = Math.max(0, this.paid - effectiveDue - this.pendingUsed);

  next();
});

// Indexes for faster queries
billingSchema.index({ patientId: 1 });
billingSchema.index({ invoiceNumber: 1 });

// Prevent duplicate model compilation error
if (mongoose.models.Billing) {
  delete mongoose.models.Billing;
}

export default mongoose.models.Billing ||
  mongoose.model("Billing", billingSchema);
