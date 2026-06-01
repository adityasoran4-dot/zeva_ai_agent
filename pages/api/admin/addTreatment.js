import dbConnect from '../../../lib/database';
import Treatment from '../../../models/Treatment';
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";
import { generateSlug, validateSlug } from '../../../lib/slugService';
import { runSEOPipeline } from '../../../lib/seo/SEOOrchestrator';
import { checkSEOHealth } from '../../../lib/seo/SEOHealthService';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const { name, slug, subTreatmentName, subTreatmentSlug } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Treatment name is required' });
    }

    const trimmedName = name.trim();

    try {
      // Get the logged-in user
      const me = await getUserFromReq(req);
      if (!me) {
        return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
      }

      // If user is an agent, check create permission for add_treatment module
      if (['agent', 'doctorStaff'].includes(me.role)) {
        const { hasPermission, error: permissionError } = await checkAgentPermission(
          me._id,
          "add_treatment", // moduleKey
          "create", // action
          null // subModuleName
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permissionError || "You do not have permission to create treatments"
          });
        }
      }
      // Admin users bypass permission checks
      
      // Check for duplicate treatment (case-insensitive)
      const existingTreatment = await Treatment.findOne({ 
        name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      
      if (existingTreatment) {
        // If subtreatment is also provided, check if the combination exists
        if (subTreatmentName && subTreatmentName.trim()) {
          const trimmedSubTreatment = subTreatmentName.trim();
          const existingSubTreatment = existingTreatment.subcategories.find(
            (sub) => sub.name.toLowerCase().trim() === trimmedSubTreatment.toLowerCase()
          );
          
          if (existingSubTreatment) {
            return res.status(409).json({ 
              message: 'This treatment and subtreatment already exist',
              treatment: existingTreatment.name,
              subTreatment: trimmedSubTreatment
            });
          }
        } else {
          return res.status(409).json({ message: 'Treatment already exists' });
        }
      }

      // Generate slug using slugService
      let treatmentSlug;
      try {
        // For treatments, we'll use a simple slugify approach since treatments don't have approval workflow
        const { slugify } = require('../../../lib/utils');
        const baseSlug = slug || slugify(trimmedName);
        
        // Check if slug already exists
        const slugExists = await Treatment.findOne({ slug: baseSlug });
        if (slugExists) {
          // Generate sequential slug
          let counter = 2;
          let newSlug = `${baseSlug}-${counter}`;
          while (await Treatment.findOne({ slug: newSlug })) {
            counter++;
            newSlug = `${baseSlug}-${counter}`;
          }
          treatmentSlug = newSlug;
        } else {
          treatmentSlug = baseSlug;
        }
        
        // Validate slug
        const validation = validateSlug(treatmentSlug);
        if (!validation.valid) {
          return res.status(400).json({ 
            message: 'Invalid slug format', 
            error: validation.error || 'Invalid slug'
          });
        }
      } catch (slugError) {
        // console.error('Error generating slug:', slugError);
        treatmentSlug = trimmedName.toLowerCase().replace(/\s+/g, '-');
      }

      // Create treatment with or without subtreatment
      const treatmentData = { 
        name: trimmedName,
        slug: treatmentSlug,
        subcategories: []
      };

      // If subtreatment is provided, add it
      if (subTreatmentName && subTreatmentName.trim()) {
        const trimmedSubTreatment = subTreatmentName.trim();
        let subTreatmentSlugValue = subTreatmentSlug || trimmedSubTreatment.toLowerCase().replace(/\s+/g, '-');
        
        // Validate subtreatment slug
        const subValidation = validateSlug(subTreatmentSlugValue);
        if (!subValidation.valid) {
          subTreatmentSlugValue = trimmedSubTreatment.toLowerCase().replace(/\s+/g, '-');
        }
        
        treatmentData.subcategories.push({
          name: trimmedSubTreatment,
          slug: subTreatmentSlugValue
        });
      }

      const treatment = new Treatment(treatmentData);
      await treatment.save();

      // console.log(`\n✅ [Treatment API] Treatment created successfully`);
      // console.log(`   Treatment ID: ${treatment._id}`);
      // console.log(`   Treatment Name: ${treatment.name}`);
      // console.log(`   Treatment Slug: ${treatment.slug}`);
      if (treatment.subcategories.length > 0) {
        // console.log(`   Sub-treatments: ${treatment.subcategories.map(s => s.name).join(', ')}`);
      }

      // Run SEO Pipeline for treatment
      try {
        // console.log(`\n🔍 [SEO] Running SEO pipeline for treatment ${treatment._id}`);
        const seoResult = await runSEOPipeline('treatment', treatment._id.toString(), treatment);
        // console.log(`✅ [SEO] SEO pipeline completed:`, JSON.stringify({
        //   success: seoResult.success,
        //   indexing: seoResult.indexing,
        //   robots: seoResult.robots,
        //   meta: seoResult.meta,
        //   canonical: seoResult.canonical,
        //   duplicateCheck: seoResult.duplicateCheck,
        //   headings: seoResult.headings,
        //   sitemapUpdated: seoResult.sitemapUpdated,
        //   errors: seoResult.errors
        // }, null, 2));

        // Run SEO Health Check
        // console.log(`\n🔍 [SEO Health] Running health check for treatment ${treatment._id}`);
        const healthCheck = await checkSEOHealth('treatment', treatment._id.toString());
        // console.log(`✅ [SEO Health] Health check completed:`, JSON.stringify({
        //   overallHealth: healthCheck.overallHealth,
        //   score: healthCheck.score,
        //   issuesCount: healthCheck.issues.length,
        //   recommendationsCount: healthCheck.recommendations.length
        // }, null, 2));
      } catch (seoError) {
        // console.error('❌ [SEO] Error running SEO pipeline:', seoError);
        // Don't fail the request if SEO fails, just log it
      }

      return res.status(201).json({ 
        message: 'Treatment added successfully', 
        treatment,
        seoProcessed: true
      });
    } catch (error) {
      // console.error('Error adding treatment:', error);
      return res.status(500).json({ success: false, message: 'Failed to add treatment' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
