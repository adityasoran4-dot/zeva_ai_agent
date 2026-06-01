import mongoose from "mongoose";

const PurchaseRecordSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    }, // ✅ Clinic that owns this PurchaseRecord
    // TODO
    orderNo: {
      type: String,
      trim: true,
    },
    branch: {
      // it will actuall branch reference not string
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    enqNo: {
      type: String,
      trim: true,
    },
    quotationNo: {
      type: String,
      trim: true,
    },
    quotationDate: {
      type: Date,
      trim: true,
    },
    validityDays: {
      type: Number,
      default: 0,
    },
    paymentTermsDays: {
      type: Number,
      default: 0,
    },
    supplier: {
      // it will actuall branch reference not string
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "Purchase_Order",
        "Purchase_Request",
        "Purchase_Invoice",
        "GRN_Regular",
      ],
      default: "Purchase_Request",
    },
    supplierInvoiceNo: {
      // Required when type is Purchase_Invoice or GRN_Regular
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "New",
        "Approved",
        "Allocated",
        "Partly_Delivered",
        "Delivered",
        "Partly_Invoiced",
        "Invoiced",
        "Rejected",
        "Cancelled",
        "Deleted",
        "Converted_To_PO",
        "Converted_To_PI",
        "Converted_To_GRN",
      ],
      default: "New",
    },
    // Shipping and billing details start here
    shipTo: {
      to: String,
      address: String,
      telephone: String,
      email: String,
    },
    billTo: {
      to: String,
      address: String,
      telephone: String,
      email: String,
    },
    contactInfoOfBuyer: {
      to: String,
      address: String,
      telephone: String,
      email: String,
    },
    // Shipping and billing details end here
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

// Separate function to find next available order number
async function getNextAvailableOrderNo(clinicId, type) {
  // Define prefix based on type
  const prefixes = {
    Purchase_Order: "PO",
    Purchase_Request: "PUR",
    Purchase_Invoice: "PI",
    GRN_Regular: "GRN",
  };

  const prefix = prefixes[type] || "PO";

  // Find all purchase records for this clinic and type
  const records = await mongoose.models.PurchaseRecord.find({
    clinicId,
    type,
  }).sort({
    orderNo: 1,
  });

  // Find first missing number in sequence
  let expectedNumber = 1;

  for (const record of records) {
    const match = record.orderNo?.match(/(\d+)$/);
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
  console.log(`Next available ${type} order number:`, expectedNumber);

  return `${prefix}-${String(expectedNumber).padStart(6, "0")}`;
}

// In pre-save hook
PurchaseRecordSchema.pre("save", async function (next) {
  if (!this.orderNo) {
    try {
      this.orderNo = await getNextAvailableOrderNo(this.clinicId, this.type);
    } catch (error) {
      console.error("Error generating order number:", error);
      // Fallback to timestamp-based numbering
      const prefixes = {
        Purchase_Order: "PO",
        Purchase_Request: "PUR",
        Purchase_Invoice: "PI",
        GRN_Regular: "GRN",
      };
      const prefix = prefixes[this.type] || "PO";
      this.orderNo = `${prefix}-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// 🔥 Important fix for Next.js hot-reload
if (mongoose.models.PurchaseRecord) {
  delete mongoose.models.PurchaseRecord;
}

export default mongoose.model("PurchaseRecord", PurchaseRecordSchema);
