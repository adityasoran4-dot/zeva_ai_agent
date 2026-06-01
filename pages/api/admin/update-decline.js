// pages/api/admin/decline-clinic.ts
import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { clinicId } = req.body;

  if (!clinicId) {
    return res.status(400).json({ success: false, message: "Clinic ID is required" });
  }

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
    }

    // If user is an agent, check approve permission for approval_clinic module (decline is also an approve action)
    if (['agent', 'doctorStaff'].includes(me.role)) {
      const { hasPermission, error: permissionError } = await checkAgentPermission(
        me._id,
        "approval_clinic", // moduleKey
        "approve", // action (decline is also an approve action)
        null // subModuleName
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permissionError || "You do not have permission to decline clinics"
        });
      }
    }
    // Admin users bypass permission checks
    const clinic = await Clinic.findByIdAndUpdate(clinicId, {
      declined: true,
      isApproved: false,
    },
     { new: true }
  );

    res.status(200).json({ success: true, message: "Clinic declined", clinic });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
}
