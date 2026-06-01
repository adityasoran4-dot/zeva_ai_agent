import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import axios from 'axios';

interface RoomUtilizationData {
  roomId: string;
  roomName: string;
  bookedHours: number;
  appointmentCount: number;
  utilization: number;
  totalAvailableHours: number;
}

interface RoomUtilizationProps {
  timeRange: 'week' | 'month' | 'overall';
  selectedDate?: Date;
}

const RoomUtilization: React.FC<RoomUtilizationProps> = ({ 
  timeRange, 
  selectedDate 
}) => {
  const [utilizationData, setUtilizationData] = useState<RoomUtilizationData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch room utilization data
  useEffect(() => {
   const fetchUtilizationData = async () => {
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
        
        // Add date parameters based on filter
       if (timeRange === 'week' && selectedDate) {
         params.date = selectedDate.toISOString().split('T')[0];
        } else if (timeRange === 'month' && selectedDate) {
         const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
         const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
         params.startDate = startDate.toISOString().split('T')[0];
         params.endDate = endDate.toISOString().split('T')[0];
        }
        // For 'overall', no additional params needed

       const res = await axios.get('/api/clinics/roomUtilization', {
         params,
         headers: { Authorization: `Bearer ${token}` }
        });

       if (res.data.success) {
          setUtilizationData(res.data.utilizationData || []);
        } else {
          setError(res.data.message || 'Failed to fetch data');
        }
      } catch (err: any) {
       console.error('Error fetching room utilization:', err);
        const errorMessage = err.response?.data?.message || 'An error occurred';
        
        // Don't show error for permission issues if no data is available
        if (err.response?.status === 403) {
          console.warn('Permission denied for room utilization:', errorMessage);
          setUtilizationData([]);
          setError(null);
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUtilizationData();
  }, [timeRange, selectedDate]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
   if (active && payload && payload.length) {
     const data = payload[0].payload;
     return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-1">{data.roomName}</p>
          <p className="text-sm text-gray-600">Utilization: <span className="font-bold text-teal-600">{data.utilization}%</span></p>
          <p className="text-xs text-gray-500 mt-1">Appointments: {data.appointmentCount}</p>
          <p className="text-xs text-gray-500">Booked Hours: {data.bookedHours}h</p>
        </div>
      );
    }
   return null;
  };

  // Gradient color for bars
  const getBarColor = (utilization: number) => {
   if (utilization >= 75) return '#059669'; // Dark green for high utilization
   if (utilization >= 50) return '#10b981'; // Medium green for moderate utilization
   if (utilization >= 25) return '#34d399'; // Light green for low utilization
   return '#6ee7b7'; // Very light green for very low utilization
  };

 return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Room Utilization</h3>
        <p className="text-sm text-gray-500 mt-1">
          {timeRange === 'week' && 'Weekly usage percentage'}
          {timeRange === 'month' && 'Monthly usage percentage'}
          {timeRange === 'overall' && 'Overall usage percentage'}
        </p>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-72 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-gray-500 mt-2 text-sm">Loading utilization data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="h-72 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
      ) : utilizationData.length === 0 ? (
        <div className="h-72 flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No room utilization data available</p>
          </div>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={utilizationData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="roomName"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                interval={0}
               height={80}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                label={{ 
                  value: 'Utilization (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#6b7280' }
                }}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="utilization"
                name="Utilization %"
                radius={[8, 8, 0, 0]}
                animationDuration={600}
              >
                {utilizationData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.utilization)}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Stats (optional) */}
      {utilizationData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total Rooms</p>
              <p className="text-lg font-bold text-gray-900">{utilizationData.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Avg Utilization</p>
              <p className="text-lg font-bold text-teal-600">
                {Math.round(utilizationData.reduce((sum, r) => sum + r.utilization, 0) / utilizationData.length)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Total Appointments</p>
              <p className="text-lg font-bold text-gray-900">
                {utilizationData.reduce((sum, r) => sum + r.appointmentCount, 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomUtilization;
