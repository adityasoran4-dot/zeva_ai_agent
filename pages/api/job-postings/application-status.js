import dbConnect from "../../../lib/database";
import JobApplication from "../../../models/JobApplication";
import JobPosting from "../../../models/JobPosting";
import Clinic from "../../../models/Clinic";
import { emitNotificationToUser } from "../push-notification/socketio";
import Notification from "../../../models/Notification";
import { getUserFromReq, requireRole } from '../lead-ms/auth';

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await dbConnect();

  try {
    const me = await getUserFromReq(req);
    if (!me || !requireRole(me, ["clinic", "admin", "doctor", "agent", "doctorStaff"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { applicationId, status } = req.body;
    if (!applicationId || !status) {
      return res.status(400).json({ success: false, message: "Application ID and status are required" });
    }

    // ✅ First, get the application to find the job
    const application = await JobApplication.findById(applicationId).populate("jobId");
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    // ✅ Verify the job belongs to this user
    const job = await JobPosting.findById(application.jobId._id || application.jobId);
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
          return res.status(403).json({ success: false, message: "Not allowed to access this application" });
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
          return res.status(403).json({ success: false, message: "Not allowed to access this application" });
        }
      }
    }

    // ✅ Check permission for updating application status (only for doctorStaff and agent, clinic/admin/doctor bypass)
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
            message: permissionError || "You do not have permission to update application status"
          });
        }
      }
      // Clinic, admin, and doctor users bypass permission checks
    }

    try {
    const updatedApplication = await JobApplication.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true }
    )
      .populate("applicantId")
      .populate("jobId");

    if (!updatedApplication) {
      return res.status(404).json({ message: "Application not found" });
    }

    const applicantUserId = updatedApplication.applicantId._id;
    const jobTitle = updatedApplication.jobId?.jobTitle || "Job Posting";

    // console.log("Populated JobId:", jobTitle );


    // ✅ Create notification in DB
    const notification = await Notification.create({
      user: applicantUserId,
      message: `Your application for "${jobTitle}" has been updated to "${status}"`,
      type: "job-status",
      relatedJobApplication: updatedApplication._id,
      relatedJob: updatedApplication.jobId._id,
    });

    // ✅ Emit socket events
    emitNotificationToUser(applicantUserId.toString(), {
      _id: notification._id,
      message: notification.message,
      createdAt: notification.createdAt,
      isRead: false,
    });

    emitNotificationToUser(applicantUserId.toString(), {
      type: "applicationStatusChanged",
      message: notification.message,
      applicationId: updatedApplication._id,
      newStatus: status,
    });

      // ✅ Return full response (not just message)
      return res.status(200).json({
        success: true,
        message: "Status updated & notification sent",
        application: updatedApplication,
        notification,
      });
    } catch (error) {
      // console.error("Status update error:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  } catch (error) {
    // console.error("Error in application-status API:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
