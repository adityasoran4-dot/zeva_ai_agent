export type TemplateType = "sms" | "whatsapp" | "email";

export type EditorType =
  | "html-editor"
  | "rich-text-editor"
  | "block-editor"
  | "text-editor";

export type TemplateButtonType =
  | "URL"
  | "PHONE_NUMBER"
  | "QUICK_REPLY"
  | "CALL_TO_ACTION";

export type TemplateButtonOption = {
  label: string;
  value: TemplateButtonType;
  renderUi: any;
};

export type Template = {
  _id: string;
  userId: User;
  templateType: TemplateType;
  emailTemplateType: EmailTemplateType;
  provider: Provider;
  name: string;
  preheader: string;
  subject: string;
  uniqueName: string;
  category: "marketing" | "utility" | "authentication";
  language: string;
  content: string;
  designJson: object;
  editorType: EditorType;
  editorType: EditorType;
  status: "pending" | "approved" | "rejected" | "inactive" | "active";
  variables: string[];
  headerVariables: string[];
  headerType: "" | "text" | "image" | "video" | "document";
  headerText: string;
  headerFileUrl: string;
  isHeader: boolean;
  headerVariableSampleValues: string[];
  bodyVariableSampleValues: string[];
  isFooter: boolean;
  isButton: boolean;
  footer: string;
  templateButtons: any[];
  metadata: any;
  templateId: string;
  createdAt: string;
  updatedAt: string;
};
