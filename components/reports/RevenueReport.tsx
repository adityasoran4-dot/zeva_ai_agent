import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import ExportButtons from "./ExportButtons";

type HeadersRecord = Record<string, string>;

interface Props {
  startDate: string;
  endDate: string;
  headers: HeadersRecord;
}

type DoctorRow = { doctorId: string; name: string; amount: number };
type ServiceRow = { serviceId: string; name: string; amount: number };
type DepartmentRow = { departmentId: string; name: string; amount: number };
type PaymentRow = { method: string; amount: number };
type ViewRow = { label: string; amount: number };

export default function RevenueReport({ startDate, endDate, headers }: Props) {
  const [loading, setLoading] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueByDoctor, setRevenueByDoctor] = useState<DoctorRow[]>([]);
  const [revenueByService, setRevenueByService] = useState<ServiceRow[]>([]);
  const [revenueByDepartment, setRevenueByDepartment] = useState<DepartmentRow[]>([]);
  const [revenueByPaymentMethod, setRevenueByPaymentMethod] = useState<PaymentRow[]>([]);
  const [daily, setDaily] = useState<ViewRow[]>([]);
  const [weekly, setWeekly] = useState<ViewRow[]>([]);
  const [monthly, setMonthly] = useState<ViewRow[]>([]);
  const [yearly, setYearly] = useState<ViewRow[]>([]);

  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPageSize] = useState(10);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [pendingFilter, setPendingFilter] = useState<"pending" | "advance">("pending");
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPageSize] = useState(10);
  const [pendingTotal, setPendingTotal] = useState(0);
  type TopPatientRow = { patientId: string; name: string; amount: number };
  const [topPendingPatients, setTopPendingPatients] = useState<TopPatientRow[]>([]);
  const [topAdvancePatients, setTopAdvancePatients] = useState<TopPatientRow[]>([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, paymentsPage, paymentsPageSize, pendingFilter, pendingPage, pendingPageSize]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      params.append("paymentsPage", String(paymentsPage));
      params.append("paymentsPageSize", String(paymentsPageSize));
      params.append("pendingType", pendingFilter);
      params.append("pendingPage", String(pendingPage));
      params.append("pendingPageSize", String(pendingPageSize));
      const res = await fetch(`/api/clinic/reports/revenue?${params.toString()}`, { headers });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setTotalRevenue(0);
        setRevenueByDoctor([]);
        setRevenueByService([]);
        setRevenueByDepartment([]);
        setRevenueByPaymentMethod([]);
        setDaily([]); setWeekly([]); setMonthly([]); setYearly([]);
        return;
      }
      setTotalRevenue(json.data?.totalRevenue || 0);
      setRevenueByDoctor(json.data?.revenueByDoctor || []);
      setRevenueByService(json.data?.revenueByService || []);
      setRevenueByDepartment(json.data?.revenueByDepartment || []);
      setRevenueByPaymentMethod(json.data?.revenueByPaymentMethod || []);
      setDaily(json.data?.views?.daily || []);
      setWeekly(json.data?.views?.weekly || []);
      setMonthly(json.data?.views?.monthly || []);
      setYearly(json.data?.views?.yearly || []);
      setPayments(json.data?.payments || []);
      setPaymentsTotal(json.data?.paymentsTotal || 0);
      setPendingPayments(json.data?.pendingPayments || []);
      setPendingTotal(json.data?.pendingTotal || 0);
      setTopPendingPatients(json.data?.topPendingPatients || []);
      setTopAdvancePatients(json.data?.topAdvancePatients || []);
    } finally {
      setLoading(false);
    }
  }

  const chartDaily = useMemo(() => daily.map((d) => ({ name: d.label, amount: d.amount })), [daily]);
  const chartWeekly = useMemo(() => weekly.map((d) => ({ name: d.label, amount: d.amount })), [weekly]);
  const chartMonthly = useMemo(() => monthly.map((d) => ({ name: d.label, amount: d.amount })), [monthly]);
  const chartYearly = useMemo(() => yearly.map((d) => ({ name: d.label, amount: d.amount })), [yearly]);
  const chartData = useMemo(() => {
    if (viewMode === "daily") return chartDaily;
    if (viewMode === "weekly") return chartWeekly;
    if (viewMode === "monthly") return chartMonthly;
    return chartYearly;
  }, [viewMode, chartDaily, chartWeekly, chartMonthly, chartYearly]);
  const chartColor = useMemo(() => {
    if (viewMode === "daily") return "#2D9AA5";
    if (viewMode === "weekly") return "#0EA5E9";
    if (viewMode === "monthly") return "#F59E0B";
    return "#22C55E";
  }, [viewMode]);

  type PaymentItem = {
    invoiceNumber: string;
    patientName: string;
    service: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    paymentDate: string | null;
  };
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  type PendingItem = {
    invoiceNumber: string;
    patientName: string;
    serviceName: string;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    advanceAmount: number;
    dueDate: string | null;
  };
  const [pendingPayments, setPendingPayments] = useState<PendingItem[]>([]);

  const revenueExportSections = useMemo(() => [
    {
      title: "Revenue Summary",
      headers: ["Metric", "Amount (AED)"],
      data: [{ "Metric": "Total Revenue", "Amount (AED)": Math.round(totalRevenue || 0) }],
    },
    {
      title: "Revenue by Doctor",
      headers: ["Doctor", "Revenue (AED)"],
      data: revenueByDoctor.map(r => ({
        "Doctor": r.name || "Unknown",
        "Revenue (AED)": Math.round(r.amount || 0),
      })),
    },
    {
      title: "Revenue by Service",
      headers: ["Service", "Revenue (AED)"],
      data: revenueByService.map(r => ({
        "Service": r.name || "Unknown",
        "Revenue (AED)": Math.round(r.amount || 0),
      })),
    },
    {
      title: "Revenue by Department",
      headers: ["Department", "Revenue (AED)"],
      data: revenueByDepartment.map(r => ({
        "Department": r.name || "Unknown",
        "Revenue (AED)": Math.round(r.amount || 0),
      })),
    },
    {
      title: "Revenue by Payment Method",
      headers: ["Payment Method", "Revenue (AED)"],
      data: revenueByPaymentMethod.map(r => ({
        "Payment Method": r.method || "Unknown",
        "Revenue (AED)": Math.round(r.amount || 0),
      })),
    },
    {
      title: "Top Pending Patients",
      headers: ["Patient Name", "Pending Amount (AED)"],
      data: topPendingPatients.map(p => ({
        "Patient Name": p.name || "Unknown",
        "Pending Amount (AED)": Math.round(p.amount || 0),
      })),
    },
    {
      title: "Top Advance Patients",
      headers: ["Patient Name", "Advance Amount (AED)"],
      data: topAdvancePatients.map(p => ({
        "Patient Name": p.name || "Unknown",
        "Advance Amount (AED)": Math.round(p.amount || 0),
      })),
    },
    {
      title: "Pending / Advance Payment Report",
      headers: ["Patient Name", "Invoice Number", "Service", "Total Amount (AED)", "Paid Amount (AED)", "Pending Amount (AED)", "Advance Amount (AED)", "Due Date"],
      data: pendingPayments.map(pp => ({
        "Patient Name": pp.patientName || "Unknown",
        "Invoice Number": pp.invoiceNumber || "-",
        "Service": pp.serviceName || "Unknown",
        "Total Amount (AED)": Math.round(pp.totalAmount || 0),
        "Paid Amount (AED)": Math.round(pp.paidAmount || 0),
        "Pending Amount (AED)": Math.round(pp.pendingAmount || 0),
        "Advance Amount (AED)": Math.round(pp.advanceAmount || 0),
        "Due Date": pp.dueDate ? new Date(pp.dueDate).toLocaleDateString() : "-",
      })),
    },
    {
      title: "Payment Reports",
      headers: ["Invoice Number", "Patient Name", "Service", "Amount (AED)", "Payment Method", "Payment Status", "Payment Date"],
      data: payments.map(p => ({
        "Invoice Number": p.invoiceNumber || "-",
        "Patient Name": p.patientName || "Unknown",
        "Service": p.service || "Unknown",
        "Amount (AED)": Math.round(p.amount || 0),
        "Payment Method": p.paymentMethod || "-",
        "Payment Status": p.paymentStatus || "-",
        "Payment Date": p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "-",
      })),
    },
  ], [totalRevenue, revenueByDoctor, revenueByService, revenueByDepartment, revenueByPaymentMethod, topPendingPatients, topAdvancePatients, pendingPayments, payments]);

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <ExportButtons
          sections={revenueExportSections}
          filename={`revenue_report_${startDate}_to_${endDate}`}
          title="Revenue Detailed Report"
        />
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Revenue Summary</h3>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Revenue</div>
            <div className="text-2xl font-bold text-[#2D9AA5]">{Math.round(totalRevenue)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Top 5 Patients by Pending/Advance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full" style={{ height: 280 }}>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Pending</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topPendingPatients.map((p) => ({ name: p.name, amount: p.amount }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full" style={{ height: 280 }}>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Advance</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topAdvancePatients.map((p) => ({ name: p.name, amount: p.amount }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Revenue by Doctor</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Doctor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {revenueByDoctor.map((r) => (
                <tr key={r.doctorId}>
                  <td className="px-4 py-2 text-sm">{r.name}</td>
                  <td className="px-4 py-2 text-sm font-medium">{Math.round(r.amount)}</td>
                </tr>
              ))}
              {!revenueByDoctor.length && (
                <tr><td className="px-4 py-4 text-sm text-gray-500" colSpan={2}>No data</td></tr>
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between mt-3">
            <div className="text-sm text-gray-600">
              Showing{" "}
              {pendingPayments.length ? (pendingPage - 1) * pendingPageSize + 1 : 0}
              {"–"}
              {pendingPayments.length ? (pendingPage - 1) * pendingPageSize + pendingPayments.length : 0}
              {" of "}
              {pendingTotal}
            </div>
            <div className="inline-flex gap-2">
              <button
                className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
                disabled={pendingPage <= 1}
                onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
                disabled={pendingPage >= Math.max(1, Math.ceil(pendingTotal / pendingPageSize))}
                onClick={() =>
                  setPendingPage((p) => Math.min(Math.max(1, Math.ceil(pendingTotal / pendingPageSize)), p + 1))
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Revenue by Service</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Service</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {revenueByService.map((r) => (
                <tr key={r.serviceId}>
                  <td className="px-4 py-2 text-sm">{r.name}</td>
                  <td className="px-4 py-2 text-sm font-medium">{Math.round(r.amount)}</td>
                </tr>
              ))}
              {!revenueByService.length && (
                <tr><td className="px-4 py-4 text-sm text-gray-500" colSpan={2}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Revenue by Department</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Department</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {revenueByDepartment.map((r) => (
                <tr key={r.departmentId}>
                  <td className="px-4 py-2 text-sm">{r.name}</td>
                  <td className="px-4 py-2 text-sm font-medium">{Math.round(r.amount)}</td>
                </tr>
              ))}
              {!revenueByDepartment.length && (
                <tr><td className="px-4 py-4 text-sm text-gray-500" colSpan={2}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Revenue by Payment Method</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Method</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {revenueByPaymentMethod.map((r) => (
                <tr key={r.method}>
                  <td className="px-4 py-2 text-sm">{r.method}</td>
                  <td className="px-4 py-2 text-sm font-medium">{Math.round(r.amount)}</td>
                </tr>
              ))}
              {!revenueByPaymentMethod.length && (
                <tr><td className="px-4 py-4 text-sm text-gray-500" colSpan={2}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Revenue Trend</h3>
          <div className="inline-flex rounded-lg bg-gray-100">
            <button
              className={`px-3 py-1 rounded-l ${viewMode === "daily" ? "bg-[#2D9AA5] text-white" : "text-gray-700"}`}
              onClick={() => setViewMode("daily")}
            >
              Daily
            </button>
            <button
              className={`px-3 py-1 ${viewMode === "weekly" ? "bg-[#2D9AA5] text-white" : "text-gray-700"}`}
              onClick={() => setViewMode("weekly")}
            >
              Weekly
            </button>
            <button
              className={`px-3 py-1 ${viewMode === "monthly" ? "bg-[#2D9AA5] text-white" : "text-gray-700"}`}
              onClick={() => setViewMode("monthly")}
            >
              Monthly
            </button>
            <button
              className={`px-3 py-1 rounded-r ${viewMode === "yearly" ? "bg-[#2D9AA5] text-white" : "text-gray-700"}`}
              onClick={() => setViewMode("yearly")}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill={chartColor} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            {pendingFilter === "advance" ? "Advance Payment Report" : "Pending Payment Report"}
          </h3>
          <div className="inline-flex rounded-lg bg-gray-100">
            <button
              className={`px-3 py-1 rounded-l ${pendingFilter === "pending" ? "bg-[#2D9AA5] text-white" : "text-gray-700"}`}
              onClick={() => setPendingFilter("pending")}
            >
              Pending
            </button>
            <button
              className={`px-3 py-1 rounded-r ${pendingFilter === "advance" ? "bg-[#2D9AA5] text-white" : "text-gray-700"}`}
              onClick={() => setPendingFilter("advance")}
            >
              Advance
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Patient Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Invoice Number</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Service/Membership/Package</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Paid Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Pending Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Advance Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Due Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {pendingPayments.map((pp) => (
                <tr key={`${pp.invoiceNumber}-${pp.pendingAmount}`}>
                  <td className="px-4 py-2 text-sm">{pp.patientName || "Unknown"}</td>
                  <td className="px-4 py-2 text-sm">{pp.invoiceNumber}</td>
                  <td className="px-4 py-2 text-sm">{pp.serviceName || "Unknown"}</td>
                  <td className="px-4 py-2 text-sm font-medium">{Math.round(pp.totalAmount)}</td>
                  <td className="px-4 py-2 text-sm">{Math.round(pp.paidAmount)}</td>
                  <td className="px-4 py-2 text-sm text-red-600 font-semibold">{Math.round(pp.pendingAmount)}</td>
                  <td className="px-4 py-2 text-sm text-green-700 font-semibold">{Math.round(pp.advanceAmount)}</td>
                  <td className="px-4 py-2 text-sm">
                    {pp.dueDate ? new Date(pp.dueDate).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
              {!pendingPayments.length && (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan={8}>
                    No pending payments for selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Reports</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Invoice Number</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Patient Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Service</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment Method</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={`${p.invoiceNumber}-${p.paymentMethod}-${p.amount}`}>
                  <td className="px-4 py-2 text-sm">{p.invoiceNumber}</td>
                  <td className="px-4 py-2 text-sm">{p.patientName || "Unknown"}</td>
                  <td className="px-4 py-2 text-sm">{p.service || "Unknown"}</td>
                  <td className="px-4 py-2 text-sm font-medium">{Math.round(p.amount)}</td>
                  <td className="px-4 py-2 text-sm">{p.paymentMethod}</td>
                  <td className="px-4 py-2 text-sm">{p.paymentStatus}</td>
                  <td className="px-4 py-2 text-sm">
                    {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
              {!payments.length && (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan={7}>
                    No payments found for selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between mt-3">
            <div className="text-sm text-gray-600">
              Showing{" "}
              {payments.length ? (paymentsPage - 1) * paymentsPageSize + 1 : 0}
              {"–"}
              {payments.length ? (paymentsPage - 1) * paymentsPageSize + payments.length : 0}
              {" of "}
              {paymentsTotal}
            </div>
            <div className="inline-flex gap-2">
              <button
                className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
                disabled={paymentsPage <= 1}
                onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
                disabled={paymentsPage >= Math.max(1, Math.ceil(paymentsTotal / paymentsPageSize))}
                onClick={() =>
                  setPaymentsPage((p) => Math.min(Math.max(1, Math.ceil(paymentsTotal / paymentsPageSize)), p + 1))
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
