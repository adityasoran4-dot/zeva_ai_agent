import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  Calendar, User, DollarSign, FileText, AlertCircle, Activity,
  CreditCard, TrendingUp, Package, Phone,
  Mail, Clock, Shield, X, CheckCircle, XCircle,
  ExternalLink,
  AlertTriangle, Plus, FileImage, Wallet, ClipboardList, Send, Pill, ClipboardCheck,
  ChevronDown, Search, Loader2, Check,  Camera, Image as ImageIcon, Eye, Edit2, Trash2, Paperclip,
  Filter
} from 'lucide-react';
import ClinicLayout from '../../components/ClinicLayout';
import withClinicAuth from '../../components/withClinicAuth';
import AddPatientAdvancePaymentModal from '@/components/patient/AddPatientAdvancePaymentModal';
import AddPatientPastAdvancePaymentModal from '@/components/patient/AddPatientPastAdvancePaymentModal';
import PayPendingBalanceModal from '@/components/patient/PayPendingBalanceModal';
import { getCurrencySymbol } from '@/lib/currencyHelper';

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
    const value = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const getAuthHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getUserRole = () => {
  try {
    const token = getStoredToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.role || payload.userRole || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

const getCurrentUserName = () => {
  try {
    const token = getStoredToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.name || payload.firstName || payload.userName || null;
  } catch (error) {
    console.error('Error getting user name:', error);
    return null;
  }
};

// Transfer Section Component - Updated to use parent patientData and trigger refresh
const TransferSection = ({ patientId, patientData, onTransferComplete }: { patientId: string; patientData: any; onTransferComplete?: () => void }) => {
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferType, setTransferType] = useState("");
  const [selectedMembershipId, setSelectedMembershipId] = useState("");
  const [membershipUsage, setMembershipUsage] = useState<any>(null);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [packageUsage, setPackageUsage] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedTargetPatient, setSelectedTargetPatient] = useState<any>(null);
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [localMemberships, setLocalMemberships] = useState<any[]>([]);
  const [localPackages, setLocalPackages] = useState<any[]>([]);
  // COMMENTED OUT: Public packages no longer used - only patient packages are fetched
  // const [publicPackages, setPublicPackages] = useState<any[]>([]);

  // Fetch memberships and packages on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = getAuthHeaders() || {};
       
        // Fetch memberships
        const membershipsRes = await axios.get('/api/clinic/memberships', { headers });
        if (membershipsRes.data.success) {
          setLocalMemberships(membershipsRes.data.memberships || []);
        }

        // Fetch packages
        const packagesRes = await axios.get('/api/clinic/packages', { headers });
        if (packagesRes.data.success) {
          setLocalPackages(packagesRes.data.packages || []);
        }

        // Fetch public packages - COMMENTED OUT: Only fetch patient packages now
        // if (patientData?._id) {
        //   const publicPackagesRes = await axios.get('/api/clinic/public-package', {
        //     headers,
        //     params: {
        //       patientId: patientData._id,
        //       clinicId: patientData.clinicId,
        //     }
        //   });
        //   if (publicPackagesRes.data.success) {
        //     setPublicPackages(publicPackagesRes.data.existingPackages || []);
        //   }
        // }
      } catch (error) {
        console.error('Error fetching transfer data:', error);
      }
    };

    fetchData();
  }, [patientId]);

  // Fetch membership usage when membership is selected
  useEffect(() => {
    if (transferType === "membership" && selectedMembershipId) {
      const fetchMembershipUsage = async () => {
        try {
          const headers = getAuthHeaders() || {};
          const res = await axios.get(`/api/clinic/membership-usage/${patientId}?membershipId=${selectedMembershipId}`, { headers });
          console.log('Membership usage API response:', res.data);
         
          // Handle different response structures
          if (res.data.success) {
            const usageData = res.data.usage || res.data.data || res.data;
            setMembershipUsage(usageData || null);
          } else {
            console.warn('API returned success=false:', res.data);
            setMembershipUsage(null);
          }
        } catch (error: any) {
          console.error('Error fetching membership usage:', error.message);
          console.error('Full error:', error);
          setMembershipUsage(null);
        }
      };
      fetchMembershipUsage();
    }
  }, [transferType, selectedMembershipId, patientId]);

  // Fetch package usage when package is selected
  useEffect(() => {
    if (transferType === "package" && selectedPackageId) {
      const fetchPackageUsage = async () => {
        try {
          const headers = getAuthHeaders() || {};
          const res = await axios.get(`/api/clinic/package-usage/${patientId}`, { headers });
          if (res.data.success) {
            // Find the selected package from localPackages to get its name
            const selectedPkg = localPackages.find((p: any) => p._id === selectedPackageId);
            if (selectedPkg) {
              // Match by packageName like the Packages section does
              const usage = res.data.packageUsage?.find((p: any) => p.packageName === selectedPkg.name);
              setPackageUsage(usage || null);
            } else {
              setPackageUsage(null);
            }
          }
        } catch (error) {
          console.error('Error fetching package usage:', error);
        }
      };
      fetchPackageUsage();
    }
  }, [transferType, selectedPackageId, patientId, localPackages]);

  // Search for target patients
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const headers = getAuthHeaders() || {};
        // Use the correct search API endpoint with 'search' parameter
        const res = await axios.get(`/api/clinic/search-patients?search=${encodeURIComponent(searchQuery)}`, { headers });
        if (res.data.success || res.data.patients) {
          setSearchResults(res.data.patients || []);
        } else if (Array.isArray(res.data)) {
          setSearchResults(res.data);
        }
      } catch (error) {
        console.error('Error searching patients:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSubmitTransfer = async () => {
    if (!selectedTargetPatient) {
      alert('Please select a target patient');
      return;
    }

    setTransferSubmitting(true);
    try {
      const headers = getAuthHeaders() || {};
     
      if (transferType === "membership") {
        // Check if there are remaining benefits to transfer (same as PatientUpdateForm)
        // Calculate remaining consultations from total and used
        const totalConsultations = membershipUsage?.totalFreeConsultations || 0;
        const usedConsultations = membershipUsage?.usedFreeConsultations || 0;
        const remainingConsultations = Math.max(0, totalConsultations - usedConsultations);
       
        if (!selectedMembershipId || !membershipUsage || remainingConsultations <= 0) {
          alert('No remaining membership benefits to transfer');
          setTransferSubmitting(false);
          return;
        }
        const res = await axios.post('/api/clinic/transfer-benefits', {
          type: "membership",
          sourcePatientId: patientId,
          targetPatientId: selectedTargetPatient._id,
          membershipId: selectedMembershipId,
        }, { headers });
        const data = res.data;
        if (res.status === 200 || res.status === 201) {
          alert(data.message || 'Membership transferred successfully!');
          setShowTransfer(false);
          setTransferType("");
          setMembershipUsage(null);
          setSelectedTargetPatient(null);
          setSelectedMembershipId("");
          if (onTransferComplete) onTransferComplete();
        } else {
          alert(data.message || 'Transfer failed');
        }
      } else if (transferType === "package") {
        if (!selectedPackageId) {
          alert('Select a package to transfer');
          setTransferSubmitting(false);
          return;
        }
        // Use the same endpoint as PatientUpdateForm
        const res = await axios.post('/api/clinic/transfer-benefits', {
          type: "package",
          sourcePatientId: patientId,
          targetPatientId: selectedTargetPatient._id,
          packageId: selectedPackageId,
        }, { headers });
        const data = res.data;
        if (res.status === 200 || res.status === 201) {
          alert(data.message || 'Package transferred successfully!');
          setShowTransfer(false);
          setTransferType("");
          setPackageUsage(null);
          setSelectedTargetPatient(null);
          setSelectedPackageId("");
          if (onTransferComplete) onTransferComplete();
        } else {
          alert(data.message || 'Transfer failed');
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Transfer failed');
    } finally {
      setTransferSubmitting(false);
    }
  };

  return (
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
                // Only clear transfer-specific state, keep search data
                setTransferType("");
                setMembershipUsage(null);
                setPackageUsage(null);
                setSelectedTargetPatient(null);
                setSelectedPackageId("");
                setSelectedMembershipId("");
                // Keep searchQuery and searchResults to preserve user's search
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
                  const arr = Array.isArray(patientData?.memberships) ? patientData.memberships : [];
                  if (arr.length > 0) {
                    setSelectedMembershipId(arr[0].membershipId);
                  } else if (patientData?.membership === "Yes" && patientData.membershipId) {
                    setSelectedMembershipId(patientData.membershipId);
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
                  {(Array.isArray(patientData?.memberships) ? patientData.memberships : []).map((m: any, idx: number) => {
                    const plan = localMemberships.find((x: any) => x._id === m.membershipId);
                    return (
                      <option key={`${m.membershipId}-${idx}`} value={m.membershipId}>
                        {plan?.name || m.membershipId} ({m.startDate?.slice(0,10)} → {m.endDate?.slice(0,10)})
                      </option>
                    );
                  })}
                  {patientData?.membership === "Yes" && patientData.membershipId && !(Array.isArray(patientData?.memberships) ? patientData.memberships : []).some((m: any) => m.membershipId === patientData.membershipId) && (
                    <option value={patientData.membershipId}>
                      {(() => {
                        const plan = localMemberships.find((x: any) => x._id === patientData.membershipId);
                        return plan?.name || patientData.membershipId;
                      })()} ({patientData.membershipStartDate?.slice(0,10)} → {patientData.membershipEndDate?.slice(0,10)})
                    </option>
                  )}
                </select>
              </div>
              {membershipUsage ? (() => {
                // Always calculate remaining from total and used to ensure consistency
                const totalConsultations = membershipUsage.totalFreeConsultations || 0;
                const usedConsultations = membershipUsage.usedFreeConsultations || 0;
                const remainingConsultations = Math.max(0, totalConsultations - usedConsultations);
               
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-[11px]">
                      <div className="font-semibold text-gray-700">Total Free Consultations</div>
                      <div className="text-gray-900">{totalConsultations}</div>
                    </div>
                    <div className="text-[11px]">
                      <div className="font-semibold text-gray-700">Used Free Consultations</div>
                      <div className="text-gray-900">{usedConsultations}</div>
                    </div>
                    <div className="text-[11px]">
                      <div className="font-semibold text-gray-700">Remaining</div>
                      <div className="text-gray-900">{remainingConsultations}</div>
                    </div>
                    <div className="text-[11px]">
                      <div className="font-semibold text-gray-700">Discount %</div>
                      <div className="text-gray-900">{membershipUsage.discountPercentage || 0}</div>
                    </div>
                  </div>
                );
              })() : (
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
                  {/* Patient's existing packages */}
                  {(Array.isArray(patientData?.packages) ? patientData.packages : []).map((p: any) => {
                    const pkg = localPackages.find(x => x._id === p.packageId);
                    return pkg ? (
                      <option key={pkg._id} value={pkg._id}>
                        {pkg.name} - Patient Package
                      </option>
                    ) : null;
                  })}
                  {/* Public packages - COMMENTED OUT: Only show patient packages */}
                  {/* publicPackages.map((pkg: any) => (
                    <option key={pkg._id} value={pkg._id}>
                      {pkg.packageName || pkg.name} - Public Package
                    </option>
                  )) */}
                </select>
              </div>
              {selectedPackageId && (() => {
                const pkg = localPackages.find((p: any) => p._id === selectedPackageId);
                const totalSess = pkg ? pkg.totalSessions : 0;
                const usedSess = packageUsage?.totalSessions || 0;
                // Always calculate remaining from total and used to ensure consistency
                const remainingSess = Math.max(0, totalSess - usedSess);
               
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-[11px]">
                      <div className="font-semibold text-gray-700">Total Sessions</div>
                      <div className="text-gray-900">{totalSess}</div>
                    </div>
                    <div className="text-[11px]">
                      <div className="font-semibold text-gray-700">Used Sessions</div>
                      <div className="text-gray-900">{usedSess}</div>
                    </div>
                    <div className="text-[11px]">
                      <div className="font-semibold text-gray-700">Remaining</div>
                      <div className="text-gray-900">{remainingSess}</div>
                    </div>
                    <div className="text-[11px]">
                      <div className="font-semibold text-gray-700">Package</div>
                      <div className="text-gray-900">{pkg ? pkg.name : "-"}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <div className="rounded-lg border border-emerald-200 bg-white p-3 space-y-2">
            <div>
              <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Search Target Patient</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  e.preventDefault();
                  setSearchQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
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
                  {searchResults.map((p: any) => (
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmitTransfer();
                }}
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
  );
};

const formatPmDate = (d: Date) => {
  const y = d.getFullYear();
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mon}-${day}`;
};

// Modern Patient Profile Dashboard Component
const PatientProfileDashboard = ({ patientData, onClose, onPatientUpdated }: { patientData: any; onClose: () => void; onPatientUpdated?: (updatedData: any) => void }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showBeforeAfterModal, setShowBeforeAfterModal] = useState(false);
  const [currency, setCurrency] = useState('INR');
  const [appointments, setAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  
  // Drag and drop for status filter tabs
  const [draggedStatusKey, setDraggedStatusKey] = useState<string | null>(null);
  const [statusTabOrder, setStatusTabOrder] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("appointmentStatusTabOrder");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // Swallow parse errors silently
        }
      }
    }
    return [
      'all', 'booked', 'upcoming', 'enquiry', 'Arrived', 'Waiting', 
      'Consultation', 'Approved', 'Rescheduled', 'Completed', 
      'Discharge', 'invoice', 'Cancelled', 'Rejected', 'No Show'
    ];
  });
  
  // Default status tabs configuration
  const statusTabsConfig = [
    { key: 'all',          label: 'All' },
    { key: 'booked',       label: 'Booked' },
    { key: 'upcoming',     label: 'Upcoming' },
    { key: 'enquiry',      label: 'Enquiry' },
    { key: 'Arrived',      label: 'Arrived' },
    { key: 'Waiting',      label: 'Waiting' },
    { key: 'Consultation', label: 'Consultation' },
    { key: 'Approved',     label: 'Approved' },
    { key: 'Rescheduled',  label: 'Rescheduled' },
    { key: 'Completed',    label: 'Completed' },
    { key: 'Discharge',    label: 'Discharge' },
    { key: 'invoice',      label: 'Invoice' },
    { key: 'Cancelled',    label: 'Cancelled' },
    { key: 'Rejected',     label: 'Rejected' },
    { key: 'No Show',      label: 'No Show' },
  ];
    const [packages, setPackages] = useState([]);
  const [userPackages, setUserPackages] = useState<any[]>([]);
  const [memberships, setMemberships] = useState([]);
  const [transferredInPackages, setTransferredInPackages] = useState<any[]>([]);
  const [transferredOutPackages, setTransferredOutPackages] = useState<any[]>([]);
  const [transferredInMemberships, setTransferredInMemberships] = useState<any[]>([]);
  const [transferredOutMemberships, setTransferredOutMemberships] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [billingHistory, setBillingHistory] = useState<any>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [billingSearchQuery, setBillingSearchQuery] = useState('');
  const [billingSearchType, setBillingSearchType] = useState<'all' | 'invoice' | 'treatment'>('all');
  const [expandedTreatments, setExpandedTreatments] = useState<Record<string, boolean>>({});
  
  // Cache for package names to avoid repeated API calls
  const [packageNameCache, setPackageNameCache] = useState<Record<string, string>>({});
  const [allPackagesLoaded, setAllPackagesLoaded] = useState(false);

  // Function to fetch package name by ID
  const fetchPackageName = async (packageId: string): Promise<string> => {
    // Return from cache if available
    if (packageNameCache[packageId]) {
      return packageNameCache[packageId];
    }

    // If we haven't loaded all packages yet, load them now
    if (!allPackagesLoaded) {
      try {
        const headers = getAuthHeaders();
        if (!headers) return 'Package';
        
        const res = await axios.get('/api/clinic/packages', { headers });
        if (res.data?.success && res.data?.packages) {
          // Build cache from all packages
          const newCache: Record<string, string> = { ...packageNameCache };
          res.data.packages.forEach((pkg: any) => {
            if (pkg._id && pkg.name) {
              newCache[pkg._id] = pkg.name;
            }
          });
          setPackageNameCache(newCache);
          setAllPackagesLoaded(true);
          
          // Return the package name if found
          if (newCache[packageId]) {
            return newCache[packageId];
          }
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
      }
    }
    
    return 'Package';
  };

  // Cashback state
  const [validCashback, setValidCashback] = useState<any>(null);
  const [allAppointmentsData, setAllAppointmentsData] = useState<any[]>([]);
  const [loadingTreatmentAppointments, setLoadingTreatmentAppointments] = useState(false);
  const [mediaDocuments, setMediaDocuments] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
 
  // Consent Form Status States
  const [consentStatuses, setConsentStatuses] = useState<any[]>([]);
  const [loadingConsentStatus, setLoadingConsentStatus] = useState(false);
  const [consentForms, setConsentForms] = useState<any[]>([]);
  const [selectedConsentId, setSelectedConsentId] = useState("");
  const [sendingConsent, setSendingConsent] = useState(false);
  const [consentSent, setConsentSent] = useState(false);
 
  // Package Link State
  const [sendingPackageLink, setSendingPackageLink] = useState(false);
// Created Packages State (from UserPackage model)
const [createdPackages, setCreatedPackages] = useState<any[]>([]);
const [loadingCreatedPackages, setLoadingCreatedPackages] = useState(false);
 
  // Progress Notes & Prescription States
  const [progressNotes, setProgressNotes] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loadingProgressNotes, setLoadingProgressNotes] = useState(false);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
 
  // Stats state - fetched on mount
  const [statsData, setStatsData] = useState({
    totalVisits: 0,
    completedVisits: 0,
    completedInvoices: 0,
    cancelledNoShow: 0,
    activePackages: 0,
    pendingSessions: 0,
    insuranceClaimsPending: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Insurance Claims state
  const [insuranceClaims, setInsuranceClaims] = useState<any[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimViewModal, setClaimViewModal] = useState<any>(null);
  const [claimEditModal, setClaimEditModal] = useState<any>(null);
    const [claimTrackingModal, setClaimTrackingModal] = useState<any>(null);
  const [claimEditData, setClaimEditData] = useState<any>({});
  const [claimEditLoading, setClaimEditLoading] = useState(false);
  const [claimEditUploadingFiles, setClaimEditUploadingFiles] = useState(false);
  const [claimDepartments, setClaimDepartments] = useState<any[]>([]);
  const [claimServices, setClaimServices] = useState<any[]>([]);
  const [claimDoctors, setClaimDoctors] = useState<any[]>([]);
  // New claim form state
  const [showNewClaimForm, setShowNewClaimForm] = useState(false);
  const [newClaimSubmitting, setNewClaimSubmitting] = useState(false);
  const [newClaimUploadingFiles, setNewClaimUploadingFiles] = useState(false);
  const [newClaimData, setNewClaimData] = useState<any>({
    insuranceProvider: "",
    policyNumber: "",
    expiryDate: "",
    insuranceCardFile: "",
    tableOfBenefitsFile: "",
    departmentId: "",
    departmentName: "",
    serviceId: "",
    serviceName: "",
    services: [], // Array to store multiple services
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
  const [newClaimDepartments, setNewClaimDepartments] = useState<any[]>([]);
  const [newClaimServices, setNewClaimServices] = useState<any[]>([]);
  const [newClaimDoctors, setNewClaimDoctors] = useState<any[]>([]);
 
  // Package payment balance tracking
  const [pkgAvailableBalance, setPkgAvailableBalance] = useState({
    advanceBalance: 0,
    claimAmount: 0,
  });
  const [pkgUseAdvanceBalance, setPkgUseAdvanceBalance] = useState(false);
  const [pkgUseClaimBalance, setPkgUseClaimBalance] = useState(false);
  const [pkgAdvanceUsedAmount, setPkgAdvanceUsedAmount] = useState(0);
  const [pkgClaimUsedAmount, setPkgClaimUsedAmount] = useState(0);
  const [pkgLoadingBalance, setPkgLoadingBalance] = useState(false);
 
  // Financial snapshot state - initialized from patientData.initialBalance if available
  const [financialData, setFinancialData] = useState({
    totalSpent: 0,
    pendingPayment: Number(patientData?.initialBalance?.pendingBalance || 0),
    advanceBalance: Number(patientData?.initialBalance?.advanceBalance || 0)
  });

  // Advance & Pending balance state - initialized from patientData.initialBalance if available
  const [balance, setBalance] = useState({
    pendingBalance: Number(patientData?.initialBalance?.pendingBalance || 0),
    advanceBalance: Number(patientData?.initialBalance?.advanceBalance || 0),
    claimAmount: Number(patientData?.initialBalance?.claimAmount || 0),
    pendingClaim: Number(patientData?.initialBalance?.pendingClaim || 0),
    pastAdvanceBalance: Number(patientData?.initialBalance?.pastAdvanceBalance || 0),
    pastAdvance50PercentBalance: Number(patientData?.initialBalance?.pastAdvance50PercentBalance || 0),
    pastAdvance54PercentBalance: Number(patientData?.initialBalance?.pastAdvance54PercentBalance || 0),
    pastAdvance159FlatBalance: Number(patientData?.initialBalance?.pastAdvance159FlatBalance || 0),
    pendingBalanceImages: [] as string[],
  });
  // Patient is risky if they have pending claim from balance (authoritative source from patient-balance API)
  const isRiskyPatient = balance.pendingClaim > 0;
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadImageModal, setShowUploadImageModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [docViewerUrl, setDocViewerUrl] = useState<string | null>(null);
  const [mediaSubTab, setMediaSubTab] = useState<'before-after' | 'payment-proofs'>('before-after');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAddAdvancePaymentModal, setShowAddAdvancePaymentModal] = useState(false);
  const [showAddPastAdvancePayment50PercentModal, setShowAddPastAdvancePayment50PercentModal] = useState(false);
  const [showAddPastAdvancePayment54PercentModal, setShowAddPastAdvancePayment54PercentModal] = useState(false);
  const [showAddPastAdvancePayment159FlatModal, setShowAddPastAdvancePayment159FlatModal] = useState(false);
  const [showPayPendingModal, setShowPayPendingModal] = useState(false);
    const [showPayPendingClaimModal, setShowPayPendingClaimModal] = useState(false);
  const [selectedPaymentHistoryBilling, setSelectedPaymentHistoryBilling] = useState<any>(null);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
    const [payingPendingClaim, setPayingPendingClaim] = useState(false);
    const [pendingClaimPayAmount, setPendingClaimPayAmount] = useState("");
    const [pendingClaimPayMethod, setPendingClaimPayMethod] = useState("Cash");
    // Invoice-specific payment modal states
    const [showInvoicePayModal, setShowInvoicePayModal] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
    const [invoicePayAmount, setInvoicePayAmount] = useState("");
    const [invoicePayMethod, setInvoicePayMethod] = useState("Cash");
    const [payingInvoicePending, setPayingInvoicePending] = useState(false);
    const [invoiceUseAdvanceBalance, setInvoiceUseAdvanceBalance] = useState(false);
    const [invoiceAdvanceUsed, setInvoiceAdvanceUsed] = useState(0);
    const [invoiceAvailableBalance, setInvoiceAvailableBalance] = useState({ advanceBalance: 0 });
  // Treatment Filter Type - Extended with Invoice and Cancelled sections
  const [treatmentFilter, setTreatmentFilter] = useState<'all' | 'ongoing' | 'completed' | 'pending' | 'invoice' | 'cancelled'>('all');
  
  // Advanced Treatment Filters
  const [treatmentDateRange, setTreatmentDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [treatmentDoctorFilter, setTreatmentDoctorFilter] = useState<string>('');
  const [treatmentSearch, setTreatmentSearch] = useState<string>('');
  const [treatmentSortBy, setTreatmentSortBy] = useState<'date' | 'name' | 'amount' | 'status'>('date');
  const [treatmentSortOrder, setTreatmentSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
 
  // Track invoice numbers that have been paid but billing history hasn't updated yet
  // Persisted in sessionStorage to survive page refreshes
  const [manuallyPaidInvoices, setManuallyPaidInvoices] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(`manuallyPaidInvoices_${patientData._id}`);
        if (stored) {
          const parsed = new Set<string>(JSON.parse(stored));
          console.log('📦 Loaded manuallyPaidInvoices from sessionStorage:', parsed.size, 'invoices');
          return parsed;
        }
      } catch (e) {
        console.error('Error loading manually paid invoices:', e);
      }
    }
    return new Set<string>();
  });

  // Track package billing IDs that have already been billed in current session (prevent duplicates)
  const [billedPackageIds, setBilledPackageIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(`billedPackageIds_${patientData._id}`);
        if (stored) {
          const parsed = new Set<string>(JSON.parse(stored));
          console.log('📦 Loaded billedPackageIds from sessionStorage:', parsed.size, 'packages');
          return parsed;
        }
      } catch (e) {
        console.error('Error loading billed package IDs:', e);
      }
    }
    return new Set<string>();
  });

  // Create Package state
  const [showCreatePackage, setShowCreatePackage] = useState(false);
  const [pkgModalName, setPkgModalName] = useState("");
  const [pkgModalPrice, setPkgModalPrice] = useState("");
  const [pkgModalValidityInMonths, setPkgModalValidityInMonths] = useState("");
  const [pkgModalStartDate, setPkgModalStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [pkgModalEndDate, setPkgModalEndDate] = useState("");
  const [pkgSelectedTreatments, setPkgSelectedTreatments] = useState<Array<{ treatmentName: string; treatmentSlug: string; sessions: number; allocatedPrice: number }>>([]);
  const [pkgTreatmentDropdownOpen, setPkgTreatmentDropdownOpen] = useState(false);
  const [pkgTreatmentSearch, setPkgTreatmentSearch] = useState("");
  const [pkgSubmitting, setPkgSubmitting] = useState(false);
  const [pkgError, setPkgError] = useState("");
  const [pkgSuccess, setPkgSuccess] = useState("");
  const [addingPackageToPatient, _setAddingPackageToPatient] = useState(false);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Auto-calculate end date for package creation
  useEffect(() => {
    if (pkgModalStartDate && pkgModalValidityInMonths && !isNaN(parseInt(pkgModalValidityInMonths))) {
      const start = new Date(pkgModalStartDate);
      const months = parseInt(pkgModalValidityInMonths);
      const end = new Date(start);
      end.setMonth(start.getMonth() + months);
      setPkgModalEndDate(end.toISOString().split('T')[0]);
    } else {
      setPkgModalEndDate("");
    }
  }, [pkgModalStartDate, pkgModalValidityInMonths]);

  // Persist manually paid invoices to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && patientData._id) {
      try {
        sessionStorage.setItem(
          `manuallyPaidInvoices_${patientData._id}`,
          JSON.stringify(Array.from(manuallyPaidInvoices))
        );
        console.log('💾 Saved manuallyPaidInvoices to sessionStorage:', manuallyPaidInvoices.size, 'invoices');
      } catch (e) {
        console.error('Error saving manually paid invoices:', e);
      }
    }
  }, [manuallyPaidInvoices, patientData._id]);
  
  // Persist billed package IDs to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && patientData._id) {
      try {
        sessionStorage.setItem(
          `billedPackageIds_${patientData._id}`,
          JSON.stringify(Array.from(billedPackageIds))
        );
        console.log('💾 Saved billedPackageIds to sessionStorage:', billedPackageIds.size, 'packages');
      } catch (e) {
        console.error('Error saving billed package IDs:', e);
      }
    }
  }, [billedPackageIds, patientData._id]);

  // Fetch all clinic services
  const fetchAllServices = async () => {
    setLoadingServices(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await axios.get("/api/clinic/services", { headers });
      if (res.data?.success) {
        setAllServices(res.data.services || []);
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingServices(false);
    }
  };

  // Create package and optionally add to patient
  const handleCreatePackageModal = async (addToPatient: boolean) => {
    setPkgError("");
    setPkgSuccess("");
    if (!pkgModalName.trim()) { setPkgError("Please enter a package name"); return; }
    if (!pkgModalPrice || parseFloat(pkgModalPrice) < 0) { setPkgError("Please enter a valid price"); return; }
    if (pkgSelectedTreatments.length === 0) { setPkgError("Please select at least one treatment"); return; }
    const totalAllocated = pkgSelectedTreatments.reduce((sum, t) => sum + (parseFloat(String(t.allocatedPrice)) || 0), 0);
    const packagePrice = parseFloat(pkgModalPrice);
    if (Math.abs(totalAllocated - packagePrice) > 0.01) {
      setPkgError(`Total allocated prices (${totalAllocated.toFixed(2)}) must equal the package price (${packagePrice.toFixed(2)})`);
      return;
    }
   
    console.log('Package validation passed:', {
      name: pkgModalName,
      price: packagePrice,
      treatments: pkgSelectedTreatments,
      addToPatient
    });

    // If just creating package (not adding to patient), call API directly
    if (!addToPatient) {
      try {
        setPkgSubmitting(true);
        const headers = getAuthHeaders();
        if (!headers) {
          setPkgError("Authentication required");
          return;
        }

        // Ensure treatments have proper number types
        const normalizedTreatments = pkgSelectedTreatments.map(t => ({
          treatmentName: t.treatmentName,
          treatmentSlug: t.treatmentSlug,
          sessions: parseInt(String(t.sessions)) || 1,
          allocatedPrice: parseFloat(String(t.allocatedPrice)) || 0,
        }));

        const response = await axios.post(
          "/api/clinic/packages",
          {
            name: pkgModalName.trim(),
            totalPrice: packagePrice,
            validityInMonths: parseInt(pkgModalValidityInMonths) || 0,
            startDate: pkgModalStartDate,
            endDate: pkgModalEndDate,
            treatments: normalizedTreatments,
          },
          { headers }
        );

        if (response.data.success) {
          setPkgSuccess("Package created successfully!");
          setPkgError("");
          
          // Reset form after success
          setTimeout(() => {
            setShowCreatePackage(false);
            setPkgModalName("");
            setPkgModalPrice("");
            setPkgModalValidityInMonths("");
            setPkgModalStartDate(new Date().toISOString().split('T')[0]);
            setPkgModalEndDate("");
            setPkgSelectedTreatments([]);
            setPkgSuccess("");
          }, 2000);
        } else {
          setPkgError(response.data.message || "Failed to create package");
        }
      } catch (err: any) {
        console.error("Error creating package:", err);
        setPkgError(err.response?.data?.message || "An error occurred while creating the package");
      } finally {
        setPkgSubmitting(false);
      }
      return;
    }
   
    // If adding to patient, open payment modal first
    setPkgTotalAmount(packagePrice);
    setPkgPaidAmount(packagePrice);
    setPkgPaymentType("Full");
    setPkgPaymentMethod("Cash");
   
    // Ensure treatments have proper number types
    const normalizedTreatments = pkgSelectedTreatments.map(t => ({
      treatmentName: t.treatmentName,
      treatmentSlug: t.treatmentSlug,
      sessions: parseInt(String(t.sessions)) || 1,
      allocatedPrice: parseFloat(String(t.allocatedPrice)) || 0,
    }));
   
    // Store the package data to be created after payment
    setPkgPendingToCreate({
      name: pkgModalName.trim(),
      totalPrice: packagePrice,
      validityInMonths: parseInt(pkgModalValidityInMonths) || 0,
      startDate: pkgModalStartDate,
      endDate: pkgModalEndDate,
      treatments: normalizedTreatments,
      addToPatient: addToPatient, // Flag to know if should add to patient after creation
    });
   
    // Fetch patient balance before showing payment modal
    fetchPkgPatientBalance();
    setShowPackagePaymentModal(true);
  };

  // ---- Editable Membership & Package State ----
  const [allAvailableMemberships, setAllAvailableMemberships] = useState<any[]>([]);
  const [allAvailablePackages, setAllAvailablePackages] = useState<any[]>([]);
  const [editFormData, setEditFormData] = useState<any>({
    membership: patientData?.membership || 'No',
    membershipId: patientData?.membershipId || '',
    membershipStartDate: patientData?.membershipStartDate || '',
    membershipEndDate: patientData?.membershipEndDate || '',
    memberships: Array.isArray(patientData?.memberships) ? patientData.memberships : [],
    package: patientData?.package || 'No',
    packageId: patientData?.packageId || '',
    packageTotalPrice: patientData?.packageTotalPrice || 0,
    packagePaidAmount: patientData?.packagePaidAmount || 0,
    packagePaymentStatus: patientData?.packagePaymentStatus || 'Unpaid',
    packagePaymentMethod: patientData?.packagePaymentMethod || '',
    packages: Array.isArray(patientData?.packages) ? patientData.packages : [],
  });
  const [pmSaving, setPmSaving] = useState(false);
  const [pmToast, setPmToast] = useState<{ message: string; type: string } | null>(null);
  const [showAddMembershipDropdown, setShowAddMembershipDropdown] = useState(false);
  const [showAddPackageDropdown, setShowAddPackageDropdown] = useState(false);
  const [selectedMembershipToAdd, setSelectedMembershipToAdd] = useState('');
  const [addMembStartDate, setAddMembStartDate] = useState(formatPmDate(new Date()));
  const [addMembEndDate, setAddMembEndDate] = useState('');
  const [selectedPackageToAdd, setSelectedPackageToAdd] = useState('');
  const [showPackagePaymentModal, setShowPackagePaymentModal] = useState(false);
  const [pkgPaymentType, setPkgPaymentType] = useState<"Full" | "Partial" | "Custom">("Full");
  const [pkgPaymentMethod, setPkgPaymentMethod] = useState<string>("Cash");
  const [pkgPaidAmount, setPkgPaidAmount] = useState<number>(0);
  const [pkgEnteredAmount, setPkgEnteredAmount] = useState<number>(0);
  const [pkgTotalAmount, setPkgTotalAmount] = useState<number>(0);
  const [pkgPendingToAssign, setPkgPendingToAssign] = useState<any>(null);
  const [pkgPendingToCreate, setPkgPendingToCreate] = useState<any>(null); // Store package data to create after payment
  const [pmMembershipUsageMap, setPmMembershipUsageMap] = useState<any>({});
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);

  // Fetch all available memberships and packages for dropdowns
  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        const headers = getAuthHeaders() || {};
        const [mRes, pRes] = await Promise.all([
          axios.get('/api/clinic/memberships', { headers }),
          axios.get('/api/clinic/packages', { headers }),
        ]);
        if (mRes.data.success) setAllAvailableMemberships(mRes.data.memberships || []);
        if (pRes.data.success) setAllAvailablePackages(pRes.data.packages || []);
      } catch (e) { console.error('Error fetching available memberships/packages:', e); }
    };
    fetchAvailable();
  }, []);

  // Fetch clinic currency preference
  useEffect(() => {
    const fetchClinicCurrency = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers) return;
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

  // Sync editFormData when patientData._id changes (initial load)
  useEffect(() => {
    if (patientData) {
      setEditFormData({
        membership: patientData?.membership || 'No',
        membershipId: patientData?.membershipId || '',
        membershipStartDate: patientData?.membershipStartDate || '',
        membershipEndDate: patientData?.membershipEndDate || '',
        memberships: Array.isArray(patientData?.memberships) ? patientData.memberships : [],
        package: patientData?.package || 'No',
        packageId: patientData?.packageId || '',
        packageTotalPrice: patientData?.packageTotalPrice || 0,
        packagePaidAmount: patientData?.packagePaidAmount || 0,
        packagePaymentStatus: patientData?.packagePaymentStatus || 'Unpaid',
        packagePaymentMethod: patientData?.packagePaymentMethod || '',
        packages: Array.isArray(patientData?.packages) ? patientData.packages : [],
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientData?._id]);

  // Fetch membership usage map
  useEffect(() => {
    const headers = getAuthHeaders();
    if (!headers || !patientData?._id) return;
    const entries: any[] = [];
    if (editFormData.membership === 'Yes' && editFormData.membershipId && editFormData.membershipStartDate && editFormData.membershipEndDate) {
      entries.push({ membershipId: editFormData.membershipId, startDate: editFormData.membershipStartDate, endDate: editFormData.membershipEndDate });
    }
    if (Array.isArray(editFormData.memberships)) {
      (editFormData.memberships as any[]).forEach((m: any) => {
        if (m.membershipId && m.startDate && m.endDate) {
          entries.push({ membershipId: m.membershipId, startDate: m.startDate, endDate: m.endDate });
        }
      });
    }
    if (entries.length === 0) { setPmMembershipUsageMap({}); return; }
    let cancelled = false;
    const loadAll = async () => {
      const results: any = {};
      await Promise.all(entries.map(async (e: any) => {
        const key = `${e.membershipId}|${e.startDate}|${e.endDate}`;
        try {
          const qs = new URLSearchParams();
          qs.set('membershipId', e.membershipId);
          qs.set('startDate', e.startDate);
          qs.set('endDate', e.endDate);
          const res = await axios.get(`/api/clinic/membership-usage/${patientData._id}?${qs.toString()}`, { headers });
          results[key] = res.data?.success ? res.data : null;
        } catch { results[key] = null; }
      }));
      if (!cancelled) setPmMembershipUsageMap(results);
    };
    loadAll();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientData?._id, editFormData.membership, editFormData.membershipId, editFormData.membershipStartDate, editFormData.membershipEndDate, JSON.stringify(editFormData.memberships)]);

  const handlePmAddMembership = () => {
    if (!selectedMembershipToAdd) return;
    const selected = allAvailableMemberships.find((m: any) => m._id === selectedMembershipToAdd);
    if (!selected) return;
    const exists = (editFormData.memberships || []).some((x: any) => x.membershipId === selectedMembershipToAdd);
    if (exists) {
      setPmToast({ message: 'This membership is already added', type: 'error' });
      setTimeout(() => setPmToast(null), 3000);
      return;
    }
   
    // Only add to the memberships array - do NOT set individual fields
    setEditFormData((prev: any) => ({
      ...prev,
      memberships: [...(prev.memberships || []), { membershipId: selectedMembershipToAdd, startDate: addMembStartDate, endDate: addMembEndDate }],
    }));
    setSelectedMembershipToAdd('');
    setAddMembStartDate(formatPmDate(new Date()));
    setAddMembEndDate('');
    setShowAddMembershipDropdown(false);
    setPmToast({ message: 'Membership added', type: 'success' });
    setTimeout(() => setPmToast(null), 3000);
  };

  const handlePmAddPackage = () => {
    if (!selectedPackageToAdd) return;
    const exists = (editFormData.packages || []).some((x: any) => x.packageId === selectedPackageToAdd);
    if (exists) {
      setPmToast({ message: 'This package is already added', type: 'error' });
      setTimeout(() => setPmToast(null), 3000);
      return;
    }
   
    const selectedPkg = allAvailablePackages.find((pkg: any) => pkg._id === selectedPackageToAdd);
    if (selectedPkg) {
      setPkgTotalAmount(selectedPkg.totalPrice || 0);
      setPkgEnteredAmount(selectedPkg.totalPrice || 0);
      // Initialize pkgPaidAmount to full amount - advance will be auto-calculated when modal loads
      setPkgPaidAmount(selectedPkg.totalPrice || 0);
      setPkgPaymentType("Full");
      setPkgPendingToAssign(selectedPkg);
      // Fetch patient balance before showing payment modal
      fetchPkgPatientBalance();
      setShowPackagePaymentModal(true);
    }
  };

  // Helper function to calculate amount to pay based on entered amount and balance usage
  const calculatePkgAmountToPay = (enteredAmt: number) => {
    let totalBalanceUsed = 0;
    
    // Calculate advance used
    if (pkgUseAdvanceBalance) {
      const advanceToUse = Math.min(pkgAvailableBalance.advanceBalance, enteredAmt);
      setPkgAdvanceUsedAmount(advanceToUse);
      totalBalanceUsed += advanceToUse;
    } else {
      setPkgAdvanceUsedAmount(0);
    }
    
    // Calculate claim used on remaining after advance
    if (pkgUseClaimBalance) {
      const remainingAfterAdvance = Math.max(0, enteredAmt - totalBalanceUsed);
      const claimToUse = Math.min(pkgAvailableBalance.claimAmount, remainingAfterAdvance);
      setPkgClaimUsedAmount(claimToUse);
      totalBalanceUsed += claimToUse;
    } else {
      setPkgClaimUsedAmount(0);
    }
    
    // Calculate final amount to pay
    const amountToPay = Math.max(0, enteredAmt - totalBalanceUsed);
    setPkgPaidAmount(amountToPay);
  };

  const finalizePmAddPackage = async (paidAmount: number, paymentStatus: "Unpaid" | "Partial" | "Full", paymentMethod: string) => {
    // Case 1: Creating a new package (with or without adding to patient)
    if (pkgPendingToCreate) {
      try {
        const shouldAddToPatient = pkgPendingToCreate.addToPatient;
        
        // Use the paymentStatus passed from the button click (respects user's Full/Partial choice)
        // Don't recalculate - the button already determined the correct status
        const actualPaymentStatus = paymentStatus;
       
        // If "Create & Add to Patient" was clicked, immediately create the package and assign to patient
        if (shouldAddToPatient) {
          setPkgSubmitting(true);
          
          // Step 1: Create the package via API
          const headers = getAuthHeaders();
          if (!headers) {
            setPkgError("Authentication required");
            setPkgSubmitting(false);
            return;
          }

          const createRes = await axios.post("/api/clinic/packages", {
            name: pkgPendingToCreate.name,
            totalPrice: pkgPendingToCreate.totalPrice,
            validityInMonths: pkgPendingToCreate.validityInMonths,
            startDate: pkgPendingToCreate.startDate,
            endDate: pkgPendingToCreate.endDate,
            treatments: pkgPendingToCreate.treatments,
          }, { headers });

          if (!createRes.data?.success) {
            throw new Error(createRes.data?.message || "Failed to create package");
          }

          const realPackageId = createRes.data.package?._id || createRes.data.packageId;
          
          // Step 2: Assign the package to patient
          await axios.post("/api/clinic/assign-package-to-patient", {
            patientId: patientData._id,
            packageId: realPackageId,
            validityInMonths: pkgPendingToCreate.validityInMonths,
            startDate: pkgPendingToCreate.startDate,
            endDate: pkgPendingToCreate.endDate,
            totalPrice: pkgPendingToCreate.totalPrice,
            paidAmount: paidAmount,
            paymentStatus: actualPaymentStatus,
            paymentMethod: paymentMethod,
          }, { headers });

          // Step 3: Create billing record if balance was used or payment was made
          if (pkgAdvanceUsedAmount > 0 || pkgClaimUsedAmount > 0 || paidAmount > 0) {
            try {
              // Check if this package has already been billed in current session
              const packageBillingKey = `${pkgPendingToCreate.name}-${pkgPendingToCreate.totalPrice}-${patientData._id}`;
              if (billedPackageIds.has(packageBillingKey)) {
                console.log('[Package Billing] Skipping - already billed in current session:', packageBillingKey);
              } else {
                await axios.post("/api/clinic/package-billing", {
                  patientId: patientData._id,
                  packageName: pkgPendingToCreate.name,
                  packageId: realPackageId,
                  totalAmount: pkgPendingToCreate.totalPrice,
                  paidAmount: paidAmount,
                  paymentMethod: paymentMethod,
                  paymentStatus: actualPaymentStatus,
                  advanceBalanceUsed: pkgAdvanceUsedAmount || 0,
                  claimAmountUsed: pkgClaimUsedAmount || 0,
                  treatments: pkgPendingToCreate.treatments,
                }, { headers });
                console.log('Package billing created with balance usage');
                
                // Mark as billed to prevent duplicates
                setBilledPackageIds(prev => {
                  const updated = new Set(prev);
                  updated.add(packageBillingKey);
                  return updated;
                });
              }
            } catch (billingErr: any) {
              console.error('Error creating package billing:', billingErr);
              // Don't fail the whole operation, just log the error
            }
          }

          // Add to editFormData.packages to show in "Added Packages" section
          const newPkgData = {
            packageId: realPackageId,
            packageSoldBy: getCurrentUserName(),
            assignedDate: new Date().toISOString(),
            validityInMonths: pkgPendingToCreate.validityInMonths,
            startDate: pkgPendingToCreate.startDate,
            endDate: pkgPendingToCreate.endDate,
            totalPrice: pkgPendingToCreate.totalPrice,
            paidAmount: paidAmount,
            paymentStatus: actualPaymentStatus,
            paymentMethod: paymentMethod,
            advanceBalanceUsed: pkgAdvanceUsedAmount,
            claimAmountUsed: pkgClaimUsedAmount,
          };
          
          setEditFormData((prev: any) => ({
            ...prev,
            package: 'Yes',
            packages: [
              ...(prev.packages || []),
              newPkgData
            ],
          }));

          // Reset create package form
          setPkgModalName("");
          setPkgModalPrice("");
          setPkgModalValidityInMonths("");
          setPkgModalStartDate(new Date().toISOString().split('T')[0]);
          setPkgModalEndDate("");
          setPkgSelectedTreatments([]);
          setPkgTreatmentSearch("");
         
          setPkgPendingToCreate(null);
          setShowPackagePaymentModal(false);
          setPkgSubmitting(false);
          // Reset balance usage state
          setPkgUseAdvanceBalance(false);
          setPkgUseClaimBalance(false);
          setPkgAdvanceUsedAmount(0);
          setPkgClaimUsedAmount(0);
         
          setPkgSuccess("Package created and added to patient successfully!");
          setTimeout(() => setPkgSuccess(""), 3000);
          
          // Refresh the packages list and patient data to show the newly added package
          try {
            const headers = getAuthHeaders();
            
            // Fetch updated patient data from API
            const patientRes = await axios.get(`/api/clinic/patient-registration?id=${patientData._id}`, { headers });
            if (patientRes.data.success && patientRes.data.patient) {
              // Update patient data with fresh packages
              onPatientUpdated?.(patientRes.data.patient);
              
              // Call fetchPackagesAndMemberships with the fresh patient data to update the UI
              await fetchPackagesAndMemberships({
                packages: patientRes.data.patient.packages || [],
                memberships: patientRes.data.patient.memberships || []
              });
            }
            
            // Also refresh the available packages list
            const pRes = await axios.get('/api/clinic/packages', { headers });
            if (pRes.data.success) setAllAvailablePackages(pRes.data.packages || []);
          } catch (err) {
            console.error('Error refreshing data:', err);
          }
        } else {
          // "Create Package" only - add to editFormData to save later
          const newPkgData = {
            packageId: `temp_${Date.now()}`, // Temporary ID, will be replaced after save
            isNewPackage: true, // Flag to indicate this needs to be created
            packageName: pkgPendingToCreate.name,
            packageSoldBy: getCurrentUserName(),
            totalPrice: pkgPendingToCreate.totalPrice,
            validityInMonths: pkgPendingToCreate.validityInMonths,
            startDate: pkgPendingToCreate.startDate,
            endDate: pkgPendingToCreate.endDate,
            treatments: pkgPendingToCreate.treatments,
            assignedDate: new Date().toISOString(),
            paidAmount: paidAmount, // Cash/card payment only
            paymentStatus: actualPaymentStatus, // Use the status from button click
            paymentMethod: paymentMethod,
            addToPatient: shouldAddToPatient, // Keep flag to know behavior after save
            // Track balance usage
            advanceBalanceUsed: pkgAdvanceUsedAmount,
            claimAmountUsed: pkgClaimUsedAmount,
          };
         
          setEditFormData((prev: any) => ({
            ...prev,
            packages: [
              ...(prev.packages || []),
              newPkgData
            ],
          }));
         
          // Reset create package form
          setPkgModalName("");
          setPkgModalPrice("");
          setPkgModalValidityInMonths("");
          setPkgModalStartDate(new Date().toISOString().split('T')[0]);
          setPkgModalEndDate("");
          setPkgSelectedTreatments([]);
          setPkgTreatmentSearch("");
         
          setPkgPendingToCreate(null);
          setShowPackagePaymentModal(false);
          // Reset balance usage state
          setPkgUseAdvanceBalance(false);
          setPkgUseClaimBalance(false);
          setPkgAdvanceUsedAmount(0);
          setPkgClaimUsedAmount(0);
         
          setPkgSuccess("Package created! Click 'Save Changes' to save.");
          setTimeout(() => setPkgSuccess(""), 3000);
        }
      } catch (err: any) {
        console.error('Error handling package creation:', err);
        setPkgError(err.response?.data?.message || err.message || "Failed to create package");
        setPkgSubmitting(false);
        setPkgPendingToCreate(null);
        setShowPackagePaymentModal(false);
      }
      return;
    }
   
    // Case 2: Adding existing package to patient (original flow)
    if (!pkgPendingToAssign) return;
   
    // Use the paymentStatus passed from the button click (respects user's Full/Partial choice)
    const actualPaymentStatus = paymentStatus;
   
    // Dynamically calculate start and end dates based on current date
    const now = new Date();
    const startDate = formatPmDate(now);
    const endDateObj = new Date(now);
    const validity = Number(pkgPendingToAssign.validityInMonths) || 0;
    if (validity > 0) {
      endDateObj.setMonth(endDateObj.getMonth() + validity);
    }
    const endDate = validity > 0 ? formatPmDate(endDateObj) : null;
   
    setEditFormData((prev: any) => ({
      ...prev,
      packages: [
        ...(prev.packages || []),
        {
          packageId: pkgPendingToAssign._id,
          packageSoldBy: getCurrentUserName(),
          assignedDate: new Date().toISOString(),
          validityInMonths: validity,
          startDate: startDate,
          endDate: endDate,
          totalPrice: pkgPendingToAssign.totalPrice || 0,
          paidAmount: paidAmount, // Cash/card payment only
          paymentStatus: actualPaymentStatus, // Based on total amount paid (including balances)
          paymentMethod: paymentMethod,
          // Track balance usage
          advanceBalanceUsed: pkgAdvanceUsedAmount,
          claimAmountUsed: pkgClaimUsedAmount,
        }
      ],
    }));
    setSelectedPackageToAdd('');
    setShowAddPackageDropdown(false);
    setShowPackagePaymentModal(false);
    // Reset balance usage state
    setPkgUseAdvanceBalance(false);
    setPkgUseClaimBalance(false);
    setPkgAdvanceUsedAmount(0);
    setPkgClaimUsedAmount(0);
    setPmToast({ message: 'Package added with payment', type: 'success' });
    setTimeout(() => setPmToast(null), 3000);
  };

  // Handle removing membership - with proper cleanup
  const handlePmRemoveMembership = (indexToRemove: number) => {
    setEditFormData((prev: any) => {
      const list = Array.isArray(prev.memberships) ? prev.memberships : [];
      const newList = list.filter((_: any, idx: number) => idx !== indexToRemove);
     
      // If this was the last membership, also clear the main membership fields
      if (newList.length === 0) {
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
  };

  // Handle removing package - with proper cleanup
  const handlePmRemovePackage = (indexToRemove: number) => {
    setEditFormData((prev: any) => {
      const list = Array.isArray(prev.packages) ? prev.packages : [];
      const newList = list.filter((_: any, idx: number) => idx !== indexToRemove);
     
      // If this was the last package, also clear the main package fields
      if (newList.length === 0) {
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
  };

  // Fetch patient balance for package payment modal
  const fetchPkgPatientBalance = async () => {
    if (!patientData?._id) return;
    setPkgLoadingBalance(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await axios.get(`/api/clinic/patient-balance/${patientData._id}`, { headers });
      const data = res?.data?.balances || {};
      setPkgAvailableBalance({
        advanceBalance: Number(data.advanceBalance || 0),
        claimAmount: Number(data.claimAmount || 0),
      });
    } catch (error) {
      console.error('Error fetching patient balance for package:', error);
      setPkgAvailableBalance({ advanceBalance: 0, claimAmount: 0 });
    } finally {
      setPkgLoadingBalance(false);
    }
  };

  const handlePmSave = async () => {
    // Show confirmation modal first
    setShowSaveConfirmModal(true);
  };

  const handlePmSaveConfirmed = async () => {
    setShowSaveConfirmModal(false);
    try {
      setPmSaving(true);
      const headers = getAuthHeaders();
      if (!headers) {
        setPmToast({ message: 'Authentication required', type: 'error' });
        setTimeout(() => setPmToast(null), 3000);
        setPmSaving(false);
        return;
      }
       
      // Step 1: Create any new packages first
      const packagesToSave = Array.isArray(editFormData.packages) ? [...editFormData.packages] : [];
      const newPackages = packagesToSave.filter((p: any) => p.isNewPackage);
     
      if (newPackages.length > 0) {
        console.log('Creating new packages:', newPackages);
       
        for (const newPkg of newPackages) {
          try {
            // Create the package
            const createRes = await axios.post("/api/clinic/packages", {
              name: newPkg.packageName,
              totalPrice: newPkg.totalPrice,
              validityInMonths: newPkg.validityInMonths,
              startDate: newPkg.startDate,
              endDate: newPkg.endDate,
              treatments: newPkg.treatments,
            }, { headers });
           
            if (createRes.data?.success) {
              const realPackageId = createRes.data.package?._id || createRes.data.packageId;
             
              // Only assign to patient if addToPatient flag is true
              if (newPkg.addToPatient) {
                await axios.post("/api/clinic/assign-package-to-patient", {
                  patientId: patientData._id,
                  packageId: realPackageId,
                  validityInMonths: newPkg.validityInMonths,
                  startDate: newPkg.startDate,
                  endDate: newPkg.endDate,
                  totalPrice: newPkg.totalPrice,
                  paidAmount: newPkg.paidAmount,
                  paymentStatus: newPkg.paymentStatus,
                  paymentMethod: newPkg.paymentMethod,
                }, { headers });

                // Create billing record if balance was used or payment was made
                if (newPkg.advanceBalanceUsed > 0 || newPkg.claimAmountUsed > 0 || newPkg.paidAmount > 0) {
                  try {
                    // Check if this package has already been billed in current session
                    const packageBillingKey = `${newPkg.packageName}-${newPkg.totalPrice}-${patientData._id}`;
                    if (billedPackageIds.has(packageBillingKey)) {
                      console.log('[Package Billing] Skipping - already billed in current session:', packageBillingKey);
                    } else {
                      await axios.post("/api/clinic/package-billing", {
                        patientId: patientData._id,
                        packageName: newPkg.packageName,
                        packageId: realPackageId,
                        totalAmount: newPkg.totalPrice,
                        paidAmount: newPkg.paidAmount,
                        paymentMethod: newPkg.paymentMethod,
                        paymentStatus: newPkg.paymentStatus,
                        advanceBalanceUsed: newPkg.advanceBalanceUsed || 0,
                        claimAmountUsed: newPkg.claimAmountUsed || 0,
                        treatments: newPkg.treatments,
                      }, { headers });
                      console.log('Package billing created with balance usage');
                      
                      // Mark as billed to prevent duplicates
                      setBilledPackageIds(prev => {
                        const updated = new Set(prev);
                        updated.add(packageBillingKey);
                        return updated;
                      });
                    }
                  } catch (billingErr: any) {
                    console.error('Error creating package billing:', billingErr);
                    // Don't fail the whole operation, just log the error
                  }
                }
              }
             
              // Update the package in the array with real ID and remove isNewPackage flag
              const pkgIndex = packagesToSave.findIndex((p: any) => p.packageId === newPkg.packageId);
              if (pkgIndex !== -1) {
                packagesToSave[pkgIndex] = {
                  ...packagesToSave[pkgIndex],
                  packageId: realPackageId,
                  isNewPackage: false,
                };
              }
             
              console.log(`Package created: ${realPackageId}${newPkg.addToPatient ? ' and assigned to patient' : ''}`);
            }
          } catch (err: any) {
            console.error('Error creating package:', err);
            setPmToast({
              message: `Failed to create package "${newPkg.packageName}": ${err.response?.data?.message || err.message}`,
              type: 'error'
            });
            setTimeout(() => setPmToast(null), 4000);
            setPmSaving(false);
            return;
          }
        }
      }
       
      // Step 1.5: Create billing records for existing packages with balance usage OR paid amount
      const existingPackagesToBill = packagesToSave.filter((p: any) => 
        !p.isNewPackage && (p.advanceBalanceUsed > 0 || p.claimAmountUsed > 0 || p.paidAmount > 0)
      );
      
      if (existingPackagesToBill.length > 0) {
        for (const existingPkg of existingPackagesToBill) {
          try {
            // Find the package details to get the name
            const pkgDetails = allAvailablePackages.find((pkg: any) => pkg._id === existingPkg.packageId);
            const packageName = pkgDetails?.name || existingPkg.packageName || 'Package';
            
            // Check if this package has already been billed in current session
            const packageBillingKey = `${packageName}-${existingPkg.totalPrice || 0}-${patientData._id}`;
            if (billedPackageIds.has(packageBillingKey)) {
              console.log('[Package Billing] Skipping existing package - already billed in current session:', packageBillingKey);
            } else {
              await axios.post("/api/clinic/package-billing", {
                patientId: patientData._id,
                packageName: packageName,
                packageId: existingPkg.packageId,
                totalAmount: existingPkg.totalPrice || 0,
                paidAmount: existingPkg.paidAmount || 0,
                paymentMethod: existingPkg.paymentMethod || 'Cash',
                paymentStatus: existingPkg.paymentStatus || 'Unpaid',
                advanceBalanceUsed: existingPkg.advanceBalanceUsed || 0,
                claimAmountUsed: existingPkg.claimAmountUsed || 0,
                treatments: pkgDetails?.treatments || [],
              }, { headers });
              console.log('Billing created for existing package:', existingPkg.packageId);
              
              // Mark as billed to prevent duplicates
              setBilledPackageIds(prev => {
                const updated = new Set(prev);
                updated.add(packageBillingKey);
                return updated;
              });
            }
          } catch (billingErr: any) {
            console.error('Error creating billing for existing package:', billingErr);
            // Don't fail the whole operation, just log the error
          }
        }
      }
       
      // Step 2: Prepare final packages array (with real IDs now)
      const hasPackagesArray = packagesToSave.length > 0;
      let finalPackages = packagesToSave.map((p: any) => {
        // Remove isNewPackage flag, packageName, treatments, and addToPatient from the saved data
        const { isNewPackage, packageName, treatments, addToPatient, ...rest } = p;
        return rest;
      });
       
      // Auto-sync: If individual packageId exists but packages array is empty, create the array entry
      if (!hasPackagesArray && editFormData.packageId && !finalPackages.some((p: any) => p.packageId === editFormData.packageId)) {
        finalPackages = [{
          packageId: editFormData.packageId,
          assignedDate: new Date().toISOString(),
          totalPrice: editFormData.packageTotalPrice || 0,
          paidAmount: editFormData.packagePaidAmount || 0,
          paymentStatus: editFormData.packagePaymentStatus || 'Unpaid',
          paymentMethod: editFormData.packagePaymentMethod || '',
        }];
      }
       
      // Determine memberships
      const hasMembershipsArray = Array.isArray(editFormData.memberships) && editFormData.memberships.length > 0;
      let finalMemberships = Array.isArray(editFormData.memberships) ? editFormData.memberships : [];
      if (!hasMembershipsArray && editFormData.membershipId && !finalMemberships.some((m: any) => m.membershipId === editFormData.membershipId)) {
        finalMemberships = [{
          membershipId: editFormData.membershipId,
          startDate: editFormData.membershipStartDate || new Date().toISOString(),
          endDate: editFormData.membershipEndDate || new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
        }];
      }
       
      const payload = {
        updateType: 'details',
        membership: finalMemberships.length > 0 ? 'Yes' : (editFormData.membership || 'No'),
        membershipId: finalMemberships.length > 0 ? finalMemberships[0]?.membershipId : (editFormData.membershipId || ''),
        membershipStartDate: finalMemberships.length > 0 ? finalMemberships[0]?.startDate : (editFormData.membershipStartDate || ''),
        membershipEndDate: finalMemberships.length > 0 ? finalMemberships[0]?.endDate : (editFormData.membershipEndDate || ''),
        memberships: finalMemberships.length > 0 ? finalMemberships : [],
        package: finalPackages.length > 0 ? 'Yes' : (editFormData.package || 'No'),
        packageId: finalPackages.length > 0 ? finalPackages[0]?.packageId : (editFormData.packageId || ''),
        packageTotalPrice: finalPackages.length > 0 ? finalPackages[0]?.totalPrice : (editFormData.packageTotalPrice || 0),
        packagePaidAmount: finalPackages.length > 0 ? finalPackages[0]?.paidAmount : (editFormData.packagePaidAmount || 0),
        packagePaymentStatus: finalPackages.length > 0 ? finalPackages[0]?.paymentStatus : (editFormData.packagePaymentStatus || 'Unpaid'),
        packagePaymentMethod: finalPackages.length > 0 ? finalPackages[0]?.paymentMethod : (editFormData.packagePaymentMethod || ''),
        packages: finalPackages.length > 0 ? finalPackages : [],
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        mobileNumber: patientData.mobileNumber,
        gender: patientData.gender,
        email: patientData.email,
        patientType: patientData.patientType,
        referredBy: patientData.referredBy,
        insurance: patientData.insurance,
        insuranceType: patientData.insuranceType,
        notes: patientData.notes,
      };
       
      console.log('🟢 Saving payload:', JSON.stringify(payload, null, 2));
       
      // Step 3: Save patient data
      const res = await axios.put(`/api/staff/get-patient-data/${patientData._id}`, payload, { headers });
      const result = res.data;
       
      console.log('📡 API Response:', result);
       
      if (res.status === 200 || res.status === 201) {
        setPmToast({ message: result.message || 'Patient updated successfully!', type: 'success' });
        setTimeout(() => setPmToast(null), 3000);
         
        // Fetch fresh patient data
        let freshData: any = null;
        try {
          const patientRes = await axios.get(`/api/staff/get-patient-data/${patientData._id}`, { headers });
          if (patientRes.data) {
            freshData = patientRes.data;
           
            // Update the main patient state via callback
            if (onPatientUpdated) {
              onPatientUpdated({
                ...patientData,
                membership: freshData?.membership || 'No',
                membershipId: freshData?.membershipId || '',
                membershipStartDate: freshData?.membershipStartDate || '',
                membershipEndDate: freshData?.membershipEndDate || '',
                memberships: Array.isArray(freshData?.memberships) ? freshData.memberships : [],
                package: freshData?.package || 'No',
                packageId: freshData?.packageId || '',
                packages: Array.isArray(freshData?.packages) ? freshData.packages : [],
              });
            }
           
            // Update editFormData with fresh saved data
            setEditFormData({
              membership: freshData?.membership || 'No',
              membershipId: freshData?.membershipId || '',
              membershipStartDate: freshData?.membershipStartDate || '',
              membershipEndDate: freshData?.membershipEndDate || '',
              memberships: Array.isArray(freshData?.memberships) ? freshData.memberships : [],
              package: freshData?.package || 'No',
              packageId: freshData?.packageId || '',
              packages: Array.isArray(freshData?.packages) ? freshData.packages : [],
            });
          }
        } catch (fetchError) {
          console.error('Error fetching fresh patient data:', fetchError);
        }
         
        // Refresh packages/memberships display
        fetchPackagesAndMemberships({
          memberships: Array.isArray(freshData?.memberships) ? freshData.memberships : (patientData?.memberships || []),
          packages: Array.isArray(freshData?.packages) ? freshData.packages : (patientData?.packages || []),
        });
       
        // Refresh available packages list
        try {
          const pRes = await axios.get('/api/clinic/packages', { headers });
          if (pRes.data.success) setAllAvailablePackages(pRes.data.packages || []);
        } catch (err) {
          console.error('Error refreshing packages:', err);
        }
      } else {
        setPmToast({ message: result.message || 'Failed to update patient details', type: 'error' });
        setTimeout(() => setPmToast(null), 3000);
      }
    } catch (e: any) {
      console.error('❌ Error saving patient data:', e);
      setPmToast({ message: e?.response?.data?.message || 'Network error. Try again later.', type: 'error' });
      setTimeout(() => setPmToast(null), 3000);
    } finally {
      setPmSaving(false);
    }
  };

  if (!patientData) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'treatments', label: 'Treatments' },
    { id: 'billing', label: 'Billing' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'packages-memberships', label: 'Packages & Memberships' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'media', label: 'Media & Documents' },
    { id: 'communication', label: 'Communication Log' },
    { id: 'advance', label: 'Advance & Pending Balance' }
  ];

  // Mock data for demonstration (can be replaced with real API calls later)
  const stats = [
    {
      label: 'Total Visits',
      value: loadingStats ? '...' : statsData.totalVisits,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Completed Invoices',
      value: loadingStats ? '...' : statsData.completedInvoices,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Cancelled/No Show',
      value: loadingStats ? '...' : statsData.cancelledNoShow,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      label: 'Active Packages',
      value: loadingStats ? '...' : statsData.activePackages,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'Insurance Claims Pending',
      value: loadingStats ? '...' : statsData.insuranceClaimsPending,
      icon: FileText,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    }
  ];

  // Activity Timeline — built from real appointments + billing data
  const timelineItems = (() => {
    const items: { icon: any; title: string; subtitle: string; date: string; color: string }[] = [];

    // From appointments (sorted newest first)
    const sortedApts = [...(appointments || [])].sort(
      (a: any, b: any) => new Date(b.startDate || b.createdAt).getTime() - new Date(a.startDate || a.createdAt).getTime()
    ).slice(0, 5);

    sortedApts.forEach((apt: any) => {
      const status = (apt.status || apt.appointmentStatus || '').toLowerCase();
      const dateStr = apt.registeredDate ||
        (apt.startDate ? new Date(apt.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
      const time = apt.fromTime ? ` at ${apt.fromTime}` : '';
      const doctor = apt.doctorName ? `with ${apt.doctorName}` : '';

      if (status === 'completed' || status === 'discharge') {
        items.push({ icon: Activity, title: 'Treatment Completed', subtitle: `${apt.treatmentName || apt.serviceName || 'Appointment'}${doctor ? ' ' + doctor : ''}`, date: dateStr + time, color: 'bg-purple-500' });
      } else if (status === 'rescheduled') {
        items.push({ icon: AlertTriangle, title: 'Appointment Rescheduled', subtitle: `${apt.treatmentName || 'Appointment'}${doctor ? ' ' + doctor : ''}`, date: dateStr + time, color: 'bg-yellow-500' });
      } else if (status === 'cancelled' || status === 'rejected') {
        items.push({ icon: XCircle, title: 'Appointment Cancelled', subtitle: `${apt.treatmentName || 'Appointment'}${doctor ? ' ' + doctor : ''}`, date: dateStr + time, color: 'bg-red-500' });
      } else {
        items.push({ icon: Calendar, title: `Appointment ${apt.status || 'Scheduled'}`, subtitle: `${apt.treatmentName || apt.serviceName || 'Appointment'}${doctor ? ' ' + doctor : ''}`, date: dateStr + time, color: 'bg-blue-500' });
      }
    });

    // From billing — add payment entries
    const billings = Array.isArray(billingHistory)
      ? billingHistory.filter((b: any) => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance")
      : [];
    billings.slice(0, 3).forEach((b: any) => {
      if (b.paid > 0) {
        const dateStr = b.invoicedDate || (b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
        items.push({ icon: DollarSign, title: 'Payment Received', subtitle: `${getCurrencySymbol(currency)}${b.paid.toLocaleString()} — ${b.invoiceNumber || ''}`, date: dateStr, color: 'bg-green-500' });
      }
    });

    // Sort all by date desc, keep top 8
    return items.slice(0, 8);
  })();

  // Alerts — computed from real data
  // Commented out because the UI using this is also commented out
  /* const alerts = (() => {
    const list: { type: string; icon: any; message: string }[] = [];

    // Outstanding payment alert
    const outstanding = patientData?.outstanding || 0;
    if (outstanding > 0) {
      list.push({ type: 'danger', icon: AlertCircle, message: `Outstanding payment of ${getCurrencySymbol(currency)}${Number(outstanding).toLocaleString()}` });
    }

    // Rescheduled appointment alert
    const hasRescheduled = (appointments || []).some(
      (a: any) => (a.status || a.appointmentStatus || '').toLowerCase() === 'rescheduled'
    );
    if (hasRescheduled) {
      list.push({ type: 'warning', icon: AlertTriangle, message: 'Appointment reschedule requested' });
    }

    // Pending invoice alert
    const hasPendingInvoice = Array.isArray(billingHistory) && billingHistory.some(
      (b: any) => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance" && ((b.status || '').toLowerCase() === 'pending' || (b.pending > 0))
    );
    if (hasPendingInvoice) {
      list.push({ type: 'warning', icon: AlertTriangle, message: 'Pending invoice payment' });
    }

    // Membership expiry
    if (patientData?.membershipEndDate) {
      try {
        const end = new Date(patientData.membershipEndDate);
        const now = new Date();
        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0 && daysLeft <= 30) {
          list.push({ type: 'info', icon: Info, message: `Membership expires in ${daysLeft} days` });
        } else if (daysLeft <= 0) {
          list.push({ type: 'danger', icon: AlertCircle, message: 'Membership has expired' });
        }
      } catch {}
    }

    // Insurance active
    if (patientData?.insurance === 'Yes') {
      list.push({ type: 'info', icon: Info, message: `Insurance: ${patientData?.insuranceType || 'Active'}` });
    }

    if (list.length === 0) {
      list.push({ type: 'info', icon: Info, message: 'No active alerts for this patient' });
    }

    return list;
  })(); */

  // Patient Behavior — using statsData (from Total Visits card) for accuracy
  const behaviorMetrics = (() => {
    const total = statsData.totalVisits;                    // from Total Visits card
    const completedCount = statsData.completedVisits;       // actual completed/discharge/approved
    const cancelled = statsData.cancelledNoShow;            // from Cancelled/No Show card

    // Visit bar fills based on totalVisits (every visit = 10%, max 100%)
    const visitBarValue = Math.min(100, total * 10);

    const noShowRate = total > 0 ? Math.min(100, Math.round((cancelled / total) * 100)) : 0;

    // Engagement score
    let engagementScore = 0;
    if (patientData?.email) engagementScore += 20;
    if (patientData?.mobile) engagementScore += 20;
    if (total > 0) engagementScore += 30;
    if (completedCount > 0) engagementScore += 20;
    if (patientData?.membership === 'Yes') engagementScore += 10;

    return [
      { label: `Visit Completion Rate`, value: visitBarValue, displayValue: total, color: 'bg-green-500' },
      { label: 'No-Show Rate', value: noShowRate, displayValue: null, color: 'bg-red-500' },
    ];
  })();

  const getInitials = (first: string, last: string) => {
    return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();
  };

  // Fetch patient balance, overview data, appointments, billing, packages, media, and consent on mount
  useEffect(() => {
    if (patientData?._id) {
      // 1. Fetch Overview & Dashboard Stats
      fetchOverviewData();
     
      // 2. Fetch Appointments & Billing (needed for Overview Timeline & Financials)
      fetchAppointments();
      fetchBillingHistory();
     
      // 3. Fetch Real Advance & Pending Balances
      setBalanceLoading(true);
      fetchPatientBalance(patientData._id).then((data: any) => {
        if (data) {
          setBalance(data);
          setFinancialData((prev: any) => ({
            ...prev,
            advanceBalance: data.advanceBalance || 0,
            pendingPayment: data.pendingBalance || prev.pendingPayment,
          }));
        }
      }).finally(() => setBalanceLoading(false));

      // 4. Pre-fetch other tab data for first render
      fetchPackagesAndMemberships();
      fetchMediaDocuments();
      fetchConsentStatuses();
      fetchCreatedPackages();
    }
  }, [patientData?._id]);

  // Tab-specific refreshes (optional: keeps current behavior if tab changes)
  useEffect(() => {
    if (activeTab === 'appointments' && patientData?._id) {
      // Fetch upcoming appointments when filter is 'upcoming', otherwise fetch all
      if (appointmentFilter === 'upcoming') {
        fetchUpcomingAppointments();
      } else {
        fetchAppointments();
      }
    }
  }, [activeTab, appointmentFilter]);

  useEffect(() => {
    if (activeTab === 'treatments' && patientData?._id) {
      fetchBillingHistory();
      fetchTreatmentsFromAppointments();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'packages-memberships' && patientData?._id) fetchPackagesAndMemberships();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'billing' && patientData?._id) fetchBillingHistory();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'media' && patientData?._id) fetchMediaDocuments();
  }, [activeTab]);

  useEffect(() => {
    setConsentSent(false);
    setSelectedConsentId("");
  }, [patientData?._id]);

  useEffect(() => {
    if (activeTab === 'communication' && patientData?._id) {
      fetchConsentStatuses();
      fetchConsentForms();
      fetchCreatedPackages();
      fetchProgressNotes();
      fetchPrescriptions();
    }
  }, [activeTab]);

  useEffect(() => {
    if ((activeTab === 'overview' || activeTab === 'advance') && patientData?._id) {
      setBalanceLoading(true);
      fetchPatientBalance(patientData._id).then((data) => {
        if (data) {
          setBalance(data as typeof balance);
          // Also update financialData to reflect latest balance in overview
          setFinancialData((prev: any) => ({
            ...prev,
            advanceBalance: data.advanceBalance || 0,
            pendingPayment: data.pendingBalance || prev.pendingPayment,
          }));
        }
      }).finally(() => setBalanceLoading(false));
    }
    if (activeTab === 'insurance' && patientData?._id) {
      fetchInsuranceClaims();
    }
  }, [activeTab]);

  const fetchAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const oneYearAhead = new Date();
      oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);

      const response = await axios.get(
        `/api/clinic/all-appointments?page=1&limit=1000&fromDate=${oneYearAgo.toISOString().split('T')[0]}&toDate=${oneYearAhead.toISOString().split('T')[0]}`,
        { headers }
      );
     
      if (response.data.success) {
        const patientAppointments = response.data.appointments?.filter(
          (apt: any) => apt.patientId?.toString() === patientData._id?.toString()
        ) || [];
        setAppointments(patientAppointments);
      }
    } catch (error: any) {
      console.error('Error fetching appointments:', error.message);
      // Set empty appointments on error to prevent continuous loading
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchUpcomingAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const headers = getAuthHeaders();
      if (!headers || !patientData?._id) return;

      // Fetch upcoming appointments from dedicated API
      const response = await axios.get('/api/clinic/patient-upcoming-appointments', {
        headers,
        params: { patientId: patientData._id }
      });
     
      if (response.data.success) {
        const upcomingAppts = response.data.appointments || [];
        setUpcomingAppointments(upcomingAppts);
      }
    } catch (error: any) {
      console.error('Error fetching upcoming appointments:', error.message);
      // Set empty upcoming appointments on error
      setUpcomingAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchPackagesAndMemberships = async (freshPatientData?: { memberships?: any[]; packages?: any[] }) => {
    try {
      setLoadingPackages(true);
      const headers = getAuthHeaders();
      if (!headers || !patientData?._id) return;

      // Fetch all clinic packages and memberships first, plus billing history!
      const [mRes, pRes, billingRes] = await Promise.all([
        axios.get('/api/clinic/memberships', { headers }),
        axios.get('/api/clinic/packages', { headers }),
        axios.get(`/api/clinic/billing-history/${patientData._id}`, { headers })
      ]);
     
      const allMemberships = mRes.data?.memberships || [];
      const allPackages = pRes.data?.packages || [];
      const billings = billingRes.data?.success ? billingRes.data.billings || [] : [];
     
      // Get patient's assigned package IDs and membership IDs
      // Use freshPatientData if provided (avoids stale closure after save)
      let patientPackageIds = (freshPatientData?.packages || patientData?.packages || []).map((p: any) => p.packageId);
      let patientMembershipIds = (freshPatientData?.memberships || patientData?.memberships || []).map((m: any) => m.membershipId);
     
      // Fetch package usage data for this patient
      let packageUsageData = [];
      let packageTransferredOutData: any[] = [];
      try {
        const usageRes = await axios.get(`/api/clinic/package-usage/${patientData._id}`, { headers });
        if (usageRes.data.success) {
          packageUsageData = usageRes.data.packageUsage || [];
          packageTransferredOutData = usageRes.data.transferredOut || [];
        }
      } catch (err: any) {
        console.error('Error fetching package usage:', err.message);
      }
     
      // Fetch membership usage data for this patient
      let membershipUsageData: any = null;
      let membershipTransferredOutData: any[] = [];
      try {
        const membershipUsageRes = await axios.get(`/api/clinic/membership-usage/${patientData._id}`, { headers });
        if (membershipUsageRes.data.success && membershipUsageRes.data.hasMembership) {
          membershipUsageData = membershipUsageRes.data;
        }
        // Always capture all transferred-out memberships from API
        membershipTransferredOutData = membershipUsageRes.data.transferredOutMemberships || [];
      } catch (err: any) {
        console.error('Error fetching membership usage:', err.message);
      }
     
      // Process packages with usage data - separate active, transferred-in, and transferred-out
      const transferredOutPackageIds = new Set(packageTransferredOutData.map(p => String(p.packageId)));
     
      // Filter patientPackageIds to exclude transferred-out packages
      patientPackageIds = patientPackageIds.filter((pkgId: any) =>
        !transferredOutPackageIds.has(String(pkgId))
      );
     
      const patientPackages = allPackages.filter((pkg: any) =>
        patientPackageIds.includes(pkg._id)
      ).map((pkg: any) => {
        const calculatedTotalSessions = pkg.treatments?.reduce((sum: number, t: any) => sum + (parseInt(t.sessions) || 0), 0) || 0;
       
        // Find the patient's package assignment to get assigned date
        // Use freshPatientData for newest assignments if available
        const currentPackages = freshPatientData?.packages || patientData?.packages || [];
        const patientPackage = currentPackages.find((p: any) => p.packageId === pkg._id);
       
        // Find usage data for this package
        const usage = packageUsageData.find((u: any) => u.packageName === pkg.name);
       
        // Calculate used sessions from usage data
        let usedSessions = 0;
        let treatmentsWithUsage = pkg.treatments || [];
       
        if (usage) {
          usedSessions = usage.totalSessions || 0;
          // Enrich treatments with usage details
          treatmentsWithUsage = (pkg.treatments || []).map((treatment: any) => {
            const treatmentUsage = usage.treatments?.find((t: any) => t.treatmentSlug === treatment.treatmentSlug);
            return {
              ...treatment,
              usedSessions: treatmentUsage?.totalUsedSessions || 0,
              maxSessions: treatmentUsage?.maxSessions || treatment.sessions || 0,
              usageDetails: treatmentUsage?.usageDetails || []
            };
          });
        }

        // Calculate total paid including both cash/card and advance balance from billing history
        // This ensures packages paid entirely with advance balance are marked as "Full" paid
        const packageBillingsForPkg = billings.filter((billing: any) => 
          billing.service === "Package" && billing.package === pkg.name
        );
        const totalAdvanceUsedFromBillings = packageBillingsForPkg.reduce(
          (sum: number, billing: any) => sum + (Number(billing.advanceUsed) || 0), 0
        );
        const totalCashPaidFromBillings = packageBillingsForPkg.reduce(
          (sum: number, billing: any) => sum + (Number(billing.paid) || 0), 0
        );
        const totalPaidIncludingAdvance = (usage?.paidAmount || patientPackage?.paidAmount || pkg.paidAmount || 0) + totalAdvanceUsedFromBillings;
        const packagePrice = pkg.totalPrice || 0;
        // Determine payment status based on total paid (cash/card + advance)
        let calculatedPaymentStatus = usage?.paymentStatus || patientPackage?.paymentStatus || pkg.paymentStatus || 'Unpaid';
        if (packagePrice > 0 && totalPaidIncludingAdvance >= packagePrice) {
          calculatedPaymentStatus = 'Full';
        } else if (totalPaidIncludingAdvance > 0) {
          calculatedPaymentStatus = 'Partial';
        }
        
        return {
          ...pkg,
          validityInMonths: patientPackage?.validityInMonths || pkg.validityInMonths || 0,
          startDate: patientPackage?.startDate || pkg.startDate || patientPackage?.assignedDate || pkg.createdAt,
          endDate: patientPackage?.endDate || pkg.endDate || null,
          totalSessions: pkg.totalSessions || calculatedTotalSessions || 0,
          usedSessions: usedSessions,
          status: 'active',
          assignedDate: patientPackage?.assignedDate || pkg.createdAt,
          paymentStatus: calculatedPaymentStatus, // Use calculated status including advance balance
          paidAmount: totalCashPaidFromBillings || usage?.paidAmount || patientPackage?.paidAmount || pkg.paidAmount || 0, // Total cash/card paid
          advanceUsed: totalAdvanceUsedFromBillings, // This is the total advance used!
          totalPaid: totalPaidIncludingAdvance, // Total paid (cash + advance) for display purposes
          paymentMethod: usage?.paymentMethod || patientPackage?.paymentMethod || pkg.paymentMethod || '',
          treatments: treatmentsWithUsage,
          billingHistory: usage?.billingHistory || [],
          isTransferred: usage?.isTransferred || false,
          transferredFrom: usage?.transferredFrom || null,
          transferredFromName: usage?.transferredFromName || null,
          transferredPackageName: usage?.transferredPackageName || (usage?.isTransferred ? usage?.packageName : null) || null,
          totalAllowedSessions: usage?.totalAllowedSessions || null,
          remainingSessions: usage?.remainingSessions || null,
          packageSoldBy: patientPackage?.packageSoldBy // <-- Include packageSoldBy!
        };
      });
     
      // Separate transferred-in packages from usage data
      const transferredInPkgs = packageUsageData
        .filter((u: any) => u.isTransferred && u.transferredFrom)
        .map((u: any) => ({
          packageName: u.packageName,
          transferredFromName: u.transferredFromName,
          transferredSessions: u.transferredSessions || 0,
          totalAllowedSessions: u.totalAllowedSessions || 0,
          remainingSessions: u.remainingSessions || 0,
          paymentStatus: u.paymentStatus || 'Unpaid',
          paidAmount: u.paidAmount || 0,
          paymentMethod: u.paymentMethod || '',
          treatments: u.treatments || [],
          billingHistory: u.billingHistory || []
        }));
     
      // Process memberships with usage data - separate active, transferred-in, and transferred-out
      // Filter patientMembershipIds to exclude transferred-out memberships
      const transferredOutMembershipIds = new Set(
        (patientData?.membershipTransfers || [])
          .filter((t: any) => t.type === 'out')
          .map((t: any) => String(t.membershipId))
      );
      patientMembershipIds = patientMembershipIds.filter((membershipId: any) =>
        !transferredOutMembershipIds.has(String(membershipId))
      );
     
      const patientMemberships = allMemberships.filter((membership: any) =>
        patientMembershipIds.includes(membership._id)
      ).map((membership: any) => {
        // Find the patient's membership assignment to get dates
        const currentMemberships = freshPatientData?.memberships || patientData?.memberships || [];
        const patientMembership = currentMemberships.find((m: any) => m.membershipId === membership._id);
       
        // Enrich with usage data
        const enrichedMembership = {
          ...membership,
          startDate: patientMembership?.startDate || membership.startDate,
          endDate: patientMembership?.endDate || membership.endDate,
          paymentStatus: membershipUsageData?.paymentStatus || patientMembership?.paymentStatus || 'Unpaid',
          paidAmount: membershipUsageData?.paidAmount || patientMembership?.paidAmount || 0,
          paymentMethod: membershipUsageData?.paymentMethod || patientMembership?.paymentMethod || '',
          status: 'active'
        };
       
        // Add usage data if available
        if (membershipUsageData) {
          (enrichedMembership as any).usageData = membershipUsageData;
        }
       
        return enrichedMembership;
      });
     
      // Separate transferred-in memberships from usage data
      const transferredInMembs = membershipUsageData && membershipUsageData.isTransferred ? [{
        membershipName: membershipUsageData.membershipName,
        transferredFromName: membershipUsageData.transferredFromName,
        transferredFreeConsultations: membershipUsageData.transferredFreeConsultations || 0,
        totalFreeConsultations: membershipUsageData.totalFreeConsultations || 0,
        remainingFreeConsultations: membershipUsageData.remainingFreeConsultations || 0,
        discountPercentage: membershipUsageData.discountPercentage || 0,
        paymentStatus: membershipUsageData.paymentStatus || 'Unpaid',
        paidAmount: membershipUsageData.paidAmount || 0,
        paymentMethod: membershipUsageData.paymentMethod || '',
        isExpired: false,
        hasFreeConsultations: membershipUsageData.hasFreeConsultations || false
      }] : [];
     
      setPackages(patientPackages);
      
      // Update editFormData.packages with fresh data (like paymentStatus, paidAmount) from patientPackages
      setEditFormData((prev: any) => {
        const updatedPackages = (prev.packages || []).map((pkg: any) => {
          const freshPkg = patientPackages.find((p: any) => p._id === pkg.packageId);
          if (freshPkg) {
            return {
              ...pkg,
              paymentStatus: freshPkg.paymentStatus || pkg.paymentStatus,
              paidAmount: freshPkg.paidAmount || pkg.paidAmount,
              paymentMethod: freshPkg.paymentMethod || pkg.paymentMethod,
              packageSoldBy: freshPkg.packageSoldBy || pkg.packageSoldBy, // <-- Update packageSoldBy too!
              // Update any other fields you need from freshPkg
            };
          }
          return pkg;
        });
        return {
          ...prev,
          packages: updatedPackages,
        };
      });
      // Fetch user packages (created via public form)
      try {
        const patientRegRes = await axios.get(`/api/clinic/patient-registration?id=${patientData._id}`, { headers });
        if (patientRegRes.data.success && patientRegRes.data.patient?.userPackages) {
          const approvedUserPackages = patientRegRes.data.patient.userPackages.filter(
            (pkg: any) => pkg.approvalStatus === 'approved'
          );
         
          // Initially set from patient record (partial data)
          setUserPackages(approvedUserPackages);
         
          const publicPkgRes = await axios.get('/api/clinic/public-package', {
            headers,
            params: {
              patientId: patientData._id,
              clinicId: patientData.clinicId,
            },
          });
         
          if (publicPkgRes.data.success && publicPkgRes.data.existingPackages) {
            const fullUserPackages = approvedUserPackages.map((userPkg: any) => {
              const fullPkg = publicPkgRes.data.existingPackages.find(
                (p: any) => p._id === userPkg.packageId
              );
             
              if (fullPkg) {
                // Find usage data for this user package
                const usage = packageUsageData.find((u: any) => u.packageName === fullPkg.packageName);
               
                let usedSessions = 0;
                let treatmentsWithUsage = fullPkg.treatments || [];
               
                if (usage) {
                  usedSessions = usage.totalSessions || 0;
                  // Enrich treatments with usage details
                  treatmentsWithUsage = (fullPkg.treatments || []).map((treatment: any) => {
                    const treatmentUsage = usage.treatments?.find((t: any) => t.treatmentSlug === (treatment.treatmentSlug || treatment.slug));
                    return {
                      ...treatment,
                      usedSessions: treatmentUsage?.totalUsedSessions || 0,
                      maxSessions: treatmentUsage?.maxSessions || treatment.sessions || treatment.maxSessions || 0,
                      usageDetails: treatmentUsage?.usageDetails || []
                    };
                  });
                }

                // Calculate total advance used from billing history for user packages!
                const packageBillingsForUserPkg = billings.filter((billing: any) => 
                  billing.service === "Package" && billing.package === fullPkg.packageName
                );
                const totalAdvanceUsedFromBillingsForUserPkg = packageBillingsForUserPkg.reduce(
                  (sum: number, billing: any) => sum + (Number(billing.advanceUsed) || 0), 0
                );
                const totalCashPaidFromBillingsForUserPkg = packageBillingsForUserPkg.reduce(
                  (sum: number, billing: any) => sum + (Number(billing.paid) || 0), 0
                );
                const totalPaidIncludingAdvanceForUserPkg = (userPkg.paidAmount || fullPkg.paidAmount || 0) + totalAdvanceUsedFromBillingsForUserPkg;
                const userPkgPrice = fullPkg.totalPrice || 0;
                // Determine payment status based on total paid (cash/card + advance)
                let calculatedPaymentStatusForUserPkg = userPkg.paymentStatus || fullPkg.paymentStatus || 'Unpaid';
                if (userPkgPrice > 0 && totalPaidIncludingAdvanceForUserPkg >= userPkgPrice) {
                  calculatedPaymentStatusForUserPkg = 'Full';
                } else if (totalPaidIncludingAdvanceForUserPkg > 0) {
                  calculatedPaymentStatusForUserPkg = 'Partial';
                }
                
                return {
                  ...fullPkg,
                  validityInMonths: fullPkg.validityInMonths || 0,
                  startDate: fullPkg.startDate || userPkg.assignedDate,
                  endDate: fullPkg.endDate || null,
                  paymentStatus: calculatedPaymentStatusForUserPkg, // Use calculated status including advance balance
                  paidAmount: totalCashPaidFromBillingsForUserPkg || userPkg.paidAmount || fullPkg.paidAmount || 0, // Total cash/card paid
                  advanceUsed: totalAdvanceUsedFromBillingsForUserPkg, // This is the total advance used!
                  totalPaid: totalPaidIncludingAdvanceForUserPkg, // Total paid (cash + advance) for display
                  paymentMethod: userPkg.paymentMethod || fullPkg.paymentMethod || '',
                  usedSessions: usedSessions,
                  remainingSessions: usage?.remainingSessions ?? (fullPkg.totalSessions - usedSessions),
                  assignedDate: userPkg.assignedDate,
                  treatments: treatmentsWithUsage,
                  packageSoldBy: userPkg.packageSoldBy // <-- Include packageSoldBy for user packages!
                };
              }
              return userPkg;
            });
            setUserPackages(fullUserPackages);
          }
        }
      } catch (err: any) {
        console.error('Error fetching user packages:', err.message);
      }

      setMemberships(patientMemberships);
      setTransferredInPackages(transferredInPkgs);
      setTransferredOutPackages(packageTransferredOutData);
      setTransferredInMemberships(transferredInMembs);
      setTransferredOutMemberships(membershipTransferredOutData);
    } catch (error: any) {
      console.error('Error fetching packages and memberships:', error.message);
      setPackages([]);
      setMemberships([]);
    } finally {
      setLoadingPackages(false);
    }
  };

  const fetchBillingHistory = async (): Promise<any[]> => {
    setLoadingBilling(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return [];

      const response = await axios.get(`/api/clinic/billing-history/${patientData._id}`, { headers });
     
      if (response.data.success) {
        let billings = response.data.billings || [];
        
        // CRITICAL: Load already-billed package IDs from billing history to prevent duplicates
        // This ensures packages that were already billed in previous sessions are tracked
        const packageBillings = billings.filter((b: any) => b.service === "Package" && b.package);
        if (packageBillings.length > 0) {
          setBilledPackageIds(prev => {
            const updated = new Set(prev);
            packageBillings.forEach((billing: any) => {
              const key = `${billing.package}-${billing.amount}-${patientData._id}`;
              updated.add(key);
            });
            console.log('📦 Loaded', packageBillings.length, 'package billings from history to prevent duplicates');
            return updated;
          });
        }
        
        // Resolve package names for unpaidPackagesPaid
        const billingsWithPackageNames = await Promise.all(
          billings.map(async (billing: any) => {
            if (billing.unpaidPackagesPaid && billing.unpaidPackagesPaid.length > 0) {
              const updatedPackages = await Promise.all(
                billing.unpaidPackagesPaid.map(async (pkg: any) => {
                  // If packageName already exists, use it
                  if (pkg.packageName) {
                    return pkg;
                  }
                  
                  // Otherwise fetch it from packageId
                  if (pkg.packageId) {
                    const packageName = await fetchPackageName(pkg.packageId);
                    return { ...pkg, packageName };
                  }
                  
                  return pkg;
                })
              );
              return { ...billing, unpaidPackagesPaid: updatedPackages };
            }
            return billing;
          })
        );
        
        setBillingHistory(billingsWithPackageNames);
        calculateFinancialSnapshot(billingsWithPackageNames);
       
        // Calculate valid cashback from billing history
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
       
        console.log('[CashbackProfile] Checking cashback validity:', {
          totalBillings: billings.length,
          today: today.toISOString()
        });
       
        // Find all billings with valid cashback (excluding refunded ones)
        const cashbackBillings = billings.filter((billing: any) => {
          // Skip refunded billings
          if (billing.isOfferRefunded) {
            console.log('[CashbackProfile] Skipping refunded billing:', billing.invoiceNumber);
            return false;
          }
          
          if (!billing.isCashbackApplied || !billing.cashbackAmount || billing.cashbackAmount <= 0) {
            return false;
          }
         
          // Check if cashback has not expired
          if (billing.cashbackEndDate) {
            const endDate = new Date(billing.cashbackEndDate);
            endDate.setHours(0, 0, 0, 0);
            const isValid = endDate >= today;
            console.log('[CashbackProfile] Billing:', billing.invoiceNumber, {
              cashbackAmount: billing.cashbackAmount,
              endDate: billing.cashbackEndDate,
              isValid,
              isRefunded: billing.isOfferRefunded
            });
            return isValid; // Not expired
          }
         
          return false;
        });
       
        console.log('[CashbackProfile] Valid cashback billings:', cashbackBillings.length);
       
        // Calculate total EARNED cashback (still valid, not expired)
        const totalCashbackEarned = cashbackBillings.reduce((sum: number, billing: any) => {
          return sum + (billing.cashbackAmount || 0);
        }, 0);
       
        // Calculate total USED cashback (from non-refunded billings only)
        const totalCashbackUsed = billings
          .filter((billing: any) => !billing.isOfferRefunded)  // Exclude refunded
          .reduce((sum: number, billing: any) => {
            return sum + (billing.cashbackWalletUsed || 0);
          }, 0);
       
        // Calculate AVAILABLE cashback = Earned - Used
        const availableCashbackAmount = Math.max(0, totalCashbackEarned - totalCashbackUsed);
       
        console.log('[CashbackProfile] Cashback calculation:', {
          totalEarned: totalCashbackEarned,
          totalUsed: totalCashbackUsed,
          available: availableCashbackAmount
        });
       
        // Get the nearest expiry date (from earned cashback billings)
        let nearestExpiry = null;
        if (cashbackBillings.length > 0) {
          const sortedByExpiry = cashbackBillings.sort((a: any, b: any) => {
            return new Date(a.cashbackEndDate).getTime() - new Date(b.cashbackEndDate).getTime();
          });
          nearestExpiry = sortedByExpiry[0].cashbackEndDate;
        }
       
        if (availableCashbackAmount > 0 && nearestExpiry) {
          setValidCashback({
            amount: availableCashbackAmount,
            expiryDate: nearestExpiry,
            endsAt: nearestExpiry, // Use the same date as endsAt from the offer
            daysRemaining: Math.ceil((new Date(nearestExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          });
        } else {
          setValidCashback(null);
        }
       
        return billings;
      }
    } catch (error: any) {
      console.error('Error fetching billing history:', error.message);
      setBillingHistory([]);
      return [];
    } finally {
      setLoadingBilling(false);
    }
    return [];
  };

  // Fetch appointments data for Treatment section
  const fetchTreatmentsFromAppointments = async () => {
    if (!patientData?._id) return;
   
    setLoadingTreatmentAppointments(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const oneYearAheadTx = new Date();
      oneYearAheadTx.setFullYear(oneYearAheadTx.getFullYear() + 1);

      const response = await axios.get(
        `/api/clinic/all-appointments?page=1&limit=1000&fromDate=${oneYearAgo.toISOString().split('T')[0]}&toDate=${oneYearAheadTx.toISOString().split('T')[0]}`,
        { headers }
      );
     
      if (response.data.success) {
        const patientAppointments = response.data.appointments?.filter(
          (apt: any) => apt.patientId?.toString() === patientData._id?.toString()
        ) || [];
        setAllAppointmentsData(patientAppointments);
      }
    } catch (error: any) {
      console.error('Error fetching appointments for treatments:', error.message);
      setAllAppointmentsData([]);
    } finally {
      setLoadingTreatmentAppointments(false);
    }
  };

  const calculateFinancialSnapshot = (billings: any[]) => {
    let totalSpent = 0;

    (billings || []).forEach((billing: any) => {
      // Exclude pure balance additions from total spent if they are just adding to advance balance
      // but INCLUDE them if they are actual payments for pending bills
      if ((billing.isAdvanceOnly || billing.treatment === "Advance Payment" || billing.treatment === "Historical Advance Balance") && billing.treatment !== "Pending Balance Payment") return;
      const paid = parseFloat(billing.paid) || 0;
      totalSpent += paid;
    });

    setFinancialData((prev: any) => ({
      ...prev,
      totalSpent: totalSpent, // Keep the exact value, don't round it
    }));
  };

  const fetchOverviewData = async () => {
    try {
      setLoadingStats(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const today = new Date().toISOString().split('T')[0];
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // Fetch appointments, package-usage, and billing in parallel
      const [appointmentsRes, packageUsageRes, billingRes, insuranceClaimsRes] = await Promise.all([
        axios.get(
          `/api/clinic/all-appointments?page=1&limit=1000&fromDate=${oneYearAgo.toISOString().split('T')[0]}&toDate=${today}`,
          { headers }
        ),
        axios.get(`/api/clinic/package-usage/${patientData._id}`, { headers }).catch(() => ({ data: { success: false } })),
        fetchBillingHistory(), // Use the unified function here
        axios.get(`/api/clinic/insurance-claims?patientId=${patientData._id}`, { headers }).catch(() => ({ data: { success: false } }))
      ]);

      let totalVisits = 0;
      let completedVisits = 0;
      let completedInvoices = 0;
      let cancelledNoShow = 0;
      let activePackages = 0;
      let pendingSessions = 0;
      let insuranceClaimsPending = 0;

      // Insurance
      if (insuranceClaimsRes.data.success) {
        const claims = insuranceClaimsRes.data.data || [];
        // Filter claims based on statuses that indicate they are still in the pipeline
        insuranceClaimsPending = claims.filter((c: any) =>
          ['Under Review', 'Approved'].includes(c.status)
        ).length;
      } else {
        insuranceClaimsPending = patientData?.insurance === 'Yes' ? 1 : 0;
      }

      // Calculate from appointments
      if (appointmentsRes.data.success) {
        const patientAppointments = appointmentsRes.data.appointments?.filter(
          (apt: any) => apt.patientId === patientData._id
        ) || [];
       
        // Count total visits based on specific statuses
        // Statuses that count as visits: Arrived, Waiting, Consultation, Approved, Rescheduled, Completed, Discharge, invoice
        const visitStatuses = ['arrived', 'waiting', 'consultation', 'approved', 'rescheduled', 'completed', 'discharge', 'invoice'];
        totalVisits = patientAppointments.filter((apt: any) => {
          const status = (apt.status || '').toLowerCase();
          return visitStatuses.includes(status);
        }).length;
       
        patientAppointments.forEach((apt: any) => {
          const status = (apt.status || apt.appointmentStatus || '').toLowerCase();
          if (['cancelled', 'rejected', 'no show', 'no-show'].includes(status)) {
            cancelledNoShow += 1;
          }
          if (['completed', 'discharge', 'approved'].includes(status)) {
            completedVisits += 1;
          }
        });
      }

      // Calculate active packages from patientData.packages (one entry per assigned package)
      // and include approved userPackages as well
      const assignedPackages: any[] = patientData?.packages || [];
      const approvedUserPackages: any[] = (patientData?.userPackages || []).filter(
        (pkg: any) => pkg.approvalStatus === 'approved'
      );
      activePackages = assignedPackages.length + approvedUserPackages.length;
      if (packageUsageRes.data.success) {
        const packageUsage: any[] = packageUsageRes.data.packageUsage || [];
        packageUsage.forEach((pkg: any) => {
          pendingSessions += pkg.remainingSessions ?? 0;
        });
      }

      // Completed invoices from billing history - Only count where billing.pending = 0
      if (billingRes) {
        const billings: any[] = billingRes;
       
        // Filter out advance payments first
        const treatmentBillings = billings.filter((b: any) => {
          const isAdvance = b.isAdvanceOnly ||
                           b.treatment === "Advance Payment" ||
                           b.treatment === "Historical Advance Balance";
          return !isAdvance;
        });
       
        // Count only billing records where pending field = 0 (no pending amount)
        completedInvoices = treatmentBillings.filter((billing: any) => {
          const pending = parseFloat(billing.pending || 0) || 0;
          return pending === 0;
        }).length;
      }

      setStatsData({
        totalVisits,
        completedVisits,
        completedInvoices,
        cancelledNoShow,
        activePackages,
        pendingSessions,
        insuranceClaimsPending,
      });
    } catch (error: any) {
      console.error('Error fetching stats data:', error.message);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchMediaDocuments = async () => {
    try {
      setLoadingMedia(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      // Fetch before/after images from patient-complaints API
      const response = await axios.get('/api/clinic/patient-complaints', {
        headers,
        params: { patientId: patientData._id }
      });

      if (response.data.success) {
        // Map complaints that have before/after images
        const mediaItems = (response.data.complaints || [])
          .filter((c: any) => c.beforeImage || c.afterImage)
          .map((c: any) => ({
            _id: c._id,
            complaints: c.complaints,
            beforeImage: c.beforeImage || null,
            afterImage: c.afterImage || null,
            doctorName: c.doctorId?.name || 'Doctor',
            appointmentDate: c.appointmentId?.startDate || c.createdAt,
            visitId: c.appointmentId?.visitId || null,
            createdAt: c.createdAt,
          }));
        setMediaDocuments(mediaItems);
      }
    } catch (error: any) {
      console.error('Error fetching before/after images:', error.message);
      setMediaDocuments([]);
    } finally {
      setLoadingMedia(false);
    }
  };

  // Fetch consent form statuses
  const fetchConsentStatuses = async () => {
    setLoadingConsentStatus(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      // Fetch both signed consents and sent logs
      const [signaturesRes, logsRes] = await Promise.all([
        axios.get('/api/clinic/consent-status', {
          headers,
          params: { patientId: patientData._id },
        }),
        axios.get('/api/clinic/consent-log', {
          headers,
          params: { patientId: patientData._id },
        }),
      ]);

      const signatures = signaturesRes.data?.consentStatuses || [];
      const logs = logsRes.data?.consentLogs || [];

      // Merge logs and signatures
      const logMap = new Map();

      // Add all logs first (sent forms)
      logs.forEach((log: any) => {
        logMap.set(log.consentFormId, {
          _id: log._id,
          consentFormId: log.consentFormId,
          consentFormName: log.consentFormName,
          description: log.description || "",
          patientName: log.patientName,
          date: new Date(log.createdAt).toLocaleDateString('en-GB'),
          hasSignature: false,
          status: 'sent',
          signedAt: null,
        });
      });

      // Update with signatures if they exist (signed forms)
      signatures.forEach((sig: any) => {
        logMap.set(sig.consentFormId, {
          ...sig,
          status: 'signed',
        });
      });

      const merged = Array.from(logMap.values());
      setConsentStatuses(merged);
    } catch (error: any) {
      console.error('Error fetching consent statuses:', error.message);
      setConsentStatuses([]);
    } finally {
      setLoadingConsentStatus(false);
    }
  };

  const fetchConsentForms = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await axios.get('/api/clinic/consent', { headers });
      if (res.data?.success) setConsentForms(res.data.consents || []);
    } catch (err) {
      console.error('Error fetching consent forms:', err);
    }
  };

  const handleSendConsentMsgOnWhatsapp = async () => {
    if (!selectedConsentId || !patientData) return;

    try {
      setSendingConsent(true);
      const headers = getAuthHeaders();
      if (!headers) {
        alert('Authentication required');
        return;
      }

      // Create patient data object for URL
      const patientDataObj = {
        firstName: patientData.firstName || "",
        lastName: patientData.lastName || "",
        mobileNumber: patientData.mobileNumber || "",
        email: patientData.email || "",
      };
     
      const encodedPatientData = encodeURIComponent(JSON.stringify(patientDataObj));
      const consentUrl = `https://zeva360.com/consent-form/${selectedConsentId}?patient=${encodedPatientData}`;

      const { data } = await axios.post(
        "/api/messages/send-message",
        {
          patientId: patientData._id,
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
        { headers }
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
              patientId: patientData._id,
              patientName: `${patientData.firstName} ${patientData.lastName}`.trim(),
              sentVia: "whatsapp",
            },
            { headers }
          );
         
          // Refresh consent statuses
          setTimeout(() => {
            fetchConsentStatuses();
          }, 100);
          alert('Consent form sent successfully!');
        } catch (logError) {
          console.error("Error logging consent form sent:", logError);
        }
      }
    } catch (error: any) {
      console.error("Error sending consent form:", error?.response?.data || error.message);
      alert("Failed to send consent form");
    } finally {
      setSendingConsent(false);
    }
  };

  const getConsentUrl = (consentFormId: string) => {
    if (!patientData) return "";
    const patientDataObj = {
      firstName: patientData.firstName || "",
      lastName: patientData.lastName || "",
      mobileNumber: patientData.mobileNumber || "",
      email: patientData.email || "",
    };
    const encodedPatientData = encodeURIComponent(JSON.stringify(patientDataObj));
    return `https://zeva360.com/consent-form/${consentFormId}?patient=${encodedPatientData}`;
  };

  const sendPackageLink = async () => {
    if (!patientData?._id || !patientData?.clinicId) {
      alert('Patient data not available');
      return;
    }

    try {
      setSendingPackageLink(true);
      const headers = getAuthHeaders();
      if (!headers) {
        alert('Authentication required');
        return;
      }

      const patientName = patientData?.fullName || `${patientData?.firstName || ''} ${patientData?.lastName || ''}`.trim();
      const patientMobile = patientData?.mobileNumber || '';

      // Generate package creation URL
      const packageUrl = `https://zeva360.com/public/create-package?clinicId=${patientData.clinicId}&patientId=${patientData._id}&patientName=${encodeURIComponent(patientName)}&patientMobile=${encodeURIComponent(patientMobile)}`;

      console.log("=== SENDING PACKAGE LINK VIA WHATSAPP ===");
      console.log("Package URL:", packageUrl);
      console.log("Patient Name:", patientName);
      console.log("Patient Mobile:", patientMobile);
      console.log("Clinic ID:", patientData.clinicId);
      console.log("Patient ID:", patientData._id);
      console.log("==========================================");

      // Send via WhatsApp message API
      const token = getStoredToken();
      await axios.post(
        "/api/messages/send-message",
        {
          patientId: patientData._id,
          providerId: "6952256c4a46b2f1eb01be86",
          channel: "whatsapp",
          content: "Create your own package by clicking the link below:\n\n ${packageUrl}\n\nThank you.",
          mediaUrl: "",
          mediaType: "",
          source: "Zeva",
          messageType: "template",
          templateId: "69c7afded3dde2931e28d8b6",
          headerParameters: [],
          bodyParameters: [
            {
              type: "text",
              text: packageUrl,
            },
          ],
          attachments: [],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert('Package link sent successfully!');
    } catch (error: any) {
      console.error("Error sending package link:", error);
      alert(error?.response?.data?.message || 'Failed to send package link');
    } finally {
      setSendingPackageLink(false);
    }
  };

  // Fetch created packages from UserPackage model
  const fetchCreatedPackages = async () => {
    // Don't run if patient data not available yet or missing required fields
    if (!patientData?._id) {
      console.warn("Patient ID not available, skipping fetchCreatedPackages");
      return;
    }

    setLoadingCreatedPackages(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setLoadingCreatedPackages(false);
        return;
      }

      // Build params - need at least one valid ID
      const params: any = {};
     
      // Only add patientId if it's a valid string
      if (patientData._id && typeof patientData._id === 'string' && patientData._id.length > 0) {
        params.patientId = patientData._id;
      }
     
      // Only add clinicId if it's a valid string
      if (patientData.clinicId && typeof patientData.clinicId === 'string' && patientData.clinicId.length > 0) {
        params.clinicId = patientData.clinicId;
      }

      // Ensure we have at least one valid parameter
      if (Object.keys(params).length === 0) {
        console.warn("No valid IDs available for fetchCreatedPackages");
        setLoadingCreatedPackages(false);
        return;
      }

      console.log('Fetching packages with params:', params);

      const response = await axios.get('/api/clinic/public-package', {
        headers,
        params,
      });

      if (response.data.success) {
        setCreatedPackages(response.data.existingPackages || []);
      }
    } catch (error: any) {
      console.error("Error fetching created packages:", error);
      // Don't set createdPackages to empty array - keep existing data
      // setCreatedPackages([]);
    } finally {
      setLoadingCreatedPackages(false);
    }
  };

  // Fetch progress notes
  const fetchProgressNotes = async () => {
    setLoadingProgressNotes(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.get('/api/clinic/progress-notes', {
        headers,
        params: { patientId: patientData._id },
      });

      if (response.data.success) {
        setProgressNotes(response.data.notes || []);
      }
    } catch (error: any) {
      console.error("Error fetching progress notes:", error);
      setProgressNotes([]);
    } finally {
      setLoadingProgressNotes(false);
    }
  };

  // Fetch prescriptions
  const fetchPrescriptions = async () => {
    setLoadingPrescriptions(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.get('/api/clinic/prescriptions', {
        headers,
        params: { patientId: patientData._id },
      });

      if (response.data.success) {
        setPrescriptions(response.data.prescriptions || []);
      }
    } catch (error: any) {
      console.error("Error fetching prescriptions:", error);
      setPrescriptions([]);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const fetchPatientBalance = async (patientId: string) => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      const res = await axios.get(`/api/clinic/patient-balance/${patientId}`, { headers });
      const data = res?.data?.balances || {};
      return {
        pendingBalance: Number(data.pendingBalance || 0),
        advanceBalance: Number(data.advanceBalance || 0),
        claimAmount: Number(data.claimAmount || 0),
        pendingClaim: Number(data.pendingClaim || 0),
        pastAdvanceBalance: Number(data.pastAdvanceBalance || 0),
        pastAdvance50PercentBalance: Number(data.pastAdvance50PercentBalance || 0),
        pastAdvance54PercentBalance: Number(data.pastAdvance54PercentBalance || 0),
        pastAdvance159FlatBalance: Number(data.pastAdvance159FlatBalance || 0),
        pendingBalanceImages: Array.isArray(data.pendingBalanceImages) ? data.pendingBalanceImages : [],
      };
    } catch {
      return {
        pendingBalance: 0,
        advanceBalance: 0,
        claimAmount: 0,
        pendingClaim: 0,
        pastAdvanceBalance: 0,
        pastAdvance50PercentBalance: 0,
        pastAdvance54PercentBalance: 0,
        pastAdvance159FlatBalance: 0,
        pendingBalanceImages: [],
      };
    }
  };

  // Fetch insurance claims for this patient
  const fetchInsuranceClaims = async () => {
    if (!patientData?._id) return;
    setClaimsLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await axios.get(`/api/clinic/insurance-claims?patientId=${patientData._id}`, { headers });
      if (res.data.success) {
        setInsuranceClaims(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching insurance claims:", err);
    } finally {
      setClaimsLoading(false);
    }
  };

  // Fetch dropdown data for claim editing
  const fetchClaimDropdowns = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const [deptRes, svcRes, docRes] = await Promise.all([
        axios.get("/api/clinic/departments", { headers }),
        axios.get("/api/clinic/services", { headers }),
        axios.get("/api/admin/get-all-doctor-staff", { headers }),
      ]);
      if (deptRes.data.success) setClaimDepartments(deptRes.data.departments || []);
      if (svcRes.data.success) setClaimServices(svcRes.data.services || []);
      if (docRes.data.success) setClaimDoctors(docRes.data.data || []);
    } catch (err) {
      console.error("Error fetching claim dropdowns:", err);
    }
  };

  // Handle claim edit save
  const handleClaimEditSave = async () => {
    if (!claimEditModal?._id) return;
    setClaimEditLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) { setClaimEditLoading(false); return; }
      const res = await axios.patch(`/api/clinic/insurance-claims/${claimEditModal._id}`, claimEditData, { headers: headers });
      if (res.data.success) {
        setClaimEditModal(null);
        fetchInsuranceClaims();
      } else {
        alert(res.data.message || "Failed to update claim");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update claim");
    } finally {
      setClaimEditLoading(false);
    }
  };

  // Delete insurance claim
  const deleteClaim = async (claimId: string) => {
    if (!confirm("Are you sure you want to delete this insurance claim? This action cannot be undone.")) {
      return;
    }
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await axios.delete(`/api/clinic/insurance-claims/${claimId}`, { headers });
      if (res.data.success) {
        fetchInsuranceClaims();
      } else {
        alert(res.data.message || "Failed to delete claim");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete claim");
    }
  };

  // Open claim edit modal
  const openClaimEditModal = (claim: any) => {
    setClaimEditData({
      insuranceProvider: claim.insuranceProvider || "",
      policyNumber: claim.policyNumber || "",
      expiryDate: claim.expiryDate ? new Date(claim.expiryDate).toISOString().split('T')[0] : "",
      insuranceCardFile: claim.insuranceCardFile || "",
      tableOfBenefitsFile: claim.tableOfBenefitsFile || "",
      departmentId: claim.departmentId || "",
      departmentName: claim.departmentName || "",
      serviceId: claim.serviceId || "",
      serviceName: claim.serviceName || "",
      services: claim.services || [],
      doctorId: claim.doctorId || "",
      doctorName: claim.doctorName || "",
      claimAmount: claim.claimAmount || "",
      claimType: claim.claimType || "Paid",
      coPayPercent: claim.coPayPercent || "",
      coPayType: claim.coPayType || "Patient Pays",
      notes: claim.notes || "",
      documentFiles: claim.documentFiles || [],
      advanceStatus: claim.advanceStatus || "Full Pay",
      advanceAmount: claim.advanceAmount || 0,
    });
    setClaimEditModal(claim);
    fetchClaimDropdowns();
  };

  // Fetch dropdowns for new claim form
  const fetchNewClaimDropdowns = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const [deptRes, svcRes, docRes] = await Promise.all([
        axios.get("/api/clinic/departments", { headers }),
        axios.get("/api/clinic/services", { headers }),
        axios.get("/api/admin/get-all-doctor-staff", { headers }),
      ]);
      if (deptRes.data.success) setNewClaimDepartments(deptRes.data.departments || []);
      if (svcRes.data.success) setNewClaimServices(svcRes.data.services || []);
      if (docRes.data.success) setNewClaimDoctors(docRes.data.data || []);
    } catch (err) {
      console.error("Error fetching new claim dropdowns:", err);
    }
  };

  // Handle new claim field changes
  const handleNewClaimChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewClaimData((prev: any) => {
      const updated = { ...prev, [name]: value };
      // Handle direct advanceAmount input (for both Advance and Paid types)
      if (name === "advanceAmount") {
        updated.advanceAmount = parseFloat(value) || 0;
      }
      if (name === "claimType" && value !== "Advance") {
        updated.advanceStatus = "Full Pay";
        updated.advanceAmount = 0;
      }
      if (name === "claimType" && value === "Advance") {
        updated.advanceStatus = "Full Pay";
        updated.advanceAmount = 0;
      }
      return updated;
    });
  };

  const handleNewClaimDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptId = e.target.value;
    const dept = newClaimDepartments.find((d: any) => d._id === deptId);
    setNewClaimData((prev: any) => ({
      ...prev,
      departmentId: deptId,
      departmentName: dept ? dept.name : "",
      serviceId: "",
      serviceName: "",
      services: [], // Clear services when department changes
    }));
  };

  const handleNewClaimServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    if (!serviceId) return;

    const service = newClaimServices.find((s: any) => s._id === serviceId);
    if (!service) return;

    setNewClaimData((prev: any) => {
      // Check if service is already selected
      const isAlreadySelected = prev.services.some((s: any) => s.serviceId === serviceId);
     
      let updatedServices;
      if (isAlreadySelected) {
        // If already selected, maybe the user wants to remove it?
        // Or we just keep it. Usually in single-select UI that adds to list,
        // selecting again doesn't do anything or removes it.
        // Let's make it add only if not present.
        updatedServices = prev.services;
      } else {
        updatedServices = [...prev.services, { serviceId: service._id, serviceName: service.name }];
      }

      return {
        ...prev,
        services: updatedServices,
        serviceId: serviceId,
        serviceName: service.name,
      };
    });
  };

  const handleNewClaimDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const docId = e.target.value;
    const doc = newClaimDoctors.find((d: any) => d._id === docId);
    setNewClaimData((prev: any) => ({
      ...prev,
      doctorId: docId,
      doctorName: doc ? doc.name : "",
    }));
  };

  const handleNewClaimFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setNewClaimUploadingFiles(true);
      const headers = getAuthHeaders();
      const uploadFormData = new FormData();
      uploadFormData.append(field, file);
      const res = await fetch("/api/clinic/insurance-claims/upload", {
        method: "POST",
        headers: { Authorization: (headers as any)?.Authorization || "" },
        body: uploadFormData,
      });
      const data = await res.json();
      if (data.success) {
        if (field === "insuranceCard") {
          setNewClaimData((prev: any) => ({ ...prev, insuranceCardFile: data.data.insuranceCardFile }));
        } else if (field === "tableOfBenefits") {
          setNewClaimData((prev: any) => ({ ...prev, tableOfBenefitsFile: data.data.tableOfBenefitsFile }));
        } else if (field === "documents") {
          setNewClaimData((prev: any) => ({ ...prev, documentFiles: [...prev.documentFiles, ...data.data.documentFiles] }));
        }
      }
    } catch (err) {
      console.error("File upload error:", err);
    } finally {
      setNewClaimUploadingFiles(false);
    }
  };

  const handleNewClaimDocumentsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      setNewClaimUploadingFiles(true);
      const headers = getAuthHeaders();
      const uploadFormData = new FormData();
      files.forEach(f => uploadFormData.append("documents", f));
      const res = await fetch("/api/clinic/insurance-claims/upload", {
        method: "POST",
        headers: { Authorization: (headers as any)?.Authorization || "" },
        body: uploadFormData,
      });
      const data = await res.json();
      if (data.success && data.data.documentFiles) {
        setNewClaimData((prev: any) => ({ ...prev, documentFiles: [...prev.documentFiles, ...data.data.documentFiles] }));
      }
    } catch (err) {
      console.error("Document upload error:", err);
    } finally {
      setNewClaimUploadingFiles(false);
    }
  };

  const handleClaimEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setClaimEditUploadingFiles(true);
      const headers = getAuthHeaders();
      const uploadFormData = new FormData();
      uploadFormData.append(field, file);
      const res = await fetch("/api/clinic/insurance-claims/upload", {
        method: "POST",
        headers: { Authorization: (headers as any)?.Authorization || "" },
        body: uploadFormData,
      });
      const data = await res.json();
      if (data.success) {
        if (field === "insuranceCard") {
          setClaimEditData((prev: any) => ({ ...prev, insuranceCardFile: data.data.insuranceCardFile }));
        } else if (field === "tableOfBenefits") {
          setClaimEditData((prev: any) => ({ ...prev, tableOfBenefitsFile: data.data.tableOfBenefitsFile }));
        } else if (field === "documents") {
          setClaimEditData((prev: any) => ({ ...prev, documentFiles: [...(prev.documentFiles || []), ...data.data.documentFiles] }));
        }
      }
    } catch (err) {
      console.error("File upload error:", err);
    } finally {
      setClaimEditUploadingFiles(false);
    }
  };

  const handleClaimEditDocumentsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      setClaimEditUploadingFiles(true);
      const headers = getAuthHeaders();
      const uploadFormData = new FormData();
      files.forEach(f => uploadFormData.append("documents", f));
      const res = await fetch("/api/clinic/insurance-claims/upload", {
        method: "POST",
        headers: { Authorization: (headers as any)?.Authorization || "" },
        body: uploadFormData,
      });
      const data = await res.json();
      if (data.success && data.data.documentFiles) {
        setClaimEditData((prev: any) => ({ ...prev, documentFiles: [...(prev.documentFiles || []), ...data.data.documentFiles] }));
      }
    } catch (err) {
      console.error("Document upload error:", err);
    } finally {
      setClaimEditUploadingFiles(false);
    }
  };

  const submitNewClaim = async () => {
    if (!patientData?._id) return;

    // Check if patient has pending claim using balance.pendingClaim (from patient-balance API)
    // This is the authoritative source as it accounts for billing payments
    if (balance.pendingClaim > 0) {
      alert(`Cannot create new claim. This patient has a pending claim of ${formatAED(balance.pendingClaim)}. Please clear the pending claim first.`);
      return;
    }

    try {
      setNewClaimSubmitting(true);
      const headers = getAuthHeaders();
      const res = await fetch("/api/clinic/insurance-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(headers as any) },
        body: JSON.stringify({
          patientId: patientData._id,
          insuranceProvider: newClaimData.insuranceProvider,
          policyNumber: newClaimData.policyNumber,
          expiryDate: newClaimData.expiryDate,
          insuranceCardFile: newClaimData.insuranceCardFile,
          tableOfBenefitsFile: newClaimData.tableOfBenefitsFile,
          departmentId: newClaimData.departmentId,
          departmentName: newClaimData.departmentName,
          serviceId: newClaimData.serviceId,
          serviceName: newClaimData.serviceName,
          services: newClaimData.services, // Send the services array
          doctorId: newClaimData.doctorId,
          doctorName: newClaimData.doctorName,
          claimAmount: newClaimData.claimAmount,
          claimType: newClaimData.claimType,
          coPayPercent: newClaimData.coPayPercent,
          coPayType: newClaimData.coPayType,
          notes: newClaimData.notes,
          documentFiles: newClaimData.documentFiles,
          advanceStatus: newClaimData.advanceStatus,
          advanceAmount: newClaimData.advanceAmount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewClaimForm(false);
        setNewClaimData({
          insuranceProvider: "", policyNumber: "", expiryDate: "",
          insuranceCardFile: "", tableOfBenefitsFile: "",
          departmentId: "", departmentName: "", serviceId: "", serviceName: "",
          services: [],
          doctorId: "", doctorName: "", claimAmount: "", claimType: "Paid",
          coPayPercent: "", coPayType: "Patient Pays", notes: "",
          documentFiles: [], advanceStatus: "Full Pay", advanceAmount: 0,
        });
        fetchInsuranceClaims();
      } else {
        alert(data.message || "Failed to create insurance claim");
      }
    } catch (err) {
      console.error("Claim submission error:", err);
      alert("Failed to create insurance claim");
    } finally {
      setNewClaimSubmitting(false);
    }
  };

  // Commented out - not currently used in the UI
  /* const handleUploadBalance = async () => {
    if (!patientData?._id) return;
   
    setUploadLoading(true);
    setUploadError(null);
   
    try {
      const updatedBalance = await fetchPatientBalance(patientData._id);
      if (updatedBalance) {
        setBalance(updatedBalance as typeof balance);
        setFinancialData((prev: any) => ({
          ...prev,
          advanceBalance: updatedBalance.advanceBalance || 0,
          pendingPayment: updatedBalance.pendingBalance || prev.pendingPayment,
        }));
      }
    } catch (error: any) {
      console.error('Error uploading balance data:', error);
      setUploadError(error?.response?.data?.message || 'Failed to fetch balance data. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  }; */

  const handleImageUpload = async (file: File) => {
    if (!patientData?._id) return;

    try {
      // Step 1: Upload image to /api/upload
      const formData = new FormData();
      formData.append('file', file);
     
      const authHeaders = getAuthHeaders();
      if (!authHeaders) throw new Error('Not authenticated');
     
      const uploadResponse = await axios.post('/api/upload', formData, {
        headers: {
          ...authHeaders,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!uploadResponse.data?.success || !uploadResponse.data?.url) {
        throw new Error('Image upload failed');
      }

      const imageUrl = uploadResponse.data.url;

      // Step 2: Save image URL to patient balance
      const saveResponse = await axios.post(
        `/api/clinic/patient-balance/${patientData._id}/upload-image`,
        { imageUrl },
        { headers: authHeaders }
      );

      if (saveResponse.data?.success) {
        // Refresh balance data to show the new image
        const updatedBalance = await fetchPatientBalance(patientData._id);
        if (updatedBalance) {
          setBalance(updatedBalance as typeof balance);
        }
        return true;
      } else {
        throw new Error(saveResponse.data?.message || 'Failed to save image');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const formatAED = (v: number) => {
    if (typeof v !== 'number' || Number.isNaN(v)) return '—';
    try { return `${getCurrencySymbol(currency)}${v.toLocaleString()}`; } catch { return `${getCurrencySymbol(currency)}${v}`; }
  };

  const filterAppointments = (appointmentsList: any[], filter: string) => {
    if (filter === 'all') return appointmentsList;
   
    // For 'upcoming' filter, use the already-fetched upcoming appointments
    if (filter === 'upcoming') {
      return upcomingAppointments;
    }
   
    return appointmentsList.filter((apt: any) => {
      const status = (apt.status || apt.appointmentStatus || '').toLowerCase();
      return status === filter.toLowerCase();
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      'booked':        { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Booked' },
      'upcoming':      { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Upcoming' },
      'enquiry':       { bg: 'bg-gray-100',   text: 'text-gray-700',   label: 'Enquiry' },
      'scheduled':     { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Scheduled' },
      'confirmed':     { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Confirmed' },
      'arrived':       { bg: 'bg-cyan-100',   text: 'text-cyan-700',   label: 'Arrived' },
      'waiting':       { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Waiting' },
      'consultation':  { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Consultation' },
      'rescheduled':   { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Rescheduled' },
      'invoice':       { bg: 'bg-teal-100',   text: 'text-teal-700',   label: 'Invoice' },
      'approved':      { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Approved' },
      'completed':     { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Completed' },
      'discharge':     { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Discharged' },
      'cancelled':     { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Cancelled' },
      'rejected':      { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Rejected' },
      'no show':       { bg: 'bg-orange-100', text: 'text-orange-700', label: 'No-Show' },
      'no-show':       { bg: 'bg-orange-100', text: 'text-orange-700', label: 'No-Show' },
    };
    const key = (status || '').toLowerCase();
    const config = statusConfig[key] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status || 'Unknown' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Drag and drop handlers for status filter tabs
  const handleStatusTabDragStart = (e: React.DragEvent, statusKey: string) => {
    setDraggedStatusKey(statusKey);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", statusKey);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleStatusTabDragEnd = (e: React.DragEvent) => {
    setDraggedStatusKey(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const handleStatusTabDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add("ring-2", "ring-blue-400", "ring-offset-2");
    }
  };

  const handleStatusTabDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove("ring-2", "ring-blue-400", "ring-offset-2");
    }
  };

  const handleStatusTabDrop = (e: React.DragEvent, targetStatusKey: string) => {
    e.preventDefault();
    
    if (!draggedStatusKey || draggedStatusKey === targetStatusKey) return;

    setStatusTabOrder((prevOrder) => {
      const newOrder = [...prevOrder];
      const draggedIndex = newOrder.indexOf(draggedStatusKey);
      const targetIndex = newOrder.indexOf(targetStatusKey);
      
      if (draggedIndex === -1 || targetIndex === -1) return prevOrder;
      
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedStatusKey);
      
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("appointmentStatusTabOrder", JSON.stringify(newOrder));
      }
      
      return newOrder;
    });
    
    setDraggedStatusKey(null);
  };

  // Sort status tabs by custom order
  const sortedStatusTabs = statusTabOrder
    .map((key) => statusTabsConfig.find((tab) => tab.key === key))
    .filter((tab): tab is { key: string; label: string } => tab !== undefined);

  const filteredAppointments = appointmentFilter === 'upcoming'
    ? filterAppointments(upcomingAppointments, appointmentFilter)
    : filterAppointments(appointments, appointmentFilter);

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm w-full">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">Patient Profile</h1>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
       
        {/* Patient Profile Header Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left: Avatar + Info */}
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
                {getInitials(patientData.firstName, patientData.lastName)}
              </div>
             
              {/* Patient Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                  {`${patientData.firstName || ''} ${patientData.lastName || ''}`.trim()}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-1.5 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500 font-medium flex-shrink-0">Email:</span>
                    <span className="text-gray-800 truncate">{patientData.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500 font-medium flex-shrink-0">Mobile:</span>
                    <span className="text-gray-800">{patientData.countryCode || ''} {patientData.mobileNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500 font-medium flex-shrink-0">Gender:</span>
                    <span className="text-gray-800">{patientData.gender || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500 font-medium flex-shrink-0">EMR:</span>
                    <span className="text-gray-800 font-semibold">{patientData.emrNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Cashback + Last Visit + Add Payment */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Cashback Display - Only show if valid cashback exists */}
              {validCashback && validCashback.amount > 0 && (
                <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <div className="text-[11px] font-bold text-green-800 uppercase tracking-wide">Cashback</div>
                  </div>
                  <div className="text-base font-bold text-green-700 mb-0.5">
                    {getCurrencySymbol(currency)}{validCashback.amount.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-green-600 font-semibold">
                    Ends At: {new Date(validCashback.endsAt || validCashback.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {/* <div className="text-[9px] text-green-500 mt-0.5">
                    {validCashback.daysRemaining} days remaining
                  </div> */}
                </div>
              )}

              {/* Last Visit */}
              <div className="text-center">
                <div className="text-[12px] font-semibold text-gray-800 font-medium mb-0.5">Last Visit</div>
                <div className="flex items-center gap-1 text-sm sm:text-base font-bold text-gray-900">
                  <Calendar className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                  {(() => {
                    if (!appointments || appointments.length === 0) return 'N/A';
                    const sorted = [...appointments].sort((a: any, b: any) => {
                      const da = new Date(a.startDate || a.createdAt).getTime();
                      const db = new Date(b.startDate || b.createdAt).getTime();
                      return db - da;
                    });
                    const last: any = sorted[0];
                    if (last.startDate) return new Date(last.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    if (last.createdAt) return new Date(last.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    return 'N/A';
                  })()}
                </div>
              </div>

              {/* Add Payment Button — teal gradient, opens Advance & Pending tab */}
              <button
                onClick={() => setActiveTab('advance')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all shadow-md font-medium text-xs whitespace-nowrap"
              >
                {/* <DollarSign className="w-3.5 h-3.5" /> */}
                {getCurrencySymbol(currency)} Add Payment
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`w-7 h-7 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-[10px] sm:text-xs text-gray-600 truncate">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-4 sticky top-14 sm:top-16 bg-gray-50 z-[9] -mx-3 sm:mx-0 px-3 sm:px-0">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide border-b border-gray-200 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap rounded-lg ${
                  activeTab === tab.id
                    ? 'text-teal-600 bg-white shadow-sm ring-1 ring-gray-200 underline underline-offset-4'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area - No Container */}
        {activeTab === 'appointments' ? (
              /* Appointments Tab Content */
              <div className="space-y-4">
                {/* Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {sortedStatusTabs.map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setAppointmentFilter(filter.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-move ${
                        appointmentFilter === filter.key
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                      draggable
                      onDragStart={(e) => handleStatusTabDragStart(e, filter.key)}
                      onDragEnd={handleStatusTabDragEnd}
                      onDragOver={handleStatusTabDragOver}
                      onDragLeave={handleStatusTabDragLeave}
                      onDrop={(e) => handleStatusTabDrop(e, filter.key)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
           
                {/* Appointments Table Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {loadingAppointments ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    </div>
                  ) : filteredAppointments.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">No appointments found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Service</th>
                            {appointmentFilter !== 'upcoming' && (
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Doctor</th>
                            )}
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date & Time</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAppointments.map((appointment: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                                    <Activity className="w-5 h-5 text-teal-600" />
                                  </div>
                                  <div>
                                    {(() => {
                                      const names: string[] = Array.isArray(appointment.serviceNames) && appointment.serviceNames.length > 0
                                        ? appointment.serviceNames
                                        : appointment.serviceName
                                        ? [appointment.serviceName]
                                        : appointment.treatmentName
                                        ? [appointment.treatmentName]
                                        : [];
                                      const isUpcomingAppointment = upcomingAppointments.some((apt: any) => apt._id === appointment._id);
                                      if (names.length === 0 && !isUpcomingAppointment) {
                                        return <div className="font-semibold text-gray-400 text-sm">-</div>;
                                      }
                                      return (
                                        <div className="flex flex-col gap-1">
                                          {isUpcomingAppointment && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 text-[10px] font-bold w-fit">
                                              <Clock size={9} />
                                              Upcoming
                                            </span>
                                          )}
                                          <div className="flex flex-wrap gap-1">
                                            {names.map((name, i) => (
                                              <span
                                                key={i}
                                                className="inline-block px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium"
                                              >
                                                {name}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                    {appointment.doctorSlotId && (
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        Slot: {appointment.doctorSlotId}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {appointmentFilter !== 'upcoming' && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                                      <User className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {appointment.doctorName || 'Dr. Not Assigned'}
                                    </span>
                                  </div>
                                </td>
                              )}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {appointment.registeredDate
                                      ? appointment.registeredDate
                                      : appointment.startDate
                                      ? new Date(appointment.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                      : 'N/A'}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {appointment.registeredTime
                                      ? appointment.registeredTime
                                      : appointment.fromTime && appointment.toTime
                                      ? `${appointment.fromTime} - ${appointment.toTime}`
                                      : appointment.fromTime || 'Time not set'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-700">
                                  {(() => {
                                    if (appointment.duration) return `${appointment.duration} mins`;
                                    if (appointment.fromTime && appointment.toTime) {
                                      const [fh, fm] = appointment.fromTime.split(':').map(Number);
                                      const [th, tm] = appointment.toTime.split(':').map(Number);
                                      const diff = (th * 60 + tm) - (fh * 60 + fm);
                                      return diff > 0 ? `${diff} mins` : 'N/A';
                                    }
                                    return 'N/A';
                                  })()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(appointment.status || appointment.appointmentStatus)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'packages-memberships' ? (
              /* Packages & Memberships Tab Content - Fully Editable */
              <div className="space-y-4">
                {/* Toast Notification */}
                {pmToast && (
                  <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${
                    pmToast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                    pmToast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                    'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    {pmToast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span className="text-[11px] font-medium">{pmToast.message}</span>
                    <button onClick={() => setPmToast(null)} className="ml-2"><X className="w-3 h-3" /></button>
                  </div>
                )}

                {/* Editable Membership & Package */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 shadow-md">
                  <div className="flex flex-col gap-4">
                    {/* Membership and Package Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* ── Membership Card ── */}
                      <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                        <h3 className="text-[14px] font-bold text-indigo-700 mb-2 flex items-center gap-1">
                          <User className="w-4 h-4 text-indigo-600" />
                          Membership
                        </h3>

                        {/* Membership Yes/No */}
                        <div className="flex flex-wrap gap-2 items-end mb-2">
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Membership</label>
                            <select
                              value={editFormData.membership || 'No'}
                              onChange={(e) => setEditFormData((p: any) => ({ ...p, membership: e.target.value }))}
                              className="text-gray-900 w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300 hover:border-indigo-400 transition-all duration-200"
                            >
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          </div>
                        </div>

                        {/* Add Membership - only when membership is Yes */}
                        {editFormData.membership === 'Yes' && (!showAddMembershipDropdown ? (
                          <button
                            type="button"
                            onClick={() => setShowAddMembershipDropdown(true)}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Membership
                          </button>
                        ) : (
                          <div className="border border-indigo-200 rounded-lg p-2 bg-indigo-50 mb-2">
                            <div className="flex flex-wrap gap-2 items-end">
                              <div className="flex-1 min-w-[150px]">
                                <label className="block text-[9px] mb-0.5 font-medium text-gray-700">Select Membership to Add</label>
                                <select
                                  value={selectedMembershipToAdd}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedMembershipToAdd(val);
                                    if (val) {
                                      const selected = allAvailableMemberships.find((m: any) => m._id === val);
                                      if (selected) {
                                        const start = new Date(addMembStartDate);
                                        const end = new Date(start);
                                        end.setMonth(end.getMonth() + (Number(selected.durationMonths) || 1));
                                        setAddMembEndDate(formatPmDate(end));
                                      }
                                    } else {
                                      setAddMembEndDate('');
                                    }
                                  }}
                                  className="text-gray-900 w-full px-2 py-1.5 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300 hover:border-indigo-400"
                                >
                                  <option value="">Select membership</option>
                                  {allAvailableMemberships.filter((m: any) => m.isActive !== false).map((m: any) => (
                                    <option key={m._id} value={m._id}>{m.name} ({getCurrencySymbol(currency)}{m.price}, {m.durationMonths} months)</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex-1 min-w-[120px]">
                                <label className="block text-[9px] mb-0.5 font-medium text-gray-700">Start Date</label>
                                <input
                                  type="date"
                                  value={addMembStartDate}
                                  readOnly
                                  className="w-full px-2 py-1.5 text-[10px] border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                              </div>
                              <div className="flex-1 min-w-[120px]">
                                <label className="block text-[9px] mb-0.5 font-medium text-gray-700">End Date</label>
                                <input
                                  type="date"
                                  value={addMembEndDate}
                                  readOnly
                                  className="w-full px-2 py-1.5 text-[10px] border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                              </div>
                              <div className="flex gap-1">
                                <button type="button" onClick={handlePmAddMembership} disabled={!selectedMembershipToAdd} className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">Add</button>
                                <button type="button" onClick={() => { setShowAddMembershipDropdown(false); setSelectedMembershipToAdd(''); }} className="px-3 py-1.5 bg-gray-300 text-gray-700 text-[10px] font-medium rounded-lg hover:bg-gray-400">Cancel</button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Added Memberships List — hide transferred-out memberships */}
                        {(() => {
                          const txOutMembershipIds = new Set(
                            (patientData?.membershipTransfers || []).filter((t: any) => t.type === 'out').map((t: any) => String(t.membershipId))
                          );
                          const visibleMemberships = (editFormData.memberships || [])
                            .map((m: any, originalIdx: number) => ({ m, originalIdx }))
                            .filter(({ m }: any) => !txOutMembershipIds.has(String(m.membershipId)));
                          if (visibleMemberships.length === 0) return null;
                         
                          // Check if more than 3 memberships to enable scroll
                          const shouldScroll = visibleMemberships.length > 3;
                         
                          return (
                            <div className="border border-gray-200 rounded p-2 mt-2">
                              <div className="text-[10px] font-semibold text-gray-900 mb-1">Added Memberships</div>
                              <div className={shouldScroll ? "space-y-1 max-h-[350px] overflow-y-auto pr-1" : "space-y-1"}>
                                {visibleMemberships.map(({ m, originalIdx }: any) => {
                                  const plan = allAvailableMemberships.find((x: any) => x._id === m.membershipId);
                                  const k = `${m.membershipId}|${m.startDate}|${m.endDate}`;
                                  const usage = pmMembershipUsageMap[k];
                                  const isExpired = m.endDate && new Date(m.endDate) < new Date();
                                 
                                  return (
                                    <div key={`${m.membershipId}-${originalIdx}`} className={`p-2 rounded-lg border ${isExpired ? 'border-red-200 bg-red-50/30' : 'border-indigo-100 bg-indigo-50/30'} hover:bg-indigo-50/50 transition-colors mb-2 last:mb-0 relative overflow-hidden`}>
                                      {isExpired && (
                                        <div className="absolute top-0 right-0 px-2 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase tracking-tighter transform rotate-0 z-10 rounded-bl-lg shadow-sm">
                                          Expired
                                        </div>
                                      )}
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[11px] font-bold ${isExpired ? 'text-red-900' : 'text-gray-900'}`}>{plan?.name || m.membershipId}</span>
                                            {plan?.benefits?.priorityBooking && !isExpired && (
                                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[8px] font-bold uppercase tracking-wider">Priority</span>
                                            )}
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600 mb-1">
                                            <div>
                                              <span className="text-gray-500">Validity:</span>
                                              <span className={`ml-1 font-semibold ${isExpired ? 'text-red-700 line-through' : 'text-gray-800'}`}>{m.startDate?.slice(0,10)} → {m.endDate?.slice(0,10)}</span>
                                            </div>
                                            <div>
                                              <span className="text-gray-500">Price:</span>
                                              <span className="ml-1 font-bold text-indigo-600">{getCurrencySymbol(currency)}{plan?.price || 0}</span>
                                            </div>
                                          </div>
                                          <div className={`text-[9px] ${isExpired ? 'text-red-600 bg-red-50/50 border-red-100' : 'text-gray-500 bg-white/50 border-indigo-50'} rounded px-1.5 py-1 border`}>
                                            Benefits: <span className={`font-medium ${isExpired ? 'text-red-800' : 'text-gray-700'}`}>{plan?.benefits?.freeConsultations || 0} consultations, {plan?.benefits?.discountPercentage || 0}% discount, {plan?.durationMonths || 0} months</span>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          className="ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          onClick={() => handlePmRemoveMembership(originalIdx)}
                                          title="Remove Membership"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                     
                                      {usage && !usage.isExpired && (usage.totalFreeConsultations || 0) > 0 && (() => {
                                        const total = usage.totalFreeConsultations || 0;
                                        const used = usage.usedFreeConsultations || 0;
                                        const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                                        return (
                                          <div className="mt-2 pt-2 border-t border-indigo-100">
                                            <div className="flex items-center justify-between text-[9px] text-gray-700 mb-1">
                                              <span className="font-medium">Free consultations used</span>
                                              <span className="font-bold">{used} / {total}</span>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                              <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%` }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* ── Package Card ── */}
                      <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                        <h3 className="text-[14px] font-bold text-purple-700 mb-2 flex items-center gap-1">
                          <FileText className="w-4 h-4 text-purple-600" />
                          Package
                        </h3>

                        {/* Package Yes/No */}
                        <div className="flex flex-wrap gap-2 items-end mb-2">
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-[10px] mb-0.5 font-medium text-gray-700">Package</label>
                            <select
                              value={editFormData.package || 'No'}
                              onChange={(e) => setEditFormData((p: any) => ({ ...p, package: e.target.value }))}
                              className="text-gray-900 w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300 hover:border-purple-400 transition-all duration-200"
                            >
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          </div>
                        </div>

                        {/* Add Package - only when package is Yes */}
                        {editFormData.package === 'Yes' && (!showAddPackageDropdown ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAddPackageDropdown(true)}
                              className="px-3 py-1.5 bg-purple-600 text-white text-[10px] font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Package
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCreatePackage(true);
                                setPkgError("");
                                setPkgSuccess("");
                                if (allServices.length === 0) fetchAllServices(); // Load clinic services
                              }}
                              className="px-3 py-1.5 border border-purple-300 bg-white text-purple-700 text-[10px] font-medium rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-1"
                            >
                              <Package className="w-3 h-3" /> Create Package
                            </button>
                          </div>
                        ) : (
                          <div className="border border-purple-200 rounded-lg p-2 bg-purple-50 mb-2">
                            <div className="flex flex-wrap gap-2 items-end">
                              <div className="flex-1 min-w-[150px]">
                                <label className="block text-[9px] mb-0.5 font-medium text-gray-700">Select Package to Add</label>
                                <select
                                  value={selectedPackageToAdd}
                                  onChange={(e) => setSelectedPackageToAdd(e.target.value)}
                                  className="text-gray-900 w-full px-2 py-1.5 text-[10px] border rounded-lg focus:ring-2 focus:ring-purple-500 border-gray-300 hover:border-purple-400"
                                >
                                  <option value="">Select package</option>
                                  {allAvailablePackages.map((pkg: any) => (
                                    <option key={pkg._id} value={pkg._id}>{pkg.name} ({getCurrencySymbol(currency)}{pkg.totalPrice}, {pkg.totalSessions} sessions)</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex gap-1">
                                <button type="button" onClick={handlePmAddPackage} disabled={!selectedPackageToAdd} className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">Add</button>
                                <button type="button" onClick={() => { setShowAddPackageDropdown(false); setSelectedPackageToAdd(''); }} className="px-3 py-1.5 bg-gray-300 text-gray-700 text-[10px] font-medium rounded-lg hover:bg-gray-400">Cancel</button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Create Package Panel - Enhanced Inline Form */}
                        {showCreatePackage && (
                          <div className="mt-4 px-4 py-3 border-t border-purple-100 bg-gradient-to-br from-violet-50/50 to-purple-50/50 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                                  <Package className="w-3.5 h-3.5 text-violet-600" />
                                </div>
                                <span className="text-xs font-bold text-violet-800">Create New Package</span>
                              </div>
                              <button type="button" onClick={() => { setShowCreatePackage(false); setPkgError(""); setPkgSuccess(""); setPkgModalName(""); setPkgModalPrice(""); setPkgModalValidityInMonths(""); setPkgModalStartDate(new Date().toISOString().split('T')[0]); setPkgModalEndDate(""); setPkgSelectedTreatments([]); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={14} />
                              </button>
                            </div>

                            {/* Package Name */}
                            <div className="mb-2.5">
                              <label className="block text-[10px] font-semibold text-violet-700 mb-1">Package Name <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={pkgModalName}
                                onChange={(e) => setPkgModalName(e.target.value)}
                                placeholder="e.g., Premium Skin Care Package"
                                className="w-full px-3 py-1.5 text-xs border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm"
                              />
                            </div>

                            {/* Package Price */}
                            <div className="mb-2.5">
                              <label className="block text-[10px] font-semibold text-violet-700 mb-1">Total Package Price <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">{getCurrencySymbol(currency)}</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={pkgModalPrice}
                                  onChange={(e) => setPkgModalPrice(e.target.value)}
                                  placeholder="0.00"
                                  className="w-full pl-10 pr-4 py-1.5 text-xs font-semibold border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm"
                                />
                              </div>
                            </div>

                            {/* Validity & Dates */}
                            <div className="grid grid-cols-3 gap-2 mb-2.5">
                              <div>
                                <label className="block text-[10px] font-semibold text-violet-700 mb-1">Validity (Months)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={pkgModalValidityInMonths}
                                  onChange={(e) => setPkgModalValidityInMonths(e.target.value)}
                                  placeholder="e.g. 12"
                                  className="w-full px-3 py-1.5 text-xs border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-violet-700 mb-1">Start Date</label>
                                <input
                                  type="date"
                                  value={pkgModalStartDate}
                                  readOnly
                                  className="w-full px-2 py-1.5 text-[10px] border border-violet-200 rounded-lg bg-violet-50 text-violet-700 cursor-not-allowed shadow-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-violet-700 mb-1">End Date</label>
                                <input
                                  type="date"
                                  value={pkgModalEndDate}
                                  readOnly
                                  className="w-full px-2 py-1.5 text-[10px] border border-violet-200 rounded-lg bg-violet-50 text-violet-700 cursor-not-allowed shadow-sm"
                                />
                              </div>
                            </div>

                            {/* Treatment Selector */}
                            <div className="mb-2.5">
                              <label className="block text-[10px] font-semibold text-violet-700 mb-1">Select Treatments / Services <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <div
                                  className="w-full px-3 py-1.5 text-xs border border-violet-200 rounded-lg bg-white cursor-pointer flex items-center justify-between hover:border-violet-300 transition-colors shadow-sm"
                                  onClick={() => {
                                    setPkgTreatmentDropdownOpen(!pkgTreatmentDropdownOpen);
                                    if (!pkgTreatmentDropdownOpen && allServices.length === 0) fetchAllServices();
                                  }}
                                >
                                  <span className={pkgSelectedTreatments.length > 0 ? "text-gray-800 font-medium" : "text-gray-400"}>
                                    {pkgSelectedTreatments.length > 0
                                      ? `${pkgSelectedTreatments.length} treatment${pkgSelectedTreatments.length > 1 ? 's' : ''} selected`
                                      : "Select treatments..."
                                    }
                                  </span>
                                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${pkgTreatmentDropdownOpen ? "rotate-180" : ""}`} />
                                </div>

                                {pkgTreatmentDropdownOpen && (
                                  <div className="absolute z-20 w-full mt-1 bg-white border border-violet-200 rounded-lg shadow-lg max-h-48 overflow-hidden flex flex-col">
                                    <div className="p-2 border-b border-violet-100 sticky top-0 bg-white">
                                      <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                                        <input
                                          type="text"
                                          value={pkgTreatmentSearch}
                                          onChange={(e) => setPkgTreatmentSearch(e.target.value)}
                                          placeholder="Search..."
                                          autoFocus
                                          className="w-full pl-7 pr-2 py-1.5 text-[10px] border border-violet-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400"
                                        />
                                      </div>
                                    </div>
                                    <div className="overflow-y-auto max-h-40">
                                      {loadingServices ? (
                                        <div className="flex items-center justify-center p-3">
                                          <Loader2 className="w-4 h-4 text-violet-600 animate-spin" />
                                          <span className="ml-2 text-[10px] text-gray-500">Loading...</span>
                                        </div>
                                      ) : allServices.filter((s) => s.name.toLowerCase().includes(pkgTreatmentSearch.toLowerCase())).length === 0 ? (
                                        <div className="p-3 text-center text-[10px] text-gray-400">No treatments found</div>
                                      ) : (
                                        <ul className="py-1">
                                          {allServices
                                            .filter((svc) => svc.name.toLowerCase().includes(pkgTreatmentSearch.toLowerCase()))
                                            .map((svc) => {
                                              const isSelected = pkgSelectedTreatments.some((t) => t.treatmentSlug === svc._id);
                                              return (
                                                <li key={svc._id}>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      if (isSelected) {
                                                        setPkgSelectedTreatments((prev) => prev.filter((t) => t.treatmentSlug !== svc._id));
                                                      } else {
                                                        setPkgSelectedTreatments((prev) => [
                                                          ...prev,
                                                          {
                                                            treatmentName: svc.name,
                                                            treatmentSlug: svc._id,
                                                            sessions: 1,
                                                            allocatedPrice: svc.clinicPrice != null ? svc.clinicPrice : svc.price,
                                                          },
                                                        ]);
                                                      }
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-violet-50 transition-colors ${
                                                      isSelected ? "bg-violet-50" : ""
                                                    }`}
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                                        isSelected ? "bg-violet-600 border-violet-600" : "border-gray-300"
                                                      }`}>
                                                        {isSelected && <Check size={8} className="text-white" />}
                                                      </div>
                                                      <div className="text-left">
                                                        <p className="text-[10px] font-medium text-gray-800">{svc.name}</p>
                                                        <p className="text-[8px] text-gray-500">
                                                          {getCurrencySymbol(currency)} {(svc.clinicPrice != null ? svc.clinicPrice : svc.price).toFixed(2)}
                                                        </p>
                                                      </div>
                                                    </div>
                                                  </button>
                                                </li>
                                              );
                                            })}
                                        </ul>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Selected Treatments List */}
                              {pkgSelectedTreatments.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                  <p className="text-[10px] font-semibold text-violet-700">Selected Treatments</p>
                                  {pkgSelectedTreatments.map((sel) => {
                                    const sessPrice = sel.sessions > 0 ? (sel.allocatedPrice || 0) / sel.sessions : 0;
                                    return (
                                      <div key={sel.treatmentSlug} className="bg-white border border-violet-200 rounded-lg p-2 shadow-sm">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="text-[10px] font-semibold text-violet-700">{sel.treatmentName}</span>
                                          <button
                                            type="button"
                                            onClick={() => setPkgSelectedTreatments((prev) => prev.filter((t) => t.treatmentSlug !== sel.treatmentSlug))}
                                            className="text-red-400 hover:text-red-600 transition-colors"
                                          >
                                            <X size={12} />
                                          </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1.5">
                                          <div>
                                            <label className="block text-[8px] text-violet-600 font-medium mb-0.5">Price</label>
                                            <input
                                              type="number" min="0" step="0.01"
                                              value={sel.allocatedPrice || ""}
                                              onChange={(e) => setPkgSelectedTreatments((prev) => prev.map((t) => t.treatmentSlug === sel.treatmentSlug ? { ...t, allocatedPrice: parseFloat(e.target.value) || 0 } : t))}
                                              className="w-full px-2 py-1 text-[9px] border border-violet-200 rounded-md focus:outline-none"
                                              placeholder="0.00"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[8px] text-violet-600 font-medium mb-0.5">Sessions</label>
                                            <input
                                              type="number" min="1"
                                              value={sel.sessions}
                                              onChange={(e) => setPkgSelectedTreatments((prev) => prev.map((t) => t.treatmentSlug === sel.treatmentSlug ? { ...t, sessions: parseInt(e.target.value) || 1 } : t))}
                                              className="w-full px-2 py-1 text-[9px] border border-violet-200 rounded-md text-center focus:outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[8px] text-violet-600 font-medium mb-0.5">/Session</label>
                                            <div className="px-1 py-1 text-[9px] font-bold text-center bg-violet-100 rounded-md text-violet-700 border border-violet-200">
                                              {getCurrencySymbol(currency)}{sessPrice.toFixed(2)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Price Validation Summary */}
                                  <div className="grid grid-cols-3 gap-1 bg-violet-100 rounded-lg px-2 py-1.5">
                                    <div className="text-center">
                                      <p className="text-[8px] text-violet-600 font-medium">Pkg Price</p>
                                      <p className="text-[9px] font-bold text-violet-800">{getCurrencySymbol(currency)}{parseFloat(pkgModalPrice) || 0}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-[8px] text-violet-600 font-medium">Allocated</p>
                                      <p className="text-[9px] font-bold text-violet-800">{getCurrencySymbol(currency)}{pkgSelectedTreatments.reduce((sum, t) => sum + (t.allocatedPrice || 0), 0).toFixed(2)}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-[8px] text-violet-600 font-medium">Remaining</p>
                                      <p className={`text-[9px] font-bold ${
                                        Math.abs((parseFloat(pkgModalPrice) || 0) - pkgSelectedTreatments.reduce((sum, t) => sum + (t.allocatedPrice || 0), 0)) < 0.01
                                          ? "text-teal-600" : "text-amber-600"
                                      }`}>
                                        {getCurrencySymbol(currency)}{((parseFloat(pkgModalPrice) || 0) - pkgSelectedTreatments.reduce((sum, t) => sum + (t.allocatedPrice || 0), 0)).toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Error/Success Messages */}
                            {pkgError && (
                              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                <p className="text-[10px] text-red-700">{pkgError}</p>
                              </div>
                            )}
                            {pkgSuccess && (
                              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                <p className="text-[10px] text-green-700 font-medium">{pkgSuccess}</p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleCreatePackageModal(false)}
                                disabled={pkgSubmitting || addingPackageToPatient}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-[10px] font-semibold text-violet-700 bg-white border border-violet-500 rounded-lg hover:bg-violet-50 disabled:opacity-50"
                              >
                                <Package size={12} />
                                {pkgSubmitting ? "Creating..." : "Create Package"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCreatePackageModal(true)}
                                disabled={pkgSubmitting || addingPackageToPatient}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-[10px] font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50"
                              >
                                <Plus size={12} />
                                {addingPackageToPatient ? "Adding..." : "Create & Add to Patient"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Added Packages List — hide transferred-out packages */}
                        {(() => {
                          const txOutPackageIds = new Set(
                            transferredOutPackages.map((p: any) => String(p.packageId))
                          );
                          const visiblePackages = (editFormData.packages || [])
                            .map((p: any, originalIdx: number) => ({ p, originalIdx }))
                            .filter(({ p }: any) => !txOutPackageIds.has(String(p.packageId)));
                          if (visiblePackages.length === 0) return null;
                         
                          // Check if more than 3 packages to enable scroll
                          const shouldScroll = visiblePackages.length > 3;
                         
                          return (
                            <div className="border border-gray-200 rounded p-2 mt-2">
                              <div className="text-[10px] font-semibold text-gray-900 mb-1">Added Packages</div>
                              <div className={shouldScroll ? "space-y-1 max-h-[350px] overflow-y-auto pr-1" : "space-y-1"}>
                                {visiblePackages.map(({ p, originalIdx }: any) => {
                                  const pkg = allAvailablePackages.find((x: any) => x._id === p.packageId);
                                  const validity = p.validityInMonths || pkg?.validityInMonths;
                                  const startDate = p.startDate || pkg?.startDate;
                                  const endDate = p.endDate || pkg?.endDate;
                                  const isExpired = endDate && new Date(endDate) < new Date();
                                  const paymentStatus = p.paymentStatus || 'Unpaid';
                                  const paymentMethod = p.paymentMethod || 'N/A';
                                 
                                  return (
                                    <div key={`${p.packageId}-${originalIdx}`} className={`flex flex-col text-[10px] border-b ${isExpired ? 'border-red-100 bg-red-50/20' : 'border-purple-100 bg-purple-50/20'} pb-2 last:border-b-0 mb-2 last:mb-0 p-2 rounded-lg relative overflow-hidden`}>
                                      {isExpired && (
                                        <div className="absolute top-0 right-0 px-2 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase tracking-tighter transform rotate-0 z-10 rounded-bl-lg shadow-sm">
                                          Expired
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between">
                                        <div className={`font-bold ${isExpired ? 'text-red-900 line-through' : 'text-gray-800'} flex items-center gap-1.5`}>
                                          {pkg?.name || p.packageId} • {getCurrencySymbol(currency)}{pkg?.totalPrice}
                                          {paymentStatus === 'Full' && <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[7px] font-black uppercase">Full Paid</span>}
                                          {paymentStatus === 'Partial' && <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[7px] font-black uppercase">Partial ({getCurrencySymbol(currency)}{p.paidAmount})</span>}
                                          {paymentStatus === 'Unpaid' && <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[7px] font-black uppercase">Unpaid</span>}
                                        </div>
                                        <button
                                          type="button"
                                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                          onClick={() => handlePmRemovePackage(originalIdx)}
                                          title="Remove Package"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      <div className={`mt-0.5 flex flex-wrap items-center gap-2 ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
                                        <span className="font-medium">{pkg?.totalSessions} sessions</span>
                                        <span className="text-gray-300">|</span>
                                        {paymentMethod !== 'N/A' && (
                                          <span className="px-1.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold uppercase text-[7px] border border-indigo-100 flex items-center gap-1 shadow-sm">
                                            <Wallet className="w-2 h-2" />
                                            {paymentMethod}
                                          </span>
                                        )}
                                        {p.packageSoldBy && (
                                          <span className="px-1.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold uppercase text-[7px] border border-emerald-100 flex items-center gap-1 shadow-sm">
                                            <User className="w-2 h-2" />
                                            Sold by: {p.packageSoldBy}
                                          </span>
                                        )}
                                      </div>
                                     
                                      {/* Validity & Dates */}
                                      {(validity || startDate || endDate) && (
                                        <div className={`mt-1.5 grid grid-cols-2 gap-2 p-1.5 rounded border ${isExpired ? 'bg-red-50/50 border-red-100' : 'bg-white/60 border-purple-100'}`}>
                                          <div className={`col-span-2 text-[9px] font-bold flex items-center gap-1 ${isExpired ? 'text-red-700' : 'text-purple-700'}`}>
                                            <Clock className="w-2.5 h-2.5" />
                                            Validity: {validity || 0} Months
                                          </div>
                                          <div>
                                            <p className="text-[8px] text-gray-500 font-medium">Start Date</p>
                                            <input
                                              type="date"
                                              value={startDate ? (startDate.includes('T') ? startDate.split('T')[0] : startDate) : ''}
                                              onChange={(e) => {
                                                const newDate = e.target.value;
                                                setEditFormData((prev: any) => {
                                                  const newPackages = [...(prev.packages || [])];
                                                  if (newPackages[originalIdx]) {
                                                    const pkgToUpdate = { ...newPackages[originalIdx], startDate: newDate };
                                                   
                                                    // Auto-calculate end date based on validity
                                                    const currentValidity = Number(pkgToUpdate.validityInMonths) || Number(pkg?.validityInMonths) || 0;
                                                    if (currentValidity > 0 && newDate) {
                                                      const d = new Date(newDate);
                                                      d.setMonth(d.getMonth() + currentValidity);
                                                      pkgToUpdate.endDate = formatPmDate(d);
                                                    }
                                                   
                                                    newPackages[originalIdx] = pkgToUpdate;
                                                  }
                                                  return { ...prev, packages: newPackages };
                                                });
                                              }}
                                              className={`w-full bg-transparent text-[9px] font-bold border-b border-dashed border-gray-300 focus:border-purple-500 focus:outline-none ${isExpired ? 'text-red-800' : 'text-gray-800'}`}
                                            />
                                          </div>
                                          <div>
                                            <p className="text-[8px] text-gray-500 font-medium">End Date</p>
                                            <input
                                              type="date"
                                              value={endDate ? (endDate.includes('T') ? endDate.split('T')[0] : endDate) : ''}
                                              onChange={(e) => {
                                                const newDate = e.target.value;
                                                setEditFormData((prev: any) => {
                                                  const newPackages = [...(prev.packages || [])];
                                                  if (newPackages[originalIdx]) {
                                                    newPackages[originalIdx] = { ...newPackages[originalIdx], endDate: newDate };
                                                  }
                                                  return { ...prev, packages: newPackages };
                                                });
                                              }}
                                              className={`w-full bg-transparent text-[9px] font-bold border-b border-dashed border-gray-300 focus:border-purple-500 focus:outline-none ${isExpired ? 'text-red-800' : 'text-gray-800'}`}
                                            />
                                          </div>
                                        </div>
                                      )}
                                     
                                      <div className="text-gray-500 text-[9px] mt-1">Treatments: {pkg?.treatments?.length || 0} included</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Package Payment Modal */}
                    {showPackagePaymentModal && (pkgPendingToAssign || pkgPendingToCreate) && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div
                          className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
                          onClick={() => {
                            setShowPackagePaymentModal(false);
                            setPkgPendingToCreate(null); // Clear pending create on backdrop click
                          }}
                        />
                        <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
                          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm text-white">
                                <DollarSign className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-white leading-tight">Pay for Package</h3>
                                <p className="text-purple-100 text-[10px] font-medium opacity-80">{pkgPendingToCreate?.name || pkgPendingToAssign?.name}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setShowPackagePaymentModal(false);
                                setPkgPendingToCreate(null); // Clear pending create on cancel
                              }}
                              className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar">
                            {/* Loading State */}
                            {pkgLoadingBalance ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                <span className="ml-3 text-sm text-gray-600">Loading balance information...</span>
                              </div>
                            ) : (
                              <>
                            {/* Auto-enable advance balance when modal loads and balance is available */}
                            {(() => {
                              if (!pkgLoadingBalance && pkgAvailableBalance.advanceBalance > 0 && !pkgUseAdvanceBalance) {
                                // Auto-enable advance balance
                                setPkgUseAdvanceBalance(true);
                                // Recalculate based on entered amount
                                calculatePkgAmountToPay(pkgEnteredAmount);
                              }
                              return null;
                            })()}
                            
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                  <AlertCircle className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Total Package Price</div>
                                    <div className="text-base font-bold text-amber-900">{getCurrencySymbol(currency)}{pkgTotalAmount.toLocaleString()}</div>
                                  </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setPkgPaymentType("Full");
                                  setPkgEnteredAmount(pkgTotalAmount);
                                  // Recalculate amount to pay based on entered amount and balance usage
                                  calculatePkgAmountToPay(pkgTotalAmount);
                                }}
                                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 ${pkgPaymentType === 'Full' ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-md' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-purple-200'}`}
                              >
                                <CheckCircle className={`w-5 h-5 ${pkgPaymentType === 'Full' ? 'text-purple-600' : 'text-gray-300'}`} />
                                <span className="font-bold text-[11px]">Full Payment</span>
                                <span className="text-[9px] opacity-70">Pay 100% ({getCurrencySymbol(currency)}{pkgTotalAmount})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPkgPaymentType("Partial");
                                  // Calculate 50% of total as the base amount for partial payment
                                  const fiftyPercent = pkgTotalAmount / 2;
                                  setPkgEnteredAmount(fiftyPercent);
                                  // Recalculate amount to pay based on entered amount and balance usage
                                  calculatePkgAmountToPay(fiftyPercent);
                                }}
                                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 ${pkgPaymentType === 'Partial' ? 'border-amber-600 bg-amber-50 text-amber-700 shadow-md' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-amber-200'}`}
                              >
                                <Activity className={`w-5 h-5 ${pkgPaymentType === 'Partial' ? 'text-amber-600' : 'text-gray-300'}`} />
                                <span className="font-bold text-[11px]">Partial Payment</span>
                                <span className="text-[9px] opacity-70">Pay {getCurrencySymbol(currency)}{(pkgTotalAmount / 2).toFixed(2)}</span>
                              </button>
                            </div>

                            {/* Balance Usage Options */}
                            {(pkgAvailableBalance.advanceBalance > 0 || pkgAvailableBalance.claimAmount > 0) && (
                              <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2">
                                  <Wallet className="w-4 h-4 text-blue-600" />
                                  <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Use Available Balances</span>
                                </div>
                                
                                {/* Advance Balance Option */}
                                {pkgAvailableBalance.advanceBalance > 0 && (
                                  <label className="flex items-center justify-between cursor-pointer p-3 bg-white rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition-all shadow-sm">
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={pkgUseAdvanceBalance}
                                        onChange={(e) => {
                                          setPkgUseAdvanceBalance(e.target.checked);
                                          // Recalculate amount to pay based on entered amount and whether advance is enabled
                                          calculatePkgAmountToPay(pkgEnteredAmount);
                                        }}
                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                                      />
                                      <div>
                                        <div className="text-[10px] font-bold text-gray-700">Use Advance Balance</div>
                                        <div className="text-[9px] text-gray-500">Available: {getCurrencySymbol(currency)}{pkgAvailableBalance.advanceBalance.toFixed(2)}</div>
                                      </div>
                                    </div>
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                                      {getCurrencySymbol(currency)} {pkgAvailableBalance.advanceBalance.toFixed(2)}
                                    </span>
                                  </label>
                                )}

                                {/* Claim Balance Option */}
                                {pkgAvailableBalance.claimAmount > 0 && (
                                  <label className="flex items-center justify-between cursor-pointer p-3 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all shadow-sm">
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={pkgUseClaimBalance}
                                        onChange={(e) => {
                                          setPkgUseClaimBalance(e.target.checked);
                                          // Recalculate amount to pay based on entered amount and whether claim is enabled
                                          calculatePkgAmountToPay(pkgEnteredAmount);
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                      />
                                      <div>
                                        <div className="text-[10px] font-bold text-gray-700">Use Insurance Claim</div>
                                        <div className="text-[9px] text-gray-500">Available: {getCurrencySymbol(currency)}{pkgAvailableBalance.claimAmount.toFixed(2)}</div>
                                      </div>
                                    </div>
                                    <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                                      {getCurrencySymbol(currency)} {pkgAvailableBalance.claimAmount.toFixed(2)}
                                    </span>
                                  </label>
                                )}

                                {/* Summary of Balance Usage */}
                                {(pkgAdvanceUsedAmount > 0 || pkgClaimUsedAmount > 0) && (
                                  <div className="mt-3 p-3 bg-white rounded-xl border border-gray-200">
                                    <div className="text-[9px] font-bold text-gray-600 uppercase mb-2">Payment Summary</div>
                                    <div className="space-y-1.5 text-[10px]">
                                      {pkgAdvanceUsedAmount > 0 && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-600">Advance Used:</span>
                                          <span className="font-bold text-emerald-700">- {getCurrencySymbol(currency)}{pkgAdvanceUsedAmount.toFixed(2)}</span>
                                        </div>
                                      )}
                                      {pkgClaimUsedAmount > 0 && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-600">Claim Used:</span>
                                          <span className="font-bold text-blue-700">- {getCurrencySymbol(currency)}{pkgClaimUsedAmount.toFixed(2)}</span>
                                        </div>
                                      )}
                                      <div className="border-t border-gray-200 pt-1.5 mt-1.5 flex justify-between items-center">
                                        <span className="font-bold text-gray-800">Remaining Balance:</span>
                                        <span className="font-bold text-lg text-purple-700">{getCurrencySymbol(currency)}{Math.max(0, pkgTotalAmount - pkgAdvanceUsedAmount - pkgClaimUsedAmount - pkgPaidAmount).toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Enter Amount Input */}
                            {pkgPaymentType && (
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-1">
                                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Enter Amount</label>
                                  <span className="text-[9px] text-amber-600 font-semibold">
                                    {pkgPaymentType === 'Partial' ? `50% = ${getCurrencySymbol(currency)}${(pkgTotalAmount / 2).toFixed(2)}` : `Full = ${getCurrencySymbol(currency)}${pkgTotalAmount.toFixed(2)}`}
                                  </span>
                                </div>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">{getCurrencySymbol(currency)}</span>
                                  <input
                                    type="number"
                                    value={pkgEnteredAmount}
                                    onChange={(e) => {
                                      const entered = Number(e.target.value);
                                      setPkgEnteredAmount(entered);
                                      setPkgPaymentType("Custom");
                                      // Recalculate amount to pay based on entered amount and balance usage
                                      calculatePkgAmountToPay(entered);
                                    }}
                                    className="w-full bg-amber-50 border-2 border-amber-200 rounded-2xl py-3 pl-8 pr-4 text-lg font-bold text-gray-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-all shadow-sm"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Amount to Pay</label>
                                <span className="text-[9px] text-purple-600 font-semibold">
                                  {pkgPaymentType === 'Partial' ? 'Partial (50%=' : pkgPaymentType === 'Full' ? 'Full' : 'Custom'} {getCurrencySymbol(currency)}{(pkgPaymentType === 'Partial' ? pkgTotalAmount / 2 : pkgPaymentType === 'Full' ? pkgTotalAmount : pkgEnteredAmount).toFixed(2)}{pkgPaymentType === 'Partial' ? ')' : ''}
                                </span>
                              </div>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">{getCurrencySymbol(currency)}</span>
                                <input
                                  type="number"
                                  value={pkgPaidAmount}
                                  readOnly
                                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 pl-8 pr-4 text-lg font-bold text-gray-900 cursor-not-allowed"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider px-1">Payment Method</label>
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  { id: 'Cash', icon: <DollarSign className="w-4 h-4" />, label: 'Cash', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                  { id: 'Card', icon: <CreditCard className="w-4 h-4" />, label: 'Card', color: 'text-blue-500', bg: 'bg-blue-50' },
                                  { id: 'Tabby', icon: <Activity className="w-4 h-4" />, label: 'Tabby', color: 'text-purple-500', bg: 'bg-purple-50' },
                                  { id: 'Tamara', icon: <Activity className="w-4 h-4" />, label: 'Tamara', color: 'text-orange-500', bg: 'bg-orange-50' }
                                ].map((method) => (
                                  <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setPkgPaymentMethod(method.id)}
                                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 transition-all ${
                                      pkgPaymentMethod === method.id
                                        ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/10'
                                        : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                                    }`}
                                  >
                                    <div className={pkgPaymentMethod === method.id ? method.color : 'text-gray-400'}>
                                      {method.icon}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-tighter ${pkgPaymentMethod === method.id ? 'text-emerald-700' : 'text-gray-500'}`}>{method.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPackagePaymentModal(false);
                                  setPkgPendingToCreate(null); // Clear pending create on cancel
                                }}
                                className="flex-1 min-w-[80px] py-3 bg-gray-100 text-gray-600 text-xs font-bold rounded-2xl hover:bg-gray-200 transition-all"
                              >
                                Cancel
                              </button>
                             
                              {/* Skip button for clinic role only */}
                              {typeof window !== "undefined" && getUserRole() === 'clinic' && (
                                <button
                                  type="button"
                                  onClick={() => finalizePmAddPackage(0, "Unpaid", "")}
                                  className="flex-1 min-w-[80px] py-3 bg-amber-100 text-amber-700 text-xs font-bold rounded-2xl hover:bg-amber-200 transition-all border border-amber-200"
                                >
                                  Skip
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  // Respect the user's payment type selection (Full or Partial)
                                  // The pkgPaymentType state holds what user selected
                                  const status = pkgPaymentType === 'Partial' ? 'Partial' : (pkgPaidAmount > 0 ? 'Full' : 'Unpaid');
                                  
                                  finalizePmAddPackage(pkgPaidAmount, status, pkgPaymentMethod);
                                }}
                                className="flex-[2] min-w-[120px] py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white text-xs font-bold rounded-2xl hover:shadow-lg hover:shadow-purple-200 transition-all"
                              >
                                Confirm & Add
                              </button>
                            </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Save Confirmation Modal */}
                    {showSaveConfirmModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                              <AlertCircle className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Confirm Save Changes</h3>
                          </div>
                         
                          <div className="mb-6">
                            <p className="text-sm text-gray-700 mb-2">
                              Are you sure you want to save the following changes?
                            </p>
                            <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                              {editFormData.membership === 'Yes' && editFormData.memberships?.length > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Memberships:</span>
                                  <span className="font-medium text-gray-900">{editFormData.memberships.length} active</span>
                                </div>
                              )}
                              {editFormData.package === 'Yes' && editFormData.packages?.length > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Packages:</span>
                                  <span className="font-medium text-gray-900">{editFormData.packages.length} active</span>
                                </div>
                              )}
                              {editFormData.membership === 'No' && editFormData.package === 'No' && !editFormData.memberships?.length && !editFormData.packages?.length && (
                                <div className="text-gray-600 italic">All memberships and packages will be removed</div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-3 justify-end">
                            <button
                              type="button"
                              onClick={() => setShowSaveConfirmModal(false)}
                              disabled={pmSaving}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handlePmSaveConfirmed}
                              disabled={pmSaving}
                              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {pmSaving ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                              ) : (
                                <><CheckCircle className="w-4 h-4" /> Yes, Save Changes</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handlePmSave}
                        disabled={pmSaving}
                        className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {pmSaving ? (
                          <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                        ) : (
                          <><CheckCircle className="w-3.5 h-3.5" /> Save Changes</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transfer Section */}
                <TransferSection patientId={patientData._id} patientData={patientData} onTransferComplete={() => { fetchPackagesAndMemberships(); }} />

                {/* Packages Section - Always show, empty state when no packages */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-teal-600" />
                      Packages
                    </h3>
                   
                    {loadingPackages ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                      </div>
                    ) : (packages.length === 0 && userPackages.length === 0) ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No packages assigned to this patient</p>
                      </div>
                  ) : (
                    <div className="space-y-3">
                      {[...packages, ...userPackages].map((pkg: any, index: number) => {
                      const packageId = pkg.packageId || pkg._id;
                      const packageName = pkg.packageName || pkg.name || 'Package';
                      const assignedDate = pkg.assignedDate || pkg.createdAt || pkg.startDate;
                      const isUserPackage = pkg.approvalStatus === 'approved';
                      const isExpired = pkg.endDate && new Date(pkg.endDate) < new Date();
                     
                      // Session calculations - use actual data from API
                      const totalSessions = pkg.totalSessions || 0;
                      const usedSessions = typeof pkg.usedSessions === 'number' ? pkg.usedSessions : (totalSessions - (pkg.remainingSessions || 0));
                      const remainingSessions = typeof pkg.remainingSessions === 'number' ? pkg.remainingSessions : Math.max(0, totalSessions - usedSessions);
                      const progressPercent = totalSessions > 0 ? Math.min(100, Math.round((usedSessions / totalSessions) * 100)) : 0;
                     
                      // Price calculation
                      const totalPrice = pkg.totalPrice || pkg.price || 0;
                      const paidAmount = pkg.paidAmount || 0;
                      const advanceUsed = pkg.advanceUsed || 0;
                      const formattedTotalPrice = typeof totalPrice === 'number' ? `${getCurrencySymbol(currency)}${totalPrice.toFixed(2)}` : `${getCurrencySymbol(currency)}${totalPrice || 0}`;

                      return (
                        <div key={pkg._id || packageId || index} className={`bg-white rounded-lg border ${isExpired ? 'border-red-200 shadow-sm' : 'border-gray-200 shadow-md'} overflow-hidden hover:shadow-lg transition-all duration-300 relative`}>
                          {isExpired && (
                            <div className="absolute top-0 right-0 z-10">
                              <div className="bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 shadow-md transform translate-x-1 translate-y-0 rounded-bl-lg border-l border-b border-red-700">
                                Expired
                              </div>
                            </div>
                          )}
                          {/* Header Section */}
                          <div className={`px-3 py-2 border-b border-gray-200 ${isExpired ? 'bg-red-50/50' : `bg-gradient-to-r ${isUserPackage ? 'from-indigo-50 to-purple-50' : 'from-teal-50 to-cyan-50'}`}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2 flex-1">
                                {/* Package Icon */}
                                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${isExpired ? 'from-red-100 to-rose-100' : (isUserPackage ? 'from-indigo-100 to-purple-100' : 'from-teal-100 to-cyan-100')} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                  <Package className={`w-3.5 h-3.5 ${isExpired ? 'text-red-600' : (isUserPackage ? 'text-indigo-600' : 'text-teal-600')}`} />
                                </div>
                               
                                {/* Package Info */}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <h3 className={`text-sm font-bold ${isExpired ? 'text-red-900 line-through' : 'text-gray-900'}`}>{packageName}</h3>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-600 font-medium">({formattedTotalPrice})</span>
                                      {isUserPackage && !isExpired && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[8px] font-bold">
                                          User Package
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                    {/* Payment Status & Method Tags */}
                                    {pkg.paymentStatus === 'Full' && (
                                      <span className="px-2 py-0.5 rounded-lg bg-green-100 text-green-700 font-black uppercase text-[7px] shadow-sm flex items-center gap-1">
                                        <CheckCircle className="w-2 h-2" />
                                        Full Paid
                                      </span>
                                    )}
                                    {pkg.paymentStatus === 'Partial' && (
                                      <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 font-black uppercase text-[7px] shadow-sm flex items-center gap-1">
                                        <Activity className="w-2 h-2" />
                                        Partial
                                      </span>
                                    )}
                                    {pkg.paymentStatus === 'Unpaid' && (
                                      <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-700 font-black uppercase text-[7px] shadow-sm flex items-center gap-1">
                                        <XCircle className="w-2 h-2" />
                                        Unpaid
                                      </span>
                                    )}
                                    {pkg.paymentMethod && (
                                      <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold uppercase text-[7px] border border-indigo-100 flex items-center gap-1 shadow-sm">
                                        <Wallet className="w-2 h-2" />
                                        {pkg.paymentMethod}
                                      </span>
                                    )}
                                    {pkg.advanceUsed > 0 && (
                                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold uppercase text-[7px] border border-emerald-100 flex items-center gap-1 shadow-sm">
                                        <Wallet className="w-2 h-2" />
                                        Advance Used
                                      </span>
                                    )}
                                    {assignedDate && (
                                      <div className={`flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-gray-600'}`}>
                                        <Calendar className="w-2.5 h-2.5" />
                                        <span className="text-[9px]">Purchased: {new Date(assignedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      </div>
                                    )}
                                    {pkg.packageSoldBy && (
                                      <div className="flex items-center gap-1 text-gray-600">
                                        <User className="w-2.5 h-2.5" />
                                        <span className="text-[9px]">Sold by: {pkg.packageSoldBy}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Billing Details Section */}
                          <div className={`px-3 py-2 ${isExpired ? 'opacity-60 bg-red-50/20 grayscale-[0.5]' : ''}`}>
                            <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 mb-2">
                              <h5 className="text-[9px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <CreditCard className="w-2.5 h-2.5 text-gray-600" />
                                Billing Details
                              </h5>
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] text-gray-600 font-medium">Cash/Card Paid:</span>
                                  <span className="text-[10px] font-bold text-green-700">{getCurrencySymbol(currency)}{paidAmount.toFixed(2)}</span>
                                </div>
                                {(pkg.totalPaid || 0) > paidAmount && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-gray-600 font-medium">Advance Used:</span>
                                    <span className="text-[10px] font-bold text-emerald-700">{getCurrencySymbol(currency)}{((pkg.totalPaid || 0) - paidAmount).toFixed(2)}</span>
                                  </div>
                                )}
                                {(pkg.totalPaid || 0) > 0 && (
                                  <div className="flex items-center justify-between bg-green-50 px-1.5 py-0.5 rounded">
                                    <span className="text-[9px] text-green-700 font-medium">Total Paid:</span>
                                    <span className="text-[10px] font-bold text-green-800">{getCurrencySymbol(currency)}{(pkg.totalPaid || 0).toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] text-gray-600 font-medium">Status:</span>
                                  <span className={`text-[9px] font-bold ${pkg.paymentStatus === 'Full' ? 'text-green-700' : pkg.paymentStatus === 'Partial' ? 'text-amber-700' : 'text-gray-600'}`}>
                                    {pkg.paymentStatus === 'Full' ? 'Full' : pkg.paymentStatus === 'Partial' ? 'Partial' : 'Unpaid'}
                                  </span>
                                </div>
                                {advanceUsed > 0 && (
                                  <div className="pt-1.5 border-t border-gray-200 mt-1.5">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[9px] text-gray-600 font-medium">Advance Used:</span>
                                      </div>
                                      <span className="text-[10px] font-bold text-emerald-700">{getCurrencySymbol(currency)}{advanceUsed.toFixed(2)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Sessions Progress Section */}
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-[10px] mb-1">
                                <span className="font-medium text-gray-700">Sessions Progress</span>
                                <span className="font-bold text-gray-900">{usedSessions} / {totalSessions} used</span>
                              </div>
                              {/* Progress Bar */}
                              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r ${isExpired ? 'from-red-400 to-rose-400' : (isUserPackage ? 'from-indigo-500 to-purple-500' : 'from-teal-500 to-cyan-500')} rounded-full transition-all duration-500 ease-out`}
                                  style={{ width: `${progressPercent}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Validity & Dates Display */}
                            {(pkg.validityInMonths || pkg.startDate || pkg.endDate) && (
                              <div className={`mb-2 border rounded-lg p-2 ${isExpired ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-1">
                                    <Clock className={`w-3 h-3 ${isExpired ? 'text-red-600' : 'text-purple-600'}`} />
                                    <span className={`text-[10px] font-bold ${isExpired ? 'text-red-900' : 'text-gray-900'}`}>Package Validity</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold ${isExpired ? 'bg-red-200 text-red-800' : 'bg-purple-100 text-purple-700'}`}>
                                    {pkg.validityInMonths || 0} Months
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-white p-1.5 rounded-lg border border-gray-100 shadow-sm">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase mb-0.5">Start Date</p>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-2.5 h-2.5 text-blue-500" />
                                      <span className={`text-[9px] font-bold ${isExpired ? 'text-red-900' : 'text-gray-800'}`}>
                                        {pkg.startDate ? new Date(pkg.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className={`p-1.5 rounded-lg border shadow-sm ${isExpired ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                                    <p className="text-[8px] text-gray-500 font-bold uppercase mb-0.5">End Date</p>
                                    <div className="flex items-center gap-1">
                                      <Calendar className={`w-2.5 h-2.5 ${isExpired ? 'text-red-600' : 'text-rose-500'}`} />
                                      <span className={`text-[9px] font-bold ${isExpired ? 'text-red-700 underline decoration-double decoration-red-400' : 'text-gray-800'}`}>
                                        {pkg.endDate ? new Date(pkg.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {isExpired && (
                                  <div className="mt-1.5 text-[8px] text-red-600 font-bold flex items-center gap-1 bg-white/50 p-1 rounded border border-red-100">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    THIS PACKAGE HAS EXPIRED
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Three Info Boxes */}
                            <div className="grid grid-cols-3 gap-1.5 mb-2">
                              {/* Total Sessions */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-1.5 text-center">
                                <div className="text-sm font-bold text-blue-700">{totalSessions}</div>
                                <div className="text-[8px] text-blue-600 mt-0.5 font-medium">Total</div>
                              </div>
                             
                              {/* Used Sessions */}
                              <div className="bg-green-50 border border-green-200 rounded-lg p-1.5 text-center">
                                <div className="text-sm font-bold text-green-700">{usedSessions}</div>
                                <div className="text-[8px] text-green-600 mt-0.5 font-medium">Used</div>
                              </div>
                             
                              {/* Remaining Sessions */}
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-1.5 text-center">
                                <div className="text-sm font-bold text-orange-700">{remainingSessions}</div>
                                <div className="text-[8px] text-orange-600 mt-0.5 font-medium">Remaining</div>
                              </div>
                            </div>

                            {/* User Package Specific Details */}
                            {isUserPackage && (
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                                  <div className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Status</div>
                                  <div className="flex flex-wrap gap-1">
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                      pkg.status === 'active' ? 'bg-green-100 text-green-700' :
                                      pkg.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {pkg.status || 'Active'}
                                    </span>
                                  </div>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                                  <div className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Validity</div>
                                  <div className="text-[10px] font-medium text-gray-700">
                                    {pkg.startDate && new Date(pkg.startDate).toLocaleDateString()} - {pkg.endDate && new Date(pkg.endDate).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            )}
                           
                            {/* Treatment Breakdown */}
                            {pkg.treatments && pkg.treatments.length > 0 && (
                              <div className="bg-white rounded-lg border border-gray-200 p-2">
                                <h5 className="text-[10px] font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                                  <Activity className="w-3 h-3 text-teal-600" />
                                  Treatment Sessions
                                </h5>
                                <div className="space-y-1.5">
                                  {pkg.treatments.map((treatment: any, tIdx: number) => {
                                    const used = treatment.usedSessions || 0;
                                    const max = treatment.maxSessions || treatment.sessions || 0;
                                    const percent = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
                                    const remaining = max - used;
                                    const isComplete = used >= max;
                                    const treatmentKey = `${pkg._id || pkg.packageId}-${tIdx}`;
                                    const isExpanded = expandedTreatments[treatmentKey] || false;
                                   
                                    return (
                                      <div key={tIdx} className="bg-gray-50 rounded-lg px-2.5 py-2">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-medium text-gray-700 truncate max-w-[150px]">{treatment.treatmentName || treatment.name}</span>
                                            {treatment.allocatedPrice && (
                                              <span className="text-[9px] text-indigo-700 font-semibold">
                                                {getCurrencySymbol(currency)}{Number(treatment.allocatedPrice).toLocaleString()}/session
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                                              isComplete ? 'bg-green-100 text-green-700' :
                                              used > 0 ? 'bg-blue-100 text-blue-700' :
                                              'bg-gray-100 text-gray-600'
                                            }`}>
                                              {used}/{max}
                                            </span>
                                            {treatment.usageDetails && treatment.usageDetails.length > 0 && (
                                              <button 
                                                type="button" 
                                                onClick={() => setExpandedTreatments(prev => ({
                                                  ...prev,
                                                  [treatmentKey]: !prev[treatmentKey]
                                                }))}
                                                className="p-1 hover:bg-gray-200 rounded"
                                              >
                                                <ChevronDown 
                                                  className={`w-3 h-3 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-0.5">
                                          <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                              isComplete ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                              used > 0 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                                              'bg-gray-400'
                                            }`}
                                            style={{ width: `${percent}%` }}
                                          />
                                        </div>
                                        <div className="flex items-center justify-between text-[8px] text-gray-600">
                                          <span>Remaining: {remaining} sessions</span>
                                          {percent}% complete
                                        </div>
                                       
                                        {/* Billing Records Table - per treatment (Dropdown) */}
                                        {isExpanded && treatment.usageDetails && treatment.usageDetails.length > 0 && (
                                          <div className="mt-2 pt-2 border-t border-gray-200">
                                            <h6 className="text-[9px] font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                                              <ClipboardList className="w-3 h-3 text-cyan-600" />
                                              Billing Records ({treatment.usageDetails.length})
                                            </h6>
                                            <div className="overflow-x-auto">
                                              <table className="w-full text-[9px]">
                                                <thead>
                                                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                                                    <th className="text-left py-1.5 px-1.5 font-semibold text-gray-700 rounded-tl-lg">Invoice</th>
                                                    <th className="text-left py-1.5 px-1.5 font-semibold text-gray-700">Date</th>
                                                    <th className="text-center py-1.5 px-1.5 font-semibold text-gray-700">Sessions</th>
                                                    <th className="text-left py-1.5 px-1.5 font-semibold text-gray-700">Payment Method</th>
                                                    <th className="text-right py-1.5 px-1.5 font-semibold text-gray-700 rounded-tr-lg">Paid</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {treatment.usageDetails.map((detail: any, dIdx: number) => (
                                                    <tr key={dIdx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                                      <td className="py-1.5 px-1.5">
                                                        <span className="font-bold text-gray-900">{detail.invoiceNumber}</span>
                                                      </td>
                                                      <td className="py-1.5 px-1.5">
                                                        <span className="text-gray-600">{new Date(detail.date).toLocaleDateString()}</span>
                                                      </td>
                                                      <td className="py-1.5 px-1.5 text-center">
                                                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-bold text-[8px]">
                                                          {detail.sessions}
                                                        </span>
                                                      </td>
                                                      <td className="py-1.5 px-1.5">
                                                        <span className="text-gray-700">{detail.paymentMethod || '-'}</span>
                                                      </td>
                                                      <td className="py-1.5 px-1.5 text-right">
                                                        {detail.paid !== undefined && detail.paid !== null ? (
                                                          <span className="font-bold text-green-600">{getCurrencySymbol(currency)}{Number(detail.paid).toLocaleString()}</span>
                                                        ) : (
                                                          <span className="text-gray-400">-</span>
                                                        )}
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                           
                            {/* Transfer Information */}
                            {pkg.isTransferred && (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2 mt-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  <h5 className="text-[9px] font-bold text-green-800">Transferred Package</h5>
                                </div>
                                <div className="space-y-1 text-[9px]">
                                  {pkg.transferredPackageName && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-700">Package Name:</span>
                                      <span className="font-semibold text-green-900">{pkg.transferredPackageName}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Transferred From:</span>
                                    <span className="font-semibold text-green-900">{pkg.transferredFromName || 'Unknown Patient'}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

                {/* Memberships Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    Memberships
                  </h3>
                             
                  {memberships.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                      <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">No memberships assigned to this patient</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {memberships.map((membership: any, index: number) => {
                        const membershipId = membership.membershipId || membership._id;
                        const membershipName = membership.membershipName || membership.name || 'Membership';
                        const assignedDate = membership.assignedDate || membership.startDate;
                        const endDate = membership.endDate;
                        const isExpired = endDate && new Date(endDate) < new Date();
                        const plan: any = allAvailableMemberships.find((m: any) => m._id === membershipId);
             
                        return (
                          <div key={membership._id || membershipId || index} className={`bg-white rounded-xl border ${isExpired ? 'border-red-200 shadow-sm' : 'border-gray-200 shadow-sm'} p-5 hover:shadow-md transition-all relative overflow-hidden`}>
                            {isExpired && (
                              <div className="absolute top-0 right-0 z-10">
                                <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 shadow-md transform translate-x-1 translate-y-0 rounded-bl-xl border-l border-b border-red-700 animate-pulse">
                                  Expired
                                </div>
                              </div>
                            )}
                            {/* Card Header */}
                            <div className={`flex items-start mb-4 ${isExpired ? 'opacity-75' : ''}`}>
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isExpired ? 'bg-red-100' : 'bg-gradient-to-br from-purple-100 to-indigo-100'}`}>
                                  <Shield className={`w-5 h-5 ${isExpired ? 'text-red-600' : 'text-purple-600'}`} />
                                </div>
                                <div className="flex-1">
                                  <h3 className={`text-lg font-semibold mb-1 ${isExpired ? 'text-red-900 line-through' : 'text-gray-900'}`}>{membershipName}</h3>
                                  <div className="flex items-center gap-3 text-sm">
                                    {assignedDate && (
                                      <span className={`text-xs ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                                        Start: {new Date(assignedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    )}
                                    {endDate && (
                                      <span className={`text-xs ${isExpired ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                        End: {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    )}
                                  </div>
                                  {(membership as any).usageData?.isTransferred && (membership as any).usageData?.transferredFromName && !isExpired && (
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                      <span className="text-xs text-green-700">Transferred from: <span className="font-bold">{(membership as any).usageData.transferredFromName}</span></span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
             
                            {/* Membership Details */}
                            <div className={`mb-4 space-y-3 ${isExpired ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                              {/* Membership Info Card */}
                              <div className={`border-2 rounded-xl p-4 ${isExpired ? 'bg-red-50 border-red-200' : 'bg-gradient-to-br from-purple-50 via-white to-blue-50 border-purple-300'}`}>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <div className="text-[10px] text-gray-600 mb-0.5">Status</div>
                                    <div className="flex items-center gap-1.5">
                                      <div className={`w-2 h-2 rounded-full ${
                                        isExpired ? 'bg-red-600' : ((membership as any).usageData?.isTransferred ? 'bg-blue-500' : 'bg-green-500')
                                      }`}></div>
                                      <span className={`text-xs font-bold ${isExpired ? 'text-red-700' : 'text-gray-800'}`}>
                                        {isExpired ? 'EXPIRED' : ((membership as any).usageData?.isTransferred ? 'Transferred' : 'Active')}
                                      </span>
                                    </div>
                                  </div>
                                 
                                  <div>
                                    <div className="text-[10px] text-gray-600 mb-0.5">Priority Booking</div>
                                    <div className="flex items-center gap-1">
                                      <Shield className={`w-3.5 h-3.5 ${isExpired ? 'text-red-400' : 'text-purple-600'}`} />
                                      <span className={`text-xs font-bold ${isExpired ? 'text-red-500 line-through' : 'text-green-700'}`}>Active</span>
                                    </div>
                                  </div>

                                  {(membership as any).usageData?.isTransferred && (membership as any).usageData?.transferredFromName && (
                                    <div className="col-span-2">
                                      <div className="text-[10px] text-gray-600 mb-0.5">Transferred From</div>
                                      <div className="flex items-center gap-1.5">
                                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                        <span className="text-xs font-bold text-green-700">{(membership as any).usageData.transferredFromName}</span>
                                      </div>
                                    </div>
                                  )}
                                 
                                  <div>
                                    <div className="text-[10px] text-gray-600 mb-0.5">Start Date</div>
                                    <div className={`text-xs font-semibold ${isExpired ? 'text-red-800' : 'text-gray-800'}`}>{new Date(membership.startDate).toLocaleDateString()}</div>
                                  </div>
                                 
                                  <div>
                                    <div className="text-[10px] text-gray-600 mb-0.5">End Date</div>
                                    <div className={`text-xs font-semibold ${isExpired ? 'text-red-700' : 'text-gray-800'}`}>{new Date(membership.endDate).toLocaleDateString()}</div>
                                  </div>
                                 
                                  <div>
                                    <div className="text-[10px] text-gray-600 mb-0.5">Price</div>
                                    <div className={`text-xs font-bold ${isExpired ? 'text-red-700' : 'text-purple-700'}`}>{getCurrencySymbol(currency)}{plan?.price?.toLocaleString() || 0}</div>
                                  </div>
                                 
                                  <div>
                                    <div className="text-[10px] text-gray-600 mb-0.5">Duration</div>
                                    <div className={`text-xs font-semibold ${isExpired ? 'text-red-800' : 'text-gray-800'}`}>{plan?.durationMonths} months</div>
                                  </div>
                                </div>
                               
                                {isExpired && (
                                  <div className="mt-3 text-[10px] text-red-600 font-bold flex items-center gap-1 bg-white/50 p-2 rounded border border-red-200">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    MEMBERSHIP EXPIRED: BENEFITS & DISCOUNTS ARE NO LONGER APPLICABLE.
                                  </div>
                                )}
                               
                                {(membership as any).usageData?.isTransferred && (
                                  <div className="mt-3 pt-3 border-t-2 border-purple-300 bg-gradient-to-r from-purple-100 to-blue-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      <h5 className="text-xs font-bold text-purple-900">Transferred Membership</h5>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-purple-200">
                                        <span className="text-[10px] text-gray-700 font-medium">Transferred From:</span>
                                        <span className="text-sm font-bold text-purple-700">{(membership as any).usageData.transferredFromName || 'Unknown Patient'}</span>
                                      </div>
                                      {(membership as any).usageData.transferredFreeConsultations !== null && (
                                        <div className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-purple-200">
                                          <span className="text-[10px] text-gray-700 font-medium">Transferred Consultations:</span>
                                          <span className="text-sm font-bold text-green-700">{(membership as any).usageData.transferredFreeConsultations}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-purple-200">
                                        <span className="text-[10px] text-gray-700 font-medium">Total Available Consultations:</span>
                                        <span className="text-sm font-bold text-blue-700">{(membership as any).usageData.totalFreeConsultations || 0}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                             
                              {/* Membership Benefits Section */}
                              {plan?.benefits && (
                                <div className="bg-white rounded-lg border border-gray-200 p-3">
                                  <h5 className="text-xs font-bold text-gray-800 mb-2.5 flex items-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                    Membership Benefits
                                  </h5>
                                  <div className="space-y-2">
                                    {/* Free Consultations with Usage */}
                                    {plan.benefits.freeConsultations > 0 && (
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-1.5">
                                            <User className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-bold text-blue-900">Free Consultations Used</span>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-sm font-black text-blue-700">
                                              {(membership as any).usageData?.usedFreeConsultations || 0}/
                                              {(membership as any).usageData?.totalFreeConsultations || plan.benefits.freeConsultations}
                                            </span>
                                          </div>
                                        </div>
                                        {(membership as any).usageData && (membership as any).usageData.totalFreeConsultations > 0 && (
                                          <>
                                            <div className="w-full h-3 bg-blue-200 rounded-full overflow-hidden mb-2">
                                              <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, (((membership as any).usageData.usedFreeConsultations || 0) / (membership as any).usageData.totalFreeConsultations) * 100)}%` }}
                                              />
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-blue-700">
                                              <span>Remaining: <strong>{(membership as any).usageData.remainingFreeConsultations || 0}</strong></span>
                                              {(membership as any).usageData.isTransferred && (
                                                <span className="text-xs text-blue-600">
                                                  Transferred: <strong>{(membership as any).usageData.transferredFreeConsultations || 0}</strong>
                                                </span>
                                              )}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    )}
                                   
                                    {/* Discount Percentage */}
                                    {plan.benefits.discountPercentage > 0 && (
                                      <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                                        <div className="flex items-center gap-1.5">
                                          <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                                          <span className="text-xs font-bold text-green-900">
                                            {plan.benefits.discountPercentage}% Discount
                                          </span>
                                        </div>
                                        <div className="text-[9px] text-green-700 mt-1 ml-5">
                                          On all treatments & services
                                        </div>
                                      </div>
                                    )}
                                   
                                    {/* Priority Booking */}
                                    {plan.benefits.priorityBooking && (
                                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                                        <div className="flex items-center gap-1.5">
                                          <Activity className="w-3.5 h-3.5 text-amber-600" />
                                          <span className="text-xs font-bold text-amber-900">Priority Booking</span>
                                        </div>
                                        <div className="text-[9px] text-amber-700 mt-1 ml-5">
                                          Get priority appointment scheduling
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                             
                              {/* Transfer Information */}
                              {(membership as any).usageData?.isTransferred && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <h5 className="text-sm font-bold text-green-800">Transferred Membership Details</h5>
                                  </div>
                                  <div className="space-y-2.5">
                                    <div className="flex justify-between items-center bg-white rounded-lg px-3 py-2.5 border border-green-200 shadow-sm">
                                      <div className="flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-green-600" />
                                        <span className="text-xs font-semibold text-gray-700">Transferred From:</span>
                                      </div>
                                      <span className="text-base font-bold text-green-900">{(membership as any).usageData.transferredFromName || 'Unknown Patient'}</span>
                                    </div>
                                    {(membership as any).usageData.transferredFreeConsultations !== null && (
                                      <div className="flex justify-between items-center bg-white rounded-lg px-3 py-2.5 border border-green-200 shadow-sm">
                                        <div className="flex items-center gap-2">
                                          <Activity className="w-3.5 h-3.5 text-green-600" />
                                          <span className="text-xs font-semibold text-gray-700">Transferred Consultations:</span>
                                        </div>
                                        <span className="text-base font-bold text-green-700">{(membership as any).usageData.transferredFreeConsultations}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between items-center bg-white rounded-lg px-3 py-2.5 border border-green-200 shadow-sm">
                                      <div className="flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5 text-green-600" />
                                        <span className="text-xs font-semibold text-gray-700">Total Available Consultations:</span>
                                      </div>
                                      <span className="text-base font-bold text-blue-700">{(membership as any).usageData.totalFreeConsultations || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                             
                              {/* Usage History */}
                              {(membership as any).usageData?.freeConsultationDetails && (membership as any).usageData.freeConsultationDetails.length > 0 && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                  <h5 className="text-xs font-bold text-gray-800 mb-2.5 flex items-center gap-1.5">
                                    <ClipboardList className="w-3.5 h-3.5 text-gray-600" />
                                    Usage History ({(membership as any).usageData.freeConsultationDetails.length})
                                  </h5>
                                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                                    {((membership as any).usageData.freeConsultationDetails || []).map((detail: any, idx: number) => (
                                      <div key={idx} className="text-[9px] bg-white rounded border border-gray-200 p-2">
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
                                            From transfer: {(membership as any).usageData.transferredFromName || 'Unknown'}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
             
                            {/* Footer with Action Button */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                             
                             
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Transferred In Packages Section */}
                {transferredInPackages && transferredInPackages.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-green-600" />
                      Transferred In Packages
                    </h3>
                    <div className="space-y-4">
                      {transferredInPackages.map((pkg: any, idx: number) => (
                        <div key={idx} className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-bold text-green-900">
                                  {pkg.packageName || 'Package'}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-green-200 text-green-800 text-[10px] font-bold">
                                  Transferred In
                                </span>
                               
                                {/* Payment Status & Method Tags for Transferred Packages */}
                                {pkg.paymentStatus === 'Full' && (
                                  <span className="px-2 py-0.5 rounded-lg bg-green-100 text-green-700 font-black uppercase text-[9px] shadow-sm flex items-center gap-1">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                    Full Paid
                                  </span>
                                )}
                                {pkg.paymentStatus === 'Partial' && (
                                  <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 font-black uppercase text-[9px] shadow-sm flex items-center gap-1">
                                    <Activity className="w-2.5 h-2.5" />
                                    Partial ({getCurrencySymbol(currency)}{pkg.paidAmount})
                                  </span>
                                )}
                                {pkg.paymentStatus === 'Unpaid' && (
                                  <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-700 font-black uppercase text-[9px] shadow-sm flex items-center gap-1">
                                    <XCircle className="w-2.5 h-2.5" />
                                    Unpaid
                                  </span>
                                )}
                                {pkg.paymentMethod && (
                                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold uppercase text-[9px] border border-indigo-100 flex items-center gap-1 shadow-sm">
                                    <Wallet className="w-2.5 h-2.5" />
                                    {pkg.paymentMethod}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-green-700 mb-3">
                                This package was transferred from another patient.
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {pkg.transferredFromName && (
                                  <div className="bg-white border border-green-200 rounded-lg px-3 py-2">
                                    <div className="text-[10px] text-gray-500 mb-0.5">Transferred From</div>
                                    <div className="flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-green-600" />
                                      <span className="text-xs font-bold text-green-900">
                                        {pkg.transferredFromName}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {pkg.transferredSessions > 0 && (
                                  <div className="bg-white border border-green-200 rounded-lg px-3 py-2">
                                    <div className="text-[10px] text-gray-500 mb-0.5">Transferred Sessions</div>
                                    <span className="text-xs font-bold text-green-900">
                                      {pkg.transferredSessions}
                                    </span>
                                  </div>
                                )}
                                {pkg.totalAllowedSessions && (
                                  <div className="bg-white border border-green-200 rounded-lg px-3 py-2">
                                    <div className="text-[10px] text-gray-500 mb-0.5">Total Allowed Sessions</div>
                                    <span className="text-xs font-bold text-green-900">
                                      {pkg.totalAllowedSessions}
                                    </span>
                                  </div>
                                )}
                                {typeof pkg.remainingSessions === 'number' && (
                                  <div className="bg-white border border-green-200 rounded-lg px-3 py-2">
                                    <div className="text-[10px] text-gray-500 mb-0.5">Remaining Sessions</div>
                                    <span className="text-xs font-bold text-green-900">
                                      {pkg.remainingSessions}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transferred Out Packages Section */}
                {transferredOutPackages && transferredOutPackages.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-amber-600" />
                      Transferred Out Packages
                    </h3>
                    <div className="space-y-4">
                      {transferredOutPackages.map((pkg: any, idx: number) => (
                        <div key={idx} className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-bold text-amber-900">
                                  {pkg.packageName || 'Package'}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold">
                                  Transferred Out
                                </span>
                                {/* Payment Status & Method Tags for Transferred Out Packages */}
                                {pkg.paymentStatus === 'Full' && (
                                  <span className="px-2 py-0.5 rounded-lg bg-green-100 text-green-700 font-black uppercase text-[9px] shadow-sm flex items-center gap-1">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                    Full Paid
                                  </span>
                                )}
                                {pkg.paymentStatus === 'Partial' && (
                                  <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 font-black uppercase text-[9px] shadow-sm flex items-center gap-1">
                                    <Activity className="w-2.5 h-2.5" />
                                    Partial ({getCurrencySymbol(currency)}{pkg.paidAmount})
                                  </span>
                                )}
                                {pkg.paymentStatus === 'Unpaid' && (
                                  <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-700 font-black uppercase text-[9px] shadow-sm flex items-center gap-1">
                                    <XCircle className="w-2.5 h-2.5" />
                                    Unpaid
                                  </span>
                                )}
                                {pkg.paymentMethod && (
                                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold uppercase text-[9px] border border-indigo-100 flex items-center gap-1 shadow-sm">
                                    <Wallet className="w-2.5 h-2.5" />
                                    {pkg.paymentMethod}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-amber-700 mb-3">
                                This package was transferred to another patient.
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {pkg.transferredToName && (
                                  <div className="bg-white border border-amber-200 rounded-lg px-3 py-2">
                                    <div className="text-[10px] text-gray-500 mb-0.5">Transferred To</div>
                                    <div className="flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-amber-600" />
                                      <span className="text-xs font-bold text-amber-900">
                                        {pkg.transferredToName}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {pkg.transferredSessions > 0 && (
                                  <div className="bg-white border border-amber-200 rounded-lg px-3 py-2">
                                    <div className="text-[10px] text-gray-500 mb-0.5">Sessions Transferred</div>
                                    <span className="text-xs font-bold text-amber-900">
                                      {pkg.transferredSessions}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transferred Out Memberships Section */}
                {transferredOutMemberships && transferredOutMemberships.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-600" />
                      Transferred Out Memberships
                    </h3>
                    <div className="space-y-4">
                      {transferredOutMemberships.map((membership: any, idx: number) => (
                        <div key={idx} className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <Shield className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-bold text-amber-900">
                                  {membership.membershipName || 'Membership'}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold">
                                  Transferred Out
                                </span>
                                {/* Payment Status & Method Tags for Transferred Out Memberships */}
                                {membership.paymentStatus === 'Full' && (
                                  <span className="px-2 py-0.5 rounded-lg bg-green-100 text-green-700 font-black uppercase text-[9px] shadow-sm flex items-center gap-1">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                    Full Paid
                                  </span>
                                )}
                                {membership.paymentStatus === 'Partial' && (
                                  <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 font-black uppercase text-[9px] shadow-sm flex items-center gap-1">
                                    <Activity className="w-2.5 h-2.5" />
                                    Partial ({getCurrencySymbol(currency)}{membership.paidAmount})
                                  </span>
                                )}
                                {membership.paymentStatus === 'Unpaid' && (
                                  <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-700 font-black uppercase text-[9px] shadow-sm flex items-center gap-1">
                                    <XCircle className="w-2.5 h-2.5" />
                                    Unpaid
                                  </span>
                                )}
                                {membership.paymentMethod && (
                                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold uppercase text-[9px] border border-indigo-100 flex items-center gap-1 shadow-sm">
                                    <Wallet className="w-2.5 h-2.5" />
                                    {membership.paymentMethod}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-amber-700 mb-3">
                                This membership was transferred to another patient.
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {membership.transferredToName && (
                                  <div className="bg-white border border-amber-200 rounded-lg px-3 py-2">
                                    <div className="text-[10px] text-gray-500 mb-0.5">Transferred To</div>
                                    <div className="flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-amber-600" />
                                      <span className="text-xs font-bold text-amber-900">
                                        {membership.transferredToName}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {membership.transferredFreeConsultations > 0 && (
                                  <div className="bg-white border border-amber-200 rounded-lg px-3 py-2">
                                    <div className="text-[10px] text-gray-500 mb-0.5">Consultations Transferred</div>
                                    <span className="text-xs font-bold text-amber-900">
                                      {membership.transferredFreeConsultations}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transferred In Memberships Section */}
                {transferredInMemberships && transferredInMemberships.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      Transferred In Memberships
                    </h3>
                    <div className="space-y-4">
                      {transferredInMemberships.map((membership: any, idx: number) => (
                        <div key={idx} className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                              <Shield className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-bold text-green-900">
                                  {membership.membershipName || 'Membership'}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-green-200 text-green-800 text-[10px] font-bold">
                                  Transferred In
                                </span>

                                {/* Payment Status & Method Tags for Transferred Memberships */}
                                {membership.paymentStatus === 'Full' && (
                                  <span className="px-2 py-0.5 rounded-lg bg-green-100 text-green-700 font-black uppercase text-[9px] shadow-sm flex items-center gap-1">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                    Full Paid
                                  </span>
                                )}
                                {membership.paymentStatus === 'Partial' && (
                                  <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 font-black uppercase text-[9px] shadow-sm flex items-center gap-1">
                                    <Activity className="w-2.5 h-2.5" />
                                    Partial ({getCurrencySymbol(currency)}{membership.paidAmount})
                                  </span>
                                )}
                                {membership.paymentStatus === 'Unpaid' && (
                                  <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-700 font-black uppercase text-[9px] shadow-sm flex items-center gap-1">
                                    <XCircle className="w-2.5 h-2.5" />
                                    Unpaid
                                  </span>
                                )}
                                {membership.paymentMethod && (
                                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold uppercase text-[9px] border border-indigo-100 flex items-center gap-1 shadow-sm">
                                    <Wallet className="w-2.5 h-2.5" />
                                    {membership.paymentMethod}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-green-700 mb-3">
                                This membership was transferred from another patient.
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {membership.transferredFromName && (
                                  <div className="bg-white border border-green-200 rounded-lg px-3 py-2">
                                    <div className="text-[10px] text-gray-500 mb-0.5">Transferred From</div>
                                    <div className="flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-green-600" />
                                      <span className="text-xs font-bold text-green-900">
                                        {membership.transferredFromName}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {membership.transferredFreeConsultations !== null && (
                                  <div className="bg-white border border-green-200 rounded-lg px-3 py-2">
                                    <div className="text-[10px] text-gray-500 mb-0.5">Transferred Consultations</div>
                                    <span className="text-xs font-bold text-green-900">
                                      {membership.transferredFreeConsultations}
                                    </span>
                                  </div>
                                )}
                                {membership.totalFreeConsultations && (
                                  <div className="bg-white border border-green-200 rounded-lg px-3 py-2">
                                    <div className="text-[10px] text-gray-500 mb-0.5">Total Available Consultations</div>
                                    <span className="text-xs font-bold text-green-900">
                                      {membership.totalFreeConsultations}
                                    </span>
                                  </div>
                                )}
                                {membership.remainingFreeConsultations !== null && (
                                  <div className="bg-white border border-green-200 rounded-lg px-3 py-2">
                                    <div className="text-[10px] text-gray-500 mb-0.5">Remaining Consultations</div>
                                    <span className="text-xs font-bold text-green-900">
                                      {membership.remainingFreeConsultations}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'billing' ? (
              /* Billing Tab Content - Modern Two-Column Dashboard */
              <div className="space-y-4">
                {/* Billing Overview Stats - Top Row for Mobile */}
                {!loadingBilling && billingHistory && (billingHistory || []).filter((b: any) => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance").length > 0 && (
                  <div className="grid grid-cols-2 lg:hidden gap-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Total Billed</div>
                      <div className="text-lg font-bold text-blue-800">
                        {formatAED((billingHistory || []).filter((b: any) =>
                          (!b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance") ||
                          b.treatment === "Pending Balance Payment"
                        ).reduce((acc: number, b: any) => acc + (Number(b.amount) || 0), 0))}
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <div className="text-[10px] text-red-600 font-bold uppercase tracking-wider mb-1">Outstanding</div>
                      <div className="text-lg font-bold text-red-800">
                        {formatAED(balance.pendingBalance)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {loadingBilling ? (
                    <div className="col-span-1 lg:col-span-3 flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    </div>
                  ) : !billingHistory || (billingHistory || []).filter((b: any) => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance").length === 0 ? (
                    <div className="col-span-1 lg:col-span-3">
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Top gradient banner */}
                        <div className="h-2 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400" />
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                          {/* Icon circle */}
                          <div className="relative mb-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-50 to-cyan-100 border-2 border-teal-200 flex items-center justify-center shadow-inner">
                              <DollarSign className="w-10 h-10 text-teal-400" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center">
                              <FileText className="w-3.5 h-3.5 text-orange-500" />
                            </div>
                          </div>
                          {/* Text */}
                          <h3 className="text-xl font-bold text-gray-800 mb-2">No Billing Records Yet</h3>
                          <p className="text-gray-500 text-sm max-w-xs mb-8">
                            This patient doesn't have any billing history. Invoices will appear here once a session is billed.
                          </p>
                          {/* Info pills */}
                          <div className="flex items-center gap-3 flex-wrap justify-center">
                            <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full text-xs font-semibold text-teal-700">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Invoices
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full text-xs font-semibold text-purple-700">
                              <Package className="w-3.5 h-3.5" />
                              Payments
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full text-xs font-semibold text-orange-700">
                              <Clock className="w-3.5 h-3.5" />
                              Pending
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Invoices Table - Full Width */}
                      <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <FileText className="w-5 h-5 text-teal-600" />
                              Invoices
                            </h3>
                            {/* Search Section */}
                            <div className="flex flex-col sm:flex-row gap-2">
                              {/* Search Type Toggle */}
                              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                <button
                                  onClick={() => setBillingSearchType('all')}
                                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                    billingSearchType === 'all'
                                      ? 'bg-teal-600 text-white'
                                      : 'bg-white text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  All
                                </button>
                                <button
                                  onClick={() => setBillingSearchType('invoice')}
                                  className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 ${
                                    billingSearchType === 'invoice'
                                      ? 'bg-teal-600 text-white'
                                      : 'bg-white text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  Invoice
                                </button>
                                <button
                                  onClick={() => setBillingSearchType('treatment')}
                                  className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 ${
                                    billingSearchType === 'treatment'
                                      ? 'bg-teal-600 text-white'
                                      : 'bg-white text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  Treatment
                                </button>
                              </div>
                              {/* Search Input */}
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder={billingSearchType === 'invoice' ? 'Search by invoice...' : billingSearchType === 'treatment' ? 'Search by treatment...' : 'Search invoice or treatment...'}
                                  value={billingSearchQuery}
                                  onChange={(e) => setBillingSearchQuery(e.target.value)}
                                  className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                                {billingSearchQuery && (
                                  <button
                                    onClick={() => setBillingSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                       
                        <div className="overflow-x-auto">
                          <div className="min-w-full">
                            {/* Desktop Table View */}
                            <table className="min-w-full divide-y divide-gray-100 hidden lg:table">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider">Invoice</th>
                                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider">Date</th>
                                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider">Treatment / Package</th>
                                  <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-600 uppercase tracking-wider">Discount</th>
                                  <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-600 uppercase tracking-wider">Offer Applied</th>
                                  <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-600 uppercase tracking-wider">Free Sessions</th>
                                  <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-600 uppercase tracking-wider">Cashback</th>
                                  <th className="px-3 py-3 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider">Original</th>
                                  <th className="px-3 py-3 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider">Total</th>
                                  <th className="px-3 py-3 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider">Paid</th>
                                  <th className="px-3 py-3 text-right text-[10px] font-bold text-red-600 uppercase tracking-wider">Pending</th>
                                  <th className="px-3 py-3 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider">Advance</th>
                                  <th className="px-3 py-3 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider">Adv. Used</th>
                                  <th className="px-3 py-3 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider">Claim Used</th>
                                  <th className="px-3 py-3 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider">Pend. Used</th>
                                  <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-600 uppercase tracking-wider">Qty</th>
                                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider">Method</th>
                                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider">Refund</th>
                                  <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-600 uppercase tracking-wider">View</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {(billingHistory || [])
                                  .filter((b: any) => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance")
                                  .filter((b: any) => {
                                    if (!billingSearchQuery.trim()) return true;
                                    const query = billingSearchQuery.toLowerCase();
                                    const invoiceMatch = (b.invoiceNumber || '').toLowerCase().includes(query);
                                    const treatmentMatch = (b.treatment || '').toLowerCase().includes(query);
                                    if (billingSearchType === 'invoice') return invoiceMatch;
                                    if (billingSearchType === 'treatment') return treatmentMatch;
                                    return invoiceMatch || treatmentMatch;
                                  })
                                  .map((billing: any, index: number) => {
                                    // Calculate discount
                                    const originalAmt = billing.originalAmount || billing.amount || 0;
                                    const totalDiscount = originalAmt > billing.amount ? (originalAmt - billing.amount) : 0;
                                    const discountPercent = originalAmt > 0 ? (totalDiscount / originalAmt * 100) : 0;
                                    const isDoctorDiscount = billing.isDoctorDiscountApplied;
                                    const isAgentDiscount = billing.isAgentDiscountApplied;
                                    const isMembershipDiscount = (billing.membershipDiscountApplied || 0) > 0;
                                    const hasAnyDiscount = discountPercent > 0 || isDoctorDiscount || isAgentDiscount || isMembershipDiscount;
                                    
                                    // Refund info
                                    const isRefunded = billing.isOfferRefunded || false;
                                    const refundedOffers = billing.refundedOffers || [];
                                    const refundedAt = billing.refundedAt;
                                    // const refundedBy = billing.refundedBy;
                                    // const refundedAmount = billing.refundedAmount || 0;
                                    
                                    // Payment methods
                                    const paymentMethods = billing.multiplePayments && billing.multiplePayments.length > 0
                                      ? billing.multiplePayments.map((mp: any) => mp.paymentMethod).join(" + ")
                                      : (billing.paymentMethod || "–");
                                    
                                    // Offer type
                                    const offerType = billing.offerType || null;
                                    const offerName = billing.offerName || null;
                                    
                                    // Free sessions
                                    const usedFreeSessionCount = billing.usedFreeSessionCount || 0;
                                    const usedFreeSessionNames = billing.usedFreeSessions || [];
                                    const earnedFreeSessions = billing.freeOfferSessionCount || 0;
                                    const earnedFreeSessionNames = billing.offerFreeSession || [];
                                    const freeConsultation = billing.isFreeConsultation || false;
                                    const freeConsultCount = billing.freeConsultationCount || 0;
                                    const isBundleOffer = billing.offerType === 'bundle';
                                    
                                    // Cashback
                                    const cashbackEarnedAmt = billing.cashbackEarned || 0;
                                    const cashbackEarnedFromOffer = billing.cashbackAmount || 0;
                                    const cashbackUsedAmt = billing.cashbackWalletUsed || 0;
                                    const isCashbackApplied = billing.isCashbackApplied || false;
                                    const cashbackOfferName = billing.cashbackOfferName || '';
                                    
                                    // Pending and advance
                                    const pendingAmt = billing.pending || 0;
                                    const advanceAmt = billing.advance || 0;
                                    const advanceUsed = billing.advanceUsed || 0;
                                    const claimUsed = billing.claimAmountUsed || 0;
                                    const pendingUsed = billing.pendingUsed || 0;
                                    
                                    return (
                                      <tr key={billing._id || index} className={`transition-colors ${isRefunded ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500' : `hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}`}>
                                        {/* Invoice */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                          <div className="text-xs font-bold text-gray-900">{billing.invoiceNumber || `INV-${String(index + 1).padStart(4, '0')}`}</div>
                                          <div className="text-[9px] text-gray-400">{billing.service || 'Treatment'}</div>
                                        </td>
                                        {/* Date */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                          <div className="text-xs text-gray-700">
                                            {billing.invoicedDate ? new Date(billing.invoicedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                          </div>
                                        </td>
                                        {/* Treatment / Package */}
                                        <td className="px-3 py-3">
                                          <div className="text-xs text-gray-700 max-w-[150px]" title={billing.package || billing.treatment}>
                                            {billing.package ? (
                                              <div className="flex flex-col">
                                                <span className="font-semibold text-indigo-700 flex items-center gap-1">
                                                  <Package className="w-3 h-3" />
                                                  {billing.package}
                                                </span>
                                                <span className="text-[9px] text-gray-500 truncate">
                                                  {Array.isArray(billing.selectedPackageTreatments) && billing.selectedPackageTreatments.length > 0
                                                    ? billing.selectedPackageTreatments.map((t: any) => t.treatmentName).join(', ')
                                                    : billing.treatment || '-'}
                                                </span>
                                              </div>
                                            ) : (
                                              billing.treatment || '-'
                                            )}
                                            {/* Show unpaid packages that were paid in this billing */}
                                            {billing.unpaidPackagesPaid && billing.unpaidPackagesPaid.length > 0 && (
                                              <div className="mt-1 space-y-0.5">
                                                {billing.unpaidPackagesPaid.map((pkg: any, idx: number) => (
                                                  <div key={idx} className="text-[9px] text-blue-700 flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded">
                                                    <Check className="w-2.5 h-2.5 text-blue-600" strokeWidth={3} />
                                                    <span className="truncate">
                                                      Pkg: {pkg.packageName || 'Package'} ({getCurrencySymbol(currency)}{pkg.amount?.toFixed(2)})
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                        {/* Discount */}
                                        <td className="px-3 py-3 text-center">
                                          <div className="flex flex-col items-center gap-1">
                                            {discountPercent > 0 && (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                {discountPercent.toFixed(1)}% OFF
                                              </span>
                                            )}
                                            <div className="flex flex-wrap justify-center gap-0.5">
                                              {isMembershipDiscount && (
                                                <span className="text-[8px] uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-bold border border-emerald-100">
                                                  Memb
                                                </span>
                                              )}
                                              {isDoctorDiscount && (
                                                <span className="text-[8px] uppercase tracking-wider text-orange-600 bg-orange-50 px-1 py-0.5 rounded font-bold border border-orange-100">
                                                  Doctor
                                                </span>
                                              )}
                                              {isAgentDiscount && (
                                                <span className="text-[8px] uppercase tracking-wider text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-bold border border-blue-100">
                                                  Agent
                                                </span>
                                              )}
                                            </div>
                                            {!hasAnyDiscount && <span className="text-gray-300">—</span>}
                                          </div>
                                        </td>
                                        {/* Offer Applied */}
                                        <td className="px-3 py-3 text-center">
                                          {offerType || cashbackOfferName ? (
                                            <div className="flex flex-col items-center gap-0.5">
                                              {/* Main Offer (Instant/Bonus/Bundle) */}
                                              {offerType && (
                                                <>
                                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                    offerType === 'instant_discount' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                                    offerType === 'cashback' ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' :
                                                    offerType === 'bundle' ? 'bg-pink-100 text-pink-700 border border-pink-200' :
                                                    'bg-gray-100 text-gray-700 border border-gray-200'
                                                  }`}>
                                                    {offerType === 'instant_discount' ? 'Instant' :
                                                     offerType === 'cashback' ? 'Cashback' :
                                                     offerType === 'bundle' ? 'Bundle' : offerType}
                                                  </span>
                                                  {offerName && (
                                                    <span className="text-[8px] text-gray-500 truncate max-w-[60px]" title={offerName}>
                                                      {offerName}
                                                    </span>
                                                  )}
                                                </>
                                              )}
                                              {/* Cashback Offer */}
                                              {cashbackOfferName && isCashbackApplied && (
                                                <>
                                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-100 text-cyan-700 border border-cyan-200 mt-0.5">
                                                    Cashback
                                                  </span>
                                                  <span className="text-[8px] text-cyan-600 truncate max-w-[60px]" title={cashbackOfferName}>
                                                    {cashbackOfferName}
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-gray-300">—</span>
                                          )}
                                        </td>
                                        {/* Free Sessions */}
                                        <td className="px-3 py-3 text-center">
                                          <div className="flex flex-col items-center gap-0.5 text-[9px]">
                                            {/* Used Free Sessions (consumed from bundle) */}
                                            {usedFreeSessionCount > 0 && (
                                              <div className="flex flex-col items-center gap-0.5">
                                                <span className="text-red-600 font-medium">Used: {usedFreeSessionCount}</span>
                                                {usedFreeSessionNames.slice(0, 2).map((session: string, idx: number) => (
                                                  <span key={idx} className="text-[8px] text-red-500 truncate max-w-[80px]" title={session}>{session}</span>
                                                ))}
                                                {usedFreeSessionNames.length > 2 && (
                                                  <span className="text-[8px] text-red-400">+{usedFreeSessionNames.length - 2} more</span>
                                                )}
                                              </div>
                                            )}
                                            {/* Earned Free Sessions (from bundle offer) */}
                                            {earnedFreeSessions > 0 && (
                                              <div className="flex flex-col items-center gap-0.5">
                                                <span className="text-green-600 font-medium">Earned: {earnedFreeSessions}</span>
                                                {earnedFreeSessionNames.slice(0, 2).map((session: string, idx: number) => (
                                                  <span key={idx} className="text-[8px] text-green-500 truncate max-w-[80px]" title={session}>{session}</span>
                                                ))}
                                                {earnedFreeSessionNames.length > 2 && (
                                                  <span className="text-[8px] text-green-400">+{earnedFreeSessionNames.length - 2} more</span>
                                                )}
                                              </div>
                                            )}
                                            {freeConsultation && (
                                              <span className="text-purple-600 font-medium">Free Consult ({freeConsultCount})</span>
                                            )}
                                            {/* Show earned free session names when bundle offer applied */}
                                            {isBundleOffer && earnedFreeSessionNames.length > 0 && !usedFreeSessionCount && (
                                              <div className="flex flex-col items-center gap-0.5 mt-1 p-1 bg-pink-50 rounded border border-pink-200 max-w-[80px]">
                                                <span className="text-[8px] font-bold text-pink-600 uppercase">Bundle Free</span>
                                                {earnedFreeSessionNames.slice(0, 2).map((session: string, idx: number) => (
                                                  <span key={idx} className="text-[8px] text-pink-700 truncate max-w-full" title={session}>{session}</span>
                                                ))}
                                                {earnedFreeSessionNames.length > 2 && (
                                                  <span className="text-[8px] text-pink-500">+{earnedFreeSessionNames.length - 2} more</span>
                                                )}
                                              </div>
                                            )}
                                            {usedFreeSessionCount === 0 && earnedFreeSessions === 0 && !freeConsultation && !isBundleOffer && (
                                              <span className="text-gray-300">—</span>
                                            )}
                                          </div>
                                        </td>
                                        {/* Cashback */}
                                        <td className="px-3 py-3 text-center">
                                          <div className="flex flex-col items-center gap-0.5 text-[9px]">
                                            {/* Cashback Offer Name */}
                                            {cashbackOfferName && isCashbackApplied && (
                                              <span className="text-[8px] font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                                                {cashbackOfferName}
                                              </span>
                                            )}
                                            {/* Cashback Earned */}
                                            {(cashbackEarnedAmt > 0 || cashbackEarnedFromOffer > 0) && (
                                              <div className="flex flex-col items-center">
                                                <span className="text-cyan-600 font-medium">
                                                  +{formatAED(cashbackEarnedAmt > 0 ? cashbackEarnedAmt : cashbackEarnedFromOffer)}
                                                </span>
                                                <span className="text-[8px] text-cyan-400">CB Earned</span>
                                              </div>
                                            )}
                                            {/* Cashback Used */}
                                            {cashbackUsedAmt > 0 && (
                                              <div className="flex flex-col items-center gap-0.5 mt-0.5 p-1 bg-orange-50 rounded border border-orange-200">
                                                <span className="text-[8px] font-bold text-orange-600 uppercase">CB Applied</span>
                                                <span className="text-[9px] text-orange-700 font-semibold">-{formatAED(cashbackUsedAmt)}</span>
                                              </div>
                                            )}
                                            {cashbackEarnedAmt === 0 && cashbackEarnedFromOffer === 0 && cashbackUsedAmt === 0 && !cashbackOfferName && (
                                              <span className="text-gray-300">—</span>
                                            )}
                                          </div>
                                        </td>
                                        {/* Original Amount */}
                                        <td className="px-3 py-3 text-right">
                                          <span className="text-xs text-gray-500">{formatAED(originalAmt)}</span>
                                        </td>
                                        {/* Total */}
                                        <td className="px-3 py-3 text-right">
                                          <span className="text-xs font-bold text-gray-900">{formatAED(billing.amount || 0)}</span>
                                        </td>
                                        {/* Paid */}
                                        <td className="px-3 py-3 text-right">
                                          <span className="text-xs font-semibold text-green-600">{formatAED(billing.paid || 0)}</span>
                                        </td>
                                        {/* Pending */}
                                        <td className="px-3 py-3 text-right">
                                          <span className={`text-xs font-bold ${pendingAmt > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                            {formatAED(pendingAmt)}
                                          </span>
                                        </td>
                                        {/* Advance */}
                                        <td className="px-3 py-3 text-right">
                                          <span className={`text-xs ${advanceAmt > 0 ? 'text-teal-600 font-semibold' : 'text-gray-400'}`}>
                                            {formatAED(advanceAmt)}
                                          </span>
                                        </td>
                                        {/* Advance Used */}
                                        <td className="px-3 py-3 text-right">
                                          <span className={`text-xs ${advanceUsed > 0 ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                                            {formatAED(advanceUsed)}
                                          </span>
                                        </td>
                                        {/* Claim Amount Used */}
                                        <td className="px-3 py-3 text-right">
                                          <span className={`text-xs ${claimUsed > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                                            {formatAED(claimUsed)}
                                          </span>
                                        </td>
                                        {/* Pending Used */}
                                        <td className="px-3 py-3 text-right">
                                          <span className={`text-xs ${pendingUsed > 0 ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                                            {formatAED(pendingUsed)}
                                          </span>
                                        </td>
                                        {/* Qty */}
                                        <td className="px-3 py-3 text-center">
                                          <span className="text-xs text-gray-600">{billing.quantity || 1}</span>
                                        </td>
                                        {/* Payment Method */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                          <span className="text-xs text-gray-700">{paymentMethods}</span>
                                        </td>
                                        {/* Refund Details */}
                                        <td className="px-3 py-3">
                                          {isRefunded ? (
                                            <div className="flex flex-col gap-1">
                                              <div className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 border border-red-200 w-fit">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                                REFUNDED
                                              </div>
                                              {refundedOffers.length > 0 && (
                                                <div className="text-[8px] text-gray-600 space-y-0.5 max-w-[200px]">
                                                  {refundedOffers.map((offer: any, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-1">
                                                      <span className="text-red-500 mt-0.5">•</span>
                                                      <div className="flex flex-col">
                                                        <span className="font-medium">{offer.offerName || offer.offerType}</span>
                                                        <span className="text-[7px] text-gray-500">
                                                          {offer.offerType === 'bundle' && offer.freeSessionsRefunded?.length > 0 && (
                                                            <span>Free: {offer.freeSessionsRefunded.join(', ')}</span>
                                                          )}
                                                          {offer.cashbackRefunded > 0 && (
                                                            <span>CB: {formatAED(offer.cashbackRefunded)}</span>
                                                          )}
                                                          {offer.amount > 0 && offer.offerType !== 'cashback' && (
                                                            <span>Amt: {formatAED(offer.amount)}</span>
                                                          )}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                              {refundedAt && (
                                                <div className="text-[7px] text-gray-400">
                                                  {new Date(refundedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                          )}
                                        </td>
                                        {/* View Button */}
                                        <td className="px-3 py-3 text-center">
                                          <button
                                            onClick={() => {
                                              setSelectedPaymentHistoryBilling(billing);
                                              setShowPaymentHistoryModal(true);
                                            }}
                                            className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-[10px] font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                          >
                                            <Eye className="w-3 h-3 mr-1" />
                                            View
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>

                            {/* Tablet Table View - Fewer columns */}
                            <table className="min-w-full divide-y divide-gray-100 hidden md:table lg:hidden">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-600 uppercase">Invoice</th>
                                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-600 uppercase">Treatment</th>
                                  <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-600 uppercase">Disc.</th>
                                  <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-600 uppercase">Offer</th>
                                  <th className="px-3 py-3 text-right text-[10px] font-bold text-gray-600 uppercase">Original</th>
                                  <th className="px-3 py-3 text-right text-[10px] font-bold text-gray-600 uppercase">Total</th>
                                  <th className="px-3 py-3 text-right text-[10px] font-bold text-gray-600 uppercase">Paid</th>
                                  <th className="px-3 py-3 text-right text-[10px] font-bold text-gray-600 uppercase">Pending</th>
                                  <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-600 uppercase">Qty</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {(billingHistory || [])
                                  .filter((b: any) => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance")
                                  .filter((b: any) => {
                                    if (!billingSearchQuery.trim()) return true;
                                    const query = billingSearchQuery.toLowerCase();
                                    const invoiceMatch = (b.invoiceNumber || '').toLowerCase().includes(query);
                                    const treatmentMatch = (b.treatment || '').toLowerCase().includes(query);
                                    if (billingSearchType === 'invoice') return invoiceMatch;
                                    if (billingSearchType === 'treatment') return treatmentMatch;
                                    return invoiceMatch || treatmentMatch;
                                  })
                                  .map((billing: any, index: number) => {
                                    const originalAmt = billing.originalAmount || billing.amount || 0;
                                    const discountPct = originalAmt > 0 && billing.amount < originalAmt ? ((originalAmt - billing.amount) / originalAmt * 100) : 0;
                                    const offerType = billing.offerType || null;
                                    const earnedFreeSessionNames = billing.offerFreeSession || [];
                                    const usedFreeSessionNames = billing.usedFreeSessions || [];
                                    const usedFreeSessionCount = billing.usedFreeSessionCount || 0;
                                    // const earnedFreeSessions = billing.freeOfferSessionCount || 0;
                                    const isBundleOffer = billing.offerType === 'bundle';
                                    // const cashbackEarnedAmt = billing.cashbackEarned || 0;
                                    // const cashbackEarnedFromOffer = billing.cashbackAmount || 0;
                                    // const cashbackUsedAmt = billing.cashbackWalletUsed || 0;
                                    const isCashbackApplied = billing.isCashbackApplied || false;
                                    const cashbackOfferName = billing.cashbackOfferName || '';
                                    return (
                                      <tr key={billing._id || index} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                          <div className="text-xs font-bold text-gray-900">{billing.invoiceNumber || `INV-${String(index + 1).padStart(4, '0')}`}</div>
                                          <div className="text-[9px] text-gray-400">{billing.invoicedDate ? new Date(billing.invoicedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</div>
                                        </td>
                                        <td className="px-3 py-3">
                                          <div className="text-xs text-gray-700 max-w-[120px]" title={billing.treatment || billing.package}>
                                            {billing.package ? (
                                              <span className="font-semibold text-indigo-700">{billing.package}</span>
                                            ) : (billing.treatment || '-')}
                                          </div>
                                          {/* Show unpaid packages that were paid in this billing */}
                                          {billing.unpaidPackagesPaid && billing.unpaidPackagesPaid.length > 0 && (
                                            <div className="mt-1 space-y-0.5">
                                              {billing.unpaidPackagesPaid.map((pkg: any, idx: number) => (
                                                <div key={idx} className="text-[9px] text-blue-700 flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded">
                                                  <Check className="w-2.5 h-2.5 text-blue-600" strokeWidth={3} />
                                                  <span className="truncate">
                                                    Pkg: {pkg.packageName || 'Package'} ({getCurrencySymbol(currency)}{pkg.amount?.toFixed(2)})
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {isBundleOffer && earnedFreeSessionNames.length > 0 && (
                                            <div className="text-[8px] text-pink-600 truncate mt-0.5" title={earnedFreeSessionNames.join(', ')}>
                                              Free: {earnedFreeSessionNames.slice(0, 1).join(', ')}{earnedFreeSessionNames.length > 1 ? '...' : ''}
                                            </div>
                                          )}
                                          {usedFreeSessionCount > 0 && (
                                            <div className="text-[8px] text-red-600 truncate mt-0.5" title={usedFreeSessionNames.join(', ')}>
                                              Used: {usedFreeSessionNames.slice(0, 1).join(', ')}{usedFreeSessionNames.length > 1 ? '...' : ''}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                          {discountPct > 0 ? (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">{discountPct.toFixed(1)}%</span>
                                          ) : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                          {offerType || cashbackOfferName ? (
                                            <div className="flex flex-col items-center gap-0.5">
                                              {offerType && (
                                                <>
                                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                    offerType === 'instant_discount' ? 'bg-purple-100 text-purple-700' :
                                                    offerType === 'cashback' ? 'bg-cyan-100 text-cyan-700' :
                                                    offerType === 'bundle' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700'
                                                  }`}>
                                                    {offerType === 'instant_discount' ? 'Inst' : offerType === 'cashback' ? 'CB' : offerType === 'bundle' ? 'Bndl' : '—'}
                                                  </span>
                                                </>
                                              )}
                                              {cashbackOfferName && isCashbackApplied && (
                                                <>
                                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-100 text-cyan-700 mt-0.5">
                                                    Cashback
                                                  </span>
                                                  <span className="text-[8px] text-cyan-600 truncate max-w-[80px]" title={cashbackOfferName}>
                                                    {cashbackOfferName}
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                          ) : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-3 py-3 text-right"><span className="text-xs text-gray-500">{formatAED(originalAmt)}</span></td>
                                        <td className="px-3 py-3 text-right"><span className="text-xs font-bold text-gray-900">{formatAED(billing.amount || 0)}</span></td>
                                        <td className="px-3 py-3 text-right"><span className="text-xs font-semibold text-green-600">{formatAED(billing.paid || 0)}</span></td>
                                        <td className="px-3 py-3 text-right">
                                          <span className={`text-xs font-bold ${(billing.pending || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatAED(billing.pending || 0)}</span>
                                        </td>
                                        <td className="px-3 py-3 text-center"><span className="text-xs text-gray-600">{billing.quantity || 1}</span></td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>

                            {/* Mobile List View */}
                            <div className="md:hidden divide-y divide-gray-100">
                              {(billingHistory || [])
                                .filter((b: any) => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance")
                                .filter((b: any) => {
                                  if (!billingSearchQuery.trim()) return true;
                                  const query = billingSearchQuery.toLowerCase();
                                  const invoiceMatch = (b.invoiceNumber || '').toLowerCase().includes(query);
                                  const treatmentMatch = (b.treatment || '').toLowerCase().includes(query);
                                  if (billingSearchType === 'invoice') return invoiceMatch;
                                  if (billingSearchType === 'treatment') return treatmentMatch;
                                  return invoiceMatch || treatmentMatch;
                                })
                                .map((billing: any, index: number) => {
                                  const originalAmt = billing.originalAmount || billing.amount || 0;
                                  const discountPct = originalAmt > 0 && billing.amount < originalAmt ? ((originalAmt - billing.amount) / originalAmt * 100) : 0;
                                  const paymentMethods = billing.multiplePayments && billing.multiplePayments.length > 0
                                    ? billing.multiplePayments.map((mp: any) => mp.paymentMethod).join(" + ")
                                    : (billing.paymentMethod || "–");
                                  const offerType = billing.offerType || null;
                                  const cashbackEarnedAmt = billing.cashbackEarned || 0;
                                  const cashbackEarnedFromOffer = billing.cashbackAmount || 0;
                                  const cashbackUsedAmt = billing.cashbackWalletUsed || 0;
                                  const isCashbackApplied = billing.isCashbackApplied || false;
                                  const cashbackOfferName = billing.cashbackOfferName || '';
                                  const earnedFreeSessionNames = billing.offerFreeSession || [];
                                  const usedFreeSessionNames = billing.usedFreeSessions || [];
                                  const usedFreeSessionCount = billing.usedFreeSessionCount || 0;
                                  // const earnedFreeSessions = billing.freeOfferSessionCount || 0;
                                  const isBundleOffer = billing.offerType === 'bundle';
                                  // const freeOfferSessionCount = billing.freeOfferSessionCount || 0;
                                  const freeConsultation = billing.isFreeConsultation || false;
                                  const freeConsultCount = billing.freeConsultationCount || 0;
                                  
                                  return (
                                    <div key={billing._id || index} className={`p-4 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                      <div className="flex justify-between items-start mb-3">
                                        <div>
                                          <div className="text-sm font-bold text-gray-900">{billing.invoiceNumber || `INV-${String(index + 1).padStart(4, '0')}`}</div>
                                          <div className="text-[10px] text-gray-500">{billing.invoicedDate ? new Date(billing.invoicedDate).toLocaleDateString() : ''}</div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-lg font-bold text-gray-900">{formatAED(billing.amount || 0)}</div>
                                          <div className="text-[10px] text-gray-400">Qty: {billing.quantity || 1}</div>
                                        </div>
                                      </div>
                                      
                                      {/* Treatment / Package */}
                                      <div className="mb-3">
                                        <div className="text-xs text-gray-700">
                                          {billing.package ? (
                                            <span className="font-semibold text-indigo-700 flex items-center gap-1">
                                              <Package className="w-3 h-3" />{billing.package}
                                            </span>
                                          ) : (billing.treatment || '-')}
                                        </div>
                                        {billing.treatment && billing.package && (
                                          <div className="text-[10px] text-gray-500 truncate">{billing.treatment}</div>
                                        )}
                                        {/* Show unpaid packages that were paid in this billing */}
                                        {billing.unpaidPackagesPaid && billing.unpaidPackagesPaid.length > 0 && (
                                          <div className="mt-1 space-y-0.5">
                                            {billing.unpaidPackagesPaid.map((pkg: any, idx: number) => (
                                              <div key={idx} className="text-[9px] text-blue-700 flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded">
                                                <Check className="w-2.5 h-2.5 text-blue-600" strokeWidth={3} />
                                                <span className="truncate">
                                                  Pkg: {pkg.packageName || 'Package'} ({getCurrencySymbol(currency)}{pkg.amount?.toFixed(2)})
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Tags Row */}
                                      <div className="flex flex-wrap gap-1 mb-3">
                                        {discountPct > 0 && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">{discountPct.toFixed(1)}% OFF</span>
                                        )}
                                        {billing.isMembershipDiscountApplied && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">Membership</span>
                                        )}
                                        {billing.isDoctorDiscountApplied && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-700">Doctor</span>
                                        )}
                                        {offerType && (
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold ${
                                            offerType === 'instant_discount' ? 'bg-purple-100 text-purple-700' :
                                            offerType === 'cashback' ? 'bg-cyan-100 text-cyan-700' :
                                            offerType === 'bundle' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700'
                                          }`}>
                                            {offerType === 'instant_discount' ? 'Instant' : offerType === 'cashback' ? 'Cashback' : offerType === 'bundle' ? 'Bundle' : offerType}
                                          </span>
                                        )}
                                        {/* Cashback Offer Name */}
                                        {cashbackOfferName && isCashbackApplied && (
                                          <div className="inline-flex flex-col items-start px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                                            <span className="text-[8px] font-bold">Cashback</span>
                                            <span className="font-normal text-[8px]">{cashbackOfferName}</span>
                                          </div>
                                        )}
                                        {/* Earned Free Sessions from Bundle */}
                                        {isBundleOffer && earnedFreeSessionNames.length > 0 && (
                                          <div className="inline-flex flex-col items-start px-2 py-0.5 rounded text-[9px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                                            <span>Bundle Free</span>
                                            <span className="font-normal text-[8px]">{earnedFreeSessionNames.slice(0, 2).join(', ')}{earnedFreeSessionNames.length > 2 ? '...' : ''}</span>
                                          </div>
                                        )}
                                        {/* Used Free Sessions */}
                                        {usedFreeSessionCount > 0 && (
                                          <div className="inline-flex flex-col items-start px-2 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-700 border border-red-200">
                                            <span>Used Free ({usedFreeSessionCount})</span>
                                            <span className="font-normal text-[8px]">{usedFreeSessionNames.slice(0, 2).join(', ')}{usedFreeSessionNames.length > 2 ? '...' : ''}</span>
                                          </div>
                                        )}
                                        {/* Cashback Earned */}
                                        {(cashbackEarnedAmt > 0 || cashbackEarnedFromOffer > 0) && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-100 text-cyan-700">
                                            CB Earned: +{formatAED(cashbackEarnedAmt > 0 ? cashbackEarnedAmt : cashbackEarnedFromOffer)}
                                          </span>
                                        )}
                                        {/* Cashback Used (Applied) */}
                                        {cashbackUsedAmt > 0 && (
                                          <div className="inline-flex flex-col items-start px-2 py-0.5 rounded text-[9px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                            <span className="text-[8px] font-bold">CB Applied</span>
                                            <span className="font-normal text-[8px]">-{formatAED(cashbackUsedAmt)}</span>
                                          </div>
                                        )}
                                        {freeConsultation && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700">Free Consult ({freeConsultCount})</span>
                                        )}
                                      </div>
                                      
                                      {/* Financial Details */}
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] mb-3 p-2 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Original:</span>
                                          <span className="text-gray-700">{formatAED(originalAmt)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Paid:</span>
                                          <span className="text-green-600 font-semibold">{formatAED(billing.paid || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Pending:</span>
                                          <span className={`font-semibold ${(billing.pending || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatAED(billing.pending || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Advance:</span>
                                          <span className="text-teal-600">{formatAED(billing.advance || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Adv. Used:</span>
                                          <span className="text-indigo-600">{formatAED(billing.advanceUsed || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Claim Used:</span>
                                          <span className="text-blue-600">{formatAED(billing.claimAmountUsed || 0)}</span>
                                        </div>
                                        {(cashbackEarnedAmt > 0 || cashbackEarnedFromOffer > 0 || cashbackUsedAmt > 0) && (
                                          <>
                                            {(cashbackEarnedAmt > 0 || cashbackEarnedFromOffer > 0) && (
                                              <div className="flex justify-between">
                                                <span className="text-gray-500">CB Earned:</span>
                                                <span className="text-cyan-600">{formatAED(cashbackEarnedAmt > 0 ? cashbackEarnedAmt : cashbackEarnedFromOffer)}</span>
                                              </div>
                                            )}
                                            {cashbackUsedAmt > 0 && (
                                              <div className="flex justify-between">
                                                <span className="text-gray-500">CB Used:</span>
                                                <span className="text-orange-600">{formatAED(cashbackUsedAmt)}</span>
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                      
                                      {/* Payment Method */}
                                      <div className="text-[10px] text-gray-500">
                                        <span className="font-medium">Payment:</span> {paymentMethods}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </div>

                        {/* Summary Section - Total Billed, Total Paid, Outstanding */}
                        {(billingHistory || []).filter((b: any) => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance").length > 0 && (
                          <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* Total Billed */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                <div className="text-[10px] sm:text-xs text-blue-600 mb-1">Total Billed</div>
                                <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">
                                  {formatAED((billingHistory || []).filter((b: any) =>
                                    (!b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance") ||
                                    b.treatment === "Pending Balance Payment"
                                  ).reduce((acc: number, b: any) => acc + (Number(b.amount) || 0), 0))}
                                </div>
                              </div>
                              {/* Total Paid */}
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                <div className="text-[10px] sm:text-xs text-green-600 mb-1">Total Paid</div>
                                <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-800">
                                  {formatAED((billingHistory || []).filter((b: any) =>
                                    (!b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance") ||
                                    b.treatment === "Pending Balance Payment"
                                  ).reduce((acc: number, b: any) => acc + (Number(b.paid) || 0), 0))}
                                </div>
                              </div>
                              {/* Outstanding */}
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                                <div className="text-[10px] sm:text-xs text-red-600 mb-1">Outstanding</div>
                                <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-800">
                                  {formatAED(balance.pendingBalance)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : activeTab === 'insurance' ? (
              /* Insurance Tab Content */
              <div className="space-y-4">

                {/* Insurance Details Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-teal-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Insurance & Claims</h3>
                    {(patientData?.insurance === 'Yes' || insuranceClaims.length > 0) ? (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
                        {isRiskyPatient ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 animate-pulse">Risky</span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Loyal</span>
                        )}
                      </div>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Not Enrolled</span>
                    )}
                    <button
                      onClick={() => {
                        const opening = !showNewClaimForm;
                        setShowNewClaimForm(opening);
                        if (opening) {
                          fetchNewClaimDropdowns();
                          // Reset form to empty values - no prefilling
                          setNewClaimData({
                            insuranceProvider: "",
                            policyNumber: "",
                            expiryDate: "",
                            insuranceCardFile: "",
                            tableOfBenefitsFile: "",
                            departmentId: "",
                            departmentName: "",
                            serviceId: "",
                            serviceName: "",
                            services: [],
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
                        }
                      }}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New Claim
                    </button>
                  </div>

                  {/* New Claim Form */}
                  {showNewClaimForm && (
                    <div className="border-b border-gray-200 bg-gray-50 p-4">
                      <div className="text-sm font-semibold text-gray-900 mb-3">Create New Insurance Claim</div>

                      {/* Section A: Insurance Details */}
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-xs font-semibold text-blue-800 mb-2">Insurance Details (Required)</div>
                        <div className="flex flex-wrap gap-2 items-end">
                          <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs mb-0.5 font-medium text-gray-700">Insurance Provider <span className="text-red-500">*</span></label>
                            <input type="text" name="insuranceProvider" value={newClaimData.insuranceProvider} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-gray-900" placeholder="Provider name" />
                          </div>
                          <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs mb-0.5 font-medium text-gray-700">Policy Number <span className="text-red-500">*</span></label>
                            <input type="text" name="policyNumber" value={newClaimData.policyNumber} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-gray-900" placeholder="Policy number" />
                          </div>
                          <div className="flex-1 min-w-[130px]">
                            <label className="block text-xs mb-0.5 font-medium text-gray-700">Expiry Date <span className="text-red-500">*</span></label>
                            <input type="date" name="expiryDate" value={newClaimData.expiryDate} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-gray-900" />
                          </div>
                          <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs mb-0.5 font-medium text-gray-700">Insurance Card </label>
                            <div className="relative group">
                              <input
                                id="insurance-card-upload"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => handleNewClaimFileUpload(e, 'insuranceCard')}
                                className="hidden"
                                disabled={newClaimUploadingFiles}
                              />
                              <label
                                htmlFor="insurance-card-upload"
                                className={`w-full flex items-center gap-2 px-2 py-1.5 text-[9px] border border-gray-300 rounded-md cursor-pointer transition-all ${newClaimData.insuranceCardFile ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400 shadow-sm' : 'bg-white hover:border-blue-400'}`}
                              >
                                <div className="flex-shrink-0 w-4 h-4 rounded bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                                  {newClaimData.insuranceCardFile ? (
                                    newClaimData.insuranceCardFile.toLowerCase().endsWith('.pdf') ? (
                                      <FileText className="w-2.5 h-2.5 text-blue-600" />
                                    ) : (
                                      <img src={newClaimData.insuranceCardFile} alt="" className="w-full h-full object-cover" />
                                    )
                                  ) : (
                                    <FileImage className="w-2.5 h-2.5 text-gray-400" />
                                  )}
                                </div>
                                <span className={`truncate flex-1 ${newClaimData.insuranceCardFile ? 'text-blue-700 font-semibold' : 'text-gray-400'}`} onClick={() => newClaimData.insuranceCardFile && setDocViewerUrl(newClaimData.insuranceCardFile)}>
                                  {newClaimData.insuranceCardFile ? (newClaimData.insuranceCardFile.split('/').pop()?.split('-').pop() || 'File selected') : 'No file chosen'}
                                </span>
                                {newClaimData.insuranceCardFile && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setNewClaimData((prev: any) => ({ ...prev, insuranceCardFile: "" }));
                                    }}
                                    className="p-0.5 hover:bg-blue-100 rounded-full text-blue-600 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                                {newClaimUploadingFiles && <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-600" />}
                              </label>
                            </div>
                          </div>
                          <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs mb-0.5 font-medium text-gray-700">Table of Benefits</label>
                            <div className="relative group">
                              <input
                                id="table-of-benefits-upload"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => handleNewClaimFileUpload(e, 'tableOfBenefits')}
                                className="hidden"
                                disabled={newClaimUploadingFiles}
                              />
                              <label
                                htmlFor="table-of-benefits-upload"
                                className={`w-full flex items-center gap-2 px-2 py-1.5 text-[9px] border border-gray-300 rounded-md cursor-pointer transition-all ${newClaimData.tableOfBenefitsFile ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400 shadow-sm' : 'bg-white hover:border-blue-400'}`}
                              >
                                <div className="flex-shrink-0 w-4 h-4 rounded bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                                  {newClaimData.tableOfBenefitsFile ? (
                                    newClaimData.tableOfBenefitsFile.toLowerCase().endsWith('.pdf') ? (
                                      <FileText className="w-2.5 h-2.5 text-blue-600" />
                                    ) : (
                                      <img src={newClaimData.tableOfBenefitsFile} alt="" className="w-full h-full object-cover" />
                                    )
                                  ) : (
                                    <FileImage className="w-2.5 h-2.5 text-gray-400" />
                                  )}
                                </div>
                                <span className={`truncate flex-1 ${newClaimData.tableOfBenefitsFile ? 'text-blue-700 font-semibold' : 'text-gray-400'}`} onClick={() => newClaimData.tableOfBenefitsFile && setDocViewerUrl(newClaimData.tableOfBenefitsFile)}>
                                  {newClaimData.tableOfBenefitsFile ? (newClaimData.tableOfBenefitsFile.split('/').pop()?.split('-').pop() || 'File selected') : 'No file chosen'}
                                </span>
                                {newClaimData.tableOfBenefitsFile && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setNewClaimData((prev: any) => ({ ...prev, tableOfBenefitsFile: "" }));
                                    }}
                                    className="p-0.5 hover:bg-blue-100 rounded-full text-blue-600 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                                {newClaimUploadingFiles && <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-600" />}
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section B: Claim Source */}
                      <div className="mb-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-xs font-semibold text-green-800 mb-2">Claim Source</div>
                        <div className="flex flex-wrap gap-3 items-stretch">
                          <div className="flex-1 min-w-[140px] flex flex-col">
                            <label className="block text-xs mb-1 font-semibold text-gray-700">Department</label>
                            <div className="mt-auto">
                              <select name="departmentId" value={newClaimData.departmentId} onChange={handleNewClaimDepartmentChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 text-gray-900 bg-white shadow-sm h-full min-h-[32px]">
                                <option value="">Select Department</option>
                                {newClaimDepartments.map((d: any) => (
                                  <option key={d._id} value={d._id}>{d.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                         
                          <div className="flex-1 min-w-[200px] flex flex-col">
                            <label className="block text-xs mb-1 font-semibold text-gray-700">Services</label>
                            <div className="mt-auto relative w-full flex items-center p-0.5 border border-gray-300 rounded-lg bg-white shadow-sm focus-within:ring-2 focus-within:ring-green-500 transition-all min-h-[32px] box-border">
                              <div className="flex flex-wrap items-center gap-1 flex-1 px-1 py-0.5">
                                {newClaimData.services.map((svc: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 text-[9px] font-bold whitespace-nowrap"
                                  >
                                    {svc.serviceName}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const updatedServices = newClaimData.services.filter((_: any, i: number) => i !== idx);
                                        setNewClaimData((prev: any) => ({
                                          ...prev,
                                          services: updatedServices,
                                          serviceId: updatedServices.length > 0 ? updatedServices[updatedServices.length - 1].serviceId : "",
                                          serviceName: updatedServices.length > 0 ? updatedServices[updatedServices.length - 1].serviceName : "",
                                        }));
                                      }}
                                      className="hover:text-red-500 transition-colors"
                                    >
                                      <X className="w-2 h-2" />
                                    </button>
                                  </span>
                                ))}
                                <select
                                  value=""
                                  onChange={handleNewClaimServiceChange}
                                  className="min-w-[100px] bg-transparent border-none outline-none text-[10px] text-gray-900 cursor-pointer h-full py-0.5 flex-1 appearance-none"
                                >
                                  <option value="" disabled>{newClaimData.services.length > 0 ? "Add More Services..." : "Select Services"}</option>
                                  {newClaimServices
                                    .filter((s: any) => !newClaimData.departmentId || String(s.departmentId) === String(newClaimData.departmentId))
                                    .map((s: any) => (
                                      <option key={s._id} value={s._id}>
                                        {s.name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 min-w-[140px] flex flex-col">
                            <label className="block text-xs mb-1 font-semibold text-gray-700">Doctor <span className="text-red-500">*</span></label>
                            <div className="mt-auto">
                              <select name="doctorId" value={newClaimData.doctorId} onChange={handleNewClaimDoctorChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 text-gray-900 bg-white shadow-sm h-full min-h-[32px]">
                                <option value="">Select Doctor</option>
                                {newClaimDoctors.map((d: any) => (
                                  <option key={d._id} value={d._id}>{d.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                         
                          <div className="flex-1 min-w-[120px] flex flex-col">
                            <label className="block text-xs mb-1 font-semibold text-gray-700">Amount <span className="text-red-500">*</span></label>
                            <div className="mt-auto">
                              <input type="number" name="claimAmount" value={newClaimData.claimAmount} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 text-gray-900 bg-white shadow-sm h-full min-h-[32px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0" min="0" step="0.01" />
                            </div>
                          </div>
                         
                          <div className="flex-1 min-w-[120px] flex flex-col">
                            <label className="block text-xs mb-1 font-semibold text-gray-700">Type <span className="text-red-500">*</span></label>
                            <div className="mt-auto">
                              <select name="claimType" value={newClaimData.claimType} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 text-gray-900 bg-white shadow-sm h-full min-h-[32px]">
                                <option value="Paid">Paid</option>
                                <option value="Advance">Advance</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section C: Claim Details */}
                      <div className="mb-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-xs font-semibold text-purple-800 mb-2">Claim Details</div>
                        <div className="flex flex-wrap gap-3 items-stretch">
                          <div className="flex-1 min-w-[100px] flex flex-col">
                            <label className="block text-xs mb-1 font-semibold text-gray-700">Co-Pay %</label>
                            <div className="mt-auto">
                              <input type="number" name="coPayPercent" value={newClaimData.coPayPercent} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900 bg-white shadow-sm min-h-[32px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0-100" min="0" max="100" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-[140px] flex flex-col">
                            <label className="block text-xs mb-1 font-semibold text-gray-700">Co-Pay Type</label>
                            <div className="mt-auto">
                              <select name="coPayType" value={newClaimData.coPayType} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900 bg-white shadow-sm min-h-[32px]">
                                <option value="Patient Pays">Patient Pays</option>
                                <option value="Deduct from Claim">Deduct from Claim</option>
                                <option value="Clinic Adjusts">Clinic Adjusts</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex-1 min-w-[160px] flex flex-col">
                            <label className="block text-xs mb-1 font-semibold text-gray-700">Notes</label>
                            <div className="mt-auto">
                              <input type="text" name="notes" value={newClaimData.notes} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900 bg-white shadow-sm min-h-[32px]" placeholder="Notes..." />
                            </div>
                          </div>
                          <div className="flex-1 min-w-[160px] flex flex-col">
                            <label className="block text-xs mb-1 font-semibold text-gray-700">Documents</label>
                            <div className="mt-auto">
                              <div className="relative group">
                                <input
                                  id="claim-documents-upload"
                                  type="file"
                                  multiple
                                  accept="image/*,.pdf"
                                  onChange={handleNewClaimDocumentsUpload}
                                  className="hidden"
                                  disabled={newClaimUploadingFiles}
                                />
                                <label
                                  htmlFor="claim-documents-upload"
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-[10px] border border-gray-300 rounded-md cursor-pointer transition-all bg-white shadow-sm hover:border-purple-400 min-h-[32px]`}
                                >
                                  <Paperclip className="w-3 h-3 text-gray-400" />
                                  <span className="truncate flex-1 text-gray-500">
                                     {newClaimData.documentFiles.length > 0 ? `${newClaimData.documentFiles.length} files` : 'Upload...'}
                                   </span>
                                   {newClaimUploadingFiles && <Loader2 className="w-3 h-3 animate-spin text-purple-600" />}
                                 </label>
                               </div>
                             </div>
                             {newClaimData.documentFiles.length > 0 && (
                               <div className="mt-1 flex flex-wrap gap-1">
                                 {newClaimData.documentFiles.map((f: string, i: number) => (
                                   <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 border border-purple-100 rounded text-[8px] font-bold text-purple-700 shadow-sm">
                                     <button type="button" onClick={() => setDocViewerUrl(f)} className="hover:underline">Doc {i + 1}</button>
                                     <button
                                       type="button"
                                       onClick={() => setNewClaimData((prev: any) => ({ ...prev, documentFiles: prev.documentFiles.filter((_: any, idx: number) => idx !== i) }))}
                                       className="ml-1 hover:text-red-500"
                                     >
                                       <X className="w-2 h-2" />
                                     </button>
                                   </div>
                                 ))}
                               </div>
                             )}
                           </div>
                         </div>

                        {/* Advance-specific fields */}
                        {newClaimData.claimType === 'Advance' && (
                          <div className="flex flex-wrap gap-3 items-stretch mt-2 pt-2 border-t border-purple-200">
                            <div className="flex-1 min-w-[140px] flex flex-col">
                              <label className="block text-xs mb-1 font-semibold text-gray-700">Advance Status</label>
                              <div className="mt-auto">
                                <select name="advanceStatus" value={newClaimData.advanceStatus} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900 bg-white shadow-sm min-h-[32px]">
                                  <option value="Full Pay">Full Pay</option>
                                  <option value="Partial Pay">Partial Pay</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex-1 min-w-[140px] flex flex-col">
                              <label className="block text-xs mb-1 font-semibold text-gray-700">Advance Amount</label>
                              <div className="mt-auto">
                                <input
                                  type="number"
                                  name="advanceAmount"
                                  value={newClaimData.advanceAmount}
                                  onChange={handleNewClaimChange}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900 font-semibold bg-white shadow-sm min-h-[32px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                            </div>
                            <div className="flex-1 min-w-[120px] flex flex-col">
                              <label className="block text-xs mb-1 font-semibold text-gray-700">Status</label>
                              <div className="mt-auto">
                                <div className="px-2 py-1 text-xs bg-yellow-50 border border-yellow-300 rounded-md text-yellow-800 font-semibold min-h-[32px] flex items-center">Under Review</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Paid claim type - show advance status and amount */}
                        {newClaimData.claimType === 'Paid' && (
                          <div className="flex flex-wrap gap-3 items-stretch mt-2 pt-2 border-t border-purple-200">
                            <div className="flex-1 min-w-[140px] flex flex-col">
                              <label className="block text-xs mb-1 font-semibold text-gray-700">Paid Status</label>
                              <div className="mt-auto">
                                <select name="advanceStatus" value={newClaimData.advanceStatus} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900 bg-white shadow-sm min-h-[32px]">
                                  <option value="Full Pay">Full Pay</option>
                                  <option value="Partial Pay">Partial Pay</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex-1 min-w-[140px] flex flex-col">
                              <label className="block text-xs mb-1 font-semibold text-gray-700">Paid Amount</label>
                              <div className="mt-auto">
                                <input
                                  type="number"
                                  name="advanceAmount"
                                  value={newClaimData.advanceAmount}
                                  onChange={handleNewClaimChange}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900 font-semibold bg-white shadow-sm min-h-[32px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                            </div>
                            <div className="flex-1 min-w-[120px] flex flex-col">
                              <label className="block text-xs mb-1 font-semibold text-gray-700">Status</label>
                              <div className="mt-auto">
                                <div className="px-2 py-1 text-xs bg-yellow-50 border border-yellow-300 rounded-md text-yellow-800 font-semibold min-h-[32px] flex items-center">Under Review</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Form action buttons */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          onClick={() => setShowNewClaimForm(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={submitNewClaim}
                          disabled={newClaimSubmitting || newClaimUploadingFiles}
                          className="px-6 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {newClaimSubmitting ? 'Submitting...' : 'Submit Claim'}
                        </button>
                      </div>
                    </div>
                  )}

                  {(patientData?.insurance === 'Yes' || insuranceClaims.length > 0) ? (
                    <div className="p-6">
                      {/* Insurance Info */}
                      {insuranceClaims.length > 0 && (
                        <div className="mb-6">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="text-xs text-blue-600">Provider</p>
                              <p className="text-sm font-semibold text-blue-900">{insuranceClaims[0]?.insuranceProvider || patientData?.insuranceType || '-'}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3">
                              <p className="text-xs text-green-600">Policy #</p>
                              <p className="text-sm font-semibold text-green-900">{insuranceClaims[0]?.policyNumber || '-'}</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3">
                              <p className="text-xs text-purple-600">Expiry</p>
                              <p className="text-sm font-semibold text-purple-900">{insuranceClaims[0]?.expiryDate ? new Date(insuranceClaims[0].expiryDate).toLocaleDateString() : '-'}</p>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-3">
                              <p className="text-xs text-orange-600">Total Claims</p>
                              <p className="text-sm font-semibold text-orange-900">{insuranceClaims.length}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Claims Table */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-800">Claims</h4>
                          {balance.pendingClaim > 0 && (
                            <div className="px-3 py-1 bg-orange-50 border border-orange-200 rounded-lg">
                              <span className="text-xs text-orange-700 font-medium">Pending from Claims: </span>
                              <span className="text-xs text-orange-800 font-bold">{formatAED(balance.pendingClaim)}</span>
                            </div>
                          )}
                        </div>
                        {claimsLoading ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-teal-600"></div>
                          </div>
                        ) : insuranceClaims.length === 0 ? (
                          <div className="text-center py-8">
                            <Shield className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No claims created yet</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Claim Type</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Services</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Doctor</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid Amount</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pending Claim</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Co-Pay</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {insuranceClaims.map((claim: any) => (
                                  <tr key={claim._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${claim.claimType === 'Advance' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {claim.claimType}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{claim.departmentName || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {claim.services && claim.services.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {claim.services.map((svc: any, idx: number) => (
                                            <span key={idx} className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              {svc.serviceName || 'Service'}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{claim.doctorName || '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                                      {getCurrencySymbol(currency)} {claim.claimAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-700">
                                      {claim.advanceAmount ? `${getCurrencySymbol(currency)} ${claim.advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-orange-700">
                                      {/* Show pending claim only if balance.pendingClaim > 0 (meaning there's still pending claim to collect) */}
                                      {balance.pendingClaim > 0 && claim.pendingClaim > 0 ? `${getCurrencySymbol(currency)} ${claim.pendingClaim.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium">{claim.coPayPercent}%</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                        claim.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                        claim.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-300' :
                                        claim.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                                        'bg-blue-100 text-blue-800 border-blue-300'
                                      }`}>
                                        {claim.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{new Date(claim.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => setClaimViewModal(claim)}
                                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                          title="Review"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => setClaimTrackingModal(claim)}
                                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                          title="Track Claim"
                                        >
                                          <Activity className="w-4 h-4" />
                                        </button>
                                        {['Under Review', 'Rejected'].includes(claim.status) && (
                                          <button
                                            onClick={() => openClaimEditModal(claim)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                        )}
                                        {['Under Review', 'Rejected'].includes(claim.status) && (
                                          <button
                                            onClick={() => deleteClaim(claim._id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <Shield className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-600 font-medium">No insurance enrolled</p>
                      <p className="text-gray-400 text-sm mt-1">This patient is not enrolled in any insurance plan.</p>
                    </div>
                  )}
                </div>

                {/* Claim View Modal */}
                {claimViewModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                        <h2 className="text-lg font-bold text-gray-900">Claim Review</h2>
                        <button onClick={() => setClaimViewModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                      <div className="p-6 space-y-5">
                        {/* Section A: Insurance Details */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Insurance Details
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Provider</p>
                              <p className="text-sm font-semibold text-blue-900">{claimViewModal.insuranceProvider || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Policy Number</p>
                              <p className="text-sm font-semibold text-blue-900">{claimViewModal.policyNumber || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Expiry Date</p>
                              <p className="text-sm font-semibold text-blue-900">{claimViewModal.expiryDate ? new Date(claimViewModal.expiryDate).toLocaleDateString() : '-'}</p>
                            </div>
                            <div className="sm:col-span-1">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Insurance Card</p>
                              {claimViewModal.insuranceCardFile ? (
                                <button
                                  onClick={() => setDocViewerUrl(claimViewModal.insuranceCardFile)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                                >
                                  <Shield className="w-3.5 h-3.5" /> View Card
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No card uploaded</span>
                              )}
                            </div>
                            <div className="sm:col-span-1">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Table of Benefits</p>
                              {claimViewModal.tableOfBenefitsFile ? (
                                <button
                                  onClick={() => setDocViewerUrl(claimViewModal.tableOfBenefitsFile)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                                >
                                  <FileText className="w-3.5 h-3.5" /> View Benefits
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No benefits file</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Section B: Claim Source & Type */}
                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                          <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Claim Source & Type
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Department</p>
                              <p className="text-sm font-semibold text-green-900">{claimViewModal.departmentName || '-'}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Services</p>
                              <div className="flex flex-wrap gap-1.5">
                                {claimViewModal.services && claimViewModal.services.length > 0 ? (
                                  claimViewModal.services.map((svc: any, idx: number) => (
                                    <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 text-[9px] font-bold whitespace-nowrap shadow-sm">
                                      {svc.serviceName || 'Service'}
                                    </span>
                                  ))
                                ) : (
                                  <p className="text-sm font-semibold text-green-900">-</p>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Doctor</p>
                              <p className="text-sm font-semibold text-green-900">{claimViewModal.doctorName || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Claim Amount</p>
                              <p className="text-sm font-bold text-green-900">
                                {getCurrencySymbol(currency)} {claimViewModal.claimAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Claim Type</p>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${claimViewModal.claimType === 'Advance' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                {claimViewModal.claimType}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Section C: Claim Details */}
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                          <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" />
                            Claim Details
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Co-Pay</p>
                              <p className="text-sm font-semibold text-purple-900">{claimViewModal.coPayPercent}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${
                                claimViewModal.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                claimViewModal.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-300' :
                                claimViewModal.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                                'bg-blue-100 text-blue-800 border-blue-300'
                              }`}>{claimViewModal.status}</span>
                            </div>
                            {/* Show pending claim in modal only if balance.pendingClaim > 0 */}
                            {balance.pendingClaim > 0 && claimViewModal.pendingClaim > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Claim</p>
                                <p className="text-sm font-bold text-orange-700">
                                  {getCurrencySymbol(currency)} {claimViewModal.pendingClaim?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              </div>
                            )}
                            {(claimViewModal.claimType === 'Advance' || claimViewModal.claimType === 'Paid') && (
                              <>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{claimViewModal.claimType} Status</p>
                                  <p className="text-sm font-semibold text-purple-900">{claimViewModal.advanceStatus || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Paid Amount</p>
                                  <p className="text-sm font-bold text-purple-900">
                                    {claimViewModal.advanceAmount ? `${getCurrencySymbol(currency)} ${claimViewModal.advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                  </p>
                                </div>
                              </>
                            )}
                            <div className="md:col-span-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                              <p className="text-sm text-purple-900 italic">{claimViewModal.notes || 'No notes added'}</p>
                            </div>
                            {claimViewModal.rejectionReason && (
                              <div className="md:col-span-4 bg-red-100/50 p-3 rounded-lg border border-red-200">
                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Rejection Reason</p>
                                <p className="text-sm text-red-700 font-medium">{claimViewModal.rejectionReason}</p>
                              </div>
                            )}
                            <div className="md:col-span-4 mt-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Support Documents ({claimViewModal.documentFiles?.length || 0})</p>
                              <div className="flex flex-wrap gap-2">
                                {claimViewModal.documentFiles && claimViewModal.documentFiles.length > 0 ? (
                                  claimViewModal.documentFiles.map((f: string, i: number) => (
                                    <button
                                      key={i}
                                      onClick={() => setDocViewerUrl(f)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                                    >
                                      <Paperclip className="w-3.5 h-3.5" /> Document {i + 1}
                                    </button>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-400 italic">No support documents uploaded</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Section D: Administrative Details */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Administrative Details</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 text-[10px]">
                            <div className="flex justify-between border-b border-gray-200 pb-1">
                              <span className="text-gray-500">Patient Name:</span>
                              <span className="font-semibold text-gray-700">{claimViewModal.patientFirstName} {claimViewModal.patientLastName}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-1">
                              <span className="text-gray-500">Doctor Name:</span>
                              <span className="font-semibold text-gray-700">{claimViewModal.doctorName || "-"}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-1">
                              <span className="text-gray-500">Insurance Provider:</span>
                              <span className="font-semibold text-gray-700">{claimViewModal.insuranceProvider}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-1">
                              <span className="text-gray-500">Policy Number:</span>
                              <span className="font-semibold text-gray-700">{claimViewModal.policyNumber}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-1">
                              <span className="text-gray-500">Claim Type:</span>
                              <span className="font-semibold text-gray-700">{claimViewModal.claimType}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-1">
                              <span className="text-gray-500">Created At:</span>
                              <span className="text-gray-700">{new Date(claimViewModal.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-1">
                              <span className="text-gray-500">Last Updated:</span>
                              <span className="text-gray-700">{new Date(claimViewModal.updatedAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                          ID: {claimViewModal.insuranceProvider}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Claim Tracking Modal */}
                {claimTrackingModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                      <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold text-white">Claim Tracking</h2>
                            <p className="text-xs text-white/80">View claim approval & rejection history</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setClaimTrackingModal(null)}
                          className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                     
                      <div className="p-6">
                        {/* Timeline Container */}
                        <div className="relative">
                          {/* Vertical Line */}
                          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 via-blue-300 to-green-300"></div>
                         
                          {/* Timeline Items */}
                          <div className="space-y-6">
                            {/* 1. Claim Created */}
                            <div className="relative flex items-start gap-4">
                              <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <FileText className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 bg-purple-50 border border-purple-200 rounded-xl p-4 ml-2">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-sm font-bold text-purple-900">Claim Created</h3>
                                  <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                                    {new Date(claimTrackingModal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-xs text-purple-700">
                                  Insurance claim created with amount <strong>{claimTrackingModal.claimAmount?.toLocaleString()}</strong>
                                </p>
                                <p className="text-xs text-purple-600 mt-1">
                                  Type: <span className="font-semibold">{claimTrackingModal.claimType}</span>
                                </p>
                              </div>
                            </div>

                            {/* 2. Pass Claims Review (if rejected from pass claims) */}
                            {claimTrackingModal.rejectedFromPassClaims && (
                              <div className="relative flex items-start gap-4">
                                <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                                  <XCircle className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-4 ml-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-red-900">Rejected from Pass Claims</h3>
                                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                      {claimTrackingModal.rejectedFromPassClaimsAt ? new Date(claimTrackingModal.rejectedFromPassClaimsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-red-700">
                                      <strong>Rejected By:</strong> {claimTrackingModal.rejectedFromPassClaimsByName || 'N/A'}
                                    </p>
                                    <p className="text-xs text-red-700">
                                      <strong>Role:</strong> <span className="font-semibold capitalize">{claimTrackingModal.rejectedFromPassClaimsByRole || 'N/A'}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 3. Approval (if approved) */}
                            {claimTrackingModal.approvedBy && (
                              <div className="relative flex items-start gap-4">
                                <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                                  <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-4 ml-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-green-900">Claim Approved</h3>
                                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                      {claimTrackingModal.approvedAt ? new Date(claimTrackingModal.approvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-green-700">
                                      <strong>Approved By:</strong> {claimTrackingModal.approvedByName || 'N/A'}
                                    </p>
                                    <p className="text-xs text-green-700">
                                      <strong>Role:</strong> <span className="font-semibold capitalize">{claimTrackingModal.approvedByRole || 'N/A'}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 4. Rejection (if rejected) */}
                            {claimTrackingModal.rejectedBy && (
                              <div className="relative flex items-start gap-4">
                                <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg">
                                  <XCircle className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-4 ml-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-red-900">Claim Rejected</h3>
                                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                      {claimTrackingModal.rejectedAt ? new Date(claimTrackingModal.rejectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-red-700">
                                      <strong>Rejected By:</strong> {claimTrackingModal.rejectedByName || 'N/A'}
                                    </p>
                                    <p className="text-xs text-red-700">
                                      <strong>Role:</strong> <span className="font-semibold capitalize">{claimTrackingModal.rejectedByRole || 'N/A'}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 5. Release (if released) */}
                            {claimTrackingModal.releasedBy && (
                              <div className="relative flex items-start gap-4">
                                <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                                  <DollarSign className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-4 ml-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-blue-900">Claim Released</h3>
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                      {claimTrackingModal.releasedAt ? new Date(claimTrackingModal.releasedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-blue-700">
                                      <strong>Released By:</strong> {claimTrackingModal.releasedByName || 'N/A'}
                                    </p>
                                    <p className="text-xs text-blue-700">
                                      <strong>Role:</strong> <span className="font-semibold capitalize">{claimTrackingModal.releasedByRole || 'N/A'}</span>
                                    </p>
                                    <p className="text-xs text-blue-700 mt-2 pt-2 border-t border-blue-200">
                                      <strong>Advance Amount:</strong> {claimTrackingModal.advanceAmount?.toLocaleString() || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Current Status Badge */}
                            <div className="relative flex items-start gap-4">
                              <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg">
                                <AlertCircle className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 ml-2">
                                <h3 className="text-sm font-bold text-gray-900 mb-2">Current Status</h3>
                                <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border ${
                                  claimTrackingModal.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                  claimTrackingModal.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-300' :
                                  claimTrackingModal.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                                  'bg-blue-100 text-blue-800 border-blue-300'
                                }`}>
                                  {claimTrackingModal.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                        <button
                          onClick={() => setClaimTrackingModal(null)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Claim Edit Modal */}
                {claimEditModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                        <h2 className="text-lg font-bold text-gray-900">Edit Claim</h2>
                        <button onClick={() => setClaimEditModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                      <div className="p-6 space-y-4">
                        {/* Insurance Details */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <h3 className="text-sm font-semibold text-blue-800 mb-3">Insurance Details</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Insurance Provider <span className="text-red-500">*</span></label>
                              <input type="text" value={claimEditData.insuranceProvider || ''} onChange={(e) => setClaimEditData((prev: any) => ({ ...prev, insuranceProvider: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Policy Number <span className="text-red-500">*</span></label>
                              <input type="text" value={claimEditData.policyNumber || ''} onChange={(e) => setClaimEditData((prev: any) => ({ ...prev, policyNumber: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date <span className="text-red-500">*</span></label>
                              <input type="date" value={claimEditData.expiryDate || ''} onChange={(e) => setClaimEditData((prev: any) => ({ ...prev, expiryDate: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Insurance Card </label>
                              <div className="relative group">
                                <input
                                  id="edit-insurance-card-upload"
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => handleClaimEditFileUpload(e, 'insuranceCard')}
                                  className="hidden"
                                  disabled={claimEditUploadingFiles}
                                />
                                <div className={`w-full flex items-center gap-2 px-3 py-2 text-[10px] border border-gray-300 rounded-lg transition-all ${claimEditData.insuranceCardFile ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400 shadow-sm' : 'bg-white hover:border-blue-400'} min-h-[38px]`}>
                                  <label
                                    htmlFor="edit-insurance-card-upload"
                                    className="flex-1 flex items-center gap-2 cursor-pointer truncate"
                                  >
                                    <Shield className={`w-3.5 h-3.5 flex-shrink-0 ${claimEditData.insuranceCardFile ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <span className={`truncate ${claimEditData.insuranceCardFile ? 'text-blue-700 font-semibold' : 'text-gray-400'}`}>
                                       {claimEditData.insuranceCardFile ? (claimEditData.insuranceCardFile.split('/').pop()?.split('-').pop() || 'Card Attached') : 'No file chosen'}
                                     </span>
                                  </label>
                                  {claimEditData.insuranceCardFile && (
                                    <button
                                      onClick={() => setDocViewerUrl(claimEditData.insuranceCardFile)}
                                      className="flex-shrink-0 p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                      title="View Card"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {claimEditUploadingFiles && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 flex-shrink-0" />}
                                </div>
                               </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Table of Benefits</label>
                              <div className="relative group">
                                <input
                                  id="edit-benefits-upload"
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => handleClaimEditFileUpload(e, 'tableOfBenefits')}
                                  className="hidden"
                                  disabled={claimEditUploadingFiles}
                                />
                                <div className={`w-full flex items-center gap-2 px-3 py-2 text-[10px] border border-gray-300 rounded-lg transition-all ${claimEditData.tableOfBenefitsFile ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400 shadow-sm' : 'bg-white hover:border-blue-400'} min-h-[38px]`}>
                                  <label
                                    htmlFor="edit-benefits-upload"
                                    className="flex-1 flex items-center gap-2 cursor-pointer truncate"
                                  >
                                    <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${claimEditData.tableOfBenefitsFile ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <span className={`truncate ${claimEditData.tableOfBenefitsFile ? 'text-blue-700 font-semibold' : 'text-gray-400'}`}>
                                       {claimEditData.tableOfBenefitsFile ? (claimEditData.tableOfBenefitsFile.split('/').pop()?.split('-').pop() || 'Benefits Attached') : 'No file chosen'}
                                     </span>
                                  </label>
                                  {claimEditData.tableOfBenefitsFile && (
                                    <button
                                      onClick={() => setDocViewerUrl(claimEditData.tableOfBenefitsFile)}
                                      className="flex-shrink-0 p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                      title="View Benefits"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {claimEditUploadingFiles && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 flex-shrink-0" />}
                                </div>
                               </div>
                            </div>
                          </div>
                        </div>

                        {/* Claim Source & Type */}
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <h3 className="text-sm font-semibold text-green-800 mb-3">Claim Source & Type</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-start">
                            <div className="flex flex-col">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Department
                              </label>
                              <select value={claimEditData.departmentId || ''} onChange={(e) => {
                                const dept = claimDepartments.find((d: any) => d._id === e.target.value);
                                setClaimEditData((prev: any) => ({
                                  ...prev,
                                  departmentId: e.target.value,
                                  departmentName: dept?.name || '',
                                  serviceId: '',
                                  serviceName: '',
                                  services: [] // Clear services when department changes
                                }));
                              }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 h-[38px]">
                                <option value="">Select Department</option>
                                {claimDepartments.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
                              </select>
                            </div>
                            <div className="flex flex-col">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Services {claimEditData.services && claimEditData.services.length > 0 && (
                                  <span className="text-blue-600 font-semibold ml-1">
                                    ({claimEditData.services.length})
                                  </span>
                                )}
                              </label>
                              <div className="relative w-full flex items-center p-0.5 border border-gray-300 rounded-lg bg-white shadow-sm focus-within:ring-2 focus-within:ring-green-500 transition-all min-h-[38px] box-border">
                                <div className="flex flex-wrap items-center gap-1 flex-1 px-1 py-0.5">
                                  {(claimEditData.services || []).map((svc: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 text-[9px] font-bold whitespace-nowrap"
                                    >
                                      {svc.serviceName}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const updatedServices = claimEditData.services.filter((_: any, i: number) => i !== idx);
                                          setClaimEditData((prev: any) => ({
                                            ...prev,
                                            services: updatedServices,
                                            serviceId: updatedServices.length > 0 ? updatedServices[updatedServices.length - 1].serviceId : "",
                                            serviceName: updatedServices.length > 0 ? updatedServices[updatedServices.length - 1].serviceName : "",
                                          }));
                                        }}
                                        className="hover:text-red-500 transition-colors"
                                      >
                                        <X className="w-2 h-2" />
                                      </button>
                                    </span>
                                  ))}
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      const selectedId = e.target.value;
                                      if (!selectedId) return;
                                      const svc = claimServices.find((s: any) => s._id === selectedId);
                                      if (svc) {
                                        const alreadySelected = (claimEditData.services || []).some((s: any) => s.serviceId === selectedId);
                                        if (!alreadySelected) {
                                          const updatedServices = [...(claimEditData.services || []), { serviceId: svc._id, serviceName: svc.name }];
                                          setClaimEditData((prev: any) => ({
                                            ...prev,
                                            services: updatedServices,
                                            serviceId: svc._id,
                                            serviceName: svc.name
                                          }));
                                        }
                                      }
                                    }}
                                    className="min-w-[100px] bg-transparent border-none outline-none text-[10px] text-gray-900 cursor-pointer h-full py-0.5 flex-1 appearance-none"
                                  >
                                    <option value="" disabled>{(claimEditData.services || []).length > 0 ? "Add More Services..." : "Select Services"}</option>
                                    {claimServices
                                      .filter((s: any) => !claimEditData.departmentId || String(s.departmentId) === String(claimEditData.departmentId))
                                      .map((s: any) => (
                                        <option key={s._id} value={s._id} className="py-2 px-3">
                                          {s.name}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Doctor <span className="text-red-500">*</span></label>
                              <select value={claimEditData.doctorId || ''} onChange={(e) => {
                                const doc = claimDoctors.find((d: any) => d._id === e.target.value);
                                setClaimEditData((prev: any) => ({ ...prev, doctorId: e.target.value, doctorName: doc?.name || '' }));
                              }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 h-[38px]">
                                <option value="">Select Doctor</option>
                                {claimDoctors.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
                              </select>
                            </div>
                            <div className="flex flex-col">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Claim Amount <span className="text-red-500">*</span></label>
                              <input type="number" value={claimEditData.claimAmount ?? ''} onChange={(e) => {
                                const amt = parseFloat(e.target.value) || 0;
                                setClaimEditData((prev: any) => ({
                                  ...prev,
                                  claimAmount: amt,
                                  advanceAmount: prev.claimType === 'Advance' ? (prev.advanceStatus === 'Full Pay' ? amt : amt * 0.5) : 0,
                                }));
                              }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 h-[38px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" min="0" step="0.01" />
                            </div>
                            <div className="flex flex-col">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Claim Type <span className="text-red-500">*</span></label>
                              <select value={claimEditData.claimType || 'Paid'} onChange={(e) => setClaimEditData((prev: any) => ({ ...prev, claimType: e.target.value, advanceStatus: e.target.value === 'Advance' ? 'Full Pay' : null, advanceAmount: 0 }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 h-[38px]">
                                <option value="Paid">Paid</option>
                                <option value="Advance">Advance</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Claim Details */}
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <h3 className="text-sm font-semibold text-purple-800 mb-3">Claim Details</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-start">
                            <div className="flex flex-col">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Co-Pay %</label>
                              <input type="number" value={claimEditData.coPayPercent ?? ''} onChange={(e) => setClaimEditData((prev: any) => ({ ...prev, coPayPercent: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-[38px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" min="0" max="100" />
                            </div>
                            <div className="flex flex-col">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Co-Pay Type</label>
                              <select value={claimEditData.coPayType || 'Patient Pays'} onChange={(e) => setClaimEditData((prev: any) => ({ ...prev, coPayType: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-[38px]">
                                <option value="Patient Pays">Patient Pays</option>
                                <option value="Deduct from Claim">Deduct from Claim</option>
                                <option value="Clinic Adjusts">Clinic Adjusts</option>
                              </select>
                            </div>
                            <div className="md:col-span-1 lg:col-span-1 flex flex-col">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                              <input type="text" value={claimEditData.notes || ''} onChange={(e) => setClaimEditData((prev: any) => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-[38px]" />
                            </div>
                            <div className="md:col-span-1 lg:col-span-1 flex flex-col">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Support Documents</label>
                              <div className="relative group">
                                <input
                                  id="edit-support-docs-upload"
                                  type="file"
                                  multiple
                                  accept="image/*,.pdf"
                                  onChange={handleClaimEditDocumentsUpload}
                                  className="hidden"
                                  disabled={claimEditUploadingFiles}
                                />
                                <div className={`w-full flex items-center gap-2 px-3 py-2 text-[10px] border border-gray-300 rounded-lg transition-all ${claimEditData.documentFiles?.length > 0 ? 'bg-purple-50 border-purple-400 ring-1 ring-purple-400 shadow-sm' : 'bg-white hover:border-purple-400'} min-h-[38px]`}>
                                  <label
                                    htmlFor="edit-support-docs-upload"
                                    className="flex-1 flex items-center gap-2 cursor-pointer truncate"
                                  >
                                    <Paperclip className={`w-3.5 h-3.5 flex-shrink-0 ${claimEditData.documentFiles?.length > 0 ? 'text-purple-600' : 'text-gray-400'}`} />
                                    <span className={`truncate ${claimEditData.documentFiles?.length > 0 ? 'text-purple-700 font-semibold' : 'text-gray-400'}`}>
                                       {claimEditData.documentFiles?.length > 0 ? `${claimEditData.documentFiles.length} files attached` : 'No files chosen'}
                                     </span>
                                  </label>
                                  {claimEditData.documentFiles?.length > 0 && (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {claimEditData.documentFiles.map((f: string, i: number) => (
                                        <button
                                          key={i}
                                          onClick={() => setDocViewerUrl(f)}
                                          className="p-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                                          title={`View Doc ${i + 1}`}
                                        >
                                          <Eye className="w-3 h-3" />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  {claimEditUploadingFiles && <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 flex-shrink-0" />}
                                </div>
                               </div>
                            </div>
                            {(claimEditData.claimType === 'Advance' || claimEditData.claimType === 'Paid') && (
                              <div className="grid grid-cols-2 gap-2 lg:col-span-1">
                                <div className="flex flex-col">
                                  <label className="block text-[10px] font-medium text-gray-700 mb-1 truncate">{claimEditData.claimType} Status</label>
                                  <select value={claimEditData.advanceStatus || 'Full Pay'} onChange={(e) => {
                                    const amt = parseFloat(claimEditData.claimAmount) || 0;
                                    setClaimEditData((prev: any) => ({
                                      ...prev,
                                      advanceStatus: e.target.value,
                                      advanceAmount: e.target.value === 'Full Pay' ? amt : amt * 0.5,
                                    }));
                                  }} className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-[38px]">
                                    <option value="Full Pay">Full</option>
                                    <option value="Partial Pay">Partial</option>
                                  </select>
                                </div>
                                <div className="flex flex-col">
                                  <label className="block text-[10px] font-medium text-gray-700 mb-1 truncate">Amount</label>
                                  <input type="number" value={claimEditData.advanceAmount ?? ''} onChange={(e) => setClaimEditData((prev: any) => ({ ...prev, advanceAmount: parseFloat(e.target.value) || 0 }))} className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold h-[38px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0" min="0" step="0.01" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Save/Cancel buttons */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                          <button onClick={() => setClaimEditModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                          <button onClick={handleClaimEditSave} disabled={claimEditLoading} className="px-6 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50">
                            {claimEditLoading ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : activeTab === 'media' ? (
              /* Media & Documents - Two Sub-tabs */
              <div className="space-y-4">
                {/* Sub-tab Navigation */}
                <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                  <button
                    onClick={() => setMediaSubTab('before-after')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      mediaSubTab === 'before-after'
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileImage className="w-4 h-4" />
                      Before & After Images
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setMediaSubTab('payment-proofs');
                      // Refresh balance data to get latest images
                      if (patientData?._id) {
                        fetchPatientBalance(patientData._id).then((data) => {
                          if (data) setBalance(data as typeof balance);
                        });
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      mediaSubTab === 'payment-proofs'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Payment Proofs
                    </span>
                   
                  </button>
                </div>

                {/* Before & After Images Tab */}
                {mediaSubTab === 'before-after' && (
                  loadingMedia ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    </div>
                  ) : mediaDocuments.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="h-1.5 bg-gradient-to-r from-teal-400 to-cyan-400" />
                      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-50 to-cyan-100 border-2 border-teal-200 flex items-center justify-center mb-4">
                          <FileImage className="w-9 h-9 text-teal-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">No Before/After Images</h3>
                        <p className="text-gray-500 text-sm max-w-xs">
                          Before and after images will appear here once added via the appointment complaint form.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex items-center gap-2 mb-2">
                        <FileImage className="w-5 h-5 text-teal-600" />
                        <h3 className="text-base font-bold text-gray-900">Before & After Images</h3>
                        <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                          {mediaDocuments.length} Record{mediaDocuments.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {mediaDocuments.map((item: any, index: number) => (
                        <div key={item._id || index} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                          {/* Card Header */}
                          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                              <Activity className="w-4 h-4 text-teal-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {item.complaints || 'Complaint Record'}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                {item.doctorName && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {item.doctorName}
                                  </span>
                                )}
                                {item.appointmentDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(item.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Before / After Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                            {/* Before */}
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">BEFORE</span>
                              </div>
                              {item.beforeImage ? (
                                <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video group">
                                  <img
                                    src={item.beforeImage}
                                    alt="Before"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e: any) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                  />
                                  <div className="hidden absolute inset-0 items-center justify-center bg-gray-100 text-gray-400 text-xs">
                                    Image not available
                                  </div>
                                  <a
                                    href={item.beforeImage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2.5 py-1 rounded-full hover:bg-opacity-80 transition-all"
                                  >
                                    View Full
                                  </a>
                                </div>
                              ) : (
                                <div className="aspect-video rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                                  <div className="text-center">
                                    <FileImage className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                                    <span className="text-xs text-gray-400">No before image</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* After */}
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">AFTER</span>
                              </div>
                              {item.afterImage ? (
                                <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video group">
                                  <img
                                    src={item.afterImage}
                                    alt="After"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e: any) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                  />
                                  <div className="hidden absolute inset-0 items-center justify-center bg-gray-100 text-gray-400 text-xs">
                                    Image not available
                                  </div>
                                  <a
                                    href={item.afterImage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2.5 py-1 rounded-full hover:bg-opacity-80 transition-all"
                                  >
                                    View Full
                                  </a>
                                </div>
                              ) : (
                                <div className="aspect-video rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                                  <div className="text-center">
                                    <FileImage className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                                    <span className="text-xs text-gray-400">No after image</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Payment Proofs Tab */}
                {mediaSubTab === 'payment-proofs' && (
                  !balance.pendingBalanceImages || balance.pendingBalanceImages.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="h-1.5 bg-gradient-to-r from-purple-400 to-indigo-400" />
                      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-50 to-indigo-100 border-2 border-purple-200 flex items-center justify-center mb-4">
                          <Camera className="w-9 h-9 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">No Payment Proofs</h3>
                        <p className="text-gray-500 text-sm max-w-xs mb-4">
                          Payment proof images will appear here once uploaded from the Financial Snapshot section.
                        </p>
                        <button
                          onClick={() => {
                            // Switch to overview tab and scroll to financial snapshot
                            setActiveTab('overview');
                            setTimeout(() => {
                              const uploadBtn = document.querySelector('button[title="Upload payment proof"]');
                              if (uploadBtn) uploadBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                          }}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md"
                        >
                          Upload Payment Proof
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Camera className="w-5 h-5 text-purple-600" />
                        <h3 className="text-base font-bold text-gray-900">Payment Proof Images</h3>
                        <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                          {balance.pendingBalanceImages.length} Image{balance.pendingBalanceImages.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Image Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {balance.pendingBalanceImages.map((imgUrl: string, index: number) => (
                          <div
                            key={index}
                            onClick={() => {
                              setSelectedImageIndex(index);
                              setShowImageViewer(true);
                            }}
                            className="relative group cursor-pointer rounded-xl overflow-hidden border-2 border-gray-200 hover:border-purple-500 transition-all shadow-sm hover:shadow-md bg-gray-50 aspect-square"
                          >
                            <img
                              src={imgUrl}
                              alt={`Payment proof ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                              <div className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-white" />
                                <span className="text-white text-xs font-semibold">View</span>
                              </div>
                            </div>
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full">
                              #{index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : activeTab === 'treatments' ? (
              /* Treatments Tab — Ongoing/All from appointments, Completed from billing */
              (() => {
                // Debug: Log data sources
                console.log('Billing History:', billingHistory);
                console.log('Appointments Data:', allAppointmentsData);
               
                // Define status categories for appointments
                const ONGOING_STATUSES = ['booked', 'enquiry', 'consultation', 'approved', 'rescheduled', 'waiting', 'arrived'];
                const CANCELLED_STATUSES = ['cancelled', 'rejected'];
                const COMPLETED_STATUSES = ['completed', 'discharge'];

                // Build treatment items from appointments (for Ongoing, Cancelled, and All sections)
                const appointmentTreatments = (allAppointmentsData || [])
                  .map((apt: any) => {
                    const status = (apt.status || apt.appointmentStatus || '').toLowerCase();
                    const isOngoing = ONGOING_STATUSES.includes(status);
                    const isCancelled = CANCELLED_STATUSES.includes(status);
                    const isCompleted = COMPLETED_STATUSES.includes(status);
                    const treatmentName = apt.treatmentName || apt.serviceName || apt.treatment || '';
                    const doctorName = apt.doctorName || '';
                    const date = apt.appointmentDate
                      ? new Date(apt.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : (apt.createdAt
                        ? new Date(apt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'N/A');
                    const time = apt.fromTime || '';
                    const invoiceNumber = apt.invoiceNumber || apt.invoiceNo || apt._id?.slice(-8).toUpperCase() || '';
                    const hasInvoice = (billingHistory || []).some((b: any) =>
                      b.appointmentId?.toString() === apt._id?.toString() ||
                      b.treatment === treatmentName ||
                      b.invoiceNumber === invoiceNumber
                    );
                    let treatmentStatus = 'ongoing';
                    if (isOngoing) {
                      treatmentStatus = 'ongoing';
                    } else if (isCancelled) {
                      treatmentStatus = 'cancelled';
                    } else if (isCompleted) {
                      treatmentStatus = hasInvoice ? 'invoice' : 'completed-no-invoice';
                    }
                    return {
                      source: 'appointment',
                      data: apt,
                      treatmentName: treatmentName || 'General Appointment',
                      doctorName,
                      date: time ? `${date} at ${time}` : date,
                      originalDate: apt.appointmentDate || apt.createdAt,
                      treatmentStatus,
                      appointmentStatus: status,
                      amount: apt.amount || apt.totalAmount || 0,
                      paid: apt.paidAmount || 0,
                      hasInvoice,
                      invoiceNumber,
                      isOngoing,
                      isCancelled,
                      isCompleted
                    };
                  });

                // Build treatment items from billing history (for Completed and Pending sections)
                const billingTreatments = (billingHistory || [])
                  .filter((b: any) => {
                    // Filter out advance payments and balance adjustments
                    const isAdvance = b.isAdvanceOnly ||
                                     b.treatment === "Advance Payment" ||
                                     b.treatment === "Historical Advance Balance";
                   
                    // Include all billing records except advance payments
                    // Show even if treatment/package name is empty (will display as '-')
                    return !isAdvance;
                  })
                  .map((billing: any) => {
                    const amount = parseFloat(billing.amount) || 0;
                    const originalAmount = parseFloat(billing.originalAmount) || amount;
                    const paid = parseFloat(billing.paid || billing.paidAmount || 0) || 0;
                    const pending = parseFloat(billing.pending || 0) || 0;
                    const pendingUsed = parseFloat(billing.pendingUsed || 0) || 0;
                   
                    // Get invoice number early (needed for manuallyPaidInvoices check)
                    const invoiceNumber = billing.invoiceNumber || billing.invoiceNo || billing._id?.slice(-8).toUpperCase() || '';
                    const billingDate = billing.createdAt ? new Date(billing.createdAt).getTime() : 0;
                   
                    // CRITICAL FIX: Use pending field directly from backend
                    // The pending field is already calculated by the pre-save hook as: pending = amount - paid
                    // pendingUsed is for tracking when THIS invoice cleared a PREVIOUS invoice's pending
                    // It should NOT be subtracted from this invoice's own pending amount
                    let remainingPending = pending;
                    
                    // Check if fully paid based on pending field directly
                    const hasPendingAmount = remainingPending > 0;
                    const isFullyPaid = !hasPendingAmount;
                    
                    // Status based on remaining pending amount
                    const treatmentStatus = hasPendingAmount ? 'pending' : 'completed';
                   
                    // Debug logging for invoice status calculation
                    console.log('📊 Invoice Status Calculation:', {
                      invoiceNumber,
                      treatment: billing.treatment || billing.package || 'N/A',
                      originalAmount,
                      amount,
                      paid,
                      pending,
                      pendingUsed,
                      remainingPending,
                      billingDate: new Date(billingDate).toLocaleString(),
                      hasPendingAmount,
                      isFullyPaid,
                      reason: manuallyPaidInvoices.has(invoiceNumber) ? 'manuallyPaidInvoices' :
                              hasPendingAmount ? 'HAS_PENDING_FROM_BACKEND' :
                              paid >= amount ? 'paid_equals_or_exceeds_amount' : 'NOT_FULLY_PAID'
                    });
                   
                    // Get treatment/package name from billing record
                    const treatmentName = (billing.treatment && billing.treatment.trim() !== '' ? billing.treatment :
                                          (billing.package && billing.package.trim() !== '' ? billing.package : '-'));
                   
                    // Get doctor name if available
                    const doctorName = billing.doctorName ||
                                      (billing.doctorId && typeof billing.doctorId === 'object' ? billing.doctorId.name : null) ||
                                      '';
                   
                    // Get date from billing record
                    const date = billing.createdAt
                      ? new Date(billing.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A';

                    return {
                      source: 'billing',
                      data: billing,
                      treatmentName,
                      doctorName,
                      date,
                      treatmentStatus,
                      amount,
                      paid,
                      pendingAmount: remainingPending, // Use remaining pending after pendingUsed deduction
                      isFullyPaid,
                      invoiceNumber,
                      hasInvoice: true
                    };
                  });

                console.log('Appointment treatments:', appointmentTreatments);
                console.log('Billing treatments:', billingTreatments);
                console.log('Treatment filter:', treatmentFilter);

                // Filter based on treatmentFilter with advanced filtering support
                let filtered: any[] = [];

                // Apply date range filter if set
                const applyDateFilter = (item: any) => {
                  if (!treatmentDateRange.from && !treatmentDateRange.to) return true;
                  const itemDate = new Date(item.originalDate || item.date).getTime();
                  const fromDate = treatmentDateRange.from ? new Date(treatmentDateRange.from).getTime() : 0;
                  const toDate = treatmentDateRange.to ? new Date(treatmentDateRange.to).getTime() : Infinity;
                  return itemDate >= fromDate && itemDate <= toDate;
                };

                // Apply doctor filter if set
                const applyDoctorFilter = (item: any) => {
                  if (!treatmentDoctorFilter) return true;
                  return item.doctorName?.toLowerCase().includes(treatmentDoctorFilter.toLowerCase());
                };

                // Apply search filter if set
                const applySearchFilter = (item: any) => {
                  if (!treatmentSearch) return true;
                  const searchLower = treatmentSearch.toLowerCase();
                  return item.treatmentName?.toLowerCase().includes(searchLower) ||
                         item.invoiceNumber?.toLowerCase().includes(searchLower) ||
                         item.doctorName?.toLowerCase().includes(searchLower);
                };

                // Apply all filters
                const applyAllFilters = (item: any) => {
                  return applyDateFilter(item) && applyDoctorFilter(item) && applySearchFilter(item);
                };

                if (treatmentFilter === 'completed') {
                  // Completed section: All completed treatments from appointments AND billing
                  // Include appointments with completed status (with or without invoice) and billing completed records
                  const completedFromAppointments = appointmentTreatments.filter((t: any) => 
                    t.treatmentStatus === 'invoice' || t.treatmentStatus === 'completed-no-invoice'
                  );
                  const completedFromBilling = billingTreatments.filter((t: any) => 
                    t.treatmentStatus === 'completed'
                  );
                  filtered = [...completedFromAppointments, ...completedFromBilling].filter(applyAllFilters);
                } else if (treatmentFilter === 'pending') {
                  // Pending section: Billing treatments with pending amount
                  filtered = billingTreatments.filter((t: any) => {
                    return t.treatmentStatus === 'pending';
                  }).filter(applyAllFilters);
                } else if (treatmentFilter === 'invoice') {
                  // Invoice section: Billing invoices + appointments with invoices (exclude ongoing treatments)
                  const invoicedFromBilling = billingTreatments.filter((t: any) => 
                    t.treatmentStatus !== 'ongoing' // Exclude ongoing treatments from invoice section
                  ).map((t: any) => ({ ...t, invoiceSource: 'billing' }));
                  const invoicedFromAppointments = appointmentTreatments.filter((t: any) => 
                    (t.invoiceNumber || t.treatmentStatus === 'invoice' || t.hasInvoice) &&
                    t.treatmentStatus !== 'ongoing' // Exclude ongoing treatments from invoice section
                  ).map((t: any) => ({ ...t, invoiceSource: 'appointment' }));
                  filtered = [...invoicedFromBilling, ...invoicedFromAppointments].filter(applyAllFilters);
                } else if (treatmentFilter === 'cancelled') {
                  // Cancelled section: Appointments with cancelled/rejected status
                  filtered = appointmentTreatments.filter((t: any) => {
                    return t.treatmentStatus === 'cancelled';
                  }).filter(applyAllFilters);
                } else if (treatmentFilter === 'ongoing') {
                  // Ongoing section: Appointments with ongoing status
                  filtered = appointmentTreatments.filter((t: any) => {
                    return t.treatmentStatus === 'ongoing';
                  }).filter(applyAllFilters);
                } else {
                  // All section: Combine ALL treatments from billing + appointments
                  // Include all billing treatments + all appointment treatments
                  const allBillingTreatments = billingTreatments;
                  const allAppointmentTreatments = appointmentTreatments;
                 
                  filtered = [...allBillingTreatments, ...allAppointmentTreatments].filter(applyAllFilters);
                 
                  // Remove duplicates by checking if treatment names and IDs match
                  const seen = new Set();
                  filtered = filtered.filter((item: any) => {
                    const key = `${item.data._id || item.treatmentName}-${item.date}-${item.source}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
                }

                console.log('Filtered treatments:', filtered);

                const isLoading = loadingBilling || loadingTreatmentAppointments;

                return (
                  <div className="space-y-4">
                    {/* Filter Chips with counts */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {(['all', 'ongoing', 'pending', 'invoice', 'completed', 'cancelled'] as const).map((f) => {
                        // Calculate counts for each filter - sum all individual category counts for 'all'
                        let count = 0;
                        if (f === 'all') {
                          count = 0
                            + appointmentTreatments.filter((t: any) => t.treatmentStatus === 'ongoing').length
                            + billingTreatments.filter((t: any) => t.treatmentStatus === 'pending').length
                            + billingTreatments.filter((t: any) => t.treatmentStatus !== 'ongoing').length  // Exclude ongoing from billing count
                            + appointmentTreatments.filter((t: any) => 
                              (t.invoiceNumber || t.treatmentStatus === 'invoice' || t.hasInvoice) &&
                              t.treatmentStatus !== 'ongoing'  // Exclude ongoing from invoice count
                            ).length
                            + (appointmentTreatments.filter((t: any) => 
                              t.treatmentStatus === 'invoice' || t.treatmentStatus === 'completed-no-invoice'
                            ).length + billingTreatments.filter((t: any) => t.treatmentStatus === 'completed').length)
                            + appointmentTreatments.filter((t: any) => t.treatmentStatus === 'cancelled').length;
                        } else if (f === 'ongoing') {
                          count = appointmentTreatments.filter((t: any) => t.treatmentStatus === 'ongoing').length;
                        } else if (f === 'pending') {
                          count = billingTreatments.filter((t: any) => t.treatmentStatus === 'pending').length;
                        } else if (f === 'invoice') {
                          // Invoice count: Only count treatments with invoices, exclude ongoing treatments
                          count = billingTreatments.filter((t: any) => t.treatmentStatus !== 'ongoing').length 
                            + appointmentTreatments.filter((t: any) => 
                              (t.invoiceNumber || t.treatmentStatus === 'invoice' || t.hasInvoice) &&
                              t.treatmentStatus !== 'ongoing'
                            ).length;
                        } else if (f === 'completed') {
                          // Completed count: Appointments with invoice or completed-no-invoice + billing completed
                          count = appointmentTreatments.filter((t: any) => 
                            t.treatmentStatus === 'invoice' || t.treatmentStatus === 'completed-no-invoice'
                          ).length + billingTreatments.filter((t: any) => t.treatmentStatus === 'completed').length;
                        } else if (f === 'cancelled') {
                          count = appointmentTreatments.filter((t: any) => t.treatmentStatus === 'cancelled').length;
                        }
                        return (
                          <button
                            key={f}
                            onClick={() => setTreatmentFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors capitalize flex items-center gap-2 ${
                              treatmentFilter === f
                                ? 'bg-teal-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              treatmentFilter === f ? 'bg-white/20' : 'bg-gray-100'
                            }`}>{count}</span>
                          </button>
                        );
                      })}
                      {/* Advanced Filters Toggle */}
                      <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
                          showAdvancedFilters || treatmentDateRange.from || treatmentDoctorFilter || treatmentSearch
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Filter className="w-4 h-4" />
                        Advanced
                      </button>
                    </div>

                    {/* Advanced Filters Panel */}
                    {showAdvancedFilters && (
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Search */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Search Treatment</label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={treatmentSearch}
                                onChange={(e) => setTreatmentSearch(e.target.value)}
                                placeholder="Search by name, invoice..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                              />
                            </div>
                          </div>
                          
                          {/* Doctor Filter */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Filter by Doctor</label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={treatmentDoctorFilter}
                                onChange={(e) => setTreatmentDoctorFilter(e.target.value)}
                                placeholder="Doctor name..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                              />
                            </div>
                          </div>
                          
                          {/* Date Range */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">From Date</label>
                            <input
                              type="date"
                              value={treatmentDateRange.from}
                              onChange={(e) => setTreatmentDateRange({ ...treatmentDateRange, from: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">To Date</label>
                            <input
                              type="date"
                              value={treatmentDateRange.to}
                              onChange={(e) => setTreatmentDateRange({ ...treatmentDateRange, to: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                          </div>
                          
                          {/* Sort By */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Sort By</label>
                            <select
                              value={treatmentSortBy}
                              onChange={(e) => setTreatmentSortBy(e.target.value as any)}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            >
                              <option value="date">Date</option>
                              <option value="name">Name</option>
                              <option value="amount">Amount</option>
                              <option value="status">Status</option>
                            </select>
                          </div>
                          
                          {/* Sort Order */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Order</label>
                            <select
                              value={treatmentSortOrder}
                              onChange={(e) => setTreatmentSortOrder(e.target.value as any)}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            >
                              <option value="desc">Descending</option>
                              <option value="asc">Ascending</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* Clear Filters */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              setTreatmentDateRange({ from: '', to: '' });
                              setTreatmentDoctorFilter('');
                              setTreatmentSearch('');
                              setTreatmentSortBy('date');
                              setTreatmentSortOrder('desc');
                            }}
                            className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Clear All Filters
                          </button>
                        </div>
                      </div>
                    )}

                    
                    {isLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">No treatments found</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {treatmentFilter === 'all' ? 'No treatments or billing records yet' :
                           treatmentFilter === 'completed' ? 'No completed billing records' :
                           treatmentFilter === 'pending' ? 'No pending treatments' :
                           'No ongoing treatments'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filtered.map((item: any, index: number) => {
                          const isCompleted = item.treatmentStatus === 'completed';
                          const isPending = item.treatmentStatus === 'pending';
                          const isCancelled = item.treatmentStatus === 'cancelled';
                          const isInvoice = item.treatmentStatus === 'invoice';
                          const isCompletedNoInvoice = item.treatmentStatus === 'completed-no-invoice';
                          const isFromBilling = item.source === 'billing';
                          // Use actual pending from billing model - don't calculate fallback
                          // For billing items, use item.pendingAmount (actual pending field from backend)
                          // For appointment items, no pending field exists
                          const actualPending = isFromBilling ? item.pendingAmount : null;
                          const pendingAmount = isFromBilling ? actualPending : (item.amount - item.paid);
                          const hasPendingAmount = isFromBilling ? (actualPending > 0) : false;
                         
                          // Get status display text and color
                          const getStatusDisplay = () => {
                            if (isPending) return { text: 'Pending', color: 'bg-red-50 text-red-700 border-red-200', icon: <AlertCircle className="w-3.5 h-3.5" /> };
                            if (isCancelled) return { text: 'Cancelled', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: <XCircle className="w-3.5 h-3.5" /> };
                            if (isInvoice) return { text: 'Invoiced', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <FileText className="w-3.5 h-3.5" /> };
                            if (isCompletedNoInvoice) return { text: 'Completed (No Invoice)', color: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> };
                            if (isCompleted) return { text: 'Completed', color: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> };
                            return { text: 'Ongoing', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> };
                          };
                         
                          const statusDisplay = getStatusDisplay();
                         
                          return (
                            <div
                              key={item.data._id || index}
                              className={`bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow ${
                                isCancelled ? 'border-gray-300 opacity-75' : 'border-gray-200'
                              }`}
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="text-base font-bold text-gray-900">{item.treatmentName}</h4>
                                  {item.doctorName && (
                                    <p className="text-sm text-gray-500 mt-0.5">{item.doctorName}</p>
                                  )}
                                  {/* Invoice Number - Show only for billing model items (not for appointments) */}
                                  {item.invoiceNumber && isFromBilling && (
                                    <p className="text-xs text-blue-600 mt-1 font-medium">Invoice : {item.invoiceNumber}</p>
                                  )}
                                  {/* Show "Invoice Not Generated" tag for completed treatments without invoice */}
                                  {isCompletedNoInvoice && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 mt-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Invoice Not Generated
                                    </span>
                                  )}
                                  {/* Source badge */}
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                    isFromBilling ? 'bg-purple-50 text-purple-700' : 'bg-teal-50 text-teal-700'
                                  }`}>
                                    {isFromBilling ? 'Billing' : 'Appointment'}
                                  </span>
                                  {/* Appointment Status Tag - Only for appointment items */}
                                  {!isFromBilling && item.appointmentStatus && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                                      {item.appointmentStatus}
                                    </span>
                                  )}
                                </div>
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusDisplay.color}`}>
                                  {statusDisplay.icon}
                                  {statusDisplay.text}
                                </span>
                              </div>

                              {/* Payment Info - Show for Ongoing, Invoice, and Pending filters */}
                              {(treatmentFilter === 'ongoing' || treatmentFilter === 'invoice' || treatmentFilter === 'pending') && item.amount > 0 && (
                                <div className="space-y-2 mb-3">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Total Amount:</span>
                                    <span className="font-semibold text-gray-900">{getCurrencySymbol(currency)} {item.amount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Paid:</span>
                                    <span className="font-semibold text-green-600">{getCurrencySymbol(currency)} {(item.paid || 0).toFixed(2)}</span>
                                  </div>
                                  {hasPendingAmount && (
                                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                                      <span className="text-gray-500">Pending:</span>
                                      <span className="font-bold text-red-600">{getCurrencySymbol(currency)} {pendingAmount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {/* Pay Button for Pending Treatments */}
                                  {isPending && hasPendingAmount && (
                                    <div className="pt-2 border-t border-gray-100">
                                      <button
                                        onClick={() => {
                                          setSelectedInvoiceForPayment(item);
                                          setInvoicePayAmount(pendingAmount.toFixed(2));
                                          setInvoicePayMethod("Cash");
                                          setInvoiceUseAdvanceBalance(false);
                                          setInvoiceAdvanceUsed(0);
                                          setInvoiceAvailableBalance({ advanceBalance: balance?.advanceBalance || 0 });
                                          setShowInvoicePayModal(true);
                                        }}
                                        className="w-full px-3 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
                                      >
                                        <DollarSign className="w-3.5 h-3.5" />
                                        Pay Pending
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Date */}
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
                                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{isFromBilling ? 'Billed' : 'Date'}: {item.date}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : activeTab === 'communication' ? (
              <div className="space-y-4">
                {/* Send Package Link Button */}
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Create Package</h3>
                        <p className="text-xs text-gray-500">Send a link for patient to select treatments</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendPackageLink()}
                      disabled={sendingPackageLink}
                      className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {sendingPackageLink ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Send Link
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Send Consent Form Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <ClipboardCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Send Consent Form</h3>
                        <p className="text-xs text-gray-500">Send a digital consent form to sign</p>
                      </div>
                    </div>
                   
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <select
                        value={selectedConsentId}
                        onChange={(e) => setSelectedConsentId(e.target.value)}
                        disabled={sendingConsent || consentSent}
                        className="flex-1 sm:w-64 px-3 py-2 text-xs border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Select Consent Form</option>
                        {consentForms.map((form: any) => (
                          <option key={form._id} value={form._id}>
                            {form.formName}
                          </option>
                        ))}
                      </select>
                     
                      <button
                        onClick={handleSendConsentMsgOnWhatsapp}
                        disabled={!selectedConsentId || sendingConsent || consentSent}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                      >
                        {sendingConsent ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Sending...
                          </>
                        ) : consentSent ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            Sent
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Send Form
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Two-Section Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Section 1: Progress Notes & Prescriptions */}
                  <div className="space-y-4">
                    {/* Progress Notes */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">Progress Notes</h3>
                            <p className="text-[10px] text-gray-500">Clinical progress notes history</p>
                          </div>
                          {progressNotes.length > 0 && (
                            <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              {progressNotes.length}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                        {loadingProgressNotes ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        ) : progressNotes.length === 0 ? (
                          <div className="text-center py-8">
                            <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No progress notes yet</p>
                          </div>
                        ) : (
                          progressNotes.map((note: any, idx: number) => (
                            <div key={note._id || idx} className="p-3 rounded-lg border border-blue-100 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5 text-blue-600" />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-900">
                                    {typeof note.doctorId === 'object' ? note.doctorId.name : 'Doctor'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-500">
                                  {new Date(note.noteDate || note.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 line-clamp-3">{note.note}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Prescriptions */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Pill className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">Prescriptions</h3>
                            <p className="text-[10px] text-gray-500">Medication prescriptions history</p>
                          </div>
                          {prescriptions.length > 0 && (
                            <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                              {prescriptions.length}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                        {loadingPrescriptions ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                          </div>
                        ) : prescriptions.length === 0 ? (
                          <div className="text-center py-8">
                            <Pill className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No prescriptions yet</p>
                          </div>
                        ) : (
                          prescriptions.map((rx: any, idx: number) => (
                            <div key={rx._id || idx} className="p-3 rounded-lg border border-purple-100 bg-purple-50/30 hover:bg-purple-50/50 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-900">
                                    {typeof rx.doctorId === 'object' ? rx.doctorId.name : 'Doctor'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-500">
                                  {new Date(rx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <div className="space-y-1">
                                {rx.medicines && rx.medicines.length > 0 && (
                                  <div className="text-[10px] text-gray-700">
                                    <div className="space-y-1.5">
                                      {rx.medicines.slice(0, 3).map((med: any, mIdx: number) => (
                                        <div key={mIdx} className="bg-white/50 rounded px-2 py-1.5 border border-purple-100">
                                          <div className="flex items-center gap-1.5 mb-1">
                                            <Pill className="w-2.5 h-2.5 text-purple-600 flex-shrink-0" />
                                            <span className="font-semibold text-gray-900">{med.medicineName || 'N/A'}</span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 ml-4 text-[9px]">
                                            {med.dosage && (
                                              <div className="flex items-center gap-1">
                                                <span className="text-gray-500">Dosage:</span>
                                                <span className="font-medium text-gray-800">{med.dosage}</span>
                                              </div>
                                            )}
                                            {med.duration && (
                                              <div className="flex items-center gap-1">
                                                <span className="text-gray-500">Duration:</span>
                                                <span className="font-medium text-gray-800">{med.duration}</span>
                                              </div>
                                            )}
                                            {med.notes && (
                                              <div className="col-span-2 flex items-start gap-1">
                                                <span className="text-gray-500">Notes:</span>
                                                <span className="font-medium text-gray-800">{med.notes}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    {rx.medicines.length > 3 && (
                                      <p className="text-[10px] text-gray-500 mt-2 italic">+{rx.medicines.length - 3} more medications...</p>
                                    )}
                                  </div>
                                )}
                                {rx.aftercareInstructions && (
                                  <div className="mt-2 pt-2 border-t border-purple-100">
                                    <p className="text-[10px] text-gray-600 italic">
                                      <span className="font-semibold">Aftercare:</span> {rx.aftercareInstructions}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Consent Form Status & Created Packages */}
                  <div className="space-y-4">
                    {/* Consent Form Status */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <ClipboardCheck className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">Consent Form Status</h3>
                            <p className="text-[10px] text-gray-500">Signed and sent consent forms</p>
                          </div>
                          {consentStatuses.length > 0 && (
                            <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              {consentStatuses.length}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                        {loadingConsentStatus ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                          </div>
                        ) : consentStatuses.length === 0 ? (
                          <div className="text-center py-8">
                            <ClipboardCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No consent forms sent yet</p>
                          </div>
                        ) : (
                          consentStatuses.map((consent: any, idx: number) => (
                            <div key={consent._id || idx} className="p-3 rounded-lg border border-green-100 bg-green-50/30 hover:bg-green-50/50 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    consent.status === 'signed' ? 'bg-green-100' : 'bg-yellow-100'
                                  }`}>
                                    {consent.status === 'signed' ? (
                                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                    ) : (
                                      <Clock className="w-3.5 h-3.5 text-yellow-600" />
                                    )}
                                  </div>
                                  <span className="text-xs font-semibold text-gray-900 truncate flex-1 ml-2">
                                    {consent.consentFormName || consent.formName || 'Consent Form'}
                                  </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ml-2 ${
                                  consent.status === 'signed'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {consent.status === 'signed' ? 'Signed' : 'Sent'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                {consent.signedAt && (
                                  <p className="text-[10px] text-gray-500">
                                    Signed: {new Date(consent.signedAt).toLocaleDateString('en-GB')}
                                  </p>
                                )}
                                <button
                                  onClick={() => {
                                    const url = getConsentUrl(consent.consentFormId);
                                    if (url) window.open(url, '_blank');
                                  }}
                                  className="ml-auto flex items-center gap-1.5 px-2 py-1 bg-white border border-green-200 text-green-700 rounded-md text-[10px] font-semibold hover:bg-green-50 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Open Form
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Created Packages */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                            <Package className="w-4 h-4 text-teal-600" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">Created Packages</h3>
                            <p className="text-[10px] text-gray-500">Patient-created treatment packages</p>
                          </div>
                          {createdPackages.length > 0 && (
                            <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                              {createdPackages.length}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                        {loadingCreatedPackages ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                          </div>
                        ) : createdPackages.length === 0 ? (
                          <div className="text-center py-8">
                            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No packages created yet</p>
                          </div>
                        ) : (
                          createdPackages.map((pkg: any, idx: number) => (
                            <div key={pkg._id || idx} className="p-3 rounded-lg border border-teal-100 bg-teal-50/30 hover:bg-teal-50/50 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="text-xs font-bold text-gray-900 mb-0.5">{pkg.packageName}</h4>
                                  <p className="text-[10px] text-gray-500">
                                    Created: {new Date(pkg.createdAt).toLocaleDateString('en-GB')}
                                  </p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ml-2 ${
                                  pkg.approvalStatus === 'approved'
                                    ? 'bg-green-100 text-green-700'
                                    : pkg.approvalStatus === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {pkg.approvalStatus}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                                <div>
                                  <span className="text-gray-500">Sessions:</span>
                                  <span className="ml-1 font-semibold text-gray-900">{pkg.totalSessions}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Total Price:</span>
                                  <span className="ml-1 font-bold text-teal-600">{getCurrencySymbol(pkg.currency)}{pkg.totalPrice?.toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Treatment Breakdown */}
                              {pkg.treatments && pkg.treatments.length > 0 && (
                                <div className="mt-2 space-y-2 border-t border-teal-100 pt-2">
                                  <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Treatments Selected:</div>
                                  {pkg.treatments.map((t: any, tIdx: number) => (
                                    <div key={tIdx} className="bg-white/50 rounded p-2 border border-teal-50">
                                      <div className="flex justify-between items-start mb-1">
                                        <span className="text-[11px] font-bold text-gray-900">{t.treatmentName}</span>
                                        <span className="text-[10px] font-bold text-teal-700">{t.sessions} {t.sessions === 1 ? 'Session' : 'Sessions'}</span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-500">Session Price:</span>
                                          <span className="font-semibold text-gray-800">{getCurrencySymbol(t.currency)}{t.sessionPrice?.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-500">Allocated Price:</span>
                                          <span className="font-bold text-teal-600">{getCurrencySymbol(t.currency)}{t.allocatedPrice?.toFixed(2)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {pkg.approvalStatus === 'pending' && (
                                <button
                                  onClick={async () => {
                                    const headers = getAuthHeaders();
                                    if (!headers) return alert('Authentication required');
                                    try {
                                      const response = await axios.post('/api/clinic/public-package?action=approve', {
                                        packageId: pkg._id,
                                      }, { headers });
                                      if (response.data.success) {
                                        alert('Package approved successfully!');
                                        fetchCreatedPackages();
                                      }
                                    } catch (error: any) {
                                      alert(error.response?.data?.message || 'Failed to approve package');
                                    }
                                  }}
                                  className="w-full mt-2 py-1.5 px-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] font-semibold rounded-md hover:from-green-600 hover:to-emerald-700 transition-colors flex items-center justify-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Approve Package
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'advance' ? (
              /* Advance & Pending Tab Content */
              <div className="space-y-5">
                {/* Balance Cards Row */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-teal-400 to-cyan-400" />
                  <div className="p-5">
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                     
                      Balance Summary
                    </h3>
                    {balanceLoading ? (
                      <div className="flex items-center gap-2 py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600" />
                        <span className="text-sm text-gray-500">Loading balances...</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {/* Pending */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                       
                          <span className="text-xs font-bold text-amber-700">Pending: {formatAED(balance.pendingBalance)}</span>
                        </div>
                        {/* Advance */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                         
                          <span className="text-xs font-bold text-emerald-700">Advance: {formatAED(balance.advanceBalance)}</span>
                        </div>
                        {/* Pending Claim */}
                        {balance.pendingClaim > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200">
                            <span className="text-xs font-bold text-orange-700">Pending Claim: {formatAED(balance.pendingClaim)}</span>
                          </div>
                        )}
                        {/* Insurance Claim Balance */}
                        {balance.claimAmount > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                            <span className="text-xs font-bold text-blue-700">Insurance Claim: {formatAED(balance.claimAmount)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-teal-600" />
                    Add Payment
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowAddAdvancePaymentModal(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-green-700 hover:shadow-lg active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      Add Advance Balance
                    </button>
                  </div>
                </div>

                {/* Modals */}
              </div>
            ) : (
              /* Default Overview Tab - Compact Professional Dashboard */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                             
                {/* Left Column - Activity Timeline (Compact) - Reduced Width */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 h-full">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className="truncate">Activity Timeline</span>
                    </h3>
                                   
                    <div className={`space-y-2 ${timelineItems.length > 4 ? 'max-h-[280px] overflow-y-auto custom-scrollbar pr-2' : ''}`}>
                      {timelineItems.map((item, index) => (
                        <div key={index} className="relative flex gap-2 pb-3 last:pb-0">
                          {/* Timeline Line */}
                          {index < timelineItems.length - 1 && (
                            <div className="absolute left-2.5 top-6 bottom-0 w-px bg-gray-200" />
                          )}
                                             
                          {/* Icon - Smaller */}
                          <div className={`relative w-5 h-5 rounded-full {getCurrencySymbol(item.currency)}${item.color} flex items-center justify-center flex-shrink-0 shadow-sm z-10`}>
                            <item.icon className="w-2.5 h-2.5 text-white flex-shrink-0" />
                          </div>
                                             
                          {/* Content - More Compact */}
                          <div className="flex-1 min-w-0 bg-gray-50 rounded-md p-2 border border-gray-100">
                            <h4 className="font-medium text-gray-900 text-sm truncate">{item.title}</h4>
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{item.subtitle}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{item.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
             
                {/* Right Column - Stacked Cards (Compact) - Increased Width */}
                <div className="lg:col-span-1 space-y-3">
                               
                  {/* Financial Snapshot - Compact Row Layout */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
                      {/* <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" /> */}
                      Financial Snapshot
                    </h3>
                                       
                    <div className="space-y-2">
                      {/* Total Spent */}
                      <div className="flex items-center justify-between p-2 bg-green-50 border border-green-100 rounded-md">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <TrendingUp className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 font-medium">Total Spent</div>
                            <div className="text-lg font-bold text-gray-900">{getCurrencySymbol(currency)}{financialData.totalSpent.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>

                      {/* Pending Claim */}
                      {balance.pendingClaim > 0 && (
                        <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-100 rounded-md">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                              <svg className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 font-medium">Pending Claim</div>
                              <div className="text-lg font-bold text-orange-700">{formatAED(balance.pendingClaim)}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowPayPendingClaimModal(true)}
                            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold rounded shadow-sm transition-all active:scale-95 flex items-center gap-1"
                          >
                            Pay
                          </button>
                        </div>
                      )}

                  {/* Bundle Offers - Earned Free Sessions */}
                  {!loadingBilling && billingHistory && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Bundle Offers & Free Sessions
                      </h3>
                     
                      <div className="space-y-2">
                        {(() => {
                          // Extract unique bundle offers from billing history
                          const bundleOffers = (billingHistory || [])
                            .filter((b: any) => b.offerType === 'bundle' && b.offerFreeSession && b.offerFreeSession.length > 0)
                            .map((b: any) => ({
                              offerName: b.offerName || b.offerTitle || 'Bundle Offer',
                              offerFreeSession: b.offerFreeSession || [],
                              freeOfferSessionCount: b.freeOfferSessionCount || 0,
                              invoiceNumber: b.invoiceNumber,
                              invoicedDate: b.invoicedDate,
                              treatment: b.treatment,
                              amount: b.amount
                            }));

                          if (bundleOffers.length === 0) {
                            return (
                              <div className="text-center py-3">
                                <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <p className="text-xs text-gray-500">No bundle offers earned yet</p>
                              </div>
                            );
                          }

                          return bundleOffers.map((offer: any, index: number) => (
                            <div key={index} className="p-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-md">
                              <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3.5 h-3.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-purple-900 truncate">
                                    {offer.offerName}
                                  </div>
                                  <div className="text-[10px] text-purple-700 mt-1 font-semibold">
                                    🎁 Free Session{offer.freeOfferSessionCount > 1 ? 's' : ''}: {offer.offerFreeSession.join(', ')}
                                  </div>
                                  <div className="text-[10px] text-purple-600 mt-0.5">
                                    Earned on: {offer.invoicedDate ? new Date(offer.invoicedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                  </div>
                                  <div className="text-[10px] text-purple-500 mt-0.5">
                                    Invoice: {offer.invoiceNumber} • Purchased: {offer.treatment}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                                         
                      {/* Pending Payment */}
                      <div className="flex items-center justify-between p-2 bg-red-50 border border-red-100 rounded-md">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                            <CreditCard className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-700 font-medium">Pending Payment</div>
                            <div className="text-lg font-bold text-red-600">{formatAED(balance.pendingBalance)}</div>
                          </div>
                        </div>
                        {balance.pendingBalance > 0 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setShowUploadImageModal(true)}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold rounded shadow-sm transition-all active:scale-95 flex items-center gap-1"
                              title="Upload payment proof"
                            >
                              <Camera className="w-3 h-3" />
                              Upload
                            </button>
                           
                            <button
                              onClick={() => setShowPayPendingModal(true)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded shadow-sm transition-all active:scale-95 flex items-center gap-1"
                            >
                              Pay
                            </button>
                          </div>
                        )}
                        {uploadError && (
                          <div className="mt-1 text-[10px] text-red-600 font-medium">
                            {uploadError}
                          </div>
                        )}
                      </div>
                                         
                      {/* Advance Balance */}
                      <div className="flex items-center justify-between p-2 bg-teal-50 border border-teal-100 rounded-md">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
                            <Wallet className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-700 font-medium">Advance Balance</div>
                            <div className="text-lg font-bold text-teal-600">{formatAED(balance.advanceBalance)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Claim Amount */}
                      {balance.claimAmount > 0 && (
                        <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-md">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                              <svg className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-xs text-gray-700 font-medium">Insurance Claim Balance</div>
                              <div className="text-lg font-bold text-blue-600">{formatAED(balance.claimAmount)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
             
                  {/* Alerts - Compact Card Style */}
                  {/* <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      Alerts
                    </h3>
                                       
                    <div className="space-y-1.5">
                      {alerts.map((alert, index) => (
                        <div key={index} className={`p-2 rounded-md border-l-2 ${
                          alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                          alert.type === 'danger' ? 'bg-red-50 border-red-400' :
                          'bg-blue-50 border-blue-400'
                        }`}>
                          <div className="flex items-start gap-2">
                            <alert.icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                              alert.type === 'warning' ? 'text-yellow-600' :
                              alert.type === 'danger' ? 'text-red-600' :
                              'text-blue-600'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-900 mb-0.5">
                                {alert.type === 'warning' ? 'Warning' :
                                 alert.type === 'danger' ? 'Critical' :
                                 'Info'}
                              </div>
                              <div className="text-[10px] text-gray-700 leading-tight">
                                {alert.message}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div> */}
             
                  {/* Patient Behavior - Compact with Right-Aligned Values */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      Patient Behavior
                    </h3>
                                       
                    <div className="space-y-2">
                      {behaviorMetrics.map((metric: any, index: number) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600 font-medium">{metric.label}</span>
                            <span className="text-sm font-bold text-gray-900">
                              {metric.displayValue !== null && metric.displayValue !== undefined
                                ? `${metric.displayValue}%`
                                : `${metric.value}%`}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${metric.color} transition-all duration-500`}
                              style={{ width: `${Math.min(100, metric.value)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
             
                </div>
              </div>
            )}
        </div>

        {/* Before/After Modal */}
        {showBeforeAfterModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBeforeAfterModal(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Laser Hair Removal – Before & After</h2>
                <button
                  onClick={() => setShowBeforeAfterModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
             
              {/* Modal Content - Images */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Before Image */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">Before</h3>
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border-2 border-gray-300">
                      <div className="text-center p-6">
                        <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Before Treatment Image</p>
                      </div>
                    </div>
                  </div>
                 
                  {/* After Image */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">After</h3>
                    <div className="aspect-square bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center border-2 border-teal-300">
                      <div className="text-center p-6">
                        <FileImage className="w-16 h-16 text-teal-600 mx-auto mb-3" />
                        <p className="text-teal-700 text-sm">After Treatment Image</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
             
              {/* Modal Footer - Close Button */}
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowBeforeAfterModal(false)}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Modals */}
        <AddPatientAdvancePaymentModal
          isOpen={showAddAdvancePaymentModal}
          onClose={() => setShowAddAdvancePaymentModal(false)}
          patientId={patientData._id}
          patientName={`${patientData.firstName} ${patientData.lastName}`}
          onSuccess={async () => {
            const updated = await fetchPatientBalance(patientData._id);
            if (updated) setBalance(updated as typeof balance);
          }}
        />
        <AddPatientPastAdvancePaymentModal
          isOpen={showAddPastAdvancePayment50PercentModal}
          onClose={() => setShowAddPastAdvancePayment50PercentModal(false)}
          patientId={patientData._id}
          patientName={`${patientData.firstName} ${patientData.lastName}`}
          onSuccess={async () => {
            const updated = await fetchPatientBalance(patientData._id);
            if (updated) setBalance(updated as typeof balance);
          }}
          pastAdvanceType="50% Offer"
          primaryColor="amber"
        />
        <AddPatientPastAdvancePaymentModal
          isOpen={showAddPastAdvancePayment54PercentModal}
          onClose={() => setShowAddPastAdvancePayment54PercentModal(false)}
          patientId={patientData._id}
          patientName={`${patientData.firstName} ${patientData.lastName}`}
          onSuccess={async () => {
            const updated = await fetchPatientBalance(patientData._id);
            if (updated) setBalance(updated as typeof balance);
          }}
          pastAdvanceType="54% Offer"
          primaryColor="blue"
        />
        <AddPatientPastAdvancePaymentModal
          isOpen={showAddPastAdvancePayment159FlatModal}
          onClose={() => setShowAddPastAdvancePayment159FlatModal(false)}
          patientId={patientData._id}
          patientName={`${patientData.firstName} ${patientData.lastName}`}
          onSuccess={async () => {
            const updated = await fetchPatientBalance(patientData._id);
            if (updated) setBalance(updated as typeof balance);
          }}
          pastAdvanceType="159 Flat"
          primaryColor="purple"
        />
        <PayPendingBalanceModal
          isOpen={showPayPendingModal}
          onClose={() => setShowPayPendingModal(false)}
          patientId={patientData._id}
          patientName={`${patientData.firstName} ${patientData.lastName}`}
          pendingBalance={balance.pendingBalance}
          onSuccess={async (_paymentData: any) => {
            // Store the previous pending balance before update
            const prevBalance = balance.pendingBalance;
           
            const updated = await fetchPatientBalance(patientData._id);
            if (updated) {
              const newPendingBalance = Number(updated.pendingBalance || 0);
              setBalance(updated as typeof balance);
             
              // If pending balance decreased, it means payment was successful
              if (newPendingBalance < prevBalance) {
                // CRITICAL: Refresh billing history FIRST to get the latest data
                const refreshedBillings = await fetchBillingHistory();
               
                // Use the refreshed billing history (or fallback to current state)
                const billingsToCheck = refreshedBillings || billingHistory || [];
               
                // Get all invoice numbers from billing history that have pending amount
                const pendingInvoices = billingsToCheck
                  .filter((b: any) => {
                    const amount = parseFloat(b.amount) || 0;
                    const paid = parseFloat(b.paid || b.paidAmount || 0) || 0;
                    const isAdvance = b.isAdvanceOnly ||
                                     b.treatment === "Advance Payment" ||
                                     b.treatment === "Historical Advance Balance";
                    return !isAdvance && (amount - paid) > 0;
                  })
                  .map((b: any) => b.invoiceNumber || b.invoiceNo || b._id?.slice(-8).toUpperCase() || '');
               
                // Add these invoices to manually paid set
                if (pendingInvoices.length > 0) {
                  setManuallyPaidInvoices(prev => {
                    const updated = new Set(prev);
                    pendingInvoices.forEach((inv: string) => updated.add(inv));
                    return updated;
                  });
                }
              } else {
                // Even if balance didn't change, still refresh billing history
                await fetchBillingHistory();
              }
            }
          }}
        />

        {/* Payment History Modal */}
        {showPaymentHistoryModal && selectedPaymentHistoryBilling && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowPaymentHistoryModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Payment History</h3>
                  <p className="text-xs text-indigo-200">{selectedPaymentHistoryBilling.invoiceNumber || 'Invoice Details'}</p>
                </div>
                <button
                  onClick={() => setShowPaymentHistoryModal(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Invoice Summary Card */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Total Amount</p>
                    <p className="text-lg font-bold text-gray-900">{getCurrencySymbol(currency)}{Number(selectedPaymentHistoryBilling.amount || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Paid</p>
                    <p className="text-lg font-bold text-green-600">{getCurrencySymbol(currency)}{Number(selectedPaymentHistoryBilling.paid || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Pending</p>
                    <p className="text-lg font-bold text-red-600">{getCurrencySymbol(currency)}{Number(selectedPaymentHistoryBilling.pending || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Payment Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${
                      selectedPaymentHistoryBilling.pending === 0 
                        ? 'bg-green-100 text-green-700' 
                        : selectedPaymentHistoryBilling.paid > 0 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedPaymentHistoryBilling.pending === 0 ? 'Completed' : selectedPaymentHistoryBilling.paid > 0 ? 'Partial' : 'Unpaid'}
                    </span>
                  </div>
                </div> */}

                {/* Invoice Details */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Service</p>
                    <p className="font-semibold text-gray-700">{selectedPaymentHistoryBilling.service || 'Treatment'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Invoiced Date</p>
                    <p className="font-semibold text-gray-700">
                      {selectedPaymentHistoryBilling.invoicedDate 
                        ? new Date(selectedPaymentHistoryBilling.invoicedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Invoiced By</p>
                    <p className="font-semibold text-gray-700">{selectedPaymentHistoryBilling.invoicedBy || 'N/A'}</p>
                  </div>
                </div>

                {/* Package/Treatment Info */}
                {(selectedPaymentHistoryBilling.package || selectedPaymentHistoryBilling.treatment) && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-[10px] text-gray-500 uppercase mb-1">{selectedPaymentHistoryBilling.service === 'Package' ? 'Package' : 'Treatment'}</p>
                    <p className="text-sm font-bold text-indigo-700">{selectedPaymentHistoryBilling.package || selectedPaymentHistoryBilling.treatment}</p>
                    {selectedPaymentHistoryBilling.selectedPackageTreatments && selectedPaymentHistoryBilling.selectedPackageTreatments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedPaymentHistoryBilling.selectedPackageTreatments.map((treatment: any, idx: number) => (
                          <span key={idx} className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] rounded-full">
                            {treatment.treatmentName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Discount & Offer Info */}
                {(selectedPaymentHistoryBilling.discountPercent > 0 || selectedPaymentHistoryBilling.membershipDiscountApplied > 0 || selectedPaymentHistoryBilling.doctorDiscountAmount > 0 || selectedPaymentHistoryBilling.agentDiscountAmount > 0) && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {selectedPaymentHistoryBilling.discountPercent > 0 && (
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <p className="text-[9px] text-amber-600 uppercase font-bold">Offer Discount</p>
                        <p className="text-sm font-bold text-amber-700">{selectedPaymentHistoryBilling.discountPercent}%</p>
                      </div>
                    )}
                    {selectedPaymentHistoryBilling.membershipDiscountApplied > 0 && (
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <p className="text-[9px] text-blue-600 uppercase font-bold">Membership</p>
                        <p className="text-sm font-bold text-blue-700">{getCurrencySymbol(currency)}{selectedPaymentHistoryBilling.membershipDiscountApplied}</p>
                      </div>
                    )}
                    {selectedPaymentHistoryBilling.doctorDiscountAmount > 0 && (
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <p className="text-[9px] text-purple-600 uppercase font-bold">Doctor Disc.</p>
                        <p className="text-sm font-bold text-purple-700">{getCurrencySymbol(currency)}{selectedPaymentHistoryBilling.doctorDiscountAmount}</p>
                      </div>
                    )}
                    {selectedPaymentHistoryBilling.agentDiscountAmount > 0 && (
                      <div className="p-2 bg-teal-50 rounded-lg">
                        <p className="text-[9px] text-teal-600 uppercase font-bold">Agent Disc.</p>
                        <p className="text-sm font-bold text-teal-700">{getCurrencySymbol(currency)}{selectedPaymentHistoryBilling.agentDiscountAmount}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Cashback Info */}
                {selectedPaymentHistoryBilling.cashbackEarned > 0 && (
                  <div className="mt-3 flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                    <div className="p-1.5 bg-emerald-100 rounded-full">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-600 uppercase font-bold">Cashback Earned</p>
                      <p className="text-sm font-bold text-emerald-700">{getCurrencySymbol(currency)}{selectedPaymentHistoryBilling.cashbackEarned}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Details Section */}
              <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-300px)]">
                {/* All Payments from multiplePayments array */}
                {selectedPaymentHistoryBilling.multiplePayments && selectedPaymentHistoryBilling.multiplePayments.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 rounded-full">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                      </div>
                      All Payments ({selectedPaymentHistoryBilling.multiplePayments.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedPaymentHistoryBilling.multiplePayments.map((payment: any, idx: number) => (
                        <div key={idx} className="relative">
                          {/* Payment Card */}
                          <div className={`p-4 rounded-xl border-2 ${
                            payment.transactionType === 'ADVANCE_USAGE' 
                              ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' 
                              : payment.transactionType === 'CLAIM_USAGE'
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                                : payment.transactionType === 'PENDING_CLEARANCE'
                                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                                  : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {/* Payment Method Icon */}
                                <div className={`p-2.5 rounded-xl ${
                                  payment.paymentMethod === 'Cash' ? 'bg-green-100' :
                                  payment.paymentMethod === 'Card' ? 'bg-blue-100' :
                                  payment.paymentMethod === 'Advance Balance' ? 'bg-amber-100' :
                                  payment.paymentMethod === 'Insurance' || payment.paymentMethod === 'Claim' ? 'bg-purple-100' :
                                  'bg-gray-100'
                                }`}>
                                  {payment.paymentMethod === 'Cash' && <span className="text-lg">💵</span>}
                                  {payment.paymentMethod === 'Card' && <span className="text-lg">💳</span>}
                                  {payment.paymentMethod === 'Advance Balance' && <Wallet className="w-5 h-5 text-amber-600" />}
                                  {(payment.paymentMethod === 'Insurance' || payment.paymentMethod === 'Claim') && <span className="text-lg">🏥</span>}
                                  {!['Cash', 'Card', 'Advance Balance', 'Insurance', 'Claim'].includes(payment.paymentMethod) && <CreditCard className="w-5 h-5 text-gray-600" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-800">{payment.paymentMethod}</p>
                                  <p className="text-[10px] text-gray-500">
                                    {payment.paidAt ? new Date(payment.paidAt).toLocaleString('en-US', { 
                                      month: 'short', day: 'numeric', year: 'numeric', 
                                      hour: '2-digit', minute: '2-digit' 
                                    }) : 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-gray-900">{getCurrencySymbol(currency)}{Number(payment.amount || 0).toLocaleString()}</p>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  payment.transactionType === 'ADVANCE_USAGE' ? 'bg-amber-100 text-amber-700' :
                                  payment.transactionType === 'CLAIM_USAGE' ? 'bg-blue-100 text-blue-700' :
                                  payment.transactionType === 'PENDING_CLEARANCE' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {payment.transactionType === 'ADVANCE_USAGE' ? 'Advance' :
                                   payment.transactionType === 'CLAIM_USAGE' ? 'Claim' :
                                   payment.transactionType === 'PENDING_CLEARANCE' ? 'Pending Clear' :
                                   'Payment'}
                                </span>
                              </div>
                            </div>
                            {/* Transaction Details */}
                            <div className="mt-3 pt-3 border-t border-gray-200/50 grid grid-cols-3 gap-2">
                              <div>
                                <p className="text-[9px] text-gray-400 uppercase">Transaction Type</p>
                                <p className="text-xs font-semibold text-gray-600">{payment.transactionType || 'PAYMENT'}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-gray-400 uppercase">Paid By</p>
                                <p className="text-xs font-semibold text-gray-600">{payment.paidByName || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-gray-400 uppercase">Method Index</p>
                                <p className="text-xs font-semibold text-gray-600">#{idx + 1}</p>
                              </div>
                            </div>
                          </div>
                          {/* Timeline connector */}
                          {idx < selectedPaymentHistoryBilling.multiplePayments.length - 1 && (
                            <div className="absolute left-1/2 -bottom-3 w-0.5 h-3 bg-gray-300"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment History from billing records */}
                {selectedPaymentHistoryBilling.paymentHistory && selectedPaymentHistoryBilling.paymentHistory.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 rounded-full">
                        <ClipboardList className="w-4 h-4 text-purple-600" />
                      </div>
                      Payment History Timeline ({selectedPaymentHistoryBilling.paymentHistory.length})
                    </h4>
                    <div className="relative pl-6 space-y-4 border-l-2 border-purple-200">
                      {selectedPaymentHistoryBilling.paymentHistory.map((history: any, hIdx: number) => (
                        <div key={hIdx} className="relative">
                          {/* Timeline dot */}
                          <div className={`absolute -left-[25px] w-4 h-4 rounded-full border-2 ${
                            history.status === 'Completed' ? 'bg-green-500 border-green-500' :
                            history.status === 'Active' ? 'bg-amber-500 border-amber-500' :
                            'bg-gray-400 border-gray-400'
                          }`}>
                            {history.status === 'Completed' && (
                              <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
                            )}
                          </div>
                          
                          {/* History Card */}
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  history.transactionType === 'PENDING_CLEARANCE' ? 'bg-green-100 text-green-700' :
                                  history.transactionType === 'PARTIAL_PAYMENT' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {history.transactionType === 'PENDING_CLEARANCE' ? '✓ Completed' :
                                   history.transactionType === 'PARTIAL_PAYMENT' ? '⏳ Partial' :
                                   history.transactionType || 'Payment'}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">{getCurrencySymbol(currency)}{Number(history.amountPaid || history.paid || 0).toLocaleString()}</p>
                                <p className="text-[9px] text-gray-400">
                                  {history.updatedAt ? new Date(history.updatedAt).toLocaleString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                  }) : 'N/A'}
                                </p>
                              </div>
                            </div>

                            {/* Payment Summary */}
                            <div className="grid grid-cols-4 gap-2 mb-3">
                              <div className="bg-white/50 rounded-lg p-2 text-center">
                                <p className="text-[9px] text-gray-400 uppercase">Total</p>
                                <p className="text-xs font-bold text-gray-700">{getCurrencySymbol(currency)}{Number(history.amount || 0).toLocaleString()}</p>
                              </div>
                              {/* <div className="bg-white/50 rounded-lg p-2 text-center">
                                <p className="text-[9px] text-gray-400 uppercase">Paid</p>
                                <p className="text-xs font-bold text-green-600">{getCurrencySymbol(currency)}{Number(history.paid || 0).toLocaleString()}</p>
                              </div>
                              <div className="bg-white/50 rounded-lg p-2 text-center">
                                <p className="text-[9px] text-gray-400 uppercase">Pending</p>
                                <p className="text-xs font-bold text-red-600">{getCurrencySymbol(currency)}{Number(history.pending || 0).toLocaleString()}</p>
                              </div>
                              <div className="bg-white/50 rounded-lg p-2 text-center">
                                <p className="text-[9px] text-gray-400 uppercase">Remaining</p>
                                <p className="text-xs font-bold text-amber-600">{getCurrencySymbol(currency)}{Number(history.remainingPending || 0).toLocaleString()}</p>
                              </div> */}
                            </div>

                            {/* Payment Methods in this history */}
                            {history.multiplePayments && history.multiplePayments.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-purple-100">
                                <p className="text-[10px] text-purple-600 font-bold mb-2">Payment Breakdown:</p>
                                <div className="flex flex-wrap gap-2">
                                  {history.multiplePayments.map((mp: any, mpIdx: number) => (
                                    <div key={mpIdx} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${
                                      mp.transactionType === 'ADVANCE_USAGE' ? 'bg-amber-100 text-amber-700' :
                                      mp.transactionType === 'CLAIM_USAGE' ? 'bg-blue-100 text-blue-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {mp.paymentMethod}
                                      <span className="font-bold">{getCurrencySymbol(currency)}{Number(mp.amount || 0).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                                {history.advanceAmountUsed > 0 && (
                                  <div className="mt-2 flex items-center gap-1 text-[9px] text-amber-600">
                                    <Wallet className="w-3 h-3" />
                                    <span>Advance Used: {getCurrencySymbol(currency)}{history.advanceAmountUsed}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Paid By Info */}
                            <div className="mt-3 pt-3 border-t border-purple-100/50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-purple-700">
                                    {(history.paidByName || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-600">{history.paidByName || 'Unknown'}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                history.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {history.status || 'Active'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Billing Info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Additional Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Advance Balance Used</p>
                      <p className="text-sm font-bold text-gray-700">{getCurrencySymbol(currency)}{Number(selectedPaymentHistoryBilling.advanceUsed || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Claim Amount Used</p>
                      <p className="text-sm font-bold text-gray-700">{getCurrencySymbol(currency)}{Number(selectedPaymentHistoryBilling.claimAmountUsed || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Pending Used</p>
                      <p className="text-sm font-bold text-gray-700">{getCurrencySymbol(currency)}{Number(selectedPaymentHistoryBilling.pendingUsed || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Cashback Wallet Used</p>
                      <p className="text-sm font-bold text-gray-700">{getCurrencySymbol(currency)}{Number(selectedPaymentHistoryBilling.cashbackWalletUsed || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Notes */}
                  {selectedPaymentHistoryBilling.notes && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-[10px] text-amber-600 uppercase font-bold mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{selectedPaymentHistoryBilling.notes}</p>
                    </div>
                  )}

                  {/* Offer Applied */}
                  {selectedPaymentHistoryBilling.offerApplied && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <p className="text-[10px] text-indigo-600 uppercase font-bold mb-1">Offer Applied</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-indigo-700">{selectedPaymentHistoryBilling.offerName || selectedPaymentHistoryBilling.offerType || 'Special Offer'}</span>
                        {selectedPaymentHistoryBilling.offerDiscountAmount > 0 && (
                          <span className="text-xs text-indigo-600">({getCurrencySymbol(currency)}{selectedPaymentHistoryBilling.offerDiscountAmount} off)</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bundle Sessions */}
                  {selectedPaymentHistoryBilling.bundleSessionsAdded > 0 && (
                    <div className="mt-3 p-3 bg-teal-50 rounded-lg border border-teal-100">
                      <p className="text-[10px] text-teal-600 uppercase font-bold mb-1">Bundle Sessions Added</p>
                      <p className="text-lg font-bold text-teal-700">{selectedPaymentHistoryBilling.bundleSessionsAdded} Free Sessions</p>
                    </div>
                  )}

                  {/* Refund Info */}
                  {selectedPaymentHistoryBilling.isOfferRefunded && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-bold text-red-700">Offer Refunded</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[9px] text-red-400">Refunded Amount</p>
                          <p className="font-bold text-red-700">{getCurrencySymbol(currency)}{Number(selectedPaymentHistoryBilling.refundedAmount || 0).toLocaleString()}</p>
                        </div>
                        {selectedPaymentHistoryBilling.refundedAt && (
                          <div>
                            <p className="text-[9px] text-red-400">Refunded Date</p>
                            <p className="font-bold text-red-700">
                              {new Date(selectedPaymentHistoryBilling.refundedAt).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <p>Invoice: {selectedPaymentHistoryBilling.invoiceNumber}</p>
                  <p>Created: {selectedPaymentHistoryBilling.createdAt ? new Date(selectedPaymentHistoryBilling.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                <button
                  onClick={() => setShowPaymentHistoryModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-bold text-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pay Pending Claim Modal */}
        {showPayPendingClaimModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => { if (!payingPendingClaim) { setShowPayPendingClaimModal(false); setPendingClaimPayAmount(""); setPendingClaimPayMethod("Cash"); }}} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-bold text-white">Pay Pending Claim</h3>
                  <p className="text-orange-100 text-xs mt-0.5">Total pending: {formatAED(balance.pendingClaim)}</p>
                </div>
                <button onClick={() => { setShowPayPendingClaimModal(false); setPendingClaimPayAmount(""); setPendingClaimPayMethod("Cash"); }} className="text-white/80 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Quick Select */}
                <div className="flex gap-2">
                  <button onClick={() => setPendingClaimPayAmount((balance.pendingClaim / 2).toFixed(2))} className="flex-1 py-1.5 text-xs font-semibold border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50">Half</button>
                  <button onClick={() => setPendingClaimPayAmount(balance.pendingClaim.toFixed(2))} className="flex-1 py-1.5 text-xs font-semibold bg-orange-100 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-200">Full Amount</button>
                </div>
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={pendingClaimPayAmount}
                    onChange={(e) => setPendingClaimPayAmount(e.target.value)}
                    placeholder={`Max: ${balance.pendingClaim}`}
                    min="0"
                    max={balance.pendingClaim}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Cash", "Card", "BT"].map((m) => (
                      <button key={m} onClick={() => setPendingClaimPayMethod(m)} className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${ pendingClaimPayMethod === m ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-600 border-gray-300 hover:border-orange-400" }`}>{m}</button>
                    ))}
                  </div>
                </div>
                {/* Submit */}
                <button
                  disabled={payingPendingClaim || !pendingClaimPayAmount || Number(pendingClaimPayAmount) <= 0 || Number(pendingClaimPayAmount) > balance.pendingClaim}
                  onClick={async () => {
                    const payAmt = Number(pendingClaimPayAmount);
                    if (!payAmt || payAmt <= 0 || payAmt > balance.pendingClaim) return;
                    setPayingPendingClaim(true);
                    try {
                      const headers = getAuthHeaders();
                      // Fetch insurance claims fresh (may not be loaded if not on insurance tab)
                      let claimsToSearch = insuranceClaims;
                      if (!claimsToSearch || claimsToSearch.length === 0) {
                        const claimsRes = await axios.get(`/api/clinic/insurance-claims?patientId=${patientData._id}`, { headers });
                        claimsToSearch = claimsRes.data.success ? (claimsRes.data.data || []) : [];
                      }
                      // Find the claim with highest pendingClaim to pay against
                      const claimToPay = [...claimsToSearch]
                        .filter((c: any) => (c.pendingClaim || 0) > 0)
                        .sort((a: any, b: any) => b.pendingClaim - a.pendingClaim)[0];
                      if (!claimToPay) { alert("No pending claim found"); setPayingPendingClaim(false); return; }
                      const res = await axios.post("/api/clinic/insurance-claims/pay-pending-claim", {
                        claimId: claimToPay._id,
                        amount: payAmt,
                        paymentMethod: pendingClaimPayMethod,
                      }, { headers });
                      if (res.data.success) {
                        setShowPayPendingClaimModal(false);
                        setPendingClaimPayAmount("");
                        setPendingClaimPayMethod("Cash");
                        // Refresh balance and insurance claims
                        const updatedBalance = await fetchPatientBalance(patientData._id);
                        if (updatedBalance) setBalance(updatedBalance as typeof balance);
                        await fetchInsuranceClaims();
                      } else {
                        alert(res.data.message || "Payment failed");
                      }
                    } catch (err: any) {
                      alert(err.response?.data?.message || "Payment failed");
                    } finally {
                      setPayingPendingClaim(false);
                    }
                  }}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all"
                >
                  {payingPendingClaim ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pay Invoice Pending Modal */}
        {showInvoicePayModal && selectedInvoiceForPayment && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
              onClick={() => { 
                if (!payingInvoicePending) { 
                  setShowInvoicePayModal(false); 
                  setSelectedInvoiceForPayment(null); 
                  setInvoicePayAmount(""); 
                  setInvoicePayMethod("Cash");
                  setInvoiceUseAdvanceBalance(false);
                  setInvoiceAdvanceUsed(0);
                }
              }} 
            />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-bold text-white">Pay Invoice Pending</h3>
                  <p className="text-red-100 text-xs mt-0.5">Invoice: {selectedInvoiceForPayment.invoiceNumber}</p>
                </div>
                <button 
                  onClick={() => { 
                    setShowInvoicePayModal(false); 
                    setSelectedInvoiceForPayment(null); 
                    setInvoicePayAmount(""); 
                    setInvoicePayMethod("Cash");
                    setInvoiceUseAdvanceBalance(false);
                    setInvoiceAdvanceUsed(0);
                  }} 
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Invoice Info */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-amber-700 font-semibold">Treatment:</span>
                    <span className="text-sm font-bold text-amber-900">{selectedInvoiceForPayment.treatmentName}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-amber-700 font-semibold">Total Amount:</span>
                    <span className="text-sm font-bold text-amber-900">{getCurrencySymbol(currency)} {selectedInvoiceForPayment.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-amber-700 font-semibold">Paid:</span>
                    <span className="text-sm font-bold text-green-700">{getCurrencySymbol(currency)} {(selectedInvoiceForPayment.paid || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-amber-200">
                    <span className="text-xs text-red-700 font-bold">Pending:</span>
                    <span className="text-lg font-bold text-red-700">{getCurrencySymbol(currency)} {(selectedInvoiceForPayment.pendingAmount || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Quick Select */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const halfAmount = ((selectedInvoiceForPayment.pendingAmount || 0) / 2).toFixed(2);
                      setInvoicePayAmount(halfAmount);
                      // Recalculate with advance balance if enabled
                      if (invoiceUseAdvanceBalance && invoiceAvailableBalance.advanceBalance > 0) {
                        const advanceToUse = Math.min(invoiceAvailableBalance.advanceBalance, Number(halfAmount));
                        setInvoiceAdvanceUsed(advanceToUse);
                        setInvoicePayAmount((Number(halfAmount) - advanceToUse).toFixed(2));
                      }
                    }} 
                    className="flex-1 py-1.5 text-xs font-semibold border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                  >
                    Half
                  </button>
                  <button 
                    onClick={() => {
                      const fullAmount = (selectedInvoiceForPayment.pendingAmount || 0).toFixed(2);
                      setInvoicePayAmount(fullAmount);
                      // Recalculate with advance balance if enabled
                      if (invoiceUseAdvanceBalance && invoiceAvailableBalance.advanceBalance > 0) {
                        const advanceToUse = Math.min(invoiceAvailableBalance.advanceBalance, Number(fullAmount));
                        setInvoiceAdvanceUsed(advanceToUse);
                        setInvoicePayAmount((Number(fullAmount) - advanceToUse).toFixed(2));
                      }
                    }} 
                    className="flex-1 py-1.5 text-xs font-semibold bg-red-100 border border-red-300 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    Full Amount
                  </button>
                </div>

                {/* Advance Balance Option */}
                {invoiceAvailableBalance.advanceBalance > 0 && (
                  <label className="flex items-center justify-between cursor-pointer p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl hover:border-emerald-400 transition-all shadow-sm">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={invoiceUseAdvanceBalance}
                        onChange={(e) => {
                          setInvoiceUseAdvanceBalance(e.target.checked);
                          // Recalculate amount to pay based on entered amount and whether advance is enabled
                          if (e.target.checked && invoicePayAmount) {
                            const enteredAmt = Number(invoicePayAmount) + invoiceAdvanceUsed;
                            const advanceToUse = Math.min(invoiceAvailableBalance.advanceBalance, enteredAmt);
                            setInvoiceAdvanceUsed(advanceToUse);
                            setInvoicePayAmount((enteredAmt - advanceToUse).toFixed(2));
                          } else {
                            setInvoiceAdvanceUsed(0);
                            // Restore the original amount
                            const currentPayAmount = Number(invoicePayAmount);
                            setInvoicePayAmount((currentPayAmount + invoiceAdvanceUsed).toFixed(2));
                          }
                        }}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                      />
                      <div>
                        <div className="text-sm font-bold text-gray-700">Use Advance Balance</div>
                        <div className="text-xs text-gray-500">Available: {getCurrencySymbol(currency)}{invoiceAvailableBalance.advanceBalance.toFixed(2)}</div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                      {getCurrencySymbol(currency)} {invoiceAvailableBalance.advanceBalance.toFixed(2)}
                    </span>
                  </label>
                )}

                {/* Advance Balance Summary */}
                {invoiceUseAdvanceBalance && invoiceAdvanceUsed > 0 && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="text-xs font-bold text-gray-600 uppercase mb-2">Payment Breakdown</div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Original Pending:</span>
                        <span className="font-bold text-gray-800">{getCurrencySymbol(currency)}{(Number(invoicePayAmount) + invoiceAdvanceUsed).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-700">Advance Used:</span>
                        <span className="font-bold text-emerald-700">- {getCurrencySymbol(currency)}{invoiceAdvanceUsed.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-emerald-200 pt-1.5 mt-1.5 flex justify-between items-center">
                        <span className="font-bold text-gray-800">Amount to Pay:</span>
                        <span className="font-bold text-lg text-red-700">{getCurrencySymbol(currency)}{Number(invoicePayAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay</label>
                  <input
                    type="number"
                    value={invoicePayAmount}
                    onChange={(e) => {
                      const enteredValue = e.target.value;
                      if (invoiceUseAdvanceBalance && invoiceAvailableBalance.advanceBalance > 0) {
                        // Calculate the total pending amount (current input + advance already used)
                        const totalPending = Number(enteredValue) + invoiceAdvanceUsed;
                        const advanceToUse = Math.min(invoiceAvailableBalance.advanceBalance, totalPending);
                        setInvoiceAdvanceUsed(advanceToUse);
                        setInvoicePayAmount((totalPending - advanceToUse).toFixed(2));
                      } else {
                        setInvoicePayAmount(enteredValue);
                      }
                    }}
                    placeholder={`Max: ${(selectedInvoiceForPayment.pendingAmount || 0).toFixed(2)}`}
                    min="0"
                    max={selectedInvoiceForPayment.pendingAmount || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Cash", "Card", "BT"].map((m) => (
                      <button 
                        key={m} 
                        onClick={() => setInvoicePayMethod(m)} 
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${ 
                          invoicePayMethod === m 
                            ? "bg-red-600 text-white border-red-600" 
                            : "bg-white text-gray-600 border-gray-300 hover:border-red-400" 
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  disabled={payingInvoicePending || !invoicePayAmount || Number(invoicePayAmount) < 0 || (Number(invoicePayAmount) + invoiceAdvanceUsed) > (selectedInvoiceForPayment.pendingAmount || 0)}
                  onClick={async () => {
                    const payAmt = Number(invoicePayAmount);
                    const advanceUsed = invoiceAdvanceUsed;
                    const maxPending = selectedInvoiceForPayment.pendingAmount || 0;
                    if (payAmt < 0 || (payAmt + advanceUsed) > maxPending) return;
                    
                    setPayingInvoicePending(true);
                    try {
                      const headers = getAuthHeaders();
                      const res = await axios.post(
                        `/api/clinic/billing/pay-invoice-pending/${selectedInvoiceForPayment.data._id}`,
                        {
                          amount: payAmt,
                          paymentMethod: invoicePayMethod,
                          advanceBalanceUsed: advanceUsed,
                          notes: `Payment towards pending balance for invoice ${selectedInvoiceForPayment.invoiceNumber}${advanceUsed > 0 ? `, Advance used: ${advanceUsed}` : ''}`,
                        },
                        { headers }
                      );
                      
                      if (res.data.success) {
                        setShowInvoicePayModal(false);
                        setSelectedInvoiceForPayment(null);
                        setInvoicePayAmount("");
                        setInvoicePayMethod("Cash");
                        setInvoiceUseAdvanceBalance(false);
                        setInvoiceAdvanceUsed(0);
                        
                        // Refresh balance and billing history
                        const updatedBalance = await fetchPatientBalance(patientData._id);
                        if (updatedBalance) setBalance(updatedBalance as typeof balance);
                        await fetchBillingHistory();
                        
                        alert("Payment recorded successfully!");
                      } else {
                        alert(res.data.message || "Payment failed");
                      }
                    } catch (err: any) {
                      console.error("Error paying invoice pending:", err);
                      alert(err.response?.data?.message || "Payment failed");
                    } finally {
                      setPayingInvoicePending(false);
                    }
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all"
                >
                  {payingInvoicePending ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Image Modal */}
        {showUploadImageModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowUploadImageModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Upload Payment Proof</h3>
                    <p className="text-purple-100 text-xs font-medium opacity-80">Upload screenshot of payment</p>
                  </div>
                </div>
                <button onClick={() => setShowUploadImageModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Image
                  </label>
                 
                  {/* Image Preview or Upload Box */}
                  {previewUrl ? (
                    <div className="relative rounded-xl overflow-hidden border-2 border-purple-300 bg-gray-50">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-64 object-contain"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-white text-xs font-medium">
                              {selectedFile?.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                              setPreviewUrl(null);
                              document.getElementById('payment-image-input')?.click();
                            }}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-semibold rounded-lg transition-all"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-500 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('payment-image-input')?.click()}
                    >
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                 
                  <input
                    id="payment-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // Validate file size (5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        setUploadError('File size should be less than 5MB');
                        return;
                      }

                      // Validate file type
                      if (!file.type.startsWith('image/')) {
                        setUploadError('Please select a valid image file');
                        return;
                      }

                      // Set preview
                      setSelectedFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setPreviewUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                      setUploadError(null);
                    }}
                  />
                </div>

                {uploadError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <p className="text-xs text-red-600 font-medium">{uploadError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowUploadImageModal(false);
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setUploadError(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  {previewUrl && (
                    <button
                      onClick={async () => {
                        if (!selectedFile) return;
                       
                        setUploadLoading(true);
                        setUploadError(null);

                        try {
                          await handleImageUpload(selectedFile);
                          setShowUploadImageModal(false);
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          setUploadError(null);
                          // Switch to Media tab and Payment Proofs sub-tab to show the uploaded image
                          setActiveTab('media');
                          setMediaSubTab('payment-proofs');
                        } catch (error: any) {
                          setUploadError(error?.message || 'Failed to upload image');
                        } finally {
                          setUploadLoading(false);
                        }
                      }}
                      disabled={uploadLoading}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-purple-400 disabled:to-indigo-400 text-white rounded-xl font-semibold transition-all text-sm shadow-md disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {uploadLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          Upload
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Viewer Modal */}
        {docViewerUrl && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md">
            <div className="absolute top-4 right-4 flex items-center gap-3 z-20">
              <button
                onClick={() => setDocViewerUrl(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="w-full max-w-5xl h-[85vh] flex items-center justify-center">
              {docViewerUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={docViewerUrl}
                  className="w-full h-full rounded-lg shadow-2xl bg-white"
                  title="Document Preview"
                />
              ) : (
                <img
                  src={docViewerUrl}
                  alt="Document Preview"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              )}
            </div>
          </div>
        )}

        {/* Image Viewer Modal */}
        {showImageViewer && balance.pendingBalanceImages && balance.pendingBalanceImages.length > 0 && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md">
            <div className="absolute top-4 right-4 flex items-center gap-3 z-20">
              <button
                onClick={() => setShowImageViewer(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Previous button */}
            {selectedImageIndex > 0 && (
              <button
                onClick={() => setSelectedImageIndex(selectedImageIndex - 1)}
                className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
              >
                <ChevronDown className="w-6 h-6 rotate-90" />
              </button>
            )}

            {/* Next button */}
            {selectedImageIndex < balance.pendingBalanceImages.length - 1 && (
              <button
                onClick={() => setSelectedImageIndex(selectedImageIndex + 1)}
                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
              >
                <ChevronDown className="w-6 h-6 -rotate-90" />
              </button>
            )}

            {/* Image */}
            <div className="max-w-5xl max-h-[90vh]">
              <img
                src={balance.pendingBalanceImages[selectedImageIndex]}
                alt={`Payment proof ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
              <div className="text-center mt-4">
                <p className="text-white text-sm font-medium">
                  Image {selectedImageIndex + 1} of {balance.pendingBalanceImages.length}
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

// Add animation styles
if (typeof document !== 'undefined') {
  const styleId = 'patient-profile-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes scaleIn {
        from {
          transform: scale(0.9);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
      .animate-scaleIn {
        animation: scaleIn 0.2s ease-out;
      }
    `;
    document.head.appendChild(style);
  }
}

// Main Page Component
function PatientProfileView() {
  const router = useRouter();
  const { id } = router.query;
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) {
        router.push('/clinic/login-clinic');
        return;
      }

      // Fetch patient data and balance in parallel for first render speed
      const [patientRes, balanceRes] = await Promise.all([
        axios.get(`/api/clinic/patient-registration?id=${id}`, { headers }),
        axios.get(`/api/clinic/patient-balance/${id}`, { headers }).catch(() => ({ data: { balances: {} } }))
      ]);

      if (patientRes.data.success && patientRes.data.patient) {
        // Attach balance data to patient object so dashboard can initialize with it
        const patientData = {
          ...patientRes.data.patient,
          initialBalance: balanceRes.data.balances || {}
        };
        setPatient(patientData);
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600"></div>
      </div>
    );
  }

  return (
    <PatientProfileDashboard
      patientData={patient}
      onClose={handleClose}
      onPatientUpdated={(updatedData) => {
        setPatient(updatedData);
      }}
    />
  );
}

PatientProfileView.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedPatientProfileView = withClinicAuth(PatientProfileView) as typeof PatientProfileView;
ProtectedPatientProfileView.getLayout = PatientProfileView.getLayout;

export default ProtectedPatientProfileView;