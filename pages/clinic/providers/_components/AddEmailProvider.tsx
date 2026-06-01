import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Server,
  Key,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import clsx from "clsx";

interface AddEmailProviderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  loading?: boolean;
  token?: string;
}

interface FormData {
  email: string;
  password: string;
  sameCredentials: boolean;
  imapServer: string;
  imapPort: string;
  imapUsername: string;
  imapPassword: string;
  smtpServer: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
}

const AddEmailProvider: React.FC<AddEmailProviderProps> = ({
  isOpen,
  onClose,
  onSuccess,
  loading = false,
  token,
}) => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    sameCredentials: true,
    imapServer: "",
    imapPort: "",
    imapUsername: "",
    imapPassword: "",
    smtpServer: "",
    smtpPort: "",
    smtpUsername: "",
    smtpPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHostedByGsuite, setIsHostedByGsuite] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<
    "gmail" | "outlook" | "other" | null
  >(null);
  const [step, setStep] = useState<
    "email" | "confirm" | "provider" | "connect"
  >("email");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      sameCredentials: true,
      imapServer: "",
      imapPort: "",
      imapUsername: "",
      imapPassword: "",
      smtpServer: "",
      smtpPort: "",
      smtpUsername: "",
      smtpPassword: "",
    });
    setErrors({});
    setIsHostedByGsuite(false);
    setShowAdvanced(false);
    setSelectedProvider(null);
    setStep("email");
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const domain = formData.email.split("@")[1]?.toLowerCase();

  const detectedProvider =
    domain === "gmail.com" || domain === "googlemail.com" || isHostedByGsuite
      ? "gmail"
      : domain === "outlook.com" ||
          domain === "hotmail.com" ||
          domain === "live.com"
        ? "outlook"
        : "other";

  // Replace the validateForm function with this pure version
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email address is required";
    } else if (!isEmailValid) {
      newErrors.email = "Please enter a valid email address";
    }

    if (selectedProvider === "other") {
      if (!formData.smtpServer)
        newErrors.smtpServer = "SMTP server is required";
      if (!formData.smtpPort) newErrors.smtpPort = "SMTP port is required";
      if (!formData.smtpUsername)
        newErrors.smtpUsername = "SMTP username is required";
      if (!formData.smtpPassword)
        newErrors.smtpPassword = "SMTP password is required";

      if (!formData.sameCredentials) {
        if (!formData.imapServer)
          newErrors.imapServer = "IMAP server is required";
        if (!formData.imapPort) newErrors.imapPort = "IMAP port is required";
        if (!formData.imapUsername)
          newErrors.imapUsername = "IMAP username is required";
        if (!formData.imapPassword)
          newErrors.imapPassword = "IMAP password is required";
      }
    }

    // Return errors without setting state
    return newErrors;
  };

  // Add a separate function for validating and setting errors on submit
  const validateAndSetErrors = () => {
    const newErrors = validateForm();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-populate username fields with email
    if (name === "email") {
      setFormData((prev) => ({
        ...prev,
        email: value,
        smtpUsername: value,
        imapUsername: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      password: value,
      smtpPassword: value,
      imapPassword: value,
    }));
  };

  const handleConnectGmail = async () => {
    setIsSubmitting(true);
    try {
      const response = await axios.get("/api/gmail/connect", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success && response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error: any) {
      console.error("Gmail connection error:", error);
      setErrors({
        submit: error.response?.data?.message || "Failed to connect to Gmail",
      });
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use validateAndSetErrors instead of validateForm
    if (!validateAndSetErrors()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        email: formData.email,
        smtpHost: formData.smtpServer,
        smtpPort: Number(formData.smtpPort),
        smtpUsername: formData.smtpUsername,
        smtpPassword: formData.smtpPassword,
        smtpSecure: true,
        imapHost: formData.imapServer,
        imapPort: Number(formData.imapPort),
        imapUsername: formData.sameCredentials
          ? formData.smtpUsername
          : formData.imapUsername,
        imapPassword: formData.sameCredentials
          ? formData.smtpPassword
          : formData.imapPassword,
        imapSecure: true,
      };

      const response = await axios.post(
        "/api/providers/add-email-provider",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data?.success) {
        resetForm();
        onSuccess?.();
        onClose();
      } else {
        throw new Error(response.data?.message || "Failed to create provider");
      }
    } catch (error: any) {
      console.error("Error creating email provider:", error);

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

  const handleNext = () => {
    if (!formData.email || !isEmailValid) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }
    setStep("confirm");
  };

  const handleProviderConfirm = () => {
    if (detectedProvider === "gmail") {
      setStep("connect");
      setSelectedProvider("gmail");
    } else if (detectedProvider === "outlook") {
      setStep("connect");
      setSelectedProvider("outlook");
    } else {
      setSelectedProvider("other");
      setStep("provider");
    }
  };

  const handleManualProviderSelect = (
    provider: "gmail" | "outlook" | "other",
  ) => {
    setSelectedProvider(provider);
    setStep("connect");
  };

  const renderEmailStep = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="flex items-center text-sm font-bold text-gray-900">
          <Mail className="w-4 h-4 mr-2 text-gray-600" />
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="your@example.com"
          className={clsx(
            "w-full text-gray-500 px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
            errors.email ? "border-red-300 bg-red-50" : "border-gray-300",
          )}
          disabled={isSubmitting}
        />
        {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
        <p className="text-gray-500 text-xs">
          Enter the email you'd like to connect
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isHostedByGsuite"
          checked={isHostedByGsuite}
          onChange={(e) => setIsHostedByGsuite(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label
          htmlFor="isHostedByGsuite"
          className="text-sm cursor-pointer text-gray-700"
        >
          This email is hosted by GSuite
        </label>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="text-center py-6">
      {/* LOGO Like Gmail,  */}

      <div className="text-base font-medium text-gray-900">
        {formData.email}
      </div>
      <p className="text-gray-600 text-sm mt-2">
        Your email is hosted by{" "}
        <strong>
          {detectedProvider === "gmail"
            ? isHostedByGsuite
              ? "Gsuite"
              : "Google"
            : detectedProvider === "outlook"
              ? "Microsoft Outlook"
              : "an external provider"}
        </strong>
        . We recommend connecting with the correct service.
      </p>

      <button
        type="button"
        onClick={handleProviderConfirm}
        className={clsx(
          "mt-6 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors",
          "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800",
        )}
        disabled={isSubmitting}
      >
        {detectedProvider === "gmail"
          ? "Connect to Gmail"
          : detectedProvider === "outlook"
            ? "Connect to Outlook"
            : "Continue with Manual Setup"}
      </button>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setStep("provider")}
          className="text-sm text-blue-600 underline hover:text-blue-700"
        >
          I want to choose my email provider myself
        </button>
      </div>
    </div>
  );

  const renderProviderStep = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Choose your email provider
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleManualProviderSelect("gmail")}
          className="border border-gray-200 p-4 rounded-lg flex flex-col items-center hover:shadow-md hover:border-blue-300 transition-all"
        >
          <Mail className="h-10 w-10 text-red-500 mb-2" />
          <span className="text-sm font-medium text-gray-900">
            Google / Gmail
          </span>
        </button>

        {/* <button
          type="button"
          onClick={() => handleManualProviderSelect("outlook")}
          className="border border-gray-200 p-4 rounded-lg flex flex-col items-center hover:shadow-md hover:border-blue-300 transition-all"
        >
          <Mail className="h-10 w-10 text-blue-500 mb-2" />
          <span className="text-sm font-medium text-gray-900">
            Microsoft Outlook
          </span>
        </button> */}

        <button
          type="button"
          onClick={() => handleManualProviderSelect("other")}
          className="border border-gray-200 p-4 rounded-lg flex flex-col items-center hover:shadow-md hover:border-blue-300 transition-all"
        >
          <Server className="h-10 w-10 text-gray-500 mb-2" />
          <span className="text-sm font-medium text-gray-900">
            Other mail provider
          </span>
        </button>
      </div>
    </div>
  );

  const renderConnectStep = () => {
    if (selectedProvider === "gmail" || selectedProvider === "outlook") {
      return (
        <div className="text-center py-4">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <div className="text-lg font-semibold text-gray-900">
            Connect your {selectedProvider === "gmail" ? "Google" : "Outlook"}{" "}
            account to CRM
          </div>
          <p className="text-sm mt-2 text-gray-500">{formData.email}</p>
          <p className="text-sm text-gray-500 mt-4 max-w-md mx-auto">
            When you integrate your {selectedProvider} email with our platform,
            you can send/receive messages, track activity, and schedule sends.
            You'll also get access to logging and analytics.
          </p>
          <button
            type="button"
            onClick={handleConnectGmail}
            disabled={isSubmitting}
            className={clsx(
              "mt-6 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors",
              "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800",
              isSubmitting && "opacity-50 cursor-not-allowed",
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
                Connecting...
              </span>
            ) : (
              "Continue to Connect"
            )}
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="flex items-center text-sm font-bold text-gray-900">
            <Mail className="w-4 h-4 mr-2 text-gray-600" />
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your@example.com"
            className={clsx(
              "w-full text-gray-500 px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
              errors.email ? "border-red-300 bg-red-50" : "border-gray-300",
            )}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center text-sm font-bold text-gray-900">
            <Key className="w-4 h-4 mr-2 text-gray-600" />
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handlePasswordChange}
            placeholder="Enter your email password"
            className={clsx(
              "w-full text-gray-500 px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
              errors.password ? "border-red-300 bg-red-50" : "border-gray-300",
            )}
            disabled={isSubmitting}
          />
        </div>

        {/* Advanced Options */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                Advanced Options
              </span>
            </div>
            {showAdvanced ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {showAdvanced && (
            <div className="p-4 space-y-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sameCredentials"
                  checked={formData.sameCredentials}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sameCredentials: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="sameCredentials"
                  className="text-sm text-gray-700"
                >
                  Outgoing mail uses the same credentials as incoming
                </label>
              </div>

              {/* IMAP Settings */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">
                  Incoming Mail (IMAP)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {!formData.sameCredentials && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-600">
                          Username
                        </label>
                        <input
                          type="text"
                          name="imapUsername"
                          value={formData.imapUsername}
                          onChange={handleInputChange}
                          className="w-full text-gray-500 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-600">
                          Password
                        </label>
                        <input
                          type="password"
                          name="imapPassword"
                          value={formData.imapPassword}
                          onChange={handleInputChange}
                          className="w-full text-gray-500 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">
                      Server <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="imapServer"
                      value={formData.imapServer}
                      onChange={handleInputChange}
                      placeholder="imap.example.com"
                      className={clsx(
                        "w-full text-gray-500 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                        errors.imapServer && "border-red-300 bg-red-50",
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">
                      Port <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="imapPort"
                      value={formData.imapPort}
                      onChange={handleInputChange}
                      placeholder="993"
                      className={clsx(
                        "w-full text-gray-500 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                        errors.imapPort && "border-red-300 bg-red-50",
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* SMTP Settings */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">
                  Outgoing Mail (SMTP)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {!formData.sameCredentials && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-600">
                          Username
                        </label>
                        <input
                          type="text"
                          name="smtpUsername"
                          value={formData.smtpUsername}
                          onChange={handleInputChange}
                          className="w-full text-gray-500 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-600">
                          Password
                        </label>
                        <input
                          type="password"
                          name="smtpPassword"
                          value={formData.smtpPassword}
                          onChange={handleInputChange}
                          className="w-full text-gray-500 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">
                      Server <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="smtpServer"
                      value={formData.smtpServer}
                      onChange={handleInputChange}
                      placeholder="smtp.example.com"
                      className={clsx(
                        "w-full text-gray-500 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                        errors.smtpServer && "border-red-300 bg-red-50",
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">
                      Port <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="smtpPort"
                      value={formData.smtpPort}
                      onChange={handleInputChange}
                      placeholder="587"
                      className={clsx(
                        "w-full text-gray-500 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                        errors.smtpPort && "border-red-300 bg-red-50",
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-800 font-medium text-xs">
                Security Notice
              </p>
              <p className="text-blue-700 text-xs mt-1">
                Your email credentials will be encrypted using AES-256
                encryption and stored securely in our database.
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
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case "email":
        return renderEmailStep();
      case "confirm":
        return renderConfirmStep();
      case "provider":
        return renderProviderStep();
      case "connect":
        return renderConnectStep();
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "email":
        return "Set up your email account";
      case "confirm":
        return "Confirm Email Provider";
      case "provider":
        return "Choose Provider";
      case "connect":
        if (selectedProvider === "gmail" || selectedProvider === "outlook") {
          return "Connect Account";
        }
        return "Manual Configuration";
      default:
        return "Add Email Provider";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "email":
        return "Enter the email you'd like to connect.";
      case "confirm":
        return "We've detected your email provider.";
      case "provider":
        return "Select your email provider from the options below.";
      case "connect":
        if (selectedProvider === "gmail" || selectedProvider === "outlook") {
          return "Connect via OAuth for secure access.";
        }
        return "Enter your email server configuration.";
      default:
        return "";
    }
  };

  const canGoBack = step !== "email";
  const isConnectStep = step === "connect";
  const isManualConnect = isConnectStep && selectedProvider === "other";
  const isOAuthConnect =
    isConnectStep &&
    (selectedProvider === "gmail" || selectedProvider === "outlook");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {getStepTitle()}
              </h2>
              <p className="text-blue-100 text-[10px] sm:text-xs mt-0.5">
                {getStepDescription()}
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
        <div className="flex-1 overflow-y-auto p-4">{renderStepContent()}</div>

        {/* Footer */}
        <div className="border-t border-t-gray-200 bg-gray-50 px-4 py-3 flex justify-between gap-2">
          <div>
            {canGoBack && (
              <button
                type="button"
                onClick={() => {
                  if (step === "confirm") setStep("email");
                  else if (step === "provider") setStep("email");
                  else if (step === "connect") {
                    if (selectedProvider === "other") setStep("provider");
                    else setStep("confirm");
                  }
                }}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-50"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {step === "email" && (
              <button
                type="button"
                onClick={handleNext}
                disabled={!formData.email || !isEmailValid}
                className={clsx(
                  "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
                  formData.email && isEmailValid
                    ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800"
                    : "bg-gray-400 text-gray-700 cursor-not-allowed",
                )}
              >
                Next
              </button>
            )}
            {(step === "confirm" || step === "provider") && (
              <button
                type="button"
                onClick={step === "confirm" ? handleProviderConfirm : undefined}
                disabled={false}
                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 transition-colors"
              >
                Continue
              </button>
            )}
            {isManualConnect && (
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting || Object.keys(validateForm()).length > 0
                }
                className={clsx(
                  "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
                  !isSubmitting
                    ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800"
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
                    Connecting...
                  </span>
                ) : (
                  "Connect Inbox"
                )}
              </button>
            )}
            {isOAuthConnect && (
              <button
                onClick={handleConnectGmail}
                disabled={isSubmitting}
                className={clsx(
                  "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
                  !isSubmitting
                    ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800"
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
                    Connecting...
                  </span>
                ) : (
                  "Connect Account"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEmailProvider;
