/**
 * Mock Data Generator for New Clinic Users
 * 
 * This utility generates realistic mock data for newly registered clinics
 * during their first 2 days to help them understand the dashboard.
 * 
 * The mock data is shown only when:
 * 1. User is within 2 days of registration (registeredAt field)
 * 2. User has not performed any real actions yet
 */

/**
 * Generate a random number between min and max (inclusive)
 */
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate mock dashboard stats for new users
 */
export const generateMockDashboardStats = () => {
  return {
    totalReviews: randomInt(3, 12),
    totalEnquiries: randomInt(5, 20),
    totalAppointments: randomInt(8, 25),
    totalLeads: randomInt(10, 30),
    totalTreatments: randomInt(15, 40),
    totalRooms: randomInt(2, 6),
    totalDepartments: randomInt(3, 8),
    totalPackages: randomInt(2, 8),
    totalOffers: randomInt(3, 10),
    totalPatients: randomInt(15, 50),
    totalJobs: randomInt(1, 5),
    appointmentStatusBreakdown: {
      booked: randomInt(3, 8),
      completed: randomInt(2, 6),
      cancelled: randomInt(1, 3),
      pending: randomInt(2, 5),
    },
    leadStatusBreakdown: {
      new: randomInt(5, 15),
      contacted: randomInt(3, 8),
      qualified: randomInt(2, 5),
      converted: randomInt(1, 3),
    },
    offerStatusBreakdown: {
      active: randomInt(2, 6),
      expired: randomInt(1, 3),
      claimed: randomInt(1, 4),
    },
  };
};

/**
 * Generate mock daily stats for new users
 */
export const generateMockDailyStats = () => {
  return {
    booked: randomInt(2, 6),
    enquiry: randomInt(1, 4),
    discharge: randomInt(1, 3),
    arrived: randomInt(2, 5),
    consultation: randomInt(1, 4),
    cancelled: randomInt(0, 2),
    approved: randomInt(1, 3),
    rescheduled: randomInt(0, 2),
    waiting: randomInt(1, 3),
    rejected: randomInt(0, 1),
    completed: randomInt(2, 5),
    daily: {
      patients: randomInt(3, 10),
      jobs: randomInt(0, 2),
      offers: randomInt(1, 3),
      leads: randomInt(2, 6),
      reviews: randomInt(1, 4),
      enquiries: randomInt(1, 3),
      applications: randomInt(0, 2),
      appointments: randomInt(3, 8),
      arrived: randomInt(2, 5),
      booked: randomInt(2, 6),
      cancelled: randomInt(0, 2),
      waiting: randomInt(1, 3),
      enquiry: randomInt(1, 3),
    },
    totals: {
      membership: randomInt(2, 8),
      jobs: randomInt(1, 5),
    },
  };
};

/**
 * Generate mock appointment stats data (for charts)
 */
export const generateMockAppointmentStats = (_filter: string) => {
  // Return status-wise data matching the real API structure
  return [
    { name: 'Booked', value: randomInt(8, 25), fill: '#3b82f6' },
    { name: 'Enquiry', value: randomInt(5, 15), fill: '#06b6d4' },
    { name: 'Approved', value: randomInt(6, 18), fill: '#22c55e' },
    { name: 'Arrived', value: randomInt(4, 12), fill: '#84cc16' },
    { name: 'Consultation', value: randomInt(3, 10), fill: '#eab308' },
    { name: 'Waiting', value: randomInt(2, 8), fill: '#f97316' },
    { name: 'Rescheduled', value: randomInt(1, 5), fill: '#a855f7' },
    { name: 'Discharge', value: randomInt(2, 7), fill: '#ec4899' },
    { name: 'Completed', value: randomInt(5, 20), fill: '#14b8a6' },
    { name: 'Rejected', value: randomInt(0, 3), fill: '#64748b' },
    { name: 'Cancelled', value: randomInt(1, 4), fill: '#ef4444' },
  ];
};

/**
 * Generate mock lead stats data (for charts)
 */
export const generateMockLeadStats = () => {
  return {
    sourceData: [
      { name: 'Website', value: randomInt(8, 20), fill: '#3b82f6' },
      { name: 'Referral', value: randomInt(5, 15), fill: '#22c55e' },
      { name: 'Social Media', value: randomInt(6, 18), fill: '#8b5cf6' },
      { name: 'Walk-in', value: randomInt(4, 12), fill: '#f59e0b' },
      { name: 'Phone', value: randomInt(3, 10), fill: '#06b6d4' },
    ],
    statusData: [
      { name: 'New', value: randomInt(10, 25), fill: '#3b82f6' },
      { name: 'Contacted', value: randomInt(5, 15), fill: '#22c55e' },
      { name: 'Qualified', value: randomInt(4, 12), fill: '#8b5cf6' },
      { name: 'Converted', value: randomInt(2, 8), fill: '#f59e0b' },
    ],
  };
};

