import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import ExportButtons from "./ExportButtons";

type DepartmentRow = {
  departmentId: string | null;
  departmentName: string;
  totalRevenue: number;
  totalBookings: number;
  avgPrice: number;
};

type ServiceRow = {
  serviceName: string;
  totalRevenue: number;
  totalBookings: number;
  averagePrice: number;
};

type TopServicesMap = Record<string, ServiceRow[]>;

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

export default function DepartmentReport({ startDate, endDate, headers }: Props) {
  const [loading, setLoading] = useState(false);
  const [deptData, setDeptData] = useState<DepartmentRow[]>([]);
  const [appointmentsByDept, setAppointmentsByDept] = useState<{ departmentName: string; totalAppointments: number }[]>([]);
  const [topServices, setTopServices] = useState<TopServicesMap>({});
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [serviceSort, setServiceSort] = useState<"revenue" | "bookings">("revenue");

  useEffect(() => {
    fetchDepartmentPerformance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  useEffect(() => {
    if (selectedDeptId) {
      fetchServices(selectedDeptId, serviceSort);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeptId, serviceSort, startDate, endDate]);

  async function fetchDepartmentPerformance() {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ startDate, endDate, top: "3" }).toString();
      const res = await fetch(`/api/clinic/reports/department-performance?${qs}`, {
        headers,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return;
      }
      const departments: DepartmentRow[] = json?.data?.departments || [];
      const topDepartments: DepartmentRow[] = json?.data?.topDepartments || [];
      const servicesByDepartment: TopServicesMap = json?.data?.servicesByDepartment || {};
      const appointmentsByDeptData = json?.data?.appointmentsByDept || [];
      setDeptData(departments);
      setTopServices(servicesByDepartment);
      setAppointmentsByDept(appointmentsByDeptData);
      if (!selectedDeptId && topDepartments.length) {
        setSelectedDeptId(String(topDepartments[0].departmentId));
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchServices(departmentId: string, sortBy: "revenue" | "bookings") {
    const qs = new URLSearchParams({ departmentId, sortBy, startDate, endDate }).toString();
    const res = await fetch(`/api/clinic/reports/service-performance?${qs}`, {
      headers,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return;
    }
    setServices(json.data || []);
  }

  const chartData = useMemo(
    () =>
      (deptData || []).map((d) => ({
        name: d.departmentName || "Unassigned",
        revenue: Math.round(d.totalRevenue || 0),
        bookings: d.totalBookings || 0,
        id: d.departmentId ? String(d.departmentId) : "",
      })),
    [deptData]
  );

  const exportSections = useMemo(() => {
    const deptSection = {
      title: "Department Performance",
      headers: ["Department Name", "Total Bookings", "Total Revenue (AED)", "Average Price (AED)", "Total Appointments", "Top Services"],
      data: deptData.map(d => {
        const deptId = d.departmentId ? String(d.departmentId) : "";
        const topSvcs = topServices[deptId] || [];
        const topSvcNames = topSvcs.slice(0, 3).map(s => s.serviceName).join(", ");
        const apptData = appointmentsByDept.find(a => a.departmentName === (d.departmentName || "Unassigned"));
        return {
          "Department Name": d.departmentName || "Unassigned",
          "Total Bookings": d.totalBookings || 0,
          "Total Revenue (AED)": Math.round(d.totalRevenue || 0),
          "Average Price (AED)": Math.round(d.avgPrice || 0),
          "Total Appointments": apptData?.totalAppointments || 0,
          "Top Services": topSvcNames || "None",
        };
      }),
    };

    const serviceSection = {
      title: "Service Performance",
      headers: ["Service Name", "Total Bookings", "Total Revenue (AED)", "Average Price (AED)"],
      data: services.map(s => ({
        "Service Name": s.serviceName,
        "Total Bookings": s.totalBookings,
        "Total Revenue (AED)": Math.round(s.totalRevenue || 0),
        "Average Price (AED)": Math.round(s.averagePrice || 0),
      })),
    };

    return [deptSection, serviceSection];
  }, [deptData, topServices, services]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1", "#a4de6c", "#d0ed57"];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Department Performance Chart */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">Department Performance</h2>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {loading && <span className="text-xs sm:text-sm text-gray-500">Loading…</span>}
            <ExportButtons
              sections={exportSections}
              filename={`department_report_${startDate}_to_${endDate}`}
              title="Department Performance Report"
            />
          </div>
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

      {/* Top Appointments by Department */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Top Appointments by Department</h2>
        <div className="w-full" style={{ height: 300, minHeight: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={appointmentsByDept.map(d => ({ name: d.departmentName, appointments: d.totalAppointments }))} 
              margin={{ top: 10, right: 10, left: 0, bottom: 50 }}
            >
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
                allowDecimals={false}
                tick={{ fontSize: 10 }}
              />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="appointments" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performing Departments Cards */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Top Performing Departments</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {deptData.slice(0, 3).map((d) => {
            const deptId = d.departmentId ? String(d.departmentId) : "";
            const svc = topServices[deptId] || [];
            return (
              <div key={deptId || d.departmentName} className="border rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm sm:text-base">{d.departmentName}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{d.totalBookings} bookings</div>
                  </div>
                  <div className="text-right text-xs sm:text-sm font-semibold">{currency(d.totalRevenue)}</div>
                </div>
                <div className="mt-2 sm:mt-3">
                  <div className="text-xs text-gray-500 mb-1">Top services</div>
                  <ul className="space-y-1">
                    {svc.slice(0, 5).map((s) => (
                      <li key={`${deptId}-${s.serviceName}`} className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-700 truncate">{s.serviceName}</span>
                        <span className="text-gray-900 font-medium whitespace-nowrap">{currency(s.totalRevenue)}</span>
                      </li>
                    ))}
                    {!svc.length && <li className="text-xs sm:text-sm text-gray-500">No services found</li>}
                  </ul>
                </div>
                <div className="mt-2 sm:mt-3">
                  <button
                    className="text-xs sm:text-sm text-[#2D9AA5] hover:underline font-medium"
                    onClick={() => setSelectedDeptId(deptId)}
                  >
                    View service performance
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 5 Services Pie Chart */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Top 5 Services by Revenue</h3>
        <div className="w-full" style={{ height: 300, minHeight: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={services.slice(0, 5).map(s => ({ name: s.serviceName, value: Math.round(s.totalRevenue || 0) }))}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={{ fontSize: 9 }}
              >
                {services.slice(0, 5).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => currency(Number(v || 0))} contentStyle={{ fontSize: 11 }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service Performance Table */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Service Performance</h3>
            <p className="text-xs text-gray-500">Fields: Service Name, Total Bookings, Total Revenue, Average Price</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <label className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">Department</label>
            <select
              value={selectedDeptId || ""}
              onChange={(e) => setSelectedDeptId(e.target.value || null)}
              className="border rounded px-2 py-1 bg-white text-xs sm:text-sm w-full sm:w-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select</option>
              {deptData
                .filter((d) => d.departmentId)
                .map((d) => (
                  <option key={String(d.departmentId)} value={String(d.departmentId)}>
                    {d.departmentName}
                  </option>
                ))}
            </select>
            <label className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">Sort by</label>
            <select
              value={serviceSort}
              onChange={(e) => setServiceSort(e.target.value as "revenue" | "bookings")}
              className="border rounded px-2 py-1 bg-white text-xs sm:text-sm w-full sm:w-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="bookings">Highest bookings</option>
              <option value="revenue">Highest revenue</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Service Name
                </th>
                <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Total Bookings
                </th>
                <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Total Revenue
                </th>
                <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Average Price
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {services.map((s) => (
                <tr key={s.serviceName}>
                  <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-800 max-w-[150px] sm:max-w-none truncate">{s.serviceName}</td>
                  <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">{s.totalBookings}</td>
                  <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap">{currency(s.totalRevenue)}</td>
                  <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">{currency(s.averagePrice)}</td>
                </tr>
              ))}
              {!services.length && (
                <tr>
                  <td className="px-4 py-4 text-xs sm:text-sm text-gray-500 text-center" colSpan={4}>
                    Select a department to view service performance
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
