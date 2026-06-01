import mongoose from "mongoose";
import { getUserFromReq, requireRole } from "../lead-ms/auth";
import Clinic from "../../../models/Clinic";
import Provider from "../../../models/Provider";
import dbConnect from "../../../lib/database";

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
    const {
      name,
      label,
      phone,
      email,
      type,
      secrets,
      emailProviderType,
      emailType,
      status, // Get status from request body
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (type?.includes("email") && !email) {
      return res.status(400).json({
        success: false,
        message: "Email is required for email providers",
      });
    }
    if ((type?.includes("sms") || type?.includes("whatsapp")) && !phone) {
      return res.status(400).json({
        success: false,
        message: "Phone is required for sms/whatsapp providers",
      });
    }

    if (!secrets || Object.keys(secrets).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Secrets are required for provider configuration",
      });
    }
    // console.log({ me });

    // Determine provider status
    // If status is provided in request (like "approved" from frontend test), use it
    // Otherwise default to "pending" or whatever your default should be
    const providerStatus = status || "pending";

    const newProvider = new Provider({
      clinicId,
      userId: me?._id,
      name: name.trim(),
      label: label?.trim() || "",
      phone: phone?.trim() || "",
      email: email?.trim() || "",
      type,
      secrets,
      status: providerStatus, // Add status field
      ...(emailProviderType ? { emailProviderType } : {}),
      ...(emailType ? { emailType } : {}),
    });
    await newProvider.save();

    const findProvider = await Provider.findById(newProvider._id)
      .select("-secrets -_ac -_ct")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Provider added successfully",
      data: findProvider,
    });
  } catch (err) {
    // console.error("Error adding provider:", err);

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
