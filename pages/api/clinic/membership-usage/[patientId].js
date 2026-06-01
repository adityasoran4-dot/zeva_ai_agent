import dbConnect from "../../../../lib/database";
import Billing from "../../../../models/Billing";
import PatientRegistration from "../../../../models/PatientRegistration";
import MembershipPlan from "../../../../models/MembershipPlan";
import { getUserFromReq } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check if user has access (clinic, agent, doctorStaff, staff)
    if (!["clinic", "agent", "doctorStaff", "staff"].includes(clinicUser.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { patientId, membershipId: queryMembershipId, startDate: queryStart, endDate: queryEnd } = req.query;

    if (!patientId) {
      return res.status(400).json({ success: false, message: "Patient ID is required" });
    }

    // Determine clinicId
    let clinicId;
    if (clinicUser.role === "clinic") {
      // For clinic role, find clinic by owner
      const Clinic = (await import("../../../../models/Clinic")).default;
      const clinic = await Clinic.findOne({ owner: clinicUser._id });
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
      clinicId = clinic._id;
    } else {
      // For agent, doctorStaff, staff - use clinicId from user
      clinicId = clinicUser.clinicId;
      if (!clinicId) {
        return res.status(403).json({ success: false, message: "User not linked to a clinic" });
      }
    }

    // Fetch patient details to get membership info
    // Note: PatientRegistration doesn't have clinicId, so we verify via Billing records
    const patient = await PatientRegistration.findById(patientId).lean();

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    // Verify this patient has billing records with this clinic to ensure access
    const hasBillingWithClinic = await Billing.exists({
      patientId: patientId,
      clinicId: clinicId,
    });

    // If no billing records, check if the patient's userId matches the logged-in user
    // or if the user is a clinic owner (they can access all patients)
    if (!hasBillingWithClinic && clinicUser.role !== 'clinic') {
      // For non-clinic roles, verify the patient belongs to their clinic
      // by checking if there's any appointment or other link
      // For now, we'll allow access if the patient exists
      // This can be tightened based on specific requirements
    }

    // Build ALL transferred-out memberships array (similar to package-usage transferredOut)
    const allMembershipTransfersOut = Array.isArray(patient.membershipTransfers)
      ? patient.membershipTransfers.filter(t => t.type === 'out')
      : [];
    let transferredOutMemberships = [];
    if (allMembershipTransfersOut.length > 0) {
      // Fetch names for missing membershipNames
      const missingNameIds = allMembershipTransfersOut
        .filter(t => !t.membershipName && t.membershipId)
        .map(t => t.membershipId);
      const membershipNameMap = {};
      if (missingNameIds.length > 0) {
        const plans = await MembershipPlan.find({ _id: { $in: missingNameIds } }).select('name').lean();
        plans.forEach(p => { membershipNameMap[String(p._id)] = p.name; });
      }
      // Fetch names for recipient patients
      const recipientIds = [...new Set(allMembershipTransfersOut.map(t => String(t.toPatientId || '')).filter(Boolean))];
      const recipientNameMap = {};
      if (recipientIds.length > 0) {
        const recipients = await PatientRegistration.find({ _id: { $in: recipientIds } }).select('firstName lastName').lean();
        recipients.forEach(r => {
          const fn = (r.firstName || '').trim();
          const ln = (r.lastName || '').trim();
          recipientNameMap[String(r._id)] = `${fn} ${ln}`.trim() || 'Unknown';
        });
      }
      transferredOutMemberships = allMembershipTransfersOut.map(t => ({
        membershipId: t.membershipId,
        membershipName: t.membershipName || membershipNameMap[String(t.membershipId)] || 'Membership',
        transferredToPatientId: t.toPatientId || null,
        transferredToName: recipientNameMap[String(t.toPatientId)] || null,
        transferredFreeConsultations: t.transferredFreeConsultations || 0,
        discountPercentageTransferred: t.discountPercentageTransferred || 0,
        paymentStatus: t.paymentStatus || "Unpaid",
        paidAmount: t.paidAmount || 0,
        paymentMethod: t.paymentMethod || "",
        transferDate: t.transferDate || null,
      }));
    }

    // Determine active membership considering transfers
    let activeMembershipId = null;
    let transferredAllowance = null;
    let sourcePatientId = null; // Track the source patient for transferred memberships
    let activePaymentStatus = "Unpaid";
    let activePaidAmount = 0;
    let activePaymentMethod = "";
    
    // Prefer explicit selection from query
    if (queryMembershipId) {
      activeMembershipId = queryMembershipId;
      const lastInForSelected = Array.isArray(patient.membershipTransfers)
        ? [...patient.membershipTransfers].reverse().find(t => t.type === 'in' && String(t.membershipId) === String(queryMembershipId))
        : null;
      if (lastInForSelected) {
        transferredAllowance = lastInForSelected.transferredFreeConsultations || null;
        sourcePatientId = lastInForSelected.fromPatientId;
        activePaymentStatus = lastInForSelected.paymentStatus || "Unpaid";
        activePaidAmount = lastInForSelected.paidAmount || 0;
        activePaymentMethod = lastInForSelected.paymentMethod || "";
      } else {
        const mEntry = (patient.memberships || []).find(m => String(m.membershipId) === String(queryMembershipId));
        if (mEntry) {
          activePaymentStatus = mEntry.paymentStatus || "Unpaid";
          activePaidAmount = mEntry.paidAmount || 0;
          activePaymentMethod = mEntry.paymentMethod || "";
        }
      }
    } else if (patient.membership === 'Yes' && patient.membershipId) {
      activeMembershipId = patient.membershipId;
      // Also check if this membership was transferred IN to this patient
      if (Array.isArray(patient.membershipTransfers)) {
        const inTransfer = [...patient.membershipTransfers].reverse().find(
          t => t.type === 'in' && String(t.membershipId) === String(patient.membershipId)
        );
        if (inTransfer) {
          transferredAllowance = inTransfer.transferredFreeConsultations || null;
          sourcePatientId = inTransfer.fromPatientId;
          activePaymentStatus = inTransfer.paymentStatus || "Unpaid";
          activePaidAmount = inTransfer.paidAmount || 0;
          activePaymentMethod = inTransfer.paymentMethod || "";
        } else {
          const mEntry = (patient.memberships || []).find(m => String(m.membershipId) === String(patient.membershipId));
          if (mEntry) {
            activePaymentStatus = mEntry.paymentStatus || "Unpaid";
            activePaidAmount = mEntry.paidAmount || 0;
            activePaymentMethod = mEntry.paymentMethod || "";
          }
        }
      }
    } else if (Array.isArray(patient.membershipTransfers)) {
      const lastIn = [...patient.membershipTransfers].reverse().find(t => t.type === 'in');
      if (lastIn) {
        activeMembershipId = lastIn.membershipId;
        transferredAllowance = lastIn.transferredFreeConsultations || 0;
        sourcePatientId = lastIn.fromPatientId;
        activePaymentStatus = lastIn.paymentStatus || "Unpaid";
        activePaidAmount = lastIn.paidAmount || 0;
        activePaymentMethod = lastIn.paymentMethod || "";
      }
    }
    if (!activeMembershipId) {
      return res.status(200).json({
        success: true,
        hasMembership: false,
        message: "Patient does not have an active membership",
        transferredOutMemberships,
      });
    }

    // Check if this membership was transferred OUT by the current patient
    // If so, don't show membership benefits
    const transferredOut = Array.isArray(patient.membershipTransfers) 
      ? patient.membershipTransfers.some(t => t.type === 'out' && String(t.membershipId) === String(activeMembershipId))
      : false;
    
    if (transferredOut) {
      // Find the specific out-transfer record to get membership name and who it was transferred to
      const outTransfer = Array.isArray(patient.membershipTransfers)
        ? [...patient.membershipTransfers]
            .reverse()
            .find(t => t.type === 'out' && String(t.membershipId) === String(activeMembershipId))
        : null;

      let membershipName = outTransfer?.membershipName || null;
      let transferredToName = null;

      // If membershipName not stored in transfer record, look up MembershipPlan
      if (!membershipName && activeMembershipId) {
        const plan = await MembershipPlan.findById(activeMembershipId).select('name').lean();
        membershipName = plan?.name || null;
      }

      // Fetch the name of the patient it was transferred TO
      if (outTransfer?.toPatientId) {
        const toPat = await PatientRegistration.findById(outTransfer.toPatientId)
          .select('firstName lastName')
          .lean();
        if (toPat) {
          const fn = (toPat.firstName || '').trim();
          const ln = (toPat.lastName || '').trim();
          transferredToName = `${fn} ${ln}`.trim() || 'Unknown';
        }
      }

      return res.status(200).json({
        success: true,
        hasMembership: false,
        message: "Membership was transferred to another patient",
        transferredOut: true,
        membershipName,
        transferredToPatientId: outTransfer?.toPatientId || null,
        transferredToName,
        transferredFreeConsultations: outTransfer?.transferredFreeConsultations || 0,
        transferredOutMemberships,
      });
    }

    // Fetch membership plan details
    const membershipPlan = await MembershipPlan.findOne({
      _id: activeMembershipId,
      clinicId: clinicId,
    }).lean();

    if (!membershipPlan) {
      return res.status(200).json({
        success: true,
        hasMembership: false,
        message: "Membership plan not found",
        transferredOutMemberships,
      });
    }

    // Check if membership is expired
    let isExpired = false;
    if (queryEnd) {
      isExpired = new Date(queryEnd) < new Date();
    } else {
      isExpired = patient.membershipEndDate && new Date(patient.membershipEndDate) < new Date();
    }
    
    if (isExpired) {
      return res.status(200).json({
        success: true,
        hasMembership: true,
        isExpired: true,
        membershipName: membershipPlan.name,
        message: "Membership has expired",
        transferredOutMemberships,
      });
    }

    let totalFreeConsultations = membershipPlan.benefits?.freeConsultations || 0;
    if (typeof transferredAllowance === 'number') {
      totalFreeConsultations = transferredAllowance;
    }

    // If no free consultations in membership
    if (totalFreeConsultations === 0) {
      return res.status(200).json({
        success: true,
        hasMembership: true,
        isExpired: false,
        membershipName: membershipPlan.name,
        hasFreeConsultations: false,
        totalFreeConsultations: 0,
        usedFreeConsultations: 0,
        remainingFreeConsultations: 0,
        discountPercentage: membershipPlan.benefits?.discountPercentage || 0,
        message: "Membership does not include free consultations",
        transferredOutMemberships,
      });
    }

    // Count used free consultations from billing history
    // A free consultation is counted when:
    // 1. It's a Treatment service (not package)
    // 2. OR it's a Package treatment session
    // 3. The billing amount is 0 or marked as free consultation
    // IMPORTANT: For transferred memberships, also query the source patient's billing records

    const dateFilter = {};
    if (queryStart) dateFilter.$gte = new Date(queryStart);
    if (queryEnd) dateFilter.$lte = new Date(queryEnd);
    
    // Collect all patient IDs to query (current patient + source patient from transfer)
    const patientIdsToQuery = [patientId];
    if (sourcePatientId && !patientIdsToQuery.includes(String(sourcePatientId))) {
      patientIdsToQuery.push(String(sourcePatientId));
    }
    
    const baseFilter = {
      patientId: { $in: patientIdsToQuery },
      clinicId: clinicId,
      $or: [
        { service: "Treatment" },
        { service: "Package" }
      ],
    };
    const billings = await Billing.find({
      ...baseFilter,
      isFreeConsultation: true,
      ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
    }).select("service treatment package sessions freeConsultationCount selectedPackageTreatments createdAt invoiceNumber patientId").lean();

    // If no billings with isFreeConsultation flag, count all treatment billings as used consultations
    let usedFreeConsultations = 0;
    const freeConsultationDetails = [];

    if (billings.length > 0) {
      billings.forEach((billing) => {
        // For Treatment billings, use freeConsultationCount (number of treatments billed as free)
        // For Package billings, use sessions (number of package sessions billed as free)
        // Fall back to 1 if neither is set (legacy records)
        const sessions =
          billing.service === "Treatment"
            ? billing.freeConsultationCount || 1
            : billing.sessions || 1;
        usedFreeConsultations += sessions;
        
        // Check if this billing is from the source patient
        const isFromSourcePatient = sourcePatientId && String(billing.patientId) === String(sourcePatientId);
        
        freeConsultationDetails.push({
          invoiceNumber: billing.invoiceNumber,
          service: billing.service,
          treatment: billing.treatment || billing.package,
          sessions: sessions,
          date: billing.createdAt,
          isFromSourcePatient: isFromSourcePatient,
          sourcePatientId: isFromSourcePatient ? billing.patientId : null,
        });
      });
    }

    // Alternative: Count from regular billings if isFreeConsultation field doesn't exist yet
    // This is a fallback for backward compatibility
    if (usedFreeConsultations === 0) {
      const allBillings = await Billing.find({
        ...baseFilter,
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
      }).sort({ createdAt: 1 }).lean();

      // Count consultations up to the free consultation limit
      for (const billing of allBillings) {
        if (usedFreeConsultations >= totalFreeConsultations) break;
        
        const sessions = billing.sessions || 1;
        const remainingAllowed = totalFreeConsultations - usedFreeConsultations;
        const sessionsToCount = Math.min(sessions, remainingAllowed);
        
        usedFreeConsultations += sessionsToCount;
        
        // Check if this billing is from the source patient
        const isFromSourcePatient = sourcePatientId && String(billing.patientId) === String(sourcePatientId);
        
        freeConsultationDetails.push({
          invoiceNumber: billing.invoiceNumber,
          service: billing.service,
          treatment: billing.treatment || billing.package,
          sessions: sessionsToCount,
          date: billing.createdAt,
          isFromSourcePatient: isFromSourcePatient,
          sourcePatientId: isFromSourcePatient ? billing.patientId : null,
        });
      }
    }

    const remainingFreeConsultations = Math.max(0, totalFreeConsultations - usedFreeConsultations);

    // Fetch the name of the source (transferred from) patient if applicable
    let transferredFromName = null;
    if (sourcePatientId) {
      const sourcePat = await PatientRegistration.findById(sourcePatientId).select('firstName lastName').lean();
      if (sourcePat) {
        const fn = (sourcePat.firstName || '').trim();
        const ln = (sourcePat.lastName || '').trim();
        transferredFromName = `${fn} ${ln}`.trim() || 'Unknown';
      }
    }

    return res.status(200).json({
      success: true,
      hasMembership: true,
      isExpired: false,
      membershipName: membershipPlan.name,
      hasFreeConsultations: true,
      totalFreeConsultations,
      usedFreeConsultations,
      remainingFreeConsultations,
      discountPercentage: membershipPlan.benefits?.discountPercentage || 0,
      membershipEndDate: patient.membershipEndDate,
      freeConsultationDetails,
      isTransferred: !!sourcePatientId,
      transferredFrom: sourcePatientId,
      transferredFromName: transferredFromName,
      transferredFreeConsultations: typeof transferredAllowance === 'number' ? transferredAllowance : null,
      paymentStatus: activePaymentStatus,
      paidAmount: activePaidAmount,
      paymentMethod: activePaymentMethod,
      message: remainingFreeConsultations > 0 
        ? `${remainingFreeConsultations} free consultation(s) remaining`
        : "All free consultations have been used",
      transferredOutMemberships,
    });

  } catch (error) {
    console.error("Error fetching membership usage:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch membership usage",
    });
  }
}
