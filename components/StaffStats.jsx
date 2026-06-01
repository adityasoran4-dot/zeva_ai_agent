import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, LabelList, Cell } from "recharts";

export default function MyClaims() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) {
          setError("User not logged in");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/staff/my-claims", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!data.success) {
          setError(data.message || "Failed to fetch claims");
        } else {
          setPatients(data.data || []);
          setStats(data.stats || {});
        }
      } catch (err) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, []);

  const formatLargeNumber = (value) => {
    if (!value) return 0;
    if (value >= 1e9) return (value / 1e9).toFixed(2) + "B";
    if (value >= 1e6) return (value / 1e6).toFixed(2) + "M";
    if (value >= 1e3) return (value / 1e3).toFixed(2) + "K";
    return value;
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200 max-w-sm w-full text-center">
          <p className="text-sm text-gray-900">{error}</p>
        </div>
      </div>
    );

  const totalClaims = (stats.releasedClaims || 0) + (stats.pendingClaims || 0) + (stats.cancelledClaims || 0);
  const releasedPercent = totalClaims > 0 ? ((stats.releasedClaims || 0) / totalClaims * 100).toFixed(1) : 0;
  const pendingPercent = totalClaims > 0 ? ((stats.pendingClaims || 0) / totalClaims * 100).toFixed(1) : 0;
  const cancelledPercent = totalClaims > 0 ? ((stats.cancelledClaims || 0) / totalClaims * 100).toFixed(1) : 0;

  const statusData = [
    { name: "Released", value: stats.releasedClaims || 0, color: "#10b981" },
    { name: "Pending", value: stats.pendingClaims || 0, color: "#f59e0b" },
    { name: "Cancelled", value: stats.cancelledClaims || 0, color: "#ef4444" },
  ];

  const trendData = [
    { name: "Total", value: stats.totalPatients || 0 },
    { name: "Released", value: stats.releasedClaims || 0 },
    { name: "Pending", value: stats.pendingClaims || 0 },
    { name: "Cancelled", value: stats.cancelledClaims || 0 },
  ];

  const comparisonData = [
    { name: "Patients", value: stats.totalPatients || 0 },
    { name: "Claims", value: totalClaims },
    { name: "CoPayments", value: stats.totalCoPaymentCount || 0 },
  ];

  const pieData = [
    { name: "Released", value: stats.releasedClaims || 0, color: "#10b981" },
    { name: "Pending", value: stats.pendingClaims || 0, color: "#f59e0b" },
    { name: "Cancelled", value: stats.cancelledClaims || 0, color: "#ef4444" },
  ];

  const coPaymentData = [
    { name: "Total Amount", value: parseFloat((stats.totalCoPayment || 0) / 1000) || 0 },
    { name: "Count", value: stats.totalCoPaymentCount || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Claims Dashboard</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          
          <StatCard label="Total Patients" value={stats.totalPatients || 0} />
          <StatCard label="Released" value={stats.releasedClaims || 0} percent={releasedPercent} />
          <StatCard label="Pending" value={stats.pendingClaims || 0} percent={pendingPercent} />
          <StatCard label="Cancelled" value={stats.cancelledClaims || 0} percent={cancelledPercent} />
          <StatCard label="Total CoPayment" value={formatLargeNumber(stats.totalCoPayment)} />
          <StatCard label="CoPayment Count" value={stats.totalCoPaymentCount || 0} />
          
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Bar Chart - Status Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Status Breakdown</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 13, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                  />
                  <YAxis 
                    tick={{ fontSize: 13, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={100}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      style={{ fontSize: 14, fontWeight: 600, fill: '#111827' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart - Trend */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Claims Trend</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 13, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                  />
                  <YAxis 
                    tick={{ fontSize: 13, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  >
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      style={{ fontSize: 14, fontWeight: 600, fill: '#111827' }}
                      offset={10}
                    />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Area Chart - Overall Comparison */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Overall Comparison</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={comparisonData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 13, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                  />
                  <YAxis 
                    tick={{ fontSize: 13, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)"
                  >
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      style={{ fontSize: 14, fontWeight: 600, fill: '#111827' }}
                      offset={10}
                    />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Horizontal Bar Chart - CoPayment Analysis */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">CoPayment Analysis</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coPaymentData} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 13, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                  />
                  <YAxis 
                    type="category"
                    dataKey="name" 
                    tick={{ fontSize: 13, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]}>
                    <LabelList 
                      dataKey="value" 
                      position="right" 
                      style={{ fontSize: 14, fontWeight: 600, fill: '#111827' }}
                      formatter={(value) => value >= 1000 ? formatLargeNumber(value * 1000) : value}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p>Total Amount shows in K/M/B format. Count shows number of payments.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, percent }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-xs text-gray-500 mb-2">{label}</div>
      <div className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1">{value}</div>
      {percent !== undefined && (
        <div className="text-xs text-gray-600">{percent}% of total</div>
      )}
    </div>
  );
}