import dbConnect from "../../../../lib/database";
import Commission from "../../../../models/Commission";
import PatientRegistration from "../../../../models/PatientRegistration";
import Appointment from "../../../../models/Appointment";
import Billing from "../../../../models/Billing";
import User from "../../../../models/Users";
import Clinic from "../../../../models/Clinic";
import { getUserFromReq } from "../../lead-ms/auth";
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

    if (!["agent", "doctorStaff", "doctor", "staff", "admin"].includes(me.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    let clinicId = null;
    if (me.role === "admin") {
      const qClinicId = req.query.clinicId;
      if (!qClinicId) {
        return res.status(400).json({ success: false, message: "Admin must provide clinicId" });
      }
      clinicId = qClinicId;
    } else {
      if (!me.clinicId) {
        return res.status(403).json({ success: false, message: "User not linked to a clinic" });
      }
      clinicId = me.clinicId;
    }

    // Only show commissions that have been both submitted (tick) AND approved by the clinic.
    const filter = { clinicId, staffId: me._id, isSubmitted: true, isApproved: true };

    const commissions = await Commission.find(filter)
      .sort({ createdAt: -1 })
      .populate([
        { path: "patientId", model: PatientRegistration, select: "firstName lastName mobileNumber" },
        {
          path: "appointmentId",
          model: Appointment,
          select: "doctorId",
          populate: { path: "doctorId", model: User, select: "name role" },
        },
        { path: "billingId", model: Billing, select: "invoiceNumber invoicedDate service treatment package paid" },
      ])
      .lean();

    const totalCommission = commissions.reduce(
      (sum, c) => sum + Number(c.finalCommissionAmount || c.commissionAmount || 0),
      0
    );

    const items = commissions.map((c) => {
      const patient = c.patientId || {};
      const appointment = c.appointmentId || {};
      const doctor = appointment?.doctorId || {};
      const billing = c.billingId || {};
      return {
        commissionId: c._id.toString(),
        patientName: `${(patient.firstName || "").trim()} ${(patient.lastName || "").trim()}`.trim(),
        patientMobile: patient.mobileNumber || "",
        invoiceNumber: billing.invoiceNumber || "",
        invoicedDate: billing.invoicedDate || c.invoicedDate || null,
        paidAmount: Number(c.amountPaid || billing.paid || 0),
        commissionPercent: Number(c.commissionPercent || 0),
        commissionAmount: Number(c.finalCommissionAmount || c.commissionAmount || 0),
        finalCommissionAmount: Number(c.finalCommissionAmount || c.commissionAmount || 0),
        doctorName: doctor.name || "",
      };
    });

    return res.status(200).json({
      success: true,
      totalCommission: Number(totalCommission.toFixed(2)),
      count: commissions.length,
      items,
    });
  } catch (err) {
    // console.error("Error in agent commissions mine:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
  }
}
