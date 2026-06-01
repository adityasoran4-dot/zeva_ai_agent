import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/database';
import Service from '../../../models/Service';
import Appointment from '../../../models/Appointment';
import Clinic from '../../../models/Clinic';
import { getUserFromReq } from '../lead-ms/auth.js';
import { getClinicIdFromUser } from '../lead-ms/permissions-helper.js';
import { isNewClinicInMockPeriod, generateMockServicePerformance } from '../../../lib/mockDataGenerator';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
    const result: any = await getClinicIdFromUser(authUser);
    const { clinicId, error } = result;
    
    if (error) {
      console.error('❌ Error getting clinic ID:', error);
      return res.status(404).json({ success: false, message: error });
    }

    console.log('🏥 Using clinicId:', clinicId);

    // Get clinic to check registeredAt
    let clinic = null;
    if (authUser.role === 'clinic') {
      clinic = await Clinic.findOne({ owner: authUser._id });
    } else if (clinicId) {
      clinic = await Clinic.findById(clinicId);
    }

    // Check if clinic is within 2-day mock data period
    if (clinic && isNewClinicInMockPeriod(clinic.registeredAt)) {
      // Check if they have any real appointment data
      const appointmentCount = await Appointment.countDocuments({ clinicId });
      
      if (appointmentCount === 0) {
        console.log('📊 Returning mock service performance for new clinic:', clinic._id);
        const mockData = generateMockServicePerformance();
        
        return res.status(200).json({
          success: true,
          data: mockData,
          isMockData: true,
          message: 'Showing sample service performance data for new clinic!',
        });
      }
    }

    // Get date filter params from query
    const { startDate, endDate, date } = req.query;

    // Build date filter based on time range
    let dateFilter: any = {};
    if (date) {
      const selectedDate = new Date(date as string);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      dateFilter = { startDate: { $gte: startOfDay, $lte: endOfDay } };
    } else if (startDate && endDate) {
      dateFilter = {
        startDate: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        },
      };
    }
    // For 'overall', no date filter - shows all data

    console.log('📅 Using dateFilter:', dateFilter || 'Overall (no filter)');

    // Fetch all services for the clinic
    const services = await Service.find({ clinicId }).lean();
    console.log('✅ Found', services.length, 'services');

    // Fetch all appointments to get booking data
    const appointments = await Appointment.find({
      clinicId,
      ...dateFilter,
    })
      .select('serviceId serviceName startDate')
      .lean();

    console.log('✅ Found', appointments.length, 'appointments');

    // Create a map of service IDs to service names from the services collection
    const serviceNameMap = new Map<string, string>();
    services.forEach((service: any) => {
      serviceNameMap.set(service['_id'].toString(), service['name'] || 'Unknown Service');
    });

    // 1. Most Booked Services (Top 7)
    const serviceBookingCounts = new Map<string, { name: string; count: number; _id: string }>();
    
    appointments.forEach((appointment: any) => {
      const serviceId = appointment.serviceId?.toString();
      
      // Get service name from the map, or use serviceName from appointment, or default to Unknown
      let serviceName = 'Unknown Service';
      if (serviceId && serviceNameMap.has(serviceId)) {
        serviceName = serviceNameMap.get(serviceId)!;
      } else if (appointment.serviceName) {
        serviceName = appointment.serviceName;
      }
      
      const serviceKey = serviceId || appointment.serviceName || 'Unknown';
      
      if (!serviceBookingCounts.has(serviceKey)) {
        serviceBookingCounts.set(serviceKey, {
          _id: serviceKey,
          name: serviceName,
          count: 0,
        });
      }
      serviceBookingCounts.get(serviceKey)!.count++;
    });

    const mostBookedServices = Array.from(serviceBookingCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 7)
      .map(service => ({
        name: service.name,
        bookings: service.count,
      }))
      .filter(service => 
        service.name !== 'Unknown Service' && 
        service.name !== 'Unknown' &&
        !service.name.toLowerCase().includes('unknown')
      );

    console.log('📊 Most booked services:', mostBookedServices);

    // 2. Least Booked Services (Bottom 5)
    const leastBookedServices = Array.from(serviceBookingCounts.values())
      .sort((a, b) => a.count - b.count)
      .slice(0, 5)
      .map(service => ({
        name: service.name,
        bookings: service.count,
        change: Math.floor(Math.random() * 20) - 10, // Placeholder for percentage change
      }))
      .filter(service => 
        service.name !== 'Unknown Service' && 
        service.name !== 'Unknown' &&
        !service.name.toLowerCase().includes('unknown')
      );

    console.log('📉 Least booked services:', leastBookedServices);

    // 3. Service Revenue Table
    const serviceRevenueData = services
      .map((service: any) => {
        const serviceAppointments = appointments.filter(
          (apt: any) => apt.serviceId?.toString() === service['_id'].toString()
        );
        
        const bookings = serviceAppointments.length;
        
        // Placeholder for average price - in real scenario, fetch from Billing model
        const avgPrice = service['price'] || Math.floor(Math.random() * 5000) + 1000;
        const revenue = bookings * avgPrice;

        return {
          serviceName: service['name'] || 'Unknown Service',
          bookings,
          avgPrice,
          revenue,
          rating: 4.5 + Math.random(), // Placeholder for rating
        };
      })
      .filter(service => 
        service.serviceName !== 'Unknown Service' && 
        service.serviceName !== 'Unknown' &&
        !service.serviceName.toLowerCase().includes('unknown')
      )
      .sort((a, b) => b.revenue - a.revenue);

    console.log('💰 Service revenue data:', serviceRevenueData);

    // 4. Treatment Conversion Rate
    // For now, use placeholder conversion rates
    // In production, track consultations vs actual bookings
    const conversionRateData = services
      .slice(0, 8)
      .map(service => {
        const consultations = Math.floor(Math.random() * 50) + 10; // Placeholder
        const bookings = Math.floor(consultations * (Math.random() * 0.6 + 0.3)); // 30-90% conversion
        
        return {
          name: service.name || 'Unknown Service',
          conversionRate: bookings > 0 ? Math.round((bookings / consultations) * 100) : 0,
        };
      })
      .filter(item => 
        item.name !== 'Unknown Service' && 
        item.name !== 'Unknown' &&
        !item.name.toLowerCase().includes('unknown')
      )
      .filter(item => item.conversionRate > 0);

    console.log('📈 Conversion rate data:', conversionRateData);

    res.status(200).json({
      success: true,
      data: {
        mostBookedServices,
        leastBookedServices,
        serviceRevenueData,
        conversionRateData,
      },
    });
  } catch (error: any) {
    console.error('Error fetching service performance:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch service performance' 
    });
  }
}
