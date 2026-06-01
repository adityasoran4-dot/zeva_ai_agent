import dbConnect from "../../../lib/database";
import PatientRegistration from "../../../models/PatientRegistration";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";

export default async function handler(req, res) {
  await dbConnect();

  // ---------------- GET: fetch patients ----------------
  if (req.method === "GET") {
    try {
      const user = await getAuthorizedStaffUser(req, {
        allowedRoles: ["staff", "doctorStaff", "doctor", "clinic", "agent", "admin"],
      });

      const { emrNumber, invoiceNumber, name, phone, claimStatus, applicationStatus } = req.query;

      // Build query based on user role - CRITICAL: userId filter must be applied first
      let query = {};
      
      // For clinic role: show all patients belonging to the clinic (clinic owner + all agents/doctorStaff linked to clinic)
      if (user.role === 'clinic') {
        const Clinic = (await import("../../../models/Clinic")).default;
        const clinic = await Clinic.findOne({ owner: user._id });
        if (clinic) {
          // Find all users belonging to this clinic (clinic owner + agents + doctorStaff)
          const User = (await import("../../../models/Users")).default;
          const clinicUsers = await User.find({
            $or: [
              { _id: user._id }, // Clinic owner
              { clinicId: clinic._id } // Agents and doctorStaff linked to clinic
            ]
          }).select("_id");
          
          const clinicUserIds = clinicUsers.map(u => u._id);
          query.userId = { $in: clinicUserIds };
        } else {
          // Fallback: only show clinic owner's patients
          query.userId = user._id;
        }
      } 
      // For agent/doctorStaff: show all patients belonging to the clinic
      else if (user.role === 'agent' || user.role === 'doctorStaff') {
        if (user.clinicId) {
          const Clinic = (await import("../../../models/Clinic")).default;
          const clinic = await Clinic.findById(user.clinicId);
          if (clinic) {
            const User = (await import("../../../models/Users")).default;
            const clinicUsers = await User.find({
              $or: [
                { _id: clinic.owner }, // Clinic owner
                { clinicId: user.clinicId } // All agents/staff linked to this clinic
              ]
            }).select("_id");
            query.userId = { $in: clinicUsers.map(u => u._id) };
          } else {
            query.userId = user._id;
          }
        } else {
          query.userId = user._id;
        }
      }
      // For other roles: show their own patients
      else {
        query.userId = user._id;
      }

      // Handle name search - if name filter exists, use $and to combine with userId filter
      if (name) {
        const nameFilter = {
          $or: [
            { firstName: { $regex: name, $options: "i" } },
            { lastName: { $regex: name, $options: "i" } },
          ]
        };
        // Store userId filter before reconstructing query
        const userIdFilter = { userId: query.userId };
        // Reconstruct query with $and to ensure userId filter is preserved
        query = {
          $and: [userIdFilter, nameFilter]
        };
        // Add other filters to the $and array
        if (emrNumber) query.$and.push({ emrNumber: { $regex: emrNumber, $options: "i" } });
        if (invoiceNumber) query.$and.push({ invoiceNumber: { $regex: invoiceNumber, $options: "i" } });
        if (phone) query.$and.push({ mobileNumber: { $regex: phone, $options: "i" } });
        if (claimStatus) query.$and.push({ advanceClaimStatus: claimStatus });
        if (applicationStatus) query.$and.push({ status: applicationStatus });
      } else {
        // Apply additional filters normally when no name filter
        if (emrNumber) query.emrNumber = { $regex: emrNumber, $options: "i" };
        if (invoiceNumber) query.invoiceNumber = { $regex: invoiceNumber, $options: "i" };
        if (phone) query.mobileNumber = { $regex: phone, $options: "i" };
        if (claimStatus) query.advanceClaimStatus = claimStatus;
        if (applicationStatus) query.status = applicationStatus;
      }

      // Fetch patients without populate first
      const patients = await PatientRegistration.find(query)
        .sort({ createdAt: -1 })
        .lean();

      // 🔹 Map doctor name - handle both ObjectId references and string names
      const patientDetails = patients.map((p) => {
        const patientObj = { ...p };
        // If doctor is already a string, use it; otherwise try to get name from populated object
        if (typeof patientObj.doctor === 'string') {
          // Doctor is already a string (name), use it as-is
          patientObj.doctor = patientObj.doctor || "-";
        } else if (patientObj.doctor && patientObj.doctor.name) {
          // Doctor is populated object, extract name
          patientObj.doctor = patientObj.doctor.name;
        } else {
          // No doctor info
          patientObj.doctor = "-";
        }
        return patientObj;
      });

      return res.status(200).json({ success: true, count: patients.length, data: patientDetails });
    } catch (err) {
      console.error("GET error:", err);
      return res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
    }
  }

  // ---------------- PUT: update status ----------------  
  if (req.method === "PUT") {
    try {
      const user = await getAuthorizedStaffUser(req, {
        allowedRoles: ["staff", "doctorStaff", "doctor", "clinic", "agent", "admin"],
      });
      const { id, status } = req.body;

      if (!id || !status) {
        return res.status(400).json({ success: false, message: "id and status required" });
      }

      // Build query based on user role for authorization
      let query = { _id: id };
      if (user.role === 'clinic') {
        const Clinic = (await import("../../../models/Clinic")).default;
        const clinic = await Clinic.findOne({ owner: user._id });
        if (clinic) {
          const User = (await import("../../../models/Users")).default;
          const clinicUsers = await User.find({
            $or: [
              { _id: user._id },
              { clinicId: clinic._id }
            ]
          }).select("_id");
          const clinicUserIds = clinicUsers.map(u => u._id);
          query.userId = { $in: clinicUserIds };
        } else {
          query.userId = user._id;
        }
      } else if (user.role === 'agent' || user.role === 'doctorStaff') {
        if (user.clinicId) {
          const Clinic = (await import("../../../models/Clinic")).default;
          const clinic = await Clinic.findById(user.clinicId);
          if (clinic) {
            const User = (await import("../../../models/Users")).default;
            const clinicUsers = await User.find({
              $or: [
                { _id: clinic.owner },
                { clinicId: user.clinicId }
              ]
            }).select("_id");
            query.userId = { $in: clinicUsers.map(u => u._id) };
          } else {
            query.userId = user._id;
          }
        } else {
          query.userId = user._id;
        }
      } else {
        query.userId = user._id;
      }

      const patient = await PatientRegistration.findOne(query);
      if (!patient) return res.status(404).json({ success: false, message: "Patient not found or unauthorized" });

      patient.status = status;
      await patient.save();

      return res.status(200).json({ success: true, message: `Patient status updated to ${status}`, data: patient });
    } catch (err) {
      console.error("PUT error:", err);
      return res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
    }
  }

  // ---------------- DELETE: delete patient ----------------  
  if (req.method === "DELETE") {
    try {
      const user = await getAuthorizedStaffUser(req, {
        allowedRoles: ["staff", "doctorStaff", "doctor", "clinic", "agent", "admin"],
      });
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, message: "id is required" });
      }

      // ✅ Check permissions for deleting patients (admin bypasses all checks)
      if (user.role !== 'admin') {
        const { checkClinicPermission } = await import("../lead-ms/permissions-helper");
        const { checkAgentPermission } = await import("../agent/permissions-helper");
        const Clinic = (await import("../../../models/Clinic")).default;
        
        // For clinic role: Check clinic permissions
        if (user.role === 'clinic') {
          const clinic = await Clinic.findOne({ owner: user._id });
          if (clinic) {
            const { hasPermission: clinicHasPermission, error: clinicError } = await checkClinicPermission(
              clinic._id,
              "patient_registration",
              "delete"
            );
            if (!clinicHasPermission) {
              return res.status(403).json({
                success: false,
                message: clinicError || "You do not have permission to delete patients"
              });
            }
          }
        }
        // For agent role (agentToken): Check agent permissions
        else if (user.role === 'agent') {
          const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
            user._id,
            "patient_registration",
            "delete"
          );
          if (!agentHasPermission) {
            return res.status(403).json({
              success: false,
              message: agentError || "You do not have permission to delete patients"
            });
          }
        }
        // For doctorStaff role (userToken): Check agent permissions
        else if (user.role === 'doctorStaff') {
          const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
            user._id,
            "patient_registration",
            "delete"
          );
          if (!agentHasPermission) {
            return res.status(403).json({
              success: false,
              message: agentError || "You do not have permission to delete patients"
            });
          }
        }
      }

      // Build query based on user role for authorization
      let query = { _id: id };
      if (user.role === 'clinic') {
        const Clinic = (await import("../../../models/Clinic")).default;
        const clinic = await Clinic.findOne({ owner: user._id });
        if (clinic) {
          const User = (await import("../../../models/Users")).default;
          const clinicUsers = await User.find({
            $or: [
              { _id: user._id },
              { clinicId: clinic._id }
            ]
          }).select("_id");
          const clinicUserIds = clinicUsers.map(u => u._id);
          query.userId = { $in: clinicUserIds };
        } else {
          query.userId = user._id;
        }
      } else if (user.role === 'agent' || user.role === 'doctorStaff') {
        // Agent/doctorStaff can only delete their own patients
        query.userId = user._id;
      } else {
        query.userId = user._id;
      }

      const patient = await PatientRegistration.findOne(query);
      if (!patient) {
        return res.status(404).json({ success: false, message: "Patient not found or unauthorized" });
      }

      const Appointment = (await import("../../../models/Appointment")).default;
      const Billing = (await import("../../../models/Billing")).default;
      const AppointmentReport = (await import("../../../models/AppointmentReport")).default;

      await Promise.all([
        Appointment.deleteMany({ patientId: patient._id }),
        Billing.deleteMany({ patientId: patient._id }),
        AppointmentReport.deleteMany({ patientId: patient._id }),
      ]);

      await PatientRegistration.findByIdAndDelete(id);

      return res.status(200).json({ success: true, message: "Patient deleted successfully" });
    } catch (err) {
      console.error("DELETE error:", err);
      return res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}

