import dbConnect from "../../../../lib/database";
import InsuranceClaim from "../../../../models/InsuranceClaim";
import User from "../../../../models/Users";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser } from "../../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ success: false, message: "Claim ID is required" });
  }

  // Verify authentication
  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!["clinic", "doctor", "agent", "doctorStaff", "staff", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  // GET: Get single claim by ID
  if (req.method === "GET") {
    try {
      const claim = await InsuranceClaim.findById(id).lean();
      if (!claim) {
        return res.status(404).json({ success: false, message: "Claim not found" });
      }

      // Get clinicId for access control
      const { clinicId: userClinicId, isAdmin } = await getClinicIdFromUser(user);

      // Clinic/agent/staff/doctorStaff can only see claims from their clinic
      if (!isAdmin && userClinicId) {
        if (claim.clinicId?.toString() !== userClinicId.toString()) {
          return res.status(403).json({ success: false, message: "Access denied: claim belongs to another clinic" });
        }
      }

      // Authorization check: doctorStaff can only see their own claims
      if (user.role === "doctorStaff" && claim.doctorId.toString() !== user._id.toString()) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      return res.status(200).json({ success: true, data: claim });
    } catch (error) {
      console.error("Error fetching claim:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch claim" });
    }
  }

  // PATCH: Update claim
  if (req.method === "PATCH") {
    try {
      const claim = await InsuranceClaim.findById(id);
      if (!claim) {
        return res.status(404).json({ success: false, message: "Claim not found" });
      }

      // Get clinicId for access control
      const { clinicId: userClinicId, isAdmin } = await getClinicIdFromUser(user);

      // Clinic/agent/staff/doctorStaff can only edit claims from their clinic
      if (!isAdmin && userClinicId) {
        if (claim.clinicId?.toString() !== userClinicId.toString()) {
          return res.status(403).json({ success: false, message: "Access denied: claim belongs to another clinic" });
        }
      }

      // Authorization: doctorStaff can only update their own claims
      if (user.role === "doctorStaff" && claim.doctorId.toString() !== user._id.toString()) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      // Only allow edit if status is "Under Review" or "Rejected"
      if (!["Under Review", "Rejected"].includes(claim.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot edit claim with status "${claim.status}". Only claims with "Under Review" or "Rejected" status can be edited.`,
        });
      }

      const {
        insuranceProvider,
        policyNumber,
        expiryDate,
        insuranceCardFile,
        tableOfBenefitsFile,
        departmentId,
        departmentName,
        serviceId,
        serviceName,
        services,
        doctorId,
        doctorName,
        claimAmount,
        claimType,
        coPayPercent,
        coPayType,
        notes,
        treatmentPlan,
        documentFiles,
        advanceStatus,
      } = req.body;

      // Update fields if provided
      if (insuranceProvider !== undefined) claim.insuranceProvider = insuranceProvider.trim();
      if (policyNumber !== undefined) claim.policyNumber = policyNumber.trim();
      if (expiryDate !== undefined) claim.expiryDate = new Date(expiryDate);
      if (insuranceCardFile !== undefined) claim.insuranceCardFile = insuranceCardFile;
      if (tableOfBenefitsFile !== undefined) claim.tableOfBenefitsFile = tableOfBenefitsFile;
      if (departmentId !== undefined) claim.departmentId = departmentId || null;
      if (departmentName !== undefined) claim.departmentName = departmentName;
      
      // Handle services - support both old format (serviceId/serviceName) and new format (services array)
      if (services !== undefined && Array.isArray(services)) {
        // New format: array of services
        claim.services = services;
      } else if (serviceId !== undefined) {
        // Old format: single service (backward compatibility)
        claim.services = [{ serviceId: serviceId || null, serviceName: serviceName || "" }];
      }
      
      if (doctorId !== undefined) {
        // Validate new doctor
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== "doctorStaff") {
          return res.status(400).json({ success: false, message: "Selected doctor is not a valid doctor staff" });
        }
        claim.doctorId = doctorId;
        claim.doctorName = doctorName || `${doctor.name || ''}`.trim() || doctor.email;
      }
      if (claimAmount !== undefined) claim.claimAmount = parseFloat(claimAmount);
      if (claimType !== undefined) claim.claimType = claimType;
      if (coPayPercent !== undefined) claim.coPayPercent = coPayPercent;
      if (coPayType !== undefined) claim.coPayType = coPayType;
      if (notes !== undefined) claim.notes = notes;
      if (treatmentPlan !== undefined) claim.treatmentPlan = treatmentPlan;
      if (documentFiles !== undefined) claim.documentFiles = documentFiles;

      // Handle advance-specific fields
      if (claim.claimType === "Advance" || claim.claimType === "Paid") {
        if (advanceStatus !== undefined) {
          claim.advanceStatus = advanceStatus;
        }
        // Use manually entered advanceAmount from req.body
        if (req.body.advanceAmount !== undefined) {
          claim.advanceAmount = parseFloat(req.body.advanceAmount) || 0;
        }
        // Calculate pendingClaim for Partial Pay
        if (claim.advanceStatus === "Partial Pay") {
          claim.pendingClaim = claim.claimAmount - claim.advanceAmount;
        } else {
          claim.pendingClaim = 0;
        }
      } else {
        claim.advanceStatus = null;
        claim.advanceAmount = 0;
        claim.pendingClaim = 0;
      }

      // Reset status to Under Review when edited from Rejected
      if (claim.status === "Rejected") {
        claim.status = "Under Review";
        claim.rejectionReason = "";
      }

      await claim.save();

      return res.status(200).json({
        success: true,
        message: "Claim updated successfully",
        data: claim,
      });
    } catch (error) {
      console.error("Error updating claim:", error);
      return res.status(500).json({ success: false, message: "Failed to update claim" });
    }
  }

  // DELETE: Delete a claim
  if (req.method === "DELETE") {
    try {
      const claim = await InsuranceClaim.findById(id);
      if (!claim) {
        return res.status(404).json({ success: false, message: "Claim not found" });
      }

      // Get clinicId for access control
      const { clinicId: userClinicId, isAdmin } = await getClinicIdFromUser(user);

      // Clinic/agent/staff/doctorStaff can only delete claims from their clinic
      if (!isAdmin && userClinicId) {
        if (claim.clinicId?.toString() !== userClinicId.toString()) {
          return res.status(403).json({ success: false, message: "Access denied: claim belongs to another clinic" });
        }
      }

      // Authorization: doctorStaff can only delete their own claims
      if (user.role === "doctorStaff" && claim.doctorId.toString() !== user._id.toString()) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      // Only allow delete if status is "Under Review" or "Rejected"
      if (!["Under Review", "Rejected"].includes(claim.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete claim with status "${claim.status}". Only claims with "Under Review" or "Rejected" status can be deleted.`,
        });
      }

      await InsuranceClaim.findByIdAndDelete(id);

      return res.status(200).json({ success: true, message: "Claim deleted successfully" });
    } catch (error) {
      console.error("Error deleting claim:", error);
      return res.status(500).json({ success: false, message: "Failed to delete claim" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}
