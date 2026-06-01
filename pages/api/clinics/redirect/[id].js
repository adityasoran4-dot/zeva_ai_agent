/**
 * Redirect API for Old Clinic URLs
 * 
 * GET /api/clinics/redirect/[id]
 * 
 * Redirects old ObjectId-based URLs to new slug-based URLs
 * This ensures backward compatibility and prevents broken links
 */

import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import { getEntityRoute } from "../../../../lib/slugService";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ 
      success: false, 
      message: "Method not allowed" 
    });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Clinic ID is required",
      });
    }

    // Check if it's already a slug (not an ObjectId)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    if (!isObjectId) {
      // Already a slug, redirect to slug-based route
      const slugRoute = getEntityRoute('clinic', id);
      return res.redirect(302, slugRoute);
    }

    // Find clinic by ObjectId
    const clinic = await Clinic.findById(id);

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found",
      });
    }

    // If clinic has a slug, redirect to slug-based URL
    if (clinic.slug && clinic.slugLocked) {
      const slugRoute = getEntityRoute('clinic', clinic.slug);
      return res.redirect(301, slugRoute); // 301 = Permanent redirect
    }

    // ⚠️ FIXED: Redirect API should NOT generate slugs (GET requests should be idempotent)
    // If no slug exists, redirect to ObjectId-based URL
    // Slug generation should only happen during approval process, not on redirect
    // Use backfill script to generate slugs for existing approved clinics
    return res.redirect(302, `/clinics/${id}`);

  } catch (error) {
    console.error("Error in redirect API:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

