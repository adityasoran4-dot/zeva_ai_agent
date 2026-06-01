// pages/api/marketing/send-whatsapp.js
import axios from "axios";
import dbConnect from "../../../lib/database";
import { getUserFromReq, requireRole } from "../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";
import { sendMessageToClient } from "./ws-utils";

function isValidE164(number) {
  return /^\+[1-9]\d{1,14}$/.test(number);
}

function formatE164(num) {
  return num.startsWith("+") ? num : `+${num}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    await dbConnect();

    // Verify authentication
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Allow clinic, doctor, doctorStaff, staff, and agent roles
    if (!requireRole(user, ["doctor", "clinic", "doctorStaff", "staff", "agent"])) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    // Check permissions for clinic/agent/doctor/doctorStaff/staff roles
    if (["clinic", "agent", "doctor", "doctorStaff", "staff"].includes(user.role)) {
      try {
        const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
        if (clinicError || !clinicId) {
          return res.status(403).json({ 
            success: false,
            error: clinicError || "Unable to determine clinic access" 
          });
        }

        const { hasPermission, error: permError } = await checkClinicPermission(
          clinicId,
          "clinic_staff_management",
          "create",
          "WhatsApp Marketing"
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: permError || "You do not have permission to send WhatsApp messages"
          });
        }
      } catch (permErr) {
        // console.error("Permission check error:", permErr);
        return res.status(500).json({ success: false, error: "Error checking permissions" });
      }
    }

    const { to, message, id } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, error: "Missing phone number or message" });
    }

    const normalizedTo = formatE164(to);
    if (!isValidE164(normalizedTo)) {
      return res.status(400).json({ success: false, error: "Phone number must be in E.164 format" });
    }

    try {
      const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/743944485476313/messages`;
      const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

      const response = await axios.post(
        WHATSAPP_API_URL,
        {
          messaging_product: "whatsapp",
          to: normalizedTo,
          type: "text",
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      // ✅ Broadcast immediately to client
      sendMessageToClient(normalizedTo, {
        id: id || response.data.messages?.[0]?.id || `local-${Date.now()}`,
        from: "me",
        text: message,
        timestamp: Math.floor(Date.now() / 1000),
        status: "sent",
      });

      return res.status(200).json({ success: true, data: response.data });
    } catch (err) {
      // console.error("❌ WhatsApp API Error:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.error?.message || err.message;
      return res
        .status(err.response?.status || 500)
        .json({ success: false, error: errorMessage });
    }
  } catch (err) {
    // console.error("WhatsApp send error:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
}
