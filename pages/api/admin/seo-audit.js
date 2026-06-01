/**
 * SEO Audit API for Admin
 * 
 * Endpoint: /api/admin/seo-audit
 * 
 * Purpose: Get SEO health data for clinics, doctors, blogs, or jobs
 */

import dbConnect from '../../../lib/database';
import Clinic from '../../../models/Clinic';
import DoctorProfile from '../../../models/DoctorProfile';
import Blog from '../../../models/Blog';
import JobPosting from '../../../models/JobPosting';
import Treatment from '../../../models/Treatment';
import { getUserFromReq } from '../lead-ms/auth';
import { batchCheckSEOHealth } from '../../../lib/seo/SEOHealthService';

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

    const { entityType = 'clinic', page = '1', limit = '7' } = req.query; // clinic, doctor, blog, job, treatment
    
    // Parse pagination parameters
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 7;
    const skip = (pageNumber - 1) * pageSize;

    let entities = [];
    let totalCount = 0;
    let entityIds = [];
    let entityTypeForHealth = 'clinic';

    // Fetch entities based on type using aggregation pipelines
    switch (entityType) {
      case 'clinic':
        // Get total count
        const clinicCountResult = await Clinic.aggregate([
          {
            $match: {
              isApproved: true,
            },
          },
          {
            $count: 'total',
          },
        ]);
        totalCount = clinicCountResult[0]?.total || 0;

        // Get paginated entities
        entities = await Clinic.aggregate([
          {
            $match: {
              isApproved: true,
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              address: 1,
              location: 1,
              slug: 1,
              slugLocked: 1,
              isApproved: 1,
              createdAt: 1,
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $skip: skip,
          },
          {
            $limit: pageSize,
          },
        ]);
        entityTypeForHealth = 'clinic';
        break;

      case 'doctor':
        // Get total count
        const doctorCountResult = await DoctorProfile.aggregate([
          {
            $lookup: {
              from: 'users',
              let: { userId: '$user' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$_id', '$$userId'] },
                        { $eq: ['$isApproved', true] },
                        { $ne: ['$declined', true] }
                      ]
                    }
                  }
                }
              ],
              as: 'userData'
            }
          },
          { $unwind: '$userData' },
          {
            $count: 'total',
          },
        ]);
        totalCount = doctorCountResult[0]?.total || 0;

        // Get paginated entities
        entities = await DoctorProfile.aggregate([
          {
            $lookup: {
              from: 'users',
              let: { userId: '$user' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$_id', '$$userId'] },
                        { $eq: ['$isApproved', true] },
                        { $ne: ['$declined', true] }
                      ]
                    }
                  }
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    email: 1
                  }
                }
              ],
              as: 'userData'
            }
          },
          { $unwind: '$userData' },
          {
            $project: {
              _id: 1,
              user: '$userData',
              degree: 1,
              experience: 1,
              address: 1,
              location: 1,
              slug: 1,
              slugLocked: 1,
              createdAt: 1
            }
          },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: pageSize }
        ]);
        entityTypeForHealth = 'doctor';
        break;

      case 'blog':
        // Get total count
        const blogCountResult = await Blog.aggregate([
          {
            $match: {
              status: 'published',
            },
          },
          {
            $count: 'total',
          },
        ]);
        totalCount = blogCountResult[0]?.total || 0;

        // Get paginated entities
        entities = await Blog.aggregate([
          {
            $match: {
              status: 'published',
            },
          },
          {
            $lookup: {
              from: 'users',
              let: { postedById: '$postedBy' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', '$$postedById']
                    }
                  }
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    email: 1
                  }
                }
              ],
              as: 'postedByData'
            }
          },
          {
            $unwind: {
              path: '$postedByData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              title: 1,
              paramlink: 1,
              slugLocked: 1,
              status: 1,
              createdAt: 1,
              postedBy: '$postedByData',
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $skip: skip,
          },
          {
            $limit: pageSize,
          },
        ]);
        entityTypeForHealth = 'blog';
        break;

      case 'job':
        // Get total count
        const jobCountResult = await JobPosting.aggregate([
          {
            $match: {
              status: 'approved',
              isActive: true,
            },
          },
          {
            $count: 'total',
          },
        ]);
        totalCount = jobCountResult[0]?.total || 0;

        // Get paginated entities
        entities = await JobPosting.aggregate([
          {
            $match: {
              status: 'approved',
              isActive: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              let: { postedById: '$postedBy' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', '$$postedById']
                    }
                  }
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    email: 1
                  }
                }
              ],
              as: 'postedByData'
            }
          },
          {
            $unwind: {
              path: '$postedByData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'clinics',
              let: { clinicId: '$clinicId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', '$$clinicId']
                    }
                  }
                },
                {
                  $project: {
                    _id: 1,
                    name: 1
                  }
                }
              ],
              as: 'clinicData'
            }
          },
          {
            $unwind: {
              path: '$clinicData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              jobTitle: 1,
              location: 1,
              slug: 1,
              slugLocked: 1,
              status: 1,
              isActive: 1,
              createdAt: 1,
              postedBy: '$postedByData',
              clinicId: 1,
              clinicName: '$clinicData.name',
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $skip: skip,
          },
          {
            $limit: pageSize,
          },
        ]);
        entityTypeForHealth = 'job';
        break;

      case 'treatment':
        // Get total count
        const treatmentCountResult = await Treatment.aggregate([
          {
            $count: 'total',
          },
        ]);
        totalCount = treatmentCountResult[0]?.total || 0;

        // Get paginated entities
        entities = await Treatment.aggregate([
          {
            $project: {
              _id: 1,
              name: 1,
              slug: 1,
              subcategories: 1,
              createdAt: 1,
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $skip: skip,
          },
          {
            $limit: pageSize,
          },
        ]);
        entityTypeForHealth = 'treatment';
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid entity type. Must be: clinic, doctor, blog, job, or treatment',
        });
    }

    if (!entities || entities.length === 0) {
      return res.status(200).json({
        success: true,
        entities: [],
        healthData: [],
        summary: {
          total: 0,
          healthy: 0,
          warning: 0,
          critical: 0,
          averageScore: 0,
        },
        pagination: {
          total: 0,
          page: pageNumber,
          limit: pageSize,
          totalPages: 0,
          hasMore: false,
        },
        entityType,
      });
    }

    // Get entity IDs (handle both ObjectId and string)
    entityIds = entities.map(entity => {
      const id = entity._id;
      return id && typeof id === 'object' ? id.toString() : String(id);
    });

    // Batch check SEO health
    // console.log(`\n📊 [SEO Audit API] Checking SEO health for ${entityIds.length} ${entityType}s`);
    const healthData = await batchCheckSEOHealth(entityTypeForHealth, entityIds);

    // Combine entity data with health data
    const entitiesWithHealth = entities.map((entity, index) => {
      const health = healthData[index] || null;
      // All entities are now from aggregation pipelines, so they're already plain objects
      const entityObj = entity;
      
      // Format entity data based on type
      let displayName = '';
      let displayLocation = '';
      
      if (entityType === 'clinic') {
        displayName = entityObj.name;
        displayLocation = entityObj.address;
      } else if (entityType === 'doctor') {
        displayName = entityObj.user?.name || 'Unknown Doctor';
        displayLocation = entityObj.address;
      } else if (entityType === 'blog') {
        displayName = entityObj.title;
        displayLocation = '';
      } else if (entityType === 'job') {
        displayName = entityObj.jobTitle;
        displayLocation = entityObj.location;
      } else if (entityType === 'treatment') {
        displayName = entityObj.name;
        displayLocation = entityObj.subcategories?.length > 0 
          ? `${entityObj.subcategories.length} sub-treatment(s)` 
          : 'No sub-treatments';
      }

      return {
        ...entityObj,
        displayName,
        displayLocation,
        health: health ? {
          overallHealth: health.overallHealth,
          score: health.score,
          issuesCount: health.issues.length,
          criticalIssues: health.issues.filter(i => i.severity === 'critical').length,
          warningIssues: health.issues.filter(i => i.severity === 'warning').length,
          infoIssues: health.issues.filter(i => i.severity === 'info').length,
          issues: health.issues,
          recommendations: health.recommendations,
          lastChecked: health.lastChecked,
        } : null,
      };
    });

    // Calculate summary statistics (for current page only)
    const summary = {
      total: totalCount, // Total count across all pages
      healthy: entitiesWithHealth.filter(e => e.health?.overallHealth === 'healthy').length,
      warning: entitiesWithHealth.filter(e => e.health?.overallHealth === 'warning').length,
      critical: entitiesWithHealth.filter(e => e.health?.overallHealth === 'critical').length,
      averageScore: entitiesWithHealth.length > 0
        ? Math.round(
            entitiesWithHealth
              .filter(e => e.health)
              .reduce((sum, e) => sum + (e.health?.score || 0), 0) /
            entitiesWithHealth.filter(e => e.health).length
          )
        : 0,
    };

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasMore = pageNumber < totalPages;

    // console.log(`\n✅ [SEO Audit API] Audit completed for ${entityType}s`);
    // console.log(`   Total ${entityType}s: ${totalCount}`);
    // console.log(`   Page: ${pageNumber}/${totalPages}`);
    // console.log(`   Items on this page: ${entitiesWithHealth.length}`);
    // console.log(`   Healthy: ${summary.healthy}`);
    // console.log(`   Warning: ${summary.warning}`);
    // console.log(`   Critical: ${summary.critical}`);
    // console.log(`   Average Score: ${summary.averageScore}/100\n`);

    return res.status(200).json({
      success: true,
      entities: entitiesWithHealth,
      healthData,
      summary,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: pageSize,
        totalPages: totalPages,
        hasMore: hasMore,
      },
      entityType,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    // console.error('Error in SEO audit API:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}
