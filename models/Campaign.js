import mongoose from "mongoose";

const CampaignSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    }, // ✅ Clinic that owns this Conversation

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ["whatsapp", "sms", "email"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "scheduled",
        "processing",
        "paused",
        "completed",
        "failed",
      ],
      default: "draft",
    },
    scheduleType: {
      type: String,
      enum: ["now", "later"],
      default: "now",
    },
    scheduleTime: {
      date: String,
      time: String,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
    },
    subject: {
      type: String,
    },
    preheader: {
      type: String,
    },
    editorType: {
      type: String,
      enum: ["html-editor", "block-editor", "rich-text-editor", "text-editor"],
      default: "text-editor",
    },
    content: {
      type: String,
    },
    awsEmailTemplateName: {
      type: String,
    },
    designJson: {
      // for email block editor template that store JSON design data
      type: Object,
      default: null,
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "audio", "document", "file", ""],
      default: "",
    },
    source: {
      type: String,
      default: "Zeva",
    },
    attachments: [
      // for email attachments
      {
        fileName: { type: String },
        fileSize: { type: String },
        mimeType: { type: String },
        mediaUrl: { type: String }, // url to access the attachment
        mediaType: {
          type: String,
          enum: ["image", "video", "audio", "document", "file", ""],
          default: "",
        },
      },
    ],
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
    },
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead",
      },
    ],
    segmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Segment",
    },
    // for manual numbers or segment
    recipientType: {
      type: String,
      enum: ["segment", "manual"],
      default: "segment",
    },
    manualNumbers: {
      type: String,
      default: "",
    },

    totalBatches: {
      type: Number,
      default: 0,
    },
    processedBatches: {
      type: Number,
      default: 0,
    },
    lastProcessedBatch: {
      type: Number,
      default: 0,
    },
    // message tracking start
    totalMessages: {
      type: Number,
      default: 0,
    },
    sentMessages: {
      type: Number,
      default: 0,
    },
    deliveredMessages: {
      type: Number,
      default: 0,
    },
    readMessages: {
      type: Number,
      default: 0,
    },
    failedMessages: {
      type: Number,
      default: 0,
    },
    openedMessages: {
      type: Number,
      default: 0,
    },
    clickedMessages: {
      type: Number,
      default: 0,
    },
    unsubscribedMessages: {
      type: Number,
      default: 0,
    },
    bouncedMessages: {
      type: Number,
      default: 0,
    },
    complainedMessages: {
      type: Number,
      default: 0,
    },
    jobId: {
      type: String,
    },
    // message tracking end
    errorCode: {
      type: String,
    },
    errorMessage: {
      type: String,
    },

    variableMappings: { type: Object, default: {} },
    headerVariableMappings: { type: Object, default: {} },
    buttonVariableMappings: { type: Object, default: {} },

    // for whatsapp template messages
    bodyParameters: {
      type: [
        {
          type: { type: String },
          text: { type: String },
          _id: false, // prevent creation of _id for subdocument
        },
      ],
      default: [],
    },
    headerParameters: {
      type: [
        {
          type: { type: String },
          text: { type: String },
          _id: false, // prevent creation of _id for subdocument
        },
      ],
      default: [],
    },
    awsEmailParameters: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true },
);

// Prevent model recompilation error in development
delete mongoose.models.Campaign;

export default mongoose.models.Campaign ||
  mongoose.model("Campaign", CampaignSchema);
