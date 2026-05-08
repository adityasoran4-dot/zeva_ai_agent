import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getCurrencySymbol } from '@/lib/currencyHelper';
import { Star, Mail, Settings, Lock, TrendingUp, Users, FileText, Briefcase, MessageSquare, Calendar, CreditCard, BarChart3, Activity, CheckCircle2, User, Crown, Stethoscope, Building2, Package, Gift, DoorOpen, UserPlus, GripVertical, Eye, EyeOff, Save, RotateCcw, Edit2, X, Undo2, Redo2, ChevronLeft, ChevronRight, LayoutDashboard, Home, Tag, Percent, ShoppingCart, Receipt, DollarSign, Wallet, Shield, UserCheck, UserCog, UserCircle, Award, Download, RefreshCw, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, LineChart, Line, Tooltip, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import Stats from '../../components/Stats';
import ClinicLayout from '../../components/ClinicLayout';
import withClinicAuth from '../../components/withClinicAuth';
// import ServicePerformance from '../../components/clinic/ServicePerformance'; // Unused import
import MembershipPackageReports from '../../components/clinic/MembershipPackageReports';
import RoomUtilization from '../../components/clinic/RoomUtilization';
import CancellationReports from '../../components/clinic/CancellationReports';
import DoctorPerformance from '../../components/clinic/DoctorPerformance';
import type { NextPageWithLayout } from '../_app';
import axios from 'axios';
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Type definitions
interface Stats {
  totalReviews: number;
  totalEnquiries: number;
  totalClinics?: number;
  totalAppointments?: number;
  totalLeads?: number;
  totalTreatments?: number;
  totalRooms?: number;
  totalDepartments?: number;
  totalPackages?: number;
  totalOffers?: number;
  totalPatients?: number;
  totalJobs?: number;
  appointmentStatusBreakdown?: { [key: string]: number };
  leadStatusBreakdown?: { [key: string]: number };
  offerStatusBreakdown?: { [key: string]: number };
}

interface DashboardStatsResponse {
  success: boolean;
  stats: Stats;
  message?: string;
}

interface ClinicUser {
  name?: string;
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
  clinicId?: string;
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

interface ClinicInfo {
  name?: string;
  ownerName?: string;
}

// Widget types for drag and drop
type WidgetType =
  | 'packages-offers'
  | 'primary-stats'
  | 'secondary-stats'
  | 'appointment-status-overview'
  | 'patient-reports'
  | 'service-performance'
  | 'quick-actions'
  | 'lead-status-charts'
  | 'status-charts'
  | 'services-overview'
  | 'membership-overview'
  | 'commission-overview'
  | 'analytics-overview'
  | 'subscription-status'
  | 'additional-stats'
  | 'financial-reports';

interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  visible: boolean;
  order: number;
}

// Stat card types for individual card dragging
interface StatCard {
  id: string;
  label: string;
  value: number | string;
  icon: string;
  moduleKey?: string;
  gridType: 'primary' | 'secondary';
  order: number;
  visible: boolean;
}

// Chart component types for individual chart dragging
interface ChartComponent {
  id: string;
  type: 'pie' | 'bar' | 'line' | 'combo';
  title: string;
  section: 'status-charts' | 'services-overview' | 'membership-overview' | 'analytics-overview';
  order: number;
  visible: boolean;
}

// Stats section types for drag and drop
interface StatsSection {
  id: string;
  title: string;
  order: number;
  visible: boolean;
}

// Package/Offer card types for individual card dragging
interface PackageOfferCard {
  id: string;
  type: 'package' | 'offer';
  title: string;
  order: number;
  visible: boolean;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: '1', type: 'packages-offers', title: 'Packages & Offers', visible: true, order: 0 },
  { id: '2', type: 'primary-stats', title: 'Key Statistics', visible: true, order: 1 },
  { id: '3', type: 'secondary-stats', title: 'Additional Statistics', visible: true, order: 2 },
  { id: 'financial', type: 'financial-reports', title: 'Financial Reports', visible: true, order: 3 },
  { id: '9', type: 'appointment-status-overview', title: 'Appointment Status Overview', visible: true, order: 4 },
  { id: '14', type: 'patient-reports', title: 'Patient Reports', visible: true, order: 5 },
  { id: '10', type: 'lead-status-charts', title: 'Lead Status Charts', visible: true, order: 6 },
  { id: '5', type: 'status-charts', title: 'Status Breakdown Charts', visible: true, order: 7 },
  { id: '11', type: 'services-overview', title: 'Top Services & Packages', visible: true, order: 8 },
  { id: '12', type: 'membership-overview', title: 'Most Purchased Membership', visible: true, order: 9 },
  { id: '13', type: 'commission-overview', title: 'Commission Details', visible: true, order: 10 },
  { id: '6', type: 'analytics-overview', title: 'Analytics Overview', visible: true, order: 11 },
  { id: '7', type: 'subscription-status', title: 'Subscription Status', visible: true, order: 12 },
  { id: '8', type: 'additional-stats', title: 'Job & Blog Analytics', visible: true, order: 13 },
  { id: '4', type: 'quick-actions', title: 'Quick Actions', visible: true, order: 14 },
];

const STORAGE_KEY = 'clinic-dashboard-layout-v8'; // Financial Reports sabse uppar (before Appointment Status)

