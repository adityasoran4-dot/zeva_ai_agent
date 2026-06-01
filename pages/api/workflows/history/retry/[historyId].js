import dbConnect from "../../../../../lib/database";
import WorkflowHistory from "../../../../../models/workflows/WorkflowHistory";
import Clinic from "../../../../../models/Clinic";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";
import { executeRetryAction } from "../../../../../bullmq/workflow";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (
      !requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    let clinicId;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id }).exec();
      if (!clinic) {
        return res
          .status(400)
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
    } else if (me.role === "admin") {
      clinicId = req.query.clinicId;
      if (!clinicId) {
        return res
          .status(400)
          .json({ success: false, message: "clinicId is required for admin" });
      }
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { historyId } = req.query;
    if (!historyId) {
      return res
        .status(400)
        .json({ success: false, message: "History ID is required" });
    }

    const history = await WorkflowHistory.findById(historyId);
    if (!history) {
      return res
        .status(404)
        .json({ success: false, message: "History not found in this clinic" });
    }

    if (history.type !== "action") {
      return res.status(400).json({
        success: false,
        message: "Retry is only available for action histories",
      });
    }

    if (history.status !== "failed") {
      return res.status(400).json({
        success: false,
        message: "Retry is only available for failed actions",
      });
    }

    const payload = history ? Object.fromEntries(history.payload) : {};
    // make this payload map to object
    console.log({ payload });
    await executeRetryAction(payload);

    return res.status(200).json({
      success: true,
      message:
        "History retried successfully, Please wait for the result to be processed",
    });
  } catch (error) {
    console.error("Error history:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retry history",
    });
  }
}
