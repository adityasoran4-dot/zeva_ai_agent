import mongoose from "mongoose";

const UOMSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    }, // ✅ Clinic that owns this UOM
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["Main", "Sub"],
      default: "Main",
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Allocated"],
      default: "Active",
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

// 🔥 Important fix for Next.js hot-reload
if (mongoose.models.UOM) {
  delete mongoose.models.UOM;
}

export default mongoose.model("UOM", UOMSchema);
