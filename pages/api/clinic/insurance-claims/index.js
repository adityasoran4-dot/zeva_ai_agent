import dbConnect from "../../../../lib/database";
import InsuranceClaim from "../../../../models/InsuranceClaim";
import PatientRegistration from "../../../../models/PatientRegistration";
import User from "../../../../models/Users";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser } from "../../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

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

  // GET: List claims
  if (req.method === "GET") {
    try {
      const { patientId, doctorId, clinicId, status } = req.query;
      const query = {};

      // Determine clinicId for filtering
      const { clinicId: userClinicId, isAdmin } = await getClinicIdFromUser(user);
      
      if (isAdmin) {
        // Admin can see all, optionally filter by clinicId
        if (clinicId) query.clinicId = clinicId;
      } else if (userClinicId) {
        query.clinicId = userClinicId;
      }

      // If doctorStaff, only show their own claims
      if (user.role === "doctorStaff") {
        query.doctorId = user._id;
      } else if (doctorId) {
        query.doctorId = doctorId;
      }

      if (patientId) query.patientId = patientId;
      if (status) query.status = status;

      const claims = await InsuranceClaim.find(query)
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({ success: true, data: claims });
    } catch (error) {
      console.error("Error fetching insurance claims:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch claims" });
    }
  }

  // POST: Create a new claim
  if (req.method === "POST") {
    try {
      const { clinicId: userClinicId, isAdmin } = await getClinicIdFromUser(user);
      
      let clinicIdToUse = userClinicId;
      // Admin must provide clinicId
      if (isAdmin && req.body.clinicId) {
        clinicIdToUse = req.body.clinicId;
      }
      
      if (!clinicIdToUse) {
        return res.status(400).json({ success: false, message: "Unable to determine clinic" });
      }

      const {
        patientId,
        insuranceProvider,
        policyNumber,
        expiryDate,
        insuranceCardFile,
        tableOfBenefitsFile,
        departmentId,
        departmentName,
        serviceId,
        serviceName,
        services,
        doctorId,
        doctorName,
        claimAmount,
        claimType,
        coPayPercent,
        coPayType,
        notes,
        documentFiles,
        advanceStatus,
      } = req.body;

      // Validate required fields
      if (!patientId) {
        return res.status(400).json({ success: false, message: "Patient ID is required" });
      }
      if (!insuranceProvider) {
        return res.status(400).json({ success: false, message: "Insurance Provider is required" });
      }
      if (!policyNumber) {
        return res.status(400).json({ success: false, message: "Policy Number is required" });
      }
      if (!expiryDate) {
        return res.status(400).json({ success: false, message: "Expiry Date is required" });
      }
      if (!doctorId) {
        return res.status(400).json({ success: false, message: "Doctor is required" });
      }
      if (!claimAmount || claimAmount <= 0) {
        return res.status(400).json({ success: false, message: "Claim Amount must be greater than 0" });
      }
      if (!claimType) {
        return res.status(400).json({ success: false, message: "Claim Type is required" });
      }

      // Validate doctor exists and is doctorStaff role
      const doctor = await User.findById(doctorId);
      if (!doctor || doctor.role !== "doctorStaff") {
        return res.status(400).json({ success: false, message: "Selected doctor is not a valid doctor staff" });
      }

      // Get patient info for denormalization
      const patient = await PatientRegistration.findById(patientId).select("firstName lastName mobileNumber");
      if (!patient) {
        return res.status(400).json({ success: false, message: "Patient not found" });
      }

      // Calculate advanceAmount and pendingClaim based on manually entered amount
      let advanceAmount = 0;
      let pendingClaim = 0;
      
      if (claimType === "Advance" || claimType === "Paid") {
        if (advanceStatus) {
          // Use the manually entered advanceAmount from req.body
          advanceAmount = parseFloat(req.body.advanceAmount) || 0;
          
          if (advanceStatus === "Partial Pay") {
            pendingClaim = parseFloat(claimAmount) - advanceAmount;
          }
        }
      }

      // Get doctor name
      const resolvedDoctorName = doctorName || `${doctor.name || ''}`.trim() || doctor.email;

      // Build services array - support both old format (serviceId/serviceName) and new format (services array)
      let servicesArray = [];
      if (services && Array.isArray(services) && services.length > 0) {
        // New format: array of {serviceId, serviceName}
        servicesArray = services;
      } else if (serviceId) {
        // Old format: single serviceId/serviceName (backward compatibility)
        servicesArray = [{ serviceId: serviceId, serviceName: serviceName || "" }];
      }

      const newClaim = await InsuranceClaim.create({
        clinicId: clinicIdToUse,
        patientId,
        createdBy: user._id,
        insuranceProvider: insuranceProvider.trim(),
        policyNumber: policyNumber.trim(),
        expiryDate: new Date(expiryDate),
        insuranceCardFile: insuranceCardFile || "",
        tableOfBenefitsFile: tableOfBenefitsFile || "",
        departmentId: departmentId || null,
        departmentName: departmentName || "",
        services: servicesArray,
        doctorId,
        doctorName: resolvedDoctorName,
        claimAmount: parseFloat(claimAmount),
        claimType,
        coPayPercent: coPayPercent || 0,
        coPayType: coPayType || "Patient Pays",
        notes: notes || "",
        documentFiles: documentFiles || [],
        advanceStatus: claimType === "Advance" ? (advanceStatus || "Full Pay") : null,
        advanceAmount,
        pendingClaim,
        status: "Under Review",
        patientFirstName: patient.firstName || "",
        patientLastName: patient.lastName || "",
        patientMobileNumber: patient.mobileNumber || "",
      });

      return res.status(201).json({
        success: true,
        message: "Insurance claim created successfully",
        data: newClaim,
      });
    } catch (error) {
      console.error("Error creating insurance claim:", error);
      return res.status(500).json({ success: false, message: "Failed to create claim" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}
