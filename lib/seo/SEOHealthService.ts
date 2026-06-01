/**
 * SEO Health Flags API Service
 * 
 * Purpose: Comprehensive SEO health checks for entities
 * 
 * Checks:
 * - Missing meta tags
 * - Canonical conflicts
 * - Indexing violations
 * - SEO compliance issues
 */

import { decideIndexing, IndexingDecision } from './IndexingService';
import { getCanonicalUrl } from './CanonicalService';
import { generateMeta } from './MetaService';
import dbConnect from '../database';
import Clinic from '../../models/Clinic';
import DoctorProfile from '../../models/DoctorProfile';
import JobPosting from '../../models/JobPosting';

export interface SEOHealthFlags {
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment';
  entityId: string;
  overallHealth: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  issues: SEOIssue[];
  recommendations: string[];
  lastChecked: Date;
}

export interface SEOIssue {
  type: 'missing_meta' | 'canonical_conflict' | 'indexing_violation' | 'duplicate_content' | 'thin_content' | 'invalid_slug' | 'missing_robots';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  field?: string;
  expected?: string;
  actual?: string;
  fix?: string;
}

/**
 * Check for missing meta tags
 */
async function checkMissingMeta(
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment',
  entity: any,
  decision: IndexingDecision
): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];

  // Only check meta if entity should be indexed
  if (!decision.shouldIndex) {
    return issues;
  }

  try {
    const meta = await generateMeta(entityType, entity, decision);

    // Check title
    if (!meta.title || meta.title.trim().length === 0) {
      issues.push({
        type: 'missing_meta',
        severity: 'critical',
        message: 'Meta title is missing',
        field: 'title',
        expected: 'A descriptive title (50-60 characters)',
        fix: 'Generate meta title from entity name and location',
      });
    } else if (meta.title.length < 30) {
      issues.push({
        type: 'missing_meta',
        severity: 'warning',
        message: 'Meta title is too short',
        field: 'title',
        actual: `${meta.title.length} characters`,
        expected: '50-60 characters',
        fix: 'Expand meta title with more descriptive information',
      });
    } else if (meta.title.length > 60) {
      issues.push({
        type: 'missing_meta',
        severity: 'warning',
        message: 'Meta title is too long',
        field: 'title',
        actual: `${meta.title.length} characters`,
        expected: '50-60 characters',
        fix: 'Truncate meta title to optimal length',
      });
    }

    // Check description
    if (!meta.description || meta.description.trim().length === 0) {
      issues.push({
        type: 'missing_meta',
        severity: 'critical',
        message: 'Meta description is missing',
        field: 'description',
        expected: 'A descriptive meta description (150-160 characters)',
        fix: 'Generate meta description from entity details',
      });
    } else if (meta.description.length < 120) {
      issues.push({
        type: 'missing_meta',
        severity: 'warning',
        message: 'Meta description is too short',
        field: 'description',
        actual: `${meta.description.length} characters`,
        expected: '150-160 characters',
        fix: 'Expand meta description with more details',
      });
    } else if (meta.description.length > 160) {
      issues.push({
        type: 'missing_meta',
        severity: 'warning',
        message: 'Meta description is too long',
        field: 'description',
        actual: `${meta.description.length} characters`,
        expected: '150-160 characters',
        fix: 'Truncate meta description to optimal length',
      });
    }

    // Check keywords (optional but recommended)
    if (!meta.keywords || meta.keywords.length === 0) {
      issues.push({
        type: 'missing_meta',
        severity: 'info',
        message: 'Meta keywords are missing (optional)',
        field: 'keywords',
        fix: 'Add relevant keywords for better SEO',
      });
    }

    // Check OG tags (optional but recommended)
    if (!meta.ogTitle || !meta.ogDescription) {
      issues.push({
        type: 'missing_meta',
        severity: 'info',
        message: 'Open Graph tags are missing (optional)',
        field: 'ogTags',
        fix: 'Add OG title and description for social media sharing',
      });
    }

  } catch (error: any) {
    issues.push({
      type: 'missing_meta',
      severity: 'critical',
      message: `Error generating meta tags: ${error.message}`,
      fix: 'Check entity data completeness',
    });
  }

  return issues;
}

/**
 * Check for canonical conflicts
 */
