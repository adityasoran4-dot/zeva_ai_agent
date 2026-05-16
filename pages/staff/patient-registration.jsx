'use client';
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, User, FileText, AlertCircle, Search, CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";
import withClinicAuth from '../../components/withStaffAuth';
import { useRouter } from "next/router";

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

const COUNTRY_CODES = [
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "+7", name: "Russia", flag: "🇷🇺" },
  { code: "+7", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "+30", name: "Greece", flag: "🇬🇷" },
  { code: "+31", name: "Netherlands", flag: "🇳🇱" },
  { code: "+32", name: "Belgium", flag: "🇧🇪" },
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "+40", name: "Romania", flag: "🇷🇴" },
  { code: "+41", name: "Switzerland", flag: "🇨🇭" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+45", name: "Denmark", flag: "🇩🇰" },
  { code: "+46", name: "Sweden", flag: "🇸🇪" },
  { code: "+47", name: "Norway", flag: "🇳🇴" },
  { code: "+48", name: "Poland", flag: "🇵🇱" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+52", name: "Mexico", flag: "🇲🇽" },
  { code: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "+63", name: "Philippines", flag: "🇵🇭" },
  { code: "+64", name: "New Zealand", flag: "🇳🇿" },
  { code: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "+66", name: "Thailand", flag: "🇹🇭" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "+82", name: "South Korea", flag: "🇰🇷" },
  { code: "+84", name: "Vietnam", flag: "🇻🇳" },
  { code: "+86", name: "China", flag: "🇨🇳" },
  { code: "+90", name: "Turkey", flag: "🇹🇷" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+92", name: "Pakistan", flag: "🇵🇰" },
  { code: "+93", name: "Afghanistan", flag: "🇦🇫" },
  { code: "+94", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "+95", name: "Myanmar", flag: "🇲🇲" },
  { code: "+98", name: "Iran", flag: "🇮🇷" },
  { code: "+971", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+972", name: "Israel", flag: "🇮🇱" },
  { code: "+973", name: "Bahrain", flag: "🇧🇭" },
  { code: "+974", name: "Qatar", flag: "🇶🇦" },
  { code: "+975", name: "Bhutan", flag: "🇧🇹" },
  { code: "+976", name: "Mongolia", flag: "🇲🇳" },
  { code: "+977", name: "Nepal", flag: "🇳🇵" },
  { code: "+880", name: "Bangladesh", flag: "🇧🇩" },
  { code: "+994", name: "Azerbaijan", flag: "🇦🇿" },
  { code: "+996", name: "Kyrgyzstan", flag: "🇰🇬" },
];

// Country + Phone input with searchable dropdown
const CountryPhoneInput = ({ countryCode, phone, onCountryChange, onPhoneChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.code.replace("+","").includes(q)
    );
  }, [query]);
  const selected = useMemo(() => COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES.find(c => c.code === "+971"), [countryCode]);
  
  // Extract local number (without country code) for display
  const localNumber = useMemo(() => {
    if (!phone) return '';
    if (phone.startsWith(countryCode)) {
      return phone.slice(countryCode.length);
    }
    // If it doesn't start with country code, return as is
    return phone.replace(/^\+\d+/, '');
  }, [phone, countryCode]);
  
  return (
    <div className="relative w-full">
      <div className={`flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-teal-600`}>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 px-2 py-1 bg-gray-50 hover:bg-gray-100 focus:outline-none"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="text-lg leading-none">{selected?.flag || "🏳️"}</span>
          <span className="text-[11px] text-gray-800">{selected?.code || "+971"}</span>
          <svg className="w-3 h-3 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z"/></svg>
        </button>
        <input
          type="tel"
          value={localNumber}
          onChange={e => onPhoneChange(e.target.value)}
          maxLength={15}
          inputMode="numeric"
          className="flex-1 px-2 py-1 text-[10px] focus:outline-none"
          placeholder="Enter mobile number"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search country or code"
              className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-600"
            />
          </div>
          <ul role="listbox">
            {options.map((c, idx) => (
              <li
                key={`${c.code}-${c.name}-${idx}`}
                role="option"
                onClick={() => {
                  onCountryChange(c.code);
                  setOpen(false);
                }}
                className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-50 ${c.code === selected?.code ? 'bg-teal-50' : ''}`}
              >
                <span className="text-lg leading-none">{c.flag}</span>
                <span className="text-[11px] text-gray-800 flex-1">{c.name}</span>
                <span className="text-[11px] text-gray-600">{c.code}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const INITIAL_FORM_DATA = {
  invoiceNumber: "", emrNumber: "", firstName: "", lastName: "", email: "",
  mobileNumber: "", countryCode: "+91", gender: "", patientType: "New", referredBy: "No"
};

const InvoiceManagementSystem = ({ onSuccess, isCompact = false, onCancel }) => {
  const [currentUser, setCurrentUser] = useState({ name: "", role: "" });
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [usedEMRNumbers] = useState(() => new Set());
  const [fetching, setFetching] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null });
  const [referrals, setReferrals] = useState([]);
  const [autoFields, setAutoFields] = useState({
    invoiceDate: "",
    invoiceTime: "",
    invoiceNumber: "",
    emrNumber: "",
    invoicedBy: ""
  });
  
  // Invoice Number Generation
  const generateInvoiceNumber = useCallback(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
  }, []);

  // Toast functions
  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const date = new Date();
    const invDate = date.toISOString().split('T')[0];
    const invTime = date.toTimeString().slice(0, 5);
    const invNumber = generateInvoiceNumber();
    setAutoFields(prev => ({
      ...prev,
      invoiceDate: invDate,
      invoiceTime: invTime,
      invoiceNumber: invNumber
    }));
    setFormData(prev => ({ ...prev, invoiceNumber: invNumber }));

    // Fetch user profile to set invoicedBy
    const token = getStoredToken();
    if (token) {
      const headers = getAuthHeaders();
      if (headers) {
        fetch("/api/user/profile", { headers })
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.user) {
              const user = d.user;
              setCurrentUser(user);
              const displayName = `${(user.firstName || "").trim()} ${(user.lastName || "").trim()}`.trim() || user.email || "Unknown";
              setAutoFields(prev => ({ ...prev, invoicedBy: displayName }));
            }
          })
          .catch(() => {
            // ignore errors for invoicedBy
          });
      }
    }
  }, [generateInvoiceNumber]);

  // Generate EMR number on component mount or when EMR is empty
  useEffect(() => {
    if (!formData.emrNumber) {
      const token = getStoredToken();
      if (token) {
        const headers = getAuthHeaders();
        if (headers) {
          fetch("/api/clinic/patient-registration?generateEmr=true", { headers })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.emrNumber) {
                setFormData(prev => ({ ...prev, emrNumber: data.emrNumber }));
              }
            })
            .catch(error => {
              console.error("Error fetching EMR number:", error);
              // Fallback: generate locally
              const fallbackEmr = `EMR-${Date.now()}`;
              setFormData(prev => ({ ...prev, emrNumber: fallbackEmr }));
            });
        }
      }
    }
  }, []);

  // Fetch referrals
  useEffect(() => {
    const headers = getAuthHeaders();
    if (!headers) return;
    const fetchLists = async () => {
      try {
        const rRes = await fetch("/api/clinic/referrals", { headers });
        const rData = await rRes.json();
        if (rData.success && Array.isArray(rData.referrals)) {
          setReferrals(rData.referrals);
        }
      } catch {
        // silent fail to avoid blocking registration
      }
    };
    fetchLists();
  }, []);

  // Auto-generate EMR number when modal opens - via API
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const currentPath = window.location.pathname || "";
    const isClinicRoute = currentPath.startsWith('/clinic/');
    const isStaffRoute = currentPath.startsWith('/staff/');
    const isClinicPatientRegistration = currentPath.includes('clinic-patient-registration');
    
    // Get user role to verify it's a valid role
    const getUserRole = () => {
      if (typeof window === "undefined") return null;
      try {
        const TOKEN_PRIORITY = ["clinicToken", "doctorToken", "agentToken", "userToken", "adminToken"];
        for (const key of TOKEN_PRIORITY) {
          const token = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              return payload.role || null;
            } catch (e) {
              continue;
            }
          }
        }
      } catch (error) {
        console.error("Error getting user role:", error);
      }
      return null;
    };
    
    const userRole = getUserRole();
    // Allow EMR generation for clinic, doctor, agent, and doctorStaff roles
    const isValidRole = userRole === "clinic" || userRole === "doctor" || userRole === "agent" || userRole === "doctorStaff";
    
    // Determine if EMR should be generated:
    // 1. Clinic route with valid role, OR
    // 2. Staff route accessing clinic-patient-registration with agent/doctorStaff role
    const shouldGenerateEMR = 
      (isClinicRoute && isValidRole) || 
      (isStaffRoute && isClinicPatientRegistration && (userRole === "agent" || userRole === "doctorStaff"));
    
    if (shouldGenerateEMR && isCompact && !formData.emrNumber) {
      const headers = getAuthHeaders();
      if (headers) {
        fetch("/api/clinic/generate-emr", { headers })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.emrNumber) {
              setFormData(prev => ({ ...prev, emrNumber: data.emrNumber }));
            } else {
              const fallbackEmr = `EMR-${Date.now()}`;
              setFormData(prev => ({ ...prev, emrNumber: fallbackEmr }));
            }
          })
          .catch(() => {
            const fallbackEmr = `EMR-${Date.now()}`;
            setFormData(prev => ({ ...prev, emrNumber: fallbackEmr }));
          });
      }
    }
  }, [isCompact]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Country code
    if (name === "countryCode") {
      setFormData(prev => ({ ...prev, countryCode: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
      return;
    }

    // Handle mobileNumber - digits and leading + only, max 15
    if (name === "mobileNumber") {
      const sanitized = value.replace(/[^\d+]/g, '').slice(0, 15);
      setFormData(prev => ({ ...prev, [name]: sanitized }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
      return;
    }

    // Handle referredBy - set to "No" if empty
    const finalValue = (name === "referredBy" && value === "") ? "No" : value;
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  }, [errors]);

  const fetchEMRData = useCallback(async () => {
    if (!formData.emrNumber.trim()) {
      showToast("Please enter an EMR Number", "warning");
      return;
    }

    try {
      setFetching(true);
      const headers = getAuthHeaders();
      if (!headers) {
        showToast("Authentication required. Please login again.", "error");
        setFetching(false);
        return;
      }
      const res = await fetch(`/api/staff/patient-registration/${formData.emrNumber}`, { headers });
      const data = await res.json();

        if (res.ok && data.success && data.data) {
          const f = data.data;
          setFormData(prev => ({
            ...prev,
            firstName: f.firstName || "",
            lastName: f.lastName || "",
            email: f.email || "",
            mobileNumber: f.mobileNumber || "",
            gender: f.gender || "",
            patientType: f.patientType || "New",
            referredBy: f.referredBy || "No"
          }));
        showToast("Patient details loaded successfully", "success");
      } else {
        showToast("Patient not found. Fill details manually", "warning");
      }
    } catch {
      showToast("Failed to fetch patient data", "error");
    } finally {
      setFetching(false);
    }
  }, [formData.emrNumber, showToast]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    const { emrNumber, firstName, lastName, email, mobileNumber, gender, patientType } = formData;
    
    if (!emrNumber.trim()) newErrors.emrNumber = "Required";
    else if (usedEMRNumbers.has(emrNumber)) newErrors.emrNumber = "Already exists";

    // Only First Name and Mobile Number are mandatory
    if (!firstName.trim()) newErrors.firstName = "Required";
    if (!mobileNumber.trim()) newErrors.mobileNumber = "Required";
    
    // Optional fields validation if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, usedEMRNumbers, isCompact]);

  const router = useRouter();

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      showToast("Please fix validation errors", "error");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Save",
      message: "Are you sure you want to Register this patient? Please verify all details are correct.",
      type: "info",
      action: async () => {
        try {
          const headers = getAuthHeaders();
          if (!headers) {
            showToast("Authentication required. Please login again.", "error");
            setConfirmModal({ isOpen: false, action: null });
            return;
          }
          
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          const isClinicRoute = currentPath.startsWith('/clinic/');
          const isClinicPatientRegistration = currentPath.includes('clinic-patient-registration');
          const apiEndpoint = (isClinicRoute || isClinicPatientRegistration) 
            ? "/api/clinic/patient-registration" 
            : "/api/staff/patient-registration";
          
          const res = await fetch(apiEndpoint, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json", 
              ...headers
            },
            body: JSON.stringify({ ...formData, userId: currentUser._id })
          });
          const data = await res.json();
          
          if (res.ok && data.success) {
            showToast("Registered successfully!", "success");
            resetForm();

            if (onSuccess) {
              onSuccess();
            } else {
              if (isClinicRoute) {
                router.push("/clinic/patient-registration?tab=information");
              } else {
                router.push("/staff/patient-information");
              }
            }
          } else {
            let errorMessage = "Failed to save patient";
            
            if (data.errors && Array.isArray(data.errors)) {
              errorMessage = data.errors.join(", ");
            } else if (data.message) {
              errorMessage = data.message
                .replace(/ValidationError:/gi, "")
                .replace(/mobileNumber/gi, "Phone number")
                .replace(/firstName/gi, "First name")
                .replace(/email/gi, "Email address")
                .replace(/already exists/gi, "already exists. Please check for duplicates");
            }
            
            showToast(errorMessage, "error");
          }
        } catch (error) {
          showToast("Network error. Please try again", "error");
          console.error("Submit error:", error);
        }
        setConfirmModal({ isOpen: false, action: null });
      }
    });
  }, [formData, currentUser, validateForm, showToast, router, onSuccess, isCompact]);

  const resetForm = useCallback(() => {
    setConfirmModal({
      isOpen: true,
      title: "Reset Form",
      message: "All entered data will be lost. Are you sure you want to reset?",
      type: "warning",
      action: () => {
        setFormData(INITIAL_FORM_DATA);
        setErrors({});
        showToast("Form reset successfully", "success");
        setConfirmModal({ isOpen: false, action: null });
      }
    });
  }, [showToast]);

  const canViewMobile = useMemo(() => ["Admin", "Super Admin"].includes(currentUser.role), [currentUser.role]);

  return (
    <>
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-slide-in`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : toast.type === 'error' ? <XCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="flex-1 font-medium">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="hover:bg-white/20 rounded p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmModal({ isOpen: false, action: null })} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-scale-in">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{confirmModal.title}</h3>
            <p className="text-gray-700 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal({ isOpen: false, action: null })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.action}
                className={`px-4 py-2 bg-teal-600 text-white rounded-lg hover:opacity-90 font-medium transition shadow-lg`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="w-full">
          <div className={`bg-white ${isCompact ? '' : 'rounded-2xl shadow-sm border border-gray-200'} ${isCompact ? 'p-0' : 'p-4 sm:p-6'}`}>
            {!isCompact && (
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Register New Patient</h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Quick patient entry for Zeva clinic</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (onCancel) onCancel();
                    }}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-xs sm:text-sm hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-teal-600 text-white text-xs sm:text-sm hover:bg-teal-700 transition-colors whitespace-nowrap"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <div className={`${isCompact ? '' : 'grid grid-cols-1 lg:grid-cols-3 gap-4'}`}>
              <div className={`${isCompact ? '' : 'lg:col-span-2 space-y-3'}`}>
                {/* Patient Information */}
                <div className={`bg-white rounded-lg p-3 sm:p-4 border border-gray-200`}>
                  <h2 className={`text-xs font-semibold text-gray-900 mb-3 flex items-center gap-1`}>
                    <User className={`w-3 h-3 text-gray-700`} />
                    Patient Information
                  </h2>
                  
                  {/* First Row: First Name, Last Name, Mobile Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-3">
                    {/* First Name */}
                    <div>
                      <label className={`block text-[10px] mb-1 font-medium text-gray-700`}>
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-2.5 py-1 text-sm border rounded-md focus:ring-1 focus:ring-teal-600 focus:border-teal-600 ${errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        placeholder="First name"
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-[9px] mt-1 flex items-center gap-0.5">
                          <AlertCircle className="w-2.5 h-2.5" />{errors.firstName}
                        </p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className={`block text-[10px] mb-1 font-medium text-gray-700`}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-2.5 py-1 text-sm border rounded-md focus:ring-1 focus:ring-teal-600 focus:border-teal-600 border-gray-300`}
                        placeholder="Last name"
                      />
                    </div>

                    {/* Mobile Number with Country Selector */}
                    <div>
                      <label className={`block text-[10px] mb-1 font-medium text-gray-700`}>
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <CountryPhoneInput
                        countryCode={formData.countryCode}
                        phone={formData.mobileNumber}
                        onCountryChange={(code) => {
                          setFormData(prev => {
                            let localNum = prev.mobileNumber;
                            if (localNum.startsWith(prev.countryCode)) {
                              localNum = localNum.slice(prev.countryCode.length);
                            } else {
                              localNum = localNum.replace(/^\+\d+/, '');
                            }
                            const newMobile = code + localNum;
                            return { ...prev, countryCode: code, mobileNumber: newMobile };
                          });
                        }}
                        onPhoneChange={(val) => {
                          const sanitized = val.replace(/[^\d]/g, "").slice(0, 15);
                          const fullNumber = formData.countryCode + sanitized;
                          setFormData(prev => ({ ...prev, mobileNumber: fullNumber }));
                          if (errors.mobileNumber) setErrors(prev => ({ ...prev, mobileNumber: "" }));
                        }}
                      />
                      {errors.mobileNumber && (
                        <p className="text-red-500 text-[9px] mt-1 flex items-center gap-0.5">
                          <AlertCircle className="w-2.5 h-2.5" />{errors.mobileNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Second Row: Gender, Referred By */}
                  <div className={`flex flex-col sm:flex-row sm:flex-wrap sm:gap-3 gap-2 mb-3`}>
                    {(() => {
                      const secondRowFields = [
                        { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"], required: false },
                        { name: "referredBy", label: "Referred By" }
                      ];
                      return secondRowFields;
                    })().map(field => (
                      <div key={field.name} className="w-full sm:flex-1 sm:min-w-[140px]">
                        <label className={`block text-[10px] mb-0.5 font-medium text-gray-700`}>
                          {field.label}
                        </label>
                        {field.name === "referredBy" ? (
                          <select
                            name="referredBy"
                            value={formData.referredBy === "No" ? "" : formData.referredBy}
                            onChange={handleInputChange}
                            className={`text-gray-900 w-full px-2 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-teal-600 focus:border-teal-600 ${errors.referredBy ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                          >
                            <option value="" disabled hidden>Select referral</option>
                            {referrals.map((r) => {
                              const displayName = `${(r.firstName || "").trim()} ${(r.lastName || "").trim()}`.trim() || (r.email || r.phone || "Unknown");
                              return (
                                <option key={r._id} value={displayName}>
                                  {displayName}
                                </option>
                              );
                            })}
                          </select>
                        ) : field.type === "select" ? (
                          <select
                            name={field.name}
                            value={formData[field.name] || ""}
                            onChange={handleInputChange}
                            className={`text-gray-900 w-full px-2 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-teal-600 focus:border-teal-600 ${errors[field.name] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                          >
                            <option value="">Select</option>
                            {field.options.filter(opt => opt !== "").map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {/* Email Field */}
                  <div className="mb-3">
                    <label className={`block text-[10px] mb-1 font-medium text-gray-700`}>Email (Optional)</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-2.5 py-2 text-sm border rounded-md focus:ring-1 focus:ring-teal-600 focus:border-teal-600 text-gray-900 border-gray-300"
                      placeholder="patient@email.com"
                    />
                  </div>

                  {/* EMR Number Display - Auto-generated */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 bg-teal-50 px-3 py-2 rounded-md border border-teal-200 w-full sm:w-auto">
                      <FileText className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span className="text-[10px] font-medium text-teal-800">EMR:</span>
                      <span className="text-[10px] font-bold text-teal-900">{formData.emrNumber || "EMR-—"}</span>
                      <span className="text-[9px] text-teal-600">(Auto)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Wrap the component with ClinicLayout and withClinicAuth for standalone page
const WrappedPatientRegistration = ({ isModal, ...props }) => {
  return <InvoiceManagementSystem {...props} />;
};

export default withClinicAuth(WrappedPatientRegistration);