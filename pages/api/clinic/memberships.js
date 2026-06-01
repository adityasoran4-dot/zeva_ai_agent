import dbConnect from "../../../lib/database";
import MembershipPlan from "../../../models/MembershipPlan";
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

  const moduleKey = "Clinic_services_setup";

  if (req.method === "GET") {
    try {
      const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "read");
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to view memberships",
        });
      }
      const memberships = await MembershipPlan.find({ clinicId }).sort({ createdAt: -1 }).lean();
      return res.status(200).json({ success: true, memberships });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to fetch memberships" });
    }
  }

  if (req.method === "POST") {
    try {
      const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "create");
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to create memberships",
        });
      }

      const { name, price, durationMonths, benefits } = req.body || {};
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Name is required" });
      }
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ success: false, message: "Valid price is required" });
      }
      const durationNum = parseInt(durationMonths);
      if (isNaN(durationNum) || durationNum < 1) {
        return res.status(400).json({ success: false, message: "Valid durationMonths (min 1) is required" });
      }

      const freeConsultations = parseInt(benefits?.freeConsultations ?? 0);
      const discountPercentage = parseFloat(benefits?.discountPercentage ?? 0);
      const priorityBooking = Boolean(benefits?.priorityBooking);
      if (isNaN(freeConsultations) || freeConsultations < 0) {
        return res.status(400).json({ success: false, message: "Valid freeConsultations (>= 0) is required" });
      }
      if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
        return res.status(400).json({ success: false, message: "Valid discountPercentage (0–100) is required" });
      }

      const exists = await MembershipPlan.findOne({ clinicId, name: name.trim() });
      if (exists) {
        return res.status(400).json({ success: false, message: "A membership with this name already exists" });
      }

      const membership = await MembershipPlan.create({
        clinicId,
        name: name.trim(),
        price: priceNum,
        durationMonths: durationNum,
        benefits: {
          freeConsultations,
          discountPercentage,
          priorityBooking,
        },
        createdBy: user._id,
        isActive: true,
      });

      return res.status(201).json({ success: true, message: "Membership created", membership });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ success: false, message: "A membership with this name already exists" });
      }
      if (error.name === "ValidationError") {
        return res.status(400).json({ success: false, message: error.message || "Validation error" });
      }
      return res.status(500).json({ success: false, message: "Failed to create membership" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "update");
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to update memberships",
        });
      }

      const { itemId, name, price, durationMonths, benefits, isActive } = req.body || {};
      if (!itemId) {
        return res.status(400).json({ success: false, message: "ID is required" });
      }
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Name is required" });
      }
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ success: false, message: "Valid price is required" });
      }
      const durationNum = parseInt(durationMonths);
      if (isNaN(durationNum) || durationNum < 1) {
        return res.status(400).json({ success: false, message: "Valid durationMonths (min 1) is required" });
      }
      const freeConsultations = parseInt(benefits?.freeConsultations ?? 0);
      const discountPercentage = parseFloat(benefits?.discountPercentage ?? 0);
      const priorityBooking = Boolean(benefits?.priorityBooking);
      if (isNaN(freeConsultations) || freeConsultations < 0) {
        return res.status(400).json({ success: false, message: "Valid freeConsultations (>= 0) is required" });
      }
      if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
        return res.status(400).json({ success: false, message: "Valid discountPercentage (0–100) is required" });
      }

      const membership = await MembershipPlan.findOne({ _id: itemId, clinicId });
      if (!membership) {
        return res.status(404).json({ success: false, message: "Not found" });
      }
      const duplicate = await MembershipPlan.findOne({
        clinicId,
        name: name.trim(),
        _id: { $ne: itemId },
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: "Another membership with this name exists" });
      }

      membership.name = name.trim();
      membership.price = priceNum;
      membership.durationMonths = durationNum;
      membership.benefits = {
        freeConsultations,
        discountPercentage,
        priorityBooking,
      };
      if (typeof isActive === "boolean") {
        membership.isActive = isActive;
      }
      await membership.save();

      return res.status(200).json({ success: true, message: "Membership updated", membership });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to update membership" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "delete");
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to delete memberships",
        });
      }
      const { itemId } = req.body || {};
      if (!itemId || typeof itemId !== "string") {
        return res.status(400).json({ success: false, message: "ID is required" });
      }

      const membership = await MembershipPlan.findOne({ _id: itemId, clinicId });
      if (!membership) {
        return res.status(404).json({ success: false, message: "Not found" });
      }

      await MembershipPlan.findByIdAndDelete(itemId);
      return res.status(200).json({ success: true, message: "Membership deleted" });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to delete membership" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).json({ success: false, message: "Method not allowed" });
}
