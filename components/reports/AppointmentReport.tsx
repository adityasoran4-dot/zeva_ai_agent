import React, { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ExportButtons from "./ExportButtons";

type HeadersRecord = Record<string, string>;

function currency(n: number) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0,
    }).format(n || 0);
  } catch {
    return String(Math.round(n || 0));
  }
}

interface Props {
  startDate: string;
  endDate: string;
  headers: HeadersRecord;
}

export default function AppointmentReport({ startDate, endDate, headers }: Props) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalAppointments: 0, completedAppointments: 0, cancelledAppointments: 0, noShowAppointments: 0 });
  const [doctorReport, setDoctorReport] = useState<any[]>([]);
  const [doctorFilter, setDoctorFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [doctorOptions, setDoctorOptions] = useState<any[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState<any[]>([]);
  const [appointmentsByDept, setAppointmentsByDept] = useState<any[]>([]);
  const [cancelledAppointments, setCancelledAppointments] = useState<any[]>([]);
  const [noShowAppointments, setNoShowAppointments] = useState<any[]>([]);
  const [isCancelledSidebarOpen, setIsCancelledSidebarOpen] = useState(false);
  const [isNoShowSidebarOpen, setIsNoShowSidebarOpen] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, doctorFilter, departmentFilter]);

  async function fetchData() {
    const qs = new URLSearchParams({
      startDate,
      endDate,
      ...(doctorFilter ? { doctorId: doctorFilter } : {}),
      ...(departmentFilter ? { departmentId: departmentFilter } : {}),
    }).toString();
    const res = await fetch(`/api/clinic/reports/appointment-stats?${qs}`, { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setLeaderboard([]);
      setSummary({ totalAppointments: 0, completedAppointments: 0, cancelledAppointments: 0, noShowAppointments: 0 });
      setDoctorReport([]);
      setDoctorOptions([]);
      setDepartmentOptions([]);
      return;
    }
    setLeaderboard(json.data?.leaderboard || []);
    setSummary(json.data?.summary || {});
    setDoctorReport(json.data?.doctorReport || []);
    setDoctorOptions(json.data?.filters?.doctors || []);
    setDepartmentOptions(json.data?.filters?.departments || []);
    setStatusCounts(json.data?.statusCounts || []);
    setAppointmentsByDept(json.data?.appointmentsByDept || []);
    setCancelledAppointments(json.data?.cancelledAppointments || []);
    setNoShowAppointments(json.data?.noShowAppointments || []);
  }

  const topDoctorsChart = useMemo(
    () =>
      (leaderboard || []).map((d: any) => ({
        name: d.doctorName || "Unknown",
        bookings: d.totalAppointments || 0,
      })),
    [leaderboard]
  );

  const revenueChart = useMemo(
    () =>
      (doctorReport || []).map((d: any) => ({
        name: d.doctorName || "Unknown",
        revenue: Math.round(d.revenue || 0),
        appointments: d.totalAppointments || 0,
      })),
    [doctorReport]
  );

  const statusChart = useMemo(
    () =>
      (Array.isArray(statusCounts) ? statusCounts : []).map((s: any) => ({
        name: s.status || "Unknown",
        count: s.count || 0,
      })),
    [statusCounts]
  );

  const appointmentExportSections = useMemo(() => [
    {
      title: "Appointment Summary",
      headers: ["Metric", "Value"],
      data: [
        { "Metric": "Total Appointments", "Value": summary.totalAppointments || 0 },
        { "Metric": "Completed Appointments", "Value": summary.completedAppointments || 0 },
        { "Metric": "Cancelled Appointments", "Value": summary.cancelledAppointments || 0 },
        { "Metric": "No-Show Appointments", "Value": summary.noShowAppointments || 0 },
      ],
    },
    {
      title: "Doctor Leaderboard (Top by Bookings)",
      headers: ["Doctor Name", "Total Appointments"],
      data: leaderboard.map(l => ({
        "Doctor Name": l.doctorName || "Unknown",
        "Total Appointments": l.totalAppointments || 0,
      })),
    },
    {
      title: "Doctor Revenue Report",
      headers: ["Doctor Name", "Total Appointments", "Revenue (AED)"],
      data: doctorReport.map(d => ({
        "Doctor Name": d.doctorName || "Unknown",
        "Total Appointments": d.totalAppointments || 0,
        "Revenue (AED)": Math.round(d.revenue || 0),
      })),
    },
    {
      title: "Bookings by Status",
      headers: ["Status", "Count"],
      data: statusCounts.map(s => ({
        "Status": s.status || "Unknown",
        "Count": s.count || 0,
      })),
    },
    {
      title: "Appointments by Department",
      headers: ["Department Name", "Total Appointments"],
      data: appointmentsByDept.map(d => ({
        "Department Name": d.departmentName || "Unassigned",
        "Total Appointments": d.count || 0,
      })),
    },
    {
      title: "Cancelled Appointments",
      headers: ["Patient Name", "Service", "Treatment", "Notes"],
      data: cancelledAppointments.map(a => ({
        "Patient Name": a.patientName || "-",
        "Service": a.serviceName || "-",
        "Treatment": a.treatment || "-",
        "Notes": a.notes || "-",
      })),
    },
    {
      title: "No-Show Appointments",
      headers: ["Patient Name", "Service", "Treatment", "Notes"],
      data: noShowAppointments.map(a => ({
        "Patient Name": a.patientName || "-",
        "Service": a.serviceName || "-",
        "Treatment": a.treatment || "-",
        "Notes": a.notes || "-",
      })),
    },
  ], [summary, leaderboard, doctorReport, statusCounts, cancelledAppointments, noShowAppointments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Doctor</label>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="border rounded px-2 py-1 bg-white"
            >
              <option value="">All</option>
              {doctorOptions.map((d) => (
                <option key={String(d.id)} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border rounded px-2 py-1 bg-white"
            >
              <option value="">All</option>
              {departmentOptions.map((d) => (
                <option key={String(d.id)} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <ExportButtons
          sections={appointmentExportSections}
          filename={`appointment_report_${startDate}_to_${endDate}`}
          title="Appointment Report"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Top Doctors by Bookings</h3>
        </div>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topDoctorsChart} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
              <YAxis tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#2D9AA5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Bookings by Status</h3>
        </div>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusChart} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
              <YAxis tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Top Departments by Appointments</h3>
        </div>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={appointmentsByDept.map((d: any) => ({ name: d.departmentName || "Unassigned", appointments: d.count || 0 }))}
              margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
              <YAxis allowDecimals={false} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} />
              <Tooltip />
              <Legend verticalAlign="top" height={36}/>
              <Line type="monotone" dataKey="appointments" stroke="#2D9AA5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Total Appointments" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Appointment Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded">
            <div className="text-xs text-gray-500">Total Appointments</div>
            <div className="text-xl font-semibold">{summary.totalAppointments || 0}</div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-xs text-gray-500">Completed Appointments</div>
            <div className="text-xl font-semibold">{summary.completedAppointments || 0}</div>
          </div>
          <div 
            className="p-4 border rounded cursor-pointer hover:bg-red-50 transition-colors"
            onClick={() => setIsCancelledSidebarOpen(true)}
          >
            <div className="text-xs text-gray-500">Cancelled Appointments</div>
            <div className="text-xl font-semibold text-red-600">{summary.cancelledAppointments || 0}</div>
          </div>
          <div 
            className="p-4 border rounded cursor-pointer hover:bg-yellow-50 transition-colors"
            onClick={() => setIsNoShowSidebarOpen(true)}
          >
            <div className="text-xs text-gray-500">No-show Patients</div>
            <div className="text-xl font-semibold text-yellow-600">{summary.noShowAppointments || 0}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Cancellation & No-Show Report</h3>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Cancelled', value: summary.cancelledAppointments || 0 },
                  { name: 'No-Show', value: summary.noShowAppointments || 0 },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                <Cell fill="#EF4444" />
                <Cell fill="#F59E0B" />
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Doctor Appointment Report</h3>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <div className="w-full" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
                <YAxis tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} />
                <Tooltip formatter={(v: any) => currency(Number(v || 0))} />
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" dataKey="revenue" stroke="#0EA5E9" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Revenue (AED)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Doctor Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Appointments</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {doctorReport.map((d) => (
                  <tr key={String(d.doctorId)}>
                    <td className="px-4 py-2 text-sm">{d.doctorName || "Unknown"}</td>
                    <td className="px-4 py-2 text-sm">{d.totalAppointments || 0}</td>
                    <td className="px-4 py-2 text-sm font-medium">{currency(d.revenue || 0)}</td>
                  </tr>
                ))}
                {!doctorReport.length && (
                  <tr>
                    <td className="px-4 py-4 text-sm text-gray-500" colSpan={3}>
                      No data for selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sidebars */}
      <AnimatePresence>
        {isCancelledSidebarOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-red-600">Cancelled Appointments</h3>
              <button onClick={() => setIsCancelledSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {cancelledAppointments.map((apt, i) => (
                <div key={i} className="p-4 border rounded-lg bg-red-50">
                  <p className="font-semibold">{apt.patientName}</p>
                  <p className="text-sm text-gray-600">Service: {apt.serviceName}</p>
                  {apt.treatment && <p className="text-sm text-gray-600">Treatment: {apt.treatment}</p>}
                  {apt.notes && <p className="text-xs text-gray-500 mt-1 italic">Note: {apt.notes}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNoShowSidebarOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-yellow-600">No-Show Appointments</h3>
              <button onClick={() => setIsNoShowSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {noShowAppointments.map((apt, i) => (
                <div key={i} className="p-4 border rounded-lg bg-yellow-50">
                  <p className="font-semibold">{apt.patientName}</p>
                  <p className="text-sm text-gray-600">Service: {apt.serviceName}</p>
                  {apt.treatment && <p className="text-sm text-gray-600">Treatment: {apt.treatment}</p>}
                  {apt.notes && <p className="text-xs text-gray-500 mt-1 italic">Note: {apt.notes}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
