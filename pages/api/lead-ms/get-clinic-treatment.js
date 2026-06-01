import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import { getUserFromReq, requireRole } from "./auth";

export default async function handler(req, res) {
  await dbConnect();

  try {
    // Get logged-in user
    const user = await getUserFromReq(req);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    // Only clinic, agent, or doctor can access
    if (!requireRole(user, ["clinic", "agent", "doctor", "admin", "doctorStaff"])) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied" });
    }

    // Handle only GET method
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    // Determine clinic
    let clinic;
    if (user.role === "clinic") {
      clinic = await Clinic.findOne({ owner: user._id }).lean();
    } else if (user.role === "agent" || user.role === "doctorStaff") {
      if (!user.clinicId) {
        return res
          .status(400)
          .json({ success: false, message: "Agent/Staff is not assigned to any clinic" });
      }
      clinic = await Clinic.findById(user.clinicId).lean();
    } else if (user.role === "doctor") {
      if (!user.clinicId) {
        return res
          .status(400)
          .json({ success: false, message: "Doctor is not linked to any clinic" });
      }
      clinic = await Clinic.findById(user.clinicId).lean();
    } else if (user.role === "admin") {
      // If admin, we can't find a clinic by user._id. 
      // We might need a clinicId from query, but for now let's just allow it
      // Actually, if it's admin, we might need a default clinic or just return empty for now
      // Let's check if clinicId is passed in query for admin
      const { clinicId: queryClinicId } = req.query;
      if (queryClinicId) {
        clinic = await Clinic.findById(queryClinicId).lean();
      }
    }

    if (!clinic) {
      return res
        .status(404)
        .json({ success: false, message: "Clinic not found for this user" });
    }

    // Return clinic info and treatments
    return res.status(200).json({
      success: true,
      userId: user._id,
      userRole: user.role,
      clinicId: clinic._id,
      clinic: {
        id: clinic._id,
        name: clinic.name,
        address: clinic.address,
      },
      treatments: clinic.treatments || [],
    });
  } catch (err) {
    // console.error("Error fetching clinic treatments:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch clinic treatments",
      error: err.message,
    });
  }
}
