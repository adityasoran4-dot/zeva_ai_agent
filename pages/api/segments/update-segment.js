import mongoose from "mongoose";
import dbConnect from "../../../lib/database";
import Segment from "../../../models/Segment";
import { getUserFromReq, requireRole } from "../lead-ms/auth";
import Clinic from "../../../models/Clinic";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const me = await getUserFromReq(req);
  if (!me) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  if (!requireRole(me, ["clinic", "agent", "admin", "doctor"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const { segmentId, name, description, status } = req.body;

    if (!segmentId || !mongoose.Types.ObjectId.isValid(segmentId)) {
      return res.status(400).json({
        success: false,
        message: "Valid segmentId is required",
      });
    }

    const segment = await Segment.findById(segmentId);
    if (!segment) {
      return res
        .status(404)
        .json({ success: false, message: "Segment not found" });
    }

    // Get clinic based on user role
    let clinic;
    if (me.role === "clinic") {
      clinic = await Clinic.findOne({ owner: me._id });
      // Ensure the lead belongs to this clinic
      if (segment.clinicId.toString() !== clinic._id.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Not allowed to access this lead" });
      }
    } else if (me.role === "agent") {
      if (!me.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "Agent not linked to any clinic" });
      }
      clinic = await Clinic.findById(me.clinicId);
      // Ensure the lead belongs to this clinic
      if (segment.clinicId.toString() !== clinic._id.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Not allowed to access this lead" });
      }
    } else if (me.role === "doctor") {
      if (!me.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "Doctor not linked to any clinic" });
      }
      clinic = await Clinic.findById(me.clinicId);
      // Ensure the lead belongs to this clinic
      if (segment.clinicId.toString() !== clinic._id.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Not allowed to access this lead" });
      }
    } else if (me.role === "admin") {
      // Admin can delete any lead
      clinic = await Clinic.findById(lead.clinicId);
      if (!clinic) {
        return res
          .status(404)
          .json({ success: false, message: "Clinic not found" });
      }
    }

    if (!clinic) {
      return res
        .status(404)
        .json({ success: false, message: "Clinic not found for this user" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Segment name is required",
      });
    }

    // Check if another segment with the same name exists in the same clinic
    const existingSegment = await Segment.findOne({
      clinicId: clinic._id,
      name: { $regex: `^${name.trim()}$`, $options: "i" },
      _id: { $ne: segmentId },
    });

    if (existingSegment) {
      return res.status(400).json({
        success: false,
        message: "A segment with this name already exists",
      });
    }

    // Update the segment
    segment.name = name.trim();
    segment.description = description?.trim();
    segment.status = ["active", "archived"].includes(status)
      ? status
      : "active";
    segment.updatedAt = new Date();

    await segment.save();

    // Populate for response
    const populatedSegment = await Segment.findById(segment._id);

    return res.status(200).json({
      success: true,
      segment: populatedSegment,
      message: "Segment updated successfully",
    });
  } catch (err) {
    console.error("Error updating segment:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
