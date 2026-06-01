import dbConnect from "../../../../lib/database";
import Commission from "../../../../models/Commission";
import PatientRegistration from "../../../../models/PatientRegistration";
import Appointment from "../../../../models/Appointment";
import Billing from "../../../../models/Billing";
import User from "../../../../models/Users";
import Clinic from "../../../../models/Clinic";
import mongoose from "mongoose";
import { getUserFromReq } from "../../lead-ms/auth";
import { checkClinicPermission } from "../../lead-ms/permissions-helper";
import { checkAgentPermission } from "../../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const source = String(req.query.source || "");
    const referralId = req.query.referralId || null;
    const staffId = req.query.staffId || null;

    let clinicId = null;
    let clinic = null;
    if (me.role === "clinic") {
      clinic = await Clinic.findOne({ owner: me._id }).select("_id");
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
      const qClinicId = req.query.clinicId;
      if (!qClinicId) {
        return res.status(400).json({ success: false, message: "Admin must provide clinicId" });
      }
      clinicId = qClinicId;
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (me.role !== "admin") {
      if (me.role === "clinic") {
        const { hasPermission, error } = await checkClinicPermission(clinicId, "clinic_commission", "read");
        if (!hasPermission) {
          return res.status(403).json({ success: false, message: error || "No permission to view commissions" });
        }
      } else if (["agent", "doctorStaff"].includes(me.role)) {
        const { hasPermission, error } = await checkAgentPermission(me._id, "clinic_commission", "read");
        if (!hasPermission) {
          return res.status(403).json({ success: false, message: error || "No permission to view commissions" });
        }
      }
    }

    const filter = { clinicId };
    if (source === "referral") {
      if (!referralId) {
        return res.status(400).json({ success: false, message: "referralId is required for referral source" });
      }
      filter.referralId = referralId;
    } else if (source === "staff") {
      if (!staffId) {
        return res.status(400).json({ success: false, message: "staffId is required for staff source" });
      }
      filter.staffId = staffId;
    } else {
      return res.status(400).json({ success: false, message: "Invalid source" });
    }

    const commissions = await Commission.find(filter)
      .sort({ createdAt: -1 })
      .populate([
        { path: "patientId", model: PatientRegistration, select: "firstName lastName mobileNumber emrNumber" },
        {
          path: "appointmentId",
          model: Appointment,
          select: "doctorId",
          populate: { path: "doctorId", model: User, select: "name role" },
        },
        { path: "billingId", model: Billing, select: "invoiceNumber invoicedDate service treatment package paid pending advance advanceUsed pendingUsed isFreeConsultation freeConsultationCount membershipDiscountApplied originalAmount selectedPackageTreatments expenses expenseTotal paymentMethod" },
      ])
      .lean();

    // Build aggregate balances per patient (same logic as /patient-balance)
    const patientIds = Array.from(
      new Set(
        commissions
          .map((c) => (c.patientId?._id ? String(c.patientId._id) : null))
          .filter(Boolean)
      )
    );

    let balancesByPatient = {};
    if (patientIds.length > 0) {
      const agg = await Billing.aggregate([
        { $match: { clinicId, patientId: { $in: patientIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
        {
          $group: {
            _id: "$patientId",
            totalPending: { $sum: { $toDouble: "$pending" } },
            totalPendingUsed: { $sum: { $toDouble: "$pendingUsed" } },
            totalAdvance: { $sum: { $toDouble: "$advance" } },
            totalAdvanceUsed: { $sum: { $toDouble: "$advanceUsed" } },
          },
        },
      ]);
      balancesByPatient = agg.reduce((acc, row) => {
        const pendingBalance = Math.max(
          0,
          Number(((row.totalPending || 0) - (row.totalPendingUsed || 0)).toFixed(2))
        );
        const advanceBalance = Math.max(
          0,
          Number(((row.totalAdvance || 0) - (row.totalAdvanceUsed || 0)).toFixed(2))
        );
        acc[String(row._id)] = { pendingBalance, advanceBalance };
        return acc;
      }, {});
    }

    // Build complaint expense data per commission from the stored expenseBreakdown on each
    // Commission record. This avoids the appointmentId-collision problem where two billings
    // for the same appointment would aggregate each other's complaints.
    const items = commissions.map((c) => {
      const patient = c.patientId || {};
      const appointment = c.appointmentId || {};
      const doctor = appointment?.doctorId || {};
      const billing = c.billingId || {};
      const pid = patient?._id ? String(patient._id) : null;
      const balance = pid ? balancesByPatient[pid] || { pendingBalance: 0, advanceBalance: 0 } : { pendingBalance: 0, advanceBalance: 0 };

      // Use the expenseBreakdown stored on this specific Commission record at billing time.
      // Each item in expenseBreakdown has: { items: [{ name, quantity, uom, totalAmount }], complaintTotal }
      // Flatten all items across all complaint entries for display.
      const storedBreakdown = Array.isArray(c.expenseBreakdown) ? c.expenseBreakdown : [];
      const complaintExpenseItems = [];
      let complaintExpenseTotal = 0;
      for (const entry of storedBreakdown) {
        const entryItems = Array.isArray(entry.items) ? entry.items : [];
        for (const it of entryItems) {
          complaintExpenseItems.push({
            name: it.name || "",
            quantity: Number(it.quantity || 0),
            uom: it.uom || "",
            totalAmount: Number(it.totalAmount || 0),
          });
          complaintExpenseTotal += Number(it.totalAmount || 0);
        }
      }
      complaintExpenseTotal = Number(complaintExpenseTotal.toFixed(2));

      return {
        patientId: pid,
        commissionId: c._id.toString(),
        patientName: `${(patient.firstName || "").trim()} ${(patient.lastName || "").trim()}`.trim(),
        patientMobile: patient.mobileNumber || "",
        patientEmr: patient.emrNumber || "",
        invoiceNumber: billing.invoiceNumber || "",
        invoicedDate: billing.invoicedDate || c.invoicedDate || null,
        service: billing.service || "",
        treatment: billing.treatment || "",
        package: billing.package || "",
        paidAmount: Number(c.amountPaid || billing.paid || 0),
        pendingAmount: Number(((billing.pending || 0)).toFixed(2)),
        advanceAmount: Number(((billing.advance || 0)).toFixed(2)),
        totalPendingBalance: balance.pendingBalance,
        totalAdvanceBalance: balance.advanceBalance,
        isFreeConsultation: !!billing.isFreeConsultation,
        freeConsultationCount: Number(billing.freeConsultationCount || 0),
        membershipDiscountApplied: Number(billing.membershipDiscountApplied || 0),
        originalAmount: Number(billing.originalAmount || 0),
        selectedPackageTreatments: Array.isArray(billing.selectedPackageTreatments) ? billing.selectedPackageTreatments : [],
        expenseTotal: Number(billing.expenseTotal || 0),
        expenses: Array.isArray(billing.expenses) ? billing.expenses.map((e) => ({ name: e.name, amount: Number(e.amount || 0) })) : [],
        complaintExpenseTotal,
        complaintExpenses: complaintExpenseItems,
        commissionPercent: Number(c.commissionPercent || 0),
        commissionAmount: Number(c.commissionAmount || 0),
        commissionBaseAmount: Number(c.commissionBaseAmount || 0),
        postCommissionExpenses: Array.isArray(c.postCommissionExpenses) ? c.postCommissionExpenses.map((e) => ({ name: e.name, price: Number(e.price || 0), addedAt: e.addedAt })) : [],
        finalCommissionAmount: Number(c.finalCommissionAmount || c.commissionAmount || 0),
        isSubmitted: !!c.isSubmitted,
        isApproved: !!c.isApproved,
        doctorName: doctor.name || "",
        paymentMethod: c.paymentMethod || billing.paymentMethod || "",
        bankDeduction: c.bankDeduction || null,
        referralCommissionDeducted: Number(c.referralCommissionDeducted || 0),
      };
    });

    return res.status(200).json({ success: true, items });
  } catch (err) {
    console.error("Error in commissions by-person:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
  }
}
