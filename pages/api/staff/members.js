import dbConnect from "../../../lib/database";
import mongoose from "mongoose";
import User from "../../../models/Users";
import Membership from "../../../models/Membership";
import PatientRegistration from "../../../models/PatientRegistration";
import PettyCash from "../../../models/PettyCash";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

// Helper function to add treatment amounts to PettyCash when payment method is Cash
async function addTreatmentToPettyCashIfCash(user, membership, treatments) {
  if (treatments && treatments.length > 0) {
    // Calculate total treatment amount
    const totalTreatmentAmount = treatments.reduce((sum, treatment) => {
      const lineTotal = Number(treatment.unitCount || 0) * Number(treatment.unitPrice || 0);
      return sum + lineTotal;
    }, 0);

    if (totalTreatmentAmount > 0) {
      try {
        // Try to get patient details from PatientRegistration
        let patientName = `Membership: ${membership.packageName}`;
        let patientEmail = '';
        let patientPhone = '';

        try {
          const patient = await PatientRegistration.findOne({ emrNumber: membership.emrNumber }).select("firstName lastName email mobileNumber");
          if (patient) {
            const firstName = (patient.firstName || '').trim();
            const lastName = (patient.lastName || '').trim();
            patientName = [firstName, lastName].filter(Boolean).join(' ') || patientName;
            patientEmail = patient.email || '';
            patientPhone = patient.mobileNumber || '';
          }
        } catch (patientError) {
          console.log("Could not fetch patient details for petty cash record:", patientError.message);
        }

        // Create a PettyCash record for the treatment amounts
        const pettyCashRecord = await PettyCash.create({
          staffId: user._id,
          patientName: patientName,
          patientEmail: patientEmail,
          patientPhone: patientPhone,
          note: `Auto-added from membership update - EMR: ${membership.emrNumber}, Package: ${membership.packageName}`,
          allocatedAmounts: [{
            amount: totalTreatmentAmount,
            receipts: [],
            date: new Date()
          }],
          expenses: []
        });

        
        // Update global total amount
        await PettyCash.updateGlobalTotalAmount(totalTreatmentAmount, 'add');
        
        console.log(`Added د.إ${totalTreatmentAmount} to PettyCash for staff ${user.name} from membership update - EMR: ${membership.emrNumber}, Patient: ${patientName}`);
      } catch (error) {
        console.error("Error adding treatment amounts to PettyCash:", error);
        // Don't throw error to avoid breaking membership update
      }
    }
  }
}

