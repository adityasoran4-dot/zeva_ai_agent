// pages/api/job-postings/update.js
import dbConnect from '../../../lib/database';
import JobPosting from '../../../models/JobPosting';
import Clinic from '../../../models/Clinic';
import { getUserFromReq, requireRole } from '../lead-ms/auth';
import { getClinicIdFromUser } from '../lead-ms/permissions-helper';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await dbConnect();

  try {
    const me = await getUserFromReq(req);
    if (!me || !requireRole(me, ["clinic", "admin", "doctor", "agent", "doctorStaff"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { jobId } = req.query;
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
    } else if (me.role === "agent" || me.role === "doctorStaff" || me.role === "doctor") {
      // Fetch fresh user data to ensure we have the latest clinicId
      const freshUser = await User.findById(me._id).select('clinicId');
      if (!freshUser || !freshUser.clinicId) {
        return res.status(403).json({ 
          success: false, 
          message: `${me.role === "doctor" ? "Doctor" : me.role === "agent" ? "Agent" : "Doctor staff"} not linked to a clinic` 
        });
      }
      clinicId = freshUser.clinicId;
    }

    // ✅ Verify job access: Allow if user is admin, posted the job, or job belongs to their clinic
    if (me.role !== "admin") {
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

    // ✅ Check permission for updating jobs (only for doctorStaff and agent, clinic/admin/doctor bypass)
    if (!["admin", "clinic", "doctor"].includes(me.role) && clinicId) {
      if (['agent', 'doctorStaff'].includes(me.role)) {
        const { checkAgentPermission } = await import("../agent/permissions-helper");
        const { hasPermission, error: permissionError } = await checkAgentPermission(
          me._id,
          "job_posting", // moduleKey
          "update", // action
          null // subModuleName
        );
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permissionError || "You do not have permission to update jobs"
          });
        }
      }
      // Clinic, admin, and doctor users bypass permission checks
    }

    // Update the job
    const updatedJob = await JobPosting.findByIdAndUpdate(
      jobId,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.status(200).json({ success: true, job: updatedJob });
  } catch (error) {
    // console.error("Error updating job:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

