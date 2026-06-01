import dbConnect from "../../../lib/database";
import mongoose from "mongoose";
import Appointment from "../../../models/Appointment";
import Room from "../../../models/Room";
import { getStaffUser } from "../../../server/staff/doctorTreatmentService";

export default async function handler(req, res) {
  await dbConnect();

  try {
    const user = await getStaffUser(req);

    if (!["doctor", "doctorStaff"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (req.method === "GET") {
      const { date, status } = req.query;
      const query = { doctorId: user._id };

      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        query.startDate = { $gte: startDate, $lt: endDate };
      }

      if (status) {
        query.status = status;
      }

      const appointments = await Appointment.find(query)
        .populate({
          path: "patientId",
          model: "PatientRegistration",
          select: "firstName lastName mobileNumber emrNumber invoiceNumber",
        })
        .populate({
          path: "roomId",
          model: Room,
          select: "name",
        })
        .sort({ startDate: 1, fromTime: 1 })
        .lean();

      const formatted = appointments.map((apt) => {
        const patient = apt.patientId || {};
        return {
          _id: apt._id.toString(),
          clinicId: apt.clinicId?.toString(),
          patientName: `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "Unknown patient",
          patientMobile: patient.mobileNumber || "",
          emrNumber: patient.emrNumber || "",
          invoiceNumber: patient.invoiceNumber || "",
          status: apt.status,
          followType: apt.followType,
          startDate: apt.startDate ? apt.startDate.toISOString() : null,
          fromTime: apt.fromTime,
          toTime: apt.toTime,
          roomName: apt.roomId?.name || "-",
          referral: apt.referral || "direct",
          emergency: apt.emergency || "no",
          notes: apt.notes || "",
          createdAt: apt.createdAt?.toISOString(),
          updatedAt: apt.updatedAt?.toISOString(),
        };
      });

      return res.status(200).json({
        success: true,
        appointments: formatted,
      });
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error("Doctor appointments API error:", error);
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message || "Server error" });
  }
}


