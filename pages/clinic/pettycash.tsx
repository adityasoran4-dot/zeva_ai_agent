"use client";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getCurrencySymbol } from "@/lib/currencyHelper";
import withClinicAuth from "../../components/withClinicAuth";
import ClinicLayout from "../../components/ClinicLayout";
import type { NextPageWithLayout } from "../_app";
import {
  Search,
  Calendar,
  DollarSign,
  Banknote,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Package,
  Stethoscope,
  CreditCard,
  User,
  Plus,
  X,
  ListOrdered,
  Receipt,
  CheckCircle,
  Trash2,
  Image as ImageIcon,
  Shield,
} from "lucide-react";
import AddSupplierModal from "./stocks/suppliers/_components/AddSupplierModal";

// Permission Types
interface Permissions {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

// Token priority for auth
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
    const value = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  for (const k of ["clinicToken", "doctorToken", "agentToken", "staffToken", "userToken", "adminToken"]) {
    const v = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (v) return v;
  }
  return null;
};

const authHeaders = () => { const t = getAuthToken(); return t ? { Authorization: `Bearer ${t}` } : {}; };

// Helper function to get user info from token
const getUserInfo = (): { role: string | null; id: string | null } => {
  if (typeof window === "undefined") return { role: null, id: null };
  try {
    for (const key of TOKEN_PRIORITY) {
      const token = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""),
          );
          const decoded = JSON.parse(jsonPayload);
          return { role: decoded.role || decoded.userRole || null, id: decoded.userId || decoded.id || null };
        } catch (e) { continue; }
      }
    }
  } catch (error) { console.error("Error getting user info:", error); }
  return { role: null, id: null };
};

const getUserRole = (): string | null => getUserInfo().role;

// Types
interface MultiPayment { paymentMethod: string; amount: number; }
interface PackageTreatment { treatmentName: string; sessions: number; }
interface MembershipInfo { name: string; price: number; }

interface CashRecord {
  _id: string;
  invoiceNumber: string;
  invoicedDate: string;
  invoicedBy: string;
  patientName: string;
  mobileNumber: string;
  emrNumber: string;
  service: "Treatment" | "Package" | string;
  treatment: string | null;
  package: string | null;
  selectedPackageTreatments: PackageTreatment[];
  amount: number;
  paid: number;
  cashAmount: number;
  paymentMethod: string;
  multiplePayments: MultiPayment[];
  isFreeConsultation: boolean;
  membershipDiscountApplied: number;
  membershipId: string | null;
  membershipInfo: MembershipInfo | null;
}

interface ManualEntry {
  _id: string;
  name: string;
  amount: number;
  note: string;
  createdAt: string;
  isExpense?: boolean;
  vendorName?: string;
  items?: { itemName: string; amount: number }[];
  images?: string[];
  usedFromPettyCash?: boolean;
}

interface Summary { totalCashIn: number; totalRecords: number; }
interface Pagination { total: number; page: number; limit: number; totalPages: number; }

// Helpers

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

// Drawer component
function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  // Prevent body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </>
  );
}

