import dbConnect from "../../../lib/database";
import PatientRegistration from "../../../models/PatientRegistration";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    // Verify authentication
    const authUser = await getUserFromReq(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Allow clinic, admin, agent, doctor, doctorStaff, and staff roles
    if (!["clinic", "admin", "agent", "doctor", "doctorStaff", "staff"].includes(authUser.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Get clinicId for permission checks
    let { clinicId, error, isAdmin } = await getClinicIdFromUser(authUser);
    if (error && !isAdmin) {
      return res.status(404).json({ success: false, message: error });
    }

    // Check permission for agent and doctorStaff roles - require create permission on appointment module
    // Clinic, doctor, staff roles have full access by default, admin bypasses
    if (!isAdmin && clinicId && ["agent", "doctorStaff"].includes(authUser.role)) {
      const { checkAgentPermission } = await import("../agent/permissions-helper");
      const result = await checkAgentPermission(
        authUser._id,
        "clinic_Appointment",
        "create"
      );

      // If module doesn't exist in permissions yet, allow access by default
      if (!result.hasPermission && result.error && result.error.includes("not found in agent permissions")) {
        // Module not set up yet - allow access by default for agent/doctorStaff
        console.log(`[search-patients] Module clinic_Appointment not found in permissions for user ${authUser._id}, allowing access by default`);
      } else if (!result.hasPermission) {
        // Permission explicitly denied
        return res.status(403).json({
          success: false,
          message: result.error || "You do not have permission to search patients"
        });
      }
    }

    const { search } = req.query;

    // Allow single character search for better UX
    if (!search || search.trim().length < 1) {
      return res.status(200).json({ success: true, patients: [] });
    }

    const searchTerm = search.trim();

    // Build clinic-scoped user filter
    let userIdFilter = null;
    if (authUser.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: authUser._id }).select("_id owner");
      if (clinic) {
        const clinicUsers = await User.find({
          $or: [{ _id: clinic.owner }, { clinicId: clinic._id }],
        }).select("_id");
        userIdFilter = { $in: clinicUsers.map((u) => u._id) };
      } else {
        userIdFilter = authUser._id;
      }
    } else if (["agent", "doctorStaff", "staff"].includes(authUser.role)) {
      if (authUser.clinicId) {
        const clinic = await Clinic.findById(authUser.clinicId).select("_id owner");
        if (clinic) {
          const clinicUsers = await User.find({
            $or: [{ _id: clinic.owner }, { clinicId: authUser.clinicId }],
          }).select("_id");
          userIdFilter = { $in: clinicUsers.map((u) => u._id) };
        } else {
          userIdFilter = authUser._id;
        }
      } else {
        userIdFilter = authUser._id;
      }
    } else if (authUser.role === "doctor") {
      if (authUser.clinicId) {
        const clinic = await Clinic.findById(authUser.clinicId).select("_id owner");
        if (clinic) {
          const clinicUsers = await User.find({
            $or: [{ _id: clinic.owner }, { clinicId: authUser.clinicId }],
          }).select("_id");
          userIdFilter = { $in: clinicUsers.map((u) => u._id) };
        } else {
          userIdFilter = authUser._id;
        }
      } else {
        userIdFilter = authUser._id;
      }
    } else if (authUser.role === "admin") {
      const qClinicId = req.query.clinicId;
      if (!qClinicId) {
        return res.status(400).json({ success: false, message: "Admin must provide clinicId to search patients" });
      }
      const clinic = await Clinic.findById(qClinicId).select("_id owner");
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
      const clinicUsers = await User.find({
        $or: [{ _id: clinic.owner }, { clinicId: clinic._id }],
      }).select("_id");
      userIdFilter = { $in: clinicUsers.map((u) => u._id) };
    } else {
      userIdFilter = authUser._id;
    }

    // Search by firstName, lastName, mobileNumber, email, or EMR number
    // Using case-insensitive regex for partial matching
    const patients = await PatientRegistration.find({
      $and: [
        { userId: userIdFilter },
        {
          $or: [
            { firstName: { $regex: searchTerm, $options: "i" } },
            { lastName: { $regex: searchTerm, $options: "i" } },
            { mobileNumber: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
            { emrNumber: { $regex: searchTerm, $options: "i" } },
            { $expr: { $regexMatch: { input: { $concat: ["$firstName", " ", "$lastName"] }, regex: searchTerm, options: "i" } } },
          ],
        },
      ],
    })
      .select("_id firstName lastName mobileNumber email emrNumber gender")
      .limit(30) // Increased limit for better results
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      patients: patients.map((patient) => ({
        _id: patient._id.toString(),
        firstName: patient.firstName,
        lastName: patient.lastName,
        fullName: `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
        mobileNumber: patient.mobileNumber,
        email: patient.email,
        emrNumber: patient.emrNumber,
        gender: patient.gender,
      })),
    });
  } catch (error) {
    console.error("Error searching patients:", error);
    return res.status(500).json({ success: false, message: "Failed to search patients" });
  }
}

