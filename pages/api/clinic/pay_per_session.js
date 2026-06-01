import dbConnect from "../../../lib/database";
import PayPerSession from "../../../models/PayPerSession";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!["clinic", "doctor", "agent", "doctorStaff", "staff", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
  if (clinicError || (!clinicId && user.role !== "admin")) {
    return res.status(403).json({
      success: false,
      message: clinicError || "Unable to determine clinic access",
    });
  }

  const moduleKey = "clinic_servicesSetup";

  if (req.method === "GET") {
    try {
      const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "read");
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to view pay-per-session services",
        });
      }

      const items = await PayPerSession.find({ clinicId }).sort({ createdAt: -1 }).lean();
      return res.status(200).json({ success: true, items });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to fetch pay-per-session services" });
    }
  }

  if (req.method === "POST") {
    try {
      const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "create");
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to create pay-per-session services",
        });
      }

      const { name, serviceSlug, price, durationMinutes } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Name is required" });
      }
      if (!serviceSlug || !serviceSlug.trim()) {
        return res.status(400).json({ success: false, message: "Slug is required" });
      }
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ success: false, message: "Valid price is required" });
      }
      const durationNum = parseInt(durationMinutes);
      if (isNaN(durationNum) || durationNum < 5) {
        return res.status(400).json({ success: false, message: "Valid duration (min 5) is required" });
      }

      const exists = await PayPerSession.findOne({ clinicId, name: name.trim() });
      if (exists) {
        return res.status(400).json({ success: false, message: "An item with this name already exists" });
      }

      const item = await PayPerSession.create({
        clinicId,
        name: name.trim(),
        serviceSlug: serviceSlug.trim(),
        price: priceNum,
        durationMinutes: durationNum,
        createdBy: user._id,
        isActive: true,
      });

      return res.status(201).json({ success: true, message: "Created", item });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ success: false, message: "An item with this name already exists" });
      }
      if (error.name === "ValidationError") {
        return res.status(400).json({ success: false, message: error.message || "Validation error" });
      }
      return res.status(500).json({ success: false, message: "Failed to create pay-per-session service" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "update");
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to update pay-per-session services",
        });
      }

      const { itemId, name, serviceSlug, price, durationMinutes, isActive } = req.body;
      if (!itemId) {
        return res.status(400).json({ success: false, message: "ID is required" });
      }
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Name is required" });
      }
      if (!serviceSlug || !serviceSlug.trim()) {
        return res.status(400).json({ success: false, message: "Slug is required" });
      }
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ success: false, message: "Valid price is required" });
      }
      const durationNum = parseInt(durationMinutes);
      if (isNaN(durationNum) || durationNum < 5) {
        return res.status(400).json({ success: false, message: "Valid duration (min 5) is required" });
      }

      const item = await PayPerSession.findOne({ _id: itemId, clinicId });
      if (!item) {
        return res.status(404).json({ success: false, message: "Not found" });
      }
      const duplicate = await PayPerSession.findOne({
        clinicId,
        name: name.trim(),
        _id: { $ne: itemId },
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: "Another item with this name exists" });
      }

      item.name = name.trim();
      item.serviceSlug = serviceSlug.trim();
      item.price = priceNum;
      item.durationMinutes = durationNum;
      if (typeof isActive === "boolean") {
        item.isActive = isActive;
      }
      await item.save();

      return res.status(200).json({ success: true, message: "Updated", item });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to update pay-per-session service" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "delete");
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to delete pay-per-session services",
        });
      }

      const { itemId } = req.body || {};
      if (!itemId || typeof itemId !== "string") {
        return res.status(400).json({ success: false, message: "ID is required" });
      }

      const item = await PayPerSession.findOne({ _id: itemId, clinicId });
      if (!item) {
        return res.status(404).json({ success: false, message: "Not found" });
      }

      await PayPerSession.findByIdAndDelete(itemId);
      return res.status(200).json({ success: true, message: "Deleted" });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to delete pay-per-session service" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).json({ success: false, message: "Method not allowed" });
}
