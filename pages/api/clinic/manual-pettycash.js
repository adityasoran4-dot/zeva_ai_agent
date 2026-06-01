// pages/api/clinic/manual-pettycash.js
// GET  – list all manually-added petty cash entries for this clinic
// POST – add a new manual petty cash entry (name + amount)
import dbConnect from "../../../lib/database";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";
import mongoose from "mongoose";
import PettyCash from "../../../models/PettyCash";

// Inline schema for manual clinic petty cash (stored in a simple collection)
const ManualPettyCashSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
    isExpense: { type: Boolean, default: false },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    vendorName: { type: String },
    items: [{
      itemName: { type: String },
      amount: { type: Number }
    }],
    images: [{ type: String }],
    usedFromPettyCash: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const ManualPettyCash =
  mongoose.models.ManualPettyCash ||
  mongoose.model("ManualPettyCash", ManualPettyCashSchema);

export default async function handler(req, res) {
  await dbConnect();

  const me = await getUserFromReq(req);
  if (!me) return res.status(401).json({ success: false, message: "Unauthorized" });

  const { clinicId, error: clinicError } = await getClinicIdFromUser(me);
  if (clinicError && me.role !== "admin") {
    return res.status(403).json({ success: false, message: clinicError });
  }

  // ── GET: list entries ─────────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const { startDate, endDate, page = "1", limit = "100" } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      // agent / doctorStaff see only their own entries
      const isRestrictedRole = ["agent", "doctorStaff"].includes(me.role);

      const baseFilter = clinicId
        ? { clinicId: new mongoose.Types.ObjectId(String(clinicId)), isExpense: false }
        : { isExpense: false };

      if (isRestrictedRole) {
        baseFilter.addedBy = new mongoose.Types.ObjectId(String(me._id));
      }

      const listFilter = { ...baseFilter };
      const dateFilter = {};
      if (startDate || endDate) {
        if (startDate) { 
          const s = new Date(startDate); 
          s.setUTCHours(0, 0, 0, 0); 
          dateFilter.$gte = s; 
        }
        if (endDate) { 
          const e = new Date(endDate); 
          e.setUTCHours(23, 59, 59, 999); 
          dateFilter.$lte = e; 
        }
        listFilter.createdAt = dateFilter;
      }

      const [entries, total, pettyCashGlobal, manualSummary, pettyCashRecords] = await Promise.all([
        ManualPettyCash.find(listFilter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        ManualPettyCash.countDocuments(listFilter),
        PettyCash.getGlobalAmounts(clinicId),
        ManualPettyCash.aggregate([
          { $match: listFilter }, // Use listFilter (with date restriction) for the sum
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
        PettyCash.find({ 
          clinicId: new mongoose.Types.ObjectId(String(clinicId)),
          // Filter expenses by date if provided
          ...(Object.keys(dateFilter).length > 0 ? { "expenses.date": dateFilter } : {})
        }).select("expenses").lean()
      ]);

      // Total sum across filtered records
      const manualTotalSum = manualSummary.length > 0 ? manualSummary[0].total : 0;

      // GRAND totals (unfiltered by date — for Total Cash In card)
      // Grand manual total: sum of ALL manual entries (no date filter)
      const grandManualAgg = await ManualPettyCash.aggregate([
        { $match: { ...baseFilter } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      const grandManualTotal = grandManualAgg.length > 0 ? grandManualAgg[0].total : 0;

      // Grand expense total: read from global PettyCash record's globalSpentAmount
      // (updated by add-expense.js via updateGlobalSpentAmount static method)
      const globalPettyCash = await PettyCash.findOne({ clinicId: new mongoose.Types.ObjectId(String(clinicId)), staffId: null }).select("globalSpentAmount").lean();
      const grandExpenseTotal = globalPettyCash?.globalSpentAmount || 0;

      // FILTERED expense total (date-filtered, for the dashboard cards)
      let calculatedExpenseTotal = 0;
      const expensesRaw = [];

      pettyCashRecords.forEach(record => {
        if (record.expenses) {
          record.expenses.forEach(exp => {
            const expDate = new Date(exp.date || exp.createdAt);

            if (startDate) {
              const s = new Date(startDate);
              s.setUTCHours(0, 0, 0, 0);
              if (expDate < s) return;
            }
            if (endDate) {
              const e = new Date(endDate);
              e.setUTCHours(23, 59, 59, 999);
              if (expDate > e) return;
            }

            expensesRaw.push({
              ...exp,
              _id: exp._id ? exp._id.toString() : null,
              isExpense: true
            });
            calculatedExpenseTotal += (exp.spentAmount || 0);
          });
        }
      });
      
      return res.status(200).json({
        success: true,
        data: entries.map((e) => ({
          _id: e._id.toString(),
          name: e.name,
          amount: e.amount,
          note: e.note || "",
          createdAt: e.createdAt,
          isExpense: e.isExpense,
          vendorName: e.vendorName,
          items: e.items,
          images: e.images,
          usedFromPettyCash: e.usedFromPettyCash,
        })),
        total,
        totalAmount: manualTotalSum,
        expenseTotal: calculatedExpenseTotal,
        grandManualTotal,
        grandExpenseTotal,
        pettyCashGlobal: {
          ...pettyCashGlobal,
          globalSpentAmount: calculatedExpenseTotal, // Override with filtered total for the dashboard
          expenses: expensesRaw.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
        },
      });
    } catch (err) {
      console.error("manual-pettycash GET error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // ── POST: add entry ───────────────────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const { 
        name, 
        amount, 
        note, 
        isExpense = false, 
        vendorId, 
        vendorName, 
        items = [], 
        images = [], 
        usedFromPettyCash = true 
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Name is required" });
      }
      
      const amt = parseFloat(amount);
      if (isNaN(amt)) {
        return res.status(400).json({ success: false, message: "Valid amount is required" });
      }

      // If it's an expense and used from petty cash, we store it as a negative amount to deduct from total
      const finalAmount = (isExpense && usedFromPettyCash) ? -Math.abs(amt) : amt;

      const entry = await ManualPettyCash.create({
        clinicId: new mongoose.Types.ObjectId(String(clinicId)),
        addedBy: me._id,
        name: name.trim(),
        amount: finalAmount,
        note: note || "",
        isExpense,
        vendorId: vendorId ? new mongoose.Types.ObjectId(String(vendorId)) : undefined,
        vendorName,
        items,
        images,
        usedFromPettyCash
      });

      return res.status(201).json({
        success: true,
        message: isExpense ? "Expense added" : "Petty cash entry added",
        data: {
          _id: entry._id.toString(),
          name: entry.name,
          amount: entry.amount,
          note: entry.note,
          createdAt: entry.createdAt,
          isExpense: entry.isExpense,
          vendorName: entry.vendorName,
          items: entry.items,
          images: entry.images,
          usedFromPettyCash: entry.usedFromPettyCash
        },
      });
    } catch (err) {
      console.error("manual-pettycash POST error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  return res.status(405).json({ success: false, message: "Method Not Allowed" });
}
