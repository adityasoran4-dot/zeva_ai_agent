import mongoose from "mongoose";

const PolicyTypeSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    name: { type: String, required: true, trim: true },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

PolicyTypeSchema.index({ clinicId: 1, name: 1 }, { unique: true });

export default mongoose.models.PolicyType || mongoose.model("PolicyType", PolicyTypeSchema);
