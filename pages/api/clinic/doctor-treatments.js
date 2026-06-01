import dbConnect from "../../../lib/database";
import DoctorTreatment from "../../../models/DoctorTreatment";
import Treatment from "../../../models/Treatment";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import mongoose from "mongoose";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";
import {
  formatDoctorTreatments,
  ensureUniqueTreatmentSlug,
  slugifyValue,
} from "../../../server/staff/doctorTreatmentService";

export default async function handler(req, res) {
  await dbConnect();

  // Verify clinic admin authentication
  let clinicAdmin;
  try {
    clinicAdmin = await getUserFromReq(req);
    if (!clinicAdmin) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!["clinic", "doctor", "admin", "agent", "doctorStaff", "staff"].includes(clinicAdmin.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  let { clinicId, error, isAdmin } = await getClinicIdFromUser(clinicAdmin);
  if (error && !isAdmin) {
    return res.status(404).json({ message: error });
  }

  const { doctorStaffId } = req.query;

  if (req.method === "GET") {
    // Determine which module to check permissions for based on query parameter
    // Default to "clinic_Appointment" for backward compatibility
    // When accessed from create-agent page, it should check "clinic_create_agent"
    const moduleToCheck = req.query.module || "clinic_Appointment";
    
    // ✅ Check permission for reading doctor treatments
    // For agent/doctorStaff roles, check clinic permissions if module is provided, otherwise use agent permissions
    if (!isAdmin && clinicId && ["agent", "doctorStaff"].includes(clinicAdmin.role)) {
      // If module starts with "clinic_", use checkClinicPermission
      if (moduleToCheck.startsWith("clinic_")) {
        const { hasPermission, error: permError } = await checkClinicPermission(
          clinicId,
          moduleToCheck,
          "read"
        );
        
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permError || "You do not have permission to view doctor treatments"
          });
        }
      } else {
        // Use agent permissions for other modules
        const { checkAgentPermission } = await import("../agent/permissions-helper");
        const result = await checkAgentPermission(
          clinicAdmin._id,
          moduleToCheck,
          "read"
        );

        // If module doesn't exist in permissions yet, allow access by default
        if (!result.hasPermission && result.error && result.error.includes("not found in agent permissions")) {
          console.log(`[doctor-treatments] Module ${moduleToCheck} not found in permissions for user ${clinicAdmin._id}, allowing access by default`);
        } else if (!result.hasPermission) {
          return res.status(403).json({
            success: false,
            message: result.error || "You do not have permission to view doctor treatments"
          });
        }
      }
    }
    if (!doctorStaffId) {
      return res.status(400).json({ success: false, message: "doctorStaffId is required" });
    }

    try {
      // Verify doctorStaff exists and belongs to clinic
      const doctorStaff = await User.findById(doctorStaffId);
      if (!doctorStaff || doctorStaff.role !== "doctorStaff") {
        return res.status(404).json({ success: false, message: "Doctor staff not found" });
      }

      // Verify clinic access for non-admin roles
      if (clinicAdmin.role === "clinic") {
        // Clinic users don't have clinicId - find their clinic by owner
        const clinic = await Clinic.findOne({ owner: clinicAdmin._id }).select("_id");
        if (!clinic) {
          return res.status(403).json({ success: false, message: "Clinic not found" });
        }
        const clinicId = clinic._id;
        if (doctorStaff.clinicId?.toString() !== clinicId?.toString()) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
      } else if (["agent", "doctorStaff", "staff"].includes(clinicAdmin.role)) {
        // For agent, doctorStaff, and staff, verify they belong to the same clinic
        if (!clinicAdmin.clinicId) {
          return res.status(403).json({ success: false, message: "User not linked to a clinic" });
        }
        if (doctorStaff.clinicId?.toString() !== clinicAdmin.clinicId?.toString()) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
      }

      const treatments = await formatDoctorTreatments(doctorStaffId);
      return res.status(200).json({ success: true, treatments });
    } catch (error) {
      console.error("Error fetching doctor treatments:", error);
      return res.status(500).json({ success: false, message: "Failed to load treatments" });
    }
  }

  if (req.method === "POST") {
    // Determine which module to check permissions for based on query parameter or body
    // Default to "clinic_Appointment" for backward compatibility
    // When accessed from create-agent page, it should check "clinic_create_agent"
    const moduleToCheck = req.query.module || req.body.module || "clinic_Appointment";
    
    // ✅ Check permission for creating/updating doctor treatments
    // For agent/doctorStaff roles, check clinic permissions if module is provided, otherwise use agent permissions
    if (!isAdmin && clinicId) {
      if (["agent", "doctorStaff"].includes(clinicAdmin.role)) {
        // If module starts with "clinic_", use checkClinicPermission
        if (moduleToCheck.startsWith("clinic_")) {
          const { hasPermission, error: permError } = await checkClinicPermission(
            clinicId,
            moduleToCheck,
            "update"
          );
          
          if (!hasPermission) {
            return res.status(403).json({
              success: false,
              message: permError || "You do not have permission to update doctor treatments"
            });
          }
        } else {
          // Use agent permissions for other modules
          const { checkAgentPermission } = await import("../agent/permissions-helper");
          const result = await checkAgentPermission(
            clinicAdmin._id,
            moduleToCheck,
            "update"
          );

          // If module doesn't exist in permissions yet, allow access by default
          if (!result.hasPermission && result.error && result.error.includes("not found in agent permissions")) {
            console.log(`[doctor-treatments] Module ${moduleToCheck} not found in permissions for user ${clinicAdmin._id}, allowing access by default`);
          } else if (!result.hasPermission) {
            return res.status(403).json({
              success: false,
              message: result.error || "You do not have permission to update doctor treatments"
            });
          }
        }
      }
    }

    const { doctorStaffId: bodyDoctorStaffId, treatmentId, treatmentName, subTreatments, subcategoryIds, price, department } = req.body;
    const targetDoctorStaffId = doctorStaffId || bodyDoctorStaffId;

    if (!targetDoctorStaffId) {
      return res.status(400).json({ success: false, message: "doctorStaffId is required" });
    }

    try {
      // Verify doctorStaff exists and belongs to clinic
      const doctorStaff = await User.findById(targetDoctorStaffId);
      if (!doctorStaff || doctorStaff.role !== "doctorStaff") {
        return res.status(404).json({ success: false, message: "Doctor staff not found" });
      }

      // Verify clinic access for non-admin roles
      if (clinicAdmin.role === "clinic") {
        // Clinic users don't have clinicId - find their clinic by owner
        const clinic = await Clinic.findOne({ owner: clinicAdmin._id }).select("_id");
        if (!clinic) {
          return res.status(403).json({ success: false, message: "Clinic not found" });
        }
        const clinicId = clinic._id;
        if (doctorStaff.clinicId?.toString() !== clinicId?.toString()) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
      } else if (["agent", "doctorStaff", "staff"].includes(clinicAdmin.role)) {
        // For agent, doctorStaff, and staff, verify they belong to the same clinic
        if (!clinicAdmin.clinicId) {
          return res.status(403).json({ success: false, message: "User not linked to a clinic" });
        }
        if (doctorStaff.clinicId?.toString() !== clinicAdmin.clinicId?.toString()) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
      }

      let finalTreatmentId = treatmentId;

      // If creating custom treatment
      if (treatmentName && !treatmentId) {
        if (!treatmentName.trim()) {
          return res.status(400).json({ success: false, message: "Treatment name is required" });
        }

        const treatmentSlug = await ensureUniqueTreatmentSlug(treatmentName);

        const normalizedSubs = Array.isArray(subTreatments)
          ? subTreatments
              .filter((sub) => sub?.name?.trim())
              .map((sub) => ({
                name: sub.name.trim(),
                slug: slugifyValue(sub.name),
                price: sub.price && !Number.isNaN(Number(sub.price)) ? Number(sub.price) : 0,
              }))
          : [];

        const treatmentDoc = await Treatment.create({
          name: treatmentName.trim(),
          slug: treatmentSlug,
          subcategories: normalizedSubs,
        });

        finalTreatmentId = treatmentDoc._id;
      }

      if (!finalTreatmentId) {
        return res.status(400).json({ success: false, message: "Treatment ID or name is required" });
      }

      // Verify treatment exists - handle both ObjectId and slug formats
      let treatmentExists;
      if (mongoose.Types.ObjectId.isValid(finalTreatmentId)) {
        // Valid ObjectId format - look up by ID
        treatmentExists = await Treatment.findById(finalTreatmentId).lean();
      } else {
        // Not a valid ObjectId - likely a slug, look up by slug
        treatmentExists = await Treatment.findOne({ slug: finalTreatmentId }).lean();
        if (treatmentExists) {
          // Update finalTreatmentId to the actual ObjectId
          finalTreatmentId = treatmentExists._id;
        }
      }
      
      if (!treatmentExists) {
        return res.status(404).json({ success: false, message: "Treatment not found" });
      }

      const payload = {
        doctorId: targetDoctorStaffId,
        treatmentId: finalTreatmentId,
        subcategoryIds: Array.isArray(subcategoryIds)
          ? subcategoryIds.filter(Boolean)
          : treatmentExists.subcategories?.map((sub) => sub.slug || sub.name) || [],
      };

      if (price !== undefined && price !== null && price !== "") {
        const parsedPrice = Number(price);
        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
          return res.status(400).json({ success: false, message: "Price must be a positive number" });
        }
        payload.price = parsedPrice;
      }

      // Handle department if provided
      if (department) {
        const Department = (await import("../../../models/Department")).default;
        // Verify department belongs to clinic
        if (clinicAdmin.role === "clinic") {
          const clinic = await Clinic.findOne({ owner: clinicAdmin._id }).select("_id");
          if (clinic) {
            const dept = await Department.findOne({ _id: department, clinicId: clinic._id });
            if (!dept) {
              return res.status(400).json({
                success: false,
                message: "Department not found or does not belong to this clinic",
              });
            }
          }
        }
        payload.department = department;
      }

      await DoctorTreatment.findOneAndUpdate(
        { doctorId: targetDoctorStaffId, treatmentId: finalTreatmentId },
        payload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const treatments = await formatDoctorTreatments(targetDoctorStaffId);

      return res.status(201).json({
        success: true,
        message: treatmentName ? "Custom treatment created and assigned successfully" : "Treatment assigned successfully",
        treatments,
      });
    } catch (error) {
      console.error("Error saving doctor treatment:", error);
      return res.status(500).json({ success: false, message: "Failed to save treatment" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ success: false, message: "Method not allowed" });
}

