import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import Clinic from "../../../models/Clinic";
import { getUserFromReq, requireRole } from "./auth";
import { checkAgentPermission } from "../agent/permissions-helper";
import { checkClinicPermission } from "./permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const me = await getUserFromReq(req);
    if (
      !requireRole(me, [
        "clinic",
        "agent",
        "admin",
        "doctor",
        "doctorStaff",
        "staff",
      ])
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { id, clinicId: adminClinicId } = req.query;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Lead id is required" });
    }

    let clinic = null;
    if (me.role === "clinic") {
      clinic = await Clinic.findOne({ owner: me._id });
    } else if (
      me.role === "agent" ||
      me.role === "doctor" ||
      me.role === "doctorStaff" ||
      me.role === "staff"
    ) {
      if (!me.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "User not linked to any clinic" });
      }
      clinic = await Clinic.findById(me.clinicId);
    } else if (me.role === "admin") {
      if (adminClinicId) {
        clinic = await Clinic.findById(adminClinicId);
      }
    }

    const lead = await Lead.findById(id)
      .populate({
        path: "treatments.treatment",
        model: "Treatment",
        select: "name",
      })
      .populate({
        path: "assignedTo.user",
        model: "User",
        select: "name role email",
      })
      .populate({ path: "notes.addedBy", model: "User", select: "name" })
      .lean();

    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    // Scope verification: non-admin must belong to same clinic
    if (me.role !== "admin") {
      if (!clinic || lead.clinicId?.toString() !== clinic._id?.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied for this lead" });
      }
      // Permission checks for non-admin
      const roleKey =
        me.role === "doctor"
          ? "doctor"
          : me.role === "clinic"
            ? "clinic"
            : null;
      if (roleKey) {
        const { hasPermission, error } = await checkClinicPermission(
          clinic._id,
          "create_lead",
          "read",
          null,
          roleKey,
        );
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: error || "You do not have permission to view leads",
          });
        }
      }
      if (me.role === "agent") {
        const { hasPermission, error } = await checkAgentPermission(
          me._id,
          "create_lead",
          "read",
          null,
        );
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: error || "You do not have permission to view leads",
          });
        }
      }
      // doctorStaff/staff rely on clinic permission already checked via roleKey=null; allow if same clinic
    }

    return res.status(200).json({ success: true, data: lead });
  } catch (err) {
    // console.error("GET /api/lead-ms/get-lead error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}
