import dbConnect from "../../../lib/database";
import Billing from "../../../models/Billing";
import PatientRegistration from "../../../models/PatientRegistration";
import PettyCash from "../../../models/PettyCash";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await dbConnect();

  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!["clinic", "doctor", "agent", "doctorStaff", "staff", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
  if (clinicError || !clinicId) {
    return res.status(403).json({ success: false, message: clinicError || "Unable to determine clinic" });
  }

  try {
    const {
      patientId,
      packageName,
      packageId,
      totalAmount,
      paidAmount,
      paymentMethod,
      paymentStatus,
      advanceBalanceUsed,
      claimAmountUsed,
      invoiceNumber,
      treatments,
    } = req.body;

    // Validate required fields
    if (!patientId || !packageName || totalAmount === undefined || totalAmount === null) {
      return res.status(400).json({ success: false, message: "patientId, packageName, and totalAmount are required" });
    }

    // Verify patient belongs to this clinic
    const patient = await PatientRegistration.findOne({ _id: patientId, clinicId });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found or does not belong to this clinic" });
    }

    // Check if billing already exists for this package (enhanced duplicate prevention)
    // Check 1: Exact duplicate within last 10 minutes (same package, amount, paid)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const exactDuplicate = await Billing.findOne({
      clinicId,
      patientId,
      package: packageName,
      amount: totalAmount,
      paid: paidAmount,
      invoicedDate: { $gte: tenMinutesAgo }
    });
    
    if (exactDuplicate) {
      console.log(`[Package Billing] Skipping exact duplicate billing for patient ${patientId}, package ${packageName}`);
      return res.status(200).json({
        success: true,
        message: "Package billing already exists (duplicate skipped)",
        billing: exactDuplicate,
        invoiceNumber: exactDuplicate.invoiceNumber,
      });
    }

    // Check 2: Same package for this patient has already been billed (prevent multiple billings for same package instance)
    // This prevents the issue where package is added once but billed multiple times
    const existingPackageBilling = await Billing.findOne({
      clinicId,
      patientId,
      package: packageName,
      service: "Package",
      // Only check if the package name matches and it's not a refund/reversal
      pending: { $gte: 0 }
    }).sort({ createdAt: -1 }); // Get the most recent one
    
    if (existingPackageBilling) {
      // Calculate time difference
      const timeDiff = Date.now() - new Date(existingPackageBilling.createdAt).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // If the same package was billed within last 24 hours with same amount, skip
      // This prevents accidental duplicate billings while allowing legitimate re-billing after a day
      if (hoursDiff < 24 && existingPackageBilling.amount === totalAmount) {
        console.log(`[Package Billing] Skipping duplicate - package ${packageName} already billed ${hoursDiff.toFixed(1)} hours ago for patient ${patientId}`);
        return res.status(200).json({
          success: true,
          message: `Package '${packageName}' was already billed ${hoursDiff.toFixed(1)} hours ago. Skipping duplicate.`,
          billing: existingPackageBilling,
          invoiceNumber: existingPackageBilling.invoiceNumber,
        });
      }
    }

    // Calculate pending amount
    // paidAmount is the cash/card payment (custom amount entered by user)
    // advanceBalanceUsed and claimAmountUsed are deducted from the amount user wants to pay
    const totalDeductions = (advanceBalanceUsed || 0) + (claimAmountUsed || 0) + (paidAmount || 0);
    const pendingAmount = Math.max(0, totalAmount - totalDeductions);

    // Determine actual payment status
    // If paymentStatus is explicitly provided as "Partial", respect it
    // Otherwise calculate based on total deductions
    let actualPaymentStatus;
    if (paymentStatus === "Partial") {
      // User explicitly chose partial payment
      actualPaymentStatus = "Partial";
    } else if (paymentStatus === "Full") {
      actualPaymentStatus = "Full";
    } else {
      // Auto-calculate if not specified
      actualPaymentStatus = totalDeductions >= totalAmount ? "Full" : (totalDeductions > 0 ? "Partial" : "Unpaid");
    }

    // Generate invoice number if not provided
    let finalInvoiceNumber = invoiceNumber;
    if (!finalInvoiceNumber) {
      const count = await Billing.countDocuments({ clinicId });
      finalInvoiceNumber = `PKG-${Date.now()}-${count + 1}`;
    }

    // Prepare treatments array - store treatment info without session counts for package purchase
    // Sessions should only be counted when treatments are actually consumed, not when package is purchased
    const treatmentsForBilling = treatments ? treatments.map(t => ({
      treatmentName: t.treatmentName,
      treatmentSlug: t.treatmentSlug,
      sessions: 0, // Set to 0 - sessions not consumed yet
    })) : [];

    // Create billing record
    const billingRecord = new Billing({
      clinicId,
      patientId,
      invoiceNumber: finalInvoiceNumber,
      invoicedDate: new Date(),
      invoicedBy: user.name || user.email || "System",
      invoicedById: user._id,
      service: "Package",
      package: packageName,
      quantity: 1,
      sessions: 0, // Set to 0 for package purchase - sessions are not consumed yet
      selectedPackageTreatments: treatmentsForBilling, // Store treatment info with 0 sessions
      amount: totalAmount,
      paid: paidAmount || 0,
      advanceUsed: advanceBalanceUsed || 0,
      claimAmountUsed: claimAmountUsed || 0,
      pending: pendingAmount,
      pendingUsed: 0,
      paymentMethod: paymentMethod || "Cash",
      paymentStatus: actualPaymentStatus, // Use calculated status instead of passed status
      notes: `Package billing - ${actualPaymentStatus} payment. Total: ${totalAmount}, Cash/Card: ${paidAmount || 0}, Advance used: ${advanceBalanceUsed || 0}, Claim used: ${claimAmountUsed || 0}`,
      // Initialize multiplePayments for enterprise-grade ledger
      multiplePayments: [
        ...(paidAmount > 0 ? [{ paymentMethod: paymentMethod || "Cash", amount: paidAmount, paidAt: new Date(), paidBy: user._id, transactionType: "PAYMENT" }] : []),
        ...(advanceBalanceUsed > 0 ? [{ paymentMethod: "Advance Balance", amount: advanceBalanceUsed, paidAt: new Date(), paidBy: user._id, transactionType: "ADVANCE_USAGE" }] : []),
        ...(claimAmountUsed > 0 ? [{ paymentMethod: "Insurance Claim", amount: claimAmountUsed, paidAt: new Date(), paidBy: user._id, transactionType: "CLAIM_USAGE" }] : [])
      ],
      // Initialize paymentHistory for UI audit trail
      paymentHistory: [{
        amount: totalAmount,
        paid: (paidAmount || 0) + (advanceBalanceUsed || 0) + (claimAmountUsed || 0),
        pending: pendingAmount,
        paymentMethod: paymentMethod || "Cash",
        status: actualPaymentStatus === "Full" ? "Completed" : "Active",
        updatedAt: new Date(),
        transactionType: actualPaymentStatus === "Full" ? "FULL_PAYMENT" : "PARTIAL_PAYMENT",
        amountPaid: paidAmount || 0,
        advanceAmountUsed: advanceBalanceUsed || 0,
        paidBy: user._id,
        paidByName: user.name || user.email || "System",
        remainingPending: pendingAmount,
        multiplePayments: [
          ...(paidAmount > 0 ? [{ paymentMethod: paymentMethod || "Cash", amount: paidAmount, transactionType: "PAYMENT" }] : []),
          ...(advanceBalanceUsed > 0 ? [{ paymentMethod: "Advance Balance", amount: advanceBalanceUsed, transactionType: "ADVANCE_USAGE" }] : []),
          ...(claimAmountUsed > 0 ? [{ paymentMethod: "Insurance Claim", amount: claimAmountUsed, transactionType: "CLAIM_USAGE" }] : [])
        ]
      }]
    });

    await billingRecord.save();

    // Add to PettyCash if payment method is Cash and paidAmount > 0
    if (paymentMethod === "Cash" && paidAmount > 0) {
      try {
        const pettyCashRecord = await PettyCash.create({
          clinicId,
          staffId: user._id,
          patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
          patientEmail: patient.email || '',
          patientPhone: patient.mobileNumber || '',
          note: `Auto-added from package payment - Package: ${packageName}, Invoice: ${finalInvoiceNumber}`,
          allocatedAmounts: [{
            amount: paidAmount,
            receipts: [],
            date: new Date()
          }],
          expenses: []
        });

        await PettyCash.updateGlobalTotalAmount(clinicId, paidAmount, 'add');
      } catch (pettyCashError) {
        console.error('[Package Billing] Error adding to Petty Cash:', pettyCashError);
        // Swallow petty cash errors to avoid breaking package billing
      }
    }

    console.log(`[Package Billing] Created billing record for patient ${patientId}, package ${packageName}`);
    console.log(`[Package Billing] Total: ${totalAmount}, Paid: ${paidAmount || 0}, Advance Used: ${advanceBalanceUsed || 0}, Claim Used: ${claimAmountUsed || 0}, Pending: ${pendingAmount}`);

    return res.status(201).json({
      success: true,
      message: "Package billing recorded successfully",
      billing: billingRecord,
      invoiceNumber: finalInvoiceNumber,
    });
  } catch (error) {
    console.error("Error creating package billing:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create package billing" });
  }
}
