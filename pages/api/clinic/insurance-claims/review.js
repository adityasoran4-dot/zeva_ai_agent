import dbConnect from "../../../../lib/database";
import InsuranceClaim from "../../../../models/InsuranceClaim";
import User from "../../../../models/Users";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser } from "../../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
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

  try {
    const { claimId, action, rejectionReason, reviewNotes } = req.body;

    if (!claimId || !action) {
      return res.status(400).json({ success: false, message: "claimId and action are required" });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'" });
    }

    if (action === "reject" && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({ success: false, message: "Rejection reason is required when rejecting a claim" });
    }

    const claim = await InsuranceClaim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    // Get clinicId for access control
    const { clinicId: userClinicId, isAdmin } = await getClinicIdFromUser(user);

    // Clinic/agent/staff/doctorStaff can only review claims from their clinic
    if (!isAdmin && userClinicId) {
      if (claim.clinicId?.toString() !== userClinicId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied: claim belongs to another clinic" });
      }
    }

    // Allow reviewing claims with "Under Review", "Approved", or "Rejected" status
    // This allows reverting already reviewed claims back to the opposite status
    if (!["Under Review", "Approved", "Rejected"].includes(claim.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot review claim with status "${claim.status}". Only "Under Review", "Approved", or "Rejected" claims can be reviewed.`,
      });
    }

    // Authorization: doctorStaff can only review claims assigned to them
    if (user.role === "doctorStaff" && claim.doctorId.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only review claims assigned to you" });
    }

    // Update claim status
    if (action === "approve") {
      claim.status = "Approved";
      claim.approvedBy = user._id;
      claim.approvedByName = user.name || user.firstName || "";
      claim.approvedByRole = user.role;
      claim.approvedAt = new Date();
      // Clear rejection fields if reverting from Rejected to Approved
      claim.rejectedBy = null;
      claim.rejectedByName = "";
      claim.rejectedByRole = "";
      claim.rejectedAt = null;
      claim.rejectionReason = "";
    } else {
      claim.status = "Rejected";
      claim.rejectionReason = rejectionReason?.trim() || "";
      claim.rejectedBy = user._id;
      claim.rejectedByName = user.name || user.firstName || "";
      claim.rejectedByRole = user.role;
      claim.rejectedAt = new Date();
      // Clear approval fields if reverting from Approved to Rejected
      claim.approvedBy = null;
      claim.approvedByName = "";
      claim.approvedByRole = "";
      claim.approvedAt = null;
    }

    claim.reviewedBy = user._id;
    claim.reviewedAt = new Date();
    claim.reviewNotes = reviewNotes || "";

    await claim.save();

    return res.status(200).json({
      success: true,
      message: `Claim ${action === "approve" ? "approved" : "rejected"} successfully`,
      data: claim,
    });
  } catch (error) {
    console.error("Error reviewing claim:", error);
    return res.status(500).json({ success: false, message: "Failed to review claim" });
  }
}
