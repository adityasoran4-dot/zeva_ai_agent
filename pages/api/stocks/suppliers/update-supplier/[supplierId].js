import dbConnect from "../../../..//../lib/database";
import Clinic from "../../../../../models/Clinic";
import Supplier from "../../../../../models/stocks/Supplier";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  // Should be PUT or PATCH for update operations
  res.setHeader("Allow", ["PUT", "PATCH"]);

  if (!["PUT", "PATCH"].includes(req.method)) {
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
    const existingSupplier = await Supplier.findOne({
      _id: supplierId,
      clinicId,
    });

    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found or you do not have access to it",
      });
    }

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
      //   supplier opening balance
      openingBalance,
      openingBalanceType,
    } = req.body;

    // Prepare update data - only include fields that are provided
    const updateData = {};

    if (branch !== undefined) updateData.branch = branch;
    if (name !== undefined) updateData.name = name;
    if (vatRegNo !== undefined) updateData.vatRegNo = vatRegNo;
    if (telephone !== undefined) updateData.telephone = telephone;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (email !== undefined) {
      // Optional: Add email validation
      if (email && !/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }
      updateData.email = email;
    }
    if (url !== undefined) updateData.url = url;
    if (creditDays !== undefined) updateData.creditDays = creditDays;
    if (address !== undefined) updateData.address = address;
    if (notes !== undefined) updateData.notes = notes;
    if (openingBalance !== undefined)
      updateData.openingBalance = openingBalance;
    if (openingBalanceType !== undefined)
      updateData.openingBalanceType = openingBalanceType;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data provided for update",
      });
    }

    // Check for duplicate supplier name (if name is being updated)
    if (updateData.name && updateData.name !== existingSupplier.name) {
      const duplicateSupplier = await Supplier.findOne({
        clinicId,
        name: { $regex: new RegExp(`^${updateData.name}$`, "i") },
        _id: { $ne: supplierId },
      });

      if (duplicateSupplier) {
        return res.status(409).json({
          success: false,
          message: "Another supplier with this name already exists",
        });
      }
    }

    // Update the supplier
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      supplierId,
      updateData,
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      },
    ).lean();

    const findSupplier = await Supplier.findById(updatedSupplier?._id).populate(
      "branch",
      "name",
    );

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: findSupplier,
    });
  } catch (err) {
    console.error("Error in update supplier:", err);

    // Handle validation errors
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

    // Handle invalid ObjectId
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
