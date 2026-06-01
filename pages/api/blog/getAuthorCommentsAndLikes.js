import dbConnect from '../../../lib/database';
import Blog from '../../../models/Blog';
import User from '../../../models/Users';
import Clinic from '../../../models/Clinic';
import { getUserFromReq, requireRole } from '../lead-ms/auth';
import { getClinicIdFromUser, checkClinicPermission } from '../lead-ms/permissions-helper';
import { checkAgentPermission } from '../agent/permissions-helper';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me || !requireRole(me, ["clinic", "doctor", "doctorStaff", "agent", "admin"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { clinicId, error, isAdmin } = await getClinicIdFromUser(me);
    const isDoctor = me.role === "doctor";
    const isDoctorStaff = me.role === "doctorStaff";
    const isAgent = me.role === "agent";
    if (error && !isAdmin && !isDoctor && !isDoctorStaff && !isAgent) {
      return res.status(404).json({ success: false, message: error });
    }

    // ✅ Check permission for reading analytics (only for agent/doctorStaff, clinic/admin/doctor bypass)
    if (!["admin", "clinic", "doctor"].includes(me.role) && clinicId) {
      if (isAgent || isDoctorStaff) {
        const result = await checkAgentPermission(
          me._id,
          "clinic_write_blog", // Use clinic_write_blog to match the module key format
          "read",
          null // Module-level check for analytics
        );
        if (!result.hasPermission) {
          return res.status(403).json({
            success: false,
            message: result.error || "You do not have permission to view blog analytics"
          });
        }
      }
      // Clinic, admin, and doctor users bypass permission checks
    }

    // Find all blogs - for agent/doctorStaff, find blogs from their clinic
    let blogQuery = { status: 'published' };

    if ((isAgent || isDoctorStaff) && clinicId) {
      // Find clinic owner and all users from this clinic
      const clinic = await Clinic.findById(clinicId).select("owner");
      if (clinic) {
        const clinicUsers = await User.find({
          $or: [
            { _id: clinic.owner }, // Clinic owner
            { clinicId: clinicId, role: "doctor" }, // Doctors from this clinic
          ],
        }).select("_id");
        const clinicUserIds = clinicUsers.map(u => u._id);
        
        // Include the current user (agent/doctorStaff) in the list so their own blogs show up
        clinicUserIds.push(me._id);
        
        blogQuery.postedBy = { $in: clinicUserIds };
      } else {
        // Fallback if clinic not found
        blogQuery.postedBy = me._id;
      }
    } else if (isAdmin) {
      // Admin can see all blogs - no filter needed
      blogQuery = { status: 'published' };
    } else if (me.role === "doctor") {
      // For doctor, find blogs posted by this user
      blogQuery.postedBy = me._id;
    } else {
      // For clinic role, find blogs posted by the clinic owner and all clinic users (similar to job-postings pattern)
      const orConditions = [{ postedBy: me._id }];
      
      if (clinicId) {
        // Find clinic owner and all users from this clinic
        const clinic = await Clinic.findById(clinicId).select("owner");
        const clinicUserIds = [];
        
        // Add clinic owner (who posted the blogs)
        if (clinic && clinic.owner) {
          clinicUserIds.push(clinic.owner);
        }
        
        // Add all users with this clinicId (agents, staff, doctors, etc.)
        const clinicUsers = await User.find({ 
          clinicId: clinicId 
        }).select("_id");
        
        clinicUsers.forEach(u => {
          if (!clinicUserIds.some(id => id.toString() === u._id.toString())) {
            clinicUserIds.push(u._id);
          }
        });
        
        if (clinicUserIds.length > 0) {
          orConditions.push({ postedBy: { $in: clinicUserIds } });
        }
      }
      
      blogQuery.$or = orConditions;
    }

    const blogs = await Blog.find(blogQuery)
      .select('title likes comments createdAt')
      .lean();

    const response = blogs.map(blog => ({
      _id: blog._id,
      title: blog.title,
      likesCount: blog.likes?.length || 0,
      commentsCount: blog.comments?.length || 0,
      comments: blog.comments || [],
      createdAt: blog.createdAt,
    }));

    res.status(200).json({ success: true, blogs: response });
  } catch (error) {
    // console.error('Error fetching author blogs:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
