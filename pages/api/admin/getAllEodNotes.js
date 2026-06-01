import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ message: "Unauthorized: Missing or invalid token" });
    }
    
    // Check permissions for agents - admins bypass all checks
    if (me.role === 'agent' || me.role === 'doctorStaff') {
      const { hasPermission } = await checkAgentPermission(me._id, "admin_staff_management", "read", "View EOD Report");
      if (!hasPermission) {
        return res.status(403).json({ 
          message: "Permission denied: You do not have read permission for View EOD Report submodule" 
        });
      }
    } else if (me.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin or agent role required" });
    }

    const { date, staffName } = req.query;

    // ✅ Fetch all approved staff/doctorStaff users
    const staffUsers = await User.find({
      role: { $in: ["staff", "doctorStaff"] },
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

    // ✅ Return separate lists for staff and doctor staff names
    const staffList = staffUsers.filter(s => s.role === "staff").map((s) => s.name);
    const doctorStaffList = staffUsers.filter(s => s.role === "doctorStaff").map((s) => s.name);

    return res.status(200).json({
      message: "EOD notes fetched successfully",
      eodNotes: allNotes,
      staffList,
      doctorStaffList,
    });
  } catch (error) {
    // console.error("Admin EOD Notes Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
