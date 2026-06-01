import dbConnect from "../../../../lib/database";
import Billing from "../../../../models/Billing";
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

    const { patientId } = req.query;
    const { packageName } = req.query;

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

    // Fetch patient details to check for transfers
    const PatientRegistration = (await import("../../../../models/PatientRegistration")).default;
    const patient = await PatientRegistration.findById(patientId).lean();
    
    // Get transferred packages info
    const transfersIn = Array.isArray(patient?.packageTransfers)
      ? patient.packageTransfers.filter(t => t.type === 'in')
      : [];
         
    // Get packages transferred OUT by this patient
    const transfersOut = Array.isArray(patient?.packageTransfers)
      ? patient.packageTransfers.filter(t => t.type === 'out')
      : [];

    // Import Package model early so we can fill in missing packageNames
    const Package = (await import("../../../../models/Package")).default;

    // Fill in missing packageNames for transfers that only have packageId
    const allMissingNameIds = [
      ...transfersIn.filter(t => !t.packageName && t.packageId).map(t => t.packageId),
      ...transfersOut.filter(t => !t.packageName && t.packageId).map(t => t.packageId),
    ];
    if (allMissingNameIds.length > 0) {
      const pkgsForNames = await Package.find({ _id: { $in: allMissingNameIds } }).select('name').lean();
      const pkgIdToName = {};
      pkgsForNames.forEach(p => { pkgIdToName[String(p._id)] = p.name; });
      [...transfersIn, ...transfersOut].forEach(t => {
        if (!t.packageName && t.packageId) {
          t.packageName = pkgIdToName[String(t.packageId)] || null;
        }
      });
    }

    const transferredOutPackageIds = transfersOut.map(t => String(t.packageId));
    const transferredOutPackageNames = transfersOut.map(t => t.packageName).filter(Boolean);
    
    // Build a map of packageId -> payment info for normal packages
    const patientPackageMap = {};
    if (Array.isArray(patient?.packages)) {
      patient.packages.forEach(p => {
        patientPackageMap[String(p.packageId)] = {
          paymentStatus: p.paymentStatus || "Unpaid",
          paidAmount: p.paidAmount || 0,
          paymentMethod: p.paymentMethod || "",
        };
      });
    }

    // Build a map of packageName -> source patient info for transfers
    const transferSourceMap = {};
    transfersIn.forEach(t => {
      const key = t.packageName || String(t.packageId || "");
      transferSourceMap[key] = {
        fromPatientId: t.fromPatientId,
        transferredSessions: t.transferredSessions || 0,
        packageId: t.packageId,
        packageName: t.packageName,
        paymentStatus: t.paymentStatus || "Unpaid",
        paidAmount: t.paidAmount || 0,
        paymentMethod: t.paymentMethod || "",
      };
    });

    // Fetch names for all source patients in transfers
    const sourceIds = Array.from(new Set(transfersIn.map(t => String(t.fromPatientId || "")).filter(Boolean)));
    const sourcePatients = sourceIds.length
      ? await PatientRegistration.find({ _id: { $in: sourceIds } }).select("firstName lastName").lean()
      : [];
    const sourceNameMap = {};
    sourcePatients.forEach(sp => {
      const fn = (sp.firstName || "").trim();
      const ln = (sp.lastName || "").trim();
      sourceNameMap[String(sp._id)] = `${fn} ${ln}`.trim() || "Unknown";
    });

    // Collect all patient IDs to query (current patient + source patients from transfers)
    const patientIdsToQuery = [patientId];
    transfersIn.forEach(t => {
      if (t.fromPatientId && !patientIdsToQuery.includes(String(t.fromPatientId))) {
        patientIdsToQuery.push(String(t.fromPatientId));
      }
    });

    // Build query
    const query = {
      patientId: { $in: patientIdsToQuery },
      clinicId: clinicId,
      service: "Package",
    };

    // If packageName is provided, filter by it
    if (packageName) {
      query.package = packageName;
    }

    // Fetch names for all target patients in transfersOut
    const targetIds = Array.from(new Set(transfersOut.map(t => String(t.toPatientId || "")).filter(Boolean)));
    const targetPatients = targetIds.length
      ? await PatientRegistration.find({ _id: { $in: targetIds } }).select("firstName lastName").lean()
      : [];
    const targetNameMap = {};
    targetPatients.forEach(tp => {
      const fn = (tp.firstName || "").trim();
      const ln = (tp.lastName || "").trim();
      targetNameMap[String(tp._id)] = `${fn} ${ln}`.trim() || "Unknown";
    });

    // Build transferredOut map for quick lookup
    const transferredOutMap = {};
    transfersOut.forEach(t => {
      const key = t.packageName || String(t.packageId || "");
      transferredOutMap[key] = {
        toPatientId: t.toPatientId,
        transferredToName: targetNameMap[String(t.toPatientId)] || null,
        transferredSessions: t.transferredSessions || 0,
        packageId: t.packageId,
        packageName: t.packageName
      };
    });

    // Fetch all package billing records for this patient and source patients
    const billings = await Billing.find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .select("package selectedPackageTreatments sessions createdAt invoiceNumber amount paid pending patientId originalAmount isDoctorDiscountApplied isAgentDiscountApplied membershipDiscountApplied discountPercent paymentMethod multiplePayments")
      .lean();

    // Fetch package definitions to get max sessions for each treatment
    const packageNames = [...new Set(billings.map(b => b.package).filter(Boolean))];
    const packageDefinitions = await Package.find({
      clinicId: clinicId,
      name: { $in: packageNames }
    }).select("name treatments").lean();

    // Create a map of package name to its treatment definitions
    const packageDefMap = {};
    packageDefinitions.forEach(pkg => {
      packageDefMap[pkg.name] = pkg.treatments || [];
    });

    // Aggregate usage by package and treatment
    const packageUsage = {};

    // Initialize packageUsage with all transferred-in packages to ensure they show up even without billings
    transfersIn.forEach(t => {
      const pkgName = t.packageName;
      if (!pkgName) return;
      
      const fromPatientName = sourceNameMap[String(t.fromPatientId)] || null;
      
      packageUsage[pkgName] = {
        packageName: pkgName,
        treatments: [],
        totalSessions: 0,
        billingHistory: [],
        isTransferred: true,
        transferredFrom: t.fromPatientId,
        transferredFromName: fromPatientName,
        transferredPackageName: pkgName,
        transferredSessions: t.transferredSessions || 0,
        paymentStatus: t.paymentStatus || "Unpaid",
        paidAmount: t.paidAmount || 0,
        paymentMethod: t.paymentMethod || "",
        totalAllowedSessions: t.transferredSessions || 0,
        remainingSessions: t.transferredSessions || 0
      };
    });

    billings.forEach((billing) => {
      const pkgName = billing.package;
      if (!pkgName) return;

      // Skip packages that were transferred OUT by this patient
      if (transferredOutPackageNames.includes(pkgName)) {
        return;
      }

      // Check if this billing is from a transfer source patient
      const isFromSourcePatient = String(billing.patientId) !== String(patientId);
      const transferInfo = transferSourceMap[pkgName];
      
      // Also check if it's a normal package assigned to this patient
      const packageIdForName = packageDefinitions.find(pd => pd.name === pkgName)?._id;
      const normalPackageInfo = packageIdForName ? patientPackageMap[String(packageIdForName)] : null;

      if (!packageUsage[pkgName]) {
        packageUsage[pkgName] = {
          packageName: pkgName,
          treatments: {},
          totalSessions: 0,
          billingHistory: [],
          isTransferred: !!transferInfo,
          transferredFrom: transferInfo ? transferInfo.fromPatientId : null,
          transferredFromName: transferInfo && transferInfo.fromPatientId ? (sourceNameMap[String(transferInfo.fromPatientId)] || null) : null,
          transferredPackageName: transferInfo ? transferInfo.packageName || null : null,
          transferredSessions: transferInfo ? transferInfo.transferredSessions : 0,
          paymentStatus: transferInfo ? transferInfo.paymentStatus : (normalPackageInfo ? normalPackageInfo.paymentStatus : "Unpaid"),
          paidAmount: transferInfo ? transferInfo.paidAmount : (normalPackageInfo ? normalPackageInfo.paidAmount : 0),
          paymentMethod: transferInfo ? transferInfo.paymentMethod : (normalPackageInfo ? normalPackageInfo.paymentMethod : ""),
        };
      }

      // Add to billing history with source patient info
      packageUsage[pkgName].billingHistory.push({
        invoiceNumber: billing.invoiceNumber,
        sessions: billing.sessions || 0,
        date: billing.createdAt,
        amount: billing.amount || 0,
        paid: billing.paid || 0,
        pending: billing.pending || 0,
        originalAmount: billing.originalAmount || billing.amount || 0,
        isDoctorDiscountApplied: billing.isDoctorDiscountApplied || false,
        isAgentDiscountApplied: billing.isAgentDiscountApplied || false,
        membershipDiscountApplied: billing.membershipDiscountApplied || 0,
        discountPercent: billing.discountPercent || 0,
        paymentMethod: billing.paymentMethod || "",
        multiplePayments: billing.multiplePayments || [],
        treatments: billing.selectedPackageTreatments || [],
        isFromSourcePatient: isFromSourcePatient,
        sourcePatientId: isFromSourcePatient ? billing.patientId : null,
      });

      // Aggregate treatment sessions
      if (Array.isArray(billing.selectedPackageTreatments)) {
        billing.selectedPackageTreatments.forEach((treatment) => {
          const slug = treatment.treatmentSlug;
          if (!slug) return;

          if (!packageUsage[pkgName].treatments[slug]) {
            // Get max sessions from package definition
            const pkgTreatments = packageDefMap[pkgName] || [];
            const treatmentDef = pkgTreatments.find(t => t.treatmentSlug === slug);
            
            packageUsage[pkgName].treatments[slug] = {
              treatmentName: treatment.treatmentName,
              treatmentSlug: treatment.treatmentSlug,
              totalUsedSessions: 0,
              maxSessions: treatmentDef?.sessions || 0,
              usageDetails: [], // Track each billing's usage
            };
          }

          packageUsage[pkgName].treatments[slug].totalUsedSessions += treatment.sessions || 0;
          
          // Add usage detail for this billing with source patient info
          packageUsage[pkgName].treatments[slug].usageDetails.push({
            invoiceNumber: billing.invoiceNumber,
            sessions: treatment.sessions || 0,
            date: billing.createdAt,
            amount: billing.amount || 0,
            paid: billing.paid || 0,
            originalAmount: billing.originalAmount || billing.amount || 0,
            isDoctorDiscountApplied: billing.isDoctorDiscountApplied || false,
            isAgentDiscountApplied: billing.isAgentDiscountApplied || false,
            membershipDiscountApplied: billing.membershipDiscountApplied || 0,
            discountPercent: billing.discountPercent || 0,
            paymentMethod: billing.paymentMethod || "",
            multiplePayments: billing.multiplePayments || [],
            isFromSourcePatient: isFromSourcePatient,
            sourcePatientId: isFromSourcePatient ? billing.patientId : null,
          });
        });
      }

      packageUsage[pkgName].totalSessions += billing.sessions || 0;
    });

    // Convert treatments object to array
    Object.keys(packageUsage).forEach((pkgName) => {
      packageUsage[pkgName].treatments = Object.values(packageUsage[pkgName].treatments);
    });

    // Apply transferred allowances if present; calculate remaining for regular packages
    Object.keys(packageUsage).forEach((pkgName) => {
      const transferInfo = transferSourceMap[pkgName];
      if (transferInfo && typeof transferInfo.transferredSessions === 'number') {
        // Transferred package — use transferred sessions as the allowance
        const used = packageUsage[pkgName].totalSessions || 0;
        const remaining = Math.max(0, transferInfo.transferredSessions - used);
        packageUsage[pkgName].totalAllowedSessions = transferInfo.transferredSessions;
        packageUsage[pkgName].remainingSessions = remaining;
      } else {
        // Regular package — sum maxSessions across all treatments from package definition
        const treatments = packageUsage[pkgName].treatments || [];
        const totalAllowed = treatments.reduce((sum, t) => sum + (t.maxSessions || 0), 0);
        const used = treatments.reduce((sum, t) => sum + (t.totalUsedSessions || 0), 0);

        if (totalAllowed > 0) {
          // Treatment-level sessions available from package definition
          packageUsage[pkgName].totalAllowedSessions = totalAllowed;
          packageUsage[pkgName].remainingSessions = Math.max(0, totalAllowed - used);
        } else {
          // Fallback: use top-level billing.sessions as total allowed
          const billingHistory = packageUsage[pkgName].billingHistory || [];
          const totalBilledSessions = billingHistory.reduce((sum, b) => sum + (b.sessions || 0), 0);
          const usedFallback = billingHistory.reduce((sum, b) => {
            return sum + (b.treatments || []).reduce((s, t) => s + (t.sessions || 0), 0);
          }, 0);
          packageUsage[pkgName].totalAllowedSessions = totalBilledSessions;
          packageUsage[pkgName].remainingSessions = Math.max(0, totalBilledSessions - usedFallback);
        }
      }
    });

    return res.status(200).json({
      success: true,
      packageUsage: Object.values(packageUsage),
      transferredOut: Object.keys(transferredOutMap).length > 0 ? Object.values(transferredOutMap) : [],
    });
  } catch (error) {
    console.error("Error fetching package usage:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch package usage",
    });
  }
}
