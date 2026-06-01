import mongoose from "mongoose";

const ConsentLogSchema = new mongoose.Schema(
  {
    consentFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consent",
      required: true,
      index: true,
    },
    consentFormName: {
      type: String,
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientRegistration",
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
      index: true,
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      default: null,
    },
    sentVia: {
      type: String,
      enum: ["whatsapp", "email", "sms", "in-person"],
      default: "whatsapp",
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["sent", "signed", "expired"],
      default: "sent",
    },
    signedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
ConsentLogSchema.index({ patientId: 1, appointmentId: 1, createdAt: -1 });

export default mongoose.models.ConsentLog || mongoose.model("ConsentLog", ConsentLogSchema);
