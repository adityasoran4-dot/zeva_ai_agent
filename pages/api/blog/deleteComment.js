import dbConnect from '../../../lib/database';
import Blog from '../../../models/Blog';
import User from '../../../models/Users';
import Clinic from '../../../models/Clinic';
import { getUserFromReq, requireRole } from '../lead-ms/auth';
import { getClinicIdFromUser, checkClinicPermission } from '../lead-ms/permissions-helper';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me || !requireRole(me, ["clinic", "doctor", "doctorStaff", "agent", "admin"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { blogId, commentId } = req.body;

    if (!blogId || !commentId) {
      return res.status(400).json({ success: false, error: 'Blog ID & Comment ID are required' });
    }

    // Try to find by paramlink first (for SEO-friendly URLs), then fallback to _id
    let blog = await Blog.findOne({ paramlink: blogId, status: "published" });
    if (!blog) {
      // Fallback to MongoDB _id
      blog = await Blog.findById(blogId);
    }
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    // ✅ Check if user owns the blog or is from the same clinic (for agent/doctorStaff)
    const { clinicId, error, isAdmin } = await getClinicIdFromUser(me);
    const isDoctor = me.role === "doctor";
    const isDoctorStaff = me.role === "doctorStaff";
    const isAgent = me.role === "agent";
    
    const isBlogAuthor = blog.postedBy.toString() === me._id.toString();
    
    // For agent/doctorStaff, check if blog is from their clinic
    let isClinicBlog = false;
    if ((isAgent || isDoctorStaff) && clinicId && !isBlogAuthor) {
      const clinic = await Clinic.findById(clinicId).select("owner");
      if (clinic) {
        const clinicUsers = await User.find({
          $or: [
            { _id: clinic.owner },
            { clinicId: clinicId, role: "doctor" },
          ],
        }).select("_id");
        const clinicUserIds = clinicUsers.map(u => u._id.toString());
        isClinicBlog = clinicUserIds.includes(blog.postedBy.toString());
      }
    }
    
    // Only blog author, clinic users (agent/doctorStaff) with permission, or admin can delete comments
    if (isBlogAuthor || isClinicBlog || isAdmin) {
      // ✅ Check permission for deleting comments (only for agent/doctorStaff, clinic/admin/doctor bypass)
      if (!["admin", "clinic", "doctor"].includes(me.role) && clinicId) {
        if (isAgent || isDoctorStaff) {
          const { checkAgentPermission } = await import("../agent/permissions-helper");
          const result = await checkAgentPermission(
            me._id,
            "clinic_write_blog",
            "delete",
            null
          );
          if (!result.hasPermission) {
            return res.status(403).json({
              success: false,
              message: result.error || "You do not have permission to delete comments"
            });
          }
        }
        // Clinic, admin, and doctor users bypass permission checks
      }
    }

    // Try top-level comment first
    let comment = blog.comments.id(commentId);

    if (comment) {
      const isOwner = String(comment.user) === String(me._id);
      if (!isOwner && !isBlogAuthor && me.role !== "admin") {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this comment' });
      }
      comment.deleteOne();
    } else {
      // Search in replies
      let parentComment = blog.comments.find(c =>
        c.replies?.some(r => String(r._id) === String(commentId))
      );

      if (!parentComment) {
        return res.status(404).json({ success: false, error: 'Comment not found' });
      }

      const reply = parentComment.replies.id(commentId);
      const isOwner = String(reply.user) === String(me._id);
      if (!isOwner && !isBlogAuthor && me.role !== "admin") {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this reply' });
      }

      reply.deleteOne();
    }

    await blog.save();
    return res.status(200).json({ success: true, message: 'Comment/reply deleted successfully' });
  } catch (error) {
    // console.error("Error in deleteComment API:", error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