const ClinicDashboard: NextPageWithLayout = () => {
  const [stats, setStats] = useState<Stats>({
    totalReviews: 0,
    totalEnquiries: 0,
    totalClinics: 0,
    totalAppointments: 0,
    totalLeads: 0,
    totalTreatments: 0,
    totalRooms: 0,
    totalDepartments: 0,
    totalPackages: 0,
    totalOffers: 0,
    appointmentStatusBreakdown: {},
    leadStatusBreakdown: {},
    offerStatusBreakdown: {},
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [currency, setCurrency] = useState('INR');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [clinicUser, setClinicUser] = useState<ClinicUser | null>(null);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [moduleStats, setModuleStats] = useState<ModuleStats>({});
  const [allModules, setAllModules] = useState<NavigationItem[]>([]);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>({});
  const [_permissions, setPermissions] = useState<SidebarResponse['permissions']>([]);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessMessage, setAccessMessage] = useState('You do not have permission to view this dashboard.');
  const [moduleAccess, setModuleAccess] = useState<{ canRead: boolean; canUpdate: boolean; canCreate: boolean }>({
    canRead: true,
    canUpdate: true,
    canCreate: true,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [navigationItemsLoaded, setNavigationItemsLoaded] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isShowingMockData, setIsShowingMockData] = useState<boolean>(false);
 
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [timeRangeFilter, setTimeRangeFilter] = useState<'today' | 'week' | 'month' | 'overall'>('today');
  const [filteredAppointmentData, setFilteredAppointmentData] = useState<any[]>([]);
  const [filteredLeadSourceData, setFilteredLeadSourceData] = useState<any[]>([]);
  const [filteredLeadStatusData, setFilteredLeadStatusData] = useState<any[]>([]);
  const [topPackagesData, setTopPackagesData] = useState<any[]>([]);
  const [topServicesData, setTopServicesData] = useState<any[]>([]);
  const [membershipData, setMembershipData] = useState<any[]>([]);
  const [commissionData, setCommissionData] = useState<any[]>([]);
  const [commissionPage, setCommissionPage] = useState<number>(1);
  const COMMISSION_PAGE_SIZE = 10;
  const [commissionTypeStats, setCommissionTypeStats] = useState<any[]>([]);
  
  // Financial Reports Data
  const [financialData, setFinancialData] = useState({
    revenueTrendData: [] as any[],
    paymentMethodsData: [] as any[],
    doctorRevenueData: [] as any[],
    topServicesData: [] as any[],
  });
  const [financialLoading, setFinancialLoading] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const updateMobile = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);
  
  // Patient Reports Data
  const [patientDemographics, setPatientDemographics] = useState({
    newVsReturning: [] as any[],
    genderDistribution: [] as any[],
    patientVisitFrequency: [] as any[],
    topPatients: [] as any[],
  });
  
  // Service Performance Data
  const [servicePerformance, setServicePerformance] = useState({
    mostBookedServices: [] as any[],
    leastBookedServices: [] as any[],
    serviceRevenueData: [] as any[],
    conversionRateData: [] as any[],
  });
  const [servicePerformanceLoading, setServicePerformanceLoading] = useState<boolean>(false);
  
  // New filter states for Last 30 Days with options
  const [searchQuery, setSearchQuery] = useState<string>('');
 
  // Export dashboard data to CSV
 
  // Export dashboard data to CSV
  const handleExportDashboard = () => {
    const headers = ['Module', 'Value', 'Label'];
    const csvData = Object.entries(moduleStats).map(([key, stat]) => [
      key,
      stat.value,
      stat.label
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Refresh dashboard - reload page
  const handleRefreshDashboard = () => {
    window.location.reload();
  };

  // Function to check if a section matches the search query
  const sectionMatchesSearch = (sectionNames: string[]): boolean => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase();
    return sectionNames.some(name => name.toLowerCase().includes(query));
  };

  // Compute matching section IDs based on current search (memoized)
  const matchingSectionIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const matches: string[] = [];
    
    // Check each section type
    if (sectionMatchesSearch(['Appointment', 'Appointments', 'Reports'])) {
      matches.push('appointment-status-overview');
    }
    if (sectionMatchesSearch(['Patient', 'Patients', 'Demographics'])) {
      matches.push('patient-reports');
    }
    if (sectionMatchesSearch(['Service', 'Services', 'Performance', 'Booked'])) {
      matches.push('services-overview');
    }
    if (sectionMatchesSearch(['Status', 'Charts', 'Breakdown'])) {
      matches.push('status-charts');
    }
    if (sectionMatchesSearch(['Membership', 'Package', 'Packages'])) {
      matches.push('membership-overview');
    }
    if (sectionMatchesSearch(['Commission'])) {
      matches.push('commission-overview');
    }
    if (sectionMatchesSearch(['Analytics', 'Overview'])) {
      matches.push('analytics-overview');
    }
    if (sectionMatchesSearch(['Subscription'])) {
      matches.push('subscription-status');
    }
    if (sectionMatchesSearch(['Job', 'Blog', 'Additional'])) {
      matches.push('additional-stats');
    }
    if (sectionMatchesSearch(['Quick', 'Actions'])) {
      matches.push('quick-actions');
    }
    if (sectionMatchesSearch(['Doctor', 'Performance'])) {
      matches.push('doctor-performance');
    }
    if (sectionMatchesSearch(['Room', 'Resource', 'Utilization'])) {
      matches.push('room-utilization');
    }
    if (sectionMatchesSearch(['Cancellation', 'No-Show'])) {
      matches.push('cancellation-reports');
    }
    
    return matches;
  }, [searchQuery]);

  // Fetch clinic currency preference
  useEffect(() => {
    const fetchClinicCurrency = async () => {
      try {
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken') || localStorage.getItem('agentToken') || sessionStorage.getItem('agentToken');
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get('/api/clinics/myallClinic', { headers });
        if (res.data.success && res.data.clinic?.currency) {
          setCurrency(res.data.clinic.currency);
        }
      } catch (e) { 
        console.error('Error fetching clinic currency:', e); 
      }
    };
    fetchClinicCurrency();
  }, []);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showCalendar && !target.closest('.calendar-container')) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);
 
  // Calendar functions
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const selectDate = (day: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(day);
   
    // Check if selected date is in the future
    const week = new Date();
    week.setHours(0, 0, 0, 0); // Reset time for comparison
    const selectedDateTime = new Date(newDate);
    selectedDateTime.setHours(0, 0, 0, 0);
   
    if (selectedDateTime > week) {
      // Don't allow future dates
      return;
    }
   
    setSelectedDate(newDate);
    setShowCalendar(false);
  };

  const isDateSelected = (day: number): boolean => {
    const currentDate = new Date(selectedDate);
    return (
      currentDate.getDate() === day &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isFutureDate = (day: number): boolean => {
    const dateToCheck = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    const week = new Date();
    week.setHours(0, 0, 0, 0);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck > week;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedDate);
    const firstDay = getFirstDayOfMonth(selectedDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isFuture = isFutureDate(day);
      days.push(
        <button
          key={day}
          onClick={() => !isFuture && selectDate(day)}
          disabled={isFuture}
          className={`h-8 w-8 rounded-full text-sm font-medium transition-all ${
            isFuture
              ? 'text-gray-300 cursor-not-allowed'
              : isDateSelected(day)
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-100'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const [dailyStats, setDailyStats] = useState({
    booked: 0,
    enquiry: 0,
    discharge: 0,
    arrived: 0,
    consultation: 0,
    cancelled: 0,
    approved: 0,
    rescheduled: 0,
    waiting: 0,
    rejected: 0,
    completed: 0,
    daily: {
      patients: 0,
      jobs: 0,
      offers: 0,
      leads: 0,
      reviews: 0,
      enquiries: 0,
      applications: 0,
      appointments: 0,
      arrived: 0,
      booked: 0,
      cancelled: 0,
      waiting: 0,
      enquiry: 0
    },
    totals: {
      membership: 0,
      jobs: 0
    }
  });

  

  // Drag and drop state
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return DEFAULT_WIDGETS;
        }
      }
    }
    return DEFAULT_WIDGETS;
  });
  const [activeId, setActiveId] = useState<string | null>(null);
 
  // Individual stat card state
  const STAT_CARDS_STORAGE_KEY = 'clinic-dashboard-stat-cards-v5'; // Updated to v5 to add Reviews & Enquiries cards
  const [statCards, setStatCards] = useState<{ primary: StatCard[]; secondary: StatCard[] }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STAT_CARDS_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Return default cards
        }
      }
    }
    return {
      primary: [
        { id: 'p1', label: 'Total Reviews', value: 0, icon: 'star', moduleKey: 'reviews', gridType: 'primary' as const, order: 0, visible: true },
        { id: 'p2', label: 'Total Enquiries', value: 0, icon: 'mail', moduleKey: 'enquiries', gridType: 'primary' as const, order: 1, visible: true },
        { id: 'p3', label: 'Active Modules', value: 0, icon: 'check', moduleKey: 'modules', gridType: 'primary' as const, order: 2, visible: false },
        { id: 'p4', label: 'Subscription', value: '0%', icon: 'crown', moduleKey: 'subscription', gridType: 'primary' as const, order: 3, visible: false },
        { id: 'p5', label: 'Total Membership', value: 0, icon: 'users', moduleKey: 'membership', gridType: 'primary' as const, order: 4, visible: true },
        { id: 'p6', label: 'Total Jobs', value: 0, icon: 'briefcase', moduleKey: 'jobs', gridType: 'primary' as const, order: 5, visible: true },
        { id: 'p7', label: 'Total Leads', value: 0, icon: 'users', moduleKey: 'leads', gridType: 'primary' as const, order: 6, visible: true },
      ],
      secondary: [
        { id: 's1', label: 'Appointments', value: 0, icon: 'calendar', moduleKey: 'daily_appointments', gridType: 'secondary' as const, order: 0, visible: false },
        // New Daily Activity Cards
        { id: 's8', label: 'Patients', value: 0, icon: 'users', moduleKey: 'daily_patients', gridType: 'secondary' as const, order: 7, visible: true },
        { id: 's9', label: 'Jobs', value: 0, icon: 'briefcase', moduleKey: 'daily_jobs', gridType: 'secondary' as const, order: 8, visible: true },
        { id: 's10', label: 'Offers', value: 0, icon: 'gift', moduleKey: 'daily_offers', gridType: 'secondary' as const, order: 9, visible: true },
        { id: 's11', label: 'Leads', value: 0, icon: 'users', moduleKey: 'daily_leads', gridType: 'secondary' as const, order: 10, visible: true },
        { id: 's12', label: 'Reviews', value: 0, icon: 'star', moduleKey: 'daily_reviews', gridType: 'secondary' as const, order: 11, visible: true },
        { id: 's13', label: 'Enquiries', value: 0, icon: 'mail', moduleKey: 'daily_enquiries', gridType: 'secondary' as const, order: 12, visible: true },
      ],
    };
  });
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [cardHistory, setCardHistory] = useState<Array<{ primary: StatCard[]; secondary: StatCard[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [gridSize] = useState<'compact' | 'normal' | 'spacious'>('normal');
 
  // Chart components state
  const CHARTS_STORAGE_KEY = 'clinic-dashboard-charts-v2';
  const [chartComponents, setChartComponents] = useState<{
    'status-charts': ChartComponent[];
    'services-overview': ChartComponent[];
    'membership-overview': ChartComponent[];
    'analytics-overview': ChartComponent[];
  }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CHARTS_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return {
            'status-charts': [
              { id: 'chart-appointment', type: 'pie' as const, title: 'Appointment Status', section: 'status-charts' as const, order: 0, visible: true },
              { id: 'chart-lead', type: 'pie' as const, title: 'Lead Status', section: 'status-charts' as const, order: 1, visible: true },
              { id: 'chart-offer', type: 'pie' as const, title: 'Offer Status', section: 'status-charts' as const, order: 2, visible: true },
              { id: 'chart-daily-activities', type: 'pie' as const, title: 'Daily Activities', section: 'status-charts' as const, order: 3, visible: true },
            ],
            'services-overview': [],
            'membership-overview': [],
            'analytics-overview': [
              { id: 'chart-bar', type: 'bar' as const, title: 'Appointments, Leads, Offers & Jobs', section: 'analytics-overview' as const, order: 0, visible: true },
              { id: 'chart-line', type: 'line' as const, title: 'Reviews, Enquiries, Patients & Rooms', section: 'analytics-overview' as const, order: 1, visible: true },
              { id: 'chart-active', type: 'bar' as const, title: 'Active vs Inactive', section: 'analytics-overview' as const, order: 2, visible: true },
              { id: 'chart-daily-appointment', type: 'bar' as const, title: 'Daily Appointment Status', section: 'analytics-overview' as const, order: 3, visible: true },
            ],
          };
        }
      }
    }
    return {
      'status-charts': [
        { id: 'chart-appointment', type: 'pie' as const, title: 'Appointment Status', section: 'status-charts' as const, order: 0, visible: true },
        { id: 'chart-lead', type: 'pie' as const, title: 'Lead Status', section: 'status-charts' as const, order: 1, visible: true },
        { id: 'chart-offer', type: 'pie' as const, title: 'Offer Status', section: 'status-charts' as const, order: 2, visible: true },
        { id: 'chart-daily-activities', type: 'pie' as const, title: 'Daily Activities', section: 'status-charts' as const, order: 3, visible: true },
      ],
      'analytics-overview': [
        { id: 'chart-bar', type: 'bar' as const, title: 'Appointments, Leads, Offers & Jobs', section: 'analytics-overview' as const, order: 0, visible: true },
        { id: 'chart-line', type: 'line' as const, title: 'Reviews, Enquiries, Patients & Rooms', section: 'analytics-overview' as const, order: 1, visible: true },
        { id: 'chart-active', type: 'bar' as const, title: 'Active vs Inactive', section: 'analytics-overview' as const, order: 2, visible: true },
        { id: 'chart-daily-appointment', type: 'bar' as const, title: 'Daily Appointment Status', section: 'analytics-overview' as const, order: 3, visible: true },
      ],
    };
  });
  const [activeChartId, setActiveChartId] = useState<string | null>(null);
 
  // Stats sections state
  const STATS_SECTIONS_STORAGE_KEY = 'clinic-dashboard-stats-sections';
  const [statsSections, setStatsSections] = useState<StatsSection[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STATS_SECTIONS_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [
            { id: 'stats-job-types', title: 'Job Types Distribution', order: 0, visible: true },
            { id: 'stats-blog-stats', title: 'Blog Statistics', order: 1, visible: true },
            { id: 'stats-blog-engagement', title: 'Blog Engagement Overview', order: 2, visible: true },
          ];
        }
      }
    }
    return [
      { id: 'stats-job-types', title: 'Job Types Distribution', order: 0, visible: true },
      { id: 'stats-blog-stats', title: 'Blog Statistics', order: 1, visible: true },
      { id: 'stats-blog-engagement', title: 'Blog Engagement Overview', order: 2, visible: true },
    ];
  });
  const [activeStatsSectionId, setActiveStatsSectionId] = useState<string | null>(null);
 
  // Package/Offer cards state
  const PACKAGE_OFFER_STORAGE_KEY = 'clinic-dashboard-package-offer';
  const [packageOfferCards, setPackageOfferCards] = useState<PackageOfferCard[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PACKAGE_OFFER_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [
            { id: 'package-card', type: 'package' as const, title: 'Packages', order: 0, visible: true },
            { id: 'offer-card', type: 'offer' as const, title: 'Offers', order: 1, visible: true },
          ];
        }
      }
    }
    return [
      { id: 'package-card', type: 'package' as const, title: 'Packages', order: 0, visible: true },
      { id: 'offer-card', type: 'offer' as const, title: 'Offers', order: 1, visible: true },
    ];
  });
  const [activePackageOfferId, setActivePackageOfferId] = useState<string | null>(null);
 
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
 
  // Card sensors (more sensitive for individual cards) - with constraint to ignore widget-level drags
  const cardSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [quickActions, setQuickActions] = useState<any[]>([]);

  // Icon mapping
  const iconMap: { [key: string]: React.ReactNode } = {
    // Standard keys
    '??-bar': <BarChart3 className="w-5 h-5" />,
    '??-users': <Users className="w-5 h-5" />,
    '??-file': <FileText className="w-5 h-5" />,
    '??-briefcase': <Briefcase className="w-5 h-5" />,
    '??-message': <MessageSquare className="w-5 h-5" />,
    '??-calendar': <Calendar className="w-5 h-5" />,
    '??-card': <CreditCard className="w-5 h-5" />,
    '?': <Star className="w-5 h-5" />,
    '??-mail': <Mail className="w-5 h-5" />,
    '??-settings': <Settings className="w-5 h-5" />,
    '??-trending': <TrendingUp className="w-5 h-5" />,
    '??-lock': <Lock className="w-5 h-5" />,
   
    // Sidebar specific keys
    'home': <Home className="w-5 h-5" />,
    'dashboard': <LayoutDashboard className="w-5 h-5" />,
    'analytics': <BarChart3 className="w-5 h-5" />,
    'reports': <FileText className="w-5 h-5" />,
    'overview': <Activity className="w-5 h-5" />,
    'users': <Users className="w-5 h-5" />,
    'patients': <UserCircle className="w-5 h-5" />,
    'doctors': <Stethoscope className="w-5 h-5" />,
    'staff': <UserCog className="w-5 h-5" />,
    'agents': <UserPlus className="w-5 h-5" />,
    'team': <Users className="w-5 h-5" />,
    'profile': <UserCircle className="w-5 h-5" />,
    'user-circle': <UserCircle className="w-5 h-5" />,
    'testimonials': <Award className="w-5 h-5" />,
    'offers': <Tag className="w-5 h-5" />,
    'promotions': <Gift className="w-5 h-5" />,
    'discounts': <Percent className="w-5 h-5" />,
    'deals': <ShoppingCart className="w-5 h-5" />,
    'packages': <Package className="w-5 h-5" />,
    'payments': <CreditCard className="w-5 h-5" />,
    'billing': <Receipt className="w-5 h-5" />,
    'invoices': <FileText className="w-5 h-5" />,
    'transactions': <DollarSign className="w-5 h-5" />,
    'revenue': <TrendingUp className="w-5 h-5" />,
    'expenses': <TrendingUp className="w-5 h-5" />,
    'wallet': <Wallet className="w-5 h-5" />,
    'finance': <DollarSign className="w-5 h-5" />,
    'accounts': <DollarSign className="w-5 h-5" />,
    'security': <Shield className="w-5 h-5" />,
    'permissions': <Lock className="w-5 h-5" />,
    'access': <UserCheck className="w-5 h-5" />,
   
    // Legacy/String keys
    'star': <Star className="w-5 h-5" />,
    'mail': <Mail className="w-5 h-5" />,
    'check': <CheckCircle2 className="w-5 h-5" />,
    'crown': <Crown className="w-5 h-5" />,
    'calendar': <Calendar className="w-5 h-5" />,
    'stethoscope': <Stethoscope className="w-5 h-5" />,
    'door': <DoorOpen className="w-5 h-5" />,
    'building': <Building2 className="w-5 h-5" />,
    'x': <X className="w-5 h-5" />,
    'package': <Package className="w-5 h-5" />,
    'gift': <Gift className="w-5 h-5" />,
  };

  // Populate quick actions from navigation items
  useEffect(() => {
    if (navigationItems.length > 0) {
      const actions: any[] = [];
      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-cyan-500'];
      let colorIdx = 0;

      const processItem = (item: NavigationItem) => {
        if (item.subModules && item.subModules.length > 0) {
          item.subModules.forEach(sub => {
            if (sub.path) {
              actions.push({
                label: sub.name,
                iconNode: iconMap[sub.icon] || iconMap[item.icon] || <Activity className="w-5 h-5" />,
                path: sub.path,
                color: colors[colorIdx % colors.length]
              });
              colorIdx++;
            }
          });
        } else if (item.path) {
          actions.push({
            label: item.label,
            iconNode: iconMap[item.icon] || <Activity className="w-5 h-5" />,
            path: item.path,
            color: colors[colorIdx % colors.length]
          });
          colorIdx++;
        }
      };

      navigationItems.forEach(processItem);
     
      if (actions.length > 0) {
        setQuickActions(actions);
      } else {
         setQuickActions([
          { label: 'New Review', icon: Star, path: '/clinic/getAllReview', color: 'bg-yellow-500' },
          { label: 'New Enquiry', icon: Mail, path: '/clinic/get-Enquiry', color: 'bg-teal-500' },
          { label: 'Create Blog', icon: FileText, path: '/clinic/BlogForm', color: 'bg-teal-500' },
          { label: 'Job Posting', icon: Briefcase, path: '/clinic/job-posting', color: 'bg-indigo-500' },
          { label: 'Create Agent', icon: UserPlus, path: '/clinic/create-agent', color: 'bg-teal-500' },
          { label: 'Create Lead', icon: UserPlus, path: '/clinic/create-lead', color: 'bg-orange-500' },
        ]);
      }
    } else {
       // Initialize default if navigation items not loaded yet or empty
       setQuickActions([
          { label: 'New Review', icon: Star, path: '/clinic/getAllReview', color: 'bg-yellow-500' },
          { label: 'New Enquiry', icon: Mail, path: '/clinic/get-Enquiry', color: 'bg-teal-500' },
          { label: 'Create Blog', icon: FileText, path: '/clinic/BlogForm', color: 'bg-teal-500' },
          { label: 'Job Posting', icon: Briefcase, path: '/clinic/job-posting', color: 'bg-indigo-500' },
          { label: 'Create Agent', icon: UserPlus, path: '/clinic/create-agent', color: 'bg-teal-500' },
          { label: 'Create Lead', icon: UserPlus, path: '/clinic/create-lead', color: 'bg-orange-500' },
        ]);
    }
  }, [navigationItems]);

  // Get clinic user data from localStorage (same as ClinicHeader)
  useEffect(() => {
    const clinicUserRaw = localStorage.getItem('clinicUser');
    if (clinicUserRaw) {
      try {
        const parsedUser = JSON.parse(clinicUserRaw);
        setClinicUser(parsedUser);
      } catch {
        // console.error('Error parsing clinic user data:', error);
      }
    }
  }, []);

  // Fetch clinic information (name and owner name)
  useEffect(() => {
    const fetchClinicInfo = async (): Promise<void> => {
      try {
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
        if (!token) return;

        const clinicRes = await axios.get('/api/clinics/myallClinic', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (clinicRes.data && clinicRes.data.clinics && clinicRes.data.clinics.length > 0) {
          const clinic = clinicRes.data.clinics[0];
          setClinicInfo({
            name: clinic.name || '',
            ownerName: clinicUser?.name || '',
          });
        } else {
          setClinicInfo({
            name: '',
            ownerName: clinicUser?.name || '',
          });
        }
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          // Only set access denied if user is agent/doctorStaff and doesn't have permission
          // Don't set it for clinic/doctor roles as they have full access
          const role = getUserRole();
          if (['agent', 'doctorStaff'].includes(role || '')) {
          setAccessDenied(true);
          setAccessMessage('Your clinic account does not have permission to view this dashboard.');
          }
        } else {
          console.error('Error fetching clinic info:', error);
          setClinicInfo({
            name: '',
            ownerName: clinicUser?.name || '',
          });
        }
      }
    };

    if (clinicUser) {
      fetchClinicInfo();
    }
  }, [clinicUser]);

  // Token helpers (shared across agent and doctorStaff)
  const getAuthToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('clinicToken') ||
      sessionStorage.getItem('clinicToken') ||
      localStorage.getItem('agentToken') ||
      sessionStorage.getItem('agentToken') ||
      localStorage.getItem('userToken') ||
      sessionStorage.getItem('userToken')
    );
  }, []);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = getAuthToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [getAuthToken]);

  const getUserRole = useCallback((): string | null => {
    const token = getAuthToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch {
      return null;
    }
  }, [getAuthToken]);

  // Fetch module permissions for dashboard
  useEffect(() => {
    const fetchPermissions = async () => {
      let isMounted = true;
      const role = getUserRole();
      setUserRole(role);

      // ? For admin role, grant full access (bypass permission checks)
      if (role === 'admin') {
        if (!isMounted) return;
        setModuleAccess({ canRead: true, canUpdate: true, canCreate: true });
        setAccessDenied(false);
        setPermissionsLoaded(true);
        return;
      }

      // ? For clinic and doctor roles, fetch admin-level permissions from /api/clinic/sidebar-permissions
      if (role === 'clinic' || role === 'doctor') {
        const fetchClinicPermissions = async () => {
          try {
            const token = getAuthToken();
            if (!token) {
              if (!isMounted) return;
              setModuleAccess({ canRead: false, canUpdate: false, canCreate: false });
              setAccessDenied(true);
              setAccessMessage('Authentication required. Please log in again.');
              setPermissionsLoaded(true);
              return;
            }

            const res = await axios.get('/api/clinic/sidebar-permissions', {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!isMounted) return;

            if (res.data.success) {
              // Check if permissions array exists and is not null
              // If permissions is null, admin hasn't set any restrictions yet - allow full access (backward compatibility)
              if (res.data.permissions === null || !Array.isArray(res.data.permissions) || res.data.permissions.length === 0) {
                // No admin restrictions set yet - default to full access for backward compatibility
                setModuleAccess({ canRead: true, canUpdate: true, canCreate: true });
                setAccessDenied(false);
              } else {
                // Admin has set permissions - check the clinic_dashboard module
                const modulePermission = res.data.permissions.find((p: any) => {
                  if (!p?.module) return false;
                  // Check for clinic_dashboard module variations
                  if (p.module === 'clinic_dashboard') return true;
                  if (p.module === 'dashboard') return true;
                  return false;
                });

                if (modulePermission) {
                  const actions = modulePermission.actions || {};
                 
                  // Check if "all" is true, which grants all permissions
                  const moduleAll = actions.all === true || actions.all === 'true' || String(actions.all).toLowerCase() === 'true';
                  const moduleCreate = actions.create === true || actions.create === 'true' || String(actions.create).toLowerCase() === 'true';
                  const moduleRead = actions.read === true || actions.read === 'true' || String(actions.read).toLowerCase() === 'true';
                  const moduleUpdate = actions.update === true || actions.update === 'true' || String(actions.update).toLowerCase() === 'true';

                  const finalCanRead = moduleAll || moduleRead;
                  const finalCanUpdate = moduleAll || moduleUpdate;
                  const finalCanCreate = moduleAll || moduleCreate;

                  setModuleAccess({
                    canRead: finalCanRead,
                    canUpdate: finalCanUpdate,
                    canCreate: finalCanCreate,
                  });

                  if (finalCanRead) {
                    setAccessDenied(false);
                  } else {
                    setAccessDenied(true);
                    setAccessMessage('You do not have read permission for the clinic dashboard.');
                  }
                } else {
                  // Module permission not found in the permissions array - default to read-only
                  setModuleAccess({
                    canRead: true, // Clinic/doctor can always read their own dashboard
                    canUpdate: false,
                    canCreate: false,
                  });
                  setAccessDenied(false);
                }
              }
            } else {
              // API response doesn't have permissions, default to full access (backward compatibility)
              setModuleAccess({ canRead: true, canUpdate: true, canCreate: true });
              setAccessDenied(false);
            }
          } catch (err: any) {
            console.error('Error fetching clinic sidebar permissions:', err);
            // On error, default to full access (backward compatibility)
            if (isMounted) {
              setModuleAccess({ canRead: true, canUpdate: true, canCreate: true });
              setAccessDenied(false);
            }
          } finally {
            if (isMounted) {
              setPermissionsLoaded(true);
            }
          }
        };

        fetchClinicPermissions();
        return;
      }

      // For agent/doctorStaff roles, use agent permissions API
      if (!['agent', 'doctorStaff'].includes(role || '')) {
        if (!isMounted) return;
        setModuleAccess({ canRead: true, canUpdate: true, canCreate: true });
        setAccessDenied(false);
        setPermissionsLoaded(true);
        return;
      }

      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) {
          console.warn("?? No authorization token found");
          setModuleAccess({ canRead: false, canUpdate: false, canCreate: false });
          setAccessDenied(true);
          setAccessMessage('Authentication required. Please log in again.');
          setPermissionsLoaded(true);
          return;
        }

        const res = await axios.get(
          '/api/agent/get-module-permissions?moduleKey=clinic_dashboard',
          { headers }
        );

        console.log("?? Full API response:", JSON.stringify(res.data, null, 2));

        if (res.data?.success && res.data.permissions) {
          const actions = res.data.permissions.actions || {};
         
          // Helper to convert value to boolean
          const toBool = (value: any): boolean => {
            if (value === true || value === false) return value;
            if (typeof value === "string") {
              const lowered = value.toLowerCase();
              return lowered === "true" || lowered === "1" || lowered === "yes";
            }
            return Boolean(value);
          };
         
          const canAll = toBool(actions.all);
          const canRead = toBool(actions.read);
          const canUpdate = toBool(actions.update);
          const canCreate = toBool(actions.create);
         
          console.log("?? Dashboard permissions check:", {
            module: res.data.permissions.module,
            rawActions: actions,
            convertedActions: {
              all: canAll,
              read: canRead,
              update: canUpdate,
              create: canCreate,
            },
            finalAccess: {
              canRead: canAll || canRead,
              canUpdate: canAll || canUpdate,
              canCreate: canAll || canCreate,
            }
          });
         
          const finalCanRead = canAll || canRead;
          const finalCanUpdate = canAll || canUpdate;
          const finalCanCreate = canAll || canCreate;
         
          console.log("?? Setting moduleAccess:", {
            canRead: finalCanRead,
            canUpdate: finalCanUpdate,
            canCreate: finalCanCreate,
          });
         
          setModuleAccess({
            canRead: finalCanRead,
            canUpdate: finalCanUpdate,
            canCreate: finalCanCreate,
          });
         
          // Reset accessDenied if permission is granted
          if (finalCanRead) {
            console.log("? Access granted - setting accessDenied to false");
            setAccessDenied(false);
        } else {
            console.log("? Access denied - setting accessDenied to true");
            setAccessDenied(true);
            setAccessMessage('You do not have read permission for the clinic dashboard.');
          }
        } else {
          console.warn("?? No permissions data received or success is false:", res.data);
          setModuleAccess({ canRead: false, canUpdate: false, canCreate: false });
          setAccessDenied(true);
          setAccessMessage('Unable to verify permissions. Access denied.');
        }
      } catch (error) {
        console.error('Error fetching dashboard permissions:', error);
        setModuleAccess({ canRead: false, canUpdate: false, canCreate: false });
        setAccessDenied(true);
        setAccessMessage('Error loading permissions. Please try again.');
      } finally {
        setPermissionsLoaded(true);
      }
    };

    fetchPermissions();
  }, [getAuthHeaders, getUserRole, getAuthToken]);

  // Reset accessDenied when permissions are granted
  useEffect(() => {
    if (!permissionsLoaded) return;
   
    // Check read permission for all roles
    if (!moduleAccess.canRead) {
      console.log("? Setting accessDenied to true - read permission denied");
      setAccessDenied(true);
      setAccessMessage('You do not have read permission for the clinic dashboard.');
      return;
    }
   
    // If read permission is granted, allow access
    console.log("? Resetting accessDenied to false - read permission granted");
    setAccessDenied(false);
  }, [permissionsLoaded, moduleAccess.canRead]);

  // Fetch sidebar navigation items (which already have permissions applied)
  useEffect(() => {
    if (!permissionsLoaded) return;
   
    // Only check access for agent and doctorStaff roles
    if (['agent', 'doctorStaff'].includes(userRole || '')) {
      console.log("?? Checking access for role:", userRole, "canRead:", moduleAccess.canRead);
     
      if (!moduleAccess.canRead) {
        console.log("? Access denied - moduleAccess.canRead is false");
      setAccessDenied(true);
        setAccessMessage('You do not have read permission for the clinic dashboard.');
      setLoading(false);
      setNavigationItemsLoaded(true);
      return;
      } else {
        console.log("? Access granted - moduleAccess.canRead is true");
        setAccessDenied(false);
      }
    } else {
      // For other roles (clinic, doctor, etc.), always grant access
      setAccessDenied(false);
    }

    const fetchNavigationItems = async (): Promise<void> => {
      try {
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
          localStorage.getItem('adminToken') ||
          sessionStorage.getItem('adminToken');
         
        if (!token) {
          setNavigationItemsLoaded(true);
          return;
        }

        const res = await axios.get<SidebarResponse>('/api/clinic/sidebar-permissions', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success && res.data.navigationItems) {
          setNavigationItems(res.data.navigationItems);
          if (res.data.permissions) {
            setPermissions(res.data.permissions);
          }
          // If we successfully got navigation items, ensure access is not denied
          // (unless permissions explicitly deny it)
          if (['agent', 'doctorStaff'].includes(userRole || '')) {
            if (moduleAccess.canRead) {
              setAccessDenied(false);
            }
          } else {
            setAccessDenied(false);
          }
        }
        setNavigationItemsLoaded(true);
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          // Only set access denied if user is agent/doctorStaff
          // and doesn't have read permission
          if (['agent', 'doctorStaff'].includes(userRole || '')) {
            if (!moduleAccess.canRead) {
          setAccessDenied(true);
          setAccessMessage('You do not have permission to view the dashboard modules.');
            }
          }
        } else {
          console.error('Error fetching navigation items:', error);
        }
        setNavigationItemsLoaded(true);
      }
    };

    fetchNavigationItems();
  }, [permissionsLoaded, moduleAccess.canRead, userRole]);

  // Fetch all available modules (to show restricted ones)
  useEffect(() => {
    if (!permissionsLoaded) return;
   
    // Only check access for agent and doctorStaff roles
    if (['agent', 'doctorStaff'].includes(userRole || '')) {
      if (!moduleAccess.canRead) {
      setAccessDenied(true);
        setAccessMessage('You do not have read permission for the clinic dashboard.');
      setLoading(false);
      return;
      } else {
        setAccessDenied(false);
      }
    } else {
      // For other roles, always grant access
      setAccessDenied(false);
    }

    const fetchAllModules = async (): Promise<void> => {
      try {
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
          localStorage.getItem('adminToken') ||
          sessionStorage.getItem('adminToken');
         
        if (!token) return;

        const res = await axios.get<{ success: boolean; data: NavigationItem[] }>('/api/navigation/get-by-role?role=clinic', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success && res.data.data) {
          setAllModules(res.data.data);
        }
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          // Only set access denied if user is agent/doctorStaff and doesn't have read permission
          // Don't block access just because we can't fetch all modules
          if (['agent', 'doctorStaff'].includes(userRole || '')) {
            if (!moduleAccess.canRead) {
          setAccessDenied(true);
          setAccessMessage('Access to module information is restricted for your account.');
            }
          }
        } else {
          console.error('Error fetching all modules:', error);
        }
      }
    };

    fetchAllModules();
  }, [permissionsLoaded, moduleAccess.canRead, userRole]);

  // Fetch stats for each module
  useEffect(() => {
    if (!permissionsLoaded) return;
    // Prevent data fetching if read permission is false for any role
    if (!moduleAccess.canRead) {
      setModuleStats({});
      setStatsLoading(false);
      return;
    }

    const fetchModuleStats = async (): Promise<void> => {
      setStatsLoading(true);
      const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
      if (!token) {
        setStatsLoading(false);
        return;
      }

      const statsMap: ModuleStats = {};
      let dashboardStatsData: Stats | null = null;

      // Fetch basic dashboard stats
      try {
        const res = await fetch('/api/clinics/dashboardStats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: DashboardStatsResponse = await res.json();
        if (data.success && data.stats) {
          dashboardStatsData = data.stats;
          setStats(data.stats);
          
          // Check if this is mock data
          const isMockData = (data as any).isMockData || false;
          setIsShowingMockData(isMockData);
          
          if (isMockData) {
            console.log('📊 Dashboard showing mock data for new user');
          }
         
          // Map dashboardStats API data to module keys
          // Common module key patterns
          statsMap['clinic_reviews'] = {
            value: data.stats.totalReviews || 0,
            label: 'Total Reviews',
            icon: <Star className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['reviews'] = {
            value: data.stats.totalReviews || 0,
            label: 'Total Reviews',
            icon: <Star className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['clinic_enquiries'] = {
            value: data.stats.totalEnquiries || 0,
            label: 'Total Enquiries',
            icon: <Mail className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['enquiries'] = {
            value: data.stats.totalEnquiries || 0,
            label: 'Total Enquiries',
            icon: <Mail className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['clinic_appointments'] = {
            value: data.stats.totalAppointments || 0,
            label: 'Total Appointments',
            icon: <Calendar className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['appointments'] = {
            value: data.stats.totalAppointments || 0,
            label: 'Total Appointments',
            icon: <Calendar className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['clinic_leads'] = {
            value: data.stats.totalLeads || 0,
            label: 'Total Leads',
            icon: <Users className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['leads'] = {
            value: data.stats.totalLeads || 0,
            label: 'Total Leads',
            icon: <Users className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['clinic_offers'] = {
            value: (data.stats.totalOffers || (data.stats as any).totaloffers) || 0,
            label: 'Total Offers',
            icon: <Gift className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['offers'] = {
            value: (data.stats.totalOffers || (data.stats as any).totaloffers) || 0,
            label: 'Total Offers',
            icon: <Gift className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['clinic_treatments'] = {
            value: data.stats.totalTreatments || 0,
            label: 'Total Treatments',
            icon: <Stethoscope className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['treatments'] = {
            value: data.stats.totalTreatments || 0,
            label: 'Total Treatments',
            icon: <Stethoscope className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['clinic_rooms'] = {
            value: data.stats.totalRooms || 0,
            label: 'Total Rooms',
            icon: <DoorOpen className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['rooms'] = {
            value: data.stats.totalRooms || 0,
            label: 'Total Rooms',
            icon: <DoorOpen className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['clinic_packages'] = {
            value: data.stats.totalPackages || 0,
            label: 'Total Packages',
            icon: <Package className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['packages'] = {
            value: data.stats.totalPackages || 0,
            label: 'Total Packages',
            icon: <Package className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          // Map specific modules for first graph
          statsMap['health_center'] = {
            value: 1, // Will be updated if clinic count is fetched
            label: 'Health Centers',
            icon: <Building2 className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['enquiry'] = {
            value: data.stats.totalEnquiries || 0,
            label: 'Total Enquiries',
            icon: <Mail className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['create_lead'] = {
            value: data.stats.totalLeads || 0,
            label: 'Total Leads',
            icon: <Users className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
          statsMap['assignedLead'] = {
            value: data.stats.totalLeads || 0,
            label: 'Assigned Leads',
            icon: <Users className="w-5 h-5" />,
            color: '#3b82f6',
            hasData: true,
          };
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }

      // Fetch stats for each navigation item based on moduleKey
      // First check if we already have data from dashboardStats, otherwise fetch from specific APIs
      const statsPromises = navigationItems.map(async (item) => {
        try {
          // If we already have data from dashboardStats, use it
          if (statsMap[item.moduleKey]) {
            return; // Already set, skip
          }

          let statValue: number | string = 0;
          let statLabel = item.label;
          let statColor = '#3b82f6';
          let hasData = false;

          // Map module keys to their stats endpoints
          switch (item.moduleKey) {
            case 'clinic_jobs':
            case 'jobs':
              try {
                const jobsRes = await axios.get('/api/job-postings/my-jobs', {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const jobs = jobsRes.data.jobs || [];
                statValue = jobs.length;
                statLabel = 'Total Jobs';
                hasData = true;
              } catch (error) {
                console.error(`Error fetching jobs for ${item.moduleKey}:`, error);
                statValue = 0;
                hasData = false;
              }
              break;
            case 'clinic_blogs':
            case 'blogs':
              try {
                const blogsRes = await axios.get('/api/blog/published', {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const blogs = blogsRes.data.blogs || [];
                statValue = blogs.length;
                statLabel = 'Total Blogs';
                hasData = true;
              } catch (error) {
                console.error(`Error fetching blogs for ${item.moduleKey}:`, error);
                statValue = 0;
                hasData = false;
              }
              break;
            case 'clinic_staff':
            case 'staff':
              try {
                const staffRes = await axios.get('/api/staff', {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const staff = staffRes.data.staff || [];
                statValue = staff.length;
                statLabel = 'Total Staff';
                hasData = true;
              } catch (error) {
                console.error(`Error fetching staff for ${item.moduleKey}:`, error);
                statValue = 0;
                hasData = false;
              }
              break;
            case 'health_center':
              try {
                // For health center, show clinic count (usually 1, but could be more)
                const clinicRes = await axios.get('/api/clinics/myallClinic', {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const clinics = clinicRes.data?.clinics || [];
                statValue = clinics.length || 1; // At least 1 if clinic exists
                statLabel = 'Health Centers';
                hasData = true;
              } catch (error) {
                console.error(`Error fetching health center for ${item.moduleKey}:`, error);
                statValue = 1; // Default to 1 if clinic exists
                hasData = true;
              }
              break;
            case 'create_agent':
              try {
                // Fetch agents count
                const agentsRes = await axios.get('/api/agent/get-all-agents', {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const agents = agentsRes.data?.agents || agentsRes.data?.data || [];
                statValue = Array.isArray(agents) ? agents.length : 0;
                statLabel = 'Total Agents';
                hasData = true;
              } catch (error) {
                console.error(`Error fetching agents for ${item.moduleKey}:`, error);
                statValue = 0;
                hasData = false;
              }
              break;
            case 'create_lead':
            case 'assignedLead':
              // These are already covered by totalLeads from dashboardStats
              // But we can show specific counts if needed
              statValue = dashboardStatsData?.totalLeads || 0;
              statLabel = item.moduleKey === 'assignedLead' ? 'Assigned Leads' : 'Total Leads';
              hasData = (dashboardStatsData?.totalLeads || 0) > 0;
              break;
            case 'enquiry':
              // Enquiry module
              statValue = dashboardStatsData?.totalEnquiries || 0;
              statLabel = 'Total Enquiries';
              hasData = (dashboardStatsData?.totalEnquiries || 0) > 0;
              break;
            default:
              // For other modules, try to get from dashboardStatsData if available
              const moduleKeyLower = item.moduleKey.toLowerCase();
              if (moduleKeyLower.includes('enquiry')) {
                statValue = dashboardStatsData?.totalEnquiries || 0;
                statLabel = 'Total Enquiries';
                hasData = (dashboardStatsData?.totalEnquiries || 0) > 0;
              } else {
              statValue = 0;
              hasData = false;
              }
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
  }, [navigationItems, permissionsLoaded, moduleAccess.canRead, userRole]);

  useEffect(() => {
    if (!permissionsLoaded) return;
    if (['agent', 'doctorStaff'].includes(userRole || '') && !moduleAccess.canRead) {
      setStats({
        totalReviews: 0,
        totalEnquiries: 0,
        totalClinics: 0,
        totalAppointments: 0,
        totalLeads: 0,
        totalTreatments: 0,
        totalRooms: 0,
        totalDepartments: 0,
        totalPackages: 0,
        totalOffers: 0,
        appointmentStatusBreakdown: {},
        leadStatusBreakdown: {},
        offerStatusBreakdown: {},
      });
      setLoading(false);
      return;
    }

    const fetchStats = async (): Promise<void> => {
      try {
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
        const res = await fetch('/api/clinics/dashboardStats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data: DashboardStatsResponse = await res.json();
        if (data.success) {
          console.log('📊 Dashboard stats loaded, FORCE CLEARING offerStatusBreakdown...');
          
          // CRITICAL: Two-step clear to ensure no stale data shows
          // Step 1: Clear immediately with functional update
          setStats(prev => ({
            ...prev,
            offerStatusBreakdown: {}
          }));
          
          console.log('⏳ Waiting for React to process clear...');
          
          // Step 2: After React processes the clear, set new data and fetch week's offers
          setTimeout(() => {
            console.log('🔄 Setting dashboard stats (offers cleared)...');
            const statsWithoutOffers = { ...data.stats, offerStatusBreakdown: {} };
            setStats(statsWithoutOffers);
            
            console.log('✅ Dashboard stats set, now fetching TODAY offers...');
            
            // Immediately fetch week's offer stats
            const params: any = { filter: 'week' };
            params.date = new Date().toISOString().split('T')[0];
            
            axios.get('/api/clinics/offerStats', {
              params,
              headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
              console.log('📡 Today API Response:', res.data);
              if (res.data.success) {
                console.log('🎯 Setting week offer data:', res.data.offerStatusBreakdown);
                setStats((prev) => ({
                  ...prev,
                  offerStatusBreakdown: res.data.offerStatusBreakdown || {}
                }));
              }
            }).catch(error => {
              console.error('❌ Error fetching week offer stats:', error);
            });
          }, 50); // Slight delay to ensure React processes the clear
        } else if (res.status === 403) {
          setStats({
            totalReviews: 0,
            totalEnquiries: 0,
            totalClinics: 0,
            totalAppointments: 0,
            totalLeads: 0,
            totalTreatments: 0,
            totalRooms: 0,
            totalDepartments: 0,
            totalPackages: 0,
            totalOffers: 0,
            appointmentStatusBreakdown: {},
            leadStatusBreakdown: {},
            offerStatusBreakdown: {},
          });
        }
      } catch (error: any) {
        if (error?.response?.status === 403) {
          setStats({
            totalReviews: 0,
            totalEnquiries: 0,
            totalClinics: 0,
            totalAppointments: 0,
            totalLeads: 0,
            totalTreatments: 0,
            totalRooms: 0,
            totalDepartments: 0,
            totalPackages: 0,
            totalOffers: 0,
            appointmentStatusBreakdown: {},
            leadStatusBreakdown: {},
            offerStatusBreakdown: {},
          });
        }
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
  }, [permissionsLoaded, moduleAccess.canRead, userRole]);


  const getGreeting = (): string => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
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

  // Memoize permissions config to prevent unnecessary re-renders
  // Calculate permissions values first
  // For clinic/doctor roles, always allow access. For agent/doctorStaff, check modules
  const hasJobsPermission = useMemo(() => {
    // For clinic/doctor roles, always allow (don't wait for navigationItems)
    if (userRole === 'clinic' || userRole === 'doctor' || !userRole) {
      return true;
    }
    // For agent/doctorStaff, check modules (but default to true while loading)
    if (!navigationItemsLoaded) {
      return true; // Default to true while loading for agent/doctorStaff
    }
    return modulesWithPermission.some(key => key === 'clinic_jobs' || key === 'jobs');
  }, [modulesWithPermission, navigationItemsLoaded, userRole]);
 
  const hasBlogsPermission = useMemo(() => {
    // For clinic/doctor roles, always allow (don't wait for navigationItems)
    if (userRole === 'clinic' || userRole === 'doctor' || !userRole) {
      return true;
    }
    // For agent/doctorStaff, check modules (but default to true while loading)
    if (!navigationItemsLoaded) {
      return true; // Default to true while loading for agent/doctorStaff
    }
    return modulesWithPermission.some(key => key === 'clinic_blogs' || key === 'blogs');
  }, [modulesWithPermission, navigationItemsLoaded, userRole]);
 
  const hasApplicationsPermission = useMemo(() => {
    // For clinic/doctor roles, always allow (don't wait for navigationItems)
    if (userRole === 'clinic' || userRole === 'doctor' || !userRole) {
      return true;
    }
    // For agent/doctorStaff, check modules (but default to true while loading)
    if (!navigationItemsLoaded) {
      return true; // Default to true while loading for agent/doctorStaff
    }
    return modulesWithPermission.some(key => key === 'clinic_jobs' || key === 'jobs');
  }, [modulesWithPermission, navigationItemsLoaded, userRole]);

  // Create stable permissions object - only recreate when values actually change
  const statsPermissions = useMemo(() => ({
    canAccessJobs: hasJobsPermission,
    canAccessBlogs: hasBlogsPermission,
    canAccessApplications: hasApplicationsPermission,
  }), [hasJobsPermission, hasBlogsPermission, hasApplicationsPermission]);

  // Memoize the entire Stats config to prevent unnecessary re-fetches
  // This ensures the config object reference only changes when permissions actually change
  const statsConfig = useMemo(() => ({
    tokenKey: 'clinicToken' as const,
    primaryColor: '#3b82f6',
    permissions: statsPermissions
  }), [statsPermissions]);

  // Get restricted modules (all modules minus modules with permission)
  const restrictedModules = useMemo(() => {
    const permissionKeys = new Set(modulesWithPermission);
    return allModules.filter(module => !permissionKeys.has(module.moduleKey));
  }, [allModules, modulesWithPermission]);

  // Calculate subscription summary (must be before any conditional returns)
  const subscriptionSummary = useMemo(() => {
    const totalModules = allModules.length;
    const subscribedModules = navigationItems.length; // Use navigationItems.length as they already have permissions
    const restrictedCount = restrictedModules.length;
    const subscriptionPercentage = totalModules > 0 ? Math.round((subscribedModules / totalModules) * 100) : 0;
   
    return {
      totalModules,
      subscribedModules,
      restrictedCount,
      subscriptionPercentage
    };
  }, [allModules, navigationItems, restrictedModules]);

  // Helper function to get value for a module
  const getModuleValue = useCallback((item: NavigationItem): number => {
    // First try to get from moduleStats
    const moduleStat = moduleStats[item.moduleKey];
   
    if (moduleStat?.value !== undefined && moduleStat.value !== null) {
      if (typeof moduleStat.value === 'number') {
        return moduleStat.value;
      } else if (typeof moduleStat.value === 'string') {
        const parsed = parseFloat(moduleStat.value);
        return isNaN(parsed) ? 0 : parsed;
      }
    }
   
    // Fallback: Map moduleKey to stats directly
    const moduleKeyLower = item.moduleKey.toLowerCase();
   
    // Direct moduleKey matching (most reliable)
    if (moduleKeyLower.includes('review') || moduleKeyLower === 'reviews' || moduleKeyLower === 'clinic_reviews') {
      return stats.totalReviews || 0;
    } else if (moduleKeyLower.includes('enquiry') || moduleKeyLower === 'enquiries' || moduleKeyLower === 'clinic_enquiries') {
      return stats.totalEnquiries || 0;
    } else if (moduleKeyLower.includes('appointment') || moduleKeyLower === 'appointments' || moduleKeyLower === 'clinic_appointments') {
      return stats.totalAppointments || 0;
    } else if (moduleKeyLower.includes('lead') || moduleKeyLower === 'leads' || moduleKeyLower === 'clinic_leads' || moduleKeyLower === 'assignedlead') {
      return stats.totalLeads || 0;
    } else if (moduleKeyLower.includes('offer') || moduleKeyLower === 'offers' || moduleKeyLower === 'clinic_offers') {
      return stats.totalOffers || 0;
    } else if (moduleKeyLower.includes('treatment') || moduleKeyLower === 'treatments' || moduleKeyLower === 'clinic_treatments') {
      return stats.totalTreatments || 0;
    } else if (moduleKeyLower.includes('room') || moduleKeyLower === 'rooms' || moduleKeyLower === 'clinic_rooms') {
      return stats.totalRooms || 0;
    } else if (moduleKeyLower.includes('package') || moduleKeyLower === 'packages' || moduleKeyLower === 'clinic_packages') {
      return stats.totalPackages || 0;
    } else if (moduleKeyLower.includes('department') || moduleKeyLower === 'departments' || moduleKeyLower === 'clinic_departments') {
      return stats.totalDepartments || 0;
    } else if (moduleKeyLower.includes('health') || moduleKeyLower === 'health_center') {
      // For health center, we might want to show clinic count or 1 if exists
      return 1; // Or you can fetch actual clinic count
    }
   
    // For modules like create_agent, create_lead, assignedLead - use moduleStats or default
    return moduleStat?.value as number || 0;
  }, [moduleStats, stats]);

  // Reference unused function to satisfy TypeScript (reserved for future functionality)
  void getModuleValue;

  // First Graph (Bar Chart): Shows Appointments, Leads, Offers, Jobs
  const modulesChartData = useMemo(() => {
    // Use totalJobs from stats API (more accurate than moduleStats)
    const jobsCount = stats.totalJobs || 0;
   
    return [
      { name: 'Appointments', value: stats.totalAppointments || 0 },
      { name: 'Leads', value: stats.totalLeads || 0 },
      { name: 'Offers', value: stats.totalOffers || 0 },
      { name: 'Jobs', value: jobsCount },
    ].filter(item => item.value > 0 || !statsLoading); // Show items with data or while loading
  }, [stats.totalAppointments, stats.totalLeads, stats.totalOffers, stats.totalJobs, statsLoading]);

  // Second Graph (Line Chart): Shows Reviews, Enquiries, Patients, Rooms
  const statsChartData = useMemo(() => {
    return [
      { name: 'Reviews', value: stats.totalReviews || 0 },
      { name: 'Enquiries', value: stats.totalEnquiries || 0 },
      { name: 'Patients', value: stats.totalPatients || 0 },
      { name: 'Rooms', value: stats.totalRooms || 0 },
    ].filter(item => item.value > 0 || !statsLoading); // Only show items with data or while loading
  }, [stats.totalReviews, stats.totalEnquiries, stats.totalPatients, stats.totalRooms, statsLoading]);

  // Prepare breakdown chart data (commented out as unused)
  // const appointmentStatusData = useMemo(() => {
  //   // Use dailyStats for the chart - showing ALL appointment statuses
  //   return [
  //     { name: 'Booked', value: dailyStats.booked },
  //     { name: 'Enquiry', value: dailyStats.enquiry },
  //     { name: 'Discharge', value: dailyStats.discharge },
  //     { name: 'Arrived', value: dailyStats.arrived },
  //     { name: 'Consultation', value: dailyStats.consultation },
  //     { name: 'Cancelled', value: dailyStats.cancelled },
  //     { name: 'Approved', value: dailyStats.approved },
  //     { name: 'Rescheduled', value: dailyStats.rescheduled },
  //     { name: 'Waiting', value: dailyStats.waiting },
  //     { name: 'Rejected', value: dailyStats.rejected },
  //     { name: 'Completed', value: dailyStats.completed },
  //   ];
  //   // Note: Not filtering out zero values to show all statuses in chart
  // }, [dailyStats]);

  const dailyAppointmentChartData = useMemo(() => [
    { name: 'Booked', value: dailyStats.booked, fill: '#3b82f6' },
    { name: 'Arrived', value: dailyStats.arrived, fill: '#22c55e' },
    { name: 'Consultation', value: dailyStats.consultation, fill: '#eab308' },
    { name: 'Cancelled', value: dailyStats.cancelled, fill: '#ef4444' },
    { name: 'Discharge', value: dailyStats.discharge, fill: '#8b5cf6' },
  ], [dailyStats]);

  // const leadStatusData = useMemo(() => {
  //   if (!stats.leadStatusBreakdown) return [];
  //   return Object.entries(stats.leadStatusBreakdown).map(([status, count]) => ({
  //     name: status,
  //     value: count,
  //   }));
  // }, [stats.leadStatusBreakdown]);

  const offerStatusData = useMemo(() => {
    console.log('🔍 offerStatusData recalculating...', stats.offerStatusBreakdown);
    if (!stats.offerStatusBreakdown) {
      console.log('⚠️ offerStatusBreakdown is null/undefined');
      return [];
    }
    const result = Object.entries(stats.offerStatusBreakdown).map(([status, count]) => ({
      name: status,
      value: count,
    }));
    console.log('✅ offerStatusData result:', result);
    return result;
  }, [stats.offerStatusBreakdown]);

  // const dailyActivitiesData = useMemo(() => {
  //   if (!dailyStats.daily) return [];
  //   return [
  //     { name: 'Patients', value: dailyStats.daily.patients },
  //     { name: 'Jobs', value: dailyStats.daily.jobs },
  //     { name: 'Offers', value: dailyStats.daily.offers },
  //     { name: 'Leads', value: dailyStats.daily.leads },
  //     { name: 'Reviews', value: dailyStats.daily.reviews },
  //     { name: 'Enquiries', value: dailyStats.daily.enquiries },
  //   ].filter(item => item.value > 0);
  // }, [dailyStats.daily]);

  // Colors for pie charts
  const pieColors = ['#2D9AA5', '#22c55e', '#a855f7', '#f97316', '#ec4899', '#6366f1', '#ef4444', '#10b981', '#3b82f6', '#f59e0b'];

  // Helper function to get color for status
  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'Active': '#22c55e',
      'Completed': '#10b981',
      'Pending': '#f59e0b',
      'Expired': '#ef4444',
      'Cancelled': '#64748b',
      'Draft': '#6366f1',
      'Booked': '#3b82f6',
      'Enquiry': '#06b6d4',
      'Approved': '#22c55e',
      'Arrived': '#84cc16',
      'Consultation': '#eab308',
      'Waiting': '#f97316',
      'Rescheduled': '#a855f7',
      'Discharge': '#ec4899',
      'Rejected': '#64748b',
    };
    return colorMap[status] || '#6b7280';
  };

  // Unified drag and drop handler - handles both widget-level and item-level drags
  const handleUnifiedDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
   
    // Check if it's a widget-level drag
    if (widgets.find(w => w.id === id)) {
      setActiveId(id);
      return;
    }
   
    // Otherwise it's an item-level drag - handle in item handlers
    if ([...statCards.primary, ...statCards.secondary].find(c => c.id === id)) {
      handleCardDragStart(event);
    } else if ([...chartComponents['status-charts'], ...chartComponents['analytics-overview']].find(c => c.id === id)) {
      handleChartDragStart(event);
    } else if (packageOfferCards.find(c => c.id === id)) {
      handlePackageOfferDragStart(event);
    }
  };

  const handleUnifiedDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;

    // Check if it's a widget-level drag
    if (widgets.find(w => w.id === activeId)) {
      setActiveId(null);
     
      if (over && active.id !== over.id) {
        setWidgets((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
         
          if (oldIndex === -1 || newIndex === -1) return items;
         
          // Use arrayMove for proper swapping
          const newItems = arrayMove(items, oldIndex, newIndex);
          // Update order numbers
          const reordered = newItems.map((item, index) => ({ ...item, order: index }));
         
          // Save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reordered));
          }
         
          return reordered;
        });
      }
      return;
    }
   
    // Otherwise it's an item-level drag - handle in unified item handler
    if (!over) return;
   
    const overId = over.id as string;
    if (activeId === overId) return;
   
    handleUnifiedItemDragEnd(activeId, overId);
  };

  const handleSaveLayout = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    localStorage.setItem(STAT_CARDS_STORAGE_KEY, JSON.stringify(statCards));
    localStorage.setItem(CHARTS_STORAGE_KEY, JSON.stringify(chartComponents));
    localStorage.setItem(STATS_SECTIONS_STORAGE_KEY, JSON.stringify(statsSections));
    setIsEditMode(false);
    // Show success message (you can use toast here)
    alert('Dashboard layout saved successfully!');
  };

  const handleResetLayout = () => {
    if (confirm('Are you sure you want to reset to default layout? This cannot be undone.')) {
      setWidgets(DEFAULT_WIDGETS);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STAT_CARDS_STORAGE_KEY);
      localStorage.removeItem(CHARTS_STORAGE_KEY);
      localStorage.removeItem(STATS_SECTIONS_STORAGE_KEY);
      setIsEditMode(false);
      // Reset stat cards to default
      setStatCards({
        primary: [
          { id: 'p1', label: 'Total Reviews', value: 0, icon: 'star', moduleKey: 'reviews', gridType: 'primary' as const, order: 0, visible: true },
          { id: 'p2', label: 'Total Enquiries', value: 0, icon: 'mail', moduleKey: 'enquiries', gridType: 'primary' as const, order: 1, visible: true },
          { id: 'p3', label: 'Active Modules', value: 0, icon: 'check', moduleKey: 'modules', gridType: 'primary' as const, order: 2, visible: true },
          { id: 'p4', label: 'Subscription', value: '0%', icon: 'crown', moduleKey: 'subscription', gridType: 'primary' as const, order: 3, visible: true },
          { id: 'p5', label: 'Total Membership', value: 0, icon: 'users', moduleKey: 'membership', gridType: 'primary' as const, order: 4, visible: true },
          { id: 'p6', label: 'Total Jobs', value: 0, icon: 'briefcase', moduleKey: 'jobs', gridType: 'primary' as const, order: 5, visible: true },
        ],
        secondary: [
          { id: 's1', label: 'Appointments', value: 0, icon: 'calendar', moduleKey: 'appointments', gridType: 'secondary' as const, order: 0, visible: true },
          { id: 's2', label: 'Leads', value: 0, icon: 'users', moduleKey: 'leads', gridType: 'secondary' as const, order: 1, visible: true },
          { id: 's3', label: 'Treatments', value: 0, icon: 'stethoscope', moduleKey: 'treatments', gridType: 'secondary' as const, order: 2, visible: true },
          { id: 's4', label: 'Rooms', value: 0, icon: 'door', moduleKey: 'rooms', gridType: 'secondary' as const, order: 3, visible: true },
          { id: 's5', label: 'Departments', value: 0, icon: 'building', moduleKey: 'departments', gridType: 'secondary' as const, order: 4, visible: true },
        ],
      });
      // Reset charts to default
      setChartComponents({
        'status-charts': [
          { id: 'chart-appointment', type: 'pie' as const, title: 'Appointment Status', section: 'status-charts' as const, order: 0, visible: true },
          { id: 'chart-lead', type: 'pie' as const, title: 'Lead Status', section: 'status-charts' as const, order: 1, visible: true },
          { id: 'chart-offer', type: 'pie' as const, title: 'Offer Status', section: 'status-charts' as const, order: 2, visible: true },
        ],
        'services-overview': [],
        'membership-overview': [],
        'analytics-overview': [
          { id: 'chart-bar', type: 'bar' as const, title: 'Appointments, Leads, Offers & Jobs', section: 'analytics-overview' as const, order: 0, visible: true },
          { id: 'chart-line', type: 'line' as const, title: 'Reviews, Enquiries, Patients & Rooms', section: 'analytics-overview' as const, order: 1, visible: true },
          { id: 'chart-active', type: 'bar' as const, title: 'Active vs Inactive', section: 'analytics-overview' as const, order: 2, visible: true },
        ],
      });
      // Reset stats sections to default
      setStatsSections([
        { id: 'stats-job-types', title: 'Job Types Distribution', order: 0, visible: true },
        { id: 'stats-blog-stats', title: 'Blog Statistics', order: 1, visible: true },
        { id: 'stats-blog-engagement', title: 'Blog Engagement Overview', order: 2, visible: true },
      ]);
    }
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets((items) =>
      items.map((item) =>
        item.id === widgetId ? { ...item, visible: !item.visible } : item
      )
    );
  };

  // Card drag handlers
  const saveCardHistory = () => {
    const newHistory = cardHistory.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(statCards)));
    setCardHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Limit history to 50 items
    if (newHistory.length > 50) {
      setCardHistory(newHistory.slice(-50));
      setHistoryIndex(49);
    }
  };

  const handleCardDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleCardDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Find which grid the active card belongs to
    const activeCard = [...statCards.primary, ...statCards.secondary].find(c => c.id === activeId);
    const overCard = [...statCards.primary, ...statCards.secondary].find(c => c.id === overId);

    if (!activeCard || !overCard) return;

    // Save history before making changes
    saveCardHistory();

    // If cards are in the same grid, just reorder (swap positions) using arrayMove
    if (activeCard.gridType === overCard.gridType) {
      const grid = activeCard.gridType;
      setStatCards((prev) => {
        const gridCards = [...prev[grid]];
        const oldIndex = gridCards.findIndex(c => c.id === activeId);
        const newIndex = gridCards.findIndex(c => c.id === overId);
       
        if (oldIndex === -1 || newIndex === -1) return prev;
       
        const newCards = arrayMove(gridCards, oldIndex, newIndex);
        return {
          ...prev,
          [grid]: newCards.map((card, index) => ({ ...card, order: index })),
        };
      });
    } else {
      // Swap cards between grids - true bidirectional swap
      setStatCards((prev) => {
        const sourceGrid = activeCard.gridType;
        const targetGrid = overCard.gridType;
        const sourceCards = [...prev[sourceGrid]];
        const targetCards = [...prev[targetGrid]];
       
        const sourceIndex = sourceCards.findIndex(c => c.id === activeId);
        const targetIndex = targetCards.findIndex(c => c.id === overId);
       
        if (sourceIndex === -1 || targetIndex === -1) return prev;
       
        // Remove both cards from their grids
        const [movedCard] = sourceCards.splice(sourceIndex, 1);
        const [targetCard] = targetCards.splice(targetIndex, 1);
       
        // Swap: moved card goes to target position, target card goes to source position
        movedCard.gridType = targetGrid;
        targetCard.gridType = sourceGrid;
       
        // Insert at the correct positions (true swap)
        targetCards.splice(targetIndex, 0, movedCard);
        sourceCards.splice(sourceIndex, 0, targetCard);
       
        return {
          ...prev,
          [sourceGrid]: sourceCards.map((card, index) => ({ ...card, order: index })),
          [targetGrid]: targetCards.map((card, index) => ({ ...card, order: index })),
        };
      });
    }
  };

  const toggleCardVisibility = (cardId: string) => {
    saveCardHistory();
    setStatCards((prev) => ({
      primary: prev.primary.map(card =>
        card.id === cardId ? { ...card, visible: !card.visible } : card
      ),
      secondary: prev.secondary.map(card =>
        card.id === cardId ? { ...card, visible: !card.visible } : card
      ),
    }));
  };

  // Chart drag handlers
  const handleChartDragStart = (event: DragStartEvent) => {
    setActiveChartId(event.active.id as string);
  };

  const handleChartDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveChartId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which section the charts belong to
    const activeChart = [...chartComponents['status-charts'], ...chartComponents['analytics-overview']].find(c => c.id === activeId);
    const overChart = [...chartComponents['status-charts'], ...chartComponents['analytics-overview']].find(c => c.id === overId);

    if (!activeChart || !overChart || activeId === overId) return;

    // If charts are in the same section, just reorder (swap positions)
    if (activeChart.section === overChart.section) {
      const section = activeChart.section;
      setChartComponents((prev) => {
        const sectionCharts = [...prev[section]];
        const oldIndex = sectionCharts.findIndex(c => c.id === activeId);
        const newIndex = sectionCharts.findIndex(c => c.id === overId);
        const newCharts = arrayMove(sectionCharts, oldIndex, newIndex);
        const updated = {
          ...prev,
          [section]: newCharts.map((chart, index) => ({ ...chart, order: index })),
        };
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(CHARTS_STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    } else {
      // Swap charts between sections - both items swap positions
      setChartComponents((prev) => {
        const sourceSection = activeChart.section;
        const targetSection = overChart.section;
        const sourceCharts = [...prev[sourceSection]];
        const targetCharts = [...prev[targetSection]];
       
        const sourceIndex = sourceCharts.findIndex(c => c.id === activeId);
        const targetIndex = targetCharts.findIndex(c => c.id === overId);
       
        // Remove both charts from their sections
        const [movedChart] = sourceCharts.splice(sourceIndex, 1);
        const [targetChart] = targetCharts.splice(targetIndex, 1);
       
        // Swap: moved chart goes to target position, target chart goes to source position
        movedChart.section = targetSection;
        targetChart.section = sourceSection;
       
        // Insert at the correct positions
        targetCharts.splice(targetIndex, 0, movedChart);
        sourceCharts.splice(sourceIndex, 0, targetChart);
       
        const updated = {
          ...prev,
          [sourceSection]: sourceCharts.map((chart, index) => ({ ...chart, order: index })),
          [targetSection]: targetCharts.map((chart, index) => ({ ...chart, order: index })),
        };
       
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(CHARTS_STORAGE_KEY, JSON.stringify(updated));
        }
       
        return updated;
      });
    }
  };

  // const toggleChartVisibility = (chartId: string) => {
  //   setChartComponents((prev) => ({
  //     'status-charts': prev['status-charts'].map(chart =>
  //       chart.id === chartId ? { ...chart, visible: !chart.visible } : chart
  //     ),
  //     'services-overview': prev['services-overview'] || [],
  //     'membership-overview': prev['membership-overview'] || [],
  //     'analytics-overview': prev['analytics-overview'].map(chart =>
  //       chart.id === chartId ? { ...chart, visible: !chart.visible } : chart
  //     ),
  //   }));
  // };

  // Package/Offer drag handlers
  const handlePackageOfferDragStart = (event: DragStartEvent) => {
    setActivePackageOfferId(event.active.id as string);
  };

  const handlePackageOfferDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePackageOfferId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    setPackageOfferCards((items) => {
      const oldIndex = items.findIndex(item => item.id === activeId);
      const newIndex = items.findIndex(item => item.id === overId);
     
      if (oldIndex === -1 || newIndex === -1) return items;
     
      // Use arrayMove for proper swapping
      const newItems = arrayMove(items, oldIndex, newIndex);
      const updated = newItems.map((item, index) => ({ ...item, order: index }));
     
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(PACKAGE_OFFER_STORAGE_KEY, JSON.stringify(updated));
      }
     
      return updated;
    });
  };

  // Commented out as unused - packages-offers widget is disabled
  // const togglePackageOfferVisibility = (cardId: string) => {
  //   setPackageOfferCards((prev) => {
  //     const updated = prev.map(card =>
  //       card.id === cardId ? { ...card, visible: !card.visible } : card
  //     );
  //     // Save to localStorage
  //     if (typeof window !== 'undefined') {
  //       localStorage.setItem(PACKAGE_OFFER_STORAGE_KEY, JSON.stringify(updated));
  //     }
  //     return updated;
  //   });
  // };

  // Helper: Convert package card to stat card format (preserves ID for drag tracking)
  const packageToStatCard = (pkg: PackageOfferCard, gridType: 'primary' | 'secondary', order: number): StatCard => {
    const icon = pkg.type === 'package' ? 'package' : 'gift';
    const moduleKey = pkg.type === 'package' ? 'packages' : 'offers';
    return {
      id: pkg.id, // Keep original ID to maintain drag tracking
      label: pkg.title,
      value: pkg.type === 'package' ? (stats.totalPackages || 0) : (stats.totalOffers || 0),
      icon,
      moduleKey,
      gridType,
      order,
      visible: pkg.visible,
    };
  };

  // Helper: Convert stat card to package card format (preserves ID for drag tracking)
  const statToPackageCard = (stat: StatCard, order: number): PackageOfferCard => {
    // Determine type based on moduleKey or label
    let type: 'package' | 'offer' = 'package';
    if (stat.moduleKey === 'offers' || stat.label.toLowerCase().includes('offer')) {
      type = 'offer';
    }
    return {
      id: stat.id, // Keep original ID to maintain drag tracking
      type,
      title: stat.label,
      order,
      visible: stat.visible,
    };
  };

  // Unified handler for cross-type item swapping - ensures true bidirectional swapping
  const handleUnifiedItemDragEnd = (activeId: string, overId: string) => {
    if (activeId === overId) return;

    // Identify active item type and location
    const activeStatCard = [...statCards.primary, ...statCards.secondary].find(c => c.id === activeId);
    const activePackageCard = packageOfferCards.find(c => c.id === activeId);
    const activeChart = [...chartComponents['status-charts'], ...chartComponents['analytics-overview']].find(c => c.id === activeId);

    // Identify over item type and location
    const overStatCard = [...statCards.primary, ...statCards.secondary].find(c => c.id === overId);
    const overPackageCard = packageOfferCards.find(c => c.id === overId);
    const overChart = [...chartComponents['status-charts'], ...chartComponents['analytics-overview']].find(c => c.id === overId);

    // Reset all active states
    setActiveCardId(null);
    setActiveChartId(null);
    setActivePackageOfferId(null);

    // Handle stat card swaps (including with other stat cards) - true swap
    if (activeStatCard) {
      if (overStatCard) {
        // Both are stat cards - ensure proper swap
        saveCardHistory();
        const activeGrid = activeStatCard.gridType;
        const overGrid = overStatCard.gridType;
       
        if (activeGrid === overGrid) {
          // Same grid - reorder within grid
          setStatCards((prev) => {
            const gridCards = [...prev[activeGrid]];
            const oldIndex = gridCards.findIndex(c => c.id === activeId);
            const newIndex = gridCards.findIndex(c => c.id === overId);
            const newCards = arrayMove(gridCards, oldIndex, newIndex);
            return {
              ...prev,
              [activeGrid]: newCards.map((card, index) => ({ ...card, order: index })),
            };
          });
        } else {
          // Different grids - swap between grids
          setStatCards((prev) => {
            const sourceCards = [...prev[activeGrid]];
            const targetCards = [...prev[overGrid]];
           
            const sourceIndex = sourceCards.findIndex(c => c.id === activeId);
            const targetIndex = targetCards.findIndex(c => c.id === overId);
           
            // Remove both cards
            const [movedCard] = sourceCards.splice(sourceIndex, 1);
            const [targetCard] = targetCards.splice(targetIndex, 1);
           
            // Swap: moved card goes to target position, target card goes to source position
            movedCard.gridType = overGrid;
            targetCard.gridType = activeGrid;
           
            // Insert at correct positions
            targetCards.splice(targetIndex, 0, movedCard);
            sourceCards.splice(sourceIndex, 0, targetCard);
           
            return {
              ...prev,
              [activeGrid]: sourceCards.map((card, index) => ({ ...card, order: index })),
              [overGrid]: targetCards.map((card, index) => ({ ...card, order: index })),
            };
          });
        }
        return;
      }
      // Active is stat card, dropped on package/offer - convert and swap positions
      if (overPackageCard) {
        saveCardHistory();
        const statGrid = activeStatCard.gridType;
        const statIndex = statGrid === 'primary'
          ? statCards.primary.findIndex(c => c.id === activeId)
          : statCards.secondary.findIndex(c => c.id === activeId);
        const packageIndex = packageOfferCards.findIndex(c => c.id === overId);

        if (statIndex === -1 || packageIndex === -1) return;

        // Convert both items - true bidirectional swap
        const convertedPackage = statToPackageCard(activeStatCard, packageOfferCards[packageIndex].order);
        const convertedStat = packageToStatCard(overPackageCard, statGrid, activeStatCard.order);
       
        // Swap: stat card position gets package (converted), package position gets stat (converted)
        setStatCards((prev) => {
          const gridCards = [...prev[statGrid]];
          gridCards[statIndex] = convertedStat; // Package card converted to stat card replaces stat card
          return {
            ...prev,
            [statGrid]: gridCards.map((card, index) => ({ ...card, order: index })),
          };
        });

        setPackageOfferCards((prev) => {
          const newCards = [...prev];
          newCards[packageIndex] = convertedPackage; // Stat card converted to package replaces package card
          const updated = newCards.map((card, index) => ({ ...card, order: index }));
          // Save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(PACKAGE_OFFER_STORAGE_KEY, JSON.stringify(updated));
          }
          return updated;
        });
        return;
      }
    }

    // Handle package/offer card swaps
    if (activePackageCard) {
      if (overPackageCard) {
        // Both are package cards - ensure proper swap using arrayMove
        handlePackageOfferDragEnd({ active: { id: activeId } as any, over: { id: overId } as any } as DragEndEvent);
        return;
      }
      // Active is package, dropped on stat card - convert and swap positions
      if (overStatCard) {
        saveCardHistory();
        const packageIndex = packageOfferCards.findIndex(c => c.id === activeId);
        const statGrid = overStatCard.gridType;
        const statIndex = statGrid === 'primary'
          ? statCards.primary.findIndex(c => c.id === overId)
          : statCards.secondary.findIndex(c => c.id === overId);

        if (packageIndex === -1 || statIndex === -1) return;

        // Convert both items - true bidirectional swap
        const convertedStat = packageToStatCard(activePackageCard, statGrid, overStatCard.order);
        const convertedPackage = statToPackageCard(overStatCard, packageOfferCards[packageIndex].order);

        // Swap: package position gets stat (converted), stat position gets package (converted)
        setStatCards((prev) => {
          const gridCards = [...prev[statGrid]];
          gridCards[statIndex] = convertedStat; // Package card converted to stat replaces stat card
          return {
            ...prev,
            [statGrid]: gridCards.map((card, index) => ({ ...card, order: index })),
          };
        });

        setPackageOfferCards((prev) => {
          const newCards = [...prev];
          newCards[packageIndex] = convertedPackage; // Stat card converted to package replaces package card
          const updated = newCards.map((card, index) => ({ ...card, order: index }));
          // Save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(PACKAGE_OFFER_STORAGE_KEY, JSON.stringify(updated));
          }
          return updated;
        });
        return;
      }
    }

    // Handle chart swaps - already has proper swap logic
    if (activeChart && overChart) {
      handleChartDragEnd({ active: { id: activeId } as any, over: { id: overId } as any } as DragEndEvent);
      return;
    }

    // Fallback: try existing handlers based on active item type
    if (activeStatCard && overStatCard) {
      handleCardDragEnd({ active: { id: activeId } as any, over: { id: overId } as any } as DragEndEvent);
    } else if (activeChart && overChart) {
      handleChartDragEnd({ active: { id: activeId } as any, over: { id: overId } as any } as DragEndEvent);
    } else if (activePackageCard && overPackageCard) {
      handlePackageOfferDragEnd({ active: { id: activeId } as any, over: { id: overId } as any } as DragEndEvent);
    }
  };

  // Stats sections drag handlers
  const handleStatsSectionDragStart = (event: DragStartEvent) => {
    setActiveStatsSectionId(event.active.id as string);
  };

  const handleStatsSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveStatsSectionId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    setStatsSections((items) => {
      const oldIndex = items.findIndex((item) => item.id === activeId);
      const newIndex = items.findIndex((item) => item.id === overId);
     
      if (oldIndex === -1 || newIndex === -1) return items;
     
      // Use arrayMove for proper swapping
      const newItems = arrayMove(items, oldIndex, newIndex);
      const reordered = newItems.map((item, index) => ({ ...item, order: index }));
     
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STATS_SECTIONS_STORAGE_KEY, JSON.stringify(reordered));
      }
     
      return reordered;
    });
  };

  const toggleStatsSectionVisibility = (sectionId: string) => {
    setStatsSections((items) =>
      items.map((item) =>
        item.id === sectionId ? { ...item, visible: !item.visible } : item
      )
    );
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setStatCards(JSON.parse(JSON.stringify(cardHistory[newIndex])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < cardHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setStatCards(JSON.parse(JSON.stringify(cardHistory[newIndex])));
    }
  };

  // Fetch daily appointment stats
  useEffect(() => {
    const fetchDailyStats = async () => {
      try {
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
        if (!token) return;

        // Use selectedDate to fetch stats for that specific day
        // Format date as YYYY-MM-DD to match database records
        const formattedDate = selectedDate.toISOString().split('T')[0];
        console.log('Fetching stats for date:', formattedDate);
        const res = await axios.get('/api/clinics/dailyAppointmentStats', {
          params: { date: formattedDate },
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          console.log('API Response:', res.data);
          setDailyStats({
            ...res.data.stats,
            daily: res.data.daily || { patients: 0, jobs: 0, offers: 0, leads: 0, reviews: 0, enquiries: 0, applications: 0, appointments: 0, arrived: 0, booked: 0, cancelled: 0, waiting: 0, enquiry: 0 },
            totals: res.data.totals || { membership: 0, jobs: 0 }
          });
          console.log('Updated dailyStats:', {
            ...res.data.stats,
            daily: res.data.daily || { patients: 0, jobs: 0, offers: 0, leads: 0, reviews: 0, enquiries: 0, applications: 0, appointments: 0, arrived: 0, booked: 0, cancelled: 0, waiting: 0, enquiry: 0 },
            totals: res.data.totals || { membership: 0, jobs: 0 }
          });
        }
      } catch (error) {
        console.error('Error fetching daily stats:', error);
      }
    };

    fetchDailyStats();
  }, [selectedDate]);

  // Fetch filtered appointment stats (unified API for week, month, overall)
  useEffect(() => {
    const fetchFilteredStats = async () => {
      try {
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
        if (!token) return;

        const params: any = { filter: timeRangeFilter };
        
        if (timeRangeFilter === 'week') {
          params.date = selectedDate.toISOString().split('T')[0];
        } else if (timeRangeFilter === 'month') {
          const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
          const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
          params.startDate = startDate.toISOString().split('T')[0];
          params.endDate = endDate.toISOString().split('T')[0];
        }
        // For 'overall' filter, no additional params needed - shows all-time data

        const res = await axios.get('/api/clinics/appointmentStats', {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          setFilteredAppointmentData(res.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching filtered appointment stats:', error);
      }
    };

    fetchFilteredStats();
  }, [timeRangeFilter, selectedDate]);

  // Fetch filtered offer stats (week, month, overall) - runs on mount AND when filter changes
  useEffect(() => {
    console.log('🔵 Offer Filter Changed to:', timeRangeFilter);
    
    // Force clear previous offer status data completely
    setStats(prev => {
      const updated = {
        ...prev,
        offerStatusBreakdown: {}
      };
      console.log('🧹 Cleared offerStatusBreakdown');
      return updated;
    });

    const fetchFilteredOfferStats = async () => {
      try {
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
        if (!token) {
          console.log('⚠️ No token found');
          return;
        }

        const params: any = { filter: timeRangeFilter };
        
        if (timeRangeFilter === 'week') {
          params.date = new Date().toISOString().split('T')[0];
          console.log('📅 Fetching TODAY offer stats for:', params.date);
        } else if (timeRangeFilter === 'month') {
          const now = new Date();
          const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          params.startDate = startDate.toISOString().split('T')[0];
          params.endDate = endDate.toISOString().split('T')[0];
          console.log('📅 Fetching MONTH offer stats:', params.startDate, 'to', params.endDate);
        } else {
          console.log('📅 Fetching OVERALL offer stats (all-time)');
        }
        // For 'overall' filter, no additional params needed - shows all-time data

        const res = await axios.get('/api/clinics/offerStats', {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('📡 API Response:', res.data);
        
        if (res.data.success) {
          console.log('✅ Setting offerStatusBreakdown:', res.data.offerStatusBreakdown);
          // Update the offer status data based on filter
          setStats((prev) => ({
            ...prev,
            offerStatusBreakdown: res.data.offerStatusBreakdown || {}
          }));
        }
      } catch (error) {
        console.error('❌ Error fetching filtered offer stats:', error);
      }
    };

    fetchFilteredOfferStats();
  }, [timeRangeFilter]);

  // Fetch filtered lead stats (unified API for week, month, overall)
  useEffect(() => {
    const fetchFilteredLeadStats = async () => {
      try {
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
        if (!token) return;

        const params: any = { filter: timeRangeFilter };
        
        if (timeRangeFilter === 'week') {
          params.date = selectedDate.toISOString().split('T')[0];
        } else if (timeRangeFilter === 'month') {
          const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
          const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
          params.startDate = startDate.toISOString().split('T')[0];
          params.endDate = endDate.toISOString().split('T')[0];
        }
        // For 'overall' filter, no additional params needed

        const res = await axios.get('/api/clinics/leadStats', {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          setFilteredLeadSourceData(res.data.sourceData || []);
          setFilteredLeadStatusData(res.data.statusData || []);
        }
      } catch (error) {
        console.error('Error fetching filtered lead stats:', error);
      }
    };

    fetchFilteredLeadStats();
  }, [timeRangeFilter, selectedDate]);

  // Fetch billing stats (Top 5 Services & Treatment Services)
  useEffect(() => {
    const fetchBillingStats = async () => {
      try {
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
        if (!token) return;

        const params: any = { filter: timeRangeFilter };
        
        if (timeRangeFilter === 'week') {
          params.date = selectedDate.toISOString().split('T')[0];
        } else if (timeRangeFilter === 'month') {
          const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
          const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
          params.startDate = startDate.toISOString().split('T')[0];
          params.endDate = endDate.toISOString().split('T')[0];
        }
        // For 'overall' filter, no additional params needed

        const res = await axios.get('/api/clinics/billingStats', {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Billing Stats Response:', res.data);
        if (res.data.success) {
          // Handle both real data and mock data field names
          const packagesData = res.data.topPackagesData || res.data.topPackages || [];
          const servicesData = res.data.topServicesData || res.data.topServices || [];
          
          setTopPackagesData(packagesData);
          setTopServicesData(servicesData);
          console.log('Top Packages Data:', packagesData);
          console.log('Top Services Data:', servicesData);
          
          if (res.data.isMockData) {
            console.log('📊 Showing mock billing stats');
          }
        }
      } catch (error) {
        console.error('Error fetching billing stats:', error);
      }
    };

    fetchBillingStats();
  }, [timeRangeFilter, selectedDate]);

  // Fetch membership stats
  useEffect(() => {
    const fetchMembershipStats = async () => {
      try {
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
        if (!token) return;

        const params: any = { filter: timeRangeFilter };
        
        if (timeRangeFilter === 'week') {
          params.date = selectedDate.toISOString().split('T')[0];
        } else if (timeRangeFilter === 'month') {
          const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
          const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
          params.startDate = startDate.toISOString().split('T')[0];
          params.endDate = endDate.toISOString().split('T')[0];
        }
        // For 'overall' filter, no additional params needed

        const res = await axios.get('/api/clinics/membership-stats-new', {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Membership Stats Response:', res.data);
        if (res.data.success) {
          // Handle both real data and mock data field names
          const memData = res.data.membershipData || res.data.data?.membershipData || res.data.data || [];
          setMembershipData(Array.isArray(memData) ? memData : []);
          console.log('Membership Data:', memData);
          
          if (res.data.isMockData) {
            console.log('📊 Showing mock membership stats');
          }
        }
      } catch (error) {
        console.error('Error fetching membership stats:', error);
      }
    };

    fetchMembershipStats();
  }, [timeRangeFilter, selectedDate]);

  // Fetch commission data (summary for staff commissions)
  useEffect(() => {
    const fetchCommissionData = async () => {
      try {
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
        if (!token) return;

        const params: any = { 
          source: 'staff'
        };
        
        if (timeRangeFilter === 'week') {
          params.date = selectedDate.toISOString().split('T')[0];
        } else if (timeRangeFilter === 'month') {
          const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
          const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
          params.startDate = startDate.toISOString().split('T')[0];
          params.endDate = endDate.toISOString().split('T')[0];
        }
        // For 'overall' filter, no additional params needed

        console.log('📡 Fetching commission summary with params:', params);
        
        const res = await axios.get('/api/clinic/commissions/summary', {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Commission Summary Response:', res.data);
        if (res.data.success) {
          const items = res.data.items || [];
          setCommissionData(items);
          setCommissionPage(1); // Reset to first page when data changes
          
          // Calculate commission type statistics for graph
          const typeStats = items.reduce((acc: any, item: any) => {
            const type = item.commissionType || 'flat';
            if (!acc[type]) {
              acc[type] = {
                name: type.replace(/_/g, ' '),
                totalEarned: 0,
                count: 0
              };
            }
            acc[type].totalEarned += item.totalEarned || 0;
            acc[type].count += item.count || 0;
            return acc;
          }, {});
          
          const chartData = Object.values(typeStats).map((stat: any) => ({
            name: stat.name,
            amount: stat.totalEarned,
            count: stat.count
          }));
          
          setCommissionTypeStats(chartData);
          console.log('📊 Commission Type Stats:', chartData);
        }
      } catch (error: any) {
        console.error('❌ Error fetching commission stats:', error.message);
        // If no data or error, set empty array
        setCommissionData([]);
      }
    };

    fetchCommissionData();
  }, [timeRangeFilter, selectedDate]);

  // Fetch Financial Reports Data - Uses existing timeRangeFilter
  useEffect(() => {
    const fetchFinancialReports = async () => {
      try {
        setFinancialLoading(true);
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
        if (!token) return;

        console.log('📊 Fetching financial reports for', timeRangeFilter);
        
        // Calculate date range based on filter
        const endDate = new Date();
        let startDate = new Date();
        
        if (timeRangeFilter === 'today') {
          // Today - set to start of day
          startDate.setHours(0, 0, 0, 0);
          console.log('📅 Today filter: Current day');
        } else if (timeRangeFilter === 'week') {
          // Last 7 days
          startDate.setDate(endDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          console.log('📅 Week filter: Last 7 days');
        } else if (timeRangeFilter === 'month') {
          // Last 30 days
          startDate.setDate(endDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          console.log('📅 Month filter: Last 30 days');
        } else if (timeRangeFilter === 'overall') {
          // Overall - use start of year
          startDate = new Date(new Date().getFullYear(), 0, 1);
          startDate.setHours(0, 0, 0, 0);
          console.log('📅 Overall filter: Start of year', startDate.getFullYear());
        } else {
          // Default to today
          startDate.setHours(0, 0, 0, 0);
          console.log('📅 Default filter: Today');
        }
        
        // Set end time to end of day
        endDate.setHours(23, 59, 59, 999);
        
        console.log('📅 Calculated date range:', { 
          filter: timeRangeFilter,
          startDate: startDate.toISOString(), 
          endDate: endDate.toISOString(),
          startDateReadable: startDate.toLocaleDateString(),
          endDateReadable: endDate.toLocaleDateString()
        });
        
        // Fetch clinic financials + doctor-performance trend together
        const [resFinancial, resPerf] = await Promise.all([
          axios.get('/api/clinics/financialReports', {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              filter: timeRangeFilter
            }
          }),
          axios.get('/api/clinics/doctor-performance', {
            headers: { Authorization: `Bearer ${token}` },
            params: { filter: timeRangeFilter }
          })
        ]);

        const fin = resFinancial.data || {};
        const perf = resPerf.data || {};
        console.log('✅ Financial Reports Response:', fin);
        console.log('✅ Doctor Performance Trend Response:', perf);

        if (fin.success || perf.success) {
          // Handle mock data flag
          if (fin.isMockData || perf.isMockData) {
            console.log('📊 Showing mock financial/doctor performance data');
          }
          
          // Prefer revenueTrend from doctor-performance; fallback to existing if missing
          const revenueTrendData = perf?.data?.revenueTrend ?? fin?.revenueTrendData ?? [];
          // Doctor Revenue now sourced from doctor-performance
          const doctorRevenueData = (perf?.data?.revenuePerDoctor || perf?.data?.data?.revenuePerDoctor || []).map((d: any) => ({
            name: d.doctorName || 'Unknown Doctor',
            revenue: Number(d.estimatedRevenue || d.revenue || 0),
            sessions: d.completedAppointments || d.appointmentCount || d.sessions || 0
          }));
          // Keep sort by revenue desc for chart readability
          doctorRevenueData.sort((a: any, b: any) => b.revenue - a.revenue);
          
          // Handle top services from financial reports
          const topServicesData = fin?.topServicesData || fin?.data?.topServicesData || [];
          
          setFinancialData({
            revenueTrendData,
            paymentMethodsData: fin?.paymentMethodsData || fin?.data?.paymentMethodsData || [],
            doctorRevenueData,
            topServicesData,
          });
          
          console.log('✅ Financial Data Set:', {
            revenueTrendData: revenueTrendData.length,
            paymentMethodsData: (fin?.paymentMethodsData || fin?.data?.paymentMethodsData || []).length,
            doctorRevenueData: doctorRevenueData.length,
            topServicesData: topServicesData.length
          });
        }
      } catch (error) {
        console.error('Error fetching financial reports:', error);
      } finally {
        setFinancialLoading(false);
      }
    };

    fetchFinancialReports();
  }, [timeRangeFilter]);

  // Fetch Patient Reports Data (uses timeRangeFilter like other sections)
  useEffect(() => {
    const fetchPatientReports = async () => {
      try {
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
        if (!token) return;

        // Calculate date range based on timeRangeFilter (same as other sections)
        const params: any = {};
        if (timeRangeFilter === 'today') {
          // Single day
          params.date = selectedDate.toISOString().split('T')[0];
          console.log('📅 Today filter:', params.date);
        } else if (timeRangeFilter === 'week') {
          // Last 7 days
          const endDate = new Date(selectedDate);
          const startDate = new Date(selectedDate);
          startDate.setDate(startDate.getDate() - 6); // 7 days including today
          params.startDate = startDate.toISOString().split('T')[0];
          params.endDate = endDate.toISOString().split('T')[0];
          console.log('📅 Week filter:', params.startDate, 'to', params.endDate);
        } else if (timeRangeFilter === 'month') {
          // Full month
          const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
          const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
          params.startDate = startDate.toISOString().split('T')[0];
          params.endDate = endDate.toISOString().split('T')[0];
          console.log('📅 Month filter:', params.startDate, 'to', params.endDate);
        }
        // For 'overall', no date params - shows all data
        console.log('📅 Patient reports params:', params);

        // Get clinic ID from user context or localStorage
        const clinicId = localStorage.getItem('clinic_id') || localStorage.getItem('clinicId');
        
        console.log('🏥 Fetching patient reports with clinicId:', clinicId);

        const res = await axios.get('/api/clinics/patient-reports', {
          params: {
            ...params,
            clinicId, // Pass as query param as fallback
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'x-clinic-id': clinicId || '',
          },
        });

        if (res.data.success) {
          setPatientDemographics(res.data.data || {
            newVsReturning: [],
            genderDistribution: [],
            patientVisitFrequency: [],
            topPatients: [],
          });
        }
      } catch (error: any) {
        console.error('❌ Error fetching patient reports:', error.message);
        console.error('Response data:', error.response?.data);
        // Set empty data on error to prevent UI crashes
        setPatientDemographics({
          newVsReturning: [],
          genderDistribution: [],
          patientVisitFrequency: [],
          topPatients: [],
        });
      }
    };

    fetchPatientReports();
  }, [timeRangeFilter, selectedDate]);

  // Fetch Service Performance Data
  useEffect(() => {
    const fetchServicePerformance = async () => {
      try {
        setServicePerformanceLoading(true);
        
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
        if (!token) return;

        // Calculate date range based on timeRangeFilter
        const params: any = {};
        if (timeRangeFilter === 'week') {
          params.date = selectedDate.toISOString().split('T')[0];
        } else if (timeRangeFilter === 'month') {
          const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
          const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
          params.startDate = startDate.toISOString().split('T')[0];
          params.endDate = endDate.toISOString().split('T')[0];
        }
        // For 'overall', no date params - shows all data

        // Get clinic ID from localStorage
        const clinicId = localStorage.getItem('clinic_id') || localStorage.getItem('clinicId');
        
        console.log('🏥 Fetching service performance with clinicId:', clinicId);

        const res = await axios.get('/api/clinic/service-performance', {
          params: {
            ...params,
            clinicId,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'x-clinic-id': clinicId || '',
          },
        });

        if (res.data.success) {
          setServicePerformance(res.data.data || {
            mostBookedServices: [],
            leastBookedServices: [],
            serviceRevenueData: [],
            conversionRateData: [],
          });
          console.log('✅ Service performance data loaded:', res.data.data);
        }
      } catch (error: any) {
        console.error('❌ Error fetching service performance:', error.message);
        console.error('Response data:', error.response?.data);
        setServicePerformance({
          mostBookedServices: [],
          leastBookedServices: [],
          serviceRevenueData: [],
          conversionRateData: [],
        });
      } finally {
        setServicePerformanceLoading(false);
      }
    };

    fetchServicePerformance();
  }, [timeRangeFilter, selectedDate]);

  // Migration effect to ensure new components are added to existing localStorage state
  useEffect(() => {
    // Migrate Widgets - Add Patient Reports widget
    setWidgets(prev => {
      const hasPatientReports = prev.some(w => w.type === 'patient-reports');
      if (hasPatientReports) return prev; // Already exists

      // Add patient-reports after appointment-status-overview
      const updatedWidgets = [...prev];
      const appointmentIndex = updatedWidgets.findIndex(w => w.type === 'appointment-status-overview');
      
      if (appointmentIndex !== -1) {
        // Insert after appointment-status-overview
        updatedWidgets.splice(appointmentIndex + 1, 0, {
          id: '14',
          type: 'patient-reports',
          title: 'Patient Reports',
          visible: true,
          order: 4,
        });
        
        // Reorder all widgets after insertion
        return updatedWidgets.map((w, idx) => ({ ...w, order: idx }));
      }
      
      return prev;
    });

    // Migrate Stat Cards
    setStatCards(prev => {
      const hasMembership = prev.primary.some(c => c.moduleKey === 'membership');
      const hasJobs = prev.primary.some(c => c.moduleKey === 'jobs');
      const hasDailyPatients = prev.secondary.some(c => c.moduleKey === 'daily_patients');
      const hasDailyApplications = prev.secondary.some(c => c.moduleKey === 'daily_applications');
      const hasDailyReviews = prev.secondary.some(c => c.moduleKey === 'daily_reviews');
      const hasDailyJobs = prev.secondary.some(c => c.moduleKey === 'daily_jobs');
      const hasDailyLeads = prev.secondary.some(c => c.moduleKey === 'daily_leads');
      const hasDailyEnquiries = prev.secondary.some(c => c.moduleKey === 'daily_enquiries');
     
      // Also hide unwanted cards as per user request
      const unwantedKeys = ['modules', 'subscription'];
      const needsHiding = prev.primary.some(c => c.moduleKey && unwantedKeys.includes(c.moduleKey) && c.visible);

      if (hasMembership && hasJobs && hasDailyPatients && hasDailyApplications && hasDailyReviews && hasDailyJobs && hasDailyLeads && hasDailyEnquiries && !needsHiding) return prev; // Already migrated

      const newPrimary = [...prev.primary];
      if (!hasMembership) {
        newPrimary.push({ id: 'p5', label: 'Total Membership', value: 0, icon: 'users', moduleKey: 'membership', gridType: 'primary' as const, order: newPrimary.length, visible: true });
      }
      if (!hasJobs) {
        newPrimary.push({ id: 'p6', label: 'Total Jobs', value: 0, icon: 'briefcase', moduleKey: 'jobs', gridType: 'primary' as const, order: newPrimary.length, visible: true });
      }
     
      const updatedPrimary = newPrimary.map(card => {
        if (card.moduleKey && unwantedKeys.includes(card.moduleKey)) {
          return { ...card, visible: false };
        }
        return card;
      });

      const newSecondary = [...prev.secondary];
      if (!hasDailyPatients) {
         newSecondary.push({ id: 's8', label: 'Patients', value: 0, icon: 'users', moduleKey: 'daily_patients', gridType: 'secondary' as const, order: 7, visible: true });
         newSecondary.push({ id: 's9', label: 'Offers', value: 0, icon: 'gift', moduleKey: 'daily_offers', gridType: 'secondary' as const, order: 8, visible: true });
         newSecondary.push({ id: 's10', label: 'Arrived', value: 0, icon: 'check-circle', moduleKey: 'daily_arrived', gridType: 'secondary' as const, order: 9, visible: true });
         newSecondary.push({ id: 's11', label: 'Booked', value: 0, icon: 'calendar-check', moduleKey: 'daily_booked', gridType: 'secondary' as const, order: 10, visible: true });
         newSecondary.push({ id: 's12', label: 'Cancelled', value: 0, icon: 'calendar-x', moduleKey: 'daily_cancelled', gridType: 'secondary' as const, order: 11, visible: true });
         newSecondary.push({ id: 's13', label: 'Waiting', value: 0, icon: 'clock', moduleKey: 'daily_waiting', gridType: 'secondary' as const, order: 12, visible: true });
         newSecondary.push({ id: 's14', label: 'Enquiry', value: 0, icon: 'message-square', moduleKey: 'daily_enquiry', gridType: 'secondary' as const, order: 13, visible: true });
      } else {
         // Check for old cards and replace them
         const hasOldCards = prev.secondary.some(c => {
            const oldKeys = ['daily_applications', 'daily_reviews', 'daily_enquiries', 'daily_jobs', 'daily_leads', 'daily_enquiry'];
            return c.moduleKey !== undefined && oldKeys.includes(c.moduleKey);
         });
         if (hasOldCards) {
            // Remove old cards
            const filteredSecondary = prev.secondary.filter(c => {
               const oldKeys = ['daily_applications', 'daily_reviews', 'daily_enquiries', 'daily_jobs', 'daily_leads', 'daily_enquiry'];
               return c.moduleKey === undefined || !oldKeys.includes(c.moduleKey);
            });
            // Add new cards if not present
            if (!filteredSecondary.some(c => c.moduleKey === 'daily_arrived')) {
               filteredSecondary.push({ id: 's10', label: 'Arrived', value: 0, icon: 'check-circle', moduleKey: 'daily_arrived', gridType: 'secondary' as const, order: 9, visible: true });
            }
            if (!filteredSecondary.some(c => c.moduleKey === 'daily_booked')) {
               filteredSecondary.push({ id: 's11', label: 'Booked', value: 0, icon: 'calendar-check', moduleKey: 'daily_booked', gridType: 'secondary' as const, order: 10, visible: true });
            }
            if (!filteredSecondary.some(c => c.moduleKey === 'daily_cancelled')) {
               filteredSecondary.push({ id: 's12', label: 'Cancelled', value: 0, icon: 'calendar-x', moduleKey: 'daily_cancelled', gridType: 'secondary' as const, order: 11, visible: true });
            }
            if (!filteredSecondary.some(c => c.moduleKey === 'daily_waiting')) {
               filteredSecondary.push({ id: 's13', label: 'Waiting', value: 0, icon: 'clock', moduleKey: 'daily_waiting', gridType: 'secondary' as const, order: 12, visible: true });
            }
            if (!filteredSecondary.some(c => c.moduleKey === 'daily_enquiry')) {
               filteredSecondary.push({ id: 's14', label: 'Enquiry', value: 0, icon: 'message-square', moduleKey: 'daily_enquiry', gridType: 'secondary' as const, order: 13, visible: true });
            }
            // Add new daily activity cards if not present
            if (!filteredSecondary.some(c => c.moduleKey === 'daily_jobs')) {
               filteredSecondary.push({ id: 's9', label: 'Jobs', value: 0, icon: 'briefcase', moduleKey: 'daily_jobs', gridType: 'secondary' as const, order: 8, visible: true });
            }
            if (!filteredSecondary.some(c => c.moduleKey === 'daily_leads')) {
               filteredSecondary.push({ id: 's11', label: 'Leads', value: 0, icon: 'users', moduleKey: 'daily_leads', gridType: 'secondary' as const, order: 10, visible: true });
            }
            if (!filteredSecondary.some(c => c.moduleKey === 'daily_reviews')) {
               filteredSecondary.push({ id: 's12', label: 'Reviews', value: 0, icon: 'star', moduleKey: 'daily_reviews', gridType: 'secondary' as const, order: 11, visible: true });
            }
            if (!filteredSecondary.some(c => c.moduleKey === 'daily_enquiries')) {
               filteredSecondary.push({ id: 's13', label: 'Enquiries', value: 0, icon: 'mail', moduleKey: 'daily_enquiries', gridType: 'secondary' as const, order: 12, visible: true });
            }
            return {
               primary: updatedPrimary,
               secondary: filteredSecondary
            };
         }
      }

      return {
        primary: updatedPrimary,
        secondary: newSecondary
      };
    });

    // Migrate Chart Components
    setChartComponents(prev => {
      const hasDailyActivities = prev['status-charts'].some(c => c.id === 'chart-daily-activities');
      if (hasDailyActivities) return prev;

      const newStatusCharts = [...prev['status-charts']];
      newStatusCharts.push({ id: 'chart-daily-activities', type: 'pie' as const, title: 'Daily Activities', section: 'status-charts' as const, order: newStatusCharts.length, visible: true });

      return {
        ...prev,
        'status-charts': newStatusCharts
      };
    });

    // Migrate Widgets - Add Commission Details widget
    setWidgets(prev => {
      const hasCommission = prev.some(w => w.type === 'commission-overview');
      if (hasCommission) return prev;

      const newWidgets = [...prev];
      // Insert commission widget after membership-overview
      const membershipIndex = newWidgets.findIndex(w => w.type === 'membership-overview');
      if (membershipIndex !== -1) {
        newWidgets.splice(membershipIndex + 1, 0, {
          id: '13',
          type: 'commission-overview',
          title: 'Commission Details',
          visible: true,
          order: membershipIndex + 1
        });
        // Reorder remaining widgets
        for (let i = membershipIndex + 2; i < newWidgets.length; i++) {
          newWidgets[i].order = i;
        }
      }

      console.log('✅ Migrated widgets, added commission widget:', newWidgets);
      return newWidgets;
    });
  }, []);

  // Update stat card values when stats or dailyStats change
  useEffect(() => {
    setStatCards((prev) => ({
      primary: prev.primary.map(card => {
        let value: number | string = 0;
        switch (card.moduleKey) {
          case 'reviews':
            value = stats.totalReviews;
            break;
          case 'enquiries':
            value = stats.totalEnquiries;
            break;
          case 'modules':
            value = navigationItems.length;
            break;
          case 'subscription':
            value = `${subscriptionSummary.subscriptionPercentage}%`;
            break;
          case 'membership':
            value = dailyStats.totals?.membership || 0;
            break;
          case 'jobs':
            value = dailyStats.totals?.jobs || 0;
            break;
          case 'leads':
            value = stats.totalLeads || 0;
            break;
        }
        return { ...card, value };
      }),
      secondary: prev.secondary.map(card => {
        let value: number | string = 0;
        switch (card.moduleKey) {
          case 'appointments':
            // Sum of daily stats
            value = dailyStats.booked + dailyStats.arrived + dailyStats.consultation + dailyStats.cancelled + dailyStats.discharge;
            break;
          case 'leads':
            value = stats.totalLeads || 0;
            break;
          case 'booked':
            value = dailyStats.booked;
            break;
          case 'arrived':
            value = dailyStats.arrived;
            break;
          case 'consultation':
            value = dailyStats.consultation;
            break;
          case 'cancelled':
            value = dailyStats.cancelled;
            break;
          case 'discharge':
            value = dailyStats.discharge;
            break;
          case 'daily_patients':
            value = dailyStats.daily.patients || 0;
            break;
          case 'daily_appointments':
            // Calculate total appointments from all statuses
            const booked = dailyStats.daily.booked || 0;
            const cancelled = dailyStats.daily.cancelled || 0;
            const arrived = dailyStats.daily.arrived || 0;
            const waiting = dailyStats.daily.waiting || 0;
            const enquiry = dailyStats.daily.enquiry || 0;
            value = booked + cancelled + arrived + waiting + enquiry;
            console.log('Total Appointments:', value, '(Booked:', booked, '+ Cancelled:', cancelled, '+ Arrived:', arrived, '+ Waiting:', waiting, '+ Enquiry:', enquiry, ')');
            break;
          case 'daily_offers':
            console.log('Setting daily_offers value:', dailyStats.daily.offers || 0);
            value = dailyStats.daily.offers || 0;
            break;
          case 'daily_arrived':
            value = dailyStats.daily.arrived || 0;
            break;
          case 'daily_booked':
            value = dailyStats.daily.booked || 0;
            break;
          case 'daily_cancelled':
            value = dailyStats.daily.cancelled || 0;
            break;
          case 'daily_waiting':
            value = dailyStats.daily.waiting || 0;
            break;
          case 'daily_enquiry':
            value = dailyStats.daily.enquiry || 0;
            break;
          case 'daily_jobs':
            value = dailyStats.daily.jobs || 0;
            break;
          case 'daily_leads':
            value = dailyStats.daily.leads || 0;
            break;
          case 'daily_reviews':
            value = dailyStats.daily.reviews || 0;
            break;
          case 'daily_enquiries':
            value = dailyStats.daily.enquiries || 0;
            break;
        }
        return { ...card, value };
      }),
    }));
  }, [stats, dailyStats, navigationItems.length, subscriptionSummary.subscriptionPercentage]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isEditMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, historyIndex, cardHistory.length]);

  // Sortable Widget Component
  const SortableWidget: React.FC<{
    widget: DashboardWidget;
    children: React.ReactNode;
  }> = ({ widget, children }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: widget.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : 1,
    };

    if (!widget.visible && !isEditMode) {
      return null;
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`relative ${isDragging ? 'z-50 ring-2 ring-teal-500 ring-opacity-50' : ''} ${!widget.visible ? 'opacity-50' : ''}`}
      >
        {isEditMode && (
          <>
            {/* teal grip icon and eye icon outside the div for section-level control */}
            <div className="absolute top-1/2 -left-10 transform -translate-y-1/2 z-50 flex flex-col gap-2">
              {/* Eye icon for show/hide section */}
              <button
                onClick={() => toggleWidgetVisibility(widget.id)}
                className="p-1 bg-white rounded-full shadow-xl border-2 border-gray-300 hover:bg-gray-50 transition-all hover:scale-110 z-50"
                title={widget.visible ? 'Hide section' : 'Show section'}
                style={{ borderWidth: '2px' }}
              >
                {widget.visible ? (
                  <Eye className="w-3 h-3 text-gray-700" />
                ) : (
                  <EyeOff className="w-3 h-3 text-gray-400" />
                )}
              </button>
              {/* teal grip icon for section-level swapping */}
              <div
                {...attributes}
                {...listeners}
                className="p-2.5 bg-gradient-to-br from-red-500 to-blue-600 rounded-full shadow-2xl cursor-grab active:cursor-grabbing hover:from-teal-600 hover:to-teal-700 transition-all border-2 border-white hover:scale-110 z-50"
                title="Drag to reorder entire section"
              >
                <GripVertical className="w-3 h-3 text-white" />
              </div>
            </div>
          </>
        )}
        {children}
      </div>
    );
  };

  // Sortable Stats Section Component
  const SortableStatsSection: React.FC<{
    section: StatsSection;
    isEditMode: boolean;
    onToggleVisibility: (id: string) => void;
    children: React.ReactNode;
  }> = ({ section, isEditMode, onToggleVisibility, children }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: section.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    if (!section.visible && !isEditMode) {
      return null;
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`relative ${isDragging ? 'z-50' : ''} ${!section.visible ? 'opacity-50' : ''}`}
      >
        {isEditMode && (
          <div className="absolute top-2 left-2 z-30 flex flex-col gap-1.5">
            <button
              onClick={() => onToggleVisibility(section.id)}
              className="p-1 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              title={section.visible ? 'Hide section' : 'Show section'}
            >
              {section.visible ? (
                <Eye className="w-3 h-3 text-gray-600" />
              ) : (
                <EyeOff className="w-3 h-3 text-gray-400" />
              )}
            </button>
            <div
              {...attributes}
              {...listeners}
              className="p-1.5 bg-teal-500 rounded-full shadow-lg cursor-grab active:cursor-grabbing hover:bg-teal-600 transition-colors"
              title="Drag to move section"
            >
              <GripVertical className="w-3 h-3 text-white" />
            </div>
            {chartComponents['analytics-overview'].find(c => c.id === 'chart-daily-appointment')?.visible && (
              <div className="h-80 mt-6 border-t border-gray-100 pt-6">
                <h3 className="text-base font-semibold text-teal-800 mb-4">Daily Appointment Status</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyAppointmentChartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '11px'
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="value"
                        position="top"
                        fill="#1f2937"
                        fontSize={11}
                        fontWeight={500}
                      />
                      {dailyAppointmentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
        <div className={isEditMode ? 'pl-14' : ''}>
          {children}
        </div>
      </div>
    );
  };

  // Sortable Package/Offer Card Component (commented out as unused - packages-offers widget is disabled)
  // const SortablePackageOffer: React.FC<{
  //   card: PackageOfferCard;
  //   children: React.ReactNode;
  // }> = ({ card, children }) => {
  //   const {
  //     attributes,
  //     listeners,
  //     setNodeRef,
  //     transform,
  //     transition,
  //     isDragging,
  //   } = useSortable({ id: card.id });
  //
  //   const style = {
  //     transform: CSS.Transform.toString(transform),
  //     transition,
  //     opacity: isDragging ? 0.5 : 1,
  //   };
  //
  //   if (!card.visible && !isEditMode) {
  //     return null;
  //   }
  //
  //   return (
  //     <div
  //       ref={setNodeRef}
  //       style={style}
  //       className={`relative ${isDragging ? 'z-50' : ''} ${!card.visible ? 'opacity-50' : ''}`}
  //     >
  //       {isEditMode && (
  //         <div className="absolute top-2 left-2 z-30 flex flex-col gap-1.5">
  //           <button
  //             onClick={() => togglePackageOfferVisibility(card.id)}
  //             className="p-1 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
  //             title={card.visible ? 'Hide card' : 'Show card'}
  //           >
  //             {card.visible ? (
  //               <Eye className="w-3 h-3 text-gray-600" />
  //             ) : (
  //               <EyeOff className="w-3 h-3 text-gray-400" />
  //             )}
  //           </button>
  //           <div
  //             {...attributes}
  //             {...listeners}
  //             className="p-1.5 bg-indigo-500 rounded-full shadow-lg cursor-grab active:cursor-grabbing hover:bg-indigo-600 transition-colors"
  //             title="Drag to move card"
  //           >
  //             <GripVertical className="w-3.5 h-3.5 text-white" />
  //           </div>
  //         </div>
  //       )}
  //       <div className={isEditMode ? 'pl-14' : ''}>
  //         {children}
  //       </div>
  //     </div>
  //   );
  // };

  // Sortable Chart Component (commented out as unused)
  // const SortableChart: React.FC<{
  //   chart: ChartComponent;
  //   children: React.ReactNode;
  // }> = ({ chart, children }) => {
  //   const {
  //     attributes,
  //     listeners,
  //     setNodeRef,
  //     transform,
  //     transition,
  //     isDragging,
  //   } = useSortable({ id: chart.id });

  //   const style = {
  //     transform: CSS.Transform.toString(transform),
  //     transition,
  //     opacity: isDragging ? 0.5 : 1,
  //   };

  //   if (!chart.visible && !isEditMode) {
  //     return null;
  //   }

  //   return (
  //     <div
  //       ref={setNodeRef}
  //       style={style}
  //       className={`relative ${isDragging ? 'z-50' : ''} ${!chart.visible ? 'opacity-50' : ''}`}
  //     >
  //       {isEditMode && (
  //         <div className="absolute top-2 left-2 z-30 flex flex-col gap-1.5">
  //           <button
  //             onClick={() => toggleChartVisibility(chart.id)}
  //             className="p-1 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
  //             title={chart.visible ? 'Hide chart' : 'Show chart'}
  //           >
  //             {chart.visible ? (
  //               <Eye className="w-3 h-3 text-gray-600" />
  //             ) : (
  //               <EyeOff className="w-3 h-3 text-gray-400" />
  //             )}
  //           </button>
  //           <div
  //             {...attributes}
  //             {...listeners}
  //             className="p-1.5 bg-orange-500 rounded-full shadow-lg cursor-grab active:cursor-grabbing hover:bg-orange-600 transition-colors"
  //             title="Drag to move chart"
  //           >
  //             <GripVertical className="w-3.5 h-3.5 text-white" />
  //           </div>
  //         </div>
  //       )}
  //       <div className={isEditMode ? 'pl-14' : ''}>
  //         {children}
  //       </div>
  //     </div>
  //   );
  // };

  // Sortable Stat Card Component
  const SortableStatCard: React.FC<{
    card: StatCard;
  }> = ({ card }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: card.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    if (!card.visible && !isEditMode) {
      return null;
    }

    const iconMap: { [key: string]: React.ReactNode } = {
      star: <Star className="w-5 h-5" />,
      mail: <Mail className="w-5 h-5" />,
      check: <CheckCircle2 className="w-5 h-5" />,
      crown: <Crown className="w-5 h-5" />,
      calendar: <Calendar className="w-5 h-5" />,
      users: <Users className="w-5 h-5" />,
      stethoscope: <Stethoscope className="w-5 h-5" />,
      door: <DoorOpen className="w-5 h-5" />,
      building: <Building2 className="w-5 h-5" />,
      package: <Package className="w-5 h-5" />,
      gift: <Gift className="w-5 h-5" />,
      briefcase: <Briefcase className="w-5 h-5" />,
      'file-text': <FileText className="w-5 h-5" />,
      'message-square': <MessageSquare className="w-5 h-5" />,
    };

    const paddingClass = gridSize === 'compact' ? 'p-3' : gridSize === 'spacious' ? 'p-6' : 'p-4';
       
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`relative h-full ${isDragging ? 'z-50 ring-2 ring-teal-500 ring-opacity-50' : ''} ${!card.visible ? 'opacity-50' : ''} bg-white`}
      >
        <div className={`${paddingClass} border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 group relative overflow-hidden h-full flex flex-col justify-between`}>
          {isEditMode && (
            <div className="absolute top-2 left-2 z-30 flex flex-col gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCardVisibility(card.id);
                }}
                className="p-1 bg-white rounded-full shadow border border-gray-200 hover:bg-gray-50 transition-colors z-40"
                title={card.visible ? 'Hide card' : 'Show card'}
              >
                {card.visible ? (
                  <Eye className="w-3 h-3 text-gray-600" />
                ) : (
                  <EyeOff className="w-3 h-3 text-gray-400" />
                )}
              </button>
              <div
                {...attributes}
                {...listeners}
                className="p-2 bg-teal-500 rounded-full shadow cursor-grab active:cursor-grabbing hover:bg-teal-600 transition-colors transform hover:scale-105 z-40"
                title="Drag to move or swap cards"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-0.5 text-[10px] font-semibold rounded-full flex items-center gap-1 z-10">
            <CheckCircle2 className="w-2.5 h-2.5" />
            ACTIVE
          </div>
          <div className={`pt-4 ${isEditMode ? 'pl-14' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <div className="text-gray-700">{iconMap[card.icon] || <Activity className="w-5 h-5" />}</div>
              </div>
            </div>
            <h3 className="text-[10px] font-medium text-gray-600 mb-1.5 uppercase tracking-wide">{card.label}</h3>
            {statsLoading ? (
              <div className="flex items-center gap-1.5">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                <span className="text-[11px] text-gray-600">Loading...</span>
              </div>
            ) : (
              <>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
                <p className={`text-[10px] text-gray-500 mt-0.5 ${card.value === 0 ? '' : 'invisible'}`}>No data</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-700">Loading dashboard..</p>
        </div>
      </div>
    );
  }

  // Show loading state while permissions are being fetched
  if (!permissionsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm max-w-md w-full p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Loading...</h2>
          <p className="text-sm text-gray-700">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show access denied if read permission is false
  if (!moduleAccess.canRead || accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm max-w-md w-full p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-700 mb-4">
            {accessMessage || 'You do not have permission to view the clinic dashboard.'}
          </p>
          <p className="text-xs text-gray-600">
            Please contact your administrator to request access to the Dashboard module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Mock Data Banner */}
      {isShowingMockData && (
        <div className="mb-4 mt-3 mx-2 sm:mx-4 lg:mx-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 sm:p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  🎉 Welcome! Showing Sample Data
                </h3>
                <p className="text-xs sm:text-sm text-blue-700">
                  This is sample data to help you understand how the dashboard works. 
                  Start creating appointments, leads, and patients to see your real data appear!
                </p>
              </div>
              <button
                onClick={() => setIsShowingMockData(false)}
                className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Dashboard Layout */}
      <div className="w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Dashboard Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-teal-800 mb-1">
                {clinicInfo.name || 'Clinic Dashboard'}
              </h1>
              <div className="flex items-center gap-3 text-sm text-teal-600">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>{clinicInfo.ownerName || clinicUser?.name || 'N/A'}</span>
                </div>
                <span> </span>
                <span className="font-semibold">{formatTime(currentTime)}</span>
              </div>
            </div>

            {/* Date Picker Center */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => {
                  const week = new Date();
                  setSelectedDate(week);
                }}
                className="px-2 py-1 hover:bg-gray-100 rounded text-gray-600 transition-colors text-xs font-medium"
                title="Go to Today"
              >
                Today
              </button>
              <div className="relative">
                <div
                  className="flex items-center gap-0 px-3 py-1 cursor-pointer hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <span className="text-sm font-medium text-gray-700">
                    {selectedDate.toLocaleDateString('en-GB').replace(/\//g, '-')}
                  </span>
                </div>
               
                {/* Calendar Dropdown */}
                {showCalendar && (
                  <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64 calendar-container">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateMonth('prev');
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium text-gray-700">
                        {selectedDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateMonth('next');
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {renderCalendar()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isEditMode ? (
                <>
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                    <button
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className="p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={historyIndex >= cardHistory.length - 1}
                      className="p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Redo (Ctrl+Y)"
                    >
                      <Redo2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <button
                    onClick={handleSaveLayout}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleResetLayout}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <>
            <div className="bg-yellow-400 text-white px-4 py-2 rounded-lg">
              <p className="text-sm font-medium">{getGreeting()}</p>
            </div>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Customize</span>
                  </button>
                </>
              )}
          </div>
          </div>
          {isEditMode && (
            <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
              <p className="text-sm text-teal-800">
                <strong>Edit Mode:</strong> Drag widgets (teal grip) to reorder sections. Drag stat cards (teal grip) to move between grids. Drag charts (orange grip) to reorder. Drag stats sections (teal grip) to reorder. Use eye icons to show/hide. Keyboard: Ctrl+Z (undo), Ctrl+Y (redo).
              </p>
            </div>
          )}
        </div>

        {/* Filter Bar - Department, Doctor, Service, Last 30 Days */}
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportDashboard}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              title="Export dashboard data"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefreshDashboard}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              title="Refresh dashboard"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>

            {/* Time Range Filter */}
            <select
              value={timeRangeFilter}
              onChange={(e) => setTimeRangeFilter(e.target.value as 'today' | 'week' | 'month' | 'overall')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              title="Select time range for all graphs"
            >
              <option value="today">Today</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="overall">Overall</option>
            </select>

            {/* Clear Filters Button */}
            {(searchQuery || timeRangeFilter !== 'today') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTimeRangeFilter('today');
                }}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
                title="Clear all filters"
              >
                <X className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {/* Active Filters Display */}
          {(searchQuery || timeRangeFilter !== 'today') && (
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {timeRangeFilter === 'week' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md text-xs font-medium">
                  Week
                  <button onClick={() => setTimeRangeFilter('today')} className="hover:bg-indigo-200 dark:hover:bg-indigo-800/50 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {timeRangeFilter === 'month' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-xs font-medium">
                  Month
                  <button onClick={() => setTimeRangeFilter('today')} className="hover:bg-green-200 dark:hover:bg-green-800/50 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {timeRangeFilter === 'overall' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-xs font-medium">
                  Overall
                  <button onClick={() => setTimeRangeFilter('today')} className="hover:bg-red-200 dark:hover:bg-red-800/50 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Unified Drag and Drop Context - handles both widget-level and item-level drags */}
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleUnifiedDragStart}
          onDragEnd={handleUnifiedDragEnd}
        >
          <SortableContext
            items={[
              ...widgets.map((w) => w.id),
              ...statCards.primary.map(c => c.id),
              ...statCards.secondary.map(c => c.id),
              ...packageOfferCards.map(c => c.id),
              ...chartComponents['status-charts'].map(c => c.id),
              ...chartComponents['analytics-overview'].map(c => c.id),
            ]}
            strategy={verticalListSortingStrategy}
          >
            <div className={`space-y-6 ${isEditMode ? 'pl-12' : ''}`}>
              {widgets
                .sort((a, b) => {
                  // If searching and section matches, move it to top
                  if (searchQuery.trim() && matchingSectionIds.length > 0) {
                    const aMatches = matchingSectionIds.includes(a.type);
                    const bMatches = matchingSectionIds.includes(b.type);
                    
                    if (aMatches && !bMatches) return -1; // a goes first
                    if (!aMatches && bMatches) return 1;  // b goes first
                  }
                  return a.order - b.order; // Default sort by order
                })
                .map((widget) => {
                  const widgetContent = (() => {
                    switch (widget.type) {
                      // COMMENTED OUT: Packages & Offers Widget - Temporarily disabled
                      case 'packages-offers':
                        return null;
                      /* 
                      const sortedPackageOfferCards = packageOfferCards.sort((a, b) => a.order - b.order);
                      ... [rest of packages-offers code commented out - lines 4190-4283] ...
                      */
                      
                      case 'financial-reports':
                        // Financial Reports Section - Revenue, Payments, and Financial Performance
                        if (financialLoading) {
                          return (
                            <div className="mb-8 p-8 text-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                              <p className="mt-4 text-gray-600">Loading financial reports...</p>
                            </div>
                          );
                        }
                        return (
                          <div className="mb-8">
                            <div className="mb-5">
                              <h2 className="text-xl font-bold text-black mb-1">Financial Reports</h2>
                              <p className="text-sm text-gray-500">Track revenue, payments, and financial performance</p>
                            </div>
                        
                        {/* 2x2 Grid Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* Card 1: Revenue Trend (Line Chart) */}
                          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <div className="mb-4">
                              <h3 className="text-base font-bold text-black">Revenue Trend</h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {timeRangeFilter === 'overall' ? 'Monthly revenue vs target' : 'Daily revenue vs target'}
                              </p>
                            </div>
                            <div className="h-72">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={financialData.revenueTrendData || []}
                                  margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
                                >
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
                                    tickFormatter={(value) => `${getCurrencySymbol(currency)}${(value/1000).toFixed(0)}K`}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: '#fff',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '8px',
                                      fontSize: '12px',
                                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    labelStyle={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}
                                    formatter={(value: any) => [`${getCurrencySymbol(currency)}${value.toLocaleString()}`, '']}
                                  />
                                  <Legend 
                                    wrapperStyle={{ 
                                      fontSize: '10px', 
                                      paddingTop: '10px',
                                      color: '#4b5563'
                                    }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ fill: '#3b82f6', r: 4 }}
                                    activeDot={{ r: 6 }}
                                    name="Revenue"
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="target"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                    name="Target"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Card 2: Payment Methods (Donut Chart) */}
                          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <div className="mb-4">
                              <h3 className="text-base font-bold text-black">Payment Methods</h3>
                              <p className="text-xs text-gray-500 mt-1">Distribution by payment type</p>
                            </div>
                            <div className="h-72 sm:h-72">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={financialData.paymentMethodsData || []}
                                    cx={isMobile ? "50%" : "40%"}
                                    cy="50%"
                                    innerRadius={isMobile ? 40 : 50}
                                    outerRadius={isMobile ? 70 : 80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                    labelLine={false}
                                  >
                                    {(financialData.paymentMethodsData || []).map((entry: any, index: number) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: '#fff',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '8px',
                                      fontSize: '12px',
                                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    formatter={(value: any, name: any) => [`${value}%`, name || 'Payment Method']}
                                  />
                                  <Legend 
                                    layout={isMobile ? "horizontal" : "vertical"}
                                    verticalAlign={isMobile ? "bottom" : "middle"}
                                    align={isMobile ? "center" : "right"}
                                    wrapperStyle={{ 
                                      fontSize: isMobile ? '10px' : '11px',
                                      paddingLeft: isMobile ? '0px' : '20px',
                                      color: '#4b5563',
                                      lineHeight: '20px'
                                    }}
                                    formatter={(value: any) => {
                                      const item = (financialData.paymentMethodsData || []).find((d: any) => d.name === value);
                                      return `${value}: ${item ? item.value : 0}%`;
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Card 3: Doctor Revenue (Bar Chart) */}
                          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <div className="mb-4">
                              <h3 className="text-base font-bold text-black">Doctor Revenue</h3>
                              <p className="text-xs text-gray-500 mt-1">Revenue generated by each doctor</p>
                            </div>
                            <div className="h-72">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={financialData.doctorRevenueData.length > 0 ? financialData.doctorRevenueData : []}
                                  margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                  <XAxis 
                                    dataKey="name" 
                                    tick={{ fontSize: 10, fill: '#6b7280' }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                  />
                                  <YAxis 
                                    tick={{ fontSize: 10, fill: '#6b7280' }}
                                    tickFormatter={(value) => `${getCurrencySymbol(currency)}${(value/1000).toFixed(0)}K`}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: '#fff',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '8px',
                                      fontSize: '12px',
                                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    labelStyle={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}
                                    formatter={(value: any, name: any) => {
                                      if (name === 'revenue') {
                                        return [`${getCurrencySymbol(currency)}${value.toLocaleString()}`, 'Revenue'];
                                      }
                                      return [value, name];
                                    }}
                                  />
                                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                  <Bar
                                    dataKey="revenue"
                                    fill="#3b82f6"
                                    name="Revenue"
                                    radius={[6, 6, 0, 0]}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Card 4: Top Services Revenue (Table) */}
                          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <div className="mb-4">
                              <h3 className="text-base font-bold text-black">Top Services Revenue</h3>
                              <p className="text-xs text-gray-500 mt-1">Best-performing services by revenue</p>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="min-w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service Name</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Sessions</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {financialData.topServicesData.length > 0 ? (
                                    financialData.topServicesData.slice(0, 5).map((service, index) => (
                                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <span className="text-sm font-medium text-gray-900">{service.name || 'N/A'}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                          <span className="text-sm text-gray-700">{typeof service.sessions === 'number' ? service.sessions : 0}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                          <span className="text-sm font-semibold text-teal-600">{getCurrencySymbol(currency)}{(typeof service.revenue === 'number' ? service.revenue : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                        No service data available
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                          </div>
                        );
                      
                      {/* COMMENTED OUT: Primary Stats Cards - Reviews, Enquiries, Jobs, Leads now in Today's Activity */}
                      {/* case 'primary-stats':
                        const primaryCards = statCards.primary.sort((a, b) => a.order - b.order);
                        const gapClass = gridSize === 'compact' ? 'gap-1.5' : gridSize === 'spacious' ? 'gap-4' : 'gap-3';
                        return (
                              <div className={`grid grid-cols-2 sm:grid-cols-5 ${gapClass}`}>
                                {primaryCards.map((card) => (
                                  <SortableStatCard key={card.id} card={card} />
                                ))}
            </div>
                        ); */}
                     
                      case 'secondary-stats':
                        const secondaryCards = statCards.secondary.sort((a, b) => a.order - b.order);
                        const dailyCards = secondaryCards.filter(card => card.moduleKey?.startsWith('daily_'));
                        const otherCards = secondaryCards.filter(card => !card.moduleKey?.startsWith('daily_'));
                        const gapClass2 = gridSize === 'compact' ? 'gap-1.5' : gridSize === 'spacious' ? 'gap-4' : 'gap-3';
                        
                        // Icon mapping for Today's Data section
                        const iconMap: { [key: string]: React.ReactNode } = {
                          calendar: <Calendar className="w-5 h-5" />,
                          users: <Users className="w-5 h-5" />,
                          stethoscope: <Stethoscope className="w-5 h-5" />,
                          briefcase: <Briefcase className="w-5 h-5" />,
                          'file-text': <FileText className="w-5 h-5" />,
                          crown: <Crown className="w-5 h-5" />,
                          gift: <Gift className="w-5 h-5" />,
                          package: <Package className="w-5 h-5" />,
                          star: <Star className="w-5 h-5" />,
                          mail: <Mail className="w-5 h-5" />,
                          'check-circle': <CheckCircle2 className="w-5 h-5" />,
                          'calendar-check': <Calendar className="w-5 h-5" />,
                          'calendar-x': <X className="w-5 h-5" />,
                          clock: <Clock className="w-5 h-5" />,
                          'message-square': <MessageSquare className="w-5 h-5" />,
                        };

                        // Get appointment status label
                        const getAppointmentStatusLabel = (moduleKey: string | undefined, originalLabel: string) => {
                          if (!moduleKey) return originalLabel;
                          
                          // Map appointment status module keys to their display names
                          const appointmentStatusMap: { [key: string]: string } = {
                            'daily_appointments': 'Appointments',
                            'daily_arrived': 'Appointments (Arrived)',
                            'daily_booked': 'Appointments (Booked)',
                            'daily_cancelled': 'Appointments (Cancelled)',
                            'daily_waiting': 'Appointments (Waiting)',
                            'daily_enquiry': 'Appointments (Enquiry)'
                          };
                          
                          return appointmentStatusMap[moduleKey] || originalLabel;
                        };

                        // Gradient backgrounds for different metrics
                        const getGradientBg = (moduleKey: string | undefined) => {
                          if (!moduleKey) return 'from-gray-500 to-slate-500';
                          if (moduleKey === 'daily_patients') return 'from-green-500 to-emerald-500';
                          if (moduleKey === 'daily_offers') return 'from-pink-500 to-rose-500';
                          if (moduleKey === 'daily_jobs') return 'from-blue-500 to-indigo-500';
                          if (moduleKey === 'daily_leads') return 'from-purple-500 to-violet-500';
                          if (moduleKey === 'daily_reviews') return 'from-yellow-500 to-amber-500';
                          if (moduleKey === 'daily_enquiries') return 'from-teal-500 to-cyan-500';
                          if (moduleKey === 'daily_arrived') return 'from-blue-500 to-cyan-500';
                          if (moduleKey === 'daily_booked') return 'from-purple-500 to-indigo-500';
                          if (moduleKey === 'daily_cancelled') return 'from-red-500 to-rose-500';
                          if (moduleKey === 'daily_waiting') return 'from-orange-500 to-amber-500';
                          if (moduleKey === 'daily_enquiry') return 'from-teal-500 to-green-500';
                          if (moduleKey.includes('appointment')) return 'from-blue-500 to-cyan-500';
                          if (moduleKey.includes('patient')) return 'from-green-500 to-emerald-500';
                          if (moduleKey.includes('doctor')) return 'from-purple-500 to-pink-500';
                          if (moduleKey.includes('job')) return 'from-orange-500 to-red-500';
                          if (moduleKey.includes('lead')) return 'from-indigo-500 to-purple-500';
                          if (moduleKey.includes('membership')) return 'from-yellow-500 to-orange-500';
                          if (moduleKey.includes('offer')) return 'from-pink-500 to-rose-500';
                          if (moduleKey.includes('package')) return 'from-teal-500 to-green-500';
                          if (moduleKey.includes('review')) return 'from-amber-500 to-yellow-500';
                          return 'from-gray-500 to-slate-500';
                        };

                        return (
                              <div className="space-y-6">
                                {/* Other secondary cards - 5 column grid */}
                                {otherCards.length > 0 && (
                                  <div>
                                    <div className={`grid grid-cols-2 sm:grid-cols-5 ${gapClass2}`}>
                                      {otherCards.map((card) => (
                                        <SortableStatCard key={card.id} card={card} />
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Today's Data Section - Compact Design */}
                                {dailyCards.length > 0 && (
                                  <div className="mt-8">
                                    <div className="relative mb-3">
                                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t-2 border-gray-200"></div>
                                      </div>
                                      <div className="relative flex justify-center">
                                        <span className="px-4 bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          Today's Activity
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* Grid Layout for Today's Cards - 4 columns */}
                                    <div className={`grid grid-cols-2 sm:grid-cols-4 ${gapClass2}`}>
                                      {dailyCards.map((card, index) => (
                                        <div
                                          key={card.id}
                                          className="group relative overflow-hidden rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                                          style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                          <div className="flex flex-col items-center p-4">
                                            {/* Gradient Icon Circle */}
                                            <div className={`w-14 h-14 bg-gradient-to-br ${getGradientBg(card.moduleKey)} rounded-full flex items-center justify-center relative overflow-hidden mb-3 shadow-md group-hover:shadow-lg transition-shadow duration-300`}>
                                              <div className="absolute inset-0 bg-white opacity-20 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                              <div className="text-white p-2 relative z-10">
                                                {iconMap[card.icon] || <Activity className="w-5 h-5" />}
                                              </div>
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="text-center w-full">
                                              {card.moduleKey === 'daily_appointments' ? (
                                                <>
                                                  <h4 className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1 line-clamp-2 min-h-[20px]">
                                                    Appointments
                                                  </h4>
                                                  <div className="flex items-center justify-center gap-1">
                                                    <p className="text-xl font-bold text-gray-900">
                                                      {card.value}
                                                    </p>
                                                    {card.value === 0 && (
                                                      <span className="text-[10px] text-gray-400 italic">No data</span>
                                                    )}
                                                  </div>
                                                </>
                                              ) : (
                                                <>
                                                  <h4 className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1 line-clamp-2 min-h-[20px]">
                                                    {getAppointmentStatusLabel(card.moduleKey, card.label)}
                                                  </h4>
                                                  <div className="flex items-center justify-center gap-1">
                                                    <p className="text-xl font-bold text-gray-900">
                                                      {card.value}
                                                    </p>
                                                    {card.value === 0 && (
                                                      <span className="text-[10px] text-gray-400 italic">No data</span>
                                                    )}
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                            
                                            {/* Bottom Accent Line */}
                                            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getGradientBg(card.moduleKey)} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                        );

                      case 'financial-reports':
                        // Financial Reports Section - Revenue, Payments, and Financial Performance
                        return (
                          <div className="mb-8">
                            <h2 className="text-xl font-bold text-black mb-1">Financial Reports</h2>
                            <p className="text-sm text-gray-500 mb-5">Track revenue, payments, and financial performance</p>
                            
                            {/* 2x2 Grid Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              
                              {/* Card 1: Revenue Trend (Line Chart) */}
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="mb-4">
                                  <h3 className="text-base font-bold text-black">Revenue Trend</h3>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {timeRangeFilter === 'overall' ? 'Monthly revenue vs target' : 'Daily revenue vs target'}
                                  </p>
                                </div>
                                <div className="h-72">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                      data={financialData.revenueTrendData || []}
                                      margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
                                    >
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
                                        tickFormatter={(value) => `${getCurrencySymbol(currency)}${(value/1000).toFixed(0)}K`}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: '#fff',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '8px',
                                          fontSize: '12px',
                                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        labelStyle={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}
                                        formatter={(value: any) => [`${getCurrencySymbol(currency)}${value.toLocaleString()}`, '']}
                                      />
                                      <Legend 
                                        wrapperStyle={{ 
                                          fontSize: '10px', 
                                          paddingTop: '10px',
                                          color: '#4b5563'
                                        }}
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ fill: '#3b82f6', r: 4 }}
                                        activeDot={{ r: 6 }}
                                        name="Revenue"
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey="target"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        name="Target"
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              {/* Card 2: Payment Methods (Donut Chart) */}
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="mb-4">
                                  <h3 className="text-base font-bold text-black">Payment Methods</h3>
                                  <p className="text-xs text-gray-500 mt-1">Distribution by payment type</p>
                                </div>
                                <div className="h-72">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={[
                                          { name: 'Card Payment', value: 35, color: '#3b82f6' },
                                          { name: 'Cash', value: 25, color: '#10b981' },
                                          { name: 'Online Transfer', value: 30, color: '#f59e0b' },
                                          { name: 'Tabby', value: 10, color: '#8b5cf6' }
                                        ]}
                                        cx="40%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                        labelLine={false}
                                      >
                                        {[
                                          { name: 'Card Payment', value: 35, color: '#3b82f6' },
                                          { name: 'Cash', value: 25, color: '#10b981' },
                                          { name: 'Online Transfer', value: 30, color: '#f59e0b' },
                                          { name: 'Tabby', value: 10, color: '#8b5cf6' }
                                        ].map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: '#fff',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '8px',
                                          fontSize: '12px',
                                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        formatter={(value: any, name: any) => [`${value}%`, name || 'Payment Method']}
                                      />
                                      <Legend 
                                        layout="vertical"
                                        verticalAlign="middle"
                                        align="right"
                                        wrapperStyle={{ 
                                          fontSize: '11px', 
                                          paddingLeft: '20px',
                                          color: '#4b5563',
                                          lineHeight: '24px'
                                        }}
                                        formatter={(value: any) => {
                                          const data = [
                                            { name: 'Card Payment', value: 35, color: '#3b82f6' },
                                            { name: 'Cash', value: 25, color: '#10b981' },
                                            { name: 'Online Transfer', value: 30, color: '#f59e0b' },
                                            { name: 'Tabby', value: 10, color: '#8b5cf6' }
                                          ];
                                          const item = data.find((d) => d.name === value);
                                          return `${value}: ${item ? item.value : 0}%`;
                                        }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              {/* Card 3: Doctor Revenue (Bar Chart) */}
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="mb-4">
                                  <h3 className="text-base font-bold text-black">Doctor Revenue</h3>
                                  <p className="text-xs text-gray-500 mt-1">Revenue generated by each doctor</p>
                                </div>
                                <div className="h-72">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                      data={financialData.doctorRevenueData.length > 0 ? financialData.doctorRevenueData : []}
                                      margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                                    >
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                      <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 10, fill: '#6b7280' }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                      />
                                      <YAxis 
                                        tick={{ fontSize: 10, fill: '#6b7280' }}
                                        tickFormatter={(value) => `${getCurrencySymbol(currency)}${(value/1000).toFixed(0)}K`}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: '#fff',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '8px',
                                          fontSize: '12px',
                                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        labelStyle={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}
                                        formatter={(value: any, name: any) => {
                                          if (name === 'revenue') {
                                            return [`${getCurrencySymbol(currency)}${value.toLocaleString()}`, 'Revenue'];
                                          }
                                          return [value, name];
                                        }}
                                      />
                                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                      <Bar
                                        dataKey="revenue"
                                        fill="#3b82f6"
                                        name="Revenue"
                                        radius={[6, 6, 0, 0]}
                                      />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              {/* Card 4: Top Services Revenue (Table) */}
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="mb-4">
                                  <h3 className="text-base font-bold text-black">Top Services Revenue</h3>
                                  <p className="text-xs text-gray-500 mt-1">Best-performing services by revenue</p>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full">
                                    <thead className="bg-gray-50 sticky top-0">
                                      <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service Name</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Sessions</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {financialData.topServicesData.length > 0 ? (
                                        financialData.topServicesData.slice(0, 5).map((service, index) => (
                                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <span className="text-sm font-medium text-gray-900">{service.name || 'N/A'}</span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                              <span className="text-sm text-gray-700">{typeof service.sessions === 'number' ? service.sessions : 0}</span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                              <span className="text-sm font-semibold text-teal-600">{getCurrencySymbol(currency)}{(typeof service.revenue === 'number' ? service.revenue : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                            No service data available
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                     
                      case 'quick-actions':
                        return (
            <div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
                <h3 className="text-base font-bold text-black mb-4">Quick Actions</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {quickActions.map((action, idx) => {
                    return (
                      <a
                        key={idx}
                        href={action.path}
                        className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all group"
                      >
                        <div className={`p-2 ${action.color} rounded-lg mb-2 group-hover:scale-110 transition-transform`}>
                          {action.iconNode && React.isValidElement(action.iconNode) ? (
                            React.cloneElement(action.iconNode, { className: "w-4 h-4 text-white" })
                          ) : action.icon ? (
                            (() => {
                              const Icon = action.icon;
                              return <Icon className="w-4 h-4 text-white" />;
                            })()
                          ) : (
                            <Activity className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-700 text-center line-clamp-2 h-8 flex items-center">{action.label}</p>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
                        );

                      case 'appointment-status-overview':
                        // Prepare data for bar chart (Consultation, Waiting, Rescheduled, Discharge, Rejected, Cancelled)
                        const barChartData = filteredAppointmentData.length > 0 ? filteredAppointmentData.filter(item => 
                          ['Consultation', 'Waiting', 'Rescheduled', 'Discharge', 'Rejected', 'Cancelled'].includes(item.name)
                        ) : [
                          { name: 'Consultation', value: dailyStats.consultation, fill: '#eab308' },
                          { name: 'Waiting', value: dailyStats.waiting, fill: '#f97316' },
                          { name: 'Rescheduled', value: dailyStats.rescheduled, fill: '#a855f7' },
                          { name: 'Discharge', value: dailyStats.discharge, fill: '#ec4899' },
                          { name: 'Rejected', value: dailyStats.rejected, fill: '#64748b' },
                          { name: 'Cancelled', value: dailyStats.cancelled, fill: '#ef4444' },
                        ];

                        // Prepare data for line chart (remaining statuses)
                        const lineChartData = filteredAppointmentData.length > 0 ? filteredAppointmentData.filter(item => 
                          !['Consultation', 'Waiting', 'Rescheduled', 'Discharge', 'Rejected', 'Cancelled'].includes(item.name)
                        ).map(item => ({
                          ...item,
                          target: Math.max(item.value * 1.2, 100) // Target is 20% higher or minimum 100
                        })) : [
                          { name: 'Booked', value: dailyStats.booked, target: Math.max(dailyStats.booked * 1.2, 100) },
                          { name: 'Enquiry', value: dailyStats.enquiry, target: Math.max(dailyStats.enquiry * 1.2, 100) },
                          { name: 'Approved', value: dailyStats.approved, target: Math.max(dailyStats.approved * 1.2, 100) },
                          { name: 'Arrived', value: dailyStats.arrived, target: Math.max(dailyStats.arrived * 1.2, 100) },
                          { name: 'Completed', value: dailyStats.completed, target: Math.max(dailyStats.completed * 1.2, 100) },
                        ];

                        // Calculate totals (commented out as unused)
                        // const totalBarChart = barChartData.reduce((sum, item) => sum + item.value, 0);
                        // const totalLineChart = lineChartData.reduce((sum, item) => sum + item.value, 0);
                        // const totalAppointments = totalBarChart + totalLineChart;

                        return (
                          <div>
                            {/* Main Header - Plain heading without box */}
                            <div className="mb-4">
                              <div className={`flex items-center justify-between ${searchQuery.trim() && sectionMatchesSearch(['Appointment', 'Appointments', 'Reports']) ? 'bg-blue-100 p-3 rounded-lg' : ''}`}>
                                <div>
                                  <h3 className="text-xl font-bold text-black">
                                    Appointment Reports
                                    {timeRangeFilter === 'month' && ` - ${selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                                    {timeRangeFilter === 'overall' && ' (All Time)'}
                                  </h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Monitor bookings, cancellations, and scheduling patterns
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Split Layout: Two Separate Boxes */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                              {/* Left Side - Line Chart Box (Appointments Trend) */}
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                    <h3 className="text-base font-bold text-black">Appointments Trend</h3>
                                <div className="h-72">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                      data={lineChartData}
                                      margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
                                    >
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
                                        allowDecimals={false}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: '#fff',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '8px',
                                          fontSize: '12px',
                                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        labelStyle={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}
                                      />
                                      <Legend 
                                        wrapperStyle={{ 
                                          fontSize: '10px', 
                                          paddingTop: '10px',
                                          color: '#4b5563'
                                        }}
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ fill: '#3b82f6', r: 5 }}
                                        activeDot={{ r: 7 }}
                                        name="Appointments"
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey="target"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        name="Target"
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              {/* Right Side - Bar Chart Box (Appointment Status) */}
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
<h3 className="text-base font-bold text-black">Appointment Status</h3>
                                <div className="h-72">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                      data={barChartData}
                                      margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
                                    >
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
                                        allowDecimals={false}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: '#fff',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '8px',
                                          fontSize: '12px',
                                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        labelStyle={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}
                                      />
                                      <Bar
                                        dataKey="value"
                                        radius={[6, 6, 0, 0]}
                                        minPointSize={2}
                                      >
                                        {barChartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                        <LabelList
                                          dataKey="value"
                                          position="top"
                                          style={{ 
                                            fontSize: '11px', 
                                            fill: '#1f2937',
                                            fontWeight: '600'
                                          }}
                                        />
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            </div>
                          </div>
                        );

                      case 'patient-reports':
                        // Patient Reports Section - Updated Layout
                        return (
                          <div className="mb-8">
                            <h2 className="text-xl font-bold text-black mb-1">Patient Reports</h2>
                            <p className="text-sm text-gray-500 mb-5">Analyze patient demographics and behavior patterns</p>
                            {/* Top Row - New vs Old Patients Bar Chart */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
                              <div className="mb-4">
                                <h3 className="text-base font-bold text-black">New vs Old Patients</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                  {timeRangeFilter === 'week' && 'Weekly patient acquisition trends'}
                                  {timeRangeFilter === 'month' && 'Monthly patient acquisition trends'}
                                  {timeRangeFilter === 'overall' && 'Overall patient acquisition trends'}
                                  {timeRangeFilter === 'today' && 'Today patient acquisition trends'}
                                </p>
                              </div>
                              <div className="h-72">
                                {patientDemographics.newVsReturning && patientDemographics.newVsReturning.length > 0 ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={patientDemographics.newVsReturning} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                      <XAxis
                                        dataKey="month"
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        tick={{ fontSize: 10, fill: '#374151', fontWeight: '500' }}
                                        stroke="#6b7280"
                                      />
                                      <YAxis 
                                        tick={{ fontSize: 10, fill: '#374151' }}
                                        stroke="#6b7280"
                                        allowDecimals={false}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: '#fff',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '8px',
                                          fontSize: '12px',
                                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        labelStyle={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}
                                      />
                                      <Legend 
                                        wrapperStyle={{ 
                                          fontSize: '10px', 
                                          paddingTop: '10px',
                                          color: '#4b5563'
                                        }}
                                      />
                                      <Bar
                                        dataKey="newPatients"
                                        fill="#3b82f6"
                                        name="New Patients"
                                        radius={[4, 4, 0, 0]}
                                      />
                                      <Bar
                                        dataKey="returningPatients"
                                        fill="#10b981"
                                        name="Old Patients"
                                        radius={[4, 4, 0, 0]}
                                      />
                                    </BarChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-gray-400">
                                    <p className="text-sm">Loading patient data...</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Bottom Row - Gender Distribution and Top Patients Side by Side */}
                            {/* Always show this row with mock/real data */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left - Gender Distribution Donut Chart */}
                                {patientDemographics.genderDistribution && patientDemographics.genderDistribution.length > 0 ? (
                                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                    <div className="mb-4">
                                      <h3 className="text-base font-bold text-black">Gender Distribution</h3>
                                      <p className="text-xs text-gray-500 mt-1">Patient demographics by gender</p>
                                    </div>
                                    <div className="h-64 sm:h-72">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                          <Pie
                                            data={patientDemographics.genderDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={isMobile ? 50 : 60}
                                            outerRadius={isMobile ? 85 : 100}
                                            paddingAngle={5}
                                            dataKey="percentage"
                                            nameKey="name"
                                            label={isMobile ? false : ({ name, value }) => `${name}: ${((value || 0) * 100).toFixed(0)}%`}
                                            labelLine={false}
                                          >
                                            {patientDemographics.genderDistribution.map((_entry: any, index: number) => (
                                              <Cell key={`cell-${index}`} fill={['#ec4899', '#3b82f6'][index % 2]} />
                                            ))}
                                          </Pie>
                                          <Tooltip
                                            contentStyle={{
                                              backgroundColor: '#fff',
                                              border: '1px solid #e5e7eb',
                                              borderRadius: '8px',
                                              fontSize: '12px',
                                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                          />
                                          <Legend 
                                            wrapperStyle={{ 
                                              fontSize: '10px', 
                                              paddingTop: '10px',
                                              color: '#4b5563'
                                            }}
                                          />
                                        </PieChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>
                                ) : null}
                                
                                {/* Right - Top Patients Table */}
                                {patientDemographics.topPatients && patientDemographics.topPatients.length > 0 && (
                                  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${patientDemographics.genderDistribution && patientDemographics.genderDistribution.length > 0 ? '' : 'md:col-span-2'}`}>
                                    <div className="mb-4">
                                      <h3 className="text-base font-bold text-black">Top Patients (VIP)</h3>
                                      <p className="text-xs text-gray-500 mt-1">Highest billing revenue generators</p>
                                    </div>
                                <div className="overflow-x-auto" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                  {patientDemographics.topPatients && patientDemographics.topPatients.length > 0 ? (
                                    <table className="min-w-full">
                                      <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient Name</th>
                                          <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Billings</th>
                                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Billing</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {patientDemographics.topPatients.map((patient: any, index: number) => (
                                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900">{patient.name}</span>
                                                {patient.badge === 'VIP' && (
                                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">VIP</span>
                                                )}
                                                {patient.badge === 'Gold' && (
                                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Gold</span>
                                                )}
                                                {patient.badge === 'Silver' && (
                                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">Silver</span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                              <span className="text-sm font-semibold text-teal-600 block">{patient.billingCount}</span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                              <span className="text-sm font-semibold text-teal-600">{getCurrencySymbol(currency)}{patient.totalRevenue?.toLocaleString()}</span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <span className="text-sm text-gray-600">{new Date(patient.lastBillingDate).toLocaleDateString()}</span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400">
                                      <p className="text-sm">No top patients data available</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              )}
                              </div>

                            {/* Patient Visit Frequency Section - Full Width */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-9 p-6">
                              <div className="mb-4">
                                <h3 className="text-base font-bold text-black">Patient Visit Frequency</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                  {timeRangeFilter === 'week' && 'Weekly distribution by number of visits'}
                                  {timeRangeFilter === 'month' && 'Monthly distribution by number of visits'}
                                  {timeRangeFilter === 'overall' && 'Overall distribution by number of visits'}
                                  {timeRangeFilter === 'today' && 'Today distribution by number of visits'}
                                </p>
                              </div>
                              <div className="h-72">
                                {patientDemographics.patientVisitFrequency && patientDemographics.patientVisitFrequency.length > 0 ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={patientDemographics.patientVisitFrequency} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
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
                                        allowDecimals={false}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: '#fff',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '8px',
                                          fontSize: '12px',
                                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        labelStyle={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}
                                      />
                                      <Legend 
                                        wrapperStyle={{ 
                                          fontSize: '10px', 
                                          paddingTop: '10px',
                                          color: '#4b5563'
                                        }}
                                      />
                                      <Bar
                                        dataKey="value"
                                        fill="#8b5cf6"
                                        name="Number of Patients"
                                        radius={[4, 4, 0, 0]}
                                      />
                                    </BarChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-gray-400">
                                    <p className="text-sm">No visit frequency data available</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Service Performance Section */}
                            <h2 className="text-xl font-bold text-black mt-9 mb-1">Service Performance</h2>
                            <p className="text-sm text-gray-500 mb-5">
                              {timeRangeFilter === 'week' && 'Weekly service bookings, revenue, and conversion rates'}
                              {timeRangeFilter === 'month' && 'Monthly service bookings, revenue, and conversion rates'}
                              {timeRangeFilter === 'overall' && 'Overall service bookings, revenue, and conversion rates'}
                              {timeRangeFilter === 'today' && 'Today service bookings, revenue, and conversion rates'}
                            </p>

                            {servicePerformanceLoading ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 h-80 flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                                    <p className="text-sm text-gray-500 mt-2">Loading service performance...</p>
                                  </div>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 h-80"></div>
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 h-80"></div>
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 h-80"></div>
                              </div>
                            ) : (
                              <>
                                {/* Top Row - 2 Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                              {/* Most Booked Services */}
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="mb-4">
                                  <h3 className="text-base font-bold text-black">Most Booked Services</h3>
                                  <p className="text-xs text-gray-500 mt-1">Top performing treatments</p>
                                </div>
                                <div className="h-72 flex items-center justify-center">
                                  {servicePerformance.mostBookedServices && servicePerformance.mostBookedServices.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart 
                                        data={servicePerformance.mostBookedServices} 
                                        layout="vertical"
                                        margin={{ top: 10, right: 40, left: 20, bottom: 20 }}
                                      >
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
                                          radius={[0, 4, 4, 0]}
                                          barSize={24}
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

                              {/* Least Booked Services */}
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="mb-4">
                                  <h3 className="text-base font-bold text-black">Least Booked Services</h3>
                                  <p className="text-xs text-gray-500 mt-1">Needs attention</p>
                                </div>
                                <div className="space-y-2 max-h-72 overflow-y-auto">
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
                            </div>

                            {/* Bottom Row - 2 Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                              {/* Service Revenue Table */}
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="mb-4">
                                  <h3 className="text-base font-bold text-black">Service Revenue Table</h3>
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
                                              <span className="text-sm text-gray-700">{getCurrencySymbol(currency)}{service.avgPrice?.toLocaleString()}</span>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-right">
                                              <span className="text-sm font-semibold text-teal-600">{getCurrencySymbol(currency)}{service.revenue?.toLocaleString()}</span>
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

                              {/* Treatment Conversion Rate */}
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="mb-4">
                                  <h3 className="text-base font-bold text-black">Treatment Conversion Rate</h3>
                                  <p className="text-xs text-gray-500 mt-1">Consultation to booking success</p>
                                </div>
                                <div className="h-72">
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
                              </>
                            )}

                          {/* Membership & Package Reports Section */}
                          <div className="mt-9">
                            <MembershipPackageReports timeRange={timeRangeFilter as 'week' | 'month' | 'overall'} />
                          </div>

                          {/* Doctor Performance Analytics Section */}
                          <div className="mt-9">
                            <DoctorPerformance timeRange={timeRangeFilter as 'week' | 'month' | 'overall'} selectedDate={selectedDate} />
                          </div>

                          {/* Room & Resource Usage Section */}
                          <div className="mt-9">
                            <RoomUtilization timeRange={timeRangeFilter as 'week' | 'month' | 'overall'} selectedDate={selectedDate} />
                          </div>

                          {/* Cancellation & No-Show Reports Section */}
                          <div className="mt-9">
                            <CancellationReports timeRange={timeRangeFilter as 'week' | 'month' | 'overall'} selectedDate={selectedDate} />
                          </div>
                        </div>
                        );

                      case 'lead-status-charts':
                        return (
                          <div>
                            {/* Main Header - Plain heading without box */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-xl font-bold text-black">
                                    Lead Analytics
                                    {timeRangeFilter === 'month' && ` - ${selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                                    {timeRangeFilter === 'overall' && ' (All Time)'}
                                  </h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Track lead sources and status distribution
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Split Layout: Two Separate Boxes */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                              {/* Left Side - Lead Source Wise */}
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                <h3 className="text-base font-bold text-black mb-3">Lead Source Wise</h3>
                                <div className="h-80">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={filteredLeadSourceData.length > 0 ? filteredLeadSourceData : [{ name: 'No Data', value: 0 }]}
                                        cx="50%"
                                        cy="42%"
                                        label={false}
                                        labelLine={false}
                                        outerRadius={85}
                                        fill="#8884d8"
                                        dataKey="value"
                                        paddingAngle={2}
                                      >
                                        {(filteredLeadSourceData.length > 0 ? filteredLeadSourceData : [{ name: 'No Data', value: 0 }]).map((entry: any, index: number) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill || '#e5e7eb'} />
                                        ))}
                                      </Pie>
                                      <Tooltip 
                                        contentStyle={{
                                          backgroundColor: '#fff',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '8px',
                                          fontSize: '12px',
                                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        formatter={(value: any, name: any) => {
                                          const total = filteredLeadSourceData.reduce((s: number, d: any) => s + (d.value || 0), 0);
                                          const pct = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                                          return [`${value} (${pct}%)`, name];
                                        }}
                                      />
                                      <Legend 
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ 
                                          fontSize: '10px', 
                                          paddingTop: '8px',
                                          color: '#4b5563',
                                          lineHeight: '18px'
                                        }}
                                        formatter={(value: any, entry: any) => {
                                          const total = filteredLeadSourceData.reduce((s: number, d: any) => s + (d.value || 0), 0);
                                          const pct = total > 0 ? (((entry.payload?.value || 0) / total) * 100).toFixed(0) : 0;
                                          return `${value}: ${pct}%`;
                                        }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              {/* Right Side - Lead Status Wise */}
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                <h3 className="text-base font-bold text-black mb-3">Lead Status Wise</h3>
                                <div className="h-80">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={filteredLeadStatusData.length > 0 ? filteredLeadStatusData : [{ name: 'No Data', value: 0 }]}
                                        cx="50%"
                                        cy="42%"
                                        label={false}
                                        labelLine={false}
                                        outerRadius={85}
                                        fill="#8884d8"
                                        dataKey="value"
                                        paddingAngle={2}
                                      >
                                        {(filteredLeadStatusData.length > 0 ? filteredLeadStatusData : [{ name: 'No Data', value: 0 }]).map((entry: any, index: number) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill || '#e5e7eb'} />
                                        ))}
                                      </Pie>
                                      <Tooltip 
                                        contentStyle={{
                                          backgroundColor: '#fff',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '8px',
                                          fontSize: '12px',
                                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        formatter={(value: any, name: any) => {
                                          const total = filteredLeadStatusData.reduce((s: number, d: any) => s + (d.value || 0), 0);
                                          const pct = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                                          return [`${value} (${pct}%)`, name];
                                        }}
                                      />
                                      <Legend 
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ 
                                          fontSize: '10px', 
                                          paddingTop: '8px',
                                          color: '#4b5563',
                                          lineHeight: '18px'
                                        }}
                                        formatter={(value: any, entry: any) => {
                                          const total = filteredLeadStatusData.reduce((s: number, d: any) => s + (d.value || 0), 0);
                                          const pct = total > 0 ? (((entry.payload?.value || 0) / total) * 100).toFixed(0) : 0;
                                          return `${value}: ${pct}%`;
                                        }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            </div>

                            {/* Date Display */}
                            <div className="mt-3 text-xs text-gray-500 text-center">
                              {timeRangeFilter === 'month' && (
                                <span>Showing data for: {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                              )}
                              {timeRangeFilter === 'overall' && (
                                <span>Showing all-time accumulated data</span>
                              )}
                            </div>
                          </div>
                        );

                      case 'status-charts':
                        // Calculate total offers (commented out as unused)
                        // const totalOffers = offerStatusData.reduce((sum, item) => sum + item.value, 0);
                        
                        return (
                          <div>
                            {/* Main Header - Plain heading without box */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-xl font-bold text-black">
                                    Offer Status
                                    {timeRangeFilter === 'month' && ` - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                                    {timeRangeFilter === 'overall' && ' (All Time)'}
                                  </h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Track offer distribution and status
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Offer Status Cards Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-3">
                                  {offerStatusData.map((status) => (
                                    <div 
                                      key={status.name}
                                      className="text-center p-3 rounded-lg border hover:shadow-md transition-all"
                                      style={{
                                        backgroundColor: `${getStatusColor(status.name)}10`,
                                        borderColor: `${getStatusColor(status.name)}30`
                                      }}
                                    >
                                      <div className="text-xs font-medium mb-1" style={{ color: getStatusColor(status.name) }}>
                                        {status.name}
                                      </div>
                                      <div className="text-2xl font-bold" style={{ color: getStatusColor(status.name) }}>
                                        {status.value}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Pie Chart - In Div Box */}
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                  <h3 className="text-base font-bold text-black mb-2">Offer Status Distribution</h3>
                                  <div className="h-80">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={offerStatusData}
                                        cx="50%"
                                        cy="42%"
                                        label={false}
                                        labelLine={false}
                                        outerRadius={85}
                                        fill="#8884d8"
                                        dataKey="value"
                                        paddingAngle={2}
                                      >
                                        {offerStatusData.map((_entry, index) => (
                                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: '#fff',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '8px',
                                          fontSize: '12px',
                                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        formatter={(value: any, name: any) => {
                                          const total = offerStatusData.reduce((s: number, d: any) => s + (d.value || 0), 0);
                                          const pct = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                                          return [`${value} (${pct}%)`, name];
                                        }}
                                      />
                                      <Legend
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ 
                                          fontSize: '10px', 
                                          paddingTop: '8px',
                                          color: '#4b5563',
                                          lineHeight: '18px'
                                        }}
                                        formatter={(value: any, entry: any) => {
                                          const total = offerStatusData.reduce((s: number, d: any) => s + (d.value || 0), 0);
                                          const pct = total > 0 ? (((entry.payload?.value || 0) / total) * 100).toFixed(0) : 0;
                                          return `${value}: ${pct}%`;
                                        }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                          </div>
                        );
                     
                      case 'services-overview':
                        // Always show the section, even if empty
                        return (
                          <div>
                            {/* Main Header - Plain heading without box */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-xl font-bold text-black">
                                    Top 5 Services
                                    {timeRangeFilter === 'month' && ` - ${selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                                    {timeRangeFilter === 'overall' && ' (All Time)'}
                                  </h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Track top performing services and packages
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Top 5 Packages Graph - Multi-Series Line Chart */}
            <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                  <h3 className="text-base font-bold text-black mb-4">Top 5 Packages</h3>
                  <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={topPackagesData.length > 0 ? topPackagesData : [{ name: 'No Data', totalAmount: 0, count: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 9 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(value: any, name: any) => {
                          if (name === 'totalAmount') {
                            return [`${getCurrencySymbol(currency)}${value.toLocaleString()}`, 'Total Amount'];
                          }
                          return [value, name === 'count' ? 'Count' : name];
                        }}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="totalAmount"
                        name="Total Amount"
                        stroke="#0d9488"
                        strokeWidth={2}
                        dot={{ fill: '#0d9488', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="count"
                        name="Count"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ fill: '#f59e0b', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              </div>
            
            {/* Top 5 Services Graph - Multi-Series Line Chart */}
            <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                  <h3 className="text-base font-bold text-black mb-4">Top 5 Services</h3>
                  <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={topServicesData.length > 0 ? topServicesData : [{ name: 'No Data', totalAmount: 0, count: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 9 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(value: any, name: any) => {
                          if (name === 'totalAmount') {
                            return [`$${value.toLocaleString()}`, 'Total Amount'];
                          }
                          return [value, name === 'count' ? 'Count' : name];
                        }}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="totalAmount"
                        name="Total Amount"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ fill: '#2563eb', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="count"
                        name="Count"
                        stroke="#dc2626"
                        strokeWidth={2}
                        dot={{ fill: '#dc2626', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              </div>
            
            {/* Date Display */}
            <div className="mt-4 text-xs text-gray-500 text-center">
              {timeRangeFilter === 'month' && (
                <span>Showing data for: {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              )}
              {timeRangeFilter === 'overall' && (
                <span>Showing all-time accumulated data</span>
              )}
            </div>
          </div>
                        );
                      
                      case 'membership-overview':
                        // Always show the section, even if empty
                        return (
                          <div>
                            {/* Main Header - Plain heading without box */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-xl font-bold text-black">
                                    Most Purchased Membership
                                    {timeRangeFilter === 'month' && ` - ${selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                                    {timeRangeFilter === 'overall' && ' (All Time)'}
                                  </h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Track membership package purchases and revenue
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Membership Data Card */}
                            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5 mb-6">
                              {/* Membership Data - Area Chart (different from other charts) */}
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={membershipData.length > 0 ? membershipData : [{ name: 'No Data', count: 0, totalRevenue: 0 }]}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10}}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => value === 0 ? '0' : `${getCurrencySymbol(currency)}${(value/1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: any, name: any) => {
                        if (name === 'totalRevenue') {
                          return [`${getCurrencySymbol(currency)}${value.toLocaleString()}`, 'Total Revenue'];
                        }
                        return [value, name === 'count' ? 'Purchases' : name];
                      }}
                      labelStyle={{ fontWeight: 'bold', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Purchases"
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#colorCount)"
                    />
                    <Area
                      type="monotone"
                      dataKey="totalRevenue"
                      name="Total Revenue"
                      stroke="#7c3aed"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            
            {/* Date Display */}
            <div className="mt-4 text-xs text-gray-500 text-center">
              {timeRangeFilter === 'month' && (
                <span>Showing data for: {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              )}
              {timeRangeFilter === 'overall' && (
                <span>Showing all-time accumulated data</span>
              )}
            </div>
          </div>
        </div>
                        );
                     
                      case 'commission-overview':
                        // Data is already grouped by staff from API
                        const commissionRows = commissionData.map((item: any) => ({
                          name: item.name || 'Unknown Staff',
                          commissionType: item.commissionType || 'flat',
                          totalAmountPaid: item.totalPaid || 0,
                          totalCommissionAmount: item.totalEarned || 0,
                          count: item.count || 0
                        }));

                        // Pagination logic
                        const totalPages = Math.ceil(commissionRows.length / COMMISSION_PAGE_SIZE);
                        const startIndex = (commissionPage - 1) * COMMISSION_PAGE_SIZE;
                        const endIndex = startIndex + COMMISSION_PAGE_SIZE;
                        const paginatedRows = commissionRows.slice(startIndex, endIndex);

                        return (
                          <div>
                            {/* Main Header - Plain heading without box */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-xl font-bold text-black">
                                    Commission Details
                                    {timeRangeFilter === 'month' && ` - ${selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                                    {timeRangeFilter === 'overall' && ' (All Time)'}
                                  </h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Track staff commissions and earnings
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Commission Table Card */}
                            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5 mb-6">
                            
                            {/* Commission Table */}
                            {commissionRows.length > 0 ? (
                              <div>
                                <div className="overflow-x-auto" style={{ minHeight: '280px' }}>
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Commission Type</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount Paid</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Commission Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {paginatedRows.map((row: any, index) => (
                                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                          <td className="py-3 px-4 text-gray-900">{row.name}</td>
                                          <td className="py-3 px-4">
                                            <span className="inline-block px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs font-medium capitalize">
                                              {row.commissionType.replace(/_/g, ' ')}
                                            </span>
                                          </td>
                                          <td className="py-3 px-4 text-gray-900 font-medium">{getCurrencySymbol(currency)}{row.totalAmountPaid.toLocaleString()}</td>
                                          <td className="py-3 px-4 text-teal-700 font-bold">{getCurrencySymbol(currency)}{row.totalCommissionAmount.toLocaleString()}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                
                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                                    <div className="text-xs text-gray-600">
                                      Showing {startIndex + 1} to {Math.min(endIndex, commissionRows.length)} of {commissionRows.length} entries
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setCommissionPage(prev => Math.max(1, prev - 1))}
                                        disabled={commissionPage === 1}
                                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                                          commissionPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-teal-600 text-white hover:bg-teal-700'
                                        }`}
                                      >
                                        ← Previous
                                      </button>
                                      
                                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                          key={page}
                                          onClick={() => setCommissionPage(page)}
                                          className={`px-3 py-1 text-xs font-medium rounded transition-colors min-w-[32px] ${
                                            commissionPage === page
                                              ? 'bg-teal-700 text-white'
                                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                          }`}
                                        >
                                          {page}
                                        </button>
                                      ))}
                                      
                                      <button
                                        onClick={() => setCommissionPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={commissionPage === totalPages}
                                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                                          commissionPage === totalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-teal-600 text-white hover:bg-teal-700'
                                        }`}
                                      >
                                        Next →
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                                <div className="flex flex-col items-center gap-3">
                                  {/* Empty state icon */}
                                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <p className="text-sm font-medium text-gray-500">No commission data available for the selected period</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Commission Type Performance Graph */}
                            {commissionTypeStats.length > 0 && (
                              <div className="mt-6 pt-6 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700 mb-4">Commission Type Performance</h4>
                                <div className="h-72">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={commissionTypeStats}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                      <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10, fontWeight: '500' }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        interval={0}
                                        stroke="#6b7280"
                                        tickFormatter={(value) => {
                                          // Split long names into multiple lines
                                          if (value && value.length > 15) {
                                            const words = value.split(' ');
                                            if (words.length >= 2) {
                                              return words.slice(0, Math.ceil(words.length / 2)).join(' ') + '\n' + words.slice(Math.ceil(words.length / 2)).join(' ');
                                            }
                                          }
                                          return value;
                                        }}
                                      />
                                      <YAxis
                                        tick={{ fontSize: 11 }}
                                        stroke="#6b7280"
                                        width={60}
                                        tickFormatter={(value) => `${getCurrencySymbol(currency)}${(value / 1000).toFixed(0)}k`}
                                      />
                                      <Tooltip
                                        formatter={(value: any, name: any) => {
                                          if (name === 'amount') {
                                            return [`${getCurrencySymbol(currency)}${value.toLocaleString()}`, 'Total Earned'];
                                          }
                                          if (name === 'count') {
                                            return [value, 'Transactions'];
                                          }
                                          return [value, name];
                                        }}
                                        labelStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                                        contentStyle={{
                                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '8px',
                                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                      />
                                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                                      <Line
                                        type="monotone"
                                        dataKey="amount"
                                        name="Total Earned"
                                        stroke="#0d9488"
                                        strokeWidth={3}
                                        dot={{ fill: '#0d9488', strokeWidth: 2, r: 5 }}
                                        activeDot={{ r: 7 }}
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey="count"
                                        name="Transactions"
                                        stroke="#f59e0b"
                                        strokeWidth={3}
                                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 5 }}
                                        activeDot={{ r: 7 }}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}
                            
                            {/* Date Display */}
                            <div className="mt-4 text-xs text-gray-500 text-center">
                              {timeRangeFilter === 'month' && (
                                <span>Showing data for: {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                              )}
                              {timeRangeFilter === 'overall' && (
                                <span>Showing all-time accumulated data</span>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                     
                      case 'analytics-overview':
                        if (!((stats.totalEnquiries > 0 || stats.totalReviews > 0 || (stats.totalAppointments || 0) > 0 || (stats.totalLeads || 0) > 0 || (stats.totalOffers || 0) > 0 || (stats.totalPatients || 0) > 0 || (stats.totalRooms || 0) > 0) || modulesChartData.length > 0 || statsChartData.length > 0)) {
                          return null;
                        }
                        return (
                          <div>
                            {/* Main Header - Plain heading without box */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-xl font-bold text-black">
                                    Analytics Overview
                                    {timeRangeFilter === 'month' && ` - ${selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                                    {timeRangeFilter === 'overall' && ' (All Time)'}
                                  </h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Comprehensive clinic performance metrics
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Analytics Cards Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                              {/* Left Side - Bar Chart Box (Appointments, Leads, Offers & Jobs) */}
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                <h3 className="text-base font-bold text-black">Appointments, Leads, Offers & Jobs</h3>
                                <div className="h-72">
                {modulesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modulesChartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                      angle={-45}
                      textAnchor="end"
                        height={60}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                        domain={[0, 'auto']}
                        type="number"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '11px'
                      }}
                        formatter={(value: number | undefined, name: string | undefined, props: any) => {
                          const displayValue = value ?? 0;
                          const displayName = name ?? '';
                          if (props.payload?.fullName) {
                            return [`${displayValue}`, props.payload.fullName];
                          }
                          return [displayValue, displayName];
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#3b82f6">
                      <LabelList
                        dataKey="value"
                        position="top"
                          fill="#3b82f6"
                        fontSize={11}
                        fontWeight={500}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Loading modules data...
              </div>
                )}
              </div>
                              </div>
                              
                              {/* Right Side - Line Chart Box (Reviews, Enquiries, Patients & Rooms) */}
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                <h3 className="text-base font-bold text-black">Reviews, Enquiries, Patients & Rooms</h3>
                                <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statsChartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '11px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
                              </div>
                            </div>
                            
                            {/* Active vs Inactive - Single Div */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
                              <h3 className="text-base font-bold text-black mb-4">Active vs Inactive</h3>
                              <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Active', value: navigationItems.length, status: 'Active' },
                    { name: 'Inactive', value: restrictedModules.length, status: 'Inactive' },
                    { name: 'Total', value: allModules.length, status: 'Total' }
                  ]}
                  margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="value"
                      position="top"
                      fill="#1f2937"
                      fontSize={11}
                      fontWeight={500}
                    />
                    {[
                      { name: 'Active', value: navigationItems.length, status: 'Active' },
                      { name: 'Inactive', value: restrictedModules.length, status: 'Inactive' },
                      { name: 'Total', value: allModules.length, status: 'Total' }
                    ].map((_entry, index) => {
                      const status = index === 0 ? 'Active' : index === 1 ? 'Inactive' : 'Total';
                      const fill = status === 'Active' ? '#22c55e' : status === 'Inactive' ? '#ef4444' : '#6366f1';
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
                            </div>
                        );

                      case 'subscription-status':
                        return (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
            
              <div>
                <h3 className="text-base font-bold text-black">Subscription Status</h3>
                <p className="text-xs text-gray-500 mt-1">Manage your module access</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{subscriptionSummary.subscriptionPercentage}%</div>
              <div className="text-xs text-gray-500">Active</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Active Modules</span>
                </div>
                <span className="text-2xl font-bold text-green-700">{navigationItems.length}</span>
              </div>
              <div className="w-full bg-green-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${subscriptionSummary.subscriptionPercentage}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {subscriptionSummary.subscriptionPercentage > 0 ? (
                  <span className="text-green-600 font-medium">? Fully operational</span>
                ) : (
                  <span className="text-gray-500">No active modules</span>
                )}
              </div>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-indigo-50 rounded-lg border border-teal-200 p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-500 rounded-lg">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Subscription</span>
                </div>
                <span className="text-2xl font-bold text-teal-700">{subscriptionSummary.subscriptionPercentage}%</span>
              </div>
              <div className="w-full bg-teal-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-indigo-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${subscriptionSummary.subscriptionPercentage}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                <span className="text-teal-600 font-medium">
                  {subscriptionSummary.subscribedModules} of {subscriptionSummary.totalModules} modules
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gray-400 rounded-lg">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Locked Modules</span>
                </div>
                <span className="text-2xl font-bold text-gray-600">{subscriptionSummary.restrictedCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-gray-400 to-slate-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${100 - subscriptionSummary.subscriptionPercentage}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {subscriptionSummary.restrictedCount > 0 ? (
                  <span className="text-gray-600 font-medium">Requires upgrade</span>
                ) : (
                  <span className="text-green-600 font-medium">All unlocked</span>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-600" />
                <span className="text-base font-bold text-black">Module Summary</span>
              </div>
              <span className="text-sm text-gray-600">{subscriptionSummary.totalModules} Total</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="text-2xl font-bold text-green-700">{navigationItems.length}</div>
                <div className="text-xs text-gray-600 mt-1">Active</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-2xl font-bold text-gray-700">{subscriptionSummary.restrictedCount}</div>
                <div className="text-xs text-gray-600 mt-1">Locked</div>
              </div>
              <div className="text-center p-3 bg-teal-50 rounded-lg border border-teal-100">
                <div className="text-2xl font-bold text-teal-700">{subscriptionSummary.subscriptionPercentage}%</div>
                <div className="text-xs text-gray-600 mt-1">Coverage</div>
              </div>
              <div className="text-center p-3 bg-teal-50 rounded-lg border border-teal-100">
                <div className="text-2xl font-bold text-teal-700">{subscriptionSummary.totalModules}</div>
                <div className="text-xs text-gray-600 mt-1">Total</div>
              </div>
            </div>
          </div>
        </div>
                        );
                     
                      case 'additional-stats':
                        if (!permissionsLoaded) return null;
                        const sortedStatsSections = statsSections.sort((a, b) => a.order - b.order);
                        const statsSectionIds = sortedStatsSections.map(s => s.id);
                        return (
                          <DndContext
                            sensors={cardSensors}
                            collisionDetection={rectIntersection}
                            onDragStart={handleStatsSectionDragStart}
                            onDragEnd={handleStatsSectionDragEnd}
                          >
                            <SortableContext
                              items={statsSectionIds}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-6">
          <Stats
            key={`stats-${permissionsLoaded}-${navigationItemsLoaded}-${userRole || 'default'}`}
            role="clinic"
            config={statsConfig}
                                  showSections={{
                                    jobTypes: true,
                                    blogStats: true,
                                    blogEngagement: true,
                                  }}
                                  isEditMode={isEditMode}
                                  sectionWrapper={(sectionId, content) => {
                                    const section = sortedStatsSections.find(s => s.id === sectionId);
                                    if (!section) return content;
                                    return (
                                      <SortableStatsSection
                                        key={section.id}
                                        section={section}
                                        isEditMode={isEditMode}
                                        onToggleVisibility={toggleStatsSectionVisibility}
                                      >
                                        {content}
                                      </SortableStatsSection>
                                    );
                                  }}
                                />
      </div>
                            </SortableContext>
                            <DragOverlay>
                              {activeStatsSectionId && sortedStatsSections.find(s => s.id === activeStatsSectionId) ? (
                                <div className="bg-white rounded-lg border-2 border-teal-500 shadow-xl p-4 opacity-90">
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="w-3 h-3 text-teal-500" />
                                    <span className="text-sm font-semibold text-teal-800">
                                      {sortedStatsSections.find(s => s.id === activeStatsSectionId)?.title || 'Section'}
                                    </span>
                                  </div>
                                </div>
                              ) : null}
                            </DragOverlay>
                          </DndContext>
                        );
                     
                      default:
                        return null;
                    }
                  })();

                  return (
                    <SortableWidget key={widget.id} widget={widget}>
                      {widgetContent}
                    </SortableWidget>
                  );
                })}
            </div>
          </SortableContext>
          <DragOverlay>
                {(() => {
                  // Widget-level drag overlay
                  if (activeId && widgets.find(w => w.id === activeId)) {
                    const widget = widgets.find(w => w.id === activeId);
                    if (widget) {
                      return (
                        <div className="bg-white rounded-lg border-2 border-teal-500 shadow-2xl p-4 opacity-95 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3 h-3 text-teal-500" />
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-700">{widget.title}</span>
                              <span className="text-xs text-gray-500">Section</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }
                 
                  // Item-level drag overlays
                  if (activeCardId) {
                    const allCards = [...statCards.primary, ...statCards.secondary];
                    const draggedCard = allCards.find(c => c.id === activeCardId);
                    if (draggedCard) {
                      return (
                        <div className="bg-white rounded-lg border-2 border-teal-500 shadow-xl p-4 opacity-90 min-w-[200px]">
                <div className="flex items-center gap-2">
                            <GripVertical className="w-3 h-3 text-teal-500" />
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-700">{draggedCard.label}</span>
                              <span className="text-xs text-gray-500">{draggedCard.value}</span>
                </div>
              </div>
                        </div>
                      );
                    }
                  }
                  if (activeChartId) {
                    const allCharts = [...chartComponents['status-charts'], ...chartComponents['analytics-overview']];
                    const draggedChart = allCharts.find(c => c.id === activeChartId);
                    if (draggedChart) {
                      return (
                        <div className="bg-white rounded-lg border-2 border-orange-500 shadow-xl p-4 opacity-90 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3 h-3 text-orange-500" />
                            <span className="text-sm font-semibold text-gray-700">{draggedChart.title}</span>
                          </div>
                        </div>
                      );
                    }
                  }
                  if (activePackageOfferId) {
                    const draggedPackage = packageOfferCards.find(c => c.id === activePackageOfferId);
                    if (draggedPackage) {
                      return (
                        <div className="bg-white rounded-lg border-2 border-indigo-500 shadow-xl p-4 opacity-90 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3 h-3 text-indigo-500" />
                            <span className="text-sm font-semibold text-teal-800">{draggedPackage.title}</span>
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

ClinicDashboard.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// Apply HOC and assign correct type
const ProtectedDashboard: NextPageWithLayout = withClinicAuth(ClinicDashboard);

// Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = ClinicDashboard.getLayout;
export default ProtectedDashboard;
