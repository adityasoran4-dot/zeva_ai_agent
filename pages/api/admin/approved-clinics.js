// pages/api/admin/approved-clinics.ts
import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
    }

    // If user is an agent, check read permission for admin_approval_clinic module
    if (['agent', 'doctorStaff'].includes(me.role)) {
      const { hasPermission, error: permissionError } = await checkAgentPermission(
        me._id,
        "admin_approval_clinic", // moduleKey
        "read", // action
        null // subModuleName
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permissionError || "You do not have permission to view approved clinics"
        });
      }
    }
    // Admin users bypass permission checks
    const approved = await Clinic.find({ isApproved: true }).populate(
      "owner",
      "email name phone"
    );

    // Set base URL for images
    const getBaseUrl = () => {
      if (process.env.NODE_ENV === "production") {
        return "https://zeva360.com";
      }
     return process.env.NEXT_PUBLIC_BASE_URL;
    };

    // Process clinic data to ensure consistent image URLs
    const processedClinics = approved.map((clinic) => {
      const clinicObj = clinic.toObject ? clinic.toObject() : { ...clinic };

      // Process photos array
      if (clinicObj.photos && clinicObj.photos.length > 0) {
        clinicObj.photos = clinicObj.photos.map((photo) => {
          // If it's already a full URL, return as is
          if (photo.startsWith("http")) {
            return photo;
          }
          // If it's a relative path, convert to full URL
          if (photo.startsWith("/")) {
            return `${getBaseUrl()}${photo}`;
          }
          // If it contains uploads/clinic/, extract and convert
          if (photo.includes("uploads/clinic/")) {
            const filenameMatch = photo.match(/uploads\/clinic\/[^\/]+$/);
            if (filenameMatch) {
              return `${getBaseUrl()}/${filenameMatch[0]}`;
            }
          }
          // Default fallback
          return `${getBaseUrl()}/uploads/clinic/${photo}`;
        });
      }

      return clinicObj;
    });

    res.status(200).json({ clinics: processedClinics });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}
