import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import DoctorLayout from "../../components/DoctorLayout";
import withDoctorAuth from "../../components/withDoctorAuth";
import type { NextPageWithLayout } from "../_app";
import { DoctorChat } from "../../pages/doctor/chat/[requestId]";
import { Search, Filter, ChevronDown, ChevronUp, MessageSquare, Trash2, Calendar, User, Phone, Mail, FileText, Activity, ChevronLeft, ChevronRight } from "lucide-react";

interface PrescriptionRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  doctor: {
    _id: string;
    name: string;
    email: string;
  };
  status: "pending" | "in_progress" | "completed" | "cancelled";
  healthIssue: string;
  symptoms: string;
  prescription?: string;
  prescriptionDate?: string;
  createdAt: string;
  updatedAt: string;
}

function DoctorPrescriptionRequests() {
  const [requests, setRequests] = useState<PrescriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);

  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("doctorToken");
      const response = await axios.get("/api/prescription/doctor-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch {
      // Handle error if needed
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (requestId: string) => {
    setSelectedRequestId(requestId);
    // Scroll to chat panel after state update
    setTimeout(() => {
      chatPanelRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'end'
      });
    }, 100);
  };

  const confirmDecline = async () => {
    if (!deleteId) return;
    try {
      const token = localStorage.getItem("doctorToken");
      const response = await axios.delete(
        `/api/prescription/delete?id=${deleteId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        if (selectedRequestId === deleteId) {
          setSelectedRequestId(null);
        }
        setRequests((prev) => prev.filter((req) => req._id !== deleteId));
        setShowConfirm(false);
        setDeleteId(null);
      } else {
        // alert(response.data.message || "Failed to delete");
      }
    } catch {
      // Handle error if needed
    }
  };

  const openDeclineModal = (id: string) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  // Filter and sort logic
  const filteredAndSortedRequests = useMemo(() => {
    const filtered = requests.filter((request) => {
      const matchesSearch =
        request.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.healthIssue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.symptoms.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name":
          return a.user.name.localeCompare(b.user.name);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [requests, searchTerm, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRequests.length / itemsPerPage);
  const paginatedRequests = filteredAndSortedRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-[#2D9AA5] rounded-full animate-spin"></div>
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading prescription requests...</h3>
              <p className="text-sm text-gray-500">Please wait while we fetch your data</p>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#2D9AA5] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#2D9AA5] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-[#2D9AA5] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-2 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Prescription Requests</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage and review patient prescription requests</p>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6">
              <div className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      placeholder="Search patients, health issues, or symptoms..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-black w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors"
                    />
                  </div>

                  {/* Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-black flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-0"
                  >
                    <Filter className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Filters</span>
                    <span className="sm:hidden">Filter</span>
                    {showFilters ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
                  </button>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="text-black w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5]"
                        >
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      {/* Sort */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="text-black w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5]"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="name">Patient Name</option>
                          <option value="status">Status</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <p className="text-xs sm:text-sm text-gray-600">
                Showing {paginatedRequests.length} of {filteredAndSortedRequests.length} requests
              </p>
              {(searchTerm || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setCurrentPage(1);
                  }}
                  className="text-xs sm:text-sm text-[#2D9AA5] hover:text-[#247982] transition-colors self-start sm:self-auto"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Requests List */}
            {paginatedRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Requests Found</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "No prescription requests have been submitted yet"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {paginatedRequests.map((request) => (
                  <div key={request._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="p-3 sm:p-4 md:p-6">
                      {/* Header */}
                      <div className="flex flex-col gap-3 sm:gap-4 mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#2D9AA5]/10 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D9AA5]" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{request.user.name}</h3>
                                <div className="flex flex-col gap-1 text-xs sm:text-sm text-gray-500 mt-1">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                    <span className="truncate">{request.user.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                    <span>{request.user.phone}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 self-start">
                            <span className={`inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                              <span className="hidden sm:inline">{request.status.replace('_', ' ').toUpperCase()}</span>
                              <span className="sm:hidden">{request.status.replace('_', ' ').toUpperCase().slice(0, 8)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <button
                            onClick={() => {
                              handleChatClick(request._id);
                              // Scroll to chat panel on small screens
                              setTimeout(() => {
                                const chatPanel = document.getElementById('chat-panel');
                                if (chatPanel && window.innerWidth < 1280) {
                                  chatPanel.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'start',
                                    inline: 'nearest'
                                  });
                                }
                              }, 100);
                            }}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#2D9AA5] text-white text-sm font-medium rounded-lg hover:bg-[#247982] transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Chat
                          </button>
                          <button
                            onClick={() => openDeclineModal(request._id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Decline
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-start gap-2 mb-3">
                            <Activity className="w-4 h-4 text-[#2D9AA5] mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 mb-1">Health Issue</h4>
                              <p className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-2 sm:p-3 rounded-lg break-words">{request.healthIssue}</p>
                            </div>
                          </div>
                        </div>

                        {request.symptoms && (
                          <div>
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-[#2D9AA5] mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">Symptoms</h4>
                                <p className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-2 sm:p-3 rounded-lg break-words">{request.symptoms}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t border-gray-100 gap-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-4 sm:mt-6 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                  <div className="text-xs sm:text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors min-w-[32px] sm:min-w-[36px] ${pageNum === currentPage
                              ? 'bg-[#2D9AA5] text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <span className="sm:hidden">Next</span>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Chat Side Panel */}
          <section id="chat-panel" className={`flex-shrink-0 ${selectedRequestId ? 'block' : 'hidden'} xl:block`}>
          {selectedRequestId && (
            <div ref={chatPanelRef} className="w-full xl:w-96">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[400px] sm:h-[500px] lg:h-[600px] xl:h-[500px] overflow-hidden">
                <DoctorChat
                  requestId={selectedRequestId}
                  onClose={() => setSelectedRequestId(null)}
                />
              </div>
            </div>
          )}
          </section>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full mx-auto transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Delete Prescription</h1>
            </div>

            <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
              This prescription will be permanently deleted and cannot be recovered. Are you sure you want to continue?
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 sm:px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmDecline}
                className="px-4 sm:px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm text-sm sm:text-base"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

DoctorPrescriptionRequests.getLayout = function PageLayout(
  page: React.ReactNode
) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedDoctorPrescriptionRequests: NextPageWithLayout =
  withDoctorAuth(DoctorPrescriptionRequests);
ProtectedDoctorPrescriptionRequests.getLayout =
  DoctorPrescriptionRequests.getLayout;

export default ProtectedDoctorPrescriptionRequests;
