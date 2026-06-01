// models/Treatment.ts
import mongoose from "mongoose";

const SubcategorySchema = new mongoose.Schema(
  {
    name: { type: String },
    slug: { type: String },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const TreatmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String },
    subcategories: [SubcategorySchema],
  },
  { timestamps: true }
);

// Force re-registration of the model to avoid schema conflicts with duplicate files
if (mongoose.models.Treatment) {
  delete mongoose.models.Treatment;
}

export default mongoose.model("Treatment", TreatmentSchema);
