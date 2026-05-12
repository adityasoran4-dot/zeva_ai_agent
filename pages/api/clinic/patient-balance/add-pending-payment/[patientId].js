import dbConnect from "../../../../../lib/database";
import Billing from "../../../../../models/Billing";
import Clinic from "../../../../../models/Clinic";
import PatientRegistration from "../../../../../models/PatientRegistration";
import Package from "../../../../../models/Package";
import PettyCash from "../../../../../models/PettyCash";
import { getUserFromReq } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (
      !["clinic", "agent", "doctorStaff", "staff", "admin"].includes(
        clinicUser.role,
      )
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { patientId } = req.query;
    if (!patientId) {
      return res
        .status(400)
        .json({ success: false, message: "Patient ID is required" });
    }

    const { amount, paymentMethod, notes, invoicedBy, multiplePayments, advanceUsed } =
      req.body;
    const amountNum = Number(amount);
    const advanceUsedNum = advanceUsed !== undefined ? Math.max(0, Number(advanceUsed) || 0) : 0;
    
    if (amount === undefined || amount === null || isNaN(amountNum) || amountNum < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Valid amount is required" });
    }
    
    if (amountNum === 0 && advanceUsedNum <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Valid amount is required" });
    }
    if (
      !paymentMethod &&
      (!multiplePayments || multiplePayments.length === 0)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Payment method is required" });
    }

    // Verify patient
    const patient = await PatientRegistration.findById(patientId);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    // Determine clinicId
    let clinicId;
    if (clinicUser.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: clinicUser._id });
      if (!clinic) {
        return res
          .status(404)
          .json({ success: false, message: "Clinic not found" });
      }
      clinicId = clinic._id;
    } else if (clinicUser.role === "admin") {
      clinicId = req.body.clinicId || patient.clinicId;
    } else {
      clinicId = clinicUser.clinicId;
      if (!clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "User not linked to a clinic" });
      }
    }

    // Step 1: Fetch all pending invoices for the patient (oldest first)
    const pendingInvoices = await Billing.find({
      clinicId,
      patientId,
      pending: { $gt: 0 },
      isAdvanceOnly: { $ne: true }
    }).sort({ invoicedDate: 1, createdAt: 1 });

    // Total payment includes both cash and advance
    const totalPayment = amountNum + advanceUsedNum;
    let remainingPayment = totalPayment;

    // Step 2: Distribute payment to pending invoices
    for (const invoice of pendingInvoices) {
      if (remainingPayment <= 0) break;

      const paymentForInvoice = Math.min(remainingPayment, invoice.pending);

      // Update the invoice
      invoice.paid = (invoice.paid || 0) + paymentForInvoice;
      invoice.pending = invoice.pending - paymentForInvoice;

      await invoice.save();

      remainingPayment -= paymentForInvoice;

      // Update patient's package if this invoice is a Package service
      if (invoice.service === "Package") {
        try {
          const patient = await PatientRegistration.findById(patientId);
          if (patient && patient.packages) {
            let matchingPackageIndex = -1;
            
            for (let i = 0; i < patient.packages.length; i++) {
              const pkg = patient.packages[i];
              
              // Check 1: Match by patientPackageId or patientPackageSubId
              if (
                (invoice.patientPackageId && String(pkg.packageId) === String(invoice.patientPackageId)) || 
                (invoice.patientPackageSubId && String(pkg._id) === String(invoice.patientPackageSubId))
              ) {
                matchingPackageIndex = i;
                break;
              }
              
              // Check 2: Match by package name from Package model
              if (pkg.packageId) {
                try {
                  const pkgModel = await Package.findById(pkg.packageId);
                  if (pkgModel && pkgModel.name === invoice.package) {
                    matchingPackageIndex = i;
                    break;
                  }
                } catch (pkgErr) {
                  console.log('[AddPendingPayment] Error fetching package model:', pkgErr);
                }
              }
            }
            
            if (matchingPackageIndex !== -1) {
              const pkg = patient.packages[matchingPackageIndex];
              const newPackagePaid = (pkg.paidAmount || 0) + paymentForInvoice;
              const totalPrice = pkg.totalPrice || 0;
              
              // Update package in patient's packages array
              patient.packages[matchingPackageIndex].paidAmount = newPackagePaid;
              patient.packages[matchingPackageIndex].paymentMethod = paymentMethod || (multiplePayments && multiplePayments[0]?.paymentMethod);
              
              // Update payment status
              if (newPackagePaid >= totalPrice) {
                patient.packages[matchingPackageIndex].paymentStatus = 'Full';
              } else if (newPackagePaid > 0) {
                patient.packages[matchingPackageIndex].paymentStatus = 'Partial';
              } else {
                patient.packages[matchingPackageIndex].paymentStatus = 'Unpaid';
              }
              
              // Also update top-level package fields
              patient.packageId = patient.packageId || pkg.packageId;
              patient.packageTotalPrice = patient.packageTotalPrice || totalPrice;
              patient.packagePaidAmount = newPackagePaid;
              patient.packagePaymentStatus = patient.packages[matchingPackageIndex].paymentStatus;
              patient.packagePaymentMethod = patient.packages[matchingPackageIndex].paymentMethod;
              
              await patient.save();
              console.log('[AddPendingPayment] Updated patient package:', { matchingPackageIndex, newPackagePaid, paymentStatus: patient.packages[matchingPackageIndex].paymentStatus });
            }
          }
        } catch (packageError) {
          console.error('[AddPendingPayment] Error updating patient package:', packageError);
        }
      }

      // Check if invoice has unpaidPackagesPaid and update those packages
      if (invoice.unpaidPackagesPaid && Array.isArray(invoice.unpaidPackagesPaid) && invoice.unpaidPackagesPaid.length > 0) {
        try {
          console.log('[AddPendingPayment] Processing unpaidPackagesPaid from invoice:', invoice.invoiceNumber);
          
          const patient = await PatientRegistration.findById(patientId);
          if (patient && patient.packages) {
            for (const pkgPayment of invoice.unpaidPackagesPaid) {
              const { packageId, packageSubId, packageName } = pkgPayment;
              
              if (!packageId || !packageSubId) continue;
              
              // Find the package in patient's packages
              const packageIndex = patient.packages.findIndex(
                (pkg) => String(pkg._id) === String(packageSubId) && String(pkg.packageId) === String(packageId)
              );
              
              if (packageIndex !== -1) {
                const pkg = patient.packages[packageIndex];
                const totalPrice = pkg.totalPrice || 0;
                
                // Mark package as fully paid
                patient.packages[packageIndex].paidAmount = totalPrice;
                patient.packages[packageIndex].paymentStatus = 'Full';
                patient.packages[packageIndex].paymentMethod = paymentMethod || (multiplePayments && multiplePayments[0]?.paymentMethod);
                
                console.log('[AddPendingPayment] Marked package as paid:', {
                  packageId,
                  packageSubId,
                  packageName: packageName || pkg.packageName,
                  paymentStatus: 'Full',
                  paidAmount: totalPrice
                });
              }
            }
            
            await patient.save();
          }
        } catch (unpaidPkgError) {
          console.error('[AddPendingPayment] Error updating unpaidPackagesPaid:', unpaidPkgError);
        }
      }

      // Add to PettyCash if this invoice's payment method is Cash and we have cash payment
      // Determine the actual payment method used for this invoice
      let invoicePaymentMethod = paymentMethod || (multiplePayments && multiplePayments[0]?.paymentMethod);
      const cashPortionForInvoice = Math.min(paymentForInvoice, amountNum);
      if (invoicePaymentMethod === "Cash" && cashPortionForInvoice > 0) {
        try {
          const patient = await PatientRegistration.findById(patientId);
          const pettyCashEntry = new PettyCash({
            clinicId: clinicId,
            staffId: clinicUser._id,
            staffName: clinicUser.name || "Staff",
            patientId: patientId,
            patientName: patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : "Patient",
            patientFirstName: patient?.firstName || "",
            patientLastName: patient?.lastName || "",
            patientMobileNumber: patient?.mobileNumber || "",
            emrNumber: patient?.emrNumber || "",
            invoiceNumber: invoice.invoiceNumber,
            invoicedDate: invoice.invoicedDate,
            invoicedBy: invoice.invoicedBy,
            service: invoice.service,
            treatment: invoice.treatment,
            package: invoice.package,
            selectedPackageTreatments: invoice.selectedPackageTreatments || [],
            amount: invoice.amount,
            paid: paymentForInvoice,
            cashAmount: cashPortionForInvoice,
            paymentMethod: invoicePaymentMethod,
            multiplePayments: [{ paymentMethod: invoicePaymentMethod, amount: cashPortionForInvoice }]
          });
          
          await pettyCashEntry.save();
          await PettyCash.updateGlobalTotalAmount(clinicId, cashPortionForInvoice, 'add');
          console.log('[AddPendingPayment] Added to PettyCash:', pettyCashEntry._id);
        } catch (pettyCashError) {
          console.error('[AddPendingPayment] Error adding to PettyCash:', pettyCashError);
        }
      }
    }

    // Step 3: Create billing record for pending payment (audit trail)
    const invoiceNumber = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const initialMultiplePayments =
      multiplePayments && multiplePayments.length > 0
        ? multiplePayments
        : [{ paymentMethod, amount: amountNum }];

    const billing = new Billing({
      clinicId,
      patientId,
      appointmentId: null,
      invoiceNumber,
      invoicedBy: invoicedBy || clinicUser.name || "System",
      service: "Service",
      treatment: notes || "Pending Balance Payment",
      amount: totalPayment, // Total amount being paid (cash + advance)
      paid: amountNum, // Only cash received
      advanceUsed: advanceUsedNum, // Advance used
      pendingUsed: totalPayment, // This reduces the historical pending balance
      isAdvanceOnly: false, // Set to false so pendingUsed is included in balance calculation
      pending: 0, // Explicitly set to 0 to satisfy schema requirements
      paymentMethod: paymentMethod || initialMultiplePayments[0].paymentMethod,
      status: "Completed",
      multiplePayments: initialMultiplePayments,
      paymentHistory: [
        {
          amount: totalPayment,
          paid: amountNum,
          pending: 0,
          advanceUsed: advanceUsedNum,
          paymentMethod:
            paymentMethod || initialMultiplePayments[0].paymentMethod,
          multiplePayments: initialMultiplePayments,
          status: "Completed",
          updatedAt: new Date(),
        },
      ],
      notes: notes,
    });

    await billing.save();

    return res.status(200).json({
      success: true,
      message: "Pending payment recorded successfully, and pending invoices updated",
      data: billing,
    });
  } catch (error) {
    console.error("Error adding pending payment:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add pending payment",
    });
  }
}
