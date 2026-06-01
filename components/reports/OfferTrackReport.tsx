import React, { useEffect, useState } from "react";
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

interface OfferTrackItem {
  _id: string;
  invoiceNumber: string;
  invoicedDate: string;
  patientName: string;
  treatment: string;
  service: string;
  offerName: string | null;
  offerType: string | null;
  offerDiscountPercent: number;
  offerDiscountAmount: number;
  instantDiscountValue: number | null;
  cashbackEarned: number;
  cashbackWalletUsed: number;
  freeSessionNames: string;
  bundleSessionsAdded: number;
  agentDiscount: { type: string; amount: number } | null;
  doctorDiscount: { type: string; amount: number } | null;
  membershipDiscount: number | null;
  offerAppliedBy: string;
  cashbackValidity: {
    startDate: string;
    endDate: string;
    isExpired: boolean;
  } | null;
  originalAmount: number;
  finalAmount: number;
  totalDiscount: number;
  paid: number;
  paymentMethod: string;
  pending: number;
  // Refund fields
  isOfferRefunded?: boolean;
  refundedAt?: string;
  refundedBy?: string;
  refundedAmount?: number;
  // Used free sessions
  usedFreeSessions?: string[];
  usedFreeSessionCount?: number;
  usedFreeSessionNames?: string;
}

interface Summary {
  totalBillings: number;
  totalOfferDiscount: number;
  totalCashbackEarned: number;
  totalAgentDiscount: number;
  totalDoctorDiscount: number;
  totalBundleSessions: number;
  instantDiscountCount: number;
  cashbackCount: number;
  bundleCount: number;
}

interface Props {
  startDate: string;
  endDate: string;
  headers: HeadersRecord;
  canUpdate?: boolean;
}

const OFFER_TYPE_COLORS: Record<string, string> = {
  instant_discount: "#10B981",
  cashback: "#F59E0B",
  bundle: "#8B5CF6",
};

const OFFER_TYPE_LABELS: Record<string, string> = {
  instant_discount: "Instant Discount",
  cashback: "Cashback",
  bundle: "Bundle",
};