/**
 * Generate mock membership stats
 */
export const generateMockMembershipStats = () => {
  const membershipNames = ['Basic Plan', 'Premium Plan', 'Gold Plan', 'Platinum Plan', 'VIP Plan'];
  
  return {
    totalMemberships: randomInt(5, 20),
    activeMemberships: randomInt(3, 15),
    expiredMemberships: randomInt(1, 5),
    membershipRevenue: randomInt(5000, 25000),
    membershipData: membershipNames.slice(0, randomInt(3, 5)).map((name, index) => ({
      name: name,
      count: randomInt(3, 15 - index * 2),
      totalRevenue: randomInt(5000, 20000 - index * 3000),
    })),
  };
};

/**
 * Generate mock financial reports data
 */
export const generateMockFinancialData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return {
    revenueTrendData: months.map(month => ({
      name: month,
      revenue: randomInt(5000, 20000),
      target: randomInt(15000, 30000)
    })),
    paymentMethodsData: [
      { name: 'Card Payment', value: randomInt(25, 45) },
      { name: 'Cash', value: randomInt(20, 40) },
      { name: 'Online Transfer', value: randomInt(15, 35) },
      { name: 'Insurance', value: randomInt(10, 25) },
    ],
    doctorRevenueData: [
      { name: 'Dr. Smith', revenue: randomInt(10000, 30000), sessions: randomInt(30, 80) },
      { name: 'Dr. Johnson', revenue: randomInt(8000, 25000), sessions: randomInt(25, 70) },
      { name: 'Dr. Williams', revenue: randomInt(7000, 20000), sessions: randomInt(20, 60) },
      { name: 'Dr. Brown', revenue: randomInt(6000, 18000), sessions: randomInt(15, 50) },
    ],
    topServicesData: [
      { name: 'General Consultation', sessions: randomInt(30, 80), revenue: randomInt(5000, 15000) },
      { name: 'Dental Checkup', sessions: randomInt(20, 60), revenue: randomInt(4000, 12000) },
      { name: 'Eye Examination', sessions: randomInt(15, 50), revenue: randomInt(3000, 10000) },
      { name: 'Physical Therapy', sessions: randomInt(10, 40), revenue: randomInt(2500, 8000) },
      { name: 'Lab Tests', sessions: randomInt(25, 70), revenue: randomInt(3500, 11000) },
    ],
  };
};

/**
 * Generate mock billing stats (Top 5 Services & Packages)
 */
export const generateMockBillingStats = () => {
  return {
    topPackages: [
      { name: 'Annual Health Package', totalAmount: randomInt(15000, 50000), count: randomInt(5, 20) },
      { name: 'Dental Care Package', totalAmount: randomInt(10000, 35000), count: randomInt(3, 15) },
      { name: 'Maternity Package', totalAmount: randomInt(20000, 60000), count: randomInt(2, 10) },
      { name: 'Senior Citizen Package', totalAmount: randomInt(12000, 40000), count: randomInt(4, 12) },
      { name: 'Pediatric Package', totalAmount: randomInt(8000, 30000), count: randomInt(3, 14) },
    ],
    topServices: [
      { name: 'General Consultation', totalAmount: randomInt(20000, 60000), count: randomInt(30, 80) },
      { name: 'Follow-up Visit', totalAmount: randomInt(15000, 45000), count: randomInt(25, 70) },
      { name: 'Specialist Consultation', totalAmount: randomInt(18000, 55000), count: randomInt(20, 60) },
      { name: 'Diagnostic Test', totalAmount: randomInt(12000, 40000), count: randomInt(15, 50) },
      { name: 'Emergency Visit', totalAmount: randomInt(10000, 35000), count: randomInt(10, 40) },
    ],
  };
};

/**
 * Generate mock doctor performance data
 */
