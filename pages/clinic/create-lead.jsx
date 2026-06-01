import { useState, useEffect } from "react";
import axios from "axios";
import ClinicLayout from '../../components/ClinicLayout';
import withClinicAuth from '../../components/withClinicAuth';
import CreateLeadModal from '../../components/CreateLeadModal';
import LeadViewModal from '../../components/LeadViewModal';
import { Grid3x3, PlusCircle, Tag, Download } from "lucide-react";
import ImportLeadsModal from "@/components/ImportLeadsModal";
import Link from "next/link";
import CustomAsyncSelect from "@/components/shared/CustomAsyncSelect";
import { loadSegmentOptions } from "@/lib/helper";
import { useRouter } from "next/router";
import useSegment from "@/hooks/useSegment";
import { useAgentPermissions } from "@/hooks/useAgentPermissions";

function LeadsPage() {
  const router = useRouter();
  const { segment: segmentId } = router.query;
  const { segment } = useSegment({ segmentId })
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    treatment: "",
    offer: "",
    source: "",
    status: "",
    name: "",
    startDate: "",
    endDate: "",
  });
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [viewLead, setViewLead] = useState(null);
  const [permissions, setPermissions] = useState({
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canRead: false,
    canAssign: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1)
  const [totalLeads, setTotalLeads] = useState(0)
  const leadsPerPage = 9;

  const [selectedSegment, setSelectedSegment] = useState(
    null
  );

  // Detect route context - check if this is a staff route
  const [routeContext, setRouteContext] = useState("clinic");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isStaffRoute = window.location.pathname?.startsWith("/staff/") ?? false;
    setRouteContext(isStaffRoute ? "staff" : "clinic");
  }, []);

  // Get user role from token
  const getUserRole = () => {
    if (typeof window === "undefined") return null;
    try {
      // Check tokens in priority order to get role
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

  // Get token based on user role and route context
  const getToken = () => {
    if (typeof window === "undefined") return null;

    const userRole = getUserRole();
    const isStaffRoute = routeContext === "staff";

    // For agent role: use agentToken (especially on staff routes)
    if (userRole === "agent") {
      const agentToken = localStorage.getItem("agentToken") || sessionStorage.getItem("agentToken");
      if (agentToken) return agentToken;
    }

    // For doctorStaff role: use userToken
    if (userRole === "doctorStaff") {
      const userToken = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      if (userToken) return userToken;
    }

    // For staff routes, check agentToken and userToken (for agent and doctorStaff)
    if (isStaffRoute) {
      const agentToken = localStorage.getItem("agentToken") || sessionStorage.getItem("agentToken");
      if (agentToken) return agentToken;
      const userToken = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      if (userToken) return userToken;
    }

    // For other roles, use standard priority
    const TOKEN_PRIORITY = ["clinicToken", "doctorToken", "agentToken", "userToken", "adminToken"];
    for (const key of TOKEN_PRIORITY) {
      const token = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (token) return token;
    }
    return null;
  };

  const token = getToken();

  // Use agent permissions hook for staff routes (agent and doctorStaff)
  const isStaffRoute = routeContext === "staff";
  const userRole = getUserRole();
  const isAgentOrDoctorStaff = userRole === "agent" || userRole === "doctorStaff";

  // Use hook only for agent/doctorStaff on staff routes
  // Try clinic_create_lead first (as that's what's saved in permissions), fallback to clinic_lead
  const agentPermissionsResult = useAgentPermissions(
    (isStaffRoute && isAgentOrDoctorStaff) ? "clinic_create_lead" : null
  );
  const agentPermissions = agentPermissionsResult?.permissions || {
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canApprove: false,
    canPrint: false,
    canExport: false,
    canAll: false,
  };
  const agentPermissionsLoading = agentPermissionsResult?.loading || false;

  // Handle agent/doctorStaff permissions from useAgentPermissions hook (for staff routes)
  useEffect(() => {
    if (!isStaffRoute || !isAgentOrDoctorStaff) return;
    if (agentPermissionsLoading) return;

    // Set permissions from agent permissions hook (same logic for both agent and doctorStaff)
    const newPermissions = {
      canCreate: Boolean(agentPermissions.canAll || agentPermissions.canCreate),
      canUpdate: Boolean(agentPermissions.canAll || agentPermissions.canUpdate),
      canDelete: Boolean(agentPermissions.canAll || agentPermissions.canDelete),
      canRead: Boolean(agentPermissions.canAll || agentPermissions.canRead),
      canAssign: Boolean(agentPermissions.canAll || agentPermissions.canUpdate),
    };

    console.log('[create-lead] Setting permissions from agentPermissions:', {
      userRole,
      agentPermissions,
      newPermissions,
      hasAnyPermission: newPermissions.canCreate || newPermissions.canRead || newPermissions.canUpdate || newPermissions.canDelete
    });

    setPermissions(newPermissions);
    setPermissionsLoaded(true);
  }, [isStaffRoute, isAgentOrDoctorStaff, agentPermissions, agentPermissionsLoading, userRole]);

  // Fetch clinic/admin level permissions for clinic routes
  // Also handle agent/doctorStaff on clinic routes (not staff routes)
  useEffect(() => {
    // Skip if staff route with agent/doctorStaff (handled by useAgentPermissions hook)
    if (isStaffRoute && isAgentOrDoctorStaff) return;

    const fetchPermissions = async () => {
      try {
        const authToken = getToken();
        if (!authToken) {
          setPermissions({
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canRead: false,
            canAssign: false,
          });
          setPermissionsLoaded(true);
          return;
        }

        const currentUserRole = getUserRole();

        // For admin role, grant full access (bypass permission checks)
        if (userRole === "admin") {
          setPermissions({
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true,
            canAssign: true,
          });
          setPermissionsLoaded(true);
          return;
        }

        // For clinic and doctor roles, fetch admin-level permissions from /api/clinic/sidebar-permissions
        if (currentUserRole === "clinic" || currentUserRole === "doctor") {
          try {
            const res = await axios.get("/api/clinic/sidebar-permissions", {
              headers: { Authorization: `Bearer ${authToken}` },
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
                  canAssign: true,
                });
              } else {
                // Admin has set permissions - check the clinic_lead or clinic_create_lead module
                const modulePermission = res.data.permissions.find((p) => {
                  if (!p?.module) return false;
                  // Check for clinic_lead or clinic_create_lead module
                  const moduleKey = p.module || "";
                  const normalizedModule = moduleKey.replace(/^(admin|clinic|doctor|agent)_/, "");
                  return normalizedModule === "lead" ||
                    normalizedModule === "create_lead" ||
                    moduleKey === "clinic_lead" ||
                    moduleKey === "clinic_create_lead" ||
                    moduleKey === "create_lead" ||
                    moduleKey === "lead";
                });

                if (modulePermission) {
                  const actions = modulePermission.actions || {};

                  // Helper function to check if a permission value is true (handles boolean and string)
                  const isTrue = (value) => {
                    if (value === true) return true;
                    if (value === "true") return true;
                    if (String(value).toLowerCase() === "true") return true;
                    return false;
                  };

                  // Check if "all" is true, which grants all permissions
                  const moduleAll = isTrue(actions.all);
                  const moduleCreate = isTrue(actions.create);
                  const moduleRead = isTrue(actions.read);
                  const moduleUpdate = isTrue(actions.update);
                  const moduleDelete = isTrue(actions.delete);

                  setPermissions({
                    canCreate: moduleAll || moduleCreate,
                    canRead: moduleAll || moduleRead,
                    canUpdate: moduleAll || moduleUpdate,
                    canDelete: moduleAll || moduleDelete,
                    canAssign: moduleAll || moduleUpdate,
                  });
                } else {
                  // Module permission not found in the permissions array - default to read-only
                  setPermissions({
                    canCreate: false,
                    canRead: true, // Clinic/doctor can always read their own data
                    canUpdate: false,
                    canDelete: false,
                    canAssign: false,
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
                canAssign: true,
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
              canAssign: true,
            });
          }
          setPermissionsLoaded(true);
          return;
        }

        // For agent/doctorStaff roles on clinic routes (not staff routes), check agent permissions
        if (currentUserRole === "agent" || currentUserRole === "doctorStaff") {
          try {
            // For agent: use agentToken, for doctorStaff: use userToken
            let agentStaffToken = null;
            if (currentUserRole === "agent") {
              agentStaffToken =
                localStorage.getItem("agentToken") ||
                sessionStorage.getItem("agentToken");
            } else if (currentUserRole === "doctorStaff") {
              agentStaffToken =
                localStorage.getItem("userToken") ||
                sessionStorage.getItem("userToken");
            }

            if (!agentStaffToken) {
              setPermissions({
                canCreate: false,
                canUpdate: false,
                canDelete: false,
                canRead: false,
                canAssign: false,
              });
              setPermissionsLoaded(true);
              return;
            }

            // Use agent permissions API (same for both agent and doctorStaff)
            // Try clinic_create_lead first (as that's what's saved in permissions), fallback to clinic_lead
            let res = null;
            try {
              res = await axios.get("/api/agent/get-module-permissions", {
                params: { moduleKey: "clinic_create_lead" },
                headers: { Authorization: `Bearer ${agentStaffToken}` },
              });
            } catch (err) {
              // If clinic_create_lead not found, try clinic_lead
              try {
                res = await axios.get("/api/agent/get-module-permissions", {
                  params: { moduleKey: "clinic_lead" },
                  headers: { Authorization: `Bearer ${agentStaffToken}` },
                });
              } catch (err2) {
                console.error("Error fetching agent permissions:", err2);
                res = null;
              }
            }

            if (res.data.success && res.data.permissions) {
              const actions = res.data.permissions.actions || {};
              const isTrue = (value) => {
                if (value === true) return true;
                if (value === "true") return true;
                if (String(value).toLowerCase() === "true") return true;
                return false;
              };

              const moduleAll = isTrue(actions.all);
              const moduleCreate = isTrue(actions.create);
              const moduleRead = isTrue(actions.read);
              const moduleUpdate = isTrue(actions.update);
              const moduleDelete = isTrue(actions.delete);

              setPermissions({
                canCreate: moduleAll || moduleCreate,
                canRead: moduleAll || moduleRead,
                canUpdate: moduleAll || moduleUpdate,
                canDelete: moduleAll || moduleDelete,
                canAssign: moduleAll || moduleUpdate,
              });
            } else {
              // No permissions found
              setPermissions({
                canCreate: false,
                canUpdate: false,
                canDelete: false,
                canRead: false,
                canAssign: false,
              });
            }
          } catch (err) {
            console.error("Error fetching agent permissions:", err);
            setPermissions({
              canCreate: false,
              canUpdate: false,
              canDelete: false,
              canRead: false,
              canAssign: false,
            });
          }
          setPermissionsLoaded(true);
          return;
        }

        // For other roles, deny access
        setPermissions({
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canRead: false,
          canAssign: false,
        });
        setPermissionsLoaded(true);
      } catch (err) {
        console.error("Error fetching permissions:", err);
        setPermissions({
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canRead: false,
          canAssign: false,
        });
        setPermissionsLoaded(true);
      }
    };

    fetchPermissions();
  }, [isStaffRoute, isAgentOrDoctorStaff, routeContext]);

  const fetchLeads = async () => {
    if (!token) return;

    // Wait for permissions to load
    if (!permissionsLoaded) return;

    // Check if user has read permission
    if (permissions.canRead === false) {
      setLeads([]);
      return;
    }

    try {
      const res = await axios.get("/api/lead-ms/leadFilter", {
        params: { ...filters, page: currentPage, limit: leadsPerPage, segmentId: selectedSegment?.value, },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setLeads(res.data.leads || []);
        setTotalPages(res?.data?.pagination?.totalPages || 1)
        setTotalLeads(res?.data?.pagination?.totalLeads || 0)
      } else {
        // If permission denied, clear leads
        if (res.data.message && res.data.message.includes("permission")) {
          setLeads([]);
        }
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await axios.get("/api/lead-ms/getA", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setAgents(res.data.agents || []);
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    }
  };

  const exportLeadsToCSV = () => {
    if (leads.length === 0) {
      alert("No leads to export");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Treatment",
      "Source",
      "Status",
      "Offer",
      "Notes",
      "Created At"
    ];

    const csvContent = [
      headers.join(","),
      ...leads.map(lead => [
        `"${(lead.name || "").replace(/"/g, '""')}"`,
        `"${(lead.email || "").replace(/"/g, '""')}"`,
        `"${(lead.phone || "").replace(/"/g, '""')}"`,
        `"${(lead.treatment || "").replace(/"/g, '""')}"`,
        `"${(lead.source || "").replace(/"/g, '""')}"`,
        `"${(lead.status || "").replace(/"/g, '""')}"`,
        `"${(lead.offer || "").replace(/"/g, '""')}"`,
        `"${(lead.notes || "").replace(/"/g, '""')}"`,
        `"${lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ""}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (segment) {
      setSelectedSegment({ label: segment?.name, value: segment?._id })
    }

  }, [segment])

  // Permissions are now handled in the useEffect hooks above

  useEffect(() => {
    // Fetch leads and agents after permissions are loaded
    if (permissionsLoaded) {
      fetchLeads();
      fetchAgents();
    }
  }, [permissionsLoaded, permissions.canRead, filters, currentPage, selectedSegment]);

  const assignLead = async () => {
    if (!selectedLead || !selectedAgent) {
      alert("Please select an agent");
      return;
    }

    // Check permission
    if (!permissions.canAssign) {
      alert("You do not have permission to assign leads");
      return;
    }

    try {
      await axios.post(
        "/api/lead-ms/reassign-lead",
        {
          leadId: selectedLead,
          agentIds: [selectedAgent],
          followUpDate: followUpDate
            ? new Date(followUpDate).toISOString()
            : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Lead assigned!");
      setSelectedLead(null);
      setSelectedAgent("");
      setFollowUpDate("");
      fetchLeads();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error assigning lead");
    }
  };

  const deleteLead = async (leadId) => {
    // Check permission
    if (!permissions.canDelete) {
      alert("You do not have permission to delete leads");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      await axios.delete("/api/lead-ms/lead-delete", {
        headers: { Authorization: `Bearer ${token}` },
        data: { leadId },
      });
      alert("Lead deleted");
      fetchLeads();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error deleting lead");
    }
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="mb-3 bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-teal-900">Leads Management</h1>
              <p className="text-[10px] sm:text-xs text-teal-500">Filter, review, and assign leads to your team</p>
            </div>
            <div className="flex items-center gap-2.5">
              {/* <button
                onClick={exportLeadsToCSV}
                className="inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export</span>
              </button> */}
              {permissions.canCreate && (
                <Link
                  href="/clinic/segments"
                  className="inline-flex items-center justify-center cursor-pointer gap-1.5 border border-gray-800 text-gray-800 bg-transparent hover:bg-teal-600 hover:text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                >
                  <Tag className="h-3.5 w-3.5" />
                  <span>Manage Segments</span>
                </Link>
              )}

              {permissions.canCreate && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center justify-center cursor-pointer gap-1.5 border border-gray-800 text-teal-800 bg-transparent hover:bg-teal-600 hover:text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Create New Lead</span>
                </button>
              )}

              {permissions.canCreate && (
                <button
                  onClick={() => {
                    if (!permissions.canCreate) {
                      alert("You do not have permission to import leads");
                      return;
                    }
                    setImportModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center cursor-pointer gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Import New Lead</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Compact Filters - Only show if user has read permission */}
        {permissions.canRead && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-3 grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-3">
            <input
              placeholder="Name"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-gray-800"
            />
            <input
              placeholder="Offer Tag"
              value={filters.offer}
              onChange={(e) => setFilters({ ...filters, offer: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-gray-800"
            />
            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-gray-800"
            >
              <option value="">All Sources</option>
              <option>Instagram</option>
              <option>Facebook</option>
              <option>Google</option>
              <option>WhatsApp</option>
              <option>Walk-in</option>
              <option>Other</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-gray-800"
            >
              <option value="">All Status</option>
              <option>New</option>
              <option>Contacted</option>
              <option>Booked</option>
              <option>Visited</option>
              <option>Follow-up</option>
              <option>Not Interested</option>
              <option>Other</option>
            </select>

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-gray-800"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-gray-800"
            />
            <CustomAsyncSelect
              label=""
              name="chooseSegment"
              loadOptions={(inputValue) =>
                loadSegmentOptions(inputValue, token)
              }
              value={selectedSegment}
              onChange={(value) => setSelectedSegment(value)}
              placeholder="Select a segment..."
            />
            <button
              onClick={fetchLeads}
              className="inline-flex cursor-pointer items-center justify-center bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transition-all"
            >
              Apply Filters
            </button>
          </div>
        )}

        {/* Compact Leads Cards - Only show if user has read permission */}
        {permissions.canRead ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {leads?.length > 0 ? (
              leads?.map((lead) => (
                <div
                  key={lead._id}
                  className="bg-white flex flex-col justify-between rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 hover:border-gray-400 overflow-hidden group"
                >
                  <div className="">
                    {/* Card Header with Avatar */}
                    <div className="px-5 pt-5 pb-4 border-b border-gray-50">
                      <div className="flex items-start gap-3">
                        {/* Avatar with First Letter */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-lg">
                              {lead.name ? lead.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                        </div>

                        {/* Lead Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-base font-semibold text-teal-900 truncate">
                              {lead?.name || 'Unnamed Lead'}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${lead.status === 'Booked' || lead.status === 'Visited'
                              ? 'bg-green-50 text-green-700 border border-green-100'
                              : lead.status === 'Not Interested'
                                ? 'bg-red-50 text-red-700 border border-red-100'
                                : 'bg-gray-50 text-teal-700 border border-gray-100'
                              }`}>
                              {lead.status || '—'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-teal-600 hover:text-blue-600 transition-colors"
                            >
                              {lead.phone}
                            </a>
                          </div>

                          {
                            lead?.email &&
                            <div className="flex items-center gap-2 text-sm">
                              <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <a
                                href={`mailto:${lead.email}`}
                                className="text-teal-600 hover:text-blue-600 transition-colors"
                              >
                                {lead?.email}
                              </a>
                            </div>
                          }
                        </div>
                      </div>
                    </div>

                    {/* Lead Details */}
                    <div className="px-5 py-4 space-y-3">
                      {/* Treatment Info */}
                      {lead.treatments?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-teal-500 mb-1">Treatment</p>
                            <div className="flex flex-wrap gap-1">
                              {lead.treatments.map((t, index) => (
                                <span
                                  key={index}
                                  className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium"
                                >
                                  {t.subTreatment ? `${t.subTreatment}` : t.treatment?.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Source & Offer */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium text-teal-500 mb-1">Source</p>
                          <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-teal-800 rounded-lg text-xs font-medium">
                            {lead.source || '—'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-teal-500 mb-1">Offer</p>
                          <span className="inline-flex items-center px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-100">
                            {lead.offerTag || '—'}
                          </span>
                        </div>
                      </div>

                      {/* Notes */}
                      {lead.notes?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-teal-500 mb-1">Notes</p>
                          <p className="text-sm text-teal-700 line-clamp-2">
                            {lead.notes.map(n => n.text).join(', ')}
                          </p>
                        </div>
                      )}

                      {/* Assigned To */}
                      {lead.assignedTo?.length > 0 && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div>
                            <p className="text-xs font-medium text-teal-500">Assigned to</p>
                            <p className="text-sm font-medium text-teal-900">
                              {lead.assignedTo.map(a => a.user?.name).join(', ')}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Follow-ups */}
                      {lead.followUps?.length > 0 && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-xs font-medium text-teal-500">Next follow-up</p>
                            <p className="text-sm font-medium text-teal-900">
                              {new Date(lead.followUps[0].date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-5 py-4 border-t border-gray-50 bg-gray-50/50">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setViewLead(lead)}
                        className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-teal-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>

                      {permissions.canAssign && (
                        <button
                          onClick={() => setSelectedLead(lead._id)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          Reassign
                        </button>
                      )}

                      {permissions.canDelete && (
                        <button
                          onClick={() => deleteLead(lead._id)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-teal-900 mb-2">No leads found</h3>
                <p className="text-teal-600 max-w-sm mx-auto">
                  Start by adding your first lead or adjust your filters to see more results
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-teal-900 mb-2">Read Permission Required</h3>
            <p className="text-sm text-teal-600 mb-3">
              You only have permission to create leads. You cannot view, update, or delete leads.
            </p>
            <p className="text-xs text-teal-500">
              Contact your administrator to request read permissions for the Create Lead module.
            </p>
          </div>
        )}

        {/* Pagination */}
        {permissions.canRead &&
          totalPages > 1 && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-teal-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing {(currentPage - 1) * leadsPerPage + 1}-{currentPage * leadsPerPage} of {totalLeads} lead{totalLeads === 1 ? "" : "s"}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-teal-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-teal-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-teal-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        {/* Create Lead Modal */}
        <CreateLeadModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            fetchLeads();
            setModalOpen(false);
          }}
          token={token || ""}
          canCreate={permissions.canCreate}
        />

        <ImportLeadsModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImported={() => {
            fetchLeads();
            setImportModalOpen(false);
          }}
          token={token || ""}
        />

        {/* Compact Assign Modal */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-teal-900">Reassign Lead</h2>
                    <p className="text-[10px] sm:text-xs text-teal-600 mt-0.5">Select an agent and set follow-up time</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-teal-700 mb-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Select Agent
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="w-full appearance-none rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 pr-8 text-xs sm:text-sm font-medium text-teal-900 transition-all duration-200 focus:border-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-800/20 hover:border-gray-300 cursor-pointer"
                    >
                      <option value="" disabled className="text-teal-400">Choose an agent...</option>
                      {agents.map((a) => (
                        <option key={a._id} value={a._id} className="py-2">
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                      <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {selectedAgent && (
                    <p className="mt-1.5 text-[10px] sm:text-xs text-teal-700 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Agent selected: {agents.find(a => a._id === selectedAgent)?.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-teal-700 mb-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Follow-up Date & Time
                    <span className="text-[10px] text-teal-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-xs sm:text-sm font-medium text-teal-900 transition-all duration-200 focus:border-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-800/20 hover:border-gray-300"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedLead(null);
                      setSelectedAgent("");
                      setFollowUpDate("");
                    }}
                    className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-gray-100 text-teal-700 hover:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={assignLead}
                    disabled={!selectedAgent}
                    className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-teal-600 text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-800/20 flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ReAssign Lead
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {viewLead && (
          <LeadViewModal lead={viewLead} onClose={() => setViewLead(null)} />
        )}
      </div>
    </div>
  );
}

// Wrap page in ClinicLayout for persistent layout
// When getLayout is used, Next.js keeps the layout mounted and only swaps page content
// This prevents sidebar and header from re-rendering on navigation
LeadsPage.getLayout = function PageLayout(page) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

export const CreateLeadPageBase = LeadsPage;

// Preserve layout on wrapped component
const ProtectedLeadsPage = withClinicAuth(LeadsPage);
ProtectedLeadsPage.getLayout = LeadsPage.getLayout;

export default ProtectedLeadsPage;
