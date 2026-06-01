// pages/api/users/comments-with-replies.js

import dbConnect from '../../../lib/database';
import Blog from '../../../models/Blog';
import { verifyAuth } from '../blog/verifyAuth'; // adjust path as needed

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const user = await verifyAuth(req, res);
  if (!user) return; // verifyAuth already sends response if not authorized

  try {
    // Find published blogs where the user has commented
    const blogs = await Blog.find({
      'comments.user': user._id,
      status: 'published'
    })
      .select('title postedBy comments')
      .lean();

    const commentsWithReplies = [];

    blogs.forEach(blog => {
      blog.comments.forEach(comment => {
        // Include only if it's the current user's comment AND has replies
        if (
          String(comment.user) === String(user._id) &&
          Array.isArray(comment.replies) &&
          comment.replies.length > 0
        ) {
          commentsWithReplies.push({
            blogId: blog._id,
            blogTitle: blog.title,
            blogAuthor: blog.postedBy,
            commentId: comment._id,
            commentText: comment.text,
            commentCreatedAt: comment.createdAt,
            replies: comment.replies
          });
        }
      });
    });

    res.status(200).json({ success: true, commentsWithReplies });
  } catch (error) {
    console.error('Error fetching user comments with replies:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
