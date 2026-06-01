import { Worker } from "bullmq";
import "dotenv/config";
import mongoose from "mongoose";

// --------- Error Handlers ---------- //
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});
// --------- Error Handlers ---------- //

import Lead from "../models/Lead.js";
import Segment from "../models/Segment.js";
import redis from "./redis.js";
import {
  saveCheckpoint,
  getCheckpoint,
  clearCheckpoint,
} from "./checkpoint.js";
import dbConnect from "../lib/database.js";
import axios from "axios";
import Template from "../models/Template.js";
import {
  handleSendWhatsappInteractiveListMsg,
  handleSendWhatsappInteractiveReplyBtnMsg,
  handleWhatsappSendMessage,
} from "../services/whatsapp.js";
import Message from "../models/Message.js";
import Workflow from "../models/workflows/Workflow.js";
import {
  getAppointmentDetails,
  getLeadDetails,
  getMessageDetails,
  getPatientByLeadId,
  getPatientDetails,
  getSystemDetails,
  processWorkflow,
  replaceVariableInObject,
  replaceVariableInString,
} from "./workflow.js";
import WorkflowAction from "../models/workflows/WorkflowAction.js";
import WorkflowHistory from "../models/workflows/WorkflowHistory.js";
import Conversation from "../models/Conversation.js";
import FormData from "form-data";
import Provider from "../models/Provider.js";
import PatientRegistration from "../models/PatientRegistration.js";
import Appointment from "../models/Appointment.js";
import { generateAiResponse } from "./ai.js";
import Users from "../models/Users.js";
import "./queue.js";
import Campaign from "../models/Campaign.js";
import { sendBatchWhatsappMessageQueue } from "./queue.js";
import { sendEmailViaGmailMultiple } from "../services/gmail.js";
import { sendEmailViaSmtpMultiple } from "../services/smtp.js";

// --- Helper to add listeners to all workers ---
const addWorkerListeners = (worker, queueName) => {
  // ✅ Add this listener to see if worker receives jobs at all
  worker.on("waiting", (jobId) => {
    console.log(`⏳ Worker for ${queueName} sees waiting job: ${jobId}`);
  });
  worker.on("active", (job) => {
    console.log(`🏃 Worker for ${queueName} is processing job ${job.id}`);
  });
  worker.on("completed", (job, returnValue) => {
    console.log(`✅ Worker for ${queueName} finished job ${job.id}`);
  });
  worker.on("failed", (job, err) => {
    console.error(
      `❌ Worker for ${queueName} failed job ${job?.id}:`,
      err.message,
    );
  });
  worker.on("error", (err) => {
    console.error(`❌ Worker for ${queueName} connection error:`, err);
  });
  worker.on("ready", () => {
    console.log(`📡 Worker for ${queueName} is ready and listening`);
  });
};
// ----------------------------------------------

console.log("📌 Import Leads Worker Started...");
dbConnect()
  .then(() => {
    console.log("✅ Database connected for All Workers");
  })
  .catch((err) => {
    console.error("❌ Database connection error for Import Leads Worker:", err);
  });

const importLeadsFromFileWorker = new Worker(
  "importLeadsFromFileQueue",
  async (job) => {
    console.log(`Processing job ${job.id} in importLeadsFromFileQueue`);
    console.time(`Job-${job.id}`);
    console.log(`🚀 Processing Job ID: ${job.id}`);

    const WORKER_NAME = "importLeadsFromFile";
    const { leadsToInsert, segmentId } = job.data;
    const BATCH_SIZE = 500;

    try {
      // Validate segmentId if provided
      let segment = null;
      if (segmentId) {
        if (!mongoose.Types.ObjectId.isValid(segmentId)) {
          throw new Error("Invalid segment ID format");
        }
        segment = await Segment.findById(segmentId).select("_id name").lean();
        if (!segment) {
          throw new Error(`Segment ${segmentId} not found`);
        }
        console.log(`🎯 Importing to segment: ${segment.name}`);
      } else {
        console.log(`📥 Importing leads without segment association`);
      }

      let startIndex = await getCheckpoint(WORKER_NAME, job.id);
      if (startIndex >= leadsToInsert.length) {
        startIndex = 0;
      }
      console.log(`⏩ Resuming from index: ${startIndex}`);

      let totalInserted = 0;
      let insertedLeadIds = [];
      const segmentObjectId = segment?._id;

      for (let i = startIndex; i < leadsToInsert.length; i += BATCH_SIZE) {
        const batch = leadsToInsert.slice(i, i + BATCH_SIZE);
        console.log(
          `📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} leads`,
        );

        try {
          // Bulk insert leads
          const insertedDocs = await Lead.insertMany(batch, {
            ordered: false,
          });

          totalInserted += insertedDocs.length;

          // Collect lead IDs if segment exists
          if (segmentObjectId) {
            insertedLeadIds.push(...insertedDocs.map((doc) => doc._id));

            // Update segment periodically
            if (insertedLeadIds.length >= 1000) {
              await addLeadsToSegment(segmentObjectId, insertedLeadIds);
              insertedLeadIds = [];
            }
          }
        } catch (batchError) {
          console.warn(
            `⚠ Batch insert error, falling back to single inserts...`,
          );

          // Process leads individually
          for (const lead of batch) {
            try {
              const insertedLead = await Lead.create(lead);
              totalInserted++;

              if (segmentObjectId) {
                insertedLeadIds.push(insertedLead._id);
              }
            } catch (err) {
              console.error(
                `❌ Failed: ${lead.phone || lead.email || "unknown"} - ${
                  err.message
                }`,
              );
            }
          }
        }

        // Save checkpoint every 5 batches
        const nextIndex = i + BATCH_SIZE;
        if (
          nextIndex % (BATCH_SIZE * 5) === 0 ||
          nextIndex >= leadsToInsert.length
        ) {
          await saveCheckpoint(WORKER_NAME, job.id, nextIndex);
        }

        // Yield to event loop every 3 batches
        if (i % (BATCH_SIZE * 3) === 0) {
          await new Promise((resolve) => setImmediate(resolve));
        }
      }

      // Final segment update if needed
      if (segmentObjectId && insertedLeadIds.length > 0) {
        await addLeadsToSegment(segmentObjectId, insertedLeadIds);
      }

      // Clear checkpoint
      await clearCheckpoint(WORKER_NAME, job.id);

      console.timeEnd(`Job-${job.id}`);
      console.log(
        `🎉 Job ${job.id} completed. Inserted: ${totalInserted}/${leadsToInsert.length}`,
      );

      return {
        totalProcessed: leadsToInsert.length,
        totalInserted,
        segmentId: segment?._id || null,
        segmentName: segment?.name || null,
      };
    } catch (error) {
      console.log("Error in import leads from file worker: ", error?.message);
    }
  },
  {
    connection: redis,
    concurrency: 1,
    limiter: {
      max: 1,
      duration: 500,
    },
  },
);
addWorkerListeners(importLeadsFromFileWorker, "importLeadsFromFileQueue");

// Helper to add leads to segment
async function addLeadsToSegment(segmentId, leadIds) {
  if (!leadIds.length) return;

  try {
    await Segment.findByIdAndUpdate(segmentId, {
      $addToSet: {
        leads: { $each: leadIds },
      },
    });
    console.log(`✅ Added ${leadIds.length} leads to segment`);
  } catch (error) {
    console.error(`❌ Failed to update segment:`, error.message);
  }
}

// Worker events
importLeadsFromFileWorker.on("completed", (job, returnValue) => {
  console.log(`✅ Job ${job.id} completed successfully`);
  console.log(`📊 ${returnValue?.totalInserted || 0} leads imported`);

  if (returnValue?.segmentId) {
    console.log(`🏷 Added to segment: ${returnValue?.segmentName}`);
  }
});

importLeadsFromFileWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

