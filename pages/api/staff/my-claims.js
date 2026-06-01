import dbConnect from "../../../lib/database";
import jwt from "jsonwebtoken";
import PatientRegistration from "../../../models/PatientRegistration";
import User from "../../../models/Users";

// 🔐 Extract user from JWT
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

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    const user = await getUserFromToken(req);

    // Allow both staff & doctorStaff
    if (!["staff", "doctorStaff"].includes(user.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied" });
    }

    const staffIdentifier = user.name || user.email || user._id.toString();

    // 🔹 Find all patients created by or released by this user
    const patients = await PatientRegistration.find({
      $or: [
        { userId: user._id },
        { advanceClaimReleasedBy: { $regex: staffIdentifier, $options: "i" } },
      ],
    })
      .select(
        "invoiceNumber invoicedBy userId emrNumber firstName lastName gender email mobileNumber referredBy patientType doctor service treatment package amount paid advance pending paymentMethod insurance advanceGivenAmount coPayPercent needToPay advanceClaimStatus advanceClaimReleaseDate advanceClaimReleasedBy status invoicedDate createdAt updatedAt"
      )
      .sort({ createdAt: -1 });

    // 🔹 Calculate stats
    const totalPatients = patients.length;
    const releasedClaims = patients.filter(
      (p) => p.advanceClaimStatus === "Released"
    ).length;
    const cancelledClaims = patients.filter(
      (p) => p.advanceClaimStatus === "Cancelled"
    ).length;
    const pendingClaims = patients.filter(
      (p) => p.advanceClaimStatus === "Pending"
    ).length;

    const totalCoPayment = patients.reduce(
      (sum, p) => sum + (Number(p.advanceGivenAmount) || 0),
      0
    );

    const stats = {
      totalPatients,
      releasedClaims,
      cancelledClaims,
      pendingClaims,
      totalCoPayment,
    };

    return res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
      stats,
    });
  } catch (err) {
    console.error("Error fetching my claims:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
}
