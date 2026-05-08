"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Loader2, Calendar, Clock, AlertCircle, ChevronDown, Check } from "lucide-react";
import { APPOINTMENT_STATUS_OPTIONS } from "../data/appointmentStatusOptions";
import { ModalPortal } from "../lib/modalPortal";

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: {
    _id: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    roomId: string;
    roomName: string;
    status: string;
    followType: string;
    startDate: string;
    fromTime: string;
    toTime: string;
    referral: string;
    emergency: string;
    notes: string;
    treatment?: string;
    serviceId?: string | { _id: string } | null;
    serviceIds?: string[];
  } | null;
  rooms: Array<{ _id: string; name: string }>;
  doctors: Array<{ _id: string; name: string }>;
  getAuthHeaders: () => Record<string, string>;
  clinicEndTime?: string; // Global clinic closing time (e.g., "23:00")
}

export default function EditAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  appointment,
  rooms,
  doctors,
  getAuthHeaders,
  clinicEndTime,
}: EditAppointmentModalProps) {
  const [roomId, setRoomId] = useState<string>("");
  const [doctorId, setDoctorId] = useState<string>("");
  const [status, setStatus] = useState<string>("booked");
  const [followType, setFollowType] = useState<string>("first time");
  const [startDate, setStartDate] = useState<string>("");
  const [fromTime, setFromTime] = useState<string>("");
  const [toTime, setToTime] = useState<string>("");
  const [referral, setReferral] = useState<string>("direct");
  const [emergency, setEmergency] = useState<string>("no");
  const [notes, setNotes] = useState<string>("");
  const [treatment, setTreatment] = useState<string>("");
  const [services, setServices] = useState<Array<{ _id: string; name: string }>>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const timeStringToMinutes = (time24: string): number => {
    if (!time24) return 0;
    const [hourStr, minuteStr] = time24.split(":");
    return parseInt(hourStr, 10) * 60 + parseInt(minuteStr, 10);
  };

  const [referrals, setReferrals] = useState<Array<{ _id: string; firstName: string; lastName: string }>>([]);

  const fetchReferrals = async () => {
    try {
      const res = await axios.get("/api/clinic/referrals", {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        setReferrals(res.data.referrals || []);
      }
    } catch (err) {
      console.error("Error fetching referrals:", err);
    }
  };

  const loadServices = async () => {
    try {
      setServicesLoading(true);
      const res = await axios.get("/api/clinic/services", {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        const list = Array.isArray(res.data.services)
          ? res.data.services
          : [];
        setServices(list.map((s: any) => ({ _id: s._id, name: s.name })));
      } else {
        setServices([]);
      }
    } catch (e) {
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReferrals();
      loadServices();
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchPatientReferral = async () => {
      if (!appointment?.patientId || !isOpen) return;
      try {
        const res = await axios.get(`/api/staff/get-patient-data/${appointment.patientId}`, {
          headers: getAuthHeaders(),
        });
        if (res.status === 200 && res.data) {
          const referredByValue = res.data.referredBy || "";
          if (referredByValue) {
            setReferral(referredByValue);
          }
        }
      } catch (err) {
        console.error("Error fetching patient referral:", err);
      }
    };
    fetchPatientReferral();
  }, [appointment?.patientId, isOpen]);

  // Update form when appointment changes
  useEffect(() => {
    if (appointment) {
      setRoomId(appointment.roomId || "");
      setDoctorId(appointment.doctorId || "");
      setStatus(appointment.status || "booked");
      setFollowType(appointment.followType || "first time");
      // Format startDate for input (YYYY-MM-DD)
      const dateStr = appointment.startDate 
        ? (typeof appointment.startDate === 'string' 
            ? appointment.startDate.split("T")[0] 
            : new Date(appointment.startDate).toISOString().split("T")[0])
        : new Date().toISOString().split("T")[0];
      setStartDate(dateStr);
      setFromTime(appointment.fromTime || "");
      setToTime(appointment.toTime || "");
      // Map "direct" to "No" for UI consistency
      const referralValue = appointment.referral === "direct" ? "No" : (appointment.referral || "No");
      setReferral(referralValue);
      setEmergency(appointment.emergency || "no");
      setNotes(appointment.notes || "");
      setTreatment(appointment.treatment || "");
      
      const ids: string[] = [];
      if (appointment.serviceId) {
        ids.push(typeof appointment.serviceId === "string" ? appointment.serviceId : appointment.serviceId._id);
      }
      if (Array.isArray(appointment.serviceIds)) {
        appointment.serviceIds.forEach(id => {
          if (id && !ids.includes(id)) ids.push(id);
        });
      }
      setSelectedServiceIds(ids);
      
      setError("");
      setFieldErrors({});
    }
  }, [appointment]);

  // Calculate end time when fromTime changes
  useEffect(() => {
    if (fromTime && !toTime) {
      const [hour, min] = fromTime.split(":").map(Number);
      let totalMinutes = hour * 60 + min + 15;

      // Cap at clinic closing time
      if (clinicEndTime) {
        const closingMins = timeStringToMinutes(clinicEndTime);
        if (totalMinutes > closingMins) {
          totalMinutes = closingMins;
        }
      }

      const newHour = Math.floor(totalMinutes / 60);
      const newMin = totalMinutes % 60;
      setToTime(`${String(newHour).padStart(2, "0")}:${String(newMin).padStart(2, "0")}`);
    }
  }, [fromTime, toTime, clinicEndTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    setLoading(true);
    setError("");
    setFieldErrors({});

    // Client-side validation
    const clientErrors: Record<string, string> = {};
    if (!fromTime) clientErrors.fromTime = "From time is required";
    if (!toTime) clientErrors.toTime = "To time is required";

    if (clinicEndTime && (fromTime || toTime)) {
      const closingMins = timeStringToMinutes(clinicEndTime);
      if (fromTime) {
        const fromMins = timeStringToMinutes(fromTime);
        if (fromMins >= closingMins) {
          clientErrors.fromTime = `Appointment cannot start after clinic closing time (${clinicEndTime})`;
        }
      }
      if (toTime) {
        const toMins = timeStringToMinutes(toTime);
        if (toMins > closingMins) {
          clientErrors.toTime = `Appointment cannot end after clinic closing time (${clinicEndTime})`;
        }
      }
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setError("Please fix the errors below");
      setLoading(false);
      return;
    }

    try {
      const headers = getAuthHeaders();
      const response = await axios.put(
        `/api/clinic/update-appointment/${appointment._id}`,
        {
          patientId: appointment.patientId,
          doctorId,
          roomId,
          status,
          followType,
          startDate,
          fromTime,
          toTime,
          referral,
          emergency,
          notes,
          treatment,
          serviceId: selectedServiceIds.length > 0 ? selectedServiceIds[0] : undefined,
          serviceIds: selectedServiceIds,
        },
        { headers }
      );

      if (response.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.data.message || "Failed to update appointment");
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.errors) {
        setFieldErrors(errorData.errors);
        setError(errorData.message || "Please fix the errors below");
      } else if (errorData?.missingFields) {
        const missingFieldErrors: Record<string, string> = {};
        errorData.missingFields.forEach((field: string, index: number) => {
          const fieldLabel = errorData.missingFieldLabels?.[index] || field;
          missingFieldErrors[field] = `${fieldLabel} is required`;
        });
        setFieldErrors(missingFieldErrors);
        setError(errorData.message || "Please fill all required fields");
      } else {
        setError(errorData?.message || "Failed to update appointment");
      }
    } finally {
      setLoading(false);
    }
  };

  // Debug logging
  useEffect(() => {
    console.log("EditAppointmentModal - isOpen:", isOpen, "appointment:", appointment?._id);
  }, [isOpen, appointment]);

  if (!isOpen) return null;
  if (!appointment) {
    console.log("EditAppointmentModal: No appointment provided");
    return null;
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-2" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit Appointment</h2>
            <p className="text-xs text-gray-600 mt-0.5">Patient: {appointment.patientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-800" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="bg-red-50 dark:bg-red-100 border border-red-200 dark:border-red-300 rounded-lg p-2 flex items-center gap-2 text-red-700 dark:text-red-800">
              <AlertCircle className="w-4 h-4" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          {/* Patient Info (Read-only) */}
          <div className="bg-gray-50 border border-gray-200 rounded p-2">
            <label className="block text-xs font-medium text-gray-700 mb-0.5">Patient</label>
            <p className="text-xs text-gray-900 font-medium">{appointment.patientName}</p>
            <p className="text-xs text-gray-500 mt-0.5">This field cannot be changed</p>
          </div>

          {/* Room, Doctor, Status, Follow Type - In one row */}
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Room <span className="text-red-500">*</span>
              </label>
              <select
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                  if (fieldErrors.roomId) {
                    setFieldErrors({ ...fieldErrors, roomId: "" });
                  }
                }}
                className={`w-full border rounded px-2 py-1.5 text-xs bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.roomId ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-300"
                }`}
                required
              >
                <option value="">Select room</option>
                {rooms.map((room) => (
                  <option key={room._id} value={room._id}>
                    {room.name}
                  </option>
                ))}
              </select>
              {fieldErrors.roomId && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-600">{fieldErrors.roomId}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Doctor <span className="text-red-500">*</span>
              </label>
              <select
                value={doctorId}
                onChange={(e) => {
                  setDoctorId(e.target.value);
                  if (fieldErrors.doctorId) {
                    setFieldErrors({ ...fieldErrors, doctorId: "" });
                  }
                }}
                className={`w-full border rounded px-2 py-1.5 text-xs bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.doctorId ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-300"
                }`}
                required
              >
                <option value="">Select doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
              {fieldErrors.doctorId && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-600">{fieldErrors.doctorId}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  if (fieldErrors.status) {
                    setFieldErrors({ ...fieldErrors, status: "" });
                  }
                }}
                className={`w-full border rounded px-2 py-1.5 text-xs bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.status ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-300"
                }`}
                required
              >
                {APPOINTMENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {fieldErrors.status && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-600">{fieldErrors.status}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Follow Type <span className="text-red-500">*</span>
              </label>
              <select
                value={followType}
                onChange={(e) => {
                  setFollowType(e.target.value);
                  if (fieldErrors.followType) {
                    setFieldErrors({ ...fieldErrors, followType: "" });
                  }
                }}
                className={`w-full border rounded px-2 py-1.5 text-xs bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.followType ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-300"
                }`}
                required
              >
                <option value="first time">First Time</option>
                <option value="follow up">Follow Up</option>
                <option value="repeat">Repeat</option>
              </select>
              {fieldErrors.followType && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-600">{fieldErrors.followType}</p>
              )}
            </div>
          </div>

          {/* Date and Time Fields - In one row */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                <Calendar className="w-3 h-3 inline mr-0.5" />
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (fieldErrors.startDate) {
                    setFieldErrors({ ...fieldErrors, startDate: "" });
                  }
                }}
                className={`w-full border rounded px-2 py-1.5 text-xs bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.startDate ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-300"
                }`}
                required
              />
              {fieldErrors.startDate && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-600">{fieldErrors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                <Clock className="w-3 h-3 inline mr-0.5" />
                From Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={fromTime}
                onChange={(e) => {
                  setFromTime(e.target.value);
                  if (fieldErrors.fromTime) {
                    setFieldErrors({ ...fieldErrors, fromTime: "" });
                  }
                }}
                className={`w-full border rounded px-2 py-1.5 text-xs bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.fromTime ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-300"
                }`}
                required
              />
              {fieldErrors.fromTime && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-600">{fieldErrors.fromTime}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                <Clock className="w-3 h-3 inline mr-0.5" />
                To Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={toTime}
                onChange={(e) => {
                  setToTime(e.target.value);
                  if (fieldErrors.toTime) {
                    setFieldErrors({ ...fieldErrors, toTime: "" });
                  }
                }}
                className={`w-full border rounded px-2 py-1.5 text-xs bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.toTime ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-300"
                }`}
                required
              />
              {fieldErrors.toTime && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-600">{fieldErrors.toTime}</p>
              )}
            </div>
          </div>

          {/* Treatment Selection (Optional) */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Treatments (Optional)
            </label>
            <div
              className={`w-full border border-gray-300 dark:border-gray-300 rounded-lg px-3 py-2 text-xs bg-white dark:bg-white text-gray-900 dark:text-gray-900 cursor-pointer flex justify-between items-center transition-all hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                isServicesOpen ? "ring-2 ring-blue-500 border-blue-500" : ""
              }`}
              onClick={() => setIsServicesOpen(!isServicesOpen)}
            >
              <div className="flex flex-wrap gap-1">
                {selectedServiceIds.length > 0 ? (
                  selectedServiceIds.map((id) => {
                    const svc = services.find((s) => s._id === id);
                    return (
                      <span
                        key={id}
                        className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md flex items-center gap-1"
                      >
                        {svc?.name || "Unknown"}
                        <X
                          className="w-2.5 h-2.5 cursor-pointer hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedServiceIds(selectedServiceIds.filter((sid) => sid !== id));
                          }}
                        />
                      </span>
                    );
                  })
                ) : (
                  <span className="text-gray-400">Select treatments (optional)</span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isServicesOpen ? "rotate-180" : ""}`} />
            </div>

            {isServicesOpen && (
              <div className="absolute z-[1000] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {servicesLoading ? (
                  <div className="p-3 text-center text-xs text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Loading treatments...
                  </div>
                ) : services.length > 0 ? (
                  <div className="py-1">
                    {services.map((svc) => {
                      const isSelected = selectedServiceIds.includes(svc._id);
                      return (
                        <div
                          key={svc._id}
                          className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between hover:bg-gray-100 ${
                            isSelected ? "bg-gray-50 text-gray-900 font-medium" : "text-gray-700"
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedServiceIds(selectedServiceIds.filter((id) => id !== svc._id));
                            } else {
                              setSelectedServiceIds([...selectedServiceIds, svc._id]);
                            }
                          }}
                        >
                          <span>{svc.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-gray-500 italic">
                    No treatments found
                  </div>
                )}
              </div>
            )}
            {isServicesOpen && (
              <div
                className="fixed inset-0 z-[999]"
                onClick={() => setIsServicesOpen(false)}
              />
            )}
            {fieldErrors.serviceId && (
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-600">{fieldErrors.serviceId}</p>
            )}
          </div>

          {/* Referral, Emergency, Notes - In one row */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Referral</label>
              <select
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-300 rounded px-2 py-1.5 text-xs bg-white dark:bg-white text-gray-900 dark:text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="No">No</option>
                {referrals.map((ref) => (
                  <option key={ref._id} value={`${ref.firstName} ${ref.lastName}`.trim()}>
                    {[ref.firstName, ref.lastName].filter(Boolean).join(" ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Emergency</label>
              <select
                value={emergency}
                onChange={(e) => setEmergency(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-300 rounded px-2 py-1.5 text-xs bg-white dark:bg-white text-gray-900 dark:text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 dark:border-gray-300 rounded px-2 py-1.5 text-xs bg-white dark:bg-white text-gray-900 dark:text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add notes..."
              />
            </div>
          </div>

         

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Appointment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
}

