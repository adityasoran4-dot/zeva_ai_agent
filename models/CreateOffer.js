import mongoose from "mongoose";
const { Schema } = mongoose;

const OfferSchema = new Schema(
{
  clinicId: {
    type: Schema.Types.ObjectId,
    ref: "Clinic",
    required: true,
    index: true
  },

  title: { type: String, required: true },
  description: { type: String, default: "" },

  /* =============================
     MAIN OFFER TYPE
  ============================= */
  offerType: {
    type: String,
    enum: ["instant_discount", "cashback", "bundle"],
    required: true
  },

  /* =============================
     BASIC SETTINGS
  ============================= */
  code: { type: String, index: true },
  slug: { type: String, index: true },

  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },

  timezone: { type: String, default: "Asia/Kolkata" },

  status: {
    type: String,
    enum: ["draft", "active", "paused", "expired", "archived"],
    default: "draft"
  },

  enabled: { type: Boolean, default: true },

  /* =============================
     USAGE LIMITS
  ============================= */
  maxUses: { type: Number, default: null },
  usesCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },

  /* =============================
     APPLICABILITY
  ============================= */
  applyOnAllServices: { type: Boolean, default: true },

  serviceIds: [{ type: Schema.Types.ObjectId, ref: "Service" }],

  doctorIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  departmentIds: [{ type: Schema.Types.ObjectId, ref: "Department" }],

  // Optional: Cache service and department names at creation time for display purposes
  serviceNames: [{ type: String }],
  departmentNames: [{ type: String }],

  /* =============================
     BILLING RULES
  ============================= */
  minimumBillAmount: { type: Number, default: 0 },

  allowStacking: { type: Boolean, default: false },

  // NEW FLAG
  allowCombiningWithOtherOffers: {
    type: Boolean,
    default: false
  },

  allowReceptionistDiscount: {
    type: Boolean,
    default: false
  },

  maxBenefitCap: { type: Number, default: 0 },

  marginThresholdPercent: { type: Number, default: 0 },

  sameDayReuseBlocked: { type: Boolean, default: true },

  partialPaymentAllowed: { type: Boolean, default: false },

  /* =============================
     TYPE 1 : INSTANT DISCOUNT
  ============================= */
  discountMode: {
    type: String,
    enum: ["percentage", "flat"],
    default: null
  },

  discountValue: { type: Number, default: 0 },

  /* =============================
     TYPE 2 : CASHBACK
  ============================= */
  cashbackAmount: { type: Number, default: 0 },

  cashbackExpiryDays: { type: Number, default: 0 },

  /* =============================
     TYPE 3 : BUNDLE
  ============================= */
  buyQty: { type: Number, default: 0 },

  freeQty: { type: Number, default: 0 },

  /* =============================
     SMART TOGGLES
  ============================= */
  autoApplyBestOffer: { type: Boolean, default: true },
  allowManualOverride: { type: Boolean, default: false },
  requireApprovalForOverride: { type: Boolean, default: true },
  blockIfProfitMarginBelowX: { type: Boolean, default: true },

  /* =============================
     AUDIT
  ============================= */
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" }

},
{ timestamps: true }
);

// Force re-registration of the model to avoid schema conflicts with duplicate files
if (mongoose.models.Offer) {
  delete mongoose.models.Offer;
}

export default mongoose.model("Offer", OfferSchema);