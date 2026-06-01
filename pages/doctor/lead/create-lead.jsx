import { useState, useEffect } from "react";
import axios from "axios";
import DoctorLayout from '../../../components/DoctorLayout';
import withDoctorAuth from '../../../components/withDoctorAuth';
import CreateLeadModal from '../../../components/CreateLeadModal';
import LeadViewModal from '../../../components/LeadViewModal';
import { PlusCircle } from "lucide-react";

function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
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
  const [permissions, setPermissions] = useState({
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canRead: false,
    canAssign: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null;

  // Fetch permissions
  const fetchPermissions = async () => {
    if (!token) return;
    try {
      const res = await axios.get("/api/doctor/permissions", {
          headers: { Authorization: `Bearer ${token}` },
        });
      const data = res.data;
      if (data.success && data.data) {
        // Find module permission - try multiple variations of module key
        const modulePermission = data.data.permissions?.find(
          (p) => {
            const moduleKey = p.module || "";
            return moduleKey === "lead" || 
                   moduleKey === "clinic_lead" || 
                   moduleKey === "doctor_lead" ||
                   moduleKey.replace(/^(admin|clinic|doctor)_/, "") === "lead";
          }
        );
        if (modulePermission) {
          const actions = modulePermission.actions || {};
          console.log('[doctor-create-lead] Module permission found:', {
            module: modulePermission.module,
            actions: actions,
            subModules: modulePermission.subModules?.map(sm => sm.name)
          });
          
          // Check for "Create Lead" submodule
          const createLeadSubModule = modulePermission.subModules?.find(
            (sm) => sm.name === "Create Lead"
          );
          // Check for "Assign Lead" submodule
          const assignLeadSubModule = modulePermission.subModules?.find(
            (sm) => sm.name === "Assign Lead"
          );

          // Helper function to check if a permission value is true (handles boolean and string)
          const isTrue = (value) => {
            if (value === true) return true;
            if (value === "true") return true;
            if (String(value).toLowerCase() === "true") return true;
            return false;
          };

          // Module-level "all" grants all permissions including submodules
          const moduleAll = isTrue(actions.all);
          const moduleCreate = isTrue(actions.create);
          const moduleUpdate = isTrue(actions.update);
          const moduleDelete = isTrue(actions.delete);
          const moduleRead = isTrue(actions.read);
          
          console.log('[doctor-create-lead] Permission checks:', {
            moduleAll,
            moduleRead,
            moduleCreate,
            moduleUpdate,
            moduleDelete
          });

          // Submodule permissions (only checked if module-level doesn't grant)
          const createLeadAll = isTrue(createLeadSubModule?.actions?.all);
          const createLeadCreate = isTrue(createLeadSubModule?.actions?.create);
          const assignLeadAll = isTrue(assignLeadSubModule?.actions?.all);
          const assignLeadUpdate = isTrue(assignLeadSubModule?.actions?.update);
          const assignLeadCreate = isTrue(assignLeadSubModule?.actions?.create);

          setPermissions({
            // Create: Module "all" OR module "create" OR submodule "all" OR submodule "create"
            canCreate: moduleAll || moduleCreate || createLeadAll || createLeadCreate,
            // Update: Module "all" OR module "update" OR submodule "all" OR submodule "update"
            canUpdate: moduleAll || moduleUpdate || assignLeadAll || assignLeadUpdate,
            // Delete: Module "all" OR module "delete"
            canDelete: moduleAll || moduleDelete,
            // Read: Module "all" OR module "read"
            canRead: moduleAll || moduleRead,
            // Assign: Module "all" OR module "update" OR submodule "all" OR submodule "update" OR submodule "create"
            // When module-level "all" is true, it should grant assign permission
            canAssign: moduleAll || moduleUpdate || assignLeadAll || assignLeadUpdate || assignLeadCreate,
          });
        } else {
          // No permissions found for lead module
          console.log('[doctor-create-lead] No lead module permission found. Available modules:', 
            data.data.permissions?.map(p => p.module) || []
          );
          // If no permissions are set up at all, allow access (backward compatibility)
          // Otherwise, deny access
          const hasAnyPermissions = data.data.permissions && data.data.permissions.length > 0;
          if (!hasAnyPermissions) {
            // No permissions set up - grant all access (backward compatibility)
            console.log('[doctor-create-lead] No permissions set up, granting all access');
            setPermissions({
              canCreate: true,
              canUpdate: true,
              canDelete: true,
              canRead: true,
              canAssign: true,
            });
          } else {
            // Permissions exist but lead module not found - deny access
            setPermissions({
              canCreate: false,
              canUpdate: false,
              canDelete: false,
              canRead: false,
              canAssign: false,
            });
          }
        }
      } else {
        // API failed, default to false
        setPermissions({
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canRead: false,
          canAssign: false,
        });
      }
      setPermissionsLoaded(true);
      } catch (err) {
      console.error("Error fetching permissions:", err);
      // On error, default to false
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
        params: filters,
          headers: { Authorization: `Bearer ${token}` },
        });
      if (res.data.success) {
        setLeads(res.data.leads || []);
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

  useEffect(() => {
    fetchPermissions();
  }, [token]);

  useEffect(() => {
    // Fetch leads and agents after permissions are loaded
    if (permissionsLoaded) {
      fetchLeads();
      fetchAgents();
    }
  }, [permissionsLoaded, permissions.canRead, filters]);

  const assignLead = async () => {
    if (!selectedLead || selectedAgents.length === 0) return;
    
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
    <div className="min-h-screen p-5 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Leads Management</h1>
              <p className="text-xs text-gray-500">Filter, review, and assign leads to your team</p>
            </div>
            {permissions.canCreate && (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-4 py-2 rounded-md shadow hover:shadow-md transition-all duration-200 text-xs font-medium"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Create New Lead</span>
              </button>
            )}
            </div>
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

        {/* Leads as Cards */}
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
                  {permissions.canAssign && (
                    <button
                      onClick={() => setSelectedLead(lead._id)}
                      className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow"
                    >
                      ReAssign
                    </button>
                  )}
                  {permissions.canDelete && (
                    <button
                      onClick={() => deleteLead(lead._id)}
                      className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow"
                    >
                      Delete
                    </button>
            )}
          </div>
            </div>
            ))
          ) : (
            <div className="col-span-full bg-white/90 backdrop-blur rounded-xl border border-gray-200 p-6 text-center text-gray-500">
              {permissions.canRead === false ? "You do not have permission to view leads" : "No leads found"}
              </div>
            )}
          </div>

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
}

// Wrap page in DoctorLayout
LeadsPage.getLayout = (page) => <DoctorLayout>{page}</DoctorLayout>;

// Preserve layout on wrapped component
const ProtectedLeadsPage = withDoctorAuth(LeadsPage);
ProtectedLeadsPage.getLayout = LeadsPage.getLayout;

export default ProtectedLeadsPage;

