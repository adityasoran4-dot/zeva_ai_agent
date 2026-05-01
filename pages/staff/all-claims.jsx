"use client";
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import { Search, Filter, CheckCircle, XCircle, Eye, FileText, Upload, X, AlertCircle, Clock, Shield, Calendar, Clock as ClockIcon, CheckSquare, Square, Activity, User } from "lucide-react";

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
  const [showTracking, setShowTracking] = useState(false);
  const [claimDetails, setClaimDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [rejectedNotifications, setRejectedNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [approvalModal, setApprovalModal] = useState(null);
  const [approvalStep, setApprovalStep] = useState(1);
  const [appointmentData, setAppointmentData] = useState({ startDate: "", fromTime: "", toTime: "" });
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [loadingExistingAppointments, setLoadingExistingAppointments] = useState(false);
  const [progressStatus, setProgressStatus] = useState(null);
  const [consentStatus, setConsentStatus] = useState(null);
  const [addTreatmentPlan, setAddTreatmentPlan] = useState(false);
  const [treatmentPlanText, setTreatmentPlanText] = useState("");

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

  const fetchClaimDetails = async (claimId) => {
    setDetailLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`/api/clinic/insurance-claims/${claimId}`, { headers });
      if (res.data.success) {
        setClaimDetails(res.data.data);
      }
    } catch (err) {
      console.error("Fetch detail error:", err.response?.data || err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewClaim = (claim) => {
    setViewModal(claim);
    setShowTracking(false);
    fetchClaimDetails(claim._id);
  };

  const handleRemoveFile = async (field, fileUrl = null) => {
    if (!window.confirm("Are you sure you want to remove this document?")) return;
    
    setActionLoading(true);
    try {
      const headers = getAuthHeaders();
      let updatedData = {};
      
      if (field === 'documentFiles') {
        const newFiles = viewModal.documentFiles.filter(f => f !== fileUrl);
        updatedData = { documentFiles: newFiles };
      } else {
        updatedData = { [field]: null };
      }

      const res = await axios.patch(`/api/clinic/insurance-claims/${viewModal._id}`, updatedData, { headers });
      
      if (res.data.success) {
        setViewModal({ ...viewModal, ...updatedData });
        setClaims(claims.map(c => c._id === viewModal._id ? { ...c, ...updatedData } : c));
        setPreviewFile(null); // Close preview after deletion
        setSuccessMsg("Document removed successfully");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Remove file error:", err.response?.data || err.message);
      alert("Failed to remove documentd");
    } finally {
      setActionLoading(false);
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

  // Function to fetch existing appointments for a patient
  const fetchExistingAppointments = async (claim) => {
    if (!claim?.patientId) return;
    setLoadingExistingAppointments(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`/api/clinic/patient-appointment-history/${claim.patientId}`, { headers });
      if (res.data.success && res.data.appointments) {
        const appointments = res.data.appointments
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        setExistingAppointments(appointments.length > 0 ? [appointments[0]] : []);
      } else {
        setExistingAppointments([]);
      }
    } catch (err) {
      console.error("Failed to fetch existing appointments:", err);
      setExistingAppointments([]);
    } finally {
      setLoadingExistingAppointments(false);
    }
  };

  const openApprovalModal = async (claim) => {
    setApprovalModal(claim);
    setApprovalStep(1);
    setAppointmentData({ startDate: "", fromTime: "", toTime: "" });
    setBookedAppointment(null);
    setProgressStatus(null);
    setConsentStatus(null);
    setAddTreatmentPlan(false);
    setTreatmentPlanText("");

    // Fetch existing appointments for this patient
    await fetchExistingAppointments(claim);
  };

  const handleBookAppointment = async () => {
    if (!appointmentData.startDate || !appointmentData.fromTime || !appointmentData.toTime) {
      alert("Please fill in all appointment fields (start date, from time, to time)");
      return;
    }
    setActionLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.post(
        "/api/clinic/appointments",
        {
          patientId: approvalModal.patientId,
          doctorId: approvalModal.doctorId,
          status: "booked",
          referral: "direct",
          emergency: "no",
          followType: "follow up",
          startDate: appointmentData.startDate,
          fromTime: appointmentData.fromTime,
          toTime: appointmentData.toTime,
        },
        { headers }
      );
      if (res.data?.success) {
        setBookedAppointment(res.data.appointment);
        setApprovalStep(2);
        setSuccessMsg("Appointment booked successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
        await fetchExistingAppointments(approvalModal);
        await checkProgressStatus(approvalModal.patientId, res.data.appointment?._id);
      } else {
        alert(res.data?.message || "Failed to book appointment");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to book appointment");
    } finally {
      setActionLoading(false);
    }
  };

  const checkProgressStatus = async (patientId, appointmentId) => {
    try {
      const headers = getAuthHeaders();
      
      // Always pass patientId so API checks all progress notes for the patient
      // appointmentId is optional context (stored for reference)
      let url = `/api/clinic/appointment-progress/check?patientId=${patientId}`;
      if (appointmentId) {
        url += `&appointmentId=${appointmentId}`;
      }
      console.log("Checking progress notes for patient:", patientId, "appointmentId context:", appointmentId);
      
      const res = await axios.get(url, { headers });
      
      console.log("Progress check response:", res.data);
      
      if (res.data.success) {
        setProgressStatus({
          hasProgress: res.data.data.hasProgress,
          count: res.data.data.count,
          notes: res.data.data.notes,
          resolvedAppointmentId: res.data.data.resolvedAppointmentId,
        });
      } else {
        console.error("Progress check failed:", res.data);
        setProgressStatus({ hasProgress: false, count: 0, notes: [], resolvedAppointmentId: null });
      }
    } catch (err) {
      console.error("Failed to check progress:", err);
      console.error("Error response:", err.response?.data);
      setProgressStatus({ hasProgress: false, count: 0, notes: [], resolvedAppointmentId: null });
    }
  };

  const checkConsentStatus = async () => {
    if (!bookedAppointment) {
      alert("Please book an appointment first");
      return;
    }
    setActionLoading(true);
    try {
      const headers = getAuthHeaders();
      const patientId = approvalModal.patientId;
      
      console.log("Checking consent for patient:", patientId);
      
      // Call both APIs in parallel:
      // 1. consent-log: checks if consent was SENT (ConsentLog model)
      // 2. consent-status: checks if consent was SIGNED (ConsentSignature model)
      const [logRes, statusRes] = await Promise.all([
        axios.get(`/api/clinic/consent-log?patientId=${patientId}`, { headers }),
        axios.get(`/api/clinic/consent-status?patientId=${patientId}`, { headers }),
      ]);
      
      console.log("Consent log response:", logRes.data);
      console.log("Consent status response:", statusRes.data);
      
      const consentLogs = logRes.data.success ? (logRes.data.consentLogs || []) : [];
      const consentStatuses = statusRes.data.success ? (statusRes.data.consentStatuses || []) : [];
      
      const hasSent = consentLogs.length > 0;
      const hasSigned = consentStatuses.some(c => c.status === "signed" || c.hasSignature);
      
      if (hasSigned) {
        setConsentStatus({
          status: "signed",
          count: consentStatuses.length,
          details: consentStatuses,
          logs: consentLogs,
        });
      } else if (hasSent) {
        setConsentStatus({
          status: "sent",
          count: consentLogs.length,
          details: [],
          logs: consentLogs,
        });
      } else {
        setConsentStatus({ status: "not_sent", count: 0, details: [], logs: [] });
      }
      
      setApprovalStep(3);
    } catch (err) {
      console.error("Failed to check consent status:", err);
      console.error("Error response:", err.response?.data);
      setConsentStatus({ status: "not_sent", count: 0, details: [], logs: [] });
      setApprovalStep(3);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalApproval = async () => {
    // Validate required steps
    const missingItems = [];
    if (!bookedAppointment) missingItems.push("Booked Appointment");
    if (!progressStatus?.hasProgress) missingItems.push("Progress Bar");
    if (!consentStatus || consentStatus.status !== "signed") missingItems.push("Signed Consent Form");

    if (missingItems.length > 0) {
      alert(`Cannot approve claim. The following items are missing:\n\n${missingItems.join("\n")}\n\nKindly clear these before approving.`);
      return;
    }

    setActionLoading(true);
    try {
      const headers = getAuthHeaders();
      
      // If treatment plan is added, save it to insurance claim
      if (addTreatmentPlan && treatmentPlanText.trim()) {
        await axios.patch(
          `/api/clinic/insurance-claims/${approvalModal._id}`,
          { treatmentPlan: treatmentPlanText },
          { headers }
        );
      }

      // Approve the claim
      const res = await axios.patch(
        "/api/clinic/insurance-claims/review",
        { claimId: approvalModal._id, action: "approve" },
        { headers }
      );
      if (res.data.success) {
        setClaims((prev) => prev.map((c) => (c._id === res.data.data._id ? res.data.data : c)));
        setApprovalModal(null);
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
                      {claim.rejectionReason && (
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <p className="text-xs text-red-600 font-semibold mb-0.5">Rejection Notes:</p>
                          <p className="text-xs text-red-800 bg-red-100 rounded p-1.5">{claim.rejectionReason}</p>
                        </div>
                      )}
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
                      onClick={() => handleViewClaim(claim)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    {claim.status === "Under Review" && (
                      <>
                        <button
                          onClick={() => openApprovalModal(claim)}
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
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-900">Claim Details</h2>
                  <button
                    onClick={() => setShowTracking(!showTracking)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                      showTracking 
                        ? "bg-gray-900 text-white shadow-lg" 
                        : "bg-white/50 text-gray-700 hover:bg-white/80 border border-gray-200"
                    }`}
                  >
                    <Activity className="w-3 h-3" />
                    {showTracking ? "View Details" : "Track Claim"}
                  </button>
                </div>
                <button onClick={() => {
                  setViewModal(null);
                  setClaimDetails(null);
                }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                {showTracking ? (
                  <div className="space-y-8 py-4">
                    {detailLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
                        <p className="text-sm text-gray-500 font-medium">Fetching tracking data...</p>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Vertical Line */}
                        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100"></div>

                        <div className="space-y-10 relative">
                          {/* Approved Step */}
                          {(claimDetails?.approvedAt || viewModal.approvedAt) && (
                            <div className="flex gap-4 group">
                              <div className="relative z-10 w-8 h-8 rounded-full bg-green-100 border-4 border-white flex items-center justify-center shadow-sm">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </div>
                              <div className="flex-1 pt-0.5">
                                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm group-hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-bold text-gray-900">Claim Approved</h4>
                                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">Step 1</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Reviewer</p>
                                        <p className="text-xs font-semibold text-gray-700">
                                          {claimDetails?.approvedByName || viewModal.approvedByName || viewModal.doctorName}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <Shield className="w-3.5 h-3.5 text-gray-400" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Role</p>
                                        <p className="text-xs font-semibold text-gray-700 capitalize">
                                          {claimDetails?.approvedByRole || viewModal.approvedByRole || "Doctor"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 col-span-full">
                                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Date & Time</p>
                                        <p className="text-xs font-semibold text-gray-700">
                                          {new Date(claimDetails?.approvedAt || viewModal.approvedAt).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Rejected Step */}
                          {(claimDetails?.rejectedAt || viewModal.rejectedAt) && (
                            <div className="flex gap-4 group">
                              <div className="relative z-10 w-8 h-8 rounded-full bg-red-100 border-4 border-white flex items-center justify-center shadow-sm">
                                <XCircle className="w-4 h-4 text-red-600" />
                              </div>
                              <div className="flex-1 pt-0.5">
                                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm group-hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-bold text-gray-900">Claim Rejected</h4>
                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase">Step 2</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Reviewer</p>
                                        <p className="text-xs font-semibold text-gray-700">
                                          {claimDetails?.rejectedByName || viewModal.rejectedByName || viewModal.doctorName}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <Shield className="w-3.5 h-3.5 text-gray-400" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Role</p>
                                        <p className="text-xs font-semibold text-gray-700 capitalize">
                                          {claimDetails?.rejectedByRole || viewModal.rejectedByRole || "Doctor"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 col-span-full">
                                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Date & Time</p>
                                        <p className="text-xs font-semibold text-gray-700">
                                          {new Date(claimDetails?.rejectedAt || viewModal.rejectedAt).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  {(claimDetails?.rejectionReason || viewModal.rejectionReason) && (
                                    <div className="mt-4 p-3 bg-red-50/50 border border-red-100 rounded-lg">
                                      <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Reason</p>
                                      <p className="text-xs text-red-800 leading-relaxed italic">
                                        "{claimDetails?.rejectionReason || viewModal.rejectionReason}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Rejected from Pass Claims Step */}
                          {claimDetails?.rejectedFromPassClaims && (
                            <div className="flex gap-4 group">
                              <div className="relative z-10 w-8 h-8 rounded-full bg-orange-100 border-4 border-white flex items-center justify-center shadow-sm">
                                <AlertCircle className="w-4 h-4 text-orange-600" />
                              </div>
                              <div className="flex-1 pt-0.5">
                                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm group-hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-bold text-gray-900">Rejected from Pass Claims</h4>
                                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase">Step 3</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Reviewer</p>
                                        <p className="text-xs font-semibold text-gray-700">
                                          {claimDetails?.rejectedFromPassClaimsByName}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <Shield className="w-3.5 h-3.5 text-gray-400" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Role</p>
                                        <p className="text-xs font-semibold text-gray-700 capitalize">
                                          {claimDetails?.rejectedFromPassClaimsByRole || "Clinic Admin"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 col-span-full">
                                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Date & Time</p>
                                        <p className="text-xs font-semibold text-gray-700">
                                          {new Date(claimDetails?.rejectedFromPassClaimsAt).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Released Step */}
                          {(claimDetails?.releasedAt || viewModal.releasedAt) && (
                            <div className="flex gap-4 group">
                              <div className="relative z-10 w-8 h-8 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center shadow-sm">
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 pt-0.5">
                                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm group-hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-bold text-gray-900">Claim Released</h4>
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Final Step</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Released By</p>
                                        <p className="text-xs font-semibold text-gray-700">
                                          {claimDetails?.releasedByName || viewModal.releasedByName}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <Shield className="w-3.5 h-3.5 text-gray-400" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Role</p>
                                        <p className="text-xs font-semibold text-gray-700 capitalize">
                                          {claimDetails?.releasedByRole || viewModal.releasedByRole || "Clinic Admin"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 col-span-full">
                                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Date & Time</p>
                                        <p className="text-xs font-semibold text-gray-700">
                                          {new Date(claimDetails?.releasedAt || viewModal.releasedAt).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* If no tracking steps available */}
                          {!claimDetails?.approvedAt && !viewModal.approvedAt && 
                          !claimDetails?.rejectedAt && !viewModal.rejectedAt && 
                          !claimDetails?.releasedAt && !viewModal.releasedAt && 
                          !claimDetails?.rejectedFromPassClaims && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <Activity className="w-12 h-12 text-gray-200 mb-4" />
                              <p className="text-gray-500 font-medium">No tracking history available for this claim</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
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
                        <button 
                          onClick={() => setPreviewFile({ url: viewModal.insuranceCardFile, name: "Insurance Card", field: "insuranceCardFile" })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" /> Insurance Card
                        </button>
                      )}
                      {viewModal.tableOfBenefitsFile && (
                        <button 
                          onClick={() => setPreviewFile({ url: viewModal.tableOfBenefitsFile, name: "Table of Benefits", field: "tableOfBenefitsFile" })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" /> Table of Benefits
                        </button>
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
                        <button 
                          key={idx} 
                          onClick={() => setPreviewFile({ url: file, name: `Document ${idx + 1}`, field: "documentFiles" })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" /> Document {idx + 1}
                        </button>
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
              </>
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

        {/* Approval Modal with Multi-Step Progress */}
        {approvalModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-gray-900">Approve Claim - Multi-Step Verification</h2>
                <button onClick={() => setApprovalModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  {["Book Appointment", "Check Progress", "Consent Form", "Final Approval"].map((step, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        approvalStep > idx + 1 ? "bg-green-600 text-white" :
                        approvalStep === idx + 1 ? "bg-blue-600 text-white" :
                        "bg-gray-300 text-gray-600"
                      }`}>
                        {approvalStep > idx + 1 ? "✓" : idx + 1}
                      </div>
                      <span className={`ml-2 text-xs font-medium ${
                        approvalStep >= idx + 1 ? "text-gray-900" : "text-gray-500"
                      }`}>{step}</span>
                      {idx < 3 && <div className={`w-8 h-0.5 mx-2 ${approvalStep > idx + 1 ? "bg-green-600" : "bg-gray-300"}`} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className="p-6">
                {/* Step 1: Book Appointment */}
                {approvalStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Step 1: Book Appointment
                    </h3>

                    {/* Existing Appointments Section */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Recent Appointment
                      </h4>
                      {loadingExistingAppointments ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
                        </div>
                      ) : existingAppointments.length > 0 ? (
                        <div className="space-y-2">
                          <div className={`p-3 rounded-lg border ${
                            bookedAppointment ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  Latest Appointment Found
                                </p>
                                {existingAppointments[0] && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {new Date(existingAppointments[0].startDate).toLocaleDateString()} - {existingAppointments[0].status}
                                  </p>
                                )}
                              </div>
                              {bookedAppointment ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <ClockIcon className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                          </div>
                          {/* Show latest appointment details */}
                          {existingAppointments[0] && (
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-gray-500">Date</p>
                                  <p className="font-medium text-gray-900">{new Date(existingAppointments[0].startDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Status</p>
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    existingAppointments[0].status === 'booked' ? 'bg-green-100 text-green-800' :
                                    existingAppointments[0].status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {existingAppointments[0].status}
                                  </span>
                                </div>
                                {existingAppointments[0].fromTime && (
                                  <div>
                                    <p className="text-gray-500">Time</p>
                                    <p className="font-medium text-gray-900">{existingAppointments[0].fromTime} - {existingAppointments[0].toTime}</p>
                                  </div>
                                )}
                                {existingAppointments[0].followType && (
                                  <div>
                                    <p className="text-gray-500">Follow Type</p>
                                    <p className="font-medium text-gray-900">{existingAppointments[0].followType}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-2">No appointments found for this patient</p>
                      )}
                    </div>

                    {/* Book New Appointment Form */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Book New Appointment</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                          <input
                            type="date"
                            value={appointmentData.startDate}
                            onChange={(e) => setAppointmentData(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">From Time</label>
                          <input
                            type="time"
                            value={appointmentData.fromTime}
                            onChange={(e) => setAppointmentData(prev => ({ ...prev, fromTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">To Time</label>
                          <input
                            type="time"
                            value={appointmentData.toTime}
                            onChange={(e) => setAppointmentData(prev => ({ ...prev, toTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleBookAppointment}
                        disabled={actionLoading || !appointmentData.startDate || !appointmentData.fromTime || !appointmentData.toTime}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? "Booking..." : "Book Appointment"}
                      </button>
                      {existingAppointments.length > 0 && (
                        <button
                          onClick={async () => {
                            // Use the latest appointment for progress check
                            if (existingAppointments[0]) {
                              console.log("Using existing appointment:", existingAppointments[0]._id);
                              setBookedAppointment(existingAppointments[0]);
                              setApprovalStep(2);
                              // Check progress for the existing appointment
                              await checkProgressStatus(approvalModal.patientId, existingAppointments[0]._id);
                            }
                          }}
                          className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors"
                        >
                          Skip - Use Existing
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Check Progress */}
                {approvalStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-blue-600" />
                      Step 2: Check Progress Bar
                    </h3>
                    {progressStatus !== null ? (
                      <div className="space-y-3">
                        <div className={`p-4 rounded-lg border ${
                          progressStatus.hasProgress ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                        }`}>
                          <div className="flex items-center gap-2">
                            {progressStatus.hasProgress ? (
                              <>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-green-900">
                                  Progress notes found ({progressStatus.count || 0} note(s))
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-5 h-5 text-red-600" />
                                <span className="text-sm font-medium text-red-900">
                                  No progress notes recorded yet
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {progressStatus.hasProgress && progressStatus.notes && progressStatus.notes.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                            <p className="text-xs font-medium text-gray-600 mb-1">Recent Notes:</p>
                            {progressStatus.notes.slice(0, 2).map((note, idx) => (
                              <p key={idx} className="text-xs text-gray-700 truncate">
                                - {note.note}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                      </div>
                    )}
                    <button
                      onClick={checkConsentStatus}
                      disabled={progressStatus === null}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Continue to Next Step
                    </button>
                  </div>
                )}

                {/* Step 3: Consent Form */}
                {approvalStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Step 3: Consent Form Status
                    </h3>
                    {consentStatus ? (
                      <div className="space-y-3">
                        <div className={`p-4 rounded-lg border ${
                          consentStatus.status === "signed" ? "bg-green-50 border-green-200" :
                          consentStatus.status === "sent" ? "bg-yellow-50 border-yellow-200" :
                          "bg-red-50 border-red-200"
                        }`}>
                          <div className="flex items-center gap-2">
                            {consentStatus.status === "signed" ? (
                              <>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-green-900">
                                  Consent form signed ({consentStatus.count || 0} form(s))
                                </span>
                              </>
                            ) : consentStatus.status === "sent" ? (
                              <>
                                <ClockIcon className="w-5 h-5 text-yellow-600" />
                                <span className="text-sm font-medium text-yellow-900">
                                  Consent form sent, waiting for signature ({consentStatus.count || 0} form(s))
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-5 h-5 text-red-600" />
                                <span className="text-sm font-medium text-red-900">
                                  Consent form not sent
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {/* Show only the most recent sent consent form */}
                        {(() => {
                          const recentLog = consentStatus.logs && consentStatus.logs[0];
                          const recentSigned = consentStatus.details && consentStatus.details[0];
                          const displayRecord = recentSigned || recentLog;
                          if (!displayRecord) return null;
                          return (
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <p className="text-xs font-medium text-gray-600 mb-2">Most Recent Consent Form:</p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-gray-500">Form Name</p>
                                  <p className="font-medium text-gray-900">{displayRecord.consentFormName || "Consent Form"}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Status</p>
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    (displayRecord.status === "signed" || displayRecord.hasSignature)
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}>
                                    {displayRecord.hasSignature ? "Signed" : displayRecord.status || "Sent"}
                                  </span>
                                </div>
                                {displayRecord.sentVia && (
                                  <div>
                                    <p className="text-gray-500">Sent Via</p>
                                    <p className="font-medium text-gray-900 capitalize">{displayRecord.sentVia}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-gray-500">Date</p>
                                  <p className="font-medium text-gray-900">
                                    {new Date(displayRecord.signedAt || displayRecord.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                      </div>
                    )}

                    {/* Treatment Plan Checkbox */}
                    <div className="border-t border-gray-200 pt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addTreatmentPlan}
                          onChange={(e) => setAddTreatmentPlan(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Add Treatment Plan</span>
                      </label>
                      {addTreatmentPlan && (
                        <textarea
                          value={treatmentPlanText}
                          onChange={(e) => setTreatmentPlanText(e.target.value)}
                          rows={4}
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                          placeholder="Enter treatment plan details..."
                        />
                      )}
                    </div>

                    <button
                      onClick={handleFinalApproval}
                      disabled={actionLoading}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? "Approving..." : "Approve Claim"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* File Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{previewFile.name}</h2>
                  <p className="text-xs text-gray-500">Document Preview</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleRemoveFile(previewFile.field, previewFile.url)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"
                  >
                    <X className="w-3.5 h-3.5" /> Remove Document
                  </button>
                  <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex justify-center items-center min-h-[400px] max-h-[80vh] overflow-auto">
                {previewFile.url.toLowerCase().endsWith('.pdf') ? (
                  <iframe 
                    src={previewFile.url} 
                    className="w-full h-[70vh] rounded-lg border border-gray-200"
                    title="PDF Preview"
                  />
                ) : (
                  <img 
                    src={previewFile.url} 
                    alt={previewFile.name} 
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/400x300?text=Preview+Not+Available';
                    }}
                  />
                )}
              </div>
              
              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between items-center">
                <p className="text-[10px] text-gray-400 font-medium">Claim ID: {viewModal?._id}</p>
                <a 
                  href={previewFile.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs font-bold text-teal-600 hover:text-teal-700"
                >
                  Open in New Tab
                </a>
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

const ProtectedAllClaimsPage = withClinicAuth(AllClaimsPage);
ProtectedAllClaimsPage.getLayout = AllClaimsPage.getLayout;

export default ProtectedAllClaimsPage;
