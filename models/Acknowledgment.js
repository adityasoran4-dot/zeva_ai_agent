import mongoose from "mongoose";

const AcknowledgmentSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    staffName: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    documentType: { type: String, enum: ["SOP", "Policy", "Playbook"], required: true, index: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    documentName: { type: String, required: true, trim: true },
    version: { type: String, default: "" },
    status: { type: String, enum: ["Acknowledged", "Pending", "Viewed", "Overdue"], default: "Pending", index: true },
    assignedDate: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },
    acknowledgedOn: { type: Date, default: null },
    signatureDataUrl: { type: String, default: "" },
    signatureBy: { type: String, default: "" },
    signatureAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AcknowledgmentSchema.index({ clinicId: 1, staffId: 1, documentType: 1, documentId: 1 }, { unique: true });

export default mongoose.models.Acknowledgment || mongoose.model("Acknowledgment", AcknowledgmentSchema);
