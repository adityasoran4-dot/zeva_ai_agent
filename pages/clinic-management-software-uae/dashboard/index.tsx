import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import axios from "axios";
import {
  Users,
  Search,
  //   Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  TrendingUp,
  Calendar,
  Building2,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
} from "lucide-react";
import LandingLayout from "../../../components/landing/LandingLayout";
import ViewLeadDetailModal from "./_components/ViewLeadDetailModal";

interface ZevaLead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  clinicName?: string;
  createdAt: string;
}

interface PaginationData {
  totalResults: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasMore: boolean;
}

interface StatsData {
  totalLeads: number;
  leadsToday: number;
  leadsThisWeek: number;
}

const DashboardPage: React.FC = () => {
  const [leads, setLeads] = useState<ZevaLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [stats, setStats] = useState<StatsData>({
    totalLeads: 0,
    leadsToday: 0,
    leadsThisWeek: 0,
  });
  const [selectedLead, setSelectedLead] = useState<ZevaLead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const limit = 10;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/zeva-leads", {
        params: {
          page: currentPage,
          limit: limit,
          search: searchTerm,
        },
      });

      if (data.success) {
        setLeads(data.data.leads);
        setPagination(data.data.pagination);
        setStats(data.data.stats);
      } else {
        setError(data.message || "Failed to fetch leads");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "An error occurred",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, limit]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchTerm(searchInput);
      setCurrentPage(1); // Reset to first page on new search
    }
  };

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleViewDetails = (lead: ZevaLead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const url = `/api/zeva-leads/export${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}`;
    window.location.href = url;
  };

  return (
    <>
      <Head>
        <title>Zeva Leads Dashboard</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <LandingLayout>
        <div className="min-h-screen bg-gray-50 pb-20">
          {/* Header Section */}
          <div className="bg-[#0A1F44] text-white pt-12 pb-24 px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    Leads Dashboard
                  </h1>
                  <p className="text-blue-200 text-lg">
                    Manage and track your incoming demo requests.
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors border border-white/20"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-12">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Leads
                    </p>
                    <p className="text-3xl font-bold text-[#0A1F44] mt-1">
                      {stats.totalLeads.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                  Lifetime demo requests
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      New This Week
                    </p>
                    <p className="text-3xl font-bold text-[#0A1F44] mt-1">
                      {stats.leadsThisWeek.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                  Requests in last 7 days
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Leads Today
                    </p>
                    <p className="text-3xl font-bold text-[#0A1F44] mt-1">
                      {stats.leadsToday.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                  New requests since midnight
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
              {/* Toolbar */}
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search leads by name, email, or clinic..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearch}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all"
                  />
                </div>
                {/* <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                  <Filter className="w-4 h-4" />
                  Filter
                </button> */}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-20 text-red-500">
                    <AlertCircle className="w-10 h-10 mb-2" />
                    <p>{error}</p>
                  </div>
                ) : leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <Users className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-lg font-medium text-gray-900">
                      No leads found
                    </p>
                    <p className="text-sm">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Contact Info
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Clinic Details
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Date Received
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leads.map((lead) => (
                        <tr
                          key={lead._id}
                          className="hover:bg-gray-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A1F44] to-blue-800 flex items-center justify-center text-white font-bold shadow-sm">
                                {lead.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {lead.name}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {lead.email}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {lead.phone}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              {lead.clinicName || "Not specified"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {new Date(lead.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {new Date(lead.createdAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleViewDetails(lead)}
                              className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors opacity-0 group-hover:opacity-100"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalResults > 0 && (
                <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-500">
                    Showing{" "}
                    <span className="font-medium text-gray-900">
                      {(pagination.currentPage - 1) * pagination.limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium text-gray-900">
                      {Math.min(
                        pagination.currentPage * pagination.limit,
                        pagination.totalResults,
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-gray-900">
                      {pagination.totalResults.toLocaleString()}
                    </span>{" "}
                    results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      disabled={pagination.currentPage === 1}
                      className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(pagination.totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        // Show first, last, current, and adjacent pages
                        if (
                          pageNum === 1 ||
                          pageNum === pagination.totalPages ||
                          (pageNum >= pagination.currentPage - 1 &&
                            pageNum <= pagination.currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-8 h-8 rounded-lg font-medium flex items-center justify-center transition-colors ${
                                pagination.currentPage === pageNum
                                  ? "bg-[#0A1F44] text-white"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          pageNum === pagination.currentPage - 2 ||
                          pageNum === pagination.currentPage + 2
                        ) {
                          return (
                            <span key={pageNum} className="text-gray-400 px-1">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      disabled={!pagination.hasMore}
                      className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <ViewLeadDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          lead={selectedLead}
        />
      </LandingLayout>
    </>
  );
};

// @ts-expect-error - getLayout added dynamically
DashboardPage.getLayout = (page: React.ReactNode) => page;

export default DashboardPage;
