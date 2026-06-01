import dbConnect from "../../../lib/database";
import Chat from "../../../models/Chat";
import PrescriptionRequest from "../../../models/PrescriptionRequest";
import Notification from "../../../models/Notification";
import { emitNotificationToUser } from "../push-notification/socketio";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { role, userId } = decoded;

    if (!["user", "doctor"].includes(role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const {
      prescriptionRequestId,
      content,
      messageType = "text",
      prescription,
    } = req.body;

    if (!prescriptionRequestId || !content) {
      return res
        .status(400)
        .json({ message: "Prescription request ID and content are required" });
    }

    // Verify the prescription request exists and user has access
    const prescriptionRequest = await PrescriptionRequest.findById(
      prescriptionRequestId
    );
    if (!prescriptionRequest) {
      return res
        .status(404)
        .json({ message: "Prescription request not found" });
    }

    // Check if user has access to this chat
    if (role === "user" && prescriptionRequest.user.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (role === "doctor" && prescriptionRequest.doctor.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find or create chat
    let chat = await Chat.findOne({
      prescriptionRequest: prescriptionRequestId,
    });

    if (!chat) {
      chat = await Chat.create({
        user: prescriptionRequest.user,
        doctor: prescriptionRequest.doctor,
        prescriptionRequest: prescriptionRequestId,
        messages: [],
      });
    }

    // Create message
    const message = {
      sender: userId,
      senderRole: role,
      content,
      messageType,
      prescription: prescription || null,
      timestamp: new Date(),
      isRead: false,
    };

    // Add message to chat
    chat.messages.push(message);
    chat.lastMessage = new Date();
    await chat.save();

    // Update prescription request status if doctor sends prescription
    if (role === "doctor" && messageType === "prescription") {
      await PrescriptionRequest.findByIdAndUpdate(prescriptionRequestId, {
        status: "completed",
        prescription,
        prescriptionDate: new Date(),
      });
    } else if (role === "doctor" && chat.messages.length === 1) {
      // First message from doctor, update status to in_progress
      await PrescriptionRequest.findByIdAndUpdate(prescriptionRequestId, {
        status: "in_progress",
      });
    }

    // Populate sender info
    await chat.populate("messages.sender", "name");
    await chat.populate("user", "name");
    await chat.populate("doctor", "name");

    // Determine recipient and build notification
    const recipientUserId =
      role === "doctor" ? prescriptionRequest.user : prescriptionRequest.doctor;
    const notifType =
      messageType === "prescription" ? "prescription" : "chat-message";
    const notifMsg =
      messageType === "prescription"
        ? `You have received a new prescription from Dr. ${
            chat.doctor?.name || "Doctor"
          }`
        : `New message from ${
            role === "doctor"
              ? `Dr. ${chat.doctor?.name || "Doctor"}`
              : chat.user?.name || "User"
          }`;

    const notification = await Notification.create({
      user: recipientUserId,
      message: notifMsg,
      type: notifType,
      relatedChat: chat._id,
      relatedPrescriptionRequest: prescriptionRequestId,
    });

    // Emit realtime notification
    emitNotificationToUser(recipientUserId.toString(), {
      _id: notification._id,
      message: notification.message,
      createdAt: notification.createdAt,
      isRead: false,
      type: notification.type,
      relatedChat: chat._id,
      relatedPrescriptionRequest: prescriptionRequestId,
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: {
        chat: chat,
        newMessage: message,
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