export default async function handler(req, res) {
  await dbConnect();
  let user;
  try {
    user = await getAuthorizedStaffUser(req, {
      allowedRoles: ["staff", "doctorStaff", "doctor", "clinic", "agent", "admin"],
    });
  } catch (err) {
    return res.status(err.status || 401).json({ success: false, message: err.message || "Authentication error" });
  }

  if (req.method === "POST") {
    try {
      // Check permissions for clinic/agent/doctor roles
      if (["clinic", "agent", "doctor", "doctorStaff"].includes(user.role)) {
        try {
          const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
          if (clinicError || !clinicId) {
            return res.status(403).json({ 
              success: false,
              message: clinicError || "Unable to determine clinic access" 
            });
          }

          const { hasPermission, error: permError } = await checkClinicPermission(
            clinicId,
            "clinic_staff_management",
            "create",
            "Membership"
          );

          if (!hasPermission) {
            return res.status(403).json({
              success: false,
              message: permError || "You do not have permission to create memberships"
            });
          }
        } catch (permErr) {
          console.error("Permission check error:", permErr);
          return res.status(500).json({ success: false, message: "Error checking permissions" });
        }
      }

      const { emrNumber, patientId, packageName, packageAmount, packageStartDate, packageEndDate, packageDurationMonths, paymentMethod, paidAmount, treatments } = req.body;
      if (!emrNumber || !packageName || packageAmount === undefined || !packageEndDate || !packageDurationMonths) {
        return res.status(400).json({ success: false, message: "emrNumber, packageName, packageAmount, packageEndDate and packageDurationMonths are required" });
      }

      const normalizedPkg = Number(packageAmount) || 0;
      const normalizedPaid = Number(paidAmount) || 0;
      const normalizedDuration = Number(packageDurationMonths) || 1;

      const normalizedTreatments = Array.isArray(treatments) ? treatments.map(t => ({
        treatmentName: t.treatmentName,
        unitCount: Number(t.unitCount) || 0,
        unitPrice: Number(t.unitPrice) || 0,
        lineTotal: Number(t.unitCount || 0) * Number(t.unitPrice || 0),
      })) : [];

      const membership = await Membership.create({
        emrNumber,
        patientId: patientId || null,
        staffId: user._id,
        packageName,
        packageAmount: normalizedPkg,
        packageStartDate: packageStartDate ? new Date(packageStartDate) : new Date(),
        packageEndDate: new Date(packageEndDate),
        packageDurationMonths: normalizedDuration,
        paymentMethod: paymentMethod || "",
        paidAmount: normalizedPaid,
        treatments: normalizedTreatments,
      });

      return res.status(201).json({ success: true, data: membership });
    } catch (err) {
      console.error("Create membership error:", err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "GET") {
    try {
      // Check permissions for clinic/agent/doctor roles
      if (["clinic", "agent", "doctor", "doctorStaff"].includes(user.role)) {
        try {
          const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
          if (clinicError || !clinicId) {
            return res.status(403).json({ 
              success: false,
              message: clinicError || "Unable to determine clinic access" 
            });
          }

          const { hasPermission, error: permError } = await checkClinicPermission(
            clinicId,
            "clinic_staff_management",
            "read",
            "Membership"
          );

          if (!hasPermission) {
            return res.status(403).json({
              success: false,
              message: permError || "You do not have permission to view memberships"
            });
          }
        } catch (permErr) {
          console.error("Permission check error:", permErr);
          return res.status(500).json({ success: false, message: "Error checking permissions" });
        }
      }

      const { emrNumber } = req.query;
      const query = {};
      if (emrNumber) query.emrNumber = emrNumber;
      const list = await Membership.find(query).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: list });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "PUT") {
    try {
      // Check permissions for clinic/agent/doctor roles
      if (["clinic", "agent", "doctor", "doctorStaff"].includes(user.role)) {
        try {
          const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
          if (clinicError || !clinicId) {
            return res.status(403).json({ 
              success: false,
              message: clinicError || "Unable to determine clinic access" 
            });
          }

          const { hasPermission, error: permError } = await checkClinicPermission(
            clinicId,
            "clinic_staff_management",
            "update",
            "Membership"
          );

          if (!hasPermission) {
            return res.status(403).json({
              success: false,
              message: permError || "You do not have permission to update memberships"
            });
          }
        } catch (permErr) {
          console.error("Permission check error:", permErr);
          return res.status(500).json({ success: false, message: "Error checking permissions" });
        }
      }

      const { membershipId, treatments, paymentMethod, paidAmount } = req.body;
      if (!membershipId) {
        return res.status(400).json({ success: false, message: "membershipId is required" });
      }
      
      // Validate membershipId format (should be a valid MongoDB ObjectId)
      if (!mongoose.Types.ObjectId.isValid(membershipId)) {
        return res.status(400).json({ success: false, message: "Invalid membershipId format" });
      }

      console.log("Looking for membership with ID:", membershipId, "User ID:", user._id);

      // Find the membership by ID only (removed staffId filter to allow any staff to update)
      let membership = await Membership.findOne({ _id: membershipId });
      if (!membership) {
        console.log("Membership not found for ID:", membershipId);
        return res.status(404).json({ success: false, message: "Membership not found" });
      }
      
      console.log("Membership found:", {
        id: membership._id,
        emrNumber: membership.emrNumber,
        packageName: membership.packageName,
        originalStaffId: membership.staffId,
        currentUserId: user._id
      });

      const normalizedTreatments = Array.isArray(treatments) ? treatments.map(t => ({
        treatmentName: t.treatmentName,
        unitCount: Number(t.unitCount) || 0,
        unitPrice: Number(t.unitPrice) || 0,
        lineTotal: Number(t.unitCount || 0) * Number(t.unitPrice || 0),
      })) : [];

      if (normalizedTreatments.length > 0) {
        membership.treatments.push(...normalizedTreatments);
      }

      // Optional payment update during membership update
      if (typeof paidAmount !== 'undefined') {
        const addPaid = Number(paidAmount) || 0;
        if (addPaid > 0) {
          const currentPaid = Number(membership.paidAmount || 0);
          membership.paidAmount = currentPaid + addPaid;
        }
      }
      if (typeof paymentMethod === 'string' && paymentMethod) {
        membership.paymentMethod = paymentMethod;
      }

      await membership.save();

      // Add treatment amounts to PettyCash if payment method is Cash
      if (paymentMethod === "Cash" && normalizedTreatments.length > 0) {
        await addTreatmentToPettyCashIfCash(user, membership, normalizedTreatments);
      }

      return res.status(200).json({ success: true, data: membership });
    } catch (err) {
      console.error("Update membership error:", err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "PATCH") {
    // Transfer membership (by EMR)
    try {
      // Check permissions for clinic/agent/doctor roles
      if (["clinic", "agent", "doctor", "doctorStaff"].includes(user.role)) {
        try {
          const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
          if (clinicError || !clinicId) {
            return res.status(403).json({ 
              success: false,
              message: clinicError || "Unable to determine clinic access" 
            });
          }

          const { hasPermission, error: permError } = await checkClinicPermission(
            clinicId,
            "clinic_staff_management",
            "update",
            "Membership"
          );

          if (!hasPermission) {
            return res.status(403).json({
              success: false,
              message: permError || "You do not have permission to transfer memberships"
            });
          }
        } catch (permErr) {
          console.error("Permission check error:", permErr);
          return res.status(500).json({ success: false, message: "Error checking permissions" });
        }
      }

      const { membershipId, toEmrNumber, toPatientId, toName, amount, note } = req.body;
      if (!membershipId || !toEmrNumber) {
        return res.status(400).json({ success: false, message: "membershipId and toEmrNumber are required" });
      }

      // Validate membershipId format
      if (!mongoose.Types.ObjectId.isValid(membershipId)) {
        return res.status(400).json({ success: false, message: "Invalid membershipId format" });
      }

      const membership = await Membership.findOne({ _id: membershipId });
      if (!membership) {
        return res.status(404).json({ success: false, message: "Membership not found" });
      }

      const transferAmount = Number(amount) || 0;

      // Resolve recipient name from EMR if not provided
      let resolvedToName = toName || "";
      try {
        if (!resolvedToName && toEmrNumber) {
          const recipient = await PatientRegistration.findOne({ emrNumber: toEmrNumber }).select("firstName lastName");
          if (recipient) {
            const fn = (recipient.firstName || "").trim();
            const ln = (recipient.lastName || "").trim();
            resolvedToName = [fn, ln].filter(Boolean).join(" ");
          }
        }
      } catch {}
      const remainingBalance = Number(membership.remainingBalance || 0);
      
      // Validate transfer amount
      if (transferAmount > remainingBalance) {
        return res.status(400).json({ success: false, message: `Transfer amount (د.إ${transferAmount}) cannot exceed remaining balance (د.إ${remainingBalance})` });
      }

      // Record transfer (logical tracking)
      const transferRecord = {
        fromEmr: membership.emrNumber,
        toEmr: toEmrNumber,
        toPatientId: toPatientId || null,
        toName: resolvedToName || "",
        transferredAmount: transferAmount,
        note: note || "",
        transferredBy: user._id,
      };
      
      membership.transferHistory.push(transferRecord);

      // Deduct the transferred amount from current membership
      if (transferAmount > 0) {
        // Add a "transfer deduction" treatment to track the deduction
        membership.treatments.push({
          treatmentName: `Transfer to ${toEmrNumber}${toName ? ` (${toName})` : ''}`,
          unitCount: 1,
          unitPrice: transferAmount,
          lineTotal: transferAmount,
          addedAt: new Date()
        });
      }

      // If full transfer (amount === 0 or equals remaining balance), reassign to new EMR
      if (transferAmount === 0 || transferAmount === remainingBalance) {
        membership.emrNumber = toEmrNumber;
        membership.patientId = toPatientId || membership.patientId;
      }

      await membership.save();

      // Do NOT create a new membership card; only record transfer and deduction on the original
      // (If in future we want to reflect on recipient, we can handle it in a separate flow without creating a new card here.)

      return res.status(200).json({ success: true, data: membership });
    } catch (err) {
      console.error("Transfer membership error:", err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "PATCH"]);
  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}


