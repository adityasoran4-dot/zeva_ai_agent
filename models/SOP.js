 //models/SOP.js
import mongoose from "mongoose";

const SOPSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    applicableRoles: { type: [String], default: [] },
    category: { type: String, required: true, trim: true },
    riskLevel: { type: String, required: true, trim: true },
    version: { type: String, required: true, trim: true },
    lastUpdated: { type: Date, default: Date.now },
    status: { type: String, default: "Active", index: true },
    documentUrl: { type: String, default: "" },
    content: { type: String, default: "" },
    checklist: { type: [String], default: [] },
    attachments: { type: [String], default: [] },
    effectiveDate: { type: Date, default: null },
    reviewDate: { type: Date, default: null },
    mandatoryAck: { type: Boolean, default: false },
    acknowledgmentDeadline: { type: Date, default: null },
  },
  { timestamps: true }
);

SOPSchema.index({ clinicId: 1, name: 1 }, { unique: true });

export default mongoose.models.SOP || mongoose.model("SOP", SOPSchema);
