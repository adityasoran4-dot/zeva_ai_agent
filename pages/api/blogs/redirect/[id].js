/**
 * Blog Redirect API
 * 
 * GET /api/blogs/redirect/[id]
 * 
 * Handles redirects from old ObjectId-based blog URLs to new slug-based URLs
 * This ensures backward compatibility for existing links
 */

import dbConnect from "../../../../lib/database";
import Blog from "../../../../models/Blog";
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
        message: "Blog ID is required",
      });
    }

    // Try to find blog by ObjectId
    let blog;
    try {
      blog = await Blog.findById(id);
    } catch (error) {
      // Invalid ObjectId format
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // If blog has a paramlink (slug) and it's locked, redirect to slug-based URL
    if (blog.paramlink && blog.slugLocked) {
      const slugRoute = getEntityRoute('blog', blog.paramlink);
      return res.redirect(301, slugRoute);
    }

    // Fallback: redirect to ObjectId-based URL (backward compatibility)
    // This should rarely happen if slug generation is working correctly
    return res.redirect(301, `/blog/${blog._id}`);
  } catch (error) {
    console.error("Error in blog redirect:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}


