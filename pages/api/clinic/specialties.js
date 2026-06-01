import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    // Fetch all approved clinics with their treatments
    const clinics = await Clinic.find({ isApproved: true })
      .populate({
        path: "owner",
        model: User,
        select: "name email phone isApproved declined role",
      })
      .select("treatments owner")
      .lean();

    // Filter only registered and available clinics
    // Show clinics that are approved, only filter out if owner is declined or doesn't exist
    const availableClinics = clinics.filter(
      (clinic) => {
        // Clinic must be approved (already filtered in query)
        // Owner must exist and not be declined
        // Don't require owner.isApproved === true, just check they're not declined
        if (!clinic.owner) {
          return false; // No owner = exclude
        }
        if (clinic.owner.declined === true) {
          return false; // Owner declined = exclude
        }
        if (clinic.owner.role !== "clinic") {
          return false; // Wrong role = exclude
        }
        // Include clinic if owner exists, not declined, and has clinic role
        return true;
      }
    );

    // Extract unique specialties from treatments (only main treatments, no sub-treatments)
    const specialtiesSet = new Set();
    
    availableClinics.forEach((clinic) => {
      if (clinic.treatments && Array.isArray(clinic.treatments)) {
        clinic.treatments.forEach((treatment) => {
          // Only add main treatment, ignore sub-treatments
          if (treatment.mainTreatment && treatment.mainTreatment.trim()) {
            specialtiesSet.add(treatment.mainTreatment.trim());
          }
        });
      }
    });

    // Convert to sorted array
    const specialties = Array.from(specialtiesSet).sort();

    return res.status(200).json({
      success: true,
      specialties,
      count: specialties.length,
    });
  } catch (error) {
    console.error("Error fetching clinic specialties:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch clinic specialties",
      error: error.message,
    });
  }
}

