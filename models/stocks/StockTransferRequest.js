import mongoose from "mongoose";

const StockTransferRequestSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    transferType: {
      type: String,
      enum: ["Internal", "External"],
      default: "Internal",
    },
    stockTransferRequestNo: {
      type: String,
      trim: true,
    },
    requestingBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      index: true,
    },
    fromBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      index: true,
    },
    requestingEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      enum: ["New", "Transferred", "Cancelled", "Deleted"],
      default: "New",
    },
    items: [
      // requested items
      {
        allocatedStockItemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AllocatedStockItem",
          index: true,
        },
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

// Function to find next available gap for stock transfer request numbers
async function getNextAvailableStockTransferRequestNumber(clinicId) {
  // Find existing requests for the clinic and sort by the request number
  const stockTransferRequests = await mongoose.models.StockTransferRequest.find(
    {
      clinicId,
    },
  ).sort({
    stockTransferRequestNo: 1,
  });

  let expectedNumber = 1;

  for (const req of stockTransferRequests) {
    const match = req.stockTransferRequestNo?.match(/(\d+)$/);
    if (match) {
      const currentNumber = parseInt(match[1], 10);
      if (currentNumber === expectedNumber) {
        expectedNumber++;
      } else if (currentNumber > expectedNumber) {
        break;
      }
    }
  }

  // Use STR- prefix for Stock Transfer Request numbers and zero-pad to 6 digits
  return `STR-${String(expectedNumber).padStart(6, "0")}`;
}

// Pre-save hook to generate stock transfer request number
StockTransferRequestSchema.pre("save", async function (next) {
  if (!this.stockTransferRequestNo) {
    try {
      this.stockTransferRequestNo =
        await getNextAvailableStockTransferRequestNumber(this.clinicId);
    } catch (error) {
      console.error("Error generating stock transfer request number:", error);
      this.stockTransferRequestNo = `STR-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// Handle Next.js hot-reload
if (mongoose.models.StockTransferRequest) {
  delete mongoose.models.StockTransferRequest;
}

export default mongoose.model(
  "StockTransferRequest",
  StockTransferRequestSchema,
);
