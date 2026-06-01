import mongoose from "mongoose";

const SegmentSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    }, // ✅ Clinic that owns this segment

    name: { type: String, required: true },
    description: { type: String },
    leads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead",
      },
    ],
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Prevent model recompilation error in development
delete mongoose.models.Segment;

export default mongoose.models.Segment ||
  mongoose.model("Segment", SegmentSchema);
