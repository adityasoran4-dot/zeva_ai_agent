import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Package, TrendingUp, Eye, Search, ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle2, Info, Edit3, User, DollarSign, Mail, Phone, Calendar, FileText, MapPin, Building2, CreditCard, Trash2, Download, Activity, ClipboardList, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useRouter } from "next/router";
import ClinicLayout from '../../components/staffLayout';
import withClinicAuth from '../../components/withStaffAuth';
import AddPatientAdvancePaymentModal from "@/components/patient/AddPatientAdvancePaymentModal";
import AddPatientPastAdvancePaymentModal from "@/components/patient/AddPatientPastAdvancePaymentModal";

const TOKEN_PRIORITY = [
  "clinicToken",
  "doctorToken",
  "agentToken",
  "staffToken",
  "userToken",
  "adminToken",
];

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  for (const key of TOKEN_PRIORITY) {
    const value =
      localStorage.getItem(key) ||
      sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const getAuthHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3500); return () => clearTimeout(timer); }, [onClose]);
  const styles = { success: "bg-emerald-500", error: "bg-rose-500", info: "bg-blue-500" };
  return (
    <div className={`${styles[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slideIn`}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 rounded p-1"><X className="w-4 h-4" /></button>
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm px-4">
    {toasts.map(toast => <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />)}
  </div>
);

