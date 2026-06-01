import dbConnect from "../../../lib/database";
import AppointmentReport from "../../../models/AppointmentReport";
import Appointment from "../../../models/Appointment";
import Clinic from "../../../models/Clinic";
import Room from "../../../models/Room";
import PatientRegistration from "../../../models/PatientRegistration";
import { getUserFromReq } from "../lead-ms/auth";

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
      return res
        .status(403)
        .json({
          success: false,
          message: "Access denied. User not linked to a clinic.",
        });
    }
  } else {
    return res.status(403).json({ success: false, message: "Access denied." });
  }

  if (req.method === "GET") {
    const { appointmentId } = req.query;
    if (!appointmentId) {
      return res
        .status(400)
        .json({ success: false, message: "appointmentId is required" });
    }

    try {
      const appointment = await Appointment.findOne({
        _id: appointmentId,
        clinicId,
      })
        .populate(
          "patientId",
          "firstName lastName emrNumber gender mobileNumber email",
        )
        .populate("doctorId", "name email")
        .populate("serviceId", "name")
        .populate("serviceIds", "name")
        .lean();

      if (!appointment) {
        return res
          .status(404)
          .json({ success: false, message: "Appointment not found" });
      }

      const report = await AppointmentReport.findOne({ appointmentId })
        .sort({ createdAt: -1 })
        .lean();

      const patientDoc = appointment.patientId;
      const patientName = patientDoc
        ? `${patientDoc.firstName || ""} ${patientDoc.lastName || ""}`.trim()
        : "";

      let patientReports = [];
      if (patientDoc?._id) {
        const reports = await AppointmentReport.find({
          patientId: patientDoc._id,
        })
          .sort({ updatedAt: -1 })
          .lean();

        const appointmentIds = reports.map((r) => r.appointmentId);
        const relatedAppointments = await Appointment.find({
          _id: { $in: appointmentIds },
        })
          .populate("doctorId", "name email")
          .lean();

        const appointmentMap = relatedAppointments.reduce((acc, appt) => {
          acc[appt._id.toString()] = appt;
          return acc;
        }, {});

        patientReports = reports.map((r) => {
          const appt = appointmentMap[r.appointmentId?.toString() || ""];
          return {
            reportId: r._id,
            appointmentId: r.appointmentId,
            temperatureCelsius: r.temperatureCelsius,
            pulseBpm: r.pulseBpm,
            systolicBp: r.systolicBp,
            diastolicBp: r.diastolicBp,
            heightCm: r.heightCm,
            weightKg: r.weightKg,
            waistCm: r.waistCm,
            respiratoryRate: r.respiratoryRate,
            spo2Percent: r.spo2Percent,
            hipCircumference: r.hipCircumference,
            headCircumference: r.headCircumference,
            bmi: r.bmi,
            sugar: r.sugar || "",
            urinalysis: r.urinalysis || "",
            otherDetails: r.otherDetails || "",
            updatedAt: r.updatedAt,
            createdAt: r.createdAt,
            doctorName: appt?.doctorId?.name || "",
            doctorEmail: appt?.doctorId?.email || "",
            startDate: appt?.startDate || null,
            fromTime: appt?.fromTime || "",
            toTime: appt?.toTime || "",
          };
        });
      }

      return res.status(200).json({
        success: true,
        appointment: {
          appointmentId: appointment._id,
          patientId: appointment.patientId?._id || appointment.patientId,
          patientName: patientName || appointment.patientName || "",
          emrNumber: patientDoc?.emrNumber || "",
          gender: patientDoc?.gender || "",
          email: patientDoc?.email || "",
          mobileNumber: patientDoc?.mobileNumber || "",
          doctorId: appointment.doctorId?._id || "",
          doctorName: appointment.doctorId?.name || "",
          doctorEmail: appointment.doctorId?.email || "",
          roomId: appointment.roomId,
          startDate: appointment.startDate,
          fromTime: appointment.fromTime,
          toTime: appointment.toTime,
          status: appointment.status,
          serviceId: appointment.serviceId?._id?.toString() || null,
          serviceName: appointment.serviceId?.name || null,
          serviceIds: Array.isArray(appointment.serviceIds) ? appointment.serviceIds.map(s => s?._id?.toString()).filter(Boolean) : [],
          serviceNames: (() => {
            const fromServiceIds = Array.isArray(appointment.serviceIds) ? appointment.serviceIds.map(s => s?.name || "").filter(Boolean) : [];
            const fromServiceId = appointment.serviceId?.name || "";
            const combined = fromServiceId ? [fromServiceId, ...fromServiceIds.filter(n => n !== fromServiceId)] : fromServiceIds;
            return combined;
          })(),
        },
        report: report
          ? {
              reportId: report._id,
              temperatureCelsius: report.temperatureCelsius,
              pulseBpm: report.pulseBpm,
              systolicBp: report.systolicBp,
              diastolicBp: report.diastolicBp,
              heightCm: report.heightCm,
              weightKg: report.weightKg,
              waistCm: report.waistCm,
              respiratoryRate: report.respiratoryRate,
              spo2Percent: report.spo2Percent,
              hipCircumference: report.hipCircumference,
              headCircumference: report.headCircumference,
              bmi: report.bmi,
              sugar: report.sugar || "",
              urinalysis: report.urinalysis || "",
              otherDetails: report.otherDetails || "",
              updatedAt: report.updatedAt,
            }
          : null,
        patientReports,
      });
    } catch (error) {
      console.error("Error fetching appointment report:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch report" });
    }
  }

  if (req.method === "POST") {
    // Drop unique index on appointmentId if it exists (to allow multiple reports per appointment)
    try {
      const collection = AppointmentReport.collection;
      const indexes = await collection.indexes();
      const uniqueAppointmentIndex = indexes.find(
        (idx) => idx.key?.appointmentId === 1 && idx.unique === true,
      );
      if (uniqueAppointmentIndex) {
        await collection.dropIndex("appointmentId_1");
      }
    } catch (error) {
      // Index might not exist or already dropped, continue
      console.log("Index check/removal:", error.message);
    }

    const {
      appointmentId,
      temperatureCelsius,
      pulseBpm,
      systolicBp,
      diastolicBp,
      heightCm,
      weightKg,
      waistCm,
      respiratoryRate,
      spo2Percent,
      hipCircumference,
      headCircumference,
      sugar,
      urinalysis,
      otherDetails,
      reportId,
    } = req.body;

    if (!appointmentId) {
      return res
        .status(400)
        .json({ success: false, message: "appointmentId is required" });
    }

    if (
      temperatureCelsius === undefined ||
      pulseBpm === undefined ||
      systolicBp === undefined ||
      diastolicBp === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Temperature, pulse, and BP readings are required",
      });
    }

    try {
      const appointment = await Appointment.findOne({
        _id: appointmentId,
        clinicId,
      }).lean();
      if (!appointment) {
        return res
          .status(404)
          .json({ success: false, message: "Appointment not found" });
      }

      const patient = await PatientRegistration.findById(appointment.patientId)
        .select("_id")
        .lean();
      if (!patient) {
        return res
          .status(404)
          .json({ success: false, message: "Patient record not found" });
      }

      const payload = {
        clinicId,
        appointmentId,
        patientId: patient._id,
        doctorId: appointment.doctorId,
        temperatureCelsius: Number(temperatureCelsius),
        pulseBpm: Number(pulseBpm),
        systolicBp: Number(systolicBp),
        diastolicBp: Number(diastolicBp),
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        waistCm: waistCm ? Number(waistCm) : undefined,
        respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
        spo2Percent: spo2Percent ? Number(spo2Percent) : undefined,
        hipCircumference: hipCircumference
          ? Number(hipCircumference)
          : undefined,
        headCircumference: headCircumference
          ? Number(headCircumference)
          : undefined,
        sugar: sugar || "",
        urinalysis: urinalysis || "",
        otherDetails: otherDetails || "",
      };

      if (payload.heightCm && payload.weightKg) {
        const heightMeters = payload.heightCm / 100;
        if (heightMeters > 0) {
          payload.bmi = Number(
            (payload.weightKg / (heightMeters * heightMeters)).toFixed(1),
          );
        }
      }

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      let report;
      if (reportId) {
        // Update existing report by reportId
        report = await AppointmentReport.findOneAndUpdate(
          { _id: reportId, clinicId },
          payload,
          { new: true },
        );
        if (!report) {
          return res
            .status(404)
            .json({ success: false, message: "Report not found" });
        }
      } else {
        // Always create a new report for the patient (allows multiple reports per patient/appointment)
        report = await AppointmentReport.create(payload);
      }

      return res.status(200).json({
        success: true,
        message: "Report saved successfully",
        report,
      });
    } catch (error) {
      console.error("Error saving appointment report:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to save report" });
    }
  }

  if (req.method === "DELETE") {
    const { reportId } = req.query;
    if (!reportId) {
      return res
        .status(400)
        .json({ success: false, message: "reportId is required" });
    }

    try {
      const report = await AppointmentReport.findById(reportId).lean();
      if (!report) {
        return res
          .status(404)
          .json({ success: false, message: "Report not found" });
      }
      if (report.clinicId.toString() !== clinicId.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied." });
      }
      await AppointmentReport.deleteOne({ _id: reportId });
      return res
        .status(200)
        .json({ success: true, message: "Report deleted successfully" });
    } catch (error) {
      console.error("Error deleting appointment report:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete report" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res
    .status(405)
    .json({ success: false, message: "Method Not Allowed" });
}
