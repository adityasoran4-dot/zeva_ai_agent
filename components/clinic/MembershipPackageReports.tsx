import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCurrencySymbol } from '../../lib/currencyHelper';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MembershipPackageReportsProps {
  clinicId?: string;
  timeRange?: 'week' | 'month' | 'overall';
}

interface SummaryStats {
  activeMemberships: { count: number; change: number };
  expiredMemberships: { count: number; change: number };
  activePackages: { count: number; change: number };
}

interface RevenueData {
  month?: string;
  day?: string;
  date?: string;
  revenue: number;
}

interface PackageUsage {
  packageName: string;
  usagePercentage: number;
  revenue: number;
  sessionsUsed: number;
  color?: string;
}

interface SessionsRemaining {
  patientName: string;
  packageName: string;
  totalSessions: number;
  remainingSessions: number;
  progressPercentage: number;
  color: string;
}

const MembershipPackageReports: React.FC<MembershipPackageReportsProps> = ({ clinicId, timeRange = 'month' }) => {
  const [loading, setLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [membershipRevenue, setMembershipRevenue] = useState<RevenueData[]>([]);
  const [packageUsage, setPackageUsage] = useState<PackageUsage[]>([]);
  const [sessionsRemaining, setSessionsRemaining] = useState<SessionsRemaining[]>([]);
  const [clinicCurrency, setClinicCurrency] = useState<string>('INR');

  // Fetch clinic currency
  useEffect(() => {
    const fetchClinicCurrency = async () => {
      try {
        const token = 
          localStorage.getItem('clinicToken') || 
          sessionStorage.getItem('clinicToken') ||
          localStorage.getItem('userToken') || 
          sessionStorage.getItem('userToken');
        
        if (!token) return;
        
        const res = await axios.get('/api/clinics/myallClinic', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success && res.data.clinic?.currency) {
          setClinicCurrency(res.data.clinic.currency);
        }
      } catch (err) {
        console.error('Error fetching clinic currency:', err);
      }
    };
    fetchClinicCurrency();
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        // Check for multiple token types (clinicToken, userToken, agentToken, etc.)
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
        
        const storedClinicId = localStorage.getItem('clinic_id') || localStorage.getItem('clinicId');
        
        if (!token) {
          console.warn('No authentication token found');
          setLoading(false);
          return;
        }
        
        const res = await axios.get('/api/clinic/membership-package-reports', {
          params: {
            clinicId: clinicId || storedClinicId,
            timeRange: timeRange,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'x-clinic-id': clinicId || storedClinicId || '',
          },
        });

        console.log('✅ Membership reports fetched for timeRange:', timeRange, res.data);

        if (res.data.success) {
          setSummaryStats(res.data.data.summaryStats);
          setMembershipRevenue(res.data.data.membershipRevenue);
          setPackageUsage(res.data.data.packageUsage);
          setSessionsRemaining(res.data.data.sessionsRemaining);
        }
      } catch (error: any) {
        console.error('Error fetching membership and package reports:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [clinicId, timeRange]);

  // Debug: Log when timeRange changes
  useEffect(() => {
    console.log('📅 MembershipPackageReports - timeRange changed to:', timeRange);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mt-9">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading membership and package reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-9">
      {/* Section Header */}
      <div className="mb-6">
        <h3 className="text-[18px] md:text-[20px] font-bold text-black">Membership & Package Reports</h3>
        <p className="text-xs md:text-sm text-gray-500 mt-1">Monitor subscriptions, packages, and recurring revenue</p>
      </div>

      {/* Summary Statistics Cards - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Active Memberships Card */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-green-500 to-green-600 shadow-lg p-5 transition-all hover:shadow-xl">
          {/* Decorative circular shape in top-right */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            {/* Icon Container */}
            <div className="mb-3">
              <div className="w-11 h-11 rounded-xl bg-green-400/30 backdrop-blur-sm flex items-center justify-center border border-green-300/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-white/90 mb-1.5">Active Memberships</p>
            
            {/* Large Number */}
            <p className="text-[40px] font-bold text-white leading-tight mb-1.5">
              {summaryStats?.activeMemberships.count ?? 0}
            </p>
            
            {/* Growth Indicator */}
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                (summaryStats?.activeMemberships.change ?? 0) >= 0 
                  ? 'text-white' 
                  : 'text-white/80'
              }`}>
                {(summaryStats?.activeMemberships.change ?? 0) >= 0 ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                )}
                {Math.abs(summaryStats?.activeMemberships.change ?? 0)}%
              </span>
              <span className="text-xs text-white/80 font-medium">from last month</span>
            </div>
          </div>
        </div>

        {/* Expired Memberships Card */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-red-500 to-red-600 shadow-lg p-5 transition-all hover:shadow-xl">
          {/* Decorative circular shape in top-right */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            {/* Icon Container */}
            <div className="mb-3">
              <div className="w-11 h-11 rounded-xl bg-red-400/30 backdrop-blur-sm flex items-center justify-center border border-red-300/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-white/90 mb-1.5">Expired Memberships</p>
            
            {/* Large Number */}
            <p className="text-[40px] font-bold text-white leading-tight mb-1.5">
              {summaryStats?.expiredMemberships.count ?? 0}
            </p>
            
            {/* Growth Indicator */}
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                (summaryStats?.expiredMemberships.change ?? 0) <= 0 
                  ? 'text-white' 
                  : 'text-white/80'
              }`}>
                {(summaryStats?.expiredMemberships.change ?? 0) <= 0 ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )}
                {Math.abs(summaryStats?.expiredMemberships.change ?? 0)}%
              </span>
              <span className="text-xs text-white/80 font-medium">from last month</span>
            </div>
          </div>
        </div>

        {/* Active Packages Card */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg p-5 transition-all hover:shadow-xl">
          {/* Decorative circular shape in top-right */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            {/* Icon Container */}
            <div className="mb-3">
              <div className="w-11 h-11 rounded-xl bg-purple-400/30 backdrop-blur-sm flex items-center justify-center border border-purple-300/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-white/90 mb-1.5">Active Packages</p>
            
            {/* Large Number */}
            <p className="text-[40px] font-bold text-white leading-tight mb-1.5">
              {summaryStats?.activePackages.count ?? 0}
            </p>
            
            {/* Growth Indicator */}
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                (summaryStats?.activePackages.change ?? 0) >= 0 
                  ? 'text-white' 
                  : 'text-white/80'
              }`}>
                {(summaryStats?.activePackages.change ?? 0) >= 0 ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                )}
                {Math.abs(summaryStats?.activePackages.change ?? 0)}%
              </span>
              <span className="text-xs text-white/80 font-medium">from last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Membership Revenue Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h4 className="text-base font-bold text-gray-800">Membership Revenue</h4>
            <p className="text-xs text-gray-500 mt-1">Monthly revenue trend</p>
          </div>
          <div className="h-72">
            {membershipRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={membershipRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey={membershipRevenue[0].day ? 'day' : 'month'}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    stroke="#9ca3af"
                    tickFormatter={(value) => `${getCurrencySymbol(clinicCurrency)}${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: any) => [`${getCurrencySymbol(clinicCurrency)}${value}`, 'Revenue']}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0] && payload[0].payload.date) {
                        return `${label} - ${payload[0].payload.date}`;
                      }
                      return label;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-sm">No membership revenue data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Package Usage */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h4 className="text-base font-bold text-gray-800">Package Usage</h4>
            <p className="text-xs text-gray-500 mt-1">Utilization rates</p>
          </div>
          <div className="space-y-4 max-h-72 overflow-y-auto">
            {packageUsage.length > 0 ? (
              packageUsage.map((pkg, index) => {
                // Color based on package name or position
                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
                const barColor = pkg.color || colors[index % colors.length];
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{pkg.packageName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Revenue: {getCurrencySymbol(clinicCurrency)}{pkg.revenue}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800">{Math.round(pkg.usagePercentage)}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${pkg.usagePercentage}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-sm">No package usage data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sessions Remaining Tracker */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="mb-4">
          <h4 className="text-base font-bold text-gray-800">Sessions Remaining Tracker</h4>
          <p className="text-xs text-gray-500 mt-1">Patient package sessions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Package
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {sessionsRemaining.length > 0 ? (
                sessionsRemaining.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-gray-800">{row.patientName}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{row.packageName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                        {row.remainingSessions}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">
                      {row.totalSessions}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${row.progressPercentage}%`,
                              backgroundColor: row.color || '#3b82f6',
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 font-medium min-w-[40px]">
                          {Math.round(row.progressPercentage)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                    No session data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MembershipPackageReports;
