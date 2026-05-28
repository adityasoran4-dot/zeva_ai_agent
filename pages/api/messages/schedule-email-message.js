import { getUserFromReq, requireRole } from "../lead-ms/auth";
import Clinic from "../../../models/Clinic";
import Conversation from "../../../models/Conversation";
import dbConnect from "../../../lib/database";
import Provider from "../../../models/Provider";
import Lead from "../../../models/Lead";
import Message from "../../../models/Message";
import PatientRegistration from "../../../models/PatientRegistration";
import {
  getLeadDetails,
  getSystemDetails,
  replaceVariableInString,
} from "../../../bullmq/workflow";
import { validateEmail } from "../../../services/validate";
import {
  replaceUrlsWithTrackingUrlsInContent,
  sendEmailViaSmtpMultiple,
} from "../../../services/smtp";
import { sendEmailViaGmailMultiple } from "../../../services/gmail";
import { scheduleMessageQueue } from "../../../bullmq/queue";
import { calculateBullMQDelay } from "../../../bullmq/helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const me = await getUserFromReq(req);
  if (!me) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  if (!requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // Get clinicId based on user role
  let clinicId;
  if (me.role === "clinic") {
    const clinic = await Clinic.findOne({ owner: me._id });
    if (!clinic) {
      return res.status(400).json({
        success: false,
        message: "Clinic not found for this user",
      });
    }
    clinicId = clinic._id;
  } else if (me.role === "agent") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "Agent not tied to a clinic" });
    }
    clinicId = me.clinicId;
  } else if (me.role === "doctor" || me.role === "doctorStaff") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor/Staff not tied to a clinic" });
    }
    clinicId = me.clinicId;
  } else if (me.role === "admin") {
    clinicId = req.body.clinicId;
    if (!clinicId) {
      return res.status(400).json({
        success: false,
        message: "clinicId is required for admin",
      });
    }
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  let {
    conversationId,
    recipientIds = [],
    channel = "email",
    subject,
    preheader,
    content,
    mediaUrl,
    mediaType,
    source,
    providerId,
    attachments,
    replyToMessageId, // it is MongodbMsg _id on that reply
    quotedMessageId, // it is reply msg id of provider
    threadId, // for keep email in same group if you reply
    signature,
    cc,
    bcc,
    ...rest
  } = req.body;

  const scheduledDate = rest.scheduledDate;
  const scheduledTime = rest.scheduledTime;
  const scheduledTimezone = rest.scheduledTimezone;

  if (!scheduledDate || !scheduledTime || !scheduledTimezone) {
    return res.status(400).json({
      success: false,
      message: "Schedule date or schedule time or timezone is required",
    });
  }

  if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one recipientId is required",
    });
  }

  if (!providerId) {
    return res.status(400).json({
      success: false,
      message: "Provider is required",
    });
  }

  try {
    let lastMessageId = "";
    if (recipientIds?.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one recipientId is required",
      });
    }

    const recipientId = recipientIds[0];
    let toEmails = [];
    for (const rId of recipientIds) {
      const lead = await Lead.findById(rId).select("email");
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: "Lead not found",
        });
      }
      if (lead.email) {
        toEmails.push(lead.email);
      }
    }
    toEmails = [...new Set(toEmails)]; // remove duplicate emails

    console.log({ toEmails, recipientIds });

    const clinic = await Clinic.findById(clinicId);
    let conversation = await Conversation.findById(conversationId);
    if (req.body.leadId) {
      conversation = await Conversation.findOne({
        leadId: req.body.leadId,
        clinicId,
      });
      conversationId = conversation._id;
    }

    // If i want to send message to patient
    if (req.body.patientId) {
      const patient = await PatientRegistration.findById(req.body.patientId);
      // console.log({ patient });
      if (patient && patient.leadId) {
        recipientId = patient.leadId;
        conversation = await Conversation.findOne({
          leadId: patient.leadId,
          clinicId,
        });
        if (!conversation) {
          conversation = new Conversation({
            leadId: patient.leadId,
            clinicId,
            ownerId: me._id,
          });
          await conversation.save();
        }
      } else if (patient) {
        const lead = new Lead({
          clinicId,
          name: `${patient.firstName} ${patient.lastName}`,
          phone: patient.mobileNumber,
          email: patient.email,
          gender: patient.gender,
          source: "Other",
          patientId: patient._id,
        });
        patient.leadId = lead._id;
        await Promise.all([patient.save(), lead.save()]);
        recipientId = lead._id;
        conversation = await Conversation.findOne({
          leadId: lead._id,
          clinicId,
        });
        if (!conversation) {
          conversation = new Conversation({
            leadId: lead._id,
            clinicId,
            ownerId: me._id,
          });
          await conversation.save();
        }
      }
    }

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }
    if (!providerId) {
      return res.status(404).json({
        success: false,
        message: "Provider is required",
      });
    }

    let provider = await Provider.findById(providerId);
    const lead = await Lead.findById(recipientId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }
    const leadId = conversation.leadId;

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    const senderId = me._id;
    const messageType = "conversational";
    const direction = "outgoing";

    const leadPayload = await getLeadDetails(lead?._id);
    const systemPayload = getSystemDetails();

    if (signature) {
      // add signature at the end of content
      content = `${content}<br>${signature}`;
      content = content
        ?.replace(/<p><br><\/p>/g, "<br>")
        .replace(/<p>/g, "")
        .replace(/<\/p>/g, "<br>");
    }
    subject = replaceVariableInString(subject, "lead", leadPayload);
    content = replaceVariableInString(content, "lead", leadPayload);
    subject = replaceVariableInString(subject, "system", systemPayload);
    content = replaceVariableInString(content, "system", systemPayload);

    // Validate email before sending
    const toEmail = lead.email;
    const isValidToEmail = validateEmail(toEmail);

    const newMessage = new Message({
      clinicId,
      conversationId: conversation._id,
      leadId,
      senderId,
      recipientId,
      channel,
      messageType: "conversational",
      direction: "outgoing",
      subject,
      preheader,
      content,
      source,
      status: "sending",
      provider: providerId,
      attachments,
      mediaType: attachments?.length > 0 ? attachments[0]?.mediaType : "",
      mediaUrl: attachments?.length > 0 ? attachments[0]?.mediaUrl : "",
      replyToMessageId,
      ...(cc && { cc }),
      ...(bcc && { bcc }),

      ...(scheduledDate && scheduledTime && scheduledTimezone
        ? {
            schedule: {
              date: scheduledDate,
              time: scheduledTime,
              timezone: scheduledTimezone,
            },
          }
        : {}),
    });

    lastMessageId = newMessage?._id;

    // assign this message as a recentMessage
    conversation.recentMessage = newMessage._id;

    await newMessage.save();

    // make tracking content
    // campaign content
    const openTrackUrl = `https://zeva360.com/api/email/track/open?emailId=${newMessage?._id}`;
    const unsubscribeLink = `https://zeva360.com/unsubscribe/${
      lead?._id
    }/${encodeURIComponent(provider?.email)}/${encodeURIComponent(
      toEmail,
    )}?emailId=${newMessage?._id}`;

    const sanitizedContent = replaceUrlsWithTrackingUrlsInContent(
      content,
      newMessage?._id,
    );

    const htmlContent = `<div>${
      preheader
        ? `<div style="display:none;visibility:hidden;">${preheader}</div>`
        : ""
    }${sanitizedContent}<img src="${openTrackUrl}" width="1" height="1" style="display:none;" alt="tracking pixel"/></div>`;

    // Handle email sending logic
    let emailSent = false;
    let msgData = {};
    try {
      const replyToMsg = await Message.findById(replyToMessageId).select(
        "threadId providerMessageId",
      );

      if (provider?.emailProviderType === "gmail" && isValidToEmail) {
        let senderName = `${me?.name}`;
        if (provider.label && !validateEmail(provider.label)) {
          senderName = provider.label;
        }

        msgData = {
          providerId: provider._id,
          to: toEmails,
          from: provider.email,
          senderName: senderName,
          subject,
          content: htmlContent,
          attachments, // You can add attachments here
          originalMessageId: quotedMessageId || replyToMsg?.providerMessageId,
          threadId: replyToMsg ? replyToMsg?.threadId : "",
          emailProviderType: "gmail",
          messageId: newMessage?._id,
          channel: "email",
        };
      } else if (provider?.emailProviderType === "other" && isValidToEmail) {
        let senderName = `${me?.name}`;
        if (provider.label && !validateEmail(provider.label)) {
          senderName = provider.label;
        }

        msgData = {
          providerId: provider._id,
          to: toEmails,
          from: provider.email,
          senderName,
          subject,
          content: htmlContent,
          attachments, // You can add attachments here
          originalMessageId: quotedMessageId || replyToMsg?.providerMessageId,
          cc,
          bcc,
          emailProviderType: "other",
          messageId: newMessage?._id,
          channel: "email",
        };
      }
      //       else if (provider?.emailProviderType === "amazon" && isValidToEmail) {
      //     let senderName = `${user?.firstName} ${user?.lastName}`;
      //     if (provider.label && !validateEmail(provider.label)) {
      //       senderName = provider.label;
      //     }
      //     const emailResponse = await sendEmailByAwsSesMultiple({
      //       fromEmail: provider?.email,
      //       senderName,
      //       toEmails: toEmails,
      //       subject,
      //       bodyText: "",
      //       bodyHtml: htmlContent,
      //     });

      //     if (emailResponse) {
      //       emailSent = true;
      //       console.log(`Email sent to ${toEmail}`);
      //     } else {
      //       console.error(`Failed to send email to ${toEmail}`);
      //     }
      //   }
    } catch (emailError) {
      console.error(`Error sending email to ${toEmail}:`, emailError.message);
    }

    const delay = calculateBullMQDelay(
      scheduledDate,
      scheduledTime,
      scheduledTimezone,
    );

    // console.log("Scheduled message delay in ms: ", { delay });

    const scheduledJob = await scheduleMessageQueue.add(
      "schedule-message",
      {
        msgData,
      },
      {
        delay: delay > 0 ? delay : 0,
      },
    );

    // if scheduled successfully then update message status
    if (scheduledJob) {
      newMessage.status = "scheduled";
    }

    // TODO: Create activity log for message send
    await Promise.all([newMessage.save(), conversation.save()]);

    const findMessage = await Message.findById(newMessage._id)
      .populate("senderId", "name email phone")
      .populate("recipientId", "name email phone")
      //   .populate("provider", "name label email phone")
      .populate({
        path: "replyToMessageId",
        select: "content mediaType mediaUrl channel direction", // Fields of the reply message
        populate: [
          {
            path: "senderId",
            select: "name email phone", // Specific fields of sender in the reply
          },
          {
            path: "recipientId",
            select: "name email phone", // Specific fields of recipient in the reply
          },
        ],
      });

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: findMessage,
    });
  } catch (err) {
    // console.error("Error in send message:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
