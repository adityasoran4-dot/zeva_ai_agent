import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import ExportButtons from "./ExportButtons";

type HeadersRecord = Record<string, string>;

interface Props {
  startDate: string;
  endDate: string;
  headers: HeadersRecord;
}

type RevenueRow = { staffId: string; staffName: string; revenue: number; invoices: number };
type DetailRow = {
  staffId: string;
  staffName: string;
  totalAppointments: number;
  booked: number;
  cancelled: number;
  completed: number;
  invoiced: number;
  rescheduled: number;
  totalPatients: number;
};

type BillingRow = {
  staffId: string;
  name: string;
  amount: number;
  count: number;
};

type CommissionRow = {
  staffId: string;
  name: string;
  totalCommission: number;
  entries: number;
};

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

export default function DoctorStaffReport({ startDate, endDate, headers }: Props) {
  const [loading, setLoading] = useState(false);
  const [revenues, setRevenues] = useState<RevenueRow[]>([]);
  const [details, setDetails] = useState<DetailRow[]>([]);
  const [topDoctorStaffCommission, setTopDoctorStaffCommission] = useState<CommissionRow[]>([]);
  const [topAgentCommission, setTopAgentCommission] = useState<CommissionRow[]>([]);
  const [topPackageBilling, setTopPackageBilling] = useState<BillingRow[]>([]);
  const [topMembershipBilling, setTopMembershipBilling] = useState<BillingRow[]>([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  async function fetchData() {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ startDate, endDate: new Date(endDate).toISOString() }).toString();
      const res = await fetch(`/api/clinic/reports/doctor-staff-performance?${qs}`, { headers });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setRevenues([]);
        setDetails([]);
        setTopDoctorStaffCommission([]);
        setTopAgentCommission([]);
        return;
      }
      setRevenues(json.data?.top5Revenue || []);
      setDetails(json.data?.top5Details || []);
      setTopDoctorStaffCommission(json.data?.topDoctorStaffCommission || []);
      setTopAgentCommission(json.data?.topAgentCommission || []);
      setTopPackageBilling(json.data?.topPackageBilling || []);
      setTopMembershipBilling(json.data?.topMembershipBilling || []);
    } finally {
      setLoading(false);
    }
  }

  const chartBookings = useMemo(
    () =>
      (details || []).map((d) => ({
        name: d.staffName || "Unknown",
        bookings: d.totalAppointments || 0,
      })),
    [details]
  );

  const chartRevenue = useMemo(() => {
    const maxRevenue = Math.max(...revenues.map((r) => r.revenue));
    return (revenues || []).map((d) => ({
      name: d.staffName || "Unknown",
      revenue: Math.round(d.revenue || 0),
      normalizedRevenue: maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0,
    }));
  }, [revenues]);

  const chartPatients = useMemo(
    () =>
      (details || []).map((d) => ({
        name: d.staffName || "Unknown",
        patients: d.totalPatients || 0,
      })),
    [details]
  );

  const doctorStaffExportSections = useMemo(() => [
    {
      title: "Top Doctor Staff Details",
      headers: ["Doctor Staff", "Total Appointments", "Booked", "Cancelled", "Completed", "Invoiced", "Rescheduled", "Total Patients"],
      data: details.map(d => ({
        "Doctor Staff": d.staffName || "Unknown",
        "Total Appointments": d.totalAppointments || 0,
        "Booked": d.booked || 0,
        "Cancelled": d.cancelled || 0,
        "Completed": d.completed || 0,
        "Invoiced": d.invoiced || 0,
        "Rescheduled": d.rescheduled || 0,
        "Total Patients": d.totalPatients || 0,
      })),
    },
    {
      title: "Top 5 Doctor Staff Revenue",
      headers: ["Doctor Staff", "Revenue (AED)", "Invoices"],
      data: revenues.map(r => ({
        "Doctor Staff": r.staffName || "Unknown",
        "Revenue (AED)": Math.round(r.revenue || 0),
        "Invoices": r.invoices || 0,
      })),
    },
    {
      title: "Highest Billing in Packages",
      headers: ["Doctor Staff", "Package Revenue (AED)", "Invoices"],
      data: topPackageBilling.map(r => ({
        "Doctor Staff": r.name || "Unknown",
        "Package Revenue (AED)": Math.round(r.amount || 0),
        "Invoices": r.count || 0,
      })),
    },
    {
      title: "Highest Billing in Memberships",
      headers: ["Doctor Staff", "Membership Revenue (AED)", "Invoices"],
      data: topMembershipBilling.map(r => ({
        "Doctor Staff": r.name || "Unknown",
        "Membership Revenue (AED)": Math.round(r.amount || 0),
        "Invoices": r.count || 0,
      })),
    },
    {
      title: "Top 5 Doctor Staff Commission",
      headers: ["Doctor Staff", "Total Commission (AED)", "Entries"],
      data: topDoctorStaffCommission.map(r => ({
        "Doctor Staff": r.name || "Unknown",
        "Total Commission (AED)": Math.round(r.totalCommission || 0),
        "Entries": r.entries || 0,
      })),
    },
    {
      title: "Top 5 Agents Commission",
      headers: ["Agent", "Total Commission (AED)", "Entries"],
      data: topAgentCommission.map(r => ({
        "Agent": r.name || "Unknown",
        "Total Commission (AED)": Math.round(r.totalCommission || 0),
        "Entries": r.entries || 0,
      })),
    },
  ], [details, revenues, topPackageBilling, topMembershipBilling, topDoctorStaffCommission, topAgentCommission]);

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <ExportButtons
          sections={doctorStaffExportSections}
          filename={`doctor_staff_report_${startDate}_to_${endDate}`}
          title="Doctor Staff Performance Report"
        />
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Doctor Staff by Bookings</h3>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartBookings} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
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
          <h3 className="text-lg font-semibold text-gray-800">Top 5 Doctor Staff Revenue</h3>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <div className="w-full" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
                <YAxis tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} />
                <Tooltip formatter={(v: any) => currency(Number(v || 0))} />
                <Legend verticalAlign="top" height={36}/>
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue (AED)" 
                  stroke="#0EA5E9" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "#0EA5E9", strokeWidth: 2 }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="normalizedRevenue" 
                  name="Normalized Revenue (%)" 
                  stroke="#8884d8" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: "#8884d8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Doctor Staff</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Revenue</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Invoices</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {revenues.map((r) => (
                  <tr key={r.staffId}>
                    <td className="px-4 py-2 text-sm">{r.staffName}</td>
                    <td className="px-4 py-2 text-sm font-medium">{currency(r.revenue)}</td>
                    <td className="px-4 py-2 text-sm">{r.invoices}</td>
                  </tr>
                ))}
                {!revenues.length && (
                  <tr>
                    <td className="px-4 py-4 text-sm text-gray-500" colSpan={3}>
                      No data for selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Highest Billing in Packages</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Doctor Staff</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Package Revenue</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Invoices</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {topPackageBilling.map((r) => (
                <tr key={r.staffId}>
                  <td className="px-4 py-2 text-sm">{r.name}</td>
                  <td className="px-4 py-2 text-sm font-medium">{currency(r.amount)}</td>
                  <td className="px-4 py-2 text-sm">{r.count}</td>
                </tr>
              ))}
              {!topPackageBilling.length && (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan={3}>
                    No package billing data for selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Highest Billing in Memberships</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Doctor Staff</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Membership Revenue</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Invoices</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {topMembershipBilling.map((r) => (
                <tr key={r.staffId}>
                  <td className="px-4 py-2 text-sm">{r.name}</td>
                  <td className="px-4 py-2 text-sm font-medium">{currency(r.amount)}</td>
                  <td className="px-4 py-2 text-sm">{r.count}</td>
                </tr>
              ))}
              {!topMembershipBilling.length && (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan={3}>
                    No membership billing data for selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Top Doctor Staff Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Doctor Staff</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Appointments</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Booked</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cancelled</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Completed</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Invoiced</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Rescheduled</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Patients</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {details.map((d) => (
                <tr key={d.staffId}>
                  <td className="px-4 py-2 text-sm">{d.staffName}</td>
                  <td className="px-4 py-2 text-sm">{d.totalAppointments}</td>
                  <td className="px-4 py-2 text-sm">{d.booked}</td>
                  <td className="px-4 py-2 text-sm">{d.cancelled}</td>
                  <td className="px-4 py-2 text-sm">{d.completed}</td>
                  <td className="px-4 py-2 text-sm">{d.invoiced}</td>
                  <td className="px-4 py-2 text-sm">{d.rescheduled}</td>
                  <td className="px-4 py-2 text-sm">{d.totalPatients}</td>
                </tr>
              ))}
              {!details.length && (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan={8}>
                    No staff found for selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Total Patients Treated (Top 5)</h3>
        </div>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartPatients} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
              <YAxis tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} />
              <Tooltip />
              <Bar dataKey="patients" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Top 5 Doctor Staff Commission</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Doctor Staff</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Commission</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Entries</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {topDoctorStaffCommission.map((r) => (
                <tr key={r.staffId}>
                  <td className="px-4 py-2 text-sm">{r.name}</td>
                  <td className="px-4 py-2 text-sm font-medium">{currency(r.totalCommission)}</td>
                  <td className="px-4 py-2 text-sm">{r.entries}</td>
                </tr>
              ))}
              {!topDoctorStaffCommission.length && (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan={3}>
                    No commission data for selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Top 5 Agents Commission</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Agent</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Commission</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Entries</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {topAgentCommission.map((r) => (
                <tr key={r.staffId}>
                  <td className="px-4 py-2 text-sm">{r.name}</td>
                  <td className="px-4 py-2 text-sm font-medium">{currency(r.totalCommission)}</td>
                  <td className="px-4 py-2 text-sm">{r.entries}</td>
                </tr>
              ))}
              {!topAgentCommission.length && (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan={3}>
                    No commission data for selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
