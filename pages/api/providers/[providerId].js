import { getUserFromReq, requireRole } from "../lead-ms/auth";
import Clinic from "../../../models/Clinic";
import Provider from "../../../models/Provider";
import dbConnect from "../../../lib/database";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const me = await getUserFromReq(req);
  if (!me) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  if (!requireRole(me, ["clinic", "agent", "admin", "doctor"])) {
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
  } else if (me.role === "agent") {
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
    clinicId = req.query.clinicId; // Changed from body to query for GET request
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
    const { providerId } = req.query;

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: "providerId is required",
      });
    }

    // Fetch provider WITHOUT lean() to get mongoose document with decryption
    const provider = await Provider.findOne({ _id: providerId, clinicId });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found or you don't have permission to access it",
      });
    }

    // Convert to plain object AFTER decryption happens
    const providerData = provider.toObject ? provider.toObject() : provider;

    // Format the response properly
    const responseData = {
      _id: providerData._id,
      clinicId: providerData.clinicId,
      userId: providerData.userId,
      name: providerData.name,
      label: providerData.label,
      phone: providerData.phone || "",
      email: providerData.email || "",
      status: providerData.status,
      type: providerData.type,
      createdAt: providerData.createdAt,
      updatedAt: providerData.updatedAt,
      secrets: providerData.secrets || {}, // This should now be decrypted
    };

    // Remove any encryption metadata fields
    delete responseData._ct;
    delete responseData._ac;
    delete responseData.__v;

    return res.status(200).json({
      // Changed from 201 to 200 for GET
      success: true,
      message: "Provider fetched successfully",
      data: responseData,
    });
  } catch (err) {
    // console.error("Error in getting provider:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message:
          "Validation failed: " +
          Object.values(err.errors)
            .map((e) => e.message)
            .join(", "),
      });
    }

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
