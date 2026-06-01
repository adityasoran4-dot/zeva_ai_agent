import React, { useState } from "react";
import {
  X,
  History,
  Save,
  Loader2,
  DollarSign,
  CreditCard,
  MessageSquare,
  Landmark,
  Zap,
} from "lucide-react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface AddPatientPastAdvancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
  onSuccess: (data: any) => void;
  pastAdvanceType?: "50% Offer" | "54% Offer" | "159 Flat" | "";
  primaryColor?: "amber" | "blue" | "purple" | "emerald" | "indigo" | "rose";
}

const paymentMethods = [
  {
    label: "Cash",
    value: "Cash",
    icon: DollarSign,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    label: "Card",
    value: "Card",
    icon: CreditCard,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    label: "BT (Bank Transfer)",
    value: "BT",
    icon: Landmark,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    label: "Tabby",
    value: "Tabby",
    icon: Zap,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    label: "Tamara",
    value: "Tamara",
    icon: Zap,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
];

const AddPatientPastAdvancePaymentModal: React.FC<
  AddPatientPastAdvancePaymentModalProps
> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess,
  pastAdvanceType = "50% Offer",
  primaryColor = "amber",
}) => {
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorConfig = {
    amber: {
      gradient: "from-amber-500 to-yellow-600",
      text: "text-amber-500",
      bg: "bg-amber-50",
      ring: "focus:ring-amber-500",
      border: "border-amber-500",
      buttonGradient: "from-amber-500 to-yellow-600",
      shadow: "hover:shadow-amber-200",
      badgeText: "text-amber-700",
      badgeRing: "ring-amber-500/10",
    },
    blue: {
      gradient: "from-blue-500 to-indigo-600",
      text: "text-blue-500",
      bg: "bg-blue-50",
      ring: "focus:ring-blue-500",
      border: "border-blue-500",
      buttonGradient: "from-blue-500 to-indigo-600",
      shadow: "hover:shadow-blue-200",
      badgeText: "text-blue-700",
      badgeRing: "ring-blue-500/10",
    },
    purple: {
      gradient: "from-purple-500 to-indigo-600",
      text: "text-purple-500",
      bg: "bg-purple-50",
      ring: "focus:ring-purple-500",
      border: "border-purple-500",
      buttonGradient: "from-purple-500 to-indigo-600",
      shadow: "hover:shadow-purple-200",
      badgeText: "text-purple-700",
      badgeRing: "ring-purple-500/10",
    },
    emerald: {
      gradient: "from-emerald-500 to-teal-600",
      text: "text-emerald-500",
      bg: "bg-emerald-50",
      ring: "focus:ring-emerald-500",
      border: "border-emerald-500",
      buttonGradient: "from-emerald-500 to-teal-600",
      shadow: "hover:shadow-emerald-200",
      badgeText: "text-emerald-700",
      badgeRing: "ring-emerald-500/10",
    },
    indigo: {
      gradient: "from-indigo-500 to-blue-600",
      text: "text-indigo-500",
      bg: "bg-indigo-50",
      ring: "focus:ring-indigo-500",
      border: "border-indigo-500",
      buttonGradient: "from-indigo-500 to-blue-600",
      shadow: "hover:shadow-indigo-200",
      badgeText: "text-indigo-700",
      badgeRing: "ring-indigo-500/10",
    },
    rose: {
      gradient: "from-rose-500 to-pink-600",
      text: "text-rose-500",
      bg: "bg-rose-50",
      ring: "focus:ring-rose-500",
      border: "border-rose-500",
      buttonGradient: "from-rose-500 to-pink-600",
      shadow: "hover:shadow-rose-200",
      badgeText: "text-rose-700",
      badgeRing: "ring-rose-500/10",
    },
  }[primaryColor];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getTokenByPath();
      const { data } = await axios.post(
        `/api/clinic/patient-balance/add-past-advance-payment/${patientId}`,
        {
          amount: Number(amount),
          paymentMethod,
          notes,
          pastAdvanceType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data.success) {
        onSuccess(data.data);
        handleClose();
      } else {
        setError(data.message || "Failed to add past advance payment.");
      }
    } catch (err: any) {
      console.error("Error adding past advance payment:", err);
      setError(
        err.response?.data?.message || "An error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setPaymentMethod("Cash");
    setNotes("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto transform transition-all animate-in fade-in zoom-in duration-300">
        {/* Header with gradient */}
        <div
          className={cn(
            "px-5 sm:px-8 py-4 sm:py-6 flex items-center justify-between bg-gradient-to-r sticky top-0 z-10",
            colorConfig.gradient,
          )}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <History className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Add {pastAdvanceType} Past Advance Balance
              </h3>
              <p className="text-white text-[10px] sm:text-xs font-medium opacity-80">
                Record historical credit for {patientName || "the patient"} for{" "}
                {pastAdvanceType}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-5 sm:space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700">
              <DollarSign className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", colorConfig.text)} />
              {pastAdvanceType} Past Balance Amount{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div
                className={cn(
                  "absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors",
                  `group-focus-within:${colorConfig.text}`,
                )}
              >
                <span className="text-base sm:text-lg font-bold">AED</span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className={cn(
                  "w-full pl-12 sm:pl-16 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:bg-white outline-none transition-all text-lg sm:text-xl font-bold text-gray-700 placeholder:text-gray-300",
                  colorConfig.ring,
                )}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
              Original Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={cn(
                      "flex flex-row sm:flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all gap-2 sm:gap-1",
                      isSelected
                        ? cn(
                            colorConfig.border,
                            colorConfig.bg,
                            "ring-2",
                            colorConfig.badgeRing,
                          )
                        : "border-gray-100 hover:border-gray-200 bg-white",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 sm:w-5 sm:h-5",
                        isSelected ? method.color : "text-gray-400",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isSelected ? colorConfig.badgeText : "text-gray-500",
                      )}
                    >
                      {method.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700">
              <MessageSquare className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", colorConfig.text)} />
              Reference/Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Balance migrated from previous system..."
              className={cn(
                "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:bg-white outline-none transition-all h-20 sm:h-24 resize-none text-xs sm:text-sm text-gray-600 placeholder:text-gray-400 font-medium",
                colorConfig.ring,
              )}
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 bg-red-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-1">
              <X className="w-4 h-4 shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 sm:py-4 bg-gray-100 text-gray-600 text-sm font-bold rounded-xl sm:rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "flex-1 px-6 py-3 sm:py-4 text-white text-sm font-bold rounded-xl sm:rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r hover:shadow-lg",
                colorConfig.buttonGradient,
                colorConfig.shadow,
              )}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Past Balance
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientPastAdvancePaymentModal;
