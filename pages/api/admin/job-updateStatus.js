import dbConnect from '../../../lib/database';
import JobPosting from '../../../models/JobPosting';
import JobApplication from '../../../models/JobApplication';
import Notification from '../../../models/Notification';
import { getUserFromReq } from '../lead-ms/auth';
import { checkAgentPermission } from '../agent/permissions-helper';
import { generateAndLockSlug } from '../../../lib/slugService';
import { runSEOPipeline } from '../../../lib/seo/SEOOrchestrator';
import { checkSEOHealth } from '../../../lib/seo/SEOHealthService';

export default async function handler(req, res) {
  await dbConnect();

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
    }
    
    // Check permissions for agents - admins bypass all checks
    if (me.role === 'agent' || me.role === 'doctorStaff') {
      // Approve / Decline
      if (req.method === 'PATCH') {
        const { hasPermission } = await checkAgentPermission(me._id, "admin_manage_job", "approve");
        if (!hasPermission) {
          return res.status(403).json({ 
            message: "Permission denied: You do not have approve permission for manage job module" 
          });
        }
      }
      
      // Delete
      if (req.method === 'DELETE') {
        const { hasPermission } = await checkAgentPermission(me._id, "admin_manage_job", "delete");
        if (!hasPermission) {
          return res.status(403).json({ 
            message: "Permission denied: You do not have delete permission for manage job module" 
          });
        }
      }
    } else if (me.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin or agent role required' });
    }

    // Approve / Decline
    if (req.method === 'PATCH') {
      const { jobId, status } = req.body;
      if (!['approved', 'declined'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Step 1: Update job status
      const job = await JobPosting.findByIdAndUpdate(jobId, { status }, { new: true });
      if (!job) return res.status(404).json({ message: 'Job not found' });

      // Step 2: Generate and lock slug for approved jobs
      if (status === 'approved' && !job.slugLocked) {
        try {
          // console.log(`🔄 Generating slug for job: ${job.jobTitle} (ID: ${jobId})`);
          
          // Use central slug service to generate and lock slug
          const updatedJob = await generateAndLockSlug('job', jobId.toString());
          
          if (updatedJob.slug && updatedJob.slugLocked) {
            // console.log(`✅ Slug generated successfully: ${updatedJob.slug}`);
            
            // Step 3: Run SEO pipeline after slug generation
            let seoResult = null;
            let seoMessages = [];
            
            try {
              // console.log(`🚀 Running SEO pipeline for job: ${jobId}`);
              seoResult = await runSEOPipeline('job', jobId.toString(), updatedJob);
              
              if (seoResult.success) {
                // console.log(`✅ SEO pipeline completed successfully`);
                
                // Step 4: Run SEO Health Check after pipeline
                try {
                  // console.log(`\n🏥 [SEO Health Check] Running health check for job: ${jobId}`);
                  const healthCheck = await checkSEOHealth('job', jobId.toString());
                  
                  // console.log(`\n📊 [SEO Health Check] Results:`);
                  // console.log(`   Overall Health: ${healthCheck.overallHealth.toUpperCase()}`);
                  // console.log(`   Health Score: ${healthCheck.score}/100`);
                  // console.log(`   Total Issues: ${healthCheck.issues.length}`);
                  
                  if (healthCheck.issues.length > 0) {
                    // console.log(`\n   🚨 Issues Found:`);
                    healthCheck.issues.forEach((issue, index) => {
                      // console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
                      // console.log(`      Message: ${issue.message}`);
                      // if (issue.field) console.log(`      Field: ${issue.field}`);
                      // if (issue.expected) console.log(`      Expected: ${issue.expected}`);
                      // if (issue.actual) console.log(`      Actual: ${issue.actual}`);
                      // if (issue.fix) console.log(`      Fix: ${issue.fix}`);
                    });
                  }
                  
                  if (healthCheck.recommendations.length > 0) {
                    // console.log(`\n   💡 Recommendations:`);
                    healthCheck.recommendations.forEach((rec, index) => {
                      // console.log(`   ${index + 1}. ${rec}`);
                    });
                  }
                  
                  // console.log(`\n`);
                  
                  // Add health check to SEO messages
                  if (healthCheck.overallHealth === 'critical') {
                    seoMessages.push({
                      type: 'error',
                      message: `🚨 Critical SEO issues detected (Score: ${healthCheck.score}/100). Please review and fix.`,
                    });
                  } else if (healthCheck.overallHealth === 'warning') {
                    seoMessages.push({
                      type: 'warning',
                      message: `⚠️ SEO health warnings detected (Score: ${healthCheck.score}/100). Consider reviewing.`,
                    });
                  } else {
                    seoMessages.push({
                      type: 'success',
                      message: `✅ SEO health check passed (Score: ${healthCheck.score}/100). Your job posting is optimized!`,
                    });
                  }
                  
                  // Store health check in response
                  seoResult.healthCheck = healthCheck;
                } catch (healthError) {
                  // console.error(`❌ SEO Health Check error (non-fatal):`, healthError.message);
                  // Non-fatal - continue with response
                }
                
                // Generate user-friendly messages from SEO results
                if (seoResult.indexing) {
                  if (!seoResult.indexing.shouldIndex) {
                    seoMessages.push({
                      type: 'info',
                      message: `🚧 Your job posting is saved as draft. ${seoResult.indexing.reason}. Complete your job details to appear on Google search results.`,
                    });
                  } else {
                    seoMessages.push({
                      type: 'success',
                      message: `✅ Your job posting is ready for Google search!`,
                    });
                  }
                }
                
                if (seoResult.robots) {
                  const robotsMsg = seoResult.robots.noindex 
                    ? 'Search engines will wait until your job posting is complete.'
                    : 'Search engines can now index your job posting.';
                  seoMessages.push({
                    type: 'info',
                    message: robotsMsg,
                  });
                }
                
                if (seoResult.meta) {
                  seoMessages.push({
                    type: 'success',
                    message: `✨ We optimized your job posting for Google search to improve visibility.`,
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
                    message: `🔗 Your job posting has a single official link to avoid confusion on Google.`,
                  });
                }
                
                if (seoResult.duplicateCheck) {
                  if (seoResult.duplicateCheck.isDuplicate) {
                    seoMessages.push({
                      type: 'warning',
                      message: `⚠️ Similar job posting found: ${seoResult.duplicateCheck.reason}`,
                    });
                  } else {
                    seoMessages.push({
                      type: 'success',
                      message: `✅ Your job posting is recognized as a separate and unique opportunity.`,
                    });
                  }
                }
                
                if (seoResult.sitemapUpdated) {
                  seoMessages.push({
                    type: 'success',
                    message: `📡 Your job posting has been submitted for discovery on search engines.`,
                  });
                }
                
                if (seoResult.pinged) {
                  seoMessages.push({
                    type: 'success',
                    message: `🚀 Search engines have been notified. Your posting will start appearing soon.`,
                  });
                }
                
              } else {
                // console.warn(`⚠️ SEO pipeline completed with warnings:`, seoResult.errors);
                // seoMessages.push({
                //   type: 'warning',
                //   message: `⚠️ SEO setup completed with some warnings. Please review your job posting.`,
                // });
              }
            } catch (seoError) {
              // SEO errors are non-fatal - log but continue
              // console.error("❌ SEO pipeline error (non-fatal):", seoError.message);
              seoMessages.push({
                type: 'error',
                message: `❌ SEO setup encountered an error. Your job is approved but SEO features may be limited.`,
              });
            }
            
            // Store SEO messages in response
            updatedJob._seoMessages = seoMessages;
            updatedJob._seoResult = seoResult;
          } else {
            // console.log(`⚠️ Slug generation completed but slugLocked is false`);
          }
        } catch (slugError) {
          // If slug generation fails but job is approved, continue with approval
          // console.error("❌ Slug generation error (non-fatal):", slugError.message);
          // console.error("Error stack:", slugError.stack);
          // Continue with approval even if slug generation fails
        }
      } else if (status === 'approved' && job.slugLocked) {
        // console.log(`⏭️ Skipping slug generation - slug already locked: ${job.slug}`);
      }

      // Refresh job data to get updated slug
      const finalJob = await JobPosting.findById(jobId);

      // Generate final response with SEO information
      const response = {
        success: true,
        job: finalJob,
      };
      
      // Add SEO messages if available (only for approval)
      if (status === 'approved' && finalJob._seoMessages) {
        response.seo_messages = finalJob._seoMessages;
        response.seo_result = finalJob._seoResult;
        
        // Clean up temporary fields before sending
        delete finalJob._seoMessages;
        delete finalJob._seoResult;
      }
      
      // Add slug lock message if slug was generated
      if (status === 'approved' && finalJob && finalJob.slugLocked) {
        response.slug_locked = true;
        response.slug_lock_message = "🔒 Your job posting link is now permanent and cannot be changed to protect SEO rankings.";
      }

      return res.status(200).json(response);
    }

    // Delete job + related data
    if (req.method === 'DELETE') {
      const { jobId } = req.query; // jobId will come in query params
      if (!jobId) return res.status(400).json({ message: 'Job ID is required' });

      const job = await JobPosting.findById(jobId);
      if (!job) return res.status(404).json({ message: 'Job not found' });

      // Delete related applications
      await JobApplication.deleteMany({ jobId: job._id });

      // Delete related notifications
      await Notification.deleteMany({ relatedJob: job._id });

      // Finally delete job itself
      await job.deleteOne();

      return res.status(200).json({ success: true, message: 'Job and related data deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
}
