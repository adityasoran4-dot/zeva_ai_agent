import mongoose from "mongoose";
const { Schema } = mongoose;

const ConditionSchema = new Schema(
  {
    conditionType: {
      type: String,
      enum: ["and", "or"],
      default: "and",
      required: true,
    },
    field: {
      type: String,
      required: [true, "Field is required"],
      trim: true,
    },
    operator: {
      type: String,
      required: [true, "Operator is required"],
      enum: [
        "equal",
        "not_equal",
        "contains",
        "not_contains",
        "exists",
        "not_exists",
        "is_empty",
        "is_not_empty",
        "starts_with",
        "not_starts_with",
        "ends_with",
        "not_ends_with",
        "less_than",
        "greater_than",
      ],
    },
    value: {
      type: Schema.Types.Mixed,
      required: [true, "Value is required"],
    },
  },
  { _id: false },
);

const WorkflowConditionSchema = new Schema(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
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
    type: {
      type: String,
      required: [true, "Condition type is required"],
      enum: ["if_else", "filter"],
      default: "if_else",
    },
    conditions: [
      {
        andConditions: [ConditionSchema],
        orConditions: [ConditionSchema],
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.models.WorkflowCondition ||
  mongoose.model("WorkflowCondition", WorkflowConditionSchema);