export const generateMockDoctorPerformance = () => {
  const doctors = [
    'Dr. Sarah Smith',
    'Dr. Michael Johnson',
    'Dr. Emily Williams',
    'Dr. James Brown',
    'Dr. Lisa Davis',
  ];
  
  const appointmentsPerDoctor = doctors.slice(0, randomInt(3, 5)).map(doctor => ({
    doctorName: doctor,
    appointmentCount: randomInt(15, 60),
    completedAppointments: randomInt(10, 50),
    pendingAppointments: randomInt(3, 15),
  }));
  
  const revenuePerDoctor = doctors.slice(0, randomInt(3, 5)).map(doctor => ({
    doctorName: doctor,
    estimatedRevenue: randomInt(10000, 40000),
    appointmentCount: randomInt(15, 60),
  }));
  
  const leaderboardData = doctors.slice(0, randomInt(3, 5)).map((doctor, _index) => ({
    doctorName: doctor,
    appointmentCount: randomInt(20, 70),
    completedAppointments: randomInt(15, 60),
    revenue: randomInt(12000, 45000),
    rating: (4 + Math.random()).toFixed(1),
  })).sort((a, b) => b.appointmentCount - a.appointmentCount);
  
  return {
    appointmentsPerDoctor,
    revenuePerDoctor,
    leaderboardData,
  };
};

/**
 * Generate mock room utilization data
 */
export const generateMockRoomUtilization = () => {
  const rooms = [
    'Consultation Room 1',
    'Consultation Room 2',
    'Procedure Room',
    'Examination Room',
    'Emergency Room',
  ];
  
  const utilizationData = rooms.slice(0, randomInt(3, 5)).map(room => ({
    roomName: room,
    totalAppointments: randomInt(20, 80),
    utilizedHours: randomInt(10, 40),
    availableHours: randomInt(20, 50),
    utilizationPercentage: randomInt(40, 85),
  }));
  
  return {
    utilizationData,
    averageUtilization: randomInt(50, 75),
    totalRooms: utilizationData.length,
  };
};

/**
 * Generate mock cancellation reports data
 */
export const generateMockCancellationReports = () => {
  const reasons = [
    'Patient Request',
    'Doctor Unavailable',
    'Weather Conditions',
    'Schedule Conflict',
    'No Show',
  ];
  
  const patientNames = [
    'Ahmed Ali',
    'Fatima Hassan',
    'Mohammed Khan',
    'Sarah Ahmed',
    'Omar Farooq',
    'Layla Mahmoud',
    'Yusuf Ibrahim',
    'Aisha Rahman',
    'Hassan Ali',
    'Maryam Yusuf',
  ];
  
  const cancelledAppointments = Array.from({ length: randomInt(5, 15) }, (_, i) => ({
    _id: `mock-cancel-${i}`,
    patientName: patientNames[i % patientNames.length],
    doctorName: `Dr. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'][i % 5]}`,
    appointmentDate: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
    reason: reasons[randomInt(0, reasons.length - 1)],
    amount: randomInt(500, 5000),
  }));
  
  const noShowAppointments = Array.from({ length: randomInt(5, 10) }, (_, i) => ({
    _id: `mock-noshow-${i}`,
    patientName: patientNames[i % patientNames.length],
    patientId: `mock-patient-noshow-${i}`,
    mobileNumber: `+97150${String(randomInt(1000000, 9999999))}`,
    doctorName: `Dr. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'][i % 5]}`,
    noShowCount: randomInt(2, 8),
    lastAppointment: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
    appointmentDate: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
    amount: randomInt(500, 3000),
  }));
  
  const cancellationTrend = [
    { month: 'Week 1', cancelled: randomInt(2, 8), noShow: randomInt(1, 5) },
    { month: 'Week 2', cancelled: randomInt(2, 8), noShow: randomInt(1, 5) },
    { month: 'Week 3', cancelled: randomInt(2, 8), noShow: randomInt(1, 5) },
    { month: 'Week 4', cancelled: randomInt(2, 8), noShow: randomInt(1, 5) },
  ];
  
  // Generate cancellation reasons breakdown
  const cancellationReasons = reasons.map(reason => ({
    reason,
    count: cancelledAppointments.filter(apt => apt.reason === reason).length || randomInt(1, 5),
    percentage: randomInt(10, 35),
  })).filter(r => r.count > 0);
  
  return {
    cancelledAppointments,
    noShowAppointments,
    cancellationTrend,
    cancellationReasons,
    totalCancelled: cancelledAppointments.length,
    totalNoShow: noShowAppointments.length,
    cancellationRate: randomInt(5, 15),
    noShowRate: randomInt(3, 10),
  };
};

/**
 * Generate mock offer stats
 */
export const generateMockOfferStats = () => {
  return {
    statusData: [
      { name: 'Active', value: randomInt(3, 10) },
      { name: 'Expired', value: randomInt(1, 5) },
      { name: 'Claimed', value: randomInt(2, 8) },
      { name: 'Draft', value: randomInt(1, 4) },
    ],
    totalOffers: randomInt(8, 25),
    activeOffers: randomInt(3, 10),
    claimedOffers: randomInt(2, 8),
  };
};

