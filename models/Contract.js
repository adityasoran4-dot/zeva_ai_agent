import mongoose from "mongoose";

const ContractSchema = new mongoose.Schema(
  {
    contractId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    contractTitle: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    renewalDate: {
      type: Date,
    },
    contractValue: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentTerms: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", "one-time"],
      required: true,
    },
    responsiblePerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Expiring Soon", "Expired", "Terminated", "Renewed"],
      default: "Active",
    },
    contractFile: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-update status based on dates
ContractSchema.pre("save", function (next) {
  const today = new Date();
  if (this.endDate < today) {
    this.status = "Expired";
  } else if (this.renewalDate && this.renewalDate < today) {
    this.status = "Expiring Soon";
  }
  next();
});

export default mongoose.models.Contract || mongoose.model("Contract", ContractSchema);