async function checkCanonicalConflicts(
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment',
  entity: any
): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];

  try {
    const canonicalUrl = getCanonicalUrl(entityType, entity);
    
    if (!canonicalUrl || canonicalUrl.trim().length === 0) {
      issues.push({
        type: 'canonical_conflict',
        severity: 'critical',
        message: 'Canonical URL is missing',
        field: 'canonical',
        fix: 'Generate canonical URL from slug or entity ID',
      });
      return issues;
    }

    // Check if slug exists and is locked (for clinic, doctor, job)
    if (entityType !== 'blog') {
      const slugField = entityType === 'clinic' ? 'slug' : entityType === 'doctor' ? 'slug' : 'slug';
      const lockField = 'slugLocked';
      
      if (!entity[slugField]) {
        issues.push({
          type: 'canonical_conflict',
          severity: 'critical',
          message: 'Slug is missing - canonical URL cannot be generated',
          field: slugField,
          fix: 'Generate and lock slug for this entity',
        });
      } else if (!entity[lockField]) {
        issues.push({
          type: 'canonical_conflict',
          severity: 'warning',
          message: 'Slug is not locked - canonical URL may change',
          field: lockField,
          fix: 'Lock slug to prevent canonical URL changes',
        });
      }
    } else {
      // For blogs, check paramlink
      if (!entity.paramlink) {
        issues.push({
          type: 'canonical_conflict',
          severity: 'critical',
          message: 'Blog paramlink is missing - canonical URL cannot be generated',
          field: 'paramlink',
          fix: 'Generate paramlink for this blog',
        });
      } else if (!entity.slugLocked) {
        issues.push({
          type: 'canonical_conflict',
          severity: 'warning',
          message: 'Blog slug is not locked - canonical URL may change',
          field: 'slugLocked',
          fix: 'Lock slug to prevent canonical URL changes',
        });
      }
    }

    // Check for duplicate canonical URLs
    await dbConnect();
    let duplicates: any[] = [];

    if (entityType === 'clinic') {
      duplicates = await Clinic.find({
        _id: { $ne: entity._id },
        slug: entity.slug,
        slugLocked: true,
      }).limit(1);
    } else if (entityType === 'doctor') {
      duplicates = await DoctorProfile.find({
        _id: { $ne: entity._id },
        slug: entity.slug,
        slugLocked: true,
      }).limit(1);
    } else if (entityType === 'job') {
      duplicates = await JobPosting.find({
        _id: { $ne: entity._id },
        slug: entity.slug,
        slugLocked: true,
      }).limit(1);
    } else {
      const Blog = (await import('../../models/Blog')).default;
      duplicates = await Blog.find({
        _id: { $ne: entity._id },
        paramlink: entity.paramlink,
        slugLocked: true,
        status: 'published',
      }).limit(1);
    }

    if (duplicates.length > 0) {
      issues.push({
        type: 'canonical_conflict',
        severity: 'critical',
        message: 'Duplicate canonical URL detected - multiple entities share the same slug',
        field: 'canonical',
        actual: canonicalUrl,
        fix: 'Regenerate unique slug for this entity',
      });
    }

  } catch (error: any) {
    issues.push({
      type: 'canonical_conflict',
      severity: 'critical',
      message: `Error checking canonical conflicts: ${error.message}`,
      fix: 'Review entity slug configuration',
    });
  }

  return issues;
}

/**
 * Check for indexing violations
 */
async function checkIndexingViolations(
  _entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment',
  _entityId: string,
  decision: IndexingDecision
): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];

  // Check if entity should be indexed but isn't
  if (decision.shouldIndex) {
    // Entity should be indexed - check for violations
    if (decision.warnings && decision.warnings.length > 0) {
      decision.warnings.forEach((warning) => {
        issues.push({
          type: 'indexing_violation',
          severity: 'warning',
          message: warning,
          fix: 'Address the warning to improve SEO health',
        });
      });
    }
  } else {
    // Entity should not be indexed - check reason
    if (decision.reason.includes('not approved')) {
      issues.push({
        type: 'indexing_violation',
        severity: 'info',
        message: 'Entity is not approved - will not be indexed',
        fix: 'Wait for admin approval',
      });
    } else if (decision.reason.includes('Slug')) {
      issues.push({
        type: 'indexing_violation',
        severity: 'critical',
        message: `Slug issue preventing indexing: ${decision.reason}`,
        fix: 'Generate and lock slug',
      });
    } else if (decision.reason.includes('incomplete')) {
      issues.push({
        type: 'indexing_violation',
        severity: 'warning',
        message: `Entity is incomplete - will not be indexed: ${decision.reason}`,
        fix: 'Complete required fields',
      });
    } else if (decision.reason.includes('Duplicate')) {
      issues.push({
        type: 'indexing_violation',
        severity: 'warning',
        message: `Duplicate content detected - indexing blocked: ${decision.reason}`,
        fix: 'Make content unique',
      });
    } else if (decision.reason.includes('thin')) {
      issues.push({
        type: 'indexing_violation',
        severity: 'warning',
        message: `Thin content detected - indexing blocked: ${decision.reason}`,
        fix: 'Add more content',
      });
    } else {
      issues.push({
        type: 'indexing_violation',
        severity: 'warning',
        message: `Indexing blocked: ${decision.reason}`,
        fix: 'Review indexing decision logic',
      });
    }
  }

  return issues;
}

