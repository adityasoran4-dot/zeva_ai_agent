import mongoose from "mongoose";

const StockLocationSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    }, // ✅ Clinic that owns this Stock Location
    location: {
      type: String,
      required: [true, "Stock location is required"],
      trim: true,
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
if (mongoose.models.StockLocation) {
  delete mongoose.models.StockLocation;
}

export default mongoose.model("StockLocation", StockLocationSchema);
