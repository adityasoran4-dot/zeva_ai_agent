export type WorkflowEntity =
  | "Lead"
  | "Patient"
  | "Appointment"
  | "Webhook"
  | "Message";

export type WorkflowConditionType = "if_else" | "filter";
export type WorkflowConditionSubType =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "is_empty"
  | "is_not_empty"
  | "is_true"
  | "is_false"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal";
export type WorkflowActionType =
  | "send_email"
  | "send_sms"
  | "send_whatsapp"
  | "update_lead_status"
  | "add_tag"
  | "assign_owner"
  | "rest_api"
  | "add_to_segment"
  | "ai_composer"
  | "delay"
  | "router"
  | "book_appointment";

export type WorkflowTriggerType =
  | "new_lead"
  | "update_lead"
  | "record_created"
  | "record_updated"
  | "record_create_or_update"
  | "webhook_received"
  | "incoming_message";

export type WorkflowStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "failed"
  | "waiting"
  | "skipped"
  | "canceled"
  | "retrying";

export type Workflow = {
  _id: string;
  clinicId: string;
  name: string;
  description?: string;
  entity: WorkflowEntity;
  status: "Active" | "Inactive";
  trigger?: string;
  runs?: number;
  successRate?: number;
  lastRun?: Date;
  ownerId: string;
  nodes?: any[];
  edges?: any[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  createdAt: string;
  updatedAt: string;
};

interface WorkflowTrigger {
  _id: string;
  clinicId: string;
  workflowId: string;
  name: string;
  description?: string;
  type: WorkflowTriggerType;
  webhookUrl?: string;
  webhookListening?: boolean;
  webhookResponse?: object;
  channel?: string;
  providerId?: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkflowTriggerType = WorkflowTrigger;

interface WorkflowAction {
  _id: string;
  name: string;
  type: WorkflowActionType;
  parameters: any;
  apiResponse?: object;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowHistory {
  _id: string;
  workflowId: {
    _id: string;
    name: string;
  };
  triggerId: {
    _id: string;
    name: string;
    type: WorkflowTriggerType;
  } | null;
  actionId: WorkflowAction | null;
  conditionId: {
    _id: string;
    name: string;
    type: WorkflowConditionType;
  } | null;
  type: "trigger" | "action" | "condition";
  conditionResult: boolean | null;
  status: WorkflowStatus;
  executedAt: string | null;
  error: string | null;
  details: Record<string, any>;
  response?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
