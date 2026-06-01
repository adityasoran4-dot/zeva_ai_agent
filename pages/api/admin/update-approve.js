// pages/api/admin/approve-clinic.ts
import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";
import { generateAndLockSlug } from "../../../lib/slugService";
import { runSEOPipeline } from "../../../lib/seo/SEOOrchestrator";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { clinicId } = req.body;

  if (!clinicId) {
    return res.status(400).json({ success: false, message: "Clinic ID is required" });
  }

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
    }

    // If user is an agent, check approve permission for approval_clinic module
    if (['agent', 'doctorStaff'].includes(me.role)) {
      const { hasPermission, error: permissionError } = await checkAgentPermission(
        me._id,
        "approval_clinic", // moduleKey
        "approve", // action
        null // subModuleName
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permissionError || "You do not have permission to approve clinics"
        });
      }
    }
    // Admin users bypass permission checks
    
    // First, fetch the clinic to get its name
    const clinicBeforeUpdate = await Clinic.findById(clinicId);
    if (!clinicBeforeUpdate) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found",
      });
    }

    // Step 1: First approve the clinic (slug generation requires approval)
    const clinic = await Clinic.findByIdAndUpdate(
      clinicId,
      {
        isApproved: true,
        declined: false,
      },
      { new: true }
    );

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found",
      });
    }

    // Step 2: Generate and lock slug using central slug service (after approval)
    let slugGenerated = false;
    let finalClinic = clinic;
    
    try {
      if (!clinic.slugLocked && clinic.isApproved) {
        // console.log(`🔄 Generating slug for clinic: ${clinic.name} (ID: ${clinicId})`);
        
        // Use central slug service to generate and lock slug
        const updatedClinic = await generateAndLockSlug('clinic', clinicId.toString());
        slugGenerated = !!updatedClinic.slug && updatedClinic.slugLocked;
        
        // Refresh clinic data to get updated slug
        finalClinic = await Clinic.findById(clinicId);
        
        if (slugGenerated) {
          // console.log(`✅ Slug generated successfully: ${finalClinic.slug}`);
          
          // Step 3: Run SEO pipeline after slug generation
          let seoResult = null;
          let seoMessages = [];
          
          try {
            // console.log(`🚀 Running SEO pipeline for clinic: ${clinicId}`);
            seoResult = await runSEOPipeline('clinic', clinicId.toString(), finalClinic);
            
            if (seoResult.success) {
              // console.log(`✅ SEO pipeline completed successfully`);
              
              // Generate user-friendly messages from SEO results
              if (seoResult.indexing) {
                if (!seoResult.indexing.shouldIndex) {
                  seoMessages.push({
                    type: 'info',
                    message: `🚧 Your clinic page is saved as draft. ${seoResult.indexing.reason}. Complete your profile to appear on Google search results.`,
                  });
                } else {
                  seoMessages.push({
                    type: 'success',
                    message: `✅ Your clinic page is ready for Google search!`,
                  });
                }
              }
              
              if (seoResult.robots) {
                const robotsMsg = seoResult.robots.noindex 
                  ? 'Search engines will wait until your profile is complete.'
                  : 'Search engines can now index your clinic page.';
                seoMessages.push({
                  type: 'info',
                  message: robotsMsg,
                });
              }
              
              if (seoResult.meta) {
                seoMessages.push({
                  type: 'success',
                  message: `✨ We optimized your clinic page for Google search to improve visibility.`,
                });
              }
              
              if (seoResult.headings) {
                seoMessages.push({
                  type: 'success',
                  message: `🧾 Page headings are optimized to avoid duplication on search engines.`,
                });
              }
              
              if (seoResult.canonical) {
                seoMessages.push({
                  type: 'success',
                  message: `🔗 Your clinic page has a single official link to avoid confusion on Google.`,
                });
              }
              
              if (seoResult.duplicateCheck) {
                if (seoResult.duplicateCheck.isDuplicate) {
                  seoMessages.push({
                    type: 'warning',
                    message: `⚠️ Similar clinic found: ${seoResult.duplicateCheck.reason}`,
                  });
                } else {
                  seoMessages.push({
                    type: 'success',
                    message: `✅ Your clinic is recognized as a separate and unique business.`,
                  });
                }
              }
              
              if (seoResult.sitemapUpdated) {
                seoMessages.push({
                  type: 'success',
                  message: `📡 Your clinic page has been submitted for discovery on search engines.`,
                });
              }
              
              if (seoResult.pinged) {
                seoMessages.push({
                  type: 'success',
                  message: `🚀 Search engines have been notified. Your page will start appearing soon.`,
                });
              }
              
            } else {
              // console.warn(`⚠️ SEO pipeline completed with warnings:`, seoResult.errors);
              seoMessages.push({
                type: 'warning',
                message: `⚠️ SEO setup completed with some warnings. Please review your clinic profile.`,
              });
            }
          } catch (seoError) {
            // SEO errors are non-fatal - log but continue
            // console.error("❌ SEO pipeline error (non-fatal):", seoError.message);
            seoMessages.push({
              type: 'error',
              message: `❌ SEO setup encountered an error. Your clinic is approved but SEO features may be limited.`,
            });
          }
          
          // Store SEO messages in response
          finalClinic._seoMessages = seoMessages;
          finalClinic._seoResult = seoResult;
        } else {
          // console.log(`⚠️ Slug generation completed but slugLocked is false`);
        }
      } else {
        // console.log(`⏭️ Skipping slug generation - slugLocked: ${clinic.slugLocked}, isApproved: ${clinic.isApproved}`);
      }
    } catch (slugError) {
      // If slug generation fails but clinic is approved, continue with approval
      // console.error("❌ Slug generation error (non-fatal):", slugError.message);
      // console.error("Error stack:", slugError.stack);
      // Continue with approval even if slug generation fails
    }

    const slugMessage = slugGenerated && finalClinic.slugLocked 
      ? " and slug generated" 
      : "";

    // Generate final response with SEO information
    const response = {
      success: true,
      message: "Clinic approved" + slugMessage,
      clinic: finalClinic,
    };
    
    // Add SEO messages if available
    if (finalClinic._seoMessages) {
      response.seo_messages = finalClinic._seoMessages;
      response.seo_result = finalClinic._seoResult;
      
      // Clean up temporary fields before sending
      delete finalClinic._seoMessages;
      delete finalClinic._seoResult;
    }
    
    // Add slug lock message
    if (slugGenerated && finalClinic.slugLocked) {
      response.slug_locked = true;
      response.slug_lock_message = "🔒 Your clinic link is now permanent and cannot be changed to protect SEO rankings.";
    }

    res.status(200).json(response);
  } catch (error) {
    // console.error("❌ Clinic Approval Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}
