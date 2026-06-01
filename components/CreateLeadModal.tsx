import { useState, useEffect } from "react";
import axios from "axios";
import CustomAsyncSelect, { OptionType } from "./shared/CustomAsyncSelect";
import { loadSegmentOptions } from "@/lib/helper";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  token: string;
  canCreate?: boolean;
}

export default function CreateLeadModal({
  isOpen,
  onClose,
  onCreated,
  token,
  canCreate: propCanCreate,
}: Props) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "Male",
    age: "",
    treatments: [] as Array<{ treatment: string; subTreatment: string | null }>,
    source: "Instagram",
    offerTag: "",
    status: "New",
    notes: [] as Array<{ text: string }>,
    customSource: "",
    customStatus: "",
    followUps: [] as Array<{ date: Date }>,
    assignedTo: [] as string[],
  });

  const [treatments, setTreatments] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [activeOffers, setActiveOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteType, setNoteType] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [internalCanCreate, setInternalCanCreate] = useState(false);
  const canCreate = propCanCreate !== undefined ? propCanCreate : internalCanCreate;
  const [selectedSegment, setSelectedSegment] = useState<OptionType | null>(
    null
  );

  useEffect(() => {
    if (!isOpen) return;

    // Helper function to check if a permission value is true (handles boolean and string)
    const isTrue = (value: any) => {
      if (value === true) return true;
      if (value === "true") return true;
      if (String(value).toLowerCase() === "true") return true;
      return false;
    };

    const fetchData = async () => {
      try {
        // Fetch permissions, treatments, agents, and offers in parallel
        const [permissionsRes, treatmentsRes, agentsRes, offersRes] =
          await Promise.all([
            axios.get("/api/clinic/permissions", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get("/api/lead-ms/get-clinic-treatment", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get("/api/lead-ms/assign-lead", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get("/api/lead-ms/get-create-offer", {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        // Process permissions
        const permissionsData = permissionsRes.data;
        if (permissionsData.success && permissionsData.data) {
          const modulePermission = permissionsData.data.permissions?.find(
            (p: any) => {
              if (!p?.module) return false;
              // Check for clinic_lead or clinic_create_lead module
              const moduleKey = p.module || "";
              const normalizedModule = moduleKey.replace(
                /^(admin|clinic|doctor|agent)_/,
                ""
              );
              return (
                normalizedModule === "lead" ||
                normalizedModule === "create_lead" ||
                moduleKey === "clinic_lead" ||
                moduleKey === "clinic_create_lead" ||
                moduleKey === "create_lead" ||
                moduleKey === "lead"
              );
            }
          );
          if (modulePermission) {
            const actions = modulePermission.actions || {};
            // Check for "Create Lead" submodule
            const createLeadSubModule = modulePermission.subModules?.find(
              (sm: any) =>
                sm.name === "Create Lead" ||
                sm.name?.toLowerCase() === "create lead"
            );

            // Module-level "all" grants all permissions including submodules
            const moduleAll = isTrue(actions.all);
            const moduleCreate = isTrue(actions.create);
            const createLeadAll = isTrue(createLeadSubModule?.actions?.all);
            const createLeadCreate = isTrue(
              createLeadSubModule?.actions?.create
            );

            setInternalCanCreate(
              moduleAll || moduleCreate || createLeadAll || createLeadCreate
            );
          } else {
            setInternalCanCreate(false);
          }
        } else {
          setInternalCanCreate(false);
        }

        setTreatments(
          Array.isArray(treatmentsRes.data?.treatments)
            ? treatmentsRes.data.treatments
            : []
        );
        setAgents(agentsRes.data?.users || []);
        const list = Array.isArray(offersRes.data?.offers)
          ? offersRes.data.offers
          : [];
        setActiveOffers(list.filter((o: any) => o.status === "active"));
      } catch (err) {
        console.error("Error fetching data:", err);
        setInternalCanCreate(false);
      }
    };

    fetchData();
  }, [isOpen, token]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        name: "",
        email: "",
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
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    if (e.target.name === "phone") {
      // Only allow digits and limit to 10 digits
      const value = e.target.value.replace(/\D/g, "");
      if (value.length <= 10) {
        setFormData({ ...formData, phone: value });
      }
    } else if (e.target.name === "email") {
      // Keep email as typed; validation will run on submit and inline
      setFormData({ ...formData, email: e.target.value });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const isValidEmail = (email: string) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleTreatmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes("::")) {
      const [mainName, subName] = value.split("::");
      setFormData((prev) => {
        const exists = prev.treatments.some(
          (t) => t.treatment === mainName && t.subTreatment === subName
        );
        return {
          ...prev,
          treatments: exists
            ? prev.treatments.filter(
                (t) => !(t.treatment === mainName && t.subTreatment === subName)
              )
            : [
                ...prev.treatments,
                { treatment: mainName, subTreatment: subName },
              ],
        };
      });
      return;
    }
    const mainName = value;
    setFormData((prev) => {
      const exists = prev.treatments.some(
        (t) => t.treatment === mainName && !t.subTreatment
      );
      return {
        ...prev,
        treatments: exists
          ? prev.treatments.filter(
              (t) => !(t.treatment === mainName && !t.subTreatment)
            )
          : [...prev.treatments, { treatment: mainName, subTreatment: null }],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check permission before submitting
    if (!canCreate) {
      alert("You do not have permission to create leads");
      return;
    }

    // Validate phone number
    if (!formData.phone || formData.phone.length !== 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    // Validate email if provided
    if (formData.email && !isValidEmail(formData.email.trim())) {
      alert("Please enter a valid email address");
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
        {
          ...formData,
          notes: notesToSend,
          followUps: followUpsToSend,
          mode: "manual",
          segmentId: selectedSegment?.value,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Lead added successfully!");
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      const errorMessage =
        (err as any)?.response?.data?.message || "Error adding lead";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Compact Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Create New Lead
            </h2>
            <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
              Fill in the details to create a new lead
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Compact Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 space-y-4">
            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-1.5">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={10}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                    placeholder="Enter 10-digit phone number"
                    required
                  />
                  {formData.phone.length > 0 &&
                    formData.phone.length !== 10 && (
                      <p className="text-[10px] text-red-500 mt-1">
                        Phone number must be exactly 10 digits
                      </p>
                    )}
                  {formData.phone.length === 10 && (
                    <p className="text-[10px] text-green-600 mt-1">
                      Valid phone number
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                    placeholder="Enter email address"
                  />
                  {formData.email.length > 0 &&
                    !isValidEmail(formData.email) && (
                      <p className="text-[10px] text-red-500 mt-1">
                        Invalid email format
                      </p>
                    )}
                  {formData.email.length > 0 &&
                    isValidEmail(formData.email) && (
                      <p className="text-[10px] text-green-600 mt-1">
                        Valid email
                      </p>
                    )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                    placeholder="e.g. 32"
                  />
                </div>
              </div>
            </div>

            {/* Compact Treatments */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-1.5">
                Treatments
              </h3>
              <div className="border border-gray-200 rounded-lg p-2.5 bg-gray-50 max-h-56 overflow-y-auto">
                {treatments.length === 0 ? (
                  <p className="text-gray-500 text-center py-2 text-xs sm:text-sm">
                    No treatments available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {treatments.map((t: any, i: number) => (
                      <div
                        key={i}
                        className="bg-white rounded-lg p-2.5 shadow-sm"
                      >
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            value={t.mainTreatment}
                            checked={formData.treatments.some(
                              (tr) =>
                                tr.treatment === t.mainTreatment &&
                                !tr.subTreatment
                            )}
                            onChange={handleTreatmentChange}
                            className="w-3.5 h-3.5 text-gray-800 rounded focus:ring-gray-800"
                          />
                          <span className="font-medium text-gray-900 text-xs sm:text-sm">
                            {t.mainTreatment}
                          </span>
                        </label>
                        {t.subTreatments?.length > 0 && (
                          <div className="ml-5 mt-1.5 space-y-1">
                            {t.subTreatments.map((sub: any, j: number) => {
                              const val = `${t.mainTreatment}::${sub.name}`;
                              return (
                                <label
                                  key={j}
                                  className="flex items-center space-x-2 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    value={val}
                                    checked={formData.treatments.some(
                                      (tr) =>
                                        tr.treatment === t.mainTreatment &&
                                        tr.subTreatment === sub.name
                                    )}
                                    onChange={handleTreatmentChange}
                                    className="w-3 h-3 text-gray-800 rounded focus:ring-gray-800"
                                  />
                                  <span className="text-[10px] sm:text-xs text-gray-600">
                                    {sub.name}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Compact Source and Status */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-1.5">
                Lead Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Google">Google</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {formData.source === "Other" && (
                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                      Custom Source
                    </label>
                    <input
                      type="text"
                      name="customSource"
                      value={formData.customSource}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                      placeholder="Enter source"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Booked">Booked</option>
                    <option value="Visited">Visited</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {formData.status === "Other" && (
                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                      Custom Status
                    </label>
                    <input
                      type="text"
                      name="customStatus"
                      value={formData.customStatus}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                      placeholder="Enter status"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                  Offer Tag
                </label>
                <select
                  name="offerTag"
                  value={formData.offerTag}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                >
                  <option value="">No offer</option>
                  {activeOffers.map((o) => (
                    <option key={o._id} value={o.title}>
                      {o.title} —{" "}
                      {o.type === "percentage" ? `${o.value}%` : `₹${o.value}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compact Notes and Follow-up */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-1.5">
                Additional Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                  >
                    <option value="">Select Note</option>
                    <option value="Interested">Interested</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                {noteType === "Custom" && (
                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                      Custom Note
                    </label>
                    <input
                      type="text"
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                      placeholder="Type a note"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                  Follow-up Date
                </label>
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <select
                  value={formData.assignedTo[0] || ""}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      assignedTo: selectedId ? [selectedId] : [],
                    }));
                  }}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                >
                  <option value="">Select agent</option>
                  {agents.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              <CustomAsyncSelect
                label="Segment"
                name="chooseSegment"
                loadOptions={(inputValue) =>
                  loadSegmentOptions(inputValue, token)
                }
                value={selectedSegment}
                onChange={(value) => setSelectedSegment(value as any)}
                placeholder="Select a segment..."
              />
            </div>
          </div>

          {/* Compact Footer Actions */}
          <div className="border-t bg-gray-50 px-4 py-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !canCreate}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white text-xs sm:text-sm font-medium hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
              title={
                !canCreate ? "You do not have permission to create leads" : ""
              }
            >
              {loading ? "Saving..." : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
