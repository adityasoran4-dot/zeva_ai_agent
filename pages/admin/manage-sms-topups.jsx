import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import { Search, RefreshCw, CheckCircle, XCircle, Clock, MessageSquare, AlertTriangle } from "lucide-react";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-emerald-500 border-emerald-600",
    error: "bg-rose-500 border-rose-600",
    info: "bg-blue-500 border-blue-600",
  };

  return (
    <div className={`${styles[type]} text-white px-6 py-3 rounded-xl shadow-lg border flex items-center gap-3 fixed top-4 right-4 z-50`}>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 rounded-lg p-1">×</button>
    </div>
  );
}

function ActionModal({ isOpen, onClose, onConfirm, request, action }) {
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setAdminNote("");
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !request) return null;

  const handleSubmit = () => {
    onConfirm(adminNote);
    setAdminNote("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">
          {action === "approve" ? "Approve" : "Reject"} Top-up Request
        </h3>
        <div className="mb-4 p-3 bg-slate-50 rounded-lg space-y-2">
          <p className="text-sm">
            <span className="font-semibold text-slate-700">User:</span>{" "}
            <span className="text-slate-900">{request.ownerId?.name || "N/A"}</span>
          </p>
          <p className="text-sm">
            <span className="font-semibold text-slate-700">Type:</span>{" "}
            <span className="text-slate-900 capitalize">{request.ownerType}</span>
          </p>
          <p className="text-sm">
            <span className="font-semibold text-slate-700">Credits:</span>{" "}
            <span className="text-slate-900 font-bold">{request.credits}</span>
          </p>
          {request.note && (
            <p className="text-sm">
              <span className="font-semibold text-slate-700">Note:</span>{" "}
              <span className="text-slate-600">{request.note}</span>
            </p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Admin Note (optional)</label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Add a note about this decision"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`flex-1 px-4 py-2 rounded-xl font-medium ${
              action === "approve"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-rose-600 text-white hover:bg-rose-700"
            }`}
          >
            {action === "approve" ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

const ManageSmsTopups = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast, setToast] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, request: null, action: null });
  const [adminCredits, setAdminCredits] = useState(null);
  const [adminCreditsLoading, setAdminCreditsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (searchTerm) params.append("search", searchTerm);

      const res = await axios.get(`/api/marketing/topup?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data?.data || []);
    } catch (error) {
      console.error("fetch requests error", error);
      setToast({ message: "Failed to load top-up requests", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchAdminCredits = async () => {
    try {
      setAdminCreditsLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get("/api/marketing/admin-credits", { headers: { Authorization: `Bearer ${token}` } });
      setAdminCredits(res.data?.data || null);
    } catch (error) {
      console.error("admin credits fetch error", error);
      setToast({ message: "Failed to load admin credits", type: "error" });
    } finally {
      setAdminCreditsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminCredits();
  }, []);

  const handleAction = async (adminNote) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.patch(
        `/api/marketing/topup/${actionModal.request._id}`,
        {
          status: actionModal.action === "approve" ? "approved" : "rejected",
          adminNote,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({
        message: `Request ${actionModal.action === "approve" ? "approved" : "rejected"} successfully`,
        type: "success",
      });
      setActionModal({ open: false, request: null, action: null });
      fetchRequests();
      fetchAdminCredits();
    } catch (error) {
      console.error("action error", error);
      setToast({ message: error?.response?.data?.message || "Failed to process request", type: "error" });
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (searchTerm) {
      const name = r.ownerId?.name || "";
      const email = r.ownerId?.email || "";
      const search = searchTerm.toLowerCase();
      return name.toLowerCase().includes(search) || email.toLowerCase().includes(search);
    }
    return true;
  });

  const stats = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    totalCredits: requests.filter((r) => r.status === "approved").reduce((sum, r) => sum + (r.credits || 0), 0),
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { bg: "bg-amber-50", text: "text-amber-700", icon: Clock, label: "Pending" },
      approved: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle, label: "Approved" },
      rejected: { bg: "bg-rose-50", text: "text-rose-700", icon: XCircle, label: "Rejected" },
    };
    return configs[status] || configs.pending;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-5 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-5 mb-5 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Admin SMS Pool</p>
            {adminCreditsLoading ? (
              <p className="text-slate-500 text-sm mt-1">Loading credits...</p>
            ) : adminCredits ? (
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {adminCredits.availableCredits?.toLocaleString() || 0} <span className="text-sm sm:text-base font-normal text-slate-500">credits</span>
                </p>
                <p className="text-xs sm:text-sm text-slate-500">
                  Low threshold: {adminCredits.lowThreshold?.toLocaleString()} • Last top-up:{" "}
                  {adminCredits.lastTopupAt ? new Date(adminCredits.lastTopupAt).toLocaleString() : "Never"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-rose-600">Unable to load admin credits.</p>
            )}
          </div>
          {adminCredits?.isLow && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs sm:text-sm font-semibold">
              <AlertTriangle className="w-4 h-4" />
              Low credits – add more from wallet page
            </span>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-5 mb-5 sm:mb-6">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">SMS Top-up Requests</h1>
              <p className="text-slate-600 mt-1 text-sm">Review and manage SMS credit top-up requests</p>
            </div>
            <button
              onClick={fetchRequests}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="text-xs text-amber-600 uppercase tracking-wide">Pending</p>
                  <p className="text-xl font-bold text-amber-900">{stats.pending}</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="text-xs text-emerald-600 uppercase tracking-wide">Approved</p>
                  <p className="text-xl font-bold text-emerald-900">{stats.approved}</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
              <div className="flex items-center gap-2">
                <XCircle className="w-6 h-6 text-rose-600" />
                <div>
                  <p className="text-xs text-rose-600 uppercase tracking-wide">Rejected</p>
                  <p className="text-xl font-bold text-rose-900">{stats.rejected}</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 uppercase tracking-wide">Total Credits</p>
                  <p className="text-xl font-bold text-blue-900">{stats.totalCredits.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">
                
              </option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-500 text-sm">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">No requests found</div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-slate-200">
                {filteredRequests.map((request) => {
                  const statusConfig = getStatusConfig(request.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div key={request._id} className="p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm">{request.ownerId?.name || "N/A"}</p>
                          <p className="text-[11px] text-slate-500 truncate">{request.ownerId?.email || ""}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">
                              {request.ownerType}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 text-sm">{request.credits?.toLocaleString() || 0}</p>
                          <p className="text-[11px] text-slate-500">{new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {request.note && (
                        <p className="text-[11px] text-slate-600 line-clamp-2">{request.note}</p>
                      )}
                      {request.status === "pending" ? (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setActionModal({ open: true, request, action: "approve" })}
                            className="flex-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setActionModal({ open: true, request, action: "reject" })}
                            className="flex-1 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[11px] font-semibold hover:bg-rose-700"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        request.adminNote && <p className="text-[11px] text-slate-500 italic">{request.adminNote}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">User</th>
                      <th className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Type</th>
                      <th className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Credits</th>
                      <th className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Note</th>
                      <th className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Status</th>
                      <th className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Date</th>
                      <th className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRequests.map((request) => {
                      const statusConfig = getStatusConfig(request.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <tr key={request._id} className="hover:bg-slate-50">
                          <td className="px-4 sm:px-5 py-3">
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{request.ownerId?.name || "N/A"}</p>
                              <p className="text-[11px] text-slate-500">{request.ownerId?.email || ""}</p>
                            </div>
                          </td>
                          <td className="px-4 sm:px-5 py-3">
                            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">
                              {request.ownerType}
                            </span>
                          </td>
                          <td className="px-4 sm:px-5 py-3">
                            <span className="font-bold text-slate-900 text-sm">{request.credits?.toLocaleString() || 0}</span>
                          </td>
                          <td className="px-4 sm:px-5 py-3 text-xs text-slate-600 max-w-xs truncate">
                            {request.note || "-"}
                          </td>
                          <td className="px-4 sm:px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-4 sm:px-5 py-3 text-xs text-slate-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 sm:px-5 py-3">
                            {request.status === "pending" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setActionModal({ open: true, request, action: "approve" })}
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setActionModal({ open: true, request, action: "reject" })}
                                  className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[11px] font-semibold hover:bg-rose-700"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {request.status !== "pending" && request.adminNote && (
                              <p className="text-[11px] text-slate-500 italic">{request.adminNote}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ActionModal
        isOpen={actionModal.open}
        onClose={() => setActionModal({ open: false, request: null, action: null })}
        onConfirm={handleAction}
        request={actionModal.request}
        action={actionModal.action}
      />
    </div>
  );
};

ManageSmsTopups.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;
const ProtectedManageSmsTopups = withAdminAuth(ManageSmsTopups);
ProtectedManageSmsTopups.getLayout = ManageSmsTopups.getLayout;

export default ProtectedManageSmsTopups;

