/**
 * SEO Health Check API
 * 
 * Endpoint: /api/seo/health-check
 * 
 * Purpose: Check SEO health for entities
 * 
 * Query Parameters:
 * - entityType: 'clinic' | 'doctor' | 'job' | 'blog'
 * - entityId: Entity ID
 * 
 * Example:
 * GET /api/seo/health-check?entityType=clinic&entityId=123
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { checkSEOHealth, batchCheckSEOHealth } from '../../../lib/seo/SEOHealthService';
import { withCache } from '../../../lib/seo/PerformanceHooks';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('\n🔍 [SEO Health Check API] Request received');
  console.log('   Method:', req.method);
  console.log('   Query:', JSON.stringify(req.query, null, 2));

  if (req.method !== 'GET') {
    console.log('   ❌ Method not allowed');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { entityType, entityId, entityIds } = req.query;

    // Validate entity type
    if (!entityType || typeof entityType !== 'string') {
      console.log('   ❌ entityType is required');
      return res.status(400).json({
        success: false,
        message: 'entityType is required',
      });
    }

    if (!['clinic', 'doctor', 'job', 'blog'].includes(entityType)) {
      console.log('   ❌ Invalid entityType:', entityType);
      return res.status(400).json({
        success: false,
        message: 'Invalid entityType. Must be one of: clinic, doctor, job, blog',
      });
    }

    // Batch check
    if (entityIds) {
      console.log('   📦 Batch check requested');
      const ids = Array.isArray(entityIds) ? entityIds : [entityIds];
      console.log('   Entity IDs:', ids);
      
      const results = await batchCheckSEOHealth(
        entityType as 'clinic' | 'doctor' | 'job' | 'blog',
        ids as string[]
      );

      console.log('\n✅ [SEO Health Check API] Batch check completed');
      console.log('   Entity Type:', entityType);
      console.log('   Results Count:', results.length);
      console.log('   Results:', JSON.stringify(results, null, 2));

      return res.status(200).json({
        success: true,
        results,
        count: results.length,
      });
    }

    // Single check
    if (!entityId || typeof entityId !== 'string') {
      console.log('   ❌ entityId is required');
      return res.status(400).json({
        success: false,
        message: 'entityId is required',
      });
    }

    console.log('   🔍 Checking SEO health for:', entityType, entityId);
    const healthFlags = await checkSEOHealth(
      entityType as 'clinic' | 'doctor' | 'job' | 'blog',
      entityId
    );

    console.log('\n✅ [SEO Health Check API] Health check completed');
    console.log('   Entity Type:', healthFlags.entityType);
    console.log('   Entity ID:', healthFlags.entityId);
    console.log('   Overall Health:', healthFlags.overallHealth);
    console.log('   Score:', healthFlags.score);
    console.log('   Issues Count:', healthFlags.issues.length);
    console.log('   Recommendations Count:', healthFlags.recommendations.length);
    console.log('\n   📋 Issues:');
    healthFlags.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.message}`);
      if (issue.field) console.log(`      Field: ${issue.field}`);
      if (issue.expected) console.log(`      Expected: ${issue.expected}`);
      if (issue.actual) console.log(`      Actual: ${issue.actual}`);
      if (issue.fix) console.log(`      Fix: ${issue.fix}`);
    });
    console.log('\n   💡 Recommendations:');
    healthFlags.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    console.log('\n   📊 Full Health Flags:', JSON.stringify(healthFlags, null, 2));
    console.log('\n');

    return res.status(200).json({
      success: true,
      health: healthFlags,
    });

  } catch (error: any) {
    console.error('\n❌ [SEO Health Check API] Error:', error);
    console.error('   Stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

// Cache for 5 minutes
export default withCache(handler, {
  key: 'seo-health-check',
  ttl: 300, // 5 minutes
  tags: ['seo', 'health'],
});
