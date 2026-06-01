import dbConnect from "../../../lib/database";
import jwt from "jsonwebtoken";
import User from "../../../models/Users";
import PatientRegistration from "../../../models/PatientRegistration";

async function getUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1];
  if (!token) throw { status: 401, message: "No token provided" };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) throw { status: 401, message: "User not found" };
    return user;
  } catch {
    throw { status: 401, message: "Invalid or expired token" };
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function handler(req, res) {
  await dbConnect();
  try {
    await getUserFromToken(req);
  } catch (err) {
    return res.status(err.status || 401).json({ success: false, message: err.message });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const q = (req.query.q || "").trim();
    if (!q || q.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const regex = new RegExp("^" + escapeRegex(q), "i");
    const results = await PatientRegistration.find({ emrNumber: { $regex: regex } })
      .select("emrNumber firstName lastName mobileNumber")
      .limit(10)
      .lean();

    // Deduplicate by emrNumber in case of multiple invoices per EMR
    const seen = new Set();
    const unique = [];
    for (const r of results) {
      if (r.emrNumber && !seen.has(r.emrNumber)) {
        seen.add(r.emrNumber);
        unique.push(r);
      }
    }

    return res.status(200).json({ success: true, data: unique });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}


