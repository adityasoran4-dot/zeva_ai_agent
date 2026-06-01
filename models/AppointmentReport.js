import mongoose from "mongoose";

const AppointmentReportSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientRegistration",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    temperatureCelsius: {
      type: Number,
      required: true,
    },
    pulseBpm: {
      type: Number,
      required: true,
    },
    systolicBp: {
      type: Number,
      required: true,
    },
    diastolicBp: {
      type: Number,
      required: true,
    },
    heightCm: {
      type: Number,
    },
    weightKg: {
      type: Number,
    },
    waistCm: {
      type: Number,
    },
    respiratoryRate: {
      type: Number,
    },
    spo2Percent: {
      type: Number,
    },
    hipCircumference: {
      type: Number,
    },
    headCircumference: {
      type: Number,
    },
    bmi: {
      type: Number,
    },
    sugar: {
      type: String,
      trim: true,
    },
    urinalysis: {
      type: String,
      trim: true,
    },
    otherDetails: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

AppointmentReportSchema.index({ appointmentId: 1 }, { unique: false });
AppointmentReportSchema.index({ patientId: 1 });

// Delete the cached model if it exists to ensure fresh schema
if (mongoose.models.AppointmentReport) {
  delete mongoose.models.AppointmentReport;
}

export default mongoose.model("AppointmentReport", AppointmentReportSchema);


