import dbConnect from "../../../lib/database";
import Message from "../../../models/Message";
import Conversation from "../../../models/Conversation";
import { getTokenByPath } from "../../../lib/helper";
import axios from "axios";
import Provider from "../../../models/Provider";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // const token = getTokenByPath(req);
    // if (!token) {
    //   return res.status(401).json({
    //     success: false,
    //     message: "Unauthorized - No token provided",
    //   });
    // }

    const { conversationId, providerId, latitude, longitude, address, name } =
      req.body;

    if (!conversationId || !providerId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Get conversation to get lead info
    const conversation =
      await Conversation.findById(conversationId).populate("leadId");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Send location via Meta WhatsApp Business API
    const leadPhone = conversation.leadId?.phone;

    if (!leadPhone) {
      return res.status(400).json({
        success: false,
        message: "Lead phone number not found",
      });
    }

    // Format phone number (remove any non-digit characters and ensure no '+' sign)
    const formattedPhone = leadPhone.replace(/\D/g, "");

    let provider = await Provider.findById(providerId);
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
        message: "Provider details not found",
      });
    }

    // Meta WhatsApp Business API endpoint
    const metaApiUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

    // Prepare the location payload for Meta API
    const locationPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "location",
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        name: name || "Shared Location",
        address: address || "",
      },
    };

    // Send via Meta WhatsApp Business API
    const response = await axios.post(metaApiUrl, locationPayload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.data || response.data.error) {
      throw new Error(
        response.data?.error?.message || "Failed to send location",
      );
    }

    // Save message to database
    const locationMessage = new Message({
      clinicId: conversation.clinicId,
      conversationId,
      senderId: req.user?._id || conversation.ownerId,
      recipientId: conversation.leadId._id,
      provider: providerId,
      channel: "whatsapp",
      messageType: "conversational",
      direction: "outgoing",
      content: `📍 Location: ${name || "Shared Location"}\n${address || `${latitude}, ${longitude}`}`,
      metadata: {
        type: "location",
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        name: name || "Shared Location",
        address: address || "",
      },
      status: "sent",
      providerMessageId: response.data?.messages?.[0]?.id,
    });

    await locationMessage.save();

    // Update conversation recent message
    conversation.recentMessage = locationMessage._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "Location sent successfully",
      data: locationMessage,
      providerResponse: response.data,
    });
  } catch (error) {
    console.error("Error sending location:", error);

    // Handle specific Meta API errors
    let errorMessage = "Failed to send location";
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.response?.data?.error || error.message,
    });
  }
}
