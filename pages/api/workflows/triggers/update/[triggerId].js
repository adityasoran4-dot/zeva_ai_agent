import dbConnect from "../../../../../lib/database";
import Clinic from "../../../../../models/Clinic";
import WorkflowTrigger from "../../../../../models/workflows/WorkflowTrigger";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  const { triggerId } = req.query;

  if (!triggerId) {
    return res.status(400).json({
      success: false,
      message: "triggerId is required in query",
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

    // Admins can access anything, others only their clinic's triggers
    if (me.role !== "admin" && clinicId && trigger.clinicId.toString() !== clinicId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (req.method === "GET") {
      return res.status(200).json({
        success: true,
        data: trigger,
      });
    } else if (req.method === "PUT") {
      const {
        name,
        description,
        webhookUrl,
        webhookListening,
        webhookResponse,
        channel,
        providerId,
      } = req.body;

      // Update fields if provided
      if (name !== undefined) trigger.name = name;
      if (description !== undefined) trigger.description = description;
      if (webhookUrl !== undefined) trigger.webhookUrl = webhookUrl;
      if (webhookListening !== undefined)
        trigger.webhookListening = webhookListening;
      if (webhookResponse !== undefined)
        trigger.webhookResponse = webhookResponse;
      if (channel !== undefined) trigger.channel = channel;
      if (providerId !== undefined) trigger.providerId = providerId;

      await trigger.save();

      return res.status(200).json({
        success: true,
        message: "Trigger updated successfully",
        data: trigger,
      });
    } else {
      res.setHeader("Allow", ["GET", "PUT"]);
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} Not Allowed`,
      });
    }
  } catch (err) {
    console.error("Error updating trigger:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
