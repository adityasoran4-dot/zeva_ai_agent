import mongoose from "mongoose";

const StockQtyAdjustmentSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    adjustmentNo: {
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
    postAc: {
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
      enum: ["New", "Completed", "Cancelled", "Deleted"],
      default: "New",
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "StockItem",
          required: true,
          index: true,
        },
        code: {
          type: String,
          trim: true,
        },
        name: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        uom: {
          type: String,
        },
        expiryDate: {
          type: Date,
          default: null,
        },
        costPrice: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
        quantity1: {
          type: Number,
          default: 0,
        },
        quantity2: {
          type: Number,
          default: 0,
        },
        quantity3: {
          type: Number,
          default: 0,
        },
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

// Separate function to find next available adjustment number
async function getNextAvailableAdjustmentNo(clinicId) {
  const prefix = "SQA";

  try {
    // Find the highest adjustment number for this clinic
    const lastAdjustment = await mongoose
      .model("StockQtyAdjustment")
      .findOne({
        clinicId,
        adjustmentNo: { $regex: `^${prefix}-\\d{6}$` },
      })
      .sort({ adjustmentNo: -1 })
      .select("adjustmentNo");

    if (!lastAdjustment || !lastAdjustment.adjustmentNo) {
      // First adjustment for this clinic
      return `${prefix}-000001`;
    }

    // Extract the numeric part and increment
    const match = lastAdjustment.adjustmentNo.match(/\d+$/);
    if (match) {
      const currentNumber = parseInt(match[0], 10);
      const nextNumber = currentNumber + 1;
      return `${prefix}-${String(nextNumber).padStart(6, "0")}`;
    }

    // Fallback if format doesn't match
    return `${prefix}-000001`;
  } catch (error) {
    console.error("Error generating adjustment number:", error);
    // Fallback with timestamp
    return `${prefix}-${Date.now().toString().slice(-6)}`;
  }
}

// Pre-save hook to generate adjustment number
StockQtyAdjustmentSchema.pre("save", async function (next) {
  if (!this.adjustmentNo) {
    try {
      this.adjustmentNo = await getNextAvailableAdjustmentNo(this.clinicId);
    } catch (error) {
      console.error("Error generating adjustment number in pre-save:", error);
      // Fallback to timestamp-based numbering
      this.adjustmentNo = `SQA-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// Add compound index for better query performance
StockQtyAdjustmentSchema.index({ clinicId: 1, adjustmentNo: 1 });
StockQtyAdjustmentSchema.index({ clinicId: 1, date: -1 });
StockQtyAdjustmentSchema.index({ clinicId: 1, status: 1 });

// 🔥 Important fix for Next.js hot-reload
if (mongoose.models.StockQtyAdjustment) {
  delete mongoose.models.StockQtyAdjustment;
}

export default mongoose.model("StockQtyAdjustment", StockQtyAdjustmentSchema);
