//api/pettycash/getpettyCash.js
import dbConnect from "../../../lib/database";
import PettyCash from "../../../models/PettyCash";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const user = await getAuthorizedStaffUser(req, {
      allowedRoles: ["staff", "doctorStaff", "doctor", "clinic", "agent", "admin"],
    });

    // Check permissions for clinic/agent/doctor roles
    if (["clinic", "agent", "doctor", "doctorStaff"].includes(user.role)) {
      try {
        const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
        if (clinicError || !clinicId) {
          return res.status(403).json({ 
            message: clinicError || "Unable to determine clinic access" 
          });
        }

        const { hasPermission, error: permError } = await checkClinicPermission(
          clinicId,
          "clinic_staff_management",
          "read",
          "Add Expense"
        );

        if (!hasPermission) {
          return res.status(403).json({
            message: permError || "You do not have permission to view expenses"
          });
        }
      } catch (permErr) {
        // console.error("Permission check error:", permErr);
        return res.status(500).json({ message: "Error checking permissions" });
      }
    }

    const staffId = user._id.toString();

    const search = req.query.search ? req.query.search.trim() : "";

    const filter = {
      staffId,
      ...(search
        ? {
            $or: [
              { patientName: { $regex: search, $options: "i" } },
              { patientEmail: { $regex: search, $options: "i" } },
            ],
          }
        : {}),
    };

    const pettyCashList = await PettyCash.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ pettyCashList });
  } catch (error) {
    // console.error("Error fetching petty cash:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
