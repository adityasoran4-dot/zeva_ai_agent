import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      index: true,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    serviceSlug: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    clinicPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 5,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

ServiceSchema.index({ clinicId: 1, departmentId: 1, name: 1 }, { unique: true, partialFilterExpression: { name: { $exists: true } } });
ServiceSchema.index({ clinicId: 1, departmentId: 1, serviceSlug: 1 }, { unique: true, partialFilterExpression: { serviceSlug: { $exists: true } } });

delete mongoose.models.Service;
export default mongoose.models.Service || mongoose.model("Service", ServiceSchema);
