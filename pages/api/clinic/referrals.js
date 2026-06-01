import dbConnect from "../../../lib/database";
import Referral from "../../../models/Referral";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  let me;
  try {
    me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!["clinic", "doctor", "agent", "doctorStaff", "staff", "admin"].includes(me.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const { clinicId, error: clinicError } = await getClinicIdFromUser(me);
  if (clinicError || (!clinicId && me.role !== "admin")) {
    return res.status(403).json({
      success: false,
      message: clinicError || "Unable to determine clinic access",
    });
  }

  const moduleKey = "clinic_referal";

  if (req.method === "GET") {
    try {
      const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "read");
      if (!hasPermission && me.role !== "admin") {
        return res.status(403).json({ success: false, message: permError || "No permission to read referrals" });
      }
      const referrals = await Referral.find({ clinicId }).sort({ createdAt: -1 }).lean();
      return res.status(200).json({ success: true, referrals });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to fetch referrals" });
    }
  }

  if (req.method === "POST") {
    try {
      const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "create");
      if (!hasPermission && me.role !== "admin") {
        return res.status(403).json({ success: false, message: permError || "No permission to create referrals" });
      }
      const { firstName, lastName, phone, email, referralPercent, addExpense } = req.body;
      if (!firstName || !String(firstName).trim()) {
        return res.status(400).json({ success: false, message: "First name is required" });
      }
      if (!phone || !String(phone).trim()) {
        return res.status(400).json({ success: false, message: "Phone is required" });
      }
      const percentNum = referralPercent !== undefined ? Number(referralPercent) : 0;
      if (percentNum < 0 || percentNum > 100) {
        return res.status(400).json({ success: false, message: "Referral % must be between 0 and 100" });
      }
      const ref = await Referral.create({
        clinicId,
        firstName: String(firstName).trim(),
        lastName: String(lastName || "").trim(),
        phone: String(phone).trim(),
        email: email || "",
        referralPercent: percentNum,
        addExpense: Boolean(addExpense),
      });
      return res.status(201).json({ success: true, referral: ref });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ success: false, message: error.message || "Validation error" });
      }
      return res.status(500).json({ success: false, message: "Failed to create referral" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "update");
      if (!hasPermission && me.role !== "admin") {
        return res.status(403).json({ success: false, message: permError || "No permission to update referrals" });
      }
      const { id, firstName, lastName, phone, email, referralPercent, addExpense } = req.body;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });
      const ref = await Referral.findOne({ _id: id, clinicId });
      if (!ref) return res.status(404).json({ success: false, message: "Referral not found" });

      if (firstName !== undefined) ref.firstName = String(firstName).trim();
      if (lastName !== undefined) ref.lastName = String(lastName).trim();
      if (phone !== undefined) ref.phone = String(phone).trim();
      if (email !== undefined) ref.email = String(email).trim().toLowerCase();
      if (referralPercent !== undefined) {
        const percentNum = Number(referralPercent);
        if (Number.isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
          return res.status(400).json({ success: false, message: "Referral % must be between 0 and 100" });
        }
        ref.referralPercent = percentNum;
      }
      if (addExpense !== undefined) {
        ref.addExpense = Boolean(addExpense);
      }
      await ref.save();
      return res.status(200).json({ success: true, referral: ref });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to update referral" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "delete");
      if (!hasPermission && me.role !== "admin") {
        return res.status(403).json({ success: false, message: permError || "No permission to delete referrals" });
      }
      const { id } = req.body;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });
      const ref = await Referral.findOneAndDelete({ _id: id, clinicId });
      if (!ref) return res.status(404).json({ success: false, message: "Referral not found" });
      return res.status(200).json({ success: true, deletedId: id });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to delete referral" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}
