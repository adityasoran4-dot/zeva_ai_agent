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

type OwnerRow = { ownerId: string; ownerName: string; total: number; converted: number; conversionRatio: number };
type GenderRow = { gender: string; total: number; converted: number; conversionRatio: number };
type TreatmentRow = { treatmentId: string; name: string; converted: number };
type SourceRow = { source: string; total: number; converted: number; conversionRatio: number };
type StatusRow = { status: string; count: number };

export default function LeadReport({ startDate, endDate, headers }: Props) {
  const [loading, setLoading] = useState(false);
  const [owners, setOwners] = useState<OwnerRow[]>([]);
  const [genders, setGenders] = useState<GenderRow[]>([]);
  const [treatments, setTreatments] = useState<TreatmentRow[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [statuses, setStatuses] = useState<StatusRow[]>([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  async function fetchData() {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ startDate, endDate }).toString();
      const res = await fetch(`/api/clinic/reports/lead-performance?${qs}`, { headers });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setOwners([]); setGenders([]); setTreatments([]); setSources([]); setStatuses([]);
        return;
      }
      setOwners(json.data?.conversionByOwner || []);
      setGenders(json.data?.genderStats || []);
      setTreatments(json.data?.topTreatments || []);
      setSources(json.data?.topSources || []);
      setStatuses(json.data?.statusDistribution || []);
    } finally {
      setLoading(false);
    }
  }

  const ownersChart = useMemo(
    () =>
      (owners || []).map((o) => ({
        name: o.ownerName || "Unassigned",
        ratio: Math.round((o.conversionRatio || 0) * 1000) / 10, // percentage with 1 decimal
        converted: o.converted || 0,
      })),
    [owners]
  );

  const gendersChart = useMemo(
    () =>
      (genders || []).map((g) => ({
        name: g.gender || "Unknown",
        ratio: Math.round((g.conversionRatio || 0) * 1000) / 10,
        total: g.total || 0,
      })),
    [genders]
  );

  const treatmentsChart = useMemo(
    () =>
      (treatments || []).map((t) => ({
        name: t.name || "Unknown",
        converted: t.converted || 0,
      })),
    [treatments]
  );

  const sourcesChart = useMemo(
    () =>
      (sources || []).map((s) => ({
        name: s.source || "Unknown",
        ratio: Math.round((s.conversionRatio || 0) * 1000) / 10,
        converted: s.converted || 0,
      })),
    [sources]
  );

  const statusesChart = useMemo(
    () =>
      (statuses || []).map((st) => ({
        name: st.status || "Unknown",
        value: st.count || 0,
      })).filter(s => s.value > 0),
    [statuses]
  );

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1", "#a4de6c", "#d0ed57"];

  const leadExportSections = useMemo(() => [
    {
      title: "Conversion by Owner",
      headers: ["Owner Name", "Total Leads", "Converted", "Conversion Rate (%)"],
      data: owners.map(o => ({
        "Owner Name": o.ownerName || "Unassigned",
        "Total Leads": o.total || 0,
        "Converted": o.converted || 0,
        "Conversion Rate (%)": `${Math.round((o.conversionRatio || 0) * 1000) / 10}%`,
      })),
    },
    {
      title: "Gender Conversion Ratio",
      headers: ["Gender", "Total Leads", "Converted", "Conversion Rate (%)"],
      data: genders.map(g => ({
        "Gender": g.gender || "Unknown",
        "Total Leads": g.total || 0,
        "Converted": g.converted || 0,
        "Conversion Rate (%)": `${Math.round((g.conversionRatio || 0) * 1000) / 10}%`,
      })),
    },
    {
      title: "Top Treatments Converting Leads",
      headers: ["Treatment Name", "Converted Leads"],
      data: treatments.map(t => ({
        "Treatment Name": t.name || "Unknown",
        "Converted Leads": t.converted || 0,
      })),
    },
    {
      title: "Top Sources Converting Leads",
      headers: ["Source", "Total Leads", "Converted", "Conversion Rate (%)"],
      data: sources.map(s => ({
        "Source": s.source || "Unknown",
        "Total Leads": s.total || 0,
        "Converted": s.converted || 0,
        "Conversion Rate (%)": `${Math.round((s.conversionRatio || 0) * 1000) / 10}%`,
      })),
    },
    {
      title: "Lead Status Distribution",
      headers: ["Status", "Count"],
      data: statuses.map(s => ({
        "Status": s.status || "Unknown",
        "Count": s.count || 0,
      })),
    },
  ], [owners, genders, treatments, sources, statuses]);

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <ExportButtons
          sections={leadExportSections}
          filename={`lead_report_${startDate}_to_${endDate}`}
          title="Lead Conversion Detailed Report"
        />
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Conversion by Owner</h3>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ownersChart} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: any, k: any) => (k === "ratio" ? `${Number(v || 0)}%` : v)} />
              <Bar dataKey="ratio" fill="#2D9AA5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Gender Conversion Ratio</h3>
        </div>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gendersChart} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: any, k: any) => (k === "ratio" ? `${Number(v || 0)}%` : v)} />
              <Bar dataKey="ratio" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Top Treatments Converting Leads</h3>
        </div>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={treatmentsChart} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
              <YAxis />
              <Tooltip />
              <Legend verticalAlign="top" height={36}/>
              <Line 
                type="monotone" 
                dataKey="converted" 
                name="Converted Leads" 
                stroke="#0EA5E9" 
                strokeWidth={3} 
                dot={{ r: 4, fill: "#0EA5E9", strokeWidth: 2 }} 
                activeDot={{ r: 6, strokeWidth: 0 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Top Sources Converting Leads</h3>
        </div>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sourcesChart} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: any, k: any) => (k === "ratio" ? `${Number(v || 0)}%` : v)} />
              <Legend verticalAlign="top" height={36}/>
              <Line 
                type="monotone" 
                dataKey="ratio" 
                name="Conversion Rate (%)" 
                stroke="#FB923C" 
                strokeWidth={3} 
                dot={{ r: 4, fill: "#FB923C", strokeWidth: 2 }} 
                activeDot={{ r: 6, strokeWidth: 0 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Lead Status Distribution</h3>
        </div>
        <div className="w-full" style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusesChart}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {statusesChart.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
