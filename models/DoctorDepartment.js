import mongoose from "mongoose";

const DoctorDepartmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clinicDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Ensure unique department names per doctor
DoctorDepartmentSchema.index({ doctorId: 1, name: 1 }, { unique: true });

export default mongoose.models.DoctorDepartment || mongoose.model("DoctorDepartment", DoctorDepartmentSchema);

