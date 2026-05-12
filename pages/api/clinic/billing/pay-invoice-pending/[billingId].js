import dbConnect from "../../../../../lib/database";
import Billing from "../../../../../models/Billing";
import PettyCash from "../../../../../models/PettyCash";
import PatientRegistration from "../../../../../models/PatientRegistration";
import Package from "../../../../../models/Package";
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

    // Update the billing record - directly set pending to avoid multiplePayments overriding paid
    const newPaid = Number(billing.paid || 0) + Number(amount);
    const newPending = Math.max(0, currentPending - Number(amount));

    // Create payment history entry
    const paymentHistoryEntry = {
      amount: Number(billing.amount || 0),
      paid: newPaid,
      pending: newPending, // Show remaining pending
      paymentMethod: paymentMethod,
      status: "Completed",
      updatedAt: new Date(),
    };

    // Update the billing record - directly set pending so pre-save hook doesn't recalculate
    billing.paid = newPaid;
    billing.pending = newPending; // Directly set pending to our calculated value
    
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

    // Add to PettyCash if payment method is Cash
    if (paymentMethod === "Cash" && Number(amount) > 0) {
      try {
        // Find patient to get details
        const patient = await PatientRegistration.findById(billing.patientId);
        
        const pettyCashEntry = new PettyCash({
          clinicId: clinicId,
          staffId: clinicUser._id,
          staffName: clinicUser.name || "Staff",
          patientId: billing.patientId,
          patientName: patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : "Patient",
          patientFirstName: patient?.firstName || "",
          patientLastName: patient?.lastName || "",
          patientMobileNumber: patient?.mobileNumber || "",
          emrNumber: patient?.emrNumber || "",
          invoiceNumber: billing.invoiceNumber,
          invoicedDate: billing.invoicedDate,
          invoicedBy: billing.invoicedBy,
          service: billing.service,
          treatment: billing.treatment,
          package: billing.package,
          selectedPackageTreatments: billing.selectedPackageTreatments || [],
          amount: billing.amount,
          paid: Number(amount),
          cashAmount: Number(amount),
          paymentMethod: paymentMethod,
          multiplePayments: [{ paymentMethod, amount: Number(amount) }]
        });

        await pettyCashEntry.save();
        await PettyCash.updateGlobalTotalAmount(clinicId, Number(amount), 'add');
        console.log('[PayInvoicePending] Added to PettyCash:', pettyCashEntry._id);
      } catch (pettyCashError) {
        console.error('[PayInvoicePending] Error adding to PettyCash:', pettyCashError);
      }
    }

    // Update patient's package if billing is a Package
    if (billing.service === "Package") {
      try {
        const patient = await PatientRegistration.findById(billing.patientId);
        if (patient && patient.packages) {
          console.log('[PayInvoicePending] === PACKAGE UPDATE START ===');
          console.log('[PayInvoicePending] Billing record:', {
            _id: billing._id,
            invoiceNumber: billing.invoiceNumber,
            patientPackageId: billing.patientPackageId,
            patientPackageSubId: billing.patientPackageSubId,
            package: billing.package,
            service: billing.service,
            amount: billing.amount,
            paid: billing.paid,
            pending: billing.pending
          });
          console.log('[PayInvoicePending] Patient packages array:', patient.packages);
          console.log('[PayInvoicePending] Billing package name:', billing.package);
          
          let matchingPackageIndex = -1;
          let matchingPackage = null;
          
          for (let i = 0; i < patient.packages.length; i++) {
            const pkg = patient.packages[i];
            console.log('[PayInvoicePending] Checking package index', i, ':', pkg);
            
            // Check 1: Match by patientPackageId or patientPackageSubId
            if (
              (billing.patientPackageId && String(pkg.packageId) === String(billing.patientPackageId)) || 
              (billing.patientPackageSubId && String(pkg._id) === String(billing.patientPackageSubId))
            ) {
              matchingPackageIndex = i;
              matchingPackage = pkg;
              console.log('[PayInvoicePending] Match by ID found at index', i);
              break;
            }
            
            // Check 2: Match by package name from Package model
            if (pkg.packageId) {
              try {
                const pkgModel = await Package.findById(pkg.packageId);
                console.log('[PayInvoicePending] Package model for packageId', pkg.packageId, ':', pkgModel);
                if (pkgModel && pkgModel.name === billing.package) {
                  matchingPackageIndex = i;
                  matchingPackage = pkg;
                  console.log('[PayInvoicePending] Match by package name found at index', i);
                  break;
                }
              } catch (pkgErr) {
                console.log('[PayInvoicePending] Error fetching package model:', pkgErr);
              }
            }
          }
          
          console.log('[PayInvoicePending] Found matching package index:', matchingPackageIndex);
          
          if (matchingPackageIndex !== -1 && matchingPackage) {
            const pkg = matchingPackage;
            console.log('[PayInvoicePending] Found matching package details:', pkg);
            
            // Calculate new paid amount for the package
            const newPackagePaid = (pkg.paidAmount || 0) + Number(amount);
            const totalPrice = pkg.totalPrice || 0;
            
            console.log('[PayInvoicePending] Package payment calculation:', {
              oldPaid: pkg.paidAmount,
              paymentAmount: Number(amount),
              newPaid: newPackagePaid,
              totalPrice: totalPrice
            });
            
            // Update the package in the patient's packages array
            patient.packages[matchingPackageIndex].paidAmount = newPackagePaid;
            patient.packages[matchingPackageIndex].paymentMethod = paymentMethod;
            
            // Update payment status based on new paid amount
            if (newPackagePaid >= totalPrice) {
              patient.packages[matchingPackageIndex].paymentStatus = 'Full';
              console.log('[PayInvoicePending] Setting payment status to Full');
            } else if (newPackagePaid > 0) {
              patient.packages[matchingPackageIndex].paymentStatus = 'Partial';
              console.log('[PayInvoicePending] Setting payment status to Partial');
            } else {
              patient.packages[matchingPackageIndex].paymentStatus = 'Unpaid';
              console.log('[PayInvoicePending] Setting payment status to Unpaid');
            }
            
            console.log('[PayInvoicePending] Updated package object in array:', patient.packages[matchingPackageIndex]);
            
            // Also update the top-level package fields in PatientRegistration
            patient.packageId = patient.packageId || pkg.packageId;
            patient.packageTotalPrice = patient.packageTotalPrice || totalPrice;
            patient.packagePaidAmount = newPackagePaid;
            patient.packagePaymentStatus = patient.packages[matchingPackageIndex].paymentStatus;
            patient.packagePaymentMethod = paymentMethod;
            
            console.log('[PayInvoicePending] Updated patient object:', {
              packageId: patient.packageId,
              packageTotalPrice: patient.packageTotalPrice,
              packagePaidAmount: patient.packagePaidAmount,
              packagePaymentStatus: patient.packagePaymentStatus,
              packagePaymentMethod: patient.packagePaymentMethod
            });
            
            await patient.save();
            console.log('[PayInvoicePending] === PATIENT SAVED SUCCESSFULLY ===');
            console.log('[PayInvoicePending] Updated patient package:', { 
              matchingPackageIndex, 
              newPackagePaid, 
              paymentStatus: patient.packages[matchingPackageIndex].paymentStatus 
            });
          } else {
            console.log('[PayInvoicePending] === NO MATCHING PACKAGE FOUND ===');
          }
        } else {
          console.log('[PayInvoicePending] === NO PATIENT OR NO PACKAGES ARRAY ===');
        }
      } catch (packageError) {
        console.error('[PayInvoicePending] === ERROR UPDATING PATIENT PACKAGE ===');
        console.error('[PayInvoicePending] Error details:', packageError);
      }
    }

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
