import nodemailer from "nodemailer";
import * as cheerio from "cheerio";
import Provider from "../models/Provider.js";

export const sendTestEmailBySmtp = async ({
  smtpHost,
  smtpPort,
  smtpSecure,
  smtpUsername,
  smtpPassword,
  from,
  to,
}) => {
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
    });

    await transporter.sendMail({
      from,
      to,
      subject: "Test Email",
      text: "This is a test email using your SMTP settings.",
    });

    return true;
  } catch (error) {
    console.error("SMTP Test Email Error:", error.message);
    return false;
  }
};

export const sendEmailViaSmtpMultiple = async ({
  providerId,
  to, // array of emails
  subject,
  content,
  from,
  senderName,
  attachments = [],
  originalMessageId = "",
  cc,
  bcc,
}) => {
  console.log({ to, from, attachments });
  try {
    const provider = await Provider.findById(providerId);
    if (!provider || !provider.secrets) {
      throw new Error("SMTP provider not found or secrets missing");
    }

    const { smtpUsername, smtpPassword, smtpHost, smtpPort, smtpSecure } =
      provider.secrets;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
    });

    // Join multiple emails into a comma-separated string
    const toEmails = Array.isArray(to) ? to.join(",") : to;

    const mailOptions = await encodeMessageForSmtp({
      to: toEmails,
      from,
      senderName,
      subject,
      content,
      attachments,
      originalMessageId,
      cc,
      bcc,
    });

    console.log({ mailOptions });

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent via SMTP (multiple):", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending email via SMTP (multiple):", error.message);
    throw new Error("Failed to send email via SMTP (multiple)");
  }
};

export const encodeMessageForSmtp = async ({
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
  const fetchBase64FromUrl = async (url) => {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  };

  // Prepare attachments in nodemailer format
  const formattedAttachments = await Promise.all(
    attachments.map(async (attachment) => {
      const { fileName, mimeType, mediaUrl } = attachment;

      const fileBuffer = await fetchBase64FromUrl(mediaUrl);

      return {
        filename: fileName,
        content: fileBuffer,
        contentType: mimeType,
      };
    }),
  );

  // Ensure subject starts with "Re:" if replying
  const formattedSubject =
    originalMessageId && !subject.startsWith("Re:")
      ? `Re: ${subject}`
      : subject;

  // Email object
  const emailData = {
    from: `"${senderName}" <${from}>`,
    to,
    subject: formattedSubject,
    html: content || "",
    attachments: formattedAttachments,
  };

  // Add cc and bcc if provided
  if (cc) emailData.cc = cc;
  if (bcc) emailData.bcc = bcc;

  // Add reply headers if replying to a message
  if (originalMessageId) {
    emailData["inReplyTo"] = originalMessageId;
    emailData["references"] = originalMessageId;
  }

  return emailData;
};

export const replaceUrlsWithTrackingUrlsInContent = (content, messageId) => {
  if (!content) return "";
  const $ = cheerio.load(content, null, false);

  $("a").each(function () {
    const originalUrl = $(this).attr("href");
    if (originalUrl) {
      const trackingUrl = `https://zeva360.com/api/email/track/click?emailId=${messageId}&url=${encodeURIComponent(
        originalUrl,
      )}`;
      $(this).attr("href", trackingUrl);
    }
  });

  return $.html();
};
