/**
 * Commission Calculator Helper
 * Handles different commission calculation types including flat, target-based, after_deduction, and target_plus_expense
 */

import Commission from "../models/Commission.js";
import AgentProfile from "../models/AgentProfile.js";
import PatientComplains from "../models/PatientComplains.js";

/**
 * Helper function to calculate payment method (bank) deductions
 * @param {Object} params - Calculation parameters
 * @param {Number} params.earnedAmount - Original earned amount (before any deductions)
 * @param {Number} params.paidAmount - Original paid amount
 * @param {Object} params.bankPaymentDetails - Bank details for the selected payment method from Clinic model
 * @returns {Object} Deduction result
 */
export function calculateBankDeduction({ earnedAmount, paidAmount, bankPaymentDetails }) {
  console.log("[BankDeduction] Starting bank deduction calculation");
  console.log("[BankDeduction] Inputs:", { earnedAmount, paidAmount, bankPaymentDetails });

  // If bank payment method is not enabled, return original amounts
  if (!bankPaymentDetails?.enabled) {
    console.log("[BankDeduction] Payment method not enabled, returning original amounts");
    return {
      enabled: false,
      type: null,
      value: null,
      applyOn: null,
      deductionAmount: 0,
      finalEarnedAmount: earnedAmount,
      finalPaidAmount: paidAmount,
      deductionApplied: false,
    };
  }

  const { type, value, applyOn } = bankPaymentDetails;
  console.log("[BankDeduction] Payment method details:", { type, value, applyOn });

  let deductionAmount = 0;
  let finalEarnedAmount = earnedAmount;
  let finalPaidAmount = paidAmount;

  if (applyOn === "earned") {
    console.log("[BankDeduction] Applying deduction on earned amount");
    if (type === "flat") {
      deductionAmount = Number(value);
      finalEarnedAmount = Math.max(0, earnedAmount - deductionAmount);
      console.log(`[BankDeduction] Flat deduction on earned: ${deductionAmount}, Final earned: ${finalEarnedAmount}`);
    } else if (type === "percentage") {
      deductionAmount = (earnedAmount * Number(value)) / 100;
      finalEarnedAmount = Math.max(0, earnedAmount - deductionAmount);
      console.log(`[BankDeduction] Percentage deduction on earned: ${deductionAmount}, Final earned: ${finalEarnedAmount}`);
    }
  } else if (applyOn === "paid") {
    console.log("[BankDeduction] Applying deduction on paid amount");
    if (type === "flat") {
      deductionAmount = Number(value);
      finalPaidAmount = Math.max(0, paidAmount - deductionAmount);
      console.log(`[BankDeduction] Flat deduction on paid: ${deductionAmount}, Final paid: ${finalPaidAmount}`);
    } else if (type === "percentage") {
      deductionAmount = (paidAmount * Number(value)) / 100;
      finalPaidAmount = Math.max(0, paidAmount - deductionAmount);
      console.log(`[BankDeduction] Percentage deduction on paid: ${deductionAmount}, Final paid: ${finalPaidAmount}`);
    }
  }

  const result = {
    enabled: true,
    type,
    value,
    applyOn,
    deductionAmount: Number(deductionAmount.toFixed(2)),
    finalEarnedAmount: Number(finalEarnedAmount.toFixed(2)),
    finalPaidAmount: Number(finalPaidAmount.toFixed(2)),
    deductionApplied: true,
  };
  
  console.log("[BankDeduction] Final result:", result);

  return result;
}

/**
 * Calculate target-based commission
 * @param {Object} params - Calculation parameters
 * @param {String} params.staffId - Staff/doctor user ID
 * @param {String} params.clinicId - Clinic ID
 * @param {Number} params.paidAmount - Amount paid in this transaction
 * @param {Number} params.commissionPercentage - Commission percentage from profile
 * @param {Number} params.targetAmount - Target amount from profile
 * @returns {Object} Commission calculation result
 */