/**
 * Check for missing robots meta tag
 */
function checkMissingRobots(
  _entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment',
  decision: IndexingDecision
): SEOIssue[] {
  const issues: SEOIssue[] = [];

  // Robots meta should be set based on indexing decision
  if (decision.shouldIndex) {
    // Should have index, follow
    // This is handled by RobotsService, but we can check if it's properly configured
  } else {
    // Should have noindex, nofollow
    // This is also handled by RobotsService
  }

  // If we can't determine, it's a warning
  if (!decision.shouldIndex && decision.reason.includes('Error')) {
    issues.push({
      type: 'missing_robots',
      severity: 'warning',
      message: 'Unable to determine robots meta tag configuration',
      fix: 'Review indexing decision service',
    });
  }

  return issues;
}

/**
 * Calculate SEO health score
 */
function calculateHealthScore(issues: SEOIssue[]): number {
  let score = 100;

  issues.forEach((issue) => {
    if (issue.severity === 'critical') {
      score -= 20;
    } else if (issue.severity === 'warning') {
      score -= 10;
    } else if (issue.severity === 'info') {
      score -= 5;
    }
  });

  return Math.max(0, Math.min(100, score));
}

/**
 * Determine overall health status
 */
function determineOverallHealth(score: number, criticalIssues: number): 'healthy' | 'warning' | 'critical' {
  if (criticalIssues > 0) {
    return 'critical';
  } else if (score < 70) {
    return 'warning';
  } else {
    return 'healthy';
  }
}

/**
 * Generate recommendations based on issues
 */
function generateRecommendations(issues: SEOIssue[]): string[] {
  const recommendations: string[] = [];
  const fixes = new Set<string>();

  issues.forEach((issue) => {
    if (issue.fix && !fixes.has(issue.fix)) {
      fixes.add(issue.fix);
      recommendations.push(issue.fix);
    }
  });

  // Add general recommendations
  if (issues.some((i) => i.type === 'missing_meta')) {
    recommendations.push('Ensure all meta tags are properly generated and within optimal length');
  }
  if (issues.some((i) => i.type === 'canonical_conflict')) {
    recommendations.push('Resolve canonical URL conflicts to prevent duplicate content issues');
  }
  if (issues.some((i) => i.type === 'indexing_violation')) {
    recommendations.push('Address indexing violations to improve search engine visibility');
  }

  return Array.from(recommendations);
}

/**
 * Run comprehensive SEO health check
 */
