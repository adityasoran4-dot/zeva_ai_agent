import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Get the logged-in user
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ message: "Unauthorized: Missing or invalid token" });
    }

    // Determine clinicId based on user role
    let clinicId = null;
    if (clinicUser.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: clinicUser._id }).lean();
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }
      clinicId = clinic._id;
    } else if (["agent", "doctor", "doctorStaff", "staff"].includes(clinicUser.role)) {
      clinicId = clinicUser.clinicId;
      if (!clinicId) {
        return res.status(403).json({ message: "Access denied. User not linked to a clinic." });
      }
    } else {
      return res.status(403).json({ message: "Access denied. Clinic, agent, doctor, or staff role required." });
    }

    const { date, staffName } = req.query;

    // ✅ Fetch staff/doctorStaff/agent users that belong to this clinic
    const staffUsers = await User.find({
      role: { $in: ["staff", "doctorStaff", "agent"] },
      clinicId: clinicId, // ✅ Filter by clinicId
      isApproved: true,
    }).select("name eodNotes role");

    // ✅ Collect all notes with staff name and role
    let allNotes = [];
    staffUsers.forEach((user) => {
      user.eodNotes.forEach((note) => {
        const noteDate = new Date(note.createdAt);
        allNotes.push({
          staffName: user.name,
          staffRole: user.role,
          note: note.note,
          createdAt: noteDate,
        });
      });
    });

    // ✅ Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      allNotes = allNotes.filter(
        (n) => n.createdAt >= startOfDay && n.createdAt <= endOfDay
      );
    }

    // ✅ Filter by staff name if provided
    if (staffName) {
      allNotes = allNotes.filter(
        (n) => n.staffName.toLowerCase() === staffName.toLowerCase()
      );
    }

    // ✅ Sort newest first
    allNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // ✅ Return separate lists for staff (including agents) and doctor staff names (only from this clinic)
    const staffList = staffUsers.filter(s => s.role === "staff" || s.role === "agent").map((s) => s.name);
    const doctorStaffList = staffUsers.filter(s => s.role === "doctorStaff").map((s) => s.name);

    return res.status(200).json({
      message: "EOD notes fetched successfully",
      eodNotes: allNotes,
      staffList,
      doctorStaffList,
    });
  } catch (error) {
    console.error("Clinic EOD Notes Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

