//api/compliance/sop_categories
import dbConnect from "../../../lib/database";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";
import SopCategory from "../../../models/SopCategory";

export default async function handler(req, res) {
  await dbConnect();

  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!["clinic", "agent", "doctorStaff", "staff", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  let clinicId;
  if (user.role === "admin") {
    clinicId = req.query.clinicId || req.body.clinicId;
  } else {
    const resolved = await getClinicIdFromUser(user);
    clinicId = resolved.clinicId;
    if (resolved.error || !clinicId) {
      return res.status(403).json({ success: false, message: resolved.error || "Unable to determine clinic access" });
    }
  }

  if (req.method === "GET") {
    const items = await SopCategory.find({ clinicId }).sort({ name: 1 }).lean();
    return res.status(200).json({ success: true, items });
  }

  if (req.method === "POST") {
    const { name, status = "Active" } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "name is required" });
    try {
      const item = await SopCategory.create({ clinicId, name: String(name).trim(), status });
      return res.status(201).json({ success: true, item });
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(409).json({ success: false, message: "Category already exists" });
      }
      return res.status(500).json({ success: false, message: err.message || "Failed to create category" });
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: "id is required" });
    await SopCategory.deleteOne({ _id: id, clinicId });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
