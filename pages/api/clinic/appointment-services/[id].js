import dbConnect from "../../../../lib/database";
import Appointment from "../../../../models/Appointment";
import Service from "../../../../models/Service";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser } from "../../lead-ms/permissions-helper";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await dbConnect();

  const { id } = req.query;

  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!["clinic", "doctor", "agent", "doctorStaff", "staff"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
  if (clinicError || !clinicId) {
    return res.status(403).json({ success: false, message: clinicError || "Unable to determine clinic" });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid appointment ID" });
  }

  const { serviceIds } = req.body;
  if (!Array.isArray(serviceIds)) {
    return res.status(400).json({ success: false, message: "serviceIds must be an array" });
  }

  try {
    // Verify appointment belongs to clinic
    const appointment = await Appointment.findOne({ _id: id, clinicId });
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Validate service IDs belong to the clinic
    const validIds = [];
    for (const sid of serviceIds) {
      if (mongoose.Types.ObjectId.isValid(sid)) {
        const svc = await Service.findOne({ _id: sid, clinicId });
        if (svc) validIds.push(svc._id);
      }
    }

    // Build the merged set: existing serviceIds + new valid ones (no duplicates)
    const existingIds = appointment.serviceIds.map((s) => s.toString());
    const toAdd = validIds.filter((newId) => !existingIds.includes(newId.toString()));

    // Append only new IDs — never overwrite existing ones
    const updated = await Appointment.findByIdAndUpdate(
      id,
      toAdd.length > 0 ? { $push: { serviceIds: { $each: toAdd } } } : {},
      { new: true }
    ).populate("serviceIds", "name price clinicPrice");

    return res.status(200).json({
      success: true,
      message: "Services updated successfully",
      serviceIds: updated.serviceIds.map((s) => s._id.toString()),
      serviceNames: updated.serviceIds.map((s) => s.name),
    });
  } catch (error) {
    console.error("Error updating appointment services:", error);
    return res.status(500).json({ success: false, message: "Failed to update services" });
  }
}
