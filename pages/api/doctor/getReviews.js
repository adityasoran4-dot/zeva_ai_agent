// pages/api/doctors/getReviews.js
import dbConnect from '../../../lib/database';
import Review from '../../../models/Review';
import DoctorProfile from '../../../models/DoctorProfile';
import User from '../../../models/Users';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log('Decoded JWT:', decoded);

    if (decoded.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied: not a doctor' });
    }

    // Step 1: Find the doctor profile associated with the user
    const doctor = await DoctorProfile.findOne({ user: decoded.userId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Step 2: Fetch all reviews for the doctor and populate user details
    const reviews = await Review.find({ doctorId: doctor._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'userId',
        select: 'name email', // adjust fields if needed
        model: User,
      });

    // console.log('Fetched reviews:', reviews);

    return res.status(200).json({ 
      success: true, 
      reviews 
    });
  } catch (error) {
    // console.error('Get reviews error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching reviews'
    });
  }
}