const whatsappTemplateWorker = new Worker(
  "whatsappTemplateQueue",
  async (job) => {
    console.log("Processing WhatsApp sync templates job: ", job.data);

    const { accessToken, wabaId, providerId, clinicId } = job.data;
    let url = `https://graph.facebook.com/v19.0/${wabaId}/message_templates?limit=25`;

    try {
      // ensure DB connection before performing any Template queries

      while (url) {
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.data?.data?.length) {
          const templates = response.data.data;

          const templatesData = [];

          for (const item of templates) {
            const templateId = item.id;
            const components = item.components || [];

            let content = "";
            let variables = [];
            let isHeader = false;
            let isFooter = false;
            let isButton = false;
            let headerType = "text";
            let headerText = "";
            let headerVariables = [];
            let headerVariableSampleValues = [];
            let bodyVariableSampleValues = [];
            let headerFileUrl = "";
            let footer = "";
            let templateButtons = [];

            for (const temp of components) {
              if (temp.type === "HEADER") {
                isHeader = true;
                if (temp.format === "TEXT") {
                  headerText = temp.text;
                  headerType = "text";
                  const regex = /\{\{\d+\}\}/;
                  if (regex.test(headerText)) {
                    headerVariables = ["{{1}}"];
                    headerVariableSampleValues = ["{{1}}"];
                  }
                } else {
                  headerType = temp.format.toLowerCase();
                  headerFileUrl = temp.example?.header_handle?.[0] || "";
                }
              } else if (temp.type === "BODY") {
                content = temp.text;
                variables = (temp.example?.body_text || []).map(
                  (_, index) => `{{${index + 1}}}`,
                );
                bodyVariableSampleValues = variables;
              } else if (temp.type === "FOOTER") {
                isFooter = true;
                footer = temp.text;
              } else if (temp.type === "BUTTONS") {
                isButton = true;
                templateButtons = temp.buttons || [];
              }
            }

            templatesData.push({
              clinicId,
              templateId,
              templateType: "whatsapp",
              provider: providerId,
              name: item.name,
              uniqueName: item.name || "",
              category: item.category?.toLowerCase() || "",
              language: item.language,
              status: item.status?.toLowerCase(),
              content,
              variables,
              isHeader,
              headerType,
              headerText,
              headerVariables,
              headerVariableSampleValues,
              bodyVariableSampleValues,
              headerFileUrl,
              isFooter,
              footer,
              isButton,
              templateButtons,
            });
          }

          // **Filter out duplicates before inserting**
          const filteredTemplates = [];
          for (const template of templatesData) {
            const exists = await Template.exists({
              templateId: template.templateId,
            });
            if (!exists) {
              filteredTemplates.push(template);
            }
          }

          if (filteredTemplates.length > 0) {
            await Template.insertMany(filteredTemplates);
          }
          console.log("Syncing whatsapp templates batch...");
        }

        // Get next page if available
        url = response.data.paging?.next || null;
      }
      console.log("Syncing whatsapp template completed.");
    } catch (error) {
      console.error(
        "Error fetching templates:",
        error.response?.data || error.message,
      );
    }
  },
  { connection: redis, concurrency: 1 },
);

const scheduleMessageWorker = new Worker(
  "scheduleMessageQueue",
  async (job) => {
    console.log("Processing schedule message worker job: ");
    const { msgData } = job.data;

    try {
      let resData;
      if (msgData?.channel === "sms") {
        // resData = await handleSendS
      } else if (msgData?.channel === "whatsapp") {
        resData = await handleWhatsappSendMessage(msgData);

        if (resData && msgData?.clientMessageId) {
          const message = await Message.findById(msgData?.clientMessageId);
          console.log({ message });
          if (message) {
            message.status = "queued";
            message.providerMessageId = resData?.messages?.[0]?.id || "";
            await message.save();
          }
        }

        console.log("Schedule message response: ", resData);
      } else if (msgData?.channel === "email") {
        let emailSent = false;
        const message = await Message.findById(msgData?.messageId);
        if (msgData?.emailProviderType === "gmail") {
          const emailResponse = await sendEmailViaGmailMultiple(msgData);
          if (emailResponse.id && emailResponse.threadId) {
            // If the email is sent successfully, update the message status
            emailSent = true;
            message.providerMessageId = emailResponse.id;
            message.threadId = emailResponse.threadId;
            await message.save();
            console.log(`Email sent to ${toEmail}`);
          } else {
            console.error(`Failed to send email to ${toEmail}`);
          }

          console.log("Schedule message response: ", emailResponse);
        } else if (msgData?.emailProviderType === "other") {
          const emailResponse = await sendEmailViaSmtpMultiple(msgData);

          if (emailResponse?.messageId) {
            const providerMsgId = emailResponse?.messageId;
            emailSent = true;
            message.providerMessageId = providerMsgId;
            await message.save();
            console.log(`Email sent to ${toEmail}`);
          } else {
            console.error(`Failed to send email to ${toEmail}`);
          }

          console.log("Schedule email message response: ", emailResponse);
        }

        // Update the message status based on whether the email was successfully sent
        if (emailSent) {
          message.status = "sent";
        } else {
          message.status = "failed";
        }
        await message.save();
      }
    } catch (error) {
      console.log("Error in send schedule message worker: ", error?.message);
    }
  },
  {
    connection: redis,
    concurrency: 1,
  },
);

scheduleMessageWorker.on("completed", (job, returnValue) => {
  console.log(`✅ Schedule message job ${job.id} completed successfully`);
  console.log(`✅ Schedule message completed job response: ${returnValue}`);
});

scheduleMessageWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

