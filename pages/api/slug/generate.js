/**
 * Slug Generation API
 * 
 * Central API endpoint for generating slugs for any entity type
 * 
 * POST /api/slug/generate
 * Body: {
 *   entityType: 'clinic' | 'doctor' | 'blog' | 'job',
 *   entityId: string,
 *   customText?: string, // Optional: custom text instead of source field
 *   forceRegenerate?: boolean // Optional: force regeneration even if locked
 * }
 */

import { generateAndLockSlug, validateSlug, getSupportedEntityTypes } from '../../../lib/slugService';
import { getUserFromReq } from '../lead-ms/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { entityType, entityId, customText, forceRegenerate } = req.body;

    // Validate required fields
    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        message: 'entityType and entityId are required',
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

    // Optional: Add authentication check (uncomment if needed)
    // const me = await getUserFromReq(req);
    // if (!me) {
    //   return res.status(401).json({ 
    //     success: false, 
    //     message: 'Unauthorized' 
    //   });
    // }

    // Generate and lock slug
    const entity = await generateAndLockSlug(entityType, entityId, {
      customText,
      forceRegenerate: forceRegenerate || false,
    });

    // Get the slug field name based on entity type
    const rule = require('../../../lib/slugService').getEntityRule(entityType);
    const slug = entity[rule.slugField];

    // Validate the generated slug
    const validation = validateSlug(slug);
    if (!validation.valid) {
      console.warn(`Generated slug validation warning: ${validation.error}`);
    }

    return res.status(200).json({
      success: true,
      slug,
      entityType,
      entityId: entity._id.toString(),
      locked: entity[rule.lockField],
      message: 'Slug generated and locked successfully',
    });

  } catch (error) {
    console.error('❌ Slug Generation Error:', error);
    
    // Handle specific error types
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    
    if (error.message.includes('must be approved')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

