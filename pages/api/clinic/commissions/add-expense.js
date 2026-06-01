import dbConnect from "../../../../lib/database";
import Commission from "../../../../models/Commission";
import Clinic from "../../../../models/Clinic";
import { getUserFromReq } from "../../lead-ms/auth";
import { checkClinicPermission } from "../../lead-ms/permissions-helper";
import { checkAgentPermission } from "../../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Resolve clinicId for the requesting user
    let clinicId = null;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id }).select("_id");
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found for this user" });
      }
      clinicId = clinic._id;
    } else if (["agent", "doctor", "doctorStaff", "staff"].includes(me.role)) {
      if (!me.clinicId) {
        return res.status(403).json({ success: false, message: "User not linked to a clinic" });
      }
      clinicId = me.clinicId;
    } else if (me.role === "admin") {
      const qClinicId = req.body.clinicId || req.query.clinicId;
      if (!qClinicId) {
        return res.status(400).json({ success: false, message: "Admin must provide clinicId" });
      }
      clinicId = qClinicId;
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Permission check
    if (me.role !== "admin") {
      if (me.role === "clinic") {
        const { hasPermission, error } = await checkClinicPermission(clinicId, "clinic_commission", "write");
        if (!hasPermission) {
          return res.status(403).json({ success: false, message: error || "No permission to edit commissions" });
        }
      } else if (["agent", "doctorStaff"].includes(me.role)) {
        const { hasPermission, error } = await checkAgentPermission(me._id, "clinic_commission", "write");
        if (!hasPermission) {
          return res.status(403).json({ success: false, message: error || "No permission to edit commissions" });
        }
      }
    }

    const { commissionId, expenses } = req.body;

    if (!commissionId) {
      return res.status(400).json({ success: false, message: "commissionId is required" });
    }

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ success: false, message: "expenses must be a non-empty array" });
    }

    // Validate each expense entry
    const validExpenses = expenses.filter(
      (e) => e && typeof e.name === "string" && e.name.trim() !== "" && Number(e.price) > 0
    );
    if (validExpenses.length === 0) {
      return res.status(400).json({ success: false, message: "No valid expenses provided. Each expense needs a name and price > 0" });
    }

    // Find commission belonging to this clinic
    const commission = await Commission.findOne({ _id: commissionId, clinicId });
    if (!commission) {
      return res.status(404).json({ success: false, message: "Commission not found" });
    }

    // Append new expenses to postCommissionExpenses
    const now = new Date();
    for (const exp of validExpenses) {
      commission.postCommissionExpenses.push({
        name: exp.name.trim(),
        price: Number(Number(exp.price).toFixed(2)),
        addedAt: now,
      });
    }

    // Recalculate finalCommissionAmount from stored base amount
    // commissionBaseAmount = (paidAmount - billing expenses) stored at billing time
    // New base = commissionBaseAmount - sum(all postCommissionExpenses)
    const totalPostExpenses = commission.postCommissionExpenses.reduce(
      (sum, e) => sum + Number(e.price || 0),
      0
    );

    const newBase = Math.max(0, Number(commission.commissionBaseAmount || 0) - totalPostExpenses);
    const finalCommissionAmount = Number(((newBase * Number(commission.commissionPercent || 0)) / 100).toFixed(2));

    commission.finalCommissionAmount = finalCommissionAmount;

    await commission.save();

    return res.status(200).json({
      success: true,
      message: "Expense added and commission recalculated",
      updated: {
        commissionBaseAmount: Number(commission.commissionBaseAmount || 0),
        postCommissionExpenses: commission.postCommissionExpenses.map((e) => ({
          name: e.name,
          price: Number(e.price || 0),
          addedAt: e.addedAt,
        })),
        finalCommissionAmount: commission.finalCommissionAmount,
      },
    });
  } catch (err) {
    console.error("Error in add-expense:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
  }
}