// ------------------------------------------- WORKFLOW WORKERS -----------------------------------//
export const workflowWorker = new Worker(
  "workflowQueue",
  async (job) => {
    console.log("Processing workflow worker job: ", job.data);
    const { workflowId, ...rest } = job.data;

    try {
      const workflow = await Workflow.findById(workflowId);
      if (!workflow) {
        throw new Error("Workflow not found");
      }

      // Increase count of runs workflows
      await Workflow.findByIdAndUpdate(workflowId, {
        $inc: { runs: 1 },
        $set: { lastRun: new Date() },
      }).exec();

      // Process the workflow
      processWorkflow({
        nodes: workflow.nodes,
        edges: workflow.edges,
        ...rest,
      });

      console.log(`Workflow ${workflowId} processed successfully`);
      return { success: true, workflowId };
    } catch (error) {
      console.error(`❌ Workflow job ${workflowId} failed:`, error.message);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10,
  },
);
addWorkerListeners(workflowWorker, "workflowQueue");

workflowWorker.on("completed", (job, returnValue) => {
  console.log(`✅ Workflow job ${job.id} completed successfully`);
  console.log(`✅ Workflow completed job response: ${returnValue}`);
});

workflowWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

// ----------------------------------- ACTION WORKERS -----------------------------------//
export const delayActionWorker = new Worker(
  "delayActionQueue",
  async (job) => {
    console.log("Processing delay action worker job: ", job.data);
    const { id: actionId, delayInMs, historyId, ...rest } = job.data;

    try {
      const action = await WorkflowAction.findById(actionId);
      if (!action) {
        throw new Error("Action not found");
      }

      // Update Workflow History with completed
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "completed",
      });

      // Process the delay action
      processWorkflow({
        nodes: rest.nodes,
        edges: rest.edges,
        ...rest,
      });

      console.log(`Delay action ${actionId} processed successfully`);
      console.log({ rest: JSON.stringify(rest) });
      return { success: true, actionId };
    } catch (error) {
      console.error(`❌ Delay action job ${actionId} failed:`, error.message);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10,
  },
);
export const sendWhatsappActionWorker = new Worker(
  "sendWhatsappActionQueue",
  async (job) => {
    console.log("Processing send whatsapp action worker job: ", job.data);
    const { id: actionId, ...rest } = job.data;
    const { historyId, ...actionData } = rest;

    try {
      const action = await WorkflowAction.findById(actionId);
      const workflow = await Workflow.findById(action?.workflowId);
      if (!workflow) {
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Workflow not found",
        });
        return;
      }
      if (!action) {
        // Update Workflow History with failed
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Action not found",
        });
        return;
      }

      // Extract webhook payload
      const webhookPayload = actionData.payload || {};
      const restApiPayload = actionData.api_response || {};
      const aiComposerPayload = actionData.ai_composer_response || {};

      let {
        providerId,
        templateId,
        recipient,
        channel,
        content,
        mediaUrl,
        mediaType,
        templateName,
        whatsappMsgType = "template-message",
        variableMappings,
        headerVariableMappings,
        buttonVariableMappings,
        replyButtons = [],
        listSections = [],
        headerText = "",
        footerText = "",
      } = action.parameters || {};

      let provider = await Provider.findById(providerId);
      if (!provider) {
        // Update Workflow History with failed
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Provider not found",
        });
        return;
      }
      let template = null;
      if (templateId) {
        template = await Template.findById(templateId);
      }

      let leadId = actionData.leadId || "";
      let lead = null;

      if (recipient === "{{lead.phone}}") {
        lead = await Lead.findById(leadId);
      } else if (recipient === "{{lead.owner}}") {
        // TODO: get owner phone number from lead
        lead = await Lead.findById(leadId);
        if (!lead) {
          // Update Workflow History with failed
          await WorkflowHistory.findByIdAndUpdate(historyId, {
            status: "failed",
            error: "Lead not found",
          });
          return;
        }
        let assignedUsers = lead?.assignedTo || [];
        // last index of assignedUsers
        let lastAssignedUserData =
          assignedUsers?.length > 0
            ? assignedUsers[assignedUsers.length - 1]
            : {};
        let lastAssignedUser = await Users.findById(lastAssignedUserData?.user);
        if (!lastAssignedUser) {
          // Update Workflow History with failed
          await WorkflowHistory.findByIdAndUpdate(historyId, {
            status: "failed",
            error: "User not found",
          });
          return;
        }
        let findAssignedUserLead = await Lead.findOne({
          clinicId: workflow?.clinicId,
          phone: lastAssignedUser?.user?.phone,
        });
        if (!findAssignedUserLead) {
          // Update Workflow History with failed
          findAssignedUserLead = new Lead({
            clinicId: workflow?.clinicId,
            name: lastAssignedUser?.user?.name,
            phone: lastAssignedUser?.user?.phone,
            email: lastAssignedUser?.user?.email,
            source: "Other",
            customSource: "Zeva Automation",
          });
          await findAssignedUserLead.save();
        }
        lead = findAssignedUserLead;
      } else {
        // TODO: For custom recipient or custom phone number

        if (recipient === lead?.phone) {
          // it means user use performed contact details so
          // no need to lookup in db
          lead = await Lead.findById(lead._id);
        } else {
          // Custom phone number recipient
          // Replace variables
          recipient = replaceVariableInString(
            recipient,
            "webhook",
            webhookPayload,
          );
          recipient = replaceVariableInString(
            recipient,
            "rest_api",
            restApiPayload,
          );

          if (actionData.messageId) {
            const messagePayload = await getMessageDetails(
              actionData.messageId,
            );
            recipient = replaceVariableInString(
              recipient,
              "incoming_message",
              messagePayload,
            );
          }

          if (actionData.patientId) {
            const patientPayload = await getPatientDetails(
              actionData.patientId,
            );
            recipient = replaceVariableInString(
              recipient,
              "patient",
              patientPayload,
            );
          }

          if (actionData.appointmentId) {
            const appointmentPayload = await getAppointmentDetails(
              actionData.appointmentId,
            );
            console.log({
              appointmentPayload,
              recipient,
            });
            recipient = replaceVariableInString(
              recipient,
              "appointment",
              appointmentPayload,
            );
          }

          console.log({ recipient });

          lead = await Lead.findOne({
            clinicId: workflow?.clinicId,
            phone: recipient,
          });
        }

        console.log({ lead });

        if (!lead) {
          lead = new Lead({
            clinicId: workflow?.clinicId,
            name: recipient,
            phone: recipient,
            source: "Other",
            customSource: "Zeva Automation",
          });
          await lead.save();
        }
      }
      if (!lead) {
        // Update Workflow History with failed
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Lead not found",
        });
        return;
      }

      // Replace header, button and body variables with actual values
      headerVariableMappings = replaceVariableInObject(
        headerVariableMappings,
        "webhook",
        webhookPayload,
      );
      buttonVariableMappings = replaceVariableInObject(
        buttonVariableMappings,
        "webhook",
        webhookPayload,
      );
      variableMappings = replaceVariableInObject(
        variableMappings,
        "webhook",
        webhookPayload,
      );
      content = replaceVariableInString(content, "webhook", webhookPayload);

      // Replace header, button and body variables with actual rest api response
      headerVariableMappings = replaceVariableInObject(
        headerVariableMappings,
        "rest_api",
        restApiPayload,
      );
      buttonVariableMappings = replaceVariableInObject(
        buttonVariableMappings,
        "rest_api",
        restApiPayload,
      );
      variableMappings = replaceVariableInObject(
        variableMappings,
        "rest_api",
        restApiPayload,
      );
      content = replaceVariableInString(content, "rest_api", restApiPayload);

      // Replace header, button and body variables with actual ai composer response
      headerVariableMappings = replaceVariableInObject(
        headerVariableMappings,
        "ai_composer",
        aiComposerPayload,
      );
      buttonVariableMappings = replaceVariableInObject(
        buttonVariableMappings,
        "ai_composer",
        aiComposerPayload,
      );
      variableMappings = replaceVariableInObject(
        variableMappings,
        "ai_composer",
        aiComposerPayload,
      );
      content = replaceVariableInString(
        content,
        "ai_composer",
        aiComposerPayload,
      );

      // Replace header, button and body variables with actual lead data
      const leadPayload = await getLeadDetails(lead?._id);
      headerVariableMappings = replaceVariableInObject(
        headerVariableMappings,
        "lead",
        leadPayload,
      );
      buttonVariableMappings = replaceVariableInObject(
        buttonVariableMappings,
        "lead",
        leadPayload,
      );
      variableMappings = replaceVariableInObject(
        variableMappings,
        "lead",
        leadPayload,
      );
      content = replaceVariableInString(content, "lead", leadPayload);

      // Replace header, button and body variables with actual incoming message data
      if (actionData.messageId) {
        const messagePayload = await getMessageDetails(actionData.messageId);
        headerVariableMappings = replaceVariableInObject(
          headerVariableMappings,
          "incoming_message",
          messagePayload,
        );
        buttonVariableMappings = replaceVariableInObject(
          buttonVariableMappings,
          "incoming_message",
          messagePayload,
        );
        variableMappings = replaceVariableInObject(
          variableMappings,
          "incoming_message",
          messagePayload,
        );
        content = replaceVariableInString(
          content,
          "incoming_message",
          messagePayload,
        );
      }

      // Replace header, button and body variables with actual patient data
      if (actionData.patientId) {
        const patientPayload = await getPatientDetails(actionData.patientId);
        headerVariableMappings = replaceVariableInObject(
          headerVariableMappings,
          "patient",
          patientPayload,
        );
        buttonVariableMappings = replaceVariableInObject(
          buttonVariableMappings,
          "patient",
          patientPayload,
        );
        variableMappings = replaceVariableInObject(
          variableMappings,
          "patient",
          patientPayload,
        );
        content = replaceVariableInString(content, "patient", patientPayload);
      }

      // Replace header, button and body variables with actual appointment data
      if (actionData.appointmentId) {
        const appointmentPayload = await getAppointmentDetails(
          actionData.appointmentId,
        );
        headerVariableMappings = replaceVariableInObject(
          headerVariableMappings,
          "appointment",
          appointmentPayload,
        );
        buttonVariableMappings = replaceVariableInObject(
          buttonVariableMappings,
          "appointment",
          appointmentPayload,
        );
        variableMappings = replaceVariableInObject(
          variableMappings,
          "appointment",
          appointmentPayload,
        );
        content = replaceVariableInString(
          content,
          "appointment",
          appointmentPayload,
        );
      }

      // Replace header, button and body variables with actual system data
      const systemPayload = getSystemDetails();
      headerVariableMappings = replaceVariableInObject(
        headerVariableMappings,
        "system",
        systemPayload,
      );
      buttonVariableMappings = replaceVariableInObject(
        buttonVariableMappings,
        "system",
        systemPayload,
      );
      variableMappings = replaceVariableInObject(
        variableMappings,
        "system",
        systemPayload,
      );
      content = replaceVariableInString(content, "system", systemPayload);

      // Make an array of header, button and body parameters for whatsapp message
      let headerParameters = [];
      if (headerVariableMappings) {
        headerParameters = Object.entries(headerVariableMappings).map(
          ([key, value]) => ({
            type: "text",
            text: value,
          }),
        );
      }
      let buttonParameters = [];
      if (buttonVariableMappings) {
        // Ensure it's an array of objects, not an object of objects
        buttonParameters = Object.values(buttonVariableMappings).map(
          (value) => ({
            type: "text",
            text: value,
          }),
        );
      }
      let bodyParameters = [];
      if (variableMappings) {
        bodyParameters = Object.entries(variableMappings).map(
          ([key, value]) => ({
            type: "text",
            text: value,
          }),
        );
      }

      // TODO: conversation finding and msg sending functionality
      let conversation;
      if (actionData.conversationId) {
        conversation = await Conversation.findById(actionData.conversationId);
      } else {
        conversation = await Conversation.findOne({
          leadId: lead?._id,
          clinicId: action?.clinicId,
        });
      }

      if (!conversation) {
        // if not found conversation then create new one
        conversation = new Conversation({
          clinicId: action?.clinicId,
          ownerId: workflow?.ownerId,
          leadId: lead?._id,
        });
        await conversation.save();
      }

      const newMessage = new Message({
        clinicId: workflow.clinicId,
        conversationId: conversation._id,
        leadId: lead._id,
        senderId: workflow.ownerId,
        recipientId: lead._id,
        channel: "whatsapp",
        messageType: "automation",
        direction: "outgoing",
        content,
        mediaUrl,
        mediaType,
        source: "Zeva Automation",
        status: "sending",
        provider: provider._id,
        bodyParameters,
        headerParameters,
        headerText,
        footerText,
        replyButtons,
        listSections,
      });
      // assign this message as a recentMessage
      conversation.recentMessage = newMessage._id;
      await newMessage.save();

      // find provider credentials
      const accessToken = provider?.secrets?.whatsappAccessToken;
      const phoneNumberId = provider?.phone;
      if (!accessToken || !phoneNumberId) {
        console.log("Whatsapp provider credientials not found");
        // Update Workflow History with failed
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Whatsapp provider credientials not found",
        });
        return;
      }

      let toPhoneNumber = lead?.phone;
      if (!toPhoneNumber) {
        // Update Workflow History with failed
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Lead phone number not found",
        });
        return;
      }

      let msgData;
      if (template && whatsappMsgType === "template-message") {
        msgData = {
          channel: "whatsapp",
          to: toPhoneNumber,
          type: "automation",
          template: template?.uniqueName,
          language: template?.language || "en_US",
          components: [
            template?.isHeader && template?.headerType
              ? {
                  type: "header",
                  ...(template.headerType === "text"
                    ? headerParameters.length > 0
                      ? { parameters: headerParameters } // Pass parameters only if they exist
                      : {} // Use static text
                    : {
                        parameters: [
                          {
                            type: template.headerType,
                            [template.headerType]: { link: mediaUrl },
                          },
                        ],
                      }),
                }
              : null,
            bodyParameters?.length > 0
              ? {
                  type: "body",
                  parameters: bodyParameters,
                }
              : null,

            // for authentication template
            template?.category?.toLowerCase() === "authentication"
              ? {
                  type: "button",
                  sub_type: "url",
                  index: "0",
                  parameters: bodyParameters,
                }
              : null,
          ].filter(Boolean), // Remove null values
          clientMessageId: newMessage?._id, // Optional: Your message tracking ID
          credentials: {
            accessToken,
            phoneNumberId,
          },
        };
      } else if (whatsappMsgType === "non-template-message") {
        // simple whatsapp message
        msgData = {
          channel: "whatsapp",
          to: toPhoneNumber,
          type: "automation",
          msg: content,
          mediaType: mediaType || "",
          mediaUrl: mediaUrl || "",
          clientMessageId: newMessage?._id, // Optional: Your message tracking ID
          credentials: {
            accessToken,
            phoneNumberId,
          },
        };
      } else if (whatsappMsgType === "reply-button-message") {
        msgData = {
          channel: "whatsapp",
          to: toPhoneNumber,
          type: "automation",
          msg: content,
          replyButtons,
          clientMessageId: newMessage?._id, // Optional: Your message tracking ID
          credentials: {
            accessToken,
            phoneNumberId,
          },
        };
      } else if (whatsappMsgType === "list-message") {
        msgData = {
          channel: "whatsapp",
          to: toPhoneNumber,
          type: "automation",
          headerText,
          msg: content,
          footerText,
          listSections,
          clientMessageId: newMessage?._id, // Optional: Your message tracking ID
          credentials: {
            accessToken,
            phoneNumberId,
          },
        };
      }

      let resData;
      if (
        whatsappMsgType === "template-message" ||
        whatsappMsgType === "non-template-message"
      ) {
        resData = await handleWhatsappSendMessage(msgData);
      } else if (whatsappMsgType === "reply-button-message") {
        resData = await handleSendWhatsappInteractiveReplyBtnMsg({
          to: msgData?.to,
          message: msgData?.msg,
          replyButtons: msgData?.replyButtons, // array of { type: "reply", reply: { id: string, title: string } }
          accessToken: msgData?.credentials?.accessToken,
          phoneNumberId: msgData?.credentials?.phoneNumberId,
          clientMessageId: msgData?.clientMessageId,
        });
      } else if (whatsappMsgType === "list-message") {
        resData = await handleSendWhatsappInteractiveListMsg({
          to: msgData?.to,
          headerText: msgData?.headerText,
          bodyText: msgData?.msg,
          footerText: msgData?.footerText,
          listSections: msgData?.listSections, // array of { type: "reply", reply: { id: string, title: string } }
          accessToken: msgData?.credentials?.accessToken,
          phoneNumberId: msgData?.credentials?.phoneNumberId,
          clientMessageId: msgData?.clientMessageId,
        });
      }

      if (!resData) {
        newMessage.status = "failed";
      } else {
        newMessage.status = "queued";
        newMessage.providerMessageId = resData?.messages?.[0]?.id || "";
      }
      await Promise.all([newMessage.save(), conversation.save()]);

      // TODO: Create or log activity

      // Update Workflow History with completed
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "completed",
        response: resData,
      });

      console.log(`Send whatsapp action ${actionId} processed successfully`);
      return { success: true, actionId };
    } catch (error) {
      console.error(
        `❌ Send whatsapp action job ${actionId} failed:`,
        error.message,
      );
      // Update Workflow History with failed
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "failed",
        error: error.message || "Send whatsapp action failed",
      });
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10,
  },
);
addWorkerListeners(sendWhatsappActionWorker, "sendWhatsappActionQueue");

