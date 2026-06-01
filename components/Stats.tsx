// components/common/JobStats.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Label, LabelList, Tooltip } from 'recharts';
import { FileText, BarChart3, XCircle } from 'lucide-react';

// Type definitions (matching your existing Job interface)
interface Job {
  _id: string;
  jobTitle: string;
  companyName?: string;
  clinicName?: string;
  hospitalName?: string;
  department?: string;
  jobType?: string;
  location?: string;
  salary?: string;
  isActive: boolean;
  role?: string;
  qualification?: string;
  workingDays?: string;
  jobTiming?: string;
  skills?: string[];
  perks?: string[];
  languagesPreferred?: string[];
  description?: string;
  noOfOpenings?: number;
  establishment?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApplicationItem {
  _id: string;
  jobId: {
    _id?: string;
    jobTitle?: string;
    location?: string;
    jobType?: string;
  } | string;
  applicantId?: unknown;
  status?: string;
}

interface JobApplicationsResponse {
  applications?: ApplicationItem[];
}

interface StatsConfig {
  tokenKey: string;
  primaryColor: string;
  title?: string;
  permissions?: {
    canAccessJobs?: boolean;
    canAccessBlogs?: boolean;
    canAccessApplications?: boolean;
  };
}

interface JobStatsProps {
  role?: 'clinic' | 'doctor';
  config?: StatsConfig;
  showSections?: {
    jobTypes?: boolean;
    blogStats?: boolean;
    blogEngagement?: boolean;
  };
  isEditMode?: boolean;
  sectionWrapper?: (sectionId: string, content: React.ReactNode) => React.ReactNode;
}

interface JobTypeStats {
  [key: string]: number;
}

interface StatsData {
  totalJobs: number;
  activeJobs: number;
  inactiveJobs: number;
  jobTypeStats: JobTypeStats;
  totalOpenings: number;
}

// Blog types
interface BlogPost {
  _id: string;
  title: string;
  likesCount?: number;
  commentsCount?: number;
  createdAt?: string;
  postedBy?: { name?: string };
}

interface BlogFromAPI {
  _id: string;
  title: string;
  likes?: unknown[];
  comments?: unknown[];
  createdAt?: string;
  postedBy?: { _id?: string; name?: string };
}

interface PublishedBlogsResponse {
  success: boolean;
  blogs?: BlogFromAPI[];
  message?: string;
}

const decodeUserIdFromJwt = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadJson = atob(parts[1]);
    const payload = JSON.parse(payloadJson);
    return payload.userId || null;
  } catch {
    return null;
  }
};

// Responsive breakpoints utility
const useBreakpoints = () => {
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return {
    isXs: width < 640,
    isSm: width >= 640 && width < 768,
    isMd: width >= 768 && width < 1024,
    isLg: width >= 1024 && width < 1280,
    isXl: width >= 1280,
    width,
  };
};

