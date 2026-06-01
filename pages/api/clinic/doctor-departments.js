import dbConnect from "../../../lib/database";
import DoctorDepartment from "../../../models/DoctorDepartment";
import Department from "../../../models/Department";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";

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
    // ✅ Bypass permission check for reading doctor departments for agent/doctorStaff roles
    // This is required for Smart Recommendations in the Complaint Modal
    /*
    if (!isAdmin && clinicId && ["agent", "doctorStaff"].includes(clinicAdmin.role)) {
      const { checkAgentPermission } = await import("../agent/permissions-helper");
      const result = await checkAgentPermission(
        clinicAdmin._id,
        "clinic_Appointment",
        "read"
      );

      // If module doesn't exist in permissions yet, allow access by default
      if (!result.hasPermission && result.error && result.error.includes("not found in agent permissions")) {
        console.log(`[doctor-departments] Module clinic_Appointment not found in permissions for user ${clinicAdmin._id}, allowing access by default`);
      } else if (!result.hasPermission) {
        return res.status(403).json({
          success: false,
          message: result.error || "You do not have permission to view doctor departments"
        });
      }
    }
    */
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

      const departments = await DoctorDepartment.find({ doctorId: doctorStaffId })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        departments: departments.map((dept) => ({
          _id: dept._id.toString(),
          name: dept.name,
          clinicDepartmentId: dept.clinicDepartmentId?.toString() || null,
          createdAt: dept.createdAt,
          updatedAt: dept.updatedAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching doctor departments:", error);
      return res.status(500).json({ success: false, message: "Failed to load departments" });
    }
  }

  if (req.method === "POST") {
    // ✅ Check permission for creating doctor departments (only for agent, doctorStaff roles)
    // Clinic, doctor, and staff roles have full access by default, admin bypasses
    if (!isAdmin && clinicId && ["agent", "doctorStaff"].includes(clinicAdmin.role)) {
      const { checkAgentPermission } = await import("../agent/permissions-helper");
      const result = await checkAgentPermission(
        clinicAdmin._id,
        "clinic_Appointment",
        "create"
      );

      // If module doesn't exist in permissions yet, allow access by default
      if (!result.hasPermission && result.error && result.error.includes("not found in agent permissions")) {
        console.log(`[doctor-departments] Module clinic_Appointment not found in permissions for user ${clinicAdmin._id}, allowing access by default`);
      } else if (!result.hasPermission) {
        return res.status(403).json({
          success: false,
          message: result.error || "You do not have permission to create doctor departments"
        });
      }
    }

    const { doctorStaffId: bodyDoctorStaffId, name, clinicDepartmentId } = req.body;
    const targetDoctorStaffId = doctorStaffId || bodyDoctorStaffId;

    if (!targetDoctorStaffId) {
      return res.status(400).json({ success: false, message: "doctorStaffId is required" });
    }

    if (!clinicDepartmentId) {
      return res.status(400).json({ success: false, message: "clinicDepartmentId is required" });
    }

    try {
      // Verify doctorStaff exists and belongs to clinic
      const doctorStaff = await User.findById(targetDoctorStaffId);
      if (!doctorStaff || doctorStaff.role !== "doctorStaff") {
        return res.status(404).json({ success: false, message: "Doctor staff not found" });
      }

      // Verify clinic access for non-admin roles
      if (clinicAdmin.role === "clinic") {
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

      const clinicDepartment = await Department.findById(clinicDepartmentId);
      if (!clinicDepartment) {
        return res.status(404).json({ success: false, message: "Clinic department not found" });
      }

      // Ensure clinic department belongs to the same clinic as doctor
      if (
        clinicDepartment.clinicId?.toString() &&
        doctorStaff.clinicId &&
        clinicDepartment.clinicId.toString() !== doctorStaff.clinicId.toString()
      ) {
        return res.status(403).json({ success: false, message: "Department does not belong to this clinic" });
      }

      // Check if department with same name already exists for this doctor
      const existingDepartment = await DoctorDepartment.findOne({
        doctorId: targetDoctorStaffId,
        clinicDepartmentId,
      });

      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: "A department with this name already exists for this doctor",
        });
      }

      const newDepartment = await DoctorDepartment.create({
        doctorId: targetDoctorStaffId,
        clinicDepartmentId,
        name: name?.trim() || clinicDepartment.name,
      });

      return res.status(201).json({
        success: true,
        message: "Department added successfully",
        department: {
          _id: newDepartment._id.toString(),
          name: newDepartment.name,
          clinicDepartmentId: newDepartment.clinicDepartmentId?.toString() || null,
          createdAt: newDepartment.createdAt,
          updatedAt: newDepartment.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error creating doctor department:", error);
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "A department with this name already exists for this doctor",
        });
      }
      return res.status(500).json({ success: false, message: "Failed to add department" });
    }
  }

  if (req.method === "DELETE") {
    // ✅ Check permission for deleting doctor departments (only for agent, doctorStaff roles)
    // Clinic, doctor, and staff roles have full access by default, admin bypasses
    if (!isAdmin && clinicId && ["agent", "doctorStaff"].includes(clinicAdmin.role)) {
      const { checkAgentPermission } = await import("../agent/permissions-helper");
      const result = await checkAgentPermission(
        clinicAdmin._id,
        "clinic_Appointment",
        "delete"
      );

      // If module doesn't exist in permissions yet, allow access by default
      if (!result.hasPermission && result.error && result.error.includes("not found in agent permissions")) {
        console.log(`[doctor-departments] Module clinic_Appointment not found in permissions for user ${clinicAdmin._id}, allowing access by default`);
      } else if (!result.hasPermission) {
        return res.status(403).json({
          success: false,
          message: result.error || "You do not have permission to delete doctor departments"
        });
      }
    }

    const { departmentId } = req.query;

    if (!departmentId) {
      return res.status(400).json({ success: false, message: "Department ID is required" });
    }

    try {
      const department = await DoctorDepartment.findById(departmentId);
      if (!department) {
        return res.status(404).json({ success: false, message: "Department not found" });
      }

      // Verify doctorStaff belongs to clinic
      const doctorStaff = await User.findById(department.doctorId);
      if (!doctorStaff || doctorStaff.role !== "doctorStaff") {
        return res.status(404).json({ success: false, message: "Doctor staff not found" });
      }

      // Verify clinic access for non-admin roles
      if (clinicAdmin.role === "clinic") {
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

      await DoctorDepartment.findByIdAndDelete(departmentId);

      return res.status(200).json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting doctor department:", error);
      return res.status(500).json({ success: false, message: "Failed to delete department" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ success: false, message: "Method not allowed" });
}

