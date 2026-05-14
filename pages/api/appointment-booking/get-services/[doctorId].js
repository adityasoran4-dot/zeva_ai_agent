import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import Clinic from "../../../../models/Clinic";
import dbConnect from "../../../../lib/database";
import Users from "../../../../models/Users";
import DoctorDepartment from "../../../../models/DoctorDepartment";
import Service from "../../../../models/Service";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { doctorId } = req.query;

  if (!doctorId) {
    return res.status(400).json({
      success: false,
      message: "doctorId is required",
    });
  }

  const me = await Users.findById(doctorId);
  if (!me) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  console.log("me", me);

  if (!requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // Get clinicId based on user role
  let clinicId;
  if (me.role === "clinic") {
    const clinic = await Clinic.findOne({ owner: me._id });
    if (!clinic) {
      return res.status(400).json({
        success: false,
        message: "Clinic not found for this user",
      });
    }
    clinicId = clinic._id;
  } else if (me.role === "agent") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "Agent not tied to a clinic" });
    }
    clinicId = me.clinicId;
  } else if (me.role === "doctor" || me.role === "doctorStaff") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor not tied to a clinic" });
    }
    clinicId = me.clinicId;
  } else if (me.role === "admin") {
    clinicId = req.body.clinicId;
    if (!clinicId) {
      return res.status(400).json({
        success: false,
        message: "clinicId is required for admin",
      });
    }
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  try {
    // Step 1: Find all departments associated with the doctor
    const doctorDepartments = await DoctorDepartment.find({
      doctorId: me._id,
    }).lean();

    if (!doctorDepartments || doctorDepartments.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No departments found for this doctor",
        data: {
          departments: [],
          services: [],
          doctorId: me._id,
          clinicId,
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalServices: 0,
            hasMore: false,
          },
        },
      });
    }

    // Extract department IDs
    const departmentIds = doctorDepartments
      .map((dept) => dept.clinicDepartmentId)
      .filter((id) => id); // Filter out null values

    // Step 2: Build services query
    let servicesQuery = {
      clinicId: clinicId,
      isActive: true,
    };

    // If department IDs exist, filter by them
    if (departmentIds.length > 0) {
      servicesQuery.departmentId = { $in: departmentIds };
    }

    // Add search functionality
    const { search = "", page = 1, limit = 10 } = req.query;

    if (search) {
      servicesQuery.name = { $regex: search, $options: "i" };
    }

    // Get total count for pagination
    const totalServices = await Service.countDocuments(servicesQuery);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalPages = Math.ceil(totalServices / parseInt(limit));

    // Fetch services with pagination
    const services = await Service.find(servicesQuery)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Step 3: Format the response
    const formattedServices = services.map((service) => ({
      _id: service._id,
      name: service.name,
      serviceSlug: service.serviceSlug,
      price: service.price,
      clinicPrice: service.clinicPrice,
      durationMinutes: service.durationMinutes,
      departmentId: service.departmentId,
      isActive: service.isActive,
    }));

    // Step 4: Format departments data
    const formattedDepartments = doctorDepartments.map((dept) => ({
      _id: dept._id,
      doctorId: dept.doctorId,
      clinicDepartmentId: dept.clinicDepartmentId,
      name: dept.name,
    }));

    return res.status(200).json({
      success: true,
      message: "Services found successfully",
      data: {
        doctor: {
          _id: me._id,
          name: me.name,
          email: me.email,
        },
        clinicId,
        departments: formattedDepartments,
        services: formattedServices,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalServices,
          hasMore: parseInt(page) < totalPages,
        },
        summary: {
          totalDepartments: doctorDepartments.length,
          totalServices: formattedServices.length,
          departmentsWithServices: departmentIds.length,
        },
      },
    });
  } catch (err) {
    console.error("Error fetching doctor services:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
