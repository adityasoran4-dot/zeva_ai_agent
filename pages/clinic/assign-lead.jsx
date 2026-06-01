import { useEffect, useState } from "react";
import axios from "axios";
import DoctorLayout from "../../components/DoctorLayout";
import withDoctorAuth from "../../components/withDoctorAuth";
import LeadViewModal from "../../components/LeadViewModal";

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [filters, setFilters] = useState({
    treatment: "", offer: "", source: "", status: "", name: "", startDate: "", endDate: ""
  });
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [followUpDate, setFollowUpDate] = useState("");
  const [viewLead, setViewLead] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const leadsPerPage = 20;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null;

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/lead-ms/leadFilter", {
        params: filters,
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeads(res.data.leads || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await axios.get("/api/lead-ms/getA", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAgents(res.data.agents || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchAgents();
  }, []);

  const assignLead = async () => {
    if (!selectedLead || selectedAgents.length === 0) return;
    try {
      await axios.post("/api/lead-ms/reassign-lead", {
        leadId: selectedLead,
        agentIds: selectedAgents,
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedLead(null);
      setSelectedAgents([]);
      setFollowUpDate("");
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteLead = async (leadId) => {
    try {
      await axios.delete("/api/lead-ms/lead-delete", {
        headers: { Authorization: `Bearer ${token}` },
        data: { leadId },
      });
      setDeleteConfirm(null);
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  const clearFilters = () => {
    setFilters({ treatment: "", offer: "", source: "", status: "", name: "", startDate: "", endDate: "" });
    setTimeout(() => fetchLeads(), 0);
  };

  const hasActiveFilters = Object.values(filters).some(val => val !== "");

  const indexOfLastLead = currentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const currentLeads = leads.slice(indexOfFirstLead, indexOfLastLead);
  const totalPages = Math.ceil(leads.length / leadsPerPage);

  const inputClass = "text-gray-800 w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Leads Management</h1>
            <p className="text-xs text-gray-600 mt-0.5">Filter, review, and assign leads</p>
          </div>
          <span className="text-xs text-gray-600">{leads.length} total leads</span>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-900">Filters</h2>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                Clear Filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <input placeholder="Name" value={filters.name} onChange={e => setFilters({ ...filters, name: e.target.value })} className={inputClass} />
            <input placeholder="Offer" value={filters.offer} onChange={e => setFilters({ ...filters, offer: e.target.value })} className={inputClass} />
            <select value={filters.source} onChange={e => setFilters({ ...filters, source: e.target.value })} className={inputClass}>
              <option value="" className="text-gray-700">All Sources</option>
              <option className="text-gray-800">Instagram</option>
              <option className="text-gray-800">Facebook</option>
              <option className="text-gray-800">Google</option>
              <option className="text-gray-800">WhatsApp</option>
              <option className="text-gray-800">Walk-in</option>
              <option className="text-gray-800">Other</option>
            </select>
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className={inputClass}>
              <option value="" className="text-gray-700">All Status</option>
              <option className="text-gray-800">New</option>
              <option className="text-gray-800">Contacted</option>
              <option className="text-gray-800">Booked</option>
              <option className="text-gray-800">Visited</option>
              <option className="text-gray-800">Follow-up</option>
              <option className="text-gray-800">Not Interested</option>
              <option className="text-gray-800">Other</option>
            </select>
            <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className={inputClass} />
            <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className={inputClass} />
            <button onClick={fetchLeads} disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1.5 rounded text-xs font-medium">
              {loading ? "Loading..." : "Apply"}
            </button>
          </div>
        </div>

        {/* Results Info */}
        {leads.length > 0 && (
          <p className="text-xs text-gray-600 mb-3">
            Showing {indexOfFirstLead + 1}-{Math.min(indexOfLastLead, leads.length)} of {leads.length}
          </p>
        )}

        {/* Leads Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentLeads.length > 0 ? (
            currentLeads.map(lead => (
              <div key={lead._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{lead.name || "Unnamed"}</p>
                    <p className="text-xs text-gray-700">{lead.phone}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${lead.status === "Booked" || lead.status === "Visited" ? "bg-green-100 text-green-800" : lead.status === "Not Interested" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                    {lead.status || "—"}
                  </span>
                </div>

                <div className="text-[11px] text-gray-700 space-y-1">
                  <p className="truncate"><span className="font-medium text-gray-900">Treatment:</span> {lead.treatments?.map(t => t.subTreatment ? `${t.subTreatment} (${t.treatment?.name || "Unknown"})` : t.treatment?.name).join(", ") || "—"}</p>
                  <p><span className="font-medium text-gray-900">Source:</span> <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-800">{lead.source || "—"}</span></p>
                  <p className="truncate"><span className="font-medium text-gray-900">Offer:</span> {lead.offerTag || "—"}</p>
                  <p className="truncate"><span className="font-medium text-gray-900">Notes:</span> {lead.notes?.map(n => n.text).join(", ") || "No Notes"}</p>
                  <p className="truncate"><span className="font-medium text-gray-900">Assigned:</span> {lead.assignedTo?.map(a => a.user?.name).join(", ") || "Not Assigned"}</p>
                  <p className="truncate"><span className="font-medium text-gray-900">Follow-ups:</span> {lead.followUps?.map(f => new Date(f.date).toLocaleString()).join(", ") || "None"}</p>
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={() => setViewLead(lead)} className="inline-flex items-center justify-center bg-white border border-gray-300 text-gray-800 px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-50">
                    View
                  </button>
                  <button onClick={() => setSelectedLead(lead._id)} className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium">
                    Assign
                  </button>
                  <button onClick={() => setDeleteConfirm(lead._id)} className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-medium">
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-lg border border-gray-200 p-6 text-center">
              <p className="text-sm font-medium text-gray-700">No leads found</p>
              <p className="text-xs text-gray-600 mt-1">Adjust filters or create new leads</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1">
            <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded text-xs font-medium bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Prev
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                return (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded text-xs font-medium ${currentPage === page ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-800 hover:bg-gray-50"}`}>
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-1 text-gray-700">...</span>;
              }
              return null;
            })}
            <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded text-xs font-medium bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        )}

        {/* Assign Modal */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Reassign Lead</h2>
                <p className="text-xs text-gray-700 mt-0.5">Select agent(s) and follow-up date</p>
              </div>
              <div className="p-4">
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-900 mb-1">Select Agent(s)</label>
                  <select multiple value={selectedAgents} onChange={e => setSelectedAgents(Array.from(e.target.selectedOptions, o => o.value))} className="w-full h-32 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    {agents.map(a => (
                      <option key={a._id} value={a._id} className="text-gray-800 py-0.5">{a.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] text-gray-600">Hold Ctrl/Cmd for multiple</p>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-900 mb-1">Follow-up Date</label>
                  <input type="datetime-local" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setSelectedLead(null); setSelectedAgents([]); setFollowUpDate(""); }} className="px-3 py-1.5 rounded text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200">
                    Cancel
                  </button>
                  <button onClick={assignLead} className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700">
                    Reassign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Delete Lead</h2>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-700 mb-4">Are you sure? This action cannot be undone.</p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200">
                    Cancel
                  </button>
                  <button onClick={() => deleteLead(deleteConfirm)} className="px-3 py-1.5 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewLead && <LeadViewModal lead={viewLead} onClose={() => setViewLead(null)} />}
      </div>
    </div>
  );
};

LeadsPage.getLayout = (page) => <DoctorLayout>{page}</DoctorLayout>;

// Wrap with withDoctorAuth and preserve layout
const ProtectedLeadsPage = withDoctorAuth(LeadsPage);
ProtectedLeadsPage.getLayout = LeadsPage.getLayout;

export default ProtectedLeadsPage;