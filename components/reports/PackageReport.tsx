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

interface PackageRow {
  packageName: string;
  totalRevenue: number;
  totalBookings: number;
  totalAppointments: number;
}

interface Props {
  startDate: string;
  endDate: string;
  headers: HeadersRecord;
}

export default function PackageReport({ startDate, endDate, headers }: Props) {
  const [rows, setRows] = useState<PackageRow[]>([]);
  const [soldRows, setSoldRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [detail, setDetail] = useState<{ open: boolean; patientId?: string; packageName?: string; data?: any }>(
    { open: false }
  );

  useEffect(() => {
    fetchTopPackages();
    fetchPackagesSold(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  async function fetchTopPackages() {
    const qs = new URLSearchParams({ startDate, endDate, limit: "10" }).toString();
    const res = await fetch(`/api/clinic/reports/package-performance?${qs}`, {
      headers,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setRows([]);
      return;
    }
    setRows(json.data || []);
  }

  async function fetchPackagesSold(p = 1) {
    const qs = new URLSearchParams({ startDate, endDate, page: String(p), limit: "20" }).toString();
    const res = await fetch(`/api/clinic/reports/packages-sold?${qs}`, { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setSoldRows([]);
      setHasNext(false);
      return;
    }
    setSoldRows(json.data || []);
    setHasNext(Boolean(json.pagination?.hasNext));
    setPage(p);
  }

  const chartData = useMemo(
    () =>
      (rows || []).map((r) => ({
        name: r.packageName || "Unnamed",
        revenue: Math.round(r.totalRevenue || 0),
        bookings: r.totalBookings || 0,
        appointments: r.totalAppointments || 0,
      })),
    [rows]
  );

  async function openUsage(patientId: string, packageName: string) {
    const qs = new URLSearchParams({ packageName }).toString();
    const res = await fetch(`/api/clinic/package-usage/${patientId}?${qs}`, { headers });
    const json = await res.json();
    if (res.ok && json.success) {
      setDetail({ open: true, patientId, packageName, data: json.packageUsage || [] });
    } else {
      setDetail({ open: true, patientId, packageName, data: { error: json.message || "Failed to load" } });
    }
  }

  const packageExportSections = useMemo(() => [
    {
      title: "Top Packages by Revenue",
      headers: ["Package Name", "Total Bookings", "Total Revenue (AED)"],
      data: rows.map(r => ({
        "Package Name": r.packageName || "Unnamed",
        "Total Bookings": r.totalBookings || 0,
        "Total Revenue (AED)": Math.round(r.totalRevenue || 0),
      })),
    },
    {
      title: "Packages Sold",
      headers: ["Package Name", "Patient Name", "Doctor Name", "Total Sessions", "Sessions Used", "Remaining Sessions", "Payment Status"],
      data: soldRows.map(r => ({
        "Package Name": r.packageName || "-",
        "Patient Name": r.patientName || "-",
        "Doctor Name": r.doctorName || "-",
        "Total Sessions": r.totalSessions ?? "-",
        "Sessions Used": r.sessionsUsed ?? 0,
        "Remaining Sessions": Math.max(0, (r.totalSessions || 0) - (r.sessionsUsed || 0)),
        "Payment Status": r.paymentStatus || "-",
      })),
    },
  ], [rows, soldRows]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButtons
          sections={packageExportSections}
          filename={`package_report_${startDate}_to_${endDate}`}
          title="Package Report"
        />
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Top Packages (Revenue)</h3>
        </div>
        <div className="w-full" style={{ height: 300, minHeight: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                interval={0} 
                height={70}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} 
                tick={{ fontSize: 10 }}
              />
              <Tooltip formatter={(v: any) => currency(Number(v || 0))} contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" fill="#2D9AA5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Appointments by Package</h3>
        <div className="w-full" style={{ height: 300, minHeight: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                interval={0} 
                height={70}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fontSize: 10 }}
              />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="appointments" name="Appointments" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Package Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((p) => (
            <div key={p.packageName} className="border rounded-lg p-4">
              <div className="font-semibold text-gray-800">{p.packageName || "Unnamed Package"}</div>
              <div className="text-sm text-gray-600">{p.totalBookings} bookings</div>
              <div className="mt-1 text-gray-900 font-semibold">{currency(p.totalRevenue)}</div>
            </div>
          ))}
          {!rows.length && <div className="text-sm text-gray-500">No package data for selected period</div>}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Package Reports — Track Packages Sold</h3>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <ExportButtons
              sections={[
                {
                  title: "Package Performance Summary",
                  headers: ["Package Name", "Total Bookings", "Total Appointments", "Total Revenue (AED)"],
                  data: rows.map(r => ({
                    "Package Name": r.packageName || "Unnamed",
                    "Total Bookings": r.totalBookings || 0,
                    "Total Appointments": r.totalAppointments || 0,
                    "Total Revenue (AED)": Math.round(r.totalRevenue || 0),
                  })),
                },
                {
                  title: "Packages Sold",
                  headers: ["Package Name", "Patient Name", "Doctor Name", "Total Sessions", "Sessions Used", "Remaining Sessions", "Payment Status"],
                  data: soldRows.map(r => ({
                    "Package Name": r.packageName || "-",
                    "Patient Name": r.patientName || "-",
                    "Doctor Name": r.doctorName || "-",
                    "Total Sessions": r.totalSessions ?? "-",
                    "Sessions Used": r.sessionsUsed ?? 0,
                    "Remaining Sessions": Math.max(0, (r.totalSessions || 0) - (r.sessionsUsed || 0)),
                    "Payment Status": r.paymentStatus || "-",
                  })),
                },
              ]}
              filename={`package_report_${startDate}_to_${endDate}`}
              title="Package Sales Report"
            />
            <div className="flex items-center gap-1 sm:gap-2 border-l border-gray-300 pl-2 sm:pl-4 w-full sm:w-auto justify-center sm:justify-end">
              <button
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded border text-xs sm:text-sm bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors min-w-[60px] sm:min-w-[70px]"
                disabled={page <= 1}
                onClick={() => fetchPackagesSold(Math.max(1, page - 1))}
              >
                Prev
              </button>
              <span className="text-xs sm:text-sm text-gray-700 font-medium whitespace-nowrap">Page {page}</span>
              <button
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded border text-xs sm:text-sm bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors min-w-[60px] sm:min-w-[70px]"
                disabled={!hasNext}
                onClick={() => fetchPackagesSold(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Package Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Doctor Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Total Sessions
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Sessions Used
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Remaining Sessions
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {soldRows.map((r) => (
                <tr key={`${r.patientId}-${r.packageName}`}>
                  <td className="px-4 py-2 text-sm text-gray-800">{r.packageName}</td>
                  <td className="px-4 py-2 text-sm">{r.patientName || "-"}</td>
                  <td className="px-4 py-2 text-sm">{r.doctorName || "-"}</td>
                  <td className="px-4 py-2 text-sm">{r.totalSessions ?? "-"}</td>
                  <td className="px-4 py-2 text-sm">{r.sessionsUsed ?? 0}</td>
                  <td className="px-4 py-2 text-sm">{Math.max(0, (r.totalSessions || 0) - (r.sessionsUsed || 0))}</td>
                  <td className="px-4 py-2 text-sm">{r.paymentStatus}</td>
                  <td className="px-4 py-2 text-sm text-right">
                    <button
                      onClick={() => openUsage(r.patientId, r.packageName)}
                      className="px-3 py-1.5 rounded bg-[#2D9AA5] text-white text-xs"
                    >
                      View Usage
                    </button>
                  </td>
                </tr>
              ))}
              {!soldRows.length && (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan={7}>
                    No packages sold in the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail.open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:max-w-3xl rounded-t-lg md:rounded-lg shadow-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">
                Package Usage — {detail.packageName} ({detail.patientId})
              </div>
              <button
                className="px-3 py-1.5 rounded border text-sm"
                onClick={() => setDetail({ open: false })}
              >
                Close
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {Array.isArray(detail.data) ? (
                detail.data.map((pkg: any) => (
                  <div key={pkg.packageName} className="mb-4">
                    <div className="font-medium">{pkg.packageName}</div>
                    {pkg.isTransferred && (
                      <div className="text-xs text-gray-700 mb-2">
                        Transferred: Yes
                        {pkg.transferredFrom && (
                          <span className="ml-2">
                            Transferred From Patient: {pkg.transferredFromName || String(pkg.transferredFrom)}
                          </span>
                        )}
                        {pkg.transferredPackageName && (
                          <span className="ml-2">
                            Transferred Package: {pkg.transferredPackageName}
                          </span>
                        )}
                        {pkg.transferredSessions !== undefined && (
                          <span className="ml-2">
                            Transferred Sessions: {pkg.transferredSessions}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-sm text-gray-600 mb-2">
                      Total Sessions Used: {pkg.totalSessions || 0}
                    </div>
                    <div className="text-sm text-gray-700 mb-2">Treatments:</div>
                    <div className="border rounded">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Treatment</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Used</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Max</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {(pkg.treatments || []).map((t: any) => (
                            <tr key={t.treatmentSlug}>
                              <td className="px-3 py-2 text-sm">{t.treatmentName}</td>
                              <td className="px-3 py-2 text-sm">{t.totalUsedSessions || 0}</td>
                              <td className="px-3 py-2 text-sm">{t.maxSessions || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-red-600">{detail.data?.error || "No data"}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
