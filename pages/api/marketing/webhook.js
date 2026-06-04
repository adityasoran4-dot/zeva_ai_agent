import { sendMessageToClient } from "./ws-utils";
import { scheduleAIReply } from "../whatsapp/aiAutoReply";
import dbConnect from "../../../lib/database";
import Provider from "../../../models/Provider";
import Lead from "../../../models/Lead";
import Conversation from "../../../models/Conversation";

function normalizePhone(num) {
  if (!num) return "";
  return num.replace(/\+/g, "");
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "zeva";

  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).end();
  }
  if (req.method === "POST") {
    const rawBody = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      req.on("error", reject);
    });

    console.log("[Webhook] Raw body length:", rawBody.length);
    console.log("[Webhook] Raw body preview:", rawBody.slice(0, 100));

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error("[Webhook] JSON parse error:", e.message);
      console.error("[Webhook] Raw body:", rawBody);
      return res.status(200).send("EVENT_RECEIVED");
    }

    res.status(200).send("EVENT_RECEIVED");
    processWebhook(body).catch((err) => console.error("[Webhook] Error:", err));
    return;
  }

  res.status(405).end();
}

async function processWebhook(body) {
  console.log("[Webhook] Processing incoming webhook");
  await dbConnect();
  const allProviders = await Provider.find({}, { phone: 1, _id: 0 });
  console.log("[AI] Available providers:", JSON.stringify(allProviders));

  const entries = body?.entry || [];

  for (const entry of entries) {
    const changes = entry?.changes || [];

    for (const change of changes) {
      const value = change.value;
      const whatsappPhoneId = value?.metadata?.phone_number_id;

      // Status updates for messages we sent
      if (value?.statuses) {
        for (const status of value.statuses) {
          const phone = normalizePhone(status.recipient_id);
          sendMessageToClient(phone, {
            id: status.id,
            from: "me",
            text: "",
            timestamp: status.timestamp,
            status: status.status,
          });
        }
      }

      // Incoming messages from leads
      if (value?.messages) {
        for (const msg of value.messages) {
          const phone = normalizePhone(msg.from);
          console.log(
            "[Webhook] Incoming message from:",
            phone,
            "text:",
            msg.text?.body,
          );

          // Send to marketing UI
          sendMessageToClient(phone, {
            id: msg.id,
            from: phone,
            text: msg.text?.body || msg.type,
            timestamp: msg.timestamp,
          });

          // Schedule AI reply
          try {
            const provider = await Provider.findOne({ phone: whatsappPhoneId });
            if (!provider) {
              console.log(
                "[AI] No provider found for phoneId:",
                whatsappPhoneId,
              );
              continue;
            }

            const lead = await Lead.findOne({
              clinicId: provider.clinicId,
              phone: { $in: [phone, `+${phone}`] },
            });

            if (!lead) {
              console.log("[AI] Creating new lead for phone:", phone);
              lead = new Lead({
                clinicId: provider.clinicId,
                name: phone, // will be updated when name is known
                phone: phone,
                status: "New",
                source: "WhatsApp",
              });
              await lead.save();
            }

            const conversation = await Conversation.findOne({
              clinicId: provider.clinicId,
              leadId: lead._id,
            });

            if (!conversation) {
              console.log("[AI] No conversation found for lead:", lead._id);
              continue;
            }

            console.log(
              "[AI] Scheduling reply for conversation:",
              conversation._id.toString(),
            );

            await scheduleAIReply({
              conversationId: conversation._id.toString(),
              messageContent: msg.text?.body || "",
              clinicToken: provider.clinicId.toString(),
              providerPhone: whatsappPhoneId,
              customerPhone: phone,
            });
          } catch (err) {
            console.error("[AI] Failed to schedule reply:", err.message);
          }
        }
      }
    }
  }
}
