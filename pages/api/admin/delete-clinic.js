// pages/api/admin/delete-clinic.ts
import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";
import Review from "../../../models/Review"; // import Review model
import Enquiry from "../../../models/Enquiry"; // import Enquiry model
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { clinicId } = req.body;

  if (!clinicId) {
    return res
      .status(400)
      .json({ success: false, message: "Clinic ID is required" });
  }

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
    }

    // If user is an agent, check delete permission for approval_clinic module
    if (['agent', 'doctorStaff'].includes(me.role)) {
      const { hasPermission, error: permissionError } = await checkAgentPermission(
        me._id,
        "approval_clinic", // moduleKey
        "delete", // action
        null // subModuleName
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permissionError || "You do not have permission to delete clinics"
        });
      }
    }
    // Admin users bypass permission checks
    // Find the clinic and populate its owner
    const clinic = await Clinic.findById(clinicId).populate('owner');
    
    if (!clinic) {
      return res
        .status(404)
        .json({ success: false, message: "Clinic not found" });
    }

    // Delete the clinic
    await Clinic.findByIdAndDelete(clinicId);

    // Delete associated user if their role is "clinic"
    if (clinic.owner && clinic.owner.role === "clinic") {
      await User.findByIdAndDelete(clinic.owner._id);
    }

    // Delete all reviews related to this clinic
    await Review.deleteMany({ clinicId });

    // Delete all enquiries related to this clinic
    await Enquiry.deleteMany({ clinicId });

    res.status(200).json({ 
      success: true, 
      message: "Clinic, associated user, reviews, and enquiries deleted successfully" 
    });
  } catch (error) {
    // console.error("Error deleting clinic:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
}