const JobStats: React.FC<JobStatsProps> = ({ 
  config = {
    tokenKey: 'clinicToken',
    primaryColor: '#2D9AA5',
    title: 'Job Statistics'
  },
  showSections = {
    jobTypes: true,
    blogStats: true,
    blogEngagement: true,
  },
  isEditMode = false,
  sectionWrapper,
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState<boolean>(true);
  const [blogError, setBlogError] = useState<string>('');
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [applicationsError, setApplicationsError] = useState<string>('');
  const [applicationsLoading, setApplicationsLoading] = useState<boolean>(true);

  // Extract permission values to create stable dependencies
  const canAccessJobs = config.permissions?.canAccessJobs !== false;
  const canAccessBlogs = config.permissions?.canAccessBlogs !== false;
  const canAccessApplications = config.permissions?.canAccessApplications !== false;

  const fetchJobs = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem(config.tokenKey);
      
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
        return;
      }

      // Check if job access is explicitly denied via permissions
      if (!canAccessJobs) {
        setJobs([]);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get<{ jobs: Job[] }>('/api/job-postings/my-jobs', {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status === 200 || status === 403,
        });

        // Handle 403 - Permission denied
        if (res.status === 403) {
          setJobs([]);
          setError('');
          setLoading(false);
          return;
        }

        setJobs(res.data.jobs || []);
      } catch (axiosError: unknown) {
        // Handle 403 errors gracefully
        if (axios.isAxiosError(axiosError) && axiosError.response?.status === 403) {
          setJobs([]);
          setError('');
          return;
        }
        throw axiosError;
      }
    } catch (error) {
      // Only log non-403 errors
      if (axios.isAxiosError(error) && error.response?.status !== 403) {
        console.error('Error fetching jobs:', error);
        setError('Failed to fetch job statistics');
      }
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [config.tokenKey, canAccessJobs]);

  const fetchBlogs = useCallback(async (): Promise<void> => {
    try {
      setBlogLoading(true);
      setBlogError('');
      const token = localStorage.getItem(config.tokenKey);
      const userId = decodeUserIdFromJwt(token);

      if (!token || !userId) {
        setBlogs([]);
        setBlogLoading(false);
        return;
      }

      // Check if blog access is explicitly denied via permissions
      if (!canAccessBlogs) {
        setBlogs([]);
        setBlogLoading(false);
        return;
      }

      try {
        const res = await axios.get<PublishedBlogsResponse>('/api/blog/published', {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status === 200 || status === 403,
        });

        // Handle 403 - Permission denied
        if (res.status === 403) {
          setBlogs([]);
          setBlogError('');
          setBlogLoading(false);
          return;
        }

        const raw = res.data.blogs || [];
        const normalized = raw.map((b: BlogFromAPI) => ({
          _id: b._id,
          title: b.title,
          likesCount: Array.isArray(b.likes) ? b.likes.length : 0,
          commentsCount: Array.isArray(b.comments) ? b.comments.length : 0,
          createdAt: b.createdAt,
          postedBy: b.postedBy,
        })) as BlogPost[];

        const mine = normalized.filter((b: BlogPost) => {
          const postedBy = b.postedBy as { _id?: string };
          return postedBy && postedBy._id === userId;
        });
        setBlogs(mine);
      } catch (axiosError: unknown) {
        // Handle 403 errors gracefully
        if (axios.isAxiosError(axiosError) && axiosError.response?.status === 403) {
          setBlogs([]);
          setBlogError('');
          return;
        }
        throw axiosError;
      }
    } catch (error) {
      // Only log non-403 errors
      if (axios.isAxiosError(error) && error.response?.status !== 403) {
        console.error('Error fetching blogs:', error);
        setBlogError('Failed to fetch blog statistics');
      }
      setBlogs([]);
    } finally {
      setBlogLoading(false);
    }
  }, [config.tokenKey, canAccessBlogs]);

  const fetchApplications = useCallback(async (): Promise<void> => {
    try {
      setApplicationsLoading(true);
      setApplicationsError('');
      const token = localStorage.getItem(config.tokenKey);
      if (!token) {
        setApplications([]);
        setApplicationsLoading(false);
        return;
      }

      // Check if application access is explicitly denied via permissions
      if (!canAccessApplications) {
        setApplications([]);
        setApplicationsLoading(false);
        return;
      }

      try {
        const res = await axios.get<JobApplicationsResponse>('/api/job-postings/job-applications', {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status === 200 || status === 403,
        });

        // Handle 403 - Permission denied
        if (res.status === 403) {
          setApplications([]);
          setApplicationsError('');
          setApplicationsLoading(false);
          return;
        }

        const list = (res.data?.applications || []) as ApplicationItem[];
        setApplications(Array.isArray(list) ? list : []);
      } catch (axiosError: unknown) {
        // Handle 403 errors gracefully
        if (axios.isAxiosError(axiosError) && axiosError.response?.status === 403) {
          setApplications([]);
          setApplicationsError('');
          return;
        }
        throw axiosError;
      }
    } catch (error) {
      // Only log non-403 errors
      if (axios.isAxiosError(error) && error.response?.status !== 403) {
        console.error('Error fetching applications:', error);
        setApplicationsError('Failed to fetch job applications');
      }
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  }, [config.tokenKey, canAccessApplications]);

  useEffect(() => {
    fetchJobs();
    fetchBlogs();
    fetchApplications();
  }, [fetchJobs, fetchBlogs, fetchApplications]);

  // Calculate statistics
  const stats: StatsData = useMemo(() => {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => job.isActive).length;
    const inactiveJobs = jobs.filter(job => !job.isActive).length;
    
    // Calculate total openings
    const totalOpenings = jobs.reduce((sum, job) => {
      return sum + (job.noOfOpenings || 1);
    }, 0);

    // Calculate job type statistics
    const jobTypeStats: JobTypeStats = {};
    jobs.forEach(job => {
      const jobType = job.jobType || 'Not Specified';
      jobTypeStats[jobType] = (jobTypeStats[jobType] || 0) + 1;
    });

    return {
      totalJobs,
      activeJobs,
      inactiveJobs,
      jobTypeStats,
      totalOpenings
    };
  }, [jobs]);

  // Get job type entries sorted by count
  const sortedJobTypes = useMemo(() => {
    return Object.entries(stats.jobTypeStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6); // Show top 6 job types
  }, [stats.jobTypeStats]);

  // Blog statistics
  const totalBlogs = blogs.length;
  const topLikedBlogs = useMemo(() => {
    return [...blogs]
      .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
      .slice(0, 3);
  }, [blogs]);

  // Breakpoints for responsive charts/text
  const {isSm, isMd } = useBreakpoints();
  const nameMaxLen = isMd ? 25 : 15;
  const xAxisFontSize = isSm || isMd ? 12 : 10;
  const legendFontSize = xAxisFontSize + (isMd ? 2 : 0);
  const barCount = isMd ? 5 : 3;
  const pieOuterRadius = isMd ? 140 : (isSm ? 110 : 90);
  const pieInnerRadius = Math.round(pieOuterRadius * 0.6);

  const topCommentedBlogs = useMemo(() => {
    return [...blogs]
      .sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0))
      .slice(0, 3);
  }, [blogs]);

  // Latest three job posts
  const topAppliedJobs = useMemo(() => {
    const counts = new Map<string, { jobId: string; jobTitle: string; count: number }>();
    for (const app of applications) {
      const jobObj = app.jobId;
      const jobId = (typeof jobObj === 'string') ? jobObj : (jobObj?._id || '');
      if (!jobId) continue;
      const title = (typeof jobObj === 'string') ? (jobs.find(j => j._id === jobObj)?.jobTitle || 'Untitled') : (jobObj?.jobTitle || 'Untitled');
      const existing = counts.get(jobId);
      if (existing) existing.count += 1; else counts.set(jobId, { jobId, jobTitle: title, count: 1 });
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 3);
  }, [applications, jobs]);

  const totalTopApplications = useMemo(() => {
    return topAppliedJobs.reduce((sum, j) => sum + j.count, 0);
  }, [topAppliedJobs]);

  // Don't return early - show stats even while loading or if there's an error
  // This ensures job stats are always visible

  return (
    <div 
      className="w-full space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-0"
      data-edit-mode={isEditMode ? "true" : "false"}
    >
      {/* Error Banner - Show error but don't block stats */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-medium text-red-900">Unable to load some statistics</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button 
              onClick={fetchJobs}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

    {/* Main Statistics Cards */}
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      
      {/* Total Jobs */}
      <div className="bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total Jobs</p>
            {loading ? (
              <div className="mt-1">
                <div className="h-6 sm:h-8 md:h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded mt-2 w-2/3 animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{stats.totalJobs}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {stats.totalOpenings} total openings
                </p>
              </>
            )}
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-[#2D9AA5]/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#2D9AA5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM16 10h.01M12 14h.01M8 14h.01M8 10h.01" />
            </svg>
          </div>
        </div>
      </div>

      {/* Active Jobs */}
      <div className="bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Active Jobs</p>
            {loading ? (
              <div className="mt-1">
                <div className="h-6 sm:h-8 md:h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded mt-2 w-2/3 animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600 mt-1">{stats.activeJobs}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {stats.totalJobs > 0 ? Math.round((stats.activeJobs / stats.totalJobs) * 100) : 0}% of total
                </p>
              </>
            )}
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Inactive Jobs */}
      <div className="bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Inactive Jobs</p>
            {loading ? (
              <div className="mt-1">
                <div className="h-6 sm:h-8 md:h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded mt-2 w-2/3 animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-orange-600 mt-1">{stats.inactiveJobs}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {stats.totalJobs > 0 ? Math.round((stats.inactiveJobs / stats.totalJobs) * 100) : 0}% of total
                </p>
              </>
            )}
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
          </div>
        </div>
      </div>

      {/* Job Types Count */}
      <div className="bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200 xs:col-span-2 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Job Types</p>
            {loading ? (
              <div className="mt-1">
                <div className="h-6 sm:h-8 md:h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded mt-2 w-2/3 animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#2D9AA5] mt-1">{Object.keys(stats.jobTypeStats).length}</p>
                <p className="text-xs text-gray-500 mt-1">Different categories</p>
              </>
            )}
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-[#2D9AA5]/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#2D9AA5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    {/* Job Types Distribution - Show when there are jobs */}
    {showSections.jobTypes && stats.totalJobs > 0 && (
      sectionWrapper ? sectionWrapper('stats-job-types',
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 relative">
        {sortedJobTypes.length > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
              <h3 className="text-base font-bold text-black">Job Types Distribution</h3>
              <span className="text-xs text-gray-500">{stats.totalJobs} total jobs</span>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {/* Pie Chart */}
              <div className="h-48 sm:h-56 md:h-64 flex items-center justify-center order-2 xl:order-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="pieGrad1" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#2D9AA5" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                      <linearGradient id="pieGrad2" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#16a34a" />
                      </linearGradient>
                      <linearGradient id="pieGrad3" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                      <linearGradient id="pieGrad4" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                      <linearGradient id="pieGrad5" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#db2777" />
                      </linearGradient>
                      <linearGradient id="pieGrad6" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={sortedJobTypes.map(([jobType, count]) => ({
                        name: jobType,
                        value: count,
                        percentage: stats.totalJobs > 0 ? Math.round((count / stats.totalJobs) * 100) : 0
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => {
                        const p = Math.round((percent || 0) * 100);
                        const displayName = name || '';
                        if (window.innerWidth < 640) return `${p}%`;
                        if (window.innerWidth < 768) return `${displayName.length > 8 ? displayName.substring(0, 8) + '...' : displayName} (${p}%)`;
                        return `${displayName} (${p}%)`;
                      }}
                      innerRadius={window.innerWidth < 640 ? 40 : window.innerWidth < 768 ? 60 : pieInnerRadius}
                      outerRadius={window.innerWidth < 640 ? 80 : window.innerWidth < 768 ? 100 : pieOuterRadius}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sortedJobTypes.map((_, index) => {
                        const fills = [
                          'url(#pieGrad1)',
                          'url(#pieGrad2)',
                          'url(#pieGrad3)',
                          'url(#pieGrad4)',
                          'url(#pieGrad5)',
                          'url(#pieGrad6)'
                        ];
                        return <Cell key={`cell-${index}`} fill={fills[index % fills.length]} stroke="#ffffff" strokeWidth={1} />;
                      })}
                      <Label 
                        value={`${stats.totalJobs} Jobs`} 
                        position="center" 
                        fill="#111827" 
                        fontSize={window.innerWidth < 640 ? 12 : window.innerWidth < 768 ? 14 : 16} 
                      />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with always visible data */}
              <div className="space-y-1.5 sm:space-y-2 order-1 xl:order-2">
                {sortedJobTypes.map(([jobType, count], index) => {
                  const percentage = stats.totalJobs > 0 ? (count / stats.totalJobs) * 100 : 0;
                  const colors = [
                    'bg-[#2D9AA5]',
                    'bg-green-500', 
                    'bg-purple-500',
                    'bg-orange-500',
                    'bg-pink-500',
                    'bg-indigo-500'
                  ];
                  
                  return (
                    <div key={jobType} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colors[index % colors.length]}`}></div>
                        <span className="font-medium text-gray-700 flex-1 text-xs sm:text-sm md:text-base truncate" title={jobType}>{jobType}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <div className="w-12 sm:w-16 md:w-24 lg:w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${colors[index % colors.length]}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-right min-w-[45px] sm:min-w-[50px] md:min-w-[60px]">
                          <span className="font-bold text-gray-900 text-xs sm:text-sm md:text-base">{count}</span>
                          <span className="text-xs sm:text-sm text-gray-500 ml-1">({Math.round(percentage)}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm sm:text-base text-gray-500">No job types data available</p>
          </div>
        )}

        {/* Top Jobs by Applications - Always show when there are jobs */}
        <div className="mt-3 bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900">Top Jobs by Applications</h4>
            {applicationsLoading ? (
              <span className="text-xs text-gray-500">Loading…</span>
            ) : (
              <span className="text-xs text-gray-500">Top 3</span>
            )}
          </div>
          {applicationsError && (
            <div className="text-black mb-2 bg-red-50 border border-red-200 rounded p-2 text-xs sm:text-sm text-red-700">{applicationsError}</div>
          )}
          {(!applicationsLoading && topAppliedJobs.length === 0) ? (
            <p className="text-xs sm:text-sm text-gray-500">No applications yet</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {(applicationsLoading ? [] : topAppliedJobs).map((item) => (
                <div key={item.jobId} className="py-1.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-800 truncate" title={item.jobTitle}>{item.jobTitle}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-1.5 py-0.5 rounded bg-[#2D9AA5]/10 text-[#2D9AA5] text-xs font-semibold">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mini chart for top applied jobs with always visible data */}
          {!applicationsLoading && topAppliedJobs.length > 0 && (
            <div className="text-black mt-2 grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Vertical Bar Chart with data labels */}
              <div className="h-36 sm:h-40 md:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topAppliedJobs.map((item, idx) => ({
                      rank: `#${idx + 1}`,
                      name: item.jobTitle.length > (window.innerWidth < 640 ? 10 : nameMaxLen) 
                        ? item.jobTitle.substring(0, window.innerWidth < 640 ? 10 : nameMaxLen) + '…' 
                        : item.jobTitle,
                      applications: item.count,
                    }))}
                    layout="vertical"
                    margin={{ top: 8, right: window.innerWidth < 640 ? 25 : 16, left: window.innerWidth < 640 ? 10 : 16, bottom: 8 }}
                  >
                    <defs>
                      <linearGradient id="appsGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis type="number" tick={{ fontSize: window.innerWidth < 640 ? 10 : xAxisFontSize }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: window.innerWidth < 640 ? 10 : xAxisFontSize }} 
                      width={window.innerWidth < 640 ? 80 : (isSm || isMd) ? 140 : 110} 
                    />
                    <Bar dataKey="applications" fill="url(#appsGradient)" radius={[6, 6, 0, 0]} barSize={window.innerWidth < 640 ? 16 : 22}>
                      <LabelList 
                        dataKey="applications" 
                        position="right" 
                        formatter={(label) => `${label as string}`} 
                        style={{ fontSize: `${window.innerWidth < 640 ? 10 : xAxisFontSize}px` }} 
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Donut share of applications with data labels */}
              <div className="h-36 sm:h-40 md:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="appsDonut1" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#2D9AA5" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                      <linearGradient id="appsDonut2" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#16a34a" />
                      </linearGradient>
                      <linearGradient id="appsDonut3" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={topAppliedJobs.map((i) => ({ name: i.jobTitle, value: i.count }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={window.innerWidth < 640 ? 40 : window.innerWidth < 768 ? 50 : isMd ? 70 : 60}
                      outerRadius={window.innerWidth < 640 ? 70 : window.innerWidth < 768 ? 80 : isMd ? 100 : 85}
                      labelLine={false}
                      label={({ value}) => {
                        const percentage = Math.round(((value as number) / Math.max(totalTopApplications, 1)) * 100);
                        if (window.innerWidth < 640) return `${percentage}%`;
                        return `${percentage}% (${value})`;
                      }}
                    >
                      {topAppliedJobs.map((_, idx) => (
                        <Cell key={`apps-slice-${idx}`} fill={`url(#appsDonut${(idx % 3) + 1})`} stroke="#ffffff" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Legend 
                      wrapperStyle={{ 
                        fontSize: `${window.innerWidth < 640 ? 10 : legendFontSize}px`,
                        bottom: 0
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
          </div>
        )}
      </div>
      </div>
      ) : (
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 relative">
          <div className="text-center py-8">
            <p className="text-gray-500">Job Types Distribution section</p>
          </div>
        </div>
      ))}

      {/* Blog Statistics - Enhanced Design */}
      {showSections.blogStats && (
      sectionWrapper ? sectionWrapper('stats-blog-stats',
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-lg p-6 mb-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-green-200/20 to-blue-200/20 rounded-full blur-2xl -ml-16 -mb-16"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black">Blog Statistics</h3>
              <p className="text-xs text-gray-500 mt-1">Track your blog performance</p>
            </div>
          </div>
          {blogLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loading…</span>
            </div>
          ) : (
            <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-blue-200">
              <span className="text-sm font-semibold text-blue-700">{totalBlogs} Total Blogs</span>
            </div>
          )}
        </div>

        {blogError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700 flex items-center gap-2">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span>{blogError}</span>
          </div>
        )}

        {/* Blog summary cards - Enhanced */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Total Blogs Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-5 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Blogs</p>
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{totalBlogs}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>All published blogs</span>
            </div>
          </div>

          {/* Top Liked Blogs Card */}
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border-2 border-pink-200 p-5 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">Top 3 Most Liked</p>
            </div>
            <div className="space-y-2">
              {(blogLoading ? [] : topLikedBlogs).map((b, index) => (
                <div key={b._id} className="flex items-center justify-between gap-2 p-2 bg-white/60 rounded-lg border border-pink-100 hover:bg-white transition-colors">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-bold text-pink-600 w-4">{index + 1}</span>
                    <span className="text-xs text-gray-800 truncate flex-1" title={b.title}>{b.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 px-2 py-1 bg-pink-100 rounded-lg">
                    <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-bold text-pink-700">{b.likesCount || 0}</span>
                  </div>
                </div>
              ))}
              {!blogLoading && topLikedBlogs.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-2">No liked blogs yet</p>
              )}
            </div>
          </div>

          {/* Top Commented Blogs Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 p-5 hover:shadow-lg transition-all duration-300 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">Top 3 Most Commented</p>
            </div>
            <div className="space-y-2">
              {(blogLoading ? [] : topCommentedBlogs).map((b, index) => (
                <div key={b._id} className="flex items-center justify-between gap-2 p-2 bg-white/60 rounded-lg border border-emerald-100 hover:bg-white transition-colors">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-bold text-emerald-600 w-4">{index + 1}</span>
                    <span className="text-xs text-gray-800 truncate flex-1" title={b.title}>{b.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 px-2 py-1 bg-emerald-100 rounded-lg">
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-xs font-bold text-emerald-700">{b.commentsCount || 0}</span>
                  </div>
                </div>
              ))}
              {!blogLoading && topCommentedBlogs.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-2">No comments yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Bar Chart for Blog Performance - Enhanced */}
        {showSections.blogEngagement && !blogLoading && (topLikedBlogs.length > 0 || topCommentedBlogs.length > 0) ? (
          sectionWrapper ? sectionWrapper('stats-blog-engagement',
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mt-6 shadow-sm relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Blog Engagement Overview</h4>
            </div>
            <div className="h-64 sm:h-72 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    ...topLikedBlogs.map(blog => ({
                      name: blog.title.length > (window.innerWidth < 640 ? 10 : nameMaxLen) 
                        ? blog.title.substring(0, window.innerWidth < 640 ? 10 : nameMaxLen) + '...' 
                        : blog.title,
                      likes: blog.likesCount || 0,
                      comments: topCommentedBlogs.find(c => c._id === blog._id)?.commentsCount || 0
                    })),
                    ...topCommentedBlogs
                      .filter(blog => !topLikedBlogs.find(l => l._id === blog._id))
                      .map(blog => ({
                        name: blog.title.length > (window.innerWidth < 640 ? 10 : nameMaxLen) 
                          ? blog.title.substring(0, window.innerWidth < 640 ? 10 : nameMaxLen) + '...' 
                          : blog.title,
                        likes: 0,
                        comments: blog.commentsCount || 0
                      }))
                  ].slice(0, window.innerWidth < 640 ? 3 : barCount)}
                  margin={{
                    top: 20,
                    right: window.innerWidth < 640 ? 20 : (isSm || isMd) ? 30 : 20,
                    left: window.innerWidth < 640 ? 5 : (isSm || isMd) ? 20 : 10,
                    bottom: window.innerWidth < 640 ? 50 : (isSm || isMd) ? 80 : 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: window.innerWidth < 640 ? 10 : 12, fill: '#6b7280' }}
                    angle={window.innerWidth < 640 ? -90 : isMd ? -45 : -60}
                    textAnchor="end"
                    height={window.innerWidth < 640 ? 50 : (isSm || isMd) ? 80 : 60}
                    interval={0}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    tick={{ fontSize: window.innerWidth < 640 ? 10 : 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
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
                  
                  <Legend 
                    wrapperStyle={{ 
                      fontSize: `${window.innerWidth < 640 ? 11 : 13}px`,
                      paddingTop: '10px'
                    }} 
                  />
                  <Bar dataKey="likes" fill="url(#likesGradient)" name="Likes" radius={[8, 8, 0, 0]}>
                    <LabelList 
                      dataKey="likes" 
                      position="top" 
                      style={{ fontSize: window.innerWidth < 640 ? 10 : 12, fontWeight: 600, fill: '#ec4899' }} 
                    />
                  </Bar>
                  <Bar dataKey="comments" fill="url(#commentsGradient)" name="Comments" radius={[8, 8, 0, 0]}>
                    <LabelList 
                      dataKey="comments" 
                      position="top" 
                      style={{ fontSize: window.innerWidth < 640 ? 10 : 12, fontWeight: 600, fill: '#10b981' }} 
                    />
                  </Bar>
                  <defs>
                    <linearGradient id="likesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#f472b6" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="commentsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          ) : (
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mt-6 shadow-sm relative">
              <div className="text-center py-8">
                <p className="text-gray-500">Blog Engagement Overview section</p>
              </div>
            </div>
          )) : null}
      </div>
      </div>
      ) : (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-lg p-6 mb-6 relative overflow-hidden">
          <div className="text-center py-8">
            <p className="text-gray-500">Blog Statistics section</p>
          </div>
        </div>
      ))}

      {/* Empty State */}
    {stats.totalJobs === 0 && (
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl border border-gray-200 text-center">
        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM16 10h.01M12 14h.01M8 14h.01M8 10h.01" />
          </svg>
        </div>
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2">No Job Posts Yet</h3>
        <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-4">Create your first job posting to see statistics here.</p>
      </div>
    )}
  </div>
);
};

export default JobStats;
