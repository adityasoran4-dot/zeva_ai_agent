import dbConnect from "../../../lib/database";
import Blog from "../../../models/Blog";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { blogId, commentId } = req.query;
  if (!blogId || !commentId) {
    return res
      .status(400)
      .json({ success: false, error: "Blog ID and Comment ID are required" });
  }

  try {
    const blog = await Blog.findById(blogId).lean();
    if (!blog) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }
    const comment = (blog.comments || []).find(
      (c) => String(c._id) === String(commentId)
    );
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, error: "Comment not found" });
    }
    // Return replies (default to empty array)
    return res
      .status(200)
      .json({ success: true, replies: comment.replies || [] });
  } catch (error) {
    // console.error("Error fetching comment replies:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}
