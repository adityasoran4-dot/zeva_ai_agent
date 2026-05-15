import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";
import Room from "../../../models/Room";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const authUser = await getUserFromReq(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Allow clinic, admin, agent, doctor, doctorStaff, and staff roles
    if (!["clinic", "admin", "agent", "doctor", "doctorStaff", "staff"].includes(authUser.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    let { clinicId, error, isAdmin } = await getClinicIdFromUser(authUser);
    if (error && !isAdmin) {
      return res.status(404).json({ message: error });
    }

    // ✅ Check permission for reading appointment data (only for agent, doctorStaff roles)
    // Clinic, doctor, and staff roles have full access by default, admin bypasses
    if (!isAdmin && clinicId && ["agent", "doctorStaff"].includes(authUser.role)) {
      const { checkAgentPermission } = await import("../agent/permissions-helper");
      const result = await checkAgentPermission(
        authUser._id,
        "clinic_Appointment",
        "read"
      );

      // If module doesn't exist in permissions yet, allow access by default
      // This handles the case where permissions haven't been set up for this module
      if (!result.hasPermission && result.error && result.error.includes("not found in agent permissions")) {
        // Module not set up yet - allow access by default for agent/doctorStaff
        console.log(`[appointment-data] Module clinic_Appointment not found in permissions for user ${authUser._id}, allowing access by default`);
      } else if (!result.hasPermission) {
        // Permission explicitly denied
        return res.status(403).json({
          success: false,
          message: result.error || "You do not have permission to view appointment data"
        });
      }
    }

    // Ensure clinicId is set correctly
    if (!clinicId && authUser.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: authUser._id }).select("_id");
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
      clinicId = clinic._id;
    }

    if (!clinicId) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    const clinic = await Clinic.findById(clinicId).lean();
    if (!clinic) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    // Fetch all doctorStaff for this clinic
    const doctorStaff = await User.find({
      role: "doctorStaff",
      clinicId: clinicId,
      isApproved: true,
      declined: false,
    })
      .select("_id name email")
      .sort({ name: 1 })
      .lean();

    // Fetch all rooms for this clinic
    const rooms = await Room.find({
      clinicId: clinicId,
    })
      .select("_id name")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      clinic: {
        _id: clinic._id.toString(),
        name: clinic.name,
        timings: clinic.timings || "",
      },
      doctorStaff: doctorStaff.map((doc) => ({
        _id: doc._id.toString(),
        name: doc.name,
        email: doc.email,
      })),
      rooms: rooms.map((room) => ({
        _id: room._id.toString(),
        name: room.name,
      })),
    });
  } catch (error) {
    console.error("Error fetching appointment data:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch appointment data" });
  }
}

