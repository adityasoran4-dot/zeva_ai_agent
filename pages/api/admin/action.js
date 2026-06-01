 import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import DoctorProfile from "../../../models/DoctorProfile";
import Review from "../../../models/Review"; // ✅ Import Review model
import Appointment from "../../../models/Appointment";
import DoctorTreatment from "../../../models/DoctorTreatment";
import DoctorDepartment from "../../../models/DoctorDepartment";
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";
import { generateAndLockSlug } from "../../../lib/slugService";
import { runSEOPipeline } from "../../../lib/seo/SEOOrchestrator";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  const { userId, action } = req.body;

  if (!userId || !["approve", "decline", "delete"].includes(action)) {
    return res.status(400).json({ message: "Invalid request" });
  }

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
    }

    // If user is an agent, check permissions based on action
    if (['agent', 'doctorStaff'].includes(me.role)) {
      let requiredAction = action;
      if (action === "approve" || action === "decline") {
        requiredAction = "approve"; // Both approve and decline require "approve" permission
      }
      // delete action requires "delete" permission

      const { hasPermission, error: permissionError } = await checkAgentPermission(
        me._id,
        "approval_doctors", // moduleKey
        requiredAction, // action: "approve" or "delete"
        null // subModuleName
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permissionError || `You do not have permission to ${action} doctors`
        });
      }
    }
    // Admin users bypass permission checks
    if (action === "delete") {
      // Delete DoctorProfile
      const doctorProfile = await DoctorProfile.findOneAndDelete({ user: userId });

      // Delete User
      await User.findByIdAndDelete(userId);

      // Delete all reviews associated with this doctor
      if (doctorProfile) {
        await Review.deleteMany({ doctorId: doctorProfile._id }); // ✅ Cleanup reviews
      }

      return res.status(200).json({ message: "Doctor and related reviews deleted successfully" });
    }

    // Step 1: Update user approval status
    const updateFields = {
      isApproved: action === "approve",
      declined: action === "decline",
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    });

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    // Step 2: Generate and lock slug for doctor profile (only on approval)
    if (action === "approve") {
      try {
        const doctorProfile = await DoctorProfile.findOne({ user: userId });
        if (doctorProfile && !doctorProfile.slugLocked) {
          // console.log(`🔄 Generating slug for doctor: ${updatedUser.name} (Profile ID: ${doctorProfile._id})`);
          
          // Use central slug service to generate and lock slug
          const updatedProfile = await generateAndLockSlug('doctor', doctorProfile._id.toString());
          
          if (updatedProfile.slug && updatedProfile.slugLocked) {
            // console.log(`✅ Slug generated successfully: ${updatedProfile.slug}`);
            
            // Step 3: Run SEO pipeline after slug generation
            let seoResult = null;
            let seoMessages = [];
            
            try {
              // console.log(`🚀 Running SEO pipeline for doctor: ${doctorProfile._id}`);
              // Refresh doctor profile with populated user
              const refreshedProfile = await DoctorProfile.findById(doctorProfile._id).populate('user');
              seoResult = await runSEOPipeline('doctor', doctorProfile._id.toString(), refreshedProfile, updatedUser);
              
              if (seoResult.success) {
                // console.log(`✅ SEO pipeline completed successfully`);
                
                // Generate user-friendly messages from SEO results
                if (seoResult.indexing) {
                  if (!seoResult.indexing.shouldIndex) {
                    seoMessages.push({
                      type: 'info',
                      message: `🚧 Your doctor page is saved as draft. ${seoResult.indexing.reason}. Complete your profile to appear on Google search results.`,
                    });
                  } else {
                    seoMessages.push({
                      type: 'success',
                      message: `✅ Your doctor page is ready for Google search!`,
                    });
                  }
                }
                
                if (seoResult.robots) {
                  const robotsMsg = seoResult.robots.noindex 
                    ? 'Search engines will wait until your profile is complete.'
                    : 'Search engines can now index your doctor page.';
                  seoMessages.push({
                    type: 'info',
                    message: robotsMsg,
                  });
                }
                
                if (seoResult.meta) {
                  seoMessages.push({
                    type: 'success',
                    message: `✨ We optimized your doctor page for Google search to improve visibility.`,
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
                    message: `🔗 Your doctor page has a single official link to avoid confusion on Google.`,
                  });
                }
                
                if (seoResult.duplicateCheck) {
                  if (seoResult.duplicateCheck.isDuplicate) {
                    seoMessages.push({
                      type: 'warning',
                      message: `⚠️ Similar doctor found: ${seoResult.duplicateCheck.reason}`,
                    });
                  } else {
                    seoMessages.push({
                      type: 'success',
                      message: `✅ Your doctor is recognized as a separate and unique professional.`,
                    });
                  }
                }
                
                if (seoResult.sitemapUpdated) {
                  seoMessages.push({
                    type: 'success',
                    message: `📡 Your doctor page has been submitted for discovery on search engines.`,
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
                  message: `⚠️ SEO setup completed with some warnings. Please review your doctor profile.`,
                });
              }
            } catch (seoError) {
              // SEO errors are non-fatal - log but continue
              // console.error("❌ SEO pipeline error (non-fatal):", seoError.message);
              seoMessages.push({
                type: 'error',
                message: `❌ SEO setup encountered an error. Your doctor is approved but SEO features may be limited.`,
              });
            }
            
            // Store SEO messages in response
            updatedUser._seoMessages = seoMessages;
            updatedUser._seoResult = seoResult;
          } else {
            // console.log(`⚠️ Slug generation completed but slugLocked is false`);
          }
        } else if (doctorProfile && doctorProfile.slugLocked) {
          // console.log(`⏭️ Skipping slug generation - slug already locked: ${doctorProfile.slug}`);
        }
      } catch (slugError) {
        // If slug generation fails but doctor is approved, continue with approval
        // console.error("❌ Slug generation error (non-fatal):", slugError.message);
        // console.error("Error stack:", slugError.stack);
        // Continue with approval even if slug generation fails
      }
    }

    // Generate final response with SEO information
    const response = {
      message: `Doctor ${action === "approve" ? "approved" : "declined"} successfully`,
      user: updatedUser,
    };
    
    // Add SEO messages if available (only for approval)
    if (action === "approve" && updatedUser._seoMessages) {
      response.seo_messages = updatedUser._seoMessages;
      response.seo_result = updatedUser._seoResult;
      
      // Clean up temporary fields before sending
      delete updatedUser._seoMessages;
      delete updatedUser._seoResult;
    }
    
    // Add slug lock message if slug was generated
    if (action === "approve") {
      const doctorProfile = await DoctorProfile.findOne({ user: userId });
      if (doctorProfile && doctorProfile.slugLocked) {
        response.slug_locked = true;
        response.slug_lock_message = "🔒 Your doctor link is now permanent and cannot be changed to protect SEO rankings.";
      }
    }

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}
