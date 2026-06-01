import dbConnect from "../../../lib/database";
import PatientRegistration from "../../../models/PatientRegistration";
import User from "../../../models/Users";
import jwt from "jsonwebtoken";

async function getUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1];
  if (!token) throw { status: 401, message: "No token provided" };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) throw { status: 401, message: "User not found" };
    return user;
  } catch (err) {
    throw { status: 401, message: "Invalid or expired token" };
  }
}

function requireRole(user, roles = []) { return roles.includes(user.role); }

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const user = await getUserFromToken(req);
    if (!requireRole(user, ["doctorStaff"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const doctorIdString = String(user._id);
    const doctorName = user.name;

    const cancelled = await PatientRegistration.find({
      advanceClaimStatus: "Cancelled",
      $or: [ { doctor: doctorIdString }, { doctor: doctorName } ],
    })
      .select({
        _id: 1,
        invoiceNumber: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        mobileNumber: 1,
        emrNumber: 1,
        doctor: 1,
        service: 1,
        package: 1,
        treatment: 1,
        referredBy: 1,
        notes: 1,
        amount: 1,
        paid: 1,
        advance: 1,
        pending: 1,
        advanceClaimStatus: 1,
        advanceClaimCancellationRemark: 1,
        invoicedDate: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .sort({ updatedAt: -1 })
      .lean();

    const data = cancelled.map((c) => ({
      _id: c._id.toString(),
      invoiceNumber: c.invoiceNumber,
      patientName: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
      email: c.email,
      mobileNumber: c.mobileNumber,
      emrNumber: c.emrNumber,
      doctor: c.doctor,
      service: c.service,
      package: c.package,
      treatment: c.treatment,
      referredBy: c.referredBy,
      notes: c.notes,
      amount: c.amount,
      paid: c.paid,
      advance: c.advance,
      pending: c.pending,
      advanceClaimStatus: c.advanceClaimStatus,
      advanceClaimCancellationRemark: c.advanceClaimCancellationRemark,
      invoicedDate: c.invoicedDate?.toISOString(),
      createdAt: c.createdAt?.toISOString(),
      updatedAt: c.updatedAt?.toISOString(),
      cancellationReason: c.advanceClaimCancellationRemark || "No reason provided",
      cancellationType: "Advance Claim",
    }));

    return res.status(200).json({ success: true, data, count: data.length });
  } catch (err) {
    console.error("cancelled-claims error:", err);
    return res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
  }
}


