// pages/api/job-postings/job-applications.js
import dbConnect from "../../../lib/database";
import JobApplication from "../../../models/JobApplication";
import JobPosting from "../../../models/JobPosting";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import { getUserFromReq, requireRole } from '../lead-ms/auth';
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await dbConnect();

  try {
    const me = await getUserFromReq(req);
    if (!me || !requireRole(me, ["clinic", "admin", "doctor", "staff", "agent", "doctorStaff"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // ✅ For doctors, handle independently (don't require clinicId)
    let clinicId = null;
    let isAdmin = me.role === "admin";
    
    if (me.role === "doctor") {
      // Doctors can operate independently without clinicId
      // Skip clinicId check for doctors
    } else {
      const result = await getClinicIdFromUser(me);
      clinicId = result.clinicId;
      isAdmin = result.isAdmin || isAdmin;
      
      if (result.error && !isAdmin) {
        return res.status(404).json({ success: false, message: result.error });
      }
    }

    // ✅ Check permission for reading job applications (only for doctorStaff and agent, clinic/admin/doctor bypass)
    if (!["admin", "clinic", "doctor"].includes(me.role) && clinicId) {
      if (['agent', 'doctorStaff'].includes(me.role)) {
        const { checkAgentPermission } = await import("../agent/permissions-helper");
        const { hasPermission, error: permissionError } = await checkAgentPermission(
          me._id,
          "job_posting", // moduleKey
          "read", // action
          null // subModuleName
        );
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permissionError || "You do not have permission to view job applicants"
          });
        }
      }
      // Clinic, admin, and doctor users bypass permission checks
    }

    // Get jobs posted by this user or any user from the same clinic
    const jobQuery = {};
    if (!isAdmin) {
      if (me.role === "doctor") {
        // For doctors, match by doctorId or postedBy (for backward compatibility)
        jobQuery.$or = [
          { doctorId: me._id },
          { postedBy: me._id, role: "doctor" }
        ];
      } else {
        const orConditions = [{ postedBy: me._id }];
        
        if (clinicId) {
          // Add clinicId match
          orConditions.push({ clinicId });
          
          // Find all users from the same clinic (including clinic owner)
          // This handles cases where clinicId might not be set on the job
          const clinic = await Clinic.findById(clinicId).select('owner');
          const clinicUserIds = [];
          
          // Add clinic owner (who posted the jobs)
          if (clinic && clinic.owner) {
            clinicUserIds.push(clinic.owner);
          }
          
          // Add all users with this clinicId (agents, staff, doctors, etc.)
          const clinicUsers = await User.find({ 
            clinicId: clinicId 
          }).select('_id');
          
          clinicUsers.forEach(u => {
            if (!clinicUserIds.some(id => id.toString() === u._id.toString())) {
              clinicUserIds.push(u._id);
            }
          });
          
          if (clinicUserIds.length > 0) {
            orConditions.push({ postedBy: { $in: clinicUserIds } });
          }
        }
        
        jobQuery.$or = orConditions;
      }
    }
    const postedJobs = await JobPosting.find(jobQuery).select("_id");
    const jobIds = postedJobs.map((job) => job._id);

    // Fetch applications
    const applications = await JobApplication.find({ jobId: { $in: jobIds } })
      .populate("jobId", "jobTitle location jobType")
      .populate("applicantId", "name email phone role")
      .select("jobId applicantId resume status createdAt updatedAt");

    // Correct resume URL handling
    const formattedApps = applications.map((app) => {
      let resumeUrl = null;
      if (app.resume) {
        resumeUrl = app.resume.startsWith("http")
          ? app.resume
          : `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}${app.resume}`;
      }
      return {
        ...app.toObject(),
        resumeUrl,
      };
    });

    res.status(200).json({ success: true, applications: formattedApps });
  } catch (error) {
    // console.error("Error fetching applications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
