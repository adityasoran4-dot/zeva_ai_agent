import dbConnect from "../../../lib/database";
import Treatment from "../../../models/Treatment";
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";
import { runSEOPipeline } from '../../../lib/seo/SEOOrchestrator';
import { checkSEOHealth } from '../../../lib/seo/SEOHealthService';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "DELETE") {
    const { mainTreatmentId, subTreatmentName } = req.query;

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

      // If user is an agent, check delete permission for add_treatment module
      if (['agent', 'doctorStaff'].includes(me.role)) {
        const { hasPermission, error: permissionError } = await checkAgentPermission(
          me._id,
          "add_treatment", // moduleKey
          "delete", // action
          null // subModuleName
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permissionError || "You do not have permission to delete sub-treatments"
          });
        }
      }
      // Admin users bypass permission checks
      const mainTreatment = await Treatment.findById(mainTreatmentId);
      if (!mainTreatment) {
        return res.status(404).json({ message: "Main treatment not found" });
      }

      // Find and remove the sub-treatment (case-insensitive)
      const initialLength = mainTreatment.subcategories.length;
      mainTreatment.subcategories = mainTreatment.subcategories.filter(
        (sub) => sub.name.toLowerCase().trim() !== trimmedSubTreatmentName.toLowerCase()
      );

      if (mainTreatment.subcategories.length === initialLength) {
        return res.status(404).json({ 
          message: "Sub-treatment not found",
          treatment: mainTreatment.name,
          subTreatment: trimmedSubTreatmentName
        });
      }

      await mainTreatment.save();

      // console.log(`\n✅ [SubTreatment API] Sub-treatment deleted successfully`);
      // console.log(`   Treatment ID: ${mainTreatment._id}`);
      // console.log(`   Treatment Name: ${mainTreatment.name}`);
      // console.log(`   Sub-treatment Name: ${trimmedSubTreatmentName}`);

      // Run SEO Pipeline for treatment
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

      return res.status(200).json({
        message: "Sub-treatment deleted successfully",
        treatment: mainTreatment,
        seoProcessed: true
      });
    } catch (error) {
      // console.error("Error deleting sub-treatment:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete sub-treatment" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

