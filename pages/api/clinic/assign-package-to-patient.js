import dbConnect from "../../../lib/database";
import PatientRegistration from "../../../models/PatientRegistration";
import Package from "../../../models/Package";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await dbConnect();

  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!["clinic", "doctor", "agent", "doctorStaff", "staff"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
  if (clinicError || !clinicId) {
    return res.status(403).json({ success: false, message: clinicError || "Unable to determine clinic" });
  }

  const { patientId, packageId, validityInMonths, startDate, endDate, totalPrice, paidAmount, paymentStatus, paymentMethod } = req.body;
  if (!patientId || !packageId) {
    return res.status(400).json({ success: false, message: "patientId and packageId are required" });
  }

  try {
    // Verify the package belongs to this clinic
    const pkg = await Package.findOne({ _id: packageId, clinicId });
    if (!pkg) {
      return res.status(404).json({ success: false, message: "Package not found or does not belong to this clinic" });
    }

    // Verify the patient belongs to this clinic
    const patient = await PatientRegistration.findOne({ _id: patientId, clinicId });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found or does not belong to this clinic" });
    }

    const packageData = {
      packageId,
      packageName: pkg.name || '', // Store the package name
      packageSoldBy: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown', // Name of person who added package
      assignedDate: new Date(),
      validityInMonths: validityInMonths !== undefined ? parseInt(validityInMonths) : (pkg.validityInMonths || 0),
      startDate: startDate ? new Date(startDate) : (pkg.startDate || new Date()),
      endDate: endDate ? new Date(endDate) : (pkg.endDate || null),
      totalPrice: totalPrice !== undefined ? parseFloat(totalPrice) : (pkg.totalPrice || 0),
      paidAmount: paidAmount !== undefined ? parseFloat(paidAmount) : 0,
      paymentStatus: paymentStatus || "Unpaid",
      paymentMethod: paymentMethod || "",
    };

    // Push package to patient's packages array
    const updatedPatient = await PatientRegistration.findByIdAndUpdate(
      patientId,
      {
        $push: { packages: packageData },
        $set: { package: "Yes" },
      },
      { new: true }
    ).lean();

    return res.status(200).json({ 
      success: true, 
      message: "Package assigned to patient successfully",
      package: packageData 
    });
  } catch (error) {
    console.error("Error assigning package to patient:", error);
    return res.status(500).json({ success: false, message: "Failed to assign package to patient" });
  }
}
