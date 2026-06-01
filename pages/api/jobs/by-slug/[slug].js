/**
 * Slug-based Job Fetch API
 * 
 * GET /api/jobs/by-slug/[slug]
 * 
 * Fetches job by slug instead of ObjectId
 * This is the primary endpoint for public job pages
 */

import dbConnect from "../../../../lib/database";
import JobPosting from "../../../../models/JobPosting";
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

    // Use central slug service to find job by slug
    const job = await findBySlug('job', slug);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Populate postedBy field
    const populatedJob = await JobPosting.findById(job._id)
      .populate('postedBy', 'name email role')
      .populate('clinicId', 'name')
      .populate('doctorId', 'name')
      .lean();

    // Only return approved jobs
    if (populatedJob.status !== 'approved') {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      job: populatedJob,
    });
  } catch (error) {
    // console.error("Error fetching job by slug:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

