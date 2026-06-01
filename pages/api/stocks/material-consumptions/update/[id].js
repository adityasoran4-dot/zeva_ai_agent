import dbConnect from "../../../../../lib/database";
import Clinic from "../../../../../models/Clinic";
import MaterialConsumption from "../../../../../models/stocks/MaterialConsumption";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PUT") {
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

    const { id } = req.query;
    const { branch, doctor, room, date, notes, items, status } = req.body;

    // Find consumption (must belong to clinic)
    const consumption = await MaterialConsumption.findOne({
      _id: id,
      clinicId,
    });

    if (!consumption) {
      return res.status(404).json({
        success: false,
        message: "Material consumption not found",
      });
    }

    // Update fields
    if (branch !== undefined) {
      consumption.branch = branch;
    }
    if (doctor !== undefined) {
      consumption.doctor = doctor;
    }
    if (room !== undefined) {
      consumption.room = room;
    }
    if (date !== undefined) consumption.date = new Date(date);
    if (notes !== undefined) consumption.notes = notes;
    if (status !== undefined && consumption.status !== "Deleted") {
      consumption.status = status;
    }

    // Update items if provided
    if (items !== undefined && Array.isArray(items) && items.length > 0) {
      // Validate items
      for (const item of items) {
        if (!item.name || !item.quantity) {
          return res.status(400).json({
            success: false,
            message: "Each item must have name and quantity",
          });
        }
      }
      consumption.items = items;
    }

    await consumption.save();

    res.status(200).json({
      success: true,
      message: "Material consumption updated successfully",
      data: consumption,
    });
  } catch (error) {
    console.error("Error updating material consumption:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update material consumption",
      error: error.message,
    });
  }
}
