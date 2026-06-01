import mongoose from "mongoose";

const PatientComplainsSchema = new mongoose.Schema(
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
    appointmentReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppointmentReport",
      required: true,
      index: true,
    },
    complaints: {
      type: String,
      required: true,
      trim: true,
    },
    beforeImage: {
      type: String,
      trim: true,
    },
    afterImage: {
      type: String,
      trim: true,
    },
    isDoctorDiscountApplied: {
      type: Boolean,
      default: false,
    },
    doctorDiscountType: {
      type: String, // "percentage" or "fixed_amount"
      trim: true,
    },
    doctorDiscountAmount: {
      type: Number,
      default: 0,
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AllocatedStockItem",
          required: true,
          index: true,
        },
        code: {
          type: String,
          trim: true,
        },
        name: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        uom: {
          type: String,
        },
        totalAmount: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Helpful compound indexes for analytics / lookups
PatientComplainsSchema.index({ clinicId: 1, patientId: 1, createdAt: -1 });
PatientComplainsSchema.index({ clinicId: 1, doctorId: 1, createdAt: -1 });
PatientComplainsSchema.index({ patientId: 1, doctorId: 1, appointmentId: 1 });
PatientComplainsSchema.index({ appointmentReportId: 1, createdAt: -1 });

// Reset cached model in dev environments
if (mongoose.models.PatientComplains) {
  delete mongoose.models.PatientComplains;
}

export default mongoose.model("PatientComplains", PatientComplainsSchema);
