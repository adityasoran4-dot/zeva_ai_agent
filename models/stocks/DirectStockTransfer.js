import mongoose from "mongoose";

const DirectStockTransferSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    directStockTransferNo: {
      type: String,
      trim: true,
    },
    fromBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      index: true,
    },
    toBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
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
      enum: ["New", "Transfered", "Cancelled", "Deleted"],
      default: "New",
    },
    items: [
      // requested items
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

// Function to find next available gap for direct stock transfer numbers
async function getNextAvailableDirectStockTransferNumber(clinicId) {
  // Find existing transfers for the clinic and sort by the transfer number
  const directStockTransfers = await mongoose.models.DirectStockTransfer.find({
    clinicId,
  }).sort({
    directStockTransferNo: 1,
  });

  let expectedNumber = 1;

  for (const transfer of directStockTransfers) {
    const match = transfer.directStockTransferNo?.match(/(\d+)$/);
    if (match) {
      const currentNumber = parseInt(match[1], 10);
      if (currentNumber === expectedNumber) {
        expectedNumber++;
      } else if (currentNumber > expectedNumber) {
        break;
      }
    }
  }

  // Use DST- prefix for Direct Stock Transfer numbers and zero-pad to 6 digits
  return `DST-${String(expectedNumber).padStart(6, "0")}`;
}

// Pre-save hook to generate direct stock transfer number
DirectStockTransferSchema.pre("save", async function (next) {
  if (!this.directStockTransferNo) {
    try {
      this.directStockTransferNo =
        await getNextAvailableDirectStockTransferNumber(this.clinicId);
    } catch (error) {
      console.error("Error generating direct stock transfer number:", error);
      // Fallback: Use timestamp as a unique identifier
      this.directStockTransferNo = `DST-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// Handle Next.js hot-reload
if (mongoose.models.DirectStockTransfer) {
  delete mongoose.models.DirectStockTransfer;
}

export default mongoose.model("DirectStockTransfer", DirectStockTransferSchema);
