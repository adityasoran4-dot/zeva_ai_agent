import dbConnect from "../../../lib/database";
import DoctorProfile from "../../../models/DoctorProfile";
import User from "../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    // Fetch all approved doctors with their treatments
    const doctorProfiles = await DoctorProfile.find({})
      .populate({
        path: "user",
        model: User,
        select: "name email phone isApproved declined role",
      })
      .select("treatments user")
      .lean();

    // Filter only registered and available doctors
    // Available means: isApproved = true, declined = false, role = 'doctor'
    const availableDoctors = doctorProfiles.filter(
      (profile) =>
        profile.user &&
        profile.user.isApproved === true &&
        profile.user.declined !== true &&
        profile.user.role === "doctor"
    );

    // Extract unique specialties from treatments (only main treatments, no sub-treatments)
    const specialtiesSet = new Set();
    
    availableDoctors.forEach((doctor) => {
      if (doctor.treatments && Array.isArray(doctor.treatments)) {
        doctor.treatments.forEach((treatment) => {
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
    // console.error("Error fetching specialties:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch specialties",
      error: error.message,
    });
  }
}