export async function checkSEOHealth(
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment',
  entityId: string
): Promise<SEOHealthFlags> {
  console.log(`\n🔍 [SEO Health Service] Starting health check`);
  console.log(`   Entity Type: ${entityType}`);
  console.log(`   Entity ID: ${entityId}`);

  await dbConnect();

  const issues: SEOIssue[] = [];
  let entity: any = null;

  try {
    // Fetch entity
    console.log(`   📥 Fetching entity from database...`);
    if (entityType === 'clinic') {
      entity = await Clinic.findById(entityId);
    } else if (entityType === 'doctor') {
      entity = await DoctorProfile.findById(entityId).populate('user');
    } else if (entityType === 'job') {
      entity = await JobPosting.findById(entityId);
    } else if (entityType === 'treatment') {
      const Treatment = (await import('../../models/Treatment')).default;
      entity = await Treatment.findById(entityId);
    } else {
      const Blog = (await import('../../models/Blog')).default;
      entity = await Blog.findById(entityId);
    }

    if (!entity) {
      console.log(`   ❌ Entity not found`);
      return {
        entityType,
        entityId,
        overallHealth: 'critical',
        score: 0,
        issues: [{
          type: 'indexing_violation',
          severity: 'critical',
          message: 'Entity not found',
          fix: 'Verify entity ID',
        }],
        recommendations: ['Verify entity exists'],
        lastChecked: new Date(),
      };
    }

    console.log(`   ✅ Entity found:`, entity.name || entity.title || entity.jobTitle || 'N/A');

    // Get indexing decision
    console.log(`   🔍 Checking indexing decision...`);
    const decision = await decideIndexing(entityType, entityId);
    console.log(`   📊 Indexing Decision:`, JSON.stringify({
      shouldIndex: decision.shouldIndex,
      reason: decision.reason,
      priority: decision.priority,
      warnings: decision.warnings,
    }, null, 2));

    // Check missing meta tags
    console.log(`   🔍 Checking missing meta tags...`);
    const metaIssues = await checkMissingMeta(entityType, entity, decision);
    console.log(`   📋 Meta Issues Found: ${metaIssues.length}`);
    if (metaIssues.length > 0) {
      metaIssues.forEach((issue, index) => {
        console.log(`      ${index + 1}. [${issue.severity}] ${issue.message}`);
      });
    }
    issues.push(...metaIssues);

    // Check canonical conflicts
    console.log(`   🔍 Checking canonical conflicts...`);
    const canonicalIssues = await checkCanonicalConflicts(entityType, entity);
    console.log(`   📋 Canonical Issues Found: ${canonicalIssues.length}`);
    if (canonicalIssues.length > 0) {
      canonicalIssues.forEach((issue, index) => {
        console.log(`      ${index + 1}. [${issue.severity}] ${issue.message}`);
      });
    }
    issues.push(...canonicalIssues);

    // Check indexing violations
    console.log(`   🔍 Checking indexing violations...`);
    const indexingIssues = await checkIndexingViolations(entityType, entityId, decision);
    console.log(`   📋 Indexing Issues Found: ${indexingIssues.length}`);
    if (indexingIssues.length > 0) {
      indexingIssues.forEach((issue, index) => {
        console.log(`      ${index + 1}. [${issue.severity}] ${issue.message}`);
      });
    }
    issues.push(...indexingIssues);

    // Check missing robots
    console.log(`   🔍 Checking missing robots meta...`);
    const robotsIssues = checkMissingRobots(entityType, decision);
    console.log(`   📋 Robots Issues Found: ${robotsIssues.length}`);
    if (robotsIssues.length > 0) {
      robotsIssues.forEach((issue, index) => {
        console.log(`      ${index + 1}. [${issue.severity}] ${issue.message}`);
      });
    }
    issues.push(...robotsIssues);

    // Calculate score and health
    console.log(`   📊 Calculating health score...`);
    const score = calculateHealthScore(issues);
    const criticalIssues = issues.filter((i) => i.severity === 'critical').length;
    const warningIssues = issues.filter((i) => i.severity === 'warning').length;
    const infoIssues = issues.filter((i) => i.severity === 'info').length;
    const overallHealth = determineOverallHealth(score, criticalIssues);

    console.log(`   📈 Health Score: ${score}/100`);
    console.log(`   🚨 Critical Issues: ${criticalIssues}`);
    console.log(`   ⚠️  Warning Issues: ${warningIssues}`);
    console.log(`   ℹ️  Info Issues: ${infoIssues}`);
    console.log(`   🏥 Overall Health: ${overallHealth.toUpperCase()}`);

    // Generate recommendations
    console.log(`   💡 Generating recommendations...`);
    const recommendations = generateRecommendations(issues);
    console.log(`   📝 Recommendations Count: ${recommendations.length}`);

    const result = {
      entityType,
      entityId,
      overallHealth,
      score,
      issues,
      recommendations,
      lastChecked: new Date(),
    };

    console.log(`\n✅ [SEO Health Service] Health check completed successfully`);
    console.log(`   Total Issues: ${issues.length}`);
    console.log(`   Overall Health: ${overallHealth}`);
    console.log(`   Score: ${score}/100\n`);

    return result;

  } catch (error: any) {
    console.error(`\n❌ [SEO Health Service] Error:`, error);
    console.error(`   Stack:`, error.stack);
    return {
      entityType,
      entityId,
      overallHealth: 'critical',
      score: 0,
      issues: [{
        type: 'indexing_violation',
        severity: 'critical',
        message: `Error checking SEO health: ${error.message}`,
        fix: 'Review error logs and entity data',
      }],
      recommendations: ['Review error logs', 'Verify entity data integrity'],
      lastChecked: new Date(),
    };
  }
}

/**
 * Batch check SEO health for multiple entities
 */
export async function batchCheckSEOHealth(
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment',
  entityIds: string[]
): Promise<SEOHealthFlags[]> {
  console.log(`\n📦 [SEO Health Service] Starting batch health check`);
  console.log(`   Entity Type: ${entityType}`);
  console.log(`   Entity IDs Count: ${entityIds.length}`);
  console.log(`   Entity IDs:`, entityIds);

  const results = await Promise.all(
    entityIds.map((id) => checkSEOHealth(entityType, id))
  );

  console.log(`\n✅ [SEO Health Service] Batch check completed`);
  console.log(`   Results Count: ${results.length}`);
  const healthyCount = results.filter(r => r.overallHealth === 'healthy').length;
  const warningCount = results.filter(r => r.overallHealth === 'warning').length;
  const criticalCount = results.filter(r => r.overallHealth === 'critical').length;
  console.log(`   Healthy: ${healthyCount}`);
  console.log(`   Warning: ${warningCount}`);
  console.log(`   Critical: ${criticalCount}\n`);

  return results;
}
