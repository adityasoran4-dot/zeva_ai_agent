// /pages/api/chat/mark-messages-read.js
import dbConnect from "../../../lib/database";
import Chat from "../../../models/Chat";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const {role} = decoded;
    if (!["user", "doctor"].includes(role)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { prescriptionRequestId } = req.body;
    if (!prescriptionRequestId) {
      return res.status(400).json({ success: false, message: "Missing prescriptionRequestId" });
    }

    const chat = await Chat.findOne({ prescriptionRequest: prescriptionRequestId });
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    let updated = false;
    chat.messages.forEach((msg) => {
      // Mark as read if not sent by the current user
      if (
        ((role === "doctor" && msg.senderRole === "user") ||
         (role === "user" && msg.senderRole === "doctor")) &&
        !msg.isRead
      ) {
        msg.isRead = true;
        updated = true;
      }
    });

    if (updated) {
      await chat.save();
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("mark-messages-read error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
}