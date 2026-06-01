import mongoose from "mongoose";

const StaffTreatmentSchema = new mongoose.Schema(
  {
    package: { type: String, trim: true, required: false },   // optional
    treatment: { type: String, trim: true, required: false }, // optional
    packagePrice: { type: Number, required: false },
    treatmentPrice: { type: Number, required: false },
    packageUnits: { type: Number, required: false, default: 1 }, // Number of units for package pricing
  },
  { timestamps: true, collection: "staff_treatment" }
);

export default mongoose.models.staff_treatment ||
  mongoose.model("staff_treatment", StaffTreatmentSchema);
