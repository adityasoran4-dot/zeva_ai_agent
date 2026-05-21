"use client";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import withClinicAuth from "../../components/withClinicAuth";
import ClinicLayout from "../../components/ClinicLayout";
import Loader from "../../components/Loader";
import { Search, CheckCircle, XCircle, Eye, FileText, AlertCircle, Shield, X, Activity, Clock, User, Paperclip } from "lucide-react";

const TOKEN_PRIORITY = ["clinicToken", "doctorToken", "agentToken", "staffToken", "userToken", "adminToken"];
const CLAIM_MODULE_KEY = "clinic_claim";

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

const getUserInfo = () => {
  if (typeof window === "undefined") return { role: null, id: null };
  try {
    for (const key of TOKEN_PRIORITY) {
      const token =
        localStorage.getItem(key) || sessionStorage.getItem(key);
      if (!token) continue;
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const decoded = JSON.parse(jsonPayload);
        return {
          role: decoded.role || decoded.userRole || null,
          id: decoded.userId || decoded.id || null,
        };
      } catch {
        continue;
      }
    }
  } catch (error) {
    console.error("Error getting user info:", error);
  }
  return { role: null, id: null };
};

const getUserRole = () => getUserInfo().role;

const isTruthy = (val) =>
  val === true || val === "true" || String(val || "").toLowerCase() === "true";

const findClaimModule = (permissionsList) =>
  permissionsList.find((p) => {
    if (!p?.module) return false;
    const mod = String(p.module).toLowerCase();
    return (
      mod === "clinic_claim" ||
      mod === "clinic_claims" ||
      mod === "claim" ||
      mod === "pass_claims"
    );
  });

const parsePermissionActions = (actions = {}) => {
  const moduleAll = isTruthy(actions.all);
  return {
    canRead: moduleAll || isTruthy(actions.read),
    canCreate: moduleAll || isTruthy(actions.create),
    canUpdate: moduleAll || isTruthy(actions.update),
    canDelete: moduleAll || isTruthy(actions.delete),
  };
};

const ITEMS_PER_PAGE = 12;

