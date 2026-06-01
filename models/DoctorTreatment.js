// models/DoctorTreatment.ts

import mongoose from "mongoose";

const DoctorTreatmentSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    treatmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Treatment", required: true },
    subcategoryIds: [{ type: String }], // or ObjectId if subcategories are stored as separate docs
    price: { type: Number }, // override price if doctor wants custom price
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
  },
  { timestamps: true }
);

export default mongoose.models.DoctorTreatment ||
  mongoose.model("DoctorTreatment", DoctorTreatmentSchema);