// Package Usage Modal Component
const PackageUsageModal = ({ isOpen, onClose, patient, packageUsageData, loading, selectedPackage = null }) => {
  const [expandedPackages, setExpandedPackages] = useState({});

  useEffect(() => {
    if (isOpen && packageUsageData) {
      if (selectedPackage) {
        // If a specific package is selected, expand it
        setExpandedPackages({ [selectedPackage.name]: true });
      } else {
        // Auto-expand first package
        const firstPkg = packageUsageData[0]?.packageName;
        if (firstPkg) {
          setExpandedPackages({ [firstPkg]: true });
        }
      }
    }
  }, [isOpen, packageUsageData, selectedPackage]);

  const togglePackage = (pkgName) => {
    setExpandedPackages(prev => ({
      ...prev,
      [pkgName]: !prev[pkgName]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-2 sm:my-4 max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Package Usage Details</h3>
              <p className="text-[10px] text-teal-100">
                {patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'} - Session Tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-3"></div>
              <p className="text-gray-600 text-sm">Loading package usage data...</p>
            </div>
          ) : !packageUsageData || packageUsageData.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="text-base font-semibold text-gray-700 mb-1.5">No Package Usage Found</h4>
              <p className="text-gray-500 text-xs">This patient has no package billing records yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Package Details */}
              {packageUsageData.map((pkg, pkgIndex) => (
                <div key={pkg.packageName} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  {/* Package Header */}
                  <button
                    onClick={() => togglePackage(pkg.packageName)}
                    className="w-full px-3 py-2.5 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:from-teal-50 hover:to-white transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-teal-600">#{pkgIndex + 1}</span>
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900 text-sm">{pkg.packageName}</h4>
                        <div className="text-[10px] text-gray-500 flex flex-wrap gap-1.5 mt-0.5">
                          <span>{pkg.treatments?.length || 0} treatments</span>
                          <span>{pkg.totalSessions || 0} sessions</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">
                        {pkg.billingHistory?.length || 0} bills
                      </span>
                      {expandedPackages[pkg.packageName] ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Package Content */}
                  {expandedPackages[pkg.packageName] && (
                    <div className="border-t border-gray-100">
                      {/* Treatments List */}
                      <div className="p-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-teal-500" />
                          Treatment Sessions
                        </h5>

                        {pkg.treatments && pkg.treatments.length > 0 ? (
                          <div className="space-y-2.5">
                            {pkg.treatments.map((treatment, tIndex) => {
                              const usagePercent = treatment.maxSessions
                                ? Math.round((treatment.totalUsedSessions / treatment.maxSessions) * 100)
                                : 0;
                              const isFullyUsed = treatment.maxSessions && treatment.totalUsedSessions >= treatment.maxSessions;
                              const remainingSessions = (treatment.maxSessions || 0) - (treatment.totalUsedSessions || 0);

                              return (
                                <div
                                  key={treatment.treatmentSlug || tIndex}
                                  className={`rounded-lg border p-2.5 ${isFullyUsed
                                    ? 'bg-green-50 border-green-200'
                                    : remainingSessions > 0
                                      ? 'bg-amber-50 border-amber-200'
                                      : 'bg-gray-50 border-gray-200'
                                    }`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold ${isFullyUsed
                                        ? 'bg-green-500 text-white'
                                        : remainingSessions > 0
                                          ? 'bg-amber-500 text-white'
                                          : 'bg-gray-400 text-white'
                                        }`}>
                                        {tIndex + 1}
                                      </div>
                                      <span className="font-medium text-gray-900 text-sm">{treatment.treatmentName}</span>
                                    </div>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${isFullyUsed
                                      ? 'bg-green-100 text-green-700'
                                      : remainingSessions > 0
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-gray-100 text-gray-600'
                                      }`}>
                                      {isFullyUsed ? 'Complete' : remainingSessions > 0 ? `${remainingSessions} left` : '0 left'}
                                    </span>
                                  </div>

                                  {/* Progress Bar */}
                                  <div className="mb-1.5">
                                    <div className="flex justify-between text-[10px] mb-0.5">
                                      <span className="text-gray-600">Progress</span>
                                      <span className="font-medium text-gray-900">
                                        {treatment.totalUsedSessions || 0}/{treatment.maxSessions || 0}
                                      </span>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${isFullyUsed
                                          ? 'bg-green-500'
                                          : remainingSessions > 0
                                            ? 'bg-amber-500'
                                            : 'bg-gray-400'
                                          }`}
                                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Usage Details */}
                                  {treatment.usageDetails && treatment.usageDetails.length > 0 && (
                                    <div className="mt-1.5 pt-1.5 border-t border-gray-200/60">
                                      <p className="text-[9px] font-medium text-gray-600 mb-1">Session History:</p>
                                      <div className="space-y-0.5">
                                        {treatment.usageDetails.map((detail, dIndex) => (
                                          <div
                                            key={dIndex}
                                            className="flex items-center justify-between text-[10px] bg-white/60 rounded px-1.5 py-0.5"
                                          >
                                            <div className="flex items-center gap-0.5">
                                              <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                                              <span className="text-gray-700">
                                                {detail.sessions} session{detail.sessions !== 1 ? 's' : ''}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-500">
                                              <span>Inv: {detail.invoiceNumber}</span>
                                              <span>{new Date(detail.date).toLocaleDateString()}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 text-center py-2.5">No treatment usage recorded</p>
                        )}
                      </div>

                      {/* Billing History */}
                      {pkg.billingHistory && pkg.billingHistory.length > 0 && (
                        <div className="border-t border-gray-100 p-3 bg-gray-50/50">
                          <h5 className="text-xs font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
                            <ClipboardList className="w-3.5 h-3.5 text-cyan-500" />
                            Billing Records
                          </h5>
                          <div className="overflow-x-auto">
                            <table className="w-full text-[10px]">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-1.5 px-1.5 font-medium text-gray-600">Invoice</th>
                                  <th className="text-left py-1.5 px-1.5 font-medium text-gray-600">Date</th>
                                  <th className="text-center py-1.5 px-1.5 font-medium text-gray-600">Sess</th>
                                  <th className="text-right py-1.5 px-1.5 font-medium text-gray-600">Amount</th>
                                  <th className="text-right py-1.5 px-1.5 font-medium text-gray-600">Paid</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(pkg.billingHistory || [])
                                  .filter((b) => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance")
                                  .map((billing, bIndex) => (
                                  <tr key={bIndex} className="border-b border-gray-100 last:border-0 hover:bg-white/50">
                                    <td className="py-1.5 px-1.5 font-medium text-gray-900">{billing.invoiceNumber}</td>
                                    <td className="py-1.5 px-1.5 text-gray-600">{new Date(billing.date).toLocaleDateString()}</td>
                                    <td className="py-1.5 px-1.5 text-center">
                                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-700 font-medium text-[9px]">
                                        {billing.sessions || 0}
                                      </span>
                                    </td>
                                    <td className="py-1.5 px-1.5 text-right font-medium text-gray-900">د.إ{billing.amount?.toLocaleString() || 0}</td>
                                    <td className="py-1.5 px-1.5 text-right text-green-600 font-medium">د.إ{billing.paid?.toLocaleString() || 0}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-3 py-2.5">
          <button
            onClick={onClose}
            className="w-full px-3 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-lg font-bold transition-all duration-200 shadow-md transform hover:scale-[1.02] text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const PatientDetailsModal = ({ isOpen, onClose, patient, memberships = [], packages = [], onViewPackageUsage, transferNameMap = {}, membershipUsageMap = {} }) => {
  const [balance, setBalance] = useState({
    pendingBalance: 0,
    advanceBalance: 0,
    pastAdvanceBalance: 0,
    pastAdvance50PercentBalance: 0,
    pastAdvance54PercentBalance: 0,
    pastAdvance159FlatBalance: 0,
  });
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showAddAdvancePaymentModal, setShowAddAdvancePaymentModal] = useState(false);
  const [showAddPastAdvancePayment50PercentModal, setShowAddPastAdvancePayment50PercentModal] = useState(false);
  const [showAddPastAdvancePayment54PercentModal, setShowAddPastAdvancePayment54PercentModal] = useState(false);
  const [showAddPastAdvancePayment159FlatModal, setShowAddPastAdvancePayment159FlatModal] = useState(false);

  const formatAEDLocal = (v) => {
    if (typeof v !== "number" || Number.isNaN(v) || v === null) return "—";
    try { return `د.إ${v.toLocaleString()}`; } catch { return `د.إ${v}`; }
  };

  const fetchPatientBalance = async (patientId) => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      const res = await axios.get(`/api/clinic/patient-balance/${patientId}`, { headers });
      const data = res?.data?.balances || {};
      return {
        pendingBalance: Number(data.pendingBalance || 0),
        advanceBalance: Number(data.advanceBalance || 0),
        pastAdvanceBalance: Number(data.pastAdvanceBalance || 0),
      };
    } catch {
      return { pendingBalance: 0, advanceBalance: 0, pastAdvanceBalance: 0 };
    }
  };

  useEffect(() => {
    let cancelled = false;
    const headers = getAuthHeaders();
    if (!isOpen || !patient?._id || !headers) return;
    setBalanceLoading(true);
    (async () => {
      try {
        const res = await axios.get(`/api/clinic/patient-balance/${patient._id}`, { headers });
        const data = res?.data?.balances || {};
        if (!cancelled) {
          setBalance({
            pendingBalance: Number(data.pendingBalance || 0),
            advanceBalance: Number(data.advanceBalance || 0),
            pastAdvanceBalance: Number(data.pastAdvanceBalance || 0),
            pastAdvance50PercentBalance: Number(data.pastAdvance50PercentBalance || 0),
            pastAdvance54PercentBalance: Number(data.pastAdvance54PercentBalance || 0),
            pastAdvance159FlatBalance: Number(data.pastAdvance159FlatBalance || 0),
          });
        }
      } catch {
        if (!cancelled) {
          setBalance({ pendingBalance: 0, advanceBalance: 0, pastAdvanceBalance: 0, pastAdvance50PercentBalance: 0, pastAdvance54PercentBalance: 0, pastAdvance159FlatBalance: 0 });
        }
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, patient]);

  if (!isOpen || !patient) return null;
  const membershipName = (() => {
    if (!patient.membershipId) return null;
    const m = memberships.find((x) => x._id === patient.membershipId);
    return m?.name || null;
  })();
  const packageName = (() => {
    if (!patient.packageId) return null;
    const p = packages.find((x) => x._id === patient.packageId);
    return p?.name || null;
  })();
  const isExpired = (() => {
    if (patient.membership !== 'Yes') return false;
    if (!patient.membershipEndDate) return false;
    try {
      const end = new Date(patient.membershipEndDate);
      const now = new Date();
      return end < now;
    } catch {
      return false;
    }
  })();
  const isPriority = (() => {
    const hasPriorityPlan =
      (patient.membership === 'Yes' && memberships.find(m => String(m._id) === String(patient.membershipId))?.benefits?.priorityBooking) ||
      (Array.isArray(patient.memberships) && patient.memberships.length > 0 && patient.memberships.some(m => {
        const membership = memberships.find(mem => String(mem._id) === String(m.membershipId));
        return membership?.benefits?.priorityBooking;
      }));
    const revoked = !!patient.transferredOutMembershipPriority;
    return hasPriorityPlan && !isExpired && !revoked;
  })();
  const monthsToExpire = (() => {
    if (patient.membership !== 'Yes' || !patient.membershipEndDate) return null;
    try {
      const end = new Date(patient.membershipEndDate);
      const now = new Date();
      let months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
      if (end.getDate() < now.getDate()) months -= 1;
      return months;
    } catch {
      return null;
    }
  })();
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] md:max-w-6xl my-4 md:my-8 animate-scaleIn max-h-[95vh] sm:max-h-[92vh] md:max-h-[90vh] overflow-hidden flex flex-col">
          <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-600 px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 z-10 rounded-t-xl text-white">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center font-bold">
                <span className="text-sm">
                  {(patient?.firstName?.[0] || '').toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold truncate">Patient Profile</h3>
                <p className="text-[11px] text-white/80 truncate">{patient ? `${patient.firstName} ${patient.lastName}` : ''}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {isPriority && (
                <span className="inline-flex px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold shadow-sm">
                  Priority
                </span>
              )}
              {isExpired && (
                <span className="inline-flex px-2 py-0.5 rounded-full bg-red-500/30 text-white text-[11px] font-semibold shadow-sm">
                  Expired
                </span>
              )}
              {patient?.emrNumber && (
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold">
                  EMR: {patient.emrNumber}
                </span>
              )}
              {patient?.invoiceNumber && (
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold">
                  Inv: {patient.invoiceNumber}
                </span>
              )}
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors flex-shrink-0"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-3 flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
            {/* Personal & Contact Info Card */}
            <div className="bg-gradient-to-br from-white to-teal-50 rounded-xl border border-gray-200 p-4 shadow-md">
              <div className="flex items-center gap-1.5 mb-2.5">
                <User className="w-4 h-4 text-teal-600" />
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Patient Info</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="flex flex-col"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">Full Name</span> <span className="font-medium text-gray-900 text-sm">{patient.firstName} {patient.lastName}</span></div>
                <div className="flex flex-col"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">Gender</span> <span className="font-medium text-gray-900 text-sm">{patient.gender || '-'}</span></div>
                <div className="flex flex-col"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">Email</span> <span className="font-medium text-blue-600 text-sm">{patient.email}</span></div>
                <div className="flex flex-col"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">Mobile</span> <span className="font-medium text-gray-900 text-sm">{patient.mobileNumber}</span></div>
                <div className="flex flex-col"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">Patient Type</span> <span className="font-medium text-gray-900 text-sm">{patient.patientType}</span></div>
                <div className="flex flex-col"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">Referred By</span> <span className="font-medium text-gray-900 text-sm">{patient.referredBy || 'N/A'}</span></div>
                {patient.doctor && <div className="flex flex-col md:col-span-2"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">Doctor</span> <span className="font-medium text-gray-900 text-sm">{patient.doctor}</span></div>}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-700 text-[11px] font-semibold">
                  <DollarSign className="w-3 h-3" />
                  {balanceLoading && balance.pendingBalance === null ? "Pending: ..." : `Pending: ${formatAEDLocal(balance.pendingBalance)}`}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                  <DollarSign className="w-3 h-3" />
                  {balanceLoading && balance.advanceBalance === null ? "Advance: ..." : `Advance: ${formatAEDLocal(balance.advanceBalance)}`}
                </span>
                {/* <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                  <DollarSign className="w-3 h-3" />
                  {balanceLoading && balance.pastAdvanceBalance === null ? "Past Advance: ..." : `Past Advance: ${formatAEDLocal(balance.pastAdvanceBalance)}`}
                </span> */}
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-700 text-[11px] font-semibold">
                  <DollarSign className="w-3 h-3" />
                  {balanceLoading && balance.pastAdvance50PercentBalance === null ? "Past Advance 50%: ..." : `Past Advance 50%: ${formatAEDLocal(balance.pastAdvance50PercentBalance)}`}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 text-[11px] font-semibold">
                  <DollarSign className="w-3 h-3" />
                  {balanceLoading && balance.pastAdvance54PercentBalance === null ? "Past Advance 54%: ..." : `Past Advance 54%: ${formatAEDLocal(balance.pastAdvance54PercentBalance)}`}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-100 text-purple-700 text-[11px] font-semibold">
                  <DollarSign className="w-3 h-3" />
                  {balanceLoading && balance.pastAdvance159FlatBalance === null ? "Past Advance 159 Flat: ..." : `Past Advance 159 Flat: ${formatAEDLocal(balance.pastAdvance159FlatBalance)}`}
                </span>

                <button
                  onClick={() => setShowAddAdvancePaymentModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-green-700 hover:shadow-lg active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Advance Balance</span>
                </button>
                <button
                  onClick={() => setShowAddPastAdvancePayment50PercentModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-amber-700 hover:shadow-lg active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add 50% Past Advance Balance</span>
                </button>
                <button
                  onClick={() => setShowAddPastAdvancePayment54PercentModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add 54% Past Advance Balance</span>
                </button>
                <button
                  onClick={() => setShowAddPastAdvancePayment159FlatModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-purple-700 hover:shadow-lg active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add 159 Flat Past Advance Balance</span>
                </button>
              </div>
            </div>

            {/* Invoice & Insurance Info Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-white to-cyan-50 rounded-xl border border-gray-200 p-4 shadow-md">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <FileText className="w-4 h-4 text-cyan-600" />
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Invoice</h4>
                </div>
                <div className="space-y-2.5">
                  <div className="flex flex-col"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">Invoice Number</span> <span className="font-medium text-gray-900 text-sm">{patient.invoiceNumber}</span></div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">Issued By</span> <span className="font-medium text-gray-900 text-sm">{patient.invoicedBy}</span></div>
                    <div className="flex flex-col"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">Issue Date</span> <span className="font-medium text-gray-900 text-sm">{patient.invoicedDate ? new Date(patient.invoicedDate).toLocaleDateString() : '-'}</span></div>
                  </div>
                  <div className="flex flex-col"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">EMR Number</span> <span className="font-medium text-gray-900 text-sm">{patient.emrNumber || 'N/A'}</span></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-purple-50 rounded-lg border border-gray-200 p-3 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Info className="w-4 h-4 text-purple-600" />
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Insurance</h4>
                </div>
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">Insurance Status</span> <span className={`font-medium text-sm ${patient.insurance === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>{patient.insurance || 'No'}</span></div>
                    {patient.insurance === 'Yes' && (
                      <div className="flex flex-col"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">Insurance Type</span> <span className="font-medium text-gray-900 text-sm">{patient.insuranceType || '-'}</span></div>
                    )}
                  </div>
                  {patient.insurance === 'Yes' && patient.insuranceType === 'Advance' && (
                    <div className="space-y-2 pt-2 border-t border-gray-200 mt-2">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">Advance</span> <span className="font-medium text-gray-900 text-sm">د.إ{patient.advanceGivenAmount?.toLocaleString() || 0}</span></div>
                        <div className="flex flex-col"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">Co-Pay %</span> <span className="font-medium text-gray-900 text-sm">{patient.coPayPercent || 0}%</span></div>
                      </div>
                      <div className="flex flex-col"><span className="text-[11px] font-semibold text-gray-600 mb-0.5">Due</span> <span className="font-medium text-gray-900 text-sm">د.إ{patient.needToPay?.toLocaleString() || 0}</span></div>
                    </div>
                  )}
                  {patient.insurance === 'Yes' && patient.advanceClaimStatus && (
                    <div className="flex flex-col pt-2 border-t border-gray-200 mt-2">
                      <span className="text-[11px] font-semibold text-gray-600 mb-0.5">Claim Status</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${patient.advanceClaimStatus === 'Released' ? 'bg-green-100 text-green-800' : patient.advanceClaimStatus === 'Approved by doctor' ? 'bg-blue-100 text-blue-800' : patient.advanceClaimStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {patient.advanceClaimStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Membership & Package Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {/* Membership Card */}
              <div className="bg-gradient-to-br from-white to-green-50 rounded-lg border border-gray-200 p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Membership</h4>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-700 w-20">Status:</span>
                  <span className={`font-bold text-sm ${patient.membership === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>
                    {patient.membership || 'No'}</span>
                </div>
                {(() => {
                  const existing = Array.isArray(patient.memberships) ? patient.memberships : [];
                  const transferredIns = (patient.membershipTransfers || [])
                    .filter(t => t.type === 'in')
                    .map(t => ({ membershipId: t.membershipId, startDate: t.startDate, endDate: t.endDate, _fromTransfer: true }));
                  const displayMemberships = [...existing];
                  transferredIns.forEach(t => {
                    const dup = displayMemberships.some(m =>
                      String(m.membershipId) === String(t.membershipId) &&
                      (!!m.startDate ? String(m.startDate) === String(t.startDate) : true) &&
                      (!!m.endDate ? String(m.endDate) === String(t.endDate) : true)
                    );
                    if (!dup) displayMemberships.push(t);
                  });
                  return displayMemberships.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="text-xs font-semibold text-gray-800 mb-2">Active Plans</div>
                      <div className="space-y-2.5">
                        {displayMemberships.map((m, idx) => {
                          const plan = memberships.find((x) => x._id === m.membershipId);
                          const end = m.endDate ? new Date(m.endDate) : null;
                          const start = m.startDate ? new Date(m.startDate) : null;
                          const expired = end ? end < new Date() : false;
                          const isActive = !expired && start && start <= new Date();

                          return (
                            <div key={`${m.membershipId}-${idx}`} className={`rounded-lg border overflow-hidden ${expired ? 'border-red-200 bg-gradient-to-r from-red-50 to-pink-50' : isActive ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50'}`}>
                              {/* Membership Header */}
                              <div className="px-2.5 py-2 bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-gray-900">{plan?.name || m.membershipId}</h4>
                                  <div className="flex items-center gap-1.5">
                                    {isActive && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-sm">
                                        Active
                                      </span>
                                    )}
                                    {expired && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-red-100 to-pink-100 text-red-800 shadow-sm">
                                        Expired
                                      </span>
                                    )}
                                    {!isActive && !expired && start && start > new Date() && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 shadow-sm">
                                        Upcoming
                                      </span>
                                    )}
                                    {(patient.membershipTransfers || []).filter(t => String(t.membershipId) === String(m.membershipId)).map((t, ti) => (
                                      <span key={ti} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${t.type === 'out' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} shadow-sm`}>
                                        {t.type === 'out' ? 'Transferred to' : 'Transferred from'} {transferNameMap[String(t.toPatientId)] || transferNameMap[String(t.fromPatientId)] || ''}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Membership Details */}
                              <div className="p-2.5">
                                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                                  <div>
                                    <span className="text-[10px] text-gray-600 block mb-0.5">Start Date</span>
                                    <span className="font-medium text-gray-900 text-sm">{m.startDate ? new Date(m.startDate).toLocaleDateString() : '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-600 block mb-0.5">End Date</span>
                                    <span className={`font-medium text-sm ${expired ? 'text-red-700 font-bold' : 'text-gray-900'}`}>
                                      {m.endDate ? new Date(m.endDate).toLocaleDateString() : '-'}
                                    </span>
                                  </div>
                                  {plan?.price !== undefined && (
                                    <div>
                                      <span className="text-[10px] text-gray-600 block mb-0.5">Price</span>
                                      <span className="font-bold text-gray-900 text-sm">د.إ{plan.price?.toLocaleString()}</span>
                                    </div>
                                  )}
                                  {plan?.durationMonths && (
                                    <div>
                                      <span className="text-[10px] text-gray-600 block mb-0.5">Duration</span>
                                      <span className="font-medium text-gray-900 text-sm">{plan.durationMonths} months</span>
                                    </div>
                                  )}
                                </div>

                                {(() => {
                                  const key = `${m.membershipId}|${m.startDate}|${m.endDate}`;
                                  const usage = membershipUsageMap[key];
                                  
                                  return (
                                    <div className="space-y-3">
                                      {/* Membership Benefits Section */}
                                      {plan?.benefits && (
                                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                                          <h5 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                            Membership Benefits
                                          </h5>
                                          <div className="space-y-2">
                                            {/* Free Consultations with Usage */}
                                            {plan.benefits.freeConsultations > 0 && (
                                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                                                <div className="flex items-center justify-between mb-1.5">
                                                  <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-blue-600" />
                                                    <span className="text-xs font-semibold text-blue-900">Free Consultations</span>
                                                  </div>
                                                  <div className="text-right">
                                                    {usage && !usage.isExpired ? (
                                                      <span className="text-xs font-bold text-blue-700">
                                                        {usage.usedFreeConsultations || 0}/{usage.totalFreeConsultations || plan.benefits.freeConsultations} used
                                                      </span>
                                                    ) : (
                                                      <span className="text-xs font-medium text-gray-600">
                                                        {plan.benefits.freeConsultations} total
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                                {usage && !usage.isExpired && usage.totalFreeConsultations > 0 && (
                                                  <>
                                                    <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden mb-1">
                                                      <div 
                                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.min(100, ((usage.usedFreeConsultations || 0) / usage.totalFreeConsultations) * 100)}%` }}
                                                      />
                                                    </div>
                                                    <div className="flex items-center justify-between text-[9px] text-blue-700">
                                                      <span>Remaining: {usage.remainingFreeConsultations || 0}</span>
                                                      {usage.isTransferred && (
                                                        <span className="text-[9px] text-blue-600">
                                                          Transferred: {usage.transferredFreeConsultations || 0}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </>
                                                )}
                                              </div>
                                            )}
                                            
                                            {/* Discount Percentage */}
                                            {plan.benefits.discountPercentage > 0 && (
                                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5">
                                                <div className="flex items-center gap-1.5">
                                                  <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                                                  <span className="text-xs font-semibold text-purple-900">
                                                    {plan.benefits.discountPercentage * 100}% Discount on Treatments
                                                  </span>
                                                </div>
                                              </div>
                                            )}
                                            
                                            {/* Priority Booking */}
                                            {plan.benefits.priorityBooking && (
                                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                                                <div className="flex items-center gap-1.5">
                                                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                                                  <span className="text-xs font-semibold text-amber-900">Priority Booking Access</span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Transfer Information */}
                                      {usage?.isTransferred && (
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                                          <div className="flex items-center gap-1.5 mb-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                            <h5 className="text-xs font-bold text-green-800">Transferred Benefits</h5>
                                          </div>
                                          <div className="space-y-1.5 text-[10px]">
                                            <div className="flex justify-between">
                                              <span className="text-gray-700">Transferred From:</span>
                                              <span className="font-medium text-green-900">{transferNameMap[String(usage.transferredFrom)] || 'Unknown'}</span>
                                            </div>
                                            {typeof usage.transferredFreeConsultations === 'number' && (
                                              <div className="flex justify-between">
                                                <span className="text-gray-700">Transferred Consultations:</span>
                                                <span className="font-semibold text-green-900">{usage.transferredFreeConsultations}</span>
                                              </div>
                                            )}
                                            <div className="pt-1.5 border-t border-green-200">
                                              <div className="flex justify-between">
                                                <span className="text-gray-700">Total Available:</span>
                                                <span className="font-bold text-green-900">{usage.totalFreeConsultations || 0}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Usage History Details */}
                                      {usage?.freeConsultationDetails && usage.freeConsultationDetails.length > 0 && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                          <h5 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                                            <ClipboardList className="w-3.5 h-3.5 text-gray-600" />
                                            Usage History ({usage.freeConsultationDetails.length})
                                          </h5>
                                          <div className="max-h-32 overflow-y-auto space-y-1.5">
                                            {usage.freeConsultationDetails.map((detail, idx) => (
                                              <div key={idx} className="text-[9px] bg-white rounded border border-gray-200 p-1.5">
                                                <div className="flex justify-between items-center">
                                                  <span className="font-medium text-gray-800">{detail.service}: {detail.treatment}</span>
                                                  <span className="text-gray-600">{new Date(detail.date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                  <span className="text-gray-600">Invoice: {detail.invoiceNumber}</span>
                                                  <span className="font-semibold text-blue-700">{detail.sessions} session(s)</span>
                                                </div>
                                                {detail.isFromSourcePatient && (
                                                  <div className="mt-1 text-[8px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                                    From transfer: {transferNameMap[String(detail.sourcePatientId)] || 'Unknown'}
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                                {plan?.benefits && (
                                  <div className="pt-2 border-t border-gray-200">
                                    <h5 className="text-[10px] font-bold text-gray-800 mb-1.5">Benefits:</h5>
                                    <div className="flex flex-wrap gap-1.5">
                                      {plan.benefits.freeConsultations > 0 && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 shadow-sm">
                                          {plan.benefits.freeConsultations} Free Consultations
                                        </span>
                                      )}
                                      {plan.benefits.discountPercentage > 0 && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 shadow-sm">
                                          {plan.benefits.discountPercentage * 100}% Discount
                                        </span>
                                      )}
                                      {plan.benefits.priorityBooking && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 shadow-sm">
                                          Priority Booking
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {(patient.membershipTransfers || []).length > 0 && (
                        <div className="mt-2.5 border-t border-gray-200 pt-2">
                          <div className="text-xs font-semibold text-gray-800 mb-1.5">Transfer History</div>
                          <div className="space-y-1.5">
                            {patient.membershipTransfers.map((t, i) => {
                              const mname = t.membershipName || (memberships.find(x => String(x._id) === String(t.membershipId))?.name) || t.membershipId;
                              return (
                                <div key={i} className="flex items-center justify-between text-[10px]">
                                  <div className={`${t.type === 'out' ? 'text-red-700' : 'text-green-700'} font-medium`}>
                                    {mname} • {t.type === 'out' ? 'Transferred to' : 'Transferred from'} {transferNameMap[String(t.toPatientId)] || transferNameMap[String(t.fromPatientId)] || ''}
                                  </div>
                                  <div className="text-gray-600">
                                    {t.transferredFreeConsultations || 0} consultations • {new Date(t.transferDate).toLocaleDateString()}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Package Card */}
              <div className="bg-gradient-to-br from-white to-teal-50 rounded-lg border border-gray-200 p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-teal-600" />
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Package</h4>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-700 w-20">Status:</span>
                  <span className={`font-bold text-sm ${patient.package === 'Yes' ? 'text-teal-600' : 'text-red-600'}`}>
                    {patient.package || 'No'}</span>
                </div>
                {(Array.isArray(patient.packages) ? patient.packages : []).length > 0 && (
                  <div className="space-y-2.5">
                    <div className="text-xs font-semibold text-gray-800 mb-2">Active Packages</div>
                    <div className="space-y-2.5">
                      {patient.packages.map((p, idx) => {
                        const pkg = packages.find((x) => x._id === p.packageId);
                        const assignedDate = p.assignedDate ? new Date(p.assignedDate) : null;
                        return (
                          <div key={`${p.packageId}-${idx}`} className="rounded-lg border border-gray-200 bg-gradient-to-r from-white to-gray-50 overflow-hidden shadow-sm">
                            {/* Package Header */}
                            <div className="px-2.5 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-gray-900">{pkg?.name || p.packageId}</h4>
                                <div className="flex items-center gap-1.5">
                                  {assignedDate && (
                                    <div className="text-[9px] font-medium text-gray-600 bg-white px-1.5 py-0.5 rounded-full shadow-sm">
                                      {assignedDate.toLocaleDateString()}
                                    </div>
                                  )}
                                  {(patient.packageTransfers || []).filter(t => String(t.packageId) === String(p.packageId)).map((t, ti) => (
                                    <span key={ti} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${t.type === 'out' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} shadow-sm`}>
                                      {t.type === 'out' ? 'Transferred to' : 'Transferred from'} {transferNameMap[String(t.toPatientId)] || transferNameMap[String(t.fromPatientId)] || ''}
                                    </span>
                                  ))}
                                  <button
                                    onClick={() => onViewPackageUsage && onViewPackageUsage(patient, pkg)}
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 text-teal-700 text-[10px] font-semibold rounded-full transition-all duration-200 shadow-sm"
                                    title="View package session usage"
                                  >
                                    <Activity className="w-2.5 h-2.5" />
                                    Usage
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Package Details */}
                            {pkg && (
                              <div className="p-2.5 space-y-2.5">
                                <div className="grid grid-cols-2 gap-2.5">
                                  <div>
                                    <span className="text-[10px] text-gray-600 block mb-0.5">Package Price</span>
                                    <span className="font-bold text-gray-900 text-sm">د.إ{pkg.price?.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-600 block mb-0.5">Total Price</span>
                                    <span className="font-bold text-gray-900 text-sm">د.إ{(pkg.totalPrice || pkg.price)?.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-600 block mb-0.5">Total Sessions</span>
                                    <span className="font-bold text-gray-900 text-sm">{pkg.totalSessions || 0}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-600 block mb-0.5">Per Session</span>
                                    <span className="font-bold text-gray-900 text-sm">د.إ{pkg.sessionPrice?.toLocaleString()}</span>
                                  </div>
                                </div>
                                
                                {/* Treatment Breakdown */}
                                {pkg.treatments && pkg.treatments.length > 0 && (
                                  <div className="bg-white rounded-lg border border-gray-200 p-2.5">
                                    <h5 className="text-[10px] font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                                      <Activity className="w-3.5 h-3.5 text-teal-600" />
                                      Treatment Sessions
                                    </h5>
                                    <div className="space-y-1.5">
                                      {pkg.treatments.map((treatment, tIdx) => {
                                        const totalSessions = treatment.sessions || 0;
                                        return (
                                          <div key={tIdx} className="flex items-center justify-between text-[9px] bg-gray-50 rounded px-1.5 py-1">
                                            <span className="text-gray-700 truncate max-w-[150px]">{treatment.treatmentName || treatment.name}</span>
                                            <span className="font-semibold text-teal-700 whitespace-nowrap ml-2">{totalSessions} sessions</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Transfer Information for Package */}
                                {(patient.packageTransfers || []).filter(t => String(t.packageId) === String(p.packageId)).length > 0 && (
                                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2.5">
                                    <h5 className="text-[10px] font-bold text-green-800 mb-2 flex items-center gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                      Transfer History
                                    </h5>
                                    <div className="space-y-1.5">
                                      {(patient.packageTransfers || []).filter(t => String(t.packageId) === String(p.packageId)).map((t, ti) => (
                                        <div key={ti} className="text-[9px]">
                                          <div className={`font-semibold ${t.type === 'out' ? 'text-red-700' : 'text-green-700'}`}>
                                            {t.type === 'out' ? '↗ Transferred to' : '↙ Transferred from'} {transferNameMap[String(t.toPatientId)] || transferNameMap[String(t.fromPatientId)] || 'Unknown'}
                                          </div>
                                          <div className="flex items-center gap-2 mt-1 text-gray-600">
                                            <span>{t.transferredSessions || 0} sessions</span>
                                            <span>•</span>
                                            <span>{new Date(t.transferDate).toLocaleDateString()}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History Section */}
            {patient.paymentHistory?.length > 0 && (
              <div className="bg-gradient-to-br from-white to-amber-50 rounded-lg border border-gray-200 p-3 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Payments</h4>
                </div>
                <div className="space-y-2.5">
                  {patient.paymentHistory.map((p, i) => (
                    <div key={p._id} className="bg-gradient-to-r from-gray-50 to-amber-50 rounded-lg p-2.5 border border-gray-200">
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                        <span className="font-bold text-gray-900 text-sm">#{i + 1}</span>
                        <span className="text-xs text-gray-700">{new Date(p.updatedAt).toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div className="flex flex-col"><span className="text-[10px] text-gray-600">Amount</span> <span className="font-bold text-gray-900 text-sm">د.إ{p.amount?.toLocaleString()}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-gray-600">Paid</span> <span className="font-bold text-gray-900 text-sm">د.إ{p.paid?.toLocaleString()}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-gray-600">Advance</span> <span className="font-bold text-gray-900 text-sm">د.إ{p.advance?.toLocaleString()}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-gray-600">Pending</span> <span className="font-bold text-gray-900 text-sm">د.إ{p.pending?.toLocaleString()}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-gray-600">Paying</span> <span className="font-bold text-gray-900 text-sm">د.إ{p.paying?.toLocaleString()}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-gray-600">Method</span> <span className="font-medium text-gray-900 text-sm">{p.paymentMethod}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 border-t px-4 py-2.5 rounded-b-xl">
            <button onClick={onClose} className="w-full px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-lg font-bold transition-all duration-200 shadow-md transform hover:scale-[1.02] text-sm">Close</button>
          </div>
        </div>
      </div>

      {/* Add Advance Payment Modal */}
      <AddPatientAdvancePaymentModal
        isOpen={showAddAdvancePaymentModal}
        onClose={() => setShowAddAdvancePaymentModal(false)}
        patientId={patient._id}
        patientName={patient.name}
        onSuccess={async (newBillingRecord) => {
          // Refresh your balance data here
          console.log("Advance payment recorded:", newBillingRecord);
          const balances = await fetchPatientBalance(patient._id);
          setBalance(balances);
        }}

      />

      <AddPatientPastAdvancePaymentModal
        isOpen={showAddPastAdvancePayment50PercentModal}
        onClose={() => setShowAddPastAdvancePayment50PercentModal(false)}
        patientId={patient._id}
        patientName={patient.name}
        onSuccess={async (data) => {
          console.log("Historical balance recorded:", data);
          // Refresh patient balances
          const balances = await fetchPatientBalance(patient._id);
          setBalance(balances);
        }}
        pastAdvanceType="50% Offer"
        primaryColor="amber"
      />
      <AddPatientPastAdvancePaymentModal
        isOpen={showAddPastAdvancePayment54PercentModal}
        onClose={() => setShowAddPastAdvancePayment54PercentModal(false)}
        patientId={patient._id}
        patientName={patient.name}
        onSuccess={async (data) => {
          console.log("Historical balance recorded:", data);
          // Refresh patient balances
          const balances = await fetchPatientBalance(patient._id);
          setBalance(balances);
        }}
        pastAdvanceType="54% Offer"
        primaryColor="blue"
      />
      <AddPatientPastAdvancePaymentModal
        isOpen={showAddPastAdvancePayment159FlatModal}
        onClose={() => setShowAddPastAdvancePayment159FlatModal(false)}
        patientId={patient._id}
        patientName={patient.name}
        onSuccess={async (data) => {
          console.log("Historical balance recorded:", data);
          // Refresh patient balances
          const balances = await fetchPatientBalance(patient._id);
          setBalance(balances);
        }}
        pastAdvanceType="159 Flat"
        primaryColor="purple"
      />
    </>
  );
};

const PatientCard = ({ patient, onUpdate, onViewDetails, canUpdate = true }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 truncate">{patient.firstName} {patient.lastName}</h3>
        <p className="text-sm text-gray-700">{patient.mobileNumber}</p>
        <p className="text-xs text-gray-700">{patient.email}</p>
      </div>
      <div className="flex flex-col gap-1 ml-2">
        {patient.advanceClaimStatus && (
          <span className={`px-2 py-1 text-xs font-medium rounded text-center whitespace-nowrap ${patient.advanceClaimStatus === 'Released' ? 'bg-emerald-100 text-emerald-700' : patient.advanceClaimStatus === 'Approved by doctor' ? 'bg-blue-100 text-blue-700' : patient.advanceClaimStatus === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{patient.advanceClaimStatus}</span>
        )}
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
      <div><p className="text-gray-700">EMR Number</p><p className="font-medium text-gray-900">{patient.emrNumber}</p></div>
      <div><p className="text-gray-700">Invoice No</p><p className="font-medium text-gray-900">{patient.invoiceNumber}</p></div>
      <div><p className="text-gray-700">Insurance</p><p className="font-medium text-gray-900">{patient.insurance || 'No'}</p></div>
      <div><p className="text-gray-700">Patient Type</p><p className="font-medium text-gray-900">{patient.patientType || 'N/A'}</p></div>
    </div>
    {patient.notes && (
      <div className="mb-3 text-xs">
        <p className="text-gray-700">Notes</p>
        <p className="font-medium text-gray-900 break-words">{patient.notes}</p>
      </div>
    )}
    <div className="mb-3 flex gap-2 flex-wrap">
      {patient.patientType && <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">{patient.patientType}</span>}
    </div>
    <div className="flex gap-2">
      {canUpdate && (
        <button onClick={() => onUpdate(patient._id)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors"><Edit3 className="w-4 h-4" /> Update</button>
      )}
      <button onClick={() => onViewDetails(patient)} className={`${canUpdate ? 'flex-1' : 'w-full'} inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors`}><Eye className="w-4 h-4" /> View More</button>
    </div>
  </div>
);

function PatientFilterUI({ hideHeader = false, onEditPatient, permissions = { canRead: true, canUpdate: true, canDelete: true, canCreate: true }, routeContext = "clinic" }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPreviousMemberships, setFilterPreviousMemberships] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [patients, setPatients] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState([]);
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, patient: null });
  const [transferNameMap, setTransferNameMap] = useState({});
  const [deleteSuccessModal, setDeleteSuccessModal] = useState({ isOpen: false, patientName: "" });
  const [packageUsageModal, setPackageUsageModal] = useState({ isOpen: false, patient: null, data: null, loading: false });
  const [membershipUsageMap, setMembershipUsageMap] = useState({});
  const pageSize = 12;

  const addToast = (message, type = "info") => setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Filter patients by search query and additional filters
  const filteredPatients = useMemo(() => {
    let result = patients;

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(patient =>
        (patient.firstName && patient.firstName.toLowerCase().includes(query)) ||
        (patient.lastName && patient.lastName.toLowerCase().includes(query)) ||
        (patient.mobileNumber && patient.mobileNumber.includes(query)) ||
        (patient.emrNumber && patient.emrNumber.toLowerCase().includes(query)) ||
        (patient.invoiceNumber && patient.invoiceNumber.toLowerCase().includes(query)) ||
        (patient.email && patient.email.toLowerCase().includes(query))
      );
    }

    // Apply previous memberships filter
    if (filterPreviousMemberships !== "all") {
      result = result.filter(patient => {
        const hasActiveMembership = patient.membership === 'Yes' && !(() => {
          if (patient.membership !== 'Yes' || !patient.membershipEndDate) return false;
          try { return new Date(patient.membershipEndDate) < new Date(); } catch { return false; }
        })();

        const hasPreviousMembership = patient.membership === 'Yes' && (() => {
          if (patient.membership !== 'Yes' || !patient.membershipEndDate) return false;
          try { return new Date(patient.membershipEndDate) < new Date(); } catch { return false; }
        })();

        const hasNoMembership = patient.membership !== 'Yes';

        switch (filterPreviousMemberships) {
          case "active":
            return hasActiveMembership;
          case "previous":
            return hasPreviousMembership;
          case "none":
            return hasNoMembership;
          default:
            return true;
        }
      });
    }

    // Apply priority filter
    if (filterPriority !== "all") {
      result = result.filter(patient => {
        const hasPriorityPlan = (patient.membership === 'Yes' && memberships.find(m => m._id === patient.membershipId)?.benefits?.priorityBooking) ||
          (Array.isArray(patient.memberships) && patient.memberships.length > 0 && patient.memberships.some(m => {
            const membership = memberships.find(mem => mem._id === m.membershipId);
            return membership?.benefits?.priorityBooking;
          }));
        const isExpired = (() => {
          if (patient.membership !== 'Yes' || !patient.membershipEndDate) return false;
          try { return new Date(patient.membershipEndDate) < new Date(); } catch { return false; }
        })();

        const isPriority = hasPriorityPlan && !isExpired && !patient.transferredOutMembershipPriority;

        switch (filterPriority) {
          case "priority":
            return isPriority;
          case "non-priority":
            return !isPriority;
          default:
            return true;
        }
      });
    }

    return result;
  }, [patients, searchQuery, filterPreviousMemberships, filterPriority, memberships]);

  const totalPages = Math.ceil(filteredPatients.length / pageSize);
  const displayedPatients = filteredPatients.slice((page - 1) * pageSize, page * pageSize);

  // Calculate stats
  const totalPatients = patients.length;
  const activePatients = patients.filter(p => p.status === 'Active' || p.applicationStatus === 'Active').length;



  const fetchPatients = async (showSuccessToast = true) => {
    const headers = getAuthHeaders();
    if (!headers) {
      addToast("Authentication required. Please login again.", "error");
      return;
    }
    setLoading(true);
    try {
      // Always use clinic API endpoint for consistency - it supports clinic, agent, and doctorStaff roles
      const apiEndpoint = "/api/clinic/patient-information";
      const { data } = await axios.get(apiEndpoint, { headers });
      setPatients(data.success ? data.data : []);
      setPage(1);
      if (showSuccessToast) {
        addToast("Data loaded successfully", "success");
      }
    } catch (err) {
      console.error(err);
      setPatients([]);
      addToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Resolve names for transfer tags when viewing patient details
    if (!detailsModal.isOpen || !detailsModal.patient) return;
    const headers = getAuthHeaders();
    if (!headers) return;
    const ids = new Set();
    (detailsModal.patient.membershipTransfers || []).forEach(t => {
      if (t.toPatientId) ids.add(String(t.toPatientId));
      if (t.fromPatientId) ids.add(String(t.fromPatientId));
    });
    (detailsModal.patient.packageTransfers || []).forEach(t => {
      if (t.toPatientId) ids.add(String(t.toPatientId));
      if (t.fromPatientId) ids.add(String(t.fromPatientId));
    });
    const uniqueIds = Array.from(ids).filter(Boolean);
    if (uniqueIds.length === 0) return;
    let mounted = true;
    (async () => {
      const map = {};
      try {
        await Promise.all(
          uniqueIds.map(async (pid) => {
            try {
              const res = await axios.get(`/api/staff/get-patient-data/${pid}`, { headers });
              const data = res.data;
              if (data && data._id) {
                const name = `${(data.firstName || "").trim()} ${(data.lastName || "").trim()}`.trim() || data.emrNumber || pid;
                map[pid] = name;
              }
            } catch { }
          })
        );
      } finally {
        if (mounted) setTransferNameMap(map);
      }
    })();
    return () => { mounted = false; };
  }, [detailsModal.isOpen, detailsModal.patient]);

  useEffect(() => {
    if (!detailsModal.isOpen || !detailsModal.patient) return;
    const headers = getAuthHeaders();
    if (!headers) return;
    const p = detailsModal.patient;
    const entries = [];
    const existing = Array.isArray(p.memberships) ? p.memberships : [];
    const transferredIns = (p.membershipTransfers || [])
      .filter(t => t.type === 'in')
      .map(t => ({ membershipId: t.membershipId, startDate: t.startDate, endDate: t.endDate }));
    const displayMemberships = [...existing];
    transferredIns.forEach(t => {
      const dup = displayMemberships.some(m =>
        String(m.membershipId) === String(t.membershipId) &&
        (!!m.startDate ? String(m.startDate) === String(t.startDate) : true) &&
        (!!m.endDate ? String(m.endDate) === String(t.endDate) : true)
      );
      if (!dup) displayMemberships.push(t);
    });
    displayMemberships.forEach(m => {
      if (m.membershipId && m.startDate && m.endDate) {
        entries.push({ membershipId: m.membershipId, startDate: m.startDate, endDate: m.endDate });
      }
    });
    if (entries.length === 0) {
      setMembershipUsageMap({});
      return;
    }
    let cancelled = false;
    (async () => {
      const resMap = {};
      await Promise.all(entries.map(async (e) => {
        const qs = new URLSearchParams();
        qs.set("membershipId", e.membershipId);
        qs.set("startDate", e.startDate);
        qs.set("endDate", e.endDate);
        try {
          const res = await axios.get(`/api/clinic/membership-usage/${p._id}?${qs.toString()}`, { headers });
          const key = `${e.membershipId}|${e.startDate}|${e.endDate}`;
          resMap[key] = res.data && res.data.success ? res.data : null;
        } catch {
          const key = `${e.membershipId}|${e.startDate}|${e.endDate}`;
          resMap[key] = null;
        }
      }));
      if (!cancelled) setMembershipUsageMap(resMap);
    })();
    return () => { cancelled = true; };
  }, [detailsModal.isOpen, detailsModal.patient]);

  useEffect(() => { fetchPatients(); }, [routeContext]);

  useEffect(() => {
    const headers = getAuthHeaders();
    if (!headers) return;
    const fetchLists = async () => {
      try {
        const [mRes, pRes] = await Promise.all([
          axios.get("/api/clinic/memberships", { headers }),
          axios.get("/api/clinic/packages", { headers }),
        ]);
        setMemberships(mRes.data?.memberships || []);
        setPackages(pRes.data?.packages || []);
      } catch (e) {
        // silent
      }
    };
    fetchLists();
  }, []);

  const exportPatientsToCSV = () => {
    if (patients.length === 0) {
      addToast("No patients to export", "error");
      return;
    }

    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Mobile Number",
      "Gender",
      "Patient Type",
      "EMR Number",
      "Invoice Number",
      "Insurance",
      "Created At"
    ];

    const csvContent = [
      headers.join(","),
      ...patients.map(p => [
        `"${(p.firstName || "").replace(/"/g, '""')}"`,
        `"${(p.lastName || "").replace(/"/g, '""')}"`,
        `"${(p.email || "").replace(/"/g, '""')}"`,
        `"${(p.mobileNumber || "").replace(/"/g, '""')}"`,
        `"${(p.gender || "").replace(/"/g, '""')}"`,
        `"${(p.patientType || "").replace(/"/g, '""')}"`,
        `"${(p.emrNumber || "").replace(/"/g, '""')}"`,
        `"${(p.invoiceNumber || "").replace(/"/g, '""')}"`,
        `"${(p.insurance || "").replace(/"/g, '""')}"`,
        `"${p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `patients_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Patients exported successfully", "success");
  };

  const handleUpdate = (id) => {
    if (typeof onEditPatient === "function") {
      onEditPatient(id);
      return;
    }
    const isClinicRoute = router.pathname?.startsWith('/clinic/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/clinic/'));
    if (isClinicRoute) {
      router.push(`/clinic/update-patient-info/${id}`);
    } else {
      router.push(`/staff/update-patient-info/${id}`);
    }
  };

  // Fetch package usage data for a patient
  const fetchPackageUsage = async (patient, specificPackage = null) => {
    if (!patient || !patient._id) return;

    setPackageUsageModal({ isOpen: true, patient, data: null, loading: true, selectedPackage: specificPackage });

    try {
      const headers = getAuthHeaders();
      if (!headers) {
        addToast("Authentication required. Please login again.", "error");
        setPackageUsageModal(prev => ({ ...prev, loading: false }));
        return;
      }

      const response = await axios.get(`/api/clinic/package-usage/${patient._id}`, { headers });

      if (response.data.success) {
        if (specificPackage) {
          // Filter to show only the selected package
          const specificPackageData = response.data.packageUsage?.find(pkg => pkg.packageName === specificPackage.name);
          setPackageUsageModal(prev => ({
            ...prev,
            data: [{
              ...specificPackageData,
              packageName: specificPackage.name,
              packageId: specificPackage._id,
              packageDetails: specificPackage
            }],
            loading: false
          }));
        } else {
          // Show all packages
          setPackageUsageModal(prev => ({
            ...prev,
            data: response.data.packageUsage || [],
            loading: false
          }));
        }
      } else {
        addToast(response.data.message || "Failed to fetch package usage", "error");
        setPackageUsageModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error("Error fetching package usage:", err);
      addToast("Failed to fetch package usage data", "error");
      setPackageUsageModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDelete = async (patientId, patientName) => {
    if (!window.confirm(`Are you sure you want to delete ${patientName || 'this patient'}? This action cannot be undone.`)) {
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
      addToast("Authentication required. Please login again.", "error");
      return;
    }

    try {
      // Use clinic API endpoint for consistency - it supports clinic, agent, and doctorStaff roles
      const response = await axios.delete("/api/clinic/patient-information", {
        headers,
        data: { id: patientId }
      });

      if (response.data.success) {
        // Show success popup
        setDeleteSuccessModal({ isOpen: true, patientName: patientName });
        // Refresh the patient list without showing duplicate success toast from fetchPatients
        const refreshHeaders = getAuthHeaders();
        if (!refreshHeaders) {
          addToast("Authentication required. Please login again.", "error");
          return;
        }
        setLoading(true);
        try {
          // Always use clinic API endpoint for consistency - it supports clinic, agent, and doctorStaff roles
          const apiEndpoint = "/api/clinic/patient-information";
          const { data } = await axios.get(apiEndpoint, { headers: refreshHeaders });
          setPatients(data.success ? data.data : []);
          setPage(1);
          // Changed message to show patient deletion success
          addToast("Patient deleted successfully", "success");
        } catch (err) {
          console.error(err);
          setPatients([]);
          addToast("Failed to load data", "error");
        } finally {
          setLoading(false);
        }
      } else {
        addToast(response.data.message || "Failed to delete patient", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      addToast(err.response?.data?.message || "Failed to delete patient", "error");
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'active' || statusLower === 'completed') {
      return <span className="px-2 py-1 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700">active</span>;
    }
    if (statusLower === 'pending') {
      return <span className="px-2 py-1 text-[10px] font-medium rounded bg-amber-100 text-amber-700">pending</span>;
    }
    return <span className="px-2 py-1 text-[10px] font-medium rounded bg-gray-100 text-gray-700 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>expired</span>;
  };

  return (
    <>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes scaleIn{from{transform:scale(0.9);opacity:0}to{transform:scale(1);opacity:1}}.animate-slideIn{animation:slideIn 0.3s ease-out}.animate-scaleIn{animation:scaleIn 0.2s ease-out}`}</style>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <PatientDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ isOpen: false, patient: null })}
        patient={detailsModal.patient}
        memberships={memberships}
        packages={packages}
        onViewPackageUsage={fetchPackageUsage}
        transferNameMap={transferNameMap}
        membershipUsageMap={membershipUsageMap}
      />

      {/* Package Usage Modal */}
      <PackageUsageModal
        isOpen={packageUsageModal.isOpen}
        onClose={() => setPackageUsageModal({ isOpen: false, patient: null, data: null, loading: false, selectedPackage: null })}
        patient={packageUsageModal.patient}
        packageUsageData={packageUsageModal.data}
        loading={packageUsageModal.loading}
        selectedPackage={packageUsageModal.selectedPackage}
      />

      {/* Delete Success Modal */}
      {deleteSuccessModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteSuccessModal({ isOpen: false, patientName: "" })} />
          <div className="relative bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-md w-full my-2 sm:my-4 animate-scaleIn">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  Patient Deleted Successfully
                </h3>
                <p className="text-sm text-gray-700 mb-6">
                  {deleteSuccessModal.patientName ? (
                    <>Patient <span className="font-semibold">{deleteSuccessModal.patientName}</span> has been deleted successfully.</>
                  ) : (
                    "The patient has been deleted successfully."
                  )}
                </p>
                <button
                  onClick={() => setDeleteSuccessModal({ isOpen: false, patientName: "" })}
                  className="w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={hideHeader ? "p-2 sm:p-3" : "min-h-screen bg-gray-50 p-2 sm:p-3"}>
        <div className="w-full space-y-1">
          {/* Header Section */}
          {!hideHeader && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Patient Management</h1>
                  <p className="text-gray-700 text-xs mt-1">View and manage all patient records and information</p>
                </div>
              </div>
            </div>
          )}

          {/* Simple Search Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, phone, EMR number, invoice number, or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm text-gray-900"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={filterPreviousMemberships}
                  onChange={(e) => {
                    setFilterPreviousMemberships(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm text-gray-900 min-w-[160px]"
                >
                  <option value="all">All Memberships</option>
                  <option value="active">Active Memberships</option>
                  <option value="previous">Previous Memberships</option>
                  <option value="none">No Membership</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => {
                    setFilterPriority(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm text-gray-900 min-w-[140px]"
                >
                  <option value="all">All Priority</option>
                  <option value="priority">Priority Only</option>
                  <option value="non-priority">Non-Priority Only</option>
                </select>
              </div>

              {/* <button
                onClick={exportPatientsToCSV}
                className="inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button> */}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-700 mb-1">Total Patients</p>
                  <p className="text-xl font-bold text-gray-900">{totalPatients}</p>
                </div>
                <div className="bg-blue-100 p-2.5 rounded-md">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-700 mb-1">Active Patients</p>
                  <p className="text-xl font-bold text-green-600">{activePatients}</p>
                </div>
                <div className="bg-green-100 p-2.5 rounded-md">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Patients Table */}
          <div className="bg-white rounded-lg shadow-sm border mt-4 border-gray-200 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-gray-700" />
                <h2 className="text-base font-semibold text-gray-900">All Patients</h2>
              </div>
            </div>

            <div className="p-3">
              {loading ? (
                <div className="text-center py-10">
                  <div className="w-10 h-10 border-3 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Loading...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-gray-700 uppercase">NAME</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-gray-700 uppercase">EMR NUMBER</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-gray-700 uppercase">GENDER</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-gray-700 uppercase">EMAIL</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-gray-700 uppercase">MOBILE</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-gray-700 uppercase">TYPE</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-gray-700 uppercase">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedPatients.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-12 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                              <User className="h-6 w-6 text-gray-500" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1">No patients found</h3>
                            <p className="text-gray-700 text-xs">Try adjusting your search or filters</p>
                          </td>
                        </tr>
                      ) : (
                        displayedPatients.map((patient) => (
                          <tr
                            key={patient._id}
                            className={`border-b border-gray-100 transition-colors ${(() => {
                              const hasPriorityPlan = (patient.membership === 'Yes' && memberships.find(m => m._id === patient.membershipId)?.benefits?.priorityBooking) ||
                                (Array.isArray(patient.memberships) && patient.memberships.length > 0 && patient.memberships.some(m => {
                                  const membership = memberships.find(mem => mem._id === m.membershipId);
                                  return membership?.benefits?.priorityBooking;
                                }));
                              const isExpired = (() => {
                                if (patient.membership !== 'Yes' || !patient.membershipEndDate) return false;
                                try { return new Date(patient.membershipEndDate) < new Date(); } catch { return false; }
                              })();
                              return hasPriorityPlan && !isExpired && !patient.transferredOutMembershipPriority;
                            })()
                              ? 'bg-amber-50 border-l-4 border-amber-500'
                              : ''
                              }`}
                          >
                            <td className="py-3 px-3">
                              <p className="text-xs font-medium text-gray-900">
                                {patient.firstName} {patient.lastName}
                                {(() => {
                                  const hasPriorityPlan = (patient.membership === 'Yes' && memberships.find(m => m._id === patient.membershipId)?.benefits?.priorityBooking) ||
                                    (Array.isArray(patient.memberships) && patient.memberships.length > 0 && patient.memberships.some(m => {
                                      const membership = memberships.find(mem => mem._id === m.membershipId);
                                      return membership?.benefits?.priorityBooking;
                                    }));
                                  const isExpired = (() => {
                                    if (patient.membership !== 'Yes' || !patient.membershipEndDate) return false;
                                    try { return new Date(patient.membershipEndDate) < new Date(); } catch { return false; }
                                  })();
                                  return hasPriorityPlan && !isExpired && !patient.transferredOutMembershipPriority;
                                })() && (
                                    <span className="ml-2 inline-flex px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium">
                                      Priority
                                    </span>
                                  )}
                                {(() => {
                                  if (patient.membership !== 'Yes' || !patient.membershipEndDate) return false;
                                  try { return new Date(patient.membershipEndDate) < new Date(); } catch { return false; }
                                })() && (
                                    <span className="ml-2 inline-flex px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-medium">
                                      Expired
                                    </span>
                                  )}
                              </p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="text-xs font-medium text-gray-900">{patient.emrNumber || '-'}</p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="text-xs text-gray-900">{patient.gender || '-'}</p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="text-xs text-gray-900">{patient.email || '-'}</p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="text-xs text-gray-900">{patient.mobileNumber || '-'}</p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="text-xs text-gray-900">{patient.patientType || '-'}</p>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                {permissions.canUpdate && (
                                  <button
                                    onClick={() => handleUpdate(patient._id)}
                                    className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                    title="Edit"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const routeContextVar = typeof window !== 'undefined' && window.location.pathname?.startsWith('/clinic/') ? 'clinic' : 'staff';
                                    if (routeContextVar === 'clinic') {
                                      router.push(`/clinic/patient-profile-view?id=${patient._id}`);
                                    } else {
                                      router.push(`/staff/clinic-patient-profile-view?id=${patient._id}`);
                                    }
                                  }}
                                  className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                  title="View Patient Profile"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {permissions.canDelete && (
                                  <button
                                    onClick={() => handleDelete(patient._id, `${patient.firstName} ${patient.lastName}`)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-600">Page <span className="font-medium text-gray-800">{page}</span> of <span className="font-medium text-gray-800">{totalPages}</span></p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" /></button>
                  {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                    const pageNum = totalPages <= 5 ? idx + 1 : page <= 3 ? idx + 1 : page >= totalPages - 2 ? totalPages - 4 + idx : page - 2 + idx;
                    return <button key={idx} onClick={() => setPage(pageNum)} className={`w-8 h-8 rounded text-xs font-medium ${page === pageNum ? 'bg-gray-800 text-white' : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{pageNum}</button>;
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" /></button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

PatientFilterUI.getLayout = function PageLayout(page) { return <ClinicLayout>{page}</ClinicLayout>; };
const ProtectedDashboard = withClinicAuth(PatientFilterUI);
ProtectedDashboard.getLayout = PatientFilterUI.getLayout;

// Export PatientFilterUI as named export for use in other components
export { PatientFilterUI as PatientInformation };
export default ProtectedDashboard;
