import dbConnect from '../../../lib/database';
import Enquiry from '../../../models/Enquiry';
import Clinic from '../../../models/Clinic';
import { verifyToken } from '../auth/verify';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const user = await verifyToken(token); // get full user object

      const { name, email, phone, message, clinicId } = req.body;

      if (!clinicId || !name || !email || !phone || !message) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const clinic = await Clinic.findById(clinicId);
      if (!clinic) return res.status(404).json({ message: 'Clinic not found' });

      const enquiry = await Enquiry.create({
        clinicId,
        userId: user._id, // ✅ include userId
        name,
        email,
        phone,
        message,
      });

      return res.status(201).json({ success: true, enquiry });
    } catch (error) {
      console.error('Enquiry creation error:', error);
      return res.status(401).json({ message: 'Unauthorized or invalid data' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
