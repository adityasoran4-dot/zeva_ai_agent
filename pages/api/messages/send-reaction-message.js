import mongoose from "mongoose";
import { getUserFromReq, requireRole } from "../lead-ms/auth";
import Clinic from "../../../models/Clinic";
import Conversation from "../../../models/Conversation";
import dbConnect from "../../../lib/database";
import Provider from "../../../models/Provider";
import Lead from "../../../models/Lead";
import Message from "../../../models/Message";
import Template from "../../../models/Template";
import { handleWhatsappSendMessage } from "../../../services/whatsapp";

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

  let { providerMessageId, messageId, emoji } = req.body;

  // Validate required fields
  if (!providerMessageId || !messageId || !emoji) {
    return res.status(400).json({
      success: false,
      message: "providerMessageId, messageId, emoji are required",
    });
  }

  try {
    const message = await Message.findById(messageId).populate("recipientId");
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Verify message belongs to the user's clinic
    if (message.clinicId.toString() !== clinicId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to react to this message",
      });
    }

    // Get provider details
    const provider = await Provider.findById(message.provider);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    const accessToken = provider?.secrets?.whatsappAccessToken;
    const phoneNumberId = provider?.phone;

    if (!accessToken || !phoneNumberId) {
      return res.status(400).json({
        success: false,
        message: "Provider whatsapp credentials not found",
      });
    }

    // Check if user already reacted to this message
    const existingEmojiIndex = message.emojis.findIndex(
      (e) => e?.user?.toString() === me._id?.toString()
    );

    let updateOperation;

    if (existingEmojiIndex > -1) {
      // User already has a reaction, check if it's the same emoji
      const existingReaction = message.emojis[existingEmojiIndex];

      if (existingReaction.emoji === emoji) {
        // Same emoji clicked again - remove the reaction
        updateOperation = {
          $pull: {
            emojis: {
              $or: [{ user: me._id }, { lead: me._id }],
            },
          },
        };
      } else {
        // Different emoji - update existing reaction
        updateOperation = {
          $set: {
            [`emojis.${existingEmojiIndex}.emoji`]: emoji,
            [`emojis.${existingEmojiIndex}.addedAt`]: new Date(),
          },
        };
      }
    } else {
      // New reaction - add it
      const reactionData = {
        emoji,
        addedAt: new Date(),
      };

      // Determine if sender is user or lead based on message direction
      if (message.direction === "incoming") {
        // For incoming messages, clinic is recipient, so react as user
        reactionData.user = me._id;
      } else if (message.direction === "outgoing") {
        // For outgoing messages, check who sent it
        if (message.senderId?.toString() === me._id?.toString()) {
          reactionData.user = me._id;
        } else if (message.recipientId) {
          reactionData.lead = message.recipientId;
        }
      }

      updateOperation = {
        $push: {
          emojis: reactionData,
        },
      };
    }

    // Send reaction to WhatsApp
    const msgData = {
      channel: "whatsapp",
      type: "reaction",
      to: message?.recipientId?.phone,
      reactedMessageId: providerMessageId,
      emoji: emoji,
      clientMessageId: messageId,
      credentials: {
        accessToken,
        phoneNumberId,
      },
    };

    const whatsappResponse = await handleWhatsappSendMessage(msgData);

    if (whatsappResponse) {
      // Update message with emoji reaction
      const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        updateOperation,
        { new: true }
      );

      // Also update the single emoji field for backward compatibility
      if (updateOperation.$push) {
        await Message.findByIdAndUpdate(messageId, {
          $set: { emoji: emoji },
        });
      } else if (updateOperation.$pull) {
        await Message.findByIdAndUpdate(messageId, {
          $set: { emoji: "" },
        });
      }

      // Populate the updated message
      const populatedMessage = await Message.findById(updatedMessage._id)
        .populate("senderId", "name email phone avatar")
        .populate("recipientId", "name email phone")
        .populate({
          path: "replyToMessageId",
          select: "content mediaType mediaUrl channel direction emoji",
          populate: [
            {
              path: "senderId",
              select: "name email phone avatar",
            },
            {
              path: "recipientId",
              select: "name email phone",
            },
          ],
        })
        .populate("emojis.user", "name email phone avatar")
        .populate("emojis.lead", "name email phone");

      return res.status(200).json({
        success: true,
        message:
          existingEmojiIndex > -1
            ? updateOperation.$pull
              ? "Reaction removed"
              : "Reaction updated"
            : "Reaction added successfully",
        data: populatedMessage,
      });
    } else {
      return res.status(500).json({
        success: false,
        message:
          whatsappResponse?.message || "Failed to send reaction to WhatsApp",
      });
    }
  } catch (err) {
    // console.error("Error in send reaction:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
