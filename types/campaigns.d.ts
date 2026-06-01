// Base enum types
export type CampaignType = "whatsapp" | "sms" | "email";
export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "processing"
  | "paused"
  | "completed"
  | "failed";
export type ScheduleType = "now" | "later";
export type EditorType =
  | "html-editor"
  | "block-editor"
  | "rich-text-editor"
  | "text-editor";
export type MediaType = "image" | "video" | "audio" | "document" | "file" | "";

// Parameter types for WhatsApp templates
export type BodyParameter = {
  type: string;
  text: string;
};

export type HeaderParameter = {
  type: string;
  text: string;
};

// Attachment type
export type Attachment = {
  fileName: string;
  fileSize: string;
  mimeType: string;
  mediaUrl: string;
  mediaType: MediaType;
};

// Main Campaign type
export type Campaign = {
  _id: string; // MongoDB ObjectId as string
  id: string; // Alias for _id (if needed)
  clinicId: string;
  userId?: string; // Optional as per schema
  name: string;
  description?: string; // Optional field
  type: CampaignType;
  status: CampaignStatus;
  scheduleType: ScheduleType;
  scheduleTime: {
    date: string;
    time: string;
  };
  template?: string; // Template ID (ObjectId as string)
  subject?: string;
  preheader?: string;
  editorType: EditorType;
  content?: string;
  awsEmailTemplateName?: string;
  designJson?: object | null; // For block editor JSON data
  mediaUrl?: string;
  mediaType?: MediaType;
  source: string; // Defaults to "Zeva"
  attachments: Attachment[];
  sender?: string; // Provider ID (ObjectId as string)
  recipients: string[]; // Array of Lead IDs
  segmentId?: string; // Segment ID (ObjectId as string)

  // Batch processing fields
  totalBatches: number;
  processedBatches: number;
  lastProcessedBatches: number;

  // Message tracking fields
  totalMessages: number;
  sentMessages: number;
  deliveredMessages: number;
  readMessages: number;
  failedMessages: number;
  openedMessages: number;
  clickedMessages: number;
  unsubscribedMessages: number;
  bouncedMessages: number;
  complainedMessages: number;

  // Error fields
  errorCode?: string;
  errorMessage?: string;

  // WhatsApp template parameters
  bodyParameters: BodyParameter[];
  headerParameters: HeaderParameter[];

  variableMappings?: any;
  headerVariableMappings?: any;
  buttonVariableMappings?: any;

  // AWS Email parameters
  awsEmailParameters: string[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
};

// For creating a new campaign (omitting auto-generated fields)
export type CreateCampaignInput = Omit<
  Campaign,
  | "_id"
  | "id"
  | "createdAt"
  | "updatedAt"
  | "sentMessages"
  | "deliveredMessages"
  | "readMessages"
  | "failedMessages"
  | "openedMessages"
  | "clickedMessages"
  | "unsubscribedMessages"
  | "bouncedMessages"
  | "complainedMessages"
  | "totalBatches"
  | "processedBatches"
  | "lastProcessedBatches"
> & {
  totalMessages?: number; // Optional on create
};

// For updating a campaign (all fields optional)
export type UpdateCampaignInput = Partial<
  Omit<Campaign, "_id" | "id" | "createdAt" | "updatedAt">
>;

// API Response types
export type CampaignResponse = {
  success: boolean;
  data?: Campaign;
  error?: string;
};

export type CampaignsResponse = {
  success: boolean;
  data?: Campaign[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
};
