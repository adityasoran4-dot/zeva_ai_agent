// schemas/TreatmentRef.ts
import mongoose from "mongoose";

const SubTreatmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    price: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

export const TreatmentRefSchema = new mongoose.Schema(
  {
    mainTreatment: { type: String, required: true },
    mainTreatmentSlug: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    subTreatments: [SubTreatmentSchema],
  },
  { _id: false }
);
