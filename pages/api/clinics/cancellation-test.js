import dbConnect from "../../../lib/database";
import Appointment from "../../../models/Appointment";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";
import dayjs from"dayjs";

export default async function handler(req, res) {
  await dbConnect();

 console.log('📡 Cancellation Test API called');

  try {
  const user = await getUserFromReq(req);
   if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
    }

  const { clinicId } = await getClinicIdFromUser(user);
  if (!clinicId) {
    return res.status(403).json({ success: false, message: "No clinic found" });
    }

  console.log('✅ Clinic ID:', clinicId);

    // Simple test - just count cancelled appointments
  const count = await Appointment.countDocuments({
    clinicId,
      status: 'Cancelled'
    });

  console.log('✅ Cancelled count:', count);

  return res.status(200).json({
     success: true,
     data: {
       cancellationTrend: [],
       cancellationReasons: [],
       noShowPatientList: [],
       summary: {
         totalCancellations: count,
         totalNoShows: 0
       }
     },
     message: 'API working!'
    });

  } catch(error) {
  console.error('❌ Error:', error.message);
  return res.status(500).json({ 
     success: false, 
     message: error.message 
    });
  }
}
