import dbConnect from '../../../lib/database';
import Appointment from '../../../models/Appointment';
import { getUserFromReq } from '../lead-ms/auth';
import { getClinicIdFromUser } from '../lead-ms/permissions-helper';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const authUser = await getUserFromReq(req);
    
    if (!authUser) {
      console.error('❌ No authenticated user found');
      return res.status(401).json({ success: false, message: 'Unauthorized - Please log in' });
    }

    console.log('✅ Authenticated user:', authUser.name, '(', authUser.email, ')');
    console.log('👤 User role:', authUser.role);

    // Get clinic ID from user using the same helper as other endpoints
    const { clinicId, error, isAdmin } = await getClinicIdFromUser(authUser);
    
    if (error && !isAdmin) {
      console.error('❌ Error getting clinic ID:', error);
      return res.status(404).json({ success: false, message: error });
    }

    console.log('🏥 Using clinicId:', clinicId);

    // Get date filter params from query
    const { startDate, endDate, date, timeRange } = req.query;

    // Build date filter based on time range
    let dateFilter = {};
    
    if (timeRange === 'week') {
      // For week filter, use the date param to calculate week range
      if (date) {
        const selectedDate = new Date(date);
        const dayOfWeek = selectedDate.getDay();
        const startOfWeek = new Date(selectedDate);
        
        startOfWeek.setDate(selectedDate.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        dateFilter = { startDate: { $gte: startOfWeek, $lte: endOfWeek } };
      }
    } else if (timeRange === 'month') {
      // For month filter, use startDate and endDate or calculate from date
      if (startDate && endDate) {
        dateFilter = {
          startDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        };
      } else if (date) {
        const selectedDate = new Date(date);
        const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        dateFilter = {
          startDate: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        };
      }
    } else if (date) {
      // Single day filter
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      dateFilter = { startDate: { $gte: startOfDay, $lte: endOfDay } };
    }
    // For 'overall' or no filter, shows all data

    console.log('📅 Using dateFilter:', dateFilter || 'Overall (no filter)');

    // Step 1: Fetch all appointments for the clinic within the date range
    const appointments = await Appointment.find({
      clinicId,
      ...dateFilter,
    })
      .select('patientId startDate')
      .lean();

    console.log('✅ Found', appointments.length, 'appointments');

    // Step 2: Count appointments per patient
    const patientVisitCounts = new Map();
    
    appointments.forEach((appointment) => {
      const patientKey = appointment.patientId.toString();
      if (!patientVisitCounts.has(patientKey)) {
        patientVisitCounts.set(patientKey, 0);
      }
      patientVisitCounts.set(patientKey, patientVisitCounts.get(patientKey) + 1);
    });

    console.log('📊 Found', patientVisitCounts.size, 'unique patients with appointments');

    // Step 3: Group patients by visit frequency ranges
    const visitFrequencyData = {
      '1-2 visits': 0,
      '3-5 visits': 0,
      '6-10 visits': 0,
      '11-15 visits': 0,
      '16-20 visits': 0,
      '20+ visits': 0,
    };

    patientVisitCounts.forEach((visitCount) => {
      if (visitCount >= 1 && visitCount <= 2) {
        visitFrequencyData['1-2 visits']++;
      } else if (visitCount >= 3 && visitCount <= 5) {
        visitFrequencyData['3-5 visits']++;
      } else if (visitCount >= 6 && visitCount <= 10) {
        visitFrequencyData['6-10 visits']++;
      } else if (visitCount >= 11 && visitCount <= 15) {
        visitFrequencyData['11-15 visits']++;
      } else if (visitCount >= 16 && visitCount <= 20) {
        visitFrequencyData['16-20 visits']++;
      } else if (visitCount > 20) {
        visitFrequencyData['20+ visits']++;
      }
    });

    // Step 4: Convert to array format for chart
    const patientVisitFrequency = Object.entries(visitFrequencyData)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        value: count,
      }));

    console.log('📈 Patient visit frequency data:', patientVisitFrequency);

    res.status(200).json({
      success: true,
      data: {
        patientVisitFrequency,
      },
    });
  } catch (error) {
    console.error('Error fetching patient visit frequency:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch patient visit frequency' 
    });
  }
}
