import mongoose from "mongoose";

const ProgressNoteSchema = new mongoose.Schema(
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
    note: {
      type: String,
      required: true,
      trim: true,
    },
    noteDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

ProgressNoteSchema.index({ clinicId: 1, patientId: 1, noteDate: -1 });
ProgressNoteSchema.index({ clinicId: 1, appointmentId: 1, createdAt: -1 });

if (mongoose.models.ProgressNote) {
  delete mongoose.models.ProgressNote;
}

export default mongoose.model("ProgressNote", ProgressNoteSchema);
