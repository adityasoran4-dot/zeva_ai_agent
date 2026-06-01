import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    }, // ✅ Clinic that owns this Message

    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },
    // TODO: Sender
    senderId: {
      // For Outgoing: It will be clinic
      // For Incoming: It will be recipient like this clinic send message to lead
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    recipientId: {
      // For Outgoing: It will be recipient
      // For Incoming: It will be sender like this lead send message to clinic
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ["sms", "whatsapp", "email"],
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ["incoming", "outgoing"],
      required: true,
      index: true,
    },
    messageType: {
      type: String,
      enum: ["conversational", "bulk", "automation"],
      default: "conversational",
    },
    subject: { type: String }, // For email
    preheader: { type: String }, // For email
    content: { type: String },
    mediaUrl: { type: String }, // For sms/whatsapp
    mediaType: {
      type: String,
      enum: ["image", "video", "audio", "document", "file", ""],
      default: "",
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
    status: {
      type: String,
      enum: [
        "sent",
        "delivered",
        "read",
        "sending",
        "queued",
        "failed",
        "received",
        "scheduled",
        "opened",
        "clicked",
        "unsubscribed",
        "bounced",
        "complained",
      ],
      default: "open",
    },
    source: {
      type: String,
    },
    providerMessageId: {
      // for sms/whatsapp/email provider message id
      // eg: Twilio Message SID
      // eg: Whatsapp Cloud API Message ID
      // eg: Email Message ID from Brevo, SendGrid, etc.
      type: String,
    },
    emailMsgId: {
      // for aws email in future
      type: String,
    },
    errorCode: {
      type: String,
      default: "",
    },
    errorMessage: {
      type: String,
      default: "",
    },
    emoji: {
      // for whatsapp reaction messages
      type: String,
      default: "",
    },
    emojis: [
      {
        emoji: {
          type: String,
          required: true,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        lead: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lead",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        // Add validation to ensure either user OR lead is set
        _id: false,
      },
    ],
    // New field for quoted messages
    replyToMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}, // Default an empty object
    },

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

    // for whatsapp header and footer
    headerText: { type: String },
    footerText: { type: String },

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

    // for email gmail for tracking reply
    threadId: { type: String, default: "" },
    emailReceivedAt: { type: Date, default: null },

    // for schedule a message at a date and time
    schedule: {
      date: String,
      time: String,
      timezone: String,
    },
  },
  { timestamps: true },
);

// Prevent model recompilation error in development
delete mongoose.models.Message;

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);
