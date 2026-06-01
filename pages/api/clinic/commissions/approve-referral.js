import dbConnect from "../../../../lib/database";
import Commission from "../../../../models/Commission";
import Clinic from "../../../../models/Clinic";
import { getUserFromReq } from "../../lead-ms/auth";
import { checkClinicPermission } from "../../lead-ms/permissions-helper";
import { checkAgentPermission } from "../../agent/permissions-helper";
export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let clinicId = null;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id }).select("_id");
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
      clinicId = clinic._id;
    } else if (["agent", "doctor", "doctorStaff", "staff"].includes(me.role)) {
      if (!me.clinicId) {
        return res.status(403).json({ success: false, message: "User not linked to a clinic" });
      }
      clinicId = me.clinicId;
    } else if (me.role === "admin") {
      const qClinicId = req.body.clinicId || req.query.clinicId;
      if (!qClinicId) {
        return res.status(400).json({ success: false, message: "Admin must provide clinicId" });
      }
      clinicId = qClinicId;
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (me.role !== "admin") {
      if (me.role === "clinic") {
        const { hasPermission, error } = await checkClinicPermission(clinicId, "clinic_commission", "write");
        if (!hasPermission) {
          return res.status(403).json({ success: false, message: error || "No permission" });
        }
      } else if (["agent", "doctorStaff"].includes(me.role)) {
        const { hasPermission, error } = await checkAgentPermission(me._id, "clinic_commission", "write");
        if (!hasPermission) {
          return res.status(403).json({ success: false, message: error || "No permission" });
        }
      }
    }

    const { referralId } = req.body;
    if (!referralId) {
      return res.status(400).json({ success: false, message: "referralId is required" });
    }

    const result = await Commission.updateMany(
      { clinicId, source: "referral", referralId, isSubmitted: true, isApproved: false },
      { $set: { isApproved: true } }
    );

    return res.status(200).json({
      success: true,
      approvedCount: result.modifiedCount,
      message: `${result.modifiedCount} referral commission(s) approved`,
    });
  } catch (err) {
    console.error("Error in approve-referral:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
  }
}
