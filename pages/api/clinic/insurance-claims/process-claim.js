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
    const { claimId, action, rejectionNote } = req.body;

    if (!claimId || !action) {
      return res.status(400).json({ success: false, message: "claimId and action are required" });
    }

    if (!["release", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'release' or 'reject'" });
    }

    if (action === "reject" && (!rejectionNote || !rejectionNote.trim())) {
      return res.status(400).json({ success: false, message: "Rejection note is required when rejecting a claim" });
    }

    const claim = await InsuranceClaim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    // Get clinicId for access control
    const { clinicId: userClinicId, isAdmin } = await getClinicIdFromUser(user);

    // Only Approved or Rejected claims can be released/rejected back
    if (!["Approved", "Rejected"].includes(claim.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot perform action on claim with status "${claim.status}". Only "Approved" or "Rejected" claims can be processed.`,
      });
    }

    // Clinic/agent/staff/doctorStaff can only process claims from their clinic
    if (!isAdmin && userClinicId) {
      if (claim.clinicId?.toString() !== userClinicId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied: claim belongs to another clinic" });
      }
    }

    if (action === "release") {
      // Release claim - mark as Released (final status)
      claim.status = "Released";
      claim.releasedBy = user._id;
      claim.releasedByName = user.name || user.firstName || "";
      claim.releasedByRole = user.role;
      claim.releasedAt = new Date();
    } else if (action === "reject") {
      // Reject claim back to doctor - reset to Under Review
      claim.status = "Under Review";
      // Keep reviewedBy to track that it was previously reviewed and rejected back
      claim.reviewNotes = rejectionNote.trim();
      // Keep rejectionReason for tracking
      claim.rejectionReason = rejectionNote.trim();
      // Add a flag to indicate this was rejected from pass-claims
      claim.rejectedFromPassClaims = true;
      claim.rejectedFromPassClaimsAt = new Date();
      claim.rejectedFromPassClaimsBy = user._id;
      claim.rejectedFromPassClaimsByName = user.name || user.firstName || "";
      claim.rejectedFromPassClaimsByRole = user.role;
    }

    await claim.save();

    return res.status(200).json({
      success: true,
      message: action === "release" ? "Claim released successfully" : "Claim rejected back to doctor successfully",
      data: claim,
    });
  } catch (error) {
    console.error("Error processing claim:", error);
    return res.status(500).json({ success: false, message: "Failed to process claim" });
  }
}
