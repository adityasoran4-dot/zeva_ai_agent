import dbConnect from "../../../lib/database";
import Chat from "../../../models/Chat";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "DELETE") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { role, userId } = decoded;

    if (!["user", "doctor"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const { chatId, messageId } = req.body;
    if (!chatId || !messageId) {
      return res.status(400).json({ success: false, error: "ChatId and messageId required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, error: "Chat not found" });
    }

    const message = chat.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: "Message not found" });
    }

    // ✅ Ownership check
    const isDoctor = chat.doctor.toString() === userId;
    // const isUser = chat.user.toString() === userId;

    if (message.sender.toString() !== userId && !isDoctor) {
      return res.status(403).json({ success: false, error: "Not authorized to delete this message" });
    }

    // ✅ Delete the message
    chat.messages.pull(messageId);
    await chat.save();

    // ✅ Populate doctor & user if needed (so frontend has consistent data)
    await chat.populate("user", "name");
    await chat.populate("doctor", "name");

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      data: { chat }, // 👈 return updated chat object
    });

  } catch (error) {
    console.error("Delete message error:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}
