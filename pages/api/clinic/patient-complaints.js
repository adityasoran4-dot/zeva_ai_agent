import dbConnect from "../../../lib/database";
import PatientComplains from "../../../models/PatientComplains";
import Appointment from "../../../models/Appointment";
import AppointmentReport from "../../../models/AppointmentReport";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";
import AllocatedStockItem from "../../../models/stocks/AllocatedStockItem";
import { calculateTotalAmount, reduceQuantity } from "../../../lib/stockUtils";

export default async function handler(req, res) {
  await dbConnect();

  let clinicUser;
  try {
    clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  let clinicId = null;
  if (clinicUser.role === "clinic") {
    const clinic = await Clinic.findOne({ owner: clinicUser._id }).lean();
    if (!clinic) {
      return res
        .status(404)
        .json({ success: false, message: "Clinic not found" });
    }
    clinicId = clinic._id;
  } else if (["agent", "doctor", "doctorStaff"].includes(clinicUser.role)) {
    clinicId = clinicUser.clinicId;
    if (!clinicId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. User not linked to a clinic.",
      });
    }
  } else {
    return res.status(403).json({ success: false, message: "Access denied." });
  }

  if (req.method === "POST") {
    let {
      appointmentId,
      appointmentReportId,
      complaints,
      items,
      beforeImage,
      afterImage,
      isDoctorDiscountApplied,
      doctorDiscountType,
      doctorDiscountAmount,
    } = req.body;

    if (
      !appointmentId ||
      !appointmentReportId ||
      !complaints ||
      !complaints.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "appointmentId, appointmentReportId, and complaints are required",
      });
    }

    try {
      // Verify appointment exists and belongs to clinic
      const appointment = await Appointment.findOne({
        _id: appointmentId,
        clinicId,
      }).lean();
      if (!appointment) {
        return res
          .status(404)
          .json({ success: false, message: "Appointment not found" });
      }

      // Verify appointment report exists and belongs to the appointment
      const report = await AppointmentReport.findOne({
        _id: appointmentReportId,
        appointmentId: appointmentId,
        clinicId,
      }).lean();
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Appointment report not found or does not match appointment",
        });
      }

      // Get doctorId from appointment (the doctor assigned to this appointment)
      const doctorId = appointment.doctorId;
      if (!doctorId) {
        return res.status(400).json({
          success: false,
          message: "Appointment does not have an assigned doctor",
        });
      }

      // reduce quantity from allocated items
      if (items && items.length > 0) {
        for (let item of items) {
          const { itemId, code } = item;
          const allocatedItem = await AllocatedStockItem.findById(itemId);
          if (!allocatedItem) {
            return res.status(404).json({
              success: false,
              message: `Allocated stock item not found for itemId: ${itemId}`,
            });
          }
          console.log({ allocatedItem });

          // reduce quantity from allocated item
          const updatedQtyByUom = await reduceQuantity(
            allocatedItem.quantitiesByUom,
            item.uom,
            item.quantity,
            allocatedItem?.item?.level0,
            allocatedItem?.item?.packagingStructure,
          );
          console.log({ updatedQtyByUom });

          // add totalAmount to item
          item.totalAmount = await calculateTotalAmount(
            allocatedItem._id,
            item.uom,
            item.quantity,
          );
          // update allocated item quantitiesByUom
          allocatedItem.quantitiesByUom = updatedQtyByUom;
          allocatedItem.status = "Partially_Used";
          const checkFullyUsed = updatedQtyByUom.every(
            (qty) => qty.quantity === 0,
          );
          if (checkFullyUsed) {
            allocatedItem.status = "Used";
          }
          await allocatedItem.save();
        }
      }

      // Create the complaint record
      const complaint = await PatientComplains.create({
        clinicId,
        patientId: appointment.patientId,
        doctorId: doctorId,
        appointmentId: appointmentId,
        appointmentReportId: appointmentReportId,
        complaints: complaints.trim(),
        items: items || [],
        beforeImage: beforeImage || null,
        afterImage: afterImage || null,
        isDoctorDiscountApplied: isDoctorDiscountApplied || false,
        doctorDiscountType: doctorDiscountType || null,
        doctorDiscountAmount: doctorDiscountAmount || 0,
      });

      return res.status(200).json({
        success: true,
        message: "Complaint saved successfully",
        complaint: {
          _id: complaint._id,
          clinicId: complaint.clinicId,
          patientId: complaint.patientId,
          doctorId: complaint.doctorId,
          appointmentId: complaint.appointmentId,
          appointmentReportId: complaint.appointmentReportId,
          complaints: complaint.complaints,
          items: complaint.items || [],
          beforeImage: complaint.beforeImage,
          afterImage: complaint.afterImage,
          isDoctorDiscountApplied: complaint.isDoctorDiscountApplied,
          doctorDiscountType: complaint.doctorDiscountType,
          doctorDiscountAmount: complaint.doctorDiscountAmount,
          createdAt: complaint.createdAt,
          updatedAt: complaint.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error saving patient complaint:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to save complaint" });
    }
  }

  if (req.method === "GET") {
    const { appointmentId, patientId, appointmentReportId } = req.query;

    try {
      const query = { clinicId };
      if (appointmentId) query.appointmentId = appointmentId;
      if (patientId) query.patientId = patientId;
      if (appointmentReportId) query.appointmentReportId = appointmentReportId;

      const complaints = await PatientComplains.find(query)
        .populate("patientId", "firstName lastName emrNumber")
        .populate("doctorId", "name email")
        .populate("appointmentId", "visitId startDate fromTime toTime status")
        .populate(
          "appointmentReportId",
          "temperatureCelsius pulseBpm systolicBp diastolicBp updatedAt",
        )
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        complaints: complaints.map((c) => ({
          _id: c._id,
          patientId: c.patientId,
          doctorId: c.doctorId,
          appointmentId: c.appointmentId,
          appointmentReportId: c.appointmentReportId,
          complaints: c.complaints,
          items: c.items || [],
          beforeImage: c.beforeImage,
          afterImage: c.afterImage,
          isDoctorDiscountApplied: c.isDoctorDiscountApplied,
          doctorDiscountType: c.doctorDiscountType,
          doctorDiscountAmount: c.doctorDiscountAmount,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching patient complaints:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch complaints" });
    }
  }

  if (req.method === "PATCH") {
    const {
      complaintId,
      complaints,
      items,
      beforeImage,
      afterImage,
      isDoctorDiscountApplied,
      doctorDiscountType,
      doctorDiscountAmount,
    } = req.body || {};
    if (!complaintId) {
      return res
        .status(400)
        .json({ success: false, message: "complaintId is required" });
    }
    if (complaints && typeof complaints !== "string") {
      return res.status(400).json({
        success: false,
        message: "complaints must be a string when provided",
      });
    }
    try {
      const existing = await PatientComplains.findOne({
        _id: complaintId,
        clinicId,
      });
      if (!existing) {
        return res
          .status(404)
          .json({ success: false, message: "Complaint not found" });
      }

      if (typeof complaints === "string") {
        existing.complaints = complaints.trim();
      }
      if (Array.isArray(items)) {
        existing.items = items;
      }
      if (typeof beforeImage === "string") {
        existing.beforeImage = beforeImage;
      }
      if (typeof afterImage === "string") {
        existing.afterImage = afterImage;
      }
      if (typeof isDoctorDiscountApplied !== "undefined") {
        existing.isDoctorDiscountApplied = isDoctorDiscountApplied;
      }
      if (typeof doctorDiscountType !== "undefined") {
        existing.doctorDiscountType = doctorDiscountType;
      }
      if (typeof doctorDiscountAmount !== "undefined") {
        existing.doctorDiscountAmount = doctorDiscountAmount;
      }
      await existing.save();

      return res.status(200).json({
        success: true,
        message: "Complaint updated successfully",
        complaint: {
          _id: existing._id,
          clinicId: existing.clinicId,
          patientId: existing.patientId,
          doctorId: existing.doctorId,
          appointmentId: existing.appointmentId,
          appointmentReportId: existing.appointmentReportId,
          complaints: existing.complaints,
          items: existing.items || [],
          beforeImage: existing.beforeImage,
          afterImage: existing.afterImage,
          isDoctorDiscountApplied: existing.isDoctorDiscountApplied,
          doctorDiscountType: existing.doctorDiscountType,
          doctorDiscountAmount: existing.doctorDiscountAmount,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error updating patient complaint:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to update complaint" });
    }
  }

  if (req.method === "DELETE") {
    const { complaintId } = req.query || {};
    if (!complaintId) {
      return res
        .status(400)
        .json({ success: false, message: "complaintId is required" });
    }
    try {
      const deleted = await PatientComplains.findOneAndDelete({
        _id: complaintId,
        clinicId,
      });
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Complaint not found" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Complaint deleted successfully" });
    } catch (error) {
      console.error("Error deleting patient complaint:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete complaint" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
  return res
    .status(405)
    .json({ success: false, message: "Method Not Allowed" });
}
