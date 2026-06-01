/**
 * Slug-based Fetch API
 * 
 * Fetch any entity by its slug
 * 
 * GET /api/slug/[slug]?entityType=clinic
 * 
 * Query params:
 * - entityType: 'clinic' | 'doctor' | 'blog' | 'job'
 */

import { findBySlug, getSupportedEntityTypes } from '../../../lib/slugService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { slug } = req.query;
    const { entityType } = req.query;

    // Validate required fields
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Slug parameter is required',
      });
    }

    if (!entityType) {
      return res.status(400).json({
        success: false,
        message: 'entityType query parameter is required',
        supportedTypes: getSupportedEntityTypes(),
      });
    }

    // Validate entity type
    if (!getSupportedEntityTypes().includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid entityType. Supported types: ${getSupportedEntityTypes().join(', ')}`,
      });
    }

    // Find entity by slug
    const entity = await findBySlug(entityType, slug);

    if (!entity) {
      return res.status(404).json({
        success: false,
        message: `${entityType} not found with slug: ${slug}`,
      });
    }

    // Convert to plain object and remove sensitive fields if needed
    const entityData = entity.toObject ? entity.toObject() : entity;

    return res.status(200).json({
      success: true,
      entityType,
      data: entityData,
    });

  } catch (error) {
    console.error('❌ Slug Fetch Error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

