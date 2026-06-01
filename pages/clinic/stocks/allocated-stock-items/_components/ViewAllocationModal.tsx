import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  X,
  Package,
  User,
  Calendar,
  MapPin,
  Clock,
  Hash,
  Tag,
  Info,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserCircle2,
} from "lucide-react";
import { getAuthHeaders } from "@/lib/helper";

interface ViewAllocationModalProps {
  isOpen: boolean;
  allocationId?: string;
  onClose: () => void;
}

const ViewAllocationModal: React.FC<ViewAllocationModalProps> = ({
  isOpen,
  allocationId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  const headers = useMemo(() => getAuthHeaders() || {}, []);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!isOpen || !allocationId) return;
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(
          `/api/stocks/allocated-stock-items/${allocationId}`,
          { headers },
        );
        setData(res.data?.data || null);
      } catch (err: any) {
        const message =
          err?.response?.data?.message || "Failed to load allocation";
        setError(message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [isOpen, allocationId, headers]);

  if (!isOpen) return null;

  const close = () => {
    setData(null);
    setError(null);
    onClose();
  };

  const stock = data?.stockItem || data?.item?.itemId || data?.item || null;

  const statusLabel = (s?: string): string => {
    if (!s) return "-";
    if (s === "Issued") return "In Use";
    return s.replace("_", " ");
  };

  const statusConfig: Record<string, { color: string; bg: string; icon: any }> =
    {
      Allocated: { color: "text-blue-700", bg: "bg-blue-50", icon: Clock },
      Issued: { color: "text-yellow-700", bg: "bg-yellow-50", icon: Package },
      In_Use: { color: "text-yellow-700", bg: "bg-yellow-50", icon: Package },
      Used: { color: "text-green-700", bg: "bg-green-50", icon: CheckCircle2 },
      Partially_Used: {
        color: "text-purple-700",
        bg: "bg-purple-50",
        icon: Package,
      },
      Returned: { color: "text-gray-700", bg: "bg-gray-50", icon: Package },
      Expired: { color: "text-red-700", bg: "bg-red-50", icon: AlertCircle },
      Cancelled: { color: "text-gray-500", bg: "bg-gray-100", icon: X },
    };

  const config = data?.status
    ? statusConfig[data.status] || statusConfig.Allocated
    : statusConfig.Allocated;
  const StatusIcon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Allocation Details
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm mt-0.5 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                ID: {allocationId?.slice(-8) || "N/A"}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl p-2 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-ping" />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500 font-medium">
                Loading allocation details...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Failed to Load
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-sm">
                {error}
              </p>
              <button
                onClick={close}
                className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : !data ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Data Available
              </h3>
              <p className="text-sm text-gray-500">
                This allocation record could not be found.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Item Header Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {(stock?.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {stock?.name || "-"}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" />
                            Code: {stock?.code || "-"}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.color} border`}
                      >
                        <StatusIcon className="w-4 h-4 mr-1.5" />
                        {statusLabel(data?.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.isArray(data?.quantitiesByUom) &&
                  data.quantitiesByUom.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                          <Tag className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">
                            UOM Breakdown
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {data.quantitiesByUom.map((q: any, idx: number) => (
                              <span
                                key={`${q?.uom || "UOM"}-${idx}`}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                {q?.uom || "-"}: {q?.quantity ?? 0}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-lg font-bold text-gray-900">
                        {data?.location?.location || "-"}
                      </p>
                      {data?.location && (
                        <p className="text-xs text-gray-400 mt-1">
                          ID: {data.location._id?.slice(-8)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Allocated To</p>
                      <p className="text-lg font-bold text-gray-900">
                        {data?.user?.name || "-"}
                      </p>
                      {data?.user?.role && (
                        <p className="text-xs text-gray-400 mt-1">
                          Role: {data.user.role}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                      <UserCircle2 className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Allocated By</p>
                      <p className="text-lg font-bold text-gray-900">
                        {data?.allocatedBy?.name || "-"}
                      </p>
                      {data?.allocatedBy?.role && (
                        <p className="text-xs text-gray-400 mt-1">
                          Role: {data.allocatedBy.role}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Allocated At</p>
                      <p className="text-lg font-bold text-gray-900">
                        {data?.createdAt
                          ? new Date(data.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </p>
                      {data?.createdAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(data.createdAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 ${data?.expiryDate ? "bg-red-50" : "bg-gray-50"} rounded-lg group-hover:bg-opacity-80 transition-colors`}
                    >
                      <Clock
                        className={`w-5 h-5 ${data?.expiryDate ? "text-red-600" : "text-gray-400"}`}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Expiry Date</p>
                      <p
                        className={`text-lg font-bold ${data?.expiryDate ? "text-gray-900" : "text-gray-400"}`}
                      >
                        {data?.expiryDate
                          ? new Date(data.expiryDate).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "No expiry"}
                      </p>
                      {data?.expiryDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(data.expiryDate) < new Date()
                            ? "Expired"
                            : "Valid"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata Footer */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-4">
                    <span>
                      Created:{" "}
                      {data?.createdAt
                        ? new Date(data.createdAt).toLocaleString()
                        : "-"}
                    </span>
                    <span>
                      Updated:{" "}
                      {data?.updatedAt
                        ? new Date(data.updatedAt).toLocaleString()
                        : "-"}
                    </span>
                  </div>
                  <span className="font-mono">v{data?.__v || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Close Button */}
        {!loading && !error && data && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={close}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewAllocationModal;
