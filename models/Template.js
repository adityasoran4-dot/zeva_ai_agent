import mongoose from "mongoose";

const templateButtonSchema = new mongoose.Schema({
  type: {
    type: String,
    // enum:["QUICK_REPLY", "CALL_TO_ACTION", "URL", "PHONE_NUMBER"]
  },
  text: String,
  url: String,
  phone_number: String,
});

const TemplateSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    }, // ✅ Clinic that owns this Template

    templateType: {
      type: String,
      enum: ["sms", "whatsapp", "email"],
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
    },
    name: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
    },
    preheader: {
      type: String,
    },
    uniqueName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
    },
    language: {
      type: String,
    },
    content: {
      type: String,
    },
    designJson: {
      type: Object, // for email template block editor
      default: null,
    },
    editorType: {
      type: String,
      enum: ["html-editor", "block-editor", "rich-text-editor", "text-editor"],
      default: "text-editor",
    },
    status: {
      type: String,
      //   enum:["pending", "approved", "rejected", "active", "active", "inactive", "paused"]
    },
    variables: {
      type: [String],
      default: [],
    },
    headerVariables: {
      type: [String],
      default: [],
    },
    bodyVariableSampleValues: {
      type: [String],
      default: [],
    },
    headerVariableSampleValues: {
      type: [String],
      default: [],
    },
    isHeader: {
      type: Boolean,
      default: false,
    },
    isFooter: {
      type: Boolean,
      default: false,
    },
    isButton: {
      type: Boolean,
      default: false,
    },
    headerType: {
      type: String,
      enum: ["text", "image", "video", "document", ""],
      default: "",
    },
    headerText: {
      type: String,
    },
    headerFileUrl: {
      type: String,
    },
    footer: {
      type: String,
    },
    templateButtons: [templateButtonSchema],
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed, // here other values
      default: {},
    },
    templateId: {
      type: String, //for whatsapp meta template
    },
  },
  { timestamps: true }
);

// Prevent model recompilation error in development
delete mongoose.models.Template;

export default mongoose.models.Template ||
  mongoose.model("Template", TemplateSchema);
