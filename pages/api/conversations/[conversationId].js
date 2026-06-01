import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import Conversation from "../../../models/Conversation";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

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
      // For Get Segments Permissions
    }

    try {
      const { conversationId } = req.query;

      const conversation = await Conversation.findOne({
        conversationId,
        clinicId: clinic._id,
      })
        .populate({
          path: "leadId",
          select: "_id name email phone createdAt",
          model: "Lead",
        })
        .populate("recentMessage", "content createdAt");

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found or you don't have access to it",
        });
      }

      res.status(200).json({
        success: true,
        message: "Conversation Found.",
        conversation,
      });
    } catch (error) {
      console.error("Error fetching provider:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch providers" });
    }
  } catch (error) {
    console.error("Get Providers error: ", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
}
