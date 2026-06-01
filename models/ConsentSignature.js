import mongoose from "mongoose";

const ConsentSignatureSchema = new mongoose.Schema(
  {
    consentFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consent",
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientRegistration",
      default: null,
    },
    patientName: {
      type: String,
      required: true,
    },
    patientFirstName: {
      type: String,
      default: "",
    },
    patientLastName: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      required: true,
    },
    signature: {
      type: String,
      default: "",
    },
    nameConfirmed: {
      type: String,
      default: "",
    },
    agreedToTerms: {
      type: Boolean,
      default: false,
    },
    questionsAnswered: {
      type: Boolean,
      default: false,
    },
    understandResults: {
      type: Boolean,
      default: false,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      default: null,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "signed", "expired"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.ConsentSignature || mongoose.model("ConsentSignature", ConsentSignatureSchema);
