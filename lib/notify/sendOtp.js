//lib/notify/sendOtp.js
import nodemailer from "nodemailer";

export async function sendWhatsAppViaTwilio(to, options) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (!sid || !token || (!from && !messagingServiceSid) || !to) return { success: false };
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams();
  let raw = to;
  if (raw.startsWith("whatsapp:")) raw = raw.slice("whatsapp:".length);
  raw = raw.trim();
  if (!raw.startsWith("+")) {
    const digits = raw.replace(/\D/g, "");
    if (/^\d{10}$/.test(digits)) {
      raw = `+91${digits}`;
    } else {
      raw = `+${digits}`;
    }
  }
  const normalizedTo = `whatsapp:${raw}`;
  params.append("To", normalizedTo);
  if (messagingServiceSid) {
    params.append("MessagingServiceSid", messagingServiceSid);
  } else {
    params.append("From", from);
  }
  const contentSid = options?.contentSid;
  const contentVariables = options?.contentVariables;
  const body = options?.body;
  if (contentSid) {
    params.append("ContentSid", contentSid);
    if (contentVariables) {
      params.append("ContentVariables", typeof contentVariables === "string" ? contentVariables : JSON.stringify(contentVariables));
    }
  } else if (body) {
    params.append("Body", body);
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const json = await res.json().catch(() => ({}));
    return { success: res.ok, sid: json.sid };
  } catch {
    return { success: false };
  }
}

export async function sendEmailViaSMTP(to, subject, textOrOptions) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  if (!host || !user || !pass || !to) return { success: false };
  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  try {
    const text = typeof textOrOptions === "string" ? textOrOptions : (textOrOptions?.text || "");
    const html = typeof textOrOptions === "object" ? (textOrOptions?.html || undefined) : undefined;
    const info = await transporter.sendMail({ from, to, subject, text, ...(html ? { html } : {}) });
    return { success: true, id: info.messageId };
  } catch {
    return { success: false };
  }
}
