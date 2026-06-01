//models/Playbook
import mongoose from "mongoose";

const PlaybookSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    scenarioName: { type: String, required: true, trim: true },
    triggerCondition: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    riskLevel: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resolutionTimeMinutes: { type: Number, default: 0 },
    escalationLevel: { type: String, default: "Level 1" },
    status: { type: String, default: "Active", index: true },
    documentUrl: { type: String, default: "" },
    steps: { type: [String], default: [] },
    expectedResolutionTime: { type: String, default: "" },
    escalationPath: { type: [String], default: [] },
    trainingMaterials: { type: [String], default: [] },
    attachments: { type: [String], default: [] },
  },
  { timestamps: true }
);

PlaybookSchema.index({ clinicId: 1, scenarioName: 1 }, { unique: true });

export default mongoose.models.Playbook || mongoose.model("Playbook", PlaybookSchema);
