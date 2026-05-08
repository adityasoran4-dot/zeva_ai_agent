import dbConnect from "../../../../lib/database";
import InsuranceClaim from "../../../../models/InsuranceClaim";
import Billing from "../../../../models/Billing";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser } from "../../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!["clinic", "staff", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  try {
    const { claimId, amount, paymentMethod, notes } = req.body;

    if (!claimId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "claimId and valid amount are required" });
    }

    const { clinicId } = await getClinicIdFromUser(user);

    const claim = await InsuranceClaim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ success: false, message: "Insurance claim not found" });
    }

    const payAmount = Number(amount);
    const currentPending = Number(claim.pendingClaim || 0);

    if (payAmount > currentPending) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${payAmount}) cannot exceed pending claim (${currentPending})`,
      });
    }

    // Reduce pendingClaim by paid amount
    const newPendingClaim = Math.max(0, currentPending - payAmount);
    claim.pendingClaim = newPendingClaim;

    // If fully paid, update advanceStatus to Full Pay
    if (newPendingClaim === 0) {
      claim.advanceStatus = "Full Pay";
    }

    await claim.save();

    // Create a billing record for this pending claim payment
    try {
      await Billing.create({
        clinicId: clinicId || claim.clinicId,
        userId: claim.patientId,
        treatment: "Insurance Pending Claim Payment",
        amount: payAmount,
        paid: payAmount,
        pending: 0,
        paymentMethod: paymentMethod || "Cash",
        status: "paid",
        notes: notes || `Pending claim payment for insurance claim`,
        invoicedBy: user._id,
        invoicedDate: new Date(),
        isAdvanceOnly: false,
      });
    } catch (billingErr) {
      console.error("Warning: billing record creation failed:", billingErr.message);
      // Don't fail the whole request if billing creation fails
    }

    return res.status(200).json({
      success: true,
      message: "Pending claim payment recorded successfully",
      data: {
        claimId: claim._id,
        previousPendingClaim: currentPending,
        amountPaid: payAmount,
        newPendingClaim,
        advanceStatus: claim.advanceStatus,
      },
    });
  } catch (error) {
    console.error("Error paying pending claim:", error);
    return res.status(500).json({ success: false, message: "Failed to process payment" });
  }
}
