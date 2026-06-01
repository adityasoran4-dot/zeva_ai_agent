import React, { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { X, RefreshCcw, AlertTriangle, ArrowUpRight } from "lucide-react";

const LOW_BALANCE_THRESHOLD = 20;

const SmsTopupPanel = ({ open, onClose, authToken, onBalanceUpdate }) => {
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState("");
  const [topups, setTopups] = useState([]);
  const [topupsLoading, setTopupsLoading] = useState(false);
  const [topupForm, setTopupForm] = useState({ credits: "", note: "" });
  const [topupSubmitting, setTopupSubmitting] = useState(false);
  const [topupStatusMessage, setTopupStatusMessage] = useState("");

  const onBalanceUpdateRef = useRef(onBalanceUpdate);
  useEffect(() => {
    onBalanceUpdateRef.current = onBalanceUpdate;
  }, [onBalanceUpdate]);

  const fetchWallet = useCallback(async () => {
    if (!authToken) return;
    try {
      setWalletLoading(true);
      setWalletError("");
      const res = await axios.get("/api/marketing/wallet/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const walletData = res.data?.data || null;
      setWallet(walletData);
      if (onBalanceUpdateRef.current && walletData) {
        onBalanceUpdateRef.current(walletData);
      }
    } catch (error) {
      console.error("wallet fetch error", error);
      setWallet(null);
      setWalletError(error?.response?.data?.message || "Unable to load SMS wallet information.");
    } finally {
      setWalletLoading(false);
    }
  }, [authToken]);

  const fetchTopups = useCallback(async () => {
    if (!authToken) return;
    try {
      setTopupsLoading(true);
      const res = await axios.get("/api/marketing/topup?limit=5", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setTopups(res.data?.data || []);
    } catch (error) {
      console.error("topup fetch error", error);
    } finally {
      setTopupsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (open && authToken) {
      fetchWallet();
      fetchTopups();
    }
  }, [open, authToken]); // Only fetch when modal opens

  const effectiveThreshold = wallet?.lowBalanceThreshold ?? LOW_BALANCE_THRESHOLD;
  const isLowBalance = wallet ? wallet.balance <= effectiveThreshold : false;

  const handleTopupSubmit = async () => {
    if (!authToken) {
      setTopupStatusMessage("Authentication token missing. Please sign in again.");
      return;
    }

    const creditsInt = parseInt(topupForm.credits, 10);
    if (Number.isNaN(creditsInt) || creditsInt <= 0) {
      setTopupStatusMessage("Enter a valid credit amount.");
      return;
    }

    try {
      setTopupSubmitting(true);
      setTopupStatusMessage("");
      await axios.post(
        "/api/marketing/topup",
        { credits: creditsInt, note: topupForm.note },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setTopupStatusMessage("✅ Top-up request submitted successfully.");
      setTopupForm({ credits: "", note: "" });
      await fetchTopups();
      await fetchWallet();
    } catch (error) {
      console.error("topup submit error", error);
      setTopupStatusMessage(error?.response?.data?.message || "Failed to submit request.");
    } finally {
      setTopupSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-2">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-500">SMS Wallet</p>
              <h2 className="text-sm font-bold text-slate-900">Top-up & Balance</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition bg-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Wallet Header */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">SMS Wallet</p>
              {walletLoading ? (
                <p className="text-slate-500 mt-1 text-xs">Loading wallet details...</p>
              ) : wallet ? (
                <div>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {wallet.balance.toLocaleString()} <span className="text-xs font-normal text-slate-500">credits</span>
                  </p>
                  <p className="text-xs text-slate-500">Available credits</p>
                </div>
              ) : (
                <p className="text-rose-600 mt-1 text-xs">{walletError || "Wallet information is unavailable."}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  fetchWallet();
                  fetchTopups();
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-400 bg-white"
                disabled={walletLoading}
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${walletLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {isLowBalance && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-rose-700 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />
              <div>
                <p className="font-semibold">Your balance is running low.</p>
                <p className="text-[10px]">We recommend requesting more credits to avoid interruptions.</p>
              </div>
            </div>
          )}

          {wallet && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="p-2 border border-slate-200 rounded-lg bg-slate-50">
                <p className="text-[9px] uppercase tracking-wide text-slate-500">Available</p>
                <p className="text-base font-bold mt-1">
                  {wallet.balance.toLocaleString()}
                  <span className="text-xs font-normal text-slate-500 ml-1">credits</span>
                </p>
              </div>
              <div className="p-2 border border-slate-200 rounded-lg bg-slate-50">
                <p className="text-[9px] uppercase tracking-wide text-slate-500">Total Sent</p>
                <p className="text-base font-bold mt-1 text-slate-900">
                  {wallet.totalSent?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-2 border border-slate-200 rounded-lg bg-slate-50">
                <p className="text-[9px] uppercase tracking-wide text-slate-500">Total Purchased</p>
                <p className="text-base font-bold mt-1 text-slate-900">
                  {wallet.totalPurchased?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 p-2.5 bg-slate-50">
              <p className="text-xs font-semibold text-slate-800">Request Additional Credits</p>
              <p className="text-[10px] text-slate-500 mb-2">Submit a request to our team for manual approval.</p>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold">Credits Needed</label>
                  <input
                    type="number"
                    min="1"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                    value={topupForm.credits}
                    onChange={(e) => setTopupForm((prev) => ({ ...prev, credits: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold">Note (optional)</label>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    value={topupForm.note}
                    onChange={(e) => setTopupForm((prev) => ({ ...prev, note: e.target.value }))}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTopupSubmit}
                  disabled={topupSubmitting}
                  className="w-full rounded-lg bg-slate-900 text-white py-2 text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
                >
                  {topupSubmitting ? "Submitting..." : "Submit Top-up Request"}
                </button>
                {topupStatusMessage && (
                  <p className={`text-[10px] ${topupStatusMessage.includes("✅") ? "text-emerald-600" : "text-rose-600"}`}>
                    {topupStatusMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-2.5 bg-white">
              <p className="text-xs font-semibold text-slate-800 mb-1.5">Recent Top-up Requests</p>
              {topupsLoading ? (
                <p className="text-xs text-slate-500">Loading requests...</p>
              ) : topups.length === 0 ? (
                <p className="text-xs text-slate-500">No recent requests yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {topups.map((item) => (
                    <div key={item._id} className="flex items-center justify-between border border-slate-100 rounded-md px-2 py-1.5">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{item.credits} credits</p>
                        <p className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          item.status === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.status === "rejected"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmsTopupPanel;

