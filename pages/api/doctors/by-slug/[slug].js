/**
 * Slug-based Doctor Fetch API
 * 
 * GET /api/doctors/by-slug/[slug]
 * 
 * Fetches doctor by slug instead of ObjectId
 * This is the primary endpoint for public doctor pages
 */

import dbConnect from "../../../../lib/database";
import DoctorProfile from "../../../../models/DoctorProfile";
import User from "../../../../models/Users";
import { findBySlug } from "../../../../lib/slugService";

// Helper to get base URL
function getBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return "https://zeva360.com";
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ 
      success: false, 
      message: "Method not allowed" 
    });
  }

  try {
    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    // Use central slug service to find doctor by slug
    const doctorProfile = await findBySlug('doctor', slug);

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Populate user to check approval status
    const profile = await DoctorProfile.findById(doctorProfile._id)
      .populate('user', 'name email phone isApproved')
      .lean();

    // Only return approved doctors for public access
    if (!profile.user?.isApproved) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Ensure photos are absolute URLs
    if (profile.photos && Array.isArray(profile.photos)) {
      profile.photos = profile.photos.map((photo) => {
        if (!photo) return photo;
        // If already an absolute URL, return as is
        if (photo.startsWith("http://") || photo.startsWith("https://")) {
          return photo;
        }
        // If it's a file system path, extract the uploads part
        if (photo.includes("uploads/")) {
          const uploadsIndex = photo.indexOf("uploads/");
          const relativePath = "/" + photo.substring(uploadsIndex);
          return `${getBaseUrl()}${relativePath}`;
        }
        // If it starts with /, prepend base URL
        if (photo.startsWith("/")) {
          return `${getBaseUrl()}${photo}`;
        }
        // Otherwise, prepend /uploads/doctor/ if it looks like a filename
        return `${getBaseUrl()}/uploads/doctor/${photo}`;
      });
    }

    if (profile.resumeUrl) {
      profile.resumeUrl = profile.resumeUrl.startsWith("http")
        ? profile.resumeUrl
        : `${getBaseUrl()}${profile.resumeUrl}`;
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    // console.error("Error fetching doctor by slug:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

