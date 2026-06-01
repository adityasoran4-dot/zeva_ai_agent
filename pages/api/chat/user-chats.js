import dbConnect from "../../../lib/database";
import Chat from "../../../models/Chat";
import "../../../models/PrescriptionRequest";
import "../../../models/DoctorProfile";
import mongoose from "mongoose";
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

    if (role !== "user") {
      return res
        .status(403)
        .json({ message: "Only users can view their chat history" });
    }

    const chats = await Chat.find({ user: userId, isActive: true })
      .populate("doctor", "_id name email")
      .populate("prescriptionRequest", "healthIssue status createdAt")
      .populate("messages.sender", "name")
      .sort({ lastMessage: -1 });

    // Find DoctorProfile for each doctor and add the profile ID
    const chatsWithDoctorProfile = await Promise.all(
      chats.map(async (chat) => {
        const doctorProfile = await mongoose
          .model("DoctorProfile")
          .findOne({ user: chat.doctor._id })
          .select("_id");
        return {
          ...chat.toObject(),
          doctor: {
            ...chat.doctor.toObject(),
            doctorProfileId: doctorProfile?._id || null,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: chatsWithDoctorProfile,
    });
  } catch (error) {
    console.error("Get user chats error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
