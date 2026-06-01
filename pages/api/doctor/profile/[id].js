import dbConnect from '../../../../lib/database';
import DoctorProfile from '../../../../models/DoctorProfile';
import User from '../../../../models/Users';

export default async function handler(req, res) {
  await dbConnect();

  const { method } = req;
  if (method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ success: false, message: 'Doctor id is required' });
  }

  try {
    // Check if id is ObjectId or slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let profile;
    if (isObjectId) {
      // Fetch by ObjectId
      profile = await DoctorProfile.findById(id)
        .populate({ path: 'user', model: User, select: 'name email phone isApproved' })
        .lean();
    } else {
      // Fetch by slug
      const { findBySlug } = await import('../../../../lib/slugService');
      const doctorProfile = await findBySlug('doctor', id);
      
      if (doctorProfile) {
        profile = await DoctorProfile.findById(doctorProfile._id)
          .populate({ path: 'user', model: User, select: 'name email phone isApproved' })
          .lean();
      }
    }

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Only return approved doctors
    if (!profile.user?.isApproved) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    return res.status(200).json({ success: true, profile });
  } catch (error) {
    // console.error('Error fetching doctor profile:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}



