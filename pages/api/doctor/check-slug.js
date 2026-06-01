// API to check slug availability and generate preview for doctor registration
import dbConnect from '../../../lib/database';
import DoctorProfile from '../../../models/DoctorProfile';
import { slugify, generateUniqueSlug } from '../../../lib/utils';
import { validateSlug } from '../../../lib/slugService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { name, address } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor name is required' 
      });
    }

    // Extract city from address (first part before comma)
    let cityName = '';
    if (address) {
      const addressParts = address.split(',').map(part => part.trim());
      cityName = addressParts[0] || '';
    }

    // Generate base slug from doctor name (add "dr-" prefix)
    const baseSlugFromName = slugify(`dr ${name}`);
    
    // Generate slug with city if available
    let baseSlug = baseSlugFromName;
    if (cityName) {
      const citySlug = slugify(cityName);
      baseSlug = `${baseSlugFromName}-${citySlug}`;
    }

    if (!baseSlug) {
      return res.status(400).json({ 
        success: false, 
        message: 'Unable to generate slug from doctor name' 
      });
    }

    // Check if slug exists (checking locked slugs only)
    const checkExists = async (slugToCheck) => {
      const existing = await DoctorProfile.findOne({
        slug: slugToCheck,
        slugLocked: true,
      }).populate('user', 'isApproved');
      
      // Also check if user is approved (doctor slug requires approval)
      if (existing && existing.user && existing.user.isApproved) {
        return true;
      }
      return false;
    };

    // Generate unique slug
    const finalSlug = await generateUniqueSlug(baseSlug, checkExists);
    
    // Validate slug
    const validation = validateSlug(finalSlug);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    // Check if there was a collision (slug differs from base)
    const collisionResolved = finalSlug !== baseSlug;
    
    // Generate URL preview
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://zeva360.com';
    const url = `${baseUrl}/doctors/${finalSlug}`;

    // User-friendly message
    let userMessage = 'Your doctor page is ready!';
    if (collisionResolved && cityName) {
      userMessage = `Good news! Another doctor already uses this name, so we added your city (${cityName}) to create a unique page for you.`;
    } else if (collisionResolved) {
      userMessage = 'Good news! Another doctor already uses this name, so we added a number to create a unique page for you.';
    } else {
      userMessage = 'Your doctor page is ready! We created a unique URL based on your name' + 
        (cityName ? ` and city (${cityName})` : '') + 
        ' to help patients find you easily.';
    }

    return res.status(200).json({
      success: true,
      slug: finalSlug,
      status: 'created',
      is_unique: true,
      collision_resolved: collisionResolved,
      url: url,
      user_message: userMessage,
    });
  } catch (err) {
    // console.error('❌ Slug Check Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error checking slug availability',
      error: err.message,
    });
  }
}
