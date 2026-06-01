// /models/Lead.js
import mongoose from "mongoose";

const ZevaLeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    clinicName: {
      type: String,
    },
    source: {
      type: String,
      default: "Unknown",
    },
  },
  { timestamps: true },
);

delete mongoose.models.ZevaLead;

export default mongoose.models.ZevaLead ||
  mongoose.model("ZevaLead", ZevaLeadSchema);
