import dbConnect from "../../../../lib/database";
import PatientRegistration from "../../../../models/PatientRegistration";
import { getAuthorizedStaffUser } from "../../../../server/staff/authHelpers";
import { checkClinicPermission } from "../../lead-ms/permissions-helper";
import { checkAgentPermission } from "../../agent/permissions-helper";
import Clinic from "../../../../models/Clinic";

export default async function handler(req, res) {
  await dbConnect();

  // ✅ Extract EMR number from URL
  const { emrNumber } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  let user;
  try {
    user = await getAuthorizedStaffUser(req);
  } catch (err) {
    return res.status(err.status || 401).json({ success: false, message: err.message });
  }

  // ✅ Check permissions for reading patients (admin bypasses all checks)
  if (user.role !== 'admin') {
    // For clinic role: Check clinic permissions
    if (user.role === 'clinic') {
      const clinic = await Clinic.findOne({ owner: user._id });
      if (clinic) {
        const { hasPermission: clinicHasPermission, error: clinicError } = await checkClinicPermission(
          clinic._id,
          "patient_registration",
          "read"
        );
        if (!clinicHasPermission) {
          return res.status(403).json({
            success: false,
            message: clinicError || "You do not have permission to view patients"
          });
        }
      }
    }
    // For agent role (agentToken): Check agent permissions
    else if (user.role === 'agent') {
      const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
        user._id,
        "patient_registration",
        "read"
      );
      if (!agentHasPermission) {
        return res.status(403).json({
          success: false,
          message: agentError || "You do not have permission to view patients"
        });
      }
    }
    // For doctorStaff role (userToken): Check agent permissions
    else if (user.role === 'doctorStaff') {
      const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
        user._id,
        "patient_registration",
        "read"
      );
      if (!agentHasPermission) {
        return res.status(403).json({
          success: false,
          message: agentError || "You do not have permission to view patients"
        });
      }
    }
  }

  try {
    const patient = await PatientRegistration.findOne({ emrNumber });

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    // Check access for agents/doctorStaff
    if (user.role === 'agent' || user.role === 'doctorStaff') {
         // If patient is not created by the user, check if they are in the same clinic
         if (patient.userId && patient.userId.toString() !== user._id.toString()) {
             if (user.clinicId) {
                const Clinic = (await import("../../../../models/Clinic")).default;
                const clinic = await Clinic.findById(user.clinicId);
                if (clinic) {
                    const User = (await import("../../../../models/Users")).default;
                    const clinicUsers = await User.find({
                        $or: [
                            { _id: clinic.owner },
                            { clinicId: user.clinicId }
                        ]
                    }).select("_id");
                    
                    const allowedIds = clinicUsers.map(u => u._id.toString());
                    if (!allowedIds.includes(patient.userId.toString())) {
                         return res.status(403).json({ success: false, message: "Access denied" });
                    }
                } else {
                     return res.status(403).json({ success: false, message: "Access denied" });
                }
             } else {
                 return res.status(403).json({ success: false, message: "Access denied" });
             }
         }
    }

    // Calculate total advance amount for this EMR number across all records
    const allPatientsWithSameEMR = await PatientRegistration.find({ emrNumber });
    const totalAdvanceAmount = allPatientsWithSameEMR.reduce((total, p) => {
      return total + (parseFloat(p.advance) || 0);
    }, 0);

    return res.status(200).json({ 
      success: true, 
      data: {
        ...patient.toObject(),
        totalAdvanceAmount: totalAdvanceAmount,
        advanceOnlyAmount: Math.max(0, Number(patient.advance) || 0)
      }
    });
  } catch (err) {
    console.error("GET by EMR error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
