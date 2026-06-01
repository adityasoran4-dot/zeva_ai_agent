import React, { useState, useEffect, useMemo } from 'react';
import { Star, Mail, Settings, Lock, TrendingUp, Users, FileText, Briefcase, MessageSquare, Calendar, CreditCard, BarChart3, Activity, CheckCircle2, XCircle, User, Stethoscope } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Cell, LineChart, Line, Tooltip } from 'recharts';
import DoctorLayout from '../../components/DoctorLayout';
import withDoctorAuth from '../../components/withDoctorAuth';
import type { NextPageWithLayout } from '../_app';
import axios from 'axios';
import { useRouter } from 'next/router';

// Type definitions
interface Stats {
  totalReviews: number;
  totalEnquiries: number;
}

interface DashboardStatsResponse {
  success: boolean;
  totalReviews: number;
  totalEnquiries: number;
  message?: string;
}

interface DoctorUser {
  name?: string;
  email?: string;
  [key: string]: unknown;
}

interface NavigationItem {
  _id: string;
  label: string;
  path?: string;
  icon: string;
  description?: string;
  order: number;
  moduleKey: string;
  subModules?: Array<{
    name: string;
    path?: string;
    icon: string;
    order: number;
  }>;
}

interface SidebarResponse {
  success: boolean;
  navigationItems: NavigationItem[];
  permissions?: Array<{
    module: string;
    subModules?: Array<{
      name: string;
      actions: {
        all?: boolean;
        create?: boolean;
        read?: boolean;
        update?: boolean;
        delete?: boolean;
      };
    }>;
    actions: {
      all?: boolean;
      create?: boolean;
      read?: boolean;
      update?: boolean;
      delete?: boolean;
    };
  }>;
  doctorId?: string;
}

interface ModuleStats {
  [key: string]: {
    value: number | string;
    label: string;
    icon: React.ReactNode;
    color: string;
    loading?: boolean;
    error?: string;
    hasData?: boolean;
  };
}

interface DoctorInfo {
  name?: string;
  specialization?: string;
}

