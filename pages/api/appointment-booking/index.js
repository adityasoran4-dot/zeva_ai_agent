import dbConnect from "../../../lib/database";
import Appointment from "../../../models/Appointment";
import Clinic from "../../../models/Clinic";
import PatientRegistration from "../../../models/PatientRegistration";
import Users from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth";
import { generateEmrNumber } from "../../../lib/generateEmrNumber.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await dbConnect();

  try {
    /*
    patientDetails:{
       firstName:string;
       lastName:string;
       email:string;
       phone:string
    }
    */
    const { doctorId, clinicId } = req.query;
    const { startDate, fromTime, toTime, serviceId, patientDetails } = req.body;
    const doctor = await Users.findById(doctorId);
    const clinic = await Clinic.findById(clinicId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found",
      });
    }

    let patient = await PatientRegistration.findOne({
      clinicId,
      firstName: patientDetails?.firstName,
      lastName: patientDetails?.lastName,
      mobileNumber: patientDetails?.phone,
    });

    if (!patient) {
      // Generate EMR number
      const emrNumber = await generateEmrNumber();

      // Generate invoice number in format INV-YYYYMMDD-XXX
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
      const invoicePattern = new RegExp(`^INV-${dateStr}-(\\d+)$`);

      const patientsWithInvoice = await PatientRegistration.find({
        invoiceNumber: { $regex: invoicePattern },
      })
        .select("invoiceNumber")
        .lean();

      let maxInvoiceSeq = 0;
      for (const p of patientsWithInvoice) {
        if (p.invoiceNumber) {
          const match = p.invoiceNumber.match(invoicePattern);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxInvoiceSeq) {
              maxInvoiceSeq = num;
            }
          }
        }
      }

      const invoiceNumber = `INV-${dateStr}-${String(maxInvoiceSeq + 1).padStart(3, "0")}`;

      // Create a new patient with auto-generated fields
      patient = new PatientRegistration({
        clinicId,
        userId: doctorId,
        invoiceNumber: invoiceNumber,
        invoicedDate: new Date(),
        invoicedBy: doctor?.name || "System",
        emrNumber: emrNumber,
        firstName: patientDetails?.firstName,
        lastName: patientDetails?.lastName,
        gender: patientDetails?.gender,
        email: patientDetails?.email,
        mobileNumber: patientDetails?.phone,
        patientType: "New",
      });
      await patient.save();
    }

    // // Check for duplicate appointment at the same date and time
    // const existingAppointment = await Appointment.findOne({
    //   clinicId,
    //   doctorId,
    //   patientId: patient?._id,
    //   startDate: {
    //     $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
    //     $lt: new Date(new Date(startDate).setHours(23, 59, 59, 999)),
    //   },
    //   status: { $nin: ["cancelled", "no-show"] },
    //   $or: [
    //     // Check if fromTime overlaps with existing appointment
    //     {
    //       fromTime: fromTime,
    //     },
    //     // Check if new appointment time falls within existing appointment range
    //     {
    //       $and: [
    //         { fromTime: { $lte: fromTime } },
    //         { toTime: { $gte: fromTime } },
    //       ],
    //     },
    //     // Check if new appointment ends during existing appointment
    //     {
    //       $and: [{ fromTime: { $lte: toTime } }, { toTime: { $gte: toTime } }],
    //     },
    //   ],
    // });

    // if (existingAppointment) {
    //   return res.status(409).json({
    //     success: false,
    //     message:
    //       "You already have an appointment at this date and time with the same doctor",
    //   });
    // }

    // Book appointment
    const newAppointment = new Appointment({
      clinicId,
      doctorId,
      patientId: patient?._id,
      status: "booked",
      followType: "first time",
      startDate,
      fromTime,
      toTime,
      createdBy: doctor?._id,
      serviceId,
      serviceIds: [serviceId],
    });

    await newAppointment.save();

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: {
        appointment: newAppointment,
        patient: patient,
      },
    });
  } catch (error) {
    console.log("Error in booking appointment: ", error?.message);
    res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
}
