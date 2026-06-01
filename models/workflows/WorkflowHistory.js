import mongoose from "mongoose";
const { Schema } = mongoose;

const WorkflowHistorySchema = new Schema(
  {
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
      index: true,
    },
    triggerId: {
      type: Schema.Types.ObjectId,
      ref: "WorkflowTrigger",
    },
    actionId: {
      type: Schema.Types.ObjectId,
      ref: "WorkflowAction",
    },
    conditionId: {
      type: Schema.Types.ObjectId,
      ref: "WorkflowCondition",
    },
    conditionResult: {
      type: Boolean,
    },
    type: {
      type: String,
      enum: ["trigger", "action", "condition"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "in-progress",
        "completed",
        "failed",
        "waiting",
        "skipped",
        "canceled",
        "retrying",
      ],
      default: "pending",
    },
    executedAt: {
      type: Date,
    },
    // Store any error messages if the action failed
    error: {
      type: String,
    },
    // Store details about the action that was performed
    details: {
      type: Map,
      of: Schema.Types.Mixed,
    },

    // retry count
    retryCount: {
      type: Number,
      default: 0,
    },
    // Store the response of the action if it has one - REST API ACTION or AI_COMPOSER ACTION or WEBHOOK TRIGGER
    response: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    // Store the payload of the action at the time of execution
    payload: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

WorkflowHistorySchema.index({ workflowId: 1, status: 1 });
WorkflowHistorySchema.index({ targetId: 1 });

// Hot-reload fix for Next.js
if (mongoose.models.WorkflowHistory) {
  delete mongoose.models.WorkflowHistory;
}

export default mongoose.model("WorkflowHistory", WorkflowHistorySchema);
