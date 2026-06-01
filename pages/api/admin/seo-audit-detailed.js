/**
 * Detailed SEO Audit API for Admin
 * 
 * Endpoint: /api/admin/seo-audit-detailed
 * 
 * Purpose: Get detailed SEO pipeline results for a specific entity (clinic, doctor, blog, job)
 */

import dbConnect from '../../../lib/database';
import Clinic from '../../../models/Clinic';
import DoctorProfile from '../../../models/DoctorProfile';
import Blog from '../../../models/Blog';
import JobPosting from '../../../models/JobPosting';
import Treatment from '../../../models/Treatment';
import { getUserFromReq } from '../lead-ms/auth';
import { runSEOPipeline } from '../../../lib/seo/SEOOrchestrator';
import { checkSEOHealth } from '../../../lib/seo/SEOHealthService';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
    }

    // Only admin can access this endpoint
    if (me.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required' });
    }

    const { entityType = 'clinic', entityId } = req.query;

    if (!entityId) {
      return res.status(400).json({
        success: false,
        message: 'entityId is required',
      });
    }

    let entity = null;
    let user = null;

    // Fetch entity based on type
    switch (entityType) {
      case 'clinic':
        entity = await Clinic.findById(entityId);
        if (!entity) {
          return res.status(404).json({ success: false, message: 'Clinic not found' });
        }
        break;

      case 'doctor':
        entity = await DoctorProfile.findById(entityId).populate('user');
        if (!entity) {
          return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        user = entity.user;
        break;

      case 'blog':
        entity = await Blog.findById(entityId).populate('postedBy');
        if (!entity) {
          return res.status(404).json({ success: false, message: 'Blog not found' });
        }
        break;

      case 'job':
        entity = await JobPosting.findById(entityId);
        if (!entity) {
          return res.status(404).json({ success: false, message: 'Job not found' });
        }
        break;

      case 'treatment':
        entity = await Treatment.findById(entityId);
        if (!entity) {
          return res.status(404).json({ success: false, message: 'Treatment not found' });
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid entity type. Must be: clinic, doctor, blog, job, or treatment',
        });
    }

    // console.log(`\n📊 [Detailed SEO Audit API] Running full SEO pipeline for ${entityType}: ${entityId}`);

    // Run full SEO pipeline
    const seoPipelineResult = await runSEOPipeline(entityType, entityId.toString(), entity, user);

    // Run SEO health check
    const healthCheck = await checkSEOHealth(entityType, entityId.toString());

    // Format entity data based on type
    let entityData = {};
    if (entityType === 'clinic') {
      entityData = {
        _id: entity._id,
        name: entity.name,
        address: entity.address,
        slug: entity.slug,
        slugLocked: entity.slugLocked,
        isApproved: entity.isApproved,
      };
    } else if (entityType === 'doctor') {
      entityData = {
        _id: entity._id,
        name: entity.user?.name || 'Unknown Doctor',
        address: entity.address,
        slug: entity.slug,
        slugLocked: entity.slugLocked,
        isApproved: entity.isApproved,
      };
    } else if (entityType === 'blog') {
      entityData = {
        _id: entity._id,
        title: entity.title,
        paramlink: entity.paramlink,
        slugLocked: entity.slugLocked,
        status: entity.status,
      };
    } else if (entityType === 'job') {
      entityData = {
        _id: entity._id,
        jobTitle: entity.jobTitle,
        location: entity.location,
        slug: entity.slug,
        slugLocked: entity.slugLocked,
        status: entity.status,
        isActive: entity.isActive,
      };
    } else if (entityType === 'treatment') {
      entityData = {
        _id: entity._id,
        name: entity.name,
        slug: entity.slug,
        subcategories: entity.subcategories || [],
      };
    }

    // Combine results
    const detailedAudit = {
      [entityType]: entityData,
      seoPipeline: {
        success: seoPipelineResult.success,
        entityType: seoPipelineResult.entityType,
        entityId: seoPipelineResult.entityId,
        indexing: seoPipelineResult.indexing,
        robots: seoPipelineResult.robots,
        meta: seoPipelineResult.meta,
        canonical: seoPipelineResult.canonical,
        duplicateCheck: seoPipelineResult.duplicateCheck,
        headings: seoPipelineResult.headings,
        sitemapUpdated: seoPipelineResult.sitemapUpdated,
        pinged: seoPipelineResult.pinged,
        errors: seoPipelineResult.errors,
      },
      healthCheck: healthCheck,
      timestamp: new Date().toISOString(),
    };

    // console.log(`\n✅ [Detailed SEO Audit API] Detailed audit completed for ${entityType}: ${entityId}\n`);

    return res.status(200).json({
      success: true,
      audit: detailedAudit,
    });

  } catch (error) {
    // console.error('Error in detailed SEO audit API:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}
