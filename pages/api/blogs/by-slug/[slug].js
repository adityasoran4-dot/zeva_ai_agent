/**
 * Slug-based Blog Fetch API
 * 
 * GET /api/blogs/by-slug/[slug]
 * 
 * Fetches blog by slug (paramlink) instead of ObjectId
 * This is the primary endpoint for public blog pages
 */

import dbConnect from "../../../../lib/database";
import Blog from "../../../../models/Blog";
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

    // Use central slug service to find blog by slug (paramlink)
    const blog = await findBySlug('blog', slug);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Populate postedBy field
    const populatedBlog = await Blog.findById(blog._id)
      .populate('postedBy', 'name email role')
      .lean();

    // Only return published blogs
    if (populatedBlog.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      success: true,
      blog: populatedBlog,
    });
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}


