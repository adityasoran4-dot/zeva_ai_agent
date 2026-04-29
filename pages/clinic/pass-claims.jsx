"use client";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import withClinicAuth from "../../components/withStaffAuth";
import { Search, CheckCircle, XCircle, Eye, FileText, AlertCircle, Shield } from "lucide-react";

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

const ITEMS_PER_PAGE = 12;

function PassClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Approved");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewModal, setViewModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.get("/api/clinic/insurance-claims", { headers });
      if (res.data.success) {
        // Only show Approved, Rejected, and Released claims (already reviewed by doctor)
        const reviewedClaims = (res.data.data || []).filter(
          (c) => c.status === "Approved" || c.status === "Rejected" || c.status === "Released"
        );
        setClaims(reviewedClaims);
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
          c.serviceName?.toLowerCase().includes(term) ||
          c.doctorName?.toLowerCase().includes(term)
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

  const handleRelease = async (claimId) => {
    setActionLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.patch(
        "/api/clinic/insurance-claims/process-claim",
        { claimId, action: "release" },
        { headers }
      );
      if (res.data.success) {
        setClaims((prev) => prev.filter((c) => c._id !== claimId));
        setSuccessMsg("Claim released successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to release claim");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionNote.trim()) {
      alert("Please provide a rejection note");
      return;
    }
    setActionLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.patch(
        "/api/clinic/insurance-claims/process-claim",
        { claimId: rejectModal._id, action: "reject", rejectionNote },
        { headers }
      );
      if (res.data.success) {
        setClaims((prev) => prev.filter((c) => c._id !== rejectModal._id));
        setRejectModal(null);
        setRejectionNote("");
        setSuccessMsg("Claim rejected back to doctor successfully!");
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
      Approved: "bg-green-100 text-green-800 border-green-300",
      Rejected: "bg-red-100 text-red-800 border-red-300",
      Released: "bg-blue-100 text-blue-800 border-blue-300",
    };
    return styles[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const tabs = ["Approved", "Rejected", "Released"];
  const tabCounts = {
    Approved: claims.filter((c) => c.status === "Approved").length,
    Rejected: claims.filter((c) => c.status === "Rejected").length,
    Released: claims.filter((c) => c.status === "Released").length,
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Review History</h1>
              <p className="text-sm text-gray-600 mt-1">
                View all claims reviewed and passed by doctors
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">
                {claims.length} Total Reviewed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-teal-600 text-teal-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab}
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100">
                    {tabCounts[tab]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient, policy, insurance, doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Claims Cards Grid */}
        {paginatedClaims.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No {activeTab.toLowerCase()} claims found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm ? "Try adjusting your search terms" : `${activeTab} claims will appear here once reviewed`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedClaims.map((claim) => (
              <div
                key={claim._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Card Header - Status Badge */}
                <div className={`px-4 py-2 border-b ${getStatusBadge(claim.status)}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {claim.status === "Approved" ? "✓ Approved" : claim.status === "Rejected" ? "✗ Rejected" : "✓ Released"}
                    </span>
                    <span className="text-xs">
                      {claim.status === "Approved" 
                        ? formatDate(claim.approvedAt)
                        : claim.status === "Rejected"
                        ? formatDate(claim.rejectedAt)
                        : formatDate(claim.releasedAt)
                      }
                    </span>
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
                  </div>

                  {/* Doctor Info */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      {claim.status === "Released" ? "Released By" : "Reviewed By"}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {claim.status === "Approved" 
                        ? claim.approvedByName || claim.doctorName
                        : claim.status === "Rejected"
                        ? claim.rejectedByName || claim.doctorName
                        : claim.releasedByName || claim.doctorName
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {claim.status === "Approved" 
                        ? (claim.approvedByRole ? claim.approvedByRole.charAt(0).toUpperCase() + claim.approvedByRole.slice(1) : "")
                        : claim.status === "Rejected"
                        ? (claim.rejectedByRole ? claim.rejectedByRole.charAt(0).toUpperCase() + claim.rejectedByRole.slice(1) : "")
                        : (claim.releasedByRole ? claim.releasedByRole.charAt(0).toUpperCase() + claim.releasedByRole.slice(1) : "")
                      }
                    </p>
                  </div>

                  {/* Insurance Info */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Provider</p>
                      <p className="text-sm text-gray-900 truncate">{claim.insuranceProvider}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Policy #</p>
                      <p className="text-sm text-gray-900">{claim.policyNumber}</p>
                    </div>
                  </div>

                  {/* Claim Details */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-sm font-semibold text-gray-900">₹{claim.claimAmount?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="text-sm text-gray-900 truncate">{claim.departmentName || "N/A"}</p>
                    </div>
                  </div>

                  {/* Rejection Reason (if rejected) */}
                  {claim.status === "Rejected" && claim.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-2">
                      <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Rejection Reason
                      </p>
                      <p className="text-xs text-red-700 mt-1">{claim.rejectionReason}</p>
                    </div>
                  )}

                  {/* Review Notes */}
                  {claim.reviewNotes && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-2">
                      <p className="text-xs text-gray-600 font-semibold">Review Notes</p>
                      <p className="text-xs text-gray-700 mt-1">{claim.reviewNotes}</p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Claim #{claim._id?.slice(-6)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewModal(claim)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    {claim.status === "Approved" && (
                      <>
                        <button
                          onClick={() => handleRelease(claim._id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                          title="Release Claim"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Release
                        </button>
                        <button
                          onClick={() => setRejectModal(claim)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                          title="Reject Back to Doctor"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    )}
                    {claim.status === "Rejected" && (
                      <button
                        onClick={() => handleRelease(claim._id)}
                        disabled={actionLoading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        title="Release Claim"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Release
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
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Reject Claim Back to Doctor
                </h2>
                <button
                  onClick={() => {
                    setRejectModal(null);
                    setRejectionNote("");
                  }}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <XCircle className="w-6 h-6 text-red-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Claim Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Claim Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Patient</p>
                    <p className="font-medium">{rejectModal.patientFirstName} {rejectModal.patientLastName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Doctor</p>
                    <p className="font-medium">{rejectModal.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium">₹{rejectModal.claimAmount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Insurance</p>
                    <p className="font-medium">{rejectModal.insuranceProvider}</p>
                  </div>
                </div>
              </div>

              {/* Rejection Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Rejection Note <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Explain why this claim is being rejected back to the doctor..."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This note will be visible to the doctor in the All Claims page under "Under Review"
                </p>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This claim will be sent back to {rejectModal.doctorName} with "Under Review" status.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectionNote("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionNote.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Rejecting..." : "Reject Claim"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${getStatusBadge(viewModal.status)}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  {viewModal.status === "Approved" ? "✓ Approved Claim" : viewModal.status === "Rejected" ? "✗ Rejected Claim" : "✓ Released Claim"}
                </h2>
                <button
                  onClick={() => setViewModal(null)}
                  className="p-1 hover:bg-white/50 rounded transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Patient Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Patient Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium">{viewModal.patientFirstName} {viewModal.patientLastName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Mobile</p>
                    <p className="font-medium">{viewModal.patientMobileNumber || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Reviewer Details */}
              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-teal-900 mb-2">Review Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-teal-700">Reviewed By</p>
                    <p className="font-medium text-teal-900">
                      {viewModal.status === "Approved" 
                        ? viewModal.approvedByName || viewModal.doctorName
                        : viewModal.rejectedByName || viewModal.doctorName
                      }
                    </p>
                    <p className="text-xs text-teal-700 capitalize">
                      {viewModal.status === "Approved" 
                        ? (viewModal.approvedByRole || "")
                        : (viewModal.rejectedByRole || "")
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-teal-700">Reviewed At</p>
                    <p className="font-medium text-teal-900">
                      {formatDate(viewModal.status === "Approved" ? viewModal.approvedAt : viewModal.rejectedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Insurance Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Insurance Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Provider</p>
                    <p className="font-medium">{viewModal.insuranceProvider}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Policy Number</p>
                    <p className="font-medium">{viewModal.policyNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Expiry Date</p>
                    <p className="font-medium">{formatDate(viewModal.expiryDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Claim Amount</p>
                    <p className="font-medium">₹{viewModal.claimAmount?.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Claim Source */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Claim Source</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Department</p>
                    <p className="font-medium">{viewModal.departmentName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Service</p>
                    <p className="font-medium">{viewModal.serviceName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Claim Type</p>
                    <p className="font-medium">{viewModal.claimType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Co-Pay</p>
                    <p className="font-medium">{viewModal.coPayPercent}% - {viewModal.coPayType}</p>
                  </div>
                </div>
              </div>

              {/* Rejection Details */}
              {viewModal.status === "Rejected" && viewModal.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Rejection Reason
                  </h3>
                  <p className="text-sm text-red-800">{viewModal.rejectionReason}</p>
                </div>
              )}

              {/* Review Notes */}
              {viewModal.reviewNotes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Review Notes</h3>
                  <p className="text-sm text-gray-700">{viewModal.reviewNotes}</p>
                </div>
              )}

              {/* Notes */}
              {viewModal.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Additional Notes</h3>
                  <p className="text-sm text-gray-700">{viewModal.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

PassClaimsPage.getLayout = function PageLayout(page) {
  return <>{page}</>;
};

export default withClinicAuth(PassClaimsPage);