// Page
function PettyCashPage() {
  // Patient billing records
  const [records, setRecords] = useState<CashRecord[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalCashIn: 0, totalRecords: 0 });
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState('INR');

  // ── Permissions ──────────────────────────────────────────────
  const [permissions, setPermissions] = useState<Permissions>({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  // Manual petty cash entries
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<any[]>([]);
  const [manualTotal, setManualTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [globalCashInTotal, setGlobalCashInTotal] = useState(0);
  const [grandManualTotal, setGrandManualTotal] = useState(0); // Global (unfiltered) manual additions
  const [grandExpenseTotal, setGrandExpenseTotal] = useState(0); // Global (unfiltered) expense deductions
  const [manualLoading, setManualLoading] = useState(false);

  // Drawers
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [manualDrawerOpen, setManualDrawerOpen] = useState(false);
  const [allExpenseDrawerOpen, setAllExpenseDrawerOpen] = useState(false);
  const [patientDrawerOpen, setPatientDrawerOpen] = useState(false);

  // Add form
  const [addName, setAddName] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addNote, setAddNote] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);

  // Expense form
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [expenseVendor, setExpenseVendor] = useState("");
  const [expenseItems, setExpenseItems] = useState([{ itemName: "", amount: "" }]);
  const [expenseImages, setExpenseImages] = useState<string[]>([]);
  const [usePettyCash, setUsePettyCash] = useState(true);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseError, setExpenseError] = useState("");
  const [expenseSuccess, setExpenseSuccess] = useState(false);

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(getAuthToken() || "");
  }, []);

  // ── Fetch Permissions ─────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const fetchPermissions = async () => {
      try {
        const userRole = getUserRole();
        const authToken = getStoredToken();

        if (!authToken) {
          if (isMounted) {
            setPermissions({ canRead: false, canCreate: false, canUpdate: false, canDelete: false });
            setPermissionsLoaded(true);
          }
          return;
        }

        // Admin role gets full access
        if (userRole === "admin") {
          if (isMounted) {
            setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
            setPermissionsLoaded(true);
          }
          return;
        }

        // Clinic and Doctor roles use /api/clinic/sidebar-permissions
        if (userRole === "clinic" || userRole === "doctor") {
          const res = await axios.get("/api/clinic/sidebar-permissions", {
            headers: { Authorization: `Bearer ${authToken}` },
          });

          if (!isMounted) return;

          if (res.data.success) {
            if (!res.data.permissions || res.data.permissions === null || res.data.permissions.length === 0) {
              // No restrictions set - full access (backward compatibility)
              setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
            } else {
              // Check clinic_PettyCash module permission
              const modulePermission = res.data.permissions.find((p: any) => {
                if (!p?.module) return false;
                return p.module === "clinic_PettyCash" || p.module === "clinic_pettycash" || p.module === "pettycash" || p.module === "petty_cash";
              });

              if (modulePermission) {
                const actions = modulePermission.actions || {};
                const isTrue = (val: any) => val === true || val === "true" || String(val || "").toLowerCase() === "true";
                const moduleAll = isTrue(actions.all);
                setPermissions({
                  canRead: moduleAll || isTrue(actions.read),
                  canCreate: moduleAll || isTrue(actions.create),
                  canUpdate: moduleAll || isTrue(actions.update),
                  canDelete: moduleAll || isTrue(actions.delete),
                });
              } else {
                // Module not found - default to read-only for clinic/doctor
                setPermissions({ canRead: true, canCreate: false, canUpdate: false, canDelete: false });
              }
            }
          } else {
            setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
          }
        } else {
          // Agent/Staff roles use /api/agent/get-module-permissions
          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: "clinic_pettycash" },
            headers: { Authorization: `Bearer ${authToken}` },
          });

          if (!isMounted) return;

          const data = res.data;
          // Module not found = full access (matches backend)
          if (!data?.permissions && data?.error?.includes("not found")) {
            setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
          } else {
            const actions = data?.permissions?.actions || data?.data?.moduleActions || {};
            const isTrue = (val: any) => val === true || val === "true" || String(val || "").toLowerCase() === "true";
            const canAll = isTrue(actions.all);
            setPermissions({
              canRead: canAll || isTrue(actions.read),
              canCreate: canAll || isTrue(actions.create),
              canUpdate: canAll || isTrue(actions.update),
              canDelete: canAll || isTrue(actions.delete),
            });
          }
        }
      } catch (err) {
        console.error("Error fetching permissions:", err);
        if (isMounted) {
          setPermissions({ canRead: false, canCreate: false, canUpdate: false, canDelete: false });
        }
      } finally {
        if (isMounted) {
          setPermissionsLoaded(true);
        }
      }
    };

    fetchPermissions();
    return () => { isMounted = false; };
  }, []);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await axios.get("/api/stocks/suppliers", {
        headers: authHeaders(),
        params: { limit: 1000 }
      });
      if (res.data.success) {
        setSuppliers(res.data.data.suppliers || []);
      }
    } catch (e) {
      console.error("Failed to fetch suppliers:", e);
    }
  }, []);

  useEffect(() => {
    if (expenseDrawerOpen) fetchSuppliers();
  }, [expenseDrawerOpen, fetchSuppliers]);

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("file", files[i]);

      try {
        const res = await axios.post("/api/upload", formData, {
          headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
        });
        if (res.data.success && res.data.url) {
          uploadedUrls.push(res.data.url);
        }
      } catch (e: any) {
        console.error(`Image upload failed for file ${files[i].name}:`, e);
        setExpenseError(e?.response?.data?.message || "Failed to upload one or more images");
      }
    }

    if (uploadedUrls.length > 0) {
      setExpenseImages((prev) => [...prev, ...uploadedUrls]);
    }
  };

  const removeImage = (index: number) => {
    setExpenseImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { itemName: "", amount: "" }]);
  };

  const removeExpenseItem = (index: number) => {
    if (expenseItems.length > 1) {
      setExpenseItems(expenseItems.filter((_, i) => i !== index));
    }
  };

  const updateExpenseItem = (index: number, field: string, value: string) => {
    const newItems = [...expenseItems];
    (newItems[index] as any)[field] = value;
    setExpenseItems(newItems);
  };

  const totalExpenseAmount = expenseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  // ── Add expense entry ─────────────────────────────────────────────────────
  const handleAddExpense = async () => {
    setExpenseError("");
    if (!expenseVendor) { setExpenseError("Vendor is required"); return; }
    if (expenseItems.some(item => !item.itemName.trim() || !parseFloat(item.amount))) {
      setExpenseError("All items must have a name and a valid amount");
      return;
    }
    
    setExpenseLoading(true);
    try {
      const vendorName = suppliers.find(s => s._id === expenseVendor)?.name || "";
      const payload = {
        description: `Expense: ${vendorName}`,
        spentAmount: totalExpenseAmount,
        vendor: expenseVendor,
        vendorName,
        items: expenseItems.map(i => ({ itemName: i.itemName, amount: parseFloat(i.amount) })),
        receipts: expenseImages,
        usedFromPettyCash: usePettyCash
      };

      await axios.post("/api/pettycash/add-expense", payload, {
        headers: { ...authHeaders(), "Content-Type": "application/json" }
      });

      setExpenseSuccess(true);
      setExpenseVendor(""); setExpenseItems([{ itemName: "", amount: "" }]); setExpenseImages([]); setUsePettyCash(true);
      
      // Refresh both lists + global totals
      fetchManual();
      fetchGlobalTotals();
      fetchData(page);
      
      setTimeout(() => {
        setExpenseSuccess(false);
        setExpenseDrawerOpen(false);
      }, 2000);
    } catch (e: any) {
      setExpenseError(e?.response?.data?.message || "Failed to add expense");
    } finally {
      setExpenseLoading(false);
    }
  };

  // Filters
  const today = new Date().toISOString().split("T")[0];
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [page, setPage] = useState(1);

  // Dynamic currency formatting function
  const fmt = (n: number) => {
    const currencySymbol = getCurrencySymbol(currency);
    return `${currencySymbol}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // ── Fetch patient billing cash records ────────────────────────────────────
  const fetchData = useCallback(async (pg = 1) => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(pg), limit: "50" };
      if (search.trim()) params.search = search.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await axios.get("/api/clinic/pettycash-payments", {
        headers: authHeaders(),
        params,
      });
      if (res.data.success) {
        setRecords(res.data.data);
        setSummary(res.data.summary);
        setPagination(res.data.pagination);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load petty cash data");
    } finally {
      setLoading(false);
    }
  }, [search, startDate, endDate]);

  // ── Fetch global grand totals (no date filter) — called once on mount ──────────
  const fetchGlobalTotals = useCallback(async () => {
    try {
      // Fetch global patient cash total
      const patientRes = await axios.get("/api/clinic/pettycash-payments", {
        headers: authHeaders(),
        params: { page: "1", limit: "1", skipDateFilter: "true" },
      });
      if (patientRes.data.success) {
        setGlobalCashInTotal(patientRes.data.summary?.totalCashIn || 0);
      }
      // Fetch global manual + expense total
      const manualRes = await axios.get("/api/clinic/manual-pettycash", {
        headers: authHeaders(),
      });
      if (manualRes.data.success) {
        setGrandManualTotal(manualRes.data.grandManualTotal || 0);
        setGrandExpenseTotal(manualRes.data.grandExpenseTotal || 0);
      }
    } catch {}
  }, []);


  // ── Fetch filtered manual petty cash entries (with date filter) ───────────────────────
  const fetchManual = useCallback(async () => {
    setManualLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await axios.get("/api/clinic/manual-pettycash", {
        headers: authHeaders(),
        params,
      });
      if (res.data.success) {
        setManualEntries(res.data.data);
        setManualTotal(res.data.totalAmount || 0);
        setExpenseTotal(res.data.expenseTotal || 0);
        if (res.data.pettyCashGlobal) {
          setExpenseEntries(res.data.pettyCashGlobal.expenses || []);
        }
      }
    } catch {}
    finally { setManualLoading(false); }
  }, [startDate, endDate]);

  // Fetch clinic currency preference
  useEffect(() => {
    const fetchClinicCurrency = async () => {
      try {
        const headers = authHeaders();
        if (!headers.Authorization) return;
        const res = await axios.get('/api/clinics/myallClinic', { headers });
        if (res.data.success && res.data.clinic?.currency) {
          setCurrency(res.data.clinic.currency);
        }
      } catch (e) { 
        console.error('Error fetching clinic currency:', e); 
      }
    };
    fetchClinicCurrency();
  }, []);

  useEffect(() => {
    fetchData(page);
  }, [page, permissionsLoaded, permissions.canRead]);

  // Fetch global totals once on mount (no date filter — for Total Cash In card)
  useEffect(() => {
    if (!permissionsLoaded) return;
    if (!permissions.canRead) return;
    fetchGlobalTotals();
  }, [permissionsLoaded, permissions.canRead]);


  useEffect(() => {
    if (!permissionsLoaded) return;
    if (!permissions.canRead) return;
    fetchManual();
  }, [startDate, endDate, permissionsLoaded, permissions.canRead]);

  const handleSearch = () => { setPage(1); fetchData(1); };
  const handleReset = () => {
    setSearch(""); setStartDate(today); setEndDate(today); setPage(1);
    setTimeout(() => { fetchData(1); fetchManual(); fetchGlobalTotals(); }, 0);
  };

  // ── Add manual entry ──────────────────────────────────────────────────────
  const handleAdd = async () => {
    setAddError("");
    if (!addName.trim()) { setAddError("Name is required"); return; }
    const amt = parseFloat(addAmount);
    if (!amt || amt <= 0) { setAddError("Enter a valid amount"); return; }
    setAddLoading(true);
    try {
      await axios.post("/api/clinic/manual-pettycash",
        { name: addName.trim(), amount: amt, note: addNote },
        { headers: { ...authHeaders(), "Content-Type": "application/json" } }
      );
      setAddSuccess(true);
      setAddName(""); setAddAmount(""); setAddNote("");
      fetchManual();
      // refresh global totals + filtered data
      fetchGlobalTotals();
      fetchData(page);
      setTimeout(() => setAddSuccess(false), 3000);
    } catch (e: any) {
      setAddError(e?.response?.data?.message || "Failed to add entry");
    } finally {
      setAddLoading(false);
    }
  };

  // Combined total for "Total Cash In" card = global patient cash + global manual additions - global expenses
  const combinedTotal = globalCashInTotal + grandManualTotal - grandExpenseTotal;

  // ── Service info ──────────────────────────────────────────────────────────
  const renderServiceInfo = (record: CashRecord) => {
    if (record.membershipInfo) {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1 text-purple-700 font-medium text-xs"><CreditCard size={12} />Membership</span>
          <span className="text-gray-800 text-xs font-semibold">{record.membershipInfo.name}</span>
          <span className="text-gray-500 text-xs">{fmt(record.membershipInfo.price)}</span>
          {record.membershipDiscountApplied > 0 && <span className="text-green-600 text-xs">Discount: {fmt(record.membershipDiscountApplied)}</span>}
        </div>
      );
    }
    if (record.service === "Package") {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1 text-blue-700 font-medium text-xs"><Package size={12} />Package</span>
          <span className="text-gray-800 text-xs font-semibold">{record.package}</span>
          {record.selectedPackageTreatments?.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {record.selectedPackageTreatments.map((t, i) => (
                <span key={i} className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 text-[10px]">
                  {t.treatmentName}{t.sessions > 0 && ` ×${t.sessions}`}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 text-teal-700 font-medium text-xs"><Stethoscope size={12} />Treatment</span>
        <span className="text-gray-800 text-xs font-semibold">{record.treatment || "—"}</span>
      </div>
    );
  };

  const renderPaymentBadge = (record: CashRecord) => {
    if (record.multiplePayments?.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {record.multiplePayments.map((mp, i) => (
            <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${mp.paymentMethod === "Cash" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {mp.paymentMethod}: {fmt(mp.amount)}
            </span>
          ))}
        </div>
      );
    }
    return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium border bg-green-50 text-green-700 border-green-200">Cash: {fmt(record.cashAmount)}</span>;
  };

  // Render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {/* ── Access Denied Screen (only if both read and create are false) ───────────────────────────────────────────────── */}
      {!permissionsLoaded ? null : (!permissions.canRead && !permissions.canCreate) ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="p-4 bg-red-100 rounded-full">
            <Shield size={48} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
            You do not have permission to view or manage Petty Cash data. Please contact your administrator for access.
          </p>
        </div>
      ) : (
        <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Banknote className="text-green-700" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Petty Cash</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cash payments received from patients + manual entries</p>
          </div>
        </div>
        {permissions.canCreate && (
        <div className="flex items-center gap-2">
          {/* Add Expense button */}
          <button
            onClick={() => setExpenseDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow transition-colors"
          >
            <Plus size={15} />
            Add Expense
          </button>
          {/* Add Petty Cash button */}
          <button
            onClick={() => setAddDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow transition-colors"
          >
            <Plus size={15} />
            Add Petty Cash
          </button>
        </div>
      )}
      </div>

      {permissions.canRead && (
      <>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Combined Total */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 flex items-center gap-3 shadow-sm text-white">
          <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
            <DollarSign size={18} />
          </div>
          <div>
            <p className="text-xs opacity-80">Total Cash In</p>
            <p className="text-lg font-bold">{fmt(combinedTotal)}</p>
          </div>
        </div>

        {/* Patient Cash */}
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3 shadow-sm cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => setPatientDrawerOpen(true)}
        >
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <Receipt className="text-blue-700" size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Patient Cash</p>
            <p className="text-lg font-bold text-blue-700">{fmt(summary.totalCashIn)}</p>
            <p className="text-[10px] text-gray-400">{summary.totalRecords} records</p>
          </div>
        </div>

        {/* Manual Entries */}
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3 shadow-sm cursor-pointer hover:border-purple-400 transition-colors"
          onClick={() => setManualDrawerOpen(true)}
        >
          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
            <ListOrdered className="text-purple-700" size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Manual Entry</p>
            <p className="text-lg font-bold text-purple-700">{fmt(manualTotal)}</p>
            <p className="text-[10px] text-gray-400">{manualEntries.filter(e => !e.isExpense).length} entries</p>
          </div>
        </div>

        {/* Expenses */}
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3 shadow-sm cursor-pointer hover:border-red-400 transition-colors"
          onClick={() => setAllExpenseDrawerOpen(true)}
        >
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
            <RefreshCw className="text-red-600" size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Expenses</p>
            <p className="text-lg font-bold text-red-600">{fmt(expenseTotal)}</p>
            <p className="text-[10px] text-gray-400">Total added expenses</p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Search patient name or invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSearch} className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">Search</button>
            <button onClick={handleReset} className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1">
              <RefreshCw size={13} />Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      {/* ── Table ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <RefreshCw className="animate-spin" size={20} />
            <span className="text-sm">Loading records...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Banknote size={40} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">No cash payment records found</p>
            <p className="text-xs mt-1">Try adjusting the date range or search query</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-600">
                    {["#", "Invoice", "Date", "Patient", "Service / Item", "Payment Breakdown", "Total Billed", "Cash Received"].map((h, i) => (
                      <th key={h} className={`px-4 py-3 text-xs font-semibold whitespace-nowrap ${i < 7 ? "text-left text-gray-600 dark:text-gray-300" : "text-right text-green-700"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {records.map((record, idx) => (
                    <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-400">{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{record.invoiceNumber}</span>
                        {record.invoicedBy && <p className="text-[10px] text-gray-400 mt-0.5">by {record.invoicedBy}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{fmtDate(record.invoicedDate)}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{record.patientName || "—"}</p>
                        {record.emrNumber && <p className="text-[10px] text-gray-400">EMR: {record.emrNumber}</p>}
                        {record.mobileNumber && <p className="text-[10px] text-gray-400">{record.mobileNumber}</p>}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {renderServiceInfo(record)}
                        {record.isFreeConsultation && (
                          <span className="mt-0.5 inline-block text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">Free Consultation</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{renderPaymentBadge(record)}</td>
                      <td className="px-4 py-3 text-right"><span className="text-sm font-medium text-gray-700 dark:text-gray-300">{fmt(record.amount)}</span></td>
                      <td className="px-4 py-3 text-right"><span className="text-sm font-bold text-green-700">{fmt(record.cashAmount)}</span></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-green-50 dark:bg-green-900/20 border-t-2 border-green-200 dark:border-green-700">
                    <td colSpan={7} className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">Page Total (Cash):</td>
                    <td className="px-4 py-3 text-right text-base font-bold text-green-700">{fmt(records.reduce((s, r) => s + r.cashAmount, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors"><ChevronLeft size={15} /></button>
                  <span className="text-xs text-gray-600 dark:text-gray-300 flex items-center px-2">{pagination.page} / {pagination.totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={pagination.page >= pagination.totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors"><ChevronRight size={15} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* DRAWER 1: Add Petty Cash */}
      <Drawer open={addDrawerOpen} onClose={() => { setAddDrawerOpen(false); setAddError(""); setAddSuccess(false); }} title="Add Petty Cash">
        <div className="flex flex-col gap-5">
          {addSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
              <CheckCircle size={16} />
              Entry added successfully!
            </div>
          )}
          {addError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{addError}</div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Office supplies, Snacks, Petrol..."
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount (AED) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Note (optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Note <span className="text-xs text-gray-400">(optional)</span></label>
            <textarea
              rows={2}
              placeholder="Any additional notes..."
              value={addNote}
              onChange={(e) => setAddNote(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={addLoading}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {addLoading ? <RefreshCw size={15} className="animate-spin" /> : <Plus size={15} />}
            {addLoading ? "Adding..." : "Add to Petty Cash"}
          </button>

          {/* Preview of total after add */}
          {addAmount && parseFloat(addAmount) > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-xs text-green-700">
              New combined total will be: <span className="font-bold">{fmt(combinedTotal + parseFloat(addAmount))}</span>
            </div>
          )}
        </div>
      </Drawer>

      {/* DRAWER 2: Manual Petty Cash Entries */}
      <Drawer open={manualDrawerOpen} onClose={() => setManualDrawerOpen(false)} title="Manual Entries">
        <div className="flex flex-col gap-4">
          {/* Total */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 font-medium">Total Manual Cash</p>
              <p className="text-2xl font-bold text-purple-700">{fmt(manualTotal)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <ListOrdered className="text-purple-700" size={22} />
            </div>
          </div>

          {manualLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <RefreshCw size={18} className="animate-spin" /><span className="text-sm">Loading...</span>
            </div>
          ) : manualEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <ListOrdered size={36} className="mb-2 opacity-40" />
              <p className="text-sm">No manual entries yet</p>
              {permissions.canCreate && (
              <button
                onClick={() => { setManualDrawerOpen(false); setAddDrawerOpen(true); }}
                className="mt-3 text-xs text-green-600 underline"
              >Add one now</button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {manualEntries.map((entry) => (
                <div key={entry._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                  {/* Name + Amount */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                        <Plus size={13} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{entry.name}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-purple-700 whitespace-nowrap ml-3">
                      {fmt(entry.amount)}
                    </span>
                  </div>

                  {/* Description / Note */}
                  <div className="ml-9">
                    {entry.note && <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 leading-relaxed">{entry.note}</p>}
                    
                    {/* Date */}
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <Calendar size={10} />
                      {fmtDateTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex justify-between items-center border border-gray-200 dark:border-gray-700 mt-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{manualEntries.length} entries</span>
                <span className="text-base font-bold text-purple-700">{fmt(manualTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* DRAWER 5: All Expenses List */}
      <Drawer open={allExpenseDrawerOpen} onClose={() => setAllExpenseDrawerOpen(false)} title="All Expenses">
        <div className="flex flex-col gap-4">
          {/* Total */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">{fmt(expenseTotal)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <RefreshCw className="text-red-600" size={22} />
            </div>
          </div>

          <div className="flex justify-center">
            {permissions.canCreate && (
            <button
              onClick={() => { setAllExpenseDrawerOpen(false); setExpenseDrawerOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow transition-colors w-full justify-center"
            >
              <Plus size={15} />
              Add Expense
            </button>
            )}
          </div>

          {manualLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <RefreshCw size={18} className="animate-spin" /><span className="text-sm">Loading...</span>
            </div>
          ) : expenseEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <RefreshCw size={36} className="mb-2 opacity-40" />
              <p className="text-sm">No expenses yet</p>
              {permissions.canCreate && (
              <button
                onClick={() => { setAllExpenseDrawerOpen(false); setExpenseDrawerOpen(true); }}
                className="mt-3 text-xs text-blue-600 underline font-medium"
              >Add one now</button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {expenseEntries.map((entry, idx) => (
                <div key={entry._id || idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                  {/* Name + Amount */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                        <RefreshCw size={13} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{entry.description || "Expense"}</p>
                        {entry.vendorName && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-gray-400">Vendor:</span>
                            <span className="text-[10px] text-blue-600 font-bold">{entry.vendorName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-red-600 whitespace-nowrap ml-3">
                      {fmt(entry.spentAmount)}
                    </span>
                  </div>

                  {/* Items & Images */}
                  <div className="ml-9">
                    {entry.items && entry.items.length > 0 && (
                      <div className="mt-1 flex flex-col gap-1 mb-2 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Items Breakdown</p>
                        {entry.items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-[11px]">
                            <span className="text-gray-600 dark:text-gray-300">• {item.itemName}</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-200">{fmt(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {entry.receipts && entry.receipts.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1.5 mb-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Receipts</p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {entry.receipts.map((img: string, i: number) => (
                            <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 group relative">
                              <img src={img} alt="receipt" className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-lg">
                                <ImageIcon size={14} className="text-white drop-shadow" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Date */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Calendar size={10} />
                        {fmtDateTime(entry.date || entry.createdAt)}
                      </p>
                      {entry.usedFromPettyCash && (
                        <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Petty Cash</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex justify-between items-center border border-gray-200 dark:border-gray-700 mt-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{expenseEntries.length} expenses</span>
                <span className="text-base font-bold text-red-600">{fmt(expenseTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* DRAWER 3: Patient Cash Payments */}
      <Drawer open={patientDrawerOpen} onClose={() => setPatientDrawerOpen(false)} title="Patient Cash Payments">
        <div className="flex flex-col gap-4">
          {/* Total */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">Total Patient Cash</p>
              <p className="text-2xl font-bold text-blue-700">{fmt(summary.totalCashIn)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Receipt className="text-blue-700" size={22} />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <RefreshCw size={18} className="animate-spin" /><span className="text-sm">Loading...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Receipt size={36} className="mb-2 opacity-40" />
              <p className="text-sm">No patient cash records</p>
              <p className="text-xs mt-1">Try changing the date range</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {records.map((record, _) => (
                <div key={record._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                  {/* Patient + cash */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User size={13} className="text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{record.patientName || "—"}</p>
                        {record.emrNumber && <p className="text-[10px] text-gray-400">EMR: {record.emrNumber}</p>}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-green-700 whitespace-nowrap ml-2">{fmt(record.cashAmount)}</span>
                  </div>

                  {/* Service */}
                  <div className="ml-9">
                    {record.membershipInfo ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 rounded px-1.5 py-0.5 font-medium">Membership</span>
                        <span className="text-xs text-gray-700 font-semibold">{record.membershipInfo.name}</span>
                        <span className="text-[10px] text-gray-500">{fmt(record.membershipInfo.price)}</span>
                      </div>
                    ) : record.service === "Package" ? (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 font-medium">Package</span>
                          <span className="text-xs text-gray-700 font-semibold">{record.package}</span>
                        </div>
                        {record.selectedPackageTreatments?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {record.selectedPackageTreatments.map((t, i) => (
                              <span key={i} className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                                {t.treatmentName}{t.sessions > 0 && ` ×${t.sessions}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 rounded px-1.5 py-0.5 font-medium">Treatment</span>
                        <span className="text-xs text-gray-700">{record.treatment || "—"}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-mono text-gray-400">{record.invoiceNumber}</span>
                      <span className="text-[10px] text-gray-400">{fmtDate(record.invoicedDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {/* Footer */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 flex justify-between items-center border border-green-200 dark:border-green-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{records.length} shown (page {pagination.page}/{pagination.totalPages})</span>
                <span className="text-base font-bold text-green-700">{fmt(summary.totalCashIn)}</span>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* DRAWER 4: Add Expense */}
      <Drawer open={expenseDrawerOpen} onClose={() => { setExpenseDrawerOpen(false); setExpenseError(""); setExpenseSuccess(false); }} title="Add Expense">
        <div className="flex flex-col gap-5">
          {expenseSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
              <CheckCircle size={16} />
              Expense added successfully!
            </div>
          )}
          {expenseError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{expenseError}</div>
          )}

          {/* Vendor Selection */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Vendor <span className="text-red-500">*</span>
              </label>
              <button
                onClick={() => setIsAddSupplierOpen(true)}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                + Add New Vendor
              </button>
            </div>
            <select
              value={expenseVendor}
              onChange={(e) => setExpenseVendor(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select a vendor</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Items</label>
            {expenseItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1 flex flex-col gap-1">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.itemName}
                    onChange={(e) => updateExpenseItem(idx, "itemName", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="w-24 flex flex-col gap-1">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={item.amount}
                    onChange={(e) => updateExpenseItem(idx, "amount", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
                  />
                </div>
                {expenseItems.length > 1 && (
                  <button
                    onClick={() => removeExpenseItem(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addExpenseItem}
              className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1 mt-1"
            >
              <Plus size={12} /> Add more items
            </button>
          </div>

          {/* Image Upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Receipts/Images</label>
            <div className="flex flex-wrap gap-2">
              {expenseImages.map((url, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-lg border border-gray-200 overflow-hidden group">
                  <img src={url} alt="receipt" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-0 right-0 p-0.5 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                <ImageIcon size={20} className="text-gray-400" />
                <span className="text-[10px] text-gray-400">Add</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          {/* Used from Petty Cash Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="usedFromPettyCash"
              checked={usePettyCash}
              onChange={(e) => setUsePettyCash(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="usedFromPettyCash" className="text-sm text-gray-700 dark:text-gray-300">
              Used from Petty Cash (Deduct from Total)
            </label>
          </div>

          {/* Total Preview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex justify-between items-center">
            <span className="text-sm font-medium text-blue-700">Total Expense:</span>
            <span className="text-lg font-bold text-blue-700">{fmt(totalExpenseAmount)}</span>
          </div>

          <button
            onClick={handleAddExpense}
            disabled={expenseLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {expenseLoading ? <RefreshCw size={15} className="animate-spin" /> : <Plus size={15} />}
            {expenseLoading ? "Adding..." : "Add Expense"}
          </button>
        </div>
      </Drawer>

      {/* Add Supplier Modal */}
      <AddSupplierModal
        token={token}
        isOpen={isAddSupplierOpen}
        onClose={() => setIsAddSupplierOpen(false)}
        onSuccess={(newSupplier) => {
          setSuppliers((prev) => [...prev, newSupplier]);
          setExpenseVendor(newSupplier._id);
          setIsAddSupplierOpen(false);
        }}
      />
        </>
      )}
      </>
      )}
    </div>
  );
}

// Layout & Auth
PettyCashPage.getLayout = function PageLayout(page: React.ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

const ProtectedPettyCashPage = withClinicAuth(PettyCashPage) as NextPageWithLayout;
ProtectedPettyCashPage.getLayout = PettyCashPage.getLayout;

export default ProtectedPettyCashPage;
