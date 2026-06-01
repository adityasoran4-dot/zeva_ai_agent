import dbConnect from "../../../../lib/database";
import Lead from "../../../../models/Lead";
import Clinic from "../../../../models/Clinic";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  res.setHeader("Allow", ["POST"]);

  if (!["POST"].includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    if (
      !requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Get clinicId based on user role
    let clinicId;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id });
      if (!clinic) {
        return res.status(400).json({
          success: false,
          message: "Clinic not found for this user",
        });
      }
      clinicId = clinic._id;
    } else if (me.role === "agent") {
      if (!me.clinicId) {
        return res
          .status(400)
          .json({ success: false, message: "Agent not tied to a clinic" });
      }
      clinicId = me.clinicId;
    } else if (me.role === "doctor" || me.role === "doctorStaff") {
      if (!me.clinicId) {
        return res
          .status(400)
          .json({ success: false, message: "Doctor not tied to a clinic" });
      }
      clinicId = me.clinicId;
    } else if (me.role === "admin") {
      clinicId = req.body.clinicId || req.query.clinicId;
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const leadId = req.query.leadId;
    const { tag } = req.body;

    if (!tag || typeof tag !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Tag name is required" });
    }

    if (!leadId) {
      return res
        .status(400)
        .json({ success: false, message: "Lead ID is required" });
    }

    const normalizedTag = tag.trim().toLowerCase();

    const lead = await Lead.findOne({ _id: leadId, clinicId });
    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    if (!lead.tags.includes(normalizedTag)) {
      return res.status(404).json({
        success: false,
        message: "Tag not found for this lead",
      });
    }

    lead.tags = lead.tags.filter((t) => t !== normalizedTag);
    await lead.save();

    return res.status(200).json({
      success: true,
      message: "Tag removed successfully",
      tags: lead.tags,
    });
  } catch (error) {
    console.error("Tags API Error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
}
