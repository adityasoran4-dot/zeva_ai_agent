import mongoose from "mongoose";

const MaterialConsumptionSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    materialConsumptionNo: {
      // Eg: MC-000001, MC-000002, etc. Auto-generated with gap handling
      type: String,
      trim: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
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
      enum: ["New", "Verified", "Deleted"],
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

// Function to find next available gap for material consumption numbers
async function getNextAvailableMaterialConsumptionNumber(clinicId) {
  // Find existing material consumptions for the clinic and sort by the number
  const materialConsumptions = await mongoose.models.MaterialConsumption.find({
    clinicId,
  }).sort({
    materialConsumptionNo: 1,
  });

  let expectedNumber = 1;

  for (const consumption of materialConsumptions) {
    const match = consumption.materialConsumptionNo?.match(/(\d+)$/);
    if (match) {
      const currentNumber = parseInt(match[1], 10);
      if (currentNumber === expectedNumber) {
        expectedNumber++;
      } else if (currentNumber > expectedNumber) {
        break;
      }
    }
  }

  // Use MC- prefix for Material Consumption numbers and zero-pad to 6 digits
  return `MC-${String(expectedNumber).padStart(6, "0")}`;
}

// Pre-save hook to generate material consumption number
MaterialConsumptionSchema.pre("save", async function (next) {
  if (!this.materialConsumptionNo) {
    try {
      this.materialConsumptionNo =
        await getNextAvailableMaterialConsumptionNumber(this.clinicId);
    } catch (error) {
      console.error("Error generating material consumption number:", error);
      // Fallback to timestamp-based number
      this.materialConsumptionNo = `MC-${Date.now().toString().slice(-8)}`;
    }
  }
  next();
});

// Handle Next.js hot-reload
if (mongoose.models.MaterialConsumption) {
  delete mongoose.models.MaterialConsumption;
}

export default mongoose.model("MaterialConsumption", MaterialConsumptionSchema);
