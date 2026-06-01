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
  PieChart,
  Pie,
  Cell,
} from "recharts";
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

export default function PatientReport({ startDate, endDate, headers }: Props) {
  const [data, setData] = useState<any>({
    topVisited: [],
    membershipByPatient: [],
    packageByPatient: [],
    highestPending: [],
    highestAdvance: [],
    revenueByPatient: [],
    summary: { totalPatients: 0, newPatients: 0, returningPatients: 0 },
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  async function fetchData() {
    const qs = new URLSearchParams({ startDate, endDate }).toString();
    const res = await fetch(`/api/clinic/reports/patient-stats?${qs}`, { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setData({
        topVisited: [],
        membershipByPatient: [],
        packageByPatient: [],
        highestPending: [],
        highestAdvance: [],
        revenueByPatient: [],
        summary: { totalPatients: 0, newPatients: 0, returningPatients: 0 },
      });
      return;
    }
    setData(json.data || {});
  }

  const visitedChart = useMemo(
    () =>
      (data.topVisited || []).slice(0, 10).map((r: any) => ({
        name: r.patientName || "Unknown",
        visits: r.visits || 0,
      })),
    [data.topVisited]
  );

  const membershipChart = useMemo(
    () =>
      (data.membershipByPatient || []).slice(0, 10).map((r: any) => ({
        name: r.patientName || "Unknown",
        revenue: Math.round(r.membershipRevenue || 0),
        count: r.count || 0,
      })),
    [data.membershipByPatient]
  );

  const packageChart = useMemo(
    () =>
      (data.packageByPatient || []).slice(0, 10).map((r: any) => ({
        name: r.patientName || "Unknown",
        revenue: Math.round(r.revenue || 0),
        count: r.count || 0,
      })),
    [data.packageByPatient]
  );

  const revenueChart = useMemo(
    () =>
      (data.revenueByPatient || []).slice(0, 10).map((r: any) => ({
        name: r.patientName || "Unknown",
        revenue: Math.round(r.revenue || 0),
      })),
    [data.revenueByPatient]
  );

  const patientExportSections = useMemo(() => [
    {
      title: "Patient Summary",
      headers: ["Metric", "Value"],
      data: [
        { "Metric": "Total Patients", "Value": data.summary?.totalPatients || 0 },
        { "Metric": "New Patients", "Value": data.summary?.newPatients || 0 },
        { "Metric": "Returning Patients", "Value": data.summary?.returningPatients || 0 },
      ],
    },
    {
      title: "Most Visited Patients",
      headers: ["Patient Name", "Total Visits"],
      data: (data.topVisited || []).map((r: any) => ({
        "Patient Name": r.patientName || "Unknown",
        "Total Visits": r.visits || 0,
      })),
    },
    {
      title: "Top Patients by Revenue",
      headers: ["Patient Name", "Total Revenue (AED)"],
      data: (data.revenueByPatient || []).map((r: any) => ({
        "Patient Name": r.patientName || "Unknown",
        "Total Revenue (AED)": Math.round(r.revenue || 0),
      })),
    },
    {
      title: "Top Membership Purchases",
      headers: ["Patient Name", "Membership Count", "Membership Revenue (AED)"],
      data: (data.membershipByPatient || []).map((r: any) => ({
        "Patient Name": r.patientName || "Unknown",
        "Membership Count": r.count || 0,
        "Membership Revenue (AED)": Math.round(r.membershipRevenue || 0),
      })),
    },
    {
      title: "Top Package Purchases",
      headers: ["Patient Name", "Package Count", "Package Revenue (AED)"],
      data: (data.packageByPatient || []).map((r: any) => ({
        "Patient Name": r.patientName || "Unknown",
        "Package Count": r.count || 0,
        "Package Revenue (AED)": Math.round(r.revenue || 0),
      })),
    },
    {
      title: "Highest Pending Amount",
      headers: ["Patient Name", "Pending Amount (AED)"],
      data: (data.highestPending || []).map((r: any) => ({
        "Patient Name": r.patientName || "Unknown",
        "Pending Amount (AED)": Math.round(r.pending || 0),
      })),
    },
    {
      title: "Highest Advance Amount",
      headers: ["Patient Name", "Advance Amount (AED)"],
      data: (data.highestAdvance || []).map((r: any) => ({
        "Patient Name": r.patientName || "Unknown",
        "Advance Amount (AED)": Math.round(r.advance || 0),
      })),
    },
  ], [data]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1", "#a4de6c", "#d0ed57"];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButtons
          sections={patientExportSections}
          filename={`patient_report_${startDate}_to_${endDate}`}
          title="Patient Detailed Report"
        />
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Most Visited Patients</h3>
        </div>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visitedChart} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="visits" fill="#2D9AA5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Top Membership Purchases</h3>
          </div>
          <div className="w-full" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={membershipChart} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
                <YAxis />
                <Tooltip formatter={(v: any) => currency(Number(v || 0))} />
                <Bar dataKey="revenue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Top Package Purchases</h3>
          </div>
          <div className="w-full" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={packageChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="revenue"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {packageChart.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => currency(Number(v || 0))} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Patient Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border rounded">
            <div className="text-xs text-gray-500">Total Patients</div>
            <div className="text-xl font-semibold">{data.summary?.totalPatients || 0}</div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-xs text-gray-500">New Patients</div>
            <div className="text-xl font-semibold">{data.summary?.newPatients || 0}</div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-xs text-gray-500">Returning Patients</div>
            <div className="text-xl font-semibold">{data.summary?.returningPatients || 0}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Highest Pending Amount</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Patient Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Pending</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {(data.highestPending || []).slice(0, 10).map((r: any) => (
                  <tr key={String(r.patientId)}>
                    <td className="px-4 py-2 text-sm">{r.patientName || "Unknown"}</td>
                    <td className="px-4 py-2 text-sm font-medium">{currency(r.pending || 0)}</td>
                  </tr>
                ))}
                {!data.highestPending?.length && (
                  <tr>
                    <td className="px-4 py-4 text-sm text-gray-500" colSpan={2}>
                      No data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Highest Advance Amount</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Patient Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Advance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {(data.highestAdvance || []).slice(0, 10).map((r: any) => (
                  <tr key={String(r.patientId)}>
                    <td className="px-4 py-2 text-sm">{r.patientName || "Unknown"}</td>
                    <td className="px-4 py-2 text-sm font-medium">{currency(r.advance || 0)}</td>
                  </tr>
                ))}
                {!data.highestAdvance?.length && (
                  <tr>
                    <td className="px-4 py-4 text-sm text-gray-500" colSpan={2}>
                      No data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Top Patients by Revenue</h3>
        </div>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
              <YAxis tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} />
              <Tooltip formatter={(v: any) => currency(Number(v || 0))} />
              <Legend verticalAlign="top" height={36}/>
              <Line 
                type="monotone" 
                dataKey="revenue" 
                name="Total Revenue" 
                stroke="#8B5CF6" 
                strokeWidth={3} 
                dot={{ r: 4, fill: "#8B5CF6", strokeWidth: 2 }} 
                activeDot={{ r: 6, strokeWidth: 0 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
