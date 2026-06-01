    import React from "react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/withAdminAuth';
import type { NextPageWithLayout } from '../_app';
import { useAgentPermissions } from '../../hooks/useAgentPermissions';
import {
  PhoneIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  XCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Add Lead interface
interface Lead {
    name: string;
    phone: string;
    location: string;
    query: string;
    createdAt: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Toast Component
const Toast = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircleIcon className="w-4 h-4" />,
    error: <XCircleIcon className="w-4 h-4" />,
    info: <InformationCircleIcon className="w-4 h-4" />,
    warning: <ExclamationTriangleIcon className="w-4 h-4" />,
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div
      className={`${colors[toast.type]} text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs animate-slide-in`}
    >
      {icons[toast.type]}
      <span className="flex-1 font-medium">{toast.message}</span>
      <button
        onClick={onClose}
        className="hover:bg-white/20 rounded p-0.5 transition-colors"
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
    ))}
  </div>
);

// Add type for sortable fields
type SortField = keyof Lead;

function LeadsPage() {
    const router = useRouter();
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const itemsPerPage = 25;
    const searchBarRef = React.useRef<HTMLInputElement>(null);
    
    // Toast helper functions
    const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);
    
    // Check if user is an admin or agent
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isAgent, setIsAgent] = useState<boolean>(false);
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const adminToken = !!localStorage.getItem('adminToken');
            const agentToken = !!localStorage.getItem('agentToken');
            const isAgentRoute = router.pathname?.startsWith('/agent/') || window.location.pathname?.startsWith('/agent/');
            
            if (isAgentRoute && agentToken) {
                setIsAdmin(false);
                setIsAgent(true);
            } else if (adminToken) {
                setIsAdmin(true);
                setIsAgent(false);
            } else if (agentToken) {
                setIsAdmin(false);
                setIsAgent(true);
            } else {
                setIsAdmin(false);
                setIsAgent(false);
            }
        }
    }, [router.pathname]);
    
    const agentPermissionsData: any = useAgentPermissions(isAgent ? "admin_request_callback" : (null as any));
    const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
    const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                setLoading(true);
                const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
                const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
                const token = adminToken || agentToken;

                if (!token) {
                    console.error("No token found");
                    setLoading(false);
                    showToast('No authentication token found', 'error');
                    return;
                }

                const res = await fetch("/api/admin/getintouch", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) {
                    if (res.status === 403) {
                        setLeads([]);
                        showToast('You do not have permission to view callback requests', 'error');
                        setLoading(false);
                        return;
                    }
                    throw new Error('Failed to fetch leads');
                }

                const data = await res.json();
                const leadsData = data.data || [];
                setLeads(leadsData);
                if (leadsData.length > 0) {
                  showToast(`Loaded ${leadsData.length} callback request(s)`, 'success');
                }
            } catch (error: any) {
                console.error('Failed to fetch leads:', error);
                showToast('Failed to load callback requests', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (isAdmin) {
            fetchLeads();
        } else if (isAgent) {
            if (!permissionsLoading) {
                if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
                    fetchLeads();
                } else {
                    setLoading(false);
                }
            }
        } else {
            setLoading(false);
        }
    }, [isAdmin, isAgent, permissionsLoading, agentPermissions, showToast]);

    // Get unique locations for filter dropdown
    const uniqueLocations = useMemo(() => {
        const locations = leads.map(lead => lead.location).filter(Boolean);
        return [...new Set(locations)].sort();
    }, [leads]);

    // Analytics data
    const analyticsData = useMemo(() => {
        // Daily requests for the last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            const count = leads.filter(lead =>
                new Date(lead.createdAt).toDateString() === dateString
            ).length;
            last7Days.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                requests: count
            });
        }

        // Month-wise aggregation for the last 12 months
        const monthWiseCounts: Record<string, number> = {};
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            monthWiseCounts[key] = 0;
        }
        leads.forEach(lead => {
            const date = new Date(lead.createdAt);
            const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            if (monthWiseCounts[key] !== undefined) {
                monthWiseCounts[key]++;
            }
        });
        const monthWiseData = Object.entries(monthWiseCounts).map(([month, count]) => ({ month, count }));

        // Top locations
        const locationCounts: Record<string, number> = {};
        leads.forEach(lead => {
            if (lead.location) {
                locationCounts[lead.location] = (locationCounts[lead.location] || 0) + 1;
            }
        });
        const topLocations = Object.entries(locationCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([location, count]) => ({ location, count }));

        // Recent activity (last 30 days vs previous 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const recentRequests = leads.filter(lead =>
            new Date(lead.createdAt) >= thirtyDaysAgo
        ).length;

        const previousRequests = leads.filter(lead => {
            const createdAt = new Date(lead.createdAt);
            return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
        }).length;

        const growthPercentage = previousRequests === 0 ? 100 :
            (((recentRequests - previousRequests) / previousRequests) * 100);

        return {
            dailyRequests: last7Days,
            monthWiseData,
            topLocations,
            recentRequests,
            growthPercentage: parseFloat(growthPercentage.toFixed(1))
        };
    }, [leads]);

    // Filter and sort leads
    const filteredAndSortedLeads = useMemo(() => {
        const filtered = leads.filter(lead => {
            const matchesSearch = !searchTerm ||
                lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.phone?.includes(searchTerm) ||
                lead.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.query?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDate = !dateFilter ||
                new Date(lead.createdAt).toDateString() === new Date(dateFilter).toDateString();

            const matchesLocation = !locationFilter || lead.location === locationFilter;

            return matchesSearch && matchesDate && matchesLocation;
        });

        filtered.sort((a, b) => {
            let aVal: string | Date = a[sortField];
            let bVal: string | Date = b[sortField];

            if (sortField === "createdAt") {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }

            if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [leads, searchTerm, dateFilter, locationFilter, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedLeads.length / itemsPerPage);
    const paginatedLeads = filteredAndSortedLeads.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const downloadCSV = () => {
        const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
        const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
        const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
        
        if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canExport !== true && agentPermissions.canAll !== true) {
            showToast("You do not have permission to export callback requests", 'error');
            return;
        }
        
        if (!filteredAndSortedLeads.length) {
          showToast('No data to export', 'warning');
          return;
        }

        try {
          const headers = ["Name", "Phone", "Location", "Query", "Date"];
          const rows = filteredAndSortedLeads.map((lead) => [
              lead.name,
              lead.phone,
              lead.location,
              `"${lead.query?.replace(/"/g, '""') || ''}"`,
              new Date(lead.createdAt).toLocaleString(),
          ]);

          const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `request-callback_${Date.now()}.csv`;
          link.click();
          showToast('CSV file downloaded successfully', 'success');
        } catch (error) {
          showToast('Failed to download CSV file', 'error');
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setDateFilter("");
        setLocationFilter("");
        setSortField("createdAt");
        setSortDirection("desc");
        setCurrentPage(1);
        showToast('Filters cleared', 'info');
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
        setCurrentPage(1);
        showToast(`Sorted by ${field} (${sortDirection === "asc" ? "ascending" : "descending"})`, 'info');
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronLeftIcon className="w-3 h-3 opacity-30 rotate-90" />;
        return sortDirection === "asc" ? <ChevronLeftIcon className="w-3 h-3 rotate-90" /> : <ChevronLeftIcon className="w-3 h-3 -rotate-90" />;
    };

    // Check if agent has read permission
    const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true));

    if (loading || (isAgent && permissionsLoading)) {
        return (
            <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 mx-auto"></div>
                    <p className="mt-3 text-sm text-blue-700">Loading requests...</p>
                </div>
            </div>
        );
    }

    if (isAgent && !hasReadPermission) {
        return (
            <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-sm p-6 max-w-sm w-full text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <XCircleIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-blue-900 mb-2">Access Denied</h2>
                    <p className="text-sm text-blue-700">
                        You do not have permission to view callback requests.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blue-50 p-4 sm:p-6">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            
            <div className="max-w-7xl mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-800 p-2 rounded-lg">
                                <PhoneIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-blue-900">Request Call Back</h1>
                                <p className="text-xs text-blue-700">Manage and track customer callback requests</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowFilters(!showFilters);
                                    if (!showFilters) {
                                        setTimeout(() => {
                                            searchBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            searchBarRef.current?.focus();
                                        }, 100);
                                    }
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    showFilters
                                        ? 'bg-blue-800 text-white'
                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                            >
                                <FunnelIcon className="w-4 h-4" />
                                Filters
                            </button>

                            {(() => {
                                const canExport = isAdmin || (isAgent && !permissionsLoading && agentPermissions && (agentPermissions.canExport || agentPermissions.canAll));
                                
                                if (canExport) {
                                    return (
                                        <button
                                            onClick={downloadCSV}
                                            disabled={!filteredAndSortedLeads.length}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ArrowDownTrayIcon className="w-4 h-4" />
                                            <span className="hidden sm:inline">Export CSV</span>
                                            <span className="sm:hidden">CSV</span>
                                        </button>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-blue-200">
                        <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-blue-700 mb-1">Total Requests</p>
                                    <p className="text-xl font-bold text-blue-900">{leads.length}</p>
                                </div>
                                <PhoneIcon className="w-6 h-6 text-blue-700" />
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-blue-700 mb-1">This Month</p>
                                    <p className="text-xl font-bold text-blue-900">{analyticsData.recentRequests}</p>
                                    <p className={`text-xs mt-1 ${analyticsData.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {analyticsData.growthPercentage >= 0 ? '+' : ''}{analyticsData.growthPercentage}%
                                    </p>
                                </div>
                                <ClockIcon className="w-6 h-6 text-blue-700" />
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-blue-700 mb-1">Locations</p>
                                    <p className="text-xl font-bold text-blue-900">{uniqueLocations.length}</p>
                                </div>
                                <MapPinIcon className="w-6 h-6 text-blue-700" />
                            </div>
                        </div>
                    </div>

                    {/* Bar Chart - Month-wise Requests */}
                    <div className="bg-white rounded-lg border border-blue-200 p-4 mt-4">
                        <h3 className="text-sm font-semibold text-blue-900 mb-3">Monthly Requests (Last 12 Months)</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analyticsData.monthWiseData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="month" 
                                        tick={{ fontSize: 11, fill: '#6b7280' }} 
                                        angle={-45} 
                                        textAnchor="end" 
                                        height={80}
                                    />
                                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#fff",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "8px",
                                            boxShadow: "0 4px 6px -1px rgba(51, 2, 247, 0.1)",
                                        }}
                                        labelStyle={{ color: "#374151", fontWeight: 600 }}
                                        itemStyle={{ color: "#374151" }}
                                    />
                                    <Bar dataKey="count" fill="#1f2937" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-blue-900">Filters</h3>
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 transition-colors"
                            >
                                <ArrowPathIcon className="w-3 h-3" />
                                Clear
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -tranblue-y-1/2 w-4 h-4 text-blue-700" />
                                <input
                                    ref={searchBarRef}
                                    type="text"
                                    placeholder="Search name, phone, location, or query..."
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-blue-300 rounded-lg text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-800"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <div className="relative">
                                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-700" />
                                <select
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-blue-300 rounded-lg bg-white text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-800"
                                    value={locationFilter}
                                    onChange={(e) => {
                                        setLocationFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="">All Locations</option>
                                    {uniqueLocations.map((location) => (
                                        <option key={location} value={location}>{location}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Data Table */}
                <div className="bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden">
                    {filteredAndSortedLeads.length === 0 ? (
                        <div className="text-center py-12">
                            <ChatBubbleLeftRightIcon className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-blue-900 mb-2">No requests found</h3>
                            <p className="text-sm text-blue-700">
                                {leads.length === 0
                                    ? "No callback requests have been submitted yet."
                                    : "Try adjusting your filters to see more results."}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-blue-50 border-b border-blue-200">
                                            {[
                                                { key: "name" as SortField, label: "Name" },
                                                { key: "phone" as SortField, label: "Phone" },
                                                { key: "location" as SortField, label: "Location" },
                                                { key: "query" as SortField, label: "Query" },
                                                { key: "createdAt" as SortField, label: "Date" }
                                            ].map(({ key, label }) => (
                                                <th
                                                    key={key}
                                                    className="text-left p-3 text-xs font-semibold text-blue-900 cursor-pointer hover:bg-blue-100 transition-colors"
                                                    onClick={() => handleSort(key)}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        {label}
                                                        <SortIcon field={key} />
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedLeads.map((lead, index) => (
                                            <tr key={index} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                                                <td className="p-3">
                                                    <div className="text-sm font-medium text-blue-900">{lead.name}</div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2 text-sm text-blue-700">
                                                        <PhoneIcon className="w-4 h-4 text-blue-600" />
                                                        {lead.phone}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2 text-sm text-blue-700">
                                                        <MapPinIcon className="w-4 h-4 text-blue-600" />
                                                        {lead.location}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="max-w-xs text-sm text-blue-700 line-clamp-2" title={lead.query}>
                                                        {lead.query}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="text-sm text-blue-700">
                                                        {new Date(lead.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-blue-600">
                                                        {new Date(lead.createdAt).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="lg:hidden">
                                {paginatedLeads.map((lead, index) => (
                                    <div key={index} className="p-4 border-b border-blue-100 last:border-b-0">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-semibold text-blue-900 text-sm">{lead.name}</h3>
                                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                                {new Date(lead.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-3">
                                            <div className="flex items-center gap-2 text-sm text-blue-700">
                                                <PhoneIcon className="w-4 h-4 text-blue-600" />
                                                <span>{lead.phone}</span>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-blue-700">
                                                <MapPinIcon className="w-4 h-4 text-blue-600" />
                                                <span>{lead.location}</span>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 rounded-lg p-3">
                                            <div className="flex items-start gap-2">
                                                <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-blue-700 leading-relaxed">{lead.query}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-blue-50 border-t border-blue-200">
                                    <div className="text-xs text-blue-700">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedLeads.length)} of {filteredAndSortedLeads.length} results
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                              setCurrentPage(currentPage - 1);
                                              showToast('Previous page', 'info');
                                            }}
                                            disabled={currentPage === 1}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeftIcon className="w-4 h-4" />
                                            Previous
                                        </button>

                                        <div className="flex gap-1">
                                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                                if (page > totalPages) return null;

                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => {
                                                          setCurrentPage(page);
                                                          showToast(`Page ${page}`, 'info');
                                                        }}
                                                        className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                                                            currentPage === page
                                                                ? 'bg-blue-800 text-white'
                                                                : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => {
                                              setCurrentPage(currentPage + 1);
                                              showToast('Next page', 'info');
                                            }}
                                            disabled={currentPage === totalPages}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                            <ChevronRightIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

LeadsPage.getLayout = function PageLayout(page: React.ReactNode) {
    return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withAdminAuth(LeadsPage);
ProtectedDashboard.getLayout = LeadsPage.getLayout;

export default ProtectedDashboard;
