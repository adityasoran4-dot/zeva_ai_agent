import dbConnect from "../../../lib/database";
import PatientRegistration from "../../../models/PatientRegistration";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";
import { checkClinicPermission } from "../lead-ms/permissions-helper";
import { checkAgentPermission } from "../agent/permissions-helper";
import Clinic from "../../../models/Clinic";
import { generateEmrNumber } from "../../../lib/generateEmrNumber";
import {
  executeWorkflows,
  WORKFLOW_ENTITY_TYPE,
  WORKFLOW_TRIGGER_TYPE,
} from "../../../bullmq/workflow";

const hasRole = (user, roles = []) => roles.includes(user.role);

export default async function handler(req, res) {
  await dbConnect();

  let user;
  try {
    user = await getAuthorizedStaffUser(req, {
      allowedRoles: [
        "staff",
        "doctorStaff",
        "doctor",
        "clinic",
        "agent",
        "admin",
      ],
    });
  } catch (err) {
    return res
      .status(err.status || 401)
      .json({ success: false, message: err.message || "Authentication error" });
  }

  // ---------------- GET: list/filter patients OR generate EMR OR get invoicedBy ----------------
  if (req.method === "GET") {
    // Check if requesting single patient by ID
    if (req.query.id) {
      try {
        const patientId = req.query.id;

        // Fetch patient by ID
        const patient = await PatientRegistration.findById(patientId).lean();

        if (!patient) {
          return res
            .status(404)
            .json({ success: false, message: "Patient not found" });
        }

        // Populate package names in packages array
        if (patient.packages && Array.isArray(patient.packages) && patient.packages.length > 0) {
          const Package = (await import("../../../models/Package")).default;
          const UserPackage = (await import("../../../models/UserPackage")).default;
          
          for (let i = 0; i < patient.packages.length; i++) {
            const pkg = patient.packages[i];
            if (pkg.packageId) {
              // Try to find in Package model first
              let packageDoc = await Package.findById(pkg.packageId).lean();
              
              // If not found, try UserPackage model
              if (!packageDoc) {
                packageDoc = await UserPackage.findById(pkg.packageId).lean();
              }
              
              // Add package name to the package object
              if (packageDoc) {
                patient.packages[i].packageName = packageDoc.name || '';
              }
            }
          }
        }

        return res.status(200).json({
          success: true,
          patient: patient,
        });
      } catch (error) {
        console.error("Error fetching patient by ID:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch patient",
        });
      }
    }

    // Check if requesting Invoiced By user details
    if (req.query.getInvoicedBy === "true") {
      try {
        // Allow clinic, staff, admin, agent, and doctorStaff roles
        if (
          !hasRole(user, [
            "clinic",
            "staff",
            "admin",
            "agent",
            "doctorStaff",
            "doctor",
          ])
        ) {
          return res
            .status(403)
            .json({ success: false, message: "Access denied" });
        }

        // Return current user's name for invoiced by field
        return res.status(200).json({
          success: true,
          invoicedBy:
            user.name ||
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            "Unknown",
          userId: user._id,
        });
      } catch (error) {
        console.error("Error fetching invoiced by:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch invoiced by",
        });
      }
    }

    // Check if requesting EMR number generation
    if (req.query.generateEmr === "true") {
      try {
        // Allow clinic, staff, admin, agent, and doctorStaff roles
        if (
          !hasRole(user, [
            "clinic",
            "staff",
            "admin",
            "agent",
            "doctorStaff",
            "doctor",
          ])
        ) {
          return res
            .status(403)
            .json({ success: false, message: "Access denied" });
        }

        // Generate next sequential EMR number
        const emrNumber = await generateEmrNumber();

        return res.status(200).json({
          success: true,
          emrNumber: emrNumber,
        });
      } catch (error) {
        console.error("Error generating EMR number:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to generate EMR number",
        });
      }
    }

    // Otherwise, proceed with listing patients
    // Allow clinic, staff, admin, agent, and doctorStaff roles
    if (
      !hasRole(user, [
        "clinic",
        "staff",
        "admin",
        "agent",
        "doctorStaff",
        "doctor",
      ])
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // ✅ Check permissions for reading patients (admin bypasses all checks)
    if (user.role !== "admin") {
      // For clinic role: Check clinic permissions
      if (user.role === "clinic") {
        const clinic = await Clinic.findOne({ owner: user._id });
        if (clinic) {
          const { hasPermission: clinicHasPermission, error: clinicError } =
            await checkClinicPermission(
              clinic._id,
              "patient_registration",
              "read",
            );
          if (!clinicHasPermission) {
            return res.status(403).json({
              success: false,
              message:
                clinicError || "You do not have permission to view patients",
            });
          }
        }
      }
      // For agent role (agentToken): Check agent permissions
      else if (user.role === "agent") {
        const { hasPermission: agentHasPermission, error: agentError } =
          await checkAgentPermission(user._id, "patient_registration", "read");
        if (!agentHasPermission) {
          return res.status(403).json({
            success: false,
            message:
              agentError || "You do not have permission to view patients",
          });
        }
      }
      // For doctorStaff role (userToken): Check agent permissions
      else if (user.role === "doctorStaff") {
        const { hasPermission: agentHasPermission, error: agentError } =
          await checkAgentPermission(user._id, "patient_registration", "read");
        if (!agentHasPermission) {
          return res.status(403).json({
            success: false,
            message:
              agentError || "You do not have permission to view patients",
          });
        }
      }
    }

    try {
      const {
        emrNumber,
        invoiceNumber,
        name,
        phone,
        claimStatus,
        applicationStatus,
      } = req.query;

      // Build query based on user role - CRITICAL: userId filter must be applied first
      let query = {};

      // For clinic role: show all patients belonging to the clinic (clinic owner + all agents/doctorStaff linked to clinic)
      if (user.role === "clinic") {
        const clinic = await Clinic.findOne({ owner: user._id });
        if (clinic) {
          // Find all users belonging to this clinic (clinic owner + agents + doctorStaff)
          const User = (await import("../../../models/Users")).default;
          const clinicUsers = await User.find({
            $or: [
              { _id: user._id }, // Clinic owner
              { clinicId: clinic._id }, // Agents and doctorStaff linked to clinic
            ],
          }).select("_id");

          const clinicUserIds = clinicUsers.map((u) => u._id);
          query.userId = { $in: clinicUserIds };
        } else {
          // Fallback: only show clinic owner's patients
          query.userId = user._id;
        }
      }
      // For agent/doctorStaff: show all patients belonging to the clinic
      else if (user.role === "agent" || user.role === "doctorStaff") {
        if (user.clinicId) {
          const Clinic = (await import("../../../models/Clinic")).default;
          const clinic = await Clinic.findById(user.clinicId);
          if (clinic) {
            const User = (await import("../../../models/Users")).default;
            const clinicUsers = await User.find({
              $or: [
                { _id: clinic.owner }, // Clinic owner
                { clinicId: user.clinicId }, // All agents/staff linked to this clinic
              ],
            }).select("_id");
            query.userId = { $in: clinicUsers.map((u) => u._id) };
          } else {
            query.userId = user._id;
          }
        } else {
          query.userId = user._id;
        }
      }
      // For other roles: show their own patients
      else {
        query.userId = user._id;
      }

      // Handle name search - if name filter exists, use $and to combine with userId filter
      if (name) {
        const nameFilter = {
          $or: [
            { firstName: { $regex: name, $options: "i" } },
            { lastName: { $regex: name, $options: "i" } },
          ],
        };
        // Store userId filter before reconstructing query
        const userIdFilter = { userId: query.userId };
        // Reconstruct query with $and to ensure userId filter is preserved
        query = {
          $and: [userIdFilter, nameFilter],
        };
        // Add other filters to the $and array
        if (emrNumber)
          query.$and.push({ emrNumber: { $regex: emrNumber, $options: "i" } });
        if (invoiceNumber)
          query.$and.push({
            invoiceNumber: { $regex: invoiceNumber, $options: "i" },
          });
        if (phone)
          query.$and.push({ mobileNumber: { $regex: phone, $options: "i" } });
        if (claimStatus) query.$and.push({ advanceClaimStatus: claimStatus });
        if (applicationStatus) query.$and.push({ status: applicationStatus });
      } else {
        // Apply additional filters normally when no name filter
        if (emrNumber) query.emrNumber = { $regex: emrNumber, $options: "i" };
        if (invoiceNumber)
          query.invoiceNumber = { $regex: invoiceNumber, $options: "i" };
        if (phone) query.mobileNumber = { $regex: phone, $options: "i" };
        if (claimStatus) query.advanceClaimStatus = claimStatus;
        if (applicationStatus) query.status = applicationStatus;
      }

      const patients = await PatientRegistration.find(query).sort({
        createdAt: -1,
      });
      return res
        .status(200)
        .json({ success: true, count: patients.length, data: patients });
    } catch (err) {
      console.error("GET error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch patients" });
    }
  }

  // ---------------- POST: create a new patient ----------------
  if (req.method === "POST") {
    if (
      !hasRole(user, [
        "clinic",
        "staff",
        "admin",
        "agent",
        "doctorStaff",
        "doctor",
      ])
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // ✅ Check permissions for creating patients (admin bypasses all checks)
    if (user.role !== "admin") {
      // For clinic role: Check clinic permissions
      if (user.role === "clinic") {
        const clinic = await Clinic.findOne({ owner: user._id });
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
      else if (user.role === "agent") {
        const { hasPermission: agentHasPermission, error: agentError } =
          await checkAgentPermission(
            user._id,
            "patient_registration",
            "create",
          );
        if (!agentHasPermission) {
          return res.status(403).json({
            success: false,
            message:
              agentError || "You do not have permission to create patients",
          });
        }
      }
      // For doctorStaff role (userToken): Check agent permissions
      else if (user.role === "doctorStaff") {
        const { hasPermission: agentHasPermission, error: agentError } =
          await checkAgentPermission(
            user._id,
            "patient_registration",
            "create",
          );
        if (!agentHasPermission) {
          return res.status(403).json({
            success: false,
            message:
              agentError || "You do not have permission to create patients",
          });
        }
      }
    }

    try {
      const {
        invoiceNumber,
        invoicedBy,
        emrNumber,
        firstName,
        lastName,
        gender,
        email,
        mobileNumber,
        referredBy,
        patientType,
        insurance,
        insuranceType,
        advanceGivenAmount,
        coPayPercent,
        advanceClaimStatus,
        advanceClaimReleasedBy,
        notes,
        membership,
        membershipStartDate,
        membershipEndDate,
        membershipId,
        package: pkgToggle,
        packageId,
        memberships: membershipsArray,
        packages: packagesArray,
      } = req.body;

      const computedInvoicedBy =
        invoicedBy ||
        user.name ||
        user.fullName ||
        user.email ||
        user.username ||
        user.mobileNumber ||
        String(user._id);

      // Determine clinicId from user
      let clinicIdToUse = null;
      if (user.role === "admin") {
        // For admin, clinicId is optional - they can create patients without clinic association
        // Or you can require admin to select a clinic if needed
        clinicIdToUse = null; // Admin-created patients won't have clinicId
      } else if (user.role === "clinic") {
        // For clinic role, find their own clinic
        const clinic = await Clinic.findOne({ owner: user._id });
        clinicIdToUse = clinic ? clinic._id : null;
      } else if (user.clinicId) {
        // For agent/doctorStaff roles with clinicId
        clinicIdToUse = user.clinicId;
      }

      // If no clinicId found and user is not admin, return error
      if (!clinicIdToUse && user.role !== "admin") {
        return res.status(400).json({
          success: false,
          message:
            "Clinic ID is required but could not be determined from your account",
        });
      }

      if (!invoiceNumber || !firstName || !mobileNumber) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: invoiceNumber, firstName, and mobileNumber are required",
        });
      }

      // Check if invoice number already exists
      const existingInvoice = await PatientRegistration.findOne({
        invoiceNumber,
      });
      if (existingInvoice) {
        return res.status(400).json({
          success: false,
          message: "Invoice number already exists",
        });
      }

      const newPatient = await PatientRegistration.create({
        invoiceNumber,
        invoicedDate: new Date(),
        invoicedBy: computedInvoicedBy,
        userId: user._id,
        clinicId: clinicIdToUse,
        emrNumber: emrNumber || "",
        firstName,
        lastName: lastName || "",
        gender: gender || undefined,
        email: email || "",
        mobileNumber,
        referredBy: referredBy || "",
        patientType: patientType || "New",
        insurance: insurance || "No",
        insuranceType: insuranceType || "Paid",
        advanceGivenAmount: advanceGivenAmount
          ? parseFloat(advanceGivenAmount)
          : 0,
        coPayPercent: coPayPercent || "",
        advanceClaimStatus: advanceClaimStatus || "Pending",
        advanceClaimReleasedBy: advanceClaimReleasedBy || null,
        notes: notes || "",
        membership: membership || "No",
        membershipStartDate:
          membership === "Yes" && membershipStartDate
            ? new Date(membershipStartDate)
            : null,
        membershipEndDate:
          membership === "Yes" && membershipEndDate
            ? new Date(membershipEndDate)
            : null,
        membershipId:
          membership === "Yes" && membershipId ? membershipId : null,
        package: pkgToggle || "No",
        packageId: pkgToggle === "Yes" && packageId ? packageId : null,
        memberships: Array.isArray(membershipsArray)
          ? membershipsArray.map((m) => ({
              membershipId: m.membershipId,
              startDate: m.startDate ? new Date(m.startDate) : undefined,
              endDate: m.endDate ? new Date(m.endDate) : undefined,
            }))
          : membership === "Yes" && membershipId
            ? [
                {
                  membershipId,
                  startDate: membershipStartDate
                    ? new Date(membershipStartDate)
                    : undefined,
                  endDate: membershipEndDate
                    ? new Date(membershipEndDate)
                    : undefined,
                },
              ]
            : [],
        packages: Array.isArray(packagesArray)
          ? packagesArray.map((p) => ({
              packageId: p.packageId,
              packageName: p.packageName,
              packageSoldBy: p.packageSoldBy || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
              assignedDate: p.assignedDate
                ? new Date(p.assignedDate)
                : undefined,
            }))
          : pkgToggle === "Yes" && packageId
            ? [{ 
                packageId, 
                assignedDate: new Date(),
                packageSoldBy: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'
              }]
            : [],
      });

      // -------------------------------
      // Patient Detail Create
      // -------------------------------
      // Note: Execute workflow for the created patient
      executeWorkflows({
        entity: WORKFLOW_ENTITY_TYPE.PATIENT,
        trigger: WORKFLOW_TRIGGER_TYPE.RECORD_CREATED,
        patientId: newPatient._id?.toString(),
        clinicId: newPatient.clinicId?.toString(),
      });
      // Note: Execute workflow for the created or updated patient
      executeWorkflows({
        entity: WORKFLOW_ENTITY_TYPE.PATIENT,
        trigger: WORKFLOW_TRIGGER_TYPE.RECORD_CREATE_OR_UPDATE,
        patientId: newPatient._id?.toString(),
        clinicId: newPatient.clinicId?.toString(),
      });

      return res.status(201).json({
        success: true,
        message: "Patient registered successfully",
        data: newPatient,
      });
    } catch (err) {
      console.error("POST error:", err);

      // Handle validation errors
      if (err.name === "ValidationError") {
        const validationErrors = Object.values(err.errors).map(
          (e) => e.message,
        );
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          errors: validationErrors,
        });
      }

      // Handle duplicate key errors
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists`,
        });
      }

      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  // ---------------- Default response for unsupported methods ----------------
  res.setHeader("Allow", ["GET", "POST"]);
  return res
    .status(405)
    .json({ success: false, message: `Method ${req.method} Not Allowed` });
}
