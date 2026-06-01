// pages/api/admin/get-staff.js
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me || !requireRole(me, ["admin"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Get query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const search = req.query.search || "";
    const role = req.query.role || ""; // "staff" or "doctorStaff"

    // Build query
    const query = { role: { $in: ["staff", "doctorStaff"] } };

    // Filter by role if specified
    if (role && (role === "staff" || role === "doctorStaff")) {
      query.role = role;
    }

    // Add search filter if provided
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await User.countDocuments(query);

    // Fetch paginated staff
    const staffList = await User.find(query)
      .select("-password") // exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      staff: staffList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    // console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
