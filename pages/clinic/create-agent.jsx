'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { getCurrencySymbol } from '@/lib/currencyHelper';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  CalendarCheck,
  DollarSign,
  Percent,
  FileStack,
  UserPlus,
  RefreshCw,
  Trash2,
  X,
  UserX,
  Eye,
  EyeOff,
  Upload,
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import CreateAgentModal from '../../components/CreateAgentModal';
import AgentPermissionModal from '../../components/AgentPermissionModal';
import DoctorTreatmentModal from '../../components/DoctorTreatmentModal';
import ClinicLayout from '../../components/ClinicLayout';
import withClinicAuth from '../../components/withClinicAuth';
import Loader from '../../components/Loader';

const TOKEN_PRIORITY = [
  'clinicToken',
  'doctorToken',
  'agentToken',
  'staffToken',
  'adminToken',
];

const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
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

const ManageAgentsPage = () => {
  const router = useRouter();
  const [agents, setAgents] = useState([]);
  const [doctorStaff, setDoctorStaff] = useState([]);
  const [activeView, setActiveView] = useState('agents');
  const [menuAgentId, setMenuAgentId] = useState(null);
  const [profileAgent, setProfileAgent] = useState(null);
  const [viewAgent, setViewAgent] = useState(null);
  const [viewProfile, setViewProfile] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    idType: "aadhaar",
    idNumber: "",
    idDocumentFrontUrl: "",
    idDocumentBackUrl: "",
    passportNumber: "",
    passportDocumentFrontUrl: "",
    passportDocumentBackUrl: "",
    emergencyPhone: "",
    emergencyName: "",
    baseSalary: "",
    commissionType: "flat",
    commissionPercentage: "",
    targetMultiplier: "1",
    targetAmount: "",
    contractFrontUrl: "",
    contractBackUrl: "",
    contractType: "full",
    employeeVisaFrontUrl: "",
    employeeVisaBackUrl: "",
    discountType: "",
    discountAmount: "",
    otherDocuments: [],
    bankPermissions: {
      card: false,
      bankTransfer: false,
      tabby: false,
      tamara: false
    }
  });
  const [uploadingIdDocFront, setUploadingIdDocFront] = useState(false);
  const [uploadingIdDocBack, setUploadingIdDocBack] = useState(false);
  const [uploadingPassportDocFront, setUploadingPassportDocFront] = useState(false);
  const [uploadingPassportDocBack, setUploadingPassportDocBack] = useState(false);
  const [uploadingContractFront, setUploadingContractFront] = useState(false);
  const [uploadingContractBack, setUploadingContractBack] = useState(false);
  const [uploadingEmployeeVisaFront, setUploadingEmployeeVisaFront] = useState(false);
  const [uploadingEmployeeVisaBack, setUploadingEmployeeVisaBack] = useState(false);
  const [otherDocsUploading, setOtherDocsUploading] = useState({});
  const [completionMap, setCompletionMap] = useState({});
  const [agentProfiles, setAgentProfiles] = useState({});
  const [passwordAgent, setPasswordAgent] = useState(null);
  const [permissionAgent, setPermissionAgent] = useState(null);
  const [treatmentAgent, setTreatmentAgent] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteAgent, setDeleteAgent] = useState(null);
  const [permissions, setPermissions] = useState({
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canRead: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [totalAppointments, setTotalAppointments] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(null);
  const [totalCommission, setTotalCommission] = useState(null);
  const [commissionPercent, setCommissionPercent] = useState(null);
  const [currency, setCurrency] = useState('INR');
  const [clinicBankDetails, setClinicBankDetails] = useState(null);

  // Get the appropriate token based on what's available (clinic > doctor > admin)
  // This ensures we use the correct token for the logged-in user
  const clinicToken = typeof window !== 'undefined' ? localStorage.getItem('clinicToken') : null;
  const doctorToken = typeof window !== 'undefined' ? localStorage.getItem('doctorToken') : null;
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
 
  // Determine which token to use based on what's available
  // Priority: clinicToken > doctorToken > adminToken
  const token = clinicToken || doctorToken || adminToken || agentToken;

  // Helper function to get user role from token
  const getUserRole = () => {
    if (typeof window === 'undefined') return null;
    try {
      for (const key of TOKEN_PRIORITY) {
        const token = localStorage.getItem(key) || sessionStorage.getItem(key);
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
      console.error('Error getting user role:', error);
    }
    return null;
  };

  // Fetch permissions - same pattern as myallClinic.tsx and create-offer.jsx
  useEffect(() => {
    const fetchClinicCurrency = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers) return;
        const res = await axios.get('/api/clinics/myallClinic', { headers });
        if (res.data.success && res.data.clinic?.currency) {
          setCurrency(res.data.clinic.currency);
        }
        if (res.data.success && res.data.clinic?.bankDetails) {
          setClinicBankDetails(res.data.clinic.bankDetails);
        }
      } catch (e) { 
        console.error('Error fetching clinic currency:', e); 
      }
    };
    fetchClinicCurrency();
  }, []);

  // Fetch permissions - same pattern as myallClinic.tsx and create-offer.jsx
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
          setPermissions({
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canRead: false,
          });
          setPermissionsLoaded(true);
          return;
        }

        const userRole = getUserRole();
       
        // For clinic and doctor roles, fetch admin-level permissions from /api/clinic/sidebar-permissions
        if (userRole === "clinic" || userRole === "doctor") {
          try {
            const res = await axios.get("/api/clinic/sidebar-permissions", {
              headers: authHeaders,
            });
           
            if (res.data.success) {
              // Check if permissions array exists and is not null
              // If permissions is null, admin hasn't set any restrictions yet - allow full access (backward compatibility)
              if (res.data.permissions === null || !Array.isArray(res.data.permissions) || res.data.permissions.length === 0) {
                // No admin restrictions set yet - default to full access for backward compatibility
                setPermissions({
                  canCreate: true,
                  canRead: true,
                  canUpdate: true,
                  canDelete: true,
                });
              } else {
                // Admin has set permissions - check the clinic_create_agent module
                const modulePermission = res.data.permissions.find((p) => {
                  if (!p?.module) return false;
                  // Check for clinic_create_agent module
                  if (p.module === "clinic_create_agent") return true;
                  if (p.module === "create_agent") return true;
                  if (p.module === "clinic-create-agent") return true;
                  if (p.module === "create-agent") return true;
                  return false;
                });

                if (modulePermission) {
                  const actions = modulePermission.actions || {};
                 
                  // Check if "all" is true, which grants all permissions
                  const moduleAll = actions.all === true || actions.all === "true" || String(actions.all).toLowerCase() === "true";
                  const moduleCreate = actions.create === true || actions.create === "true" || String(actions.create).toLowerCase() === "true";
                  const moduleRead = actions.read === true || actions.read === "true" || String(actions.read).toLowerCase() === "true";
                  const moduleUpdate = actions.update === true || actions.update === "true" || String(actions.update).toLowerCase() === "true";
                  const moduleDelete = actions.delete === true || actions.delete === "true" || String(actions.delete).toLowerCase() === "true";

                  setPermissions({
                    canCreate: moduleAll || moduleCreate,
                    canRead: moduleAll || moduleRead,
                    canUpdate: moduleAll || moduleUpdate,
                    canDelete: moduleAll || moduleDelete,
                  });
                } else {
                  // Module permission not found in the permissions array - default to read-only
                  setPermissions({
                    canCreate: false,
                    canRead: true, // Clinic/doctor can always read their own data
                    canUpdate: false,
                    canDelete: false,
                  });
                }
              }
            } else {
              // API response doesn't have permissions, default to full access (backward compatibility)
              setPermissions({
                canCreate: true,
                canRead: true,
                canUpdate: true,
                canDelete: true,
              });
            }
          } catch (err) {
            console.error("Error fetching clinic sidebar permissions:", err);
            // On error, default to full access (backward compatibility)
            setPermissions({
              canCreate: true,
              canRead: true,
              canUpdate: true,
              canDelete: true,
            });
          }
          setPermissionsLoaded(true);
          return;
        }

        // For agents, staff, and doctorStaff, fetch from /api/agent/permissions
        if (["agent", "staff", "doctorStaff"].includes(userRole || "")) {
          let permissionsData = null;
          try {
            // Get agentId from token
            const token = getStoredToken();
            if (token) {
              const payload = JSON.parse(atob(token.split('.')[1]));
              const agentId = payload.userId || payload.id;
             
              if (agentId) {
                const res = await axios.get(`/api/agent/permissions?agentId=${agentId}`, {
                  headers: authHeaders,
                });
               
                if (res.data.success && res.data.data) {
                  permissionsData = res.data.data;
                }
              }
            }
          } catch (err) {
            console.error("Error fetching agent permissions:", err);
          }

          if (permissionsData && permissionsData.permissions) {
            const modulePermission = permissionsData.permissions.find((p) => {
              if (!p?.module) return false;
              if (p.module === "create_agent") return true;
              if (p.module === "clinic_create_agent") return true;
              if (p.module === "clinic-create-agent") return true;
              if (p.module === "create-agent") return true;
              if (p.module.startsWith("clinic_") && p.module.slice(7) === "create_agent") {
                return true;
              }
              return false;
            });

            if (modulePermission) {
              const actions = modulePermission.actions || {};
             
              // Module-level "all" grants all permissions
              const moduleAll = actions.all === true || actions.all === "true" || String(actions.all).toLowerCase() === "true";
              const moduleCreate = actions.create === true || actions.create === "true" || String(actions.create).toLowerCase() === "true";
              const moduleRead = actions.read === true || actions.read === "true" || String(actions.read).toLowerCase() === "true";
              const moduleUpdate = actions.update === true || actions.update === "true" || String(actions.update).toLowerCase() === "true";
              const moduleDelete = actions.delete === true || actions.delete === "true" || String(actions.delete).toLowerCase() === "true";

              setPermissions({
                canCreate: moduleAll || moduleCreate,
                canRead: moduleAll || moduleRead,
                canUpdate: moduleAll || moduleUpdate,
                canDelete: moduleAll || moduleDelete,
              });
            } else {
              // No permissions found for this module, default to false
              setPermissions({
                canCreate: false,
                canRead: false,
                canUpdate: false,
                canDelete: false,
              });
            }
          } else {
            // API failed or no permissions data, default to false
            setPermissions({
              canCreate: false,
              canRead: false,
              canUpdate: false,
              canDelete: false,
            });
          }
        } else {
          // Unknown role, default to false
          setPermissions({
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
          });
        }
        setPermissionsLoaded(true);
      } catch (err) {
        console.error("Error fetching permissions:", err);
        // On error, default to false (no permissions)
        setPermissions({
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
        });
        setPermissionsLoaded(true);
      }
    };

    fetchPermissions();
  }, []);

  const userRole = getUserRole();
 
  // Admin role bypasses all permission checks
  const canRead = userRole === 'admin' ? true : permissions.canRead;
  const canCreate = userRole === 'admin' ? true : permissions.canCreate;
  const canUpdate = userRole === 'admin' ? true : permissions.canUpdate;
  const canDelete = userRole === 'admin' ? true : permissions.canDelete;

  async function loadAgents() {
    try {
      const { data } = await axios.get('/api/lead-ms/get-agents?role=agent', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setAgents(data.agents || []);
    } catch (err) {
      console.error(err);
      // Don't show error toast if read permission is false (access denied scenario)
      // Also check for 403 status code (Forbidden/Access Denied)
      const status = err.response?.status;
      if (!canRead || status === 403) {
        // Access denied - don't show error message
        return;
      }
      // Only show error for other failures (network errors, etc.)
      toast.error('Failed to load agents');
    }
  }

  async function loadDoctorStaff() {
    try {
      const { data } = await axios.get('/api/lead-ms/get-agents?role=doctorStaff', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setDoctorStaff(data.agents || []);
    } catch (err) {
      console.error(err);
      // Don't show error toast if read permission is false (access denied scenario)
      // Also check for 403 status code (Forbidden/Access Denied)
      const status = err.response?.status;
      if (!canRead || status === 403) {
        // Access denied - don't show error message
        return;
      }
      // Only show error for other failures (network errors, etc.)
      toast.error('Failed to load doctor staff');
    }
  }

  async function loadAll(initial = false) {
    if (initial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      await Promise.all([loadAgents(), loadDoctorStaff()]);
      if (!initial) {
        toast.success('Data refreshed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  async function fetchAgentProfile(agentId) {
    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders) return null;
      const res = await axios.get(`/api/lead-ms/get-agents?agentId=${agentId}`, { headers: authHeaders });
      if (res.data.success) return res.data.profile || {};
    } catch {
      return null;
    }
    return null;
  }

  function computeCompletion(agent, profile) {
    let total = 7;
    let score = 0;
    if (profile?.emergencyPhone) score += 1;
    if (agent?.phone) score += 1;
    if (profile?.idNumber && profile?.idDocumentFrontUrl && profile?.idDocumentBackUrl) score += 1;
    if (profile?.passportNumber && profile?.passportDocumentFrontUrl && profile?.passportDocumentBackUrl) score += 1;
    if (profile?.contractFrontUrl && profile?.contractBackUrl) score += 1;
    if (typeof profile?.baseSalary === "number" ? profile.baseSalary > 0 : parseFloat(profile?.baseSalary) > 0) score += 1;
    if (profile?.commissionType) score += 1;
    return Math.round((score / total) * 100);
  }

  useEffect(() => {
    async function loadCompletions() {
      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;
      const list = activeView === "agents" ? agents : doctorStaff;
      const updates = {};
      const profiles = {};
      await Promise.all(
        list.map(async (u) => {
          const profile = await fetchAgentProfile(u._id);
          updates[u._id] = computeCompletion(u, profile || {});
          profiles[u._id] = profile || {};
        })
      );
      setCompletionMap((prev) => ({ ...prev, ...updates }));
      setAgentProfiles((prev) => ({ ...prev, ...profiles }));
    }
    if (canRead === true && (agents.length > 0 || doctorStaff.length > 0)) {
      loadCompletions();
    }
  }, [agents, doctorStaff, activeView, canRead]);

  async function openProfile(agent) {
    const authHeaders = getAuthHeaders();
    if (!authHeaders) return;
    setProfileAgent(agent);
    setProfileForm((f) => ({
      ...f,
      name: agent.name || "",
      email: agent.email || "",
      phone: agent.phone || ""
    }));
    try {
      const res = await axios.get(`/api/lead-ms/get-agents?agentId=${agent._id}`, { headers: authHeaders });
      if (res.data.success) {
        const p = res.data.profile || {};
        setProfileForm({
          name: agent.name || "",
          email: agent.email || "",
          phone: agent.phone || "",
          idType: p.idType || "aadhaar",
          idNumber: p.idNumber || "",
          idDocumentFrontUrl: p.idDocumentFrontUrl || "",
          idDocumentBackUrl: p.idDocumentBackUrl || "",
          passportNumber: p.passportNumber || "",
          passportDocumentFrontUrl: p.passportDocumentFrontUrl || "",
          passportDocumentBackUrl: p.passportDocumentBackUrl || "",
          emergencyPhone: p.emergencyPhone || "",
          emergencyName: p.emergencyName || "",
          baseSalary: typeof p.baseSalary === "number" ? String(p.baseSalary) : (p.baseSalary || ""),
          commissionType: p.commissionType || "flat",
          commissionPercentage: p.commissionPercentage || "",
          targetMultiplier: p.targetMultiplier != null ? String(p.targetMultiplier) : "1",
          targetAmount: typeof p.targetAmount === "number" ? String(p.targetAmount) : (p.targetAmount || ""),
          contractFrontUrl: p.contractFrontUrl || "",
          contractBackUrl: p.contractBackUrl || "",
          contractType: p.contractType || "full",
          employeeVisaFrontUrl: p.employeeVisaFrontUrl || "",
          employeeVisaBackUrl: p.employeeVisaBackUrl || "",
          discountType: p.discountType || "",
          discountAmount: typeof p.discountAmount === "number" ? String(p.discountAmount) : (p.discountAmount || ""),
          otherDocuments: Array.isArray(p.otherDocuments) ? p.otherDocuments : [],
          bankPermissions: {
            card: p.bankPermissions?.card || false,
            bankTransfer: p.bankPermissions?.bankTransfer || false,
            tabby: p.bankPermissions?.tabby || false,
            tamara: p.bankPermissions?.tamara || false
          }
        });
      }
    } catch {}
  }

  const getFileNameFromUrl = (url) => {
    try {
      if (!url || typeof url !== 'string') return '';
      const u = new URL(url);
      const pathname = u.pathname || '';
      const name = pathname.split('/').filter(Boolean).pop() || '';
      return name || url.split('?')[0].split('/').pop() || '';
    } catch {
      return url?.split('?')[0]?.split('/')?.pop() || '';
    }
  };
  const isImageUrl = (u) => {
    try {
      const s = (u || '').split('?')[0];
      return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(s);
    } catch {
      return false;
    }
  };
  const isPdfUrl = (u) => {
    try {
      const s = (u || '').split('?')[0];
      return /\.pdf$/i.test(s);
    } catch {
      return false;
    }
  };
  const [activity, setActivity] = useState(null);
  const [activityRefreshInterval, setActivityRefreshInterval] = useState(null);
  const openAdditionalDocsEditor = () => {
    if (!viewAgent) return;
    const agentRef = viewAgent;
    setViewAgent(null);
    setTimeout(() => openProfile(agentRef), 0);
  };
  const timeAgo = (d) => {
    if (!d) return '—';
    const t = new Date(d).getTime();
    if (isNaN(t)) return '—';
    const diff = Math.floor((Date.now() - t) / 1000);
    if (diff < 60) return `${diff}s ago`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hours ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days} days ago`;
    return new Date(d).toLocaleString();
  };

  // Function to refresh activity data for current viewed agent
  const refreshActivity = async () => {
    if (!viewAgent?._id) return;
    const authHeaders = getAuthHeaders();
    if (!authHeaders) return;
    try {
      const act = await axios.get(`/api/lead-ms/agent-activity?agentId=${viewAgent._id}`, { headers: authHeaders });
      if (act.data?.success) {
        setActivity(act.data.data || null);
      } else {
        setActivity(null);
      }
    } catch (error) {
      console.error('Failed to refresh activity:', error);
      setActivity(null);
    }
  };

  // Start periodic activity refresh when viewing an agent
  const startActivityRefresh = (agent) => {
    // Clear any existing interval
    if (activityRefreshInterval) {
      clearInterval(activityRefreshInterval);
    }
    // Set up new interval to refresh every 10 seconds
    const intervalId = setInterval(() => {
      refreshActivity();
    }, 10000);
    setActivityRefreshInterval(intervalId);
  };

  // Stop periodic activity refresh
  const stopActivityRefresh = () => {
    if (activityRefreshInterval) {
      clearInterval(activityRefreshInterval);
      setActivityRefreshInterval(null);
    }
  };

  async function openView(agent) {
    const authHeaders = getAuthHeaders();
    if (!authHeaders) return;
    setViewAgent(agent);
    setViewLoading(true);
    try {
      const res = await axios.get(`/api/lead-ms/get-agents?agentId=${agent._id}`, { headers: authHeaders });
      if (res.data.success) {
        const p = res.data.profile || {};
        setViewProfile(p);
        try {
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const dd = String(today.getDate()).padStart(2, '0');
          const toDate = `${yyyy}-${mm}-${dd}`;
          const baseParams = { page: 1, limit: 1, fromDate: '1970-01-01', toDate };
          const params = { ...baseParams };
          // Appointments/revenue: doctorStaff uses doctor-performance API as primary source
          if (agent?.role === 'doctorStaff') {
            try {
              const perfRes = await axios.get("/api/clinics/doctor-performance", {
                headers: authHeaders,
                params: { filter: 'all' }
              });
              const appts = perfRes.data?.data?.appointmentsPerDoctor || [];
              const revs = perfRes.data?.data?.revenuePerDoctor || [];
              const docA = appts.find((d) => d.doctorId === String(agent._id));
              const docR = revs.find((d) => d.doctorId === String(agent._id));
              setTotalAppointments(docA?.appointmentCount ?? 0);
              setTotalRevenue(typeof docR?.estimatedRevenue === 'number' ? docR.estimatedRevenue : 0);
              // Fetch total commission (all-time) from commissions summary
              try {
                const commRes = await axios.get("/api/clinic/commissions/summary", {
                  headers: authHeaders,
                  params: { source: 'staff' }
                });
                const commData = commRes.data || {};
                // Support response shapes: {items: []}, {results: []}, or []
                const list = Array.isArray(commData.items) ? commData.items : (Array.isArray(commData.results) ? commData.results : (Array.isArray(commData) ? commData : []));
                const me = list.find((row) => String(row.personId || row._id) === String(agent._id));
                setTotalCommission(typeof me?.totalEarned === 'number' ? me.totalEarned : 0);
                setCommissionPercent(
                  me && typeof me.percent !== 'undefined'
                    ? Number(me.percent)
                    : (viewProfile?.commissionPercentage != null ? Number(viewProfile.commissionPercentage) : null)
                );
              } catch {
                setTotalCommission(0);
                setCommissionPercent(viewProfile?.commissionPercentage != null ? Number(viewProfile.commissionPercentage) : null);
              }
            } catch {
              // Fallback to all-appointments if doctor-performance fails
              params.doctorId = agent._id;
              const aptRes = await axios.get("/api/clinic/all-appointments", {
                headers: authHeaders,
                params
              });
              if (aptRes.data?.success) {
                setTotalAppointments(aptRes.data.total || 0);
                setTotalRevenue(aptRes.data.totalRevenue ?? 0);
                setTotalCommission(0);
                setCommissionPercent(viewProfile?.commissionPercentage != null ? Number(viewProfile.commissionPercentage) : null);
              } else {
                setTotalAppointments(0);
                setTotalRevenue(0);
                setTotalCommission(0);
                setCommissionPercent(viewProfile?.commissionPercentage != null ? Number(viewProfile.commissionPercentage) : null);
              }
            }
          } else {
            // For agents: hide appointment section by clearing totalAppointments,
            // but still fetch revenue (agent-specific) for display
            setTotalAppointments(null);
            const revRes = await axios.get("/api/clinic/all-appointments", {
              headers: authHeaders,
              params: { ...baseParams, createdBy: agent._id }
            });
            if (revRes.data?.success) {
              setTotalRevenue(revRes.data.totalRevenue ?? 0);
            } else {
              setTotalRevenue(0);
            }
            // Fetch commission earned for this agent from commissions summary
            try {
              const commRes = await axios.get("/api/clinic/commissions/summary", {
                headers: authHeaders,
                params: { source: 'staff' }
              });
              const commData = commRes.data || {};
              // Support response shapes: {items: []}, {results: []}, or []
              const list = Array.isArray(commData.items) ? commData.items : (Array.isArray(commData.results) ? commData.results : (Array.isArray(commData) ? commData : []));
              const me = list.find((row) => String(row.personId || row._id) === String(agent._id));
              setTotalCommission(typeof me?.totalEarned === 'number' ? me.totalEarned : 0);
              setCommissionPercent(
                me && typeof me.percent !== 'undefined'
                  ? Number(me.percent)
                  : (p?.commissionPercentage != null ? Number(p.commissionPercentage) : null)
              );
            } catch {
              setTotalCommission(0);
              setCommissionPercent(p?.commissionPercentage != null ? Number(p.commissionPercentage) : null);
            }
          }
        } catch {
          // Fallbacks
          if (agent?.role === 'doctorStaff') {
            setTotalAppointments(0);
          } else {
            setTotalAppointments(null);
          }
          setTotalRevenue(0);
          setTotalCommission(0);
          setCommissionPercent(viewProfile?.commissionPercentage != null ? Number(viewProfile.commissionPercentage) : null);
        }
        try {
          const act = await axios.get(`/api/lead-ms/agent-activity?agentId=${agent._id}`, { headers: authHeaders });
          if (act.data?.success) {
            setActivity(act.data.data || null);
          } else {
            setActivity(null);
          }
        } catch {
          setActivity(null);
        }
       
        // Start periodic activity refresh
        startActivityRefresh(agent);
      } else {
        setViewProfile(null);
        setActivity(null);
        setTotalAppointments(null);
        setTotalRevenue(null);
      }
    } catch {
      setViewProfile(null);
      setActivity(null);
      setTotalAppointments(null);
      setTotalRevenue(null);
    } finally {
      setViewLoading(false);
    }
  }

  async function handleDeactivate(userId) {
    const authHeaders = getAuthHeaders();
    if (!authHeaders) return;
    try {
      if (!userId) return;
      const confirmed = window.confirm("Are you sure you want to deactivate and delete this profile?");
      if (!confirmed) return;
      await axios.delete("/api/lead-ms/delete-agent", {
        headers: authHeaders,
        data: { agentId: userId }
      });
      toast.success("Profile deleted");
      stopActivityRefresh();
      setViewAgent(null);
      setViewProfile(null);
      setActivity(null);
      await loadAll(false);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to deactivate");
    }
  }

  async function uploadFile(file, setUrl, setLoading) {
    if (!file) return;
    const authHeaders = getAuthHeaders();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post("/api/upload", formData, {
        headers: { ...(authHeaders || {}), "Content-Type": "multipart/form-data" }
      });
      if (res.data.success && res.data.url) {
        setUrl(res.data.url);
        toast.success("Uploaded");
      } else {
        toast.error(res.data.message || "Upload failed");
      }
    } catch (e) {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!profileAgent) return;
    const authHeaders = getAuthHeaders();
    if (!authHeaders) return;
    try {
      const payload = {
        agentId: profileAgent._id,
        action: "updateProfile",
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        emergencyPhone: profileForm.emergencyPhone,
        emergencyName: profileForm.emergencyName,
        idType: profileForm.idType,
        idNumber: profileForm.idNumber,
        idDocumentFrontUrl: profileForm.idDocumentFrontUrl,
        idDocumentBackUrl: profileForm.idDocumentBackUrl,
        passportNumber: profileForm.passportNumber,
        passportDocumentFrontUrl: profileForm.passportDocumentFrontUrl,
        passportDocumentBackUrl: profileForm.passportDocumentBackUrl,
        contractFrontUrl: profileForm.contractFrontUrl,
        contractBackUrl: profileForm.contractBackUrl,
        contractType: profileForm.contractType,
        baseSalary: parseFloat(profileForm.baseSalary || "0"),
        commissionType: profileForm.commissionType,
        commissionPercentage: profileForm.commissionPercentage,
        targetMultiplier: parseFloat(profileForm.targetMultiplier || "1"),
        targetAmount: (() => {
          const isTarget = profileForm.commissionType === 'target_based' || profileForm.commissionType === 'target_plus_expense';
          const base = parseFloat(profileForm.baseSalary || "0");
          const mult = parseFloat(profileForm.targetMultiplier || "1");
          return isTarget ? base * mult : parseFloat(profileForm.targetAmount || "0");
        })(),
        employeeVisaFrontUrl: profileForm.employeeVisaFrontUrl,
        employeeVisaBackUrl: profileForm.employeeVisaBackUrl,
        discountType: profileForm.discountType,
        discountAmount: parseFloat(profileForm.discountAmount || "0"),
        otherDocuments: Array.isArray(profileForm.otherDocuments)
          ? profileForm.otherDocuments.filter(d => d && d.name && d.url).map(d => ({ name: d.name, url: d.url }))
          : [],
        bankPermissions: profileForm.bankPermissions
      };
      const res = await axios.patch("/api/lead-ms/get-agents", payload, { headers: authHeaders });
      if (res.data.success) {
        const pct = computeCompletion(
          { ...profileAgent, phone: payload.phone },
          {
            emergencyPhone: payload.emergencyPhone,
            idNumber: payload.idNumber,
            idDocumentFrontUrl: payload.idDocumentFrontUrl,
            idDocumentBackUrl: payload.idDocumentBackUrl,
            passportNumber: payload.passportNumber,
            passportDocumentFrontUrl: payload.passportDocumentFrontUrl,
            passportDocumentBackUrl: payload.passportDocumentBackUrl,
            contractFrontUrl: payload.contractFrontUrl,
            contractBackUrl: payload.contractBackUrl,
            baseSalary: payload.baseSalary,
            commissionType: payload.commissionType,
            commissionPercentage: payload.commissionPercentage
          }
        );
        setCompletionMap((prev) => ({ ...prev, [profileAgent._id]: pct }));
        setProfileAgent(null);
        toast.success("Profile updated");
      } else {
        toast.error(res.data.message || "Failed to update");
      }
    } catch {
      toast.error("Failed to update");
    }
  }

  useEffect(() => {
    if (!token) return;
    if (!permissionsLoaded) return;
    if (canRead !== true) {
      setAgents([]);
      setDoctorStaff([]);
      setIsLoading(false);
      return;
    }
    loadAll(true);
  }, [token, permissionsLoaded, canRead]);

  // Cleanup activity refresh on component unmount
  useEffect(() => {
    return () => {
      if (activityRefreshInterval) {
        clearInterval(activityRefreshInterval);
      }
    };
  }, [activityRefreshInterval]);

  async function handleAction(agentId, action) {
    if (canRead !== true) return;
    const requiresUpdate = action === 'approve' || action === 'decline';
    if (requiresUpdate && canUpdate !== true) {
      toast.error("You don't have permission to perform this action");
      return;
    }
    try {
      const { data } = await axios.patch(
        '/api/lead-ms/get-agents',
        { agentId, action },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) {
        if (data.agent.role === 'doctorStaff') {
          setDoctorStaff((prev) =>
            prev.map((a) => (a._id === agentId ? data.agent : a))
          );
        } else {
          setAgents((prev) =>
            prev.map((a) => (a._id === agentId ? data.agent : a))
          );
        }
        toast.success(`Member ${action === 'approve' ? 'approved' : 'declined'} successfully`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update member status');
    }
  }

  async function handleDelete(agentId) {
    if (canDelete !== true) {
      toast.error("You don't have permission to delete members");
      return;
    }
    if (!agentId) return;
    try {
      const { data } = await axios.delete(
        '/api/lead-ms/delete-agent',
        {
          data: { agentId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) {
        // Remove from the appropriate list
        if (data.deletedUser.role === 'doctorStaff') {
          setDoctorStaff((prev) => prev.filter((a) => a._id !== agentId));
        } else {
          setAgents((prev) => prev.filter((a) => a._id !== agentId));
        }
        setDeleteAgent(null);
        setMenuAgentId(null);
        toast.success(`${data.deletedUser.role === 'doctorStaff' ? 'Doctor' : 'Agent'} deleted successfully`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete member');
      setDeleteAgent(null);
    }
  }

  async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    if (canUpdate !== true) {
      toast.error("You don't have permission to update members");
      return;
    }
    if (!passwordAgent) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      const { data } = await axios.patch(
        '/api/lead-ms/get-agents',
        { agentId: passwordAgent._id, action: 'resetPassword', newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        if (data.agent.role === 'doctorStaff') {
          setDoctorStaff((prev) => prev.map((a) => (a._id === passwordAgent._id ? data.agent : a)));
        } else {
          setAgents((prev) => prev.map((a) => (a._id === passwordAgent._id ? data.agent : a)));
        }
        setPasswordAgent(null);
        setNewPassword('');
        setConfirmPassword('');
        setMenuAgentId(null);
        toast.success('Password updated successfully');
      } else {
        toast.error(data?.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to reset password');
    }
  }

  const currentList = activeView === 'agents' ? agents : doctorStaff;
  const totalAgents = agents.length;
  const approvedAgents = useMemo(() => agents.filter((a) => a.isApproved).length, [agents]);
  const declinedAgents = useMemo(() => agents.filter((a) => a.declined).length, [agents]);
  const pendingAgents = useMemo(() => agents.filter((a) => !a.isApproved && !a.declined).length, [agents]);
  const totalDoctorStaff = doctorStaff.length;
  const approvedDoctorStaff = useMemo(() => doctorStaff.filter((a) => a.isApproved).length, [doctorStaff]);
  const declinedDoctorStaff = useMemo(() => doctorStaff.filter((a) => a.declined).length, [doctorStaff]);
  const pendingDoctorStaff = useMemo(() => doctorStaff.filter((a) => !a.isApproved && !a.declined).length, [doctorStaff]);
  const totalTeam = totalAgents + totalDoctorStaff;
  const totalApproved = approvedAgents + approvedDoctorStaff;
  const totalDeclined = declinedAgents + declinedDoctorStaff;
  const totalPending = pendingAgents + pendingDoctorStaff;
  const approvalRate = totalTeam > 0 ? Math.round((totalApproved / totalTeam) * 100) : 0;

  // Status and trend visualizations removed per request

  const handleCreateClick = () => {
    if (canCreate !== true) {
      toast.error("You don't have permission to create agents");
      return;
    }
    setIsCreateOpen(true);
  };

  // Wait for permissions to load before showing UI
  if (!permissionsLoaded || isLoading) {
    return <Loader />;
  }

  // If read permission is false, show access denied
  if (canRead !== true) {
    if (canCreate === true) {
      // Show create button only
      return (
      <div className="w-full min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <Toaster
            position="top-right"
            toastOptions={{
              className: 'text-sm font-medium',
              style: { background: '#1f2937', color: '#f8fafc' },
            }}
          />
          <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-teal-900">Team Management</h1>
                <p className="text-xs sm:text-sm text-teal-700 mt-1">Manage Staffs and Doctors accounts</p>
              </div>
            </div>

            {/* Access Denied Message */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <h2 className="text-xl font-semibold text-teal-900 mb-2">Access Denied</h2>
              <p className="text-sm text-teal-700 mb-4">
                You do not have permission to view team members. However, you can create new members.
              </p>
              {canCreate === true && (
                <button
                  onClick={handleCreateClick}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Add {activeView === 'agents' ? 'Agent' : 'Doctor'}
                </button>
              )}
            </div>
          </div>

          {/* Create Agent Modal */}
          <CreateAgentModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onCreated={loadAll}
            token={clinicToken || undefined}
            doctorToken={doctorToken || undefined}
            adminToken={adminToken || undefined}
            defaultRole={activeView === 'doctorStaff' ? 'doctorStaff' : 'agent'}
          />
        </div>
      );
    } else {
      // Show full access denied
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-teal-900 mb-2">Access denied</h2>
            <p className="text-sm text-teal-700">
              You do not have permission to view the Create Agent module. Please contact your
              administrator.
            </p>
          </div>
        </div>
      );
    }
  }


  return (
    <div className="w-full min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-sm font-medium',
          style: { background: '#1f2937', color: '#f8fafc' },
        }}
      />
      <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-teal-900">Team Management</h1>
            <p className="text-xs sm:text-sm text-teal-700 mt-1">Manage agents and doctor staff accounts</p>
          </div>
          <button
            onClick={() => loadAll(false)}
            disabled={isRefreshing || !canRead}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-teal-700 uppercase tracking-wide">Total Team</p>
                <p className="text-3xl font-bold text-teal-900 mt-2">{totalTeam}</p>
                <p className="text-xs text-teal-700 mt-1">{approvalRate}% approved</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-700" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-teal-700 uppercase tracking-wide">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{totalApproved}</p>
                <p className="text-xs text-teal-700 mt-1">Active members</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-teal-700 uppercase tracking-wide">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{totalPending}</p>
                <p className="text-xs text-teal-700 mt-1">Awaiting review</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-yellow-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-teal-700 uppercase tracking-wide">Declined</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{totalDeclined}</p>
                <p className="text-xs text-teal-700 mt-1">Not approved</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold text-teal-900">Team Members</h2>
                <p className="text-sm text-teal-700 mt-0.5">
                  {currentList.length} {activeView === 'agents' ? 'agents' : 'doctors'} total
                </p>
              </div>
              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('agents')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeView === 'agents'
                      ? 'bg-white text-teal-900 shadow-sm'
                      : 'text-teal-600 hover:text-teal-900'
                  }`}
                >
                  Agents ({agents.length})
                </button>
                <button
                  onClick={() => setActiveView('doctorStaff')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeView === 'doctorStaff'
                      ? 'bg-white text-teal-900 shadow-sm'
                      : 'text-teal-600 hover:text-teal-900'
                  }`}
                >
                  Doctors ({doctorStaff.length})
                </button>
              </div>
            </div>
            {canCreate === true && (
              <button
                onClick={handleCreateClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm w-full sm:w-auto justify-center"
              >
                <UserPlus className="w-4 h-4" />
                Add {activeView === 'agents' ? 'Agent' : 'Doctor'}
              </button>
            )}
          </div>
        </div>

        {/* Agents/Doctors Cards */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {currentList.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-teal-700" />
                </div>
                <p className="text-base font-semibold text-teal-900">No {activeView === 'agents' ? 'agents' : 'doctors'} found</p>
                <p className="text-sm text-teal-700 mt-1 mb-4">
                  {canCreate === true
                    ? `Get started by adding your first ${activeView === 'agents' ? 'agent' : 'doctor'} to the team`
                    : 'You have read-only access.'}
                </p>
                {canCreate === true && (
                  <button
                    onClick={handleCreateClick}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add {activeView === 'agents' ? 'Agent' : 'Doctor'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {currentList.map((agent) => (
                  <div
                    key={agent._id}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gradient-to-br from-teal-700 to-teal-900 text-white flex items-center justify-center text-base font-semibold shadow-md">
                          {agent.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-semibold text-teal-900 truncate">
                            {agent.name}
                          </div>
                          <div className="mt-1.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                agent.declined
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : agent.isApproved
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              }`}
                            >
                              {agent.declined
                                ? 'Declined'
                                : agent.isApproved
                                ? 'Approved'
                                : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Only show 3-dot menu if canUpdate or canDelete is true */}
                      {(canUpdate === true || canDelete === true) && (
                        <div className="relative flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuAgentId(menuAgentId === agent._id ? null : agent._id);
                            }}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                            aria-label="More actions"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-teal-600">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                            </svg>
                          </button>
                          {menuAgentId === agent._id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuAgentId(null);
                                }}
                              />
                              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                            {canRead === true && (
                              <button
                                className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 text-teal-700 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuAgentId(null);
                                  openView(agent);
                                }}
                              >
                                View
                              </button>
                            )}
                                {canUpdate === true && (
                                  <button
                                    className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 text-teal-700 transition-colors border-t border-gray-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMenuAgentId(null);
                                      openProfile(agent);
                                    }}
                                  >
                                    Profile
                                  </button>
                                )}
                                {canUpdate === true && (
                                  <>
                                    <button
                                      className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 text-teal-700 transition-colors border-t border-gray-200"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPasswordAgent(agent);
                                        setMenuAgentId(null);
                                      }}
                                    >
                                      Change password
                                    </button>
                                    <button
                                      className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 text-teal-700 transition-colors border-t border-gray-200"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPermissionAgent(agent);
                                        setMenuAgentId(null);
                                      }}
                                    >
                                      Rights
                                    </button>
                                    {agent.role === 'doctorStaff' && (
                                      <button
                                        className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 text-teal-700 transition-colors border-t border-gray-200"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTreatmentAgent(agent);
                                          setMenuAgentId(null);
                                        }}
                                      >
                                        Add Department
                                      </button>
                                    )}
                                  </>
                                )}
                                {canDelete === true && (
                                  <button
                                    className="w-full text-left px-3 py-2 text-[11px] hover:bg-red-50 text-red-700 transition-colors border-t border-gray-200 flex items-center gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteAgent(agent);
                                      setMenuAgentId(null);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="space-y-2.5 mb-4">
                      <div className="text-sm text-teal-700 truncate">
                        <span className="font-medium text-teal-800">Name:</span> {agent.name}
                      </div>
                      <div className="text-sm text-teal-700">
                        <span className="font-medium text-teal-800">Email:</span> {agent.email || 'N/A'}
                      </div>
                      <div className="text-sm text-teal-700">
                        <span className="font-medium text-teal-800">Mobile Number:</span> {agent.phone || 'N/A'}
                      </div>
                      <div className="mt-1">
                        <div className="h-2 bg-gray-100 rounded">
                          <div
                            className="h-2 bg-gray-900 rounded"
                            style={{ width: `${completionMap[agent._id] || 0}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-teal-700 mt-1">
                          Profile {completionMap[agent._id] || 0}% complete
                        </div>
                      </div>
                    </div>

                    {/* Card Footer - Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      {canUpdate === true && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(agent._id, 'approve');
                            }}
                            disabled={agent.isApproved}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                              agent.isApproved
                                ? 'bg-gray-50 text-teal-400 cursor-not-allowed border border-gray-200'
                                : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md'
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(agent._id, 'decline');
                            }}
                            disabled={agent.declined}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                              agent.declined
                                ? 'bg-gray-50 text-teal-400 cursor-not-allowed border border-gray-200'
                                : 'bg-gray-100 text-teal-700 hover:bg-gray-200 border border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={loadAll}
        token={clinicToken || undefined}
        doctorToken={doctorToken || undefined}
        adminToken={adminToken || undefined}
        defaultRole={activeView === 'doctorStaff' ? 'doctorStaff' : 'agent'}
      />

      {/* Agent Permission Modal */}
      {permissionAgent && (
        <AgentPermissionModal
          isOpen={!!permissionAgent}
          onClose={() => setPermissionAgent(null)}
          agentId={permissionAgent._id}
          agentName={permissionAgent.name}
          token={token || null}
          userRole={clinicToken ? 'clinic' : doctorToken ? 'doctor' : 'admin'}
        />
      )}

      {/* Doctor Treatment Modal */}
      {treatmentAgent && (
        <DoctorTreatmentModal
          useClinicTreatments={true}
          isOpen={!!treatmentAgent}
          onClose={() => setTreatmentAgent(null)}
          doctorStaffId={treatmentAgent._id}
          doctorStaffName={treatmentAgent.name}
          token={token || null}
        />
      )}

      {/* Change Password Modal */}
      {passwordAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-lg border border-gray-200 shadow-xl">
            <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-sm font-semibold text-teal-900">Change password</h3>
                <p className="text-[11px] text-teal-700 mt-0.5">{passwordAgent.name} • {passwordAgent.email}</p>
              </div>
              <button
                type="button"
                onClick={() => { setPasswordAgent(null); setNewPassword(''); setConfirmPassword(''); }}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-teal-500 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-200"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResetPasswordSubmit} className="p-5">
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-teal-700 mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray300 dark:border-gray600 rounded-md text-xs bg-white dark:bg-gray-700 text-teal-900 dark:text-teal-100 placeholder-teal-400 dark:placeholder-teal-400 focus:ring-1 focus:ring-teal-900 dark:focus:ring-blue-500 focus:border-gray900 dark:focus:border-blue-500 outline-none transition-colors"
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-teal-400 hover:text-teal-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-teal-700 mb-1.5">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray300 dark:border-gray600 rounded-md text-xs bg-white dark:bg-gray-700 text-teal-900 dark:text-teal-100 placeholder-teal-400 dark:placeholder-teal-400 focus:ring-1 focus:ring-teal-900 dark:focus:ring-blue-500 focus:border-gray900 dark:focus:border-blue-500 outline-none transition-colors"
                      placeholder="Re-enter password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-teal-400 hover:text-teal-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setPasswordAgent(null); setNewPassword(''); setConfirmPassword(''); }}
                  className="px-3.5 py-2 rounded-md border border-gray300 dark:border-gray600 text-[11px] font-medium text-teal-700 dark:text-teal-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-medium rounded-md transition-colors shadow-sm"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {profileAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-gray-500/30 backdrop-blur-md">
          <div className="relative w-full max-w-5xl rounded-3xl shadow-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto flex flex-col border border-teal-200/30 bg-gradient-to-br from-white via-gray-50 to-white">
            {/* Header Section */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl shadow-lg border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Manage agent details and documents</p>
                </div>
              </div>
              <button
                onClick={() => { setProfileAgent(null); }}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 hover:text-gray-900 transition-all duration-200 flex-shrink-0 hover:scale-110"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content Section */}
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
              <div className="space-y-8">
                {/* Basic Information Section */}
                <div className="bg-white rounded-2xl border border-teal-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Basic Information</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="group">
                      <label className="block text-xs font-semibold text-teal-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-4 rounded-full"></span>
                        Name *
                      </label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all duration-200 hover:border-gray-300 group-hover:border-gray-300"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-semibold text-teal-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-4  rounded-full"></span>
                        Email *
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all duration-200 hover:border-gray-300 group-hover:border-gray-300"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-semibold text-teal-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-4 rounded-full"></span>
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all duration-200 hover:border-gray-300 group-hover:border-gray-300"
                        placeholder="Enter mobile number"
                      />
                    </div>
                  </div>
                </div>

                {/* Identity Information Section */}
                <div className="bg-white rounded-2xl border border-teal-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.009 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.589l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.009 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Identity Information</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="group">
                      <label className="block text-xs font-semibold text-teal-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-4 rounded-full"></span>
                        ID Type
                      </label>
                      <select
                        value={profileForm.idType}
                        onChange={(e) => setProfileForm((f) => ({ ...f, idType: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 hover:border-gray-300 group-hover:border-gray-300"
                      >
                        <option value="aadhaar">Aadhaar</option>
                        <option value="pan">PAN</option>
                        <option value="passport">Passport</option>
                      </select>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-semibold text-teal-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-4 rounded-full"></span>
                        ID Number
                      </label>
                      <input
                        type="text"
                        value={profileForm.idNumber}
                        onChange={(e) => setProfileForm((f) => ({ ...f, idNumber: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 hover:border-gray-300 group-hover:border-gray-300"
                        placeholder="Enter ID number"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-semibold text-teal-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-4  rounded-full"></span>
                        Upload ID Front
                      </label>
                      <label className="flex flex-col gap-2 w-full cursor-pointer group/upload">
                        <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl text-sm font-semibold text-blue-700 group-hover/upload:from-blue-100 group-hover/upload:to-purple-100 group-hover/upload:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md">
                          {uploadingIdDocFront ? (
                            <span className="animate-pulse flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Uploading...
                            </span>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-blue-600" />
                              <span className="text-blue-600">Choose file</span>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadFile(file, (url) => setProfileForm((f) => ({ ...f, idDocumentFrontUrl: url })), setUploadingIdDocFront);
                          }}
                        />
                        {profileForm.idDocumentFrontUrl && (
                          <span className="text-xs text-gray-600 truncate px-2">
                            {getFileNameFromUrl(profileForm.idDocumentFrontUrl)}
                          </span>
                        )}
                      </label>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-semibold text-teal-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-4  rounded-full"></span>
                        Upload ID Back
                      </label>
                      <label className="flex flex-col gap-2 w-full cursor-pointer group/upload">
                        <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl text-sm font-semibold text-blue-700 group-hover/upload:from-blue-100 group-hover/upload:to-purple-100 group-hover/upload:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md">
                          {uploadingIdDocBack ? (
                            <span className="animate-pulse flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Uploading...
                            </span>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-blue-600" />
                              <span className="text-blue-600">Choose file</span>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadFile(file, (url) => setProfileForm((f) => ({ ...f, idDocumentBackUrl: url })), setUploadingIdDocBack);
                          }}
                        />
                        {profileForm.idDocumentBackUrl && (
                          <span className="text-xs text-gray-600 truncate px-2">
                            {getFileNameFromUrl(profileForm.idDocumentBackUrl)}
                          </span>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Additional Information Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-teal-900 mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-teal-700 mb-1.5">Passport Number</label>
                      <input
                        type="text"
                        value={profileForm.passportNumber}
                        onChange={(e) => setProfileForm((f) => ({ ...f, passportNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                        placeholder="Enter passport number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-teal-700 mb-1.5">Upload Passport Front</label>
                      <label className="flex flex-col gap-1.5 w-full cursor-pointer group">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 group-hover:bg-gray-100 transition-colors">
                          {uploadingPassportDocFront ? (
                            <span className="animate-pulse text-teal-600">Uploading...</span>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2 text-teal-600" />
                              <span className="text-teal-600">Choose file</span>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadFile(file, (url) => setProfileForm((f) => ({ ...f, passportDocumentFrontUrl: url })), setUploadingPassportDocFront);
                          }}
                        />
                        <span className="text-xs text-gray-600 truncate">
                          {profileForm.passportDocumentFrontUrl ? getFileNameFromUrl(profileForm.passportDocumentFrontUrl) : "No file chosen"}
                        </span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-teal-700 mb-1.5">Upload Passport Back</label>
                      <label className="flex flex-col gap-1.5 w-full cursor-pointer group">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 group-hover:bg-gray-100 transition-colors">
                          {uploadingPassportDocBack ? (
                            <span className="animate-pulse text-teal-600">Uploading...</span>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2 text-teal-600" />
                              <span className="text-teal-600">Choose file</span>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadFile(file, (url) => setProfileForm((f) => ({ ...f, passportDocumentBackUrl: url })), setUploadingPassportDocBack);
                          }}
                        />
                        <span className="text-xs text-gray-600 truncate">
                          {profileForm.passportDocumentBackUrl ? getFileNameFromUrl(profileForm.passportDocumentBackUrl) : "No file chosen"}
                        </span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-teal-700 mb-1.5">Emergency Contact</label>
                      <input
                        type="tel"
                        value={profileForm.emergencyPhone}
                        onChange={(e) => setProfileForm((f) => ({ ...f, emergencyPhone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                        placeholder="Enter emergency contact"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-teal-700 mb-1.5">Emergency Name</label>
                      <input
                        type="text"
                        value={profileForm.emergencyName}
                        onChange={(e) => setProfileForm((f) => ({ ...f, emergencyName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                        placeholder="Enter emergency contact name"
                      />
                    </div>
                  </div>
                </div>

                {/* Employment Information Section */}
                <div className="bg-white rounded-2xl border border-teal-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Employment Information</h3>
                  </div>
                  {/* Row 1: Base Salary | Commission Type | Commission Percentage */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-teal-700 mb-1.5">Base Salary</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={profileForm.baseSalary}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProfileForm((f) => {
                            const isTarget = f.commissionType === 'target_based' || f.commissionType === 'target_plus_expense';
                            const base = parseFloat(val || "0");
                            const mult = parseFloat(f.targetMultiplier || "1");
                            return {
                              ...f,
                              baseSalary: val,
                              targetAmount: isTarget ? String(base * mult) : f.targetAmount
                            };
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                        placeholder="Enter salary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-teal-700 mb-1.5">Commission Type</label>
                      <select
                        value={profileForm.commissionType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProfileForm((f) => {
                            const isTarget = val === 'target_based' || val === 'target_plus_expense';
                            const base = parseFloat(f.baseSalary || "0");
                            const mult = parseFloat(f.targetMultiplier || "1");
                            return {
                              ...f,
                              commissionType: val,
                              targetAmount: isTarget ? String(base * mult) : ""
                            };
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                      >
                        <option value="no_commission">No Commission</option>
                        <option value="flat">Flat</option>
                        <option value="after_deduction">After deduction</option>
                        <option value="target_based">Target based</option>
                        <option value="target_plus_expense">Target + expense</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-teal-700 mb-1.5">Commission Percentage</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={profileForm.commissionPercentage}
                        onChange={(e) => setProfileForm((f) => ({ ...f, commissionPercentage: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                        placeholder="Enter commission %"
                      />
                    </div>
                  </div>

                  {/* Row 2: Contract Type */}
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <div className="group">
                      <label className="block text-xs font-semibold text-teal-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-4rounded-full"></span>
                        Contract Type
                      </label>
                      <select
                        value={profileForm.contractType}
                        onChange={(e) => setProfileForm((f) => ({ ...f, contractType: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all duration-200 hover:border-gray-300 group-hover:border-gray-300"
                      >
                        <option value="full">Full</option>
                        <option value="part">Part</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Discount Type & Discount Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="group">
                      <label className="block text-xs font-semibold text-teal-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-4 rounded-full"></span>
                        Discount Type
                      </label>
                      <select
                        value={profileForm.discountType}
                        onChange={(e) => setProfileForm((f) => ({ ...f, discountType: e.target.value, discountAmount: e.target.value === "" ? "" : f.discountAmount }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all duration-200 hover:border-gray-300 group-hover:border-gray-300"
                      >
                        <option value="">No Discount</option>
                        <option value="percentage">Percentage</option>
                        <option value="fixed_amount">Fixed Amount</option>
                      </select>
                    </div>
                    {profileForm.discountType && (
                      <div className="group">
                        <label className="block text-xs font-semibold text-teal-800 mb-2 flex items-center gap-1.5">
                          <span className="w-1 h-4 rounded-full"></span>
                          {profileForm.discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={profileForm.discountAmount}
                          onChange={(e) => setProfileForm((f) => ({ ...f, discountAmount: e.target.value }))}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all duration-200 hover:border-gray-300 group-hover:border-gray-300"
                          placeholder={profileForm.discountType === 'percentage' ? "Enter percentage" : "Enter amount"}
                        />
                      </div>
                    )}
                  </div>

                  {/* Target Fields Row */}
                  {(profileForm.commissionType === 'target_based' || profileForm.commissionType === 'target_plus_expense') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <>
                        <div>
                          <label className="block text-xs font-medium text-teal-700 mb-1.5">Target</label>
                          <select
                            value={profileForm.targetMultiplier}
                            onChange={(e) => {
                              const mult = e.target.value;
                              setProfileForm((f) => {
                                const base = parseFloat(f.baseSalary || "0");
                                const m = parseFloat(mult || "1");
                                return {
                                  ...f,
                                  targetMultiplier: mult,
                                  targetAmount: String(base * m)
                                };
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                          >
                            <option value="1">1x</option>
                            <option value="2">2x</option>
                            <option value="3">3x</option>
                            <option value="4">4x</option>
                            <option value="5">5x</option>
                            <option value="6">6x</option>
                            <option value="7">7x</option>
                            <option value="8">8x</option>
                            <option value="9">9x</option>
                            <option value="10">10x</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-teal-700 mb-1.5">Target Amount</label>
                          <input
                            type="number"
                            value={profileForm.targetAmount}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                          />
                        </div>
                      </>
                    </div>
                  )}
                </div>

                {/* Other Document Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-teal-900 mb-4">Other Document</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Commented out - Employee Visa Front */}
                    {/* <div>
                      <label className="block text-xs font-medium text-teal-700 mb-1.5">Employee Visa Front</label>
                      <label className="flex flex-col gap-1.5 w-full cursor-pointer group">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 group-hover:bg-gray-100 transition-colors">
                          {uploadingEmployeeVisaFront ? (
                            <span className="animate-pulse text-teal-600">Uploading...</span>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2 text-teal-600" />
                              <span className="text-teal-600">Choose file</span>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadFile(file, (url) => setProfileForm((f) => ({ ...f, employeeVisaFrontUrl: url })), setUploadingEmployeeVisaFront);
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 truncate">
                            {profileForm.employeeVisaFrontUrl ? getFileNameFromUrl(profileForm.employeeVisaFrontUrl) : "No file chosen"}
                          </span>
                          {profileForm.employeeVisaFrontUrl && (
                            <button
                              type="button"
                              onClick={() => setProfileForm((f) => ({ ...f, employeeVisaFrontUrl: "" }))}
                              className="text-xs text-red-600 hover:text-red-700"
                              aria-label="Clear Employee Visa Front"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </label>
                    </div> */}
                    {/* Commented out - Employee Visa Back */}
                    {/* <div>
                      <label className="block text-xs font-medium text-teal-700 mb-1.5">Employee Visa Back</label>
                      <label className="flex flex-col gap-1.5 w-full cursor-pointer group">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 group-hover:bg-gray-100 transition-colors">
                          {uploadingEmployeeVisaBack ? (
                            <span className="animate-pulse text-teal-600">Uploading...</span>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2 text-teal-600" />
                              <span className="text-teal-600">Choose file</span>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadFile(file, (url) => setProfileForm((f) => ({ ...f, employeeVisaBackUrl: url })), setUploadingEmployeeVisaBack);
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 truncate">
                            {profileForm.employeeVisaBackUrl ? getFileNameFromUrl(profileForm.employeeVisaBackUrl) : "No file chosen"}
                          </span>
                          {profileForm.employeeVisaBackUrl && (
                            <button
                              type="button"
                              onClick={() => setProfileForm((f) => ({ ...f, employeeVisaBackUrl: "" }))}
                              className="text-xs text-red-600 hover:text-red-700"
                              aria-label="Clear Employee Visa Back"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </label>
                    </div> */}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-teal-900"></div>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileForm(f => ({
                            ...f,
                            otherDocuments: [...(f.otherDocuments || []), { name: "", url: "" }]
                          }));
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-800"
                      >
                        + Add Document
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(profileForm.otherDocuments || []).map((doc, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                          <div className="sm:col-span-4">
                            <label className="block text-xs font-medium text-teal-700 mb-1.5">Document Name</label>
                            <input
                              type="text"
                              value={doc.name || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProfileForm(f => {
                                  const arr = [...(f.otherDocuments || [])];
                                  arr[idx] = { ...arr[idx], name: val };
                                  return { ...f, otherDocuments: arr };
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                              placeholder="e.g. License, Address Proof"
                            />
                          </div>
                          <div className="sm:col-span-6">
                            <label className="block text-xs font-medium text-teal-700 mb-1.5">Upload File</label>
                            <label className="flex flex-col gap-1.5 w-full cursor-pointer group">
                              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 group-hover:bg-gray-100 transition-colors">
                                {otherDocsUploading[idx] ? (
                                  <span className="animate-pulse text-teal-600">Uploading...</span>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4 mr-2 text-teal-600" />
                                    <span className="text-teal-600">Choose file</span>
                                  </>
                                )}
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setOtherDocsUploading(s => ({ ...s, [idx]: true }));
                                    uploadFile(
                                      file,
                                      (url) => {
                                        setProfileForm(f => {
                                          const arr = [...(f.otherDocuments || [])];
                                          arr[idx] = { ...arr[idx], url };
                                          return { ...f, otherDocuments: arr };
                                        });
                                      },
                                      () => setOtherDocsUploading(s => ({ ...s, [idx]: false }))
                                    );
                                  }
                                }}
                              />
                              {doc.url && (
                                <span className="text-xs text-gray-600 truncate">
                                  {getFileNameFromUrl(doc.url)}
                                </span>
                              )}
                              {doc.url && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(doc.url) && (
                                <div className="mt-1 relative inline-block">
                                  <img
                                    src={doc.url}
                                    alt={doc.name || "Document preview"}
                                    className="h-16 w-auto rounded border border-gray-200 object-contain"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProfileForm(f => {
                                        const arr = [...(f.otherDocuments || [])];
                                        arr[idx] = { ...arr[idx], url: "" };
                                        return { ...f, otherDocuments: arr };
                                      });
                                    }}
                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 text-xs leading-5 flex items-center justify-center"
                                    aria-label="Remove image"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </label>
                          </div>
                          <div className="sm:col-span-2 flex items-center mt-6 sm:mt-6">
                            <button
                              type="button"
                              onClick={() => {
                                setProfileForm(f => {
                                  const arr = [...(f.otherDocuments || [])];
                                  arr.splice(idx, 1);
                                  return { ...f, otherDocuments: arr };
                                });
                                setOtherDocsUploading(s => {
                                  const n = { ...s };
                                  delete n[idx];
                                  return n;
                                });
                              }}
                              className="w-full h-[35px] px-3 py-2 border border-gray-300 rounded-lg text-xs text-red-700 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                   
                  </div>
                </div>

                {/* Bank Permissions Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-teal-900 mb-4">Bank Permissions</h3>
                  <div className="space-y-4">
                    {clinicBankDetails?.card?.enabled && (
                      <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <div className="text-sm font-medium text-gray-900">Card</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {clinicBankDetails.card.type === "flat"
                              ? `${getCurrencySymbol(currency)} ${Number(clinicBankDetails.card.value).toFixed(2)} • Apply on: ${clinicBankDetails.card.applyOn}`
                              : `${Number(clinicBankDetails.card.value).toFixed(0)}% • Apply on: ${clinicBankDetails.card.applyOn}`
                            }
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProfileForm(f => ({
                            ...f,
                            bankPermissions: {
                              ...f.bankPermissions,
                              card: !f.bankPermissions.card
                            }
                          }))}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${profileForm.bankPermissions.card ? 'bg-teal-600' : 'bg-gray-200'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profileForm.bankPermissions.card ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    )}
                    {clinicBankDetails?.bankTransfer?.enabled && (
                      <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <div className="text-sm font-medium text-gray-900">Bank Transfer</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {clinicBankDetails.bankTransfer.type === "flat"
                              ? `${getCurrencySymbol(currency)} ${Number(clinicBankDetails.bankTransfer.value).toFixed(2)} • Apply on: ${clinicBankDetails.bankTransfer.applyOn}`
                              : `${Number(clinicBankDetails.bankTransfer.value).toFixed(0)}% • Apply on: ${clinicBankDetails.bankTransfer.applyOn}`
                            }
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProfileForm(f => ({
                            ...f,
                            bankPermissions: {
                              ...f.bankPermissions,
                              bankTransfer: !f.bankPermissions.bankTransfer
                            }
                          }))}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${profileForm.bankPermissions.bankTransfer ? 'bg-teal-600' : 'bg-gray-200'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profileForm.bankPermissions.bankTransfer ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    )}
                    {clinicBankDetails?.tabby?.enabled && (
                      <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <div className="text-sm font-medium text-gray-900">Tabby</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {clinicBankDetails.tabby.type === "flat"
                              ? `${getCurrencySymbol(currency)} ${Number(clinicBankDetails.tabby.value).toFixed(2)} • Apply on: ${clinicBankDetails.tabby.applyOn}`
                              : `${Number(clinicBankDetails.tabby.value).toFixed(0)}% • Apply on: ${clinicBankDetails.tabby.applyOn}`
                            }
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProfileForm(f => ({
                            ...f,
                            bankPermissions: {
                              ...f.bankPermissions,
                              tabby: !f.bankPermissions.tabby
                            }
                          }))}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${profileForm.bankPermissions.tabby ? 'bg-teal-600' : 'bg-gray-200'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profileForm.bankPermissions.tabby ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    )}
                    {clinicBankDetails?.tamara?.enabled && (
                      <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <div className="text-sm font-medium text-gray-900">Tamara</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {clinicBankDetails.tamara.type === "flat"
                              ? `${getCurrencySymbol(currency)} ${Number(clinicBankDetails.tamara.value).toFixed(2)} • Apply on: ${clinicBankDetails.tamara.applyOn}`
                              : `${Number(clinicBankDetails.tamara.value).toFixed(0)}% • Apply on: ${clinicBankDetails.tamara.applyOn}`
                            }
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProfileForm(f => ({
                            ...f,
                            bankPermissions: {
                              ...f.bankPermissions,
                              tamara: !f.bankPermissions.tamara
                            }
                          }))}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${profileForm.bankPermissions.tamara ? 'bg-teal-600' : 'bg-gray-200'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profileForm.bankPermissions.tamara ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    )}
                    {(!clinicBankDetails?.card?.enabled && !clinicBankDetails?.bankTransfer?.enabled && !clinicBankDetails?.tabby?.enabled && !clinicBankDetails?.tamara?.enabled) && (
                      <div className="text-sm text-gray-500 py-4 text-center">
                        No bank methods are enabled in clinic settings
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setProfileAgent(null); }}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveProfile}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {viewAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl sm:max-w-5xl lg:max-w-7xl bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-auto">
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-gray-200 bg-gray-50 flex items-start justify-between sticky top-0 z-10 flex-shrink-0">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-sm font-semibold text-teal-900">View Profile</h3>
                <p className="text-[11px] text-teal-700 mt-0.5">{viewAgent.name} • {viewAgent.email}</p>
              </div>
              <button
                type="button"
                onClick={() => { stopActivityRefresh(); setViewAgent(null); setViewProfile(null); setTotalAppointments(null); setActivity(null); }}
                className="flex-shrink-0 p-1.5 sm:p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-teal-500 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-200"
                aria-label="Close"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
              {viewLoading ? (
                <div className="py-8 text-center text-sm text-teal-700">Loading...</div>
              ) : (
                <>
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gray-900 text-white flex items-center justify-center text-base sm:text-lg font-semibold flex-shrink-0">
                          {(viewAgent?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-base sm:text-lg font-semibold text-teal-900 truncate">{viewAgent.name || '—'}</div>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">{viewAgent.role || '—'}</span>
                          </div>
                          <div className="mt-1 text-xs text-teal-700">
                            <div className="mt-1 flex flex-wrap gap-2 sm:gap-3">
                              <span className="whitespace-nowrap">ID: {viewAgent?._id?.slice(-6) || '—'}</span>
                              <span>
                                Joined:{' '}
                                {activity?.profileCreatedAt
                                  ? new Date(activity.profileCreatedAt).toLocaleDateString()
                                  : '—'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 sm:gap-3 text-xs text-teal-700">
                            <span className="whitespace-nowrap">{viewAgent.email || '—'}</span>
                            <span className="text-gray-300 flex-shrink-0">|</span>
                            <span className="whitespace-nowrap">{viewAgent.phone || '—'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                        <button
                          type="button"
                          onClick={() => {
                            const a = viewAgent;
                            setMenuAgentId(null);
                            setViewAgent(null);
                            setViewProfile(null);
                            setTimeout(() => openProfile(a), 0);
                          }}
                          className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
                          <span className="whitespace-nowrap">Edit Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const a = viewAgent;
                            setMenuAgentId(null);
                            setViewAgent(null);
                            setViewProfile(null);
                            setTimeout(() => openProfile(a), 0);
                          }}
                          className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm font-medium border border-gray-300 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Upload className="w-4 h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap hidden sm:inline">Upload Document</span>
                          <span className="whitespace-nowrap sm:hidden">Documents</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeactivate(viewAgent?._id)}
                          className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                          title="Deactivate and delete"
                        >
                          <UserX className="w-4 h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">Deactivate</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 ${viewAgent?.role === 'agent' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
                    {viewAgent?.role !== 'agent' && (
                      <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl p-5 shadow-sm border border-white/10">
                        <div className="flex items-center gap-4">
                          <div className="bg-white/20 rounded-xl p-3">
                            <CalendarCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-3xl font-bold leading-tight">{totalAppointments !== null ? totalAppointments : '—'}</div>
                            <div className="text-xs opacity-90 mt-1">Total Appointments</div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-2xl p-5 shadow-sm border border-white/10">
                      <div className="flex items-center gap-4">
                        {/* <div className="bg-white/20 rounded-xl p-3"> */}
                          {/* <DollarSign className="w-5 h-5" /> */}
                        {/* </div> */}
                        <div>
                          <div className="text-3xl font-bold leading-tight">
                            {totalRevenue !== null ? `${getCurrencySymbol(currency)}${Number(totalRevenue || 0).toLocaleString()}` : '—'}
                          </div>
                          <div className="text-xs opacity-90 mt-1">Revenue Generated</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-sky-300 to-blue-400 text-white rounded-2xl p-5 shadow-sm border border-white/10">
                      <div className="flex items-center gap-4">
                        
                        <div>
                          <div className="text-3xl font-bold leading-tight">
                            {totalCommission != null ? `${getCurrencySymbol(currency)}${Number(totalCommission || 0).toLocaleString()}` : '—'}
                          </div>
                          <div className="text-xs opacity-90 mt-1">Commission Earned</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-5 shadow-sm border border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 rounded-xl p-3">
                          <FileStack className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-3xl font-bold leading-tight">
                            {
                              ((viewProfile?.idDocumentFrontUrl ? 1 : 0) +
                              (viewProfile?.idDocumentBackUrl ? 1 : 0) +
                              (viewProfile?.passportDocumentFrontUrl ? 1 : 0) +
                              (viewProfile?.passportDocumentBackUrl ? 1 : 0) +
                              (viewProfile?.employeeVisaFrontUrl ? 1 : 0) +
                              (viewProfile?.employeeVisaBackUrl ? 1 : 0) +
                              // Count Labour Contract tile (Visa & Legal) and Contract Front separately to match visible cards
                              (viewProfile?.contractFrontUrl ? 2 : 0) +
                              (viewProfile?.contractBackUrl ? 1 : 0) +
                              (Array.isArray(viewProfile?.otherDocuments)
                                ? viewProfile.otherDocuments.filter(d => d && d.url && String(d.url).trim().length > 0).length
                                : 0))
                            }
                          </div>
                          <div className="text-xs opacity-90 mt-1">Documents Uploaded</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                      <div className="text-base font-semibold text-teal-900 mb-4">Identity & Passport Documents</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-gray-200 overflow-hidden">
                          <div className="h-56 sm:h-60 lg:h-64 bg-gray-50 overflow-hidden">
                            {viewProfile?.idDocumentFrontUrl ? (
                              /\.(png|jpe?g|gif|webp)$/i.test(viewProfile.idDocumentFrontUrl) ? (
                                <img src={viewProfile.idDocumentFrontUrl} alt="Identity Front" className="h-full w-full object-cover" />
                              ) : (
                                <a href={viewProfile.idDocumentFrontUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-700 underline">Open file</a>
                              )
                            ) : (
                              <div className="text-sm text-gray-400">No image</div>
                            )}
                          </div>
                          <div className="px-4 py-2 text-sm text-teal-900">Identity Card Front</div>
                        </div>
                        <div className="rounded-xl border border-gray-200 overflow-hidden">
                          <div className="h-56 sm:h-60 lg:h-64 bg-gray-50 overflow-hidden">
                            {viewProfile?.idDocumentBackUrl ? (
                              /\.(png|jpe?g|gif|webp)$/i.test(viewProfile.idDocumentBackUrl) ? (
                                <img src={viewProfile.idDocumentBackUrl} alt="Identity Back" className="h-full w-full object-cover" />
                              ) : (
                                <a href={viewProfile.idDocumentBackUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-700 underline">Open file</a>
                              )
                            ) : (
                              <div className="text-sm text-gray-400">No image</div>
                            )}
                          </div>
                          <div className="px-4 py-2 text-sm text-teal-900">Identity Card Back</div>
                        </div>
                        <div className="rounded-xl border border-gray-200 overflow-hidden">
                          <div className="h-56 sm:h-60 lg:h-64 bg-gray-50 overflow-hidden">
                            {viewProfile?.passportDocumentFrontUrl ? (
                              /\.(png|jpe?g|gif|webp)$/i.test(viewProfile.passportDocumentFrontUrl) ? (
                                <img src={viewProfile.passportDocumentFrontUrl} alt="Passport Front" className="h-full w-full object-cover" />
                              ) : (
                                <a href={viewProfile.passportDocumentFrontUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-700 underline">Open file</a>
                              )
                            ) : (
                              <div className="text-sm text-gray-400">No image</div>
                            )}
                          </div>
                          <div className="px-4 py-2 text-sm text-teal-900">Passport Front</div>
                        </div>
                        <div className="rounded-xl border border-gray-200 overflow-hidden">
                          <div className="h-56 sm:h-60 lg:h-64 bg-gray-50 overflow-hidden">
                            {viewProfile?.passportDocumentBackUrl ? (
                              /\.(png|jpe?g|gif|webp)$/i.test(viewProfile.passportDocumentBackUrl) ? (
                                <img src={viewProfile.passportDocumentBackUrl} alt="Passport Back" className="h-full w-full object-cover" />
                              ) : (
                                <a href={viewProfile.passportDocumentBackUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-700 underline">Open file</a>
                              )
                            ) : (
                              <div className="text-sm text-gray-400">No image</div>
                            )}
                          </div>
                          <div className="px-4 py-2 text-sm text-teal-900">Passport Back</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="text-sm font-semibold text-teal-900">Staff Status</div>
                        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-teal-900 flex items-center justify-between">
                          <span>Current Status</span>
                          <span className="inline-flex items-center gap-2">
                            {(() => {
                              // Consider user offline if no activity data or last login was more than 24 hours ago
                              const isActuallyOnline = activity &&
                                                        activity.currentStatus === 'ONLINE' &&
                                                        activity.lastLogin &&
                                                        (Date.now() - new Date(activity.lastLogin).getTime()) < 24 * 60 * 60 * 1000;
                              return (
                                <>
                                  <span className={`h-2 w-2 rounded-full ${isActuallyOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                  {isActuallyOnline ? 'Online' : 'Offline'}
                                </>
                              );
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="text-sm font-semibold text-teal-900">Activity Timeline</div>
                        <div className="relative mt-3 pl-6 space-y-4 text-sm text-teal-700">
                          <div className="absolute left-3 top-0 h-full w-px bg-gray-200" />
                          <div className="flex items-start gap-3">
                            <div className="relative flex-shrink-0">
                              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v4"/><path d="M21 3l-7 7"/><rect x="3" y="11" width="10" height="10" rx="2"/></svg>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-teal-900">Last login</div>
                              <div>{timeAgo(activity?.lastLogin)}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v10"/><path d="M21 7v10"/><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M8 7h8"/></svg>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-teal-900">Password changed</div>
                              <div>{timeAgo(activity?.passwordChangedAt)}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5h18"/><path d="M7 3v4"/><path d="M17 3v4"/><rect x="3" y="5" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-teal-900">Contract updated</div>
                              <div>{timeAgo(activity?.contractUpdatedAt)}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16v-7"/><path d="M8 12l4-4 4 4"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-teal-900">Document uploaded</div>
                              <div>{timeAgo(activity?.documentUploadedAt)}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 7v10"/><path d="M7 12h10"/><circle cx="12" cy="12" r="9"/></svg>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-teal-900">Profile created</div>
                              <div>{activity?.profileCreatedAt ? new Date(activity.profileCreatedAt).toLocaleDateString() : '—'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Commented out - Visa & Legal Files Section */}
                  {/* <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="text-base font-semibold text-teal-900 mb-4">Visa & Legal Files</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="h-56 sm:h-60 lg:h-64 bg-gray-50 overflow-hidden">
                          {viewProfile?.employeeVisaFrontUrl ? (
                            /\.(png|jpe?g|gif|webp)$/i.test(viewProfile.employeeVisaFrontUrl) ? (
                              <img src={viewProfile.employeeVisaFrontUrl} alt="Employee Visa Front" className="h-full w-full object-cover" />
                            ) : (
                              <a href={viewProfile.employeeVisaFrontUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-700 underline">Open file</a>
                            )
                          ) : (
                            <div className="text-sm text-gray-400">No image</div>
                          )}
                        </div>
                        <div className="px-4 py-2 text-sm text-teal-900">Employee Visa Front</div>
                      </div>
                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="h-56 sm:h-60 lg:h-64 bg-gray-50 overflow-hidden">
                          {viewProfile?.employeeVisaBackUrl ? (
                            /\.(png|jpe?g|gif|webp)$/i.test(viewProfile.employeeVisaBackUrl) ? (
                              <img src={viewProfile.employeeVisaBackUrl} alt="Employee Visa Back" className="h-full w-full object-cover" />
                            ) : (
                              <a href={viewProfile.employeeVisaBackUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-700 underline">Open file</a>
                            )
                          ) : (
                            <div className="text-sm text-gray-400">No image</div>
                          )}
                        </div>
                        <div className="px-4 py-2 text-sm text-teal-900">Employee Visa Back</div>
                      </div>
                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="h-56 sm:h-60 lg:h-64 bg-gray-50 overflow-hidden">
                          {viewProfile?.contractFrontUrl ? (
                            isImageUrl(viewProfile.contractFrontUrl) ? (
                              <img src={viewProfile.contractFrontUrl} alt="Labour Contract" className="h-full w-full object-cover" />
                            ) : isPdfUrl(viewProfile.contractFrontUrl) ? (
                              <object data={viewProfile.contractFrontUrl} type="application/pdf" className="h-full w-full">
                                <a href={viewProfile.contractFrontUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-700 underline">Open file</a>
                              </object>
                            ) : (
                              <a href={viewProfile.contractFrontUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-700 underline">Open file</a>
                            )
                          ) : (
                            <div className="text-sm text-gray-400">No image</div>
                          )}
                        </div>
                        <div className="px-4 py-2 text-sm text-teal-900">Labour Contract</div>
                      </div>
                    </div>
                  </div> */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-base font-semibold text-teal-900">Additional Documents</div>
                      <button
                        type="button"
                        onClick={() => {
                          const a = viewAgent;
                          if (!a) return;
                          setViewAgent(null);
                          setTimeout(() => openProfile(a), 0);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-md"
                      >
                        + Add Document
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(Array.isArray(viewProfile?.otherDocuments) ? viewProfile.otherDocuments : []).map((d, i) => (
                        <div key={`adoc-${i}`} className="relative bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <div className="h-36 bg-gray-50 flex items-center justify-center">
                            {d?.url ? (
                              /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test((d.url||'').split('?')[0]) ? (
                                <img src={d.url} alt={d?.name || `Document ${i+1}`} className="h-full w-full object-cover" />
                              ) : (
                                <a href={d.url} target="_blank" rel="noreferrer" className="text-sm text-teal-700 underline">Open file</a>
                              )
                            ) : (
                              <div className="text-sm text-gray-400">No document</div>
                            )}
                          </div>
                          <div className="px-4 py-2 flex items-center justify-between">
                            <div className="text-sm text-teal-900">{d?.name || `Document ${i+1}`}</div>
                            {d?.url && (
                              <a href={d.url} target="_blank" rel="noreferrer" className="text-teal-700 hover:text-teal-900" aria-label="View">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                      {Array.isArray(viewProfile?.otherDocuments) && viewProfile.otherDocuments.length === 0 && (
                        <>
                          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 h-36 flex items-center justify-center text-gray-400 text-sm">Upload document</div>
                          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 h-36 hidden sm:flex items-center justify-center text-gray-400 text-sm">Upload document</div>
                          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 h-36 hidden lg:flex items-center justify-center text-gray-400 text-sm">Upload document</div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="text-base font-semibold text-teal-900 mb-4">Employment & Contract</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="text-xs text-teal-700 inline-flex items-center gap-2">
                          
                          Salary
                        </div>
                        <div className="mt-1 text-lg font-semibold text-teal-900">{typeof viewProfile?.baseSalary === 'number' ? viewProfile.baseSalary : (viewProfile?.baseSalary || '—')}</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="text-xs text-teal-700 inline-flex items-center gap-2">
                          
                          Contract Type
                        </div>
                        <div className="mt-1 text-lg font-semibold text-teal-900">{viewProfile?.contractType || '—'}</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="text-xs text-teal-700 inline-flex items-center gap-2">
                          
                          Commission Type
                        </div>
                        <div className="mt-1 text-lg font-semibold text-teal-900">{viewProfile?.commissionType || '—'}</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="text-xs text-teal-700 inline-flex items-center gap-2">
                          
                          Commission Value
                        </div>
                        <div className="mt-1 text-lg font-semibold text-teal-900">{viewProfile?.commissionPercentage ? `${viewProfile.commissionPercentage}%` : '—'}</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="text-xs text-teal-700 inline-flex items-center gap-2">
                         
                          Discount
                        </div>
                        <div className="mt-1 text-lg font-semibold text-teal-900">
                          {viewProfile?.discountType ? (
                            <>
                              {viewProfile.discountType === 'percentage'
                                ? `${viewProfile.discountAmount || 0}%`
                                : `₹${viewProfile.discountAmount || 0}`}
                              <span className="ml-1 text-[10px] text-teal-600 font-normal uppercase">
                                ({viewProfile.discountType.replace('_', ' ')})
                              </span>
                            </>
                          ) : '—'}
                        </div>
                      </div>
                    </div>
                    {/* Commented out - Contract Documents Section */}
                    {false && (
                      <>
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-teal-900">Contract Documents</div>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="rounded-xl border border-gray-200 overflow-hidden">
                            <div className="h-56 sm:h-60 lg:h-64 bg-gray-50 overflow-hidden">
                              {viewProfile?.contractFrontUrl ? (
                                isImageUrl(viewProfile.contractFrontUrl) ? (
                                  <img src={viewProfile.contractFrontUrl} alt="Contract Front" className="h-full w-full object-cover" />
                                ) : isPdfUrl(viewProfile.contractFrontUrl) ? (
                                  <object data={viewProfile.contractFrontUrl} type="application/pdf" className="h-full w-full">
                                    <a href={viewProfile.contractFrontUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-700 underline">Open file</a>
                                  </object>
                                ) : (
                                  <a href={viewProfile.contractFrontUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-700 underline">Open file</a>
                                )
                              ) : (
                                <div className="text-sm text-gray-400">No image</div>
                              )}
                            </div>
                            <div className="px-4 py-2 text-sm text-teal-900">Contract Front</div>
                          </div>
                          <div className="rounded-xl border border-gray-200 overflow-hidden">
                            <div className="h-56 sm:h-60 lg:h-64 bg-gray-50 overflow-hidden">
                              {viewProfile?.contractBackUrl ? (
                                isImageUrl(viewProfile.contractBackUrl) ? (
                                  <img src={viewProfile.contractBackUrl} alt="Contract Back" className="h-full w-full object-cover" />
                                ) : isPdfUrl(viewProfile.contractBackUrl) ? (
                                  <object data={viewProfile.contractBackUrl} type="application/pdf" className="h-full w-full">
                                    <a href={viewProfile.contractBackUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-700 underline">Open file</a>
                                  </object>
                                ) : (
                                  <a href={viewProfile.contractBackUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-700 underline">Open file</a>
                                )
                              ) : (
                                <div className="text-sm text-gray-400">No image</div>
                              )}
                            </div>
                            <div className="px-4 py-2 text-sm text-teal-900">Contract Back</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => { stopActivityRefresh(); setViewAgent(null); setViewProfile(null); setTotalAppointments(null); setActivity(null); }}
                      className="px-3.5 py-2 rounded-md border border-gray300 dark:border-gray600 text-[11px] font-medium text-teal-700 dark:text-teal-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteAgent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteAgent(null);
            }
          }}
        >
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 shadow-2xl">
            <div className="px-6 py-4 border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-red-900 dark:text-red-300">Confirm Deletion</h3>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{deleteAgent.name} • {deleteAgent.email}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm font-medium text-teal-900 dark:text-teal-100 mb-2">
                  Are you sure you want to delete this {deleteAgent.role === 'doctorStaff' ? 'doctor' : 'agent'}?
                </p>
                <p className="text-sm text-teal-700 dark:text-teal-400">
                  This action cannot be undone. All data associated with this {deleteAgent.role === 'doctorStaff' ? 'doctor' : 'agent'} will be permanently removed.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteAgent(null)}
                  className="px-4 py-2 rounded-lg border border-gray300 dark:border-gray600 text-sm font-medium text-teal-700 dark:text-teal-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteAgent._id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete {deleteAgent.role === 'doctorStaff' ? 'Doctor' : 'Agent'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Apply Layout
ManageAgentsPage.getLayout = (page) => <ClinicLayout>{page}</ClinicLayout>;

// Export base component for reuse (e.g., agent portal)
export const CreateAgentPageBase = ManageAgentsPage;

// Preserve layout on wrapped component
const ProtectedManageAgentsPage = withClinicAuth(ManageAgentsPage);
ProtectedManageAgentsPage.getLayout = ManageAgentsPage.getLayout;

export default ProtectedManageAgentsPage;