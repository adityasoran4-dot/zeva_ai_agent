// components/PettyCashAndExpense.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import ClinicLayout from '../../components/staffLayout';
import withClinicAuth from '../../components/withStaffAuth';
import { Loader2 } from 'lucide-react';

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

function PettyCashAndExpense() {
  // ---------- STATE ----------
  const [form, setForm] = useState({
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    note: "",
    allocatedAmounts: [""],
    receipts: [], // ensure defined
  });
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    spentAmount: "",
    vendor: "", // Add vendor field
    receipts: [], // ensure defined
  });
  const [manualPettyCashForm, setManualPettyCashForm] = useState({
    note: "",
    amount: "",
    receipts: [],
  });

  const [message, setMessage] = useState("");
  const [expenseMsg, setExpenseMsg] = useState("");
  const [pettyCashList, setPettyCashList] = useState([]);
  const [search, setSearch] = useState("");
  const [vendors, setVendors] = useState([]);

  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editType, setEditType] = useState(""); // "allocated" or "expense"
  const [receiptUrls, setReceiptUrls] = useState([]);
  const [expenseReceiptUrls, setExpenseReceiptUrls] = useState([]);
  // UI state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPettyModal, setShowPettyModal] = useState(false);
  const [showManualPettyModal, setShowManualPettyModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", tone: "success" });
  const [expenseSearch, setExpenseSearch] = useState("");
  // Local previews before submit
  const [pettyPreviews, setPettyPreviews] = useState([]); // array of { url, file }
  const [expensePreviews, setExpensePreviews] = useState([]); // array of { url, file }
  const [manualPettyPreviews, setManualPettyPreviews] = useState([]); // array of { url, file }
  // Submit loading states
  const [isSubmittingPetty, setIsSubmittingPetty] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [isSubmittingManualPetty, setIsSubmittingManualPetty] = useState(false);

  // ---------- GLOBAL DATE HANDLING ----------
  const toInputDate = (d) => {
    const dt = new Date(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [selectedDate, setSelectedDate] = useState(toInputDate(new Date()));
  const [globalData, setGlobalData] = useState({
    globalAllocated: 0,
    globalSpent: 0,
    globalRemaining: 0,
    patients: [],
  });
  const [adminGlobalData, setAdminGlobalData] = useState({
    globalAmount: 0,
    totalAllocated: 0,
    totalSpent: 0,
    totalRecords: 0,
    totalStaff: 0,
    lastUpdated: null,
  });
  const [currentUser, setCurrentUser] = useState({ role: "" });
  const router = useRouter();
  const [permissions, setPermissions] = useState({
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [isClinicContext, setIsClinicContext] = useState(false);

  const isTodaySelected =
    selectedDate === new Date().toISOString().split("T")[0];

  const [filteredExpenses, setFilteredExpenses] = useState([]);

  // Check if we're in clinic context
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      setIsClinicContext(path.startsWith("/clinic/"));
    } else if (router?.pathname) {
      setIsClinicContext(router.pathname.startsWith("/clinic/"));
    }
  }, [router?.pathname]);

  // Fetch permissions for clinic context
  const fetchClinicPermissions = useCallback(async () => {
    if (!isClinicContext) {
      setPermissionsLoaded(true);
      return;
    }

    try {
      setPermissionsLoaded(false);
      const token = getStoredToken();
      if (!token) {
        setPermissions({
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
        });
        setPermissionsLoaded(true);
        return;
      }

      const res = await axios.get("/api/clinic/permissions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      if (data.success && data.data) {
        // Find clinic_staff_management module
        const modulePermission = data.data.permissions?.find((p) => {
          if (!p?.module) return false;
          const normalized = p.module.startsWith("clinic_")
            ? p.module.slice(7)
            : p.module.startsWith("admin_")
            ? p.module.slice(6)
            : p.module;
          return normalized === "clinic_staff_management" || normalized === "staff_management";
        });

        if (modulePermission) {
          const actions = modulePermission.actions || {};
          const moduleAll = actions.all === true || 
                           actions.all === "true" || 
                           String(actions.all).toLowerCase() === "true";

          // Find "Add Expense" submodule - check multiple possible names and paths
          const expenseSubModule = modulePermission.subModules?.find(
            (sm) => {
              const subModuleName = (sm?.name || "").trim();
              const subModulePath = (sm?.path || "").trim();
              const nameMatch = subModuleName === "Add Expense" || 
                               subModuleName === "Add Petty Cash" ||
                               subModuleName.toLowerCase().includes("expense") ||
                               subModuleName.toLowerCase().includes("petty");
              const pathMatch = subModulePath.includes("/AddPettyCashForm") || 
                               subModulePath.includes("/add-petty-cash") ||
                               subModulePath.includes("pettycash");
              return nameMatch || pathMatch;
            }
          );

          if (expenseSubModule) {
            const subModuleActions = expenseSubModule.actions || {};
            const subModuleAll = subModuleActions.all === true || 
                                subModuleActions.all === "true" || 
                                String(subModuleActions.all).toLowerCase() === "true";

            const checkPermission = (actionName) => {
              if (subModuleActions && subModuleActions.hasOwnProperty(actionName)) {
                const actionValue = subModuleActions[actionName];
                if (actionValue === true || actionValue === "true" || String(actionValue).toLowerCase() === "true") {
                  return true;
                }
                if (actionValue === false || actionValue === "false" || String(actionValue).toLowerCase() === "false") {
                  return false;
                }
              }
              if (subModuleAll) return true;
              if (actions && actions.hasOwnProperty(actionName)) {
                const moduleActionValue = actions[actionName];
                if (moduleActionValue === true || moduleActionValue === "true" || String(moduleActionValue).toLowerCase() === "true") {
                  return true;
                }
                if (moduleActionValue === false || moduleActionValue === "false" || String(moduleActionValue).toLowerCase() === "false") {
                  return false;
                }
              }
              if (moduleAll) return true;
              return false;
            };

            setPermissions({
              canCreate: checkPermission("create"),
              canRead: checkPermission("read"),
              canUpdate: checkPermission("update"),
              canDelete: checkPermission("delete"),
            });
          } else {
            const checkPermission = (actionName) => {
              if (moduleAll) return true;
              const moduleActionValue = actions[actionName];
              if (moduleActionValue === true || moduleActionValue === "true" || String(moduleActionValue).toLowerCase() === "true") {
                return true;
              }
              if (moduleActionValue === false || moduleActionValue === "false" || String(moduleActionValue).toLowerCase() === "false") {
                return false;
              }
              return false;
            };

            setPermissions({
              canCreate: checkPermission("create"),
              canRead: checkPermission("read"),
              canUpdate: checkPermission("update"),
              canDelete: checkPermission("delete"),
            });
          }
        } else {
          setPermissions({
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
          });
        }
      } else {
        setPermissions({
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
        });
      }
    } catch (error) {
      console.error("Error fetching clinic permissions for Add Expense:", error);
      setPermissions({
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
      });
    } finally {
      setPermissionsLoaded(true);
    }
  }, [isClinicContext]);

  useEffect(() => {
    fetchClinicPermissions();
  }, [fetchClinicPermissions]);

  // ---------- FETCH FUNCTIONS ----------
  const fetchPettyCash = async (query = "") => {
    const headers = getAuthHeaders();
    if (!headers) {
      console.error("Authentication required");
      return;
    }
    try {
      const res = await axios.get(
        `/api/pettycash/getpettyCash${query ? `?search=${query}` : ""}`,
        { headers }
      );
      setPettyCashList(res.data.pettyCashList);
      filterExpensesByDate(res.data.pettyCashList, selectedDate);
    } catch (error) {
      console.error("Error fetching petty cash:", error);
    }
  };

  const fetchVendors = async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      console.error("Authentication required");
      return;
    }
    try {
      const res = await axios.get("/api/vendor/get-vendors", { headers });
      if (res.data.success) {
        setVendors(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const filterExpensesByDate = (cashList, dateStr) => {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    const allExpenses = [];
    cashList.forEach((record) => {
      record.expenses.forEach((expense) => {
        const expDate = new Date(expense.date);
        if (expDate >= targetDate && expDate < nextDay) {
          allExpenses.push({
            ...expense,
            patientName: record.patientName,
            patientEmail: record.patientEmail,
          });
        }
      });
    });
    setFilteredExpenses(allExpenses);
  };

  const fetchGlobalTotals = async (dateStr) => {
    const headers = getAuthHeaders();
    if (!headers) {
      console.error("Authentication required");
      return;
    }
    try {
      const res = await axios.get(
        `/api/pettycash/getTotalAmount${dateStr ? `?date=${dateStr}` : ""}`,
        { headers }
      );
      if (res.data.success) {
        setGlobalData({
          globalAllocated: res.data.globalAllocated || 0,
          globalSpent: res.data.globalSpent || 0,
          globalRemaining: res.data.globalRemaining || 0,
          patients: res.data.patients || [],
        });
      }
    } catch (err) {
      console.error("Error fetching global totals:", err);
    }
  };

  const fetchAdminGlobalTotals = async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      console.error("Authentication required");
      return;
    }
    try {
      const res = await axios.get("/api/global-pettycash", { headers });
      if (res.data.success) {
        setAdminGlobalData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching admin global totals:", err);
    }
  };

  const fetchCurrentUser = async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      console.error("Authentication required");
      return;
    }
    try {
      const res = await axios.get("/api/staff/patient-registration", { headers });
      if (res.data.success) {
        setCurrentUser(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  useEffect(() => {
    if (isClinicContext && !permissionsLoaded) {
      return;
    }
    if (isClinicContext && !permissions.canRead) {
      setPettyCashList([]);
      setFilteredExpenses([]);
      return;
    }
    fetchPettyCash();
    fetchGlobalTotals(selectedDate);
    fetchVendors();
    fetchCurrentUser();
  }, [permissionsLoaded, permissions.canRead, isClinicContext]);

  useEffect(() => {
    if (currentUser.role && ["admin", "super admin"].includes(currentUser.role.toLowerCase())) {
      fetchAdminGlobalTotals(); // Refetch when user role changes (for admin-only sections)
    }
  }, [currentUser.role]);

  useEffect(() => {
    fetchGlobalTotals(selectedDate);
    if (currentUser.role && ["admin", "super admin"].includes(currentUser.role.toLowerCase())) {
      fetchAdminGlobalTotals(); // Refresh admin global amounts when date changes
    }
    filterExpensesByDate(pettyCashList, selectedDate);
  }, [selectedDate]);

  // ---------- INPUT HANDLERS ----------
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleExpenseChange = (e) =>
    setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });

  const handleManualPettyCashChange = (e) =>
    setManualPettyCashForm({ ...manualPettyCashForm, [e.target.name]: e.target.value });

  const handleAmountChange = (index, value) => {
    const updated = [...form.allocatedAmounts];
    updated[index] = value;
    setForm({ ...form, allocatedAmounts: updated });
  };

  const addAmountField = () =>
    setForm({ ...form, allocatedAmounts: [...form.allocatedAmounts, ""] });

  // ---------- FILE INPUT HANDLERS WITH PREVIEWS ----------
  const handlePettyFilesChange = (e) => {
    const filesArray = Array.from(e.target.files || []);
    const previews = filesArray.map((file) => ({ url: URL.createObjectURL(file), file }));
    setForm({ ...form, receipts: filesArray });
    setPettyPreviews(previews);
  };

  const removePettyPreviewAt = (index) => {
    const newPreviews = pettyPreviews.filter((_, i) => i !== index);
    const newFiles = (form.receipts || []).filter((_, i) => i !== index);
    setPettyPreviews(newPreviews);
    setForm({ ...form, receipts: newFiles });
  };

  const handleExpenseFilesChange = (e) => {
    const filesArray = Array.from(e.target.files || []);
    const previews = filesArray.map((file) => ({ url: URL.createObjectURL(file), file }));
    setExpenseForm({ ...expenseForm, receipts: filesArray });
    setExpensePreviews(previews);
  };

  const removeExpensePreviewAt = (index) => {
    const newPreviews = expensePreviews.filter((_, i) => i !== index);
    const newFiles = (expenseForm.receipts || []).filter((_, i) => i !== index);
    setExpensePreviews(newPreviews);
    setExpenseForm({ ...expenseForm, receipts: newFiles });
  };

  const handleManualPettyFilesChange = (e) => {
    const filesArray = Array.from(e.target.files || []);
    const previews = filesArray.map((file) => ({ url: URL.createObjectURL(file), file }));
    setManualPettyCashForm({ ...manualPettyCashForm, receipts: filesArray });
    setManualPettyPreviews(previews);
  };

  const removeManualPettyPreviewAt = (index) => {
    const newPreviews = manualPettyPreviews.filter((_, i) => i !== index);
    const newFiles = (manualPettyCashForm.receipts || []).filter((_, i) => i !== index);
    setManualPettyPreviews(newPreviews);
    setManualPettyCashForm({ ...manualPettyCashForm, receipts: newFiles });
  };

  // ---------- CLOUDINARY UPLOAD ----------
  const uploadToCloudinary = async (files) => {
    if (!files?.length) return [];
    const uploadedUrls = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      );

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
        { method: "POST", body: formData }
      );

      const data = await res.json();
      if (data.secure_url) uploadedUrls.push(data.secure_url);
    }

    return uploadedUrls;
  };

  // ---------- SUBMIT ALLOCATED (PETTY CASH) ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isClinicContext) {
      if (editMode && editType === "allocated" && !permissions.canUpdate) {
        alert("You do not have permission to update expenses");
        return;
      }
      if (!editMode && !permissions.canCreate) {
        alert("You do not have permission to create expenses");
        return;
      }
    }
    
    try {
      setIsSubmittingPetty(true);
      // Build multipart FormData to match API (multer with bodyParser disabled)
      const formData = new FormData();
      formData.append("patientName", form.patientName);
      formData.append("patientEmail", form.patientEmail);
      formData.append("patientPhone", form.patientPhone);
      formData.append("note", form.note || "");
      formData.append(
        "allocatedAmounts",
        JSON.stringify(form.allocatedAmounts.filter((a) => a !== ""))
      );

      if (Array.isArray(form.receipts) && form.receipts.length > 0) {
        form.receipts.forEach((file) => formData.append("receipts", file));
      }

      if (editMode && editType === "allocated") {
        // Update existing allocated amount. If new files selected, upload and include receipts
        let receiptsForUpdate = [];
        const hasNewFiles = Array.isArray(form.receipts) && form.receipts.length > 0 && form.receipts[0] instanceof File;
        if (hasNewFiles) {
          receiptsForUpdate = await uploadToCloudinary(form.receipts);
        } else if (Array.isArray(form.receipts)) {
          receiptsForUpdate = form.receipts; // assume they are urls
        }

        const headers = getAuthHeaders();
        if (!headers) {
          alert("Authentication required. Please login again.");
          setIsSubmittingPetty(false);
          return;
        }
        await axios.put(
          "/api/pettycash/update",
          {
            id: editingId,
            type: "allocated",
            data: {
              newAmount: Number(form.allocatedAmounts[0]),
              receipts: receiptsForUpdate,
              note: form.note,
            },
          },
          { headers }
        );
      } else {
        // Add new via multipart
        const headers = getAuthHeaders();
        if (!headers) {
          alert("Authentication required. Please login again.");
          setIsSubmittingPetty(false);
          return;
        }
        await axios.post("/api/pettycash/add", formData, {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setEditMode(false);
      setEditingId(null);
      setForm({
        patientName: "",
        patientEmail: "",
        patientPhone: "",
        note: "",
        allocatedAmounts: [""],
        receipts: [],
      });
      setPettyPreviews([]);
      fetchPettyCash();
      fetchGlobalTotals(selectedDate);
      if (currentUser.role && ["admin", "super admin"].includes(currentUser.role.toLowerCase())) {
        fetchAdminGlobalTotals(); // Update admin global totals section
      }
      // Close modal on success
      setShowPettyModal(false);
      alert(editMode ? "Record updated successfully!" : "Petty Cash added!");
    } catch (err) {
      console.error("Error submitting petty cash:", err);
      alert(err.response?.data?.message || "Something went wrong!");
    } finally {
      setIsSubmittingPetty(false);
    }
  };

  // ---------- SUBMIT MANUAL PETTY CASH ----------
  const handleManualPettyCashSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmittingManualPetty(true);
      // Build multipart FormData for manual petty cash addition
      const formData = new FormData();
      formData.append("note", manualPettyCashForm.note || "");
      formData.append("amount", String(manualPettyCashForm.amount));

      if (manualPettyCashForm.receipts && manualPettyCashForm.receipts.length > 0) {
        manualPettyCashForm.receipts.forEach((file) => formData.append("receipts", file));
      }

      const headers = getAuthHeaders();
      if (!headers) {
        alert("Authentication required. Please login again.");
        setIsSubmittingManualPetty(false);
        return;
      }
      await axios.post("/api/pettycash/add-manual", formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });

      // Reset form
      setManualPettyCashForm({ note: "", amount: "", receipts: [] });
      setManualPettyPreviews([]);
      fetchPettyCash();
      fetchGlobalTotals(selectedDate);
      if (currentUser.role && ["admin", "super admin"].includes(currentUser.role.toLowerCase())) {
        fetchAdminGlobalTotals(); // Update admin global totals section
      }
      setShowManualPettyModal(false);
      alert("Manual Petty Cash added successfully!");
    } catch (err) {
      console.error("Error submitting manual petty cash:", err);
      alert("Error: " + (err.response?.data?.message || "Something went wrong"));
    } finally {
      setIsSubmittingManualPetty(false);
    }
  };

  // ---------- SUBMIT EXPENSE ----------
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    
    if (isClinicContext) {
      if (expenseForm.expenseId && !permissions.canUpdate) {
        alert("You do not have permission to update expenses");
        return;
      }
      if (!expenseForm.expenseId && !permissions.canCreate) {
        alert("You do not have permission to create expenses");
        return;
      }
    }
    
    try {
      setIsSubmittingExpense(true);
      // For edit mode, continue using JSON update API
      if (editMode && editType === "expense") {
        const hasNewFiles =
          expenseForm.receipts &&
          expenseForm.receipts instanceof FileList &&
          expenseForm.receipts.length > 0;

        let receiptsForUpdate = [];
        if (hasNewFiles) {
          receiptsForUpdate = await uploadToCloudinary(expenseForm.receipts);
        } else if (Array.isArray(expenseForm.receipts)) {
          receiptsForUpdate = expenseForm.receipts;
        }

        const headers = getAuthHeaders();
        if (!headers) {
          alert("Authentication required. Please login again.");
          setIsSubmittingExpense(false);
          return;
        }
        await axios.put(
          "/api/pettycash/update",
          {
            id: editingId, // pettyCash id
            type: "expense",
            data: {
              expenseId: expenseForm.expenseId,
              description: expenseForm.description,
              spentAmount: Number(expenseForm.spentAmount),
              receipts: receiptsForUpdate,
            },
          },
          { headers }
        );
      } else {
        // Build multipart form-data for API (no pettyCashId; backend will use general record)
        const formData = new FormData();
        formData.append("description", expenseForm.description);
        formData.append("spentAmount", String(expenseForm.spentAmount));
        formData.append("vendor", expenseForm.vendor || "");

        if (expenseForm.receipts) {
          if (Array.isArray(expenseForm.receipts)) {
            expenseForm.receipts.forEach((file) => formData.append("receipts", file));
          } else if (expenseForm.receipts instanceof FileList) {
            Array.from(expenseForm.receipts).forEach((file) => formData.append("receipts", file));
          }
        }

        const headers = getAuthHeaders();
        if (!headers) {
          alert("Authentication required. Please login again.");
          setIsSubmittingExpense(false);
          return;
        }
        await axios.post("/api/pettycash/add-expense", formData, {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      // ✅ Reset form properly
      setExpenseForm({ description: "", spentAmount: "", receipts: [] });
      setEditMode(false);
      setEditingId(null);
      fetchPettyCash();
      fetchGlobalTotals(selectedDate);
      if (currentUser.role && ["admin", "super admin"].includes(currentUser.role.toLowerCase())) {
        fetchAdminGlobalTotals(); // Update admin global totals section
      }
      // Close modal on success
      setShowExpenseModal(false);
      alert(editMode ? "Expense updated successfully!" : "Expense added!");
    } catch (err) {
      console.error("Error updating expense:", err);
      alert("Error: " + (err.response?.data?.message || "Something went wrong"));
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // ---------- SEARCH ----------
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchPettyCash(value);
  };

  // ---------- FILTER RECORDS ----------
  const getFilteredPettyCashRecords = () => {
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    // Only show records that have allocated amounts (petty cash added), not expenses
    return pettyCashList.filter((record) => {
      const hasAllocations = record.allocatedAmounts.some((alloc) => {
        const allocDate = new Date(alloc.date);
        return allocDate >= targetDate && allocDate < nextDay;
      });
      return hasAllocations; // Only show if it has allocated amounts
    });
  };

  const filteredRecords = getFilteredPettyCashRecords();

  // ---------- DELETE ----------
  const handleDeletePatient = async (pettyCashId) => {
    if (isClinicContext && !permissions.canDelete) {
      alert("You do not have permission to delete expenses");
      return;
    }
    if (!confirm("Are you sure you want to delete this patient record?")) return;
    const headers = getAuthHeaders();
    if (!headers) {
      alert("Authentication required. Please login again.");
      return;
    }
    try {
      await axios.delete("/api/pettycash/delete-pattycash", {
        headers,
        data: { type: "patient", pettyCashId },
      });
      fetchPettyCash();
      fetchGlobalTotals(selectedDate);
      if (currentUser.role && ["admin", "super admin"].includes(currentUser.role.toLowerCase())) {
        fetchAdminGlobalTotals(); // Update admin global totals section
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error deleting patient");
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (isClinicContext && !permissions.canDelete) {
      alert("You do not have permission to delete expenses");
      return;
    }
    if (pettyCashList.length === 0) return;
    const pettyCashId = pettyCashList[0]._id;
    if (!confirm("Delete this expense?")) return;

    const headers = getAuthHeaders();
    if (!headers) {
      alert("Authentication required. Please login again.");
      return;
    }
    try {
      await axios.delete("/api/pettycash/delete-pattycash", {
        headers,
        data: { type: "expense", pettyCashId, expenseId },
      });
      fetchPettyCash();
      fetchGlobalTotals(selectedDate);
      if (currentUser.role && ["admin", "super admin"].includes(currentUser.role.toLowerCase())) {
        fetchAdminGlobalTotals(); // Update admin global totals section
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error deleting expense");
    }
  };

  // ---------- EDIT ----------
  const handleEdit = (item, type, pettyCashId = null) => {
    if (isClinicContext && !permissions.canUpdate) {
      alert("You do not have permission to update expenses");
      return;
    }
    setEditMode(true);
    setEditType(type);

    if (type === "allocated") {
      setEditingId(item._id);
      setForm({
        patientName: item.patientName,
        patientEmail: item.patientEmail,
        patientPhone: item.patientPhone,
        note: item.note,
        allocatedAmounts: [item.allocatedAmounts?.[0]?.amount || ""],
        receipts: item.allocatedAmounts?.[0]?.receipts || [],
      });
      // Open petty cash modal for editing allocated amount
      setShowPettyModal(true);
    } else if (type === "expense") {
      // ✅ Validation: Find parent if not provided
      if (!pettyCashId) {
        const parent = pettyCashList.find(record =>
          record.expenses.some(e => e._id === item._id)
        );
        pettyCashId = parent?._id;
      }

      if (!pettyCashId) {
        alert("Error: Could not find parent record for this expense");
        return;
      }

      setEditingId(pettyCashId); // 👈 set parent pettyCash _id
      setExpenseForm({
        expenseId: item._id, // 👈 store expense id separately
        description: item.description || "",
        spentAmount: item.spentAmount || "",
        receipts: item.receipts || [],
      });
      setExpenseReceiptUrls(item.receipts || []);
      // Open expense modal for editing
      setShowExpenseModal(true);
    }
  };


  // Show loading state while checking permissions
  if (isClinicContext && !permissionsLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-sm text-gray-700">Checking your permissions...</p>
        </div>
      </div>
    );
  }

  // Show access denied if no read permission
  if (isClinicContext && permissionsLoaded && !permissions.canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 text-2xl">
            !
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You do not have permission to view or manage expenses. Please contact your administrator if you believe this is incorrect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${toast.tone === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white animate-fade-in`}>
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Petty Cash Management</h2>
            <div className="flex flex-wrap gap-2">
              {(!isClinicContext || permissions.canCreate) && (
                <>
                  <button onClick={() => setShowExpenseModal(true)} className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">+ Expense</button>
                  <button onClick={() => setShowManualPettyModal(true)} className="flex-1 sm:flex-initial px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium">+ Petty Cash</button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-sm p-4 sm:p-6 mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Staff Totals - {selectedDate}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-sm text-gray-700 mb-1">Allocated</div>
              <div className="text-2xl font-bold text-blue-600">د.إ{globalData.globalAllocated}</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-sm text-gray-700 mb-1">Spent</div>
              <div className="text-2xl font-bold text-red-600">د.إ{globalData.globalSpent}</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-sm text-gray-700 mb-1">Remaining</div>
              <div className="text-2xl font-bold text-green-600">د.إ{globalData.globalRemaining || 0}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-gray-800 font-medium text-sm whitespace-nowrap">Date:</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="flex-1 border border-gray-300 px-3 py-2 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <input type="text" value={search} onChange={handleSearch} placeholder="Search by name or email..." className="flex-1 border border-gray-300 px-3 py-2 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        {/* Expense Modal */}
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">{editMode ? 'Edit Expense' : 'Add Expense'}</h3>
                <button onClick={() => {
                  setShowExpenseModal(false);
                  setExpensePreviews([]);
                  setExpenseForm({ description: "", spentAmount: "", vendor: "", receipts: [] });
                }} className="text-gray-700 hover:text-gray-900">✕</button>
              </div>
              <form onSubmit={handleExpenseSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-gray-800 font-medium mb-2 text-sm">Vendor (Optional)</label>
                  <select name="vendor" value={expenseForm.vendor} onChange={handleExpenseChange} className="w-full border border-gray-300 px-3 py-2 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-800 font-medium mb-2 text-sm">Description *</label>
                  <input type="text" name="description" value={expenseForm.description} onChange={handleExpenseChange} className="w-full border border-gray-300 px-3 py-2 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-gray-800 font-medium mb-2 text-sm">Amount *</label>
                  <input type="number" name="spentAmount" value={expenseForm.spentAmount} onChange={handleExpenseChange} className="w-full border border-gray-300 px-3 py-2 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-gray-800 font-medium mb-2 text-sm">Receipts</label>
                  <input type="file" multiple onChange={handleExpenseFilesChange} className="w-full border border-gray-300 px-3 py-2 rounded-lg text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                {expensePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {expensePreviews.map((p, i) => (
                      <div key={i} className="relative group">
                        <img src={p.url} alt="" className="w-full h-20 object-cover rounded-lg border" />
                        <button type="button" onClick={() => removeExpensePreviewAt(i)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                      </div>
                    ))}
                  </div>
                )}
                {editMode && expenseReceiptUrls?.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {expenseReceiptUrls.map((url, i) => (
                      <a key={i} href={url.url || url} target="_blank" rel="noopener noreferrer">
                        <img src={url.url || url} alt="" className="w-full h-20 object-cover rounded-lg border hover:opacity-80 transition" />
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={isSubmittingExpense} className={`flex-1 py-2.5 rounded-lg font-medium transition ${isSubmittingExpense ? 'bg-green-400 cursor-not-allowed text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                    {isSubmittingExpense ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" disabled={isSubmittingExpense} onClick={() => {
                    setShowExpenseModal(false);
                    setExpensePreviews([]);
                    setExpenseForm({ description: "", spentAmount: "", vendor: "", receipts: [] });
                  }} className={`px-6 py-2.5 rounded-lg font-medium transition ${isSubmittingExpense ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manual Petty Cash Modal */}
        {showManualPettyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Add Petty Cash</h3>
                <button onClick={() => {
                  setShowManualPettyModal(false);
                  setManualPettyPreviews([]);
                  setManualPettyCashForm({ note: "", amount: "", receipts: [] });
                }} className="text-gray-700 hover:text-gray-900">✕</button>
              </div>
              <form onSubmit={handleManualPettyCashSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-gray-800 font-medium mb-2 text-sm">Note *</label>
                  <textarea name="note" value={manualPettyCashForm.note} onChange={handleManualPettyCashChange} className="w-full border border-gray-300 px-3 py-2 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 h-24" required />
                </div>
                <div>
                  <label className="block text-gray-800 font-medium mb-2 text-sm">Amount *</label>
                  <input type="number" name="amount" value={manualPettyCashForm.amount} onChange={handleManualPettyCashChange} className="w-full border border-gray-300 px-3 py-2 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500" required step="0.01" />
                </div>
                <div>
                  <label className="block text-gray-800 font-medium mb-2 text-sm">Receipts</label>
                  <input type="file" multiple onChange={handleManualPettyFilesChange} className="w-full border border-gray-300 px-3 py-2 rounded-lg text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                {manualPettyPreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {manualPettyPreviews.map((p, i) => (
                      <div key={i} className="relative group">
                        <img src={p.url} alt="" className="w-full h-20 object-cover rounded-lg border" />
                        <button type="button" onClick={() => removeManualPettyPreviewAt(i)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={isSubmittingManualPetty} className={`flex-1 py-2.5 rounded-lg font-medium transition ${isSubmittingManualPetty ? 'bg-green-400 cursor-not-allowed text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                    {isSubmittingManualPetty ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" disabled={isSubmittingManualPetty} onClick={() => {
                    setShowManualPettyModal(false);
                    setManualPettyPreviews([]);
                    setManualPettyCashForm({ note: "", amount: "", receipts: [] });
                  }} className={`px-6 py-2.5 rounded-lg font-medium transition ${isSubmittingManualPetty ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Petty Cash Modal */}
        {showPettyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">{editMode ? 'Edit Petty Cash' : 'Add Petty Cash'}</h3>
                <button onClick={() => {
                  setShowPettyModal(false);
                  setPettyPreviews([]);
                  setForm({ patientName: "", patientEmail: "", patientPhone: "", note: "", allocatedAmounts: [""], receipts: [] });
                }} className="text-gray-700 hover:text-gray-900">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-gray-800 font-medium mb-2 text-sm">Patient Name *</label>
                  <input type="text" name="patientName" value={form.patientName} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-gray-800 font-medium mb-2 text-sm">Email *</label>
                  <input type="email" name="patientEmail" value={form.patientEmail} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-gray-800 font-medium mb-2 text-sm">Phone *</label>
                  <input type="text" name="patientPhone" value={form.patientPhone} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-gray-800 font-medium mb-2 text-sm">Note</label>
                  <textarea name="note" value={form.note} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 h-20" />
                </div>
                <div>
                  <label className="block text-gray-800 font-medium mb-2 text-sm">Receipts</label>
                  <input type="file" multiple onChange={handlePettyFilesChange} className="w-full border border-gray-300 px-3 py-2 rounded-lg text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                {pettyPreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {pettyPreviews.map((p, i) => (
                      <div key={i} className="relative group">
                        <img src={p.url} alt="" className="w-full h-20 object-cover rounded-lg border" />
                        <button type="button" onClick={() => removePettyPreviewAt(i)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                      </div>
                    ))}
                  </div>
                )}
                {form.allocatedAmounts.map((amt, i) => (
                  <div key={i}>
                    <label className="block text-gray-800 font-medium mb-2 text-sm">Allocated Amount {i + 1} *</label>
                    <input type="number" value={amt} onChange={(e) => handleAmountChange(i, e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
                <button type="button" onClick={addAmountField} className="w-full border-2 border-dashed border-blue-400 text-blue-700 py-2.5 rounded-lg hover:bg-blue-50 font-medium transition">+ Add More</button>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={isSubmittingPetty} className={`flex-1 py-2.5 rounded-lg font-medium transition ${isSubmittingPetty ? 'bg-blue-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                    {isSubmittingPetty ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" disabled={isSubmittingPetty} onClick={() => {
                    setShowPettyModal(false);
                    setPettyPreviews([]);
                    setForm({ patientName: "", patientEmail: "", patientPhone: "", note: "", allocatedAmounts: [""], receipts: [] });
                  }} className={`px-6 py-2.5 rounded-lg font-medium transition ${isSubmittingPetty ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Petty Cash Records Table */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Petty Cash Records - {selectedDate}</h3>
          {filteredRecords.length === 0 ? (
            <p className="text-gray-700 text-center py-8">No records found</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-800">Patient</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-800">Contact</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-800">Allocated</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-800">Receipts</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-800">Note</th>
                    {isTodaySelected && <th className="px-3 py-3 text-center text-xs font-bold text-gray-800">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRecords.map((item) => {
                    const targetDate = new Date(selectedDate);
                    targetDate.setHours(0, 0, 0, 0);
                    const nextDay = new Date(targetDate);
                    nextDay.setDate(targetDate.getDate() + 1);
                    const allocForDate = item.allocatedAmounts.filter((alloc) => {
                      const allocDate = new Date(alloc.date);
                      return allocDate >= targetDate && allocDate < nextDay;
                    });
                    return (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm">
                          <div className="font-medium text-gray-800">{item.patientName}</div>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <div className="text-gray-700">{item.patientEmail}</div>
                          <div className="text-gray-700 text-xs">{item.patientPhone}</div>
                        </td>
                        <td className="px-3 py-3 text-center text-sm">
                          {allocForDate.length > 0 ? allocForDate.map((a, i) => <div key={i} className="font-semibold text-gray-800">د.إ{a.amount}</div>) : <span className="text-gray-700">-</span>}
                        </td>
                        <td className="px-3 py-3 text-center text-sm">
                          {allocForDate.some((a) => a.receipts?.length > 0) ? allocForDate.map((a) => a.receipts?.map((r, i) => <a key={i} href={r.url || r} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline text-xs">View {i + 1}</a>)) : <span className="text-gray-700">-</span>}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700">{item.note || "-"}</td>
                        {isTodaySelected && (
                          <td className="px-3 py-3 text-center">
                            {(!isClinicContext || permissions.canUpdate) && (
                              <button onClick={() => handleEdit(item, "allocated")} className="text-blue-600 hover:text-blue-800 mr-3 text-lg">✏️</button>
                            )}
                            {(!isClinicContext || permissions.canDelete) && (
                              <button onClick={() => {
                                if (confirm('Delete this record?')) handleDeletePatient(item._id);
                              }} className="text-red-600 hover:text-red-800 text-lg">🗑️</button>
                            )}
                            {isClinicContext && !permissions.canUpdate && !permissions.canDelete && (
                              <span className="text-xs text-gray-400">No actions</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Expenses - {selectedDate}</h3>
          {filteredExpenses.length === 0 ? (
            <p className="text-gray-700 text-center py-8">No expenses found</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-800">Description</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-800">Amount</th>
                    {isTodaySelected && <th className="px-3 py-3 text-center text-xs font-bold text-gray-800">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredExpenses.map((ex) => (
                    <tr key={ex._id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm">
                        <div className="font-medium text-gray-800">{ex.description}</div>
                        {ex.vendorName && <div className="text-xs text-gray-700 mt-1">Vendor: {ex.vendorName}</div>}
                        {ex.receipts?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {ex.receipts.map((r, i) => <a key={i} href={r.url || r} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">Receipt {i + 1}</a>)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="font-bold text-gray-800 text-sm">د.إ{ex.spentAmount}</span>
                      </td>
                      {isTodaySelected && (
                        <td className="px-3 py-3 text-center">
                          {(!isClinicContext || permissions.canUpdate) && (
                            <button onClick={() => handleEdit(ex, "expense")} className="text-blue-600 hover:text-blue-800 mr-3 text-lg">✏️</button>
                          )}
                          {(!isClinicContext || permissions.canDelete) && (
                            <button onClick={() => {
                              if (confirm('Delete this expense?')) handleDeleteExpense(ex._id);
                            }} className="text-red-600 hover:text-red-800 text-lg">🗑️</button>
                          )}
                          {isClinicContext && !permissions.canUpdate && !permissions.canDelete && (
                            <span className="text-xs text-gray-400">No actions</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Staff Totals */}
      

        {/* Admin Global Totals */}
        {currentUser.role && ["admin", "super admin"].includes(currentUser.role.toLowerCase()) && (
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🌐 Global Totals (All Staff)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-xs sm:text-sm text-gray-700 mb-1">Global Amount</div>
                <div className="text-xl sm:text-2xl font-bold text-purple-600">د.إ{adminGlobalData.globalAmount}</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-xs sm:text-sm text-gray-700 mb-1">Total Allocated</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">د.إ{adminGlobalData.totalAllocated}</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-xs sm:text-sm text-gray-700 mb-1">Total Spent</div>
                <div className="text-xl sm:text-2xl font-bold text-red-600">د.إ{adminGlobalData.totalSpent}</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-xs sm:text-sm text-gray-700 mb-1">Total Staff</div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">{adminGlobalData.totalStaff}</div>
              </div>
            </div>
            {adminGlobalData.lastUpdated && <div className="text-xs text-gray-700 text-center mt-3">Updated: {new Date(adminGlobalData.lastUpdated).toLocaleString()}</div>}
          </div>
        )}
      </div>

      <style jsx>{`
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in { animation: fade-in 0.3s ease-out; }
    `}</style>
    </div>
  );
}

// Define layout function
PettyCashAndExpense.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// Apply HOC
const ProtectedDashboard = withClinicAuth(PettyCashAndExpense);

// Reassign layout
ProtectedDashboard.getLayout = PettyCashAndExpense.getLayout;

export default ProtectedDashboard;