import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import ExportButtons from "./ExportButtons";

type HeadersRecord = Record<string, string>;

interface Props {
  startDate: string;
  endDate: string;
  headers: HeadersRecord;
}

interface StockItem {
  _id: string;
  name: string;
  code: string;
  description: string;
  type: string;
  brand: string;
  dosage: string;
  strength: string;
  status: string;
  currentQuantity: number;
  minQuantity: number;
  maxQuantity: number;
  vatPercentage: number;
  level0: {
    costPrice: number;
    uom: string;
    salePrice: number;
  };
  packagingStructure?: {
    level1?: { multiplier: number; costPrice: number; uom: string; salePrice: number };
    level2?: { multiplier: number; costPrice: number; uom: string; salePrice: number };
  };
}





interface SupplierStats {
  name: string;
  count: number;
}

interface OverallStats {
  totalInvoice: number;
  totalPaid: number;
  totalBalance: number;
  totalOpeningBalance: number;
}

interface OpeningBalanceByType {
  name: string;
  total: number;
}

interface TopSupplier {
  name: string;
  invoiceTotal: number;
}

function SupplierReport({ startDate, endDate, headers }: Props) {
  const [loading, setLoading] = useState(false);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [statusStats, setStatusStats] = useState<SupplierStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [openingBalanceByType, setOpeningBalanceByType] = useState<OpeningBalanceByType[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<TopSupplier[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clinic/reports/supplier`, { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        setTotalSuppliers(json.data.totalSuppliers);
        setStatusStats(json.data.statusStats);
        setOverallStats(json.data.overallStats);
        setOpeningBalanceByType(json.data.openingBalanceByType);
        setTopSuppliers(json.data.topSuppliers);
      }
    } finally {
      setLoading(false);
    }
  }

  const supplierExportData = useMemo(() => {
    const summary = [{
      "Category": "Supplier Summary",
      "Total Suppliers": totalSuppliers,
      "Total Invoice": Math.round(overallStats?.totalInvoice || 0),
      "Total Paid": Math.round(overallStats?.totalPaid || 0),
      "Total Balance": Math.round(overallStats?.totalBalance || 0),
    }];

    const topList = topSuppliers.map(s => ({
      "Category": "Top Supplier",
      "Name": s.name || "-",
      "Invoice Total": s.invoiceTotal || 0,
    }));

    const statusList = statusStats.map(s => ({
      "Category": "Supplier Status",
      "Name": s.name || "-",
      "Count": s.count || 0,
    }));

    return [...summary, ...topList, ...statusList];
  }, [totalSuppliers, overallStats, topSuppliers, statusStats]);

  if (loading) return <div className="p-10 text-center">Loading Supplier Report...</div>;

  const graphData = [
    {
      name: "Active/Inactive",
      ...statusStats.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.count }), {}),
    },
    {
      name: "Balances",
      "Invoice Total": overallStats?.totalInvoice,
      "Total Paid": overallStats?.totalPaid,
      "Total Balance": overallStats?.totalBalance,
    },
    ...openingBalanceByType.map(item => ({
      name: "Opening Balance",
      [item.name]: item.total,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButtons
          data={supplierExportData}
          filename={`supplier_report_${startDate}_to_${endDate}`}
          headers={["Category", "Name/Count", "Value/Total"]}
          title="Supplier Performance Report"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Suppliers</p>
          <h3 className="text-2xl font-bold text-gray-800">{totalSuppliers}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-semibold mb-4 text-gray-800">Supplier Overview</h4>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Legend />
                <Bar dataKey="Active" stackId="a" fill="#82ca9d" />
                <Bar dataKey="Inactive" stackId="a" fill="#8884d8" />
                <Bar dataKey="Invoice Total" fill="#ffc658" />
                <Bar dataKey="Total Paid" fill="#82ca9d" />
                <Bar dataKey="Total Balance" fill="#8884d8" />
                <Bar dataKey="Debit" fill="#00C49F" />
                <Bar dataKey="Credit" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-semibold mb-4 text-gray-800">Top 5 Most Invoiced Suppliers</h4>
          <ul className="space-y-4">
            {topSuppliers.map((supplier, index) => (
              <li key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{supplier.name}</span>
                <span className="font-bold text-gray-800">{supplier.invoiceTotal.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}


export default function StockReport({ startDate, endDate, headers }: Props) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<StockItem[]>([]);
  const [typeStats, setTypeStats] = useState<{ name: string; count: number }[]>([]);
  const [statusStats, setStatusStats] = useState<{ name: string; count: number }[]>([]);
  const [uomTimeline, setUomTimeline] = useState<{ date: string; total: number; main: number; sub: number }[]>([]);
  const [locationStats, setLocationStats] = useState<{ 
    total: number; 
    statusStats: { name: string; count: number }[];
    locations: any[];
  }>({ total: 0, statusStats: [], locations: [] });
  const [detailedPurchaseRequests, setDetailedPurchaseRequests] = useState<any[]>([]);
  const [grnStats, setGrnStats] = useState<{
    total: number;
    sourceStats: { name: string; count: number }[];
    statusStats: { name: string; count: number }[];
    recentInvoicedGRNs: any[];
  }>({ total: 0, sourceStats: [], statusStats: [], recentInvoicedGRNs: [] });
  const [purchaseInvoiceStats, setPurchaseInvoiceStats] = useState<{
    total: number;
    statusStats: { name: string; count: number }[];
    recentInvoices: any[];
    topPaidGRNs: any[];
  }>({ total: 0, statusStats: [], recentInvoices: [], topPaidGRNs: [] });
  const [consumptionStats, setConsumptionStats] = useState<{
    records: any[];
    itemBreakdown: any[];
    doctorStats: any[];
  }>({ records: [], itemBreakdown: [], doctorStats: [] });
  const [allocationStats, setAllocationStats] = useState<{
    statusStats: { name: string; count: number }[];
    userStats: { name: string; totalAllocated: number; totalUsed: number }[];
  }>({ statusStats: [], userStats: [] });
  const [transferStats, setTransferStats] = useState<{
    records: any[];
    statusStats: { name: string; count: number }[];
  }>({ records: [], statusStats: [] });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPISidebarOpen, setIsPISidebarOpen] = useState(false);
  const [isPRSidebarOpen, setIsPRSidebarOpen] = useState(false);
  const [isLowStockSidebarOpen, setIsLowStockSidebarOpen] = useState(false);
  const [summary, setSummary] = useState({ 
    totalItems: 0, 
    totalQuantity: 0, 
    totalUOMs: 0, 
    totalLocations: 0,
    totalPurchaseRequests: 0,
    totalGRNs: 0,
    totalPurchaseInvoices: 0,
    totalConsumptions: 0,
    totalTransfers: 0
  });
  const [minQtyFilter, setMinQtyFilter] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clinic/reports/stock-performance`, { headers });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setItems([]); setTypeStats([]); setStatusStats([]); setUomTimeline([]);
        setLocationStats({ total: 0, statusStats: [], locations: [] });
        return;
      }
      setItems(json.data.items || []);
      setTypeStats(json.data.typeStats || []);
      setStatusStats(json.data.statusStats || []);
      setUomTimeline(json.data.uomTimeline || []);
      setLocationStats(json.data.locationStats || { total: 0, statusStats: [], locations: [] });
      setDetailedPurchaseRequests(json.data.detailedPurchaseRequests || []);
      setGrnStats(json.data.grnStats || { total: 0, sourceStats: [], statusStats: [], recentInvoicedGRNs: [] });
      setPurchaseInvoiceStats(json.data.purchaseInvoiceStats || { total: 0, statusStats: [], recentInvoices: [], topPaidGRNs: [] });
      setConsumptionStats(json.data.consumptionStats || { records: [], itemBreakdown: [], doctorStats: [] });
        setAllocationStats(json.data.allocationStats || { statusStats: [], userStats: [] });
        setTransferStats(json.data.transferStats || { records: [], statusStats: [] });
        setSummary(json.data.summary || { 
          totalItems: 0, 
          totalQuantity: 0, 
          totalUOMs: 0, 
          totalLocations: 0,
          totalPurchaseRequests: 0,
          totalGRNs: 0,
          totalPurchaseInvoices: 0,
          totalConsumptions: 0,
          totalTransfers: 0
        });
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesQty = item.currentQuantity >= minQtyFilter;
      return matchesSearch && matchesQty;
    });
  }, [items, minQtyFilter, searchTerm]);

  const maxPossibleQty = useMemo(() => {
    if (items.length === 0) return 100;
    const maxQty = Math.max(...items.map(i => i.currentQuantity || 0));
    return Math.max(maxQty, 100);
  }, [items]);

  const stockExportData = useMemo(() => {
    return items.map((item) => ({
      "Item Name": item.name || "-",
      "Code": item.code || "-",
      "Type": item.type || "-",
      "Brand": item.brand || "-",
      "Current Quantity": item.currentQuantity || 0,
      "Min Quantity": item.minQuantity || 0,
      "Max Quantity": item.maxQuantity || 0,
      "Cost Price": item.level0?.costPrice || 0,
      "Sale Price": item.level0?.salePrice || 0,
      "Status": item.status || "-",
    }));
  }, [items]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1", "#a4de6c", "#d0ed57"];

  if (loading) return <div className="p-10 text-center">Loading Stock Report...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButtons
          data={stockExportData}
          filename={`stock_report_${startDate}_to_${endDate}`}
          headers={["Item Name", "Code", "Type", "Brand", "Current Quantity", "Min Quantity", "Max Quantity", "Cost Price", "Sale Price", "Status"]}
          title="Stock Inventory Report"
        />
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Stock Items</p>
          <h3 className="text-2xl font-bold text-gray-800">{summary.totalItems}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Quantity in Hand</p>
          <h3 className="text-2xl font-bold text-gray-800">{summary.totalQuantity}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total UOMs</p>
          <h3 className="text-2xl font-bold text-blue-600">{summary.totalUOMs}</h3>
        </div>
        <div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-orange-300 transition-colors"
          onClick={() => setIsPRSidebarOpen(true)}
        >
          <p className="text-sm text-gray-500 mb-1">Purchase Requests</p>
          <h3 className="text-2xl font-bold text-orange-600">{summary.totalPurchaseRequests}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Stock Locations</p>
          <h3 className="text-2xl font-bold text-purple-600">{summary.totalLocations}</h3>
        </div>
        <div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-green-300 transition-colors"
          onClick={() => setIsSidebarOpen(true)}
        >
          <p className="text-sm text-gray-500 mb-1">Total GRNs</p>
          <h3 className="text-2xl font-bold text-green-600">{summary.totalGRNs}</h3>
        </div>
        <div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-blue-300 transition-colors"
          onClick={() => setIsPISidebarOpen(true)}
        >
          <p className="text-sm text-gray-500 mb-1">Total GRN Invoice</p>
          <h3 className="text-2xl font-bold text-blue-600">{summary.totalPurchaseInvoices}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Consumptions</p>
          <h3 className="text-2xl font-bold text-indigo-600">{summary.totalConsumptions}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Stock Transfers</p>
          <h3 className="text-2xl font-bold text-teal-600">{summary.totalTransfers}</h3>
        </div>
        <div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-red-300 transition-colors"
          onClick={() => setIsLowStockSidebarOpen(true)}
        >
          <p className="text-sm text-gray-500 mb-1">Low Stock Alerts</p>
          <h3 className="text-2xl font-bold text-red-600">
            {items.filter(i => (i.currentQuantity || 0) <= (i.minQuantity || 0)).length}
          </h3>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Item Name or Code
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D9AA5]"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Filter by Minimum Quantity: <span className="font-bold text-[#2D9AA5]">{minQtyFilter}</span>
              </label>
              <button 
                onClick={() => { setMinQtyFilter(0); setSearchTerm(""); }}
                className="text-xs text-[#2D9AA5] hover:underline"
              >
                Reset Filters
              </button>
            </div>
            <input
              type="range"
              min="0"
              max={maxPossibleQty}
              value={minQtyFilter}
              onChange={(e) => setMinQtyFilter(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2D9AA5]"
            />
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500 italic">
          Showing {filteredItems.length} of {items.length} items
        </div>
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-semibold mb-4 text-gray-800">Top 10 Items by Quantity (Line Graph)</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={items.slice(0, 10)} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36}/>
                <Line 
                  type="monotone" 
                  dataKey="currentQuantity" 
                  name="Qty In Hand" 
                  stroke="#2D9AA5" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2D9AA5" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-semibold mb-4 text-gray-800">Status Overview</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2D9AA5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* UOM Timeline Bar Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h4 className="text-lg font-semibold mb-4 text-gray-800">UOM Growth Timeline</h4>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={uomTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 12}} 
                minTickGap={30}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Bar dataKey="total" name="Total UOMs" fill="#2D9AA5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="main" name="Main Category" fill="#0088FE" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sub" name="Sub Category" fill="#FFBB28" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-lg font-semibold text-gray-800">Detailed Inventory Report</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Dosage/Strength</th>
                <th className="px-4 py-3">Qty In Hand</th>
                <th className="px-4 py-3">Min/Max</th>
                <th className="px-4 py-3">Cost Price</th>
                <th className="px-4 py-3">Sale Price</th>
                <th className="px-4 py-3">UOM</th>
                <th className="px-4 py-3">VAT %</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredItems.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.code || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.type === 'Stock' ? 'bg-blue-100 text-blue-700' :
                      item.type === 'Service' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.brand || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.dosage} {item.strength}
                  </td>
                  <td className={`px-4 py-3 font-bold ${item.currentQuantity <= item.minQuantity ? 'text-red-600' : 'text-green-600'}`}>
                    {item.currentQuantity}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.minQuantity} / {item.maxQuantity}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {item.level0.costPrice}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {item.level0.salePrice}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.level0.uom}</td>
                  <td className="px-4 py-3 text-gray-500">{item.vatPercentage}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                    No items found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Location Report Section */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-xl font-bold text-gray-800 mb-6">Stock Location Analysis</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Location Status Graph */}
            <div className="space-y-4">
              <h5 className="text-md font-semibold text-gray-700">Location Distribution by Status</h5>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={locationStats.statusStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {locationStats.statusStats.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Location Summary Stats */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Locations</p>
                  <p className="text-2xl font-bold text-gray-800">{locationStats.total}</p>
                </div>
                {locationStats.statusStats.map((stat, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{stat.name} Locations</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GRN Analysis Section */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-xl font-bold text-gray-800 mb-6">GRN Analysis (Goods Received Note)</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* GRN Source Graph */}
            <div className="space-y-4">
              <h5 className="text-md font-semibold text-gray-700">GRN Distribution by Source (PO vs Request)</h5>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={grnStats.sourceStats} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
                    <YAxis allowDecimals={false} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#2D9AA5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GRN Status Data Breakdown */}
            <div className="space-y-6">
              <h5 className="text-md font-semibold text-gray-700">GRN Status Breakdown</h5>
              <div className="grid grid-cols-2 gap-4">
                {grnStats.statusStats.map((stat, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{stat.name} Status</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.count}</p>
                  </div>
                ))}
              </div>

              {/* Status Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {grnStats.statusStats.map((stat, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            stat.name === 'New' ? 'bg-blue-100 text-blue-700' :
                            stat.name === 'Paid' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {stat.name}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-800 font-bold">{stat.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Invoice Analysis Section */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-xl font-bold text-gray-800 mb-6">Purchase Invoice Analysis</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Status Graph */}
            <div className="space-y-4">
              <h5 className="text-md font-semibold text-gray-700">Invoice Distribution by Status</h5>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={purchaseInvoiceStats.statusStats} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
                    <YAxis allowDecimals={false} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#2D9AA5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* High Paid GRNs Table */}
            <div className="space-y-4">
              <h5 className="text-md font-semibold text-gray-700">Top 5 Highest Paid GRNs & Remaining Balance</h5>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2">GRN No</th>
                      <th className="px-3 py-2">Supplier</th>
                      <th className="px-3 py-2 text-right">Paid Amount</th>
                      <th className="px-3 py-2 text-right">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {purchaseInvoiceStats.topPaidGRNs.map((pi: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-medium text-blue-600">{pi.grn?.grnNo || "N/A"}</td>
                        <td className="px-3 py-2 text-gray-600 truncate max-w-[100px]">{pi.supplier?.name || "Unknown"}</td>
                        <td className="px-3 py-2 text-right font-bold text-green-600">{pi.paidAmount?.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-bold text-red-600">{pi.remainingAmount?.toLocaleString()}</td>
                      </tr>
                    ))}
                    {purchaseInvoiceStats.topPaidGRNs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-gray-400 italic">No invoice data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Record Type Analysis Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h4 className="text-xl font-bold text-gray-800 mb-6">Stock Type Distribution (Dot Graph)</h4>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis dataKey="name" name="Type" type="category" />
              <YAxis dataKey="count" name="Count" unit=" items" />
              <ZAxis range={[100, 1000]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Stock Types" data={typeStats} fill="#8884d8">
                {typeStats.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Material Consumption Analysis Section */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-xl font-bold text-gray-800 mb-6">Material Consumption Report</h4>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Top Consumed Items Breakdown */}
            <div className="xl:col-span-1 space-y-4">
              <h5 className="text-md font-semibold text-gray-700">Top 10 Consumed Items</h5>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2">Item Name</th>
                      <th className="px-3 py-2 text-right">Qty Consumed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {consumptionStats.itemBreakdown.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-medium text-gray-800">{item.name}</td>
                        <td className="px-3 py-2 text-right font-bold text-indigo-600">{item.totalConsumed} {item.uom}</td>
                      </tr>
                    ))}
                    {consumptionStats.itemBreakdown.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-3 py-6 text-center text-gray-400 italic">No consumption data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Consumption Records Table */}
            <div className="xl:col-span-2 space-y-4">
              <h5 className="text-md font-semibold text-gray-700">Recent Consumption Records</h5>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 whitespace-nowrap">Record No</th>
                      <th className="px-3 py-2 whitespace-nowrap">Date</th>
                      <th className="px-3 py-2 whitespace-nowrap">Doctor</th>
                      <th className="px-3 py-2 whitespace-nowrap">Room</th>
                      <th className="px-3 py-2 whitespace-nowrap">Status</th>
                      <th className="px-3 py-2 text-right whitespace-nowrap">Items</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {consumptionStats.records.map((record: any) => (
                      <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 font-bold text-indigo-600">{record.materialConsumptionNo}</td>
                        <td className="px-3 py-2">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2">{record.doctor?.name || "N/A"}</td>
                        <td className="px-3 py-2">{record.room?.name || "N/A"}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                            record.status === 'Verified' ? 'bg-green-100 text-green-700' :
                            record.status === 'New' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold">{record.items?.length || 0} items</span>
                            <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                              {record.items?.map((i: any) => i.name).join(", ")}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {consumptionStats.records.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-10 text-center text-gray-500 italic">
                          No material consumption records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Material Consumption Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-xl font-bold text-gray-800 mb-6">Material Consumption by Doctor</h4>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumptionStats.doctorStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="totalItemsConsumed" 
                  name="Total Items Consumed" 
                  fill="#4F46E5" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="totalRecords" 
                  name="Consumption Records" 
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Allocated Stock Item Analysis Section */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-xl font-bold text-gray-800 mb-6">Allocated Stock Analysis</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Status Graph */}
            <div className="space-y-4">
              <h5 className="text-md font-semibold text-gray-700">Allocation Distribution by Status</h5>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allocationStats.statusStats} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
                    <YAxis allowDecimals={false} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#2D9AA5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Allocation Graph */}
            <div className="space-y-4">
              <h5 className="text-md font-semibold text-gray-700">Top 10 User-wise Allocations & Usage</h5>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allocationStats.userStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalAllocated" name="Total Allocated" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="totalUsed" name="Total Used" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Stock Transfer Analysis Section */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-xl font-bold text-gray-800 mb-6">Direct Stock Transfer Analysis</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Status Graph */}
            <div className="lg:col-span-1 space-y-4">
              <h5 className="text-md font-semibold text-gray-700">Transfer Status Distribution</h5>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transferStats.statusStats} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
                    <YAxis allowDecimals={false} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#2D9AA5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transfer Records Table */}
            <div className="lg:col-span-2 space-y-4">
              <h5 className="text-md font-semibold text-gray-700">Recent Stock Transfer Records</h5>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2">Transfer No</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">From Branch</th>
                      <th className="px-3 py-2">To Branch</th>
                      <th className="px-3 py-2">Transferred By</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Items</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transferStats.records.map((record: any) => (
                      <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 font-bold text-teal-600">{record.directStockTransferNo}</td>
                        <td className="px-3 py-2">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2">{record.fromBranch?.name || "N/A"}</td>
                        <td className="px-3 py-2">{record.toBranch?.name || "N/A"}</td>
                        <td className="px-3 py-2">{record.createdBy?.name || "N/A"}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                            record.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            record.status === 'Draft' ? 'bg-gray-100 text-gray-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="font-bold">{record.items?.length || 0} items</span>
                        </td>
                      </tr>
                    ))}
                    {transferStats.records.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-10 text-center text-gray-500 italic">
                          No stock transfer records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SupplierReport startDate={startDate} endDate={endDate} headers={headers} />

      {/* Sidebar for Low Stock Alerts */}
      <AnimatePresence>
        {isLowStockSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLowStockSidebarOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-[60] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Low Stock Items</h3>
                  <button
                    onClick={() => setIsLowStockSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-3">
                  {items.filter(i => (i.currentQuantity || 0) <= (i.minQuantity || 0)).length > 0 ? (
                    items.filter(i => (i.currentQuantity || 0) <= (i.minQuantity || 0)).map((item: any) => (
                      <div key={item._id} className="p-4 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-red-800">{item.name}</p>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-600">{item.currentQuantity}</p>
                            <p className="text-[10px] text-gray-500">Min: {item.minQuantity}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500 italic">No items are currently low on stock.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar for Purchase Requests */}
      <AnimatePresence>
        {isPRSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPRSidebarOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-[60] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Purchase Requests</h3>
                  <button
                    onClick={() => setIsPRSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {detailedPurchaseRequests.length > 0 ? (
                  <div className="space-y-4">
                    {detailedPurchaseRequests.map((pr: any) => (
                      <div key={pr._id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-orange-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            {pr.orderNo}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(pr.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-700">
                            Requested By: {pr.createdBy?.name || "Unknown"}
                          </p>
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 mb-1">Items Requested:</p>
                            <ul className="list-disc list-inside text-xs text-gray-500 pl-2">
                              {pr.items?.map((item: any, idx: number) => (
                                <li key={idx} className="truncate">
                                  {item.itemId?.name || "Unknown Item"} - Qty: {item.quantity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500 italic">No purchase requests found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar for Recent Invoiced GRNs */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-[60] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Recent Invoiced GRNs</h3>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {grnStats.recentInvoicedGRNs.length > 0 ? (
                  <div className="space-y-4">
                    {grnStats.recentInvoicedGRNs.map((grn: any) => (
                      <div key={grn._id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-green-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                            {grn.grnNo}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(grn.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-700">
                            Invoice: {grn.supplierInvoiceNo}
                          </p>
                          <p className="text-xs text-gray-500">
                            Ref: {grn.purchasedOrder?.orderNo || "Direct GRN"}
                          </p>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                            <span className="text-[10px] text-gray-400">Items: {grn.items?.length || 0}</span>
                            <span className="text-xs font-bold text-gray-800">
                              {grn.items?.reduce((acc: number, item: any) => acc + (item.totalPrice || 0), 0).toLocaleString()} AED
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500 italic">No invoiced GRNs found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar for Recent Purchase Invoices */}
      <AnimatePresence>
        {isPISidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPISidebarOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-[60] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Recent GRN Invoices</h3>
                  <button
                    onClick={() => setIsPISidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {purchaseInvoiceStats.recentInvoices.length > 0 ? (
                  <div className="space-y-4">
                    {purchaseInvoiceStats.recentInvoices.map((pi: any) => (
                      <div key={pi._id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {pi.invoiceNo}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(pi.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-700">
                            Supplier: {pi.supplier?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500">
                            GRN: {pi.grn?.grnNo || "N/A"}
                          </p>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                            <span className="text-[10px] text-gray-400">Status: {pi.status}</span>
                            <span className="text-xs font-bold text-gray-800">
                              {pi.paidAmount?.toLocaleString()} / {(pi.paidAmount + pi.remainingAmount).toLocaleString()} AED
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500 italic">No purchase invoices found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
