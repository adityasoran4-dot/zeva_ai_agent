// pages/api/job-postings/create.js
import dbConnect from '../../../lib/database';
import JobPosting from '../../../models/JobPosting';
import Clinic from '../../../models/Clinic';
import { getUserFromReq, requireRole } from '../lead-ms/auth';
import { getClinicIdFromUser, checkClinicPermission } from '../lead-ms/permissions-helper';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await dbConnect();

  try {
    const me = await getUserFromReq(req);
    if (!me || !requireRole(me, ["clinic", "admin", "doctor", "agent", "doctorStaff"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { clinicId, error, isAdmin } = await getClinicIdFromUser(me);
    let resolvedClinicId = clinicId;

    if (error && !isAdmin) {
      return res.status(404).json({ success: false, message: error });
    }

    if (isAdmin && req.body.clinicId) {
      const clinic = await Clinic.findById(req.body.clinicId).select("_id");
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
      resolvedClinicId = clinic._id;
    }

    if (!isAdmin && !resolvedClinicId) {
      return res.status(400).json({ success: false, message: "Clinic not found for this user" });
    }

    // ✅ Check permission for creating jobs (only for doctorStaff and agent, clinic/admin/doctor bypass)
    if (!["admin", "clinic", "doctor"].includes(me.role) && resolvedClinicId) {
      if (['agent', 'doctorStaff'].includes(me.role)) {
        const { checkAgentPermission } = await import("../agent/permissions-helper");
        const { hasPermission, error: permissionError } = await checkAgentPermission(
          me._id,
          "job_posting", // moduleKey
          "create", // action
          null // subModuleName
        );
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permissionError || "You do not have permission to create jobs"
          });
        }
      }
      // Clinic, admin, and doctor users bypass permission checks
    }

    // Generate slug preview (not locked yet, will be locked on approval)
    let slugPreview = null;
    let slugPreviewUrl = null;
    let slugUserMessage = null;
    
    try {
      const { slugify, generateUniqueSlug } = await import('../../../lib/utils');
      
      // Extract city from location
      let cityName = '';
      if (req.body.location) {
        const locationParts = req.body.location.split(',').map(part => part.trim());
        cityName = locationParts[0] || '';
      }

      // Generate base slug from job title
      const baseSlugFromTitle = slugify(req.body.jobTitle);
      let baseSlug = baseSlugFromTitle;
      if (cityName) {
        const citySlug = slugify(cityName);
        baseSlug = `${baseSlugFromTitle}-${citySlug}`;
      }

      if (baseSlug) {
        // Check if slug exists (checking locked slugs only)
        const checkExists = async (slugToCheck) => {
          const existing = await JobPosting.findOne({
            slug: slugToCheck,
            slugLocked: true,
            status: 'approved',
          });
          return !!existing;
        };

        // Generate unique slug
        const finalSlug = await generateUniqueSlug(baseSlug, checkExists);
        slugPreview = finalSlug;
        
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://zeva360.com';
        slugPreviewUrl = `${baseUrl}/job-details/${finalSlug}`;
        
        // User-friendly message
        const collisionResolved = finalSlug !== baseSlug;
        if (collisionResolved && cityName) {
          slugUserMessage = `Good news! Another job already uses this title, so we added your city (${cityName}) to create a unique page for you.`;
        } else if (collisionResolved) {
          slugUserMessage = 'Good news! Another job already uses this title, so we added a number to create a unique page for you.';
        } else {
          slugUserMessage = 'Your job posting page is ready! We created a unique URL based on your job title' + 
            (cityName ? ` and city (${cityName})` : '') + 
            ' to help candidates find you easily.';
        }
      }
    } catch (slugError) {
      // console.error('❌ Slug preview generation error (non-fatal):', slugError.message);
      // Continue with job creation even if slug preview fails
    }

    const newJob = await JobPosting.create({
      ...req.body,
      postedBy: me._id,
      clinicId: resolvedClinicId || undefined,
      role: me.role,
      status: 'pending',
    });

    res.status(201).json({ 
      success: true, 
      job: newJob,
      slug_preview: slugPreview ? {
        slug: slugPreview,
        url: slugPreviewUrl,
        user_message: slugUserMessage,
      } : null,
    });
  } catch (error) {
    // console.error("Error creating job:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