export async function calculateTargetBasedCommission({
  staffId,
  clinicId,
  paidAmount,
  commissionPercentage,
  targetAmount,
}) {
  try {
    // Get cumulative achieved amount for this staff (sum of all paid amounts)
    const previousCommissions = await Commission.find({
      clinicId,
      staffId,
      source: "staff",
      commissionType: "target_based",
    }).lean();

    // Calculate cumulative achieved amount from previous transactions
    const previousAchieved = previousCommissions.reduce(
      (sum, comm) => sum + Number(comm.amountPaid || 0),
      0
    );

    // New cumulative achieved amount after this transaction
    const newCumulativeAchieved = previousAchieved + paidAmount;

    // Determine commission logic
    let commissionAmount = 0;
    let isAboveTarget = false;
    let amountAboveTarget = 0;

    if (previousAchieved >= targetAmount) {
      // Already crossed target before - apply commission on full paid amount
      amountAboveTarget = paidAmount;
      commissionAmount = (amountAboveTarget * commissionPercentage) / 100;
      isAboveTarget = true;
    } else if (newCumulativeAchieved > targetAmount) {
      // This transaction crosses the target
      // Apply commission only on the amount above the target
      amountAboveTarget = newCumulativeAchieved - targetAmount;
      commissionAmount = (amountAboveTarget * commissionPercentage) / 100;
      isAboveTarget = true;
    } else {
      // Still below target - no commission
      commissionAmount = 0;
      isAboveTarget = false;
      amountAboveTarget = 0;
    }

    return {
      commissionAmount: Number(commissionAmount.toFixed(2)),
      amountAboveTarget: Number(amountAboveTarget.toFixed(2)),
      cumulativeAchieved: newCumulativeAchieved,
      isAboveTarget,
      targetAmount,
      previousAchieved,
    };
  } catch (error) {
    console.error("Error calculating target-based commission:", error);
    throw error;
  }
}

/**
 * Calculate target-plus-expense commission
 * Combines target-based logic with expense deduction:
 * 1. First check if target is crossed (same as target_based)
 * 2. Calculate amount above target
 * 3. Deduct expenses from the amount above target
 * 4. Calculate commission on remaining amount
 * 
 * Example:
 * - Target: ₹2000, Previous achieved: ₹1500, Current paid: ₹3000
 * - New cumulative: ₹4500 (crosses target)
 * - Amount above target: ₹4500 - ₹2000 = ₹2500
 * - Expenses from new complaints: ₹500
 * - Net commissionable amount: ₹2500 - ₹500 = ₹2000
 * - Commission (5%): ₹2000 × 5% = ₹100
 * 
 * @param {Object} params - Calculation parameters
 * @param {String} params.staffId - Staff/doctor user ID
 * @param {String} params.clinicId - Clinic ID
 * @param {String} params.patientId - Patient ID
 * @param {String} params.appointmentId - Appointment ID
 * @param {String} params.currentBillingId - Current billing ID to exclude
 * @param {Number} params.paidAmount - Amount paid in this transaction
 * @param {Number} params.commissionPercentage - Commission percentage from profile
 * @param {Number} params.targetAmount - Target amount from profile
 * @returns {Object} Commission calculation result
 */
