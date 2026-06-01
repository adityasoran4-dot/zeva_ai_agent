import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DoctorLeaderboard {
  rank: number;
  doctorId: string;
  doctorName: string;
  performanceScore: number;
  totalAppointments: number;
  totalRevenue: number;
  rating: number;
}

interface AppointmentsPerDoctor {
  doctorName: string;
  appointments: number;
}

interface RevenuePerDoctor {
  doctorName: string;
  revenue: number;
}

interface SatisfactionRating {
  doctorId: string;
  doctorName: string;
  rating: number;
  totalReviews: number;
  trend: 'up' | 'down';
  trendValue: number;
}

interface StaffPerformanceProps {
  timeRange?: 'week' | 'month' | 'overall' | 'select-calendar';
}

const StaffPerformance: React.FC<StaffPerformanceProps> = ({ timeRange = 'month' }) => {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<DoctorLeaderboard[]>([]);
  const [appointmentsData, setAppointmentsData] = useState<AppointmentsPerDoctor[]>([]);
  const [revenueData, setRevenueData] = useState<RevenuePerDoctor[]>([]);
  const [satisfactionRatings, setSatisfactionRatings] = useState<SatisfactionRating[]>([]);

  useEffect(() => {
    const fetchStaffPerformance = async () => {
      try {
        setLoading(true);
        
        // Check for multiple token types
        const token = 
          localStorage.getItem('clinicToken') || 
          sessionStorage.getItem('clinicToken') ||
          localStorage.getItem('userToken') || 
          sessionStorage.getItem('userToken') ||
          localStorage.getItem('agentToken') || 
          sessionStorage.getItem('agentToken') ||
          localStorage.getItem('doctorToken') || 
          sessionStorage.getItem('doctorToken') ||
          localStorage.getItem('token');
        
        if (!token) {
          console.warn('No authentication token found');
          setLoading(false);
          return;
        }

        const res = await axios.get('/api/clinic/staff-performance', {
          params: { timeRange },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ Staff performance fetched for timeRange:', timeRange, res.data);

        if (res.data.success) {
          setLeaderboard(res.data.data.leaderboard);
          setAppointmentsData(res.data.data.appointmentsPerDoctor);
          setRevenueData(res.data.data.revenuePerDoctor);
          setSatisfactionRatings(res.data.data.satisfactionRatings);
        }
      } catch (error: any) {
        console.error('Error fetching staff performance:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffPerformance();
  }, [timeRange]);

  // Debug: Log when timeRange changes
  useEffect(() => {
    console.log('📊 StaffPerformance - timeRange changed to:', timeRange);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading staff performance data...</span>
        </div>
      </div>
    );
  }

  // Custom tooltip for appointments chart
  const CustomTooltipAppointments = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-800">{payload[0].payload.doctorName}</p>
          <p className="text-sm text-blue-600 mt-1">
            Appointments: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for revenue chart
  const CustomTooltipRevenue = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-800">{payload[0].payload.doctorName}</p>
          <p className="text-sm text-green-600 mt-1">
            Revenue: <span className="font-bold">₹{payload[0].value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="mb-6">
        <h3 className="text-[20px] font-bold text-gray-900">Staff Performance</h3>
        <p className="text-sm text-gray-500 mt-1">Track doctor performance and patient satisfaction</p>
      </div>

      {/* Doctor Performance Leaderboard */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="mb-4">
          <h4 className="text-base font-bold text-gray-800">Doctor Performance Leaderboard</h4>
          <p className="text-xs text-gray-500 mt-1">Top performers this month</p>
        </div>
        
        {leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Doctor Name
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Performance Score
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Appointments
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((doctor) => (
                  <tr key={doctor.doctorId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {doctor.rank}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-800">{doctor.doctorName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2.5 max-w-[150px]">
                          <div
                            className="h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                            style={{ width: `${doctor.performanceScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-purple-700 min-w-[45px]">
                          {Math.round(doctor.performanceScore)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                        {doctor.totalAppointments}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-bold text-gray-800">
                        ₹{doctor.totalRevenue.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-bold text-gray-700">{doctor.rating.toFixed(1)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <p className="text-sm">No doctor performance data available</p>
          </div>
        )}
      </div>

      {/* Two-column layout: Appointments & Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments per Doctor Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h4 className="text-base font-bold text-gray-800">Appointments per Doctor</h4>
            <p className="text-xs text-gray-500 mt-1">Monthly comparison</p>
          </div>
          
          {appointmentsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={appointmentsData} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="doctorName" 
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltipAppointments />} />
                <Bar 
                  dataKey="appointments" 
                  radius={[8, 8, 0, 0]}
                >
                  {appointmentsData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#colorAppointments-${index % 3})`} />
                  ))}
                  <defs>
                    <linearGradient id="colorAppointments-0" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorAppointments-1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorAppointments-2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#93C5FD" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#93C5FD" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p className="text-sm">No appointment data available</p>
            </div>
          )}
        </div>

        {/* Revenue per Doctor Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h4 className="text-base font-bold text-gray-800">Revenue per Doctor</h4>
            <p className="text-xs text-gray-500 mt-1">Performance by revenue</p>
          </div>
          
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="doctorName" 
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltipRevenue />} />
                <Bar 
                  dataKey="revenue" 
                  radius={[8, 8, 0, 0]}
                >
                  {revenueData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#colorRevenue-${index % 3})`} />
                  ))}
                  <defs>
                    <linearGradient id="colorRevenue-0" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorRevenue-1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34D399" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#34D399" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorRevenue-2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6EE7B7" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6EE7B7" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p className="text-sm">No revenue data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Patient Satisfaction Ratings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="mb-4">
          <h4 className="text-base font-bold text-gray-800">Patient Satisfaction Ratings</h4>
          <p className="text-xs text-gray-500 mt-1">Average ratings and reviews</p>
        </div>
        
        {satisfactionRatings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total Reviews
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {satisfactionRatings.map((rating) => (
                  <tr key={rating.doctorId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-800">{rating.doctorName}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-bold text-gray-700">{rating.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-600">{rating.totalReviews}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {rating.trend === 'up' ? (
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                          </svg>
                        )}
                        <span className={`text-xs font-semibold ${rating.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {rating.trendValue}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <p className="text-sm">No satisfaction ratings available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffPerformance;
