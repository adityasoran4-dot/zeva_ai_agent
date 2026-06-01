import mongoose from "mongoose";

const ConsentSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    // Step 1: File
    fileUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
    },
    // Step 2: Form Details
    formName: {
      type: String,
      required: true,
      trim: true,
    },
    departmentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],
    language: {
      type: String,
      enum: ["English", "Spanish", "French", "Arabic", "Hindi"],
      default: "English",
    },
    version: {
      type: String,
      default: "1.0",
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    // Step 3: Service Mapping
    serviceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    // Step 4: Signature Settings
    enableDigitalSignature: {
      type: Boolean,
      default: false,
    },
    requireNameConfirmation: {
      type: Boolean,
      default: false,
    },
    // Status
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Force model schema update for plural field
if (mongoose.models.Consent) {
  delete mongoose.models.Consent;
}

const Consent = mongoose.model("Consent", ConsentSchema);
export default Consent;
