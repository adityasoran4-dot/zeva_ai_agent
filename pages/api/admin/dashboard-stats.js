import dbConnect from '../../../lib/database';
import User from '../../../models/Users';
import Clinic from '../../../models/Clinic';
import DoctorProfile from '../../../models/DoctorProfile';
import Blog from '../../../models/Blog';
import JobPosting from '../../../models/JobPosting';
import GetInTouch from '../../../models/GetInTouch';
import Treatment from '../../../models/Treatment';
import ClinicPermission from '../../../models/ClinicPermission';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }

    // Fetch all stats in parallel
    const [
      totalUsers,
      pendingClinics,
      approvedClinics,
      pendingDoctors,
      approvedDoctors,
      totalBlogs,
      pendingJobs,
      approvedJobs,
      declinedJobs,
      callBackRequests,
      totalStaff,
      totalAgents,
      totalTreatments,
      totalPermissions,
    ] = await Promise.all([
      // Users
      User.countDocuments({ role: 'user' }),
      
      // Clinics
      Clinic.countDocuments({ isApproved: false }),
      Clinic.countDocuments({ isApproved: true }),
      
      // Doctors
      (async () => {
        const doctorUsers = await User.find({ role: 'doctor' }).select('_id isApproved');
        const pendingDoctorIds = doctorUsers.filter(u => !u.isApproved).map(u => u._id);
        return DoctorProfile.countDocuments({ user: { $in: pendingDoctorIds } });
      })(),
      (async () => {
        const doctorUsers = await User.find({ role: 'doctor' }).select('_id isApproved');
        const approvedDoctorIds = doctorUsers.filter(u => u.isApproved).map(u => u._id);
        return DoctorProfile.countDocuments({ user: { $in: approvedDoctorIds } });
      })(),
      
      // Blogs
      Blog.countDocuments({ status: 'published' }),
      
      // Jobs
      JobPosting.countDocuments({ status: 'pending' }),
      JobPosting.countDocuments({ status: 'approved' }),
      JobPosting.countDocuments({ status: 'declined' }),
      
      // Call Back Requests
      GetInTouch.countDocuments(),
      
      // Staff
      User.countDocuments({ role: { $in: ['staff', 'doctorStaff'] } }),
      
      // Agents
      User.countDocuments({ role: 'agent' }),
      
      // Treatments
      Treatment.countDocuments(),
      
      // Permissions
      ClinicPermission.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
        },
        clinics: {
          pending: pendingClinics,
          approved: approvedClinics,
          total: pendingClinics + approvedClinics,
        },
        doctors: {
          pending: pendingDoctors,
          approved: approvedDoctors,
          total: pendingDoctors + approvedDoctors,
        },
        blogs: {
          total: totalBlogs,
        },
        jobs: {
          pending: pendingJobs,
          approved: approvedJobs,
          declined: declinedJobs,
          total: pendingJobs + approvedJobs + declinedJobs,
        },
        callBackRequests: {
          total: callBackRequests,
        },
        staff: {
          total: totalStaff,
        },
        agents: {
          total: totalAgents,
        },
        treatments: {
          total: totalTreatments,
        },
        permissions: {
          total: totalPermissions,
        },
      },
    });
  } catch (error) {
    // console.error('Dashboard stats error:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