/**
 * Generate mock commission data
 */
export const generateMockCommissionData = () => {
  const staffNames = [
    'Dr. Ahmed Ali',
    'Dr. Fatima Hassan',
    'Dr. Mohammed Khan',
    'Dr. Sarah Ahmed',
    'Dr. Omar Farooq',
  ];
  
  return {
    totalCommission: randomInt(1000, 10000),
    pendingCommission: randomInt(500, 3000),
    paidCommission: randomInt(500, 7000),
    commissionData: staffNames.map((name, index) => ({
      name: name,
      commissionType: index % 2 === 0 ? 'percentage' : 'flat',
      totalPaid: randomInt(2000, 8000 - index * 1000),
      totalEarned: randomInt(3000, 12000 - index * 1500),
      count: randomInt(5, 20 - index * 2),
    })),
  };
};

/**
 * Generate mock patient demographics data
 */
export const generateMockPatientDemographics = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  const patientNames = [
    'Ahmed Ali Mohammed',
    'Fatima Hassan Ali',
    'Mohammed Khan Yusuf',
    'Sarah Ahmed Ibrahim',
    'Omar Farooq Hassan',
  ];
  
  return {
    newVsReturning: months.map(month => ({
      month,
      newPatients: randomInt(5, 20),
      returningPatients: randomInt(3, 15),
    })),
    genderDistribution: [
      { name: 'Female', percentage: randomInt(45, 65) / 100 },
      { name: 'Male', percentage: randomInt(35, 55) / 100 },
    ],
    patientVisitFrequency: [
      { name: '1-2 visits', value: randomInt(15, 30) },
      { name: '3-5 visits', value: randomInt(8, 20) },
      { name: '6+ visits', value: randomInt(3, 10) },
    ],
    topPatients: patientNames.map((name, index) => ({
      _id: `mock-patient-${index}`,
      name: name,
      mobileNumber: `+97150${String(randomInt(1000000, 9999999))}`,
      billingCount: randomInt(15 - index * 2, 25 - index * 2),
      totalRevenue: randomInt(30000 - index * 5000, 50000 - index * 5000),
      lastBillingDate: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
      badge: index < 3 ? 'VIP' : index < 5 ? 'Gold' : 'Silver',
    })),
  };
};

/**
 * Generate mock service performance data
 */
export const generateMockServicePerformance = () => {
  const allServices = [
    'General Consultation',
    'Dental Checkup',
    'Eye Examination',
    'Physical Therapy',
    'Cardiac Screening',
    'Lab Tests',
    'X-Ray',
    'MRI Scan',
    'Vaccination',
    'Health Screening',
  ];
  
  const mostBookedServices = allServices.slice(0, 5).map((service, index) => ({
    serviceName: service,
    bookings: randomInt(30 - index * 5, 80 - index * 5),
    revenue: randomInt(5000 - index * 500, 20000 - index * 1000),
    conversionRate: randomInt(60, 95),
  }));
  
  const leastBookedServices = allServices.slice(5, 10).map((service, index) => ({
    serviceName: service,
    bookings: randomInt(5, 25 - index * 3),
    revenue: randomInt(1000, 8000 - index * 1000),
    conversionRate: randomInt(30, 60),
  }));
  
  const serviceRevenueData = allServices.slice(0, 7).map((service, _index) => {
    const bookings = randomInt(10, 60);
    const revenue = randomInt(3000, 25000);
    return {
      serviceName: service,  // ✅ Use serviceName instead of name
      name: service,  // Keep for backward compatibility
      revenue: revenue,
      bookings: bookings,
      avgPrice: Math.round(revenue / bookings),  // ✅ Calculate average price
    };
  });
  
  const conversionRateData = allServices.slice(0, 6).map(service => ({
    name: service,
    rate: randomInt(45, 92),
    totalEnquiries: randomInt(20, 80),
    converted: randomInt(10, 60),
  }));
  
  return {
    mostBookedServices,
    leastBookedServices,
    serviceRevenueData,
    conversionRateData,
  };
};

/**
 * Generate mock membership & package reports data
 */
