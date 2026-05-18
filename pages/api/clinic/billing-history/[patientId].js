import dbConnect from "../../../../lib/database";
import Billing from "../../../../models/Billing";
import { getUserFromReq } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check if user has access (clinic, agent, doctorStaff, staff)
    if (!["clinic", "agent", "doctorStaff", "staff"].includes(clinicUser.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({ success: false, message: "Patient ID is required" });
    }

    // Determine clinicId
    let clinicId;
    if (clinicUser.role === "clinic") {
      // For clinic role, find clinic by owner
      const Clinic = (await import("../../../../models/Clinic")).default;
      const clinic = await Clinic.findOne({ owner: clinicUser._id });
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
      clinicId = clinic._id;
    } else {
      // For agent, doctorStaff, staff - use clinicId from user
      clinicId = clinicUser.clinicId;
      if (!clinicId) {
        return res.status(403).json({ success: false, message: "User not linked to a clinic" });
      }
    }

    // Fetch all billing records for this patient and clinic, excluding pure balance adjustments
    // BUT include advance payment records for tracking purposes
    const billings = await Billing.find({
      patientId: patientId,
      clinicId: clinicId,
      isAdvanceOnly: { $ne: true },
    })
      .sort({ createdAt: -1 }) // Most recent first
      .lean();

    return res.status(200).json({
      success: true,
      billings: billings,
    });
  } catch (error) {
    console.error("Error fetching billing history:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch billing history",
    });
  }
}

