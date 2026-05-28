import mongoose from "mongoose";
import encrypt from "mongoose-encryption";

const ProviderSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    }, // ✅ Clinic that owns this Provider
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: { type: String, required: true }, // eg: "whatsappCloud", "twilio"
    label: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "in-progress"],
      default: "pending",
    },
    type: {
      type: [String],
      enum: ["email", "sms", "whatsapp"],
      required: true,
    },
    // for email provider
    emailProviderType: {
      type: String,
      enum: ["gmail", "other"],
    },
    emailType: {
      type: String,
      enum: ["personal", "marketing"],
    },
    lastSyncedAt: {
      // for inbox sync
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    gmailWatchJobId: {
      type: String,
    },
    gmailWatchJobKey: {
      type: String,
    },
    gmailWatchExpiration: {
      type: String,
    },
    inboxAutomation: {
      // for making new contact in incoming email
      type: Boolean,
      default: false,
    },
    secrets: {
      type: mongoose.Schema.Types.Mixed,
      default: {}, // Default an empty object
    },
  },
  { timestamps: true },
);

// Encryption keys
const encryptionKey = process.env.ENCRYPTION_KEY;
const signingKey = process.env.SIGNING_KEY;

// Add encryption plugin
ProviderSchema.plugin(encrypt, {
  encryptionKey: encryptionKey,
  signingKey: signingKey,
  encryptedFields: ["secrets"], // Encrypt only the 'secrets' field
  additionalAuthenticatedFields: ["name", "label"], // Ensure these fields are authenticated
});

// Prevent model recompilation error in development
delete mongoose.models.Provider;

export default mongoose.models.Provider ||
  mongoose.model("Provider", ProviderSchema);

/*
  secrets:{
    // for whatsapp  
     whatsappAccessToken: String, // whatsapp cloud api access token
     wabaId: String, // whatsapp id for whatsapp template creation and update

    //  for email
    smtpUsername:"user@exampple.com",
    smtpPassword:"password",
    smtpHost:"smtp.example.com",
    smtpPort:587,
    smtpSecure:true/false
    imapUsername:"user@example.com",
    imapPassword:"password",
    imapHost:"imap.example.com",
    imapPort:993,
    imapSecure:true/false
  }

  */
