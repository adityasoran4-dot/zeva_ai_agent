import dbConnect from "../../../../lib/database";
import Billing from "../../../../models/Billing";
import Appointment from "../../../../models/Appointment";
import { getUserFromReq } from "../../lead-ms/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await dbConnect();

  try {
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { patientId } = req.query;
    if (!patientId) {
      return res.status(400).json({ success: false, message: "patientId is required" });
    }

    // Resolve clinicId
    let clinicId;
    if (clinicUser.role === "clinic") {
      const Clinic = (await import("../../../../models/Clinic")).default;
      const clinic = await Clinic.findOne({ owner: clinicUser._id }).lean();
      if (!clinic) return res.status(404).json({ success: false, message: "Clinic not found" });
      clinicId = clinic._id;
    } else if (clinicUser.role === "admin") {
      clinicId = req.query.clinicId || undefined;
    } else {
      clinicId = clinicUser.clinicId;
      if (!clinicId) {
        return res.status(403).json({ success: false, message: "User not linked to a clinic" });
      }
    }

    const billingMatch = { patientId };
    if (clinicId) billingMatch.clinicId = clinicId;

    const aptMatch = { patientId };
    if (clinicId) aptMatch.clinicId = clinicId;

    // Run billing and visit count in parallel
    const [billings, totalVisits] = await Promise.all([
      Billing.find(billingMatch)
        .select("amount paid pending advance invoicedDate service treatment package createdAt")
        .sort({ invoicedDate: -1 })
        .lean(),
      Appointment.countDocuments(aptMatch),
    ]);

    const totalSpend  = billings.reduce((sum, b) => sum + (b.paid    || 0), 0);
    const totalBilled = billings.reduce((sum, b) => sum + (b.amount  || 0), 0);
    const totalPending = billings.reduce((sum, b) => sum + (b.pending || 0), 0);

    // Recent billing records for Revenue Insights card (latest 6)
    const recentBillings = billings.slice(0, 6).map((b) => ({
      service:   b.service,
      label:     b.treatment || b.package || b.service || "—",
      amount:    b.amount,
      paid:      b.paid,
      pending:   b.pending,
      date:      b.invoicedDate || b.createdAt,
    }));

    return res.status(200).json({
      success: true,
      totalSpend,
      totalBilled,
      totalPending,
      totalVisits,
      billingCount: billings.length,
      recentBillings,
    });
  } catch (err) {
    console.error("patient-emr-stats error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}