function PassClaimsPage() {
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Approved");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewModal, setViewModal] = useState(null);
  const [showTracking, setShowTracking] = useState(false);
  const [claimDetails, setClaimDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [previewFile, setPreviewFile] = useState(null);

  // Clinic-level (sidebar-permissions) + agent/doctorStaff-level (get-module-permissions)
  useEffect(() => {
    let isMounted = true;

    const userRole = getUserRole();
    const authToken = getStoredToken();
    const clinicToken =
      typeof window !== "undefined"
        ? localStorage.getItem("clinicToken") || sessionStorage.getItem("clinicToken")
        : null;
    const doctorToken =
      typeof window !== "undefined"
        ? localStorage.getItem("doctorToken") || sessionStorage.getItem("doctorToken")
        : null;
    const agentToken =
      typeof window !== "undefined"
        ? localStorage.getItem("agentToken") || sessionStorage.getItem("agentToken")
        : null;
    const staffToken =
      typeof window !== "undefined"
        ? localStorage.getItem("staffToken") || sessionStorage.getItem("staffToken")
        : null;
    const userToken =
      typeof window !== "undefined"
        ? localStorage.getItem("userToken") || sessionStorage.getItem("userToken")
        : null;

    if (userRole === "admin") {
      if (!isMounted) return;
      setPermissions({
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      });
      setPermissionsLoaded(true);
      return () => {
        isMounted = false;
      };
    }

    if (userRole === "clinic" || userRole === "doctor") {
      const fetchClinicPermissions = async () => {
        try {
          const clinicAuthToken = clinicToken || doctorToken || authToken;
          if (!clinicAuthToken) {
            if (!isMounted) return;
            setPermissions({
              canRead: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            });
            return;
          }

          const res = await axios.get("/api/clinic/sidebar-permissions", {
            headers: { Authorization: `Bearer ${clinicAuthToken}` },
          });

          if (!isMounted) return;

          if (res.data.success) {
            if (
              res.data.permissions === null ||
              !Array.isArray(res.data.permissions) ||
              res.data.permissions.length === 0
            ) {
              setPermissions({
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
              });
            } else {
              const modulePermission = findClaimModule(res.data.permissions);

              if (modulePermission) {
                setPermissions(parsePermissionActions(modulePermission.actions || {}));
              } else {
                setPermissions({
                  canRead: true,
                  canCreate: false,
                  canUpdate: false,
                  canDelete: false,
                });
              }
            }
          } else {
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
          }
        } catch (err) {
          console.error("Error fetching clinic sidebar permissions:", err);
          if (isMounted) {
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
          }
        } finally {
          if (isMounted) setPermissionsLoaded(true);
        }
      };

      fetchClinicPermissions();
      return () => {
        isMounted = false;
      };
    }

    const agentStaffToken = getStoredToken();
    if (!agentStaffToken) {
      setPermissions({
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      });
      setPermissionsLoaded(true);
      return () => {
        isMounted = false;
      };
    }

    if (
      agentToken ||
      staffToken ||
      userToken ||
      userRole === "agent" ||
      userRole === "doctorStaff" ||
      userRole === "staff"
    ) {
      const fetchAgentPermissions = async () => {
        try {
          setPermissionsLoaded(false);
          let permissionToken = agentStaffToken;
          if (userRole === "agent") {
            permissionToken = agentToken || agentStaffToken;
          } else if (userRole === "doctorStaff" || userRole === "staff") {
            permissionToken = userToken || staffToken || agentStaffToken;
          }
          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: CLAIM_MODULE_KEY },
            headers: { Authorization: `Bearer ${permissionToken}` },
          });

          if (!isMounted) return;

          if (
            !res.data?.permissions &&
            res.data?.error?.includes("not found in agent permissions")
          ) {
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
            return;
          }

          if (res.data?.success && res.data?.permissions) {
            setPermissions(parsePermissionActions(res.data.permissions.actions || {}));
          } else {
            setPermissions({
              canRead: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            });
          }
        } catch (err) {
          console.error("Error fetching agent permissions:", err);
          if (isMounted) {
            setPermissions({
              canRead: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            });
          }
        } finally {
          if (isMounted) setPermissionsLoaded(true);
        }
      };

      fetchAgentPermissions();
    } else {
      setPermissions({
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      });
      setPermissionsLoaded(true);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!permissionsLoaded) return;
    if (!permissions.canRead) {
      setClaims([]);
      setLoading(false);
      return;
    }
    fetchClaims();
  }, [permissionsLoaded, permissions.canRead]);

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

  const handleRelease = async (claimId) => {
    if (!permissions.canCreate) return;
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
    if (!permissions.canDelete) return;
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

  if (!permissionsLoaded) {
    return <Loader />;
  }

  if (!permissions.canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-700">
            You do not have permission to view pass claims. Please contact your
            administrator.
          </p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Doctor Review History</h1>
              <p className="text-gray-700 text-xs mt-1">
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

        {/* Main Content */}
        <div className="space-y-4">
          {/* Tabs and Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
            <div className="p-4 bg-gray-50/50">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient, policy, insurance, doctor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedClaims.map((claim) => (
                <div
                  key={claim._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col"
                >
                  {/* Card Header - Status Badge */}
                  <div className={`px-4 py-2.5 border-b rounded-t-xl ${getStatusBadge(claim.status)}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {claim.status === "Approved" ? "Approved" : claim.status === "Rejected" ? "Rejected" : "Released"}
                      </span>
                      <span className="text-[10px] font-medium opacity-80">
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
                  <div className="p-4 space-y-4 flex-1">
                    {/* Patient Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-bold text-sm">
                          {claim.patientFirstName?.[0]}{claim.patientLastName?.[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Patient</p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {claim.patientFirstName} {claim.patientLastName}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {/* Doctor Info */}
                      <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">
                          {claim.status === "Released" ? "Released By" : "Reviewed By"}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {claim.status === "Approved" 
                            ? claim.approvedByName || claim.doctorName
                            : claim.status === "Rejected"
                            ? claim.rejectedByName || claim.doctorName
                            : claim.releasedByName || claim.doctorName
                          }
                        </p>
                        <p className="text-[10px] text-teal-600 font-medium capitalize">
                          {claim.status === "Approved" 
                            ? (claim.approvedByRole || "Doctor")
                            : claim.status === "Rejected"
                            ? (claim.rejectedByRole || "Doctor")
                            : (claim.releasedByRole || "Doctor")
                          }
                        </p>
                      </div>

                      {/* Insurance Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50/50 rounded-lg p-2 border border-blue-100/50">
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">Provider</p>
                          <p className="text-xs font-semibold text-gray-900 truncate">{claim.insuranceProvider}</p>
                        </div>
                        <div className="bg-blue-50/50 rounded-lg p-2 border border-blue-100/50">
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">Policy #</p>
                          <p className="text-xs font-semibold text-gray-900 truncate">{claim.policyNumber}</p>
                        </div>
                      </div>

                      {/* Claim Details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50/50 rounded-lg p-2 border border-emerald-100/50">
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">Amount</p>
                          <p className="text-sm font-bold text-gray-900">₹{claim.claimAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-emerald-50/50 rounded-lg p-2 border border-emerald-100/50">
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">Department</p>
                          <p className="text-xs font-semibold text-gray-900 truncate">{claim.departmentName || "N/A"}</p>
                        </div>
                      </div>

                      {/* Services */}
                      <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight mb-1">Services</p>
                        <div className="flex flex-wrap gap-1">
                          {claim.services && claim.services.length > 0 ? (
                            claim.services.map((svc, idx) => (
                              <span key={idx} className="inline-flex px-1 py-0.5 rounded-full text-[8px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                                {svc.serviceName}
                              </span>
                            ))
                          ) : (
                            <p className="text-xs font-semibold text-gray-900 truncate">{claim.serviceName || "N/A"}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rejection Reason (if rejected) */}
                    {claim.status === "Rejected" && claim.rejectionReason && (
                      <div className="bg-red-50 border border-red-100 rounded-lg p-2.5">
                        <p className="text-[10px] text-red-600 font-bold flex items-center gap-1 uppercase">
                          <AlertCircle className="w-3 h-3" />
                          Rejection Reason
                        </p>
                        <p className="text-[11px] text-red-700 mt-1 line-clamp-2 leading-relaxed">{claim.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/80 rounded-b-xl flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      #{claim._id?.slice(-6)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleViewClaim(claim)}
                        className="p-2 bg-white text-gray-600 hover:text-teal-600 border border-gray-200 rounded-lg hover:border-teal-200 transition-all shadow-sm"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {claim.status === "Approved" && (
                        <>
                          {permissions.canCreate && (
                            <button
                              onClick={() => handleRelease(claim._id)}
                              disabled={actionLoading}
                              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-[11px] font-bold rounded-lg hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50 uppercase tracking-tight"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Release
                            </button>
                          )}
                          {permissions.canDelete && (
                            <button
                              onClick={() => setRejectModal(claim)}
                              disabled={actionLoading}
                              className="p-2 bg-white text-red-600 hover:bg-red-50 border border-red-100 rounded-lg transition-all shadow-sm disabled:opacity-50"
                              title="Reject Back to Doctor"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
              >
                Prev
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-all shadow-sm ${
                      currentPage === i + 1
                        ? "bg-teal-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Reject to Doctor
              </h2>
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectionNote("");
                }}
                className="p-2 hover:bg-red-100/50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-red-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Patient</p>
                  <p className="text-sm font-bold text-gray-900">{rejectModal.patientFirstName} {rejectModal.patientLastName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Doctor</p>
                  <p className="text-sm font-bold text-gray-900">{rejectModal.doctorName}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Rejection Note <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Explain why this claim is being rejected back to the doctor..."
                  rows="4"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none bg-gray-50/50"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setRejectModal(null);
                    setRejectionNote("");
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionNote.trim()}
                  className="flex-[2] px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className={`px-6 py-4 border-b sticky top-0 bg-white z-10 flex items-center justify-between ${getStatusBadge(viewModal.status)}`}>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold">
                  {viewModal.status === "Approved" ? "Approved Claim" : viewModal.status === "Rejected" ? "Rejected Claim" : "Released Claim"}
                </h2>
                <button
                  onClick={() => setShowTracking(!showTracking)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                    showTracking 
                      ? "bg-gray-900 text-white shadow-lg" 
                      : "bg-white/50 text-gray-700 hover:bg-white/80"
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  {showTracking ? "View Details" : "Track Claim"}
                </button>
              </div>
              <button
                onClick={() => {
                  setViewModal(null);
                  setClaimDetails(null);
                }}
                className="p-2 hover:bg-black/5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
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
                                        {formatDate(claimDetails?.approvedAt || viewModal.approvedAt)}
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
                                        {formatDate(claimDetails?.rejectedAt || viewModal.rejectedAt)}
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
                                        {formatDate(claimDetails?.rejectedFromPassClaimsAt)}
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
                                        {formatDate(claimDetails?.releasedAt || viewModal.releasedAt)}
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
                    {/* Patient & Insurance Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-500" /> Patient Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between border-b border-gray-50 pb-1">
                            <span className="text-gray-500">First Name:</span>
                            <span className="font-medium text-gray-900">{viewModal.patientFirstName || "-"}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-50 pb-1">
                            <span className="text-gray-500">Last Name:</span>
                            <span className="font-medium text-gray-900">{viewModal.patientLastName || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Mobile:</span>
                            <span className="font-medium text-gray-900">{viewModal.patientMobileNumber || "-"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-500" /> Insurance Details
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between border-b border-gray-50 pb-1">
                            <span className="text-gray-500">Provider:</span>
                            <span className="font-medium text-gray-900">{viewModal.insuranceProvider || "-"}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-50 pb-1">
                            <span className="text-gray-500">Policy #:</span>
                            <span className="font-medium text-gray-900">{viewModal.policyNumber || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Expiry Date:</span>
                            <span className="font-medium text-gray-900">{viewModal.expiryDate ? new Date(viewModal.expiryDate).toLocaleDateString() : "-"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Uploaded Insurance Files */}
                    {(viewModal.insuranceCardFile || viewModal.tableOfBenefitsFile) && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-purple-500" /> Insurance Files
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {viewModal.insuranceCardFile && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-500">Insurance Card</p>
                              <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 h-32 group">
                                {viewModal.insuranceCardFile.toLowerCase().endsWith('.pdf') ? (
                                  <div className="flex items-center justify-center h-full">
                                    <FileText className="w-8 h-8 text-gray-400" />
                                  </div>
                                ) : (
                                  <img src={viewModal.insuranceCardFile} alt="Card" className="w-full h-full object-contain" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button 
                                    onClick={() => setPreviewFile({ url: viewModal.insuranceCardFile, name: "Insurance Card", field: "insuranceCardFile" })}
                                    className="px-3 py-1.5 bg-white text-gray-900 text-xs font-bold rounded-lg shadow-lg hover:scale-105 transition-transform"
                                  >
                                    View Full
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          {viewModal.tableOfBenefitsFile && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-500">Table of Benefits</p>
                              <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 h-32 group">
                                {viewModal.tableOfBenefitsFile.toLowerCase().endsWith('.pdf') ? (
                                  <div className="flex items-center justify-center h-full">
                                    <FileText className="w-8 h-8 text-gray-400" />
                                  </div>
                                ) : (
                                  <img src={viewModal.tableOfBenefitsFile} alt="Benefits" className="w-full h-full object-contain" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button 
                                    onClick={() => setPreviewFile({ url: viewModal.tableOfBenefitsFile, name: "Table of Benefits", field: "tableOfBenefitsFile" })}
                                    className="px-3 py-1.5 bg-white text-gray-900 text-xs font-bold rounded-lg shadow-lg hover:scale-105 transition-transform"
                                  >
                                    View Full
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Claim Details */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-orange-500" /> Claim Details
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Claim Type</p>
                          <p className="text-sm font-semibold text-gray-900">{viewModal.claimType}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Claim Amount</p>
                          <p className="text-sm font-semibold text-teal-600 font-bold">₹{viewModal.claimAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Doctor</p>
                          <p className="text-sm font-semibold text-gray-900">{viewModal.doctorName || "-"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Department</p>
                          <p className="text-sm font-semibold text-gray-900">{viewModal.departmentName || "-"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 col-span-2 sm:col-span-1">
                          <p className="text-xs text-gray-500 mb-1">Services</p>
                          <div className="flex flex-wrap gap-1.5">
                            {viewModal.services && viewModal.services.length > 0 ? (
                              viewModal.services.map((svc, idx) => (
                              <span 
                                key={idx} 
                                className="inline-flex items-center px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 text-[9px] font-bold whitespace-nowrap shadow-sm"
                              >
                                {svc.serviceName}
                              </span>
                            ))
                            ) : (
                              <p className="text-sm font-semibold text-gray-900">{viewModal.serviceName || "-"}</p>
                            )}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Co-Pay %</p>
                          <p className="text-sm font-semibold text-gray-900">{viewModal.coPayPercent}%</p>
                        </div>
                        {(viewModal.claimType === "Advance" || viewModal.claimType === "Paid") && (
                          <>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500">{viewModal.claimType} Status</p>
                              <p className="text-sm font-semibold text-gray-900">{viewModal.advanceStatus || "-"}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500">Paid Amount</p>
                              <p className="text-sm font-semibold text-gray-900">₹{viewModal.advanceAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                          </>
                        )}
                        {viewModal.pendingClaim > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Pending Claim</p>
                            <p className="text-sm font-semibold text-orange-600 font-bold">₹{viewModal.pendingClaim?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                          </div>
                        )}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Status</p>
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(viewModal.status)}`}>
                            {viewModal.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Review History */}
                    {(viewModal.approvedByName || viewModal.rejectedByName || viewModal.releasedByName) && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-teal-500" /> Review Tracking
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {viewModal.approvedByName && (
                            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                              <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Approved By</p>
                              <p className="text-sm font-bold text-gray-900">{viewModal.approvedByName}</p>
                              <p className="text-[10px] text-gray-500 mt-1">{formatDate(viewModal.approvedAt)}</p>
                            </div>
                          )}
                          {viewModal.rejectedByName && (
                            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                              <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Rejected By</p>
                              <p className="text-sm font-bold text-gray-900">{viewModal.rejectedByName}</p>
                              <p className="text-[10px] text-gray-500 mt-1">{formatDate(viewModal.rejectedAt)}</p>
                            </div>
                          )}
                          {viewModal.releasedByName && (
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                              <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Released By</p>
                              <p className="text-sm font-bold text-gray-900">{viewModal.releasedByName}</p>
                              <p className="text-[10px] text-gray-500 mt-1">{formatDate(viewModal.releasedAt)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Treatment Plan & Notes */}
                    {(viewModal.treatmentPlan || viewModal.notes || viewModal.reviewNotes) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(viewModal.treatmentPlan || claimDetails?.treatmentPlan) && (
                          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-purple-800 mb-2">Treatment Plan</h3>
                            <p className="text-sm text-purple-900 whitespace-pre-wrap leading-relaxed">
                              {claimDetails?.treatmentPlan || viewModal.treatmentPlan}
                            </p>
                          </div>
                        )}
                        {(viewModal.notes || viewModal.reviewNotes) && (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
                            {viewModal.notes && (
                              <div>
                                <h3 className="text-sm font-semibold text-blue-800 mb-1">Claim Notes</h3>
                                <p className="text-sm text-blue-900 leading-relaxed">{viewModal.notes}</p>
                              </div>
                            )}
                            {viewModal.reviewNotes && (
                              <div>
                                <h3 className="text-sm font-semibold text-blue-800 mb-1">Reviewer Notes</h3>
                                <p className="text-sm text-blue-900 leading-relaxed">{viewModal.reviewNotes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Claim Documents */}
                    {viewModal.documentFiles && viewModal.documentFiles.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-500" /> Supporting Documents
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {viewModal.documentFiles.map((file, idx) => (
                            <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 h-24 group">
                              {file.toLowerCase().endsWith('.pdf') ? (
                                <div className="flex items-center justify-center h-full">
                                  <FileText className="w-6 h-6 text-gray-400" />
                                </div>
                              ) : (
                                <img src={file} alt={`Doc ${idx + 1}`} className="w-full h-full object-contain" />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                  onClick={() => setPreviewFile({ url: file, name: `Document ${idx + 1}`, field: "documentFiles" })}
                                  className="px-2 py-1 bg-white text-gray-900 text-[10px] font-bold rounded shadow-lg hover:scale-105 transition-transform"
                                >
                                  View
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Administrative Details */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-widest">Administrative Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[10px]">
                        <div className="flex justify-between border-b border-gray-200 pb-1">
                          <span className="text-gray-500">Patient Name:</span>
                          <span className="font-semibold text-gray-700">{viewModal.patientFirstName} {viewModal.patientLastName}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-1">
                          <span className="text-gray-500">Doctor Name:</span>
                          <span className="font-semibold text-gray-700">{viewModal.doctorName || "-"}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-1">
                          <span className="text-gray-500">Insurance Provider:</span>
                          <span className="font-semibold text-gray-700">{viewModal.insuranceProvider}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-1">
                          <span className="text-gray-500">Claim Type:</span>
                          <span className="font-semibold text-gray-700">{viewModal.claimType}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-1">
                          <span className="text-gray-500">Created At:</span>
                          <span className="text-gray-700">{formatDate(viewModal.createdAt)}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-1">
                          <span className="text-gray-500">Last Updated:</span>
                          <span className="text-gray-700">{formatDate(viewModal.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </>
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
            <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
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
  );
}

PassClaimsPage.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedPassClaimsPage = withClinicAuth(PassClaimsPage);
ProtectedPassClaimsPage.getLayout = PassClaimsPage.getLayout;

export default ProtectedPassClaimsPage;
