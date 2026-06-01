import mongoose from "mongoose";

const WorkflowSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Workflow name is required"],
      trim: true,
      maxlength: [100, "Workflow name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Inactive",
      required: true,
    },
    entity: {
      type: String,
      enum: ["Lead", "Patient", "Appointment", "Webhook", "Message"],
      required: [true, "Entity is required"],
    },
    lastRun: {
      type: Date,
      default: null,
    },
    runs: {
      type: Number,
      default: 0,
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Persistence for React Flow structure
    nodes: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    edges: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    viewport: {
      type: mongoose.Schema.Types.Mixed,
      default: { x: 0, y: 0, zoom: 1 },
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Workflow ||
  mongoose.model("Workflow", WorkflowSchema);
