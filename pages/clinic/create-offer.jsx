// pages/lead/offers.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  PlusCircle,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  Calendar,
  Download,
  Eye,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import CreateOfferModal from "../../components/CreateOfferModal";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import { getCurrencySymbol } from "@/lib/currencyHelper";

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

const getUserRole = () => {
  if (typeof window === 'undefined') return null;
  try {
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
    console.error('Error getting user role:', error);
  }
  return null;
};

function OffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState([]);
  const [currency, setCurrency] = useState('INR');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [editingOfferData, setEditingOfferData] = useState(null);
  const [viewingOffer, setViewingOffer] = useState(null);
  const [doctorNamesMap, setDoctorNamesMap] = useState({});
  const [departmentNamesMap, setDepartmentNamesMap] = useState({});
  const [serviceNamesMap, setServiceNamesMap] = useState({});
  const [userNamesMap, setUserNamesMap] = useState({});
  const [clinicNamesMap, setClinicNamesMap] = useState({});
  const [permissions, setPermissions] = useState({
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canRead: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [token, setToken] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    offerId: null,
    offerTitle: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncTokens = () => {
      const storedToken = getStoredToken();
      setToken(storedToken || "");
    };
    syncTokens();
    window.addEventListener("storage", syncTokens);
    return () => window.removeEventListener("storage", syncTokens);
  }, []);

  // Fetch permissions - same pattern as myallClinic.tsx
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
                // Admin has set permissions - check the clinic_create_offers module
                const modulePermission = res.data.permissions.find((p) => {
                  if (!p?.module) return false;
                  // Check for clinic_create_offers module
                  if (p.module === "clinic_create_offers") return true;
                  if (p.module === "create_offers") return true;
                  if (p.module === "clinic_create_offer") return true;
                  if (p.module === "create_offer") return true;
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
              if (p.module === "create_offers") return true;
              if (p.module === "clinic_create_offers") return true;
              if (p.module === "clinic_create_offer") return true;
              if (p.module === "create_offer") return true;
              if (p.module.startsWith("clinic_") && p.module.slice(7) === "create_offers") {
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
  
  // Helper to resolve name from ID or Object
  const resolveName = (item, map, fallback = "—") => {
    if (!item) return fallback;
    if (typeof item === 'object') {
      return item.name || item.title || map[item._id] || map[item.id] || fallback;
    }
    // If it's an ID string, only show it if we have a name for it, otherwise show fallback
    return map[item] || fallback;
  };

  // Admin role bypasses all permission checks
  const finalCanRead = userRole === 'admin' ? true : permissions.canRead;
  const finalCanCreate = userRole === 'admin' ? true : permissions.canCreate;
  const finalCanUpdate = userRole === 'admin' ? true : permissions.canUpdate;
  const finalCanDelete = userRole === 'admin' ? true : permissions.canDelete;

  // Fetch all offers
  const fetchOffers = async () => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders) return;
  
    // Wait for permissions to load
    if (!permissionsLoaded) return;
    
    // ✅ Strict check: If user doesn't have read permission, don't make API call
    if (finalCanRead !== true) {
      setOffers([]);
      // Clear cache if no read permission
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("offersCache");
        } catch {}
      }
      return;
    }

    // Serve instantly from cache if available
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("offersCache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) setOffers(parsed);
        }
      } catch {}
    }

    try {
      const res = await fetch("/api/lead-ms/get-create-offer", {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      });
      const data = await res.json();
      
      // ✅ Handle 403 permission denied explicitly
      if (res.status === 403 || (data.message && data.message.toLowerCase().includes("permission"))) {
        setOffers([]);
        // Clear cache on permission denial
        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("offersCache");
          } catch {}
        }
        return;
      }
      
      if (data.success) {
        const next = data.offers || [];
        setOffers(next);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("offersCache", JSON.stringify(next));
          } catch {}
        }
      } else {
        // If permission denied, clear offers
        if (data.message && data.message.includes("permission")) {
          setOffers([]);
        }
      }
    } catch (err) {
      console.error("Error fetching offers:", err);
      // keep whatever is shown (cached) to avoid flash
    }
  };

  useEffect(() => {
    // Fetch offers after permissions are loaded
    if (permissionsLoaded) {
      fetchOffers();
    }
  }, [permissionsLoaded, finalCanRead]);

  // Fetch master data names when viewing an offer
  useEffect(() => {
    const fetchMasterData = async () => {
      if (!viewingOffer) return;

      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;

      try {
        // Fetch in parallel
        const [doctorsRes, deptsRes, servicesRes, clinicsRes, agentsRes] = await Promise.all([
          axios.get('/api/lead-ms/get-agents?role=doctorStaff', { headers: authHeaders }),
          axios.get('/api/clinic/departments?module', { headers: authHeaders }),
          axios.get('/api/clinic/services', { headers: authHeaders }),
          axios.get('/api/clinics/myallClinic', { headers: authHeaders }),
          axios.get('/api/lead-ms/get-agents', { headers: authHeaders })
        ]);

        if (doctorsRes.data.success) {
          const doctors = doctorsRes.data.agents || doctorsRes.data.data || [];
          const map = {};
          doctors.forEach(d => map[d._id] = d.name || d.title || 'Unknown Doctor');
          setDoctorNamesMap(map);
        }

        if (deptsRes.data.success) {
          const depts = deptsRes.data.departments || deptsRes.data.data || [];
          const map = {};
          depts.forEach(d => map[d._id] = d.name || d.title || 'Unknown Department');
          setDepartmentNamesMap(map);
        }

        if (servicesRes.data.success) {
          const services = servicesRes.data.services || servicesRes.data.data || [];
          const map = {};
          services.forEach(s => map[s._id] = s.name || s.mainTreatment || 'Unknown Service');
          setServiceNamesMap(map);
        }

        if (clinicsRes.data.success) {
          const clinic = clinicsRes.data.clinic || clinicsRes.data.data;
          if (clinic) {
            setClinicNamesMap({ [clinic._id]: clinic.name });
          }
        }

        if (agentsRes.data.success) {
          const agents = agentsRes.data.agents || agentsRes.data.data || [];
          const map = {};
          agents.forEach(a => map[a._id] = a.name || a.title || 'Unknown User');
          setUserNamesMap(map);
        }
      } catch (err) {
        console.error('Error fetching master data:', err);
      }
    };

    fetchMasterData();
  }, [viewingOffer]);

  // Fetch clinic currency preference
  useEffect(() => {
    const fetchClinicCurrency = async () => {
      try {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) return;
        const res = await axios.get('/api/clinics/myallClinic', { headers: authHeaders });
        if (res.data.success && res.data.clinic?.currency) {
          setCurrency(res.data.clinic.currency);
        }
      } catch (e) { 
        console.error('Error fetching clinic currency:', e); 
      }
    };
    fetchClinicCurrency();
  }, []);

  const openEditModal = async (offerId) => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      toast.error("Not authorized!");
      return;
    }
    // ✅ Strict check: Must have update permission
    if (finalCanUpdate !== true) {
      toast.error("You do not have permission to update offers");
      return;
    }
    setEditingOfferId(offerId);
    setModalOpen(true);

    try {
      const res = await fetch(`/api/lead-ms/update-offer?id=${offerId}`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      const data = await res.json();
      
      // ✅ Handle 403 permission denied explicitly
      if (res.status === 403 || (data.message && data.message.toLowerCase().includes("permission"))) {
        toast.error(data.message || "You do not have permission to update offers");
        setModalOpen(false);
        return;
      }
      
      if (data.success) {
        setEditingOfferData(data.offer);
      } else {
        toast.error(data.message || "Failed to fetch offer");
        setModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to load offer details");
      setModalOpen(false);
    }
  };

  const handleOfferSaved = (offer, isUpdate) => {
    if (isUpdate) {
      setOffers((prev) => prev.map((o) => (o._id === offer._id ? offer : o)));
    } else {
      setOffers((prev) => [offer, ...prev]);
    }
  };

  const requestDeleteOffer = (offer) => {
    // ✅ Strict check: Must have delete permission
    if (finalCanDelete !== true) {
      toast.error("You do not have permission to delete offers");
      return;
    }
    setConfirmModal({
      isOpen: true,
      offerId: offer._id,
      offerTitle: offer.title || "this offer",
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.offerId) return;
    const storedToken = getStoredToken();
    if (!storedToken) {
      toast.error("Not authorized!");
      return;
    }

    // ✅ Double-check permission before making API call
    if (finalCanDelete !== true) {
      toast.error("You do not have permission to delete offers");
      setConfirmModal({ isOpen: false, offerId: null, offerTitle: "" });
      return;
    }

    try {
      const res = await fetch(`/api/lead-ms/delete-create-offer?id=${confirmModal.offerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      const data = await res.json();
      
      // ✅ Handle 403 permission denied explicitly
      if (res.status === 403 || (data.message && data.message.toLowerCase().includes("permission"))) {
        toast.error(data.message || "You do not have permission to delete offers");
        setConfirmModal({ isOpen: false, offerId: null, offerTitle: "" });
        return;
      }
      
      if (data.success) {
        setOffers((prev) => prev.filter((o) => o._id !== confirmModal.offerId));
        toast.success("Offer deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete offer");
      }
    } catch (err) {
      console.error("Error deleting offer:", err);
      toast.error("Server error while deleting offer");
    } finally {
      setConfirmModal({ isOpen: false, offerId: null, offerTitle: "" });
    }
  };

  // Export offers to CSV
  const exportOffersToCSV = () => {
    // Check if user has read permission
    if (finalCanRead !== true) {
      toast.error("You do not have permission to export offers");
      return;
    }
    
    if (offers.length === 0) {
      toast.error("No offers to export");
      return;
    }
    
    // Define CSV headers
    const headers = [
      "Title",
      "Description",
      "Type",
      "Value",
      "Code",
      "Slug",
      "Start Date",
      "End Date",
      "Status",
      "Created At",
      "Updated At"
    ];
    
    // Prepare CSV content
    const csvContent = [
      headers.join(","),
      ...offers.map(offer => [
        `"${(offer.title || '').replace(/"/g, '""')}"`,
        `"${(offer.description || '').replace(/"/g, '""')}"`,
        `"${offer.type || ''}"`,
        `"${offer.value || ''}"`,
        `"${offer.code || ''}"`,
        `"${offer.slug || ''}"`,
        `"${offer.startsAt ? new Date(offer.startsAt).toLocaleDateString() : ''}"`,
        `"${offer.endsAt ? new Date(offer.endsAt).toLocaleDateString() : ''}"`,
        `"${offer.status || ''}"`,
        `"${offer.createdAt ? new Date(offer.createdAt).toLocaleString() : ''}"`,
        `"${offer.updatedAt ? new Date(offer.updatedAt).toLocaleString() : ''}"`
      ].join(","))
    ].join("\n");
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `offers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${offers.length} offers exported successfully!`);
  };

  // Calculate enhanced stats
  const activeOffers = offers.filter((o) => o.status === "active").length;
  const inactiveOffers = offers.filter((o) => o.status !== "active").length;
  const totalValue = offers.reduce((sum, o) => {
    if (o.type === "fixed") return sum + (o.value || 0);
    return sum;
  }, 0);
  const percentageOffers = offers.filter((o) => o.type === "percentage").length;
  const fixedOffers = offers.filter((o) => o.type === "fixed").length;
  const averageDiscount = offers.length > 0 
    ? offers.reduce((sum, o) => sum + (o.value || 0), 0) / offers.length 
    : 0;
  
  // Calculate expiring soon (next 7 days)
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiringSoon = offers.filter((o) => {
    if (!o.endsAt || o.status !== "active") return false;
    const endDate = new Date(o.endsAt);
    return endDate >= now && endDate <= sevenDaysFromNow;
  }).length;
  
  const modalToken = token || getStoredToken() || "";

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1f2937",
            color: "#f9fafb",
            fontSize: "12px",
            padding: "8px 12px",
            borderRadius: "8px",
          },
        }}
      />
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4">
      <div className="max-w-9xl mx-auto space-y-3">
        {!permissionsLoaded ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-xs sm:text-sm text-teal-700 font-medium">Loading permissions...</p>
          </div>
        ) : !finalCanRead && !finalCanCreate ? (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-teal-900 mb-2">Access Denied</h2>
              <p className="text-sm text-teal-700 mb-4">
                You do not have permission to view or create clinic offers.
              </p>
              <p className="text-xs text-teal-600">
                Please contact your administrator to request access to the Offers module.
              </p>
            </div>
          </div>
        ) : !finalCanRead && finalCanCreate ? (
          <div className="min-h-screen bg-gray-50 p-3 sm:p-4">
            <div className="max-w-9xl mx-auto space-y-3">
              {/* Compact Header Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-teal-900 mb-0.5">Offers Management</h1>
                    <p className="text-[10px] sm:text-xs text-teal-600">Create promotional offers for your clinic</p>
                  </div>
                  <div className="flex gap-2">
                    {finalCanCreate === true && (
                      <button
                        onClick={() => {
                          setEditingOfferId(null);
                          setEditingOfferData(null);
                          setModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-2 py-1 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs font-medium"
                      >
                        <PlusCircle className="h-3 w-3" />
                        <span>Create New Offer</span>
                      </button>
                    )}
                    <button
                      onClick={exportOffersToCSV}
                      className="inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs font-medium"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Message when read is false but create is true */}
              <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6 text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-teal-900 mb-2">
                  Limited Access
                </h3>
                <p className="text-sm text-teal-700 mb-3">
                  You can create new offers, but you don't have permission to view existing offers.
                </p>
                <p className="text-xs text-teal-600">
                  Use the "Create New Offer" button above to add a new offer.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Compact Header Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-teal-900 mb-0.5">Offers Management</h1>
                  <p className="text-[10px] sm:text-xs text-teal-600">Create and manage promotional offers for your clinic</p>
                </div>
                <div className="flex gap-2">
                  {finalCanCreate === true && (
                    <button
                      onClick={() => {
                        setEditingOfferId(null);
                        setEditingOfferData(null);
                        setModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Create New Offer</span>
                    </button>
                  )}
                  {/* <button
                    onClick={exportOffersToCSV}
                    className="inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export</span>
                  </button> */}
                </div>
              </div>
            </div>

            {/* Enhanced Stats Cards - Compact */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3">
              <div className="bg-white rounded-lg shadow-sm border-l-4 border-gray-800 p-2.5 sm:p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-teal-800 rounded-lg flex items-center justify-center">
                    <Package className="h-3.5 w-3.5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-teal-600 uppercase">Total</p>
                </div>
                <p className="text-lg sm:text-xl font-bold text-teal-900">{offers.length}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border-l-4 border-green-600 p-2.5 sm:p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-teal-600 uppercase">Active</p>
                </div>
                <p className="text-lg sm:text-xl font-bold text-green-600">{activeOffers}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border-l-4 border-gray-500 p-2.5 sm:p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center">
                    <Package className="h-3.5 w-3.5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-teal-600 uppercase">Inactive</p>
                </div>
                <p className="text-lg sm:text-xl font-bold text-teal-700">{inactiveOffers}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-600 p-2.5 sm:p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">%</span>
                  </div>
                  <p className="text-[10px] font-semibold text-teal-600 uppercase">Percent</p>
                </div>
                <p className="text-lg sm:text-xl font-bold text-blue-600">{percentageOffers}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border-l-4 border-purple-600 p-2.5 sm:p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">{getCurrencySymbol(currency)}</span>
                  </div>
                  <p className="text-[10px] font-semibold text-teal-600 uppercase">Fixed</p>
                </div>
                <p className="text-lg sm:text-xl font-bold text-purple-600">{fixedOffers}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border-l-4 border-amber-600 p-2.5 sm:p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-amber-600 rounded-lg flex items-center justify-center">
                    <Calendar className="h-3.5 w-3.5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-teal-600 uppercase">Expiring</p>
                </div>
                <p className="text-lg sm:text-xl font-bold text-amber-600">{expiringSoon}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border-l-4 border-indigo-600 p-2.5 sm:p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">{getCurrencySymbol(currency)}</span>
                  </div>
                  <p className="text-[10px] font-semibold text-teal-600 uppercase">Avg Value</p>
                </div>
                <p className="text-base sm:text-lg font-bold text-indigo-600">{getCurrencySymbol(currency)}{Math.round(averageDiscount)}</p>
              </div>
            </div>

            {/* Compact Offers Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-200 bg-teal-50">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-teal-800" />
                  <h2 className="text-sm sm:text-base font-bold text-teal-900">All Offers</h2>
                  <span className="ml-auto text-[10px] text-teal-600 bg-teal-100 px-2 py-0.5 rounded-md">
                    {offers.length} {offers.length === 1 ? 'offer' : 'offers'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 sm:p-3">
                {offers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-teal-100 rounded-lg mb-2">
                      <Package className="h-5 w-5 text-teal-800" />
                    </div>
                    <h3 className="text-sm font-bold text-teal-900 mb-1">No offers yet</h3>
                    {finalCanRead === true ? (
                      <p className="text-teal-600 text-xs mb-3">Get started by creating your first promotional offer</p>
                    ) : (
                      <p className="text-teal-600 text-xs mb-3">You don't have permission to view offers, but you can create new ones</p>
                    )}
                    {finalCanCreate === true && (
                      <button
                        onClick={() => {
                          setEditingOfferId(null);
                          setEditingOfferData(null);
                          setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs transition-colors font-medium"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Create Your First Offer</span>
                      </button>
                    )}
                    {finalCanCreate !== true && (
                      <p className="text-red-500 text-xs">You do not have permission to create offers</p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-2 py-2 text-left text-[10px] font-semibold text-teal-700 uppercase tracking-wider">
                            Offer Details
                          </th>
                          <th className="px-2 py-2 text-left text-[10px] font-semibold text-teal-700 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-2 py-2 text-left text-[10px] font-semibold text-teal-700 uppercase tracking-wider">
                            Value
                          </th>
                          <th className="px-2 py-2 text-left text-[10px] font-semibold text-teal-700 uppercase tracking-wider">
                            Validity
                          </th>
                          <th className="px-2 py-2 text-left text-[10px] font-semibold text-teal-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-2 py-2 text-right text-[10px] font-semibold text-teal-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-teal-100">
                        {offers.map((offer) => {
                          const isExpiringSoon = offer.endsAt && offer.status === "active" && 
                            new Date(offer.endsAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
                            new Date(offer.endsAt) >= new Date();
                          
                          return (
                            <tr key={offer._id} className="hover:bg-teal-50 transition-colors">
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    offer.offerType === "instant_discount" ? "bg-green-600" :
                                    offer.offerType === "bundle" ? "bg-amber-500" : "bg-blue-600"
                                  }`}>
                                    <Package className="h-3 w-3 text-white" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-teal-900 text-xs truncate">{offer.title}</p>
                                    <p className="text-[10px] text-teal-500">ID: {offer._id.slice(-6)}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium capitalize ${
                                  offer.offerType === "instant_discount" ? "bg-green-100 text-green-800" :
                                  offer.offerType === "bundle" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                                }`}>
                                  {offer.offerType?.replace("_", " ") || "—"}
                                </span>
                              </td>
                              <td className="px-2 py-2">
                                <span className="text-xs sm:text-sm font-bold text-teal-900">
                                  {offer.offerType === "instant_discount" ? (
                                    offer.discountMode === "percentage" ? `${offer.discountValue}% OFF` : `${getCurrencySymbol(currency)}${offer.discountValue} OFF`
                                  ) : offer.offerType === "bundle" ? (
                                    `Buy ${offer.buyQty} Get ${offer.freeQty}`
                                  ) : (
                                    `${getCurrencySymbol(currency)}${offer.cashbackAmount} Cashback`
                                  )}
                                </span>
                              </td>
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-1 text-teal-700">
                                  <Calendar className="h-3 w-3 text-teal-400 flex-shrink-0" />
                                  <span className="text-[10px] sm:text-xs">
                                    {offer.endsAt
                                      ? new Date(offer.endsAt).toLocaleDateString("en-US", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : "No expiry"}
                                  </span>
                                  {isExpiringSoon && (
                                    <span className="ml-1 px-1 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-semibold rounded">
                                      Soon
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                    offer.status === "active"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-teal-200 text-teal-700"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full mr-1 ${
                                      offer.status === "active" ? "bg-green-500" : "bg-teal-500"
                                    }`}
                                  ></span>
                                  {offer.status}
                                </span>
                              </td>
                              <td className="px-2 py-2">
                                <div className="flex items-center justify-end gap-1">
                                  {finalCanRead === true && (
                                    <button
                                      onClick={() => setViewingOffer(offer)}
                                      className="inline-flex items-center justify-center w-6 h-6 rounded bg-teal-100 text-teal-800 hover:bg-teal-200 transition-colors"
                                      title="View offer"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </button>
                                  )}
                                  {finalCanUpdate === true && (
                                    <button
                                      onClick={() => openEditModal(offer._id)}
                                      className="inline-flex items-center justify-center w-6 h-6 rounded bg-teal-100 text-teal-800 hover:bg-teal-200 transition-colors"
                                      title="Edit offer"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </button>
                                  )}
                                  {finalCanDelete === true && (
                                    <button
                                      onClick={() => requestDeleteOffer(offer)}
                                      className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                      title="Delete offer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                  {!finalCanUpdate && !finalCanDelete && (
                                    <span className="text-[10px] text-teal-400">—</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <CreateOfferModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingOfferId(null);
          setEditingOfferData(null);
        }}
        onCreated={(offer) => handleOfferSaved(offer, !!editingOfferId)}
        token={modalToken}
        offer={editingOfferData}
        mode={editingOfferId ? "update" : "create"}
      />
      {/* View Offer Modal */}
      {viewingOffer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/30 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setViewingOffer(null);
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-teal-100 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-teal-200">
                  <Eye className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-teal-900">Offer Details</p>
                  <p className="text-[10px] text-teal-700 truncate max-w-[320px]">{viewingOffer.title}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingOffer(null)}
                className="text-teal-700 hover:bg-teal-200 rounded-lg p-1.5 transition-colors"
                aria-label="Close details dialog"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6 text-xs sm:text-sm text-gray-700">
              {/* META INFORMATION - Top Full Width */}
              <div className="mb-6 bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
                <div className="bg-teal-50 px-5 py-3 border-b border-teal-200">
                  <h3 className="text-sm font-bold text-teal-900">Meta Information</h3>
                </div>
                <div className="px-5 py-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Clinic</p>
                      <p className="text-xs text-gray-900 bg-teal-50 px-2 py-2 rounded-lg border border-teal-100 truncate">
                        {resolveName(viewingOffer?.clinicId, clinicNamesMap)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Created By</p>
                      <p className="text-xs text-gray-900 bg-teal-50 px-2 py-2 rounded-lg border border-teal-100 truncate">
                        {resolveName(viewingOffer?.createdBy, userNamesMap)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Updated By</p>
                      <p className="text-xs text-gray-900 bg-teal-50 px-2 py-2 rounded-lg border border-teal-100 truncate">
                        {resolveName(viewingOffer?.updatedBy, userNamesMap)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Created At</p>
                      <p className="text-xs text-gray-900 bg-teal-50 px-2 py-2 rounded-lg border border-teal-100">
                        {viewingOffer?.createdAt ? new Date(viewingOffer.createdAt).toLocaleString() : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Updated At</p>
                      <p className="text-xs text-gray-900 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100">
                        {viewingOffer?.updatedAt ? new Date(viewingOffer.updatedAt).toLocaleString() : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TWO-COLUMN GRID FOR ALL SECTIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT COLUMN */}
                <div className="space-y-6">
                  {/* BASIC SETTINGS */}
                  <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
                    <div className="bg-teal-50 px-5 py-3 border-b border-teal-200">
                      <h3 className="text-sm font-bold text-teal-900">Basic Settings</h3>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      <div>
                        <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Title</p>
                        <p className="text-sm font-semibold text-gray-900 bg-teal-50 px-3 py-1 rounded-lg border border-teal-100">{viewingOffer.title || "—"}</p>
                      </div>
                      {/* <div>
                        <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Description</p>
                        {viewingOffer.description && viewingOffer.description.trim().length > 0 ? (
                          <p className="text-sm text-gray-900 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100 break-words">{viewingOffer.description}</p>
                        ) : (
                          <div className="border border-teal-200 rounded-lg px-3 py-2 min-h-[40px] bg-gray-50"></div>
                        )}
                      </div> */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Offer Type</p>
                          <span className="inline-flex items-center px-6 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 capitalize font-medium">
                            {viewingOffer.offerType?.replace("_", " ") || viewingOffer.type || "—"}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Status</p>
                          <span className="inline-flex items-center px-6 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 capitalize font-medium">
                            {viewingOffer.status || "—"}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Code</p>
                          <p className="text-xs text-gray-900 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100">{viewingOffer.code || "—"}</p>
                        </div> */}
                        {/* <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Slug</p>
                          <p className="text-xs text-gray-900 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100 break-words">{viewingOffer.slug || "—"}</p>
                        </div> */}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Starts At</p>
                          <p className="text-xs text-gray-900 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100">
                            {viewingOffer.startsAt ? new Date(viewingOffer.startsAt).toLocaleString() : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Ends At</p>
                          <p className="text-xs text-gray-900 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100">
                            {viewingOffer.endsAt ? new Date(viewingOffer.endsAt).toLocaleString() : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        
                        {/* </div> */}
                      </div>
                    </div>
                  </div>

                  {/* OFFER DETAILS */}
                  <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
                    <div className="bg-teal-50 px-5 py-3 border-b border-teal-200">
                      <h3 className="text-sm font-bold text-teal-900">Offer Details</h3>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      {viewingOffer.offerType === "instant_discount" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Discount Mode</p>
                            <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 capitalize font-medium">
                              {viewingOffer.discountMode || "—"}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Discount Value</p>
                            <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                              {viewingOffer.discountMode === "percentage" ? `${viewingOffer.discountValue}%` : `${getCurrencySymbol(currency)}${viewingOffer.discountValue}`}
                            </span>
                          </div>
                        </div>
                      )}
                      {viewingOffer.offerType === "bundle" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Buy Quantity</p>
                            <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                              {viewingOffer.buyQty ?? "—"}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Free Quantity</p>
                            <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                              {viewingOffer.freeQty ?? "—"}
                            </span>
                          </div>
                        </div>
                      )}
                      {viewingOffer.offerType === "cashback" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Cashback Amount</p>
                            <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                              {getCurrencySymbol(currency)}{viewingOffer.cashbackAmount ?? "—"}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Cashback Expiry (Days)</p>
                            <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                              {viewingOffer.cashbackExpiryDays ?? "—"}
                            </span>
                          </div>
                        </div>
                      )}
                      {(!viewingOffer.offerType || (!["instant_discount", "bundle", "cashback"].includes(viewingOffer.offerType))) && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Type</p>
                            <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 capitalize font-medium">
                              {viewingOffer.type || "—"}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Value</p>
                            <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                              {typeof viewingOffer.value === "number" ? viewingOffer.value : "—"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                  {/* STACKING & CONTROL */}
                  <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
                    <div className="bg-teal-50 px-5 py-3 border-b border-teal-200">
                      <h3 className="text-sm font-bold text-teal-900">Stacking & Control</h3>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Auto Apply Best Offer</p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${
                            viewingOffer.autoApplyBestOffer !== false 
                              ? "bg-green-50 text-green-700 border-green-200" 
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}>
                            {viewingOffer.autoApplyBestOffer !== false ? "ENABLED" : "DISABLED"}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Allow Stacking</p>
                          <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                            {viewingOffer.allowCombiningWithOtherOffers ? "Yes" : "No"}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Receptionist Discount</p>
                          <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                            {viewingOffer.allowReceptionistDiscount ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Max Benefit Cap (%)</p>
                          <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                            {viewingOffer.maxBenefitCap ?? "—"}%
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Min Bill Amount</p>
                          <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                            {viewingOffer.minimumBillAmount ? `${getCurrencySymbol(currency)}${viewingOffer.minimumBillAmount}` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* APPLICABILITY CONTROL */}
                  <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
                    <div className="bg-teal-50 px-5 py-3 border-b border-teal-200">
                      <h3 className="text-sm font-bold text-teal-900">Applicability Control</h3>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      <div>
                        <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Apply On</p>
                        <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 capitalize font-medium">
                          {viewingOffer.applyOnAllServices ? "All Services" : 
                           viewingOffer.departmentIds?.length > 0 ? "Selected Departments" :
                           viewingOffer.doctorIds?.length > 0 ? "Selected Doctors" :
                           viewingOffer.serviceIds?.length > 0 ? "Selected Services" : "—"}
                        </span>
                      </div>
                      {viewingOffer.serviceIds?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Selected Services</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(viewingOffer.serviceIds) && viewingOffer.serviceIds.map((s, idx) => (
                              <span key={idx} className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                                {resolveName(s, serviceNamesMap)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {viewingOffer.departmentIds?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Selected Departments</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(viewingOffer.departmentIds) && viewingOffer.departmentIds.map((d, idx) => (
                              <span key={idx} className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                                {resolveName(d, departmentNamesMap)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {viewingOffer.doctorIds?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Selected Doctors</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(viewingOffer.doctorIds) && viewingOffer.doctorIds.map((doc, idx) => (
                              <span key={idx} className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                                {resolveName(doc, doctorNamesMap)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SMART TOGGLES - COMMENTED OUT */}
                  {/* <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
                    <div className="bg-teal-50 px-5 py-3 border-b border-teal-200">
                      <h3 className="text-sm font-bold text-teal-900">Smart Toggles</h3>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Auto Apply Best Offer</p>
                          <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                            {viewingOffer.autoApplyBestOffer !== false ? "Yes" : "No"}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Allow Manual Override</p>
                          <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                            {viewingOffer.allowManualOverride ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Require Approval</p>
                          <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                            {viewingOffer.requireApprovalForOverride !== false ? "Yes" : "No"}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Block if Margin Low (%)</p>
                          <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                            {viewingOffer.blockIfProfitMarginBelowX !== false ? `${viewingOffer.blockIfProfitMarginBelowX}%` : "No"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div> */}

                  {/* USAGE LIMITS */}
                  {/* <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
                    <div className="bg-teal-50 px-5 py-3 border-b border-teal-200">
                      <h3 className="text-sm font-bold text-teal-900">Usage Limits</h3>
                    </div>
                    <div className="px-5 py-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Max Uses</p>
                          <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                            {viewingOffer.maxUses ?? "Unlimited"}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Uses Count</p>
                          <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                            {viewingOffer.usesCount ?? 0}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Per User Limit</p>
                          <span className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                            {viewingOffer.perUserLimit ?? 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div> */}

                  {/* TREATMENTS & SUBTREATMENTS */}
                  {/* <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
                    <div className="bg-teal-50 px-5 py-3 border-b border-teal-200">
                      <h3 className="text-sm font-bold text-teal-900">Treatments</h3>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      <div>
                        <p className="text-[10px] font-semibold text-teal-700 mb-1.5">Treatments</p>
                        {Array.isArray(viewingOffer.treatments) && viewingOffer.treatments.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {viewingOffer.treatments.map((t, idx) => (
                              <span key={idx} className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                                {typeof t === "string" ? t : t?.name || t?._id || "—"}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-900 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100">—</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-teal-700 mb-1.5">SubTreatments</p>
                        {Array.isArray(viewingOffer.subTreatments) && viewingOffer.subTreatments.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {viewingOffer.subTreatments.map((st, idx) => (
                              <span key={idx} className="inline-flex items-center px-3 py-2 bg-teal-50 text-teal-800 rounded-lg text-xs border border-teal-200 font-medium">
                                {st?.name || st?.slug || "—"}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-900 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100">—</p>
                        )}
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
      {/* Compact Delete Confirmation Modal */}
      {confirmModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/30 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmModal({ isOpen: false, offerId: null, offerTitle: "" });
              toast("Deletion cancelled", { duration: 2000, icon: "ℹ️" });
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-red-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-teal-900">Delete Offer</p>
                  <p className="text-[10px] text-teal-700 truncate max-w-[200px]">"{confirmModal.offerTitle}"</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setConfirmModal({ isOpen: false, offerId: null, offerTitle: "" });
                  toast("Deletion cancelled", { duration: 2000, icon: "ℹ️" });
                }}
                className="p-1 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 text-teal-500 hover:text-teal-700"
                aria-label="Close confirmation dialog"
              >
                ×
              </button>
            </div>
            <div className="p-4 text-xs sm:text-sm text-teal-700 space-y-1.5">
              <p>Are you sure you want to delete this offer? This action cannot be undone.</p>
              <p className="text-[10px] text-teal-600">All references to this offer will be removed.</p>
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button
                onClick={() => {
                  setConfirmModal({ isOpen: false, offerId: null, offerTitle: "" });
                  toast("Deletion cancelled", { duration: 2000, icon: "ℹ️" });
                }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-teal-700 hover:bg-teal-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Wrap in layout
OffersPage.getLayout = (page) => <ClinicLayout>{page}</ClinicLayout>;

// Export unwrapped base component for reuse (agent portal)
export const CreateOfferPageBase = OffersPage;

// Protect page and preserve layout
const ProtectedOffersPage = withClinicAuth(OffersPage);
ProtectedOffersPage.getLayout = OffersPage.getLayout;

export default ProtectedOffersPage
