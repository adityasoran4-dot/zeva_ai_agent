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
  maxRetriesPerRequest: null,
});
connection.on("connect", () => console.log("[Redis] Connected successfully"));
connection.on("error", (err) =>
  console.error("[Redis] Connection error:", err.message),
);

// ─── Queue ────────────────────────────────────────────────────────────────────
const aiReplyQueue = new Queue("ai-reply", { connection });

// ─── Worker ───────────────────────────────────────────────────────────────────
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
  clinicId, // ✅ clinicId (not clinicToken)
  providerPhone,
  customerPhone,
}) {
  try {
    const job = await aiReplyQueue.getJob(`ai-${conversationId}`);
    if (job) await job.remove();
  } catch (_) {}

  await aiReplyQueue.add(
    "reply",
    { conversationId, messageContent, clinicId, providerPhone, customerPhone },
    {
      delay: 1000,
      jobId: `ai-${conversationId}`,
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

// ─── Core logic ───────────────────────────────────────────────────────────────
async function triggerAIReply({
  conversationId,
  messageContent,
  clinicId,
  providerPhone,
  customerPhone,
}) {
  console.log(`[AI] Taking over conversation ${conversationId}`);

  try {
    await dbConnect();

    // ─── 1. Fetch real JWT token from Python backend ──────────────────────
    const tokenRes = await fetch("http://localhost:8000/get-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": process.env.INTERNAL_SECRET,
      },
      body: JSON.stringify({ clinicId }),
    });

    if (!tokenRes.ok) {
      console.error(`[AI] Could not fetch token for clinic: ${clinicId}`);
      return;
    }

    const { token: clinicToken } = await tokenRes.json(); // ✅ real JWT

    // ─── 2. Fetch DB records ──────────────────────────────────────────────
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

    // ─── 3. Call Python AI agent with real JWT ────────────────────────────
    const chatRes = await fetch(`http://localhost:8000/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messageContent,
        threadId: conversationId,
        clinicToken: clinicToken,
        conversation_id: conversationId,
        channel: "whatsapp",
      }),
    });

    if (!chatRes.ok) {
      console.error(`[AI] /chat returned ${chatRes.status}`);
      return;
    }

    const { response: aiReply } = await chatRes.json();
    console.log(`[AI] Reply for ${conversationId}:`, aiReply);

    // ─── 4. Save outgoing AI message ──────────────────────────────────────
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

    // ─── 5. Send via WhatsApp ─────────────────────────────────────────────
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

    // ─── 6. Emit to staff UI ──────────────────────────────────────────────
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
