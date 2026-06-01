import dbConnect from "../../../lib/database";
import Department from "../../../models/Department";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  // Verify authentication
  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    // Allow clinic, doctor, agent, doctorStaff, and staff roles
    if (!["clinic", "doctor", "agent", "doctorStaff", "staff"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  // Get clinic ID from user
  const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
  if (clinicError || !clinicId) {
    return res.status(403).json({ 
      success: false,
      message: clinicError || "Unable to determine clinic access" 
    });
  }

  // GET: Fetch all departments for this clinic
  if (req.method === "GET") {
    try {
      // Determine which module to check permissions for based on query parameter
      // Default to "clinic_addRoom" for backward compatibility
      // When accessed from create-agent page, it should check "clinic_create_agent"
      const moduleToCheck = req.query.module || "clinic_addRoom";
      
      // For Clinic_services_setup module, allow access if user has create OR read permission
      // This ensures departments can be loaded for the create form even when read is false
      let hasPermission = false;
      
      if (moduleToCheck === "Clinic_services_setup" || moduleToCheck === "clinic_services_setup") {
        // Check both read and create permissions
        const { hasPermission: canRead } = await checkClinicPermission(
          clinicId,
          moduleToCheck,
          "read"
        );
        const { hasPermission: canCreate } = await checkClinicPermission(
          clinicId,
          moduleToCheck,
          "create"
        );
        hasPermission = canRead || canCreate;
      } else {
        // For other modules, check read permission only
        const { hasPermission: permResult, error: permError } = await checkClinicPermission(
          clinicId,
          moduleToCheck,
          "read"
        );
        hasPermission = permResult;
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permError || "You do not have permission to view departments",
          });
        }
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to view departments",
        });
      }

      const departments = await Department.find({ clinicId })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        departments: departments.map((dept) => ({
          _id: dept._id.toString(),
          name: dept.name,
          createdAt: dept.createdAt,
          updatedAt: dept.updatedAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching departments:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch departments" });
    }
  }

  // POST: Create a new department
  if (req.method === "POST") {
    try {
      // Determine which module to check permissions for based on query parameter or body
      const moduleToCheck = req.query.module || req.body.module || "clinic_addRoom";
      
      // Check create permission for the specified module
      const { hasPermission, error: permError } = await checkClinicPermission(
        clinicId,
        moduleToCheck,
        "create",
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to create departments",
        });
      }

      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Department name is required" });
      }

      // Check if department with same name already exists for this clinic
      const existingDepartment = await Department.findOne({
        clinicId,
        name: name.trim(),
      });

      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: "A department with this name already exists",
        });
      }

      const newDepartment = await Department.create({
        clinicId,
        name: name.trim(),
        createdBy: user._id,
      });

      return res.status(201).json({
        success: true,
        message: "Department created successfully",
        department: {
          _id: newDepartment._id.toString(),
          name: newDepartment.name,
          createdAt: newDepartment.createdAt,
          updatedAt: newDepartment.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error creating department:", error);
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "A department with this name already exists",
        });
      }
      return res.status(500).json({ success: false, message: "Failed to create department" });
    }
  }

  // PUT: Update an existing department
  if (req.method === "PUT") {
    try {
      // Determine which module to check permissions for based on query parameter or body
      const moduleToCheck = req.query.module || req.body.module || "clinic_addRoom";
      
      // Check update permission for the specified module
      const { hasPermission, error: permError } = await checkClinicPermission(
        clinicId,
        moduleToCheck,
        "update",
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to update departments",
        });
      }

      const { departmentId, name } = req.body;

      if (!departmentId || !name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Department ID and new name are required",
        });
      }

      const department = await Department.findOne({ _id: departmentId, clinicId });
      if (!department) {
        return res.status(404).json({ success: false, message: "Department not found" });
      }

      const normalizedName = name.trim();
      const duplicateDepartment = await Department.findOne({
        clinicId,
        name: normalizedName,
        _id: { $ne: departmentId },
      });

      if (duplicateDepartment) {
        return res.status(400).json({
          success: false,
          message: "Another department with this name already exists",
        });
      }

      department.name = normalizedName;
      await department.save();

      return res.status(200).json({
        success: true,
        message: "Department updated successfully",
        department: {
          _id: department._id.toString(),
          name: department.name,
          createdAt: department.createdAt,
          updatedAt: department.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error updating department:", error);
      return res.status(500).json({ success: false, message: "Failed to update department" });
    }
  }

  // DELETE: Delete a department
  if (req.method === "DELETE") {
    try {
      // Determine which module to check permissions for based on query parameter
      const moduleToCheck = req.query.module || "clinic_addRoom";
      
      // Check delete permission for the specified module
      const { hasPermission, error: permError } = await checkClinicPermission(
        clinicId,
        moduleToCheck,
        "delete",
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to delete departments",
        });
      }

      const { departmentId } = req.query;

      if (!departmentId) {
        return res.status(400).json({ success: false, message: "Department ID is required" });
      }

      // Verify the department belongs to this clinic
      const department = await Department.findOne({ _id: departmentId, clinicId });
      if (!department) {
        return res.status(404).json({ success: false, message: "Department not found" });
      }

      await Department.findByIdAndDelete(departmentId);

      return res.status(200).json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting department:", error);
      return res.status(500).json({ success: false, message: "Failed to delete department" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).json({ success: false, message: "Method not allowed" });
}

