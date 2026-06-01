import dbConnect from "../../../lib/database";
import Chat from "../../../models/Chat";
import PrescriptionRequest from "../../../models/PrescriptionRequest";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "GET") {
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

    const { prescriptionRequestId } = req.query;

    if (!prescriptionRequestId) {
      return res
        .status(400)
        .json({ message: "Prescription request ID is required" });
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

    // Find chat
    const chat = await Chat.findOne({
      prescriptionRequest: prescriptionRequestId,
    })
      .populate("messages.sender", "name")
      .populate("user", "name")
      .populate("doctor", "name")
      .populate("prescriptionRequest");

    if (!chat) {
      return res.status(200).json({
        success: true,
        data: {
          chat: null,
          prescriptionRequest: prescriptionRequest,
        },
      });
    }

    // Mark messages as read for the other party
    const updateQuery = {};
    if (role === "user") {
      updateQuery["messages.isRead"] = true;
      updateQuery["messages.senderRole"] = "doctor";
    } else {
      updateQuery["messages.isRead"] = true;
      updateQuery["messages.senderRole"] = "user";
    }

    await Chat.updateMany(
      { _id: chat._id, ...updateQuery },
      { $set: { "messages.$[].isRead": true } }
    );

    res.status(200).json({
      success: true,
      data: {
        chat: chat,
        prescriptionRequest: prescriptionRequest,
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
