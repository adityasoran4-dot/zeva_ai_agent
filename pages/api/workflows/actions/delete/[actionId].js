import dbConnect from "../../../../../lib/database";
import Clinic from "../../../../../models/Clinic";
import WorkflowAction from "../../../../../models/workflows/WorkflowAction";
import WorkflowHistory from "../../../../../models/workflows/WorkflowHistory";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  const { actionId } = req.query;

  if (!actionId) {
    return res.status(400).json({
      success: false,
      message: "actionId is required in query",
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

    const action = await WorkflowAction.findById(actionId);
    if (!action) {
      return res
        .status(404)
        .json({ success: false, message: "Action not found" });
    }

    // Admins can delete anything, others only their clinic's actions
    if (
      me.role !== "admin" &&
      clinicId &&
      action.clinicId.toString() !== clinicId.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const deletedAction = await WorkflowAction.findByIdAndDelete(actionId, {
          session,
        });
        if (!deletedAction) {
          throw new Error("Action not found");
        }

        // Delete associated workflow history
        await WorkflowHistory.deleteMany({ actionId }, { session });
      });

      return res.status(200).json({
        success: true,
        message: "Action and associated history deleted successfully",
      });
    } catch (err) {
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error("Error deleting action:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
