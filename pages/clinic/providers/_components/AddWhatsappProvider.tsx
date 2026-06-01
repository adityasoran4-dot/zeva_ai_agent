import React, { useState, useEffect } from "react";
import { X, Smartphone, Hash, Key, Phone, MessageSquare } from "lucide-react";
import axios from "axios";
import clsx from "clsx";

interface AddWhatsappProviderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  loading?: boolean;
  token?: string;
}

const AddWhatsappProvider: React.FC<AddWhatsappProviderProps> = ({
  isOpen,
  onClose,
  onSuccess,
  loading = false,
  token,
}) => {
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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      label: "",
      phone: "",
      email: "",
      whatsappAccessToken: "",
      wabaId: "",
    });
    setErrors({});
    setTestStatus("idle");
    setTestMessage("");
    setTestSuccessful(false);
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

    // Check if test was successful
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

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Reset test status if credentials change
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
      // Test WhatsApp API connection
      const response = await axios.get(
        `https://graph.facebook.com/v17.0/${formData.wabaId}/phone_numbers`,
        {
          headers: {
            Authorization: `Bearer ${formData.whatsappAccessToken}`,
          },
        }
      );

      if (response.data && response.data.data) {
        setTestStatus("success");
        setTestSuccessful(true);
        setTestMessage(
          `✓ Connection successful! Found ${response.data.data.length} phone numbers.`
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

  const handleSubmit = async (e: React.FormEvent) => {
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
        type: ["whatsapp"],
        status: testSuccessful ? "approved" : "pending", // Send status based on test result
        secrets: {
          whatsappAccessToken: formData.whatsappAccessToken,
          wabaId: formData.wabaId,
        },
      };

      console.log("Creating WhatsApp provider with payload:", payload);

      const response = await axios.post(
        "/api/providers/add-provider",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        console.log("WhatsApp provider created successfully:", response.data);
        resetForm();
        onSuccess?.();
        onClose();
      } else {
        throw new Error(response.data.message || "Failed to create provider");
      }
    } catch (error: any) {
      console.error("Error creating WhatsApp provider:", error);

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
            error.message || "Failed to create provider. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
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
                Add WhatsApp Provider
              </h2>
              <p className="text-emerald-100 text-[10px] sm:text-xs mt-0.5">
                Configure WhatsApp Business API integration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting || loading}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  errors.label ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              />
              {errors.label && (
                <p className="text-red-500 text-xs">{errors.label}</p>
              )}
              <p className="text-gray-500 text-xs">
                A friendly name to identify this provider
              </p>
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
                  errors.phone ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs">{errors.phone}</p>
              )}
              <p className="text-gray-500 text-xs">
                Phone number associated with your WhatsApp Business account
              </p>
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
                  errors.wabaId ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              />
              {errors.wabaId && (
                <p className="text-red-500 text-xs">{errors.wabaId}</p>
              )}
              <p className="text-gray-500 text-xs">
                WhatsApp Business Account ID from Facebook Business Manager
              </p>
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
                      : "bg-green-600 hover:bg-green-700 text-white"
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
              <p className="text-gray-500 text-xs">
                Permanent access token from WhatsApp Business API
              </p>
            </div>

            {/* Test Validation Notice */}
            {testSuccessful && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <p className="text-emerald-800 font-medium text-xs">
                      Connection Verified
                    </p>
                    <p className="text-emerald-700 text-xs mt-1">
                      Your WhatsApp API credentials are valid. Provider will be
                      created with "approved" status.
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
                    AES-256 encryption and stored securely in our database.
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
        </div>

        {/* Footer */}
        <div className="border-t border-t-gray-200 bg-gray-50 px-4 py-3 flex justify-between gap-2">
          <button
            onClick={resetForm}
            disabled={isSubmitting}
            className={clsx(
              "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
              !isSubmitting
                ? "text-gray-700 hover:bg-gray-100 border border-gray-200"
                : "text-gray-400 cursor-not-allowed"
            )}
          >
            Reset Form
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !testSuccessful}
              className={clsx(
                "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center",
                !isSubmitting && testSuccessful
                  ? "bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800"
                  : "bg-gray-400 text-gray-700 cursor-not-allowed"
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
                  Creating Provider...
                </span>
              ) : (
                "Create WhatsApp Provider"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWhatsappProvider;
