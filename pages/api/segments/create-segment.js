import mongoose from "mongoose";
import dbConnect from "../../../lib/database";
import Segment from "../../../models/Segment";
import Lead from "../../../models/Lead";
import Clinic from "../../../models/Clinic";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
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
  } else if (me.role === "doctor") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor not tied to a clinic" });
    }
    clinicId = me.clinicId;
  } else if (me.role === "admin") {
    clinicId = req.body.clinicId;
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

  try {
    const { name, description, leads = [], status = "active" } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Segment name is required",
      });
    }

    // Check for duplicate segment name in the same clinic
    const existingSegment = await Segment.findOne({
      clinicId,
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });

    if (existingSegment) {
      return res.status(400).json({
        success: false,
        message: "A segment with this name already exists",
      });
    }

    // Validate leads
    let validatedLeads = [];
    if (leads.length > 0) {
      const leadIds = leads.map((lead) => {
        if (mongoose.Types.ObjectId.isValid(lead)) {
          return new mongoose.Types.ObjectId(lead);
        }
        throw new Error(`Invalid lead ID: ${lead}`);
      });

      // Verify leads exist and belong to clinic
      const leadCount = await Lead.countDocuments({
        _id: { $in: leadIds },
        clinicId,
      });

      if (leadCount !== leadIds.length) {
        return res.status(400).json({
          success: false,
          message: "Some leads do not exist or don't belong to your clinic",
        });
      }

      validatedLeads = leadIds;
    }

    // Create segment
    const segment = await Segment.create({
      clinicId,
      name: name.trim(),
      description: description?.trim() || "",
      leads: validatedLeads,
      status: ["active", "archived"].includes(status) ? status : "active",
    });

    return res.status(201).json({
      success: true,
      segment,
      message: "Segment created successfully",
    });
  } catch (err) {
    console.error("Error creating segment:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate segment name",
      });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message:
          "Validation failed: " +
          Object.values(err.errors)
            .map((e) => e.message)
            .join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
