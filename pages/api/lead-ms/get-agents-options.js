// /pages/api/lead-ms/get-agents-options
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic"; // ✅ import Clinic
import { getUserFromReq, requireRole } from "./auth";

export default async function handler(req, res) {
  await dbConnect();

  const me = await getUserFromReq(req);
  if (!me) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Missing or invalid token",
    });
  }

  // Allow admin, clinic, doctor, agent, and doctorStaff roles
  if (!requireRole(me, ["admin", "clinic", "doctor", "agent", "doctorStaff"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // ---------------- GET Agents/DoctorStaff ----------------
  if (req.method === "GET") {
    try {
      const roleFilter = req.query.role;
      const clinicIdParam = req.query.clinicId;
      let roles;
      if (roleFilter === "agent") {
        roles = ["agent"];
      } else if (roleFilter === "doctorStaff") {
        roles = ["doctorStaff"];
      } else {
        roles = ["agent", "doctorStaff"];
      }
      let clinicId = clinicIdParam || null;
      if (!clinicId) {
        if (me.role === "clinic") {
          const clinic = await Clinic.findOne({ owner: me._id });
          if (clinic) clinicId = clinic._id;
        } else if (me.clinicId) {
          clinicId = me.clinicId;
        }
      }
      let query = { role: { $in: roles } };
      if (clinicId) {
        query = { ...query, clinicId };
      }
      const users = await User.find(query).select(
        "_id name email phone clinicId role",
      );
      return res.status(200).json({ success: true, agents: users });
    } catch (err) {
      // console.error("Error fetching users:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch users",
        error: err.message,
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: `Method ${req.method} not allowed. Only GET and PATCH are supported.`,
  });
}
