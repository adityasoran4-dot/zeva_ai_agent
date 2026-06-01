import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Edit,
  X,
  Package,
  Calendar,
  MapPin,
  AlertCircle,
  Save,
  Loader2,
  CheckCircle2,
  Clock,
  RefreshCw,
  Ban,
  RotateCcw,
} from "lucide-react";
import { getAuthHeaders } from "@/lib/helper";

type AllocStatus =
  | "Allocated"
  | "Issued"
  | "Used"
  | "Partially_Used"
  | "Returned"
  | "Expired"
  | "Cancelled";

interface StockLocation {
  _id: string;
  location: string;
}

interface EditAllocationModalProps {
  isOpen: boolean;
  allocationId?: string;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}

const EditAllocationModal: React.FC<EditAllocationModalProps> = ({
  isOpen,
  allocationId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<StockLocation[]>([]);

  const [status, setStatus] = useState<AllocStatus>("Allocated");
  const [location, setLocation] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");

  const headers = useMemo(() => getAuthHeaders() || {}, []);

  // Status configuration for badges and styling
  const statusConfig: Record<
    AllocStatus,
    { label: string; color: string; icon: any }
  > = {
    Allocated: {
      label: "Allocated",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: Clock,
    },
    Issued: {
      label: "In Use",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: RefreshCw,
    },
    Used: {
      label: "Used",
      color: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle2,
    },
    Partially_Used: {
      label: "Partially Used",
      color: "bg-purple-50 text-purple-700 border-purple-200",
      icon: Package,
    },
    Returned: {
      label: "Returned",
      color: "bg-gray-50 text-gray-700 border-gray-200",
      icon: RotateCcw,
    },
    Expired: {
      label: "Expired",
      color: "bg-red-50 text-red-700 border-red-200",
      icon: AlertCircle,
    },
    Cancelled: {
      label: "Cancelled",
      color: "bg-gray-100 text-gray-500 border-gray-300",
      icon: Ban,
    },
  };

  useEffect(() => {
    const fetchLocations = async () => {
      if (!isOpen) return;
      try {
        const res = await axios.get(`/api/stocks/locations`, { headers });
        setLocations(res.data?.locations || []);
      } catch {
        setLocations([]);
      }
    };
    fetchLocations();
  }, [isOpen, headers]);

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
        const d = res.data?.data || null;
        setStatus((d?.status as AllocStatus) ?? "Allocated");
        setLocation(d?.location?._id ?? "");
        setExpiryDate(
          d?.expiryDate
            ? new Date(d.expiryDate).toISOString().slice(0, 10)
            : "",
        );
      } catch (err: any) {
        const message =
          err?.response?.data?.message || "Failed to load allocation";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [isOpen, allocationId, headers]);

  const reset = () => {
    setError(null);
    setSubmitting(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocationId) return;
    try {
      setSubmitting(true);
      setError(null);
      const payload: any = {
        status,
        location: location || undefined,
        expiryDate: expiryDate || undefined,
      };
      const res = await axios.put(
        `/api/stocks/allocated-stock-items/update/${allocationId}`,
        payload,
        { headers },
      );
      onSuccess(res.data?.data);
      close();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to update allocation";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Fixed Header with Gradient */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Edit Allocation
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm mt-0.5">
                Update quantity, status, location, or expiry date
              </p>
            </div>
          </div>
          <button
            onClick={close}
            disabled={submitting}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
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
          ) : (
            <>
              {/* Status Badge Preview */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Current Status
                </span>
                <div
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig[status]?.color || "bg-gray-50 text-gray-700"}`}
                >
                  {React.createElement(statusConfig[status]?.icon || Clock, {
                    className: "w-4 h-4 mr-1.5",
                  })}
                  {statusConfig[status]?.label || status.replace("_", " ")}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Status Field */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as AllocStatus)}
                      className="w-full pl-9 pr-3 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm appearance-none bg-white"
                      required
                    >
                      {(Object.keys(statusConfig) as AllocStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {statusConfig[s].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location Field */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm appearance-none bg-white"
                    >
                      <option value="">Select a location</option>
                      {locations.map((l) => (
                        <option key={l._id} value={l._id}>
                          {l.location}
                        </option>
                      ))}
                    </select>
                  </div>
                  {locations.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No locations available
                    </p>
                  )}
                </div>

                {/* Expiry Date Field */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Expiry Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full pl-9 pr-3 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Helper Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Changes to allocated stock will be reflected immediately.
                    Make sure to verify quantity and status before updating.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </form>

        {/* Fixed Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={close}
              disabled={submitting || loading}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting || loading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Allocation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAllocationModal;
