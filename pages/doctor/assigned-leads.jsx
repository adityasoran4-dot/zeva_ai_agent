import { useEffect, useState } from "react";
import axios from "axios";
import DoctorLayout from "../../components/DoctorLayout";
import withDoctorAuth from "../../components/withDoctorAuth";
import FilterAssignedLead from "../../components/Filter-assigned-lead";
import WhatsAppChat from "../../components/WhatsAppChat";

const AssignedLeadsPage = () => {
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
  const [permissions, setPermissions] = useState({
    canUpdate: false,
    canDelete: false,
    canApprove: false,
    canAll: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("doctorToken");
    if (t) setToken(t);
    else {
      setError("Unauthorized: No token found");
      setLoading(false);
    }
  }, []);

  // Fetch permissions
  useEffect(() => {
    if (!token) return;
    const fetchPermissions = async () => {
      try {
        const res = await axios.get("/api/doctor/permissions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        if (data.success && data.data) {
          const modulePermission = data.data.permissions?.find(
            (p) => {
              const moduleKey = p.module || "";
              return moduleKey === "lead" || 
                     moduleKey === "doctor_lead" || 
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
        const res = await axios.get("/api/doctor/get-assignedLead", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setLeads(res.data.leads);
          setTotalAssigned(res.data.totalAssigned);
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
  }, [token]);

  const handleFollowUpdateChange = (leadId, value) => {
    setFollowUpsdate((prev) => ({ ...prev, [leadId]: value }));
  };

  const saveFollowUp = async (leadId) => {
    if (!token) {
      alert("Unauthorized");
      return;
    }

    if (!permissions.canUpdate && !permissions.canAll) {
      alert("You do not have permission to update leads");
      return;
    }

    if (!followUpsdate[leadId]) {
      alert("Please select a follow-up date before saving.");
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
        alert("Follow-up date updated ✅");

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
        alert(res.data.message || "Failed to update follow-up date");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while saving follow-up date");
    } finally {
      setSaving((prev) => ({ ...prev, [leadId]: false }));
    }
  };

  const deleteLead = async (leadId) => {
    if (!permissions.canDelete && !permissions.canAll) {
      alert("You do not have permission to delete leads");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    
    try {
      const res = await axios.delete("/api/lead-ms/lead-delete", {
        headers: { Authorization: `Bearer ${token}` },
        data: { leadId },
      });
      
      if (res.data.success) {
        alert("Lead deleted successfully");
        setLeads((prevLeads) => prevLeads.filter((lead) => lead._id !== leadId));
        setTotalAssigned((prev) => Math.max(0, prev - 1));
      } else {
        alert(res.data.message || "Failed to delete lead");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error deleting lead");
    }
  };

  const approveLead = async (leadId) => {
    if (!permissions.canApprove && !permissions.canAll) {
      alert("You do not have permission to approve leads");
      return;
    }

    try {
      const res = await axios.put(
        "/api/lead-ms/update-lead-status",
        { leadId, status: "Approved" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        alert("Lead approved successfully");
        setLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead._id === leadId ? { ...lead, status: "Approved" } : lead
          )
        );
      } else {
        alert(res.data.message || "Failed to approve lead");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error approving lead");
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      new: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
      contacted: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
      qualified: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
      converted: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
      lost: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' }
    };
    return configs[status?.toLowerCase()] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' };
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

  const formatPhoneNumber = (phone) => {
    const trimmed = phone.replace(/\s+/g, "");
    if (trimmed.startsWith("+")) return trimmed;
    return `+91${trimmed}`;
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] py-10">
      <div className="mx-auto max-w-6xl px-4 lg:px-6 space-y-6">
        <section className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-600 via-cyan-500 to-blue-600 text-white shadow-[0_24px_45px_rgba(14,165,233,0.25)]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay" />
          <div className="relative px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Active pipeline overview
                </div>
                <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
                  Assigned Leads
                </h1>
                <p className="mt-3 text-sm text-white/80 sm:text-base">
                  A focused workspace that brings every assignment, follow-up and conversation into one elegant timeline—stay ahead with clarity and confidence.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-xs sm:text-sm">
                  <span className="rounded-full bg-white/20 px-4 py-1.5 backdrop-blur">
                    Real-time sync
                  </span>
                  <span className="rounded-full bg-white/20 px-4 py-1.5 backdrop-blur">
                    Smart follow-ups
                  </span>
                  <span className="rounded-full bg-white/20 px-4 py-1.5 backdrop-blur">
                    Effortless collaboration
                  </span>
                </div>
              </div>

              <div className="grid w-full max-w-sm grid-cols-2 gap-4 text-sm sm:text-base">
                <div className="rounded-xl bg-white/15 p-5 shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/70">
                    Total assigned
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    {totalAssigned}
                  </p>
                  <p className="mt-2 text-xs text-white/70">
                    Updated just now
                  </p>
                </div>
                <div className="rounded-xl bg-white/15 p-5 shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/70">
                    Filter mode
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    {filterOpen ? "Custom" : "Default"}
                  </p>
                  <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="mt-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V21l-4-4v-3.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {filterOpen ? "Close filters" : "Open filters"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {filterOpen && (
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-[0_14px_32px_rgba(15,23,42,0.05)] backdrop-blur">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
                  Refine your list
                </h2>
                <p className="text-xs text-slate-500 sm:text-sm">
                  Combine filters to surface the leads that matter right now.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                Precision mode
                <span className="inline-flex h-2 w-2 rounded-full bg-sky-500" />
              </div>
            </div>
            <FilterAssignedLead
              onResults={(filteredLeads) => {
                setLeads(filteredLeads);
                setTotalAssigned(filteredLeads.length);
              }}
            />
          </section>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[320px] bg-white border border-slate-200 rounded-xl shadow-sm mt-6">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin" />
            <p className="mt-4 text-slate-700 font-medium">Loading leads...</p>
            <p className="text-xs text-slate-500 mt-1">Please wait while we fetch your data.</p>
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
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-12 mt-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No leads assigned yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Once a lead is assigned to your clinic, it will appear in this list with its details.
            </p>
          </div>
        )}

        {/* Leads Cards */}
        {!loading && !error && leads.length > 0 && (
          <div className="mt-6 space-y-6">
            {leads.map((lead) => {
              const statusConfig = getStatusConfig(lead.status);
              const latestFollowUp =
                lead.nextFollowUps?.length > 0
                  ? new Date(lead.nextFollowUps[lead.nextFollowUps.length - 1].date).toLocaleString()
                  : "Not Set";

              const cardBorderClass =
                lead.followUpStatus === "past"
                  ? "border-l-4 border-l-red-500 shadow-red-100"
                  : lead.followUpStatus === "today"
                  ? "border-l-4 border-l-emerald-500 shadow-emerald-100"
                  : "border-l-4 border-l-slate-200";

              return (
                <div
                  key={lead._id}
                  className={`rounded-2xl border border-slate-200 bg-white/95 backdrop-blur shadow-[0_20px_48px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_24px_54px_rgba(14,165,233,0.18)] overflow-hidden ${cardBorderClass}`}
                >
                  <div className="grid grid-cols-1 gap-6 px-6 py-5 xl:grid-cols-12">
                    <div className="xl:col-span-3">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-lg font-semibold text-white shadow-lg ring-4 ring-sky-100">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="truncate text-base font-semibold text-slate-900">{lead.name}</h3>
                            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              <span className="h-2 w-2 rounded-full bg-emerald-400" />
                              Assigned
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              {lead.gender}
                            </span>
                            {lead.age && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                {lead.age} yrs
                              </span>
                            )}
                            {lead.offerTag && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-sky-600">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l6 6m0 0l8 8 4-4-8-8-3.5.5L3 7z" />
                                </svg>
                                {lead.offerTag}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 xl:col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800">{lead.phone}</p>
                          <p className="text-xs text-slate-500">
                            {lead.assignedTo?.map((a) => a.user?.name).join(", ") || "Not Assigned"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>{lead.source}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
                          {lead.status.toUpperCase()}
                        </span>
                        {getFollowUpBadge(lead.followUpStatus)}
                      </div>
                    </div>

                    <div className="space-y-3 xl:col-span-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Treatments
                      </div>
                      {lead.treatments && lead.treatments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {lead.treatments.map((t, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 shadow-inner"
                            >
                              <div className="text-sm font-semibold text-slate-800">
                                {t.treatment?.name || "Treatment"}
                              </div>
                              {t.subTreatment && (
                                <div className="text-xs text-slate-500">{t.subTreatment}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500 italic">No treatments recorded</span>
                      )}
                    </div>

                    <div className="space-y-3 xl:col-span-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Latest follow-up
                          </div>
                          <span className="text-xs text-slate-500">UTC</span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-800">{latestFollowUp}</p>
                      </div>
                      <input
                        type="datetime-local"
                        value={followUpsdate[lead._id] || ""}
                        onChange={(e) => handleFollowUpdateChange(lead._id, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                      <button
                        onClick={() => saveFollowUp(lead._id)}
                        disabled={saving[lead._id] || !followUpsdate[lead._id] || (!permissions.canUpdate && !permissions.canAll)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        title={(!permissions.canUpdate && !permissions.canAll) ? "You don't have permission to update leads" : "Schedule follow-up"}
                      >
                        {saving[lead._id] ? (
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

                    <div className="flex flex-col items-end gap-3 xl:col-span-1 min-w-0">
                      <button
                        onClick={() => {
                          setActiveLead(lead);
                          setChatOpen(true);
                        }}
                        className="group relative inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 px-3 py-2 text-[10px] font-medium text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)] backdrop-blur-sm transition-all duration-200 hover:from-emerald-600 hover:via-emerald-700 hover:to-green-700 hover:shadow-[0_4px_12px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap w-full xl:w-full max-w-full border border-emerald-400/20"
                      >
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 flex-shrink-0 relative z-10">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="whitespace-nowrap relative z-10 tracking-wide">Quick chat</span>
                      </button>
                      
                      {/* Action buttons based on permissions */}
                      <div className="flex flex-wrap gap-2 justify-end w-full">
                        {(permissions.canApprove || permissions.canAll) && (
                          <button
                            onClick={() => approveLead(lead._id)}
                            disabled={lead.status === "Approved"}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow transition ${
                              lead.status === "Approved"
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-green-500 hover:bg-green-600"
                            }`}
                            title={lead.status === "Approved" ? "Already approved" : "Approve lead"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </button>
                        )}
                        
                        {(permissions.canDelete || permissions.canAll) && (
                          <button
                            onClick={() => deleteLead(lead._id)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-red-600"
                            title="Delete lead"
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
                </div>
              );
            })}
          </div>
        )}

        {/* WhatsApp Chat Modal */}
        {chatOpen && activeLead && (
          <WhatsAppChat
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            leadName={activeLead.name}
            phoneNumber={formatPhoneNumber(activeLead.phone)}
          />
        )}
      </div>
    </div>
  );
};

AssignedLeadsPage.getLayout = function PageLayout(page) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedAssignedLeadsPage = withDoctorAuth(AssignedLeadsPage);
ProtectedAssignedLeadsPage.getLayout = AssignedLeadsPage.getLayout;

export default ProtectedAssignedLeadsPage;

