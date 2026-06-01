import dbConnect from "../../../lib/database";
import Chat from "../../../models/Chat";
import { getUserFromReq} from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "DELETE") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { chatId, messageId } = req.body;
    if (!chatId || !messageId) {
      return res.status(400).json({ success: false, message: "ChatId and MessageId are required" });
    }

    // Find chat and the message
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    const message = chat.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Ensure only sender can delete
    if (message.sender.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete your own messages" });
    }

    // Remove message
    message.deleteOne();
    await chat.save();

    return res.status(200).json({ success: true, message: "Message deleted", chat });
  } catch (error) {
    // console.error("Error deleting message:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
}