import { getUserFromReq, requireRole } from "../lead-ms/auth";
import Clinic from "../../../models/Clinic";
import Conversation from "../../../models/Conversation";
import dbConnect from "../../../lib/database";
import Provider from "../../../models/Provider";
import Lead from "../../../models/Lead";
import Message from "../../../models/Message";
import Template from "../../../models/Template";
import { handleWhatsappSendMessage } from "../../../services/whatsapp";
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

  if (!requireRole(me, ["clinic", "agent", "admin", "doctor"])) {
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
  } else if (me.role === "doctor") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor not tied to a clinic" });
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
    recipientId,
    channel,
    content,
    mediaUrl,
    mediaType,
    source,
    providerId,
    replyToMessageId,
    quotedMessageId,
    headerParameters = [],
    bodyParameters = [],
    isWhatsappCallRequest = false,
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

  // console.log("Schedule Message data: ", {
  //   scheduledDate,
  //   scheduledTime,
  //   scheduledTimezone,
  // });

  try {
    let conversation = await Conversation.findById(conversationId);
    if (req.body.contactId) {
      conversation = await Conversation.findOne({
        leadId: req.body.leadId,
        clinicId,
      });
      conversationId = conversation._id;
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
    const leadId = conversation.leadId;

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    const senderId = me._id;
    const lead = await Lead.findById(conversation.leadId);
    const messageType = "conversational";
    const direction = "outgoing";

    // TODO: Replace field mapping here with a more flexible solution
    // bodyParameters = replaceFieldMappingParams(
    //   bodyParameters,
    //   contact?.additionalFields,
    //   "contact"
    // );
    // headerParameters = replaceFieldMappingParams(
    //   headerParameters,
    //   contact?.additionalFields,
    //   "contact"
    // );

    const newMessage = new Message({
      clinicId,
      conversationId,
      leadId,
      senderId,
      recipientId,
      channel,
      messageType,
      direction,
      content,
      mediaUrl,
      mediaType,
      source,
      status: "sending",
      provider: providerId,
      replyToMessageId, // it can be null or message id in case of whatsapp reply
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

    // assign this message as a recentMessage
    conversation.recentMessage = newMessage._id;

    await newMessage.save();

    // TODO: check status is optOut or not

    // TODO: Send message via provider integration if Opt-In
    let toPhoneNumber = lead?.phone;
    let msgData;
    let resData;
    if (channel === "sms") {
      msgData = {
        to: toPhoneNumber,
        from: channel === "email" ? provider?.email : provider?.phone,
        msg: content,
        channel: "sms",
        type: messageType,
        clientMessageId: newMessage._id,
        // StatusCallback: `${config.SERVER_URL}/api/messageStatusCallback?messageId=${newMessage._id}`,
        credentials: {
          account_sid: provider?.secrets?.accountSid,
          auth_token: provider?.secrets?.accountToken,
          msgServiceId: provider?.secrets?.messagingServiceId,
        },
        mediaUrl,
      };
      //   resData = await handleSmsSendMessage(msgData);
    } else if (channel === "whatsapp") {
      const accessToken = provider?.secrets?.whatsappAccessToken;
      const phoneNumberId = provider?.phone;
      if (!accessToken || !phoneNumberId) {
        return res.status(400).json({
          success: false,
          message: "Provider details not found",
        });
      }

      const templateId = rest.templateId;
      // console.log({ replyToMessageId, quotedMessageId });
      if (replyToMessageId) {
        const replyToMsg = await Message.findById(replyToMessageId);
        quotedMessageId = quotedMessageId || replyToMsg.providerMessageId;
      }
      if (!templateId) {
        msgData = {
          channel: "whatsapp",
          to: toPhoneNumber,
          type: "conversational",
          msg: content,
          caption: content,
          ...(mediaType && { mediaType: mediaType || "" }),
          ...(mediaUrl && { mediaUrl: mediaUrl || "" }),
          clientMessageId: newMessage?._id, // Optional: Your message tracking ID
          //   StatusCallback: `${config?.SERVER_URL}/api/webhook/whatsapp`, // Optional: Your status callback URL
          credentials: {
            accessToken,
            phoneNumberId,
          },
          ...(quotedMessageId && { quotedMessageId }),
          ...(isWhatsappCallRequest && { isWhatsappCallRequest }),
        };
      } else {
        const template = await Template.findById(templateId);
        msgData = {
          channel: "whatsapp",
          to: toPhoneNumber,
          type: "conversational",
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
          //   StatusCallback: `${config?.SERVER_URL}/api/webhook/whatsapp`, // Optional: Your status callback URL
          credentials: {
            accessToken,
            phoneNumberId,
          },
          ...(quotedMessageId && { quotedMessageId }),
        };
      }

      //   resData = await handleWhatsappSendMessage(msgData);
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

    // // if contact has optOut already then don't send message and define errorCode and errorMessage
    // if (consentStatus === "optOut") {
    //   newMessage.errorCode = "70002"; // Custom error code
    //   newMessage.errorMessage = "Recipient has opted out.";
    // }

    // // define errors and don't call actuall send msg api
    // if (!toPhoneNumber) {
    //   newMessage.errorCode = "70001";
    //   newMessage.errorMessage =
    //     "Recipient phone number is invalid or in an incorrect format.";
    // }

    // TODO: Create activity log for message send
    await Promise.all([newMessage.save(), conversation.save()]);

    const findMessage = await Message.findById(newMessage._id)
      .populate("senderId", "name email phone")
      .populate("recipientId", "name email phone")
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
      message: "Message scheduled successfully",
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
