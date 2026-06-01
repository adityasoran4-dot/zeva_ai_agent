import mongoose from "mongoose";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import Clinic from "../../../../models/Clinic";
import Provider from "../../../../models/Provider";
import dbConnect from "../../../../lib/database";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
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
    const { providerId } = req.query;
    const { name, label, phone, email, status, type, secrets } = req.body;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    if (name) provider.name = name.trim();
    if (label) provider.label = label.trim();
    if (phone) provider.phone = phone.trim();
    if (email) provider.email = email.trim();
    if (status) provider.status = status;
    if (type) provider.type = type;

    if (secrets && typeof secrets === "object") {
      const existingSecrets = provider.secrets || {};
      const mergedSecrets = { ...existingSecrets, ...secrets };
      // Remove keys with empty string values
      Object.keys(mergedSecrets).forEach((key) => {
        if (!mergedSecrets[key]) {
          delete mergedSecrets[key];
        }
      });
      provider.secrets = mergedSecrets;
    }
    await provider.save();

    const findProvider = await Provider.findById(provider._id).lean();

    return res.status(201).json({
      success: true,
      message: "Provider updated successfully",
      data: findProvider,
    });
  } catch (err) {
    // console.error("Error update provider:", err);

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

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
