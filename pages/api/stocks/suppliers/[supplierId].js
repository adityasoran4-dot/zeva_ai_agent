// GET Supplier by Id
import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import Supplier from "../../../../models/stocks/Supplier";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  res.setHeader("Allow", ["GET"]);

  if (!["GET"].includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
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
      clinicId = req.body.clinicId;
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { supplierId } = req.query;

    // Validate supplierId is provided
    if (!supplierId) {
      return res.status(400).json({
        success: false,
        message: "supplierId is required in query parameters",
      });
    }

    // Check if supplier exists and belongs to clinic
    const supplier = await Supplier.findOne({
      _id: supplierId,
      clinicId,
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message:
          "Supplier not found or you do not have access to do this action.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supplier fetched successfully",
      data: supplier,
    });
  } catch (err) {
    console.error("Error in get supplier by id:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