export async function calculateTargetPlusExpenseCommission({
  staffId,
  clinicId,
  patientId,
  appointmentId,
  currentBillingId,
  paidAmount,
  commissionPercentage,
  targetAmount,
}) {
  try {
    // Step 1: Get cumulative achieved amount (same as target_based)
    const previousCommissions = await Commission.find({
      clinicId,
      staffId,
      source: "staff",
      commissionType: { $in: ["target_based", "target_plus_expense"] },
    }).lean();

    const previousAchieved = previousCommissions.reduce(
      (sum, comm) => sum + Number(comm.amountPaid || 0),
      0
    );

    const newCumulativeAchieved = previousAchieved + paidAmount;

    // Step 2: Determine amount above target (if any)
    let amountAboveTarget = 0;
    let isAboveTarget = false;

    if (previousAchieved >= targetAmount) {
      // Already crossed target - full paid amount is above target
      amountAboveTarget = paidAmount;
      isAboveTarget = true;
    } else if (newCumulativeAchieved > targetAmount) {
      // This transaction crosses target
      amountAboveTarget = newCumulativeAchieved - targetAmount;
      isAboveTarget = true;
    } else {
      // Still below target - no commission
      return {
        commissionAmount: 0,
        cumulativeAchieved: newCumulativeAchieved,
        isAboveTarget: false,
        targetAmount,
        previousAchieved,
        amountAboveTarget: 0,
        totalExpenses: 0,
        netCommissionableAmount: 0,
        reason: "Below target - no commission",
      };
    }

    // Step 3: Fetch expenses from complaints for THIS APPOINTMENT only,
    // and ONLY those created AFTER the last billing (to prevent accumulating
    // expenses from previous billings on the same appointment).

    // Find the most recent billing for this patient before the current one
    const BillingModel = (await import("../models/Billing.js")).default;
    const lastBillingQuery = { clinicId, patientId };
    if (currentBillingId) {
      lastBillingQuery._id = { $ne: currentBillingId };
    }
    const lastBillingTpe = await BillingModel.findOne(lastBillingQuery)
      .sort({ createdAt: -1 })
      .select("createdAt")
      .lean();
    const cutoffDateTpe = lastBillingTpe?.createdAt || null;

    const complaintsQuery = { 
      patientId,
      appointmentId, // Only get complaints for this specific appointment/visit
    };

    // Only include complaints added since the last billing to avoid double-deduction
    if (cutoffDateTpe) {
      complaintsQuery.createdAt = { $gt: cutoffDateTpe };
    }

    const complaints = await PatientComplains.find(complaintsQuery)
      .sort({ createdAt: -1 })
      .lean();

    // Step 4: Calculate total expenses
    let totalExpenses = 0;
    const expenseBreakdown = [];

    for (const complaint of complaints) {
      if (complaint.items && Array.isArray(complaint.items)) {
        const complaintTotal = complaint.items.reduce((sum, item) => {
          return sum + Number(item.totalAmount || 0);
        }, 0);

        totalExpenses += complaintTotal;

        expenseBreakdown.push({
          complaintId: complaint._id.toString(),
          appointmentId: complaint.appointmentId?.toString(),
          createdAt: complaint.createdAt,
          itemCount: complaint.items.length,
          complaintTotal: Number(complaintTotal.toFixed(2)),
          items: complaint.items.map((item) => ({
            name: item.name,
            code: item.code,
            quantity: item.quantity,
            uom: item.uom,
            totalAmount: item.totalAmount,
          })),
        });
      }
    }

    totalExpenses = Number(totalExpenses.toFixed(2));

    // Step 5: Check if expenses exist (required for target_plus_expense)
    // If no expenses provided, don't calculate commission
    if (totalExpenses <= 0) {
      return {
        commissionAmount: 0,
        cumulativeAchieved: newCumulativeAchieved,
        isAboveTarget,
        targetAmount,
        previousAchieved,
        amountAboveTarget: Number(amountAboveTarget.toFixed(2)),
        totalExpenses: 0,
        netCommissionableAmount: 0,
        expenseBreakdown: [],
        complaintsCount: 0,
        reason: "No expenses found - commission not calculated for target_plus_expense",
      };
    }

    // Step 6: Deduct expenses from amount above target
    const netCommissionableAmount = Math.max(0, amountAboveTarget - totalExpenses);

    // Step 7: Calculate commission on net amount
    const commissionAmount = (netCommissionableAmount * commissionPercentage) / 100;

    return {
      commissionAmount: Number(commissionAmount.toFixed(2)),
      cumulativeAchieved: newCumulativeAchieved,
      isAboveTarget,
      targetAmount,
      previousAchieved,
      amountAboveTarget: Number(amountAboveTarget.toFixed(2)),
      totalExpenses,
      netCommissionableAmount: Number(netCommissionableAmount.toFixed(2)),
      expenseBreakdown,
      complaintsCount: complaints.length,
    };
  } catch (error) {
    console.error("Error calculating target-plus-expense commission:", error);
    throw error;
  }
}

/**
 * Calculate flat commission
 * @param {Object} params - Calculation parameters
 * @param {Number} params.paidAmount - Amount paid in this transaction
 * @param {Number} params.commissionPercentage - Commission percentage
 * @returns {Object} Commission calculation result
 */
export function calculateFlatCommission({ paidAmount, commissionPercentage }) {
  const commissionAmount = (paidAmount * commissionPercentage) / 100;
  return {
    commissionAmount: Number(commissionAmount.toFixed(2)),
  };
}

