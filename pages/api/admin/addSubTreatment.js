import dbConnect from "../../../lib/database";
import Treatment from "../../../models/Treatment";
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";
import { validateSlug } from '../../../lib/slugService';
import { runSEOPipeline } from '../../../lib/seo/SEOOrchestrator';
import { checkSEOHealth } from '../../../lib/seo/SEOHealthService';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    const { mainTreatmentId, subTreatmentName, subTreatmentSlug } = req.body;

    if (!mainTreatmentId || !subTreatmentName) {
      return res
        .status(400)
        .json({
          message: "Main treatment ID and sub-treatment name are required",
        });
    }

    const trimmedSubTreatmentName = subTreatmentName.trim();

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
            message: permissionError || "You do not have permission to create sub-treatments"
          });
        }
      }
      // Admin users bypass permission checks
      const mainTreatment = await Treatment.findById(mainTreatmentId);
      if (!mainTreatment) {
        return res.status(404).json({ message: "Main treatment not found" });
      }

      // Check if sub-treatment already exists (case-insensitive)
      const existingSubTreatment = mainTreatment.subcategories.find(
        (sub) => sub.name.toLowerCase().trim() === trimmedSubTreatmentName.toLowerCase()
      );

      if (existingSubTreatment) {
        return res
          .status(409)
          .json({
            message: "This treatment and subtreatment already exist",
            treatment: mainTreatment.name,
            subTreatment: trimmedSubTreatmentName
          });
      }

      // Generate and validate slug for sub-treatment
      let subTreatmentSlugValue = subTreatmentSlug || trimmedSubTreatmentName.toLowerCase().replace(/\s+/g, "-");
      
      // Check if slug already exists in this treatment's subcategories
      const slugExists = mainTreatment.subcategories.some(
        (sub) => sub.slug === subTreatmentSlugValue
      );
      
      if (slugExists) {
        // Generate sequential slug
        let counter = 2;
        let newSlug = `${subTreatmentSlugValue}-${counter}`;
        while (mainTreatment.subcategories.some(sub => sub.slug === newSlug)) {
          counter++;
          newSlug = `${subTreatmentSlugValue}-${counter}`;
        }
        subTreatmentSlugValue = newSlug;
      }
      
      // Validate slug
      const validation = validateSlug(subTreatmentSlugValue);
      if (!validation.valid) {
        // Fallback to simple slugify if validation fails
        subTreatmentSlugValue = trimmedSubTreatmentName.toLowerCase().replace(/\s+/g, "-");
      }

      // Add new sub-treatment
      mainTreatment.subcategories.push({
        name: trimmedSubTreatmentName,
        slug: subTreatmentSlugValue,
      });

      await mainTreatment.save();

      // console.log(`\n✅ [SubTreatment API] Sub-treatment added successfully`);
      // console.log(`   Treatment ID: ${mainTreatment._id}`);
      // console.log(`   Treatment Name: ${mainTreatment.name}`);
      // console.log(`   Sub-treatment Name: ${trimmedSubTreatmentName}`);
      // console.log(`   Sub-treatment Slug: ${subTreatmentSlugValue}`);

      // // Run SEO Pipeline for treatment
      try {
        // console.log(`\n🔍 [SEO] Running SEO pipeline for treatment ${mainTreatment._id}`);
        const seoResult = await runSEOPipeline('treatment', mainTreatment._id.toString(), mainTreatment);
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
        // console.log(`\n🔍 [SEO Health] Running health check for treatment ${mainTreatment._id}`);
        const healthCheck = await checkSEOHealth('treatment', mainTreatment._id.toString());
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
        message: "Sub-treatment added successfully",
        treatment: mainTreatment,
        seoProcessed: true
      });
    } catch (error) {
      // console.error("Error adding sub-treatment:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to add sub-treatment" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
