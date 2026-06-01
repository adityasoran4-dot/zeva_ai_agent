import dbConnect from '../../../lib/database';
import JobPosting from '../../../models/JobPosting';
import jwt from 'jsonwebtoken';
import '../../../models/Users'; // Assuming user model exists

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { role, userId } = decoded;

    // console.log('Decoded token:', decoded);

    if (!userId || role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can access this route' });
    }

    const newJob = await JobPosting.create({
      ...req.body,
      postedBy: userId,
      doctorId: userId, // Set doctorId to the logged-in doctor's userId
      role: 'doctor',
    });

    return res.status(201).json({ success: true, job: newJob });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
}
