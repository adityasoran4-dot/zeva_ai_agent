// API to check slug availability and generate preview for job posting
import dbConnect from '../../../lib/database';
import JobPosting from '../../../models/JobPosting';
import { slugify, generateUniqueSlug } from '../../../lib/utils';
import { validateSlug } from '../../../lib/slugService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { jobTitle, location, companyName } = req.body;

    if (!jobTitle) {
      return res.status(400).json({ 
        success: false, 
        message: 'Job title is required' 
      });
    }

    // Extract city from location (first part before comma)
    let cityName = '';
    if (location) {
      const locationParts = location.split(',').map(part => part.trim());
      cityName = locationParts[0] || '';
    }

    // Generate base slug from job title
    const baseSlugFromTitle = slugify(jobTitle);
    
    // Generate slug with city if available
    let baseSlug = baseSlugFromTitle;
    if (cityName) {
      const citySlug = slugify(cityName);
      baseSlug = `${baseSlugFromTitle}-${citySlug}`;
    }

    if (!baseSlug) {
      return res.status(400).json({ 
        success: false, 
        message: 'Unable to generate slug from job title' 
      });
    }

    // Check if slug exists (checking locked slugs only)
    const checkExists = async (slugToCheck) => {
      const existing = await JobPosting.findOne({
        slug: slugToCheck,
        slugLocked: true,
        status: 'approved',
      });
      return !!existing;
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
    const url = `${baseUrl}/job-details/${finalSlug}`;

    // User-friendly message
    let userMessage = 'Your job posting page is ready!';
    if (collisionResolved && cityName) {
      userMessage = `Good news! Another job already uses this title, so we added your city (${cityName}) to create a unique page for you.`;
    } else if (collisionResolved) {
      userMessage = 'Good news! Another job already uses this title, so we added a number to create a unique page for you.';
    } else {
      userMessage = 'Your job posting page is ready! We created a unique URL based on your job title' + 
        (cityName ? ` and city (${cityName})` : '') + 
        ' to help candidates find you easily.';
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
