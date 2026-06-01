import dbConnect from '../../../lib/database';
import User from '../../../models/Users';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { name, email, password, phone, gender, dateOfBirth, age } = req.body;

    // Field-by-field validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name is required and should be at least 2 characters long' });
    }

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be a 10-digit number' });
    }

    // Validate gender if provided
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({ message: 'Invalid gender value' });
    }

    // Validate age if provided
    if (age && (age < 1 || age > 120)) {
      return res.status(400).json({ message: 'Age must be between 1 and 120' });
    }

    // Validate dateOfBirth if provided
    let finalDateOfBirth = null;
    let finalAge = null;
    
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({ message: 'Invalid date of birth' });
      }
      if (dob > new Date()) {
        return res.status(400).json({ message: 'Date of birth cannot be in the future' });
      }
      finalDateOfBirth = dob;
      
      // Calculate age from DOB
      const today = new Date();
      let calculatedAge = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        calculatedAge--;
      }
      finalAge = calculatedAge > 0 ? calculatedAge : null;
    } else if (age) {
      finalAge = parseInt(age);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: 'user'
    };

    // Add optional fields
    if (gender) userData.gender = gender;
    if (finalDateOfBirth) userData.dateOfBirth = finalDateOfBirth;
    if (finalAge) userData.age = finalAge;

    const user = new User(userData);

    await user.save();

    // Prepare user data for response (exclude password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    return res.status(201).json({
      message: 'User registered successfully',
      user: userResponse
    });

  } catch (error) {
    // console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
