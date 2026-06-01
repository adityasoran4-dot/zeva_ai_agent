import mongoose from "mongoose";

const PurchaseReturnSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    purchaseReturnNo: {
      type: String,
      trim: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic", // Keeping as Clinic if that's what you intended
      required: true,
      index: true,
    },
    purchasedOrder: {
      // Fixed the typo from purchasedOrder to purchaseOrder
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseRecord",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Returned", "Deleted"],
      default: "Returned",
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

// Function to find next available gap
async function getNextAvailablePurchaseReturnNumber(clinicId) {
  const PurchaseReturns = await mongoose.models.PurchaseReturn.find({
    clinicId,
  }).sort({
    purchaseReturnNo: 1, // Fixed case: PurchaseReturnNo → purchaseReturnNo
  });

  let expectedNumber = 1;

  for (const purchaseReturn of PurchaseReturns) {
    const match = purchaseReturn.purchaseReturnNo?.match(/(\d+)$/); // Fixed case
    if (match) {
      const currentNumber = parseInt(match[1]);
      if (currentNumber === expectedNumber) {
        expectedNumber++;
      } else if (currentNumber > expectedNumber) {
        break;
      }
    }
  }

  return `PR-${String(expectedNumber).padStart(6, "0")}`;
}

// Pre-save hook to generate purchase return number
PurchaseReturnSchema.pre("save", async function (next) {
  if (!this.purchaseReturnNo) {
    // Fixed case
    try {
      this.purchaseReturnNo = await getNextAvailablePurchaseReturnNumber(
        this.clinicId,
      );
    } catch (error) {
      console.error("Error generating purchase return number:", error);
      this.purchaseReturnNo = `PR-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// Handle Next.js hot-reload
if (mongoose.models.PurchaseReturn) {
  delete mongoose.models.PurchaseReturn;
}

export default mongoose.model("PurchaseReturn", PurchaseReturnSchema);
