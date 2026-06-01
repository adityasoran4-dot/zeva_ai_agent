import dbConnect from "../../../lib/database";
import JobPosting from "../../../models/JobPosting";
import JobApplication from "../../../models/JobApplication";
import Notification from "../../../models/Notification";
import Clinic from "../../../models/Clinic";
import mongoose from "mongoose";
import { getUserFromReq, requireRole } from '../lead-ms/auth';

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
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

    // ✅ Check permission for deleting jobs (only for doctorStaff and agent, clinic/admin/doctor bypass)
    if (!["admin", "clinic", "doctor"].includes(me.role) && clinicId) {
      if (['agent', 'doctorStaff'].includes(me.role)) {
        const { checkAgentPermission } = await import("../agent/permissions-helper");
        const { hasPermission, error: permissionError } = await checkAgentPermission(
          me._id,
          "job_posting", // moduleKey
          "delete", // action
          null // subModuleName
        );
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permissionError || "You do not have permission to delete jobs"
          });
        }
      }
      // Clinic, admin, and doctor users bypass permission checks
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find and verify job ownership again within transaction
      const jobToDelete = await JobPosting.findOne({ _id: jobId, postedBy: me._id }).session(session);
      if (!jobToDelete) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: "Job not found or not authorized" });
      }

    // Get all job applications for this job
    const jobApplications = await JobApplication.find({ jobId }).session(session);
    const jobApplicationIds = jobApplications.map(app => app._id);

    // console.log("📌 Found applications:", jobApplications.length);
    // console.log("📌 Application IDs:", jobApplicationIds);

    // Delete ONLY notifications linked to these applications
    const notificationResult = await Notification.deleteMany({
      relatedJobApplication: { $in: jobApplicationIds }
    }).session(session);

    // console.log("🗑 Notifications deleted:", notificationResult.deletedCount);

    // Delete job applications
    const applicationResult = await JobApplication.deleteMany({ jobId }).session(session);
    // console.log("🗑 Applications deleted:", applicationResult.deletedCount);

    // Delete job posting
    const jobResult = await JobPosting.deleteOne({ _id: jobId }).session(session);
    // console.log("🗑 Job deleted:", jobResult.deletedCount);

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: "Job, applications, and related notifications deleted successfully",
        deletedCounts: {
          notifications: notificationResult.deletedCount,
          applications: applicationResult.deletedCount,
          jobs: jobResult.deletedCount
        }
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      // console.error("❌ Delete error:", error);

      if (error.code === 112) {
        return res.status(500).json({ success: false, message: "Write conflict. Please try again." });
      }

      return res.status(500).json({ success: false, message: "Server error" });
    }
  } catch (error) {
    // console.error("Error in delete job API:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
