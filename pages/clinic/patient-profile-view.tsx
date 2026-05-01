import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  Calendar, User, DollarSign, FileText, AlertCircle, Activity,
  CreditCard, TrendingUp, Package, Phone,
  Mail, Clock, Shield, X, CheckCircle, XCircle,
  ExternalLink,
  AlertTriangle, Plus, FileImage, Wallet, ClipboardList, Send, Pill, ClipboardCheck,
  ChevronDown, Search, Loader2, Check,  Camera, Image as ImageIcon, Eye, Edit2, Trash2, Paperclip
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
  return token ? { Authorization: `Bearer ${token}` } : null;
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
  const isRiskyPatient = useMemo(() => {
    return insuranceClaims.some((c: any) => 
      c.pendingClaim && 
      c.pendingClaim !== '-' && 
      Number(c.pendingClaim) > 0
    );
  }, [insuranceClaims]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimViewModal, setClaimViewModal] = useState<any>(null);
  const [claimEditModal, setClaimEditModal] = useState<any>(null);
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
    const [payingPendingClaim, setPayingPendingClaim] = useState(false);
    const [pendingClaimPayAmount, setPendingClaimPayAmount] = useState("");
    const [pendingClaimPayMethod, setPendingClaimPayMethod] = useState("Cash");
  const [treatmentFilter, setTreatmentFilter] = useState<'all' | 'ongoing' | 'completed' | 'pending'>('all');
  
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

  // Create Package state
  const [showCreatePackage, setShowCreatePackage] = useState(false);
  const [pkgModalName, setPkgModalName] = useState("");
  const [pkgModalPrice, setPkgModalPrice] = useState("");
  const [pkgModalValidityInMonths, setPkgModalValidityInMonths] = useState("");
  const [pkgModalStartDate, setPkgModalStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [pkgModalEndDate, setPkgModalEndDate] = useState("");
  const [pkgTreatments, setPkgTreatments] = useState<Array<{ name: string; slug: string; type?: string; mainTreatment?: string | null }>>([]);
  const [pkgSelectedTreatments, setPkgSelectedTreatments] = useState<Array<{ treatmentName: string; treatmentSlug: string; sessions: number; allocatedPrice: number }>>([]);
  const [pkgTreatmentDropdownOpen, setPkgTreatmentDropdownOpen] = useState(false);
  const [pkgTreatmentSearch, setPkgTreatmentSearch] = useState("");
  const [pkgSubmitting, _setPkgSubmitting] = useState(false);
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

  // Fetch services for package creation
  const fetchPkgTreatments = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await axios.get("/api/clinic/services", { headers });
      if (res.data?.success) {
        const flat: Array<{ name: string; slug: string; type?: string; mainTreatment?: string | null }> = [];
        (res.data.services || []).forEach((svc: any) => {
          flat.push({ name: svc.name, slug: svc.serviceSlug || svc._id, type: "service", mainTreatment: null });
        });
        setPkgTreatments(flat);
      }
    } catch { /* ignore */ }
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
    
    // ALWAYS open payment modal first (both for "Create Package" and "Create & Add to Patient")
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
  const [pkgPaymentType, setPkgPaymentType] = useState<"Full" | "Partial">("Full");
  const [pkgPaymentMethod, setPkgPaymentMethod] = useState<string>("Cash");
  const [pkgPaidAmount, setPkgPaidAmount] = useState<number>(0);
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
      setPkgPaidAmount(selectedPkg.totalPrice || 0);
      setPkgPaymentType("Full");
      setPkgPendingToAssign(selectedPkg);
      setShowPackagePaymentModal(true);
    }
  };

  const finalizePmAddPackage = async (paidAmount: number, paymentStatus: "Unpaid" | "Partial" | "Full", paymentMethod: string) => {
    // Case 1: Creating a new package (with or without adding to patient)
    if (pkgPendingToCreate) {
      try {
        const shouldAddToPatient = pkgPendingToCreate.addToPatient;
        
        // ALWAYS add to editFormData temporarily - will save on "Save Changes" click
        const newPkgData = {
          packageId: `temp_${Date.now()}`, // Temporary ID, will be replaced after save
          isNewPackage: true, // Flag to indicate this needs to be created
          packageName: pkgPendingToCreate.name,
          totalPrice: pkgPendingToCreate.totalPrice,
          validityInMonths: pkgPendingToCreate.validityInMonths,
          startDate: pkgPendingToCreate.startDate,
          endDate: pkgPendingToCreate.endDate,
          treatments: pkgPendingToCreate.treatments,
          assignedDate: new Date().toISOString(),
          paidAmount: paidAmount,
          paymentStatus: paymentStatus,
          paymentMethod: paymentMethod,
          addToPatient: shouldAddToPatient, // Keep flag to know behavior after save
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
        
        // Show appropriate message based on flow
        if (shouldAddToPatient) {
          setPkgSuccess("Package added to patient! Click 'Save Changes' to save.");
        } else {
          setPkgSuccess("Package created! Click 'Save Changes' to save.");
        }
        setTimeout(() => setPkgSuccess(""), 3000);
      } catch (err: any) {
        console.error('Error handling package creation:', err);
        setPkgError(err.response?.data?.message || err.message || "Failed to create package");
        setPkgPendingToCreate(null);
        setShowPackagePaymentModal(false);
      }
      return;
    }
    
    // Case 2: Adding existing package to patient (original flow)
    if (!pkgPendingToAssign) return;
    
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
          assignedDate: new Date().toISOString(),
          validityInMonths: validity,
          startDate: startDate,
          endDate: endDate,
          totalPrice: pkgPendingToAssign.totalPrice || 0,
          paidAmount: paidAmount,
          paymentStatus: paymentStatus,
          paymentMethod: paymentMethod,
        }
      ],
    }));
    setSelectedPackageToAdd('');
    setShowAddPackageDropdown(false);
    setShowPackagePaymentModal(false);
    setPkgPendingToAssign(null);
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
    if (activeTab === 'advance' && patientData?._id) {
      setBalanceLoading(true);
      fetchPatientBalance(patientData._id).then((data) => {
        if (data) setBalance(data as typeof balance);
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

      // Fetch all clinic packages and memberships first
      const [mRes, pRes] = await Promise.all([
        axios.get('/api/clinic/memberships', { headers }),
        axios.get('/api/clinic/packages', { headers })
      ]);
      
      const allMemberships = mRes.data?.memberships || [];
      const allPackages = pRes.data?.packages || [];
      
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
        
        return {
          ...pkg,
          validityInMonths: patientPackage?.validityInMonths || pkg.validityInMonths || 0,
          startDate: patientPackage?.startDate || pkg.startDate || patientPackage?.assignedDate || pkg.createdAt,
          endDate: patientPackage?.endDate || pkg.endDate || null,
          totalSessions: pkg.totalSessions || calculatedTotalSessions || 0,
          usedSessions: usedSessions,
          status: 'active',
          assignedDate: patientPackage?.assignedDate || pkg.createdAt,
          paymentStatus: usage?.paymentStatus || patientPackage?.paymentStatus || pkg.paymentStatus || 'Unpaid',
          paidAmount: usage?.paidAmount || patientPackage?.paidAmount || pkg.paidAmount || 0,
          paymentMethod: usage?.paymentMethod || patientPackage?.paymentMethod || pkg.paymentMethod || '',
          treatments: treatmentsWithUsage,
          billingHistory: usage?.billingHistory || [],
          isTransferred: usage?.isTransferred || false,
          transferredFrom: usage?.transferredFrom || null,
          transferredFromName: usage?.transferredFromName || null,
          transferredPackageName: usage?.transferredPackageName || (usage?.isTransferred ? usage?.packageName : null) || null,
          totalAllowedSessions: usage?.totalAllowedSessions || null,
          remainingSessions: usage?.remainingSessions || null
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
                
                return {
                  ...fullPkg,
                  validityInMonths: fullPkg.validityInMonths || 0,
                  startDate: fullPkg.startDate || userPkg.assignedDate,
                  endDate: fullPkg.endDate || null,
                  paymentStatus: userPkg.paymentStatus || fullPkg.paymentStatus || 'Unpaid',
                  paidAmount: userPkg.paidAmount || fullPkg.paidAmount || 0,
                  paymentMethod: userPkg.paymentMethod || fullPkg.paymentMethod || '',
                  usedSessions: usedSessions,
                  remainingSessions: usage?.remainingSessions ?? (fullPkg.totalSessions - usedSessions),
                  assignedDate: userPkg.assignedDate,
                  treatments: treatmentsWithUsage
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
        const billings = response.data.billings || [];
        setBillingHistory(billings);
        calculateFinancialSnapshot(billings);
        
        // Calculate valid cashback from billing history
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        
        console.log('[CashbackProfile] Checking cashback validity:', {
          totalBillings: billings.length,
          today: today.toISOString()
        });
        
        // Find all billings with valid cashback
        const cashbackBillings = billings.filter((billing: any) => {
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
              isValid
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
        
        // Calculate total USED cashback (from all billings)
        const totalCashbackUsed = billings.reduce((sum: number, billing: any) => {
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
      const [appointmentsRes, packageUsageRes, billingRes] = await Promise.all([
        axios.get(
          `/api/clinic/all-appointments?page=1&limit=1000&fromDate=${oneYearAgo.toISOString().split('T')[0]}&toDate=${today}`,
          { headers }
        ),
        axios.get(`/api/clinic/package-usage/${patientData._id}`, { headers }).catch(() => ({ data: { success: false } })),
        fetchBillingHistory() // Use the unified function here
      ]);

      let totalVisits = 0;
      let completedVisits = 0;
      let completedInvoices = 0;
      let cancelledNoShow = 0;
      let activePackages = 0;
      let pendingSessions = 0;
      let insuranceClaimsPending = 0;

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

      // Completed invoices from billing history - Use same logic as treatment section
      if (billingRes) {
        const billings: any[] = billingRes;
        
        // Filter out advance payments first
        const treatmentBillings = billings.filter((b: any) => {
          const isAdvance = b.isAdvanceOnly || 
                           b.treatment === "Advance Payment" || 
                           b.treatment === "Historical Advance Balance";
          return !isAdvance;
        });
        
        // Apply the same completed/pending logic as treatment section
        completedInvoices = treatmentBillings.filter((billing: any) => {
          const amount = parseFloat(billing.amount) || 0;
          const paid = parseFloat(billing.paid || billing.paidAmount || 0) || 0;
          const pending = parseFloat(billing.pending || 0) || 0;
          const pendingUsed = parseFloat(billing.pendingUsed || 0) || 0;
          const billingDate = billing.createdAt ? new Date(billing.createdAt).getTime() : 0;
          
          // Check if this invoice's pending was cleared by a newer invoice
          const hasNewerInvoiceWithPendingUsed = treatmentBillings.some((otherBilling: any) => {
            const otherDate = otherBilling.createdAt ? new Date(otherBilling.createdAt).getTime() : 0;
            const otherPendingUsed = parseFloat(otherBilling.pendingUsed || 0) || 0;
            return otherDate > billingDate && otherPendingUsed > 0;
          });
          
          const hasPendingAmount = pending > 0;
          const pendingClearedSeparately = pendingUsed > 0;
          
          // Same logic as treatment section
          const isFullyPaid = (!hasPendingAmount && (paid >= amount || pendingClearedSeparately)) ||
                             (hasPendingAmount && hasNewerInvoiceWithPendingUsed);
          
          return isFullyPaid;
        }).length;
      }

      // Insurance
      insuranceClaimsPending = patientData?.insurance === 'Yes' ? 1 : 0;

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
    }));
  };

  const handleNewClaimServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const svcId = e.target.value;
    const svc = newClaimServices.find((s: any) => s._id === svcId);
    setNewClaimData((prev: any) => ({
      ...prev,
      serviceId: svcId,
      serviceName: svc ? svc.name : "",
    }));
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

    // Calculate total pending claim from all insurance claims
    const totalPendingClaim = insuranceClaims.reduce((sum, claim) => sum + Number(claim.pendingClaim || 0), 0);

    // Check if patient has pending claim
    if (totalPendingClaim > 0) {
      alert(`Cannot create new claim. This patient has a pending claim of ${formatAED(totalPendingClaim)}. Please clear the pending claim first.`);
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
                  {[
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
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setAppointmentFilter(filter.key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                        appointmentFilter === filter.key
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
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
                                      if (names.length === 0) {
                                        return <div className="font-semibold text-gray-400 text-sm">-</div>;
                                      }
                                      return (
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
                                if (pkgTreatments.length === 0) fetchPkgTreatments();
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
                                onClick={() => { setPkgPaymentType("Full"); setPkgPaidAmount(pkgTotalAmount); }}
                                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 ${pkgPaymentType === 'Full' ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-md' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-purple-200'}`}
                              >
                                <CheckCircle className={`w-5 h-5 ${pkgPaymentType === 'Full' ? 'text-purple-600' : 'text-gray-300'}`} />
                                <span className="font-bold text-[11px]">Full Payment</span>
                                <span className="text-[9px] opacity-70">Pay 100% ({getCurrencySymbol(currency)}{pkgTotalAmount})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { setPkgPaymentType("Partial"); setPkgPaidAmount(pkgTotalAmount / 2); }}
                                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 ${pkgPaymentType === 'Partial' ? 'border-amber-600 bg-amber-50 text-amber-700 shadow-md' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-amber-200'}`}
                              >
                                <Activity className={`w-5 h-5 ${pkgPaymentType === 'Partial' ? 'text-amber-600' : 'text-gray-300'}`} />
                                <span className="font-bold text-[11px]">Partial Payment</span>
                                <span className="text-[9px] opacity-70">Pay 50% ({getCurrencySymbol(currency)}{pkgTotalAmount / 2})</span>
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider px-1">Amount to Pay</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">{getCurrencySymbol(currency)}</span>
                                <input
                                  type="number"
                                  value={pkgPaidAmount}
                                  onChange={(e) => setPkgPaidAmount(Number(e.target.value))}
                                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 pl-8 pr-4 text-lg font-bold text-gray-900 focus:bg-white focus:border-purple-500 focus:outline-none transition-all shadow-sm"
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
                                  const status = pkgPaidAmount >= pkgTotalAmount ? "Full" : (pkgPaidAmount > 0 ? "Partial" : "Unpaid");
                                  finalizePmAddPackage(pkgPaidAmount, status, pkgPaymentMethod);
                                }}
                                className="flex-[2] min-w-[120px] py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white text-xs font-bold rounded-2xl hover:shadow-lg hover:shadow-purple-200 transition-all"
                              >
                                Confirm & Add
                              </button>
                            </div>
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
                    <div className="space-y-4">
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
                      const price = pkg.price || pkg.totalPrice || 0;
                      const formattedPrice = typeof price === 'number' ? `${getCurrencySymbol(currency)}${price.toFixed(2)}` : `${getCurrencySymbol(currency)}${price || 0}`;

                      return (
                        <div key={pkg._id || packageId || index} className={`bg-white rounded-xl border ${isExpired ? 'border-red-200 shadow-sm' : 'border-gray-200 shadow-lg'} overflow-hidden hover:shadow-xl transition-all duration-300 relative`}>
                          {isExpired && (
                            <div className="absolute top-0 right-0 z-10">
                              <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 shadow-md transform translate-x-1 translate-y-0 rounded-bl-xl border-l border-b border-red-700 animate-pulse">
                                Expired
                              </div>
                            </div>
                          )}
                          {/* Header Section */}
                          <div className={`px-5 py-4 border-b border-gray-200 ${isExpired ? 'bg-red-50/50' : `bg-gradient-to-r ${isUserPackage ? 'from-indigo-50 to-purple-50' : 'from-teal-50 to-cyan-50'}`}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                {/* Package Icon */}
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${isExpired ? 'from-red-100 to-rose-100' : (isUserPackage ? 'from-indigo-100 to-purple-100' : 'from-teal-100 to-cyan-100')} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                  <Package className={`w-7 h-7 ${isExpired ? 'text-red-600' : (isUserPackage ? 'text-indigo-600' : 'text-teal-600')}`} />
                                </div>
                                
                                {/* Package Info */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className={`text-lg font-bold ${isExpired ? 'text-red-900 line-through' : 'text-gray-900'}`}>{packageName}</h3>
                                    {isUserPackage && !isExpired && (
                                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                        User Package
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <span className={`font-bold ${isExpired ? 'text-red-700' : 'text-gray-900'}`}>{formattedPrice}</span>
                                    
                                    {/* Payment Status & Method Tags */}
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
                                    {pkg.paymentMethod && (
                                      <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold uppercase text-[9px] border border-indigo-100 flex items-center gap-1 shadow-sm">
                                        <Wallet className="w-2.5 h-2.5" />
                                        {pkg.paymentMethod}
                                      </span>
                                    )}

                                    {pkg.sessionPrice > 0 && !isExpired && (
                                      <span className="text-gray-500 font-medium">({getCurrencySymbol(currency)}{pkg.sessionPrice.toFixed(2)}/session)</span>
                                    )}
                                    {assignedDate && (
                                      <div className={`flex items-center gap-1.5 ${isExpired ? 'text-red-500' : 'text-gray-600'}`}>
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Purchased: {new Date(assignedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Sessions Progress Section */}
                          <div className={`px-5 py-4 ${isExpired ? 'opacity-60 bg-red-50/20 grayscale-[0.5]' : ''}`}>
                            <div className="mb-4">
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="font-medium text-gray-700">Sessions Progress</span>
                                <span className="font-bold text-gray-900">{usedSessions} / {totalSessions} used</span>
                              </div>
                              {/* Progress Bar */}
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full bg-gradient-to-r ${isExpired ? 'from-red-400 to-rose-400' : (isUserPackage ? 'from-indigo-500 to-purple-500' : 'from-teal-500 to-cyan-500')} rounded-full transition-all duration-500 ease-out`}
                                  style={{ width: `${progressPercent}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Validity & Dates Display */}
                            {(pkg.validityInMonths || pkg.startDate || pkg.endDate) && (
                              <div className={`mb-4 border rounded-xl p-4 ${isExpired ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Clock className={`w-4 h-4 ${isExpired ? 'text-red-600' : 'text-purple-600'}`} />
                                    <span className={`text-sm font-bold ${isExpired ? 'text-red-900' : 'text-gray-900'}`}>Package Validity</span>
                                  </div>
                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${isExpired ? 'bg-red-200 text-red-800' : 'bg-purple-100 text-purple-700'}`}>
                                    {pkg.validityInMonths || 0} Months Duration
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Start Date</p>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                      <span className={`text-sm font-bold ${isExpired ? 'text-red-900' : 'text-gray-800'}`}>
                                        {pkg.startDate ? new Date(pkg.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className={`p-2.5 rounded-lg border shadow-sm ${isExpired ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">End Date (Expired)</p>
                                    <div className="flex items-center gap-2">
                                      <Calendar className={`w-3.5 h-3.5 ${isExpired ? 'text-red-600' : 'text-rose-500'}`} />
                                      <span className={`text-sm font-bold ${isExpired ? 'text-red-700 underline decoration-double decoration-red-400' : 'text-gray-800'}`}>
                                        {pkg.endDate ? new Date(pkg.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {isExpired && (
                                  <div className="mt-3 text-[10px] text-red-600 font-bold flex items-center gap-1 bg-white/50 p-1.5 rounded border border-red-100">
                                    <AlertCircle className="w-3 h-3" />
                                    THIS PACKAGE HAS EXPIRED. SESSIONS CAN NO LONGER BE ACCESSED.
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Three Info Boxes */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              {/* Total Sessions */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-blue-700">{totalSessions}</div>
                                <div className="text-xs text-blue-600 mt-1 font-medium">Total Sessions</div>
                              </div>
                              
                              {/* Used Sessions */}
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-green-700">{usedSessions}</div>
                                <div className="text-xs text-green-600 mt-1 font-medium">Used Sessions</div>
                              </div>
                              
                              {/* Remaining Sessions */}
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-orange-700">{remainingSessions}</div>
                                <div className="text-xs text-orange-600 mt-1 font-medium">Remaining</div>
                              </div>
                            </div>

                            {/* User Package Specific Details */}
                            {isUserPackage && (
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Status & Payment</div>
                                  <div className="flex flex-wrap gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      pkg.status === 'active' ? 'bg-green-100 text-green-700' :
                                      pkg.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {pkg.status || 'Active'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      pkg.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                      pkg.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-700' :
                                      'bg-rose-100 text-rose-700'
                                    }`}>
                                      {pkg.paymentStatus || 'Paid'}
                                    </span>
                                  </div>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Validity Period</div>
                                  <div className="text-xs font-medium text-gray-700">
                                    {pkg.startDate && new Date(pkg.startDate).toLocaleDateString()} - {pkg.endDate && new Date(pkg.endDate).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Treatment Breakdown */}
                            {pkg.treatments && pkg.treatments.length > 0 && (
                              <div className="bg-white rounded-lg border border-gray-200 p-3">
                                <h5 className="text-xs font-bold text-gray-800 mb-2.5 flex items-center gap-1.5">
                                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                                  Treatment Sessions
                                </h5>
                                <div className="space-y-2">
                                  {pkg.treatments.map((treatment: any, tIdx: number) => {
                                    const used = treatment.usedSessions || 0;
                                    const max = treatment.maxSessions || treatment.sessions || 0;
                                    const percent = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
                                    const remaining = max - used;
                                    const isComplete = used >= max;
                                    
                                    return (
                                      <div key={tIdx} className="bg-gray-50 rounded-lg px-3 py-2.5">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="text-xs font-medium text-gray-700 truncate max-w-[180px]">{treatment.treatmentName || treatment.name}</span>
                                          <div className="flex items-center gap-1.5">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                                              isComplete ? 'bg-green-100 text-green-700' :
                                              used > 0 ? 'bg-blue-100 text-blue-700' :
                                              'bg-gray-100 text-gray-600'
                                            }`}>
                                              {used}/{max} used
                                            </span>
                                          </div>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                                          <div 
                                            className={`h-full rounded-full transition-all duration-500 ${
                                              isComplete ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                              used > 0 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                                              'bg-gray-400'
                                            }`}
                                            style={{ width: `${percent}%` }}
                                          />
                                        </div>
                                        <div className="flex items-center justify-between text-[9px] text-gray-600">
                                          <span>Remaining: {remaining} sessions</span>
                                          {treatment.sessionPrice > 0 && <span>{getCurrencySymbol(currency)}{treatment.sessionPrice.toFixed(2)} / session</span>}
                                          <span>{percent}% complete</span>
                                        </div>
                                        
                                        {/* Billing Records Table - per treatment */}
                                        {treatment.usageDetails && treatment.usageDetails.length > 0 && (
                                          <div className="mt-3 pt-3 border-t border-gray-200">
                                            <h6 className="text-xs font-bold text-gray-700 mb-2.5 flex items-center gap-1.5">
                                              <ClipboardList className="w-3.5 h-3.5 text-cyan-600" />
                                              Billing Records ({treatment.usageDetails.length})
                                            </h6>
                                            <div className="overflow-x-auto">
                                              <table className="w-full text-xs">
                                                <thead>
                                                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                                                    <th className="text-left py-2 px-2.5 font-semibold text-gray-700 rounded-tl-lg">Invoice</th>
                                                    <th className="text-left py-2 px-2.5 font-semibold text-gray-700">Date</th>
                                                    <th className="text-center py-2 px-2.5 font-semibold text-gray-700">Sessions</th>
                                                    <th className="text-left py-2 px-2.5 font-semibold text-gray-700">Method</th>
                                                    <th className="text-center py-2 px-2.5 font-semibold text-gray-700">Discount</th>
                                                    <th className="text-right py-2 px-2.5 font-semibold text-gray-700">Original Amount</th>
                                                    <th className="text-right py-2 px-2.5 font-semibold text-gray-700">Total</th>
                                                    <th className="text-right py-2 px-2.5 font-semibold text-gray-700 rounded-tr-lg">Paid</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {treatment.usageDetails.map((detail: any, dIdx: number) => (
                                                    <tr key={dIdx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                                      <td className="py-2.5 px-2.5">
                                                        <span className="font-bold text-gray-900">{detail.invoiceNumber}</span>
                                                      </td>
                                                      <td className="py-2.5 px-2.5">
                                                        <span className="text-gray-600">{new Date(detail.date).toLocaleDateString()}</span>
                                                      </td>
                                                      <td className="py-2.5 px-2.5 text-center">
                                                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 font-bold text-[10px] shadow-sm">
                                                          {detail.sessions} Session{detail.sessions !== 1 ? 's' : ''}
                                                        </span>
                                                      </td>
                                                      <td className="py-2.5 px-2.5 text-left">
                                                        <span className="text-[10px] text-gray-700 font-medium">
                                                          {detail.multiplePayments && detail.multiplePayments.length > 0 
                                                            ? detail.multiplePayments.map((mp: any) => mp.paymentMethod).join(" + ")
                                                            : (detail.paymentMethod || "–")}
                                                        </span>
                                                      </td>
                                                      <td className="py-2.5 px-2.5 text-center">
                                                        {(() => {
                                                          const isDoctorDiscount = detail.isDoctorDiscountApplied;
                                                          const isAgentDiscount = detail.isAgentDiscountApplied;
                                                          const membershipDiscountAmount = detail.membershipDiscountApplied || 0;
                                                          const isMembershipDiscount = membershipDiscountAmount > 0;
                                                          
                                                          const originalAmount = detail.originalAmount || 0;
                                                          const finalAmount = detail.amount || 0;
                                                          const totalDiscountAmount = originalAmount > finalAmount ? (originalAmount - finalAmount) : 0;
                                                          const totalPercent = totalDiscountAmount > 0 && originalAmount > 0 ? (totalDiscountAmount / originalAmount * 100) : 0;
                                                          const membershipPercent = isMembershipDiscount && originalAmount > 0 ? (membershipDiscountAmount / originalAmount * 100) : 0;

                                                          if (!isDoctorDiscount && !isAgentDiscount && !isMembershipDiscount && totalPercent <= 0) {
                                                            return <div className="text-xs text-gray-400">—</div>;
                                                          }

                                                          return (
                                                            <div className="flex flex-col items-center gap-1">
                                                              {totalPercent > 0 && (
                                                                <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                                                                  {Number(totalPercent).toFixed(1)}% OFF
                                                                </div>
                                                              )}
                                                              <div className="flex flex-wrap justify-center gap-1 mt-0.5">
                                                                {isMembershipDiscount && (
                                                                  <div className="text-[7px] uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-bold border border-emerald-100">
                                                                    Memb {membershipPercent > 0 ? `(${membershipPercent.toFixed(0)}%)` : 'Disc.'}
                                                                  </div>
                                                                )}
                                                                {isDoctorDiscount && (
                                                                  <div className="text-[7px] uppercase tracking-wider text-orange-600 bg-orange-50 px-1 py-0.5 rounded font-bold border border-orange-100">
                                                                    Dr Disc.
                                                                  </div>
                                                                )}
                                                                {isAgentDiscount && (
                                                                  <div className="text-[7px] uppercase tracking-wider text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-bold border border-blue-100">
                                                                    Ag Disc.
                                                                  </div>
                                                                )}
                                                              </div>
                                                            </div>
                                                          );
                                                        })()}
                                                      </td>
                                                      <td className="py-2.5 px-2.5 text-right">
                                                        <span className="font-medium text-gray-600">{getCurrencySymbol(currency)}{(detail.originalAmount || detail.amount || 0).toLocaleString()}</span>
                                                      </td>
                                                      <td className="py-2.5 px-2.5 text-right">
                                                        {detail.amount !== undefined && detail.amount !== null ? (
                                                          <span className="font-semibold text-gray-800">{getCurrencySymbol(currency)}{Number(detail.amount).toLocaleString()}</span>
                                                        ) : (
                                                          <span className="text-gray-400">-</span>
                                                        )}
                                                      </td>
                                                      <td className="py-2.5 px-2.5 text-right">
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
                                            {pkg.isTransferred && treatment.usageDetails.some((d: any) => d.isFromSourcePatient) && (
                                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="flex items-center gap-1.5">
                                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                                  <span className="text-[9px] font-medium text-green-800">
                                                    From transferred package (Source: {pkg.transferredFromName || 'Unknown Patient'})
                                                  </span>
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
                            
                            {/* Transfer Information */}
                            {pkg.isTransferred && (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mt-3">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                  <h5 className="text-xs font-bold text-green-800">Transferred Package</h5>
                                </div>
                                <div className="space-y-1.5 text-[10px]">
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

                                  {/* Payment Info in Transfer Section */}
                                  {(pkg.paymentStatus || pkg.paidAmount > 0 || pkg.paymentMethod) && (
                                    <div className="flex flex-wrap gap-2 pt-1.5 border-t border-green-200 mt-1.5">
                                      {/* {pkg.paymentStatus && (
                                        <div className="flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded border border-green-100">
                                          <span className="text-gray-600">Status:</span>
                                           <span className={`font-bold ${pkg.paymentStatus === 'Full' ? 'text-green-700' : 'text-amber-700'}`}>
                                             {pkg.paymentStatus === 'Full' ? 'Full Paid' : `Partial (د.إ${pkg.paidAmount})`}
                                           </span>
                                         </div>
                                      )} */}
                                      {pkg.paymentMethod && (
                                        <div className="flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded border border-green-100">
                                          <Wallet className="w-2.5 h-2.5 text-green-600" />
                                          <span className="font-bold text-green-800">{pkg.paymentMethod}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {pkg.totalAllowedSessions && (
                                    <div className="flex justify-between items-center pt-1.5 border-t border-green-200">
                                      <span className="text-gray-700">Total Allowed Sessions:</span>
                                      <span className="font-bold text-green-900">{pkg.totalAllowedSessions}</span>
                                    </div>
                                  )}
                                  {typeof pkg.remainingSessions === 'number' && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-700">Remaining Sessions:</span>
                                      <span className="font-bold text-green-900">{pkg.remainingSessions}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Footer with Expiry and Action Button */}
                          <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                             
                            </div>
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
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-teal-600" />
                            Invoices
                          </h3>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-100 hidden sm:table">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Treatment</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment Method</th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Discount</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Original Amount</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {(billingHistory || [])
                                .filter((b: any) => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance")
                                .map((billing: any, index: number) => {
                                // Determine payment method
                                const paymentMethods = billing.multiplePayments && billing.multiplePayments.length > 0 
                                  ? billing.multiplePayments.map((mp: any) => mp.paymentMethod).join(" + ")
                                  : (billing.paymentMethod || "–");
                                
                                return (
                                  <tr key={billing._id || index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                      <div className="text-sm font-semibold text-gray-900">{billing.invoiceNumber || `INV-${String(index + 1).padStart(4, '0')}`}</div>
                                      <div className="text-xs text-gray-500 mt-0.5">{billing.service || 'Treatment'}</div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-700">
                                        {billing.invoicedDate ? new Date(billing.invoicedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                      </div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-700 max-w-xs truncate" title={billing.treatment}>
                                        {billing.package ? (
                                          <div className="flex flex-col">
                                            <div className="font-semibold text-indigo-700 flex items-center gap-1">
                                              <Package className="w-3 h-3" />
                                              {billing.package}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                              {Array.isArray(billing.selectedPackageTreatments) && billing.selectedPackageTreatments.length > 0
                                                ? billing.selectedPackageTreatments.map((t: any) => t.treatmentName).join(', ')
                                                : billing.treatment || '-'}
                                            </div>
                                          </div>
                                        ) : (
                                          billing.treatment || '-'
                                        )}
                                     </div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-700">{paymentMethods}</div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-center">
                                      {(() => {
                                        const isDoctorDiscount = billing.isDoctorDiscountApplied;
                                        const isAgentDiscount = billing.isAgentDiscountApplied;
                                        const membershipDiscountAmount = billing.membershipDiscountApplied || 0;
                                        const isMembershipDiscount = membershipDiscountAmount > 0;
                                        
                                        const originalAmount = billing.originalAmount || 0;
                                        const finalAmount = billing.amount || 0;
                                        const totalDiscountAmount = originalAmount > finalAmount ? (originalAmount - finalAmount) : 0;
                                        const totalPercent = totalDiscountAmount > 0 && originalAmount > 0 ? (totalDiscountAmount / originalAmount * 100) : 0;
                                        const membershipPercent = isMembershipDiscount && originalAmount > 0 ? (membershipDiscountAmount / originalAmount * 100) : 0;

                                        if (!isDoctorDiscount && !isAgentDiscount && !isMembershipDiscount && totalPercent <= 0) {
                                          return <div className="text-xs text-gray-400">—</div>;
                                        }

                                        return (
                                          <div className="flex flex-col items-center gap-1">
                                            {totalPercent > 0 && (
                                              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                                                {Number(totalPercent).toFixed(1)}% OFF
                                              </div>
                                            )}
                                            <div className="flex flex-wrap justify-center gap-1 mt-0.5">
                                              {isMembershipDiscount && (
                                                <div className="text-[8px] uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-100">
                                                  Memb {membershipPercent > 0 ? `(${membershipPercent.toFixed(0)}%)` : 'Disc.'}
                                                </div>
                                              )}
                                              {isDoctorDiscount && (
                                                <div className="text-[8px] uppercase tracking-wider text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-bold border border-orange-100">
                                                  Doctor Disc.
                                                </div>
                                              )}
                                              {isAgentDiscount && (
                                                <div className="text-[8px] uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold border border-blue-100">
                                                  Agent Disc.
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-right">
                                      <div className="text-sm font-medium text-gray-600">
                                        {formatAED(billing.originalAmount || billing.amount || 0)}
                                      </div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-right">
                                       <div className="text-sm font-bold text-gray-900">Paid: {formatAED(billing.paid || 0)}</div>
                                        {/* <div className="text-[10px] text-gray-500">Total: {formatAED(billing.originalAmount || billing.amount || 0)}</div> */}
                                      <div className="text-[10px] text-gray-900">Total: {formatAED(billing.amount || 0)}</div>
                                       
                                      <div className="flex flex-col items-end mt-1 space-y-0.5">
                                        <div className="text-[10px] text-gray-400">Qty: {billing.quantity || 0}</div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          {/* Mobile List View */}
                          <div className="sm:hidden divide-y divide-gray-100">
                            {(billingHistory || [])
                              .filter((b: any) => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance")
                              .map((billing: any, index: number) => {
                                const paymentMethods = billing.multiplePayments && billing.multiplePayments.length > 0 
                                  ? billing.multiplePayments.map((mp: any) => mp.paymentMethod).join(" + ")
                                  : (billing.paymentMethod || "–");
                                return (
                                  <div key={billing._id || index} className="p-4 hover:bg-gray-50">
                                    {(() => {
                                      const originalAmt = billing.originalAmount || billing.amount || 0;
                                      const totalDisc = originalAmt > billing.amount ? (originalAmt - billing.amount) : 0;
                                      const totalPct = originalAmt > 0 ? (totalDisc / originalAmt * 100) : 0;
                                      
                                      return (
                                        <>
                                          <div className="flex justify-between items-start mb-2">
                                            <div>
                                              <div className="text-sm font-bold text-gray-900">{billing.invoiceNumber || `INV-${String(index + 1).padStart(4, '0')}`}</div>
                                              <div className="text-xs text-gray-500">{billing.service || 'Treatment'}</div>
                                            </div>
                                            <div className="text-right">
                                              <div className="text-sm font-bold text-gray-900">{formatAED(billing.amount || 0)}</div>
                                              <div className="text-[10px] text-gray-500">{billing.invoicedDate ? new Date(billing.invoicedDate).toLocaleDateString() : 'N/A'}</div>
                                            </div>
                                          </div>
                                          <div className="text-sm text-gray-700 mb-2">
                                            {billing.package ? (
                                              <div className="flex items-center gap-1 font-semibold text-indigo-700">
                                                <Package className="w-3 h-3" />
                                                {billing.package}
                                              </div>
                                            ) : (
                                              billing.treatment || '-'
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-600 mb-2">
                                            <span className="font-medium">Payment: </span>{paymentMethods}
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-50">
                                            <div className="text-[10px] text-gray-500">
                                              <span className="block">Original: {formatAED(originalAmt)}</span>
                                              <span className="block font-medium text-emerald-600">Paid: {formatAED(billing.paid || 0)}</span>
                                            </div>
                                            <div className="text-[10px] text-right">
                                              {totalPct > 0 && (
                                                <span className="block text-amber-600 font-bold">{totalPct.toFixed(1)}% OFF</span>
                                              )}
                                              <span className="block text-gray-400">Qty: {billing.quantity || 0}</span>
                                            </div>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                );
                              })}
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
                          // Pre-fill insurance details from patient data or existing claims
                          const provider = insuranceClaims[0]?.insuranceProvider || patientData?.insuranceType;
                          const policy = insuranceClaims[0]?.policyNumber;
                          const expiry = insuranceClaims[0]?.expiryDate ? new Date(insuranceClaims[0].expiryDate).toISOString().split('T')[0] : "";
                          const cardFile = insuranceClaims[0]?.insuranceCardFile;
                          const benefitsFile = insuranceClaims[0]?.tableOfBenefitsFile;
                          
                          if (provider || policy || expiry || cardFile || benefitsFile) {
                            setNewClaimData((prev: any) => ({
                              ...prev,
                              ...(provider && { insuranceProvider: provider }),
                              ...(policy && { policyNumber: policy }),
                              ...(expiry && { expiryDate: expiry }),
                              ...(cardFile && { insuranceCardFile: cardFile }),
                              ...(benefitsFile && { tableOfBenefitsFile: benefitsFile })
                            }));
                          }
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
                            <input type="file" accept="image/*,.pdf" onChange={(e) => handleNewClaimFileUpload(e, 'insuranceCard')} className="w-full px-1 py-1.5 text-[9px] border border-gray-300 rounded-md text-gray-700 file:mr-1 file:py-0.5 file:px-2 file:rounded file:text-[8px] file:bg-blue-100 file:text-blue-700 file:border-0" disabled={newClaimUploadingFiles} />
                            {newClaimData.insuranceCardFile && (
                              <div className="mt-1">
                                <button
                                  type="button"
                                  onClick={() => setDocViewerUrl(newClaimData.insuranceCardFile)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 border border-blue-200 rounded text-[9px] font-medium text-blue-700 hover:bg-blue-200 transition-colors"
                                >
                                  <Shield className="w-2.5 h-2.5" /> View Card
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs mb-0.5 font-medium text-gray-700">Table of Benefits</label>
                            <input type="file" accept="image/*,.pdf" onChange={(e) => handleNewClaimFileUpload(e, 'tableOfBenefits')} className="w-full px-1 py-1.5 text-[9px] border border-gray-300 rounded-md text-gray-700 file:mr-1 file:py-0.5 file:px-2 file:rounded file:text-[8px] file:bg-blue-100 file:text-blue-700 file:border-0" disabled={newClaimUploadingFiles} />
                            {newClaimData.tableOfBenefitsFile && (
                              <div className="mt-1">
                                <button
                                  type="button"
                                  onClick={() => setDocViewerUrl(newClaimData.tableOfBenefitsFile)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 border border-blue-200 rounded text-[9px] font-medium text-blue-700 hover:bg-blue-200 transition-colors"
                                >
                                  <FileText className="w-2.5 h-2.5" /> View Benefits
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section B: Claim Source */}
                      <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-xs font-semibold text-green-800 mb-2">Claim Source</div>
                        <div className="flex flex-wrap gap-2 items-end">
                          <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs mb-0.5 font-medium text-gray-700">Department</label>
                            <select name="departmentId" value={newClaimData.departmentId} onChange={handleNewClaimDepartmentChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 text-gray-900">
                              <option value="">Select Department</option>
                              {newClaimDepartments.map((d: any) => (
                                <option key={d._id} value={d._id}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs mb-0.5 font-medium text-gray-700">Service</label>
                            <select name="serviceId" value={newClaimData.serviceId} onChange={handleNewClaimServiceChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 text-gray-900">
                              <option value="">Select Service</option>
                              {newClaimServices.filter((s: any) => !newClaimData.departmentId || String(s.departmentId) === String(newClaimData.departmentId)).map((s: any) => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs mb-0.5 font-medium text-gray-700">Doctor <span className="text-red-500">*</span></label>
                            <select name="doctorId" value={newClaimData.doctorId} onChange={handleNewClaimDoctorChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 text-gray-900">
                              <option value="">Select Doctor</option>
                              {newClaimDoctors.map((d: any) => (
                                <option key={d._id} value={d._id}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs mb-0.5 font-medium text-gray-700">Claim Amount <span className="text-red-500">*</span></label>
                            <input type="number" name="claimAmount" value={newClaimData.claimAmount} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 text-gray-900" placeholder="0" min="0" step="0.01" />
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs mb-0.5 font-medium text-gray-700">Claim Type <span className="text-red-500">*</span></label>
                            <select name="claimType" value={newClaimData.claimType} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 text-gray-900">
                              <option value="Paid">Paid</option>
                              <option value="Advance">Advance</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section C: Claim Details */}
                      <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-xs font-semibold text-purple-800 mb-2">Claim Details</div>
                        <div className="flex flex-wrap gap-2 items-end">
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs mb-0.5 font-medium text-gray-700">Co-Pay %</label>
                            <input type="number" name="coPayPercent" value={newClaimData.coPayPercent} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900" placeholder="0-100" min="0" max="100" />
                          </div>
                          <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs mb-0.5 font-medium text-gray-700">Co-Pay Type</label>
                            <select name="coPayType" value={newClaimData.coPayType} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900">
                              <option value="Patient Pays">Patient Pays</option>
                              <option value="Deduct from Claim">Deduct from Claim</option>
                              <option value="Clinic Adjusts">Clinic Adjusts</option>
                            </select>
                          </div>
                          <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs mb-0.5 font-medium text-gray-700">Notes</label>
                            <input type="text" name="notes" value={newClaimData.notes} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900" placeholder="Additional notes" />
                          </div>
                          <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs mb-0.5 font-medium text-gray-700">Documents</label>
                            <input type="file" multiple accept="image/*,.pdf" onChange={handleNewClaimDocumentsUpload} className="w-full px-1 py-0.5 text-[9px] border border-gray-300 rounded-md text-gray-700 file:mr-1 file:py-0.5 file:px-2 file:rounded file:text-[8px] file:bg-purple-100 file:text-purple-700 file:border-0" disabled={newClaimUploadingFiles} />
                            {newClaimData.documentFiles.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                <span className="text-[9px] text-gray-600 w-full mb-0.5">{newClaimData.documentFiles.length} file(s) uploaded:</span>
                                {newClaimData.documentFiles.map((f: string, i: number) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setDocViewerUrl(f)}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 border border-purple-200 rounded text-[9px] font-medium text-purple-700 hover:bg-purple-200 transition-colors"
                                  >
                                    <Paperclip className="w-2.5 h-2.5" /> Doc {i + 1}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Advance-specific fields */}
                        {newClaimData.claimType === 'Advance' && (
                          <div className="flex flex-wrap gap-2 items-end mt-2 pt-2 border-t border-purple-200">
                            <div className="flex-1 min-w-[140px]">
                              <label className="block text-xs mb-0.5 font-medium text-gray-700">Advance Status</label>
                              <select name="advanceStatus" value={newClaimData.advanceStatus} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900">
                                <option value="Full Pay">Full Pay</option>
                                <option value="Partial Pay">Partial Pay</option>
                              </select>
                            </div>
                            <div className="flex-1 min-w-[140px]">
                              <label className="block text-xs mb-0.5 font-medium text-gray-700">Advance Amount (Enter)</label>
                              <input
                                type="number"
                                name="advanceAmount"
                                value={newClaimData.advanceAmount}
                                onChange={handleNewClaimChange}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900 font-semibold"
                                placeholder="Enter advance amount"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div className="flex-1 min-w-[120px]">
                              <label className="block text-xs mb-0.5 font-medium text-gray-700">Status</label>
                              <div className="px-2 py-1 text-xs bg-yellow-50 border border-yellow-300 rounded-md text-yellow-800 font-semibold">Under Review</div>
                            </div>
                          </div>
                        )}

                        {/* Paid claim type - show advance status and amount */}
                        {newClaimData.claimType === 'Paid' && (
                          <div className="flex flex-wrap gap-2 items-end mt-2 pt-2 border-t border-purple-200">
                            <div className="flex-1 min-w-[140px]">
                              <label className="block text-xs mb-0.5 font-medium text-gray-700">Paid Status</label>
                              <select name="advanceStatus" value={newClaimData.advanceStatus} onChange={handleNewClaimChange} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900">
                                <option value="Full Pay">Full Pay</option>
                                <option value="Partial Pay">Partial Pay</option>
                              </select>
                            </div>
                            <div className="flex-1 min-w-[140px]">
                              <label className="block text-xs mb-0.5 font-medium text-gray-700">Paid Amount (Enter)</label>
                              <input
                                type="number"
                                name="advanceAmount"
                                value={newClaimData.advanceAmount}
                                onChange={handleNewClaimChange}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 text-gray-900 font-semibold"
                                placeholder="Enter advance amount"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div className="flex-1 min-w-[120px]">
                              <label className="block text-xs mb-0.5 font-medium text-gray-700">Status</label>
                              <div className="px-2 py-1 text-xs bg-yellow-50 border border-yellow-300 rounded-md text-yellow-800 font-semibold">Under Review</div>
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
                          {/* Uploaded files */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {insuranceClaims[0]?.insuranceCardFile ? (
                              <a href={insuranceClaims[0].insuranceCardFile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-100">
                                <Shield className="w-3.5 h-3.5" /> Insurance Card 
                              </a>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-400">
                                <Shield className="w-3.5 h-3.5" /> No Card
                              </div>
                            )}
                            {insuranceClaims[0]?.tableOfBenefitsFile ? (
                              <a href={insuranceClaims[0].tableOfBenefitsFile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-100">
                                <FileText className="w-3.5 h-3.5" /> Table of Benefits
                              </a>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-400">
                                <FileText className="w-3.5 h-3.5" /> No Benefits
                              </div>
                            )}
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
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Doctor</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pending Claim</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Co-Pay</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Files</th>
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
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{claim.doctorName || '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{claim.claimAmount?.toLocaleString()}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-orange-700">{claim.pendingClaim > 0 ? claim.pendingClaim.toLocaleString() : '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{claim.coPayPercent}% ({claim.coPayType})</td>
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
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="flex items-center gap-1.5">
                                        {claim.insuranceCardFile && <Shield className="w-3.5 h-3.5 text-blue-500" title="Insurance Card" />}
                                        {claim.tableOfBenefitsFile && <FileText className="w-3.5 h-3.5 text-teal-500" title="Table of Benefits" />}
                                        {claim.documentFiles?.length > 0 && (
                                          <div className="flex items-center gap-0.5">
                                            <Paperclip className="w-3.5 h-3.5 text-purple-500" title="Support Documents" />
                                            <span className="text-[10px] text-purple-600 font-bold">{claim.documentFiles.length}</span>
                                          </div>
                                        )}
                                        {(!claim.insuranceCardFile && !claim.tableOfBenefitsFile && (!claim.documentFiles || claim.documentFiles.length === 0)) && (
                                          <span className="text-gray-300">-</span>
                                        )}
                                      </div>
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                                  <Eye className="w-3.5 h-3.5" /> View Card
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
                          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Department</p>
                              <p className="text-sm font-semibold text-green-900">{claimViewModal.departmentName || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Service</p>
                              <p className="text-sm font-semibold text-green-900">{claimViewModal.serviceName || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Doctor</p>
                              <p className="text-sm font-semibold text-green-900">{claimViewModal.doctorName || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Claim Amount</p>
                              <p className="text-sm font-bold text-green-900">{claimViewModal.claimAmount?.toLocaleString()}</p>
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
                              <p className="text-sm font-semibold text-purple-900">{claimViewModal.coPayPercent}% ({claimViewModal.coPayType})</p>
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
                            {claimViewModal.pendingClaim > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Claim</p>
                                <p className="text-sm font-bold text-orange-700">{claimViewModal.pendingClaim?.toLocaleString()}</p>
                              </div>
                            )}
                            {(claimViewModal.claimType === 'Advance' || claimViewModal.claimType === 'Paid') && (
                              <>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{claimViewModal.claimType} Status</p>
                                  <p className="text-sm font-semibold text-purple-900">{claimViewModal.advanceStatus || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{claimViewModal.claimType} Amount</p>
                                  <p className="text-sm font-bold text-purple-900">{claimViewModal.advanceAmount?.toLocaleString() || '-'}</p>
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
                        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                          Created: {new Date(claimViewModal.createdAt).toLocaleString()}
                          {claimViewModal.reviewedAt && <> | Reviewed: {new Date(claimViewModal.reviewedAt).toLocaleString()}</>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Claim Edit Modal */}
                {claimEditModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
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
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                              <input type="file" accept="image/*,.pdf" onChange={(e) => handleClaimEditFileUpload(e, 'insuranceCard')} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" disabled={claimEditUploadingFiles} />
                              {claimEditData.insuranceCardFile && (
                                <div className="mt-2">
                                  <button
                                    onClick={() => setDocViewerUrl(claimEditData.insuranceCardFile)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[10px] font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                                  >
                                    <Shield className="w-3 h-3" />
                                    View Insurance Card
                                  </button>
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Table of Benefits</label>
                              <input type="file" accept="image/*,.pdf" onChange={(e) => handleClaimEditFileUpload(e, 'tableOfBenefits')} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" disabled={claimEditUploadingFiles} />
                              {claimEditData.tableOfBenefitsFile && (
                                <div className="mt-2">
                                  <button
                                    onClick={() => setDocViewerUrl(claimEditData.tableOfBenefitsFile)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[10px] font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                                  >
                                    <FileText className="w-3 h-3" />
                                    View Table of Benefits
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Claim Source & Type */}
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <h3 className="text-sm font-semibold text-green-800 mb-3">Claim Source & Type</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                              <select value={claimEditData.departmentId || ''} onChange={(e) => {
                                const dept = claimDepartments.find((d: any) => d._id === e.target.value);
                                setClaimEditData((prev: any) => ({ ...prev, departmentId: e.target.value, departmentName: dept?.name || '', serviceId: '', serviceName: '' }));
                              }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                <option value="">Select Department</option>
                                {claimDepartments.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Service</label>
                              <select value={claimEditData.serviceId || ''} onChange={(e) => {
                                const svc = claimServices.find((s: any) => s._id === e.target.value);
                                setClaimEditData((prev: any) => ({ ...prev, serviceId: e.target.value, serviceName: svc?.name || '' }));
                              }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                <option value="">Select Service</option>
                                {claimServices.filter((s: any) => !claimEditData.departmentId || String(s.departmentId) === String(claimEditData.departmentId)).map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Doctor <span className="text-red-500">*</span></label>
                              <select value={claimEditData.doctorId || ''} onChange={(e) => {
                                const doc = claimDoctors.find((d: any) => d._id === e.target.value);
                                setClaimEditData((prev: any) => ({ ...prev, doctorId: e.target.value, doctorName: doc?.name || '' }));
                              }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                <option value="">Select Doctor</option>
                                {claimDoctors.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Claim Amount <span className="text-red-500">*</span></label>
                              <input type="number" value={claimEditData.claimAmount ?? ''} onChange={(e) => {
                                const amt = parseFloat(e.target.value) || 0;
                                setClaimEditData((prev: any) => ({
                                  ...prev,
                                  claimAmount: amt,
                                  advanceAmount: prev.claimType === 'Advance' ? (prev.advanceStatus === 'Full Pay' ? amt : amt * 0.5) : 0,
                                }));
                              }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" min="0" step="0.01" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Claim Type <span className="text-red-500">*</span></label>
                              <select value={claimEditData.claimType || 'Paid'} onChange={(e) => setClaimEditData((prev: any) => ({ ...prev, claimType: e.target.value, advanceStatus: e.target.value === 'Advance' ? 'Full Pay' : null, advanceAmount: 0 }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                <option value="Paid">Paid</option>
                                <option value="Advance">Advance</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Claim Details */}
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <h3 className="text-sm font-semibold text-purple-800 mb-3">Claim Details</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Co-Pay %</label>
                              <input type="number" value={claimEditData.coPayPercent ?? ''} onChange={(e) => setClaimEditData((prev: any) => ({ ...prev, coPayPercent: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" min="0" max="100" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Co-Pay Type</label>
                              <select value={claimEditData.coPayType || 'Patient Pays'} onChange={(e) => setClaimEditData((prev: any) => ({ ...prev, coPayType: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                <option value="Patient Pays">Patient Pays</option>
                                <option value="Deduct from Claim">Deduct from Claim</option>
                                <option value="Clinic Adjusts">Clinic Adjusts</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                              <input type="text" value={claimEditData.notes || ''} onChange={(e) => setClaimEditData((prev: any) => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Support Documents</label>
                              <input type="file" multiple accept="image/*,.pdf" onChange={handleClaimEditDocumentsUpload} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" disabled={claimEditUploadingFiles} />
                              {claimEditData.documentFiles?.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Attached Documents ({claimEditData.documentFiles.length})</p>
                                  <div className="flex flex-wrap gap-2">
                                    {claimEditData.documentFiles.map((f: string, i: number) => (
                                      <button
                                        key={i}
                                        onClick={() => setDocViewerUrl(f)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-[10px] font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                                      >
                                        <Paperclip className="w-3 h-3" />
                                        Doc {i + 1}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            {(claimEditData.claimType === 'Advance' || claimEditData.claimType === 'Paid') && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">{claimEditData.claimType} Status</label>
                                  <select value={claimEditData.advanceStatus || 'Full Pay'} onChange={(e) => {
                                    const amt = parseFloat(claimEditData.claimAmount) || 0;
                                    setClaimEditData((prev: any) => ({
                                      ...prev,
                                      advanceStatus: e.target.value,
                                      advanceAmount: e.target.value === 'Full Pay' ? amt : amt * 0.5,
                                    }));
                                  }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                    <option value="Full Pay">Full Pay</option>
                                    <option value="Partial Pay">Partial Pay</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">{claimEditData.claimType} Amount (Enter)</label>
                                  <input type="number" value={claimEditData.advanceAmount ?? ''} onChange={(e) => setClaimEditData((prev: any) => ({ ...prev, advanceAmount: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold" placeholder="Enter amount" min="0" step="0.01" />
                                </div>
                              </>
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
                
                // Build treatment items from appointments (for Ongoing and All sections)
                const appointmentTreatments = (allAppointmentsData || [])
                  .filter((apt: any) => {
                    // Filter out appointments without valid treatment names
                    const treatmentName = apt.treatmentName || apt.serviceName || '';
                    const hasValidTreatmentName = treatmentName && 
                                                  treatmentName.trim() !== '' && 
                                                  treatmentName.toLowerCase() !== 'appointment';
                    return hasValidTreatmentName;
                  })
                  .map((apt: any) => {
                    const status = (apt.status || apt.appointmentStatus || '').toLowerCase();
                    const isCompleted = status === 'completed' || status === 'discharge';
                    
                    // Get treatment name
                    const treatmentName = apt.treatmentName || apt.serviceName || '';
                    
                    // Get doctor name
                    const doctorName = apt.doctorName || '';
                    
                    // Get date
                    const date = apt.appointmentDate 
                      ? new Date(apt.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : (apt.createdAt 
                        ? new Date(apt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'N/A');
                    
                    // Get time
                    const time = apt.fromTime || '';
                    
                    // Get invoice number if available
                    const invoiceNumber = apt.invoiceNumber || apt.invoiceNo || apt._id?.slice(-8).toUpperCase() || '';
                    
                    return {
                      source: 'appointment',
                      data: apt,
                      treatmentName,
                      doctorName,
                      date: time ? `${date} at ${time}` : date,
                      treatmentStatus: isCompleted ? 'completed' : 'ongoing',
                      amount: apt.amount || apt.totalAmount || 0,
                      paid: apt.paidAmount || 0,
                      isFullyPaid: isCompleted,
                      invoiceNumber
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
                    
                    // Calculate pending amount based on original amount
                    const pendingAmount = originalAmount - paid;
                    
                    // Check if this invoice's pending was cleared by a newer invoice
                    // Look for any newer invoice that has pendingUsed > 0
                    const hasNewerInvoiceWithPendingUsed = (billingHistory || []).some((otherBilling: any) => {
                      const otherDate = otherBilling.createdAt ? new Date(otherBilling.createdAt).getTime() : 0;
                      const otherPendingUsed = parseFloat(otherBilling.pendingUsed || 0) || 0;
                      // Check if this is a newer invoice (created after current billing) with pendingUsed > 0
                      return otherDate > billingDate && otherPendingUsed > 0;
                    });
                    
                    // Check if pending was cleared separately (pendingUsed > 0 means THIS invoice cleared previous pending)
                    const pendingClearedSeparately = pendingUsed > 0;
                    
                    // Check if fully paid:
                    // PRIMARY CHECK: Use the pending field from backend
                    // - If pending > 0 AND no newer invoice cleared it → NOT fully paid (show in pending section)
                    // - If pending > 0 BUT newer invoice cleared it (hasNewerInvoiceWithPendingUsed) → completed
                    // - If pending = 0 AND (paid >= amount OR pendingClearedSeparately) → fully paid
                    // - Special case: manuallyPaidInvoices for invoices paid but billing not updated yet
                    const hasPendingAmount = pending > 0;
                    const isFullyPaid = (!hasPendingAmount && (paid >= amount || pendingClearedSeparately)) ||
                                       (hasPendingAmount && hasNewerInvoiceWithPendingUsed) || // Pending was cleared by newer invoice
                                       manuallyPaidInvoices.has(invoiceNumber);
                    
                    // Debug logging for invoice status calculation
                    console.log('📊 Invoice Status Calculation:', {
                      invoiceNumber,
                      treatment: billing.treatment || billing.package || 'N/A',
                      originalAmount,
                      amount,
                      paid,
                      pending,
                      pendingUsed,
                      billingDate: new Date(billingDate).toLocaleString(),
                      hasNewerInvoiceWithPendingUsed,
                      hasPendingAmount,
                      pendingClearedSeparately,
                      isFullyPaid,
                      reason: manuallyPaidInvoices.has(invoiceNumber) ? 'manuallyPaidInvoices' :
                              (hasPendingAmount && hasNewerInvoiceWithPendingUsed) ? 'PENDING_CLEARED_BY_NEWER_INVOICE' :
                              hasPendingAmount ? 'HAS_PENDING_FROM_BACKEND' :
                              pendingClearedSeparately ? 'pendingClearedSeparately' :
                              paid >= amount ? 'paid_equals_or_exceeds_amount' : 'NOT_FULLY_PAID'
                    });
                    
                    // Status based on actual payment status
                    const treatmentStatus = isFullyPaid ? 'completed' : 'pending';
                    
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
                      pendingAmount,
                      isFullyPaid,
                      invoiceNumber
                    };
                  });

                console.log('Appointment treatments:', appointmentTreatments);
                console.log('Billing treatments:', billingTreatments);
                console.log('Treatment filter:', treatmentFilter);

                // Filter based on treatmentFilter
                let filtered: any[] = [];
                
                if (treatmentFilter === 'completed') {
                  // Completed section: Use billing history (fully paid treatments with ZERO pending amount)
                  filtered = billingTreatments.filter((t: any) => {
                    // Only show treatments where status is completed (fully paid)
                    return t.treatmentStatus === 'completed';
                  });
                } else if (treatmentFilter === 'pending') {
                  // Pending section: Show billing treatments with pending status badge
                  filtered = billingTreatments.filter((t: any) => {
                    return t.treatmentStatus === 'pending';
                  });
                } else if (treatmentFilter === 'ongoing') {
                  // Ongoing section: Use appointments (non-completed status) - FILTER OUT empty treatment names
                  filtered = appointmentTreatments.filter((t: any) => {
                    // Filter out appointments without treatment names (like generic "Appointment" entries)
                    const hasValidTreatmentName = t.treatmentName && 
                                                  t.treatmentName.trim() !== '' && 
                                                  t.treatmentName.toLowerCase() !== 'appointment';
                    return t.treatmentStatus === 'ongoing' && hasValidTreatmentName;
                  });
                } else {
                  // All section: Combine ONLY filtered data from Ongoing, Pending, and Completed sections
                  // Get completed treatments (billing with completed status)
                  const completedTreatments = billingTreatments.filter((t: any) => {
                    return t.treatmentStatus === 'completed';
                  });
                  
                  // Get pending treatments (billing with pending status)
                  const pendingTreatments = billingTreatments.filter((t: any) => {
                    return t.treatmentStatus === 'pending';
                  });
                  
                  // Get ongoing treatments (appointments with valid treatment names)
                  const ongoingTreatments = appointmentTreatments.filter((t: any) => {
                    const hasValidTreatmentName = t.treatmentName && 
                                                  t.treatmentName.trim() !== '' && 
                                                  t.treatmentName.toLowerCase() !== 'appointment';
                    return t.treatmentStatus === 'ongoing' && hasValidTreatmentName;
                  });
                  
                  // Combine ONLY valid records from all three sections
                  filtered = [...completedTreatments, ...pendingTreatments, ...ongoingTreatments];
                  
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
                    {/* Filter Chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {(['all', 'ongoing', 'pending', 'completed'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setTreatmentFilter(f)}
                          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors capitalize ${
                            treatmentFilter === f
                              ? 'bg-teal-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Loading state */}
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
                          const pendingAmount = item.pendingAmount || (item.amount - item.paid);
                          const isFromBilling = item.source === 'billing';
                          const hasPendingAmount = pendingAmount > 0;
                          
                          return (
                            <div
                              key={item.data._id || index}
                              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="text-base font-bold text-gray-900">{item.treatmentName}</h4>
                                  {item.doctorName && (
                                    <p className="text-sm text-gray-500 mt-0.5">{item.doctorName}</p>
                                  )}
                                  {/* Invoice Number - Show for all items with invoice number */}
                                  {item.invoiceNumber && (
                                    <p className="text-xs text-gray-400 mt-1">Invoice Number : {item.invoiceNumber}</p>
                                  )}
                                </div>
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                  isPending
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : isCompleted
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {isPending ? (
                                    <AlertCircle className="w-3.5 h-3.5" />
                                  ) : isCompleted ? (
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5" />
                                  )}
                                  {isPending ? 'Pending' : isCompleted ? 'Completed' : 'Ongoing'}
                                </span>
                              </div>

                              {/* Payment Info - Only show for Ongoing filter if amount > 0 */}
                              {treatmentFilter === 'ongoing' && item.amount > 0 && (
                                <div className="space-y-2 mb-3">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Total Amount:</span>
                                    <span className="font-semibold text-gray-900">{getCurrencySymbol(currency)} {item.amount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Paid:</span>
                                    <span className="font-semibold text-green-600">{getCurrencySymbol(currency)} {item.paid.toFixed(2)}</span>
                                  </div>
                                  {hasPendingAmount && (
                                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                                      <span className="text-gray-500">Pending:</span>
                                      <span className="font-bold text-red-600">{getCurrencySymbol(currency)} {pendingAmount.toFixed(2)}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Date - Only show for Ongoing filter if amount > 0 */}
                              {treatmentFilter === 'ongoing' && item.amount > 0 && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
                                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>{isFromBilling ? 'Billed' : 'Date'}: {item.date}</span>
                                </div>
                              )}
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
