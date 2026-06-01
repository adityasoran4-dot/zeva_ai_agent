import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ServicePerformanceProps {
  servicePerformance: {
    mostBookedServices: any[];
    leastBookedServices: any[];
    serviceRevenueData: any[];
    conversionRateData: any[];
  };
}

const ServicePerformance: React.FC<ServicePerformanceProps> = ({ servicePerformance }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mt-9">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-black">Service Performance</h3>
        <p className="text-xs text-gray-500 mt-1">Track service bookings, revenue, and conversion rates</p>
      </div>

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Left - Most Booked Services (Horizontal Bar Chart) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="mb-3">
            <h4 className="text-base font-bold text-black">Most Booked Services</h4>
            <p className="text-xs text-gray-500 mt-1">Top performing treatments</p>
          </div>
          <div className="h-64">
            {servicePerformance.mostBookedServices && servicePerformance.mostBookedServices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicePerformance.mostBookedServices} layout="horizontal" margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 10, fill: '#374151' }}
                    stroke="#6b7280"
                    allowDecimals={false}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#374151', fontWeight: '500' }}
                    stroke="#6b7280"
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar
                    dataKey="bookings"
                    fill="url(#blueGradient)"
                    name="Bookings"
                    radius={[4, 4, 4, 4]}
                  >
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p className="text-sm">No booking data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Right - Least Booked Services (Vertical List) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="mb-3">
            <h4 className="text-base font-bold text-black">Least Booked Services</h4>
            <p className="text-xs text-gray-500 mt-1">Needs attention</p>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {servicePerformance.leastBookedServices && servicePerformance.leastBookedServices.length > 0 ? (
              servicePerformance.leastBookedServices.map((service: any, index: number) => {
                const getStatusColor = () => {
                  if (service.change < -5) return 'bg-red-50 border-red-200';
                  if (service.change < 0) return 'bg-yellow-50 border-yellow-200';
                  return 'bg-blue-50 border-blue-200';
                };

                return (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor()}`}>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{service.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{service.bookings} bookings this month</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      service.change < -5 ? 'bg-red-100 text-red-700' :
                      service.change < 0 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {service.change > 0 ? '+' : ''}{service.change}%
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p className="text-sm">No service data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Left - Service Revenue Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="mb-3">
            <h4 className="text-base font-bold text-black">Service Revenue Table</h4>
            <p className="text-xs text-gray-500 mt-1">Detailed performance metrics</p>
          </div>
          <div className="overflow-x-auto">
            {servicePerformance.serviceRevenueData && servicePerformance.serviceRevenueData.length > 0 ? (
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service Name</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Bookings</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Price</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {servicePerformance.serviceRevenueData.slice(0, 5).map((service: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-yellow-500">★</span>
                          <span className="text-sm font-medium text-gray-900">{service.serviceName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-700">{service.bookings}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-700">₹{service.avgPrice?.toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-teal-600">₹{service.revenue?.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p className="text-sm">No revenue data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Right - Treatment Conversion Rate (Vertical Bar Chart) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="mb-3">
            <h4 className="text-base font-bold text-black">Treatment Conversion Rate</h4>
            <p className="text-xs text-gray-500 mt-1">Consultation to booking success</p>
          </div>
          <div className="h-64">
            {servicePerformance.conversionRateData && servicePerformance.conversionRateData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicePerformance.conversionRateData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 10, fill: '#374151', fontWeight: '500' }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#374151' }}
                    stroke="#6b7280"
                    unit="%"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any) => [`${value}%`, 'Conversion Rate']}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      fontSize: '10px', 
                      paddingTop: '10px',
                      color: '#4b5563'
                    }}
                  />
                  <Bar
                    dataKey="conversionRate"
                    fill="url(#greenGradient)"
                    name="Conversion Rate"
                    radius={[8, 8, 0, 0]}
                  >
                    <defs>
                      <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p className="text-sm">No conversion data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicePerformance;
