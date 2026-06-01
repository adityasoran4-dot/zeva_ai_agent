import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import MaterialConsumption from "../../../../models/stocks/MaterialConsumption";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
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
      clinicId = req.body.clinicId;
      if (!clinicId)
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin",
        });
    }

    const { branch, doctor, room, date, notes, items } = req.body;

    // Validation
    if (!branch || !doctor || !room || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: branch, doctor, room, date",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.name || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: "Each item must have name and quantity",
        });
      }
    }

    // Create new material consumption
    const newConsumption = new MaterialConsumption({
      clinicId,
      branch,
      doctor,
      room,
      date: new Date(date),
      notes: notes || "",
      items,
      createdBy: me._id,
      status: "New",
    });

    await newConsumption.save();

    res.status(201).json({
      success: true,
      message: "Material consumption created successfully",
      data: newConsumption,
    });
  } catch (error) {
    console.error("Error creating material consumption:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create material consumption",
      error: error.message,
    });
  }
}
