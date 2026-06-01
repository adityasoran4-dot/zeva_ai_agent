// components/JobApplicants.tsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Users, Mail, Phone, FileText, Search, Filter, X} from 'lucide-react';

interface JobInfo {
  jobTitle: string;
  location: string;
  jobType: string;
}

interface ApplicantInfo {
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface Application {
  _id: string;
  jobId: JobInfo;
  applicantId: ApplicantInfo;
  status: string;
  resumeUrl?: string;
  createdAt?: string;
}

// ✅ Added interface for API response
interface ApplicationsResponse {
  applications: Application[];
}

type FilterType = 'All' | 'Part Time' | 'Full Time' | 'Internship';
type StatusFilter = 'All' | 'pending' | 'contacted' | 'rejected';
type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'job-title' | 'status';

interface ApplicationsDashboardProps {
  tokenKey?: string;
  apiEndpoint?: string;
  updateStatusEndpoint?: string;
  deleteEndpoint?: string;
  permissions?: {
    canRead?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  };
}

const ApplicationsDashboard: React.FC<ApplicationsDashboardProps> = ({
  tokenKey = "clinicToken",
  apiEndpoint = "/api/job-postings/job-applications",
  updateStatusEndpoint = "/api/job-postings/application-status",
  deleteEndpoint = "/api/job-postings/delete-application",
  permissions = {
    canRead: true,
    canUpdate: true,
    canDelete: true,
  }
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<FilterType>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Resolve auth token with fallbacks (supports doctorStaff/userToken)
  const getAuthToken = (): string | null => {
    if (typeof window === "undefined") return null;

    // 1) Try explicit tokenKey first
    const primaryToken =
      localStorage.getItem(tokenKey) || sessionStorage.getItem(tokenKey);
    if (primaryToken) return primaryToken;

    // 2) Fallbacks: agentToken > userToken > clinicToken > doctorToken > adminToken
    const fallbackKeys = [
      "agentToken",
      "userToken",
      "clinicToken",
      "doctorToken",
      "adminToken",
    ];

    for (const key of fallbackKeys) {
      const value =
        localStorage.getItem(key) || sessionStorage.getItem(key);
      if (value) return value;
    }

    return null;
  };

  useEffect(() => {
    const fetchApplications = async () => {
      // Don't fetch if no read permission
      if (!permissions.canRead) {
        setLoading(false);
        return;
      }

      const token = getAuthToken();
      if (!token) {
        setApplications([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // ✅ Fixed TypeScript error with proper typing
        const res = await axios.get<ApplicationsResponse>(apiEndpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          validateStatus: (status) => status === 200 || status === 403,
        });

        if (res.status === 403) {
          setApplications([]);
          return;
        }

        setApplications(res.data.applications || []);
      } catch (error: any) {
        console.error("Failed to load applications", error);
        const errorMessage = error?.response?.data?.message || "Failed to load applications. Please try again.";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [tokenKey, apiEndpoint, permissions.canRead]);

  const exportApplicantsToCSV = () => {
    if (applications.length === 0) {
      toast.error("No applicants to export");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Job Title",
      "Location",
      "Job Type",
      "Status",
      "Applied At"
    ];

    const csvContent = [
      headers.join(","),
      ...applications.map(app => [
        `"${(app.applicantId?.name || "").replace(/"/g, '""')}"`,
        `"${(app.applicantId?.email || "").replace(/"/g, '""')}"`,
        `"${(app.applicantId?.phone || "").replace(/"/g, '""')}"`,
        `"${(app.jobId?.jobTitle || "").replace(/"/g, '""')}"`,
        `"${(app.jobId?.location || "").replace(/"/g, '""')}"`,
        `"${(app.jobId?.jobType || "").replace(/"/g, '""')}"`,
        `"${(app.status || "").replace(/"/g, '""')}"`,
        `"${app.createdAt ? new Date(app.createdAt).toLocaleString() : ""}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `applicants_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Applicants exported successfully");
  };
  
  void exportApplicantsToCSV;

  const updateStatus = async (applicationId: string, status: string): Promise<void> => {
    if (!permissions.canUpdate) {
      toast.error("You do not have permission to update application status.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    try {
      await axios.put(updateStatusEndpoint, {
        applicationId,
        status
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setApplications((prev) =>
        prev.map((app) =>
          app._id === applicationId ? { ...app, status } : app
        )
      );
      
      const statusLabels: Record<string, string> = {
        contacted: 'Contacted',
        rejected: 'Rejected',
        pending: 'Pending'
      };
      toast.success(`Application status updated to ${statusLabels[status] || status}`);
    } catch (error: any) {
      console.error("Status update failed", error);
      const errorMessage = error?.response?.data?.message || "Failed to update status. Please try again.";
      toast.error(errorMessage);
    }
  };

  const deleteApplication = async (applicationId: string): Promise<void> => {
    if (!permissions.canDelete) {
      toast.error("You do not have permission to delete applications.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    try {
      await axios.delete(`${deleteEndpoint}/${applicationId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setApplications(prev => prev.filter(app => app._id !== applicationId));
      setShowDeleteModal(false);
      setApplicationToDelete(null);
      toast.success("Application deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete application", error);
      const errorMessage = error?.response?.data?.message || "Failed to delete application. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleDeleteClick = (app: Application): void => {
    setApplicationToDelete(app);
    setShowDeleteModal(true);
  };

  // ✅ Get unique values for filter dropdowns
  const uniqueLocations = useMemo(() => {
    const locations = applications.map(app => app.jobId?.location).filter(Boolean);
    return ['All', ...Array.from(new Set(locations))];
  }, [applications]);

  const uniqueRoles = useMemo(() => {
    const roles = applications.map(app => app.applicantId?.role).filter(Boolean);
    return ['All', ...Array.from(new Set(roles))];
  }, [applications]);

  // ✅ Advanced filtering and sorting logic
  const filteredAndSortedApplications = useMemo(() => {
    const filtered = applications.filter(app => {
      // Job type filter
      if (filter !== 'All' && app.jobId?.jobType !== filter) return false;
      
      // Status filter
      if (statusFilter !== 'All' && (app.status || 'pending') !== statusFilter) return false;
      
      // Location filter
      if (locationFilter !== 'All' && app.jobId?.location !== locationFilter) return false;
      
      // Role filter
      if (roleFilter !== 'All' && app.applicantId?.role !== roleFilter) return false;
      
      // Search query (searches in job title, applicant name, email)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const jobTitle = app.jobId?.jobTitle?.toLowerCase() || '';
        const applicantName = app.applicantId?.name?.toLowerCase() || '';
        const applicantEmail = app.applicantId?.email?.toLowerCase() || '';
        
        if (!jobTitle.includes(query) && !applicantName.includes(query) && !applicantEmail.includes(query)) {
          return false;
        }
      }
      
      return true;
    });

    // Sort applications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'name-asc':
          return (a.applicantId?.name || '').localeCompare(b.applicantId?.name || '');
        case 'name-desc':
          return (b.applicantId?.name || '').localeCompare(a.applicantId?.name || '');
        case 'job-title':
          return (a.jobId?.jobTitle || '').localeCompare(b.jobId?.jobTitle || '');
        case 'status':
          return (a.status || 'pending').localeCompare(b.status || 'pending');
        default:
          return 0;
      }
    });

    return filtered;
  }, [applications, filter, statusFilter, searchQuery, locationFilter, roleFilter, sortBy]);

  const clearAllFilters = () => {
    setFilter('All');
    setStatusFilter('All');
    setSearchQuery('');
    setLocationFilter('All');
    setRoleFilter('All');
    setSortBy('newest');
  };

  const filterOptions: FilterType[] = ['All', 'Part Time', 'Full Time', 'Internship'];
  const statusOptions: StatusFilter[] = ['All', 'pending', 'contacted', 'rejected'];
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'job-title', label: 'Job Title' },
    { value: 'status', label: 'Status' }
  ];

  // Stats calculations
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => (app.status || 'pending') === 'pending').length;
  const contactedApplications = applications.filter(app => app.status === 'contacted').length;
  const rejectedApplications = applications.filter(app => app.status === 'rejected').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-sm text-gray-700">Loading applications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Don't render content if no read permission
  if (!permissions.canRead) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-700 mb-4">
              You do not have permission to view job applicants.
            </p>
            <p className="text-sm text-gray-700">
              Please contact your administrator to request access to the Job Applicants module.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-1 sm:p-2">
      <div className="max-w-9xl mx-auto">
        {/* Header - Compact & Top */}
        <div className="mb-1 sm:mb-1.5">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-sm">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-gray-900">Job Applicants</h1>
              <p className="text-[8px] sm:text-[9px] text-gray-700 mt-0.5">Manage and review job applications</p>
            </div>
          </div>

          {/* Stats Cards - Compact & Top */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-1.5 mb-1.5">
            <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] text-gray-700">Total</p>
                  <p className="text-sm sm:text-base font-bold text-gray-900">{totalApplications}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] text-gray-700">Pending</p>
                  <p className="text-sm sm:text-base font-bold text-gray-900">{pendingApplications}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] text-gray-700">Contacted</p>
                  <p className="text-sm sm:text-base font-bold text-gray-900">{contactedApplications}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] text-gray-700">Rejected</p>
                  <p className="text-sm sm:text-base font-bold text-gray-900">{rejectedApplications}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section - Compact & Attractive */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2 sm:p-3 mb-2">
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Search Bar with Advanced Filter on opposite side */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <input
                  type="text"
                  placeholder="Search by job title, applicant name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 sm:py-2 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition bg-white"
                />
              </div>
              
              {/* Advanced Filter Button - Opposite side */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${
                  showAdvancedFilters
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Advanced</span>
                <span className="sm:hidden">Filter</span>
              </button>
              
              {/* <button
                onClick={exportApplicantsToCSV}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap bg-green-600 text-white hover:bg-green-700 shadow-sm"
              >
                <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Export</span>
              </button> */}
            </div>

            {/* Quick Filters - Compact */}
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[9px] sm:text-[10px] font-medium transition-colors ${
                    filter === type
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
              
              {/* Clear All Button */}
              {(filter !== 'All' || statusFilter !== 'All' || searchQuery || locationFilter !== 'All' || roleFilter !== 'All' || sortBy !== 'newest') && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white border border-gray-300 rounded-md text-[9px] sm:text-[10px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Filters - Compact */}
        {showAdvancedFilters && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2 sm:p-3 mb-2 pb-16 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {/* Status Filter */}
              <div>
                <label className="block text-[9px] sm:text-[10px] font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="text-black w-full px-2 py-1.5 text-[9px] sm:text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition bg-white"
                  style={{ zIndex: 1001, position: 'relative' }}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status === 'All' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-[9px] sm:text-[10px] font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="text-black w-full px-2 py-1.5 text-[9px] sm:text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition bg-white"
                  style={{ zIndex: 1000, position: 'relative' }}
                >
                  {uniqueLocations.map(location => (
                    <option key={location} value={location}>
                      {location === 'All' ? 'All Locations' : location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-[9px] sm:text-[10px] font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="text-black w-full px-2 py-1.5 text-[9px] sm:text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition bg-white"
                  style={{ zIndex: 999, position: 'relative' }}
                >
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>
                      {role === 'All' ? 'All Roles' : role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[9px] sm:text-[10px] font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-black w-full px-2 py-1.5 text-[9px] sm:text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition bg-white"
                  style={{ zIndex: 1001, position: 'relative' }}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results Count - Compact */}
        <div className="mb-1.5 text-[9px] sm:text-[10px] text-gray-700">
          Showing {filteredAndSortedApplications.length} of {applications.length} applications
          {searchQuery && ` matching "${searchQuery}"`}
        </div>

        {/* Applications - Compact */}
        {filteredAndSortedApplications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5">
              {applications.length === 0 
                ? 'No Applications Yet' 
                : 'No Applications Found'
              }
            </h3>
            <p className="text-[9px] sm:text-[10px] text-gray-700 mb-4 max-w-md mx-auto">
              {applications.length === 0 
                ? 'When candidates apply for your job postings, their applications will appear here.' 
                : 'Try adjusting your search criteria or filters to find what you\'re looking for.'
              }
            </p>
            {applications.length > 0 && (
              <button
                onClick={clearAllFilters}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-[9px] sm:text-[10px] font-medium shadow-sm"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            {filteredAndSortedApplications.map((app) => (
              <div key={app._id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-2 sm:p-2.5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 sm:gap-3">
                  {/* Left: Job & Applicant Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xs sm:text-sm text-gray-900 truncate">{app.jobId?.jobTitle}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {app.jobId?.location && (
                            <span className="text-gray-700 text-[8px] sm:text-[9px] flex items-center gap-0.5">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {app.jobId.location}
                            </span>
                          )}
                          {app.jobId?.jobType && (
                            <span className="text-gray-700 text-[8px] sm:text-[9px] flex items-center gap-0.5">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {app.jobId.jobType}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[8px] sm:text-[9px] font-semibold flex-shrink-0 ${
                        app.status === 'contacted' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status === 'contacted' && (
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {app.status === 'rejected' && (
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        {app.status === 'pending' && (
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {app.status || "Pending"}
                      </span>
                    </div>
                    
                    <div className="space-y-1.5 text-[9px] sm:text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700">Applicant:</span>
                        <span className="font-semibold text-gray-900 truncate">{app.applicantId?.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700">Email:</span>
                        <a href={`mailto:${app.applicantId?.email}`} className="text-gray-900 hover:text-gray-700 hover:underline font-medium truncate">
                          {app.applicantId?.email}
                        </a>
                      </div>
                      {app.resumeUrl && (
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-700">Resume:</span>
                          <a
                            href={app.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-900 hover:text-gray-700 hover:underline font-medium flex items-center gap-1"
                          >
                            View Resume
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.001" />
                        </svg>
                        <span className="text-gray-700">Role:</span>
                        <span className="text-gray-900 font-medium truncate">{app.applicantId?.role || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700">Phone:</span>
                        <a href={`tel:${app.applicantId?.phone}`} className="text-gray-900 hover:text-gray-700 hover:underline font-medium">
                          {app.applicantId?.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions - Compact */}
                  <div className="flex flex-row lg:flex-col gap-1.5 lg:min-w-[100px]">
                    {permissions.canUpdate && (
                      <>
                        <button
                          className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-md text-[9px] sm:text-[10px] font-medium transition-colors flex-1 lg:flex-none flex items-center justify-center gap-1 shadow-sm"
                          onClick={() => updateStatus(app._id, "contacted")}
                        >
                          <Mail className="w-3 h-3" />
                          Contact
                        </button>
                        <button
                          className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-[9px] sm:text-[10px] font-medium transition-colors flex-1 lg:flex-none flex items-center justify-center gap-1 shadow-sm"
                          onClick={() => updateStatus(app._id, "rejected")}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      </>
                    )}
                    {permissions.canDelete && (
                      <button
                        className="px-2.5 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-[9px] sm:text-[10px] font-medium transition-colors flex-1 lg:flex-none flex items-center justify-center gap-1 shadow-sm"
                        onClick={() => handleDeleteClick(app)}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => {
              setShowDeleteModal(false);
              setApplicationToDelete(null);
            }}
          />
          <div className="fixed inset-x-4 top-1/2 transform -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Delete Application</h3>
                    <p className="text-sm text-red-700">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete the application from <strong>{applicationToDelete?.applicantId?.name}</strong>?
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-semibold text-gray-900">{applicationToDelete?.jobId?.jobTitle}</p>
                  <p className="text-sm text-gray-700 mt-1">{applicationToDelete?.applicantId?.email}</p>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setApplicationToDelete(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => applicationToDelete && deleteApplication(applicationToDelete._id)}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200"
                  >
                    Delete Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ApplicationsDashboard;
