import dbConnect from "../../../lib/database";
import DoctorProfile from "../../../models/DoctorProfile";
import User from "../../../models/Users";

// Helper to get base URL
function getBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_BASE_URL || "https://zeva360.com";
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { treatment } = req.query;

    if (!treatment || !treatment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Treatment parameter is required",
      });
    }

    const treatmentQuery = treatment.trim();

    // Fetch all approved doctors with their treatments
    const doctorProfiles = await DoctorProfile.find({})
      .populate({
        path: "user",
        model: User,
        select: "name email phone isApproved declined role",
      })
      .select(
        "degree experience address location user consultationFee clinicContact timeSlots treatments photos resumeUrl slug slugLocked"
      )
      .lean();

    // Filter only registered and available doctors
    const availableDoctors = doctorProfiles.filter((profile) => {
      // Owner/user must exist, not be declined, and have doctor role
      if (!profile.user) return false;
      if (profile.user.declined === true) return false;
      if (profile.user.role !== "doctor") return false;
      return true;
    });

    // Filter doctors that have the specified treatment (case-insensitive match on main or sub-treatment)
    const matchingDoctors = availableDoctors.filter((doctor) => {
      if (!doctor.treatments || !Array.isArray(doctor.treatments)) {
        return false;
      }

      // Check if any treatment's mainTreatment or any subTreatment matches (case-insensitive)
      return doctor.treatments.some((treatment) => {
        const mainTreatment = treatment.mainTreatment?.trim() || "";
        // Match main treatment
        if (mainTreatment.toLowerCase() === treatmentQuery.toLowerCase()) {
          return true;
        }
        // Match sub-treatments
        if (treatment.subTreatments && Array.isArray(treatment.subTreatments)) {
          return treatment.subTreatments.some((sub) => {
            const subName = sub.name?.trim() || "";
            return subName.toLowerCase() === treatmentQuery.toLowerCase();
          });
        }
        return false;
      });
    });

    // Process doctors to format photos and other fields
    const formattedDoctors = matchingDoctors.map((doctor) => {
      const user = doctor.user || {};
      
      // Process photos array
      const photos = (doctor.photos || [])
        .map((photo) => {
          if (!photo) return null;
          if (photo.startsWith("http://") || photo.startsWith("https://")) {
            return photo;
          }
          if (photo.startsWith("/uploads/")) {
            return `${getBaseUrl()}${photo}`;
          }
          if (photo.includes("uploads/clinic/")) {
            const uploadsIndex = photo.indexOf("uploads/clinic/");
            const relativePath = "/" + photo.substring(uploadsIndex);
            return `${getBaseUrl()}${relativePath}`;
          }
          return `${getBaseUrl()}/uploads/clinic/${photo}`;
        })
        .filter(Boolean);

      // Process resumeUrl
      let resumeUrl = doctor.resumeUrl;
      if (resumeUrl && !resumeUrl.startsWith("http")) {
        if (resumeUrl.startsWith("/uploads/")) {
          resumeUrl = `${getBaseUrl()}${resumeUrl}`;
        } else if (resumeUrl.includes("uploads/clinic/")) {
          const uploadsIndex = resumeUrl.indexOf("uploads/clinic/");
          const relativePath = "/" + resumeUrl.substring(uploadsIndex);
          resumeUrl = `${getBaseUrl()}${relativePath}`;
        } else {
          resumeUrl = `${getBaseUrl()}/uploads/clinic/${resumeUrl}`;
        }
      }

      return {
        ...doctor,
        user: {
          ...user,
        },
        photos,
        resumeUrl,
      };
    });

    return res.status(200).json({
      success: true,
      doctors: formattedDoctors,
      count: formattedDoctors.length,
      treatment: treatmentQuery,
    });
  } catch (error) {
    // console.error("Error searching doctors by treatment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search doctors",
      error: error.message,
    });
  }
}