export default function OfferTrackReport({ startDate, endDate, headers, canUpdate = false }: Props) {
  const [data, setData] = useState<OfferTrackItem[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalBillings: 0,
    totalOfferDiscount: 0,
    totalCashbackEarned: 0,
    totalAgentDiscount: 0,
    totalDoctorDiscount: 0,
    totalBundleSessions: 0,
    instantDiscountCount: 0,
    cashbackCount: 0,
    bundleCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOfferType, setFilterOfferType] = useState<string>("all");
  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<OfferTrackItem | null>(null);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState<string | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        page: page.toString(),
        pageSize: "20",
      });
      if (filterOfferType !== "all") {
        params.set("offerType", filterOfferType);
      }
      const res = await fetch(`/api/clinic/offer-track-report?${params}`, { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data || []);
        setSummary(json.summary || {});
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching offer track data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, page, filterOfferType]);

  // Filter data by search term
  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.patientName?.toLowerCase().includes(search) ||
      item.treatment?.toLowerCase().includes(search) ||
      item.offerName?.toLowerCase().includes(search) ||
      item.invoiceNumber?.toLowerCase().includes(search) ||
      item.offerAppliedBy?.toLowerCase().includes(search)
    );
  });

  // Chart data
  const offerTypeChartData = [
    { name: "Instant Discount", count: summary.instantDiscountCount, color: OFFER_TYPE_COLORS.instant_discount },
    { name: "Cashback", count: summary.cashbackCount, color: OFFER_TYPE_COLORS.cashback },
    { name: "Bundle", count: summary.bundleCount, color: OFFER_TYPE_COLORS.bundle },
  ].filter((d) => d.count > 0);

  const appliedByData = React.useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((item) => {
      const name = item.offerAppliedBy || "Unknown";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [data]);

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getOfferTypeBadge = (type: string | null) => {
    if (!type) return null;
    const color = OFFER_TYPE_COLORS[type] || "#6B7280";
    const label = OFFER_TYPE_LABELS[type] || type;
    return (
      <span
        className="px-2 py-1 rounded text-xs font-medium text-white"
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
    );
  };

  const handleRefund = async () => {
    if (!selectedBilling) return;

    setProcessingRefund(true);
    setRefundError(null);
    setRefundSuccess(null);

    try {
      const response = await fetch('/api/clinic/offer-refund', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billingId: selectedBilling._id }),
      });

      const json = await response.json();

      if (response.ok && json.success) {
        const summary = json.data?.summary;
        let successMsg = 'Refund processed successfully!';
        
        if (summary) {
          if (summary.cashbackAction === 'REVOKED') {
            successMsg += ` ${currency(summary.cashbackAmount)} cashback revoked from wallet.`;
          } else if (summary.cashbackAction === 'RESTORED') {
            successMsg += ` ${currency(summary.cashbackAmount)} cashback restored to wallet.`;
          }
        }
        
        if (json.data.freeSessionsRestored > 0) {
          successMsg += ` ${json.data.freeSessionsRestored} free session(s) restored.`;
        }
        
        if (json.data.freeSessionsRemoved > 0) {
          successMsg += ` ${json.data.freeSessionsRemoved} free session(s) removed.`;
        }
        
        setRefundSuccess(successMsg);
        
        // Refresh the data after successful refund
        setTimeout(() => {
          fetchData();
          setShowRefundModal(false);
          setSelectedBilling(null);
        }, 3000);
      } else {
        setRefundError(json.message || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      setRefundError('An error occurred while processing the refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Offer Billings</div>
          <div className="text-2xl font-bold text-teal-600">{summary.totalBillings}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Offer Discount</div>
          <div className="text-2xl font-bold text-green-600">{currency(summary.totalOfferDiscount)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Cashback Earned</div>
          <div className="text-2xl font-bold text-amber-600">{currency(summary.totalCashbackEarned)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Bundle Sessions Added</div>
          <div className="text-2xl font-bold text-purple-600">{summary.totalBundleSessions}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Agent Discount</div>
          <div className="text-2xl font-bold text-blue-600">{currency(summary.totalAgentDiscount)}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Offer Type Distribution */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Offer Type Distribution</h3>
          {offerTypeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={offerTypeChartData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent: p }) => `${name} (${((p || 0) * 100).toFixed(0)}%)`}
                >
                  {offerTypeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No offer data available</p>
          )}
        </div>

        {/* Applied By Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Who Applied Offers</h3>
          {appliedByData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={appliedByData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#2D9AA5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by patient, treatment, offer, invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterOfferType}
            onChange={(e) => setFilterOfferType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Offer Types</option>
            <option value="instant_discount">Instant Discount</option>
            <option value="cashback">Cashback</option>
            <option value="bundle">Bundle</option>
          </select>
          <ExportButtons data={filteredData} filename="offer-track-report" title="Offer Track Report" />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Treatment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Offer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Agent Disc.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Cashback</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Free Sessions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Free Sessions Used</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Applied By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Original</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Final</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-8 text-center text-gray-500">
                    No offer track records found
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{formatDate(item.invoicedDate)}</td>
                    <td className="px-4 py-2 text-sm font-medium">{item.invoiceNumber}</td>
                    <td className="px-4 py-2 text-sm">{item.patientName || "-"}</td>
                    <td className="px-4 py-2 text-sm">{item.treatment || "-"}</td>
                    <td className="px-4 py-2 text-sm font-medium">{item.offerName || "-"}</td>
                    <td className="px-4 py-2">{getOfferTypeBadge(item.offerType)}</td>
                    <td className="px-4 py-2 text-sm">
                      {item.offerDiscountAmount > 0 && (
                        <div>
                          {item.offerDiscountPercent > 0 && `${item.offerDiscountPercent}%`}
                          <span className="text-gray-500 ml-1">{currency(item.offerDiscountAmount)}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {item.agentDiscount && item.agentDiscount.amount > 0 && (
                        <span className="text-blue-600">
                          {item.agentDiscount.type === "percent" ? `${item.agentDiscount.amount}%` : currency(item.agentDiscount.amount)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-amber-600">
                      {item.cashbackEarned > 0 && (
                        <div>
                          <span className="font-medium">+{currency(item.cashbackEarned)}</span>
                          {item.cashbackValidity && (
                            <div className="text-xs text-gray-400">
                              {item.cashbackValidity.isExpired ? "Expired" : `Valid until ${formatDate(item.cashbackValidity.endDate)}`}
                            </div>
                          )}
                        </div>
                      )}
                      {item.cashbackWalletUsed > 0 && (
                        <div className="text-green-600">
                          <span className="font-medium">-{currency(item.cashbackWalletUsed)}</span>
                          <div className="text-xs text-gray-400">Wallet Used</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-purple-600">
                      {item.freeSessionNames || (item.bundleSessionsAdded > 0 ? `${item.bundleSessionsAdded} sessions` : "-")}
                    </td>
                    <td className="px-4 py-2 text-sm text-purple-600">
                      {item.usedFreeSessionNames || (item.usedFreeSessionCount && item.usedFreeSessionCount > 0 ? `${item.usedFreeSessionCount} sessions` : "-")}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className="font-medium text-teal-600">{item.offerAppliedBy || "-"}</span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">{currency(item.originalAmount)}</td>
                    <td className="px-4 py-2 text-sm font-medium">{currency(item.finalAmount)}</td>
                    <td className="px-4 py-2 text-sm">
                      {canUpdate ? (
                        item.isOfferRefunded ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-medium">
                            Refunded
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedBilling(item);
                              setShowRefundModal(true);
                              setRefundError(null);
                              setRefundSuccess(null);
                            }}
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          >
                            Refund
                          </button>
                        )
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded font-medium">
                          No Permission
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Refund Confirmation Modal */}
      {showRefundModal && selectedBilling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Offer Refund</h3>
              
              <div className="space-y-3 mb-6">
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm text-gray-600">Invoice: <span className="font-medium">{selectedBilling.invoiceNumber}</span></p>
                  <p className="text-sm text-gray-600">Patient: <span className="font-medium">{selectedBilling.patientName}</span></p>
                  <p className="text-sm text-gray-600">Offer: <span className="font-medium">{selectedBilling.offerName || '-'}</span></p>
                  <p className="text-sm text-gray-600">Type: <span className="font-medium">{OFFER_TYPE_LABELS[selectedBilling.offerType || ''] || selectedBilling.offerType}</span></p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <p className="text-sm text-amber-800 font-medium mb-2">The following will happen on refund:</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {selectedBilling.cashbackEarned > 0 && (
                      <li className="text-red-600">⚠️ Cashback earned: {currency(selectedBilling.cashbackEarned)} will be REVOKED from wallet</li>
                    )}
                    {selectedBilling.cashbackWalletUsed > 0 && (
                      <li className="text-green-600">✓ Cashback wallet usage: {currency(selectedBilling.cashbackWalletUsed)} will be RESTORED to wallet</li>
                    )}
                    {selectedBilling.offerType === 'bundle' && selectedBilling.freeSessionNames && (
                      <li className="text-red-600">⚠️ Free sessions granted: {selectedBilling.freeSessionNames} will be REMOVED</li>
                    )}
                    {selectedBilling.usedFreeSessionNames && (
                      <li className="text-green-600">✓ Used free sessions will be RESTORED: {selectedBilling.usedFreeSessionNames}</li>
                    )}
                    {selectedBilling.offerDiscountAmount > 0 && (
                      <li>ℹ️ Discount recorded: {currency(selectedBilling.offerDiscountAmount)}</li>
                    )}
                  </ul>
                </div>

                {refundSuccess && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {refundSuccess}
                  </div>
                )}

                {refundError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {refundError}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRefund}
                  disabled={processingRefund}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingRefund ? 'Processing...' : 'Confirm Refund'}
                </button>
                <button
                  onClick={() => {
                    setShowRefundModal(false);
                    setSelectedBilling(null);
                    setRefundError(null);
                    setRefundSuccess(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}