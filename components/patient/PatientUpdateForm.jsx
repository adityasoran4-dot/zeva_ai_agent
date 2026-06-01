import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Calendar,
  User,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Edit,
  Loader2,
  Send,
  ChevronDown,
} from "lucide-react";

const genderOptions = ["", "Male", "Female", "Other"];
const patientTypeOptions = ["New", "Old"];
const insuranceOptions = ["Yes", "No"];
const insuranceTypeOptions = ["Paid", "Advance"];

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

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    info: <AlertCircle className="w-5 h-5 text-blue-600" />,
  };

  return (
    <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-4 sm:w-96 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${styles[type]} animate-slide-in`}>
      {icons[type]}
      <span className="font-medium text-sm flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 flex-shrink-0" aria-label="Close notification">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const EditableField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  required,
  options = [],
  placeholder,
  disabled = false,
  min,
  max,
  step,
  maxLength,
  isCompact = false,
}) => (
  <div className={`min-w-[120px] ${isCompact ? 'w-full' : 'flex-1'}`}>
    <label className={`block text-[10px] mb-0.5 font-medium text-gray-700 leading-tight`}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {type === "select" ? (
      <select
        name={name}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${disabled ? "bg-gray-100 cursor-not-allowed text-gray-500" : "bg-white text-gray-900 border-gray-300 hover:border-indigo-300"} ${isCompact ? "min-w-[100px]" : ""}`}
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
    ) : type === "textarea" ? (
      <textarea
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={2}
        className={`w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none ${disabled ? "bg-gray-100 cursor-not-allowed text-gray-500" : "bg-white text-gray-900 border-gray-300 hover:border-indigo-300"}`}
      />
    ) : (
      <input
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        className={`w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${disabled ? "bg-gray-100 cursor-not-allowed text-gray-500" : "bg-white text-gray-900 border-gray-300 hover:border-indigo-300"}`}
      />
    )}
  </div>
);

