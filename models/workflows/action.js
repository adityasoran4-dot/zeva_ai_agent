import mongoose from "mongoose";

const parameterSchema = new mongoose.Schema({
  providerId: { type: String },
  recipient: { type: String }, // {{contact.owner}}, custom value
  templateId: { type: String },
  channel: {
    type: String,
    enum: ["sms", "whatsapp", "email", "voice"],
  },
  subject: { type: String },
  preheader: { type: String },
  content: { type: String },
  mediaType: { type: String },
  mediaUrl: { type: String },
  whatsappMsgType: {
    type: String,
    enum: [
      "template-message",
      "non-template-message",
      "reply-button-message",
      "list-message",
    ],
  },
  replyButtons: [
    // for whatsapp interactive message
    {
      type: {
        type: String,
        enum: ["reply"],
        required: true,
        default: "reply",
      },
      reply: {
        id: { type: String, required: true },
        title: { type: String, required: true },
      },
      _id: false,
    },
  ],
  listSections: [
    // for whatsapp interactive message
    {
      title: { type: String, required: true },
      rows: [
        {
          id: { type: String, required: true },
          title: { type: String, required: true },
          description: { type: String },
          _id: false, // Prevents auto-adding of _id for rows
        },
      ],
      _id: false, // Prevents auto-adding of _id for sections
    },
  ],
  delayTime: { type: Number, default: 0 },
  delayFormat: {
    type: String,
    enum: ["seconds", "minutes", "hours", "days"],
  },
  headerText: {
    type: String,
  },
  footerText: {
    type: String,
  },
  // for send whatsapp action
  bodyParameters: {
    type: [
      {
        type: { type: String },
        text: { type: String },
        _id: false, // ✅ Prevents auto-adding of _id
      },
    ],
    default: [],
  },
  headerParameters: {
    type: [
      {
        type: { type: String },
        text: { type: String },
        _id: false, // ✅ Prevents auto-adding of _id
      },
    ],
    default: [],
  },

  // for email attachments
  attachments: [
    {
      fileName: { type: String },
      fileSize: { type: String },
      mimeType: { type: String },
      mediaUrl: { type: String }, // URL of the uploaded file (e.g., S3)
      mediaType: {
        type: String,
        enum: ["file", "image", "video", "audio"],
        default: "file",
      },
    },
  ],

  // rest_api action parameters
  apiMethod: {
    type: String,
    enum: ["GET", "POST"],
  },
  apiEndPointUrl: {
    type: String,
  },
  apiPayloadType: {
    type: String,
    enum: ["JSON", "FORM_DATA"],
  },
  apiAuthType: {
    type: String,
    enum: ["NO_AUTH", "BEARER_TOKEN"],
  },
  isApiHeaders: {
    type: Boolean,
    default: false,
  },
  isApiParameters: {
    type: Boolean,
    default: false,
  },
  apiHeaders: [
    {
      key: String,
      value: String,
      _id: false, // ✅ Prevents auto-adding of _id
    },
  ],
  apiParameters: [
    {
      key: String,
      value: String,
      _id: false, // ✅ Prevents auto-adding of _id
    },
  ],

  // add contact parameters
  contactFirstName: {
    type: String,
  },
  contactLastName: {
    type: String,
  },
  contactEmail: {
    type: String,
  },
  contactPhone: {
    type: String,
  },
  contactGroupId: {
    type: String,
  },
  contactAdditionalFields: {
    // key should be internalName of field for enable personalization
    type: Map,
    of: mongoose.Schema.Types.Mixed, // Flexible values
    default: {}, // Default to an empty object
  },

  // ai_composer action parameters
  aiComposerQuestion: {
    type: String,
  },

  // assign_owner action parameters
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // add_to_group action parameters
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
  },

  // make_call action parameters
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent",
  },
  callType: {
    type: String,
    enum: ["agent-call", "text-to-speech-call", "record-audio-call"],
    default: "text-to-speech-call",
  },
  voice: {
    type: String,
  },

  // add_task action parameters
  taskType: {
    type: String,
    enum: ["To do", "Email", "Call", "Meeting", "Lunch", "Deadline"],
    default: "To do",
  },
  taskName: {
    type: String,
  },
  taskDueDate: {
    type: String,
  },
  taskDueTime: {
    type: String,
  },
  taskReminder: {
    type: Boolean,
    default: false,
  },
  taskReminderTime: {
    time: {
      type: Number,
      default: 0,
    },
    formate: {
      type: String,
      enum: ["minutes", "hours", "days", "weeks"],
      default: "minutes",
    },
  },
  taskPriority: {
    type: Boolean,
    default: false,
  },
  taskNote: {
    type: String,
  },

  // add_ticket parameters
  ticketName: {
    type: String,
  },
  ticketDescription: {
    type: String,
  },
  ticketPriority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "low",
  },
  ticketSource: {
    type: String,
    enum: ["chat", "email", "sms", "whatsapp", "form", "phone", ""],
    default: "",
  },
  ticketPipeline: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TicketPipeline",
  },
  ticketStatus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TicketStatus",
  },
  ticketCreateDate: {
    type: String,
  },
  ticketCloseDate: {
    type: String,
  },
  ticketOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  ticketCreateOnReply: {
    type: Boolean,
    default: false,
  },

  // slack
  slackChannel: {
    // slack channel id
    type: String,
  },
  slackUser: {
    // slack userId id
    type: String,
  },
  slackMessage: {
    type: String,
  },

  // field update action
  fieldUpdateProperty: {
    type: String,
  },
  fieldUpdateValue: {
    type: String,
  },
  fieldUpdateModule: {
    type: String,
    enum: ["Contacts", "Webhook", "Message", "Agent", ""],
    default: "",
  },
});

const conditionSchema = new mongoose.Schema({
  conditionType: {
    type: String,
    enum: ["and", "or"],
    default: "and",
    required: true,
  },
  field: {
    type: String,
    required: true,
  },
  operator: {
    type: String,
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
    required: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
});

const routeActionSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workflow",
  },
  name: {
    type: String,
  },
  routerActionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Action",
  },
  actions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Action",
    },
  ],
});

export const RouteAction = mongoose.model("RouteAction", routeActionSchema);

const actionSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "send_email",
        "send_sms",
        "send_whatsapp",
        "send_slack",
        "field_update",
        "add_tags",
        "assign_owner",
        "rest_api",
        "add_contact",
        "add_ticket",
        "add_task",
        "add_to_group",
        "field_update",
        "ai_composer",
        "make_call",
        "delay",
        "filter",
        "router",
      ],
      required: true,
    },
    parameters: parameterSchema,
    conditions: {
      andConditions: [conditionSchema],
      orConditions: [conditionSchema],
    },
    routes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RouteAction",
      },
    ],
    apiResponse: {
      // for res_api action
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);

const Action = mongoose.model("Action", actionSchema);
export default Action;
