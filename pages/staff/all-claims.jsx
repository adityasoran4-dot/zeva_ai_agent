"use client";
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import ClinicLayout from "../../components/staffLayout";
import withClinicAuth from "../../components/withStaffAuth";
import { Search, Filter, CheckCircle, XCircle, Eye, FileText, Upload, X, AlertCircle, Clock, Shield } from "lucide-react";

const TOKEN_PRIORITY = ["clinicToken", "doctorToken", "agentToken", "staffToken", "userToken", "adminToken"];

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  for (const key of TOKEN_PRIORITY) {
    try {
      const value = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
      if (value) return value;
    } catch (error) {
      continue;
    }
  }
  return null;
};

const getAuthHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
};

const ITEMS_PER_PAGE = 10;

function AllClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Under Review");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewModal, setViewModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [rejectedNotifications, setRejectedNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.get("/api/clinic/insurance-claims", { headers });
      if (res.data.success) {
        const allClaims = res.data.data || [];
        setClaims(allClaims);
        
        // Find recently rejected claims (from pass-claims page)
        // These are claims that were rejected back with the rejectedFromPassClaims flag
        const recentlyRejected = allClaims.filter(
          (c) => 
            c.status === "Under Review" && 
            c.rejectedFromPassClaims === true &&
            c.reviewNotes && 
            c.reviewNotes.length > 0
        );
        setRejectedNotifications(recentlyRejected);
      }
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredClaims = useMemo(() => {
    return claims
      .filter((c) => c.status === activeTab)
      .filter((c) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          c.patientFirstName?.toLowerCase().includes(term) ||
          c.patientLastName?.toLowerCase().includes(term) ||
          c.policyNumber?.toLowerCase().includes(term) ||
          c.insuranceProvider?.toLowerCase().includes(term) ||
          c.departmentName?.toLowerCase().includes(term) ||
          c.serviceName?.toLowerCase().includes(term)
        );
      });
  }, [claims, activeTab, searchTerm]);

  const paginatedClaims = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClaims.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClaims, currentPage]);

  const totalPages = Math.ceil(filteredClaims.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const handleApprove = async (claimId) => {
    setActionLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.patch(
        "/api/clinic/insurance-claims/review",
        { claimId, action: "approve" },
        { headers }
      );
      if (res.data.success) {
        setClaims((prev) => prev.map((c) => (c._id === res.data.data._id ? res.data.data : c)));
        setSuccessMsg("Claim approved successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve claim");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    setActionLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.patch(
        "/api/clinic/insurance-claims/review",
        { claimId: rejectModal._id, action: "reject", rejectionReason },
        { headers }
      );
      if (res.data.success) {
        setClaims((prev) => prev.map((c) => (c._id === res.data.data._id ? res.data.data : c)));
        setRejectModal(null);
        setRejectionReason("");
        setSuccessMsg("Claim rejected successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject claim");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      "Under Review": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "Approved": "bg-green-100 text-green-800 border-green-300",
      "Rejected": "bg-red-100 text-red-800 border-red-300",
      "Released": "bg-blue-100 text-blue-800 border-blue-300",
    };
    return styles[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const tabs = ["Under Review", "Approved", "Rejected", "Released"];
  const tabCounts = {
    "Under Review": claims.filter((c) => c.status === "Under Review").length,
    "Approved": claims.filter((c) => c.status === "Approved").length,
    "Rejected": claims.filter((c) => c.status === "Rejected").length,
    "Released": claims.filter((c) => c.status === "Released").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">All Claims</h1>
                <p className="text-sm text-gray-500">Review and manage insurance claims assigned to you</p>
              </div>
            </div>
            
            {/* Notification Bell */}
            {rejectedNotifications.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {rejectedNotifications.length}
                  </span>
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                    <div className="p-3 border-b border-gray-200 bg-red-50">
                      <h3 className="text-sm font-semibold text-red-900 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Rejected Claims ({rejectedNotifications.length})
                      </h3>
                      <p className="text-xs text-red-700 mt-1">Claims rejected back from pass-claims</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {rejectedNotifications.map((claim) => (
                        <button
                          key={claim._id}
                          onClick={() => {
                            setShowNotifications(false);
                            setActiveTab("Under Review");
                            setViewModal(claim);
                          }}
                          className="w-full p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {claim.patientFirstName} {claim.patientLastName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {claim.insuranceProvider} - ₹{claim.claimAmount?.toFixed(2)}
                              </p>
                              <p className="text-xs text-red-600 mt-1 line-clamp-2">
                                {claim.reviewNotes}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">{successMsg}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === tab
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {tab}
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name, policy, provider, department..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
          />
        </div>

        {/* Claims Cards Grid */}
        {filteredClaims.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No claims found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm ? "Try adjusting your search" : `No ${activeTab.toLowerCase()} claims at the moment`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedClaims.map((claim) => (
              <div
                key={claim._id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Card Header - Status */}
                <div className={`px-4 py-2 border-b ${getStatusBadge(claim.status)}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-1">
                      {claim.status === "Under Review" && <Clock className="w-3.5 h-3.5" />}
                      {claim.status === "Approved" && <CheckCircle className="w-3.5 h-3.5" />}
                      {claim.status === "Rejected" && <XCircle className="w-3.5 h-3.5" />}
                      {claim.status === "Released" && <CheckCircle className="w-3.5 h-3.5" />}
                      {claim.status}
                    </span>
                    <span className="text-xs">{new Date(claim.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Patient Info */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Patient</p>
                    <p className="text-sm font-medium text-gray-900">
                      {claim.patientFirstName} {claim.patientLastName}
                    </p>
                    <p className="text-xs text-gray-500">{claim.patientMobileNumber}</p>
                  </div>

                  {/* Status-specific Action Info */}
                  {claim.status === "Approved" && claim.approvedByName && (
                    <div className="bg-green-50 rounded-md p-2 border border-green-200">
                      <p className="text-xs text-green-600 uppercase font-semibold mb-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Approved By
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {claim.approvedByName}
                        <span className="text-gray-500 capitalize ml-1">({claim.approvedByRole})</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {claim.approvedAt ? new Date(claim.approvedAt).toLocaleString() : ""}
                      </p>
                    </div>
                  )}

                  {claim.status === "Rejected" && claim.rejectedByName && (
                    <div className="bg-red-50 rounded-md p-2 border border-red-200">
                      <p className="text-xs text-red-600 uppercase font-semibold mb-1 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Rejected By
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {claim.rejectedByName}
                        <span className="text-gray-500 capitalize ml-1">({claim.rejectedByRole})</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {claim.rejectedAt ? new Date(claim.rejectedAt).toLocaleString() : ""}
                      </p>
                    </div>
                  )}

                  {claim.status === "Released" && claim.releasedByName && (
                    <div className="bg-blue-50 rounded-md p-2 border border-blue-200">
                      <p className="text-xs text-blue-600 uppercase font-semibold mb-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Released By
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {claim.releasedByName}
                        <span className="text-gray-500 capitalize ml-1">({claim.releasedByRole})</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {claim.releasedAt ? new Date(claim.releasedAt).toLocaleString() : ""}
                      </p>
                    </div>
                  )}

                  {claim.status === "Under Review" && claim.rejectedFromPassClaims === true && (
                    <div className="bg-red-50 rounded-md p-2 border border-red-200">
                      <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Rejected Back from Pass-Claims
                      </p>
                      <p className="text-xs text-red-700 mt-1">{claim.reviewNotes}</p>
                      {claim.rejectedFromPassClaimsByName && (
                        <p className="text-xs text-gray-600 mt-2">
                          Rejected by: {claim.rejectedFromPassClaimsByName}
                          <span className="text-gray-500 capitalize ml-1">({claim.rejectedFromPassClaimsByRole})</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Claim Details */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Claim Type</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        claim.claimType === "Advance" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {claim.claimType}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-sm font-semibold text-gray-900">₹{claim.claimAmount?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="text-sm text-gray-900 truncate">{claim.departmentName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Co-Pay</p>
                      <p className="text-sm text-gray-900">{claim.coPayPercent}%</p>
                    </div>
                  </div>

                  {/* Insurance Info */}
                  <div>
                    <p className="text-xs text-gray-500">Insurance</p>
                    <p className="text-sm text-gray-900 truncate">{claim.insuranceProvider} - {claim.policyNumber}</p>
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    #{claim._id?.slice(-6)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewModal(claim)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    {claim.status === "Under Review" && (
                      <>
                        <button
                          onClick={() => handleApprove(claim._id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => { setRejectModal(claim); setRejectionReason(""); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    )}
                    {claim.status === "Approved" && (
                      <button
                        onClick={() => { setRejectModal(claim); setRejectionReason(""); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}
                    {claim.status === "Rejected" && (
                      <button
                        onClick={() => handleApprove(claim._id)}
                        disabled={actionLoading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                        title="Approve"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 mt-4 bg-white rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredClaims.length)} of {filteredClaims.length}
            </p>
            <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-md">{currentPage}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
            </div>
          )}

        {/* View Detail Modal */}
        {viewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Rejection Notice Banner */}
              {viewModal.rejectedFromPassClaims === true && viewModal.reviewNotes && (
                <div className="bg-red-50 border-b border-red-200 px-6 py-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900">Claim Rejected Back from Pass-Claims</p>
                      <p className="text-xs text-red-700 mt-1">{viewModal.reviewNotes}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-gray-900">Claim Details</h2>
                <button onClick={() => setViewModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                {/* Reviewer Tracking Section */}
                {(viewModal.approvedByName || viewModal.rejectedByName || viewModal.releasedByName) && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Review History
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {viewModal.approvedByName && (
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-semibold text-green-800 uppercase">Approved</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{viewModal.approvedByName}</p>
                          <p className="text-xs text-gray-600 capitalize">{viewModal.approvedByRole}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {viewModal.approvedAt ? new Date(viewModal.approvedAt).toLocaleString() : ""}
                          </p>
                        </div>
                      )}
                      {viewModal.rejectedByName && (
                        <div className="bg-white rounded-lg p-3 border border-red-200">
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-xs font-semibold text-red-800 uppercase">Rejected</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{viewModal.rejectedByName}</p>
                          <p className="text-xs text-gray-600 capitalize">{viewModal.rejectedByRole}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {viewModal.rejectedAt ? new Date(viewModal.rejectedAt).toLocaleString() : ""}
                          </p>
                        </div>
                      )}
                      {viewModal.releasedByName && (
                        <div className="bg-white rounded-lg p-3 border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-800 uppercase">Released</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{viewModal.releasedByName}</p>
                          <p className="text-xs text-gray-600 capitalize">{viewModal.releasedByRole}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {viewModal.releasedAt ? new Date(viewModal.releasedAt).toLocaleString() : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Patient & Insurance Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Patient Information</h3>
                    <div className="space-y-1.5 text-sm">
                      <p><span className="text-gray-500">Name:</span> <span className="font-medium">{viewModal.patientFirstName} {viewModal.patientLastName}</span></p>
                      <p><span className="text-gray-500">Mobile:</span> <span className="font-medium">{viewModal.patientMobileNumber}</span></p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Insurance Details</h3>
                    <div className="space-y-1.5 text-sm">
                      <p><span className="text-gray-500">Provider:</span> <span className="font-medium">{viewModal.insuranceProvider}</span></p>
                      <p><span className="text-gray-500">Policy #:</span> <span className="font-medium">{viewModal.policyNumber}</span></p>
                      <p><span className="text-gray-500">Expiry:</span> <span className="font-medium">{viewModal.expiryDate ? new Date(viewModal.expiryDate).toLocaleDateString() : "-"}</span></p>
                    </div>
                  </div>
                </div>

                {/* Uploaded files */}
                {(viewModal.insuranceCardFile || viewModal.tableOfBenefitsFile) && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Uploaded Files</h3>
                    <div className="flex flex-wrap gap-3">
                      {viewModal.insuranceCardFile && (
                        <a href={viewModal.insuranceCardFile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-100">
                          <FileText className="w-3.5 h-3.5" /> Insurance Card
                        </a>
                      )}
                      {viewModal.tableOfBenefitsFile && (
                        <a href={viewModal.tableOfBenefitsFile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-100">
                          <FileText className="w-3.5 h-3.5" /> Table of Benefits
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Claim Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Claim Details</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Claim Type</p>
                      <p className="text-sm font-semibold text-gray-900">{viewModal.claimType}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Claim Amount</p>
                      <p className="text-sm font-semibold text-gray-900">{viewModal.claimAmount?.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="text-sm font-semibold text-gray-900">{viewModal.departmentName || "-"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Service</p>
                      <p className="text-sm font-semibold text-gray-900">{viewModal.serviceName || "-"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Co-Pay %</p>
                      <p className="text-sm font-semibold text-gray-900">{viewModal.coPayPercent}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Co-Pay Type</p>
                      <p className="text-sm font-semibold text-gray-900">{viewModal.coPayType}</p>
                    </div>
                    {viewModal.claimType === "Advance" && (
                      <>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Advance Status</p>
                          <p className="text-sm font-semibold text-gray-900">{viewModal.advanceStatus || "-"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Advance Amount</p>
                          <p className="text-sm font-semibold text-gray-900">{viewModal.advanceAmount?.toLocaleString()}</p>
                        </div>
                      </>
                    )}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Status</p>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(viewModal.status)}`}>
                        {viewModal.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {viewModal.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Notes</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{viewModal.notes}</p>
                  </div>
                )}

                {/* Document files */}
                {viewModal.documentFiles && viewModal.documentFiles.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Claim Documents</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewModal.documentFiles.map((file, idx) => (
                        <a key={idx} href={file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs font-medium text-purple-700 hover:bg-purple-100">
                          <FileText className="w-3.5 h-3.5" /> Document {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection reason */}
                {viewModal.status === "Rejected" && viewModal.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <h3 className="text-sm font-semibold text-red-800 mb-1">Rejection Reason</h3>
                    <p className="text-sm text-red-700">{viewModal.rejectionReason}</p>
                  </div>
                )}

                {/* Review info */}
                {viewModal.reviewedAt && (
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                    <p>Reviewed on: {new Date(viewModal.reviewedAt).toLocaleString()}</p>
                    {viewModal.reviewNotes && <p>Review notes: {viewModal.reviewNotes}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Reject Claim</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Claim for {rejectModal.patientFirstName} {rejectModal.patientLastName} - {rejectModal.claimType} ({rejectModal.claimAmount})
                </p>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Please provide the reason for rejecting this claim..."
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => { setRejectModal(null); setRejectionReason(""); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "Rejecting..." : "Reject Claim"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

AllClaimsPage.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

export default withClinicAuth(AllClaimsPage);
