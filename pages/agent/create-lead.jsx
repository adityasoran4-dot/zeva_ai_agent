import { useState, useEffect, useRef } from "react";
import axios from "axios";
import AgentLayout from "../../components/AgentLayout";
import withAgentAuth from "../../components/withAgentAuth";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";

function LeadForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "Male",
    age: "",
    treatments: [],
    source: "Instagram",
    offerTag: "",
    status: "New",
    notes: [],
    customSource: "",
    customStatus: "",
    followUps: [],
    assignedTo: [],
  });

  const [treatments, setTreatments] = useState([]);
  const [customTreatment, setCustomTreatment] = useState("");
  const [file, setFile] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noteType, setNoteType] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("agentToken") || localStorage.getItem("clinicToken")
      : null;

  // Fetch permissions for "Create Lead" submodule
  const { permissions, loading: permissionsLoading } = useAgentPermissions("lead", "Create Lead");

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && event.target instanceof Node && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch treatments
  useEffect(() => {
    async function fetchTreatments() {
      try {
        const res = await axios.get("/api/doctor/getTreatment");
        setTreatments(res.data.treatments || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchTreatments();
  }, []);

  // Fetch agents
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await axios.get("/api/lead-ms/assign-lead", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAgents(res.data.users || []);
      } catch (err) {
        console.error(err);
      }
    }
    if (token) {
      fetchAgents();
    }
  }, [token]);

  const handleChange = (e) => {
    if (e.target.name === 'phone') {
      // Only allow digits and limit to 10 digits
      const value = e.target.value.replace(/\D/g, '');
      if (value.length <= 10) {
        setFormData({ ...formData, phone: value });
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleTreatmentChange = (e) => {
    const value = e.target.value;
    if (value.includes("-")) {
      const [mainId, subIdx] = value.split("-");
      const mainDoc = treatments.find((t) => t._id === mainId);
      const subName = mainDoc?.subcategories?.[Number(subIdx)]?.name || null;
      setFormData((prev) => {
        const exists = prev.treatments.some(
          (t) => t.treatment === mainId && t.subTreatment === subName
        );
        return {
          ...prev,
          treatments: exists
            ? prev.treatments.filter((t) => !(t.treatment === mainId && t.subTreatment === subName))
            : [...prev.treatments, { treatment: mainId, subTreatment: subName }],
        };
      });
      return;
    }

    setFormData((prev) => {
      const exists = prev.treatments.some((t) => t.treatment === value && !t.subTreatment);
      return {
        ...prev,
        treatments: exists
          ? prev.treatments.filter((t) => !(t.treatment === value && !t.subTreatment))
          : [...prev.treatments, { treatment: value, subTreatment: null }],
      };
    });
  };

  const handleAddCustomTreatment = async () => {
    if (!customTreatment.trim()) return alert("Enter a treatment name");
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/doctor/add-custom-treatment",
        { mainTreatment: customTreatment, subTreatments: [] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTreatments((prev) => [...prev, res.data.treatment]);
      setFormData((prev) => ({
        ...prev,
        treatments: [...prev.treatments, { treatment: res.data.treatment._id, subTreatment: null }],
      }));
      setCustomTreatment("");
      alert("Custom treatment added!");
    } catch (err) {
      console.error(err);
      alert("Failed to add treatment");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check permission before submitting
    if (!permissions.canCreate && !permissions.canAll) {
      alert("You do not have permission to create leads");
      return;
    }

    // Validate phone number
    if (!formData.phone || formData.phone.length !== 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }
    
    setLoading(true);
    try {
      const selectedNote = noteType === "Custom" ? customNote.trim() : noteType;
      const notesToSend = selectedNote ? [{ text: selectedNote }] : [];
      const followUpsToSend = followUpDate
        ? [...formData.followUps, { date: followUpDate, addedBy: null }]
        : formData.followUps;

      await axios.post(
        "/api/lead-ms/create-lead",
        { ...formData, notes: notesToSend, followUps: followUpsToSend, mode: "manual" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Lead added successfully!");
      setFormData({
        name: "",
        phone: "",
        gender: "Male",
        age: "",
        treatments: [],
        source: "Instagram",
        offerTag: "",
        status: "New",
        notes: [],
        customSource: "",
        customStatus: "",
        followUps: [],
        assignedTo: [],
      });
      setNoteType("");
      setCustomNote("");
      setFollowUpDate("");
    } catch (err) {
      console.error(err);
      alert("Error adding lead");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Select a CSV or Excel file");
    
    // Check permission before uploading
    if (!permissions.canCreate && !permissions.canAll) {
      alert("You do not have permission to create leads");
      return;
    }
    
    setLoading(true);
    const formDataObj = new FormData();
    formDataObj.append("file", file);
    formDataObj.append("mode", "bulk");
    try {
      const res = await axios.post("/api/lead-ms/create-lead", formDataObj, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      alert(`Uploaded ${res.data.count} leads successfully!`);
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Failed to upload leads");
    } finally {
      setLoading(false);
    }
  };

  const toggleAgentSelection = (agentId) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(agentId) 
        ? prev.assignedTo.filter(id => id !== agentId) 
        : [...prev.assignedTo, agentId],
    }));
    // Auto-close dropdown after selection
    setOpen(false);
  };

  // Show permission denied message if no create permission
  if (!permissionsLoading && !permissions.canCreate && !permissions.canAll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600">You do not have permission to create leads. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h1 className="text-3xl font-bold text-slate-900">Lead Management</h1>
          <p className="text-slate-600 mt-1">Add and manage your leads efficiently</p>
          {permissionsLoading && (
            <p className="text-xs text-slate-500 mt-2">Loading permissions...</p>
          )}
        </div>

        {/* Manual Lead Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Add New Lead</h2>
              <p className="text-sm text-slate-500">Fill in the lead information below</p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                <input 
                  name="name" 
                  placeholder="Enter full name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                <input 
                  type="tel"
                  name="phone" 
                  placeholder="Enter 10-digit phone number" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  maxLength={10}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                {formData.phone.length > 0 && formData.phone.length !== 10 && (
                  <p className="text-xs text-red-500 mt-1">Phone number must be exactly 10 digits</p>
                )}
                {formData.phone.length === 10 && (
                  <p className="text-xs text-green-600 mt-1">Valid phone number</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                <input 
                  name="age" 
                  type="number" 
                  placeholder="Enter age" 
                  value={formData.age} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Treatments */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Treatments</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
              {treatments.length === 0 && (
                <p className="text-sm text-slate-500 italic">No treatments available</p>
              )}
              {treatments.map((t) => (
                <div key={t._id} className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      value={t._id} 
                      checked={formData.treatments.some((tr) => tr.treatment === t._id && !tr.subTreatment)} 
                      onChange={handleTreatmentChange}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="font-medium text-slate-900">{t.name}</span>
                  </div>
                  {t.subcategories?.length > 0 && (
                    <div className="ml-7 space-y-2">
                      {t.subcategories.map((sub, idx) => {
                        const subId = `${t._id}-${idx}`;
                        return (
                          <div key={subId} className="flex items-center space-x-3">
                            <input 
                              type="checkbox" 
                              value={subId} 
                              checked={formData.treatments.some(tr => tr.treatment === t._id && tr.subTreatment === sub.name)} 
                              onChange={handleTreatmentChange}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">{sub.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="flex items-center space-x-3 pt-2 border-t border-slate-300">
                <input 
                  type="checkbox" 
                  checked={!!customTreatment} 
                  onChange={() => setCustomTreatment(customTreatment ? "" : " ")}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="font-medium text-slate-900">Add Custom Treatment</span>
              </div>
              
              {customTreatment && (
                <div className="flex gap-2 mt-2">
                  <input 
                    type="text" 
                    placeholder="Enter treatment name" 
                    value={customTreatment} 
                    onChange={(e) => setCustomTreatment(e.target.value)} 
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddCustomTreatment} 
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? "Adding..." : "Add"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Source and Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Source & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lead Source</label>
                <select 
                  name="source" 
                  value={formData.source} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Google">Google</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Other">Other</option>
                </select>
                {formData.source === "Other" && (
                  <input 
                    name="customSource" 
                    placeholder="Specify source" 
                    value={formData.customSource} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mt-2"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lead Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Booked">Booked</option>
                  <option value="Visited">Visited</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Other">Other</option>
                </select>
                {formData.status === "Other" && (
                  <input 
                    name="customStatus" 
                    placeholder="Specify status" 
                    value={formData.customStatus} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mt-2"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Additional Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Offer Tag</label>
              <input 
                name="offerTag" 
                placeholder="e.g., Summer Sale 2025" 
                value={formData.offerTag} 
                onChange={handleChange} 
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Note Type</label>
              <select 
                value={noteType} 
                onChange={(e) => setNoteType(e.target.value)} 
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="">Select note type</option>
                <option value="Interested">Interested</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Custom">Custom Note</option>
              </select>
              {noteType === "Custom" && (
                <input 
                  type="text" 
                  placeholder="Enter custom note" 
                  value={customNote} 
                  onChange={(e) => setCustomNote(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mt-2"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Follow-up Date & Time</label>
              <input 
                type="datetime-local" 
                value={followUpDate} 
                onChange={(e) => setFollowUpDate(e.target.value)} 
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Improved Agent Selection with Auto-Close */}
            <div ref={dropdownRef}>
              <label className="block text-sm font-medium text-slate-700 mb-2">Assign To</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpen(!open)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-left flex items-center justify-between"
                >
                  <span className="text-slate-900">
                    {formData.assignedTo.length > 0
                      ? `${formData.assignedTo.length} agent${formData.assignedTo.length > 1 ? 's' : ''} selected`
                      : "Select agents"}
                  </span>
                  <svg 
                    className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {open && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {agents.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-sm">No agents available</div>
                    ) : (
                      <ul className="py-1">
                        {agents.map(agent => (
                          <li 
                            key={agent._id}
                            onClick={() => toggleAgentSelection(agent._id)}
                            className={`px-4 py-2.5 cursor-pointer transition-colors flex items-center justify-between hover:bg-blue-50 ${
                              formData.assignedTo.includes(agent._id) ? "bg-blue-50" : ""
                            }`}
                          >
                            <span className="text-slate-900">{agent.name}</span>
                            {formData.assignedTo.includes(agent._id) && (
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              
              {formData.assignedTo.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {agents.filter(a => formData.assignedTo.includes(a._id)).map(agent => (
                    <span 
                      key={agent._id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {agent.name}
                      <button
                        type="button"
                        onClick={() => toggleAgentSelection(agent._id)}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-sm"
          >
            {loading ? "Saving..." : "Add Lead"}
          </button>
        </form>

        {/* CSV Upload Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Bulk Upload</h2>
              <p className="text-sm text-slate-500">Import leads from CSV or Excel file</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
              <input 
                type="file" 
                id="file-upload"
                accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-slate-600 font-medium">Click to upload</span>
                <p className="text-sm text-slate-500 mt-1">CSV or Excel files only</p>
              </label>
            </div>

            {file && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}

            <button 
              onClick={handleUpload} 
              disabled={loading || !file}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              {loading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap page in AgentLayout
LeadForm.getLayout = (page) => <AgentLayout>{page}</AgentLayout>;

// Protect page
const ProtectedLeadForm = withAgentAuth(LeadForm);
ProtectedLeadForm.getLayout = LeadForm.getLayout;

export default ProtectedLeadForm;