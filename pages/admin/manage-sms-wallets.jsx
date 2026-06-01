import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import { Search, Plus, RefreshCw, Wallet, TrendingUp, Users, AlertTriangle } from "lucide-react";

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

function AllocateModal({ isOpen, onClose, onConfirm, wallet }) {
  const [credits, setCredits] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setCredits("");
      setNote("");
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const creditsNum = parseInt(credits, 10);
    if (Number.isNaN(creditsNum) || creditsNum <= 0) {
      return;
    }
    onConfirm(creditsNum, note);
    setCredits("");
    setNote("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Allocate SMS Credits</h3>
        {wallet && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <span className="font-semibold">{wallet.ownerId?.name || "User"}</span> ({wallet.ownerType})
            </p>
            <p className="text-xs text-slate-500">Current balance: {wallet.balance}</p>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Credits to Allocate</label>
            <input
              type="number"
              min="1"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="Enter credits"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 resize-none mb-2">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 resize-none rounded-xl focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add a note about this allocation"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
          >
            Allocate
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminCreditModal({ isOpen, onClose, onSubmit, loading }) {
  const [amount, setAmount] = useState("");
  const [threshold, setThreshold] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setThreshold("");
      setNote("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const payload = {};
    if (amount) payload.amount = parseInt(amount, 10);
    if (threshold) payload.lowThreshold = parseInt(threshold, 10);
    payload.note = note;
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Add Admin SMS Credits</h3>
          <p className="text-sm text-slate-600">Increase the central SMS pool or adjust the low-balance threshold.</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Credits to add</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="Enter credits"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Low balance threshold</label>
            <input
              type="number"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="Optional – e.g., 1000"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Optional note"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const ManageSmsWallets = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [toast, setToast] = useState(null);
  const [allocateModal, setAllocateModal] = useState({ open: false, wallet: null });
  const [adminCredits, setAdminCredits] = useState(null);
  const [adminCreditsLoading, setAdminCreditsLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminModalLoading, setAdminModalLoading] = useState(false);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("ownerType", filterType);
      if (searchTerm) params.append("search", searchTerm);

      const res = await axios.get(`/api/marketing/wallet?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWallets(res.data?.data || []);
    } catch (error) {
      console.error("fetch wallets error", error);
      setToast({ message: "Failed to load wallets", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchWallets();
    fetchAdminCredits();
  };

  useEffect(() => {
    fetchWallets();
  }, [filterType]);

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

  const handleAllocate = async (credits, note) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        "/api/marketing/wallet",
        {
          ownerId: allocateModal.wallet.ownerId._id || allocateModal.wallet.ownerId,
          ownerType: allocateModal.wallet.ownerType,
          credits,
          note,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ message: `Successfully allocated ${credits} credits`, type: "success" });
      setAllocateModal({ open: false, wallet: null });
      fetchWallets();
      fetchAdminCredits();
    } catch (error) {
      console.error("allocate error", error);
      setToast({ message: error?.response?.data?.message || "Failed to allocate credits", type: "error" });
    }
  };

  const handleAdminCreditsSubmit = async ({ amount, lowThreshold, note }) => {
    try {
      setAdminModalLoading(true);
      const token = localStorage.getItem("adminToken");
      await axios.post(
        "/api/marketing/admin-credits",
        {
          amount,
          lowThreshold,
          note,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ message: "Admin SMS credits updated", type: "success" });
      setShowAdminModal(false);
      fetchAdminCredits();
    } catch (error) {
      console.error("admin credits update error", error);
      setToast({ message: error?.response?.data?.message || "Failed to update admin credits", type: "error" });
    } finally {
      setAdminModalLoading(false);
    }
  };

  const filteredWallets = wallets.filter((w) => {
    if (filterType !== "all" && w.ownerType !== filterType) return false;
    if (searchTerm) {
      const name = w.ownerId?.name || "";
      const email = w.ownerId?.email || "";
      const search = searchTerm.toLowerCase();
      return name.toLowerCase().includes(search) || email.toLowerCase().includes(search);
    }
    return true;
  });

  const stats = {
    total: wallets.length,
    clinics: wallets.filter((w) => w.ownerType === "clinic").length,
    doctors: wallets.filter((w) => w.ownerType === "doctor").length,
    totalBalance: wallets.reduce((sum, w) => sum + (w.balance || 0), 0),
    totalSent: wallets.reduce((sum, w) => sum + (w.totalSent || 0), 0),
  };

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-5 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-5 mb-5 sm:mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Admin SMS Pool</p>
              {adminCreditsLoading ? (
                <p className="text-slate-500 text-sm mt-1">Loading credits...</p>
              ) : adminCredits ? (
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {adminCredits.availableCredits?.toLocaleString() || 0} <span className="text-sm sm:text-base text-slate-500 font-normal">credits</span>
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
            <div className="flex flex-wrap gap-3">
              {adminCredits?.isLow && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs sm:text-sm font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  Low credits
                </span>
              )}
              <button
                onClick={() => setShowAdminModal(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Credits
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-5 mb-5 sm:mb-6">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-blue-900">SMS Wallet Management</h1>
              <p className="text-blue-600 mt-1 text-sm">Manage SMS credits for clinics and doctors</p>
            </div>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 uppercase tracking-wide">Total Wallets</p>
                  <p className="text-xl font-bold text-blue-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="text-xs text-emerald-600 uppercase tracking-wide">Clinics</p>
                  <p className="text-xl font-bold text-emerald-900">{stats.clinics}</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-xs text-purple-600 uppercase tracking-wide">Doctors</p>
                  <p className="text-xl font-bold text-purple-900">{stats.doctors}</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="text-xs text-amber-600 uppercase tracking-wide">Total Balance</p>
                  <p className="text-xl font-bold text-amber-900">{stats.totalBalance.toLocaleString()}</p>
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full sm:w-44 px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 text-xs bg-white"
            >
              <option value="all">All Types</option>
              <option value="clinic">Clinics</option>
              <option value="doctor">Doctors</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-500 text-sm">Loading wallets...</div>
          ) : filteredWallets.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">No wallets found</div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-slate-200">
                {filteredWallets.map((wallet) => (
                  <div key={wallet._id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{wallet.ownerId?.name || "N/A"}</p>
                        <p className="text-[11px] text-slate-500 truncate">{wallet.ownerId?.email || ""}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              wallet.ownerType === "clinic"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {wallet.ownerType}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${wallet.balance <= 20 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
                            Bal: {wallet.balance?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-700">Sent: {wallet.totalSent?.toLocaleString() || 0}</p>
                        <p className="text-sm text-slate-700">Bought: {wallet.totalPurchased?.toLocaleString() || 0}</p>
                        <p className="text-[11px] text-slate-500">{wallet.lastTopupAt ? new Date(wallet.lastTopupAt).toLocaleDateString() : "Never"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAllocateModal({ open: true, wallet })}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-semibold hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      Allocate
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Owner</th>
                      <th className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Type</th>
                      <th className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Balance</th>
                      <th className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Total Sent</th>
                      <th className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Total Purchased</th>
                      <th className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Last Top-up</th>
                      <th className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredWallets.map((wallet) => (
                      <tr key={wallet._id} className="hover:bg-slate-50">
                        <td className="px-4 sm:px-5 py-3">
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{wallet.ownerId?.name || "N/A"}</p>
                            <p className="text-[11px] text-slate-500">{wallet.ownerId?.email || ""}</p>
                          </div>
                        </td>
                        <td className="px-4 sm:px-5 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                              wallet.ownerType === "clinic"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {wallet.ownerType}
                          </span>
                        </td>
                        <td className="px-4 sm:px-5 py-3">
                          <span className={`font-bold text-sm ${wallet.balance <= 20 ? "text-rose-600" : "text-slate-900"}`}>
                            {wallet.balance?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="px-4 sm:px-5 py-3 text-sm text-slate-700">{wallet.totalSent?.toLocaleString() || 0}</td>
                        <td className="px-4 sm:px-5 py-3 text-sm text-slate-700">{wallet.totalPurchased?.toLocaleString() || 0}</td>
                        <td className="px-4 sm:px-5 py-3 text-xs text-slate-500">
                          {wallet.lastTopupAt ? new Date(wallet.lastTopupAt).toLocaleDateString() : "Never"}
                        </td>
                        <td className="px-4 sm:px-5 py-3">
                          <button
                            onClick={() => setAllocateModal({ open: true, wallet })}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-semibold hover:bg-blue-700"
                          >
                            <Plus className="w-4 h-4" />
                            Allocate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <AllocateModal
        isOpen={allocateModal.open}
        onClose={() => setAllocateModal({ open: false, wallet: null })}
        onConfirm={handleAllocate}
        wallet={allocateModal.wallet}
      />
      <AdminCreditModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSubmit={handleAdminCreditsSubmit}
        loading={adminModalLoading}
      />
    </div>
  );
};

ManageSmsWallets.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;
const ProtectedManageSmsWallets = withAdminAuth(ManageSmsWallets);
ProtectedManageSmsWallets.getLayout = ManageSmsWallets.getLayout;

export default ProtectedManageSmsWallets;

