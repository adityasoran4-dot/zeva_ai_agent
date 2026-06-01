"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Loader2, AlertCircle } from "lucide-react";

interface AppointmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  getAuthHeaders: () => Record<string, string>;
}

interface HistoryAppointment {
  _id: string;
  visitId: string;
  patientName: string;
  patientEmail: string;
  patientMobile: string;
  emrNumber: string;
  doctorName: string;
  doctorEmail: string;
  roomName: string;
  status: string;
  followType: string;
  startDate: string;
  fromTime: string;
  toTime: string;
  referral: string;
  emergency: string;
  notes: string;
  arrivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AppointmentHistoryModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  getAuthHeaders,
}: AppointmentHistoryModalProps) {
  const [appointments, setAppointments] = useState<HistoryAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen && patientId) {
      fetchHistory();
    } else {
      setAppointments([]);
      setError("");
    }
  }, [isOpen, patientId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`/api/clinic/patient-appointment-history/${patientId}`, { headers });

      if (response.data.success) {
        setAppointments(response.data.appointments || []);
      } else {
        setError(response.data.message || "Failed to fetch appointment history");
      }
    } catch (err: any) {
      console.error("Error fetching appointment history:", err);
      setError(err.response?.data?.message || "Failed to fetch appointment history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "-";
    return timeStr;
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeColor = (status: string) => {
    const statusColors: Record<string, string> = {
      booked: "bg-blue-100 text-blue-800",
      enquiry: "bg-yellow-100 text-yellow-800",
      Discharge: "bg-green-100 text-green-800",
      Arrived: "bg-purple-100 text-purple-800",
      Consultation: "bg-indigo-100 text-indigo-800",
      Cancelled: "bg-red-100 text-red-800",
      Approved: "bg-green-100 text-green-800",
      Rescheduled: "bg-orange-100 text-orange-800",
      Waiting: "bg-yellow-100 text-yellow-800",
      Rejected: "bg-red-100 text-red-800",
      Completed: "bg-green-100 text-green-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getFollowTypeBadgeColor = (followType: string) => {
    const typeColors: Record<string, string> = {
      "first time": "bg-blue-100 text-blue-800",
      "follow up": "bg-green-100 text-green-800",
      repeat: "bg-purple-100 text-purple-800",
    };
    return typeColors[followType] || "bg-gray-100 text-gray-800";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-1 sm:p-2" onClick={onClose}>
      <div className="bg-white rounded shadow-2xl max-w-5xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-1.5 sm:p-2 border-b border-gray-200">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-gray-900">Appointment History</h2>
            <p className="text-[9px] sm:text-[10px] text-gray-600 mt-0.5">Patient: {patientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-0.5 sm:p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-1.5 sm:p-2">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="ml-2 text-[9px] sm:text-[10px] text-gray-600">Loading...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-1.5 flex items-center gap-1 text-red-700">
              <AlertCircle className="w-2.5 h-2.5" />
              <p className="text-[9px] sm:text-[10px]">{error}</p>
            </div>
          )}

          {!loading && !error && appointments.length === 0 && (
            <div className="text-center py-4">
              <p className="text-[9px] sm:text-[10px] text-gray-500">No appointment history found.</p>
            </div>
          )}

          {!loading && !error && appointments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200" style={{ minWidth: '1200px' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-1 py-1 text-left text-[8px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wider w-[80px]">
                      Visit ID
                    </th>
                    <th className="px-1 py-1 text-left text-[8px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wider w-[80px]">
                      Date
                    </th>
                    <th className="px-1 py-1 text-left text-[8px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wider w-[100px]">
                      Time
                    </th>
                    <th className="px-1 py-1 text-left text-[8px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wider w-[100px]">
                      Doctor
                    </th>
                    <th className="px-1 py-1 text-left text-[8px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wider w-[90px]">
                      Room
                    </th>
                    <th className="px-1 py-1 text-left text-[8px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wider w-[70px]">
                      Status
                    </th>
                    <th className="px-1 py-1 text-left text-[8px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wider w-[80px]">
                      Type
                    </th>
                    <th className="px-1 py-1 text-left text-[8px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wider w-[70px]">
                      Ref
                    </th>
                    <th className="px-1 py-1 text-left text-[8px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wider w-[60px]">
                      Emer
                    </th>
                    <th className="px-1 py-1 text-left text-[8px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wider w-[80px]">
                      EMR
                    </th>
                    <th className="px-1 py-1 text-left text-[8px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wider w-[100px]">
                      Arrived
                    </th>
                    <th className="px-1 py-1 text-left text-[8px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wider w-[100px]">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((apt) => (
                    <tr key={apt._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-1 py-1 whitespace-nowrap">
                        <span className="text-[8px] sm:text-[9px] text-gray-900 font-medium">{apt.visitId || "-"}</span>
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap">
                        <span className="text-[8px] sm:text-[9px] text-gray-900">{formatDate(apt.startDate)}</span>
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap">
                        <span className="text-[8px] sm:text-[9px] text-gray-900">
                          {formatTime(apt.fromTime)}-{formatTime(apt.toTime)}
                        </span>
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap">
                        <span className="text-[8px] sm:text-[9px] text-gray-900 truncate block max-w-[100px]" title={apt.doctorName || ""}>{apt.doctorName || "-"}</span>
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap">
                        <span className="text-[8px] sm:text-[9px] text-gray-900 truncate block max-w-[90px]" title={apt.roomName || ""}>{apt.roomName || "-"}</span>
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap">
                        <span className={`px-1 py-0.5 rounded-full text-[7px] sm:text-[8px] font-semibold ${getStatusBadgeColor(apt.status)}`}>
                          {apt.status || "-"}
                        </span>
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap">
                        <span className={`px-1 py-0.5 rounded-full text-[7px] sm:text-[8px] font-semibold ${getFollowTypeBadgeColor(apt.followType)}`}>
                          {apt.followType || "-"}
                        </span>
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap">
                        <span className="text-[8px] sm:text-[9px] text-gray-900 capitalize">{apt.referral || "-"}</span>
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap">
                        <span className="text-[8px] sm:text-[9px] text-gray-900 capitalize">{apt.emergency || "-"}</span>
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap">
                        <span className="text-[8px] sm:text-[9px] text-gray-900">{apt.emrNumber || "-"}</span>
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap">
                        <span className="text-[8px] sm:text-[9px] text-gray-900">{apt.arrivedAt ? formatDateTime(apt.arrivedAt) : "-"}</span>
                      </td>
                      <td className="px-1 py-1">
                        <span className="text-[8px] sm:text-[9px] text-gray-900 max-w-[100px] truncate block" title={apt.notes || ""}>
                          {apt.notes || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-1 sm:p-1.5 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-2 py-1 text-[9px] sm:text-[10px] bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

