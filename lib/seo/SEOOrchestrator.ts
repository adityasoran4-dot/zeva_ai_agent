/**
 * SEO Orchestrator Service
 * 
 * Purpose: Orchestrate all SEO services in sequence
 * 
 * Flow:
 * 1. IndexingService.decide
 * 2. RobotsService.getRobotsMeta
 * 3. MetaService.generate
 * 4. CanonicalService.resolve
 * 5. SitemapService.update
 * 6. SitemapPingService.ping
 */

import { decideIndexing } from './IndexingService';
import { getRobotsMeta } from './RobotsService';
import { generateMeta } from './MetaService';
import { getCanonicalUrl } from './CanonicalService';
import { checkDuplicates } from './DuplicateService';
import { updateEntitySitemap } from './SitemapService';
import { pingAfterUpdate } from './SitemapPingService';
import { generateHeadings } from './HeadingService';

export interface SEOResult {
  success: boolean;
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment';
  entityId: string;
  indexing?: {
    shouldIndex: boolean;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    warnings: string[];
  };
  robots?: {
    content: string;
    noindex: boolean;
    nofollow: boolean;
  };
  meta?: {
    title: string;
    description: string;
    keywords?: string[];
  };
  canonical?: string;
  duplicateCheck?: {
    isDuplicate: boolean;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  };
  headings?: {
    h1: string;
    h2: string[];
    h3?: string[];
  };
  sitemapUpdated?: boolean;
  pinged?: boolean;
  errors?: string[];
}

/**
 * Run full SEO pipeline for an entity
 */
