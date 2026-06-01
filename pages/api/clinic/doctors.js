import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";
import {
  getClinicIdFromUser,
  checkClinicPermission,
} from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  // Authenticate
  let user;
  try {
    user = await getUserFromReq(req);
    if (!user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    // Allow clinic, doctor, agent, doctorStaff, and staff roles
    if (
      !["clinic", "doctor", "agent", "doctorStaff", "staff", "admin"].includes(
        user.role,
      )
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  // Resolve clinicId for scoped queries
  const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
  if (clinicError || !clinicId) {
    return res.status(403).json({
      success: false,
      message: clinicError || "Unable to determine clinic access",
    });
  }

  // GET: list or fetch a single doctor
  if (req.method === "GET") {
    try {
      // Optional: allow a module-specific read permission check if desired
      // We attempt to check permission but do not block admins
      if (user.role !== "admin") {
        const { hasPermission, error: permError } = await checkClinicPermission(
          clinicId,
          "clinic_view_doctor",
          "read",
        );
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permError || "You do not have permission to view doctors",
          });
        }
      }

      // If specific doctorId is requested
      if (req.query.doctorId) {
        const doc = await User.findOne({
          _id: req.query.doctorId,
          role: "doctor",
        })
          .select("-password")
          .lean();
        if (!doc)
          return res
            .status(404)
            .json({ success: false, message: "Doctor not found" });
        return res.status(200).json({ success: true, data: doc });
      }

      // Build query: doctors within the clinic; optional branchId filter if present on User
      const query = {
        $or: [{ role: "doctor" }, { role: "doctorStaff" }],
      };

      if (req.query.branchId) {
        // Many codepaths attach branchId to users; if not present this will simply not match
        query.clinicId = req.query.branchId;
      }

      console.log({ query });

      const doctors = await User.find(query)
        .select("_id name email phone role isApproved clinicId createdBy")
        .sort({ name: 1 })
        .lean();

      return res.status(200).json({ success: true, data: doctors });
    } catch (error) {
      console.error("Error fetching doctors:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch doctors" });
    }
  }

  res.setHeader("Allow", ["GET"]);
  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}
