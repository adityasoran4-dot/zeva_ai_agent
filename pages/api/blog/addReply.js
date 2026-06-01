import dbConnect from '../../../lib/database';
import Blog from '../../../models/Blog';
import { verifyAuth } from './verifyAuth';
import Notification from "../../../models/Notification";
import { emitNotificationToUser } from "../push-notification/socketio";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Verify authentication - allows any authenticated user
  const user = await verifyAuth(req, res);
  if (!user) return; // Already handled error inside verifyAuth

  const { blogId, commentId, text } = req.body;
  if (!blogId || !commentId || !text?.trim()) {
    return res.status(400).json({ success: false, error: 'Blog ID, Comment ID & text are required' });
  }

  try {
    // Try to find by paramlink first (for SEO-friendly URLs), then fallback to _id
    let blog = await Blog.findOne({ paramlink: blogId, status: "published" });
    if (!blog) {
      // Fallback to MongoDB _id
      blog = await Blog.findById(blogId);
    }
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    const comment = blog.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // Add reply
    comment.replies.push({
      user: user._id,
      username: user.name,
      text: text.trim(),
      createdAt: new Date()
    });

    await blog.save();

    // Send notification to comment author (if they're not replying to themselves)
    if (comment.user.toString() !== user._id.toString()) {
      try {
        await Notification.create({
          user: comment.user,
          message: `You received a reply on your comment in "${blog.title}"`,
          relatedBlog: blog._id,
          type: "blog-reply", 
          relatedComment: comment._id,
        });

        emitNotificationToUser(comment.user.toString(), {
          message: `You received a reply on your comment in "${blog.title}"`,
          relatedBlog: blog._id,
          type: "blog-reply",
          relatedComment: comment._id,
          createdAt: new Date(),
        });
      } catch (notifError) {
        // console.error("Error sending notification:", notifError);
        // Don't fail the request if notification fails
      }
    }

    // Return the updated comment with replies
    const updatedComment = blog.comments.id(commentId);
    const responseComment = {
      _id: updatedComment._id.toString(),
      user: updatedComment.user.toString(),
      username: updatedComment.username,
      text: updatedComment.text,
      createdAt: updatedComment.createdAt.toISOString(),
      replies: (updatedComment.replies || []).map((r) => ({
        _id: r._id.toString(),
        user: r.user.toString(),
        username: r.username,
        text: r.text,
        createdAt: r.createdAt.toISOString(),
      })),
    };

    res.status(200).json({ success: true, comment: responseComment });
  } catch (error) {
    // console.error("Error in addReply API:", error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
