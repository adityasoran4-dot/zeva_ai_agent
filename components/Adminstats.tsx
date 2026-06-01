'use client';
import React, { useEffect, useState, ReactNode, useMemo, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  LabelList,
  PieLabel,
} from "recharts";

import { TrendingUp, FileText, Briefcase, Activity, BarChart3, Target } from 'lucide-react';

// ---------------- Types ----------------
type SubTreatment = {
  name: string;
  slug: string;
};

type Treatment = {
  _id: string;
  name: string;
  slug: string;
  subcategories: SubTreatment[];
};

interface Blog {
  _id: string;
  title: string;
  postedBy?: { name?: string };
}

interface Job {
  _id: string;
  jobTitle: string;
  companyName: string;
  jobType?: string;
  location?: string;
  department?: string;
  salary?: string;
}

interface JobsData {
  pending: Job[];
  approved: Job[];
  declined: Job[];
}

interface AdminStatsProps {
  theme?: 'light' | 'dark';
}

// ---------------- Custom Components ----------------
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  subtitle?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  gradient,
  subtitle,
  loading = false,
}) => {
  const formatValue = (val: number | string): string => {
    if (loading) return '---';
    if (typeof val === 'number') {
      if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
      if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
      return val.toLocaleString();
    }
    return String(val);
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 relative overflow-hidden">
      {/* Background gradient */}
      <div className={`absolute inset-0 ${gradient} opacity-[0.03]`} />
      
      <div className="relative z-10">
        {/* Icon and value section */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${gradient} shadow-sm`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="text-right">
            <div className={`text-xl sm:text-2xl font-bold text-gray-900 ${loading ? 'animate-pulse' : ''}`}>
              {formatValue(value)}
            </div>
          </div>
        </div>

        {/* Title and subtitle */}
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100 overflow-hidden">
            <div className={`h-full ${gradient}`} />
          </div>
        )}
      </div>
    </div>
  );
};

interface ChartContainerProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  fullWidth?: boolean;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ 
  title, 
  icon: Icon, 
  children, 
  fullWidth = false 
}) => (
  <div className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 ${fullWidth ? 'col-span-full' : ''}`}>
    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
      <h3 className="text-sm sm:text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="relative">{children}</div>
  </div>
);

// Custom label components for charts
const CustomPieLabel: PieLabel = (props) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, value } = props;
  
  // Guard against undefined values
  if (
    cx === undefined ||
    cy === undefined ||
    midAngle === undefined ||
    innerRadius === undefined ||
    outerRadius === undefined ||
    percent === undefined ||
    value === undefined
  ) {
    return null;
  }
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return percent > 0.05 ? (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="11"
      fontWeight="600"
    >
      {`${value}`}
    </text>
  ) : null;
};

