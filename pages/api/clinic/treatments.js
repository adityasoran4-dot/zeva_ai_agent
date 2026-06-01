import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  // Verify authentication
  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    // Allow clinic, doctor, agent, doctorStaff, and staff roles
    if (!["clinic", "doctor", "agent", "doctorStaff", "staff"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  // Get clinic ID from user
  const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
  if (clinicError || !clinicId) {
    return res.status(403).json({ 
      success: false,
      message: clinicError || "Unable to determine clinic access" 
    });
  }

  try {
    // Determine which module to check permissions for based on query parameter
    // Default to "clinic_addRoom" for backward compatibility
    // When accessed from create-agent page, it should check "clinic_create_agent"
    const moduleToCheck = req.query.module || "clinic_addRoom";
    
    // Check read permission for the specified module
    const { hasPermission, error: permError } = await checkClinicPermission(
      clinicId,
      moduleToCheck,
      "read"
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: permError || "You do not have permission to view treatments",
      });
    }

    // Find the clinic
    const clinic = await Clinic.findById(clinicId).lean();
    if (!clinic) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    // Format treatments for frontend
    const formattedTreatments = (clinic.treatments || []).map((tr) => ({
      mainTreatment: tr.mainTreatment,
      mainTreatmentSlug: tr.mainTreatmentSlug,
      subTreatments: (tr.subTreatments || []).map((sub) => ({
        name: sub.name,
        slug: sub.slug,
        price: sub.price || 0,
      })),
    }));

    return res.status(200).json({
      success: true,
      clinic: {
        _id: clinic._id,
        treatments: formattedTreatments,
      },
    });
  } catch (error) {
    console.error("Error fetching clinic treatments:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch treatments" });
  }
}

