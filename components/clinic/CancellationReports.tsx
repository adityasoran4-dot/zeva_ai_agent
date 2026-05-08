import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertCircle, Phone } from 'lucide-react';
import axios from 'axios';

interface CancellationTrendData {
  month: string;
  cancellations: number;
  noShows: number;
}

interface CancellationReasonData {
 reason: string;
  count: number;
  percentage: number;
}

interface NoShowPatient {
  patientId: string;
  patientName: string;
  mobileNumber: string;
  noShowCount: number;
  lastAppointment: string;
}

interface CancellationReportsProps {
  timeRange: 'today' | 'week' | 'month' | 'overall';
  selectedDate?: Date;
}

const COLORS = ['#EF4444', '#F97316', '#EAB308', '#8B5CF6', '#EC4899'];

const CancellationReports: React.FC<CancellationReportsProps> = ({ 
  timeRange, 
  selectedDate 
}) => {
 const [cancellationTrend, setCancellationTrend] = useState<CancellationTrendData[]>([]);
 const [cancellationReasons, setCancellationReasons] = useState<CancellationReasonData[]>([]);
 const [noShowPatientList, setNoShowPatientList] = useState<NoShowPatient[]>([]);
 const [currentPage, setCurrentPage] = useState<number>(1);
 const [loading, setLoading] = useState<boolean>(false);
 const [error, setError] = useState<string | null>(null);

  // Fetch cancellation and no-show data
  useEffect(() => {
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
        
       if (timeRange === 'today' && selectedDate) {
        params.date = selectedDate.toISOString().split('T')[0];
        } else if (timeRange === 'week' && selectedDate) {
        params.date = selectedDate.toISOString().split('T')[0];
        } else if (timeRange === 'month' && selectedDate) {
        const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() +1, 0);
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
        }

      const res = await axios.get('/api/clinics/cancellation-reports', {
        params,
        headers: { Authorization: `Bearer ${token}` }
        });

      if (res.data.success) {
        // Handle both mock data (root level) and real data (nested under data)
        const responseData = res.data.data || res.data;
        setCancellationTrend(responseData.cancellationTrend || []);
        setCancellationReasons(responseData.cancellationReasons || []);
        setNoShowPatientList(responseData.noShowPatientList || responseData.noShowAppointments || []);
        setCurrentPage(1); // Reset to first page when data changes
        
        if (res.data.isMockData) {
          console.log('📊 Showing mock cancellation reports');
        }
      } else {
        setError(res.data.message || 'Failed to fetch data');
      }
      } catch (err: any) {
      console.error('Error fetching cancellation reports:', err);
       setError(err.response?.data?.message || 'An error occurred');
      } finally {
       setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, selectedDate]);

  // Custom tooltip for line chart
  const CustomLineTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-1">{payload[0].payload.month}</p>
          <p className="text-sm text-red-600">Cancellations: <span className="font-bold">{payload[0].value}</span></p>
          <p className="text-sm text-orange-600">No-Shows: <span className="font-bold">{payload[1].value}</span></p>
        </div>
      );
    }
  return null;
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{payload[0].payload.reason}</p>
          <p className="text-sm text-gray-600">Count: <span className="font-bold">{payload[0].value}</span></p>
          <p className="text-sm text-gray-600">Percentage: <span className="font-bold">{payload[0].payload.percentage}%</span></p>
        </div>
      );
    }
  return null;
  };

  // Handle contact action
  const handleContact = (patient: NoShowPatient) => {
  console.log('Contacting patient:', patient);
    // TODO: Implement contact functionality (SMS, email, or call)
    alert(`Contacting ${patient.patientName} at ${patient.mobileNumber}`);
  };

  // Pagination calculations
const ITEMS_PER_PAGE = 10;
const totalPages = Math.ceil(noShowPatientList.length/ ITEMS_PER_PAGE);
const startIndex = (currentPage-1) * ITEMS_PER_PAGE;
const endIndex = startIndex + ITEMS_PER_PAGE;
const currentPatients = noShowPatientList.slice(startIndex, endIndex);

const handleNextPage = () => {
  if (currentPage < totalPages) {
    setCurrentPage(currentPage + 1);
   }
  };

const handlePrevPage = () => {
  if (currentPage > 1) {
    setCurrentPage(currentPage - 1);
   }
  };

  if (loading) {
  return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-gray-500 mt-3 text-sm">Loading cancellation reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
  return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

 return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Cancellation & No-Show Reports</h2>
      </div>

      {/* First Row: Two Cards Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Cancellation Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Cancellation Trend</h3>
            <p className="text-sm text-gray-500 mt-1">
              {timeRange === 'today' && 'Today\'s overview'}
              {timeRange === 'week' && 'Weekly overview'}
              {timeRange === 'month' && 'Monthly overview'}
              {timeRange === 'overall' && 'Overall overview'}
            </p>
          </div>

          <div className="h-72">
            {cancellationTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={cancellationTrend}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                   angle={-45}
                    textAnchor="end"
                  height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomLineTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                     paddingTop: '20px',
                      fontSize: '12px'
                    }}
                  />
                  <Line
                   type="monotone"
                    dataKey="cancellations"
                    name="Cancellations"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#EF4444' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                   type="monotone"
                    dataKey="noShows"
                    name="No-Shows"
                    stroke="#F97316"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#F97316' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No cancellation data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Cancellation Reasons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Cancellation Reasons</h3>
            <p className="text-sm text-gray-500 mt-1">Why patients cancel</p>
          </div>

          <div className="h-72">
            {cancellationReasons.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cancellationReasons}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="reason"
                  >
                    {cancellationReasons.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                   height={36}
                    wrapperStyle={{ 
                      fontSize: '12px',
                     paddingTop: '10px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No cancellation reasons recorded</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row: Full-width No-Show Patient List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">No-Show Patient List</h3>
          <p className="text-sm text-gray-500 mt-1">Frequent no-show patients</p>
        </div>

        {noShowPatientList.length > 0 ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Patient</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">No-Shows</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Appointment</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPatients.map((patient) => (
                    <tr key={patient.patientId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm mr-3">
                            {patient.patientName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{patient.patientName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        patient.noShowCount >= 5 
                            ? 'bg-red-100 text-red-800' 
                            : patient.noShowCount >= 3 
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {patient.noShowCount}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{patient.lastAppointment}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-900 font-medium">{patient.mobileNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleContact(patient)}
                         className="inline-flex items-center px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 mr-1.5" />
                          Contact
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex +1} to {Math.min(endIndex, noShowPatientList.length)} of {noShowPatientList.length} patients
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No no-show patients found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CancellationReports;
