import dbConnect from "../../../lib/database";
import { getUserFromReq } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!["clinic", "agent", "doctorStaff", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    return res.status(200).json({
      success: true,
      roles: ["agent", "doctorStaff"],
      labels: { agent: "Agent", doctorStaff: "DoctorStaff", all: "All Staff" },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Internal error" });
  }
}
