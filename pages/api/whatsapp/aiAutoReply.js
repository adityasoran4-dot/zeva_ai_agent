// pages/api/whatsapp/aiAutoReply.js

import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { handleWhatsappSendMessage } from "../../../services/whatsapp";
import Provider from "../../../models/Provider";
import Message from "../../../models/Message";
import Conversation from "../../../models/Conversation";
import Lead from "../../../models/Lead";
import dbConnect from "../../../lib/database";
import { emitIncomingMessageToUser } from "../../../services/socket-emitter";

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
});
connection.on("connect", () => console.log("[Redis] Connected successfully"));
connection.on("error", (err) =>
  console.error("[Redis] Connection error:", err.message),
);
// ─── Queue (used by webhook to schedule jobs) ────────────────────────────────
const aiReplyQueue = new Queue("ai-reply", { connection });

// ─── Worker (processes jobs — runs in the same Node process) ─────────────────
// Guard so Next.js hot-reload doesn't spin up duplicate workers
if (!global._aiWorkerStarted) {
  global._aiWorkerStarted = true;

  new Worker(
    "ai-reply",
    async (job) => {
      await triggerAIReply(job.data);
    },
    { connection },
  );

  console.log("[AI] BullMQ worker started");
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function scheduleAIReply({
  conversationId,
  messageContent,
  clinicToken,
  providerPhone,
  customerPhone,
}) {
  // Remove any existing delayed job for this conversation (debounce)
  try {
    const job = await aiReplyQueue.getJob(`ai-${conversationId}`);
    if (job) await job.remove();
  } catch (_) {}

  await aiReplyQueue.add(
    "reply",
    {
      conversationId,
      messageContent,
      clinicToken,
      providerPhone,
      customerPhone,
    },
    {
      delay: 5000,
      jobId: `ai-${conversationId}`, // deterministic — easy to cancel
      removeOnComplete: true,
      removeOnFail: 100,
    },
  );

  console.log(`[AI] Job queued for ${conversationId}`);
}

export async function cancelAIReply(conversationId) {
  try {
    const job = await aiReplyQueue.getJob(`ai-${conversationId}`);
    if (job) {
      await job.remove();
      console.log(`[AI] Job cancelled for ${conversationId} — staff replied`);
    }
  } catch (_) {}
}

// ─── Core logic (called by the worker) ───────────────────────────────────────
async function triggerAIReply({
  conversationId,
  messageContent,
  clinicToken,
  providerPhone,
  customerPhone,
}) {
  console.log(`[AI] Taking over conversation ${conversationId}`);
  try {
    await dbConnect();

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      console.error(`[AI] Conversation not found: ${conversationId}`);
      return;
    }

    const lead = await Lead.findById(conversation.leadId);
    if (!lead) {
      console.error(`[AI] Lead not found for conversation: ${conversationId}`);
      return;
    }

    const provider = await Provider.findOne({ phone: providerPhone });
    if (!provider) {
      console.error(`[AI] Provider not found for phone: ${providerPhone}`);
      return;
    }

    // Call FastAPI AI agent
    const chatRes = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messageContent,
        threadId: conversationId,
        clinicToken: clinicToken,
      }),
    });

    if (!chatRes.ok) {
      console.error(`[AI] /chat returned ${chatRes.status}`);
      return;
    }

    const { response: aiReply } = await chatRes.json();
    console.log(`[AI] Reply for ${conversationId}:`, aiReply);

    // Save outgoing AI message
    const newMessage = new Message({
      clinicId: conversation.clinicId,
      conversationId: conversation._id,
      leadId: lead._id,
      senderId: null,
      recipientId: lead._id,
      channel: "whatsapp",
      messageType: "conversational",
      direction: "outgoing",
      content: aiReply,
      status: "sending",
      provider: provider._id,
      source: "AI",
    });

    conversation.recentMessage = newMessage._id;
    await Promise.all([newMessage.save(), conversation.save()]);

    // Send via WhatsApp
    const msgData = {
      channel: "whatsapp",
      to: lead.phone,
      type: "conversational",
      msg: aiReply,
      clientMessageId: newMessage._id,
      credentials: {
        accessToken: provider.secrets?.whatsappAccessToken,
        phoneNumberId: provider.phone,
      },
    };

    const resData = await handleWhatsappSendMessage(msgData);

    newMessage.status = resData ? "queued" : "failed";
    if (resData) {
      newMessage.providerMessageId = resData?.messages?.[0]?.id || "";
    }
    await newMessage.save();

    // Emit to staff UI so they see the AI reply in real time
    const populatedMessage = await Message.findById(newMessage._id)
      .populate("recipientId", "name email phone")
      .populate("provider", "name label email phone");

    const userId = provider.userId?.toString();
    if (userId) {
      await emitIncomingMessageToUser(userId, populatedMessage);
    }

    console.log(`[AI] Message sent successfully for ${conversationId}`);
  } catch (err) {
    console.error(`[AI] triggerAIReply error:`, err);
  }
}
