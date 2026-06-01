// /pages/api/admin/pending-counts.js

import dbConnect from '../../../lib/database';
import Clinic from '../../../models/Clinic';
import DoctorProfile from '../../../models/DoctorProfile';
import User from '../../../models/Users';
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

    // Pending clinic count
    const pendingClinicCount = await Clinic.countDocuments({ isApproved: false });

    // Approved clinic count
    const approvedClinicCount = await Clinic.countDocuments({ isApproved: true });

    // Get all doctor user IDs based on role
    const doctorUsers = await User.find({ role: 'doctor' }).select('_id isApproved');

    const approvedDoctorIds = doctorUsers.filter(u => u.isApproved).map(u => u._id);
    const pendingDoctorIds = doctorUsers.filter(u => !u.isApproved).map(u => u._id);

    const pendingDoctorCount = await DoctorProfile.countDocuments({ user: { $in: pendingDoctorIds } });
    const approvedDoctorCount = await DoctorProfile.countDocuments({ user: { $in: approvedDoctorIds } });

    return res.status(200).json({
      success: true,
      pendingClinicCount,
      approvedClinicCount,
      pendingDoctorCount,
      approvedDoctorCount,
    });

  } catch (error) {
    // console.error('Admin pending count error:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}
