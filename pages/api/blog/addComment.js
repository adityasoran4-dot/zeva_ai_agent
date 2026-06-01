// pages/api/blog/addComment.js
import dbConnect from '../../../lib/database';
import Blog from '../../../models/Blog';
import { verifyAuth } from './verifyAuth';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const user = await verifyAuth(req, res);
  if (!user) return; // Already handled error inside verifyAuth

  const { blogId, text } = req.body;
  if (!blogId || !text?.trim()) {
    return res.status(400).json({ success: false, error: 'Blog ID & text are required' });
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

    const newComment = {
      user: user._id,
      username: user.name,
      text: text.trim(),
      createdAt: new Date(),
      replies: [] // Initialize empty replies array
    };

    blog.comments.push(newComment);
    await blog.save();

    // Return only the newly created comment with proper structure
    const createdComment = blog.comments[blog.comments.length - 1];
    const responseComment = {
      _id: createdComment._id.toString(),
      user: createdComment.user.toString(),
      username: createdComment.username,
      text: createdComment.text,
      createdAt: createdComment.createdAt.toISOString(),
      replies: createdComment.replies || []
    };

    res.status(200).json({ 
      success: true, 
      comment: responseComment, // Return single comment instead of all comments
      commentsCount: blog.comments.length 
    });

  } catch (error) {
    // console.error('Error adding comment:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
}