// pages/api/clinic/verify-token.js
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/database';
import Clinic from '../../../models/Clinic';
import User from '../../../models/Users';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false, message: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Allow clinic, agent, doctor, doctorStaff, and staff roles
    const allowedRoles = ['clinic', 'agent', 'doctor', 'doctorStaff', 'staff'];
    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ valid: false, message: 'Invalid role' });
    }

    const userId = decoded?.userId || decoded?.id;

    if (!userId) {
      return res.status(401).json({ valid: false, message: 'Invalid token format' });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ valid: false, message: 'User not found' });
    }

    // Verify user has allowed role
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ valid: false, message: 'Access denied. Invalid user role' });
    }

    let clinic = null;
    let clinicId = null;

    // Find the clinic associated with this user
    if (user.role === 'clinic') {
      // For clinic role, find clinic by owner
      clinic = await Clinic.findOne({ owner: userId });
      if (!clinic) {
        return res.status(404).json({ valid: false, message: 'Clinic not found for this user' });
      }
      clinicId = clinic._id;
    } else if (['agent', 'doctor', 'doctorStaff', 'staff'].includes(user.role)) {
      // For other roles, use their clinicId
      if (!user.clinicId) {
        return res.status(403).json({ valid: false, message: 'User not linked to a clinic' });
      }
      clinicId = user.clinicId;
      clinic = await Clinic.findById(clinicId);
      if (!clinic) {
        return res.status(404).json({ valid: false, message: 'Clinic not found' });
      }
    }

    // Check if clinic is approved (only for clinic role, others inherit clinic status)
    if (user.role === 'clinic' && !clinic.isApproved) {
      return res.status(403).json({ valid: false, message: 'Clinic account not approved. Please wait for admin approval.' });
    }

    // Check if clinic is declined
    if (clinic.declined) {
      return res.status(403).json({ valid: false, message: 'Clinic account has been declined' });
    }

    // Check if user is approved (for agent, doctorStaff, staff roles)
    if (['agent', 'doctorStaff', 'staff'].includes(user.role) && !user.isApproved) {
      return res.status(403).json({ valid: false, message: 'Account not approved' });
    }

    // Check if user is declined
    if (user.declined) {
      return res.status(403).json({ valid: false, message: 'Account has been declined' });
    }

    // Check 30-day trial for clinic users (only for new users with registeredAt)
    if (user.role === 'clinic' && clinic.registeredAt) {
      const registeredAt = new Date(clinic.registeredAt);
      const trialEndDate = new Date(registeredAt);
      trialEndDate.setDate(trialEndDate.getDate() + 30); // 30 days trial
      const currentDate = new Date();
      
      if (currentDate > trialEndDate) {
        return res.status(403).json({ 
          valid: false, 
          message: 'Your 30-day free trial has expired. Please upgrade to premium to continue.',
          trialExpired: true
        });
      }
    }

    return res.status(200).json({ 
      valid: true, 
      decoded,
      clinic: { id: clinic._id, name: clinic.name, isApproved: clinic.isApproved },
      user: { id: user._id, role: user.role, name: user.name, email: user.email }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ valid: false, message: 'Token expired' });
    }

    console.error('Clinic token verification error:', error);
    return res.status(401).json({ valid: false, message: 'Invalid token. Please login again' });
  }
}
