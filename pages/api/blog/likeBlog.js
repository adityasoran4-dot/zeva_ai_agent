// pages/api/blog/likeBlog.js
import dbConnect from "../../../lib/database";
import Blog from "../../../models/Blog";
import { verifyAuth } from "./verifyAuth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const user = await verifyAuth(req, res);
  if (!user) return;

  const { blogId } = req.body;
  if (!blogId) {
    return res
      .status(400)
      .json({ success: false, error: "Blog ID is required" });
  }

  try {
    // Try to find by paramlink first (for SEO-friendly URLs), then fallback to _id
    let blog = await Blog.findOne({ paramlink: blogId, status: "published" });
    if (!blog) {
      // Fallback to MongoDB _id
      blog = await Blog.findById(blogId);
    }
    if (!blog) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }

    // Ensure likes array exists (initialize if undefined/null)
    if (!blog.likes || !Array.isArray(blog.likes)) {
      blog.likes = [];
    }

    // Check if user already liked the blog
    const alreadyLiked = blog.likes.some((id) => {
      if (!id) return false;
      // Handle both ObjectId and string comparisons
      return id.toString() === user._id.toString() || id.equals(user._id);
    });

    if (alreadyLiked) {
      // Unlike: remove user from likes array
      blog.likes = blog.likes.filter((id) => {
        if (!id) return false;
        return id.toString() !== user._id.toString() && !id.equals(user._id);
      });
    } else {
      // Like: add user to likes array (avoid duplicates)
      const userAlreadyInLikes = blog.likes.some((id) => {
        if (!id) return false;
        return id.toString() === user._id.toString() || id.equals(user._id);
      });
      if (!userAlreadyInLikes) {
        blog.likes.push(user._id);
      }
    }

    await blog.save();

    res.status(200).json({
      success: true,
      likesCount: blog.likes ? blog.likes.length : 0,
      liked: !alreadyLiked,
    });
  } catch (error) {
    // console.error('Error in likeBlog API:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