/**
 * Calculate after-deduction commission
 * Fetches ONLY NEW patient complaints (created after last billing) and deducts those expenses
 * 
 * Logic:
 * 1. Find the most recent billing for this patient (to get the last billing date)
 * 2. Fetch only complaints created AFTER that last billing date
 * 3. Sum the totalAmount from all items in those NEW complaints only
 * 4. Calculate commission on: (paidAmount - newExpenses) * commissionPercentage / 100
 * 5. If expenses >= paidAmount, commission = 0
 * 
 * This prevents double-deduction: Each billing only considers NEW expenses since the last billing.
 * 
 * @param {Object} params - Calculation parameters
 * @param {String} params.patientId - Patient ID (PatientRegistration _id)
 * @param {String} params.appointmentId - Appointment ID (to identify the specific billing context)
 * @param {String} params.clinicId - Clinic ID (to filter billings and complaints)
 * @param {Number} params.paidAmount - Amount paid in this transaction
 * @param {Number} params.commissionPercentage - Commission percentage
 * @param {String} params.currentBillingId - Current billing ID to exclude from last billing query (optional)
 * @returns {Object} Commission calculation result with expense breakdown
 */
export async function calculateAfterDeductionCommission({
  patientId,
  appointmentId,
  clinicId,
  paidAmount,
  commissionPercentage,
  currentBillingId,
}) {
  try {
    // Import Billing model to find last billing date
    const Billing = (await import("../models/Billing.js")).default;

    // Build query to find the most recent billing BEFORE the current one
    // Exclude currentBillingId if provided (to avoid finding the billing we just created)
    const lastBillingQuery = {
      clinicId,
      patientId,
    };
    
    // Exclude current billing ID if provided
    if (currentBillingId) {
      lastBillingQuery._id = { $ne: currentBillingId };
    }

    // Find the most recent billing for this patient (before current billing)
    const lastBilling = await Billing.findOne(lastBillingQuery)
      .sort({ createdAt: -1 })
      .select("createdAt invoiceNumber")
      .lean();

    const cutoffDate = lastBilling?.createdAt || null;

    // Build query to fetch complaints for THIS APPOINTMENT only,
    // and ONLY those created AFTER the last billing (cutoffDate).
    // This prevents accumulating expenses from previous billings on the same appointment.
    const complaintsQuery = {
      patientId,
      appointmentId, // Only get complaints for this specific appointment
    };

    // If there was a previous billing, only include complaints created after it.
    // This ensures each billing only deducts expenses added since the last bill.
    if (cutoffDate) {
      complaintsQuery.createdAt = { $gt: cutoffDate };
    }

    // Fetch complaints for this appointment (only new ones since last billing)
    const complaints = await PatientComplains.find(complaintsQuery)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate total expenses from NEW complaints only
    // Each complaint has an 'items' array, and each item has a 'totalAmount' field
    let totalExpenses = 0;
    const expenseBreakdown = [];

    for (const complaint of complaints) {
      if (complaint.items && Array.isArray(complaint.items)) {
        const complaintTotal = complaint.items.reduce((sum, item) => {
          return sum + Number(item.totalAmount || 0);
        }, 0);

        totalExpenses += complaintTotal;

        expenseBreakdown.push({
          complaintId: complaint._id.toString(),
          appointmentId: complaint.appointmentId?.toString(),
          createdAt: complaint.createdAt,
          itemCount: complaint.items.length,
          complaintTotal: Number(complaintTotal.toFixed(2)),
          items: complaint.items.map((item) => ({
            name: item.name,
            code: item.code,
            quantity: item.quantity,
            uom: item.uom,
            totalAmount: item.totalAmount,
          })),
        });
      }
    }

    // Round total expenses to 2 decimal places
    totalExpenses = Number(totalExpenses.toFixed(2));

    // Calculate net amount after deducting NEW expenses only
    // Commission is calculated on (paidAmount - totalExpenses)
    const netAmount = Math.max(0, paidAmount - totalExpenses);

    // Calculate commission on net amount
    const commissionAmount = (netAmount * commissionPercentage) / 100;

    return {
      commissionAmount: Number(commissionAmount.toFixed(2)),
      totalExpenses,
      netAmount: Number(netAmount.toFixed(2)),
      paidAmount,
      commissionPercentage,
      expenseBreakdown,
      complaintsCount: complaints.length,
      lastBillingDate: cutoffDate,
      lastBillingInvoice: lastBilling?.invoiceNumber || null,
      isFirstBilling: !cutoffDate,
    };
  } catch (error) {
    console.error("Error calculating after-deduction commission:", error);
    throw error;
  }
}

