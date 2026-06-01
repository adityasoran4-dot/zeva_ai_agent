import dbConnect from "../../../lib/database";
import Billing from "../../../models/Billing";
import PatientRegistration from "../../../models/PatientRegistration";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import Appointment from "../../../models/Appointment";
import Referral from "../../../models/Referral";
import Commission from "../../../models/Commission";
import AgentProfile from "../../../models/AgentProfile";
import { getUserFromReq } from "../lead-ms/auth";
import { checkClinicPermission } from "../lead-ms/permissions-helper";
import { checkAgentPermission } from "../agent/permissions-helper";
import { calculateCommissionForStaff, calculateBankDeduction } from "../../../lib/commissionCalculator";

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

    // ✅ Check permissions for creating patients (admin bypasses all checks)
    if (clinicUser.role !== "admin") {
      // For clinic role: Check clinic permissions
      if (clinicUser.role === "clinic") {
        const clinic = await Clinic.findOne({ owner: clinicUser._id });
        if (clinic) {
          const { hasPermission: clinicHasPermission, error: clinicError } =
            await checkClinicPermission(
              clinic._id,
              "patient_registration",
              "create",
            );
          if (!clinicHasPermission) {
            return res.status(403).json({
              success: false,
              message:
                clinicError || "You do not have permission to create patients",
            });
          }
        }
      }
      // For agent role (agentToken): Check agent permissions
      else if (clinicUser.role === "agent") {
        const { hasPermission: agentHasPermission, error: agentError } =
          await checkAgentPermission(
            clinicUser._id,
            "patient_registration",
            "create",
          );

        // Fallback: Check clinic_Appointment or clinic_ScheduledAppointment if patient_registration is denied
        if (!agentHasPermission) {
          let appointmentHasPermission = false;
          
          // Check clinic_Appointment first
          const { hasPermission: app1 } = await checkAgentPermission(
            clinicUser._id,
            "clinic_Appointment",
            "create",
          );
          if (app1) {
            appointmentHasPermission = true;
          } else {
            // Fallback to clinic_ScheduledAppointment for backward compatibility
            const { hasPermission: app2 } = await checkAgentPermission(
              clinicUser._id,
              "clinic_ScheduledAppointment",
              "create",
            );
            appointmentHasPermission = app2;
          }

          if (!appointmentHasPermission) {
            return res.status(403).json({
              success: false,
              message:
                agentError || "You do not have permission to create patients",
            });
          }
        }
      }
      // For doctorStaff role (userToken): Check agent permissions
      else if (clinicUser.role === "doctorStaff") {
        const { hasPermission: agentHasPermission, error: agentError } =
          await checkAgentPermission(
            clinicUser._id,
            "patient_registration",
            "create",
          );

        // Fallback: Check clinic_Appointment or clinic_ScheduledAppointment if patient_registration is denied
        if (!agentHasPermission) {
          let appointmentHasPermission = false;
          
          // Check clinic_Appointment first
          const { hasPermission: app1 } = await checkAgentPermission(
            clinicUser._id,
            "clinic_Appointment",
            "create",
          );
          if (app1) {
            appointmentHasPermission = true;
          } else {
            // Fallback to clinic_ScheduledAppointment for backward compatibility
            const { hasPermission: app2 } = await checkAgentPermission(
              clinicUser._id,
              "clinic_ScheduledAppointment",
              "create",
            );
            appointmentHasPermission = app2;
          }

          if (!appointmentHasPermission) {
            return res.status(403).json({
              success: false,
              message:
                agentError || "You do not have permission to create patients",
            });
          }
        }
      }
    }

    // Find clinic
    let clinic;
    if (clinicUser.role === "clinic") {
      clinic = await Clinic.findOne({ owner: clinicUser._id });
    } else if (
      ["agent", "doctorStaff", "staff", "doctor"].includes(clinicUser.role)
    ) {
      if (!clinicUser.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "User not linked to a clinic" });
      }
      clinic = await Clinic.findById(clinicUser.clinicId);
    } else if (clinicUser.role === "admin") {
      // For admin, if no clinicId on user, try to get from appointment in body
      if (clinicUser.clinicId) {
        clinic = await Clinic.findById(clinicUser.clinicId);
      } else if (req.body.appointmentId) {
        const appointment = await Appointment.findById(req.body.appointmentId);
        if (appointment && appointment.clinicId) {
          clinic = await Clinic.findById(appointment.clinicId);
        }
      }
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!clinic) {
      return res
        .status(404)
        .json({ success: false, message: "Clinic not found" });
    }

      const {
        invoiceNumber,
        invoicedDate,
        appointmentId,
        firstName,
        lastName,
        email,
        mobileNumber,
        gender,
        doctor,
        service,
        treatment,
        package: packageName,
        quantity,
        sessions,
        amount,
        paid,
        pending,
        advance,
        advanceUsed,
        claimAmountUsed,
        pastAdvance,
        pastAdvanceUsed,
        applyPastAdvance,
        pendingClaimUsed, // Track pending claim amount being paid
        pastAdvanceUsed50Percent,
        pastAdvanceUsed54Percent,
        pastAdvanceUsed159Flat,
        pastAdvanceType,
        paymentMethod,
        notes,
        emrNumber,
        userId, // PatientRegistration ID from appointment (appointment.patientId)
        referredBy,
        selectedPackageTreatments, // Array of treatments with sessions used from package
        // Multiple payment methods for split payments
        multiplePayments, // Array of { paymentMethod, amount }
        pendingUsed, // Amount of previous pending being cleared
        // Membership tracking fields
        isFreeConsultation,
        freeConsultationCount,
        membershipDiscountApplied,
        isDoctorDiscountApplied,
        doctorDiscountType,
        doctorDiscountAmount,
        isAgentDiscountApplied,
        agentDiscountType,
        agentDiscountAmount,
        discountPercent,
        originalAmount,
        isUserPackage, // Added for user-created packages
        patientPackageId, // Added for user-created packages
        patientPackageSubId, // Added for user-created packages (sub-document ID)
        // Offer fields
        isOfferApplied,
        offerId,
        offerTitle,
        offerType,
        offerDiscountAmount,
        cashbackEarned,
        bundleSessionsAdded,
        // Bundle offer fields
        offerFreeSession,
        freeOfferSessionCount,
        // Free sessions being REDEEMED in this billing
        usedFreeSessions,
        usedFreeSessionCount,
        // Cashback offer fields
        isCashbackApplied,
        cashbackOfferId,
        cashbackOfferName,
        cashbackAmount,
        // Cashback WALLET usage (when patient uses previously earned cashback)
        cashbackWalletUsed,
        // Unpaid packages being paid in this billing
        unpaidPackagesPaid,
      } = req.body;

    console.log({ bmModify: req.body });
    console.log('[BundleAPI] Extracted offerFreeSession:', offerFreeSession);
    console.log('[BundleAPI] Extracted freeOfferSessionCount:', freeOfferSessionCount);

    // Validate required fields
    if (
      !invoiceNumber ||
      !appointmentId ||
      !firstName ||
      !mobileNumber ||
      !doctor ||
      !service
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if invoice number already exists
    const existingInvoice = await Billing.findOne({ invoiceNumber });
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: "Invoice number already exists",
      });
    }

    // userId in payload is actually PatientRegistration _id
    // Find existing PatientRegistration record
    let patientRegistration;

    if (userId) {
      // userId is the PatientRegistration _id
      patientRegistration = await PatientRegistration.findById(userId);

      if (!patientRegistration) {
        return res.status(404).json({
          success: false,
          message: "Patient registration not found",
        });
      }
    } else {
      // If no userId provided, try to find by mobile number
      patientRegistration = await PatientRegistration.findOne({
        mobileNumber,
      }).sort({ createdAt: -1 }); // Get the latest one

      if (!patientRegistration) {
        return res.status(404).json({
          success: false,
          message:
            "Patient registration not found. Please register the patient first.",
        });
      }
    }

    // Get the actual user from PatientRegistration
    const patientUser = await User.findById(patientRegistration.userId);
    if (!patientUser) {
      return res.status(404).json({
        success: false,
        message: "Patient user not found",
      });
    }

    console.log("=== DEBUG BILLING PACKAGE ===");
    console.log("Service:", service);
    console.log("Package Name:", packageName);
    console.log("isUserPackage:", isUserPackage);
    console.log("patientPackageId:", patientPackageId);
    console.log("PatientRegistration ID (userId):", userId);

    const hasPendingAmount = (pendingUsed && parseFloat(pendingUsed) > 0) || 
                              (pendingClaimUsed && parseFloat(pendingClaimUsed) > 0) || 
                              (unpaidPackagesPaid && Array.isArray(unpaidPackagesPaid) && unpaidPackagesPaid.length > 0);

    if (service === "Package" && !hasPendingAmount) {
      if (
        !packageName ||
        !Array.isArray(selectedPackageTreatments) ||
        selectedPackageTreatments.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Please select a package and at least one treatment",
        });
      }
      const Package = (await import("../../../models/Package")).default;
      const UserPackage = (await import("../../../models/UserPackage")).default;

      let pkgDoc;
      if (isUserPackage && (patientPackageId || patientPackageSubId)) {
        console.log("Looking up UserPackage with primary ID:", patientPackageId, "or sub-ID:", patientPackageSubId);
        
        // Try looking up by primary ID first (actual UserPackage document ID)
        if (patientPackageId) {
          pkgDoc = await UserPackage.findById(patientPackageId).lean();
        }
        
        console.log("Initial UserPackage lookup result:", pkgDoc ? "Found" : "NOT FOUND");
        
        // If not found, try looking into patientRegistration.userPackages
        if (!pkgDoc && patientRegistration && patientRegistration.userPackages) {
          console.log("Checking PatientRegistration.userPackages for match...");
          const matchInPatient = patientRegistration.userPackages.find(
            up => (patientPackageId && String(up.packageId) === String(patientPackageId)) || 
                  (patientPackageSubId && String(up._id) === String(patientPackageSubId)) ||
                  (patientPackageId && String(up._id) === String(patientPackageId))
          );
          
          if (matchInPatient) {
            console.log("Found match in PatientRegistration.userPackages:", matchInPatient);
            // Re-try using the actual packageId from the sub-document
            pkgDoc = await UserPackage.findById(matchInPatient.packageId).lean();
            console.log("Retry UserPackage lookup with matchInPatient.packageId:", pkgDoc ? "Found" : "NOT FOUND");
          }
        }
      } else {
        console.log("Looking up regular Package with name:", packageName, "and clinicId:", clinic._id);
        // Otherwise, find it by clinicId and name in the regular Package model
        pkgDoc = await Package.findOne({
          clinicId: clinic._id,
          name: packageName,
        }).lean();
        console.log("Regular Package lookup result:", pkgDoc ? "Found" : "NOT FOUND");
      }

      if (!pkgDoc) {
        console.log("PACKAGE NOT FOUND - details:", {
          packageName,
          isUserPackage,
          patientPackageId,
          clinicId: clinic._id
        });
        return res.status(404).json({
          success: false,
          message: "Selected package not found",
        });
      }
      const maxSessionsMap = new Map();
      (pkgDoc.treatments || []).forEach((t) => {
        if (t.treatmentSlug) {
          maxSessionsMap.set(t.treatmentSlug, parseInt(t.sessions) || 0);
        }
      });

      const previousBillingsQuery = {
        clinicId: clinic._id,
        patientId: patientRegistration._id,
        service: "Package",
      };

      if (isUserPackage && (patientPackageId || patientPackageSubId)) {
        previousBillingsQuery.$or = [
          { patientPackageId: patientPackageId },
          { patientPackageSubId: patientPackageSubId }
        ];
      } else {
        previousBillingsQuery.package = packageName;
      }

      const previousBillings = await Billing.find(previousBillingsQuery)
        .select("selectedPackageTreatments")
        .lean();
      const previouslyUsedMap = new Map();
      previousBillings.forEach((b) => {
        (b.selectedPackageTreatments || []).forEach((t) => {
          if (!t.treatmentSlug) return;
          const prev = previouslyUsedMap.get(t.treatmentSlug) || 0;
          previouslyUsedMap.set(
            t.treatmentSlug,
            prev + (parseInt(t.sessions) || 0),
          );
        });
      });
      for (const t of selectedPackageTreatments) {
        const slug = t.treatmentSlug;
        const newSessions = parseInt(t.sessions) || 0;
        const maxSessions = maxSessionsMap.get(slug);
        if (maxSessions === undefined) {
          return res.status(400).json({
            success: false,
            message: `Treatment not part of package: ${t.treatmentName || slug}`,
          });
        }
        const previouslyUsed = previouslyUsedMap.get(slug) || 0;
        const remaining = Math.max(0, (maxSessions || 0) - previouslyUsed);
        if (remaining <= 0) {
          return res.status(400).json({
            success: false,
            message: "This treatment has already used all available sessions.",
            details: {
              treatmentSlug: slug,
              treatmentName: t.treatmentName,
              totalSessions: maxSessions,
              usedSessions: previouslyUsed,
              remainingSessions: 0,
            },
          });
        }
        if (newSessions < 1 || newSessions > remaining) {
          return res.status(400).json({
            success: false,
            message: `Invalid session count for ${t.treatmentName || slug}. You can bill 1–${remaining} session(s).`,
            details: {
              treatmentSlug: slug,
              treatmentName: t.treatmentName,
              totalSessions: maxSessions,
              usedSessions: previouslyUsed,
              remainingSessions: remaining,
              requestedSessions: newSessions,
            },
          });
        }
      }
      const sumSessions = selectedPackageTreatments.reduce(
        (sum, it) => sum + (parseInt(it.sessions) || 0),
        0,
      );
      req.body.sessions = sumSessions;
    }

    // Calculate pending and advance (use provided values or calculate)
    const amountNum = parseFloat(amount) || 0;
    const advanceUsedNum =
      advanceUsed !== undefined ? Math.max(0, parseFloat(advanceUsed) || 0) : 0;
    const claimAmountUsedNum =
      claimAmountUsed !== undefined ? Math.max(0, parseFloat(claimAmountUsed) || 0) : 0;
    const pastAdvanceUsedNum =
      pastAdvanceUsed !== undefined
        ? Math.max(0, parseFloat(pastAdvanceUsed) || 0)
        : 0;
    const pastAdvanceUsed50PercentNum =
      pastAdvanceUsed50Percent !== undefined
        ? Math.max(0, parseFloat(pastAdvanceUsed50Percent) || 0)
        : 0;
    const pastAdvanceUsed54PercentNum =
      pastAdvanceUsed54Percent !== undefined
        ? Math.max(0, parseFloat(pastAdvanceUsed54Percent) || 0)
        : 0;
    const pastAdvanceUsed159FlatNum =
      pastAdvanceUsed159Flat !== undefined
        ? Math.max(0, parseFloat(pastAdvanceUsed159Flat) || 0)
        : 0;

    const totalPastAdvanceUsed =
      pastAdvanceUsed50PercentNum +
      pastAdvanceUsed54PercentNum +
      pastAdvanceUsed159FlatNum;
    const pendingUsedNum =
      pendingUsed !== undefined ? Math.max(0, parseFloat(pendingUsed) || 0) : 0;
    const pendingClaimUsedNum =
      pendingClaimUsed !== undefined ? Math.max(0, parseFloat(pendingClaimUsed) || 0) : 0;
    const pendingNum = pending !== undefined ? parseFloat(pending) || 0 : 0;
    const advanceNum = advance !== undefined ? parseFloat(advance) || 0 : 0;
    const pastAdvanceNum =
      pastAdvance !== undefined ? parseFloat(pastAdvance) || 0 : 0;

    // Calculate paid from multiple payments if provided
    let paidNum = parseFloat(paid) || 0;
    const multiPayArr =
      Array.isArray(multiplePayments) && multiplePayments.length > 0
        ? multiplePayments
        : [];
    if (multiPayArr.length > 0) {
      paidNum = multiPayArr.reduce(
        (sum, mp) => sum + (parseFloat(mp.amount) || 0),
        0,
      );
    }

    // Auto-calculate if pending/advance/pastAdvance are not explicitly provided
    // or ensure they follow the standard logic
    let finalPending = parseFloat(pending) || 0;
    let finalAdvance = parseFloat(advance) || 0;
    let finalPastAdvance = Math.max(0, pastAdvanceNum - pastAdvanceUsedNum);

    // Standard logic for billing calculation:
    // 1. Total Amount
    // 2. Applied Credits (advanceUsed + pastAdvanceUsed)
    // 3. Net Due = Total - Credits
    // 4. Final Pending = Net Due - Paid (if Net Due > Paid)
    // 5. Final Advance = Paid - Net Due (if Paid > Net Due)

    const netDue = Math.max(
      0,
      amountNum - advanceUsedNum - claimAmountUsedNum - totalPastAdvanceUsed,
    );
    console.log({ netDue, paidNum, advanceUsedNum, claimAmountUsedNum, pastAdvanceUsedNum });

    if (paidNum > netDue) {
      finalAdvance = paidNum - netDue;
      finalPending = 0;
    } else {
      finalPending = netDue - paidNum;
      finalAdvance = 0;
    }

    // Use the calculated final values for storage
    const pendingToStore = finalPending;
    const advanceToStore = finalAdvance;

    // Calculate cashback validity dates if cashback is applied
    let cashbackStartDate = null;
    let cashbackEndDate = null;
    if (isCashbackApplied && cashbackAmount && cashbackAmount > 0) {
      // Use dynamic import for ES6 modules
      const CreateOfferModule = await import('../../../models/CreateOffer');
      const CreateOffer = CreateOfferModule.default;
      const cashbackOffer = cashbackOfferId ? await CreateOffer.findById(cashbackOfferId).lean() : null;
      const cashbackExpiryDays = cashbackOffer?.cashbackExpiryDays || 365; // Default to 1 year if not set
      
      cashbackStartDate = new Date(invoicedDate);
      cashbackStartDate.setHours(0, 0, 0, 0); // Normalize to start of day
      
      cashbackEndDate = new Date(invoicedDate);
      cashbackEndDate.setHours(23, 59, 59, 999); // Normalize to end of day
      // Strictly X days from the purchase date
      cashbackEndDate.setDate(cashbackEndDate.getDate() + cashbackExpiryDays);
      
      console.log('[CashbackAPI] Cashback validity period:', {
        invoicedDate,
        cashbackStartDate: cashbackStartDate.toISOString(),
        cashbackExpiryDays,
        cashbackEndDate: cashbackEndDate.toISOString(),
        calculation: `Start Date + ${cashbackExpiryDays} days = End Date`
      });
    }

    // Create billing record
    const billingData = {
      clinicId: clinic._id,
      appointmentId: appointment._id,
      patientId: patientRegistration._id,
      invoiceNumber,
      invoicedDate: new Date(invoicedDate),
      invoicedBy: clinicUser.name || "Clinic Staff",
      invoicedById: clinicUser._id,
      doctorId: appointment.doctorId || null,
      service,
      treatment: service === "Treatment" ? treatment || "" : "",
      package: service === "Package" ? packageName || "" : "",
      patientPackageId: service === "Package" && isUserPackage && patientPackageId ? patientPackageId : null,
      patientPackageSubId: service === "Package" && isUserPackage && patientPackageSubId ? patientPackageSubId : null,
      quantity: service === "Treatment" ? parseInt(quantity) || 1 : 1,
      sessions: service === "Package" ? parseInt(sessions) || 0 : 0,
      selectedPackageTreatments:
        service === "Package" && Array.isArray(selectedPackageTreatments)
          ? selectedPackageTreatments
          : [],
      // Track unpaid packages paid in this billing
      unpaidPackagesPaid: Array.isArray(unpaidPackagesPaid) 
        ? unpaidPackagesPaid 
        : [],
      amount: amountNum,
      paid: paidNum, // ONLY store actual money received today (not credits)
      advanceUsed: advanceUsedNum, // Use the parsed number
      claimAmountUsed: claimAmountUsedNum, // Use the parsed number
      pendingUsed: pendingUsedNum, // Use the parsed number
      pendingClaimUsed: pendingClaimUsedNum, // Track pending claim amount paid
      pastAdvanceUsed: totalPastAdvanceUsed,
      pastAdvanceUsed50Percent: pastAdvanceUsed50PercentNum,
      pastAdvanceUsed54Percent: pastAdvanceUsed54PercentNum,
      pastAdvanceUsed159Flat: pastAdvanceUsed159FlatNum,
      pastAdvanceType,
      pending: pendingToStore,
      advance: advanceToStore,
      pastAdvance: finalPastAdvance,
      paymentMethod,
      multiplePayments: multiPayArr.map((mp) => ({
        paymentMethod: mp.paymentMethod,
        amount: parseFloat(mp.amount) || 0,
      })),
      paymentHistory: [
        {
          amount: amountNum,
          paid: paidNum,
          pending: finalPending,
          paymentMethod,
          multiplePayments: multiPayArr.map((mp) => ({
            paymentMethod: mp.paymentMethod,
            amount: parseFloat(mp.amount) || 0,
          })),
          status: "Active",
          updatedAt: new Date(),
        },
      ],
      notes: notes || "",
      // Membership tracking fields
      isFreeConsultation: isFreeConsultation || false,
      freeConsultationCount: freeConsultationCount || 0,
      membershipDiscountApplied: membershipDiscountApplied || 0,
      isDoctorDiscountApplied: isDoctorDiscountApplied || false,
      doctorDiscountType: doctorDiscountType || null,
      doctorDiscountAmount: doctorDiscountAmount || 0,
      isAgentDiscountApplied: isAgentDiscountApplied || false,
      agentDiscountType: agentDiscountType || null,
      agentDiscountAmount: agentDiscountAmount || 0,
      discountPercent: discountPercent || 0,
      originalAmount: originalAmount || amountNum,
      isAdvanceOnly: false,
      // Offer tracking fields
      offerApplied: isOfferApplied || false,
      offerId: offerId || null,
      offerName: offerTitle || null,
      offerType: offerType || null,
      offerDiscountAmount: offerDiscountAmount || 0,
      cashbackEarned: cashbackEarned || 0,
      bundleSessionsAdded: bundleSessionsAdded || 0,
      // Bundle offer tracking fields
      offerFreeSession: Array.isArray(offerFreeSession) ? offerFreeSession : [],
      freeOfferSessionCount: freeOfferSessionCount || 0,
      // Free sessions being REDEEMED in this billing (consumed from previous billings)
      usedFreeSessions: Array.isArray(usedFreeSessions) ? usedFreeSessions : [],
      usedFreeSessionCount: usedFreeSessionCount || 0,
      // Cashback offer tracking fields
      isCashbackApplied: isCashbackApplied || false,
      cashbackOfferId: cashbackOfferId || null,
      cashbackOfferName: cashbackOfferName || null,
      cashbackAmount: cashbackAmount || 0,
      // Cashback validity period - calculated above based on offer's cashbackExpiryDays
      cashbackStartDate: cashbackStartDate,
      cashbackEndDate: cashbackEndDate,
      // Cashback WALLET usage (when patient uses previously earned cashback)
      cashbackWalletUsed: cashbackWalletUsed || 0,
    };

    // console.log({ billingData });
    // console.log('[BundleAPI] billingData.offerFreeSession:', billingData.offerFreeSession);
    // console.log('[BundleAPI] billingData.freeOfferSessionCount:', billingData.freeOfferSessionCount);
    // console.log('[BundleAPI] typeof billingData.offerFreeSession:', typeof billingData.offerFreeSession);
    // console.log('[BundleAPI] Array.isArray(billingData.offerFreeSession):', Array.isArray(billingData.offerFreeSession));
    console.log('[BundleAPI] usedFreeSessions (being redeemed):', usedFreeSessions);
    console.log('[BundleAPI] usedFreeSessionCount:', usedFreeSessionCount);
    console.log('[BundleAPI] billingData.usedFreeSessions:', billingData.usedFreeSessions);
    console.log('[BundleAPI] billingData.usedFreeSessionCount:', billingData.usedFreeSessionCount);

    const billing = await Billing.create(billingData);
    
    // Explicitly verify the cashback fields were saved
    const savedBilling = await Billing.findById(billing._id).lean();
    console.log('[CashbackAPI] Saved billing isCashbackApplied:', savedBilling?.isCashbackApplied);
    console.log('[CashbackAPI] Saved billing cashbackAmount:', savedBilling?.cashbackAmount);
    console.log('[CashbackAPI] Saved billing cashbackOfferName:', savedBilling?.cashbackOfferName);
    console.log('[CashbackAPI] Saved billing has isCashbackApplied key:', 'isCashbackApplied' in (savedBilling || {}));
    console.log('[CashbackAPI] Saved billing has cashbackAmount key:', 'cashbackAmount' in (savedBilling || {}));
    console.log('[CashbackAPI] Saved billing cashbackStartDate:', savedBilling?.cashbackStartDate);
    console.log('[CashbackAPI] Saved billing cashbackEndDate:', savedBilling?.cashbackEndDate);
    console.log('[CashbackAPI] Saved billing has cashbackStartDate key:', 'cashbackStartDate' in (savedBilling || {}));
    console.log('[CashbackAPI] Saved billing has cashbackEndDate key:', 'cashbackEndDate' in (savedBilling || {}));
    console.log('[FreeSessionAPI] Saved billing usedFreeSessions:', savedBilling?.usedFreeSessions);
    console.log('[FreeSessionAPI] Saved billing usedFreeSessionCount:', savedBilling?.usedFreeSessionCount);
    console.log('[FreeSessionAPI] Saved billing offerFreeSession:', savedBilling?.offerFreeSession);
    console.log('[FreeSessionAPI] Saved billing freeOfferSessionCount:', savedBilling?.freeOfferSessionCount);

    // If free sessions are being REDEEMED, update previous billings to remove them
    if (usedFreeSessions && Array.isArray(usedFreeSessions) && usedFreeSessions.length > 0) {
      console.log('[BundleAPI] Consuming free sessions:', usedFreeSessions);
      
      // Find all previous billings for this patient with free sessions
      const previousBillings = await Billing.find({
        patientId: userId,  // Use userId from request body
        offerType: 'bundle',
        freeOfferSessionCount: { $gt: 0 },
        _id: { $ne: billing._id } // Exclude current billing
      }).sort({ createdAt: 1 }); // Oldest first (FIFO)

      console.log('[BundleAPI] Found', previousBillings.length, 'previous billings with free sessions');

      // Consume free sessions from previous billings (FIFO)
      let sessionsToConsume = [...usedFreeSessions];
      
      for (const prevBilling of previousBillings) {
        if (sessionsToConsume.length === 0) break;
        
        const currentFreeSessions = prevBilling.offerFreeSession || [];
        const updatedSessions = [];
        let consumedFromThisBilling = 0;

        for (const session of currentFreeSessions) {
          const sessionIndex = sessionsToConsume.findIndex(
            (s) => s.toLowerCase() === session.toLowerCase()
          );
          
          if (sessionIndex !== -1) {
            // This session is being redeemed, remove it
            sessionsToConsume.splice(sessionIndex, 1);
            consumedFromThisBilling++;
            console.log(`[BundleAPI] Consumed free session "${session}" from billing ${prevBilling.invoiceNumber}`);
          } else {
            // Keep this session
            updatedSessions.push(session);
          }
        }

        // Update the previous billing if sessions were consumed
        if (consumedFromThisBilling > 0) {
          await Billing.findByIdAndUpdate(prevBilling._id, {
            $set: {
              offerFreeSession: updatedSessions,
              freeOfferSessionCount: updatedSessions.length
            }
          });
          console.log(`[BundleAPI] Updated billing ${prevBilling.invoiceNumber}: ${consumedFromThisBilling} sessions consumed, ${updatedSessions.length} remaining`);
        }
      }

      if (sessionsToConsume.length > 0) {
        console.warn('[BundleAPI] Warning: Could not find free sessions for:', sessionsToConsume);
      } else {
        console.log('[BundleAPI] All free sessions successfully consumed!');
      }
    }

    // If patient is using cashback from wallet, deduct it
    if (cashbackWalletUsed && cashbackWalletUsed > 0) {
      console.log('[CashbackWalletAPI] Deducting cashback from wallet:', { 
        patientId: userId, 
        amount: cashbackWalletUsed,
        invoiceNumber: invoiceNumber
      });
      
      try {
        const PatientRegistration = require('../../../models/PatientRegistration');
        
        // Find the patient
        const patient = await PatientRegistration.findById(userId);
        if (patient) {
          const currentWalletBalance = patient.walletBalance || 0;
          
          // Check if patient has enough balance
          if (currentWalletBalance < cashbackWalletUsed) {
            console.error('[CashbackWalletAPI] Insufficient wallet balance:', {
              current: currentWalletBalance,
              requested: cashbackWalletUsed
            });
          } else {
            // Deduct from wallet balance
            const newWalletBalance = Math.max(0, currentWalletBalance - cashbackWalletUsed);
            
            await PatientRegistration.findByIdAndUpdate(userId, {
              $set: {
                walletBalance: newWalletBalance,
                updatedAt: new Date()
              },
              $push: {
                walletTransactions: {
                  amount: cashbackWalletUsed,
                  type: 'debit',
                  source: 'cashback_usage',
                  billingId: billing._id,
                  invoiceNumber: invoiceNumber,
                  description: `Cashback used for billing ${invoiceNumber}`,
                  createdAt: new Date()
                }
              }
            });
            
            console.log('[CashbackWalletAPI] Wallet debited successfully. New balance:', newWalletBalance);
            
            // If wallet balance is now 0, also clear the expiry date
            if (newWalletBalance === 0) {
              await PatientRegistration.findByIdAndUpdate(userId, {
                $set: {
                  walletCreditExpiry: null
                }
              });
              console.log('[CashbackWalletAPI] Wallet balance is 0, cleared expiry date');
            }
          }
        } else {
          console.warn('[CashbackWalletAPI] Patient not found:', userId);
        }
      } catch (walletError) {
        console.error('[CashbackWalletAPI] Error deducting from wallet:', walletError);
        // Don't fail the billing if wallet update fails
      }
    }

    // If cashback is applied, credit the patient's wallet
    if (isCashbackApplied && cashbackAmount && cashbackAmount > 0) {
      console.log('[CashbackAPI] Crediting wallet:', { patientId: userId, amount: cashbackAmount, offerName: cashbackOfferName });
      
      try {
        // Fetch the offer to get cashbackExpiryDays
        const CreateOfferModule = await import('../../../models/CreateOffer');
        const CreateOffer = CreateOfferModule.default;
        const cashbackOffer = cashbackOfferId ? await CreateOffer.findById(cashbackOfferId).lean() : null;
        const cashbackExpiryDays = cashbackOffer?.cashbackExpiryDays || 365; // Default to 1 year if not set
        
        console.log('[CashbackAPI] Cashback offer details:', {
          offerName: cashbackOffer?.title,
          cashbackAmount: cashbackOffer?.cashbackAmount,
          cashbackExpiryDays: cashbackExpiryDays
        });
        
        // Update PatientRegistration with wallet credit
        const PatientRegistration = require('../../../models/PatientRegistration');
        
        // Find the patient
        const patient = await PatientRegistration.findById(userId);
        if (patient) {
          // Add to wallet balance
          const currentWalletBalance = patient.walletBalance || 0;
          const newWalletBalance = currentWalletBalance + cashbackAmount;
          
          // Use the cashbackEndDate from billing record (calculated from invoicedDate)
          const walletCreditExpiry = cashbackEndDate || new Date();
          
          await PatientRegistration.findByIdAndUpdate(userId, {
            $set: {
              walletBalance: newWalletBalance,
              walletCreditExpiry: walletCreditExpiry,
              updatedAt: new Date()
            },
            $push: {
              walletTransactions: {
                amount: cashbackAmount,
                type: 'credit',
                source: 'cashback',
                offerId: cashbackOfferId,
                offerName: cashbackOfferName,
                billingId: billing._id,
                invoiceNumber: billing.invoiceNumber,
                description: `Cashback earned from ${cashbackOfferName || 'offer'}`,
                expiryDate: walletCreditExpiry,
                createdAt: new Date()
              }
            }
          });
          
          console.log('[CashbackAPI] Wallet credited successfully. New balance:', newWalletBalance);
          console.log('[CashbackAPI] Wallet credit expires:', walletCreditExpiry);
        } else {
          console.warn('[CashbackAPI] Patient not found:', userId);
        }
      } catch (walletError) {
        console.error('[CashbackAPI] Error crediting wallet:', walletError);
        // Don't fail the billing if wallet update fails
      }
    }

    // Helper to map payment method names to bankDetails keys
    const getBankPaymentDetails = (paymentMethodName) => {
      const methodMap = {
        "Card": "card",
        "Bank Transfer": "bankTransfer",
        "BT": "bankTransfer",
        "Tabby": "tabby",
        "Tamara": "tamara"
      };
      const key = methodMap[paymentMethodName];
      if (key && clinic.bankDetails && clinic.bankDetails[key]) {
        return clinic.bankDetails[key];
      }
      return { enabled: false };
    };

    // Get the selected payment method's bank details
    let selectedBankPaymentDetails = getBankPaymentDetails(paymentMethod);
    console.log("[CreatePatientRegistration] Selected payment method:", paymentMethod);
    console.log("[CreatePatientRegistration] Selected bank payment details (clinic-level):", selectedBankPaymentDetails);

    // Check if we have a doctor/agent, get their bank permissions
    if (appointment?.doctorId && selectedBankPaymentDetails.enabled) {
      console.log("[CreatePatientRegistration] Checking agent/doctor bank permissions for doctorId:", appointment.doctorId);
      try {
        const agentProfile = await AgentProfile.findOne({ userId: appointment.doctorId });
        console.log("[CreatePatientRegistration] Fetched agent profile:", agentProfile);
        if (agentProfile) {
          console.log("[CreatePatientRegistration] Agent profile bank permissions:", agentProfile.bankPermissions);
        }
        if (agentProfile && agentProfile.bankPermissions) {
          const methodMap = {
            "Card": "card",
            "Bank Transfer": "bankTransfer",
            "BT": "bankTransfer",
            "Tabby": "tabby",
            "Tamara": "tamara"
          };
          const key = methodMap[paymentMethod];
          console.log("[CreatePatientRegistration] Payment method key:", key);
          if (key && agentProfile.bankPermissions[key]) {
            console.log("[CreatePatientRegistration] Doctor/agent has bank permission enabled for this method, keeping clinic-level settings");
          } else if (key && !agentProfile.bankPermissions[key]) {
            console.log("[CreatePatientRegistration] Doctor/agent has bank permission disabled for this method, disabling globally");
            selectedBankPaymentDetails = { enabled: false };
          }
        }
      } catch (err) {
        console.error("[CreatePatientRegistration] Error getting agent profile for bank permissions:", err);
      }
    }
    console.log("[CreatePatientRegistration] Final selected bank payment details:", selectedBankPaymentDetails);
    const earnedAmountForCommission = amountNum; // Amount before any deductions
    
    // Calculate commissionable amount: paidNum minus pendingUsed (since pendingUsed is clearing past debt, not new payment)
    const commissionablePaidAmount = Math.max(0, paidNum - pendingUsedNum);
    console.log("[CreatePatientRegistration] Original paid amount:", paidNum);
    console.log("[CreatePatientRegistration] Pending used amount:", pendingUsedNum);
    console.log("[CreatePatientRegistration] Commissionable paid amount (after pendingUsed deduction):", commissionablePaidAmount);

    // Track referral commission amount (will be used to adjust doctor/staff commission if both are applicable
    let referralCommissionAmount = 0;
    
    // Commission calculation and storage
    try {
      const paidNumForCommission = commissionablePaidAmount;
      const referredByStr = String(referredBy || "").trim();
      if (
        paidNumForCommission > 0 &&
        referredByStr &&
        referredByStr.toLowerCase() !== "no"
      ) {
        // Find referral by combined name within this clinic
        const referrals = await Referral.find({ clinicId: clinic._id }).lean();
        const match = referrals.find((r) => {
          const full =
            `${(r.firstName || "").trim()} ${(r.lastName || "").trim()}`
              .trim()
              .toLowerCase();
          return full && full === referredByStr.toLowerCase();
        });
        if (match) {
          const commissionPercent = Number(match.referralPercent || 0);
          if (commissionPercent > 0) {
            // Check if we need to apply bank deduction before or after commission
            const applyDeductionAfterCommission = selectedBankPaymentDetails.enabled && selectedBankPaymentDetails.applyOn === "earned";
            console.log("[CreatePatientRegistration] Referral: applyDeductionAfterCommission:", applyDeductionAfterCommission);
            
            let adjustedAmount = paidNumForCommission;
            let bankDeductionResult = {
              enabled: false,
              type: null,
              value: null,
              applyOn: null,
              deductionAmount: 0,
              finalEarnedAmount: earnedAmountForCommission,
              finalPaidAmount: paidNumForCommission,
              deductionApplied: false
            };

            if (selectedBankPaymentDetails.enabled && !applyDeductionAfterCommission) {
              // Apply bank deduction first (applyOn: paid)
              console.log("[CreatePatientRegistration] Calculating referral commission with bank deductions BEFORE commission");
              bankDeductionResult = calculateBankDeduction({
                earnedAmount: earnedAmountForCommission,
                paidAmount: paidNumForCommission,
                bankPaymentDetails: selectedBankPaymentDetails
              });
              console.log("[CreatePatientRegistration] Referral bank deduction result:", bankDeductionResult);
              adjustedAmount = bankDeductionResult.finalPaidAmount;
            } else if (applyDeductionAfterCommission) {
              console.log("[CreatePatientRegistration] Will apply bank deductions AFTER referral commission");
            }

            // Calculate referral commission (based on full paid amount)
            let commissionAmount = Number(
              ((adjustedAmount * commissionPercent) / 100).toFixed(2)
            );
            console.log("[CreatePatientRegistration] Original referral commission amount before deduction:", commissionAmount);

            // Now apply bank deduction to commission amount if applyOn is "earned"
            if (applyDeductionAfterCommission) {
              console.log("[CreatePatientRegistration] Applying bank deduction AFTER referral commission (applyOn: earned)");
              
              let deductionAmount = 0;
              console.log("[CreatePatientRegistration] Referral bank payment details for deduction:", {
                type: selectedBankPaymentDetails.type,
                value: selectedBankPaymentDetails.value
              });
              
              if (selectedBankPaymentDetails.type === "flat") {
                deductionAmount = Number(selectedBankPaymentDetails.value);
                console.log(`[CreatePatientRegistration] Applying flat deduction: ${deductionAmount}`);
              } else if (selectedBankPaymentDetails.type === "percentage") {
                deductionAmount = (commissionAmount * Number(selectedBankPaymentDetails.value)) / 100;
                console.log(`[CreatePatientRegistration] Applying percentage deduction: ${selectedBankPaymentDetails.value}% of ${commissionAmount} = ${deductionAmount}`);
              }
              
              // Apply deduction
              commissionAmount = Math.max(0, commissionAmount - deductionAmount);
              commissionAmount = Number(commissionAmount.toFixed(2));
              
              bankDeductionResult = {
                enabled: true,
                type: selectedBankPaymentDetails.type,
                value: selectedBankPaymentDetails.value,
                applyOn: selectedBankPaymentDetails.applyOn,
                deductionAmount: Number(deductionAmount.toFixed(2)),
                finalEarnedAmount: earnedAmountForCommission,
                finalPaidAmount: paidNumForCommission,
                deductionApplied: true
              };
              
              console.log("[CreatePatientRegistration] Referral bank deduction on commission:", {
                deductionAmount,
                finalCommissionAmount: commissionAmount
              });
            }

            console.log("[CreatePatientRegistration] Final referral commission amount:", commissionAmount);
            
            // Store referral commission amount to adjust doctor/staff commission
            referralCommissionAmount = Number(commissionAmount);
            
            // Optionally try to map to a staff user via email or phone
            let staffId = null;
            if (match.email || match.phone) {
              const userCandidate = await User.findOne({
                clinicId: clinic._id,
                $or: [
                  match.email
                    ? { email: String(match.email).toLowerCase() }
                    : { _id: null },
                  match.phone ? { phone: String(match.phone) } : { _id: null },
                ],
              }).lean();
              if (userCandidate) {
                staffId = userCandidate._id;
              }
            }
            // Set commission base amount: original paid amount if applyOn is earned, adjusted amount if applyOn is paid
            const referralCommissionBase = selectedBankPaymentDetails.enabled && selectedBankPaymentDetails.applyOn === "paid" ? adjustedAmount : paidNumForCommission;
            await Commission.create({
              clinicId: clinic._id,
              source: "referral",
              referralId: match._id,
              referralName:
                `${(match.firstName || "").trim()} ${(match.lastName || "").trim()}`.trim(),
              staffId,
              appointmentId: appointment._id,
              patientId: patientRegistration._id,
              billingId: billing._id,
              commissionPercent,
              amountPaid: paidNumForCommission,
              commissionAmount,
              commissionBaseAmount: referralCommissionBase,
              finalCommissionAmount: commissionAmount,
              invoicedDate: new Date(invoicedDate),
              notes: notes || "",
              createdBy: clinicUser._id,
              paymentMethod: paymentMethod,
              bankDeduction: {
                enabled: selectedBankPaymentDetails.enabled,
                type: selectedBankPaymentDetails.type,
                value: selectedBankPaymentDetails.value,
                applyOn: selectedBankPaymentDetails.applyOn,
                deductionAmount: bankDeductionResult.deductionAmount
              }
            });
          }
        }
      }
    } catch (commissionErr) {
      console.error(
        "Commission calculation/store error (referral):",
        commissionErr,
      );
      // Do not fail the billing creation if commission creation fails
    }

    // Update package payment status if unpaid packages are being paid
    if (unpaidPackagesPaid && Array.isArray(unpaidPackagesPaid) && unpaidPackagesPaid.length > 0) {
      console.log('[PackagePaymentAPI] Updating package payment status for:', unpaidPackagesPaid);
      
      try {
        for (const pkgPayment of unpaidPackagesPaid) {
          const { packageId, packageSubId, amount, packageName } = pkgPayment;
          
          if (!packageId || !packageSubId) {
            console.warn('[PackagePaymentAPI] Skipping package with missing IDs:', pkgPayment);
            continue;
          }
          
          // Find the package in the patient's packages array and update it
          const patient = await PatientRegistration.findById(userId);
          
          if (patient && patient.packages && patient.packages.length > 0) {
            const packageIndex = patient.packages.findIndex(
              (pkg) => String(pkg._id) === String(packageSubId) && String(pkg.packageId) === String(packageId)
            );
            
            if (packageIndex !== -1) {
              // Update the package payment status to Full
              patient.packages[packageIndex].paymentStatus = 'Full';
              patient.packages[packageIndex].paidAmount = amount || patient.packages[packageIndex].totalPrice;
              patient.packages[packageIndex].paymentMethod = paymentMethod || 'Cash';
              
              console.log('[PackagePaymentAPI] Updated package:', {
                packageId,
                packageSubId,
                packageName: packageName || patient.packages[packageIndex].packageName,
                paymentStatus: 'Full',
                paidAmount: patient.packages[packageIndex].paidAmount,
                paymentMethod: paymentMethod || 'Cash'
              });
              
              await patient.save();
            } else {
              console.warn('[PackagePaymentAPI] Package not found in patient packages array:', {
                packageId,
                packageSubId
              });
            }
          }
        }
      } catch (packageUpdateError) {
        console.error('[PackagePaymentAPI] Error updating package payment status:', packageUpdateError);
        // Don't fail the billing if package update fails
      }
    }

    // Update existing pending invoices if pendingUsedNum > 0
    if (pendingUsedNum > 0) {
      console.log('[CreatePatientRegistration] Updating pending invoices with pendingUsed:', pendingUsedNum);
      
      // Fetch all pending invoices (oldest first)
      const pendingInvoices = await Billing.find({
        clinicId: clinic._id,
        patientId: patientRegistration._id,
        pending: { $gt: 0 },
        isAdvanceOnly: { $ne: true }
      }).sort({ invoicedDate: 1, createdAt: 1 });

      let remainingPendingUsed = pendingUsedNum;

      for (const invoice of pendingInvoices) {
        if (remainingPendingUsed <= 0) break;

        const paymentForInvoice = Math.min(remainingPendingUsed, invoice.pending);

        invoice.paid = (invoice.paid || 0) + paymentForInvoice;
        invoice.pending = invoice.pending - paymentForInvoice;

        await invoice.save();

        remainingPendingUsed -= paymentForInvoice;
      }

      console.log('[CreatePatientRegistration] Updated pending invoices, remaining:', remainingPendingUsed);
    }

    // Doctor/Staff commission based on AgentProfile (supports flat, target-based, and after_deduction)
    try {
      // Calculate adjusted paid amount for doctor/staff: if referral commission was given, subtract it from the paid amount
      const adjustedDoctorStaffPaidAmount = Math.max(0, commissionablePaidAmount - referralCommissionAmount);
      
      if (commissionablePaidAmount > 0 && appointment?.doctorId) {
        console.log("[CreatePatientRegistration] Doctor/Staff commission calculation:");
        console.log("[CreatePatientRegistration]   - Original paid amount:", commissionablePaidAmount);
        console.log("[CreatePatientRegistration]   - Referral commission amount:", referralCommissionAmount);
        console.log("[CreatePatientRegistration]   - Adjusted paid amount for doctor/staff:", adjustedDoctorStaffPaidAmount);
        
        // Use the commission calculator to determine commission
        const commissionResult = await calculateCommissionForStaff({
          staffId: appointment.doctorId,
          clinicId: clinic._id,
          paidAmount: adjustedDoctorStaffPaidAmount, // Use adjusted amount instead of full amount
          earnedAmount: earnedAmountForCommission,
          patientId: patientRegistration._id,
          appointmentId: appointment._id,
          currentBillingId: billing._id, // Pass the billing ID to exclude it from "last billing" query
          bankPaymentDetails: selectedBankPaymentDetails,
        });

        if (commissionResult.shouldCreateCommission) {
          const commissionData = {
            clinicId: clinic._id,
            source: "staff",
            staffId: appointment.doctorId,
            commissionType: commissionResult.commissionType,
            appointmentId: appointment._id,
            patientId: patientRegistration._id,
            billingId: billing._id,
            commissionPercent: commissionResult.commissionPercentage,
            amountPaid: paidNum, // Still store the full paid amount for reference
            commissionAmount: commissionResult.commissionAmount,
            invoicedDate: new Date(invoicedDate),
            notes: notes || "",
            createdBy: clinicUser._id,
            paymentMethod: paymentMethod,
            bankDeduction: {
              enabled: commissionResult.bankDeduction?.enabled || false,
              type: commissionResult.bankDeduction?.type,
              value: commissionResult.bankDeduction?.value,
              applyOn: commissionResult.bankDeduction?.applyOn,
              deductionAmount: commissionResult.bankDeduction?.deductionAmount
            },
            referralCommissionDeducted: referralCommissionAmount // Store referral commission deducted
          };

          // Add target-based specific fields if applicable
          if (commissionResult.commissionType === "target_based") {
            commissionData.targetAmount = commissionResult.targetAmount || 0;
            commissionData.cumulativeAchieved =
              commissionResult.cumulativeAchieved || 0;
            commissionData.isAboveTarget =
              commissionResult.isAboveTarget || false;
          }

          // Add after_deduction specific fields if applicable
          if (commissionResult.commissionType === "after_deduction") {
            commissionData.totalExpenses = commissionResult.totalExpenses || 0;
            commissionData.netAmount = commissionResult.netAmount || 0;
            commissionData.expenseBreakdown =
              commissionResult.expenseBreakdown || [];
            commissionData.complaintsCount =
              commissionResult.complaintsCount || 0;
            commissionData.lastBillingDate =
              commissionResult.lastBillingDate || null;
            commissionData.lastBillingInvoice =
              commissionResult.lastBillingInvoice || null;
            commissionData.isFirstBilling =
              commissionResult.isFirstBilling || false;
          }

          // Add target_plus_expense specific fields if applicable
          if (commissionResult.commissionType === "target_plus_expense") {
            commissionData.targetAmount = commissionResult.targetAmount || 0;
            commissionData.cumulativeAchieved =
              commissionResult.cumulativeAchieved || 0;
            commissionData.isAboveTarget =
              commissionResult.isAboveTarget || false;
            commissionData.amountAboveTarget =
              commissionResult.amountAboveTarget || 0;
            commissionData.totalExpenses = commissionResult.totalExpenses || 0;
            commissionData.netCommissionableAmount =
              commissionResult.netCommissionableAmount || 0;
            commissionData.expenseBreakdown =
              commissionResult.expenseBreakdown || [];
            commissionData.complaintsCount =
              commissionResult.complaintsCount || 0;
          }

          // Store commission base amount (the amount used as basis for commission calculation)
          // and set initial finalCommissionAmount equal to the computed commissionAmount.
          // This base is used later if post-commission expenses are added on the commission page.
          const commissionType = commissionResult.commissionType;
          // If applyOn is paid, use finalPaidAmount as base; if applyOn is earned, use adjusted amount (after referral deducted) as base
          let commissionBaseAmount;
          if (commissionResult.bankDeduction.deductionApplied && selectedBankPaymentDetails.applyOn === "paid") {
            commissionBaseAmount = commissionResult.bankDeduction.finalPaidAmount || adjustedDoctorStaffPaidAmount;
          } else {
            commissionBaseAmount = adjustedDoctorStaffPaidAmount; // Use adjusted amount (after referral deducted)
          }
          
          if (commissionType === "target_based") {
            // Base = only the amount above target (commission is earned only on excess)
            commissionBaseAmount = commissionResult.amountAboveTarget || 0;
          } else if (commissionType === "after_deduction") {
            // netAmount = paidAmount - billingExpenses (already computed by calculator from adjusted amount)
            commissionBaseAmount = commissionResult.netAmount || 0;
          } else if (commissionType === "target_plus_expense") {
            // netCommissionableAmount = amountAboveTarget - expenses (already computed by calculator from adjusted amount)
            commissionBaseAmount =
              commissionResult.netCommissionableAmount || 0;
          }
          commissionData.commissionBaseAmount = commissionBaseAmount;
          commissionData.finalCommissionAmount =
            commissionResult.commissionAmount || 0;

          await Commission.create(commissionData);
        } else {
          console.log(
            `Commission not created for staff ${appointment.doctorId}: ${commissionResult.reason}`,
          );
        }
      }
    } catch (staffCommissionErr) {
      console.error(
        "Commission calculation/store error (staff):",
        staffCommissionErr,
      );
      // Do not fail the billing creation if commission creation fails
    }

    return res.status(201).json({
      success: true,
      message: "Billing created successfully",
      billing: billing.toObject(),
      data: {
        _id: billing._id,
        invoiceNumber: billing.invoiceNumber,
      },
    });
  } catch (error) {
    console.error("Error creating billing:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create billing",
    });
  }
}
