// pages/api/blog/getBlogById.js
import dbConnect from "../../../lib/database";
import Blog from "../../../models/Blog";
import jwt from "jsonwebtoken";
import "../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { id } = req.query;
      if (!id) {
        return res
          .status(400)
          .json({ success: false, error: "Blog ID is required" });
      }

      // ✅ Get logged in user from Authorization header
      let userId = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key"
          );
          userId = decoded.userId;
        } catch {
          userId = null; // ignore invalid token
        }
      }

      let blog = await Blog.findOne({ paramlink: id })
        .populate("postedBy", "name email")
        .lean();
      if (!blog) {
        // fallback to MongoDB _id
        blog = await Blog.findById(id)
          .populate("postedBy", "name email")
          .lean();
      }

      if (!blog) {
        return res
          .status(404)
          .json({ success: false, error: "Blog not found" });
      }

      // ✅ Add like count & liked status
      const likesCount = blog.likes?.length || 0;
      const liked = userId
        ? blog.likes.some((uid) => uid.toString() === userId)
        : false;

      res.status(200).json({
        success: true,
        blog: {
          ...blog,
          likesCount,
          liked,
        },
      });
    } catch (error) {
      // console.error(error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  } else {
    res.status(405).json({ success: false, error: "Method not allowed" });
  }
}
