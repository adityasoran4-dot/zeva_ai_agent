import mongoose from "mongoose";

const InfoClickSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    userType: { type: String, enum: ["doctor", "clinic"], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "userType" },
  },
  { timestamps: true }
);

export default mongoose.models.InfoClick || mongoose.model("InfoClick", InfoClickSchema);

