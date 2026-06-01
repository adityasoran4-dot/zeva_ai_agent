import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Smartphone,
  MessageSquare,
  Phone,
  Key,
  Hash,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import clsx from "clsx";
import { Provider } from "@/types/conversations";

// Edit modal component
interface EditWhatsappProviderModalProps {
  providerId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  token?: string;
}

const EditWhatsappProvider: React.FC<EditWhatsappProviderModalProps> = ({
  providerId,
  isOpen,
  onClose,
  onUpdate,
  token,
}) => {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    phone: "",
    email: "",
    whatsappAccessToken: "",
    wabaId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [testMessage, setTestMessage] = useState("");
  const [testSuccessful, setTestSuccessful] = useState(false);

  const fetchProvider = useCallback(async () => {
    if (!providerId) return;
    try {
      const { data } = await axios.get(`/api/providers/${providerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data && data?.success) {
        let providerData = data?.data;
        setProvider(data?.data);
        setFormData({
          label: providerData?.label || "",
          phone: providerData?.phone || "",
          email: providerData?.email || "",
          whatsappAccessToken: providerData?.secrets?.whatsappAccessToken || "",
          wabaId: providerData?.secrets?.wabaId || "",
        });
      }
    } catch (error: any) {
      console.log("Error in fetching provider: ", error?.message);
    }
  }, [providerId]);

  useEffect(() => {
    fetchProvider();
  }, [providerId]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      if (provider?.status === "approved") {
        setTestSuccessful(true);
        setTestStatus("success");
        setTestMessage("✓ Provider is currently active and approved");
      }
    }
  }, [isOpen, provider]);

  const resetForm = () => {
    setFormData({
      label: provider?.label || "",
      phone: provider?.phone || "",
      email: provider?.email || "",
      whatsappAccessToken: provider?.secrets?.whatsappAccessToken || "",
      wabaId: provider?.secrets?.wabaId || "",
    });
    setErrors({});
    setTestStatus(provider?.status === "approved" ? "success" : "idle");
    setTestMessage(
      provider?.status === "approved"
        ? "✓ Provider is currently active and approved"
        : "",
    );
    setTestSuccessful(provider?.status === "approved");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.label.trim()) {
      newErrors.label = "Provider label is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9+\-\s()]{10,20}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.whatsappAccessToken.trim()) {
      newErrors.whatsappAccessToken = "Access token is required";
    }

    if (!formData.wabaId.trim()) {
      newErrors.wabaId = "WABA ID is required";
    }

    if (!testSuccessful) {
      newErrors.test =
        "Please test the connection first and ensure it's successful";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "whatsappAccessToken" || name === "wabaId") {
      setTestStatus("idle");
      setTestSuccessful(false);
      setTestMessage("");
    }
  };

  const handleTestConnection = async () => {
    if (!formData.whatsappAccessToken || !formData.wabaId) {
      setTestMessage("Please enter access token and WABA ID first");
      setTestStatus("error");
      setTestSuccessful(false);
      return;
    }

    setTestStatus("testing");
    setTestMessage("Testing connection to WhatsApp Business API...");
    setTestSuccessful(false);

    try {
      const response = await axios.get(
        `https://graph.facebook.com/v17.0/${formData.wabaId}/phone_numbers`,
        {
          headers: {
            Authorization: `Bearer ${formData.whatsappAccessToken}`,
          },
        },
      );

      if (response.data && response.data.data) {
        setTestStatus("success");
        setTestSuccessful(true);
        setTestMessage(
          `✓ Connection successful! Found ${response.data.data.length} phone numbers.`,
        );
      } else {
        setTestStatus("error");
        setTestSuccessful(false);
        setTestMessage("✗ Invalid response from WhatsApp API");
      }
    } catch (error: any) {
      console.error("WhatsApp API test error:", error);
      setTestSuccessful(false);

      if (error.response?.status === 401) {
        setTestStatus("error");
        setTestMessage("✗ Invalid access token");
      } else if (error.response?.status === 404) {
        setTestStatus("error");
        setTestMessage("✗ WABA ID not found");
      } else if (error.response?.data?.error) {
        setTestStatus("error");
        setTestMessage(`✗ ${error.response.data.error.message}`);
      } else {
        setTestStatus("error");
        setTestMessage("✗ Connection failed. Please check your credentials.");
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: "whatsappCloud",
        label: formData.label,
        phone: formData.phone,
        email: formData.email,
        type: ["whatsapp"],
        status: testSuccessful ? "approved" : "pending",
        secrets: {
          whatsappAccessToken: formData.whatsappAccessToken,
          wabaId: formData.wabaId,
        },
      };

      const response = await axios.put(
        `/api/providers/update-provider/${providerId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        console.log("Provider updated successfully:", response.data);
        onUpdate();
        onClose();
      } else {
        throw new Error(response.data.message || "Failed to update provider");
      }
    } catch (error: any) {
      console.error("Error updating provider:", error);

      if (error.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          if (err.path) {
            apiErrors[err.path] = err.msg;
          }
        });
        setErrors(apiErrors);
      } else if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({
          submit:
            error.message || "Failed to update provider. Please try again.",
        });
      }
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Edit WhatsApp Provider
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-emerald-100 text-[10px] sm:text-xs">
                  Update WhatsApp Business API configuration
                </p>
                {getStatusBadge(provider?.status || "")}
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
              {/* Current Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-800 font-medium text-xs">
                      Provider Information
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div>
                        <span className="text-blue-700">Provider ID:</span>
                        <p className="text-blue-800 font-mono">
                          {provider?._id}
                        </p>
                      </div>
                      <div>
                        <span className="text-blue-700">Created:</span>
                        <p className="text-blue-800">
                          {new Date(provider?.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-blue-700">Last Updated:</span>
                        <p className="text-blue-800">
                          {new Date(provider?.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-blue-700">Type:</span>
                        <p className="text-blue-800">
                          {provider?.type?.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Provider Label */}
              <div className="space-y-1.5">
                <label className="flex items-center text-sm font-bold text-gray-900">
                  <MessageSquare className="w-4 h-4 mr-2 text-gray-600" />
                  Provider Label *
                </label>
                <input
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  placeholder="Enter provider label (e.g., Clinic WhatsApp, 94712345XXXX)"
                  className={`w-full text-gray-500 px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all ${
                    errors.label
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.label && (
                  <p className="text-red-500 text-xs">{errors.label}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="flex items-center text-sm font-bold text-gray-900">
                  <Phone className="w-4 h-4 mr-2 text-gray-600" />
                  Phone Id *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone Id (e.g., 94712367514XXXX)"
                  className={`w-full text-gray-500 px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all ${
                    errors.phone
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs">{errors.phone}</p>
                )}
              </div>

              {/* WABA ID */}
              <div className="space-y-1.5">
                <label className="flex items-center text-sm font-bold text-gray-900">
                  <Hash className="w-4 h-4 mr-2 text-gray-600" />
                  WABA ID *
                </label>
                <input
                  type="text"
                  name="wabaId"
                  value={formData.wabaId}
                  onChange={handleInputChange}
                  placeholder="Enter your WABA ID"
                  className={`w-full text-gray-500 px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all ${
                    errors.wabaId
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.wabaId && (
                  <p className="text-red-500 text-xs">{errors.wabaId}</p>
                )}
              </div>

              {/* Access Token */}
              <div className="space-y-1.5">
                <label className="flex items-center text-sm font-bold text-gray-900">
                  <Key className="w-4 h-4 mr-2 text-gray-600" />
                  Access Token *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="whatsappAccessToken"
                    value={formData.whatsappAccessToken}
                    onChange={handleInputChange}
                    placeholder="Enter your WhatsApp access token"
                    className={`w-full text-gray-500 px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all pr-24 ${
                      errors.whatsappAccessToken
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={
                      isSubmitting ||
                      testStatus === "testing" ||
                      !formData.whatsappAccessToken ||
                      !formData.wabaId
                    }
                    className={clsx(
                      "absolute right-2 top-1/2 transform -translate-y-1/2 text-xs px-3 py-1.5 rounded transition-colors",
                      testStatus === "testing"
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white",
                    )}
                  >
                    {testStatus === "testing" ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin h-3 w-3 mr-1"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Testing...
                      </span>
                    ) : (
                      "Test Connection"
                    )}
                  </button>
                </div>
                {errors.whatsappAccessToken && (
                  <p className="text-red-500 text-xs">
                    {errors.whatsappAccessToken}
                  </p>
                )}
                {testMessage && (
                  <p
                    className={`text-xs ${
                      testStatus === "success"
                        ? "text-emerald-600"
                        : testStatus === "error"
                          ? "text-red-600"
                          : "text-blue-600"
                    }`}
                  >
                    {testMessage}
                  </p>
                )}
              </div>

              {/* Test Validation Notice */}
              {testSuccessful && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-emerald-800 font-medium text-xs">
                        Connection Verified
                      </p>
                      <p className="text-emerald-700 text-xs mt-1">
                        Your WhatsApp API credentials are valid. Provider will
                        be updated with "approved" status.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {errors.test && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{errors.test}</p>
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Key className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-emerald-800 font-medium text-xs">
                      Security Notice
                    </p>
                    <p className="text-emerald-700 text-xs mt-1">
                      Your access token and WABA ID will be encrypted using
                      AES-256 encryption and stored securely.
                    </p>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}
            </form>
          ) : (
            <div className="flex items-center justify-center">
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Please wait...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-t-gray-200 bg-gray-50 px-4 py-3 flex justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={resetForm}
              disabled={isSubmitting}
              className={clsx(
                "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
                !isSubmitting
                  ? "text-gray-700 hover:bg-gray-100 border border-gray-200"
                  : "text-gray-400 cursor-not-allowed",
              )}
            >
              Reset
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={isSubmitting || !testSuccessful}
              className={clsx(
                "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center",
                !isSubmitting && testSuccessful
                  ? "bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800"
                  : "bg-gray-400 text-gray-700 cursor-not-allowed",
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-4 w-4 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Updating...
                </span>
              ) : (
                "Update Provider"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditWhatsappProvider;
