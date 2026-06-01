import mongoose from "mongoose";

const PurchaseInvoiceSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    invoiceNo: {
      type: String,
      trim: true,
      unique: true,
      index: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    grn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GRN",
      required: true,
      index: true,
    },
    supplierInvoiceNo: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    notes: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["New", "Partly_Paid", "Paid", "Unpaid", "Deleted"],
      default: "New",
    },
    attachmentUrl: {
      type: String,
      default: "",
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "Bank_Transfer", "Cheque", "Online", "Other", ""],
      default: "",
    },
    grns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GRN",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Separate function to find next available invoice number
async function getNextAvailablePurchaseInvoiceNo(clinicId) {
  const prefix = "PINV";

  try {
    // Find the highest invoice number for this clinic
    const lastInvoice = await mongoose
      .model("PurchaseInvoice")
      .findOne({
        clinicId,
        invoiceNo: { $regex: `^${prefix}-\\d{6}$` },
      })
      .sort({ invoiceNo: -1 })
      .select("invoiceNo");

    if (!lastInvoice || !lastInvoice.invoiceNo) {
      // First invoice for this clinic
      return `${prefix}-000001`;
    }

    // Extract the numeric part and increment
    const match = lastInvoice.invoiceNo.match(/\d+$/);
    if (match) {
      const currentNumber = parseInt(match[0], 10);
      const nextNumber = currentNumber + 1;
      return `${prefix}-${String(nextNumber).padStart(6, "0")}`;
    }

    // Fallback if format doesn't match
    return `${prefix}-000001`;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    // Fallback with timestamp
    return `${prefix}-${Date.now().toString().slice(-6)}`;
  }
}

// In pre-save hook
PurchaseInvoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNo) {
    try {
      this.invoiceNo = await getNextAvailablePurchaseInvoiceNo(this.clinicId);
    } catch (error) {
      console.error("Error generating invoice number in pre-save:", error);
      // Fallback to timestamp-based numbering
      this.invoiceNo = `PINV-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// Add index for better query performance
PurchaseInvoiceSchema.index({ clinicId: 1, invoiceNo: 1 });

// 🔥 Important fix for Next.js hot-reload
if (mongoose.models.PurchaseInvoice) {
  delete mongoose.models.PurchaseInvoice;
}

export default mongoose.model("PurchaseInvoice", PurchaseInvoiceSchema);
