// pages/api/blogs/blogw.js
import dbConnect from '../../../lib/database';
import Blog from '../../../models/Blog';
import Clinic from '../../../models/Clinic';
import { getUserFromReq, requireRole } from '../lead-ms/auth';

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        try {
          const me = await getUserFromReq(req);
          if (!me || !requireRole(me, ["clinic", "doctor", "admin"])) {
            return res.status(403).json({ success: false, message: "Access denied" });
          }

          let clinicId;
          if (me.role === "clinic") {
            const clinic = await Clinic.findOne({ owner: me._id }).select("_id");
            if (!clinic) {
              return res.status(404).json({ success: false, message: "Clinic not found for this user" });
            }
            clinicId = clinic._id;
          }

          // ✅ Check permission for creating blogs (only for agent/doctorStaff, clinic/admin/doctor bypass)
          // Clinic, admin, and doctor users bypass permission checks

          const { title, content, status = 'draft' } = req.body;
          
          if (!title || !content) {
            return res.status(400).json({ 
              success: false, 
              message: 'Title and content are required' 
            });
          }

          const blog = await Blog.create({ 
            title, 
            content, 
            status,
            postedBy: me._id,
            role: me.role
          });
          
          // Populate the postedBy field to return user info
          const populatedBlog = await Blog.findById(blog._id).populate('postedBy', 'name email');
          
          res.status(201).json({ 
            success: true, 
            blog: populatedBlog 
          });
        } catch (error) {
          // console.error("Error in POST create blog:", error);
          res.status(500).json({ success: false, message: "Internal server error" });
        }
        break;

      case 'GET':
        try {
          const { id } = req.query;
          
          if (id) {
            // Get single blog by ID (public access)
            const blog = await Blog.findById(id).populate('postedBy', 'name email');
            if (!blog) {
              return res.status(404).json({ success: false, message: 'Blog not found' });
            }
            return res.status(200).json({ success: true, blog });
          }
          
          // Get all blogs (public access)
          const blogs = await Blog.find()
            .populate('postedBy', 'name email')
            .sort({ createdAt: -1 });
          res.status(200).json({ success: true, blogs });
        } catch (error) {
          res.status(400).json({ success: false, error: error.message });
        }
        break;

      case 'PUT':
        try {
          const me = await getUserFromReq(req);
          if (!me || !requireRole(me, ["clinic", "doctor", "admin"])) {
            return res.status(403).json({ success: false, message: "Access denied" });
          }

          const { id } = req.query;
          const { title, content, status } = req.body;
          
          if (!id) {
            return res.status(400).json({ success: false, message: 'Blog ID required' });
          }

          // Find the existing blog
          const existingBlog = await Blog.findById(id);
          if (!existingBlog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
          }

          // Check if user owns the blog or is admin
          if (existingBlog.postedBy.toString() !== me._id.toString() && me.role !== 'admin') {
            return res.status(403).json({ 
              success: false, 
              message: 'You can only edit your own blogs unless you are an admin' 
            });
          }

          let clinicId;
          if (me.role === "clinic") {
            const clinic = await Clinic.findOne({ owner: me._id }).select("_id");
            if (!clinic) {
              return res.status(404).json({ success: false, message: "Clinic not found for this user" });
            }
            clinicId = clinic._id;
          }

          // ✅ Check permission for updating blogs (only for agent/doctorStaff, clinic/admin/doctor bypass)
          // Clinic, admin, and doctor users bypass permission checks
          
          const updatedBlog = await Blog.findByIdAndUpdate(
            id,
            { 
              title, 
              content, 
              status,
              updatedAt: new Date()
            },
            { new: true, runValidators: true }
          ).populate('postedBy', 'name email');
          
          res.status(200).json({ success: true, blog: updatedBlog });
        } catch (error) {
          // console.error("Error in PUT create blog:", error);
          res.status(500).json({ success: false, message: "Internal server error" });
        }
        break;

      case 'DELETE':
        try {
          const me = await getUserFromReq(req);
          if (!me || !requireRole(me, ["clinic", "doctor", "admin"])) {
            return res.status(403).json({ success: false, message: "Access denied" });
          }

          const { id } = req.query;
          
          if (!id) {
            return res.status(400).json({ success: false, message: 'Blog ID required' });
          }

          // Find the existing blog
          const existingBlog = await Blog.findById(id);
          if (!existingBlog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
          }

          // Check if user owns the blog or is admin
          if (existingBlog.postedBy.toString() !== me._id.toString() && me.role !== 'admin') {
            return res.status(403).json({ 
              success: false, 
              message: 'Not allowed to access this blog' 
            });
          }

          let clinicId;
          if (me.role === "clinic") {
            const clinic = await Clinic.findOne({ owner: me._id }).select("_id");
            if (!clinic) {
              return res.status(404).json({ success: false, message: "Clinic not found for this user" });
            }
            clinicId = clinic._id;
          }

          // ✅ Check permission for deleting blogs (only for agent/doctorStaff, clinic/admin/doctor bypass)
          // Clinic, admin, and doctor users bypass permission checks

          await Blog.findByIdAndDelete(id);
          res.status(200).json({ success: true, message: 'Blog deleted successfully' });
        } catch (error) {
          // console.error("Error in DELETE create blog:", error);
          res.status(500).json({ success: false, message: "Internal server error" });
        }
        break;

      default:
        res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    // console.error("Error in create blog API:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}