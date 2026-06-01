// models/GetInTouch.ts
import mongoose from 'mongoose';

const GetInTouchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: function(v) {
          const cleanedPhone = v.replace(/\s+/g, '').replace(/[^\d+]/g, '');
          
          // Check if it's a UAE number (starts with +971 or 971)
          if (cleanedPhone.startsWith('+971') || cleanedPhone.startsWith('971')) {
            const localNumber = cleanedPhone.replace(/^(\+971|971)/, '');
            return localNumber.length === 9;
          } else {
            // Check for local 10-digit format
            return /^\d{10}$/.test(cleanedPhone);
          }
        },
        message: 'Phone number must be exactly 10 digits (e.g., 0501234567) or valid UAE format (+971501234567)'
      }
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      minlength: [2, 'Location must be at least 2 characters long'],
      maxlength: [200, 'Location cannot exceed 200 characters']
    },
    query: {
      type: String,
      required: [true, 'Query is required'],
      trim: true,
      minlength: [10, 'Query must be at least 10 characters long'],
      maxlength: [1000, 'Query cannot exceed 1000 characters']
    },
  },
  { 
    timestamps: true,
    // Add index to prevent duplicate submissions
    indexes: [
      { 
        fields: { phone: 1, createdAt: 1 }, 
        expireAfterSeconds: 3600 // Prevent duplicate submissions within 1 hour
      }
    ]
  }
);

export default mongoose.models.GetInTouch || mongoose.model('GetInTouch', GetInTouchSchema);
