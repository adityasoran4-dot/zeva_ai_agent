//models/Policy.js
import mongoose from "mongoose";

const PolicySchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    name: { type: String, required: true, trim: true },
    policyType: { type: String, required: true, trim: true },
    department: { type: String, default: "", trim: true },
    appliesTo: { type: String, required: true, trim: true },
    appliesToRoles: { type: [String], default: [] },
    description: { type: String, default: "" },
    approvalRequired: { type: Boolean, default: false },
    version: { type: String, required: true, trim: true },
    effectiveDate: { type: Date, default: Date.now },
    status: { type: String, default: "Active", index: true },
    documentUrl: { type: String, default: "" },
    mandatoryAck: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PolicySchema.index({ clinicId: 1, name: 1 }, { unique: true });

export default mongoose.models.Policy || mongoose.model("Policy", PolicySchema);
