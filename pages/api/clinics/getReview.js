import dbConnect from "../../../lib/database";
import Review from "../../../models/Review";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const authUser = await getUserFromReq(req);
    if (!authUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Allow clinic, admin, agent, doctor, doctorStaff, and staff roles
    if (!["clinic", "admin", "agent", "doctor", "doctorStaff", "staff"].includes(authUser.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    let { clinicId, error, isAdmin } = await getClinicIdFromUser(authUser);
    if (error && !isAdmin) {
      return res.status(404).json({ message: error });
    }

    // ✅ Check permission for reading clinic reviews (only for agent, doctorStaff roles)
    // Clinic, doctor, and staff roles have full access by default, admin bypasses
    if (!isAdmin && clinicId && ["agent", "doctorStaff"].includes(authUser.role)) {
      const { checkAgentPermission } = await import("../agent/permissions-helper");
      const result = await checkAgentPermission(
        authUser._id,
        "clinic_review",
        "read"
      );

      if (!result.hasPermission) {
        return res.status(403).json({
          success: false,
          message: result.error || "You do not have permission to view clinic reviews"
        });
      }
    }

    // Ensure clinicId is set correctly
    if (!clinicId && authUser.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: authUser._id }).select("_id");
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }
      clinicId = clinic._id;
    }

    if (!clinicId) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    // Step 2: Fetch all reviews for the clinic and populate user details
    const reviews = await Review.find({ clinicId: clinicId })
      .sort({ createdAt: -1 })
      .populate({
        path: "userId",
        select: "name email", // adjust fields if needed
        model: User,
      });

    return res.status(200).json({ success: true, reviews });
  } catch (err) {
    console.error("Fetch clinic reviews error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
