import { google } from "googleapis";
import Provider from "../models/Provider.js";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export const sendEmailViaGmailMultiple = async ({
  providerId,
  to, // array of emails
  subject,
  content,
  from,
  senderName,
  attachments = [],
  originalMessageId = "",
  threadId = "",
  cc,
  bcc,
}) => {
  try {
    // Join multiple emails into a comma-separated string
    const toEmails = Array.isArray(to) ? to.join(",") : to;
    console.log({
      providerId,
      to: toEmails,
      subject,
      content,
      from,
      senderName,
    });

    const gmail = await getGmailClientForUser(providerId);

    let repliedMsgId = "";
    if (originalMessageId) {
      try {
        const messageMeta = await gmail.users.messages.get({
          userId: "me",
          id: originalMessageId,
          format: "metadata",
          metadataHeaders: ["Message-ID"],
        });

        const headers =
          messageMeta.data.payload.headers ||
          (messageMeta.data.payload.parts &&
            messageMeta.data.payload.parts[0]?.headers) ||
          [];

        const messageIdHeader = headers.find(
          (h) => h.name.toLowerCase() === "message-id",
        )?.value;

        console.log("Message-ID header:", messageIdHeader);
        repliedMsgId = messageIdHeader || "";
      } catch (error) {
        console.log("Error in get reply msg id: ", error?.message);
      }
    }

    console.log({ repliedMsgId });

    const rawMessage = await encodeMessage({
      to: toEmails,
      subject,
      content,
      from,
      senderName,
      attachments,
      originalMessageId: repliedMsgId,
      cc,
      bcc,
    });

    const requestBody = {
      raw: rawMessage,
    };

    if (threadId) {
      requestBody.threadId = threadId;
    }

    console.log({ requestBody });

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody,
    });

    console.log("Email sent successfully (multiple):", response.data);

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("❌ Error sending email (multiple):", error.response.data);
    } else {
      console.error("❌ Error sending email (multiple):", error.message);
    }
    throw new Error("Failed to send email (multiple)");
  }
};

export const getGmailClientForUser = async (providerId) => {
  const provider = await Provider.findById(providerId);
  if (!provider) {
    throw new Error("Provider not found");
  }

  const secrets = provider.secrets || {};
  const { access_token, refresh_token } = secrets;
  console.log({ access_token, refresh_token });
  oauth2Client.setCredentials({
    access_token,
    refresh_token,
    scope: ["https://www.googleapis.com/auth/gmail.send"],
    token_type: "Bearer",
  });
  return google.gmail({ version: "v1", auth: oauth2Client });
};

export const encodeMessage = async ({
  to,
  from,
  senderName,
  subject,
  content,
  attachments = [],
  originalMessageId = "",
  cc,
  bcc,
}) => {
  const boundary = "__BOUNDARY__";

  // Start of the email headers
  const emailParts = [
    `To: ${to}`,
    `From: "${senderName}" <${from}>`,
    cc ? `Cc: ${cc}` : "",
    bcc ? `Bcc: ${bcc}` : "",
    `Subject: ${
      originalMessageId && !subject.startsWith("Re:")
        ? `Re: ${subject}`
        : subject
    }`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ].filter(Boolean);

  if (originalMessageId) {
    emailParts.push(`In-Reply-To: ${originalMessageId}`);
    emailParts.push(`References: ${originalMessageId}`);
  }

  emailParts.push(""); // blank line after headers

  // HTML Body part (if message is in HTML)
  emailParts.push(
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    "",
    content || "",
    "",
  );

  // Add attachments if any
  for (const attachment of attachments) {
    const { fileName, mimeType, mediaUrl: url } = attachment;

    emailParts.push(
      `--${boundary}`,
      `Content-Type: ${mimeType}; name="${fileName}"`,
      `Content-Disposition: attachment; filename="${fileName}"`,
      "Content-Transfer-Encoding: base64",
      "",
    );

    // Fetch and encode attachment data
    const base64Data = await fetchBase64FromUrl(url);
    emailParts.push(base64Data);
  }

  // Closing boundary
  emailParts.push(`--${boundary}--`);

  // Join all parts to form the complete email message
  const emailString = emailParts.join("\n");

  console.log({ emailString });

  // Encode the email in base64 and make it URL-safe
  return Buffer.from(emailString)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

// Helper function to fetch base64 from URL (for attachments)
async function fetchBase64FromUrl(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64String = Buffer.from(arrayBuffer).toString("base64");
  return base64String;
}

// Step - 1 for incoming reply message
export function extractEmailReplyBody(body) {
  const splitIndex = body.indexOf("On ");
  if (splitIndex !== -1) {
    return body.substring(0, splitIndex).trim();
  }
  return body.trim(); // fallback to full body
}