export const sendEmailActionWorker = new Worker(
  "sendEmailActionQueue",
  async (job) => {
    console.log("Processing send email action worker job: ", job.data);
    const { id: actionId, ...rest } = job.data;
    const { historyId, ...actionData } = rest;

    try {
      const action = await WorkflowAction.findById(actionId);
      if (!action) {
        throw new Error("Action not found");
      }

      // Update Workflow History with completed
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "completed",
      });

      // Process the send email action

      console.log(`Send email action ${actionId} processed successfully`);
      return { success: true, actionId };
    } catch (error) {
      console.error(
        `❌ Send email action job ${actionId} failed:`,
        error.message,
      );
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10,
  },
);
export const sendSmsActionWorker = new Worker(
  "sendSmsActionQueue",
  async (job) => {
    console.log("Processing send sms action worker job: ", job.data);
    const { id: actionId, ...rest } = job.data;
    const { historyId, ...actionData } = rest;

    try {
      const action = await WorkflowAction.findById(actionId);
      if (!action) {
        throw new Error("Action not found");
      }

      // Update Workflow History with completed
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "completed",
      });

      // Process the send sms action

      console.log(`Send sms action ${actionId} processed successfully`);
      return { success: true, actionId };
    } catch (error) {
      console.error(
        `❌ Send sms action job ${actionId} failed:`,
        error.message,
      );
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10,
  },
);
export const restApiActionWorker = new Worker(
  "restApiActionQueue",
  async (job) => {
    console.log("Processing rest api action worker job: ", job.data);
    const { id: actionId, ...rest } = job.data;
    const { historyId, ...actionData } = rest;
    const webhookPayload = actionData.payload || {};
    const leadPayload = actionData.leadId
      ? await getLeadDetails(actionData.leadId)
      : {};
    const patientPayload = actionData.patientId
      ? await getPatientDetails(actionData.patientId)
      : {};
    const messagePayload = actionData.messageId
      ? await getMessageDetails(actionData.messageId)
      : {};
    const appointmentPayload = actionData.appointmentId
      ? await getAppointmentDetails(actionData.appointmentId)
      : {};
    const systemPayload = actionData.systemId
      ? getSystemDetails(actionData.systemId)
      : {};

    try {
      const action = await WorkflowAction.findById(actionId);
      if (!action) {
        // Update Workflow History with failed
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Action not found",
        });
        return;
      }
      const {
        apiMethod,
        apiEndPointUrl,
        apiPayloadType,
        apiAuthType,
        apiHeaders,
        apiParameters,
      } = action.parameters || {};

      if (!apiMethod || !apiEndPointUrl || !apiPayloadType || !apiAuthType) {
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error:
            "API method, end point URL, payload type, and auth type are required",
        });
        return;
      }
      if (!apiHeaders) {
        apiHeaders = {};
      }
      if (!apiParameters) {
        apiParameters = {};
      }
      if (!apiAuthType) {
        apiAuthType = "none";
      }
      if (apiAuthType === "basic") {
        if (!apiHeaders["Authorization"]) {
          await WorkflowHistory.findByIdAndUpdate(historyId, {
            status: "failed",
            error: "Basic auth requires Authorization header",
          });
          return;
        }
      }
      if (apiAuthType === "bearer") {
        if (!apiHeaders["Authorization"]) {
          await WorkflowHistory.findByIdAndUpdate(historyId, {
            status: "failed",
            error: "Bearer auth requires Authorization header",
          });
          return;
        }
      }
      if (apiAuthType === "none") {
        if (apiHeaders["Authorization"]) {
          await WorkflowHistory.findByIdAndUpdate(historyId, {
            status: "failed",
            error: "None auth cannot have Authorization header",
          });
          return;
        }
      }

      // execute rest api action from axios
      let response;
      let apiHeadersData = {};
      for (let item of apiHeaders) {
        apiHeadersData[item.key] = item.value;
      }

      // replace variables in apiHeadersData with webhookPayload
      apiHeadersData = replaceVariableInObject(
        apiHeadersData,
        "webhook",
        webhookPayload,
      );
      if (actionData.leadId) {
        apiHeadersData = replaceVariableInObject(
          apiHeadersData,
          "lead",
          leadPayload,
        );
      }
      if (actionData.patientId) {
        apiHeadersData = replaceVariableInObject(
          apiHeadersData,
          "patient",
          patientPayload,
        );
      }
      if (actionData.messageId) {
        apiHeadersData = replaceVariableInObject(
          apiHeadersData,
          "incoming_message",
          messagePayload,
        );
      }
      if (actionData.appointmentId) {
        apiHeadersData = replaceVariableInObject(
          apiHeadersData,
          "appointment",
          appointmentPayload,
        );
      }

      apiHeadersData = replaceVariableInObject(
        apiHeadersData,
        "system",
        systemPayload,
      );

      if (apiMethod === "GET") {
        // get request
        try {
          response = await axios.get(apiEndPointUrl, {
            headers: apiHeadersData,
          });
          console.log("GET request response:", response.data);
        } catch (error) {
          await WorkflowHistory.findByIdAndUpdate(historyId, {
            status: "failed",
            error: error.message || "GET request failed",
          });
          return;
        }
      } else if (apiMethod === "POST") {
        // post request
        let apiParametersJSONData = {};
        let apiParametersFormData = new FormData();

        if (apiPayloadType === "JSON") {
          apiHeadersData["Content-Type"] = "application/json";
          for (let item of apiParameters) {
            apiParametersJSONData[item.key] = item.value;
          }

          // replace variables in apiParametersJSONData
          apiParametersJSONData = replaceVariableInObject(
            apiParametersJSONData,
            "webhook",
            webhookPayload,
          );

          // replace variables in apiParametersJSONData with leadPayload
          if (actionData.leadId) {
            apiParametersJSONData = replaceVariableInObject(
              apiParametersJSONData,
              "lead",
              leadPayload,
            );
          }
          // replace variables in apiParametersJSONData with patientPayload
          if (actionData.patientId) {
            apiParametersJSONData = replaceVariableInObject(
              apiParametersJSONData,
              "patient",
              patientPayload,
            );
          }
          // replace variables in apiParametersJSONData with messagePayload
          if (actionData.messageId) {
            apiParametersJSONData = replaceVariableInObject(
              apiParametersJSONData,
              "incoming_message",
              messagePayload,
            );
          }
          // replace variables in apiParametersJSONData with appointmentPayload
          if (actionData.appointmentId) {
            apiParametersJSONData = replaceVariableInObject(
              apiParametersJSONData,
              "appointment",
              appointmentPayload,
            );
          }

          apiParametersJSONData = replaceVariableInObject(
            apiParametersJSONData,
            "system",
            systemPayload,
          );

          try {
            response = await axios.post(apiEndPointUrl, apiParametersJSONData, {
              headers: apiHeadersData,
            });
          } catch (error) {
            await WorkflowHistory.findByIdAndUpdate(historyId, {
              status: "failed",
              error: error.message || "POST request failed",
            });
            return;
          }
        } else if (apiPayloadType === "FORM_DATA") {
          apiHeadersData["Content-Type"] = "application/x-www-form-urlencoded";
          for (let item of apiParameters) {
            // replace variables in item.value
            let newValue = replaceVariableInString(
              item.value,
              "webhook",
              webhookPayload,
            );
            newValue = replaceVariableInString(newValue, "lead", leadPayload);
            newValue = replaceVariableInString(
              newValue,
              "patient",
              patientPayload,
            );
            newValue = replaceVariableInString(
              newValue,
              "incoming_message",
              messagePayload,
            );

            // replace variables in item.value with appointmentPayload
            if (actionData.appointmentId) {
              newValue = replaceVariableInString(
                newValue,
                "appointment",
                appointmentPayload,
              );
            }

            newValue = replaceVariableInString(
              newValue,
              "system",
              systemPayload,
            );

            apiParametersFormData.append(item.key, newValue);
          }

          try {
            response = await axios.post(apiEndPointUrl, apiParametersFormData, {
              headers: apiHeadersData,
            });
          } catch (error) {
            await WorkflowHistory.findByIdAndUpdate(historyId, {
              status: "failed",
              error: error.message || "POST request failed",
            });
            return;
          }
        }
      }

      // TODO: save this response in workflow history
      // Update Workflow History with completed
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "completed",
        response: response.data,
      });
      await WorkflowAction.findByIdAndUpdate(actionId, {
        apiResponse: response.data,
      });

      // Process the delay action
      processWorkflow({
        nodes: rest.nodes,
        edges: rest.edges,
        api_response: response.data, // add additional data if needed
        ...rest,
      });

      console.log(`Rest api action ${actionId} processed successfully`);
      return { success: true, actionId };
    } catch (error) {
      console.error(
        `❌ Rest api action job ${actionId} failed:`,
        error.message,
      );
      // Update Workflow History with failed
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "failed",
        error: error.message || "REST API action failed",
      });
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10,
  },
);
export const addToSegmentActionWorker = new Worker(
  "addToSegmentActionQueue",
  async (job) => {
    console.log("Processing add to segment action worker job: ", job.data);
    const { id: actionId, ...rest } = job.data;
    const { historyId, ...actionData } = rest;

    /*
     * Add lead to the segment
     * Parameters:
     * - segmentId: The ID of the segment to add the lead to
     * - leadId: The ID of the lead to add to the segment
     */

    try {
      const action = await WorkflowAction.findById(actionId);
      if (!action) {
        // Update Workflow History with failed
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Action not found",
        });
        return;
      }
      const { segmentId } = action.parameters || {};
      if (!segmentId) {
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Segment ID is required",
        });
        return;
      }
      const leadId = actionData.leadId;
      if (!leadId) {
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Lead ID is required",
        });
        return;
      }
      // Add lead to the segment
      const segment = await Segment.findByIdAndUpdate(segmentId, {
        $addToSet: {
          leads: leadId,
        },
      });
      const lead = await Lead.findByIdAndUpdate(leadId, {
        $addToSet: {
          segments: segmentId,
        },
      });
      if (!segment || !lead) {
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Segment or Lead not found",
        });
        return;
      }

      // Update Workflow History with completed
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "completed",
      });

      // Process the add to segment action

      console.log(`Add to segment action ${actionId} processed successfully`);
      return { success: true, actionId };
    } catch (error) {
      // Update Workflow History with failed
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "failed",
        error: error.message || "Add to segment action failed",
      });
      console.error(
        `❌ Add to segment action job ${actionId} failed:`,
        error.message,
      );
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10,
  },
);
export const assignOwnerActionWorker = new Worker(
  "assignOwnerActionQueue",
  async (job) => {
    console.log("Processing assign owner action worker job: ", job.data);
    const { id: actionId, ...rest } = job.data;
    const { historyId, ...actionData } = rest;

    /*
     * Assign owner to the lead
     * Parameters:
     * - assignedTo: The ID of the user to assign as the owner
     * - leadId: The ID of the lead to assign the owner to
     */

    try {
      const action = await WorkflowAction.findById(actionId);
      if (!action) {
        throw new Error("Action not found");
      }

      const { assignedTo } = action.parameters || {};
      if (!assignedTo) {
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Assigned to is required",
        });
        return;
      }
      const leadId = actionData.leadId;
      if (!leadId) {
        // Update Workflow History with completed
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Lead ID is required",
        });
        return;
      }

      // Assign owner to the lead
      await Lead.findByIdAndUpdate(leadId, {
        $addToSet: {
          assignedTo: {
            user: assignedTo,
            assignedAt: new Date(),
          },
        },
      });

      // Update Workflow History with completed
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "completed",
      });

      // Process the assign owner action
      console.log(`Assign owner action ${actionId} processed successfully`);
      return { success: true, actionId };
    } catch (error) {
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "failed",
        error: error.message || "Assign owner action failed",
      });
      console.error(
        `❌ Assign owner action job ${actionId} failed:`,
        error.message,
      );
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10,
  },
);
export const addTagActionWorker = new Worker(
  "addTagActionQueue",
  async (job) => {
    console.log("Processing add tag action worker job: ", job.data);
    const { id: actionId, ...rest } = job.data;
    const { historyId, ...actionData } = rest;

    try {
      const action = await WorkflowAction.findById(actionId);
      if (!action) {
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Action not found",
        });
        return;
      }

      const workflow = await Workflow.findById(action.workflowId);
      if (!workflow) {
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Workflow not found",
        });
        return;
      }

      const { tag } = action.parameters || {};
      if (!tag) {
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Tag is required",
        });
        return;
      }

      const leadId = actionData.leadId;
      const lead = await Lead.findById(leadId);
      if (!lead) {
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Lead not found",
        });
        return;
      }

      // Add tag to the lead's tags array
      const normalizedTag = tag.trim().toLowerCase();
      if (!lead.tags.includes(normalizedTag)) {
        lead.tags.push(normalizedTag);
        await lead.save();
        console.log(`Tag ${normalizedTag} added to lead ${leadId}`);
      } else {
        console.log(`Tag ${normalizedTag} already exists on lead ${leadId}`);
      }

      // Update Workflow History with completed
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "completed",
        response: {
          success: true,
          message: `Tag ${normalizedTag} added to lead ${leadId}`,
        },
      });

      console.log(`Add tag action ${actionId} processed successfully`);
      return { success: true, actionId };
    } catch (error) {
      console.error(`❌ Add tag action job ${actionId} failed:`, error.message);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10,
  },
);
export const aiComposerActionWorker = new Worker(
  "aiComposerActionQueue",
  async (job) => {
    console.log("Processing ai composer action worker job: ", job.data);
    const { id: actionId, ...rest } = job.data;
    const { historyId, ...actionData } = rest;

    const webhookPayload = actionData.payload || {};
    const restApiPayload = actionData.api_response || {};
    const leadPayload = actionData.leadId
      ? await getLeadDetails(actionData.leadId)
      : {};
    const patientPayload = actionData.patientId
      ? await getPatientDetails(actionData.patientId)
      : {};
    const messagePayload = actionData.messageId
      ? await getMessageDetails(actionData.messageId)
      : {};
    const appointmentPayload = actionData.appointmentId
      ? await getAppointmentDetails(actionData.appointmentId)
      : {};
    const systemPayload = actionData.systemId
      ? getSystemDetails(actionData.systemId)
      : {};

    try {
      const action = await WorkflowAction.findById(actionId);
      if (!action) {
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Action not found",
        });
        return;
      }

      let { prompt, model, temperature, outputKey } = action.parameters || {};
      if (!prompt || !model || temperature === undefined || !outputKey) {
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Prompt, model, temperature, and outputKey are required",
        });
        return;
      }

      // Replace variables in prompt with actual lead data
      prompt = replaceVariableInObject(prompt, "webhook", webhookPayload);
      prompt = replaceVariableInObject(prompt, "rest_api", restApiPayload);
      prompt = replaceVariableInObject(prompt, "lead", leadPayload);
      prompt = replaceVariableInObject(prompt, "patient", patientPayload);
      prompt = replaceVariableInObject(
        prompt,
        "incoming_message",
        messagePayload,
      );
      prompt = replaceVariableInObject(
        prompt,
        "appointment",
        appointmentPayload,
      );
      prompt = replaceVariableInObject(prompt, "system", systemPayload);

      let result;
      try {
        result = await generateAiResponse({
          prompt,
          model,
          temperature,
          outputKey,
        });
        console.log({ result });
        if (!result) {
          await WorkflowHistory.findByIdAndUpdate(historyId, {
            status: "failed",
            error: "AI response generation failed",
          });
          return;
        }
      } catch (error) {
        console.error("Error generating AI response:", error.message);
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: error.message || "AI response generation failed",
        });
        return;
      }

      // Update Workflow History with completed
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "completed",
        response: {
          success: true,
          [outputKey]: result[outputKey],
        },
      });

      // Process the delay action
      processWorkflow({
        nodes: rest.nodes,
        edges: rest.edges,
        ai_composer_response: {
          success: true,
          [outputKey]: result[outputKey],
        }, // add additional data if needed
        ...rest,
      });

      console.log(`Ai composer action ${actionId} processed successfully`);
      return { success: true, actionId, result };
    } catch (error) {
      console.error(
        `❌ Ai composer action job ${actionId} failed:`,
        error.message,
      );
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "failed",
        error: error.message || "Ai composer action failed",
      });
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10,
  },
);

