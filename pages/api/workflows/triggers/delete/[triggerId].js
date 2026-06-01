import dbConnect from "../../../../../lib/database";
import Clinic from "../../../../../models/Clinic";
import WorkflowTrigger from "../../../../../models/workflows/WorkflowTrigger";
import WorkflowHistory from "../../../../../models/workflows/WorkflowHistory";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  const { triggerId } = req.query;

  if (!triggerId) {
    return res.status(400).json({
      success: false,
      message: "triggerId is required in query",
    });
  }

  res.setHeader("Allow", ["DELETE"]);

  if (req.method !== "DELETE") {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  const me = await getUserFromReq(req);
  if (!me) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  if (!requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    let clinicId;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id });
      if (!clinic) {
        return res
          .status(404)
          .json({ success: false, message: "Clinic not found" });
      }
      clinicId = clinic._id;
    } else if (["agent", "doctor", "doctorStaff"].includes(me.role)) {
      if (!me.clinicId) {
        return res
          .status(400)
          .json({ success: false, message: `${me.role} not tied to a clinic` });
      }
      clinicId = me.clinicId;
    }

    const trigger = await WorkflowTrigger.findById(triggerId);
    if (!trigger) {
      return res
        .status(404)
        .json({ success: false, message: "Trigger not found" });
    }

    // Admins can delete anything, others only their clinic's triggers
    if (
      me.role !== "admin" &&
      clinicId &&
      trigger.clinicId.toString() !== clinicId.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const deletedTrigger = await WorkflowTrigger.findByIdAndDelete(
          triggerId,
          { session },
        );
        if (!deletedTrigger) {
          throw new Error("Trigger not found");
        }

        // Delete associated workflow history
        await WorkflowHistory.deleteMany({ triggerId }, { session });
      });

      return res.status(200).json({
        success: true,
        message: "Trigger and associated history deleted successfully",
      });
    } catch (err) {
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error("Error deleting trigger:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
