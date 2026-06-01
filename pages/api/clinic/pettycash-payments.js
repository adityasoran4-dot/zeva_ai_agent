// pages/api/clinic/pettycash-payments.js
// Returns all billing records where payment method is Cash (or multiplePayments includes Cash)
import dbConnect from "../../../lib/database";
import Billing from "../../../models/Billing";
import Appointment from "../../../models/Appointment";
import PatientRegistration from "../../../models/PatientRegistration";
import MembershipPlan from "../../../models/MembershipPlan";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const me = await getUserFromReq(req);
  if (!me) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { clinicId, error: clinicError } = await getClinicIdFromUser(me);
  if (clinicError && me.role !== "admin") {
    return res.status(403).json({ success: false, message: clinicError });
  }

  try {
    const {
      search = "",
      startDate,
      endDate,
      page = "1",
      limit = "50",
      skipDateFilter = "false",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Role-based scoping:
    //  - agent       → only records they invoiced (invoicedById = me._id)
    //  - doctorStaff → look up all appointments where doctorId = me._id,
    //                  then filter Billing by those appointmentIds
    //                  (works for both old records without doctorId field and new ones)
    //  - clinic/admin/doctor → all records for the clinic
    let userScopeFilter = {};
    if (me.role === "agent") {
      userScopeFilter = { invoicedById: me._id };
    } else if (me.role === "doctorStaff") {
      // Fetch all appointment IDs for this doctor within the clinic
      const apptFilter = { doctorId: me._id };
      if (clinicId) apptFilter.clinicId = new mongoose.Types.ObjectId(String(clinicId));
      const doctorAppointments = await Appointment.find(apptFilter)
        .select("_id")
        .lean();
      const apptIds = doctorAppointments.map((a) => a._id);
      // If doctor has no appointments at all, return empty early
      if (apptIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 },
          summary: { totalCashIn: 0, totalRecords: 0 },
        });
      }
      userScopeFilter = { appointmentId: { $in: apptIds } };
    }

    // Build clinic filter
    const clinicFilter = clinicId
      ? { clinicId: new mongoose.Types.ObjectId(String(clinicId)) }
      : {};

    // Date filter — skip when fetching grand total
    const dateFilter = {};
    const applyDateFilter = skipDateFilter !== "true";
    if (applyDateFilter) {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
    }
    const dateMatch =
      Object.keys(dateFilter).length > 0 ? { invoicedDate: dateFilter } : {};

    // Cash filter: paymentMethod is Cash OR multiplePayments includes Cash
    const cashFilter = {
      $or: [
        { paymentMethod: "Cash" },
        { "multiplePayments.paymentMethod": "Cash" },
      ],
    };

    const baseFilter = {
      ...clinicFilter,
      ...userScopeFilter,
      ...dateMatch,
      ...cashFilter,
    };

    // Aggregation pipeline: join PatientRegistration for patient details
    const pipeline = [
      { $match: baseFilter },
      { $sort: { invoicedDate: -1 } },
      {
        $lookup: {
          from: "patientregistrations",
          localField: "patientId",
          foreignField: "_id",
          as: "patient",
        },
      },
      {
        $addFields: {
          patient: { $arrayElemAt: ["$patient", 0] },
        },
      },
    ];

    // Apply search after patient lookup
    if (search.trim()) {
      pipeline.push({
        $match: {
          $or: [
            { "patient.firstName": { $regex: search.trim(), $options: "i" } },
            { "patient.lastName": { $regex: search.trim(), $options: "i" } },
            { invoiceNumber: { $regex: search.trim(), $options: "i" } },
          ],
        },
      });
    }

    // Count total
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Billing.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Data with pagination
    const dataPipeline = [...pipeline, { $skip: skip }, { $limit: limitNum }];
    const records = await Billing.aggregate(dataPipeline);

    // Collect membershipIds from patient records
    const membershipIds = records
      .map((r) => r.patient?.membershipId)
      .filter(Boolean);

    let membershipMap = {};
    if (membershipIds.length > 0) {
      const memberships = await MembershipPlan.find({
        _id: { $in: membershipIds },
      })
        .select("_id name price")
        .lean();
      memberships.forEach((m) => {
        membershipMap[m._id.toString()] = m;
      });
    }

    // Enrich records
    const enriched = records.map((r) => {
      const patient = r.patient || {};

      let cashAmount = 0;
      if (r.multiplePayments && r.multiplePayments.length > 0) {
        cashAmount = r.multiplePayments
          .filter((mp) => mp.paymentMethod === "Cash")
          .reduce((sum, mp) => sum + (mp.amount || 0), 0);
      } else if (r.paymentMethod === "Cash") {
        cashAmount = r.paid || 0;
      }

      const membershipId = patient.membershipId
        ? patient.membershipId.toString()
        : null;
      const membershipInfo = membershipId
        ? membershipMap[membershipId] || null
        : null;

      return {
        _id: r._id.toString(),
        invoiceNumber: r.invoiceNumber,
        invoicedDate: r.invoicedDate,
        invoicedBy: r.invoicedBy,
        patientName:
          `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
        firstName: patient.firstName || "",
        lastName: patient.lastName || "",
        mobileNumber: patient.mobileNumber || "",
        emrNumber: patient.emrNumber || "",
        service: r.service,
        treatment: r.treatment || null,
        package: r.package || null,
        selectedPackageTreatments: r.selectedPackageTreatments || [],
        amount: r.amount,
        paid: r.paid,
        cashAmount,
        paymentMethod: r.paymentMethod,
        multiplePayments: r.multiplePayments || [],
        isFreeConsultation: r.isFreeConsultation || false,
        membershipDiscountApplied: r.membershipDiscountApplied || 0,
        membershipId,
        membershipInfo: membershipInfo
          ? { name: membershipInfo.name, price: membershipInfo.price }
          : null,
      };
    });

    // Overall cash total across all matched records (not just current page)
    const totalCashAgg = await Billing.aggregate([
      { $match: baseFilter },
      ...(search.trim()
        ? [
            {
              $lookup: {
                from: "patientregistrations",
                localField: "patientId",
                foreignField: "_id",
                as: "patient",
              },
            },
            { $addFields: { patient: { $arrayElemAt: ["$patient", 0] } } },
            {
              $match: {
                $or: [
                  {
                    "patient.firstName": {
                      $regex: search.trim(),
                      $options: "i",
                    },
                  },
                  {
                    "patient.lastName": {
                      $regex: search.trim(),
                      $options: "i",
                    },
                  },
                  { invoiceNumber: { $regex: search.trim(), $options: "i" } },
                ],
              },
            },
          ]
        : []),
      {
        $group: {
          _id: null,
          totalCash: {
            $sum: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$multiplePayments", []] } }, 0] },
                {
                  $reduce: {
                    input: {
                      $filter: {
                        input: "$multiplePayments",
                        as: "mp",
                        cond: { $eq: ["$$mp.paymentMethod", "Cash"] },
                      },
                    },
                    initialValue: 0,
                    in: { $add: ["$$value", "$$this.amount"] },
                  },
                },
                {
                  $cond: [
                    { $eq: ["$paymentMethod", "Cash"] },
                    "$paid",
                    0,
                  ],
                },
              ],
            },
          },
        },
      },
    ]);

    const totalCashIn = totalCashAgg[0]?.totalCash || 0;

    return res.status(200).json({
      success: true,
      data: enriched,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      summary: {
        totalCashIn,
        totalRecords: total,
      },
    });
  } catch (err) {
    console.error("Error fetching petty cash payments:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
}