/**
 * Get commission calculation based on staff profile
 * @param {Object} params - Parameters
 * @param {String} params.staffId - Staff/doctor user ID
 * @param {String} params.clinicId - Clinic ID
 * @param {Number} params.paidAmount - Amount paid in this transaction
 * @param {Number} params.earnedAmount - Original earned amount (before any deductions)
 * @param {String} params.patientId - Patient ID (required for after_deduction type)
 * @param {String} params.appointmentId - Appointment ID (required for after_deduction type)
 * @param {String} params.currentBillingId - Current billing ID to exclude (for after_deduction type)
 * @param {Object} params.bankPaymentDetails - Bank details for the selected payment method from Clinic model
 * @returns {Object} Commission calculation result
 */
export async function calculateCommissionForStaff({
  staffId,
  clinicId,
  paidAmount,
  earnedAmount,
  patientId,
  appointmentId,
  currentBillingId,
  bankPaymentDetails,
}) {
  try {
    console.log("[calculateCommissionForStaff] Starting commission calculation");
    console.log("[calculateCommissionForStaff] Original amounts:", { paidAmount, earnedAmount });
    console.log("[calculateCommissionForStaff] Bank payment details:", bankPaymentDetails);

    // Decide if we need to apply bank deduction before or after commission calculation
    const applyDeductionAfterCommission = bankPaymentDetails?.enabled && bankPaymentDetails.applyOn === "earned";
    console.log("[calculateCommissionForStaff] applyDeductionAfterCommission:", applyDeductionAfterCommission);
    
    let tempBankDeductionResult = {
      deductionAmount: 0,
      finalEarnedAmount: earnedAmount,
      finalPaidAmount: paidAmount,
      deductionApplied: false
    };

    if (bankPaymentDetails?.enabled && !applyDeductionAfterCommission) {
      // Apply bank deduction first (for applyOn: paid)
      console.log("[calculateCommissionForStaff] Applying bank deduction BEFORE commission calculation (applyOn: paid)");
      tempBankDeductionResult = calculateBankDeduction({
        earnedAmount,
        paidAmount,
        bankPaymentDetails
      });
      console.log("[calculateCommissionForStaff] Bank deduction result:", tempBankDeductionResult);
    } else if (applyDeductionAfterCommission) {
      console.log("[calculateCommissionForStaff] Will apply bank deduction AFTER commission calculation (applyOn: earned)");
    }

    // Use adjusted amounts for commission calculation (if we applied deduction before)
    const adjustedPaidAmount = tempBankDeductionResult.finalPaidAmount;
    const adjustedEarnedAmount = tempBankDeductionResult.finalEarnedAmount;

    console.log("[calculateCommissionForStaff] Adjusted amounts for commission calculation:", { adjustedPaidAmount, adjustedEarnedAmount });

    // Get staff profile
    const profile = await AgentProfile.findOne({ userId: staffId }).lean();
    
    if (!profile) {
      return {
        shouldCreateCommission: false,
        reason: "No profile found",
        bankDeduction: tempBankDeductionResult,
      };
    }

    const commissionType = String(profile.commissionType || "flat");
    const commissionPercentage = Number(profile.commissionPercentage || 0);

    if (commissionPercentage <= 0) {
      return {
        shouldCreateCommission: false,
        reason: "Commission percentage is 0",
        bankDeduction: tempBankDeductionResult,
      };
    }

    let result = {
      shouldCreateCommission: true,
      commissionType,
      commissionPercentage,
      bankDeduction: tempBankDeductionResult,
    };

    if (commissionType === "target_based") {
      const targetAmount = Number(profile.targetAmount || 0);
      
      if (targetAmount <= 0) {
        return {
          shouldCreateCommission: false,
          reason: "Target amount not set",
          bankDeduction: tempBankDeductionResult,
        };
      }

      const targetCalc = await calculateTargetBasedCommission({
        staffId,
        clinicId,
        paidAmount: adjustedPaidAmount,
        commissionPercentage,
        targetAmount,
      });

      result = {
        ...result,
        ...targetCalc,
      };
    } else if (commissionType === "flat") {
      const flatCalc = calculateFlatCommission({
        paidAmount: adjustedPaidAmount,
        commissionPercentage,
      });

      result = {
        ...result,
        ...flatCalc,
      };
    } else if (commissionType === "after_deduction") {
      // Validate required parameters for after_deduction
      if (!patientId) {
        return {
          shouldCreateCommission: false,
          reason: "Patient ID required for after_deduction commission",
          bankDeduction: tempBankDeductionResult,
        };
      }

      const afterDeductionCalc = await calculateAfterDeductionCommission({
        patientId,
        appointmentId,
        clinicId,
        paidAmount: adjustedPaidAmount,
        commissionPercentage,
        currentBillingId, // Pass the current billing ID to exclude it from the query
      });

      // For after_deduction: Only create commission if there are expenses to deduct
      // If no new expenses (totalExpenses = 0), don't create commission
      if (afterDeductionCalc.totalExpenses <= 0) {
        return {
          shouldCreateCommission: false,
          reason: "No new expenses found for after_deduction commission",
          ...afterDeductionCalc, // Include calculation details for logging
          bankDeduction: tempBankDeductionResult,
        };
      }

      result = {
        ...result,
        ...afterDeductionCalc,
      };
    } else if (commissionType === "target_plus_expense") {
      // Validate required parameters for target_plus_expense
      if (!patientId) {
        return {
          shouldCreateCommission: false,
          reason: "Patient ID required for target_plus_expense commission",
          bankDeduction: tempBankDeductionResult,
        };
      }

      const targetAmount = Number(profile.targetAmount || 0);
      
      if (targetAmount <= 0) {
        return {
          shouldCreateCommission: false,
          reason: "Target amount not set for target_plus_expense commission",
          bankDeduction: tempBankDeductionResult,
        };
      }

      const targetPlusExpenseCalc = await calculateTargetPlusExpenseCommission({
        staffId,
        clinicId,
        patientId,
        appointmentId,
        currentBillingId,
        paidAmount: adjustedPaidAmount,
        commissionPercentage,
        targetAmount,
      });

      // For target_plus_expense: Only create commission if there are expenses
      // If no expenses (totalExpenses = 0), don't create commission
      if (targetPlusExpenseCalc.totalExpenses <= 0) {
        return {
          shouldCreateCommission: false,
          reason: "No expenses found for target_plus_expense commission",
          ...targetPlusExpenseCalc, // Include calculation details for logging
          bankDeduction: tempBankDeductionResult,
        };
      }

      result = {
        ...result,
        ...targetPlusExpenseCalc,
      };
    } else {
      // Other commission types can be implemented here
      return {
        shouldCreateCommission: false,
        reason: `Commission type ${commissionType} not yet implemented`,
        bankDeduction: tempBankDeductionResult,
      };
    }

    // Now apply bank deduction to commission amount if applyOn is "earned"
    if (applyDeductionAfterCommission) {
      console.log("[calculateCommissionForStaff] Applying bank deduction AFTER commission calculation (applyOn: earned)");
      console.log("[calculateCommissionForStaff] Original commission amount before deduction:", result.commissionAmount);
      
      // Calculate deduction on the commission amount
      let deductionAmount = 0;
      console.log("[calculateCommissionForStaff] Bank payment details for deduction:", {
        type: bankPaymentDetails.type,
        value: bankPaymentDetails.value
      });
      
      if (bankPaymentDetails.type === "flat") {
        deductionAmount = Number(bankPaymentDetails.value);
        console.log(`[calculateCommissionForStaff] Applying flat deduction: ${deductionAmount}`);
      } else if (bankPaymentDetails.type === "percentage") {
        deductionAmount = (result.commissionAmount * Number(bankPaymentDetails.value)) / 100;
        console.log(`[calculateCommissionForStaff] Applying percentage deduction: ${bankPaymentDetails.value}% of ${result.commissionAmount} = ${deductionAmount}`);
      }
      
      // Apply deduction to commission amount
      result.commissionAmount = Math.max(0, result.commissionAmount - deductionAmount);
      result.commissionAmount = Number(result.commissionAmount.toFixed(2));
      
      // Update bankDeduction result
      result.bankDeduction = {
        enabled: true,
        type: bankPaymentDetails.type,
        value: bankPaymentDetails.value,
        applyOn: bankPaymentDetails.applyOn,
        deductionAmount: Number(deductionAmount.toFixed(2)),
        finalEarnedAmount: earnedAmount,
        finalPaidAmount: paidAmount,
        deductionApplied: true
      };
      
      console.log("[calculateCommissionForStaff] Bank deduction on commission:", {
        deductionAmount,
        finalCommissionAmount: result.commissionAmount
      });
    }

    console.log("[calculateCommissionForStaff] Final commission result:", result);
    return result;
  } catch (error) {
    console.error("Error in calculateCommissionForStaff:", error);
    throw error;
  }
}
