import mongoose from "mongoose";
const { Schema } = mongoose;

const WorkflowTriggerSchema = new Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Trigger name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Example: 'Appointment', 'Lead', 'Invoice'
    type: {
      type: String,
      required: [true, "Trigger type is required"],
      enum: [
        "new_lead",
        "update_lead",
        "create_or_update_lead",
        "record_created",
        "record_updated",
        "record_create_or_update",
        "webhook_received",
        "incoming_message",
        "booked_appointment",
      ],
    },
    // for webhook trigger
    webhookUrl: {
      type: String,
    },
    webhookListening: {
      type: Boolean,
      default: false,
    },
    webhookResponse: {
      type: Object,
      default: {},
    },
    // for incoming message trigger
    channel: {
      type: String,
      enum: ["sms", "whatsapp", "email"],
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "Provider",
    },
  },
  {
    timestamps: true,
  },
);

// Hot-reload fix for Next.js
if (mongoose.models.WorkflowTrigger) {
  delete mongoose.models.WorkflowTrigger;
}

export default mongoose.model("WorkflowTrigger", WorkflowTriggerSchema);
