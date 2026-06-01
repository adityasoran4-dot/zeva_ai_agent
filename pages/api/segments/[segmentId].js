import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import Segment from "../../../models/Segment";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

export default async function handler(req, res) {
  try {
    await dbConnect();
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const me = await getUserFromReq(req);
    if (!me || !requireRole(me, ["clinic", "agent", "admin", "doctor"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { segmentId } = req.query;
    // ✅ First, get the lead to determine which clinic it belongs to
    const segment = await Segment.findById(segmentId);
    if (!segment) {
      return res
        .status(404)
        .json({ success: false, message: "Segment not found" });
    }

    // Determine the clinic for the user
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

    // ✅ Check permission for deleting leads (only for clinic, agent, and doctor; admin bypasses)
    if (me.role !== "admin") {
      // First check if clinic has delete permission for "create_segment" module
    }

    // Delete the lead only if it belongs to the user's clinic
    const gettedSegment = await Segment.findOne({
      _id: segmentId,
      clinicId: clinic._id,
    });

    if (!gettedSegment) {
      return res.status(404).json({
        success: false,
        message: "Segment not found or not authorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Segment received successfully",
      segment: gettedSegment,
    });
  } catch (error) {
    console.error("Get Segment Details error: ", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
}
