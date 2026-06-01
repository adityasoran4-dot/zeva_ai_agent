import dbConnect from '../../../lib/database';
import Clinic from '../../../models/Clinic';
import User from '../../../models/Users';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Find or create a test user
    let testUser = await User.findOne({ email: 'test@international.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Test International User',
        email: 'test@international.com',
        password: 'test123',
        role: 'clinic'
      });
    }

    // Sample international clinics
    const internationalClinics = [
      {
        owner: testUser._id,
        name: 'Dubai Ayurvedic Wellness Center',
        address: 'Sheikh Zayed Road, Dubai, UAE',
        treatments: ['Panchakarma', 'Abhyanga', 'Shirodhara', 'Ayurvedic Consultation'],
        servicesName: ['Traditional Ayurveda', 'Wellness Programs'],
        pricing: 'AED 500-1500',
        timings: '9:00 AM - 8:00 PM',
        photos: ['/uploads/clinic/dubai-clinic.jpg'],
        location: {
          type: 'Point',
          coordinates: [55.2708, 25.2048] // Dubai coordinates
        },
        isApproved: true,
        declined: false
      },
      {
        owner: testUser._id,
        name: 'Abu Dhabi Holistic Health',
        address: 'Corniche Road, Abu Dhabi, UAE',
        treatments: ['Ayurvedic Massage', 'Detox Programs', 'Stress Management'],
        servicesName: ['Holistic Healing', 'Stress Relief'],
        pricing: 'AED 400-1200',
        timings: '8:00 AM - 7:00 PM',
        photos: ['/uploads/clinic/abu-dhabi-clinic.jpg'],
        location: {
          type: 'Point',
          coordinates: [54.3773, 24.4539] // Abu Dhabi coordinates
        },
        isApproved: true,
        declined: false
      },
      {
        owner: testUser._id,
        name: 'Sharjah Natural Healing Center',
        address: 'Al Majaz Waterfront, Sharjah, UAE',
        treatments: ['Ayurvedic Therapy', 'Herbal Medicine', 'Yoga Therapy'],
        servicesName: ['Natural Healing', 'Yoga Integration'],
        pricing: 'AED 300-1000',
        timings: '9:00 AM - 6:00 PM',
        photos: ['/uploads/clinic/sharjah-clinic.jpg'],
        location: {
          type: 'Point',
          coordinates: [55.4033, 25.3463] // Sharjah coordinates
        },
        isApproved: true,
        declined: false
      }
    ];

    // Check if clinics already exist
    const existingClinics = await Clinic.find({
      name: { $in: internationalClinics.map(c => c.name) }
    });

    if (existingClinics.length > 0) {
      return res.status(200).json({ 
        message: 'International sample clinics already exist',
        count: existingClinics.length
      });
    }

    // Create the clinics
    const createdClinics = await Clinic.insertMany(internationalClinics);

    res.status(200).json({ 
      message: 'International sample clinics added successfully',
      clinics: createdClinics.map(c => ({ name: c.name, address: c.address }))
    });

  } catch (error) {
    console.error('Error adding international clinics:', error);
    res.status(500).json({ 
      message: 'Error adding international clinics', 
      error: error.message 
    });
  }
} 