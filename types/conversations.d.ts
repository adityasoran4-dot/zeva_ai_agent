import { Lead } from "./leads";
import { User } from "./users";

export type ConversationType = {
  _id: string;
  clinicId: string;
  ownerId: string;
  leadId: Lead;
  status: "open" | "closed" | "trashed" | "blocked" | "archived";
  recentMessage: Message;
  unreadMessages: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type MessageData = {
  date: string;
  messages: MessageType[];
};

export type ConversationStatus =
  | "open"
  | "closed"
  | "trash"
  | "blocked"
  | "archived";

export type MessageType = {
  _id: string;
  clinicId: string;
  conversationId: string;
  contactId?: string;
  senderId: User;
  recipientId: Contact;
  provider: Provider;
  channel?: "sms" | "whatsapp" | "email" | "chat" | "voice";
  messageType: "conversational" | "bulk" | "automation";
  direction?: "outgoing" | "incoming";
  subject?: string;
  preheader?: string;
  cc?: string[];
  bcc?: string[];
  content?: string;
  mediaUrl?: string;
  mediaType?: "image" | "" | "video" | "document" | "audio";
  status?:
    | "sent"
    | "delivered"
    | "scheduled"
    | "read"
    | "queued"
    | "sending"
    | "failed";
  source?: string;
  errorMessage?: string;
  errorCode?: string;
  providerMessageId?: string;
  replyToMessageId?: Message;
  emoji?: string;
  emojis: [
    {
      emoji: string;
      user: any;
      lead: any;
      addedAt: string;
    },
  ];
  emailReceivedAt?: string;
  replyToMessageId: string;
  threadId?: string; // for email reply thread
  metadata?: Record<string, any>; // For key-value pairs
  attachments: MediaAttachment[];
  // for call msg
  callSid: string;
  // agent
  agentId: Agent;
  transcriptId: string;
  callDuration: number;

  whatsappCall: boolean;

  // whatsapp interactive message
  headerText?: string;
  footerText?: string;
  replyButtons?: {
    type: "reply";
    reply: {
      id: string;
      title: string;
    };
  }[];
  listSections?: {
    title: string;
    rows: {
      id: string;
      title: string;
      description?: string;
    }[];
  }[];

  // schedule
  schedule: {
    date: string;
    time: string;
    timezone: strng;
  };
  createdAt: string;
  updatedAt: string;
};

export type Provider = {
  _id: string;
  clinicId: string;
  name: string;
  label: string;
  phone: string;
  email: string;
  type: ("email" | "sms" | "whatsapp" | "voice")[];
  status: "pending" | "approved" | "rejected" | "in-progress";
  numberType: string;
  country: string;
  countryCode: string;
  emailProviderType: "gmail" | "outlook" | "other";
  emailType: "marketing" | "personal";
  lastSyncedAt: string;
  isActive: boolean;
  inboxAutomation: boolean;
  secrets: Record<string, any>; // Secrets are represented as a plain object
  createdAt: string;
  updatedAt: string;
};

export type Tag = {
  _id: string;
  teamId: string;
  userId: string;
  contactId: string;
  tag: string;
  createdAt: string;
  updatedAt: string;
};

export type MediaAttachment = {
  fileName: string;
  fileSize: string;
  mimeType: string;
  mediaUrl: string;
  mediaType: "file" | "image" | "video" | "audio";
};
