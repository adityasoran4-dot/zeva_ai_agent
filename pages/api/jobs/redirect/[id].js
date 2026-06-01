/**
 * Job Redirect API
 * 
 * GET /api/jobs/redirect/[id]
 * 
 * Handles redirects from old ObjectId-based job URLs to new slug-based URLs
 * This ensures backward compatibility for existing links
 */

import dbConnect from "../../../../lib/database";
import JobPosting from "../../../../models/JobPosting";
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
        message: "Job ID is required",
      });
    }

    // Try to find job by ObjectId
    let job;
    try {
      job = await JobPosting.findById(id);
    } catch (error) {
      // Invalid ObjectId format
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // If job has a slug and it's locked, redirect to slug-based URL
    if (job.slug && job.slugLocked) {
      const slugRoute = getEntityRoute('job', job.slug);
      return res.redirect(301, slugRoute);
    }

    // Fallback: redirect to ObjectId-based URL (backward compatibility)
    // This should rarely happen if slug generation is working correctly
    return res.redirect(301, `/job-details/${job._id}`);
  } catch (error) {
    // console.error("Error in job redirect:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

