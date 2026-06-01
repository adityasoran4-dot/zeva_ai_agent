import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Award, AlertCircle, Users } from 'lucide-react';
import axios from 'axios';
import { getCurrencySymbol } from '@/lib/currencyHelper';

interface DoctorData {
  doctorId: string;
  doctorName: string;
  doctorEmail?: string;
  appointmentCount: number;
  completedAppointments: number;
  pendingAppointments: number;
  estimatedRevenue?: number;
}

interface LeaderboardData {
  rank: number;
  doctorName: string;
  appointmentCount: number;
  completionRate: number;
  performanceScore: number;
  estimatedRevenue?: number;
  rating?: number;
}

interface DoctorPerformanceProps {
  timeRange: 'today' | 'week' | 'month' | 'overall';
  selectedDate?: Date;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const DoctorPerformance: React.FC<DoctorPerformanceProps> = ({ 
  timeRange, 
  selectedDate 
}) => {
  const [appointmentsPerDoctor, setAppointmentsPerDoctor] = useState<DoctorData[]>([]);
  const [revenuePerDoctor, setRevenuePerDoctor] = useState<DoctorData[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('INR');

  // Fetch clinic currency preference
  useEffect(() => {
    const fetchClinicCurrency = async () => {
      try {
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken') || localStorage.getItem('agentToken') || sessionStorage.getItem('agentToken');
        if (!token) return;
        
        const res = await axios.get('/api/clinics/myallClinic', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.success && res.data.clinic?.currency) {
          setCurrency(res.data.clinic.currency);
        }
      } catch (e) {
        console.error('Error fetching clinic currency:', e);
      }
    };
    
    fetchClinicCurrency();
  }, []);

  // Fetch doctor performance data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const params: any = { filter: timeRange };
      
      // Handle date parameters based on time range
      if (timeRange === 'today' && selectedDate) {
        // For today, pass only today's date
        params.date = selectedDate.toISOString().split('T')[0];
        params.filter = 'today'; // Explicitly tell backend it's today's data
      } else if (timeRange === 'week' && selectedDate) {
        // For week, calculate start and end of the week
        const curr = new Date(selectedDate);
        const first = curr.getDate() - curr.getDay();
        const firstDay = new Date(curr.setDate(first));
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + 6);
        params.startDate = firstDay.toISOString().split('T')[0];
        params.endDate = lastDay.toISOString().split('T')[0];
      } else if (timeRange === 'month' && selectedDate) {
        // For month, use first and last day of the month
        const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
      }
      // For 'overall', no date parameters are passed

      const res = await axios.get('/api/clinics/doctor-performance', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        // Filter out doctors with 0 appointments for today's view
        let appointmentsPerDoctor = res.data.data.appointmentsPerDoctor || [];
        let revenuePerDoctor = res.data.data.revenuePerDoctor || [];
        let leaderboardData = res.data.data.leaderboardData || [];
        
        // When viewing today's data, only show doctors who have appointments today
        if (timeRange === 'today') {
          appointmentsPerDoctor = appointmentsPerDoctor.filter((doc:any) => doc.appointmentCount > 0);
          revenuePerDoctor = revenuePerDoctor.filter((doc:any) => doc.appointmentCount > 0);
          leaderboardData = leaderboardData.filter((doc:any) => doc.appointmentCount > 0);
        }
        
        setAppointmentsPerDoctor(appointmentsPerDoctor);
        setRevenuePerDoctor(revenuePerDoctor);
        setLeaderboardData(leaderboardData);
      } else {
        setError(res.data.message || 'Failed to fetch data');
      }
    } catch(err: any) {
      console.error('Error fetching doctor performance:', err);
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange, selectedDate]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-1">{data.doctorName}</p>
          {payload[0].name === 'Appointments' && (
            <>
              <p className="text-sm text-blue-600">Total Appointments: <span className="font-bold">{data.appointmentCount}</span></p>
              <p className="text-sm text-green-600">Completed: <span className="font-bold">{data.completedAppointments}</span></p>
              <p className="text-sm text-orange-600">Pending: <span className="font-bold">{data.pendingAppointments}</span></p>
            </>
          )}
          {payload[0].name === 'Revenue' && (
            <>
              <p className="text-sm text-green-600">Revenue: <span className="font-bold">{getCurrencySymbol(currency)}{data.estimatedRevenue?.toLocaleString()}</span></p>
              <p className="text-sm text-blue-600">Appointments: <span className="font-bold">{data.appointmentCount}</span></p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Doctor Performance Analytics</h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
              <p className="text-gray-500 mt-3 text-sm">Loading doctor performance data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Doctor Performance Analytics</h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Doctor Performance Analytics</h2>
      </div>

      {/* First Row: Doctor Performance Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">Doctor Performance Leaderboard</h3>
          <p className="text-sm text-gray-500 mt-1">
            {timeRange === 'today' ? 'Top performing doctors for today' : 
             timeRange === 'week' ? 'Top performing doctors for the week' :
             timeRange === 'month' ? 'Top performing doctors for the month' :
             'Top performing doctors (all time)'}
          </p>
        </div>

        {leaderboardData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Rank</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Doctor</th>
                  {/* Performance Score column temporarily hidden */}
                  {/* <th className="text-center py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Performance Score</th> */}
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Appointments</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Revenue</th>
                  {/* <th className="text-center py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Rating</th> */}
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((doctor) => (
                  <tr 
                    key={doctor.rank} 
                    className="border-b transition-all hover:bg-gray-50"
                  >
                    {/* Rank Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shadow-md bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                          {doctor.rank}
                        </div>
                      </div>
                    </td>
                    
                    {/* Doctor Column */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900 text-sm">{doctor.doctorName}</div>
                    </td>
                    
                    {/* Performance Score Column - Temporarily Hidden
                    <td className="py-4 px-6">
                      <div className="flex flex-col items-center">
                        <div className="text-lg font-bold text-gray-900 mb-1">{doctor.performanceScore}</div>
                        <div className="w-24 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full transition-all ${
                              doctor.performanceScore >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                              doctor.performanceScore >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                              'bg-gradient-to-r from-red-400 to-red-600'
                            }`}
                            style={{ width: `${Math.min(doctor.performanceScore, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    */}
                    
                    {/* Appointments Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center space-x-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">{doctor.appointmentCount}</span>
                      </div>
                    </td>
                    
                    {/* Revenue Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-sm font-bold text-green-600">{getCurrencySymbol(currency)}{doctor.estimatedRevenue?.toLocaleString()}</span>
                      </div>
                    </td>
                    
                    {/* Rating Column */}
                    {/* <td className="py-4 px-6">
                      <div className="flex items-center justify-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-bold text-gray-900">{doctor.rating?.toFixed(1) ?? '-'}</span>
                      </div>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-base font-medium">No performance data available</p>
              <p className="text-gray-400 text-sm mt-1">Check back later for updated rankings</p>
            </div>
          </div>
        )}
      </div>

      {/* Second Row: Two Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Appointments per Doctor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Appointments per Doctor</h3>
            <p className="text-sm text-gray-500 mt-1">Doctor-wise appointment distribution</p>
          </div>

          <div className="h-72">
            {appointmentsPerDoctor.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={appointmentsPerDoctor}
                  margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="doctorName" 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  <Bar
                    type="monotone"
                    dataKey="appointmentCount"
                    name="Appointments"
                    fill="#3B82F6"
                    radius={[6, 6, 0, 0]}
                  >
                    {appointmentsPerDoctor.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 text-sm">No appointment data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Revenue per Doctor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Revenue per Doctor</h3>
            <p className="text-sm text-gray-500 mt-1">Estimated revenue by doctor</p>
          </div>

          <div className="h-72">
            {revenuePerDoctor.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenuePerDoctor}
                  margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="doctorName" 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => `${getCurrencySymbol(currency)}${(value/1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  <Bar
                    type="monotone"
                    dataKey="estimatedRevenue"
                    name="Revenue"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                  >
                    {revenuePerDoctor.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 text-sm">No revenue data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPerformance;
