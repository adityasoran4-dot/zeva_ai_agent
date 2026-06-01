import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import MaterialConsumption from "../../../../models/stocks/MaterialConsumption";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me)
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });

    if (
      !requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Resolve clinicId based on user role
    let clinicId;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id });
      if (!clinic)
        return res
          .status(400)
          .json({ success: false, message: "Clinic not found for this user" });
      clinicId = clinic._id;
    } else if (
      me.role === "agent" ||
      me.role === "doctor" ||
      me.role === "doctorStaff"
    ) {
      if (!me.clinicId)
        return res
          .status(400)
          .json({ success: false, message: "User not tied to a clinic" });
      clinicId = me.clinicId;
    } else if (me.role === "admin") {
      clinicId = req.query.clinicId;
      if (!clinicId)
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin in query parameters",
        });
    }

    const { id } = req.query;

    // Find consumption (must belong to clinic)
    const consumption = await MaterialConsumption.findOne({
      _id: id,
      clinicId,
    })
      .populate("branch", "name")
      .populate("doctor", "name email")
      .populate("room", "name")
      .populate("createdBy", "name email")
      .lean();

    if (!consumption) {
      return res.status(404).json({
        success: false,
        message: "Material consumption not found",
      });
    }

    res.status(200).json({
      success: true,
      data: consumption,
    });
  } catch (error) {
    console.error("Error fetching material consumption:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch material consumption",
      error: error.message,
    });
  }
}
