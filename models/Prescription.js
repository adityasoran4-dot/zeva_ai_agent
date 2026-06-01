import mongoose from "mongoose";

const MedicineLineSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      trim: true,
      default: "",
    },
    duration: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true },
);

const PrescriptionSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientRegistration",
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      index: true,
    },
    medicines: {
      type: [MedicineLineSchema],
      default: [],
    },
    aftercareInstructions: {
      type: String,
      trim: true,
      default: "",
    },
    includeInPdf: {
      type: Boolean,
      default: true,
    },
    pdfUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

PrescriptionSchema.index({ clinicId: 1, patientId: 1, createdAt: -1 });
PrescriptionSchema.index({ clinicId: 1, appointmentId: 1 });

if (mongoose.models.Prescription) {
  delete mongoose.models.Prescription;
}

export default mongoose.model("Prescription", PrescriptionSchema);
