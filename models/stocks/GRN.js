import mongoose from "mongoose";

const GRNSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    }, // ✅ Clinic that owns this GRN
    grnNo: {
      type: String,
      trim: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    purchasedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseRecord",
      required: true,
      index: true,
    },
    grnDate: {
      type: Date,
      required: true,
    },
    supplierInvoiceNo: {
      type: String,
      required: [true, "Supplier invoice number is required"],
      trim: true,
    },
    supplierGrnDate: {
      type: Date,
      required: [true, "Supplier GRN date is required"],
    },
    notes: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "New",
        "Partly_Invoiced",
        "Invoiced",
        "Partly_Paid",
        "Paid",
        "Deleted",
      ],
      default: "New",
    },
    orderCreditDays: {
      type: Number,
      required: true,
      default: 0,
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
        expiryDate: {
          type: Date,
          default: null,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        uom: {
          type: String,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
        discount: {
          type: Number,
          default: 0,
        },
        discountType: {
          type: String,
          enum: ["Fixed", "Percentage"],
          default: "Fixed",
        },
        discountAmount: {
          type: Number,
          default: 0,
        },
        netPrice: {
          type: Number,
          required: true,
          default: 0,
        },
        vatAmount: {
          type: Number,
          default: 0,
        },
        vatType: {
          type: String,
          enum: ["Exclusive", "Inclusive"],
          default: "Exclusive",
        },
        vatPercentage: {
          type: Number,
          default: 0,
        },
        netPlusVat: {
          type: Number,
          default: 0,
        },
        freeQuantity: {
          type: Number,
          default: 0,
        },
        freeQuantityExpiryDate: {
          type: Date,
          default: null,
        },

        // packaging structure
        level0: {
          price: {
            type: Number,
            default: 0,
          },
          uom: {
            type: String,
            trim: true,
          },
        },
        packagingStructure: {
          level1: {
            quantity: {
              type: Number,
              default: 1,
            },
            price: {
              type: Number,
              default: 0,
            },
            uom: {
              type: String,
              trim: true,
            },
          },
          level2: {
            quantity: {
              type: Number,
              default: 1,
            },
            price: {
              type: Number,
              default: 0,
            },
            uom: {
              type: String,
              trim: true,
            },
          },
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

// Separate function to find next available gap
async function getNextAvailableGRNNumber(clinicId) {
  const grns = await mongoose.models.GRN.find({ clinicId }).sort({
    grnNo: 1,
  }); // Ascending order

  // Find first missing number in sequence
  let expectedNumber = 1;

  for (const grn of grns) {
    const match = grn.grnNo?.match(/(\d+)$/);
    if (match) {
      const currentNumber = parseInt(match[1]);

      if (currentNumber === expectedNumber) {
        expectedNumber++;
      } else if (currentNumber > expectedNumber) {
        // Found a gap!
        break;
      }
    }
  }

  console.log("Next available GRN number:", expectedNumber);
  return `GRN-${String(expectedNumber).padStart(6, "0")}`;
}

// In pre-save hook
GRNSchema.pre("save", async function (next) {
  if (!this.grnNo) {
    try {
      this.grnNo = await getNextAvailableGRNNumber(this.clinicId);
    } catch (error) {
      console.error("Error generating GRN number:", error);
      // Fallback: use timestamp
      this.grnNo = `GRN-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// 🔥 Important fix for Next.js hot-reload
if (mongoose.models.GRN) {
  delete mongoose.models.GRN;
}

export default mongoose.model("GRN", GRNSchema);
