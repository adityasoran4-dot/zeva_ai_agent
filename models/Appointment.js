import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
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
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: false,
    },
    status: {
      type: String,
      enum: [
        "booked",
        "enquiry",
        "Discharge",
        "Arrived",
        "Consultation",
        "Cancelled",
        "Approved",
        "Rescheduled",
        "Waiting",
        "Rejected",
        "Completed",
        "invoice",
        "No Show",
      ],
      required: true,
      default: "booked",
    },
    followType: {
      type: String,
      enum: ["first time", "follow up", "repeat"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    fromTime: {
      type: String,
      required: true, // Format: "HH:MM" (24-hour)
    },
    toTime: {
      type: String,
      required: true, // Format: "HH:MM" (24-hour)
    },
    referral: {
      type: String,
      default: "No",
    },
    emergency: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    cancellationReason: {
      type: String,
      enum: [
        "Personal Emergency",
        "Schedule Conflict",
        "Found Another Clinic",
        "Too Expensive",
        "Other"
      ],
      default: null,
    },
    treatment: {
      type: String,
      trim: true,
      default: "",
    },
    arrivedAt: {
      type: Date,
      default: null,
    },
    bookedFrom: {
      type: String,
      enum: ["doctor", "room"],
      default: "doctor", // Track which column the appointment was booked from
    },
    customTimeSlots: {
      startTime: {
        type: String,
        required: false, // Format: "HH:MM" (24-hour)
      },
      endTime: {
        type: String,
        required: false, // Format: "HH:MM" (24-hour)
      },
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
      index: true,
    },
    serviceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    // Track who booked the appointment
    bookedByRole: {
      type: String,
      enum: ["clinic", "agent", "admin", "doctor", "doctorStaff", "staff", "user"],
      default: null,
    },
    bookedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    bookedByName: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
);

// Indexes for faster queries
AppointmentSchema.index({ clinicId: 1, startDate: 1, fromTime: 1 });
AppointmentSchema.index({ doctorId: 1, startDate: 1 });
AppointmentSchema.index({ roomId: 1, startDate: 1, fromTime: 1 });
AppointmentSchema.index({ patientId: 1 });

// Ensure the latest schema definition is used during hot reloads
if (mongoose.models.Appointment) {
  delete mongoose.models.Appointment;
}

export default mongoose.model("Appointment", AppointmentSchema);
