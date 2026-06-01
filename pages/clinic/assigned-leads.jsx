import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import WhatsAppChat from "../../components/WhatsAppChat";
import { Toaster, toast } from "react-hot-toast";

const TOKEN_SOURCES = {
  clinic: ["clinicToken"],
  agent: ["agentToken", "clinicToken"],
};

const AssignedLeadsPage = ({ contextOverride = null }) => {
  const [routeContext, setRouteContext] = useState(contextOverride || "clinic");
  useEffect(() => {
    if (contextOverride) {
      setRouteContext(contextOverride);
      return;
    }
    if (typeof window === "undefined") return;
    const isAgentRoute = window.location.pathname?.startsWith("/agent/") ?? false;
    setRouteContext(isAgentRoute ? "agent" : "clinic");
  }, [contextOverride]);

  const tokenSources = useMemo(
    () => TOKEN_SOURCES[routeContext] || TOKEN_SOURCES.clinic,
    [routeContext]
  );

  const resolveToken = () => {
    if (typeof window === "undefined") return null;
    for (const key of tokenSources) {
      const stored = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (stored) return stored;
    }
    return null;
  };

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [totalAssigned, setTotalAssigned] = useState(0);
  const [error, setError] = useState("");
  const [followUpsdate, setFollowUpsdate] = useState({});
  const [token, setToken] = useState(null);
  const [saving, setSaving] = useState({});
  const [chatOpen, setChatOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    leadId: null,
    leadName: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    source: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1)
  const [totalLeads, setTotalLeads] = useState(0)
  const leadsPerPage = 9;
  const pageSize = 9;
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    lead: null,
  });
  const [permissions, setPermissions] = useState({
    canUpdate: false,
    canDelete: false,
    canApprove: false,
    canAll: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    const syncToken = () => {
      const t = resolveToken();
      if (t) {
        setToken(t);
      } else {
        setError("Unauthorized: No token found");
        setLoading(false);
      }
    };
    syncToken();
    window.addEventListener("storage", syncToken);
    return () => window.removeEventListener("storage", syncToken);
  }, [tokenSources]);

  // Fetch permissions
  useEffect(() => {
    if (!token) return;
    const fetchPermissions = async () => {
      try {
        const res = await axios.get("/api/clinic/permissions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        if (data.success && data.data) {
          const modulePermission = data.data.permissions?.find(
            (p) => {
              const moduleKey = p.module || "";
              return moduleKey === "lead" ||
                moduleKey === "clinic_lead" ||
                moduleKey.replace(/^(admin|clinic|doctor)_/, "") === "lead";
            }
          );
          if (modulePermission) {
            const actions = modulePermission.actions || {};
            const isTrue = (value) => {
              if (value === true) return true;
              if (value === "true") return true;
              if (String(value).toLowerCase() === "true") return true;
              return false;
            };
            const moduleAll = isTrue(actions.all);
            setPermissions({
              canUpdate: moduleAll || isTrue(actions.update),
              canDelete: moduleAll || isTrue(actions.delete),
              canApprove: moduleAll || isTrue(actions.update),
              canAll: moduleAll,
            });
          }
        }
        setPermissionsLoaded(true);
      } catch (err) {
        console.error("Error fetching permissions:", err);
        setPermissionsLoaded(true);
      }
    };
    fetchPermissions();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const fetchLeads = async () => {
      try {
        const scope = routeContext === "agent" ? "agent" : "clinic";
        const res = await axios.get(`/api/clinic/get-assignedLead?scope=${scope}&page=${currentPage}&limit=${leadsPerPage}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setLeads(res.data.leads);
          setTotalAssigned(res.data.totalAssigned);
          setTotalPages(res?.data?.pagination?.totalPages || 1)
          setTotalLeads(res?.data?.pagination?.totalLeads || 0)
        } else {
          setError(res.data.message || "Failed to fetch leads");
        }
      } catch (err) {
        console.error("Error fetching leads:", err);
        setError("Something went wrong while fetching leads");
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [token, routeContext, currentPage]);

  const handleFollowUpdateChange = (leadId, value) => {
    setFollowUpsdate((prev) => ({ ...prev, [leadId]: value }));
  };

  const saveFollowUp = async (leadId) => {
    if (!token) {
      toast.error("Unauthorized. Please log in again.");
      return;
    }

    if (!permissions.canUpdate && !permissions.canAll) {
      toast.error("You do not have permission to update leads");
      return;
    }

    if (!followUpsdate[leadId]) {
      toast("Please select a follow-up date before saving.", { icon: "ℹ️" });
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, [leadId]: true }));

      const payload = {
        leadId,
        nextFollowUp: followUpsdate[leadId]
      };

      const res = await axios.put("/api/lead-ms/update-lead-status-agent", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        toast.success("Follow-up date updated");

        setLeads((prevLeads) =>
          prevLeads.map((lead) => {
            if (lead._id === leadId) {
              const updatedFollowUps = [
                ...(lead.nextFollowUps || []),
                { date: new Date(followUpsdate[leadId]).toISOString() },
              ];
              return { ...lead, nextFollowUps: updatedFollowUps };
            }
            return lead;
          })
        );

        setFollowUpsdate((prev) => ({ ...prev, [leadId]: "" }));
      } else {
        toast.error(res.data.message || "Failed to update follow-up date");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error while saving follow-up date");
    } finally {
      setSaving((prev) => ({ ...prev, [leadId]: false }));
    }
  };

  const requestDeleteLead = (lead) => {
    if (!permissions.canDelete && !permissions.canAll) {
      toast.error("You do not have permission to delete leads");
      return;
    }
    setConfirmModal({
      isOpen: true,
      leadId: lead._id,
      leadName: lead.name || "this lead",
    });
  };

  const deleteLead = async () => {
    if (!confirmModal.leadId) return;
    try {
      const res = await axios.delete("/api/lead-ms/lead-delete", {
        headers: { Authorization: `Bearer ${token}` },
        data: { leadId: confirmModal.leadId },
      });

      if (res.data.success) {
        toast.success("Lead deleted successfully");
        setLeads((prevLeads) => prevLeads.filter((lead) => lead._id !== confirmModal.leadId));
        setTotalAssigned((prev) => Math.max(0, prev - 1));
      } else {
        if (res.status === 403) {
          toast("You don't have access to delete this lead.", { icon: "🔒" });
        } else {
          toast.error(res.data.message || "Failed to delete lead");
        }
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast("You don't have permission to delete this lead.", { icon: "🔒" });
      } else {
        toast.error(err.response?.data?.message || "Error deleting lead");
      }
    } finally {
      setConfirmModal({ isOpen: false, leadId: null, leadName: "" });
    }
  };

  const approveLead = async (leadId) => {
    if (!permissions.canApprove && !permissions.canAll) {
      toast.error("You do not have permission to approve leads");
      return;
    }

    try {
      const res = await axios.put(
        "/api/lead-ms/update-lead-status",
        { leadId, status: "Approved" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success("Lead approved successfully");
        setLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead._id === leadId ? { ...lead, status: "Approved" } : lead
          )
        );
      } else {
        toast.error(res.data.message || "Failed to approve lead");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error approving lead");
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      new: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
      contacted: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
      qualified: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
      converted: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
      lost: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
      booked: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
      approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' }
    };
    return configs[status?.toLowerCase()] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' };
  };

  const formatPhoneNumber = (phone) => {
    const trimmed = phone.replace(/\s+/g, "");
    if (trimmed.startsWith("+")) return trimmed;
    return `+91${trimmed}`;
  };

  const getFollowUpBadge = (followUpStatus) => {
    if (followUpStatus === 'past') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg shadow-sm">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          OVERDUE
        </span>
      );
    }
    if (followUpStatus === 'today') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-500 text-white rounded-lg shadow-sm">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          DUE TODAY
        </span>
      );
    }
    return null;
  };


  const statusOptions = ["New", "Contacted", "Qualified", "Converted", "Lost", "Booked", "Approved"];

  const sourceOptions = useMemo(() => {
    const set = new Set();
    leads.forEach((lead) => {
      if (lead.source) {
        set.add(lead.source);
      }
    });
    return Array.from(set);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesQuery =
        !query ||
        [lead.name, lead.phone, lead.offerTag, lead.status]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(query));

      const matchesStatus =
        !filters.status ||
        (lead.status || "").toLowerCase() === filters.status.toLowerCase();

      const matchesSource =
        !filters.source ||
        (lead.source || "").toLowerCase() === filters.source.toLowerCase();

      return matchesQuery && matchesStatus && matchesSource;
    });
  }, [leads, searchQuery, filters]);

  const totalFiltered = filteredLeads.length;
  // const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  // useEffect(() => {
  //   if (currentPage > totalPages) {
  //     setCurrentPage(totalPages);
  //   }
  // }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLeads = useMemo(() => {
    return filteredLeads.slice(startIndex, startIndex + pageSize);
  }, [filteredLeads, startIndex, pageSize]);

  const showingFrom = totalFiltered === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + pageSize, totalFiltered);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ status: "", source: "" });
    setCurrentPage(1);
    toast("Filters cleared", { icon: "♻️" });
  };

  const openDetailsModal = (lead) => {
    setDetailsModal({ isOpen: true, lead });
  };

  const closeDetailsModal = () => {
    setDetailsModal({ isOpen: false, lead: null });
  };

  const totalCount = leads.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
          <div className="text-gray-700">Loading leads...</div>
        </div>
      </div>
    );
  }

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-white py-6">
        <div className="mx-auto max-w-6xl px-4 lg:px-6 space-y-5">
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-500">
                  Lead pipeline
                </p>
                <h1 className="text-2xl font-semibold text-gray-900">Assigned Leads</h1>
                <p className="text-sm text-gray-700 mt-1">
                  Track assignments, follow-ups, and approvals in one compact overview.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700">
                  Total Leads
                  <p className="text-xl font-semibold text-gray-900">{totalLeads}</p>
                </div>
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 transition"
                >
                  {filterOpen ? "Close filters" : "Open filters"}
                </button>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name, phone, or status"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
            </div>
            <p className="text-xs text-gray-600">
              Showing {totalFiltered} lead{totalFiltered === 1 ? "" : "s"}
            </p>
          </div>

          {filterOpen && (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
                    Refine your list
                  </h2>
                  <p className="text-xs text-gray-700 sm:text-sm">
                    Combine filters to surface the leads that matter right now.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-gray-500">
                  Precision mode
                  <span className="inline-flex h-2 w-2 rounded-full bg-sky-500" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Lead status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    <option value="">All statuses</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status.toLowerCase()}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Source
                  </label>
                  <select
                    value={filters.source}
                    onChange={(e) => handleFilterChange("source", e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    <option value="">All sources</option>
                    {sourceOptions.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Quick actions
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetFilters}
                      className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 transition"
                    >
                      Reset filters
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Filters apply automatically as you change them.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center min-h-[320px] bg-white border border-gray-200 rounded-xl shadow-sm mt-6">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-sky-500 rounded-full animate-spin" />
              <p className="mt-4 text-gray-700 font-medium">Loading leads...</p>
              <p className="text-xs text-gray-700 mt-1">Please wait while we fetch your data.</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-white border border-rose-200 rounded-xl shadow-sm px-6 py-5 mt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-rose-700">Unable to load leads</h3>
                  <p className="text-sm text-rose-600 mt-1">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-rose-500 rounded-md hover:bg-rose-600"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && leads.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-12 mt-6 text-center">
              <div className="mx-auto w-14 h-14 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No leads assigned yet</h3>
              <p className="mt-2 text-sm text-gray-700">
                Once a lead is assigned to your clinic, it will appear in this list with its details.
              </p>
            </div>
          )}

          {!loading && !error && leads.length > 0 && filteredLeads.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-8 mt-6 text-center">
              <h3 className="text-sm font-semibold text-gray-900">No leads match your filters</h3>
              <p className="mt-2 text-sm text-gray-700">
                Try adjusting your search or filter criteria to find the lead you need.
              </p>
            </div>
          )}

          {!loading && !error && leads?.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {leads?.map((lead) => {
                  const statusConfig = getStatusConfig(lead.status);
                  const cardBorderClass =
                    lead.followUpStatus === "past"
                      ? "border-l-4 border-l-red-500 shadow-red-100"
                      : lead.followUpStatus === "today"
                        ? "border-l-4 border-l-emerald-500 shadow-emerald-100"
                        : "border-l-4 border-l-gray-200";
                  return (
                    <div
                      key={lead._id}
                      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition ${cardBorderClass}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                          <p className="text-xs text-gray-500">ID: {lead._id.slice(-6)}</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                          {lead.status || "N/A"}
                        </span>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{lead.phone || "No phone"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v7" />
                          </svg>
                          <span className="capitalize">{lead.gender || "Gender N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span>{lead.source || "No source"}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => openDetailsModal(lead)}
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 transition"
                        >
                          View details
                        </button>
                        <button
                          onClick={() => {
                            setActiveLead(lead);
                            setChatOpen(true);
                          }}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:border-emerald-300 transition"
                        >
                          Chat
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Showing {(currentPage - 1) * leadsPerPage + 1}-{currentPage * leadsPerPage} of {totalLeads} lead{totalLeads === 1 ? "" : "s"}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* WhatsApp Chat Modal */}
      {chatOpen && activeLead && (
        <WhatsAppChat
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          leadName=""
          phoneNumber={formatPhoneNumber(activeLead.phone)}
          hideNameAndNumber={true}
        />
      )}

      {detailsModal.isOpen && detailsModal.lead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeDetailsModal();
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Lead overview</p>
                <h3 className="text-lg font-semibold text-gray-900">{detailsModal.lead.name}</h3>
                <p className="text-sm text-gray-600">
                  ID: {detailsModal.lead._id.slice(-8)} &bull; Source: {detailsModal.lead.source || "N/A"}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusConfig(detailsModal.lead.status).bg} ${getStatusConfig(detailsModal.lead.status).text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${getStatusConfig(detailsModal.lead.status).dot}`} />
                {detailsModal.lead.status}
              </span>
            </div>

            <div className="px-6 py-5 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm text-gray-800">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</p>
                  <p className="mt-1">{detailsModal.lead.phone || "No phone"}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</p>
                  <p className="mt-1">{detailsModal.lead.email || "Not provided"}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gender</p>
                  <p className="mt-1 capitalize">{detailsModal.lead.gender || "Not specified"}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assigned to</p>
                  <p className="mt-1 text-xs text-gray-600">
                    {detailsModal.lead.assignedTo?.map((a) => a.user?.name).join(", ") || "Not assigned"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 col-span-full">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Treatments</p>
                  {detailsModal.lead.treatments && detailsModal.lead.treatments.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {detailsModal.lead.treatments.map((treatment, idx) => (
                        <span key={idx} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs">
                          {treatment.treatment?.name}
                          {treatment.subTreatment ? ` • ${treatment.subTreatment}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-600">No treatments recorded.</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    Follow-up history
                  </p>
                  {detailsModal.lead.nextFollowUps && detailsModal.lead.nextFollowUps.length > 0 ? (
                    <ul className="space-y-2 text-sm text-gray-700 max-h-48 overflow-y-auto">
                      {detailsModal.lead.nextFollowUps.map((follow, index) => (
                        <li key={index} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                          <span>{new Date(follow.date).toLocaleString()}</span>
                          <span className="text-xs text-gray-500">{follow.status || "Scheduled"}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600">No follow-up entries found.</p>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Schedule next follow-up
                  </p>
                  <input
                    type="datetime-local"
                    value={followUpsdate[detailsModal.lead._id] || ""}
                    onChange={(e) => handleFollowUpdateChange(detailsModal.lead._id, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                  <button
                    onClick={() => saveFollowUp(detailsModal.lead._id)}
                    disabled={
                      saving[detailsModal.lead._id] ||
                      !followUpsdate[detailsModal.lead._id] ||
                      (!permissions.canUpdate && !permissions.canAll)
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving[detailsModal.lead._id] ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Schedule follow-up
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setActiveLead(detailsModal.lead);
                    setChatOpen(true);
                  }}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:border-emerald-300 transition"
                >
                  Open WhatsApp chat
                </button>
                {(permissions.canApprove || permissions.canAll) && (
                  <button
                    onClick={() => approveLead(detailsModal.lead._id)}
                    disabled={detailsModal.lead.status === "Approved"}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold text-white ${detailsModal.lead.status === "Approved"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600"
                      }`}
                  >
                    Approve lead
                  </button>
                )}
                {(permissions.canDelete || permissions.canAll) && (
                  <button
                    onClick={() => requestDeleteLead(detailsModal.lead)}
                    className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-600 transition"
                  >
                    Delete lead
                  </button>
                )}
                <button
                  onClick={closeDetailsModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmModal({ isOpen: false, leadId: null, leadName: "" });
              toast("Deletion cancelled", { duration: 2000, icon: "ℹ️" });
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50">
              <div>
                <p className="text-sm font-semibold text-gray-900">Delete Lead</p>
                <p className="text-xs text-gray-700">"{confirmModal.leadName}"</p>
              </div>
              <button
                onClick={() => {
                  setConfirmModal({ isOpen: false, leadId: null, leadName: "" });
                  toast("Deletion cancelled", { duration: 2000, icon: "ℹ️" });
                }}
                className="text-gray-500 hover:text-gray-900 text-lg leading-none px-2"
                aria-label="Close confirmation dialog"
              >
                ×
              </button>
            </div>
            <div className="p-5 text-sm text-gray-700 space-y-2">
              <p>Are you sure you want to delete this lead? This action cannot be undone.</p>
              <p className="text-xs text-gray-600">All follow-up history will be permanently removed.</p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => {
                  setConfirmModal({ isOpen: false, leadId: null, leadName: "" });
                  toast("Deletion cancelled", { duration: 2000, icon: "ℹ️" });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteLead}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

AssignedLeadsPage.getLayout = function PageLayout(page) {
  // Wrap page in ClinicLayout for persistent layout
  // When getLayout is used, Next.js keeps the layout mounted and only swaps page content
  // This prevents sidebar and header from re-rendering on navigation
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

export const AssignedLeadsPageBase = AssignedLeadsPage;

const ProtectedAssignedLeadsPage = withClinicAuth(AssignedLeadsPage);
ProtectedAssignedLeadsPage.getLayout = AssignedLeadsPage.getLayout;

export default ProtectedAssignedLeadsPage;

