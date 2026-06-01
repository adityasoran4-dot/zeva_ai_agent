import mongoose from "mongoose";

const StockItemSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      //   unique: true,
      //   sparse: true,
    },
    type: {
      type: String,
      enum: ["Stock", "Service", "Fixed_Asset"],
      default: "Stock",
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockLocation",
      required: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    dosage: {
      type: String,
      trim: true,
    },
    strength: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    vatPercentage: {
      type: Number,
      required: true,
      default: 0,
    },
    minQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    maxQuantity: {
      type: Number,
      required: true,
      default: 0,
    },

    // Level 0 Details (Base/Primary level)
    level0: {
      costPrice: {
        type: Number,
        default: 0,
      },
      uom: {
        type: String,
        trim: true,
      },
      salePrice: {
        type: Number,
        default: 0,
      },
    },

    // Multi-level packaging structure
    packagingStructure: {
      level1: {
        multiplier: {
          type: Number,
          default: 1,
        },
        costPrice: {
          type: Number,
          default: 0,
        },
        uom: {
          type: String,
          trim: true,
        },
        salePrice: {
          type: Number,
          default: 0,
        },
      },
      level2: {
        multiplier: {
          type: Number,
          default: 1,
        },
        costPrice: {
          type: Number,
          default: 0,
        },
        uom: {
          type: String,
          trim: true,
        },
        salePrice: {
          type: Number,
          default: 0,
        },
      },
    },

    imageUrl: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better performance
StockItemSchema.index({ clinicId: 1, code: 1 }, { unique: true });
StockItemSchema.index({ clinicId: 1, name: 1 });

// 🔥 Important fix for Next.js hot-reload
if (mongoose.models.StockItem) {
  delete mongoose.models.StockItem;
}

export default mongoose.model("StockItem", StockItemSchema);
