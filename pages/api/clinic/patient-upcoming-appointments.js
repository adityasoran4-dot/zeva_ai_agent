import dbConnect from "../../../lib/database";
import Appointment from "../../../models/Appointment";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { clinicId, error, isAdmin } = await getClinicIdFromUser(clinicUser);
    if (error && !isAdmin) {
      return res.status(404).json({ success: false, message: error });
    }

    const { patientId } = req.query;
    if (!patientId) {
      return res.status(400).json({ success: false, message: "patientId is required" });
    }

    // Get current date and time to filter upcoming appointments properly!
    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];
    
    // Query appointments:
    // - Any date after today, OR
    // - Today's date AND fromTime is later than current time
    const appointments = await Appointment.find({
      clinicId,
      patientId,
      $or: [
        { startDate: { $gt: new Date(todayDateStr + 'T23:59:59.999Z') } }, // Tomorrow or later
        {
          startDate: { 
            $gte: new Date(todayDateStr + 'T00:00:00.000Z'), 
            $lte: new Date(todayDateStr + 'T23:59:59.999Z') 
          },
          // We'll filter by time in JS since it's easier to handle HH:MM format
        }
      ]
    })
      .sort({ startDate: 1, fromTime: 1 })
      .select("_id startDate fromTime toTime status followType serviceId serviceIds")
      .populate("serviceId", "name")
      .populate("serviceIds", "name")
      .lean();
      
    // Now filter today's appointments by time!
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();
    
    const filteredAppointments = appointments.filter((apt) => {
      const aptDateStr = new Date(apt.startDate).toISOString().split('T')[0];
      
      if (aptDateStr > todayDateStr) {
        return true;
      }
      
      if (aptDateStr === todayDateStr && apt.fromTime) {
        const [hoursStr, minutesStr] = apt.fromTime.split(':');
        const aptHours = parseInt(hoursStr, 10);
        const aptMinutes = parseInt(minutesStr, 10);
        
        return aptHours > nowHours || 
               (aptHours === nowHours && aptMinutes > nowMinutes);
      }
      
      return false;
    });

    return res.status(200).json({
      success: true,
      appointments: filteredAppointments.map((appt) => {
        // Build serviceNames from both serviceIds and serviceId
        const fromServiceIds = Array.isArray(appt.serviceIds)
          ? appt.serviceIds.map((s) => s?.name || "").filter(Boolean)
          : [];
        const fromServiceId = appt.serviceId?.name || "";
        const serviceNames = fromServiceId
          ? [fromServiceId, ...fromServiceIds.filter((n) => n !== fromServiceId)]
          : fromServiceIds;

        return {
          _id: appt._id,
          startDate: appt.startDate,
          fromTime: appt.fromTime,
          toTime: appt.toTime,
          status: appt.status,
          followType: appt.followType,
          serviceName: appt.serviceId?.name || null,
          serviceNames,
        };
      }),
    });
  } catch (err) {
    console.error("patient-upcoming-appointments error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
