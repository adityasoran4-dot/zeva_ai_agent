import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { Provider } from "@/types/conversations";
import toast from "react-hot-toast";

interface EditEmailProviderModalProps {
  providerId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  token?: string;
}

const EditEmailProviderModal: React.FC<EditEmailProviderModalProps> = ({
  providerId,
  isOpen,
  onClose,
  onUpdate,
  token,
}) => {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [label, setLabel] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProvider = useCallback(async () => {
    if (!providerId) return;
    try {
      const { data } = await axios.get(`/api/providers/${providerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data && data?.success) {
        const providerData = data?.data;
        setProvider(providerData);
        setLabel(providerData?.label || "");
      }
    } catch (error: any) {
      console.error("Error in fetching provider: ", error?.message);
    }
  }, [providerId, token]);

  useEffect(() => {
    if (isOpen && providerId) {
      fetchProvider();
    }
  }, [isOpen, providerId, fetchProvider]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!label.trim()) {
      setErrors({ label: "Provider label is required" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.put(
        `/api/providers/update-provider/${providerId}`,
        { label: label.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        toast.success("Provider label updated successfully");
        onUpdate();
        onClose();
      } else {
        throw new Error(response.data.message || "Failed to update provider");
      }
    } catch (error: any) {
      console.error("Error updating provider:", error);
      toast.error(error.message || "Failed to update provider");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
      approved: { color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle },
      disabled: { color: "bg-gray-100 text-gray-800", icon: AlertCircle },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Edit Email Provider
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-purple-100 text-[10px] sm:text-xs">
                  Update your email provider settings
                </p>
                {provider && getStatusBadge(provider.status)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {provider ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="text-blue-800 font-medium mb-1">
                      Provider Information
                    </p>
                    <div className="grid grid-cols-1 gap-1 text-blue-700">
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {provider.email}
                      </p>
                      <p>
                        <span className="font-medium">Type:</span>{" "}
                        {provider.emailProviderType || "Standard"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center text-sm font-bold text-gray-900">
                  <MessageSquare className="w-4 h-4 mr-2 text-gray-600" />
                  Provider Label *
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => {
                    setLabel(e.target.value);
                    if (errors.label) setErrors({});
                  }}
                  placeholder="Enter provider label (e.g., Support Email, Marketing)"
                  className={`w-full text-gray-900 px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all ${
                    errors.label
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.label && (
                  <p className="text-red-500 text-xs">{errors.label}</p>
                )}
                <p className="text-[10px] text-gray-500 mt-1">
                  Only the display label can be changed. To update connection
                  settings, please re-connect the provider.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting || !label.trim() || label === provider.label
                  }
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-purple-200 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  {isSubmitting ? "Updating..." : "Update Label"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-2 text-sm text-gray-500">
                Loading provider details...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditEmailProviderModal;
