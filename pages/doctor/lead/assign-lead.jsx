import { useEffect, useState } from "react";
import axios from "axios";
import DoctorLayout from "../../../components/DoctorLayout";
import withDoctorAuth from "../../../components/withDoctorAuth";
import LeadViewModal from "../../../components/LeadViewModal";

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
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
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [followUpDate, setFollowUpDate] = useState("");
  const [viewLead, setViewLead] = useState(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null;

  const fetchLeads = async () => {
    try {
      const res = await axios.get("/api/lead-ms/leadFilter", {
        params: filters,
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeads(res.data.leads || []);
    } catch (err) {
      console.error(err);
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
      await axios.post(
        "/api/lead-ms/reassign-lead",
        {
          leadId: selectedLead,
          agentIds: selectedAgents,
          followUpDate: followUpDate
            ? new Date(followUpDate).toISOString()
            : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Lead assigned!");
      setSelectedLead(null);
      setSelectedAgents([]);
      setFollowUpDate("");
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteLead = async (leadId) => {
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
    <div className="min-h-screen p-5 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Leads Management</h1>
          <p className="text-xs text-gray-500">Filter, review, and assign leads to your team</p>
        </div>

      {/* Filters */}
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          placeholder="Name"
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
        <input
          placeholder="Offer Tag"
          value={filters.offer}
          onChange={(e) => setFilters({ ...filters, offer: e.target.value })}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
        <select
          value={filters.source}
          onChange={(e) => setFilters({ ...filters, source: e.target.value })}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
        <button
          onClick={fetchLeads}
          className="inline-flex items-center justify-center bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow"
        >
          Apply Filters
        </button>
      </div>

      {/* Leads as Cards (no horizontal scrolling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {leads.length > 0 ? (
          leads.map((lead) => (
            <div key={lead._id} className="bg-white/90 backdrop-blur rounded-xl shadow border border-gray-200 p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{lead.name || 'Unnamed'}</p>
                  <p className="text-xs text-gray-600">{lead.phone}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${lead.status === 'Booked' || lead.status === 'Visited' ? 'bg-green-100 text-green-700' : lead.status === 'Not Interested' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{lead.status || '—'}</span>
              </div>

              <div className="text-[11px] text-gray-700 space-y-1">
                <p className="truncate"><span className="text-gray-500">Treatment:</span> {lead.treatments?.map((t) => (t.subTreatment ? `${t.subTreatment} (${t.treatment?.name || 'Unknown'})` : t.treatment?.name)).join(', ') || '—'}</p>
                <p><span className="text-gray-500">Source:</span> <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700">{lead.source || '—'}</span></p>
                <p className="truncate"><span className="text-gray-500">Offer:</span> {lead.offerTag || '—'}</p>
                <p className="truncate"><span className="text-gray-500">Notes:</span> {lead.notes?.map((n) => n.text).join(', ') || 'No Notes'}</p>
                <p className="truncate"><span className="text-gray-500">Assigned:</span> {lead.assignedTo?.map((a) => a.user?.name).join(', ') || 'Not Assigned'}</p>
                <p className="truncate"><span className="text-gray-500">Follow-ups:</span> {lead.followUps?.map((f) => new Date(f.date).toLocaleString()).join(', ') || 'None'}</p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setViewLead(lead)}
                  className="inline-flex items-center justify-center bg-white border border-gray-300 text-gray-800 px-3 py-1.5 rounded-md text-xs font-medium shadow-sm hover:bg-gray-50"
                >
                  View
                </button>
                <button
                  onClick={() => setSelectedLead(lead._id)}
                  className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow"
                >
                  ReAssign
                </button>
                <button
                  onClick={() => deleteLead(lead._id)}
                  className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white/90 backdrop-blur rounded-xl border border-gray-200 p-6 text-center text-gray-500">No leads found</div>
        )}
      </div>

      {/* Assign Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white/95 border border-gray-200 rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Assign Lead</h2>
              <p className="text-xs text-gray-500">Choose agent(s) and optional follow-up time</p>
            </div>
            <div className="p-5">
            <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Select Agent(s)</label>
                <select
                  multiple
                  value={selectedAgents}
                  onChange={(e) =>
                    setSelectedAgents(
                      Array.from(e.target.selectedOptions, (o) => o.value)
                    )
                  }
                  className="w-full h-36 rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
            </div>
            <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Follow-up Date & Time</label>
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
            </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setSelectedLead(null);
                    setSelectedAgents([]);
                    setFollowUpDate("");
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={assignLead}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow hover:from-teal-700 hover:to-teal-800"
                >
                  ReAssign
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
};

LeadsPage.getLayout = (page) => <DoctorLayout>{page}</DoctorLayout>;

// Wrap with withDoctorAuth and preserve layout
const ProtectedLeadsPage = withDoctorAuth(LeadsPage);
ProtectedLeadsPage.getLayout = LeadsPage.getLayout;

export default ProtectedLeadsPage;
