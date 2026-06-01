import dbConnect from "../../../../../lib/database";
import Clinic from "../../../../../models/Clinic";
import WorkflowCondition from "../../../../../models/workflows/WorkflowCondition";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  const { conditionId } = req.query;

  if (!conditionId) {
    return res.status(400).json({
      success: false,
      message: "conditionId is required in query",
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

    // Admins can access anything, others only their clinic's conditions
    if (me.role !== "admin" && clinicId && condition.clinicId.toString() !== clinicId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (req.method === "GET") {
      return res.status(200).json({
        success: true,
        data: condition,
      });
    } else if (req.method === "PUT") {
      const { type, conditions } = req.body;

      // Update fields if provided
      if (type !== undefined) condition.type = type;
      if (conditions !== undefined) condition.conditions = conditions;

      await condition.save();

      return res.status(200).json({
        success: true,
        message: "Condition updated successfully",
        data: condition,
      });
    } else {
      res.setHeader("Allow", ["GET", "PUT"]);
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} Not Allowed`,
      });
    }
  } catch (err) {
    console.error("Error updating condition:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
