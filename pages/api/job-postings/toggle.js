// pages/api/job-postings/toggle.js
import dbConnect from '../../../lib/database';
import JobPosting from '../../../models/JobPosting';
import Clinic from '../../../models/Clinic';
import { getUserFromReq, requireRole } from '../lead-ms/auth';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await dbConnect();

  try {
    const me = await getUserFromReq(req);
    if (!me || !requireRole(me, ["clinic", "admin", "doctor", "agent", "doctorStaff"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { jobId, isActive } = req.body;
    if (!jobId) {
      return res.status(400).json({ success: false, message: "Job ID is required" });
    }

    // ✅ First, get the job to determine which clinic it belongs to
    const job = await JobPosting.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // ✅ Resolve clinicId first - fetch fresh from database to ensure we have the latest clinicId
    let clinicId;
    const User = (await import('../../../models/Users')).default;
    
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id }).select("_id");
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found for this user" });
      }
      clinicId = clinic._id;
    } else if (me.role === "agent" || me.role === "doctorStaff") {
      // Fetch fresh user data to ensure we have the latest clinicId
      const freshUser = await User.findById(me._id).select('clinicId');
      if (!freshUser || !freshUser.clinicId) {
        return res.status(403).json({ 
          success: false, 
          message: `${me.role === "agent" ? "Agent" : "Doctor staff"} not linked to a clinic` 
        });
      }
      clinicId = freshUser.clinicId;
    } else if (me.role === "doctor") {
      // Doctors can operate independently without clinicId
      // Skip clinicId check for doctors
    }

    // ✅ Verify job access: Allow if user is admin, posted the job, job belongs to their clinic, or (for doctors) doctorId matches
    if (me.role !== "admin") {
      if (me.role === "doctor") {
        // For doctors, check if they own the job via doctorId or postedBy
        const isJobOwner = job.postedBy.toString() === me._id.toString() || 
                          (job.doctorId && job.doctorId.toString() === me._id.toString());
        if (!isJobOwner) {
          return res.status(403).json({ success: false, message: "Not allowed to access this job" });
        }
      } else {
        const isJobOwner = job.postedBy.toString() === me._id.toString();
        
        // Get the job's clinicId (from job.clinicId or from job poster's clinicId)
        let jobClinicId = null;
        if (job.clinicId) {
          jobClinicId = job.clinicId;
        } else {
          // If job.clinicId is not set, get it from the job poster
          const jobPoster = await User.findById(job.postedBy).select('clinicId role');
          if (jobPoster) {
            if (jobPoster.clinicId) {
              jobClinicId = jobPoster.clinicId;
            } else if (jobPoster.role === "clinic") {
              // If job poster is clinic role, find their clinic
              const posterClinic = await Clinic.findOne({ owner: jobPoster._id }).select("_id");
              if (posterClinic) {
                jobClinicId = posterClinic._id;
              }
            }
          }
        }
      
        
        // Verify clinic membership - ensure both clinicIds are compared as strings
        let hasAccess = false;
        if (isJobOwner) {
          hasAccess = true;
        } else if (clinicId && jobClinicId) {
          // Check if job's clinicId matches user's clinicId (compare as strings)
          const userClinicIdStr = clinicId.toString();
          const jobClinicIdStr = jobClinicId.toString();
          hasAccess = userClinicIdStr === jobClinicIdStr;
        }
        
        if (!hasAccess) {
          return res.status(403).json({ success: false, message: "Not allowed to access this job" });
        }
      }
    }

    // ✅ Check permission for toggling jobs (only for doctorStaff and agent, clinic/admin/doctor bypass)
    if (!["admin", "clinic", "doctor"].includes(me.role) && clinicId) {
      if (['agent', 'doctorStaff'].includes(me.role)) {
        const { checkAgentPermission } = await import("../agent/permissions-helper");
        const { hasPermission, error: permissionError } = await checkAgentPermission(
          me._id,
          "job_posting",
          "update",
          null
        );
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permissionError || "You do not have permission to toggle job status"
          });
        }
      }
    }

    // Update job status
    job.isActive = isActive;
    await job.save();

    return res.status(200).json({ 
      success: true, 
      message: `Job ${isActive ? 'activated' : 'deactivated'} successfully`,
      job 
    });
  } catch (error) {
    // console.error('[Toggle Job] Error:', error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
