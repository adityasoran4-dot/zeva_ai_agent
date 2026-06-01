import dbConnect from "../../../lib/database";
import Blog from "../../../models/Blog";
import "../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const blogs = await Blog.find({ status: "published" })
        .populate("postedBy", "name email") // optional: show who posted
        .select("+paramlink +slugLocked") // Include slug fields
        .sort({ createdAt: -1 })
        .lean(); // Convert to plain JS objects

      // Add likesCount field
      const blogsWithLikes = blogs.map((blog) => ({
        ...blog,
        likesCount: blog.likes ? blog.likes.length : 0,
        commentsCount: blog.comments ? blog.comments.length : 0,
      }));

      res.status(200).json({ success: true, data: blogsWithLikes });
    } catch (error) {
      // console.error(error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  } else {
    res.status(405).json({ success: false, error: "Method not allowed" });
  }
}
