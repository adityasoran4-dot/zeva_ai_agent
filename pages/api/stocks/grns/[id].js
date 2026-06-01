import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import GRN from "../../../../models/stocks/GRN";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    if (
      !requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    let clinicId;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id });
      if (!clinic) {
        return res
          .status(400)
          .json({ success: false, message: "Clinic not found for this user" });
      }
      clinicId = clinic._id;
    } else if (
      me.role === "agent" ||
      me.role === "doctor" ||
      me.role === "doctorStaff"
    ) {
      if (!me.clinicId) {
        return res
          .status(400)
          .json({ success: false, message: "User not tied to a clinic" });
      }
      clinicId = me.clinicId;
    } else if (me.role === "admin") {
      clinicId = req.query.clinicId;
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin in query parameters",
        });
      }
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required in query parameters",
      });
    }

    const grn = await GRN.findOne({ _id: id, clinicId })
      .populate("branch", "name")
      .populate({
        path: "purchasedOrder",
        select: "orderNo date supplier",
        populate: {
          path: "supplier",
          select: "name",
        },
      })
      .populate("createdBy", "name email")
      .lean();

    if (!grn) {
      return res.status(404).json({ success: false, message: "GRN not found" });
    }

    return res.status(200).json({ success: true, data: grn });
  } catch (err) {
    console.error("Error fetching GRN by id:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch GRN details",
      error: err.message,
    });
  }
}
