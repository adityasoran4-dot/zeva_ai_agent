import dbConnect from "../../../lib/database";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";
import { generateEmrNumber } from "../../../lib/generateEmrNumber";

const hasRole = (user, roles = []) => roles.includes(user.role);

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    // Get authenticated user
    let user;
    try {
      user = await getAuthorizedStaffUser(req, {
        allowedRoles: ["staff", "doctorStaff", "doctor", "clinic", "agent", "admin"],
      });
    } catch (err) {
      return res.status(err.status || 401).json({ success: false, message: err.message || "Authentication error" });
    }

    if (!hasRole(user, ["clinic", "staff", "admin", "agent", "doctorStaff", "doctor"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Generate EMR number
    const emrNumber = await generateEmrNumber();

    return res.status(200).json({
      success: true,
      emrNumber: emrNumber,
    });
  } catch (error) {
    console.error("Error generating EMR number:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate EMR number",
    });
  }
}
