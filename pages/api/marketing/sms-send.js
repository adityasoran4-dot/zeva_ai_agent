import axios from "axios";
import dbConnect from "../../../lib/database";
import SmsMarketing from "../../../models/SmsMarketing";
import { getUserFromReq, requireRole } from "../lead-ms/auth";
import Clinic from "../../../models/Clinic";
import { debitWallet, getOrCreateWallet } from "../../../lib/smsWallet";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Allow clinic, doctor, doctorStaff, staff, and agent roles
    if (!requireRole(user, ["doctor", "clinic", "doctorStaff", "staff", "agent"])) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    // Check permissions for clinic/agent/doctor/doctorStaff/staff roles
    if (["clinic", "agent", "doctor", "doctorStaff", "staff"].includes(user.role)) {
      try {
        const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
        if (clinicError || !clinicId) {
          return res.status(403).json({ 
            success: false,
            message: clinicError || "Unable to determine clinic access" 
          });
        }

        const { hasPermission, error: permError } = await checkClinicPermission(
          clinicId,
          "clinic_marketing",
          "create",
          "SMS Marketing"
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permError || "You do not have permission to send SMS"
          });
        }
      } catch (permErr) {
        // console.error("Permission check error:", permErr);
        return res.status(500).json({ success: false, message: "Error checking permissions" });
      }
    }

    const { body, mediaUrl, to } = req.body;
    if (!body || !to) {
      return res.status(400).json({ success: false, message: "Missing parameters" });
    }

    const cleanBody = body.trim();
    if (!cleanBody) {
      return res.status(400).json({ success: false, message: "Message body cannot be empty" });
    }

    const recipients = Array.isArray(to) ? to : [to];
    const results = [];

    // Determine ownerType based on role
    let ownerType = "clinic";
    if (user.role === "doctor" || user.role === "doctorStaff") {
      ownerType = "doctor";
    } else if (["clinic", "agent", "staff"].includes(user.role)) {
      ownerType = "clinic";
    }
    await getOrCreateWallet(user._id, ownerType);

    const creditsPerRecipient = Math.max(1, Math.ceil(cleanBody.length / 160));
    const creditsNeeded = recipients.length * creditsPerRecipient;
    try {
      await debitWallet({
        ownerId: user._id,
        ownerType,
        amount: creditsNeeded,
        reason: "sms_send",
        meta: { preview: body.slice(0, 120) },
      });
    } catch (err) {
      if (err.message === "INSUFFICIENT_BALANCE") {
        return res
          .status(402)
          .json({ success: false, message: "Insufficient SMS balance. Please request additional credits." });
      }
      throw err;
    }

    let clinic = null;
    let clinicId = null;
    if (ownerType === "clinic") {
      clinic = await Clinic.findOne({ owner: user._id });
      clinicId = clinic ? clinic._id : null;
      if (!clinicId) {
        return res.status(400).json({ success: false, message: "Clinic profile not found for this account" });
      }
    } else if (ownerType === "doctor" && user.clinicId) {
      clinic = await Clinic.findById(user.clinicId);
    }

    const senderName = clinic?.name || user.name;
    const trackingOwnerId = ownerType === "clinic" && clinicId ? clinicId : user._id;

    // Live MSG91 credentials from env
    const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
    const SENDER_ID = process.env.MSG91_SENDER_ID;
    const ROUTE = process.env.MSG91_ROUTE || "4"; // transactional
    const COUNTRY = process.env.MSG91_COUNTRY || "91";
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    for (const mobile of recipients) {
      try {
        const trackingUrl = `${BASE_URL}/api/marketing/info?phone=${mobile}&type=${user.role}&id=${trackingOwnerId}`;
        const messageWithTracking = `From: ${senderName}\n${cleanBody}\n👉 ${trackingUrl}`;

        // MSG91 live API URL
        const url = `https://api.msg91.com/api/sendhttp.php?authkey=${MSG91_AUTH_KEY}&mobiles=${mobile}&message=${encodeURIComponent(
          messageWithTracking
        )}&sender=${SENDER_ID}&route=${ROUTE}&country=${COUNTRY}`;

        const response = await axios.get(url);
        results.push({ to: mobile, status: response.data, error: "" });
      } catch (err) {
        results.push({ to: mobile, status: "failed", error: err.message });
      }
    }

    // Save SMS logs
    await SmsMarketing.create({
      userId: user._id,
      role: user.role,
      message: cleanBody,
      mediaUrl,
      recipients,
      results,
      creditsUsed: creditsNeeded,
      segmentsPerRecipient: creditsPerRecipient,
    });

    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    // console.error("SMS API error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
