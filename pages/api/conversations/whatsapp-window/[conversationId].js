import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import Message from "../../../../models/Message";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: `${req.method} - Method not allowed` });
  }
  try {
    await dbConnect();

    const me = await getUserFromReq(req);
    if (
      !requireRole(me, [
        "clinic",
        "agent",
        "admin",
        "doctor",
        "doctorStaff",
        "staff",
      ])
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // ✅ Resolve clinicId based on role
    let clinic;
    if (me.role === "clinic") {
      clinic = await Clinic.findOne({ owner: me._id });
    } else if (me.role === "agent") {
      if (!me.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "Agent not linked to any clinic" });
      }
      clinic = await Clinic.findById(me.clinicId);
    } else if (me.role === "doctor") {
      // Doctor uses their clinicId if they have one
      if (!me.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "Doctor not linked to any clinic" });
      }
      clinic = await Clinic.findById(me.clinicId);
    } else if (me.role === "doctorStaff" || me.role === "staff") {
      // DoctorStaff/Staff uses their clinicId if they have one
      if (!me.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "Staff not linked to any clinic" });
      }
      clinic = await Clinic.findById(me.clinicId);
    } else if (me.role === "admin") {
      // Admin can access all leads, but we still need clinicId if provided
      const { clinicId: adminClinicId } = req.query;
      if (adminClinicId) {
        clinic = await Clinic.findById(adminClinicId);
      }
    }

    if (!clinic) {
      return res
        .status(404)
        .json({ success: false, message: "Clinic not found for this user" });
    }

    // ✅TODO: Check permission for reading leads (only for clinic, agent, doctor, and doctorStaff/staff; admin bypasses)
    if (me.role !== "admin" && clinic._id) {
      // For Get Messages Permissions
    }

    try {
      const { conversationId } = req.query;

      // Find the latest incoming WhatsApp message
      const latestIncomingMessage = await Message.findOne({
        clinicId: clinic._id,
        conversationId,
        channel: "whatsapp",
        direction: "incoming",
      })
        .sort({ createdAt: -1 }) // Get the latest message
        .select("createdAt");

      if (!latestIncomingMessage) {
        return res.json({
          success: true,
          canSendMessage: false,
          remainingTime: "00:00",
          message: "No WhatsApp messages found in this conversation.",
        });
      }

      const messageTime = new Date(latestIncomingMessage.createdAt);
      const currentTime = new Date();
      const timeDiffMs = currentTime - messageTime;
      const remainingMs = Math.max(24 * 60 * 60 * 1000 - timeDiffMs, 0); // Remaining time in milliseconds

      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60)); // Convert to hours
      const remainingMinutes = Math.floor(
        (remainingMs % (1000 * 60 * 60)) / (1000 * 60)
      ); // Get minutes

      res.status(200).json({
        success: true,
        canSendMessage: remainingMs > 0,
        remainingTime: `${String(remainingHours).padStart(2, "0")}:${String(
          remainingMinutes
        ).padStart(2, "0")}`, // Proper HH:MM format
        message:
          remainingMs > 0
            ? `You can send a message. ${remainingHours} hours ${remainingMinutes} minutes left.`
            : "24-hour window expired. Only templates allowed.",
      });
    } catch (error) {
      console.error("Error fetching messages of conversation:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch messages of conversation",
      });
    }
  } catch (error) {
    console.error("Get Messages error conversation: ", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
}