const PatientUpdateForm = ({ patientId, embedded = false, onClose, onUpdated }) => {
  const router = useRouter();
  const resolvedId = patientId || router.query.id;
  const [currentUser] = useState({ name: "Admin User", role: "Clinic" });
  const [invoiceInfo, setInvoiceInfo] = useState(null);
  const [formData, setFormData] = useState({});
  const [isProcessingUpdate, setIsProcessingUpdate] = useState(false);
  const [isUpdatingFromServer, setIsUpdatingFromServer] = useState(false);
  const [calculatedFields, setCalculatedFields] = useState({ needToPay: 0 });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("update"); // "update" or "paymentHistory"
  const [billingHistory, setBillingHistory] = useState([]);
  const [loadingBillingHistory, setLoadingBillingHistory] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [packages, setPackages] = useState([]);
  const [errors, setErrors] = useState({});
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferType, setTransferType] = useState("");
  const [selectedMembershipId, setSelectedMembershipId] = useState("");
  const [membershipUsage, setMembershipUsage] = useState(null);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [packageUsage, setPackageUsage] = useState(null);
  const [showAddMembership, setShowAddMembership] = useState(false);
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [membershipUsageMap, setMembershipUsageMap] = useState({});
  const [selectedTargetPatient, setSelectedTargetPatient] = useState(null);
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferNameMap, setTransferNameMap] = useState({});
  
  // Consent Form States
  const [consentForms, setConsentForms] = useState([]);
  const [selectedConsentId, setSelectedConsentId] = useState("");
  const [sendingConsent, setSendingConsent] = useState(false);
  const [consentSent, setConsentSent] = useState(false);
  const [consentStatuses, setConsentStatuses] = useState([]);
  const [loadingConsentStatus, setLoadingConsentStatus] = useState(false);
  
  const formatDate = useCallback((dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const authToken = getStoredToken();
  const showToast = (message, type = "success") => setToast({ message, type });

  const handleFieldChange = useCallback((e) => {
    const { name, value, type } = e.target;
    
    // Handle mobileNumber - only allow digits and limit to 10 digits
    if (name === "mobileNumber") {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
      }
      return;
    }
    
    let parsedValue = value;
    if (type === "number") {
      parsedValue = value === "" ? "" : Number(value);
    }
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  }, []);

  useEffect(() => {
    if (!resolvedId || !authToken) return;

    const fetchInvoice = async () => {
      setLoading(true);
      setFetchError("");

      try {
        const res = await fetch(`/api/staff/get-patient-data/${resolvedId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) throw new Error("Patient record not found");

        const data = await res.json();
        setInvoiceInfo(data);
        setFormData({
          ...data,
          invoicedDate: data.invoicedDate ? data.invoicedDate.slice(0, 16) : "",
        });
      } catch (err) {
        console.error(err);
        setFetchError(err.message || "Failed to fetch data");
        showToast(err.message || "Failed to fetch patient data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [resolvedId, authToken]);

  // Fetch referrals
  useEffect(() => {
    if (!authToken) return;
    
    const fetchReferrals = async () => {
      try {
        const headers = { Authorization: `Bearer ${authToken}` };
        const res = await fetch(`/api/clinic/referrals`, { headers });
        const data = await res.json();
        
        if (data.success && Array.isArray(data.referrals)) {
          setReferrals(data.referrals);
        }
      } catch (err) {
        console.error('Error fetching referrals:', err);
      }
    };
    
    fetchReferrals();
  }, [authToken]);
  useEffect(() => {
    // Prevent this effect from running when processing an update
    if (isProcessingUpdate || isUpdatingFromServer) return;
    
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
        const list = Array.isArray(prev.memberships) ? prev.memberships : [];
        const idx = list.findIndex((x) => x.membershipId === prev.membershipId);
        const item = { membershipId: prev.membershipId, startDate: startStr, endDate: endStr };
        const updated = idx >= 0 ? list.map((m, i) => (i === idx ? item : m)) : [...list, item];
        return {
          ...prev,
          memberships: updated,
          membershipStartDate: startStr,
          membershipEndDate: endStr,
        };
      });
    }
    if (formData.membership === "No") {
      setFormData((prev) => ({
        ...prev,
        membershipId: "",
        membershipStartDate: "",
        membershipEndDate: "",
      }));
    }
  }, [formData.membershipId, formData.membership, memberships, formatDate, isProcessingUpdate, isUpdatingFromServer]);

  useEffect(() => {
    if (!authToken) return;
    const headers = { Authorization: `Bearer ${authToken}` };
    const fetchLists = async () => {
      try {
        const [mRes, pRes] = await Promise.all([
          fetch("/api/clinic/memberships", { headers }),
          fetch("/api/clinic/packages", { headers }),
        ]);
        const mData = await mRes.json();
        const pData = await pRes.json();
        if (mData.success && Array.isArray(mData.memberships)) {
          setMemberships(mData.memberships);
        }
        if (pData.success && Array.isArray(pData.packages)) {
          setPackages(pData.packages);
        }
      } catch {}
    };
    fetchLists();
  }, [authToken]);

  // Handle adding membership from dropdown
  const handleAddMembership = useCallback(() => {
    if (!selectedMembershipId) return;
    
    const selected = memberships.find((m) => m._id === selectedMembershipId);
    if (!selected) return;
    
    const start = new Date();
    const end = new Date(start);
    const months = Number(selected.durationMonths) || 1;
    end.setMonth(end.getMonth() + months);
    const startStr = formatDate(start);
    const endStr = formatDate(end);
    
    setFormData((prev) => {
      const list = Array.isArray(prev.memberships) ? prev.memberships : [];
      // Check if this membership is already added
      const exists = list.some((x) => x.membershipId === selectedMembershipId);
      if (exists) {
        showToast("This membership is already added", "error");
        return prev;
      }
      const item = { 
        membershipId: selectedMembershipId, 
        startDate: startStr, 
        endDate: endStr 
      };
      return {
        ...prev,
        memberships: [...list, item],
      };
    });
    
    setSelectedMembershipId("");
    setShowAddMembership(false);
    showToast("Membership added successfully", "success");
  }, [selectedMembershipId, memberships, formatDate]);

  // Handle removing membership
  const handleRemoveMembership = useCallback((indexToRemove) => {
    setFormData((prev) => {
      const list = Array.isArray(prev.memberships) ? prev.memberships : [];
      const newList = list.filter((_, idx) => idx !== indexToRemove);
      
      // If this was the last membership, also clear the main membership fields
      if (newList.length === 0 && prev.membership === "Yes") {
        return {
          ...prev,
          memberships: newList,
          membershipId: "",
          membershipStartDate: "",
          membershipEndDate: "",
          membership: "No",
        };
      }
      
      return {
        ...prev,
        memberships: newList,
      };
    });
    // Clear the selected membership ID if it was removed
    setSelectedMembershipId("");
  }, []);

  // Handle adding package from dropdown
  const handleAddPackage = useCallback(() => {
    if (!selectedPackageId) return;
    
    setFormData((prev) => {
      const list = Array.isArray(prev.packages) ? prev.packages : [];
      // Check if this package is already added
      const exists = list.some((x) => x.packageId === selectedPackageId);
      if (exists) {
        showToast("This package is already added", "error");
        return prev;
      }
      const item = { 
        packageId: selectedPackageId, 
        assignedDate: new Date().toISOString() 
      };
      return {
        ...prev,
        packages: [...list, item],
      };
    });
    
    setSelectedPackageId("");
    setShowAddPackage(false);
    showToast("Package added successfully", "success");
  }, [selectedPackageId]);

  // Handle removing package
  const handleRemovePackage = useCallback((indexToRemove) => {
    setFormData((prev) => {
      const list = Array.isArray(prev.packages) ? prev.packages : [];
      const newList = list.filter((_, idx) => idx !== indexToRemove);
      
      // If this was the last package, also clear the main package fields
      if (newList.length === 0 && prev.package === "Yes") {
        return {
          ...prev,
          packages: newList,
          packageId: "",
          package: "No",
        };
      }
      
      return {
        ...prev,
        packages: newList,
      };
    });
    // Clear the selected package ID if it was removed
    setSelectedPackageId("");
  }, []);

  // Fetch membership usage when membership is selected for transfer
  useEffect(() => {
    if (showTransfer && transferType === "membership" && selectedMembershipId && resolvedId && authToken) {
      const fetchMembershipUsage = async () => {
        try {
          const qs = new URLSearchParams();
          qs.set("membershipId", selectedMembershipId);
          const res = await fetch(`/api/clinic/membership-usage/${resolvedId}?${qs.toString()}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          const data = await res.json();
          if (data.success) {
            setMembershipUsage(data);
          }
        } catch (error) {
          console.error('Error fetching membership usage:', error);
        }
      };
      fetchMembershipUsage();
    }
  }, [showTransfer, transferType, selectedMembershipId, resolvedId, authToken]);

  // Fetch package usage when package is selected for transfer
  useEffect(() => {
    if (showTransfer && transferType === "package" && selectedPackageId && resolvedId && authToken && packages.length > 0) {
      const fetchPackageUsage = async () => {
        try {
          const pkg = packages.find(p => p._id === selectedPackageId);
          if (!pkg) return;
          const qs = new URLSearchParams();
          qs.set("packageName", encodeURIComponent(pkg.name));
          const res = await fetch(`/api/clinic/package-usage/${resolvedId}?${qs.toString()}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          const data = await res.json();
          if (data.success) {
            const usage = (data.packageUsage || []).find(u => u.packageName === pkg.name);
            setPackageUsage(usage || null);
          }
        } catch (error) {
          console.error('Error fetching package usage:', error);
        }
      };
      fetchPackageUsage();
    }
  }, [showTransfer, transferType, selectedPackageId, resolvedId, authToken, packages]);

  // Fetch Consent Forms
  useEffect(() => {
    if (!resolvedId || !authToken) return;
    
    const fetchConsentForms = async () => {
      try {
        const headers = { Authorization: `Bearer ${authToken}` };
        const res = await axios.get("/api/clinic/consent", { headers });
        if (res.data?.success) setConsentForms(res.data.consents || []);
      } catch (err) {
        console.error("Error fetching consent forms:", err);
      }
    };
    
    fetchConsentForms();
  }, [resolvedId, authToken]);

  // Fetch Consent Statuses
  useEffect(() => {
    if (!resolvedId || !authToken) return;
    
    const fetchConsentStatuses = async () => {
      setLoadingConsentStatus(true);
      try {
        const headers = { Authorization: `Bearer ${authToken}` };
        
        // Fetch both signed consents and sent logs
        const [signaturesRes, logsRes] = await Promise.all([
          axios.get("/api/clinic/consent-status", {
            headers,
            params: { patientId: resolvedId },
          }),
          axios.get("/api/clinic/consent-log", {
            headers,
            params: { patientId: resolvedId },
          }),
        ]);
        
        const signatures = signaturesRes.data?.consentStatuses || [];
        const logs = logsRes.data?.consentLogs || [];
        
        // Merge logs and signatures
        const logMap = new Map();
        
        // Add all logs first (sent forms)
        logs.forEach((log) => {
          logMap.set(log.consentFormId, {
            _id: log._id,
            consentFormId: log.consentFormId,
            consentFormName: log.consentFormName,
            description: log.description || "",
            patientName: log.patientName,
            date: new Date(log.createdAt).toLocaleDateString("en-GB"),
            hasSignature: false,
            status: "sent",
            signedAt: null,
          });
        });
        
        // Update with signatures if they exist (signed forms)
        signatures.forEach((sig) => {
          logMap.set(sig.consentFormId, {
            ...sig,
            status: "signed",
          });
        });
        
        const merged = Array.from(logMap.values());
        setConsentStatuses(merged);
      } catch (err) {
        console.error("Error fetching consent statuses:", err);
      } finally {
        setLoadingConsentStatus(false);
      }
    };
    
    fetchConsentStatuses();
  }, [resolvedId, authToken]);

  // Send Consent Form on WhatsApp
  const handleSendConsentMsgOnWhatsapp = async () => {
    if (!selectedConsentId || !formData) return;
 
    try {
      setSendingConsent(true);
      
      // Create patient data object for URL
      const patientData = {
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        mobileNumber: formData.mobileNumber || "",
        email: formData.email || "",
      };
      
      const encodedPatientData = encodeURIComponent(JSON.stringify(patientData));
      const consentUrl = `https://zeva360.com/consent-form/${selectedConsentId}?patient=${encodedPatientData}`;
 
      const { data } = await axios.post(
        "/api/messages/send-message",
        {
          patientId: resolvedId,
          providerId: "6952256c4a46b2f1eb01be86",
          channel: "whatsapp",
          content: `Please review and sign the consent form by clicking the link below:\n\n ${consentUrl}\n\n Thank you.`,
          mediaUrl: "",
          mediaType: "",
          source: "Zeva",
          messageType: "conversational",
          templateId: "69c38b4d26b8217e1ba78f8a",
          headerParameters: [],
          bodyParameters: [
            {
              type: "text",
              text: consentUrl,
            },
          ],
          attachments: [],
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
 
      if (data && data?.success) {
        setConsentSent(true);
        
        // Log the sent consent form
        try {
          const selectedForm = consentForms.find((f) => f._id === selectedConsentId);
          await axios.post(
            "/api/clinic/consent-log",
            {
              consentFormId: selectedConsentId,
              consentFormName: selectedForm?.formName || "",
              patientId: resolvedId,
              patientName: `${formData.firstName} ${formData.lastName}`.trim(),
              sentVia: "whatsapp",
            },
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
          
          // Refresh consent statuses
          setTimeout(() => {
            const headers = { Authorization: `Bearer ${authToken}` };
            axios.get("/api/clinic/consent-log", {
              headers,
              params: { patientId: resolvedId },
            }).then((logsRes) => {
              const logs = logsRes.data?.consentLogs || [];
              const logMap = new Map();
              
              logs.forEach((log) => {
                logMap.set(log.consentFormId, {
                  _id: log._id,
                  consentFormId: log.consentFormId,
                  consentFormName: log.consentFormName,
                  description: log.description || "",
                  patientName: log.patientName,
                  date: new Date(log.createdAt).toLocaleDateString("en-GB"),
                  hasSignature: false,
                  status: "sent",
                  signedAt: null,
                });
              });
              
              setConsentStatuses(Array.from(logMap.values()));
            });
          }, 100);
        } catch (logError) {
          console.error("Error logging consent form sent:", logError);
        }
      }
    } catch (error) {
      console.error("Error sending consent form:", error?.response?.data || error.message);
      showToast("Failed to send consent form", "error");
    } finally {
      setSendingConsent(false);
    }
  };

  useEffect(() => {
    // Prevent this effect from running when processing an update
    if (isProcessingUpdate || isUpdatingFromServer) return;
    
    if (formData.package === "Yes" && formData.packageId) {
      setFormData((prev) => {
        const list = Array.isArray(prev.packages) ? prev.packages : [];
        const idx = list.findIndex((x) => x.packageId === prev.packageId);
        const updated = idx >= 0 ? list : [...list, { packageId: prev.packageId, assignedDate: new Date().toISOString() }];
        return { ...prev, packages: updated };
      });
    }
    if (formData.package === "No") {
      setFormData((prev) => ({ ...prev, packageId: "" }));
    }
  }, [formData.packageId, formData.package, isProcessingUpdate, isUpdatingFromServer]);

  // Fetch billing history when payment history tab is active
  useEffect(() => {
    if (activeTab === "paymentHistory" && resolvedId && authToken && !loadingBillingHistory) {
      const fetchBillingHistory = async () => {
        setLoadingBillingHistory(true);
        try {
          const res = await fetch(`/api/clinic/billing-history/${resolvedId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              const filteredBillings = (data.billings || []).filter(b => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance");
              setBillingHistory(filteredBillings);
            }
          }
        } catch (err) {
          console.error("Error fetching billing history:", err);
        } finally {
          setLoadingBillingHistory(false);
        }
      };
      fetchBillingHistory();
    }
  }, [activeTab, resolvedId, authToken]);

  const calculateNeedToPay = useCallback(() => {
    if (formData.insurance === "Yes" && formData.insuranceType === "Advance") {
      const advanceGivenAmount = parseFloat(formData.advanceGivenAmount) || 0;
      const coPayPercent = parseFloat(formData.coPayPercent) || 0;
      const coPayAmount = (advanceGivenAmount * coPayPercent) / 100;
      setCalculatedFields((prev) => ({ ...prev, needToPay: Math.max(0, advanceGivenAmount - coPayAmount) }));
    } else {
      setCalculatedFields((prev) => ({ ...prev, needToPay: 0 }));
    }
  }, [formData.insurance, formData.insuranceType, formData.advanceGivenAmount, formData.coPayPercent]);

  useEffect(() => {
    calculateNeedToPay();
  }, [calculateNeedToPay]);

  useEffect(() => {
    if (!resolvedId || !authToken) return;
    const entries = [];
    if (formData.membership === "Yes" && formData.membershipId && formData.membershipStartDate && formData.membershipEndDate) {
      entries.push({
        membershipId: formData.membershipId,
        startDate: formData.membershipStartDate,
        endDate: formData.membershipEndDate,
      });
    }
    if (Array.isArray(formData.memberships)) {
      formData.memberships.forEach((m) => {
        if (m.membershipId && m.startDate && m.endDate) {
          entries.push({
            membershipId: m.membershipId,
            startDate: m.startDate,
            endDate: m.endDate,
          });
        }
      });
    }
    if (entries.length === 0) {
      setMembershipUsageMap({});
      return;
    }
    let cancelled = false;
    const loadAll = async () => {
      const results = {};
      await Promise.all(entries.map(async (e) => {
        const key = `${e.membershipId}|${e.startDate}|${e.endDate}`;
        try {
          const qs = new URLSearchParams();
          qs.set("membershipId", e.membershipId);
          qs.set("startDate", e.startDate);
          qs.set("endDate", e.endDate);
          const res = await fetch(`/api/clinic/membership-usage/${resolvedId}?${qs.toString()}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          const data = await res.json();
          results[key] = data && data.success ? data : null;
        } catch {
          results[key] = null;
        }
      }));
      if (!cancelled) setMembershipUsageMap(results);
    };
    loadAll();
    return () => { cancelled = true; };
  }, [resolvedId, authToken, formData.membership, formData.membershipId, formData.membershipStartDate, formData.membershipEndDate, JSON.stringify(formData.memberships || [])]);

  useEffect(() => {
    if (!resolvedId || !authToken) return;
    if (!showTransfer) return;
    if (transferType === "membership") {
      const loadUsage = async () => {
        try {
          let startDate = "";
          let endDate = "";
          if (selectedMembershipId) {
            const entry = (formData.memberships || []).find(m => m.membershipId === selectedMembershipId);
            if (entry) {
              startDate = entry.startDate || "";
              endDate = entry.endDate || "";
            } else if (formData.membership === "Yes" && formData.membershipId === selectedMembershipId) {
              startDate = formData.membershipStartDate || "";
              endDate = formData.membershipEndDate || "";
            }
          }
          const qs = new URLSearchParams();
          if (selectedMembershipId) qs.set("membershipId", selectedMembershipId);
          if (startDate) qs.set("startDate", startDate);
          if (endDate) qs.set("endDate", endDate);
          const res = await fetch(`/api/clinic/membership-usage/${resolvedId}?${qs.toString()}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          const data = await res.json();
          if (data.success) {
            setMembershipUsage(data);
          }
        } catch {}
      };
      loadUsage();
    }
    if (transferType === "package" && selectedPackageId) {
      const loadPkgUsage = async () => {
        try {
          const pkg = packages.find(p => p._id === selectedPackageId);
          if (!pkg) return;
          const res = await fetch(`/api/clinic/package-usage/${resolvedId}?packageName=${encodeURIComponent(pkg.name)}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          const data = await res.json();
          if (data.success) {
            const item = (data.packageUsage || []).find(u => u.packageName === pkg.name) || null;
            setPackageUsage(item || null);
          }
        } catch {}
      };
      loadPkgUsage();
    }
  }, [showTransfer, transferType, resolvedId, authToken, selectedPackageId, packages, selectedMembershipId, formData.memberships, formData.membership, formData.membershipId, formData.membershipStartDate, formData.membershipEndDate]);

  useEffect(() => {
    const doSearch = async () => {
      if (!authToken) return;
      const term = searchQuery.trim();
      if (term.length < 1) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/clinic/search-patients?search=${encodeURIComponent(term)}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (data.success) {
          const filtered = (data.patients || []).filter(p => p._id !== resolvedId);
          setSearchResults(filtered);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };
    const t = setTimeout(doSearch, 400);
    return () => clearTimeout(t);
  }, [searchQuery, authToken, resolvedId]);


  const handleFullUpdate = useCallback(async () => {
    if (!invoiceInfo) return;
    const fieldErrors = [];
    // API validation: firstName is required
    if (!formData.firstName?.trim()) fieldErrors.firstName = "First Name is required";
    // Database model validation: mobileNumber is also required
    if (!formData.mobileNumber?.trim()) fieldErrors.mobileNumber = "Mobile Number is required";
    if (formData.membership === "Yes") {
      if (!formData.membershipId) fieldErrors.membershipId = "Membership is required";
      if (!formData.membershipStartDate) fieldErrors.membershipStartDate = "Membership Start Date is required";
      if (!formData.membershipEndDate) fieldErrors.membershipEndDate = "Membership End Date is required";
    }
    if (formData.package === "Yes") {
      if (!formData.packageId) fieldErrors.packageId = "Package is required";
    }
    if (formData.insurance === "Yes") {
      if (!formData.insuranceType) fieldErrors.insuranceType = "Insurance Type is required";
      if (formData.insuranceType === "Advance") {
        if (formData.coPayPercent === "" || formData.coPayPercent === undefined) {
          fieldErrors.coPayPercent = "Co-Pay % is required";
        }
      } else {
        formData.advanceGivenAmount = 0;
        formData.coPayPercent = 0;
      }
    } else {
      formData.insuranceType = "Paid";
      formData.advanceGivenAmount = 0;
      formData.coPayPercent = 0;
    }
    setErrors(fieldErrors);
    const firstError = Object.values(fieldErrors)[0];
    if (firstError) {
      showToast(firstError, "error");
      return;
    }
  
  
    const invoiceId = invoiceInfo?._id;
    const payload = {
      updateType: "details",
      invoiceNumber: formData.invoiceNumber,
      invoicedDate: formData.invoicedDate ? new Date(formData.invoicedDate).toISOString() : null,
      emrNumber: formData.emrNumber,
      firstName: formData.firstName,
      lastName: formData.lastName,
      gender: formData.gender,
      email: formData.email,
      mobileNumber: formData.mobileNumber,
      referredBy: formData.referredBy,
      patientType: formData.patientType,
      insurance: formData.insurance,
      insuranceType: formData.insuranceType,
      advanceGivenAmount: formData.advanceGivenAmount,
      coPayPercent: formData.coPayPercent,
      notes: formData.notes,
      membership: formData.membership,
      membershipStartDate: formData.membershipStartDate,
      membershipEndDate: formData.membershipEndDate,
      membershipId: formData.membershipId,
      package: formData.package,
      packageId: formData.packageId,
      memberships: Array.isArray(formData.memberships) ? formData.memberships : [],
      packages: Array.isArray(formData.packages) ? formData.packages : [],
    };
  
    try {
      // Set flag to prevent useEffect side effects during update
      setIsProcessingUpdate(true);
        
      const res = await fetch(`/api/staff/get-patient-data/${invoiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
  
      const result = await res.json();
      if (res.ok) {
        const updated = result.updatedInvoice;
        // Ensure flags remain true during the update process to prevent useEffects from running
        setIsProcessingUpdate(true);
        setIsUpdatingFromServer(true);
        setInvoiceInfo(updated);
        setFormData({
          ...updated,
          invoicedDate: updated.invoicedDate ? updated.invoicedDate.slice(0, 16) : "",
        });
          
        // Reset flags after state updates are processed with longer timeout to prevent useEffects from running
        setTimeout(() => {
          setIsProcessingUpdate(false);
          setIsUpdatingFromServer(false);
          // Refresh memberships and packages data from API after successful update
          const refreshLists = async () => {
            try {
              const headers = { Authorization: `Bearer ${authToken}` };
              const [mRes, pRes] = await Promise.all([
                fetch("/api/clinic/memberships", { headers }),
                fetch("/api/clinic/packages", { headers }),
              ]);
              const mData = await mRes.json();
              const pData = await pRes.json();
              if (mData.success && Array.isArray(mData.memberships)) {
                setMemberships(mData.memberships);
              }
              if (pData.success && Array.isArray(pData.packages)) {
                setPackages(pData.packages);
              }
            } catch (err) {
              console.error("Error refreshing lists:", err);
            }
          };
          refreshLists();
        }, 100);
        showToast(result.message || "Patient updated successfully", "success");
        if (onUpdated) onUpdated();
        // Close modal after successful update (with small delay to show toast)
        if (onClose) {
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } else {
        setIsProcessingUpdate(false);
        showToast(result.message || "Failed to update patient details", "error");
      }
    } catch (err) {
      console.error(err);
      setIsProcessingUpdate(false);
      showToast("Network error. Try again later.", "error");
    }
  }, [authToken, formData, invoiceInfo, onUpdated, onClose]);

  const handleSubmitTransfer = useCallback(async () => {
    if (!authToken || !resolvedId) return;
    if (!selectedTargetPatient) return;
    setTransferSubmitting(true);
    try {
      if (transferType === "membership") {
        if (!selectedMembershipId || !membershipUsage || !membershipUsage.remainingFreeConsultations || membershipUsage.remainingFreeConsultations <= 0) {
          showToast("No remaining membership benefits to transfer", "error");
          setTransferSubmitting(false);
          return;
        }
        const res = await fetch(`/api/clinic/transfer-benefits`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            type: "membership",
            sourcePatientId: resolvedId,
            targetPatientId: selectedTargetPatient._id,
            membershipId: selectedMembershipId,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message || "Membership transferred", "success");
          setShowTransfer(false);
          setTransferType("");
          setMembershipUsage(null);
          setSelectedTargetPatient(null);
          setSelectedMembershipId("");
          if (onUpdated) onUpdated();
        } else {
          showToast(data.message || "Transfer failed", "error");
        }
      } else if (transferType === "package") {
        if (!selectedPackageId) {
          showToast("Select a package to transfer", "error");
          setTransferSubmitting(false);
          return;
        }
        const res = await fetch(`/api/clinic/transfer-benefits`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            type: "package",
            sourcePatientId: resolvedId,
            targetPatientId: selectedTargetPatient._id,
            packageId: selectedPackageId,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message || "Package transferred", "success");
          setShowTransfer(false);
          setTransferType("");
          setPackageUsage(null);
          setSelectedTargetPatient(null);
          setSelectedPackageId("");
          if (onUpdated) onUpdated();
        } else {
          showToast(data.message || "Transfer failed", "error");
        }
      }
    } catch (e) {
      showToast("Transfer failed", "error");
    } finally {
      setTransferSubmitting(false);
    }
  }, [authToken, resolvedId, selectedTargetPatient, transferType, selectedMembershipId, membershipUsage, packageUsage, selectedPackageId, onUpdated]);

  useEffect(() => {
    const ids = new Set();
    (invoiceInfo?.membershipTransfers || []).forEach(t => {
      if (t.toPatientId) ids.add(String(t.toPatientId));
      if (t.fromPatientId) ids.add(String(t.fromPatientId));
    });
    (invoiceInfo?.packageTransfers || []).forEach(t => {
      if (t.toPatientId) ids.add(String(t.toPatientId));
      if (t.fromPatientId) ids.add(String(t.fromPatientId));
    });
    const uniqueIds = Array.from(ids).filter(Boolean);
    if (!authToken || uniqueIds.length === 0) return;
    let mounted = true;
    const loadNames = async () => {
      const map = {};
      try {
        await Promise.all(
          uniqueIds.map(async (pid) => {
            try {
              const r = await fetch(`/api/staff/get-patient-data/${pid}`, {
                headers: { Authorization: `Bearer ${authToken}` },
              });
              const data = await r.json();
              if (r.ok && data?._id) {
                const name = `${(data.firstName || "").trim()} ${(data.lastName || "").trim()}`.trim() || data.emrNumber || pid;
                map[pid] = name;
              }
            } catch {}
          })
        );
      } finally {
        if (mounted) setTransferNameMap(map);
      }
    };
    loadNames();
    return () => { mounted = false; };
  }, [invoiceInfo?.membershipTransfers, invoiceInfo?.packageTransfers, authToken]);


  const hasPriorityBooking = useMemo(() => {
    if (Array.isArray(formData.memberships) && formData.memberships.length > 0) {
      return formData.memberships.some(m => {
        const membership = memberships.find(mem => mem._id === m.membershipId);
        return membership?.benefits?.priorityBooking;
      });
    }
    // Fallback to legacy single membership field
    if (formData.membership === "Yes" && formData.membershipId) {
      const membership = memberships.find(m => m._id === formData.membershipId);
      return membership?.benefits?.priorityBooking || false;
    }
    return false;
  }, [formData.memberships, formData.membership, formData.membershipId, memberships]);

  const canViewMobileNumber = useMemo(
    () => ["Admin", "Super Admin", "Clinic"].includes(currentUser.role),
    [currentUser.role]
  );

  if (!embedded && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm md:text-base text-gray-800 font-medium">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (!embedded && fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-md w-full">
          <AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-red-500 mx-auto mb-4" />
          <p className="text-sm md:text-base text-red-600 font-semibold">{fetchError}</p>
        </div>
      </div>
    );
  }

  const containerClass = embedded
    ? "fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-md"
    : "min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-3 sm:p-4 md:p-6 lg:p-8";

  return (
    <div className={containerClass}>
      <style jsx global>{`
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {embedded ? (
        <div className="relative w-full max-w-6xl h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-teal-100">
          <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-blue-600 px-4 sm:px-6 py-3 flex items-center justify-between z-10 rounded-t-2xl">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Edit className="w-5 h-5 text-white flex-shrink-0" />
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">Edit Patient Details</h1>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg text-white hover:text-white transition-colors flex-shrink-0 backdrop-blur-sm"
                aria-label="Close edit modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto bg-gray-50">
            <div className="p-3 space-y-4 flex-1 overflow-y-auto">
              {/* Tabs - Only show Update tab, removed Payment History */}
              <div className="flex gap-2 border-b border-gray-200 mb-3 pb-2">
                <button
                  onClick={() => setActiveTab("update")}
                  className={`px-4 py-2 text-[11px] font-semibold transition-all duration-300 flex items-center gap-1 ${
                    activeTab === "update"
                      ? "text-indigo-700 border-b-2 border-indigo-500 bg-indigo-50 rounded-t-lg"
                      : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-t-lg"
                  }`}
                >
                  <Edit className="w-3 h-3" />
                  Update Patient Details
                </button>
              </div>

              {/* Update Patient Tab */}
              {activeTab === "update" && (
                <>
                {/* Invoice Information Section - REMOVED - Users cannot edit invoice details */}
                {/* 
                <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-indigo-200 shadow-md`}>
                  <h2 className={`text-[14px] font-bold text-indigo-700 mb-2 flex items-center gap-1`}>
                    <Calendar className={`w-4 h-4 text-indigo-600 flex-shrink-0`} />
                    Invoice Information
                  </h2>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3`}>
                    <EditableField
                      label="Invoice Number"
                      name="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={handleFieldChange}
                      isCompact={embedded}
                    />
                    <EditableField
                      label="Invoiced Date"
                      name="invoicedDate"
                      type="datetime-local"
                      value={formData.invoicedDate || ""}
                      onChange={handleFieldChange}
                      isCompact={embedded}
                    />
                    <EditableField
                      label="Invoiced By"
                      name="invoicedBy"
                      value={formData.invoicedBy}
                      onChange={handleFieldChange}
                      isCompact={embedded}
                    />
                  </div>
                </div>
                */}

                <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-indigo-200 shadow-md`}>
                  <h2 className={`text-[14px] font-bold text-blue-700 mb-2 flex items-center gap-1`}>
                    <User className={`w-4 h-4 text-blue-600`} />
                    Patient Information
                  </h2>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3`}>
                    <div className="relative group">
                      <EditableField
                        label="EMR Number (Read-Only)"
                        name="emrNumber"
                        value={formData.emrNumber}
                        onChange={handleFieldChange}
                        disabled
                      />
                      <div className="absolute hidden group-hover:block bottom-full left-0 mb-1 px-2 py-1 bg-gray-800 text-white text-[9px] rounded whitespace-nowrap z-10">
                        EMR Number cannot be changed
                      </div>
                    </div>
                    <EditableField
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleFieldChange}
                      required
                    />
                    <EditableField
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleFieldChange}
                    />
                    <EditableField
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleFieldChange}
                    />
                    <EditableField
                      label="Mobile Number"
                      name="mobileNumber"
                      type="tel"
                      value={canViewMobileNumber ? formData.mobileNumber : ""}
                      onChange={handleFieldChange}
                      required
                      disabled={!canViewMobileNumber}
                      maxLength={10}
                    />
                    <EditableField
                      label="Gender"
                      name="gender"
                      type="select"
                      value={formData.gender}
                      onChange={handleFieldChange}
                      options={genderOptions}
                      placeholder="Select Gender"
                    />
                    <EditableField
                      label="Patient Type"
                      name="patientType"
                      type="select"
                      value={formData.patientType}
                      onChange={handleFieldChange}
                      options={patientTypeOptions}
                    />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 shadow-md">
                    <div className="flex flex-col gap-4">
                      {/* Row 1: Referred By */}
                      <div className="w-full">
                        <label className="block text-[10px] mb-0.5 font-medium text-gray-700">
                          Referred by
                        </label>
                        <select
                          name="referredBy"
                          value={formData.referredBy === "No" ? "" : (formData.referredBy || "")}
                          onChange={handleFieldChange}
                          className={`text-gray-900 w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${formData.referredBy && formData.referredBy !== "No" ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'}`}
                        >
                          <option value="">Select Referred By</option>
                          {referrals.map((r) => {
                            const displayName = `${(r.firstName || "").trim()} ${(r.lastName || "").trim()}`.trim() || (r.email || r.phone || "Unknown");
                            return (
                              <option key={r._id} value={displayName}>
                                {displayName} ({r.referralPercent}%)
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Membership and Package Section - Side by Side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Membership Card */}
                        <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                          <h3 className="text-[14px] font-bold text-indigo-700 mb-2 flex items-center gap-1">
                            <User className="w-4 h-4 text-indigo-600" />
                            Membership
                            {hasPriorityBooking && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium">
                                Priority
                              </span>
                            )}
                          </h3>
                          <div className="flex flex-wrap gap-2 items-end">
                            <div className="flex-1 min-w-[120px] md:min-w-[140px]">
                              <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Membership</label>
                              <select
                                name="membership"
                                value={formData.membership || "No"}
                                onChange={handleFieldChange}
                                className="text-gray-900 w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 border-gray-300 hover:border-indigo-400"
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
                                  value={formData.membershipId || ""}
                                  onChange={handleFieldChange}
                                  className={`text-gray-900 w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${errors.membershipId ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-indigo-400'}`}
                                >
                                  <option value="">Select membership</option>
                                  {memberships.filter(m => m.isActive !== false).map(m => (
                                    <option key={m._id} value={m._id}>
                                      {m.name} (₹{m.price}, {m.durationMonths} months)
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
                          </div>

                          {formData.membership === "Yes" && (
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-2 items-end">
                                <div className="flex-1 min-w-[120px]">
                                  <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
                                  <input
                                    type="date"
                                    name="membershipStartDate"
                                    value={formData.membershipStartDate ? formData.membershipStartDate.slice(0, 10) : ""}
                                    onChange={handleFieldChange}
                                    className={`w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-gray-900 ${errors.membershipStartDate ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-indigo-400'}`}
                                  />
                                  {errors.membershipStartDate && (
                                    <p className="text-red-500 text-[9px] mt-0.5 flex items-center gap-0.5">
                                      <AlertCircle className="w-2.5 h-2.5" />{errors.membershipStartDate}
                                    </p>
                                  )}
                                </div>
                                <div className="flex-1 min-w-[120px]">
                                  <label className="block text-[10px] mb-0.5 font-medium text-gray-700">End Date <span className="text-red-500">*</span></label>
                                  <input
                                    type="date"
                                    name="membershipEndDate"
                                    value={formData.membershipEndDate ? formData.membershipEndDate.slice(0, 10) : ""}
                                    onChange={handleFieldChange}
                                    className={`w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-gray-900 ${errors.membershipEndDate ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-indigo-400'}`}
                                  />
                                  {errors.membershipEndDate && (
                                    <p className="text-red-500 text-[9px] mt-0.5 flex items-center gap-0.5">
                                      <AlertCircle className="w-2.5 h-2.5" />{errors.membershipEndDate}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="mt-2">
                                {/* Add Membership Button and Dropdown */}
                                {!showAddMembership && (
                                  <button
                                    type="button"
                                    onClick={() => setShowAddMembership(true)}
                                    className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                  >
                                    <span>+ Add Another Membership</span>
                                  </button>
                                )}
                                
                                {showAddMembership && (
                                  <div className="border border-indigo-200 rounded-lg p-2 bg-indigo-50">
                                    <div className="flex flex-wrap gap-2 items-end mb-2">
                                      <div className="flex-1 min-w-[150px]">
                                        <label className="block text-[9px] mb-0.5 font-medium text-gray-700">Select Membership to Add</label>
                                        <select
                                          value={selectedMembershipId}
                                          onChange={(e) => setSelectedMembershipId(e.target.value)}
                                          className="text-gray-900 w-full px-2 py-1.5 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 border-gray-300 hover:border-indigo-400"
                                        >
                                          <option value="">Select membership</option>
                                          {memberships.filter(m => m.isActive !== false).map(m => (
                                            <option key={m._id} value={m._id}>
                                              {m.name} (₹{m.price}, {m.durationMonths} months)
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="flex gap-1">
                                        <button
                                          type="button"
                                          onClick={handleAddMembership}
                                          disabled={!selectedMembershipId}
                                          className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Add
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setShowAddMembership(false);
                                            setSelectedMembershipId("");
                                          }}
                                          className="px-3 py-1.5 bg-gray-300 text-gray-700 text-[10px] font-medium rounded-lg hover:bg-gray-400 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {(() => {
                                  if (!(formData.membership === "Yes" && formData.membershipId && formData.membershipStartDate && formData.membershipEndDate)) return null;
                                  const k = `${formData.membershipId}|${formData.membershipStartDate}|${formData.membershipEndDate}`;
                                  const usage = membershipUsageMap[k];
                                  if (!usage || usage.isExpired || (usage.totalFreeConsultations || 0) === 0) return null;
                                  const total = usage.totalFreeConsultations || 0;
                                  const used = usage.usedFreeConsultations || 0;
                                  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                                  return (
                                    <div className="mb-2">
                                      <div className="flex items-center justify-between text-[9px] text-gray-700 mb-0.5">
                                        <span>Free consultations used</span>
                                        <span>{used}/{total}</span>
                                      </div>
                                      <div className="w-full h-2 rounded bg-gray-200 overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                                      </div>
                                    </div>
                                  );
                                })()}
                                {(Array.isArray(formData.memberships) ? formData.memberships : []).length > 0 && (
                                  <div className="border border-gray-200 rounded p-2">
                                    <div className="text-[10px] font-semibold text-gray-900 mb-1">Added Memberships</div>
                                    <div className="space-y-1">
                                      {(formData.memberships || []).map((m, idx) => {
                                        const plan = memberships.find((x) => x._id === m.membershipId);
                                        return (
                                          <div key={`${m.membershipId}-${idx}`} className="flex flex-col text-[10px] border-b border-gray-100 pb-1 last:border-b-0">
                                            <div className="flex items-center justify-between">
                                              <div className="text-gray-800 font-medium">
                                                {plan?.name || m.membershipId} • ₹{plan?.price}
                                                {plan?.benefits?.priorityBooking && (
                                                  <span className="ml-1 px-1 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-medium">
                                                    Priority
                                                  </span>
                                                )}
                                              </div>
                                              <button
                                                type="button"
                                                className="px-2 py-0.5 bg-red-50 text-red-700 rounded border border-red-200"
                                                onClick={() => {
                                                  handleRemoveMembership(idx);
                                                }}
                                              >
                                                Remove
                                              </button>
                                            </div>
                                            <div className="text-gray-600 mt-0.5">
                                              {m.startDate?.slice(0,10)} → {m.endDate?.slice(0,10)} • {plan?.durationMonths} months
                                            </div>
                                            <div className="text-gray-500 text-[9px] mt-0.5">
                                              Benefits: {plan?.benefits?.freeConsultations || 0} consultations, {plan?.benefits?.discountPercentage || 0}% discount
                                            </div>
                                            {(() => {
                                              const k = `${m.membershipId}|${m.startDate}|${m.endDate}`;
                                              const usage = membershipUsageMap[k];
                                              if (!usage || usage.isExpired || (usage.totalFreeConsultations || 0) === 0) return null;
                                              const total = usage.totalFreeConsultations || 0;
                                              const used = usage.usedFreeConsultations || 0;
                                              const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                                              return (
                                                <div className="mt-1">
                                                  <div className="flex items-center justify-between text-[9px] text-gray-700 mb-0.5">
                                                    <span>Free consultations used</span>
                                                    <span>{used}/{total}</span>
                                                  </div>
                                                  <div className="w-full h-2 rounded bg-gray-200 overflow-hidden">
                                                    <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                                                  </div>
                                                </div>
                                              );
                                            })()}
                                          {(invoiceInfo?.membershipTransfers || []).length > 0 && (
                                            <div className="mt-0.5">
                                              {(invoiceInfo.membershipTransfers || []).filter(t => String(t.membershipId) === String(m.membershipId)).map((t, ti) => (
                                                <span key={ti} className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium ${t.type === 'out' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                  {t.type === 'out' ? 'Transferred to' : 'Transferred from'} {(transferNameMap[String(t.toPatientId)] || transferNameMap[String(t.fromPatientId)] || '').trim()}
                                                </span>
                                              ))}
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
                          )}
                        </div>

                        {/* Package Card */}
                        <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                          <h3 className="text-[14px] font-bold text-purple-700 mb-2 flex items-center gap-1">
                            <FileText className="w-4 h-4 text-purple-600" />
                            Package
                          </h3>
                          <div className="flex flex-wrap gap-2 items-end">
                            <div className="flex-1 min-w-[120px]">
                              <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Package</label>
                              <select
                                name="package"
                                value={formData.package || "No"}
                                onChange={handleFieldChange}
                                className="text-gray-900 w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 border-gray-300 hover:border-indigo-400"
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
                                  value={formData.packageId || ""}
                                  onChange={handleFieldChange}
                                  className={`text-gray-900 w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${errors.packageId ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-indigo-400'}`}
                                >
                                  <option value="">Select package</option>
                                  {packages.map(p => (
                                    <option key={p._id} value={p._id}>
                                      {p.name} (₹{p.totalPrice}, {p.totalSessions} sessions)
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

                          {formData.package === "Yes" && (
                            <div className="mt-2">
                              {/* Add Package Button and Dropdown */}
                              {!showAddPackage && (
                                <button
                                  type="button"
                                  onClick={() => setShowAddPackage(true)}
                                  className="px-3 py-1.5 bg-purple-600 text-white text-[10px] font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                                >
                                  <span>+ Add Another Package</span>
                                </button>
                              )}
                              
                              {showAddPackage && (
                                <div className="border border-purple-200 rounded-lg p-2 bg-purple-50">
                                  <div className="flex flex-wrap gap-2 items-end mb-2">
                                    <div className="flex-1 min-w-[150px]">
                                      <label className="block text-[9px] mb-0.5 font-medium text-gray-700">Select Package to Add</label>
                                      <select
                                        value={selectedPackageId}
                                        onChange={(e) => setSelectedPackageId(e.target.value)}
                                        className="text-gray-900 w-full px-2 py-1.5 text-[10px] border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 border-gray-300 hover:border-purple-400"
                                      >
                                        <option value="">Select package</option>
                                        {packages.map(p => (
                                          <option key={p._id} value={p._id}>
                                            {p.name} (₹{p.totalPrice}, {p.totalSessions} sessions)
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        onClick={handleAddPackage}
                                        disabled={!selectedPackageId}
                                        className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        Add
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowAddPackage(false);
                                          setSelectedPackageId("");
                                        }}
                                        className="px-3 py-1.5 bg-gray-300 text-gray-700 text-[10px] font-medium rounded-lg hover:bg-gray-400 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {(Array.isArray(formData.packages) ? formData.packages : []).length > 0 && (
                                <div className="border border-gray-200 rounded p-2">
                                  <div className="text-[10px] font-semibold text-gray-900 mb-1">Added Packages</div>
                                  <div className="space-y-1">
                                    {(formData.packages || []).map((p, idx) => {
                                      const pkg = packages.find((x) => x._id === p.packageId);
                                      return (
                                        <div key={`${p.packageId}-${idx}`} className="flex flex-col text-[10px] border-b border-gray-100 pb-1 last:border-b-0">
                                          <div className="flex items-center justify-between">
                                            <div className="text-gray-800 font-medium">
                                              {pkg?.name || p.packageId} • ₹{pkg?.totalPrice}
                                            </div>
                                            <button
                                              type="button"
                                              className="px-2 py-0.5 bg-red-50 text-red-700 rounded border border-red-200"
                                              onClick={() => {
                                                handleRemovePackage(idx);
                                              }}
                                            >
                                              Remove
                                            </button>
                                          </div>
                                          <div className="text-gray-600 mt-0.5">
                                            {pkg?.totalSessions} sessions • ₹{pkg?.sessionPrice}/session
                                          </div>
                                          <div className="text-gray-500 text-[9px] mt-0.5">
                                            Treatments: {pkg?.treatments?.length || 0} included
                                          </div>
                                          {(invoiceInfo?.packageTransfers || []).length > 0 && (
                                            <div className="mt-0.5">
                                              {(invoiceInfo.packageTransfers || []).filter(t => String(t.packageId) === String(p.packageId)).map((t, ti) => (
                                                <span key={ti} className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium ${t.type === 'out' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                  {t.type === 'out' ? 'Transferred to' : 'Transferred from'} {(transferNameMap[String(t.toPatientId)] || transferNameMap[String(t.fromPatientId)] || '').trim()}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                </div>

                <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-indigo-200 shadow-md`}>
                  <h2 className={`text-[14px] font-bold text-purple-700 mb-2`}>Insurance Details</h2>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3`}>
                    <EditableField
                      label="Insurance"
                      name="insurance"
                      type="select"
                      value={formData.insurance || "No"}
                      onChange={handleFieldChange}
                      options={insuranceOptions}
                    />
                    {formData.insurance === "Yes" && (
                      <>
                        <EditableField
                          label="Insurance Type"
                          name="insuranceType"
                          type="select"
                          value={formData.insuranceType}
                          onChange={handleFieldChange}
                          options={insuranceTypeOptions}
                        />
                        {formData.insuranceType === "Advance" && (
                          <>
                            <EditableField
                              label="Advance Given Amount"
                              name="advanceGivenAmount"
                              type="number"
                              value={formData.advanceGivenAmount}
                              onChange={handleFieldChange}
                              min={0}
                            />
                            <EditableField
                              label="Co-Pay %"
                              name="coPayPercent"
                              type="number"
                              value={formData.coPayPercent}
                              onChange={handleFieldChange}
                              min={0}
                              max={100}
                            />
                            <EditableField
                              label="Need to Pay Amount (Auto)"
                              name="needToPay"
                              value={`د.إ ${calculatedFields.needToPay.toFixed(2)}`}
                              onChange={() => {}}
                              disabled
                            />
                          </>
                        )}
                      </>
                    )}
                    <EditableField
                      label="Advance Claim Status"
                      name="advanceClaimStatus"
                      value={formData.advanceClaimStatus || "-"}
                      onChange={() => {}}
                      disabled
                    />
                    {formData.advanceClaimReleaseDate && (
                      <EditableField
                        label="Advance Claim Release Date"
                        name="advanceClaimReleaseDate"
                        value={new Date(formData.advanceClaimReleaseDate).toLocaleString()}
                        onChange={() => {}}
                        disabled
                      />
                    )}
                    {formData.advanceClaimReleasedBy && (
                      <EditableField
                        label="Advance Claim Released By"
                        name="advanceClaimReleasedBy"
                        value={formData.advanceClaimReleasedBy}
                        onChange={() => {}}
                        disabled
                      />
                    )}
                    {formData.advanceClaimCancellationRemark && (
                      <EditableField
                        label="Cancellation Reason"
                        name="advanceClaimCancellationRemark"
                        value={formData.advanceClaimCancellationRemark}
                        onChange={() => {}}
                        disabled
                      />
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[14px] font-bold text-emerald-700">Transfer</h2>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={showTransfer}
                        onChange={(e) => {
                          setShowTransfer(e.target.checked);
                          if (!e.target.checked) {
                            setTransferType("");
                            setMembershipUsage(null);
                            setPackageUsage(null);
                            setSelectedTargetPatient(null);
                            setSelectedPackageId("");
                            setSelectedMembershipId("");
                          }
                        }}
                      />
                      <span className="text-[11px] text-gray-700">Enable</span>
                    </label>
                  </div>
                  {showTransfer && (
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="transferType"
                            value="membership"
                            checked={transferType === "membership"}
                            onChange={(e) => {
                              setTransferType(e.target.value);
                              setSelectedPackageId("");
                              setPackageUsage(null);
                              const arr = Array.isArray(formData.memberships) ? formData.memberships : [];
                              if (arr.length > 0) {
                                setSelectedMembershipId(arr[0].membershipId);
                              } else if (formData.membership === "Yes" && formData.membershipId) {
                                setSelectedMembershipId(formData.membershipId);
                              } else {
                                setSelectedMembershipId("");
                              }
                            }}
                          />
                          <span className="text-[11px]">Transfer Membership</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="transferType"
                            value="package"
                            checked={transferType === "package"}
                            onChange={(e) => {
                              setTransferType(e.target.value);
                              setMembershipUsage(null);
                            }}
                          />
                          <span className="text-[11px]">Transfer Package</span>
                        </label>
                      </div>
                      {transferType === "membership" && (
                        <div className="rounded-lg border border-emerald-200 bg-white p-3">
                          <div className="mb-2">
                            <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Select Membership</label>
                            <select
                              value={selectedMembershipId}
                              onChange={(e) => setSelectedMembershipId(e.target.value)}
                              className="text-gray-900 w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 border-gray-300 hover:border-indigo-400"
                            >
                              <option value="">Select membership</option>
                              {(formData.memberships || []).map((m, idx) => {
                                const plan = memberships.find((x) => x._id === m.membershipId);
                                return (
                                  <option key={`${m.membershipId}-${idx}`} value={m.membershipId}>
                                    {plan?.name || m.membershipId} ({m.startDate?.slice(0,10)} → {m.endDate?.slice(0,10)})
                                  </option>
                                );
                              })}
                              {formData.membership === "Yes" && formData.membershipId && !(formData.memberships || []).some(m => m.membershipId === formData.membershipId) && (
                                <option value={formData.membershipId}>
                                  {(() => {
                                    const plan = memberships.find((x) => x._id === formData.membershipId);
                                    return plan?.name || formData.membershipId;
                                  })()} ({formData.membershipStartDate?.slice(0,10)} → {formData.membershipEndDate?.slice(0,10)})
                                </option>
                              )}
                            </select>
                          </div>
                          {membershipUsage ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="text-[11px]">
                                <div className="font-semibold text-gray-700">Total Free Consultations</div>
                                <div className="text-gray-900">{membershipUsage.totalFreeConsultations || 0}</div>
                              </div>
                              <div className="text-[11px]">
                                <div className="font-semibold text-gray-700">Used Free Consultations</div>
                                <div className="text-gray-900">{membershipUsage.usedFreeConsultations || 0}</div>
                              </div>
                              <div className="text-[11px]">
                                <div className="font-semibold text-gray-700">Remaining</div>
                                <div className="text-gray-900">{membershipUsage.remainingFreeConsultations || 0}</div>
                              </div>
                              <div className="text-[11px]">
                                <div className="font-semibold text-gray-700">Discount %</div>
                                <div className="text-gray-900">{membershipUsage.discountPercentage || 0}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-gray-600">Loading membership usage...</div>
                          )}
                        </div>
                      )}
                      {transferType === "package" && (
                        <div className="rounded-lg border border-emerald-200 bg-white p-3 space-y-2">
                          <div>
                            <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Select Package</label>
                            <select
                              value={selectedPackageId}
                              onChange={(e) => setSelectedPackageId(e.target.value)}
                              className="text-gray-900 w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 border-gray-300 hover:border-indigo-400"
                            >
                              <option value="">Select package</option>
                              {(formData.packages || []).map((p) => {
                                const pkg = packages.find(x => x._id === p.packageId);
                                return pkg ? (
                                  <option key={pkg._id} value={pkg._id}>
                                    {pkg.name} (₹{pkg.totalPrice}, {pkg.totalSessions} sessions)
                                  </option>
                                ) : null;
                              })}
                            </select>
                          </div>
                          {selectedPackageId && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="text-[11px]">
                                <div className="font-semibold text-gray-700">Total Sessions</div>
                                <div className="text-gray-900">
                                  {(() => {
                                    const pkg = packages.find(p => p._id === selectedPackageId);
                                    return pkg ? pkg.totalSessions : 0;
                                  })()}
                                </div>
                              </div>
                              <div className="text-[11px]">
                                <div className="font-semibold text-gray-700">Used Sessions</div>
                                <div className="text-gray-900">{packageUsage?.totalSessions || 0}</div>
                              </div>
                              <div className="text-[11px]">
                                <div className="font-semibold text-gray-700">Remaining</div>
                                <div className="text-gray-900">
                                  {typeof packageUsage?.remainingSessions === "number"
                                    ? packageUsage.remainingSessions
                                    : Math.max(0, (() => {
                                        const pkg = packages.find(p => p._id === selectedPackageId);
                                        const totalSess = pkg ? pkg.totalSessions : 0;
                                        return totalSess - (packageUsage?.totalSessions || 0);
                                      })())}
                                </div>
                              </div>
                              <div className="text-[11px]">
                                <div className="font-semibold text-gray-700">Package</div>
                                <div className="text-gray-900">
                                  {(() => {
                                    const pkg = packages.find(p => p._id === selectedPackageId);
                                    return pkg ? pkg.name : "-";
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="rounded-lg border border-emerald-200 bg-white p-3 space-y-2">
                        <div>
                          <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Search Target Patient</label>
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Type name, mobile, or EMR"
                            className="w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 border-gray-300 hover:border-indigo-400"
                          />
                        </div>
                        <div className="max-h-48 overflow-auto border border-gray-200 rounded">
                          {searchLoading ? (
                            <div className="p-2 text-[10px] text-gray-600">Searching...</div>
                          ) : (searchResults || []).length === 0 ? (
                            <div className="p-2 text-[10px] text-gray-600">No results</div>
                          ) : (
                            <ul className="divide-y divide-gray-200">
                              {searchResults.map((p) => (
                                <li key={p._id} className="p-2 hover:bg-gray-50 cursor-pointer text-[11px]" onClick={() => setSelectedTargetPatient(p)}>
                                  <div className="font-medium text-gray-900">{p.fullName || `${p.firstName} ${p.lastName}`}</div>
                                  <div className="text-gray-600">{p.emrNumber} • {p.mobileNumber}</div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {selectedTargetPatient && (
                          <div className="text-[11px] text-gray-800">
                            Selected: {selectedTargetPatient.fullName || `${selectedTargetPatient.firstName} ${selectedTargetPatient.lastName}`} ({selectedTargetPatient.emrNumber})
                          </div>
                        )}
                        <div className="flex justify-end">
                          <button
                            onClick={handleSubmitTransfer}
                            disabled={
                              transferSubmitting ||
                              !selectedTargetPatient ||
                              (transferType === "membership" && (!selectedMembershipId)) ||
                              (transferType === "package" && (!selectedPackageId))
                            }
                            className="px-4 py-2 text-[11px] bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 font-bold shadow-lg"
                          >
                            {transferSubmitting ? "Transferring..." : "Confirm Transfer"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 mt-3 border-t border-gray-200">
                  {/* Send Consent Form - Full Width */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-3 border border-blue-200">
                    <div className="flex items-center justify-between gap-3">
                      <select
                        value={selectedConsentId}
                        onChange={(e) => setSelectedConsentId(e.target.value)}
                        disabled={sendingConsent || consentSent}
                        className="flex-1 px-4 py-2.5 text-[11px] border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Consent Form</option>
                        {consentForms.map((form) => (
                          <option key={form._id} value={form._id}>
                            {form.formName}
                          </option>
                        ))}
                      </select>
                      
                      <button
                        onClick={handleSendConsentMsgOnWhatsapp}
                        disabled={!selectedConsentId || sendingConsent || consentSent}
                        className="px-4 py-2.5 text-[11px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                      >
                        {sendingConsent ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Sending...
                          </>
                        ) : consentSent ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Sent
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            Send Consent
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Update Button - Bottom Right Corner */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleFullUpdate}
                      className="px-6 py-2.5 text-[11px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-bold shadow-lg transform hover:scale-105"
                    >
                      Update Patient Details
                    </button>
                  </div>
                </div>
                </>
              )}

              {/* Payment History Tab */}
              {activeTab === "paymentHistory" && (
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-200 shadow-md flex flex-col h-[500px]">
                  <h2 className="text-[14px] font-bold text-teal-700 mb-2 flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-teal-600" />
                    Payment History
                  </h2>
                  
                  {loadingBillingHistory ? (
                    <div className="flex items-center justify-center py-6 flex-1">
                      <Loader2 className="w-3 h-3 animate-spin text-gray-500 mr-1.5" />
                      <span className="text-[9px] text-gray-500">Loading payment history...</span>
                    </div>
                  ) : billingHistory.length === 0 ? (
                    <div className="text-center py-6 flex-1 flex items-center justify-center">
                      <p className="text-[9px] text-gray-500">No payment history found</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-auto rounded-lg border border-gray-200">
                      <table className="w-full text-[10px] min-w-full divide-y divide-gray-200">
                        <thead className="sticky top-0 bg-gray-800 text-white z-10">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium uppercase tracking-wider">Invoice ID</th>
                            <th className="px-3 py-2 text-left font-medium uppercase tracking-wider">Treatment/Package</th>
                            <th className="px-3 py-2 text-left font-medium uppercase tracking-wider">Total Amount</th>
                            <th className="px-3 py-2 text-left font-medium uppercase tracking-wider">Paid</th>
                            <th className="px-3 py-2 text-left font-medium uppercase tracking-wider">Pending</th>
                            <th className="px-3 py-2 text-left font-medium uppercase tracking-wider">Advance</th>
                            <th className="px-3 py-2 text-left font-medium uppercase tracking-wider">Quantity</th>
                            <th className="px-3 py-2 text-left font-medium uppercase tracking-wider">Session</th>
                            <th className="px-3 py-2 text-left font-medium uppercase tracking-wider">Payment Method</th>
                            <th className="px-3 py-2 text-left font-medium uppercase tracking-wider">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billingHistory.map((billing, index) => (
                            <tr key={billing._id || index} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{billing.invoiceNumber || "-"}</td>
                              <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                                {billing.service === "Treatment" ? billing.treatment : billing.package || "-"}
                              </td>
                              <td className="px-3 py-2 text-gray-900 whitespace-nowrap">₹{billing.amount?.toFixed(2) || "0.00"}</td>
                              <td className="px-3 py-2 text-gray-900 whitespace-nowrap">₹{billing.paid?.toFixed(2) || "0.00"}</td>
                              <td className="px-3 py-2 text-gray-900 whitespace-nowrap">₹{billing.pending?.toFixed(2) || "0.00"}</td>
                              <td className="px-3 py-2 text-gray-900 whitespace-nowrap">₹{billing.advance?.toFixed(2) || "0.00"}</td>
                              <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{billing.quantity || "-"}</td>
                              <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{billing.sessions || "-"}</td>
                              <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{billing.paymentMethod || "-"}</td>
                              <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                                {billing.invoicedDate ? new Date(billing.invoicedDate).toLocaleDateString() : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-2 py-1.5 ml-3 mr-3">
            <div>
              <h1 className="text-xs font-bold flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Patient & Invoice Management
              </h1>
              <p className="text-indigo-100 mt-0.5 text-[8px]">View and update patient information</p>
            </div>
          </div>
          <div className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4">
            {/* Rest of the non-embedded content */}
            {/** Content from original lines 517-1003 would go here */}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientUpdateForm;

