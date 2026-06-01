import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  X,
  Calendar,
  Save,
  Loader2,
  User,
  Stethoscope,
  Clock,
  ChevronDown,
  Search,
  CheckCircle2,
  Building2,
} from "lucide-react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { clsx, type ClassValue } from "clsx";
import VariableMappingSelect from "./VariableMappingSelect";
import useAgents from "@/hooks/useAgents";
import useRooms from "@/hooks/useRooms";
import { WorkflowEntity } from "@/types/workflows";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface BookAppointmentActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: string | null;
  onUpdate: (updatedAction: any) => void;
  entity?: WorkflowEntity;
}

const BookAppointmentActionModal: React.FC<BookAppointmentActionModalProps> = ({
  isOpen,
  onClose,
  actionId,
  onUpdate,
  entity = "Lead",
}) => {
  const { agents: doctors } = useAgents({ role: "doctorStaff" })?.state || {
    agents: [],
  };
  const { rooms } = useRooms();
  const [treatments, setTreatments] = useState<any[]>([]);

  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedMainTreatment, setSelectedMainTreatment] = useState("");
  const [selectedSubTreatment, setSelectedSubTreatment] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [followType, setFollowType] = useState("first time");
  const [status, setStatus] = useState("booked");
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState("");
  const [roomSearchTerm, setRoomSearchTerm] = useState("");
  const doctorDropdownRef = useRef<HTMLDivElement>(null);
  const roomDropdownRef = useRef<HTMLDivElement>(null);

  const fetchTreatments = useCallback(async () => {
    try {
      const token = getTokenByPath();
      const { data } = await axios.get("/api/clinic/treatments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setTreatments(data.clinic?.treatments || []);
      }
    } catch (err) {
      console.error("Error fetching treatments:", err);
    }
  }, []);

  const fetchAction = useCallback(async () => {
    if (!actionId) return;
    setIsLoading(true);
    try {
      const token = getTokenByPath();
      const { data } = await axios.get(
        `/api/workflows/actions/update/${actionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data.success) {
        const params = data.data.parameters?.appointment || {};
        setSelectedDoctorId(params.doctorId || "");
        setSelectedRoomId(params.roomId || "");
        setSelectedMainTreatment(params.mainTreatment || "");
        setSelectedSubTreatment(params.subTreatment || "");
        setAppointmentDate(params.appointmentDate || "");
        setAppointmentTime(params.appointmentTime || "");
        setFollowType(params.followType || "first time");
        setStatus(params.status || "booked");
        setNotes(params.notes || "");
      }
    } catch (err) {
      console.error("Error fetching action:", err);
      setError("Failed to load action settings.");
    } finally {
      setIsLoading(false);
    }
  }, [actionId]);

  useEffect(() => {
    if (isOpen) {
      fetchTreatments();
      if (actionId) fetchAction();
    }
  }, [isOpen, actionId, fetchTreatments, fetchAction]);

  const handleSave = async () => {
    if (!actionId) return;
    setIsSaving(true);
    setError(null);
    try {
      const token = getTokenByPath();
      const { data } = await axios.put(
        `/api/workflows/actions/update/${actionId}`,
        {
          parameters: {
            appointment: {
              doctorId: selectedDoctorId,
              roomId: selectedRoomId,
              mainTreatment: selectedMainTreatment,
              subTreatment: selectedSubTreatment,
              appointmentDate,
              appointmentTime,
              followType,
              status,
              notes,
            },
          },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        onUpdate(data.data);
        onClose();
      }
    } catch (err) {
      console.error("Error saving action:", err);
      setError("Failed to save configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        doctorDropdownRef.current &&
        !doctorDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDoctorDropdownOpen(false);
      }
      if (
        roomDropdownRef.current &&
        !roomDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRoomDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const filteredDoctors = doctors.filter((d) =>
    d.name?.toLowerCase().includes(doctorSearchTerm.toLowerCase()),
  );

  const filteredRooms = rooms.filter((r) =>
    r.name?.toLowerCase().includes(roomSearchTerm.toLowerCase()),
  );

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);
  const selectedRoom = rooms.find((r) => r._id === selectedRoomId);
  const selectedMainTreatmentData = treatments.find(
    (t) => t.mainTreatment === selectedMainTreatment,
  );

  return (
    <div className="fixed inset-0 z-[100] flex justify-end text-gray-500">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Book Appointment
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Configure automated booking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Loading settings...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Doctor Selection */}
              <div className="space-y-2 relative" ref={doctorDropdownRef}>
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" /> Select Doctor{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-all"
                >
                  <span className="truncate">
                    {selectedDoctor ? selectedDoctor.name : "Choose a doctor"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      isDoctorDropdownOpen && "rotate-180",
                    )}
                  />
                </div>

                {isDoctorDropdownOpen && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search doctors..."
                          value={doctorSearchTerm}
                          onChange={(e) => setDoctorSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {filteredDoctors.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm italic">
                          No doctors found
                        </div>
                      ) : (
                        <ul className="py-2">
                          {filteredDoctors.map((doc) => (
                            <li
                              key={doc._id}
                              className={cn(
                                "px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors group",
                                selectedDoctorId === doc._id && "bg-indigo-50",
                              )}
                              onClick={() => {
                                setSelectedDoctorId(doc._id);
                                setIsDoctorDropdownOpen(false);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600">
                                  {doc.name}
                                </span>
                                {selectedDoctorId === doc._id && (
                                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Room Selection */}
              <div className="space-y-2 relative" ref={roomDropdownRef}>
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" /> Select Room
                  <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setIsRoomDropdownOpen(!isRoomDropdownOpen)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-all"
                >
                  <span className="truncate">
                    {selectedRoom ? selectedRoom.name : "Choose a room"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      isRoomDropdownOpen && "rotate-180",
                    )}
                  />
                </div>

                {isRoomDropdownOpen && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search rooms..."
                          value={roomSearchTerm}
                          onChange={(e) => setRoomSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {filteredRooms.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm italic">
                          No rooms found
                        </div>
                      ) : (
                        <ul className="py-2">
                          {filteredRooms.map((room) => (
                            <li
                              key={room._id}
                              className={cn(
                                "px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors group",
                                selectedRoomId === room._id && "bg-indigo-50",
                              )}
                              onClick={() => {
                                setSelectedRoomId(room._id);
                                setIsRoomDropdownOpen(false);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600">
                                  {room.name}
                                </span>
                                {selectedRoomId === room._id && (
                                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status and Follow-up Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="booked">Booked</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="arrived">Arrived</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Follow-up Type
                  </label>
                  <select
                    value={followType}
                    onChange={(e) => setFollowType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="first time">First Time</option>
                    <option value="follow up">Follow Up</option>
                  </select>
                </div>
              </div>

              {/* Treatment Selection */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-gray-400" /> Main
                    Treatment <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedMainTreatment}
                    onChange={(e) => {
                      setSelectedMainTreatment(e.target.value);
                      setSelectedSubTreatment("");
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="">Select main treatment</option>
                    {treatments.map((t) => (
                      <option key={t.mainTreatmentSlug} value={t.mainTreatment}>
                        {t.mainTreatment}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedMainTreatment && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-gray-400" /> Sub
                      Treatment <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedSubTreatment}
                      onChange={(e) => setSelectedSubTreatment(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="">Select sub treatment</option>
                      {selectedMainTreatmentData?.subTreatments.map(
                        (sub: any) => (
                          <option key={sub.slug} value={sub.name}>
                            {sub.name}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* Date & Time Mapping */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" /> Appointment
                    Date <span className="text-red-500">*</span>
                  </label>
                  <VariableMappingSelect
                    value={appointmentDate}
                    onChange={setAppointmentDate}
                    placeholder="Map to date variable..."
                    entity={entity}
                    nodeId=""
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" /> Appointment Time{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <VariableMappingSelect
                    value={appointmentTime}
                    onChange={setAppointmentTime}
                    placeholder="Map to time variable..."
                    entity={entity}
                    nodeId=""
                  />
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter any additional notes..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[80px] resize-none"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                isSaving ||
                isLoading ||
                !selectedDoctorId ||
                !selectedSubTreatment ||
                !appointmentDate ||
                !appointmentTime
              }
              className="flex-1 px-4 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentActionModal;