// Book appointment action worker
export const bookAppointmentActionWorker = new Worker(
  "bookAppointmentActionQueue",
  async (job) => {
    const { id: actionId, ...rest } = job.data;
    console.log(
      `Processing book appointment action for actionId: ${actionId}: `,
      job.data,
    );
    const { historyId, ...actionData } = rest;

    try {
      const action = await WorkflowAction.findById(actionId);
      const workflow = await Workflow.findById(action?.workflowId);
      if (!workflow) {
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Workflow not found",
        });
        return;
      }
      if (!action) {
        // Update Workflow History with failed
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error: "Action not found",
        });
        return;
      }

      let {
        leadId,
        patientId,
        message, // Assuming message context is passed for {{message.content}}
      } = actionData;

      // 1. Get context for variable replacement
      let context = { message: message || {} };
      let patient;
      if (patientId) {
        patient = await PatientRegistration.findById(patientId).lean();
        const patientData = await getPatientDetails(patientId);
        if (patient) context.patient = patientData;
      } else if (leadId) {
        patient = await getPatientByLeadId(leadId);
        const patientData = await getPatientDetails(patient._id);
        if (patient) context.patient = patientData; // Use 'patient' key for consistency in templates
      }

      // Helper function for replacing variables
      const replaceVariables = (text, context) => {
        if (!text || typeof text !== "string") return text;
        return text.replace(/{{(.*?)}}/g, (match, p1) => {
          const keys = p1.trim().split(".");
          let value = context;
          for (const key of keys) {
            if (value && typeof value === "object" && key in value) {
              value = value[key];
            } else {
              // If the key doesn't exist, return the original placeholder
              return match;
            }
          }
          // If the final value is an object, stringify it or return a default
          return typeof value === "object" ? JSON.stringify(value) : value;
        });
      };

      // 2. Destructure and replace variables in appointment details
      const parameters = action.parameters || {};
      const appointment = parameters.appointment || {};

      const {
        doctorId,
        roomId,
        mainTreatment,
        subTreatment,
        followType,
        status,
      } = appointment;

      const appointmentDate = replaceVariables(
        appointment.appointmentDate,
        context,
      );
      const appointmentTime = replaceVariables(
        appointment.appointmentTime,
        context,
      );
      const notes = replaceVariables(appointment.notes, context);

      // 3. Validate required fields after variable replacement
      if (
        !doctorId ||
        !mainTreatment ||
        !subTreatment ||
        !appointmentDate ||
        !appointmentTime
      ) {
        await WorkflowHistory.findByIdAndUpdate(historyId, {
          status: "failed",
          error:
            "Missing required appointment fields after variable replacement",
        });
        return;
      }

      // 5. Create and save the new appointment
      const newAppointmentData = {
        clinicId: workflow.clinicId,
        patientId: patient._id,
        doctorId: doctorId,
        roomId: roomId || null,
        // mainTreatment,
        // subTreatment,
        // appointmentDate,
        // appointmentTime,
        startDate: new Date(),
        fromTime: "02:00",
        toTime: "03:00",
        status: status || "booked", // Default status if not provided
        followType: followType || "first time",
        referral: "no",
        emergency: "no",
        notes: notes || "",
        createdBy: workflow.ownerId,
      };

      const newAppointment = new Appointment(newAppointmentData);
      await newAppointment.save();

      // Update Workflow History with completed
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "completed",
        response: {
          success: true,
          message: "Appointment booked successfully",
          appointment: newAppointment,
        },
      });
      console.log(
        `Successfully booked appointment ${newAppointment._id} for lead ${leadId}/patient ${patient._id}`,
      );
    } catch (error) {
      console.error(
        `Failed to process book appointment action for job ${job.id}:`,
        error,
      );
      await WorkflowHistory.findByIdAndUpdate(historyId, {
        status: "failed",
        error: error.message || "Book appointment action failed",
      });
      throw error; // Re-throw to allow BullMQ to handle retry/failure
    }
  },
  {
    connection: redis,
    concurrency: 10,
  },
);

