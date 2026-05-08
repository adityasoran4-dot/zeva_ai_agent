import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, User, DollarSign, FileText, AlertCircle, Search, CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";
import ClinicLayout from '../../components/staffLayout';
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
// Toast Component
const Toast = ({ message, type, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />
  };
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500"
  };

  return (
    <div className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-slide-in`}>
      {icons[type]}
      <span className="flex-1 font-medium">{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 rounded p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map(toast => (
      <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
    ))}
  </div>
);

// Confirmation Modal
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "warning" }) => {
  if (!isOpen) return null;

  const colors = {
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    info: "bg-blue-500"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-scale-in">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 ${colors[type]} text-white rounded-lg hover:opacity-90 font-medium transition shadow-lg`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const paymentMethods = ["Cash", "Card", "BT", "Tabby", "Tamara"];

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
  mobileNumber: "", countryCode: "+91", gender: "", patientType: "New", referredBy: "No",
  insurance: "No", advanceGivenAmount: "", coPayPercent: "", advanceClaimStatus: "Pending",
  insuranceType: "Paid",
  membership: "No", membershipStartDate: "", membershipEndDate: "", membershipId: "",
  package: "No", packageId: "",
  memberships: [],
  packages: []
};

const InvoiceManagementSystem = ({ onSuccess, isCompact = false, onCancel }) => {
  const [currentUser, setCurrentUser] = useState({ name: "", role: "" });
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [autoFields, setAutoFields] = useState({
    invoicedDate: new Date().toISOString(),
    invoicedBy: " ",
    advanceClaimReleaseDate: null,
    advanceClaimReleasedBy: null
  });
  const [calculatedFields, setCalculatedFields] = useState({ needToPay: 0 });
  const [errors, setErrors] = useState({});
  const [usedEMRNumbers] = useState(() => new Set());
  const [fetching, setFetching] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null });
  const [memberships, setMemberships] = useState([]);
  const [packages, setPackages] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [membershipPackagesEnabled, setMembershipPackagesEnabled] = useState(true);
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);

  // Claim-specific state
  const [claimData, setClaimData] = useState({
    insuranceProvider: "",
    policyNumber: "",
    expiryDate: "",
    insuranceCardFile: "",
    tableOfBenefitsFile: "",
    departmentId: "",
    departmentName: "",
    serviceId: "",
    serviceName: "",
    doctorId: "",
    doctorName: "",
    claimAmount: "",
    claimType: "Paid",
    coPayPercent: "",
    coPayType: "Patient Pays",
    notes: "",
    documentFiles: [],
    advanceStatus: "Full Pay",
    advanceAmount: 0,
  });
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Fetch departments, services, and doctors for claim form
  useEffect(() => {
    const fetchClaimDropdowns = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers) return;

        // Fetch departments
        const deptRes = await fetch("/api/clinic/departments", { headers });
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          if (deptData.success) setDepartments(deptData.departments || []);
        }

        // Fetch services
        const svcRes = await fetch("/api/clinic/services", { headers });
        if (svcRes.ok) {
          const svcData = await svcRes.json();
          if (svcData.success) setServices(svcData.services || []);
        }

        // Fetch doctor staff
        const docRes = await fetch("/api/admin/get-all-doctor-staff", { headers });
        if (docRes.ok) {
          const docData = await docRes.json();
          if (docData.success) setDoctors(docData.data || []);
        }
      } catch (err) {
        console.error("Error fetching claim dropdowns:", err);
      }
    };
    fetchClaimDropdowns();
  }, []);

  // Filter services by selected department
  const filteredServices = useMemo(() => {
    if (!claimData.departmentId) return services;
    return services.filter(s => s.departmentId === claimData.departmentId || String(s.departmentId) === String(claimData.departmentId));
  }, [services, claimData.departmentId]);

  // Handle claim field changes
  const handleClaimChange = useCallback((e) => {
    const { name, value } = e.target;
    setClaimData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-calculate advance amount
      if (name === "claimAmount" || name === "advanceStatus") {
        const amt = name === "claimAmount" ? parseFloat(value) || 0 : parseFloat(prev.claimAmount) || 0;
        const status = name === "advanceStatus" ? value : prev.advanceStatus;
        if (prev.claimType === "Advance") {
          updated.advanceAmount = status === "Full Pay" ? amt : amt * 0.5;
        }
      }
      if (name === "claimType" && value !== "Advance") {
        updated.advanceStatus = "Full Pay";
        updated.advanceAmount = 0;
      }
      if (name === "claimType" && value === "Advance") {
        const amt = parseFloat(prev.claimAmount) || 0;
        updated.advanceAmount = prev.advanceStatus === "Full Pay" ? amt : amt * 0.5;
      }
      return updated;
    });
  }, []);

  // Handle department change - also update departmentName and reset service
  const handleDepartmentChange = useCallback((e) => {
    const deptId = e.target.value;
    const dept = departments.find(d => d._id === deptId);
    setClaimData(prev => ({
      ...prev,
      departmentId: deptId,
      departmentName: dept ? dept.name : "",
      serviceId: "",
      serviceName: "",
    }));
  }, [departments]);

  // Handle service change - also update serviceName
  const handleServiceChange = useCallback((e) => {
    const svcId = e.target.value;
    const svc = services.find(s => s._id === svcId);
    setClaimData(prev => ({
      ...prev,
      serviceId: svcId,
      serviceName: svc ? svc.name : "",
    }));
  }, [services]);

  // Handle doctor change - also update doctorName
  const handleDoctorChange = useCallback((e) => {
    const docId = e.target.value;
    const doc = doctors.find(d => d._id === docId);
    setClaimData(prev => ({
      ...prev,
      doctorId: docId,
      doctorName: doc ? doc.name : "",
    }));
  }, [doctors]);

  // Handle file upload for claim
  const handleClaimFileUpload = useCallback(async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingFiles(true);
      const headers = getAuthHeaders();
      const uploadFormData = new FormData();
      uploadFormData.append(field, file);

      const res = await fetch("/api/clinic/insurance-claims/upload", {
        method: "POST",
        headers: { Authorization: headers?.Authorization || "" },
        body: uploadFormData,
      });

      const data = await res.json();
      if (data.success) {
        if (field === "insuranceCard") {
          setClaimData(prev => ({ ...prev, insuranceCardFile: data.data.insuranceCardFile }));
        } else if (field === "tableOfBenefits") {
          setClaimData(prev => ({ ...prev, tableOfBenefitsFile: data.data.tableOfBenefitsFile }));
        } else if (field === "documents") {
          setClaimData(prev => ({ ...prev, documentFiles: [...prev.documentFiles, ...data.data.documentFiles] }));
        }
      }
    } catch (err) {
      console.error("File upload error:", err);
    } finally {
      setUploadingFiles(false);
    }
  }, []);

  // Handle claim document upload (multiple)
  const handleClaimDocumentsUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploadingFiles(true);
      const headers = getAuthHeaders();
      const uploadFormData = new FormData();
      files.forEach(f => uploadFormData.append("documents", f));

      const res = await fetch("/api/clinic/insurance-claims/upload", {
        method: "POST",
        headers: { Authorization: headers?.Authorization || "" },
        body: uploadFormData,
      });

      const data = await res.json();
      if (data.success && data.data.documentFiles) {
        setClaimData(prev => ({ ...prev, documentFiles: [...prev.documentFiles, ...data.data.documentFiles] }));
      }
    } catch (err) {
      console.error("Document upload error:", err);
    } finally {
      setUploadingFiles(false);
    }
  }, []);

  const formatDate = useCallback((dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Submit claim after patient registration (must be after showToast)
  const submitInsuranceClaim = useCallback(async (patientId) => {
    try {
      setClaimSubmitting(true);
      const headers = getAuthHeaders();
      const res = await fetch("/api/clinic/insurance-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          patientId,
          insuranceProvider: claimData.insuranceProvider,
          policyNumber: claimData.policyNumber,
          expiryDate: claimData.expiryDate,
          insuranceCardFile: claimData.insuranceCardFile,
          tableOfBenefitsFile: claimData.tableOfBenefitsFile,
          departmentId: claimData.departmentId,
          departmentName: claimData.departmentName,
          serviceId: claimData.serviceId,
          serviceName: claimData.serviceName,
          doctorId: claimData.doctorId,
          doctorName: claimData.doctorName,
          claimAmount: claimData.claimAmount,
          claimType: claimData.claimType,
          coPayPercent: claimData.coPayPercent,
          coPayType: claimData.coPayType,
          notes: claimData.notes,
          documentFiles: claimData.documentFiles,
          advanceStatus: claimData.advanceStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Insurance claim created successfully!", "success");
        setClaimData({
          insuranceProvider: "",
          policyNumber: "",
          expiryDate: "",
          insuranceCardFile: "",
          tableOfBenefitsFile: "",
          departmentId: "",
          departmentName: "",
          serviceId: "",
          serviceName: "",
          doctorId: "",
          doctorName: "",
          claimAmount: "",
          claimType: "Paid",
          coPayPercent: "",
          coPayType: "Patient Pays",
          notes: "",
          documentFiles: [],
          advanceStatus: "Full Pay",
          advanceAmount: 0,
        });
      } else {
        showToast(data.message || "Failed to create insurance claim", "error");
      }
    } catch (err) {
      console.error("Claim submission error:", err);
      showToast("Failed to create insurance claim", "error");
    } finally {
      setClaimSubmitting(false);
    }
  }, [claimData, showToast]);

  useEffect(() => {
    if (!formData.emrNumber) {
      // Generate EMR number on component mount or when EMR is empty
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

  const handleNext = useCallback(() => {
    const errs = {};
    if (!formData.firstName?.trim()) errs.firstName = "First name is required";
    if (!formData.mobileNumber?.trim()) errs.mobileNumber = "Mobile number is required";
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setCurrentStep(2);
    } else {
      showToast("Please complete required fields", "error");
    }
  }, [formData, showToast]);

  // Fetch data
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    const headers = getAuthHeaders();
    if (!headers) return;
    
    // Use clinic API endpoint if in clinic route
    const isClinicRoute = typeof window !== 'undefined' && window.location.pathname?.startsWith('/clinic/');
    const apiEndpoint = isClinicRoute ? "/api/clinic/patient-registration" : "/api/staff/patient-registration";
    
    // Fetch invoiced by from API
    fetch(`${apiEndpoint}?getInvoicedBy=true`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.invoicedBy) {
          setAutoFields(prev => ({ ...prev, invoicedBy: data.invoicedBy }));
          console.log('Fetched invoicedBy:', data.invoicedBy);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch invoicedBy:', err);
        showToast("Failed to fetch user details", "error");
      });
  }, [showToast]);

  useEffect(() => {
    const headers = getAuthHeaders();
    if (!headers) return;
    const fetchLists = async () => {
      try {
        const [mRes, pRes, rRes] = await Promise.all([
          fetch("/api/clinic/memberships", { headers }),
          fetch("/api/clinic/packages", { headers }),
          fetch("/api/clinic/referrals", { headers })
        ]);
        const mData = await mRes.json();
        const pData = await pRes.json();
        const rData = await rRes.json();
        if (mData.success && Array.isArray(mData.memberships)) {
          setMemberships(mData.memberships);
        }
        if (pData.success && Array.isArray(pData.packages)) {
          setPackages(pData.packages);
        }
        if (rData.success && Array.isArray(rData.referrals)) {
          setReferrals(rData.referrals);
        }
      } catch {
        // silent fail to avoid blocking registration
      }
    };
    fetchLists();
  }, []);

  useEffect(() => {
    if (formData.membership === "Yes" && formData.membershipId) {
      const selected = memberships.find((m) => m._id === formData.membershipId);
      if (!selected) return;
      const start = new Date();
      const end = new Date(start);
      const months = Number(selected.durationMonths) || 1;
      end.setMonth(end.getMonth() + months);
      const startStr = formatDate(start);
      const endStr = formatDate(end);
      setFormData((prev) => {
        const currentMemberships = Array.isArray(prev.memberships) ? prev.memberships : [];
        const existsIdx = currentMemberships.findIndex((m) => m.membershipId === prev.membershipId);
        let updated;
        if (existsIdx >= 0) {
          updated = currentMemberships.map((m, idx) =>
            idx === existsIdx ? { ...m, startDate: startStr, endDate: endStr } : m
          );
        } else {
          updated = [...currentMemberships, { membershipId: prev.membershipId, startDate: startStr, endDate: endStr }];
        }
        return {
          ...prev,
          memberships: updated,
          membershipStartDate: startStr,
          membershipEndDate: endStr,
        };
      });
    }
  }, [formData.membershipId, formData.membership, memberships, formatDate]);

  useEffect(() => {
    if (formData.package === "Yes" && formData.packageId) {
      setFormData((prev) => {
        const currentPackages = Array.isArray(prev.packages) ? prev.packages : [];
        const existsIdx = currentPackages.findIndex((p) => p.packageId === prev.packageId);
        let updated;
        if (existsIdx >= 0) {
          updated = currentPackages;
        } else {
          updated = [...currentPackages, { packageId: prev.packageId, assignedDate: new Date().toISOString() }];
        }
        return { ...prev, packages: updated };
      });
    }
  }, [formData.packageId, formData.package]);

  // Auto-generate EMR number when modal opens - via API
  // Works for clinic, agent, and doctorStaff roles on both clinic and staff routes
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
    
    // Generate EMR if:
    // 1. Route conditions are met (clinic route OR staff route with clinic-patient-registration)
    // 2. User has valid role (clinic, doctor, agent, or doctorStaff)
    // 3. Modal is open (isCompact)
    // 4. EMR number is not already set
    if (shouldGenerateEMR && isCompact && !formData.emrNumber) {
      const headers = getAuthHeaders();
      if (headers) {
        fetch("/api/clinic/generate-emr", { headers })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.emrNumber) {
              setFormData(prev => ({ ...prev, emrNumber: data.emrNumber }));
            } else {
              // Fallback if generation fails
              const fallbackEmr = `EMR-${Date.now()}`;
              setFormData(prev => ({ ...prev, emrNumber: fallbackEmr }));
            }
          })
          .catch(() => {
            // Fallback if API call fails
            const fallbackEmr = `EMR-${Date.now()}`;
            setFormData(prev => ({ ...prev, emrNumber: fallbackEmr }));
          });
      }
    }
  }, [isCompact]);

  useEffect(() => generateInvoiceNumber(), []);

  useEffect(() => {
    const advanceGivenAmount = parseFloat(formData.advanceGivenAmount) || 0;
    const coPayPercentNum = parseFloat(formData.coPayPercent);

    if (formData.insurance === "Yes" && formData.insuranceType === "Advance" && !Number.isNaN(coPayPercentNum)) {
      // Requirement: base the calculation ONLY on Advance Payment Amount
      // needToPay = advanceGivenAmount * (100 - coPay%) / 100
      const needToPay = Math.max(0, (advanceGivenAmount * (100 - coPayPercentNum)) / 100);
      setCalculatedFields(prev => ({ ...prev, needToPay }));
    } else {
      setCalculatedFields(prev => ({ ...prev, needToPay: 0 }));
    }
  }, [formData.coPayPercent, formData.insurance, formData.insuranceType, formData.advanceGivenAmount]);

  const generateInvoiceNumber = useCallback(() => {
    const date = new Date();
    const seq = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    const id = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${seq}`;
    setFormData(prev => ({ ...prev, invoiceNumber: id }));
  }, []);

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
    
    // Reset dependent fields on toggles
    if (name === "membership") {
      if (value === "No") {
        setFormData(prev => ({ 
          ...prev, 
          membership: "No", 
          membershipId: "", 
          membershipStartDate: "", 
          membershipEndDate: "" 
        }));
        return;
      }
    }
    if (name === "package") {
      if (value === "No") {
        setFormData(prev => ({ 
          ...prev, 
          package: "No", 
          packageId: "" 
        }));
        return;
      }
    }

    // Handle referredBy - set to "No" if empty, but keep UI value as empty string
    const finalValue = (name === "referredBy" && value === "") ? "No" : value;
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    if (name === "insurance" && value === "No") {
      setFormData(prev => ({
        ...prev,
        advanceGivenAmount: "0",
        coPayPercent: "",
        advanceClaimStatus: "Pending",
        insuranceType: "Paid"
      }));
      setAutoFields(prev => ({
        ...prev,
        advanceClaimReleaseDate: null,
        advanceClaimReleasedBy: null
      }));
    }
    
    if (name === "insurance" && value === "Yes") {
      setFormData(prev => ({
        ...prev,
        advanceGivenAmount: "0"
      }));
    }
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
          // Enable EMR advance mode before setting advance so auto-calc doesn't override it
          setManualAdvance(true);
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
    const { invoiceNumber, emrNumber, firstName, lastName, email, mobileNumber, gender, patientType, insurance, advanceGivenAmount, coPayPercent } = formData;
    
    if (!invoiceNumber.trim()) newErrors.invoiceNumber = "Required";
    if (!emrNumber.trim()) newErrors.emrNumber = "Required";
    else if (usedEMRNumbers.has(emrNumber)) newErrors.emrNumber = "Already exists";

    // Unified validation: Only First Name and Mobile Number are mandatory for all roles
    if (!firstName.trim()) newErrors.firstName = "Required";
    if (!mobileNumber.trim()) newErrors.mobileNumber = "Required";
    
    // Optional fields validation if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email";

    /* Previous strict validation for reference:
    if (isClinicRoute && isCompact) {
      if (!firstName.trim()) newErrors.firstName = "Required";
      if (!mobileNumber.trim()) newErrors.mobileNumber = "Required";
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email";
    } else {
      if (!firstName.trim()) newErrors.firstName = "Required";
      if (!lastName.trim()) newErrors.lastName = "Required";
      if (!email.trim()) newErrors.email = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email";
      if (!mobileNumber.trim()) newErrors.mobileNumber = "Required";
      if (!gender) newErrors.gender = "Required";
      if (!patientType) newErrors.patientType = "Required";
    }
    */
    
    if (insurance === "Yes" && formData.insuranceType === "Advance") {
      if (!coPayPercent || parseFloat(coPayPercent) < 0 || parseFloat(coPayPercent) > 100) newErrors.coPayPercent = "0-100 required";
    }
    
    // Validate membership dates
    if (formData.membership === "Yes") {
      if (!formData.membershipId) newErrors.membershipId = "Select membership";
      if (!formData.membershipStartDate) newErrors.membershipStartDate = "Required";
      if (!formData.membershipEndDate) newErrors.membershipEndDate = "Required";
      if (formData.membershipStartDate && formData.membershipEndDate && new Date(formData.membershipStartDate) >= new Date(formData.membershipEndDate)) {
        newErrors.membershipEndDate = "End date must be after start date";
      }
    }
    // Validate package selection
    if (formData.package === "Yes") {
      if (!formData.packageId) newErrors.packageId = "Select package";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, usedEMRNumbers, isCompact]);

const router = useRouter(); // <-- inside your component

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
        
        // Use clinic API endpoint for clinic route OR when accessing clinic-patient-registration page
        // This ensures consistent validation (only firstName and mobileNumber required) for clinic, agent, and doctorStaff
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        const isClinicRoute = currentPath.startsWith('/clinic/');
        const isClinicPatientRegistration = currentPath.includes('clinic-patient-registration');
        // Use clinic API for clinic routes OR when accessing clinic-patient-registration (even from staff route)
        const apiEndpoint = (isClinicRoute || isClinicPatientRegistration) 
          ? "/api/clinic/patient-registration" 
          : "/api/staff/patient-registration";
        
        const res = await fetch(apiEndpoint, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            ...headers
          },
          body: JSON.stringify({ ...formData, ...autoFields, userId: currentUser._id, calculatedFields })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          // If insurance is enabled, submit the claim after patient registration
          if (insuranceEnabled && formData.insurance === 'Yes' && data.data?._id) {
            await submitInsuranceClaim(data.data._id);
          }
          // Show success popup for clinic route
          if (isClinicRoute && isCompact) {
            showToast("Registered successfully!", "success");
          } else {
            showToast("Invoice saved successfully!", "success");
          }
          resetForm();

          // If onSuccess callback is provided (modal mode), call it instead of redirecting
          if (onSuccess) {
            onSuccess();
          } else {
            // Redirect to patient information page - check if we're on clinic route
            if (isClinicRoute) {
              router.push("/clinic/patient-registration?tab=information");
            } else {
              router.push("/staff/patient-information");
            }
          }
        } else {
          // Handle validation errors with user-friendly messages
          let errorMessage = "Failed to save patient";
          
          if (data.errors && Array.isArray(data.errors)) {
            errorMessage = data.errors.join(", ");
          } else if (data.message) {
            // Convert technical error messages to user-friendly ones
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
}, [formData, autoFields, currentUser, calculatedFields, validateForm, showToast, router, onSuccess, isCompact, submitInsuranceClaim, insuranceEnabled]);

  const resetForm = useCallback(() => {
    setConfirmModal({
      isOpen: true,
      title: "Reset Form",
      message: "All entered data will be lost. Are you sure you want to reset?",
      type: "warning",
      action: () => {
        setFormData(INITIAL_FORM_DATA);
        setAutoFields({
          invoicedDate: new Date().toISOString(),
          invoicedBy: currentUser.name,
          advanceClaimReleaseDate: null,
          advanceClaimReleasedBy: null
        });
        setCalculatedFields({ needToPay: 0 });
        setErrors({});
        generateInvoiceNumber();
        showToast("Form reset successfully", "success");
        setConfirmModal({ isOpen: false, action: null });
      }
    });
  }, [currentUser.name, generateInvoiceNumber, showToast]);

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

    <ToastContainer toasts={toasts} removeToast={removeToast} />
    <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal({ isOpen: false, action: null })} onConfirm={confirmModal.action} />

    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
      <div className="w-full">
        <div className={`bg-white ${isCompact ? '' : 'rounded-2xl shadow-sm border border-gray-200'} ${isCompact ? 'p-0' : 'p-4 sm:p-6'}`}>
          {!isCompact && (
            <>
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 sm:mb-6 mb-4 bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-bold ${currentStep === 1 ? 'bg-teal-600 text-white' : currentStep > 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    1
                  </span>
                  <span className={`text-xs sm:text-sm font-medium ${currentStep === 1 ? 'text-gray-900' : currentStep > 1 ? 'text-green-700' : 'text-gray-500'}`}>
                    Patient Info
                  </span>
                </div>
                <div className="flex-1 h-px bg-gray-300 hidden sm:block"></div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-bold ${currentStep === 2 ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    2
                  </span>
                  <span className={`text-xs sm:text-sm font-medium ${currentStep === 2 ? 'text-gray-900' : 'text-gray-500'}`}>
                    Additional Details
                  </span>
                </div>
              </div>
            </>
          )}

          <div className={`${isCompact ? '' : 'grid grid-cols-1 lg:grid-cols-3 gap-4'}`}>
            <div className={`${isCompact ? '' : 'lg:col-span-2 space-y-3'}`}>

            {currentStep === 1 && (
            <>
            

            {/* Patient Information */}
            <div className={`bg-white rounded-lg p-3 sm:p-4 border border-gray-200`}>
              <h2 className={`text-xs font-semibold text-gray-900 mb-3 flex items-center gap-1`}>
                <User className={`w-3 h-3 text-gray-700`} />
                Patient Information
              </h2>
              
              {/* First Row: First Name, Last Name, Mobile Number - Responsive Grid */}
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

                {/* Mobile Number with Country Selector - Compact */}
                <div>
                  <label className={`block text-[10px] mb-1 font-medium text-gray-700`}>
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <CountryPhoneInput
                    countryCode={formData.countryCode}
                    phone={formData.mobileNumber}
                    onCountryChange={(code) => {
                      setFormData(prev => {
                        // Extract local number from current mobileNumber
                        let localNum = prev.mobileNumber;
                        if (localNum.startsWith(prev.countryCode)) {
                          localNum = localNum.slice(prev.countryCode.length);
                        } else {
                          localNum = localNum.replace(/^\+\d+/, '');
                        }
                        
                        // Prepend new country code
                        const newMobile = code + localNum;
                        return { ...prev, countryCode: code, mobileNumber: newMobile };
                      });
                    }}
                    onPhoneChange={(val) => {
                      // Allow only digits (no + sign in the local number)
                      const sanitized = val.replace(/[^\d]/g, "").slice(0, 15);
                      // Prepend country code to the local number
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

              {/* Second Row: Gender, Patient Type, Referred By - Responsive */}
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

              {/* EMR & Invoice Number Display - Auto-generated - Responsive */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 bg-teal-50 px-3 py-2 rounded-md border border-teal-200 w-full sm:w-auto">
                  <FileText className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                  <span className="text-[10px] font-medium text-teal-800">EMR:</span>
                  <span className="text-[10px] font-bold text-teal-900">{formData.emrNumber || "EMR-—"}</span>
                  <span className="text-[9px] text-teal-600">(Auto)</span>
                </div>
              </div>
            </div>
            </>
            )}

            {currentStep === 2 && (
            <>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-gray-900">Additional Details</h2>
                <button type="button" onClick={() => setCurrentStep(1)} className="text-[12px] text-teal-700 hover:underline">← Back to Patient Info</button>
              </div>
              <div className="space-y-2">
                <div className="border rounded-md">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
                    <div className="text-[11px] font-semibold text-gray-900">Membership & Packages</div>
                    <button
                      type="button"
                      onClick={() => setMembershipPackagesEnabled(v => !v)}
                      className={`w-8 h-5 rounded-full ${membershipPackagesEnabled ? 'bg-teal-600' : 'bg-gray-300'} relative transition-colors duration-200`}
                      aria-label="Toggle Membership & Packages"
                    >
                      <span className={`absolute top-0.5 ${membershipPackagesEnabled ? 'right-0.5' : 'left-0.5'} w-4 h-4 rounded-full bg-white shadow transition-all duration-200`}></span>
                    </button>
                  </div>
                  {/* Fixed height container - always same minimum size */}
                  <div className={`transition-all duration-300 overflow-hidden ${membershipPackagesEnabled ? 'max-h-[2000px]' : 'max-h-0'}`} style={{ minHeight: membershipPackagesEnabled ? 'auto' : '120px' }}>
                    <div className="p-4" style={{ opacity: membershipPackagesEnabled ? 1 : 0, transition: 'opacity 0.3s' }}>
                      {/* Membership */}
                      <div className="bg-white rounded-lg p-2 border border-gray-200">
                        <h2 className={`text-[11px] font-medium text-gray-900 mb-1`}>Select Membership</h2>
                        <div className={`flex flex-wrap gap-2 items-end`}>
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Membership</label>
                            <select
                              name="membership"
                              value={formData.membership}
                              onChange={handleInputChange}
                              className="text-gray-900 w-full px-2 py-1 text-[10px] border rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
                            >
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          </div>
                          {formData.membership === "Yes" && (
                            <div className="flex-1 min-w-[120px]">
                              <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Select Membership <span className="text-red-500">*</span></label>
                              <select
                                name="membershipId"
                                value={formData.membershipId}
                                onChange={handleInputChange}
                                className={`text-gray-900 w-full px-2 py-1 text-[10px] border rounded-md focus:ring-1 focus:ring-indigo-500 ${errors.membershipId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                              >
                                <option value="">Select membership</option>
                                {memberships.filter(m => m.isActive !== false).map(m => (
                                  <option key={m._id} value={m._id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                              {errors.membershipId && (
                                <p className="text-red-500 text-[9px] mt-0.5 flex items-center gap-0.5">
                                  <AlertCircle className="w-2.5 h-2.5" />{errors.membershipId}
                                </p>
                              )}
                              </div>
                          )}
                          {formData.membership === "Yes" && (
                            <>
                              <div className="flex-1 min-w-[120px]">
                                <label className={`block text-[10px] mb-0.5 font-medium text-gray-700`}>
                                  Membership Start Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  name="membershipStartDate"
                                  value={formData.membershipStartDate}
                                  onChange={handleInputChange}
                                  className={`w-full px-2 py-1 text-[10px] border rounded-md focus:ring-1 focus:ring-indigo-500 text-gray-900 ${errors.membershipStartDate ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                />
                              </div>
                              <div className="flex-1 min-w-[120px]">
                                <label className={`block text-[10px] mb-0.5 font-medium text-gray-700`}>
                                  Membership End Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  name="membershipEndDate"
                                  value={formData.membershipEndDate}
                                  onChange={handleInputChange}
                                  className={`w-full px-2 py-1 text-[10px] border rounded-md focus:ring-1 focus:ring-indigo-500 text-gray-900 ${errors.membershipEndDate ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Packages */}
                      <div className={`bg-white rounded-lg p-3 border border-gray-200 mt-2`}>
                        <h2 className={`text-[11px] font-medium text-gray-900 mb-1`}>Select Package</h2>
                        <div className={`flex flex-wrap gap-2 items-end`}>
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Package</label>
                            <select
                              name="package"
                              value={formData.package}
                              onChange={handleInputChange}
                              className="text-gray-900 w-full px-2 py-1 text-[10px] border rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
                            >
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          </div>
                          {formData.package === "Yes" && (
                            <div className="flex-1 min-w-[120px]">
                              <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Choose Package <span className="text-red-500">*</span></label>
                              <select
                                name="packageId"
                                value={formData.packageId}
                                onChange={handleInputChange}
                                className={`text-gray-900 w-full px-2 py-1 text-[10px] border rounded-md focus:ring-1 focus:ring-indigo-500 ${errors.packageId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                              >
                                <option value="">Select package</option>
                                {packages.map(p => (
                                  <option key={p._id} value={p._id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                              {errors.packageId && (
                                <p className="text-red-500 text-[9px] mt-0.5 flex items-center gap-0.5">
                                  <AlertCircle className="w-2.5 h-2.5" />{errors.packageId}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border rounded-md mt-2">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
                    <div className="text-[11px] font-semibold text-gray-900">Insurance</div>
                    <button
                      type="button"
                      onClick={() => setInsuranceEnabled(v => !v)}
                      className={`w-8 h-5 rounded-full ${insuranceEnabled ? 'bg-teal-600' : 'bg-gray-300'} relative transition-colors duration-200`}
                      aria-label="Toggle Insurance"
                    >
                      <span className={`absolute top-0.5 ${insuranceEnabled ? 'right-0.5' : 'left-0.5'} w-4 h-4 rounded-full bg-white shadow transition-all duration-200`}></span>
                    </button>
                  </div>
                  {/* Fixed height container - always same minimum size */}
                  <div className={`transition-all duration-300 overflow-hidden ${insuranceEnabled ? 'max-h-[5000px]' : 'max-h-0'}`} style={{ minHeight: insuranceEnabled ? 'auto' : '100px' }}>
                    <div className="p-2" style={{ opacity: insuranceEnabled ? 1 : 0, transition: 'opacity 0.3s' }}>
                      {/* Insurance Toggle */}
                      <div className="flex flex-wrap gap-2 items-end mb-3">
                        <div className="flex-1 min-w-[120px]">
                          <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Insurance</label>
                          <select name="insurance" value={formData.insurance} onChange={handleInputChange} className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 text-gray-900">
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                      </div>

                      {formData.insurance === 'Yes' && (
                        <>
                          {/* Section A: Insurance Details (Mandatory) */}
                          <div className="mb-3 p-2 bg-blue-50 rounded-md border border-blue-200">
                            <div className="text-[10px] font-semibold text-blue-800 mb-2">Insurance Details (Required)</div>
                            <div className="flex flex-wrap gap-2 items-end">
                              <div className="flex-1 min-w-[140px]">
                                <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Insurance Provider <span className="text-red-500">*</span></label>
                                <input type="text" name="insuranceProvider" value={claimData.insuranceProvider} onChange={handleClaimChange} className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-gray-900" placeholder="Provider name" />
                              </div>
                              <div className="flex-1 min-w-[140px]">
                                <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Policy Number <span className="text-red-500">*</span></label>
                                <input type="text" name="policyNumber" value={claimData.policyNumber} onChange={handleClaimChange} className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-gray-900" placeholder="Policy number" />
                              </div>
                              <div className="flex-1 min-w-[130px]">
                                <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Expiry Date <span className="text-red-500">*</span></label>
                                <input type="date" name="expiryDate" value={claimData.expiryDate} onChange={handleClaimChange} className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-gray-900" />
                              </div>
                              <div className="flex-1 min-w-[140px]">
                                <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Insurance Card</label>
                                <input type="file" accept="image/*,.pdf" onChange={(e) => handleClaimFileUpload(e, 'insuranceCard')} className="w-full px-1 py-0.5 text-[9px] border border-gray-300 rounded-md text-gray-700 file:mr-1 file:py-0.5 file:px-2 file:rounded file:text-[8px] file:bg-blue-100 file:text-blue-700 file:border-0" disabled={uploadingFiles} />
                                {claimData.insuranceCardFile && (
                                  <a href={claimData.insuranceCardFile} target="_blank" rel="noreferrer" className="text-[9px] text-blue-600 underline mt-0.5 block">View uploaded file</a>
                                )}
                              </div>
                              <div className="flex-1 min-w-[140px]">
                                <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Table of Benefits</label>
                                <input type="file" accept="image/*,.pdf" onChange={(e) => handleClaimFileUpload(e, 'tableOfBenefits')} className="w-full px-1 py-0.5 text-[9px] border border-gray-300 rounded-md text-gray-700 file:mr-1 file:py-0.5 file:px-2 file:rounded file:text-[8px] file:bg-blue-100 file:text-blue-700 file:border-0" disabled={uploadingFiles} />
                                {claimData.tableOfBenefitsFile && (
                                  <a href={claimData.tableOfBenefitsFile} target="_blank" rel="noreferrer" className="text-[9px] text-blue-600 underline mt-0.5 block">View uploaded file</a>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Section B: Claim Source */}
                          <div className="mb-3 p-2 bg-green-50 rounded-md border border-green-200">
                            <div className="text-[10px] font-semibold text-green-800 mb-2">Claim Source</div>
                            <div className="flex flex-wrap gap-2 items-end">
                              <div className="flex-1 min-w-[140px]">
                                <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Department</label>
                                <select name="departmentId" value={claimData.departmentId} onChange={handleDepartmentChange} className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 text-gray-900">
                                  <option value="">Select Department</option>
                                  {departments.map(d => (
                                    <option key={d._id} value={d._id}>{d.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex-1 min-w-[140px]">
                                <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Service</label>
                                <select name="serviceId" value={claimData.serviceId} onChange={handleServiceChange} className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 text-gray-900">
                                  <option value="">Select Service</option>
                                  {filteredServices.map(s => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex-1 min-w-[140px]">
                                <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Doctor <span className="text-red-500">*</span></label>
                                <select name="doctorId" value={claimData.doctorId} onChange={handleDoctorChange} className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 text-gray-900">
                                  <option value="">Select Doctor</option>
                                  {doctors.map(d => (
                                    <option key={d._id} value={d._id}>{d.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex-1 min-w-[120px]">
                                <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Claim Amount <span className="text-red-500">*</span></label>
                                <input type="number" name="claimAmount" value={claimData.claimAmount} onChange={handleClaimChange} className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 text-gray-900" placeholder="0" min="0" step="0.01" />
                              </div>
                              <div className="flex-1 min-w-[120px]">
                                <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Claim Type <span className="text-red-500">*</span></label>
                                <select name="claimType" value={claimData.claimType} onChange={handleClaimChange} className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 text-gray-900">
                                  <option value="Paid">Paid</option>
                                  <option value="Advance">Advance</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Section C: Claim Details (when type is Paid or Advance) */}
                          <div className="mb-3 p-2 bg-purple-50 rounded-md border border-purple-200">
                            <div className="text-[10px] font-semibold text-purple-800 mb-2">Claim Details</div>
                            <div className="flex flex-wrap gap-2 items-end">
                              <div className="flex-1 min-w-[120px]">
                                <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Co-Pay %</label>
                                <input type="number" name="coPayPercent" value={claimData.coPayPercent} onChange={handleClaimChange} className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900" placeholder="0-100" min="0" max="100" />
                              </div>
                              <div className="flex-1 min-w-[140px]">
                                <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Co-Pay Type</label>
                                <select name="coPayType" value={claimData.coPayType} onChange={handleClaimChange} className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900">
                                  <option value="Patient Pays">Patient Pays</option>
                                  <option value="Deduct from Claim">Deduct from Claim</option>
                                  <option value="Clinic Adjusts">Clinic Adjusts</option>
                                </select>
                              </div>
                              <div className="flex-1 min-w-[140px]">
                                <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Notes</label>
                                <input type="text" name="notes" value={claimData.notes} onChange={handleClaimChange} className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900" placeholder="Additional notes" />
                              </div>
                              <div className="flex-1 min-w-[140px]">
                                <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Documents</label>
                                <input type="file" multiple accept="image/*,.pdf" onChange={handleClaimDocumentsUpload} className="w-full px-1 py-0.5 text-[9px] border border-gray-300 rounded-md text-gray-700 file:mr-1 file:py-0.5 file:px-2 file:rounded file:text-[8px] file:bg-purple-100 file:text-purple-700 file:border-0" disabled={uploadingFiles} />
                                {claimData.documentFiles.length > 0 && (
                                  <div className="mt-0.5">
                                    <span className="text-[9px] text-gray-600">{claimData.documentFiles.length} file(s) uploaded</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Advance-specific fields */}
                            {claimData.claimType === 'Advance' && (
                              <div className="flex flex-wrap gap-2 items-end mt-2 pt-2 border-t border-purple-200">
                                <div className="flex-1 min-w-[140px]">
                                  <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Advance Status</label>
                                  <select name="advanceStatus" value={claimData.advanceStatus} onChange={handleClaimChange} className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900">
                                    <option value="Full Pay">Full Pay</option>
                                    <option value="Partial Pay">Partial Pay</option>
                                  </select>
                                </div>
                                <div className="flex-1 min-w-[140px]">
                                  <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Advance Amount (Auto)</label>
                                  <input type="text" value={claimData.advanceAmount.toFixed(2)} disabled className="w-full px-2 py-1 text-[10px] bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-semibold" />
                                </div>
                                <div className="flex-1 min-w-[120px]">
                                  <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Status</label>
                                  <div className="px-2 py-1 text-[10px] bg-yellow-50 border border-yellow-300 rounded-md text-yellow-800 font-semibold">Under Review</div>
                                </div>
                              </div>
                            )}

                            {claimData.claimType === 'Paid' && (
                              <div className="flex flex-wrap gap-2 items-end mt-2 pt-2 border-t border-purple-200">
                                <div className="flex-1 min-w-[120px]">
                                  <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Status</label>
                                  <div className="px-2 py-1 text-[10px] bg-yellow-50 border border-yellow-300 rounded-md text-yellow-800 font-semibold">Under Review</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}
            {false && ( <div className={`bg-white rounded-lg p-2 border border-gray-200`}>
              <h2 className={`text-xs font-semibold text-gray-900 mb-1`}>Membership</h2>
              <div className={`flex flex-wrap gap-2 items-end`}>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Membership</label>
                  <select
                    name="membership"
                    value={formData.membership}
                    onChange={handleInputChange}
                    className="text-gray-900 w-full px-2 py-1 text-[10px] border rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                {formData.membership === "Yes" && (
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Select Membership <span className="text-red-500">*</span></label>
                    <select
                      name="membershipId"
                      value={formData.membershipId}
                      onChange={handleInputChange}
                      className={`text-gray-900 w-full px-2 py-1 text-[10px] border rounded-md focus:ring-1 focus:ring-indigo-500 ${errors.membershipId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    >
                      <option value="">Select membership</option>
                      {memberships.filter(m => m.isActive !== false).map(m => (
                        <option key={m._id} value={m._id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    {errors.membershipId && (
                      <p className="text-red-500 text-[9px] mt-0.5 flex items-center gap-0.5">
                        <AlertCircle className="w-2.5 h-2.5" />{errors.membershipId}
                      </p>
                    )}
                    </div>
                )}
                
                {/* Membership Date Fields */}
                {formData.membership === "Yes" && (
                  <>
                    <div className="flex-1 min-w-[120px]">
                      <label className={`block text-[10px] mb-0.5 font-medium text-gray-700`}>
                        Membership Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="membershipStartDate"
                        value={formData.membershipStartDate}
                        onChange={handleInputChange}
                        className={`w-full px-2 py-1 text-[10px] border rounded-md focus:ring-1 focus:ring-indigo-500 text-gray-900 ${errors.membershipStartDate ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                      {errors.membershipStartDate && (
                        <p className="text-red-500 text-[9px] mt-0.5 flex items-center gap-0.5">
                          <AlertCircle className="w-2.5 h-2.5" />{errors.membershipStartDate}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className={`block text-[10px] mb-0.5 font-medium text-gray-700`}>
                        Membership End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="membershipEndDate"
                        value={formData.membershipEndDate}
                        onChange={handleInputChange}
                        className={`w-full px-2 py-1 text-[10px] border rounded-md focus:ring-1 focus:ring-indigo-500 text-gray-900 ${errors.membershipEndDate ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                      {errors.membershipEndDate && (
                        <p className="text-red-500 text-[9px] mt-0.5 flex items-center gap-0.5">
                          <AlertCircle className="w-2.5 h-2.5" />{errors.membershipEndDate}
                        </p>
                      )}
                    </div>
                    <div className="w-full">
                      {(Array.isArray(formData.memberships) ? formData.memberships : []).length > 0 && (
                        <div className="mt-1 border border-gray-200 rounded p-2">
                          <div className="text-[10px] font-semibold text-gray-900 mb-1">Added Memberships</div>
                          <div className="space-y-1">
                            {(formData.memberships || []).map((m, idx) => {
                              const plan = memberships.find((x) => x._id === m.membershipId);
                              return (
                                <div key={`${m.membershipId}-${idx}`} className="flex items-center justify-between text-[10px]">
                                  <div className="text-gray-800">
                                    {plan?.name || m.membershipId} • {m.startDate?.slice(0,10)} → {m.endDate?.slice(0,10)}
                                  </div>
                                  <button
                                    type="button"
                                    className="px-2 py-0.5 bg-red-50 text-red-700 rounded border border-red-200"
                                    onClick={() => {
                                      const list = (formData.memberships || []).filter((_, i) => i !== idx);
                                      setFormData((prev) => ({ ...prev, memberships: list }));
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div> ) }

            {/* Packages */}
            {false && ( <div className={`bg-white rounded-lg p-2 border border-gray-200`}>
              <h2 className={`text-xs font-semibold text-gray-900 mb-1`}>Packages</h2>
              <div className={`flex flex-wrap gap-2 items-end`}>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Package</label>
                  <select
                    name="package"
                    value={formData.package}
                    onChange={handleInputChange}
                    className="text-gray-900 w-full px-2 py-1 text-[10px] border rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                {formData.package === "Yes" && (
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Select Package <span className="text-red-500">*</span></label>
                    <select
                      name="packageId"
                      value={formData.packageId}
                      onChange={handleInputChange}
                      className={`text-gray-900 w-full px-2 py-1 text-[10px] border rounded-md focus:ring-1 focus:ring-indigo-500 ${errors.packageId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    >
                      <option value="">Select package</option>
                      {packages.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {errors.packageId && (
                      <p className="text-red-500 text-[9px] mt-0.5 flex items-center gap-0.5">
                        <AlertCircle className="w-2.5 h-2.5" />{errors.packageId}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div> ) }
              {(Array.isArray(formData.packages) ? formData.packages : []).length > 0 && (
                <div className="mt-1 border border-gray-200 rounded p-2">
                  <div className="text-[10px] font-semibold text-gray-900 mb-1">Added Packages</div>
                  <div className="space-y-1">
                    {(formData.packages || []).map((p, idx) => {
                      const pkg = packages.find((x) => x._id === p.packageId);
                      return (
                        <div key={`${p.packageId}-${idx}`} className="flex items-center justify-between text-[10px]">
                          <div className="text-gray-800">
                            {pkg?.name || p.packageId}
                          </div>
                          <button
                            type="button"
                            className="px-2 py-0.5 bg-red-50 text-red-700 rounded border border-red-200"
                            onClick={() => {
                              const list = (formData.packages || []).filter((_, i) => i !== idx);
                              setFormData((prev) => ({ ...prev, packages: list }));
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            

            {/* Insurance Details */}
            {false && ( <div className={`bg-white rounded-lg p-2 border border-gray-200`}>
              <h2 className={`text-xs font-semibold text-gray-900 mb-1`}>Insurance Details</h2>
              <div className={`flex flex-wrap gap-2 items-end`}>
                <div className="flex-1 min-w-[120px]">
                  <label className={`block text-[10px] mb-0.5 font-medium text-gray-700`}>Insurance</label>
                  <select name="insurance" value={formData.insurance} onChange={handleInputChange} className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 text-gray-900">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                {formData.insurance === 'Yes' && (
                  <>
                    <div className="flex-1 min-w-[120px]">
                      <label className={`block text-[10px] mb-0.5 font-medium text-gray-700`}>Type</label>
                      <select name="insuranceType" value={formData.insuranceType} onChange={handleInputChange} className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 text-gray-900">
                        <option value="Paid">Paid</option>
                        <option value="Advance">Advance</option>
                      </select>
                    </div>
                    {formData.insuranceType === 'Advance' && (
                      <>
                        <div className="flex-1 min-w-[120px]">
                          <label className={`block text-[10px] mb-0.5 font-medium text-gray-700`}>Advance Payment Amount</label>
                          <input 
                            type="number" 
                            name="advanceGivenAmount" 
                            value={formData.advanceGivenAmount || ""} 
                            onChange={handleInputChange}
                            className={`w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900`} 
                            placeholder="0"
                            step="0.01"
                          />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          <label className={`block text-[10px] mb-0.5 font-medium text-gray-700`}>Co-Pay % <span className="text-red-500">*</span></label>
                          <input 
                            type="number" 
                            name="coPayPercent" 
                            value={formData.coPayPercent} 
                            onChange={handleInputChange} 
                            className={`w-full px-2 py-1 text-[10px] border rounded-md text-gray-900 ${errors.coPayPercent ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                            placeholder="0-100" 
                            min="0" 
                            max="100" 
                          />
                          {errors.coPayPercent && <p className="text-red-500 text-[9px] mt-0.5"><AlertCircle className="w-2.5 h-2.5 inline" /> {errors.coPayPercent}</p>}
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          <label className={`block text-[10px] mb-0.5 font-medium text-gray-700`}>Need to Pay (Auto)</label>
                          <input 
                            type="text" 
                            value={`د.إ ${calculatedFields.needToPay.toFixed(2)}`} 
                            disabled 
                            className="w-full px-2 py-1 text-[10px] bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-semibold" 
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div> ) }


            {/* Bottom Actions */}
            {!isCompact && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 pt-3 sm:pt-2">
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-xs sm:text-sm hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
                {currentStep === 1 ? (
                  <button 
                    type="button" 
                    onClick={handleNext} 
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg bg-teal-600 text-white text-xs sm:text-sm hover:bg-teal-700 transition-colors"
                  >
                    Next →
                  </button>
                ) : (
                  <div className="inline-flex gap-2 w-full sm:w-auto">
                    <button 
                      type="button" 
                      onClick={() => setCurrentStep(1)} 
                      className="flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-xs sm:text-sm hover:bg-gray-50 transition-colors"
                    >
                      ← Previous
                    </button>
                    <button 
                      type="button" 
                      onClick={handleSubmit} 
                      className="flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-lg bg-teal-600 text-white text-xs sm:text-sm hover:bg-teal-700 transition-colors"
                    >
                      ✓ Save
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>

            {/* Invoice Summary Card */}
            <div className={`${isCompact ? 'mt-2' : 'space-y-3'}`}>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-700" />
                  Invoice Information
                </h3>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Invoice No. :</span>
                    <span className="font-semibold text-gray-800">{formData.invoiceNumber || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Invoiced By:</span>
                    <span className="font-semibold text-gray-800">{autoFields.invoicedBy || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Date:</span>
                    <span className="font-semibold text-gray-800">{new Date(autoFields.invoicedDate).toLocaleDateString()}</span>
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

InvoiceManagementSystem.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedDashboard = withClinicAuth(InvoiceManagementSystem);
ProtectedDashboard.getLayout = InvoiceManagementSystem.getLayout;

export default ProtectedDashboard;
