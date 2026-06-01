import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import Supplier from "../../../../models/stocks/Supplier";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const me = await getUserFromReq(req);
  if (!me) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  if (!requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
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
      return res
        .status(400)
        .json({ success: false, message: "Agent not tied to a clinic" });
    }
    clinicId = me.clinicId;
  } else if (me.role === "doctor") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor not tied to a clinic" });
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

  try {
    const {
      branch,
      name,
      vatRegNo,
      telephone,
      mobile,
      email,
      url,
      creditDays,
      address,
      notes,
    } = req.body;

    const findBranch = await Clinic.findById(branch);
    if (!findBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const newSupplier = new Supplier({
      clinicId,
      branch,
      name,
      vatRegNo,
      telephone,
      mobile,
      email,
      url,
      creditDays,
      address,
      notes,
    });

    await newSupplier.save();

    const findSupplier = await Supplier.findById(newSupplier?._id).populate(
      "branch",
      "name",
    );

    res.status(200).json({
      success: true,
      message: "Supplier added successfully",
      data: findSupplier,
    });
  } catch (err) {
    console.error("Error in add supplier:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
