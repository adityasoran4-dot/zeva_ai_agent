import dbConnect from "../../../../../lib/database";
import Clinic from "../../../../../models/Clinic";
import WorkflowCondition from "../../../../../models/workflows/WorkflowCondition";
import WorkflowHistory from "../../../../../models/workflows/WorkflowHistory";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  const { conditionId } = req.query;

  if (!conditionId) {
    return res.status(400).json({
      success: false,
      message: "conditionId is required in query",
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

    const condition = await WorkflowCondition.findById(conditionId);
    if (!condition) {
      return res
        .status(404)
        .json({ success: false, message: "Condition not found" });
    }

    // Admins can delete anything, others only their clinic's conditions
    if (
      me.role !== "admin" &&
      clinicId &&
      condition.clinicId.toString() !== clinicId.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const deletedCondition = await WorkflowCondition.findByIdAndDelete(
          conditionId,
          { session },
        );
        if (!deletedCondition) {
          throw new Error("Condition not found");
        }

        // Delete associated workflow history
        await WorkflowHistory.deleteMany({ conditionId }, { session });
      });

      return res.status(200).json({
        success: true,
        message: "Condition and associated history deleted successfully",
      });
    } catch (err) {
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error("Error deleting condition:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