const DoctorDashboard: NextPageWithLayout = () => {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ totalReviews: 0, totalEnquiries: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [doctorUser, setDoctorUser] = useState<DoctorUser | null>(null);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [moduleStats, setModuleStats] = useState<ModuleStats>({});
  const [allModules, setAllModules] = useState<NavigationItem[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo>({});
  const [permissions, setPermissions] = useState<SidebarResponse['permissions']>([]);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // Icon mapping
  const iconMap: { [key: string]: React.ReactNode } = {
    '📊': <BarChart3 className="w-5 h-5" />,
    '👥': <Users className="w-5 h-5" />,
    '📝': <FileText className="w-5 h-5" />,
    '💼': <Briefcase className="w-5 h-5" />,
    '💬': <MessageSquare className="w-5 h-5" />,
    '📅': <Calendar className="w-5 h-5" />,
    '💳': <CreditCard className="w-5 h-5" />,
    '⭐': <Star className="w-5 h-5" />,
    '📧': <Mail className="w-5 h-5" />,
    '⚙️': <Settings className="w-5 h-5" />,
    '📈': <TrendingUp className="w-5 h-5" />,
    '🔒': <Lock className="w-5 h-5" />,
    '🩺': <Stethoscope className="w-5 h-5" />,
  };

  // Get doctor user data from localStorage
  useEffect(() => {
    const doctorUserRaw = localStorage.getItem('doctorUser');
    if (doctorUserRaw) {
      try {
        const parsedUser = JSON.parse(doctorUserRaw);
        setDoctorUser(parsedUser);
      } catch {
        // console.error('Error parsing doctor user data:', error);
      }
    }
  }, []);

  // Fetch doctor information
  useEffect(() => {
    const fetchDoctorInfo = async (): Promise<void> => {
      try {
        const token = localStorage.getItem('doctorToken') || sessionStorage.getItem('doctorToken');
        if (!token) return;

        // Fetch doctor profile data
        const doctorRes = await axios.get('/api/doctor/manage', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (doctorRes.data && doctorRes.data.doctorProfile) {
          const profile = doctorRes.data.doctorProfile;
          setDoctorInfo({
            name: doctorRes.data.user?.name || doctorUser?.name || '',
            specialization: profile.specialization || profile.speciality || '',
          });
        } else {
          setDoctorInfo({
            name: doctorUser?.name || '',
            specialization: '',
          });
        }
      } catch (error) {
        console.error('Error fetching doctor info:', error);
        setDoctorInfo({
          name: doctorUser?.name || '',
          specialization: '',
        });
      }
    };

    if (doctorUser) {
      fetchDoctorInfo();
    }
  }, [doctorUser]);

  // Fetch sidebar navigation items (which already have permissions applied)
  useEffect(() => {
    const fetchNavigationItems = async (): Promise<void> => {
      try {
        const token = localStorage.getItem('doctorToken') || sessionStorage.getItem('doctorToken');
        if (!token) return;

        const res = await axios.get<SidebarResponse>('/api/doctor/sidebar-permissions', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success && res.data.navigationItems) {
          setNavigationItems(res.data.navigationItems);
          if (res.data.permissions) {
            setPermissions(res.data.permissions);
          }
        }
      } catch (error) {
        console.error('Error fetching navigation items:', error);
      }
    };

    fetchNavigationItems();
  }, []);

  // Fetch all available modules (to show restricted ones)
  useEffect(() => {
    const fetchAllModules = async (): Promise<void> => {
      try {
        const token = localStorage.getItem('doctorToken') || sessionStorage.getItem('doctorToken');
        if (!token) return;

        // Fetch all navigation items for doctor role (without permission filtering)
        const res = await axios.get<{ success: boolean; data: NavigationItem[] }>('/api/navigation/get-by-role?role=doctor', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success && res.data.data) {
          setAllModules(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching all modules:', error);
      }
    };

    fetchAllModules();
  }, []);

  // Fetch stats for each module
  useEffect(() => {
    const fetchModuleStats = async (): Promise<void> => {
      setStatsLoading(true);
      const token = localStorage.getItem('doctorToken') || sessionStorage.getItem('doctorToken');
      if (!token) {
        setStatsLoading(false);
        return;
      }

      const statsMap: ModuleStats = {};

      // Map base stats to module keys using existing stats state
      statsMap['doctor_reviews'] = {
        value: stats.totalReviews,
        label: 'Total Reviews',
        icon: <Star className="w-5 h-5" />,
        color: '#3b82f6',
        hasData: stats.totalReviews > 0,
      };
      statsMap['doctor_enquiries'] = {
        value: stats.totalEnquiries,
        label: 'Total Enquiries',
        icon: <Mail className="w-5 h-5" />,
        color: '#3b82f6',
        hasData: stats.totalEnquiries > 0,
      };

      // Fetch stats for each navigation item based on moduleKey
      const statsPromises = navigationItems.map(async (item) => {
        try {
          let statValue: number | string = 0;
          let statLabel = item.label;
          let statColor = '#3b82f6';
          let hasData = false;

          switch (item.moduleKey) {
            case 'doctor_reviews':
            case 'reviews':
              statValue = stats.totalReviews;
              statLabel = 'Total Reviews';
              hasData = stats.totalReviews > 0;
              break;
            case 'doctor_enquiries':
            case 'enquiries':
              statValue = stats.totalEnquiries;
              statLabel = 'Total Enquiries';
              hasData = stats.totalEnquiries > 0;
              break;
            default:
              statValue = 0;
              hasData = false;
          }

          statsMap[item.moduleKey] = {
            value: statValue,
            label: statLabel,
            icon: iconMap[item.icon] || <Activity className="w-5 h-5" />,
            color: statColor,
            hasData: hasData,
          };
        } catch (error) {
          console.error(`Error fetching stats for ${item.moduleKey}:`, error);
          statsMap[item.moduleKey] = {
            value: 0,
            label: item.label,
            icon: iconMap[item.icon] || <Activity className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: false,
          };
        }
      });

      await Promise.all(statsPromises);
      setModuleStats(statsMap);
      setStatsLoading(false);
    };

    if (navigationItems.length > 0) {
      fetchModuleStats();
    } else {
      setStatsLoading(false);
    }
  }, [navigationItems, stats]);

  useEffect(() => {
    const fetchStats = async (): Promise<void> => {
      try {
        const token = localStorage.getItem('doctorToken') || sessionStorage.getItem('doctorToken');
        const res = await fetch('/api/doctor/dashbaordStats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data: DashboardStatsResponse = await res.json();
        if (data.success) {
          setStats({
            totalReviews: data.totalReviews || 0,
            totalEnquiries: data.totalEnquiries || 0,
          });
        }
      } catch {
        // Error handling
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  // Poll token validity every 1.5 seconds to detect password changes
  useEffect(() => {
    if (isLoggingOut) return; // Don't poll if already logging out

    const checkTokenValidity = async () => {
      try {
        const token = localStorage.getItem('doctorToken') || sessionStorage.getItem('doctorToken');
        if (!token) return;

        const response = await fetch('/api/doctor/verify-token', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        // If password was changed, logout immediately
        if (!data.valid && data.passwordChanged) {
          setIsLoggingOut(true);
          
          // Show logout message
          if (typeof window !== 'undefined') {
            // Clear all storage
            localStorage.removeItem('doctorToken');
            localStorage.removeItem('doctorUser');
            sessionStorage.removeItem('doctorToken');
            sessionStorage.removeItem('doctorUser');
            
            // Show alert
            alert('Your password has been changed by an administrator. You will be logged out now.');
            
            // Redirect to login after 1-2 seconds
            setTimeout(() => {
              router.push('/doctor/login');
            }, 1500);
          }
        }
      } catch (error) {
        // Silently handle errors - don't spam console
        console.error('Token validation error:', error);
      }
    };

    // Check immediately, then every 1.5 seconds
    checkTokenValidity();
    const interval = setInterval(checkTokenValidity, 1500);

    return () => clearInterval(interval);
  }, [router, isLoggingOut]);

  const getGreeting = (): string => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get modules that have permission (from navigationItems)
  const modulesWithPermission = useMemo(() => {
    return navigationItems.map(item => item.moduleKey);
  }, [navigationItems]);

  // Get restricted modules (all modules minus modules with permission)
  const restrictedModules = useMemo(() => {
    const permissionKeys = new Set(modulesWithPermission);
    return allModules.filter(module => !permissionKeys.has(module.moduleKey));
  }, [allModules, modulesWithPermission]);

  // Calculate subscription summary (must be before any conditional returns)
  const subscriptionSummary = useMemo(() => {
    const totalModules = allModules.length;
    const subscribedModules = modulesWithPermission.length;
    const restrictedCount = restrictedModules.length;
    const subscriptionPercentage = totalModules > 0 ? Math.round((subscribedModules / totalModules) * 100) : 0;
    
    return {
      totalModules,
      subscribedModules,
      restrictedCount,
      subscriptionPercentage
    };
  }, [allModules, modulesWithPermission, restrictedModules]);

  // Prepare chart data for graphical representation (must be before any conditional returns)
  const subscriptionChartData = useMemo(() => {
    return [
      { name: 'Active', value: subscriptionSummary.subscribedModules, color: '#3b82f6' },
      { name: 'Locked', value: subscriptionSummary.restrictedCount, color: '#6b7280' },
    ];
  }, [subscriptionSummary]);

  const statsChartData = useMemo(() => {
    return [
      { name: 'Reviews', value: stats.totalReviews },
      { name: 'Enquiries', value: stats.totalEnquiries },
    ];
  }, [stats]);

  // Render stat card component - Professional minimal design
  const renderStatCard = (
    label: string,
    value: number | string,
    icon: React.ReactNode,
    hasPermission: boolean = true
  ) => {
    if (!hasPermission) {
      return (
        <div className="bg-white rounded-lg p-5 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 relative">
          <div className="absolute top-3 right-3 bg-gray-500 text-white px-2 py-1 text-xs font-semibold rounded">
            LOCKED
          </div>
          <div className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gray-100 rounded-lg">
                <Lock className="w-5 h-5 text-gray-500" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{label}</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Subscription Required
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Contact administrator to enable this feature.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg p-5 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 group">
        <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 text-xs font-semibold rounded flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          ACTIVE
        </div>
        <div className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <div className="text-blue-600">{icon}</div>
            </div>
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-2">{label}</h3>
          {statsLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-3xl sm:text-4xl font-bold text-gray-900">{value}</p>
              {value === 0 && (
                <p className="text-xs text-gray-500 mt-1">No data available</p>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Professional Header */}
        <div className="bg-white rounded-lg p-6 sm:p-8 border border-gray-300 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Stethoscope className="w-6 h-6 text-gray-700" />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {doctorInfo.name || 'Doctor Dashboard'}
                </h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {doctorInfo.specialization && (
                  <>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">Specialization:</span>
                      <span>{doctorInfo.specialization}</span>
                    </div>
                    <span>•</span>
                  </>
                )}
                <span>{formatDate(currentTime)}</span>
                <span>•</span>
                <span>{formatTime(currentTime)}</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
              <p className="text-sm font-medium text-gray-700">{getGreeting()}</p>
            </div>
          </div>
        </div>

        {/* Subscription Status Summary - Professional Design */}
        <div className="bg-white rounded-lg p-6 sm:p-8 border border-gray-300 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-gray-700" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Subscription Overview</h2>
              <p className="text-sm text-gray-600">Module access and subscription status</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Subscribed Modules */}
              <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">Active</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {subscriptionSummary.subscribedModules}
                </p>
                <p className="text-xs text-gray-600">Subscribed modules</p>
                <div className="mt-3 bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${subscriptionSummary.subscriptionPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Restricted Modules */}
              <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Locked</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {subscriptionSummary.restrictedCount}
                </p>
                <p className="text-xs text-gray-600">Not subscribed</p>
                <div className="mt-3 bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${100 - subscriptionSummary.subscriptionPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Total Modules */}
              <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-gray-700" />
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {subscriptionSummary.totalModules}
                </p>
                <p className="text-xs text-gray-600">Available modules</p>
              </div>
            </div>

            {/* Right: Bar Chart */}
            <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribution</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subscriptionChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#6b7280" 
                      fontSize={12}
                      width={60}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 4, 4, 0]}
                    >
                      {subscriptionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList 
                        dataKey="value" 
                        position="right" 
                        style={{ fill: '#374151', fontSize: '12px', fontWeight: '500' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Active Modules Section */}
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Active Modules</h2>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-200">
                {subscriptionSummary.subscribedModules} Active
              </span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Stats show actual data counts. "0" means no records exist yet.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {navigationItems.map((item) => {
              const moduleStat = moduleStats[item.moduleKey];
              const hasPermission = true; // All navigationItems already have permission
              
              return renderStatCard(
                item.label,
                moduleStat?.value ?? 0,
                iconMap[item.icon] || <Activity className="w-5 h-5" />,
                hasPermission
              );
            })}
          </div>
        </div>

        {/* Detailed Feature Breakdown Section */}
        {allModules.length > 0 && (
          <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-gray-700" />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Feature Breakdown</h2>
                <p className="text-sm text-gray-600">Detailed view of active and locked features for each module</p>
              </div>
            </div>

            <div className="space-y-6">
              {allModules.map((module) => {
                const modulePermission = permissions?.find(p => {
                  const moduleKey = p.module;
                  return moduleKey === module.moduleKey || 
                         moduleKey === module.moduleKey.replace('doctor_', '') ||
                         moduleKey === module.moduleKey.replace(/^(admin|clinic|doctor)_/, '');
                });

                const hasModulePermission = modulePermission && (
                  modulePermission.actions?.read === true || 
                  modulePermission.actions?.all === true
                );

                const allSubModules = module.subModules || [];
                
                const activeSubModules = allSubModules.filter(subModule => {
                  if (!modulePermission) return false;
                  if (modulePermission.actions?.all === true) return true;
                  const subModulePerm = modulePermission.subModules?.find(sm => sm.name === subModule.name);
                  return subModulePerm && (
                    subModulePerm.actions?.read === true || 
                    subModulePerm.actions?.all === true
                  );
                });

                const lockedSubModules = allSubModules.filter(subModule => {
                  if (!modulePermission) return true;
                  if (modulePermission.actions?.all === true) return false;
                  const subModulePerm = modulePermission.subModules?.find(sm => sm.name === subModule.name);
                  return !subModulePerm || (
                    subModulePerm.actions?.read !== true && 
                    subModulePerm.actions?.all !== true
                  );
                });

                return (
                  <div key={module._id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {iconMap[module.icon] || <Activity className="w-5 h-5 text-gray-600" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{module.label}</h3>
                          <p className="text-sm text-gray-600">{module.description || 'Module features'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasModulePermission ? (
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-200">
                            <CheckCircle2 className="w-3 h-3 inline mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded border border-gray-300">
                            <Lock className="w-3 h-3 inline mr-1" />
                            Locked
                          </span>
                        )}
                      </div>
                    </div>

                    {allSubModules.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {activeSubModules.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-semibold text-gray-700">
                                Active Features ({activeSubModules.length})
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {activeSubModules.map((subModule, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  <span className="text-sm text-gray-800">{subModule.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {lockedSubModules.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <XCircle className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-semibold text-gray-700">
                                Locked Features ({lockedSubModules.length})
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {lockedSubModules.map((subModule, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                                  <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                  <span className="text-sm text-gray-600">{subModule.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {allSubModules.length === 0 && hasModulePermission && (
                          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-800">All features are active</span>
                          </div>
                        )}
                      </div>
                    )}

                    {!hasModulePermission && (
                      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            This entire module is locked. Contact administrator to subscribe.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked Modules Section */}
        {restrictedModules.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Locked Modules</h2>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded border border-gray-300">
                  {restrictedModules.length} Locked
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {restrictedModules.map((item) => {
                return renderStatCard(
                  item.label,
                  0,
                  iconMap[item.icon] || <Lock className="w-5 h-5" />,
                  false
                );
              })}
            </div>
          </div>
        )}

        {/* Analytics Overview Chart */}
        <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-gray-700" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics Overview</h2>
              <p className="text-sm text-gray-600">Performance metrics and insights</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Bar Chart */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Reviews & Enquiries</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    <Cell fill="#3b82f6" />
                    <Cell fill="#10b981" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Line Chart */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Trend Analysis</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={statsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">Total Reviews</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-gray-700">Total Enquiries</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEnquiries}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-gray-700">Total Engagement</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReviews + stats.totalEnquiries}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-semibold text-gray-700">Active Modules</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{subscriptionSummary.subscribedModules}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

DoctorDashboard.getLayout = function PageLayout(page: React.ReactElement) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withDoctorAuth(DoctorDashboard);

// Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = DoctorDashboard.getLayout;

export default ProtectedDashboard;
