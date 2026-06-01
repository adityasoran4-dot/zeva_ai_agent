import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
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

type RoomRow = {
  roomId: string;
  roomName: string;
  totalBookings: number;
  totalRevenue: number;
};

export default function RoomResourceReport({ startDate, endDate, headers }: Props) {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [top5Rooms, setTop5Rooms] = useState<RoomRow[]>([]);
  const [topRevenueRooms, setTopRevenueRooms] = useState<RoomRow[]>([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  async function fetchData() {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ startDate, endDate }).toString();
      const res = await fetch(`/api/clinic/reports/room-resource?${qs}`, { headers });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setRooms([]);
        setTop5Rooms([]);
        setTopRevenueRooms([]);
        return;
      }
      setRooms(json.data?.rooms || []);
      setTop5Rooms(json.data?.top5Rooms || []);
      setTopRevenueRooms(json.data?.topRevenueRooms || []);
    } finally {
      setLoading(false);
    }
  }

  const exportSections = useMemo(() => [
    {
      title: "All Room Performance",
      headers: ["Room Name", "Total Bookings", "Total Revenue (AED)"],
      data: rooms.map(r => ({
        "Room Name": r.roomName || "Unknown",
        "Total Bookings": r.totalBookings || 0,
        "Total Revenue (AED)": Math.round(r.totalRevenue || 0),
      })),
    },
    {
      title: "Top 5 Highest Booking Rooms",
      headers: ["Room Name", "Total Bookings"],
      data: top5Rooms.map(r => ({
        "Room Name": r.roomName || "Unknown",
        "Total Bookings": r.totalBookings || 0,
      })),
    },
    {
      title: "Highest Revenue Rooms",
      headers: ["Room Name", "Total Revenue (AED)"],
      data: topRevenueRooms.map(r => ({
        "Room Name": r.roomName || "Unknown",
        "Total Revenue (AED)": Math.round(r.totalRevenue || 0),
      })),
    },
  ], [rooms, top5Rooms, topRevenueRooms]);

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <ExportButtons
          sections={exportSections}
          filename={`room_report_${startDate}_to_${endDate}`}
          title="Room Performance Report"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Highest Revenue by Room</h3>
        <div className="w-full" style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={topRevenueRooms.map(r => ({ name: r.roomName, revenue: Math.round(r.totalRevenue || 0) }))}
              margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
              <YAxis tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} />
              <Tooltip formatter={(v: any) => currency(Number(v || 0))} />
              <Legend verticalAlign="top" height={36}/>
              <Bar dataKey="revenue" name="Total Revenue" fill="#2D9AA5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Room Bookings</h3>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Room Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Bookings</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rooms.map((r) => (
                <tr key={r.roomId}>
                  <td className="px-4 py-2 text-sm">{r.roomName}</td>
                  <td className="px-4 py-2 text-sm font-medium">{r.totalBookings}</td>
                  <td className="px-4 py-2 text-sm font-medium">{currency(r.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
