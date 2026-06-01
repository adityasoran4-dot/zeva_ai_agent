import User from "../../../models/Users";
import Message from "../../../models/Message";
import Provider from "../../../models/Provider";
import Template from "../../../models/Template";
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import Conversation from "../../../models/Conversation";
import { getWhatsappMediaUrl } from "../../../services/whatsapp";
import {
  emitIncomingMessageToUser,
  emitMessageStatusUpdateToUser,
} from "../../../services/socket-emitter";
import {
  executeWorkflows,
  WORKFLOW_ENTITY_TYPE,
  WORKFLOW_TRIGGER_TYPE,
} from "../../../bullmq/workflow";
import Campaign from "../../../models/Campaign";

// Utility: normalize phone number by removing leading + and non-digit chars
const getWithoutPlusNumber = (num) => {
  if (num === undefined || num === null) return "";
  const s = String(num).trim();
  // remove leading '+' then strip any non-digit characters
  return s.replace(/^\+/, "").replace(/\D/g, "");
};

export default async function handler(req, res) {
  // 🔐 Webhook verification
  if (req.method === "GET") {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log({
      mode,
      token,
      challenge,
      VERIFY_TOKEN,
    });

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }

  // 📩 Webhook events
  if (req.method === "POST") {
    res.status(200).json({ success: true });
    processWhatsAppWebhook(req); // IMPORTANT
    return;
  }

  return res.status(405).json({ message: "Method not allowed" });
}

