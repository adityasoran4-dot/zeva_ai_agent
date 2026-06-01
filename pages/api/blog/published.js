// api/blog/published.js

import dbConnect from "../../../lib/database";
import Blog from "../../../models/Blog";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import { getUserFromReq, requireRole } from "../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";
import { checkAgentPermission } from "../agent/permissions-helper";
import { generateAndLockSlug } from "../../../lib/slugService";
import { runSEOPipeline } from "../../../lib/seo/SEOOrchestrator";
import { checkSEOHealth } from "../../../lib/seo/SEOHealthService";
import { slugify } from "../../../lib/utils";

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;

  try {
    switch (method) {
      case "GET":
        try {
          const me = await getUserFromReq(req);
          if (!me || !requireRole(me, ["clinic", "doctor", "doctorStaff", "agent", "admin"])) {
            return res.status(403).json({ success: false, message: "Access denied" });
          }

          const { clinicId, error, isAdmin } = await getClinicIdFromUser(me);
          const isDoctor = me.role === "doctor";
          const isDoctorStaff = me.role === "doctorStaff";
          const isAgent = me.role === "agent";
          if (error && !isAdmin && !isDoctor && !isDoctorStaff && !isAgent) {
            return res.status(404).json({ success: false, message: error });
          }

          // ✅ No permission checks - all authenticated users with clinic access can read blogs

          const { id } = req.query;

          if (id) {
            // Get single published blog by ID
            let blogQuery = {
              _id: id,
              status: "published",
            };

            // For agent/doctorStaff, find blogs from their clinic
            if ((isAgent || isDoctorStaff) && clinicId) {
              // Find clinic owner and all users from this clinic
              const clinic = await Clinic.findById(clinicId).select("owner");
              if (clinic) {
                const clinicUsers = await User.find({
                  $or: [
                    { _id: clinic.owner }, // Clinic owner
                    { clinicId: clinicId, role: "doctor" }, // Doctors from this clinic
                  ],
                }).select("_id");
                const clinicUserIds = clinicUsers.map(u => u._id);
                
                // Include the current user (agent/doctorStaff) in the list so their own blogs show up
                clinicUserIds.push(me._id);
                
                blogQuery.$or = [
                  { postedBy: { $in: clinicUserIds } }, // Posted by clinic users (including current user)
                  { role: "admin" }, // Or admin blogs
                ];
              } else {
                blogQuery.$or = [
                  { postedBy: me._id },
                  { role: "admin" },
                ];
              }
            } else if (me.role === "doctor") {
              // For doctor, filter by role and postedBy
              blogQuery.role = me.role;
              blogQuery.$or = [
                { postedBy: me._id }, // User owns the blog
                { role: "admin" }, // Or user is admin
              ];
            } else if (me.role === "clinic") {
              // For clinic role, find blogs posted by the clinic owner (similar to job-postings pattern)
              const orConditions = [{ postedBy: me._id }];
              
              if (clinicId) {
                // Find clinic owner and all users from this clinic
                const clinic = await Clinic.findById(clinicId).select("owner");
                const clinicUserIds = [];
                
                // Add clinic owner (who posted the blogs)
                if (clinic && clinic.owner) {
                  clinicUserIds.push(clinic.owner);
                }
                
                // Add all users with this clinicId (agents, staff, doctors, etc.)
                const clinicUsers = await User.find({ 
                  clinicId: clinicId 
                }).select("_id");
                
                clinicUsers.forEach(u => {
                  if (!clinicUserIds.some(id => id.toString() === u._id.toString())) {
                    clinicUserIds.push(u._id);
                  }
                });
                
                if (clinicUserIds.length > 0) {
                  orConditions.push({ postedBy: { $in: clinicUserIds } });
                }
              }
              
              // Also include admin blogs
              orConditions.push({ role: "admin" });
              
              blogQuery.$or = orConditions;
            } else if (isAdmin) {
              // Admin can see any blog - no additional filters needed
              // blogQuery already has _id and status filters
            } else {
              // Fallback for other roles
              blogQuery.$or = [
                { postedBy: me._id }, // User owns the blog
                { role: "admin" }, // Or user is admin
              ];
            }

            const blog = await Blog.findOne(blogQuery).populate("postedBy", "name email");

            if (!blog) {
              return res.status(404).json({
                success: false,
                message: "Published blog not found or you lack permission",
              });
            }
            return res.status(200).json({ success: true, blog });
          }

          // Get published blogs for the authenticated user's role
          let blogQuery = {
            status: "published",
          };

          // For agent/doctorStaff, find blogs from their clinic
          if (isAgent || isDoctorStaff) {
            if (clinicId) {
            // Find clinic owner and all users from this clinic
            const clinic = await Clinic.findById(clinicId).select("owner");
            if (clinic) {
              const clinicUsers = await User.find({
                $or: [
                  { _id: clinic.owner }, // Clinic owner
                  { clinicId: clinicId, role: "doctor" }, // Doctors from this clinic
                ],
              }).select("_id");
              const clinicUserIds = clinicUsers.map(u => u._id);
              
              // Include the current user (agent/doctorStaff) in the list so their own blogs show up
              clinicUserIds.push(me._id);
              
              blogQuery.$or = [
                { postedBy: { $in: clinicUserIds } }, // Posted by clinic users (including current user)
                { role: "admin" }, // Or admin blogs
              ];
            } else {
              // Fallback if clinic not found
                blogQuery.$or = [
                  { postedBy: me._id },
                  { role: "admin" },
                ];
              }
            } else {
              // Agent/doctorStaff without clinicId - only show their own blogs
              blogQuery.$or = [
                { postedBy: me._id },
                { role: "admin" },
              ];
            }
          } else if (isAdmin) {
            // Admin can see all blogs
            blogQuery = { status: "published" };
          } else if (me.role === "doctor") {
            // For doctor, filter by role and postedBy
            blogQuery.role = me.role;
            blogQuery.$or = [
              { postedBy: me._id }, // User owns the blog
              { role: "admin" }, // Or user is admin
            ];
          } else if (me.role === "clinic") {
            // For clinic role, find blogs posted by the clinic owner and all clinic users (similar to job-postings pattern)
            // Always start with the user's own blogs (clinic owner)
            const orConditions = [{ postedBy: me._id }];
            
            if (clinicId) {
              // Find clinic owner and all users from this clinic
              const clinic = await Clinic.findById(clinicId).select("owner");
              
              const clinicUserIds = [];
              
              // Add clinic owner (who posted the blogs) - but only if different from current user
              // Note: For clinic role, clinic.owner should match me._id, but we check anyway
              if (clinic && clinic.owner) {
                const ownerId = clinic.owner.toString();
                const userId = me._id.toString();
                if (ownerId !== userId) {
                  clinicUserIds.push(clinic.owner);
                }
              }
              
              // Add all users with this clinicId (agents, staff, doctors, etc.)
              const clinicUsers = await User.find({ 
                clinicId: clinicId 
              }).select("_id");
              
              clinicUsers.forEach(u => {
                const userIdStr = u._id.toString();
                const currentUserIdStr = me._id.toString();
                // Don't add current user again (already in orConditions)
                if (userIdStr !== currentUserIdStr && !clinicUserIds.some(id => id.toString() === userIdStr)) {
                  clinicUserIds.push(u._id);
                }
              });
              
              if (clinicUserIds.length > 0) {
                orConditions.push({ postedBy: { $in: clinicUserIds } });
              }
            }
            
            // Also include admin blogs
            orConditions.push({ role: "admin" });
            
            blogQuery.$or = orConditions;
          } else {
            // Fallback for any other role
            blogQuery.$or = [
              { postedBy: me._id },
              { role: "admin" },
            ];
          }

          const publishedBlogs = await Blog.find(blogQuery)
            .populate("postedBy", "name email")
            .sort({ createdAt: -1 });

          res.status(200).json({ success: true, blogs: publishedBlogs });
        } catch (error) {
          // console.error("Error in GET published blogs:", error);
          res.status(500).json({ success: false, message: "Internal server error" });
        }
        break;

      case "POST":
        try {
          const me = await getUserFromReq(req);
          if (!me || !requireRole(me, ["clinic", "doctor", "doctorStaff", "agent", "admin"])) {
            return res.status(403).json({ success: false, message: "Access denied" });
          }

          const { clinicId, error, isAdmin } = await getClinicIdFromUser(me);
          const isDoctor = me.role === "doctor";
          const isDoctorStaff = me.role === "doctorStaff";
          const isAgent = me.role === "agent";
          if (error && !isAdmin && !isDoctor && !isDoctorStaff && !isAgent) {
            return res.status(404).json({ success: false, message: error });
          }

          // ✅ No permission checks - all authenticated users with clinic access can create blogs

          const { title, content, paramlink } = req.body;
          const { draftId } = req.query; // Check if publishing from a draft

          if (!title || !content) {
            return res.status(400).json({
              success: false,
              message:
                "Title and content are required for published blogs",
            });
          }

          // Generate paramlink from title if not provided
          let paramlinkToUse = paramlink?.trim() || slugify(title.trim());

          // If publishing from a draft, update the draft to published instead of creating new
          if (draftId) {
            // Find the existing draft
            const existingDraft = await Blog.findOne({ 
              _id: draftId, 
              status: "draft",
              postedBy: me._id 
            });

            if (!existingDraft) {
              return res.status(404).json({
                success: false,
                message: "Draft not found or you don't have permission to publish it",
              });
            }

            // Check if paramlink conflicts with other published blogs (excluding this draft)
            // If it exists, automatically generate sequential slug
            let finalParamlink = paramlinkToUse;
            const existingPublished = await Blog.findOne({
              paramlink: finalParamlink,
              status: "published",
              _id: { $ne: draftId },
            });
            
            if (existingPublished) {
              // Extract base slug from title (remove any existing number suffix)
              const baseSlug = slugify(title.trim());
              
              // Find all slugs matching pattern: baseSlug or baseSlug-{number}
              const regexPattern = new RegExp(`^${baseSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(-\\d+)?$`);
              
              const existingSlugs = await Blog.find({
                paramlink: { $regex: regexPattern },
                status: "published",
                _id: { $ne: draftId },
              }).select('paramlink');

              // Extract numbers from slugs (e.g., "abc-2" -> 2, "abc" -> 0)
              // Filter out suspiciously large numbers (like timestamps) - only consider numbers up to 1000
              const numbers = existingSlugs.map(blog => {
                const slug = blog.paramlink;
                if (slug === baseSlug) return 0; // Base slug counts as 0
                const match = slug.match(/-(\d+)$/);
                if (match) {
                  const num = parseInt(match[1], 10);
                  // Only consider sequential numbers (up to 1000 to avoid timestamps)
                  return num <= 1000 ? num : 0;
                }
                return 0;
              });

              // Find the highest number (excluding filtered out large numbers)
              const validNumbers = numbers.filter(n => n > 0);
              const maxNumber = validNumbers.length > 0 ? Math.max(...validNumbers) : 0;
              
              // Start from 2 if base exists, otherwise use next number
              const nextNumber = maxNumber === 0 ? 2 : maxNumber + 1;
              finalParamlink = `${baseSlug}-${nextNumber}`;
              
              // console.log(`🔄 Paramlink conflict detected. Generated sequential slug: ${finalParamlink}`);
            }

            // Update the draft to published status
            const updatedBlog = await Blog.findByIdAndUpdate(
              draftId,
              {
                title: title.trim(),
                content: content.trim(),
                paramlink: finalParamlink,
                status: "published",
                updatedAt: new Date(),
              },
              { new: true, runValidators: true }
            ).populate("postedBy", "name email");

            // Step 2: Generate and lock slug for published blog
            if (updatedBlog && !updatedBlog.slugLocked) {
              try {
                // console.log(`🔄 Generating slug for blog: ${updatedBlog.title} (ID: ${draftId})`);
                
                // Use central slug service to generate and lock slug
                const blogWithSlug = await generateAndLockSlug('blog', draftId.toString());
                
                if (blogWithSlug.paramlink && blogWithSlug.slugLocked) {
                  // console.log(`✅ Slug generated successfully: ${blogWithSlug.paramlink}`);
                  
                  // Step 3: Run SEO pipeline after slug generation
                  try {
                    // console.log(`🚀 Running SEO pipeline for blog: ${draftId}`);
                    const refreshedBlog = await Blog.findById(draftId);
                    const seoResult = await runSEOPipeline('blog', draftId.toString(), refreshedBlog);
                    if (seoResult.success) {
                      // console.log(`✅ SEO pipeline completed successfully`);
                      
                      // Step 4: Run SEO Health Check after pipeline
                      try {
                        // console.log(`\n🏥 [SEO Health Check] Running health check for blog: ${draftId}`);
                        const healthCheck = await checkSEOHealth('blog', draftId.toString());
                        
                        // console.log(`\n📊 [SEO Health Check] Results:`);
                        // console.log(`   Overall Health: ${healthCheck.overallHealth.toUpperCase()}`);
                        // console.log(`   Health Score: ${healthCheck.score}/100`);
                        // console.log(`   Total Issues: ${healthCheck.issues.length}`);
                        
                        if (healthCheck.issues.length > 0) {
                          console.log(`\n   🚨 Issues Found:`);
                          healthCheck.issues.forEach((issue, index) => {
                            // console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
                            // console.log(`      Message: ${issue.message}`);
                            if (issue.field) console.log(`      Field: ${issue.field}`);
                            if (issue.expected) console.log(`      Expected: ${issue.expected}`);
                            if (issue.actual) console.log(`      Actual: ${issue.actual}`);
                            if (issue.fix) console.log(`      Fix: ${issue.fix}`);
                          });
                        }
                        
                        if (healthCheck.recommendations.length > 0) {
                          // console.log(`\n   💡 Recommendations:`);
                          healthCheck.recommendations.forEach((rec, index) => {
                            // console.log(`   ${index + 1}. ${rec}`);
                          });
                        }
                        
                        // console.log(`\n`);
                        
                        // Store health check in SEO result
                        seoResult.healthCheck = healthCheck;
                      } catch (healthError) {
                        // console.error(`❌ SEO Health Check error (non-fatal):`, healthError.message);
                        // Non-fatal - continue with response
                      }
                    } else {
                      // console.warn(`⚠️ SEO pipeline completed with warnings:`, seoResult.errors);
                    }
                  } catch (seoError) {
                    // SEO errors are non-fatal - log but continue
                    // console.error("❌ SEO pipeline error (non-fatal):", seoError.message);
                  }
                } else {
                  // console.log(`⚠️ Slug generation completed but slugLocked is false`);
                }
              } catch (slugError) {
                // If slug generation fails but blog is published, continue
                // console.error("❌ Slug generation error (non-fatal):", slugError.message);
                // console.error("Error stack:", slugError.stack);
              }
            } else if (updatedBlog && updatedBlog.slugLocked) {
              // console.log(`⏭️ Skipping slug generation - slug already locked: ${updatedBlog.paramlink}`);
            }

            // Refresh blog data to get updated slug
            const finalBlog = await Blog.findById(draftId).populate("postedBy", "name email");

            return res.status(200).json({ success: true, blog: finalBlog });
          }

          // If not publishing from a draft, create a new published blog
          // If paramlink exists, automatically generate sequential slug
          let finalParamlink = paramlinkToUse;
          const existing = await Blog.findOne({ paramlink: finalParamlink, status: "published" });
          
          if (existing) {
            // Extract base slug from title (remove any existing number suffix)
            const baseSlug = slugify(title.trim());
            
            // Find all slugs matching pattern: baseSlug or baseSlug-{number}
            const regexPattern = new RegExp(`^${baseSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(-\\d+)?$`);
            
            const existingSlugs = await Blog.find({
              paramlink: { $regex: regexPattern },
              status: "published",
            }).select('paramlink');

            // Extract numbers from slugs (e.g., "abc-2" -> 2, "abc" -> 0)
            // Filter out suspiciously large numbers (like timestamps) - only consider numbers up to 1000
            const numbers = existingSlugs.map(blog => {
              const slug = blog.paramlink;
              if (slug === baseSlug) return 0; // Base slug counts as 0
              const match = slug.match(/-(\d+)$/);
              if (match) {
                const num = parseInt(match[1], 10);
                // Only consider sequential numbers (up to 1000 to avoid timestamps)
                return num <= 1000 ? num : 0;
              }
              return 0;
            });

            // Find the highest number (excluding filtered out large numbers)
            const validNumbers = numbers.filter(n => n > 0);
            const maxNumber = validNumbers.length > 0 ? Math.max(...validNumbers) : 0;
            
            // Start from 2 if base exists, otherwise use next number
            const nextNumber = maxNumber === 0 ? 2 : maxNumber + 1;
            finalParamlink = `${baseSlug}-${nextNumber}`;
            
            // console.log(`🔄 Paramlink conflict detected. Generated sequential slug: ${finalParamlink}`);
          }

          // Determine the role to use for the blog
          // Blog model only accepts "clinic" or "doctor", so use "clinic" for agent/doctorStaff
          let blogRole = me.role;
          if (me.role === "agent" || me.role === "doctorStaff") {
            blogRole = "clinic"; // Agent/doctorStaff blogs are associated with clinic
          }

          const publishedBlog = await Blog.create({
            title: title || "Untitled Blog",
            content: content || "",
            paramlink: finalParamlink,
            status: "published",
            postedBy: me._id,
            role: blogRole,
          });

          // Step 2: Generate and lock slug for published blog
          if (publishedBlog && !publishedBlog.slugLocked) {
            try {
              // console.log(`🔄 Generating slug for blog: ${publishedBlog.title} (ID: ${publishedBlog._id})`);
              
              // Use central slug service to generate and lock slug
              const blogWithSlug = await generateAndLockSlug('blog', publishedBlog._id.toString());
              
              if (blogWithSlug.paramlink && blogWithSlug.slugLocked) {
                // console.log(`✅ Slug generated successfully: ${blogWithSlug.paramlink}`);
                
                // Step 3: Run SEO pipeline after slug generation
                try {
                  // console.log(`🚀 Running SEO pipeline for blog: ${publishedBlog._id}`);
                  const refreshedBlog = await Blog.findById(publishedBlog._id);
                  const seoResult = await runSEOPipeline('blog', publishedBlog._id.toString(), refreshedBlog);
                  if (seoResult.success) {
                    // console.log(`✅ SEO pipeline completed successfully`);
                    
                    // Step 4: Run SEO Health Check after pipeline
                    try {
                      // console.log(`\n🏥 [SEO Health Check] Running health check for blog: ${publishedBlog._id}`);
                      const healthCheck = await checkSEOHealth('blog', publishedBlog._id.toString());
                      
                      // console.log(`\n📊 [SEO Health Check] Results:`);
                      // console.log(`   Overall Health: ${healthCheck.overallHealth.toUpperCase()}`);
                      // console.log(`   Health Score: ${healthCheck.score}/100`);
                      // console.log(`   Total Issues: ${healthCheck.issues.length}`);
                      
                      if (healthCheck.issues.length > 0) {
                        // console.log(`\n   🚨 Issues Found:`);
                        healthCheck.issues.forEach((issue, index) => {
                          // console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
                          // console.log(`      Message: ${issue.message}`);
                          if (issue.field) console.log(`      Field: ${issue.field}`);
                          if (issue.expected) console.log(`      Expected: ${issue.expected}`);
                          if (issue.actual) console.log(`      Actual: ${issue.actual}`);
                          if (issue.fix) console.log(`      Fix: ${issue.fix}`);
                        });
                      }
                      
                      if (healthCheck.recommendations.length > 0) {
                        // console.log(`\n   💡 Recommendations:`);
                        healthCheck.recommendations.forEach((rec, index) => {
                          // console.log(`   ${index + 1}. ${rec}`);
                        });
                      }
                      
                      // console.log(`\n`);
                      
                      // Store health check in SEO result
                      seoResult.healthCheck = healthCheck;
                    } catch (healthError) {
                      // console.error(`❌ SEO Health Check error (non-fatal):`, healthError.message);
                      // Non-fatal - continue with response
                    }
                  } else {
                    // console.warn(`⚠️ SEO pipeline completed with warnings:`, seoResult.errors);
                  }
                } catch (seoError) {
                  // SEO errors are non-fatal - log but continue
                  // console.error("❌ SEO pipeline error (non-fatal):", seoError.message);
                }
              } else {
                // console.log(`⚠️ Slug generation completed but slugLocked is false`);
              }
            } catch (slugError) {
              // If slug generation fails but blog is published, continue
              // console.error("❌ Slug generation error (non-fatal):", slugError.message);
              // console.error("Error stack:", slugError.stack);
            }
          }

          // Populate the postedBy field to return user info
          const populatedBlog = await Blog.findById(publishedBlog._id).populate(
            "postedBy",
            "name email"
          );

          res.status(201).json({ success: true, blog: populatedBlog });
        } catch (error) {
          // console.error("Error in POST published blog:", error);
          res.status(500).json({ success: false, message: "Internal server error" });
        }
        break;

      case "PUT":
        try {
          const me = await getUserFromReq(req);
          if (!me || !requireRole(me, ["clinic", "doctor", "doctorStaff", "agent", "admin"])) {
            return res.status(403).json({ success: false, message: "Access denied" });
          }

          const { id } = req.query;
          const { title, content, paramlink } = req.body;

          if (!id) {
            return res
              .status(400)
              .json({ success: false, message: "Blog ID required" });
          }

          // Find the existing blog
          const existingBlog = await Blog.findById(id);
          if (!existingBlog) {
            return res
              .status(404)
              .json({ success: false, message: "Published blog not found" });
          }

          const { clinicId, error, isAdmin } = await getClinicIdFromUser(me);
          const isDoctor = me.role === "doctor";
          const isDoctorStaff = me.role === "doctorStaff";
          const isAgent = me.role === "agent";
          if (error && !isAdmin && !isDoctor && !isDoctorStaff && !isAgent) {
            return res.status(404).json({ success: false, message: error });
          }

          // Check if user owns the blog, is from the same clinic (for agent/doctorStaff), or is admin
          const isBlogAuthor = existingBlog.postedBy.toString() === me._id.toString();
          
          // For agent/doctorStaff, check if blog is from their clinic
          let isClinicBlog = false;
          if ((isAgent || isDoctorStaff) && clinicId && !isBlogAuthor) {
            const clinic = await Clinic.findById(clinicId).select("owner");
            if (clinic) {
              const clinicUsers = await User.find({
                $or: [
                  { _id: clinic.owner },
                  { clinicId: clinicId, role: "doctor" },
                ],
              }).select("_id");
              const clinicUserIds = clinicUsers.map(u => u._id.toString());
              isClinicBlog = clinicUserIds.includes(existingBlog.postedBy.toString());
            }
          }

          // Only allow if user owns the blog, is from the same clinic (with permission), or is admin
          if (!isBlogAuthor && !isClinicBlog && !isAdmin) {
            return res.status(403).json({
              success: false,
              message: "You can only edit blogs from your clinic unless you are an admin",
            });
          }

          // ✅ No permission checks - all authenticated users with clinic access can update blogs

          // If paramlink is being updated, automatically generate sequential slug if it conflicts
          let finalParamlink = paramlink;
          if (paramlink) {
            const existing = await Blog.findOne({
              paramlink: paramlink.trim(),
              status: "published",
              _id: { $ne: id },
            });
            
            if (existing) {
              // Extract base slug from title (remove any existing number suffix)
              const baseSlug = slugify(title.trim());
              
              // Find all slugs matching pattern: baseSlug or baseSlug-{number}
              const regexPattern = new RegExp(`^${baseSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(-\\d+)?$`);
              
              const existingSlugs = await Blog.find({
                paramlink: { $regex: regexPattern },
                status: "published",
                _id: { $ne: id },
              }).select('paramlink');

              // Extract numbers from slugs (e.g., "abc-2" -> 2, "abc" -> 0)
              // Filter out suspiciously large numbers (like timestamps) - only consider numbers up to 1000
              const numbers = existingSlugs.map(blog => {
                const slug = blog.paramlink;
                if (slug === baseSlug) return 0; // Base slug counts as 0
                const match = slug.match(/-(\d+)$/);
                if (match) {
                  const num = parseInt(match[1], 10);
                  // Only consider sequential numbers (up to 1000 to avoid timestamps)
                  return num <= 1000 ? num : 0;
                }
                return 0;
              });

              // Find the highest number (excluding filtered out large numbers)
              const validNumbers = numbers.filter(n => n > 0);
              const maxNumber = validNumbers.length > 0 ? Math.max(...validNumbers) : 0;
              
              // Start from 2 if base exists, otherwise use next number
              const nextNumber = maxNumber === 0 ? 2 : maxNumber + 1;
              finalParamlink = `${baseSlug}-${nextNumber}`;
              
              // console.log(`🔄 Paramlink conflict detected. Generated sequential slug: ${finalParamlink}`);
            } else {
              finalParamlink = paramlink.trim();
            }
          }

          const updatedBlog = await Blog.findByIdAndUpdate(
            id,
            {
              title,
              content,
              paramlink: finalParamlink,
              status: "published",
              updatedAt: new Date(),
            },
            { new: true, runValidators: true }
          ).populate("postedBy", "name email");

          res.status(200).json({ success: true, blog: updatedBlog });
        } catch (error) {
          // console.error("Error in PUT published blog:", error);
          res.status(500).json({ success: false, message: "Internal server error" });
        }
        break;

      case "DELETE":
        try {
          const me = await getUserFromReq(req);
          if (!me || !requireRole(me, ["clinic", "doctor", "doctorStaff", "agent", "admin"])) {
            return res.status(403).json({ success: false, message: "Access denied" });
          }

          const { id } = req.query;

          if (!id) {
            return res
              .status(400)
              .json({ success: false, message: "Blog ID required" });
          }

          // Find the existing blog - must be published status
          const existingBlog = await Blog.findOne({ _id: id, status: "published" });
          if (!existingBlog) {
            return res
              .status(404)
              .json({ success: false, message: "Published blog not found" });
          }

          const { clinicId, error, isAdmin } = await getClinicIdFromUser(me);
          const isDoctor = me.role === "doctor";
          const isDoctorStaff = me.role === "doctorStaff";
          const isAgent = me.role === "agent";
          // Only return 404 if it's a critical "not found" error
          if (error && !isAdmin && !isDoctor && !isDoctorStaff && !isAgent && error.includes('not found')) {
            return res.status(404).json({ success: false, message: error });
          }

          // Check if user owns the blog, is from the same clinic (for agent/doctorStaff), or is admin
          const isBlogAuthor = existingBlog.postedBy.toString() === me._id.toString();
          
          // For agent/doctorStaff, check if blog is from their clinic
          let isClinicBlog = false;
          if ((isAgent || isDoctorStaff) && clinicId && !isBlogAuthor) {
            const clinic = await Clinic.findById(clinicId).select("owner");
            if (clinic) {
              const clinicUsers = await User.find({
                $or: [
                  { _id: clinic.owner },
                  { clinicId: clinicId, role: "doctor" },
                ],
              }).select("_id");
              const clinicUserIds = clinicUsers.map(u => u._id.toString());
              isClinicBlog = clinicUserIds.includes(existingBlog.postedBy.toString());
            }
          }

          // Only allow if user owns the blog, is from the same clinic (with permission), or is admin
          if (!isBlogAuthor && !isClinicBlog && !isAdmin) {
            return res.status(403).json({
              success: false,
              message: "Not allowed to access this blog",
            });
          }

          // ✅ No permission checks - all authenticated users with clinic access can delete blogs

          // Clear comments and likes before deleting
          existingBlog.comments = [];
          existingBlog.likes = [];
          await existingBlog.save();

          // Now delete the blog itself
          await Blog.findByIdAndDelete(id);

          res.status(200).json({
            success: true,
            message:
              "Published blog and all related comments & likes deleted successfully",
          });
        } catch (error) {
          // console.error("Error in DELETE published blog:", error);
          res.status(500).json({ success: false, message: "Internal server error" });
        }
        break;

      default:
        res.status(405).json({ success: false, message: "Method not allowed" });
    }
  } catch (error) {
    // console.error("Error in published blog API:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