// Schedule Whatsapp campaign worker
const scheduleWhatsappCampaignWorker = new Worker(
  "scheduleWhatsappCampaignQueue",
  async (job) => {
    console.log("Processing WhatsApp campaign worker: ", job.data);
    const { campaignId } = job.data;

    try {
      const campaign = await Campaign.findById(campaignId).select(
        "name recipients status userId clinicId sender type template content mediaType mediaUrl lastProcessedBatch totalMessages sentMessages failedMessages headerParameters bodyParameters source headerVariableMappings buttonVariableMappings variableMappings",
      );
      if (!campaign) {
        console.log("Campaign not found for campaignId: ", campaignId);
        return;
      }

      const recipientIds = campaign.recipients;
      const totalRecipients = recipientIds.length;
      const batchSize = 10;
      const totalBatches = Math.ceil(totalRecipients / batchSize);
      campaign.totalMessages = recipientIds.length;
      campaign.totalBatches = totalBatches;
      await campaign.save();

      // If campaign is paused, skip further processing
      if (campaign.status === "paused") {
        console.log(
          `Campaign ${campaignId} is paused. Skipping further processing.`,
        );
        return;
      }

      // Update campaign state before starting the process
      if (campaign.status !== "processing") {
        campaign.status = "processing";
        campaign.processedBatches = 0; // Reset the processed batches when restarting
        await campaign.save();
      }

      const provider = await Provider.findById(campaign.sender);
      if (!provider) {
        console.log("Provider not found for this campaignId: ", campaign._id);
        await Campaign.findByIdAndUpdate(campaignId, {
          status: "failed",
          errorMessage: "Provider not found for this campaignId",
        });
        return;
      }

      const accessToken = provider?.secrets?.whatsappAccessToken;
      const phoneNumberId = provider?.phone;

      if (!accessToken || !phoneNumberId) {
        console.log("Valid Provider details not found");
        await Campaign.findByIdAndUpdate(campaignId, {
          status: "failed",
          errorMessage: "Valid Provider details not found",
        });
        return;
      }

      const template = await Template.findById(campaign.template);

      if (!template || template.status !== "approved") {
        console.log("Template is not found or not approved");
        await Campaign.findByIdAndUpdate(campaignId, {
          status: "failed",
          errorMessage: "Template is not found or not approved",
        });
        return;
      }

      // Check the last processed batch and continue from there
      const lastProcessedBatch = campaign.lastProcessedBatch || 0;
      for (
        let batchIndex = lastProcessedBatch;
        batchIndex < totalBatches;
        batchIndex++
      ) {
        const start = batchIndex * batchSize;
        const end = start + batchSize;
        const batchRecipients = recipientIds.slice(start, end);

        // If the campaign has been paused or canceled, exit the loop
        const currentCampaign =
          await Campaign.findById(campaignId).select("status");
        if (currentCampaign && currentCampaign.status !== "processing") {
          console.log(
            "Campaign stopped or paused for campaignId: ",
            campaignId,
          );
          break;
        }

        // Process the current batch
        const recipients = await Lead.find({
          _id: { $in: batchRecipients },
        });
        let batchMsgs = [];
        let msgData = [];
        let failedMessages = 0;
        for (const recipient of recipients) {
          try {
            let conversation = await Conversation.findOne({
              leadId: recipient._id,
              clinicId: campaign.clinicId,
            });

            if (!conversation) {
              conversation = await Conversation.create({
                clinicId: campaign.clinicId,
                ownerId: campaign.userId,
                leadId: recipient._id,
              });
            }

            // Generate a unique message ID
            const messageId = new mongoose.Types.ObjectId(); // Generates a new ObjectId

            const leadPayload = await getLeadDetails(recipient?._id);
            let content = campaign.content || "";
            let headerVariableMappings = campaign.headerVariableMappings || {};
            let variableMappings = campaign.variableMappings || {};
            let buttonVariableMappings = campaign.buttonVariableMappings || {};

            headerVariableMappings = replaceVariableInObject(
              headerVariableMappings,
              "lead",
              leadPayload,
            );
            buttonVariableMappings = replaceVariableInObject(
              buttonVariableMappings,
              "lead",
              leadPayload,
            );
            variableMappings = replaceVariableInObject(
              variableMappings,
              "lead",
              leadPayload,
            );

            // Replace header, button and body variables with actual system data
            const systemPayload = getSystemDetails();
            headerVariableMappings = replaceVariableInObject(
              headerVariableMappings,
              "system",
              systemPayload,
            );
            buttonVariableMappings = replaceVariableInObject(
              buttonVariableMappings,
              "system",
              systemPayload,
            );
            variableMappings = replaceVariableInObject(
              variableMappings,
              "system",
              systemPayload,
            );
            content = replaceVariableInString(content, "", variableMappings);

            // Make an array of header, button and body parameters for whatsapp message
            let headerParameters = [];
            if (headerVariableMappings) {
              headerParameters = Object.entries(headerVariableMappings).map(
                ([key, value]) => ({
                  type: "text",
                  text: value,
                }),
              );
            }
            let buttonParameters = [];
            if (buttonVariableMappings) {
              // Ensure it's an array of objects, not an object of objects
              buttonParameters = Object.values(buttonVariableMappings).map(
                (value) => ({
                  type: "text",
                  text: value,
                }),
              );
            }
            let bodyParameters = [];
            if (variableMappings) {
              bodyParameters = Object.entries(variableMappings).map(
                ([key, value]) => ({
                  type: "text",
                  text: value,
                }),
              );
            }

            // check status is optOut or not if optOut then don't send message to this contact

            // check toPhoneNumber is valid or not if seeting enabled
            let toPhoneNumber = recipient?.phone || "";
            let consentStatus = "optIn";

            msgData.push({
              _id: messageId, // Assign generated messageId
              clinicId: campaign.clinicId,
              conversationId: conversation._id,
              leadId: recipient._id,
              campaignId: campaign._id,
              senderId: campaign.userId,
              recipientId: recipient._id,
              provider: campaign.sender,
              channel: "whatsapp",
              messageType: "bulk",
              direction: "outgoing",
              content: content,
              mediaType: campaign.mediaType,
              mediaUrl: campaign.mediaUrl,
              status:
                !toPhoneNumber || consentStatus === "optOut"
                  ? "failed"
                  : "sent",
              source: "Zeva Campaign",
              errorCode:
                consentStatus === "optOut"
                  ? "70002"
                  : !toPhoneNumber
                    ? "70001"
                    : "",
              errorMessage:
                consentStatus === "optOut"
                  ? "Recipient has opted out."
                  : !toPhoneNumber
                    ? "Recipient phone number is invalid or in an incorrect format."
                    : "",
              bodyParameters,
              headerParameters,
            });

            // push msg data to batch if phoneNumber exist and consentStatus is optIn
            if (toPhoneNumber && consentStatus === "optIn") {
              batchMsgs.push({
                channel: "whatsapp",
                to: toPhoneNumber,
                template: template.uniqueName,
                language: template?.language || "en_US",
                clientMessageId: messageId.toString(), // above message id
                components: [
                  template?.isHeader && template?.headerType
                    ? {
                        type: "header",
                        ...(template.headerType === "text"
                          ? headerParameters.length > 0
                            ? { parameters: headerParameters } // Pass parameters only if they exist
                            : {} // Use static text
                          : {
                              parameters: [
                                {
                                  type: template.headerType,
                                  [template.headerType]: {
                                    link: campaign.mediaUrl,
                                  },
                                },
                              ],
                            }),
                      }
                    : null,
                  bodyParameters?.length > 0
                    ? {
                        type: "body",
                        parameters: bodyParameters,
                      }
                    : null,

                  // for authentication template
                  template?.category?.toLowerCase() === "authentication"
                    ? {
                        type: "button",
                        sub_type: "url",
                        index: "0",
                        parameters: bodyParameters,
                      }
                    : null,
                ].filter(Boolean),
                clientMessageId: messageId.toString(), // above message id
                credentials: {
                  accessToken,
                  phoneNumberId,
                },
              });
            } else {
              failedMessages += 1;
            }
          } catch (error) {
            console.log(
              "Failed to create bulk message for contactId: ",
              recipient._id,
              error.message,
            );
          }
        }

        try {
          // Insert messages in bulk
          const insertedMessages = await Message.insertMany(msgData, {
            ordered: false,
          });
          console.log("Bulk insert result length: ", insertedMessages.length);
          // Prepare bulk update operations for conversation.recentMessage
          let bulkUpdateOperations = insertedMessages.map((msg) => ({
            updateOne: {
              filter: { _id: msg.conversationId }, // Find the conversation
              update: { $set: { recentMessage: msg._id } }, // Set the recentMessage field
            },
          }));

          // Perform bulk update
          if (bulkUpdateOperations.length > 0) {
            await Conversation.bulkWrite(bulkUpdateOperations);
            console.log("Updated recentMessage for conversations.");
          }
        } catch (error) {
          console.log("Error in bulk write operation: ", error.message);
        }

        // now call the crm bulk api
        const sendBatchWhatsappJob = await sendBatchWhatsappMessageQueue.add(
          "sendBatchWhatsappMessageJob",
          {
            campaignId,
            batchIndex,
            totalBatches,
            clientBatchId: `${campaign._id}-${campaign.lastProcessedBatch}`,
            statusCallback: `https://zeva360.com/api/webhook/bulk/whatsapp`, // enter your webhook url
            credentials: {
              accessToken,
              phoneNumberId,
            },
            messages: batchMsgs,
          },
          {
            jobId: `${campaignId}-${batchIndex}`,
            priority: 1,
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 1000,
            },
          },
        );

        // Update processed batch count and save the campaign state
        campaign.lastProcessedBatch = batchIndex + 1; // Update to the next batch to be processed
        campaign.sentMessages += recipients?.length - failedMessages;
        campaign.failedMessages += failedMessages;
        campaign.processedBatches = batchIndex + 1;
        await campaign.save();
        console.log(
          `Processed batch ${batchIndex + 1}/${totalBatches} and jobID is `,
          sendBatchWhatsappJob.id,
        );

        // Optional: add a delay between batches (e.g., to avoid rate limiting)
        await new Promise((resolve) => setTimeout(resolve, 15000)); // 15 second delay
      }

      // Mark the campaign as completed once all batches are processed
      campaign.status = "completed";
      await campaign.save();
      // await sendCampaignCompleteEmail(campaign._id);
      console.log(`Campaign ${campaignId} completed successfully.`);
    } catch (error) {
      console.log(
        "Error in schedule whatsapp campaign worker: ",
        error.message,
      );
    }
  },
  {
    connection: redis,
    concurrency: 10,
  },
);

export const sendBatchWhatsappMessageWorker = new Worker(
  "sendBatchWhatsappMessageQueue",
  async (job) => {
    console.log("Processing send whatsapp batch worker: ");

    const {
      campaignId,
      batchIndex,
      totalBatches,
      clientBatchId,
      statusCallback,
      credentials,
      messages,
    } = job.data;

    for (let msgData of messages) {
      const messageId = msgData.clientMessageId;
      console.log("Processing message: ", msgData);
      const resData = await handleWhatsappSendMessage(msgData);
      if (!resData) {
        await Message.findByIdAndUpdate(messageId, {
          status: "failed",
        });
      } else {
        const providerMessageId = resData?.messages?.[0]?.id || "";
        await Message.findByIdAndUpdate(messageId, {
          status: "sent",
          providerMessageId,
        });
      }
    }
  },
  {
    connection: redis,
    concurrency: 10,
  },
);
