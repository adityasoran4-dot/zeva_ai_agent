"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StaffLayout from "../../components/staffLayout";
import withStaffAuth from "../../components/withStaffAuth";
import { Calendar, RefreshCw, Clock, AlertTriangle } from "lucide-react";
import { APPOINTMENT_STATUS_OPTIONS } from "../../data/appointmentStatusOptions";

const statusStyles = {
  booked: "bg-violet-100 text-violet-700 border-violet-200",
  enquiry: "bg-amber-100 text-amber-700 border-amber-200",
  Discharge: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const followStyles = {
  "first time": "bg-sky-100 text-sky-700 border-sky-200",
  "follow up": "bg-indigo-100 text-indigo-700 border-indigo-200",
  repeat: "bg-teal-100 text-teal-700 border-teal-200",
};

const BookedAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const getAuthHeaders = () => {
    if (typeof window === "undefined") return {};
    const token =
      localStorage.getItem("userToken") ||
      sessionStorage.getItem("userToken") ||
      localStorage.getItem("staffToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (statusFilter) params.append("status", statusFilter);

      const res = await axios.get(
        `/api/staff/booked-appointments?${params.toString()}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (res.data.success) {
        setAppointments(res.data.appointments || []);
      } else {
        setError(res.data.message || "Failed to fetch appointments");
      }
    } catch (err) {
      console.error("Error fetching appointments", err);
      setError(err.response?.data?.message || "Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, statusFilter]);

  const upcomingAppointments = useMemo(() => {
    return appointments.filter((apt) => apt.status === "booked");
  }, [appointments]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setTimeout(() => setRefreshing(false), 600);
  };

  const groupedByDate = useMemo(() => {
    return appointments.reduce((acc, apt) => {
      const dateKey = apt.startDate
        ? new Date(apt.startDate).toLocaleDateString()
        : "No date";
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(apt);
      return acc;
    }, {});
  }, [appointments]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                My Booked Appointments
              </h1>
              <p className="text-sm text-gray-500">
                Appointments booked under your name appear here in real-time.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5]"
                >
                  <option value="">All</option>
                  {APPOINTMENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleManualRefresh}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                type="button"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total appointments</p>
            <p className="text-3xl font-semibold text-gray-900 mt-1">
              {appointments.length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Upcoming booked</p>
            <p className="text-3xl font-semibold text-gray-900 mt-1">
              {upcomingAppointments.length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Selected date</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {selectedDate
                ? new Date(selectedDate).toLocaleDateString()
                : "All dates"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-gray-200 border-t-[#2D9AA5] rounded-full animate-spin" />
            <p className="text-sm text-gray-600">
              Fetching your appointments...
            </p>
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-2xl p-6 flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No appointments found</p>
            <p className="text-sm text-gray-500 mt-1">
              Once the clinic books an appointment for you, it will appear here.
            </p>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([dateLabel, items]) => (
            <div
              key={dateLabel}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm"
            >
              <div className="border-b border-gray-100 px-6 py-3 flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">{dateLabel}</span>
                <span className="text-sm text-gray-400">
                  ({items.length} {items.length === 1 ? "slot" : "slots"})
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((apt) => (
                  <div key={apt._id} className="p-6 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold">
                          {apt.fromTime} - {apt.toTime}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full border ${statusStyles[apt.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                      >
                        {apt.status}
                      </span>
                      <span
                        className={`text-xs px-3 py-1 rounded-full border capitalize ${followStyles[apt.followType] || "bg-gray-50 text-gray-600 border-gray-200"}`}
                      >
                        {apt.followType}
                      </span>
                      {apt.emergency === "yes" && (
                        <span className="text-xs px-3 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          Emergency
                        </span>
                      )}
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Patient
                        </p>
                        <p className="font-semibold">{apt.patientName}</p>
                        {apt.emrNumber && (
                          <p className="text-gray-500 text-xs">
                            EMR: {apt.emrNumber}
                          </p>
                        )}
                        {apt.patientMobile && (
                          <p className="text-gray-500 text-xs">
                            {apt.patientMobile}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Room
                        </p>
                        <p className="font-semibold">{apt.roomName}</p>
                        <p className="text-gray-500 text-xs capitalize">
                          Referral: {apt.referral || "direct"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Notes
                        </p>
                        <p className="text-gray-700">
                          {apt.notes || "No notes added"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

BookedAppointmentsPage.getLayout = function PageLayout(page) {
  return <StaffLayout>{page}</StaffLayout>;
};

const ProtectedBookedAppointments = withStaffAuth(BookedAppointmentsPage);
ProtectedBookedAppointments.getLayout = BookedAppointmentsPage.getLayout;

export default ProtectedBookedAppointments;


