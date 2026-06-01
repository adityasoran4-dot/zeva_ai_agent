/**
 * Slug-based Clinic Fetch API
 * 
 * GET /api/clinics/by-slug/[slug]
 * 
 * Fetches clinic by slug instead of ObjectId
 * This is the primary endpoint for public clinic pages
 */

import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
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

    // Use central slug service to find clinic by slug
    let clinic;
    try {
      clinic = await findBySlug('clinic', slug);
    } catch (slugError) {
      console.error("Error in findBySlug:", slugError);
      return res.status(500).json({
        success: false,
        message: "Error searching for clinic",
        error: slugError.message,
      });
    }

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: `Clinic not found with slug: ${slug}`,
      });
    }

    // Only return approved clinics for public access
    if (!clinic.isApproved) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found or not approved",
      });
    }

    // Convert to plain object for JSON serialization
    const clinicData = clinic.toObject ? clinic.toObject() : clinic;

    // Ensure photos are absolute URLs
    if (clinicData.photos && Array.isArray(clinicData.photos)) {
      clinicData.photos = clinicData.photos.map((photo) => {
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
        // Otherwise, prepend /uploads/clinic/ if it looks like a filename
        return `${getBaseUrl()}/uploads/clinic/${photo}`;
      });
    }

    if (clinicData.licenseDocumentUrl) {
      clinicData.licenseDocumentUrl = clinicData.licenseDocumentUrl.startsWith("http")
        ? clinicData.licenseDocumentUrl
        : `${getBaseUrl()}${clinicData.licenseDocumentUrl}`;
    }

    return res.status(200).json({
      success: true,
      clinic: clinicData,
    });
  } catch (error) {
    console.error("Error fetching clinic by slug:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

