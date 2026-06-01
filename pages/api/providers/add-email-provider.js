import mongoose from "mongoose";
import { getUserFromReq, requireRole } from "../lead-ms/auth";
import Clinic from "../../../models/Clinic";
import Provider from "../../../models/Provider";
import dbConnect from "../../../lib/database";
import { sendTestEmailBySmtp } from "../../../services/smtp";

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
  } else if (me.role === "agent") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "Agent not tied to a clinic" });
    }
    clinicId = me.clinicId;
  } else if (me.role === "doctor" || me.role === "doctorStaff") {
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
      email,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUsername,
      smtpPassword,
      imapHost,
      imapPort,
      imapSecure,
      imapUsername,
      imapPassword,
      emailType,
      type = ["email"],
    } = req.body;

    // Validation

    if (type?.includes("email") && !email) {
      return res.status(400).json({
        success: false,
        message: "Email is required for email providers",
      });
    }

    // Check if provider already exists for this email
    const existingProvider = await Provider.findOne({ email });
    if (existingProvider) {
      return res.status(409).json({
        success: false,
        message: "Email account already exists",
      });
    }

    // Send test email
    const isValidSmtp = await sendTestEmailBySmtp({
      from: email,
      to: email,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUsername,
      smtpPassword,
    });

    if (!isValidSmtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid SMTP credentials",
      });
    }

    // Prepare secrets
    const secrets = {
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      smtpSecure,
      imapHost,
      imapPort,
      imapUsername,
      imapPassword,
      imapSecure,
    };

    const newProvider = new Provider({
      clinicId,
      userId: me?._id,
      name: "other",
      label: email?.trim() || "",
      email: email?.trim() || "",
      status: "approved",
      emailProviderType: "other",
      emailType: emailType || "personal",
      type: ["email"],
      isActive: true,
      lastSyncedAt: new Date(),
      secrets,
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
