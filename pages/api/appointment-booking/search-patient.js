import dbConnect from "../../../lib/database";
import PatientRegistration from "../../../models/PatientRegistration";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";

/**
 * Public endpoint to search patients by phone number within a clinic.
 * Used by the appointment booking page to auto-fill patient details
 * when an existing patient is found.
 *
 * Query Params:
 *   - phone     (required): Phone number to search for (partial match supported)
 *   - clinicId  (required): Clinic ID to scope the search
 *   - limit     (optional): Max number of results (default: 10)
 */
export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const { phone, clinicId, limit = 10 } = req.query;

    // Validate required params
    if (!phone || String(phone).trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required (min 3 characters)",
      });
    }

    if (!clinicId) {
      return res.status(400).json({
        success: false,
        message: "clinicId is required",
      });
    }

    // Verify clinic exists
    const clinic = await Clinic.findById(clinicId).select("_id owner").lean();
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found",
      });
    }

    // Build list of user IDs belonging to this clinic
    // (clinic owner + all agents/doctorStaff linked to this clinic)
    const clinicUsers = await User.find({
      $or: [{ _id: clinic.owner }, { clinicId: clinic._id }],
    })
      .select("_id")
      .lean();

    const clinicUserIds = clinicUsers.map((u) => u._id);

    // Sanitize phone input for regex - escape special chars
    const sanitizedPhone = String(phone)
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Build query: scope to clinic (via clinicId OR userId in clinic users)
    const query = {
      $and: [
        {
          $or: [{ clinicId: clinic._id }, { userId: { $in: clinicUserIds } }],
        },
        {
          mobileNumber: { $regex: sanitizedPhone, $options: "i" },
        },
      ],
    };

    const maxLimit = Math.min(parseInt(limit) || 10, 50);

    const patients = await PatientRegistration.find(query)
      .select(
        "_id firstName lastName gender email mobileNumber emrNumber patientType invoiceNumber",
      )
      .sort({ createdAt: -1 })
      .limit(maxLimit)
      .lean();

    return res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    console.error("Error searching patients:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search patients",
    });
  }
}
