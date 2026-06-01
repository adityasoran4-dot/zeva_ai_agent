import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    }, // ✅ Clinic that owns this Supplier
    // TODO
    code: {
      type: String,
      trim: true,
    },
    branch: {
      // it will actuall branch reference not string
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
    },
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
    },
    vatRegNo: {
      type: String,
      trim: true,
    },
    telephone: {
      type: String,
    },
    mobile: {
      type: String,
    },
    email: {
      type: String,
    },
    url: {
      type: String,
    },
    creditDays: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    openingBalanceType: {
      type: String,
      enum: ["Debit", "Credit"],
      default: "Debit",
    },
    //
    invoiceTotal: {
      type: Number,
      default: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    totalBalance: {
      type: Number,
      default: 0,
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

// Separate function to find next available gap
async function getNextAvailableCode(clinicId) {
  const suppliers = await mongoose.models.Supplier.find({ clinicId }).sort({
    code: 1,
  }); // Ascending order

  // Find first missing number in sequence
  let expectedNumber = 1;

  for (const supplier of suppliers) {
    const match = supplier.code?.match(/(\d+)$/);
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
  console.log("Next available supplier code number:", expectedNumber);

  return `SUP-${String(expectedNumber).padStart(4, "0")}`;
}

// In pre-save hook
SupplierSchema.pre("save", async function (next) {
  if (!this.code) {
    try {
      this.code = await getNextAvailableCode(this.clinicId);
    } catch (error) {
      console.error("Error:", error);
      this.code = `SUP-${Date.now().toString().slice(-4)}`;
    }
  }
  next();
});

// 🔥 Important fix for Next.js hot-reload
if (mongoose.models.Supplier) {
  delete mongoose.models.Supplier;
}

export default mongoose.model("Supplier", SupplierSchema);
