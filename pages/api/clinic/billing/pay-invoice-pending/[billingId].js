import dbConnect from "../../../../../lib/database";
import Billing from "../../../../../models/Billing";
import { getUserFromReq } from "../../../lead-ms/auth";
export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!["clinic", "agent", "doctorStaff", "staff", "admin"].includes(clinicUser.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { billingId } = req.query;
    if (!billingId) {
      return res.status(400).json({ success: false, message: "Billing ID is required" });
    }

    const { amount, paymentMethod, notes } = req.body;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }
    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: "Payment method is required" });
    }

    // Find the billing record
    const billing = await Billing.findById(billingId);
    if (!billing) {
      return res.status(404).json({ success: false, message: "Billing record not found" });
    }

    // Verify user has access to this clinic
    let clinicId;
    if (clinicUser.role === "clinic") {
      const Clinic = (await import("../../../../../models/Clinic")).default;
      const clinic = await Clinic.findOne({ owner: clinicUser._id });
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
      clinicId = clinic._id;
    } else if (clinicUser.role === "admin") {
      clinicId = req.body.clinicId || billing.clinicId;
    } else {
      clinicId = clinicUser.clinicId;
      if (!clinicId) {
        return res.status(403).json({ success: false, message: "User not linked to a clinic" });
      }
    }

    if (billing.clinicId.toString() !== clinicId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied to this billing record" });
    }

    // Check if payment amount exceeds pending
    const currentPending = Number(billing.pending || 0);
    if (Number(amount) > currentPending) {
      return res.status(400).json({ 
        success: false, 
        message: `Payment amount exceeds pending amount. Current pending: ${currentPending}` 
      });
    }

    // Update the billing record
    // Simply add to paid amount - the pre-save hook will recalculate pending automatically
    const newPaid = Number(billing.paid || 0) + Number(amount);

    // Create payment history entry
    const paymentHistoryEntry = {
      amount: Number(billing.amount || 0),
      paid: newPaid,
      pending: Math.max(0, currentPending - Number(amount)), // Show remaining pending
      paymentMethod: paymentMethod,
      status: "Completed",
      updatedAt: new Date(),
    };

    // Update the billing record
    billing.paid = newPaid;
    // The pre-save hook will automatically recalculate: pending = amount - paid
    
    // Add to payment history
    if (!billing.paymentHistory) {
      billing.paymentHistory = [];
    }
    billing.paymentHistory.push(paymentHistoryEntry);

    // Update multiplePayments if exists
    if (!billing.multiplePayments) {
      billing.multiplePayments = [];
    }
    billing.multiplePayments.push({
      paymentMethod: paymentMethod,
      amount: Number(amount),
    });

    // Update notes if provided
    if (notes) {
      billing.notes = billing.notes ? `${billing.notes} | ${notes}` : notes;
    }

    await billing.save();

    return res.status(200).json({
      success: true,
      message: "Payment recorded successfully",
      data: billing,
    });
  } catch (error) {
    console.error("Error recording invoice payment:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to record payment",
    });
  }
}
