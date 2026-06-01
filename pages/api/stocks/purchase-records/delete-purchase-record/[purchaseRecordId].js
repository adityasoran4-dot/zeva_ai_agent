import dbConnect from "../../../../../lib/database";
import Clinic from "../../../../../models/Clinic";
import PurchaseRecord from "../../../../../models/stocks/PurchaseRecord";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  const { purchaseRecordId } = req.query;

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (
      !requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get clinicId based on user role
    let clinicId;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id });
      if (!clinic) {
        return res.status(400).json({
          success: false,
          message: "Clinic not found for this user",
        });
      }
      clinicId = clinic._id;
    } else if (me.role === "agent" || me.role === "doctorStaff") {
      if (!me.clinicId) {
        return res.status(400).json({
          success: false,
          message: "Agent not tied to a clinic",
        });
      }
      clinicId = me.clinicId;
    } else if (me.role === "doctor") {
      if (!me.clinicId) {
        return res.status(400).json({
          success: false,
          message: "Doctor not tied to a clinic",
        });
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
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Validate purchaseRecordId is provided
    if (!purchaseRecordId) {
      return res.status(400).json({
        success: false,
        message: "purchaseRecordId is required in query parameters",
      });
    }

    // Check if purchase record exists and belongs to clinic
    const purchaseRecord = await PurchaseRecord.findOne({
      _id: purchaseRecordId,
      clinicId,
    });

    if (!purchaseRecord) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found or you do not have access to it",
      });
    }

    // Perform the deletion
    await PurchaseRecord.deleteOne({ _id: purchaseRecordId, clinicId });

    return res.status(200).json({
      success: true,
      message: "Purchase record deleted successfully",
    });
  } catch (err) {
    console.error("Error in delete purchase record:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