// ---------------- Main Component ----------------
const AdminStats: React.FC<AdminStatsProps> = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [jobs, setJobs] = useState<JobsData>({
    pending: [],
    approved: [],
    declined: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch all data function
  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);

      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const headers: HeadersInit = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      };

      // Fetch Treatments
      const treatmentsResponse = await fetch('/api/doctor/getTreatment', { headers });
      if (!treatmentsResponse.ok) throw new Error('Failed to fetch treatments');
      const treatmentsData: { treatments?: Treatment[] } = await treatmentsResponse.json();
      setTreatments(treatmentsData.treatments ?? []);

      // Fetch Blogs
      const blogsResponse = await fetch('/api/admin/get-blogs', { headers });
      if (!blogsResponse.ok) throw new Error('Failed to fetch blogs');
      const blogsData: { blogs?: Blog[] } = await blogsResponse.json();
      setBlogs(blogsData.blogs ?? []);

      // Fetch Jobs
      const jobsResponse = await fetch('/api/admin/job-manage', { headers });
      if (!jobsResponse.ok) throw new Error('Failed to fetch jobs');
      const jobsData: Partial<JobsData> = await jobsResponse.json();
      setJobs({
        pending: jobsData.pending ?? [],
        approved: jobsData.approved ?? [],
        declined: jobsData.declined ?? [],
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasFetchedRef = useRef<boolean>(false);
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    void fetchData();
  }, []);

  // ---------------- Calculated Statistics ----------------
  const mainTreatmentCount = treatments.length;
  const subTreatmentCount = treatments.reduce(
    (acc, treatment) => acc + (treatment.subcategories?.length || 0),
    0,
  );
  const blogCount = blogs.length;
  const pendingJobCount = jobs.pending.length;
  const approvedJobCount = jobs.approved.length;
  const declinedJobCount = jobs.declined.length;
  const totalJobCount = pendingJobCount + approvedJobCount + declinedJobCount;

  // ---------------- Chart Data Preparation ----------------
  const overviewHistogramData = useMemo(() => ([
    { 
      name: 'Main\nTreatments', 
      value: mainTreatmentCount, 
      fill: '#2D9AA5',
      percentage: mainTreatmentCount > 0 ? Math.round((mainTreatmentCount / Math.max(mainTreatmentCount, subTreatmentCount, blogCount, totalJobCount)) * 100) : 0
    },
    { 
      name: 'Sub\nTreatments', 
      value: subTreatmentCount, 
      fill: '#10B981',
      percentage: subTreatmentCount > 0 ? Math.round((subTreatmentCount / Math.max(mainTreatmentCount, subTreatmentCount, blogCount, totalJobCount)) * 100) : 0
    },
    { 
      name: 'Published\nBlogs', 
      value: blogCount, 
      fill: '#F59E0B',
      percentage: blogCount > 0 ? Math.round((blogCount / Math.max(mainTreatmentCount, subTreatmentCount, blogCount, totalJobCount)) * 100) : 0
    },
    { 
      name: 'Total\nJobs', 
      value: totalJobCount, 
      fill: '#EF4444',
      percentage: totalJobCount > 0 ? Math.round((totalJobCount / Math.max(mainTreatmentCount, subTreatmentCount, blogCount, totalJobCount)) * 100) : 0
    },
  ]), [mainTreatmentCount, subTreatmentCount, blogCount, totalJobCount]);

  const jobStatusPieData = useMemo(() => ([
    { name: 'Approved', value: approvedJobCount, fill: '#10B981', label: `Approved (${approvedJobCount})` },
    { name: 'Pending', value: pendingJobCount, fill: '#F59E0B', label: `Pending (${pendingJobCount})` },
    { name: 'Declined', value: declinedJobCount, fill: '#EF4444', label: `Declined (${declinedJobCount})` },
  ].filter((item) => item.value > 0)), [approvedJobCount, pendingJobCount, declinedJobCount]);

  const treatmentAreaData = useMemo(() => ([
    { name: 'Main', value: mainTreatmentCount },
    { name: 'Sub', value: subTreatmentCount },
  ]), [mainTreatmentCount, subTreatmentCount]);

  const contentComparisonData = useMemo(() => ([
    {
      category: 'Treatments',
      main: mainTreatmentCount,
      secondary: subTreatmentCount,
    },
    {
      category: 'Content',
      main: blogCount,
      secondary: 0,
    },
    {
      category: 'Jobs',
      main: approvedJobCount,
      secondary: pendingJobCount + declinedJobCount,
    },
  ]), [mainTreatmentCount, subTreatmentCount, blogCount, approvedJobCount, pendingJobCount, declinedJobCount]);

  const pieColors = useMemo(() => ['#2D9AA5', '#F59E0B', '#EF4444'], []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Main Treatments"
            value={mainTreatmentCount}
            icon={Activity}
            gradient="bg-gradient-to-r from-blue-500 to-blue-600"
            subtitle="Active treatment categories"
            loading={loading}
          />
          <StatCard
            title="Sub Treatments"
            value={subTreatmentCount}
            icon={TrendingUp}
            gradient="bg-gradient-to-r from-purple-500 to-purple-600"
            subtitle="Specialized subcategories"
            loading={loading}
          />
          <StatCard
            title="Published Blogs"
            value={blogCount}
            icon={FileText}
            gradient="bg-gradient-to-r from-green-500 to-green-600"
            subtitle="Content articles"
            loading={loading}
          />
          <StatCard
            title="Total Jobs"
            value={totalJobCount}
            icon={Briefcase}
            gradient="bg-gradient-to-r from-orange-500 to-orange-600"
            subtitle="All job listings"
            loading={loading}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Job Status Distribution */}
          <ChartContainer title="Job Status Distribution" icon={Target}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={jobStatusPieData}
                  cx="50%"
                  cy="40%"
                  outerRadius={80}
                  innerRadius={30}
                  dataKey="value"
                  labelLine={false}
                  label={CustomPieLabel}
                  isAnimationActive={false}
                >
                  {jobStatusPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Treatment Analysis */}
          <ChartContainer title="Treatment Distribution" icon={Activity}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={treatmentAreaData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="treatmentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2D9AA5" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#2D9AA5" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={{ stroke: '#D1D5DB' }}
                />
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={{ stroke: '#D1D5DB' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2D9AA5" 
                  strokeWidth={2}
                  fill="url(#treatmentGradient)" 
                  isAnimationActive={false}
                >
                  <LabelList 
                    dataKey="value"
                    position="top"
                    style={{ fill: '#374151', fontSize: '12px', fontWeight: '600' }}
                  />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Content Category Analysis and System Overview side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 text-black xl:grid-cols-1">
          <ChartContainer title="Content Category Analysis" icon={BarChart3} fullWidth>
            <div className="w-full h-80 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={contentComparisonData}
                  margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2D9AA5" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#2D9AA5" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

                  <XAxis
                    dataKey="category"
                    tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: '#D1D5DB' }}
                  />
                  <YAxis
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={{ stroke: '#D1D5DB' }}
                  />

                  <Bar
                    dataKey="main"
                    fill="url(#primaryGradient)"
                    name="Primary"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="main"
                      position="top"
                      style={{ fill: '#374151', fontSize: '12px', fontWeight: '600' }}
                    />
                  </Bar>

                  <Bar
                    dataKey="secondary"
                    fill="url(#secondaryGradient)"
                    name="Secondary"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="secondary"
                      position="top"
                      style={{ fill: '#374151', fontSize: '12px', fontWeight: '600' }}
                    />
                  </Bar>

                  <Legend verticalAlign="bottom" height={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>

          <ChartContainer title="System Overview" icon={BarChart3}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={overviewHistogramData}
                margin={{ top: 30, right: 30, left: 20, bottom: 40 }}
                barCategoryGap={20}
                barGap={8}
              >
                <defs>
                  <linearGradient id="histogramGradient1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2D9AA5" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#2D9AA5" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="histogramGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="histogramGradient3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="histogramGradient4" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 500 }}
                  interval={0}
                  tickMargin={12}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                  axisLine={{ stroke: '#D1D5DB' }}
                  tickLine={{ stroke: '#D1D5DB' }}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={{ stroke: '#D1D5DB' }}
                  tickLine={{ stroke: '#D1D5DB' }}
                  domain={[0, 'dataMax + 5']}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]} 
                  isAnimationActive={false}
                  fill="#8884d8"
                >
                  {overviewHistogramData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    style={{ 
                      fill: '#374151', 
                      fontSize: 11, 
                      fontWeight: 600,
                      textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                    }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Job Approval Rate</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {totalJobCount > 0 ? Math.round((approvedJobCount / totalJobCount) * 100) : 0}%
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Avg. Subcategories</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {mainTreatmentCount > 0 ? (subTreatmentCount / mainTreatmentCount).toFixed(1) : '0.0'}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Content Quality</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">Excellent</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;