export async function runSEOPipeline(
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment',
  entityId: string,
  entity?: any,
  user?: any
): Promise<SEOResult> {
  const errors: string[] = [];
  const result: SEOResult = {
    success: false,
    entityType,
    entityId,
  };

  try {
    // Step 1: Indexing Decision
    console.log(`🔍 [SEO] Step 1: Deciding indexing for ${entityType} ${entityId}`);
    const indexingDecision = await decideIndexing(entityType, entityId);
    result.indexing = indexingDecision;
    console.log(`   📊 Result:`, JSON.stringify({
      shouldIndex: indexingDecision.shouldIndex,
      reason: indexingDecision.reason,
      priority: indexingDecision.priority,
      warnings: indexingDecision.warnings,
    }, null, 2));

    // Step 2: Robots Meta
    console.log(`🤖 [SEO] Step 2: Generating robots meta for ${entityType} ${entityId}`);
    const robotsMeta = getRobotsMeta(indexingDecision);
    result.robots = robotsMeta;
    console.log(`   📊 Result:`, JSON.stringify({
      content: robotsMeta.content,
      noindex: robotsMeta.noindex,
      nofollow: robotsMeta.nofollow,
    }, null, 2));

    // Step 3: Meta Tags (only if should index)
    if (indexingDecision.shouldIndex) {
      console.log(`📝 [SEO] Step 3: Generating meta tags for ${entityType} ${entityId}`);
      try {
        if (!entity) {
          // Fetch entity if not provided
          const dbConnect = (await import('../database')).default;
          await dbConnect();
          
          if (entityType === 'clinic') {
            const Clinic = (await import('../../models/Clinic')).default;
            entity = await Clinic.findById(entityId);
          } else if (entityType === 'doctor') {
            const DoctorProfile = (await import('../../models/DoctorProfile')).default;
            entity = await DoctorProfile.findById(entityId).populate('user');
            user = entity?.user;
          } else if (entityType === 'job') {
            const JobPosting = (await import('../../models/JobPosting')).default;
            entity = await JobPosting.findById(entityId);
          } else if (entityType === 'blog') {
            const Blog = (await import('../../models/Blog')).default;
            entity = await Blog.findById(entityId).populate('postedBy');
          } else if (entityType === 'treatment') {
            const Treatment = (await import('../../models/Treatment')).default;
            entity = await Treatment.findById(entityId);
          }
        }

        if (entity) {
          const metaTags = await generateMeta(entityType, entity, indexingDecision);
          result.meta = {
            title: metaTags.title,
            description: metaTags.description,
            keywords: metaTags.keywords,
          };
          console.log(`   📊 Result:`, JSON.stringify({
            title: metaTags.title,
            description: metaTags.description,
            keywords: metaTags.keywords?.slice(0, 10), // Limit to first 10 keywords
          }, null, 2));
        }
      } catch (error: any) {
        errors.push(`Meta generation: ${error.message}`);
        console.error(`❌ [SEO] Meta generation error:`, error);
      }

      // Step 4: Canonical URL
      console.log(`🔗 [SEO] Step 4: Resolving canonical URL for ${entityType} ${entityId}`);
      try {
        if (entity) {
          const canonicalUrl = getCanonicalUrl(entityType, entity);
          result.canonical = canonicalUrl;
          console.log(`   📊 Result:`, JSON.stringify({
            canonicalUrl: canonicalUrl,
          }, null, 2));
        }
      } catch (error: any) {
        errors.push(`Canonical resolution: ${error.message}`);
        console.error(`❌ [SEO] Canonical resolution error:`, error);
      }

      // Step 5: Duplicate Check
      console.log(`🔎 [SEO] Step 5: Checking duplicates for ${entityType} ${entityId}`);
      try {
        if (entity) {
          const duplicateCheck = await checkDuplicates(entityType, entity, user);
          result.duplicateCheck = {
            isDuplicate: duplicateCheck.isDuplicate,
            confidence: duplicateCheck.confidence,
            reason: duplicateCheck.reason,
          };
          console.log(`   📊 Result:`, JSON.stringify({
            isDuplicate: duplicateCheck.isDuplicate,
            confidence: duplicateCheck.confidence,
            reason: duplicateCheck.reason,
            similarEntitiesCount: duplicateCheck.similarEntities?.length || 0,
          }, null, 2));
        }
      } catch (error: any) {
        errors.push(`Duplicate check: ${error.message}`);
        console.error(`❌ [SEO] Duplicate check error:`, error);
      }

      // Step 5.5: Generate Headings
      console.log(`📋 [SEO] Step 5.5: Generating headings for ${entityType} ${entityId}`);
      try {
        if (entity) {
          const headingPlan = generateHeadings(entityType, entity);
          result.headings = {
            h1: headingPlan.h1,
            h2: headingPlan.h2,
            h3: headingPlan.h3,
          };
          console.log(`   📊 Result:`, JSON.stringify({
            h1: headingPlan.h1,
            h2: headingPlan.h2,
            h3: headingPlan.h3,
          }, null, 2));
        }
      } catch (error: any) {
        errors.push(`Heading generation: ${error.message}`);
        console.error(`❌ [SEO] Heading generation error:`, error);
      }

      // Step 6: Update Sitemap
      console.log(`🗺️ [SEO] Step 6: Updating sitemap for ${entityType} ${entityId}`);
      try {
        await updateEntitySitemap(entityType);
        result.sitemapUpdated = true;
        console.log(`   📊 Result:`, JSON.stringify({
          sitemapUpdated: true,
          sitemapFile: `sitemap-${entityType}s.xml`,
        }, null, 2));
      } catch (error: any) {
        errors.push(`Sitemap update: ${error.message}`);
        console.error(`❌ [SEO] Sitemap update error:`, error);
      }

      // Step 7: Ping Search Engines (async, don't wait)
      console.log(`📡 [SEO] Step 7: Pinging search engines for ${entityType} ${entityId}`);
      pingAfterUpdate().then(() => {
        result.pinged = true;
        console.log(`✅ [SEO] Search engines pinged successfully`);
      }).catch((error: any) => {
        errors.push(`Search engine ping: ${error.message}`);
        console.error(`❌ [SEO] Search engine ping error:`, error);
      });
    } else {
      console.log(`⏭️ [SEO] Skipping SEO steps - entity should not be indexed`);
    }

    result.success = errors.length === 0;
    result.errors = errors.length > 0 ? errors : undefined;

    console.log(`✅ [SEO] Pipeline completed for ${entityType} ${entityId}`);
    console.log(`\n📋 [SEO] Final Summary:`);
    console.log(JSON.stringify({
      success: result.success,
      entityType: result.entityType,
      entityId: result.entityId,
      indexing: result.indexing,
      robots: result.robots,
      meta: result.meta,
      canonical: result.canonical,
      duplicateCheck: result.duplicateCheck,
      headings: result.headings,
      sitemapUpdated: result.sitemapUpdated,
      pinged: result.pinged,
      errors: result.errors,
    }, null, 2));
    console.log(`\n`);
    return result;
  } catch (error: any) {
    console.error(`❌ [SEO] Pipeline error:`, error);
    result.success = false;
    result.errors = [error.message];
    return result;
  }
}

/**
 * Quick SEO check (lightweight, no sitemap/ping)
 */
export async function quickSEOCheck(
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment',
  entityId: string
): Promise<SEOResult> {
  const indexingDecision = await decideIndexing(entityType, entityId);
  const robotsMeta = getRobotsMeta(indexingDecision);

  return {
    success: true,
    entityType,
    entityId,
    indexing: indexingDecision,
    robots: robotsMeta,
  };
}

