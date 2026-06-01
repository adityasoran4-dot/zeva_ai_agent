// pages/api/job-postings/my-jobs.js
import dbConnect from '../../../lib/database';
import JobPosting from '../../../models/JobPosting';
import User from '../../../models/Users';
import Clinic from '../../../models/Clinic';
import { getUserFromReq, requireRole } from '../lead-ms/auth';
import { getClinicIdFromUser, checkClinicPermission } from '../lead-ms/permissions-helper';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // ✅ Check permission for reading jobs (only for doctorStaff and agent, clinic/admin/doctor bypass)
    if (!["admin", "clinic", "doctor"].includes(me.role) && clinicId) {
      if (['agent', 'doctorStaff'].includes(me.role)) {
        const { checkAgentPermission } = await import("../agent/permissions-helper");

        // Support multiple possible module keys for backward compatibility
        const moduleKeysToTry = [
          "job_posting",
          "clinic_job_posting",
          "clinic_jobs",
          "jobs",
        ];

        let hasPermission = false;
        let permissionError = null;

        for (const moduleKey of moduleKeysToTry) {
          const result = await checkAgentPermission(
            me._id,
            moduleKey,
            "read",
            null
          );
          if (result.hasPermission) {
            hasPermission = true;
            permissionError = null;
            break;
          }
          // Keep last error for context if all fail
          permissionError = result.error;
        }

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permissionError || "You do not have permission to view jobs",
          });
        }
      }
      // Clinic, admin, and doctor users bypass permission checks
    }

    let match = {};
    if (!isAdmin) {
      if (me.role === "doctor") {
        // For doctors, match by doctorId or postedBy (for backward compatibility)
        match = {
          $or: [
            { doctorId: me._id },
            { postedBy: me._id, role: "doctor" }
          ]
        };
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
        
        match = { $or: orConditions };
      }
    }

    const jobs = await JobPosting.find(match).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, jobs });
  } catch (error) {
    // console.error("Error fetching jobs:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}