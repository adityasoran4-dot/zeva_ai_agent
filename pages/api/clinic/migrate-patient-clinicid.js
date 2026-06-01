import dbConnect from "../../../lib/database";
import PatientRegistration from "../../../models/PatientRegistration";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { clinicId, error: clinicError } = await getClinicIdFromUser(me);
    if (clinicError || !clinicId) {
      return res.status(403).json({
        success: false,
        message: clinicError || "Unable to determine clinic",
      });
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    const clinicOwnerId = clinic.owner;
    const clinicStaffIds = await User.find({
      $or: [
        { _id: clinicOwnerId },
        { clinicId: clinicId, role: { $in: ["agent", "staff", "doctorStaff", "doctor"] } },
      ],
    }).select("_id");

    const userIds = clinicStaffIds.map(u => u._id);

    const patientsToUpdate = await PatientRegistration.find(
      {
        $and: [
          { clinicId: { $exists: false } },
          { userId: { $in: userIds } },
        ],
      },
      { _id: 1, firstName: 1, lastName: 1, mobileNumber: 1 }
    ).lean();

    console.log("Patients to migrate:", patientsToUpdate);

    const patientIds = patientsToUpdate.map(p => p._id);

    const result = await PatientRegistration.updateMany(
      { _id: { $in: patientIds } },
      { $set: { clinicId: clinicId } },
    );

    console.log("Migration result:", {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      migratedPatients: patientsToUpdate
    });

    return res.status(200).json({
      success: true,
      message: `Migrated ${result.modifiedCount} patients`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
      migratedPatients: patientsToUpdate,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to migrate patients",
      error: error.message,
    });
  }
}
