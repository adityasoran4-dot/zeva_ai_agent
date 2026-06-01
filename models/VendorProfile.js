import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
    },
    address: {
      type: String,
      default: "",
    },
    trnNumber: {
      type: String,
      default: "", // ✅ Added TRN number field
    },
    note: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 Important fix for Next.js hot-reload
if (mongoose.models.Vendor) {
  delete mongoose.models.Vendor;
}

export default mongoose.model("Vendor", VendorSchema);
