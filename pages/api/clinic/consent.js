import dbConnect from "../../../lib/database";
import Consent from "../../../models/Consent";
import Department from "../../../models/Department";
import Service from "../../../models/Service";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!["clinic", "doctor", "agent", "doctorStaff", "staff", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
  if (clinicError || !clinicId) {
    return res.status(403).json({
      success: false,
      message: clinicError || "Unable to determine clinic access",
    });
  }

  // GET: fetch all consent forms for this clinic
  if (req.method === "GET") {
    try {
      const consents = await Consent.find({ clinicId })
        .populate({ path: "departmentIds", select: "name", strictPopulate: false })
        .populate({ path: "serviceIds", select: "name", strictPopulate: false })
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ success: true, consents });
    } catch (error) {
      console.error("GET consent error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch consent forms" });
    }
  }

  // POST: create a new consent form
  if (req.method === "POST") {
    try {
      const {
        fileUrl,
        fileName,
        fileSize,
        formName,
        departmentIds,
        language,
        version,
        description,
        serviceIds,
        enableDigitalSignature,
        requireNameConfirmation,
        status,
      } = req.body;

      if (!formName) {
        return res.status(400).json({ success: false, message: "Form name is required" });
      }

      const consent = await Consent.create({
        clinicId,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        formName,
        departmentIds: departmentIds || [],
        language: language || "English",
        version: version || "1.0",
        description: description || "",
        serviceIds: serviceIds || [],
        enableDigitalSignature: enableDigitalSignature || false,
        requireNameConfirmation: requireNameConfirmation || false,
        status: status || "published",
        createdBy: user._id || user.userId,
      });

      const populated = await Consent.findById(consent._id)
        .populate({ path: "departmentIds", select: "name", strictPopulate: false })
        .populate({ path: "serviceIds", select: "name", strictPopulate: false })
        .lean();

      return res.status(201).json({ success: true, consent: populated });
    } catch (error) {
      console.error("POST consent error:", error);
      return res.status(500).json({ success: false, message: "Failed to create consent form" });
    }
  }

  // PUT: update a consent form
  if (req.method === "PUT") {
    try {
      const { id, ...updateData } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, message: "Consent ID is required" });
      }

      const consent = await Consent.findOneAndUpdate(
        { _id: id, clinicId },
        { $set: updateData },
        { new: true }
      )
        .populate({ path: "departmentIds", select: "name", strictPopulate: false })
        .populate({ path: "serviceIds", select: "name", strictPopulate: false })
        .lean();

      if (!consent) {
        return res.status(404).json({ success: false, message: "Consent form not found" });
      }

      return res.status(200).json({ success: true, consent });
    } catch (error) {
      console.error("PUT consent error:", error);
      return res.status(500).json({ success: false, message: "Failed to update consent form" });
    }
  }

  // DELETE: delete a consent form
  if (req.method === "DELETE") {
    try {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ success: false, message: "Consent ID is required" });
      }

      const consent = await Consent.findOneAndDelete({ _id: id, clinicId });
      if (!consent) {
        return res.status(404).json({ success: false, message: "Consent form not found" });
      }

      return res.status(200).json({ success: true, message: "Consent form deleted successfully" });
    } catch (error) {
      console.error("DELETE consent error:", error);
      return res.status(500).json({ success: false, message: "Failed to delete consent form" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