export const generateMockMembershipPackageReports = () => {
  const memberships = [
    'Gold Membership',
    'Silver Membership',
    'Platinum Membership',
    'Basic Membership',
  ];
  
  const packages = [
    'Annual Health Package',
    'Dental Care Package',
    'Maternity Package',
    'Senior Citizen Package',
    'Wellness Package',
  ];
  
  const activeMemberships = memberships.slice(0, 3).map((name, index) => ({
    name,
    count: randomInt(5, 20 - index * 3),
    revenue: randomInt(5000, 25000 - index * 3000),
    expiryDate: new Date(Date.now() + randomInt(30, 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }));
  
  const expiredMemberships = memberships.slice(2, 4).map((name,   _index) => ({
    name,
    count: randomInt(2, 8),
    revenue: randomInt(2000, 10000),
    expiryDate: new Date(Date.now() - randomInt(1, 60) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }));
  
  const activePackages = packages.slice(0, 3).map((name, index) => ({
    name,
    count: randomInt(3, 15 - index * 2),
    revenue: randomInt(8000, 30000 - index * 4000),
    sessionsRemaining: randomInt(2, 10),
  }));
  
  // Package usage data for bar chart
  const packageUsageData = packages.slice(0, 5).map((name, index) => ({
    packageName: name,
    usagePercentage: randomInt(35, 95),
    revenue: randomInt(5000, 35000 - index * 4000),
    sessionsUsed: randomInt(20, 80),
  }));
  
  // Sessions remaining data for tracker
  const patients = [
    'Ahmed Ali',
    'Fatima Hassan',
    'Mohammed Khan',
    'Sarah Ahmed',
    'Omar Farooq',
    'Layla Mahmoud',
    'Yusuf Ibrahim',
    'Aisha Rahman',
  ];
  
  const sessionsRemainingData = patients.slice(0, randomInt(5, 8)).map((patient, index) => ({
    patientName: patient,
    packageName: packages[index % packages.length],
    totalSessions: randomInt(20, 50),
    sessionsUsed: randomInt(10, 40),
    remainingSessions: randomInt(3, 15),
    progressPercentage: randomInt(40, 85),
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][index % 5],
  }));
  
  // Membership revenue trend for line chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const membershipRevenueData = months.map(month => ({
    month,
    revenue: randomInt(8000, 30000),
  }));
  
  return {
    summaryStats: {
      activeMemberships: {
        count: activeMemberships.reduce((sum, m) => sum + m.count, 0),
        change: randomInt(5, 25)
      },
      expiredMemberships: {
        count: expiredMemberships.reduce((sum, m) => sum + m.count, 0),
        change: randomInt(-15, 10)
      },
      activePackages: {
        count: activePackages.reduce((sum, p) => sum + p.count, 0),
        change: randomInt(8, 30)
      }
    },
    activeMemberships,
    expiredMemberships,
    activePackages,
    membershipRevenue: membershipRevenueData,
    packageUsage: packageUsageData,
    sessionsRemaining: sessionsRemainingData,
    totalMembershipRevenue: randomInt(15000, 60000),
    totalPackageRevenue: randomInt(20000, 80000),
  };
};

/**
 * Generate mock appointment reports data
 */
export const generateMockAppointmentReports = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  const appointmentTrend = months.map(month => ({
    month,
    booked: randomInt(15, 40),
    completed: randomInt(10, 35),
    cancelled: randomInt(2, 8),
    noShow: randomInt(1, 5),
  }));
  
  const appointmentStatus = [
    { name: 'Completed', value: randomInt(40, 70) },
    { name: 'Booked', value: randomInt(15, 30) },
    { name: 'Cancelled', value: randomInt(5, 15) },
    { name: 'No Show', value: randomInt(3, 10) },
  ];
  
  return {
    appointmentTrend,
    appointmentStatus,
    totalAppointments: randomInt(100, 300),
    completionRate: randomInt(65, 85),
    cancellationRate: randomInt(5, 15),
    noShowRate: randomInt(3, 10),
  };
};

/**
 * Check if a clinic is within the 2-day mock data period
 */
export const isNewClinicInMockPeriod = (registeredAt: Date | null | undefined): boolean => {
  if (!registeredAt) {
    return false; // Legacy users don't get mock data
  }

  const now = new Date();
  const registrationDate = new Date(registeredAt);
  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
  
  const timeSinceRegistration = now.getTime() - registrationDate.getTime();
  
  return timeSinceRegistration < twoDaysInMs;
};

/**
 * Check if clinic has any real data (to determine if we should show mock data)
 * This is a simple heuristic - if they have ANY appointments or leads, they're active
 */
export const hasRealActivity = (stats: {
  totalAppointments?: number;
  totalLeads?: number;
  totalPatients?: number;
}): boolean => {
  return (
    (stats.totalAppointments || 0) > 0 ||
    (stats.totalLeads || 0) > 0 ||
    (stats.totalPatients || 0) > 0
  );
};
