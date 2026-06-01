import dbConnect from "../../../lib/database";
import DoctorProfile from "../../../models/DoctorProfile";
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
    }

    // If user is an agent, check read permission for admin_approval_doctors module
    if (['agent', 'doctorStaff'].includes(me.role)) {
      const { hasPermission, error: permissionError } = await checkAgentPermission(
        me._id,
        "admin_approval_doctors", // moduleKey
        "read", // action
        null // subModuleName
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permissionError || "You do not have permission to view doctors"
        });
      }
    }
    // Admin users bypass permission checks
    const doctorProfiles = await DoctorProfile.find()
      .populate("user", "name email phone isApproved declined password")
      .select("degree experience address treatments resumeUrl user slug slugLocked")
      .lean();

    // Set base URL for resume URLs
    const getBaseUrl = () => {
      if (process.env.NODE_ENV === "production") {
        return "https://zeva360.com";
      }
      return process.env.NEXT_PUBLIC_BASE_URL;
    };

    // Convert resume URLs to full URLs
    const processedProfiles = doctorProfiles.map((profile) => {
      if (profile.resumeUrl) {
        // Handle corrupted URLs that contain full file system paths
        let cleanResumeUrl = profile.resumeUrl;

        // If the URL contains a full file system path, extract just the filename
        if (cleanResumeUrl.includes("uploads/clinic/")) {
          const filenameMatch = cleanResumeUrl.match(
            /uploads\/clinic\/[^\/]+$/
          );
          if (filenameMatch) {
            cleanResumeUrl = `/${filenameMatch[0]}`;
          }
        }

        // Convert to full URL
        profile.resumeUrl = cleanResumeUrl.startsWith("http")
          ? cleanResumeUrl
          : `${getBaseUrl()}${cleanResumeUrl}`;
      }
      return profile;
    });

    res.status(200).json({ success: true, doctorProfiles: processedProfiles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
