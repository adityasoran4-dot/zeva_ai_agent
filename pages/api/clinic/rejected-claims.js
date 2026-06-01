// pages/api/staff/rejected-claims.js
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

function requireRole(user, roles = []) {
  return roles.includes(user.role);
}

export default async function handler(req, res) {
  await dbConnect();

  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    let user;
    try {
      user = await getUserFromToken(req);
      console.log("user name",user);
    } catch (err) {
      return res.status(err.status || 401).json({ success: false, message: err.message });
    }

    if (!requireRole(user, ["clinic", "doctorStaff"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const doctorName = user.name;
    const doctorIdString = String(user._id);

    // Only patients marked Rejected and assigned to this doctor
    // Match either by stored doctor ObjectId string or by name (backwards compatibility)
    const rejected = await PatientRegistration.find({
      status: "Rejected",
      $or: [
        { doctor: doctorIdString },
        { doctor: doctorName },
      ],
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
        amount: 1,
        paid: 1,
        advance: 1,
        pending: 1,
        status: 1,
        rejectionNote: 1,
        invoicedDate: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .sort({ updatedAt: -1 })
      .lean();

    const data = rejected.map((r) => ({
      _id: r._id.toString(),
      invoiceNumber: r.invoiceNumber,
      patientName: `${r.firstName || ""} ${r.lastName || ""}`.trim(),
      email: r.email,
      mobileNumber: r.mobileNumber,
      emrNumber: r.emrNumber,
      doctor: r.doctor,
      service: r.service,
      package: r.package,
      treatment: r.treatment,
      amount: r.amount,
      paid: r.paid,
      advance: r.advance,
      pending: r.pending,
      status: r.status,
      rejectionNote: r.rejectionNote,
      invoicedDate: r.invoicedDate?.toISOString(),
      createdAt: r.createdAt?.toISOString(),
      updatedAt: r.updatedAt?.toISOString(),
      cancellationReason: r.rejectionNote || "No reason provided",
      cancellationType: "Payment",
    }));

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
      message: `Found ${data.length} rejected claims for Dr. ${doctorName}`,
      doctorName,
    });
  } catch (err) {
    console.error("Error fetching rejected claims:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
