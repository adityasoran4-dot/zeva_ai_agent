// lib/queue.ts
import { Queue } from "bullmq";
import redis from "./redis.js";

// ----------------------------------- IMPORT LEADS FROM FILE QUEUE -----------------------------------//

export const importLeadsFromFileQueue = new Queue("importLeadsFromFileQueue", {
  connection: redis,
});
export const whatsappTemplateQueue = new Queue("whatsappTemplateQueue", {
  connection: redis,
});
export const scheduleMessageQueue = new Queue("scheduleMessageQueue", {
  connection: redis,
});

//----------------------------------- WORKFLOW QUEUE -----------------------------------//
export const workflowQueue = new Queue("workflowQueue", {
  connection: redis,
});

// ----------------------------------- ACTION QUEUE -----------------------------------//
export const delayActionQueue = new Queue("delayActionQueue", {
  connection: redis,
});
export const sendWhatsappActionQueue = new Queue("sendWhatsappActionQueue", {
  connection: redis,
});
export const sendEmailActionQueue = new Queue("sendEmailActionQueue", {
  connection: redis,
});
export const sendSmsActionQueue = new Queue("sendSmsActionQueue", {
  connection: redis,
});
export const restApiActionQueue = new Queue("restApiActionQueue", {
  connection: redis,
});
export const addToSegmentActionQueue = new Queue("addToSegmentActionQueue", {
  connection: redis,
});
export const assignOwnerActionQueue = new Queue("assignOwnerActionQueue", {
  connection: redis,
});
export const addTagActionQueue = new Queue("addTagActionQueue", {
  connection: redis,
});
export const aiComposerActionQueue = new Queue("aiComposerActionQueue", {
  connection: redis,
});
export const bookAppointmentActionQueue = new Queue(
  "bookAppointmentActionQueue",
  {
    connection: redis,
  },
);

// ----------------------------------- SCHEDULED CAMPAIGNS QUEUE -----------------------------------//

export const scheduleWhatsappCampaignQueue = new Queue(
  "scheduleWhatsappCampaignQueue",
  {
    connection: redis,
  },
);
export const sendBatchWhatsappMessageQueue = new Queue(
  "sendBatchWhatsappMessageQueue",
  {
    connection: redis,
  },
);
