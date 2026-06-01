import React, { useState, useEffect } from "react";
import {
  X,
  
  Save,
  Loader2,
  DollarSign,
  CreditCard,
 
  Landmark,
  Zap,
} from "lucide-react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { getCurrencySymbol } from "@/lib/currencyHelper";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface AddPatientAdvancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
  onSuccess: (data: any) => void;
}

const paymentMethods = [
  {
    label: "Cash",
    value: "Cash",
    icon: DollarSign,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
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

const AddPatientAdvancePaymentModal: React.FC<
  AddPatientAdvancePaymentModalProps
> = ({ isOpen, onClose, patientId, patientName, onSuccess }) => {
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinicCurrency, setClinicCurrency] = useState<string>("INR");

  useEffect(() => {
    if (isOpen) {
      fetchClinicCurrency();
    }
  }, [isOpen]);

  const fetchClinicCurrency = async () => {
    try {
      const token = getTokenByPath();
      if (!token) return;
      const res = await axios.get('/api/clinics/myallClinic', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.clinic?.currency) {
        setClinicCurrency(res.data.clinic.currency);
      }
    } catch (e) {
      console.error('Error fetching clinic currency:', e);
    }
  };

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
        `/api/clinic/patient-balance/add-advance-payment/${patientId}`,
        {
          amount: Number(amount),
          paymentMethod,
          notes,
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
        setError(data.message || "Failed to add advance payment.");
      }
    } catch (err: any) {
      console.error("Error adding advance payment:", err);
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
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 sm:px-8 py-4 sm:py-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center min-w-[32px] sm:min-w-[40px]">
              <span className="text-white font-bold text-sm sm:text-base">{getCurrencySymbol(clinicCurrency)}</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Add Advance Payment
              </h3>
              <p className="text-emerald-100 text-[10px] sm:text-xs font-medium opacity-80">
                Record a credit balance for {patientName || "the patient"}
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
              {/* <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" /> */}
              Amount to Add
            </label>
            <div className="relative group">
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                <span className="text-base sm:text-lg font-bold">{getCurrencySymbol(clinicCurrency)}</span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="w-full pl-12 sm:pl-16 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all text-lg sm:text-xl font-bold text-gray-700 placeholder:text-gray-300"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700">
              {/* <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" /> */}
              Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {paymentMethods.map((method) => {
                // const Icon = method.icon;
                const isSelected = paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={cn(
                      "flex flex-row sm:flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all gap-2 sm:gap-1",
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10"
                        : "border-gray-100 hover:border-gray-200 bg-white",
                    )}
                  >
                    {/* <Icon
                      className={cn(
                        "w-4 h-4 sm:w-5 sm:h-5",
                        isSelected ? method.color : "text-gray-400",
                      )}
                    /> */}
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isSelected ? "text-emerald-700" : "text-gray-500",
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
             
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Advance for laser treatment package..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all h-20 sm:h-24 resize-none text-xs sm:text-sm text-gray-600 placeholder:text-gray-400 font-medium"
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
              className="flex-1 px-6 py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-sm font-bold rounded-xl sm:rounded-2xl hover:shadow-lg hover:shadow-emerald-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Add Advance
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientAdvancePaymentModal;