const processWhatsAppWebhook = async (req) => {
  // ensure mongoose connection is established before using models
  try {
    await dbConnect();
  } catch (err) {
    console.error("Failed to connect to DB in WhatsApp webhook:", err);
    return;
  }
  // Process the WhatsApp webhook data here
  console.log("Processing WhatsApp webhook data:", req.body);
  try {
    const entry = req.body.entry && req.body.entry[0];
    if (!entry) {
      console.warn("No entry found in WhatsApp webhook payload");
      return;
    }
    const change = entry?.changes?.[0];
    if (!change) {
      console.warn("No changes found in WhatsApp webhook payload");
      return;
    }
    console.log("WhatsApp Webhook Change:", JSON.stringify(change));
    // Further processing logic can be added here

    // For whatsapp template status updates
    if (change.field === "message_template_status_update") {
      const { message_template_id, event } = change?.value;
      console.log({ message_template_id, event });
      // Handle template status updates here
      const updatedTempplate = await Template.findOneAndUpdate(
        { templateId: message_template_id },
        { status: event?.toLowerCase() },
        { new: true },
      );

      if (updatedTempplate) {
        console.log(
          `Template ${updatedTempplate.name} status updated to ${event}`,
        );
      } else {
        console.warn(
          `No template found with templateId: ${message_template_id}`,
        );
      }
    } else if (change.field === "messages") {
      // For whatsapp outgoing message status updates
      const statusData = change?.value?.statuses || [];
      for (let i = 0; i < statusData.length; i++) {
        const item = statusData[i];
        const { id, status } = statusData[i];
        const errorCode = (item?.errors && item.errors[0]?.code) || "";
        const errorMessage = (item?.errors && item.errors[0]?.message) || "";
        const message = await Message.findOne({ providerMessageId: id });
        if (message) {
          message.status = status;
          message.errorCode = errorCode;
          message.errorMessage = errorMessage;
          await message.save();
          console.log(`Message ${id} status updated to ${status}`);

          // Emit status update to user via socket
          const userId = message?.senderId?.toString();
          await emitMessageStatusUpdateToUser(userId, message);
        }
        if (message.campaignId) {
          const campaign = await Campaign.findById(message.campaignId);
          if (status === "delivered") {
            campaign.deliveredMessages += 1;
          } else if (status === "failed") {
            campaign.failedMessages += 1;
          } else if (status === "read") {
            campaign.readMessages += 1;
          }

          await campaign.save();
        }
      }
    }

    //TODO: For handling incoming whatsapp messages
    if (change.field === "messages" && change?.value?.messages?.length > 0) {
      const messages = change?.value?.messages || [];
      const metadata = change?.value?.metadata || {};
      const whatsappPhoneId = metadata.phone_number_id; // It is provider number now check which provider it is linked to
      const provider = await Provider.findOne({
        phone: whatsappPhoneId,
      }).sort({ createdAt: -1 });
      const userId = provider?.userId?.toString();
      console.log({ whatsappPhoneId, provider });
      console.log({ m: JSON.stringify(messages) });
      if (!provider) {
        console.warn(
          `No provider found for phone number id: ${whatsappPhoneId}`,
        );
        return;
      }

      const clinicId = provider.clinicId;
      let leadName =
        change.value.contacts?.length > 0
          ? change.value.contacts[0].profile.name
          : "";

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        // OUTGOING MESSAGE STATUS ko ignore karne ke liye
        if (message.status) {
          console.log("Ignoring Outgoing Message Status:", message.status);
          continue;
        }

        // ✅ INCOMING MESSAGE FILTER
        if (message.from && !message.status) {
          const from = message.from;
          const withoutPlusFromNumber = getWithoutPlusNumber(from);
          let findLead = await Lead.findOne({
            clinicId,
            phone: { $in: [withoutPlusFromNumber, from] },
          });

          if (message.type === "reaction") {
            // Find the message that was reacted to
            const findMessage = await Message.findOne({
              providerMessageId: message?.reaction?.message_id,
            });

            if (findMessage) {
              // Check if this lead already reacted to this message
              const existingEmojiIndex = findMessage.emojis?.findIndex(
                (e) => e?.lead?.toString() === findLead?._id?.toString(),
              );

              const reactionEmoji = message?.reaction?.emoji;

              // If emoji is empty string, it means reaction was removed
              if (reactionEmoji === "") {
                // Remove the lead's reaction if it exists
                if (existingEmojiIndex > -1) {
                  findMessage.emojis.splice(existingEmojiIndex, 1);
                }
              } else {
                if (existingEmojiIndex > -1) {
                  // Update existing reaction
                  findMessage.emojis[existingEmojiIndex].emoji = reactionEmoji;
                  findMessage.emojis[existingEmojiIndex].addedAt = new Date();
                } else {
                  // Add new reaction
                  findMessage.emojis.push({
                    emoji: reactionEmoji,
                    lead: findLead?._id,
                    addedAt: new Date(),
                  });
                }
              }

              // Update the single emoji field (for backward compatibility)
              // Find if there's any emoji from leads
              const leadReaction = findMessage.emojis.find((e) => e.lead);
              findMessage.emoji = leadReaction?.emoji || "";

              await findMessage.save();
              continue;
            }
          }

          if (!findLead) {
            // console.log(`Lead not found for number: ${from}`);
            if (!leadName) leadName = from;
            let nameParts = leadName?.split(" ");
            let firstName = nameParts?.length > 0 ? nameParts[0] : "";
            let lastName = nameParts?.length > 1 ? nameParts[1] : "";
            findLead = new Lead({
              clinicId,
              name: leadName,
              phone: from,
              status: "New",
              source: "WhatsApp",
            });
            await findLead.save();
          }

          let conversation = await Conversation.findOne({
            clinicId,
            leadId: findLead?._id,
          });
          if (!conversation) {
            let query = {
              role: "agent",
              isApproved: true,
              clinicId: clinicId,
            };

            // Get eligible users
            const users = await User.find(query);

            let ownerId = null;

            // Random conversation assignment
            if (users.length > 0) {
              // Generate random index
              const randomIndex = Math.floor(Math.random() * users.length);
              const randomUser = users[randomIndex];
              ownerId = randomUser._id;

              console.log(
                `Randomly assigned to user: ${randomUser.name} (${randomUser.role}) - ID: ${randomUser._id}`,
              );
            } else {
              console.log("No eligible users found for assignment");
              // You might want to handle this case differently
              // e.g., assign to clinic admin or leave unassigned
            }

            // Create new conversation
            conversation = new Conversation({
              clinicId,
              leadId: findLead?._id,
              ownerId, // This will be null if no users found
            });

            await conversation.save();
            console.log(`Created new conversation: ${conversation._id}`);
          }

          let mediaType = "";
          let mediaUrl = "";
          let caption = "";
          const accessToken = provider?.secrets?.whatsappAccessToken;
          if (message.type === "image") {
            const mediaId = message?.image?.id;
            caption = message?.image?.caption;
            console.log({ accessToken, mediaId });
            {
              const res = await getWhatsappMediaUrl(mediaId, accessToken);
              if (typeof res === "string") {
                mediaUrl = res;
              } else if (res && res.url) {
                mediaUrl = res.url;
                // store filename for later when creating message
                message._fetchedFilename = res.filename;
              }
            }
            mediaType = "image";
          } else if (message.type === "video") {
            const mediaId = message?.video?.id;
            caption = message?.video?.caption;
            // console.log({ accessToken, mediaId });
            {
              const res = await getWhatsappMediaUrl(mediaId, accessToken);
              if (typeof res === "string") {
                mediaUrl = res;
              } else if (res && res.url) {
                mediaUrl = res.url;
                message._fetchedFilename = res.filename;
              }
            }
            mediaType = "video";
          } else if (message.type === "sticker") {
            // Handle sticker messages (often webp images, may have url or id)
            const mediaId = message?.sticker?.id;
            // // some webhook payloads already include a direct url
            // if (message?.sticker?.url) {
            //   mediaUrl = message.sticker.url;
            // }
            // attempt to fetch via API if mediaId present
            if (mediaId) {
              const res = await getWhatsappMediaUrl(mediaId, accessToken);
              console.log({ res });
              if (typeof res === "string") {
                mediaUrl = res;
              } else if (res && res.url) {
                mediaUrl = res.url;
                message._fetchedFilename = res.filename;
              }
            }
            mediaType = "image"; // treat sticker as an image for downstream
          } else if (message.type === "document") {
            const mediaId = message?.document?.id;
            caption = message?.document?.caption;
            // console.log({ accessToken, mediaId });
            {
              const res = await getWhatsappMediaUrl(mediaId, accessToken);
              if (typeof res === "string") {
                mediaUrl = res;
              } else if (res && res.url) {
                mediaUrl = res.url;
                message._fetchedFilename = res.filename;
              }
            }
            mediaType = "document";
          }
          // Handle location messages
          let locationMetadata = null;
          if (message.type === "location" && message.location) {
            const locLat = message.location.latitude;
            const locLng = message.location.longitude;
            let locName = message.location.name || "";
            let locAddress = message.location.address || "";

            // Reverse geocode if name/address are missing
            if (!locName || !locAddress) {
              try {
                const geoRes = await fetch(
                  `https://maps.googleapis.com/maps/api/geocode/json?latlng=${locLat},${locLng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
                );
                const geoData = await geoRes.json();
                if (geoData.status === "OK" && geoData.results?.length > 0) {
                  const result = geoData.results[0];
                  if (!locAddress) locAddress = result.formatted_address || "";
                  if (!locName) {
                    // Use the most specific component as name
                    const poi = geoData.results.find((r) =>
                      r.types?.some((t) =>
                        [
                          "point_of_interest",
                          "establishment",
                          "premise",
                        ].includes(t),
                      ),
                    );
                    locName = poi
                      ? poi.formatted_address?.split(",")[0] || ""
                      : result.formatted_address?.split(",")[0] || "";
                  }
                }
              } catch (geoErr) {
                console.error("Reverse geocoding failed:", geoErr);
              }
            }

            locationMetadata = {
              type: "location",
              latitude: locLat,
              longitude: locLng,
              name: locName,
              address: locAddress,
            };
          }

          console.log({ mediaType, mediaUrl, locationMetadata });

          let replyToMessageId = null;
          if (message?.context?.id) {
            const repliedMessage = await Message.findOne({
              providerMessageId: message?.context?.id,
            });
            if (repliedMessage) {
              replyToMessageId = repliedMessage?._id;
            }
          }

          const newMessage = new Message({
            clinicId,
            conversationId: conversation?._id,
            contactId: findLead?._id,
            provider: provider?._id,
            channel: "whatsapp",
            messageType: "conversational",
            senderId: userId,
            recipientId: findLead?._id,
            direction: "incoming",
            content:
              message.text?.body ||
              caption ||
              message?.button?.text ||
              (locationMetadata
                ? `📍 ${locationMetadata.name || locationMetadata.address || "Location"}`
                : ""),
            status: "received",
            source: "Zeva",
            providerMessageId: message.id, // whatsapp message id  like "wamid.HBXXXXXXXXXX"
            replyToMessageId,
            mediaType,
            mediaUrl,
            fileName: message._fetchedFilename || undefined,
            ...(locationMetadata && { metadata: locationMetadata }),
          });
          conversation.recentMessage = newMessage?._id;
          conversation.unreadMessages.push(newMessage?._id);

          await Promise.all([newMessage.save(), conversation.save()]);

          // const receiverSocketId = getReceiverSocketId(userId);
          // if (receiverSocketId) {
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

          await emitIncomingMessageToUser(userId, findMessage);
          //   // it is used to send event to specific client
          //   io.to(receiverSocketId).emit("incomingMessage", findMessage);

          //   // send notification to client side in real time using socket
          //   io.to(receiverSocketId).emit("newNotification", newNotification);
          // }

          // // incoming whatsapp message email notification
          // if (findContact) {
          //   const setting = await Setting.findOne({ teamId });
          //   const isIncomingMsgNotification =
          //     setting?.notification?.incomingMessage;
          //   const isRecipientConversationOwner =
          //     setting?.notification?.recipients?.conversationOwner;
          //   const isRecipientRecordOwner =
          //     setting?.notification?.recipients?.recordOwner;
          //   const isRecipientProviderOwner =
          //     setting?.notification?.recipients?.providerOwner;
          //   const isRecipientAll = setting?.notification?.recipients?.allUsers;

          //   if (isIncomingMsgNotification) {
          //     let recipientEmails = [];

          //     if (isRecipientConversationOwner || isRecipientAll) {
          //       const recipientOfNotification = await User.findById(
          //         conversation?.userId
          //       );
          //       if (recipientOfNotification?.email) {
          //         recipientEmails.push(recipientOfNotification.email);
          //       }
          //     }

          //     if (isRecipientRecordOwner || isRecipientAll) {
          //       const recipientOfNotification = await User.findById(
          //         findContact?.userId
          //       );
          //       if (recipientOfNotification?.email) {
          //         recipientEmails.push(recipientOfNotification.email);
          //       }
          //     }

          //     if (isRecipientProviderOwner || isRecipientAll) {
          //       const recipientOfNotification = await User.findById(
          //         provider?.userId
          //       );
          //       if (recipientOfNotification?.email) {
          //         recipientEmails.push(recipientOfNotification.email);
          //       }
          //     }

          //     // Remove duplicate emails (in case of overlap)
          //     recipientEmails = [...new Set(recipientEmails)];

          //     if (recipientEmails.length > 0) {
          //       const senderName =
          //         findContact?.name || findContact?.phoneNumber;
          //       const messageContent = newMessage?.content;
          //       const viewMessageLink = `${config.CLIENT_URL}/conversations`;
          //       const branding = await getBrandingLogoAndName(
          //         newMessage.userId
          //       );
          //       const htmlBody = getHtmlBodyForIncomingMessage(
          //         senderName,
          //         messageContent,
          //         viewMessageLink,
          //         branding.logo,
          //         branding.name
          //       );
          //       const text = "New Message";
          //       const subject = `New message from ${senderName}`;

          //       // Send email to all recipients
          //       for (const toEmail of recipientEmails) {
          //         sendEmailBySendgrid(
          //           toEmail,
          //           subject,
          //           text,
          //           htmlBody,
          //           branding.name
          //         );
          //       }
          //     }
          //   }
          // }

          // // update consent of contact optout
          // updateConsentOptoutOfContact(
          //   teamId,
          //   findContact?._id,
          //   newMessage?._id,
          //   provider?.phone
          // );

          // // update consent of contact optIn
          // updateConsentOptInOfContact(
          //   teamId,
          //   findContact?._id,
          //   newMessage?._id,
          //   provider?.phone
          // );

          // check consent for help keyword
          // updateConsentHelpOfContact(teamId, newMessage?._id);

          // Note: Execute workflow for the incoming message
          executeWorkflows({
            entity: WORKFLOW_ENTITY_TYPE.MESSAGE,
            trigger: WORKFLOW_TRIGGER_TYPE.INCOMING_MESSAGE,
            leadId: findLead._id?.toString(),
            clinicId: findLead.clinicId?.toString(),
            channel: "whatsapp",
            providerId: provider._id?.toString(),
            messageId: newMessage._id?.toString(),
            conversationId: conversation._id?.toString(),
          });
        }
      }
    }
  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);
  }
};
