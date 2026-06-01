import dbConnect from '../../../lib/database'; // make sure this connects to MongoDB
import GetInTouch from '../../../models/GetInTouch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed. Only POST requests are accepted.' });
  }

  try {
    const { name, phone, location, query } = req.body;

    // Enhanced validation with specific error messages
    const validationErrors = [];

    if (!name || name.trim().length === 0) {
      validationErrors.push('Name is required');
    } else if (name.trim().length < 2) {
      validationErrors.push('Name must be at least 2 characters long');
    }

    if (!phone || phone.trim().length === 0) {
      validationErrors.push('Phone number is required');
    } else {
      const cleanedPhone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
      
      // Check if it's a UAE number (starts with +971 or 971)
      if (cleanedPhone.startsWith('+971') || cleanedPhone.startsWith('971')) {
        // Remove country code and check if remaining digits are 9
        const localNumber = cleanedPhone.replace(/^(\+971|971)/, '');
        if (localNumber.length !== 9) {
          validationErrors.push('UAE phone number must be 9 digits after country code (e.g., +971501234567)');
        }
      } else {
        // Check for local 10-digit format
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(cleanedPhone)) {
          validationErrors.push('Phone number must be exactly 10 digits (e.g., 0501234567) or valid UAE format (+971501234567)');
        }
      }
    }

    if (!location || location.trim().length === 0) {
      validationErrors.push('Location is required');
    } else if (location.trim().length < 2) {
      validationErrors.push('Location must be at least 2 characters long');
    }

    if (!query || query.trim().length === 0) {
      validationErrors.push('Query is required');
    } else if (query.trim().length < 10) {
      validationErrors.push('Query must be at least 10 characters long');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors,
        details: validationErrors.join(', ')
      });
    }

    await dbConnect();

    const newEntry = await GetInTouch.create({ 
      name: name.trim(), 
      phone: phone.trim(), 
      location: location.trim(), 
      query: query.trim() 
    });

    return res.status(201).json({ 
      message: 'Query submitted successfully', 
      data: newEntry 
    });

  } catch (error) {
    console.error('❌ Error saving GetInTouch:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Data validation failed', 
        errors: validationErrors,
        details: validationErrors.join(', ')
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ 
        message: 'Duplicate entry detected. This query may have already been submitted.',
        details: 'Please wait before submitting another query with the same information.'
      });
    }

    return res.status(500).json({ 
      message: 'Failed to submit query. Please try again later.',
      details: 'Internal server error occurred while processing your request.'
    });
  }
}
