import dbConnect from "../../../lib/database";
import PatientRegistration from "../../../models/PatientRegistration";
import Referral from "../../../models/Referral";
import { generateEmrNumber } from "../../../lib/generateEmrNumber";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";
import { checkClinicPermission } from "../lead-ms/permissions-helper";
import { checkAgentPermission } from "../agent/permissions-helper";
import Clinic from "../../../models/Clinic";
import Lead from "../../../models/Lead";
import {
  executeWorkflows,
  WORKFLOW_ENTITY_TYPE,
  WORKFLOW_TRIGGER_TYPE,
} from "../../../bullmq/workflow";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
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
      return res.status(err.status || 401).json({
        success: false,
        message: err.message || "Authentication error",
      });
    }

    // Role gate (same as patient-registration)
    if (
      !["clinic", "staff", "admin", "agent", "doctorStaff", "doctor"].includes(
        user.role,
      )
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Permission checks (admin bypasses)
    let clinic;
    if (user.role !== "admin") {
      if (user.role === "clinic") {
        clinic = await Clinic.findOne({ owner: user._id });
        if (clinic) {
          const { hasPermission, error } = await checkClinicPermission(
            clinic._id,
            "patient_registration",
            "create",
          );
          if (!hasPermission) {
            return res.status(403).json({
              success: false,
              message: error || "You do not have permission to create patients",
            });
          }
        }
      } else if (user.role === "agent") {
        const { hasPermission, error } = await checkAgentPermission(
          user._id,
          "patient_registration",
          "create",
        );
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: error || "You do not have permission to create patients",
          });
        }

        clinic = await Clinic.findById(user.clinicId);
      } else if (user.role === "doctorStaff") {
        const { hasPermission, error } = await checkAgentPermission(
          user._id,
          "patient_registration",
          "create",
        );
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: error || "You do not have permission to create patients",
          });
        }
        clinic = await Clinic.findById(user.clinicId);
      }
    }

    const {
      emrNumber,
      firstName,
      lastName,
      gender,
      email,
      mobileNumber,
      referredBy,
      referredById,
      patientType,
    } = req.body;

    const normalizedGender =
      gender && String(gender).trim() ? String(gender).trim() : undefined;

    // Validation aligned to PatientRegistration model
    if (!firstName || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: firstName and mobileNumber are required",
      });
    }

    // Check if patient with same mobile number exists
    const existingPatient = await PatientRegistration.findOne({
      clinicId: clinic._id,
      mobileNumber,
    });
    console.log({
      existingPatient,
      clinicId: clinic._id,
      mobileNumber,
      user,
    });

    if (existingPatient) {
      return res.status(200).json({
        success: true,
        message: "Patient already exists",
        patient: {
          _id: existingPatient._id.toString(),
          firstName: existingPatient.firstName,
          lastName: existingPatient.lastName,
          fullName:
            `${existingPatient.firstName || ""} ${existingPatient.lastName || ""}`.trim(),
          mobileNumber: existingPatient.mobileNumber,
          email: existingPatient.email,
          emrNumber: existingPatient.emrNumber,
          gender: existingPatient.gender,
        },
      });
    }

    // Generate invoice number
    let invoiceNumber;
    let attempts = 0;
    let invoiceExists = true;
    while (invoiceExists && attempts < 10) {
      invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      invoiceExists = await PatientRegistration.findOne({ invoiceNumber });
      attempts++;
    }
    if (invoiceExists) {
      return res.status(500).json({
        success: false,
        message: "Could not generate unique invoice number. Please try again.",
      });
    }

    // Generate EMR number if not provided or empty
    let finalEmrNumber = emrNumber?.trim() || "";
    if (!finalEmrNumber) {
      finalEmrNumber = await generateEmrNumber();
    }

    // Create new patient with minimal required fields
    let referredByName = referredBy || "";
    let finalReferredById = null;
    if (referredById) {
      try {
        const ref = await Referral.findById(referredById).lean();
        if (ref) {
          referredByName = [ref.firstName, ref.lastName]
            .filter(Boolean)
            .join(" ")
            .trim();
          finalReferredById = ref._id;
        }
      } catch {}
    }

    const newPatient = await PatientRegistration.create({
      clinicId: clinic._id,
      invoiceNumber,
      invoicedDate: new Date(),
      invoicedBy: user.name || user.email || "Clinic",
      userId: user._id,
      emrNumber: finalEmrNumber,
      firstName,
      lastName: lastName || "",
      gender: normalizedGender,
      email: email || "",
      mobileNumber,
      referredById: finalReferredById,
      referredBy: referredByName,
      patientType: patientType || "New",
      ...(req.body.leadId && { leadId: req.body.leadId }),
    });

    if (req.body.leadId) {
      await Lead.findByIdAndUpdate(req.body.leadId, {
        patientId: newPatient._id,
      });
    }

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
      message: "Patient created successfully",
      patient: {
        _id: newPatient._id.toString(),
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        fullName:
          `${newPatient.firstName || ""} ${newPatient.lastName || ""}`.trim(),
        mobileNumber: newPatient.mobileNumber,
        email: newPatient.email,
        emrNumber: newPatient.emrNumber,
        gender: newPatient.gender,
      },
    });
  } catch (error) {
    console.error("Error creating patient:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Patient with this invoice number already exists",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create patient",
      error: error.message,
    });
  }
}
