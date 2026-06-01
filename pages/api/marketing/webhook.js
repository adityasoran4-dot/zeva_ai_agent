import { sendMessageToClient } from "./ws-utils";

// Remove '+' from phone number
function normalizePhone(num) {
  if (!num) return "";
  return num.replace(/\+/g, "");
}

export default function handler(req, res) {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "zeva";

  // Verification
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
      // console.log("✅ WEBHOOK_VERIFIED");
      return res.status(200).send(challenge);
    }
    return res.status(403).end();
  }

  // Incoming webhook
  if (req.method === "POST") {
    try {
      // console.log("📩 Incoming webhook:", JSON.stringify(req.body, null, 2));

      req.body.entry?.forEach((entry) => {
        entry.changes?.forEach((change) => {
          const value = change.value;

          // Incoming messages from leads
          if (value?.messages) {
            value.messages.forEach((msg) => {
              const phone = normalizePhone(msg.from); // normalized

              sendMessageToClient(phone, {
                id: msg.id,
                from: phone,
                text: msg.text?.body || msg.type,
                timestamp: msg.timestamp,
              });
            });
          }

          // Status updates for messages we sent
          if (value?.statuses) {
            value.statuses.forEach((status) => {
              const phone = normalizePhone(status.recipient_id); // normalized

              sendMessageToClient(phone, {
                id: status.id,
                from: "me",
                text: "",
                timestamp: status.timestamp,
                status: status.status,
              });
            });
          }
        });
      });

      return res.status(200).send("EVENT_RECEIVED");
    } catch (err) {
      // console.error("❌ Webhook error:", err);
      return res.sendStatus(500);
    }
  }

  res.status(405).end();
}
