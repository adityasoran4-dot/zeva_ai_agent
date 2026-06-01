/**
 * SEO Meta API
 * 
 * Returns SEO meta tags for a clinic or doctor
 * GET /api/seo/meta/clinic/[id]
 * GET /api/seo/meta/doctor/[id]
 */

import dbConnect from '../../../../../lib/database';
import Clinic from '../../../../../models/Clinic';
import DoctorProfile from '../../../../../models/DoctorProfile';
import { decideIndexing } from '../../../../../lib/seo/IndexingService';
import { getRobotsMeta } from '../../../../../lib/seo/RobotsService';
import { generateMeta } from '../../../../../lib/seo/MetaService';
import { getCanonicalUrl } from '../../../../../lib/seo/CanonicalService';
import { generateHeadings } from '../../../../../lib/seo/HeadingService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type, id } = req.query;

  if (!['clinic', 'doctor'].includes(type)) {
    return res.status(400).json({ message: 'Invalid entity type. Use "clinic" or "doctor"' });
  }

  if (!id) {
    return res.status(400).json({ message: 'Entity ID is required' });
  }

  try {
    await dbConnect();

    let entity;
    let user;

    if (type === 'clinic') {
      entity = await Clinic.findById(id);
      if (!entity) {
        // Try finding by slug
        entity = await Clinic.findOne({ slug: id });
      }
    } else {
      entity = await DoctorProfile.findById(id).populate('user');
      if (!entity) {
        // Try finding by slug
        entity = await DoctorProfile.findOne({ slug: id }).populate('user');
      }
      user = entity?.user;
    }

    if (!entity) {
      return res.status(404).json({ message: `${type} not found` });
    }

    // Get indexing decision
    const entityId = entity._id.toString();
    const decision = await decideIndexing(type, entityId);

    // Get robots meta
    const robotsMeta = getRobotsMeta(decision);

    // Generate meta tags
    const metaTags = await generateMeta(type, entity, decision);

    // Get canonical URL
    const canonicalUrl = getCanonicalUrl(type, entity);

    // Generate headings
    const headings = generateHeadings(type, entity);

    return res.status(200).json({
      success: true,
      meta: {
        title: metaTags.title,
        description: metaTags.description,
        keywords: metaTags.keywords,
        robots: robotsMeta.content,
        canonical: canonicalUrl,
        og: {
          title: metaTags.ogTitle || metaTags.title,
          description: metaTags.ogDescription || metaTags.description,
          image: metaTags.ogImage,
        },
      },
      headings,
      indexing: {
        shouldIndex: decision.shouldIndex,
        priority: decision.priority,
        warnings: decision.warnings,
      },
    });
  } catch (error) {
    console.error('SEO Meta API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
}

