import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Save,
  Loader2,
  DollarSign,
  Landmark,
  Zap,
  
  Wallet,
 
} from "lucide-react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { getCurrencySymbol } from "@/lib/currencyHelper";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface PayPendingBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
  pendingBalance: number;
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

const PayPendingBalanceModal: React.FC<PayPendingBalanceModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  pendingBalance,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payType, setPayType] = useState<"partial" | "full" | "custom" | null>(null);
  const [clinicCurrency, setClinicCurrency] = useState<string>("INR");
  const [enteredAmount, setEnteredAmount] = useState<string>("");
  const [useAdvanceBalance, setUseAdvanceBalance] = useState<boolean>(false);
  const [advanceBalance, setAdvanceBalance] = useState<number>(0);
  const [advanceUsed, setAdvanceUsed] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setPayType(null);
      setEnteredAmount("");
      setUseAdvanceBalance(false);
      setAdvanceUsed(0);
      fetchClinicCurrency();
      fetchPatientBalance();
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

  const fetchPatientBalance = async () => {
    try {
      const token = getTokenByPath();
      if (!token || !patientId) return;
      const res = await axios.get(`/api/clinic/patient-balance/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.balances) {
        const advanceBal = Number(res.data.balances.advanceBalance || 0);
        setAdvanceBalance(advanceBal);
      }
    } catch (e) {
      console.error('Error fetching patient balance:', e);
    }
  };

  const handlePayTypeSelect = (type: "partial" | "full") => {
    setPayType(type);
    if (type === "partial") {
      const halfAmount = (pendingBalance / 2).toFixed(2);
      setEnteredAmount(halfAmount);
      calculateAmountToPay(Number(halfAmount), useAdvanceBalance);
    } else {
      setEnteredAmount(pendingBalance.toFixed(2));
      calculateAmountToPay(pendingBalance, useAdvanceBalance);
    }
  };

  const calculateAmountToPay = (enteredAmt: number, useAdvance: boolean) => {
    if (useAdvance && advanceBalance > 0) {
      const advanceToUse = Math.min(advanceBalance, enteredAmt);
      setAdvanceUsed(advanceToUse);
      const calculatedAmount = Math.max(0, enteredAmt - advanceToUse);
      setAmount(calculatedAmount.toFixed(2));
    } else {
      setAdvanceUsed(0);
      setAmount(enteredAmt.toFixed(2));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(amount);
    
    if (!amount || isNaN(amountNum) || amountNum < 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (amountNum === 0 && (!useAdvanceBalance || advanceUsed <= 0)) {
      setError("Please enter a valid amount.");
      return;
    }

    if (amountNum > pendingBalance) {
      setError("Payment amount cannot exceed pending balance.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getTokenByPath();
      const { data } = await axios.post(
        `/api/clinic/patient-balance/add-pending-payment/${patientId}`,
        {
          amount: Number(amount),
          paymentMethod,
          notes: notes || `Payment towards pending balance of ${pendingBalance}`,
          advanceUsed: advanceUsed,
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
        setError(data.message || "Failed to record payment.");
      }
    } catch (err: any) {
      console.error("Error adding pending payment:", err);
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
    setPayType(null);
    onClose();
  };

  const formatCurrency = (v: number) => `${getCurrencySymbol(clinicCurrency)}${v.toLocaleString()}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity duration-300"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto transform transition-all animate-in fade-in zoom-in duration-300">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-700 px-5 sm:px-8 py-4 sm:py-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center min-w-[32px] sm:min-w-[40px]">
              <span className="text-white font-bold text-sm sm:text-base">{getCurrencySymbol(clinicCurrency)}</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Pay Pending Balance
              </h3>
              <p className="text-teal-100 text-[10px] sm:text-xs font-medium opacity-80">
                Process payment for {patientName || "the patient"}
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
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                {/* <AlertCircle className="w-5 h-5 text-amber-600" /> */}
              </div>
              <div>
                <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Total Pending
                </div>
                <div className="text-lg font-bold text-amber-900">
                  {formatCurrency(pendingBalance)}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handlePayTypeSelect("partial")}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all border",
                  payType === "partial"
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50"
                )}
              >
                Partial Pay
              </button>
              <button
                type="button"
                onClick={() => handlePayTypeSelect("full")}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all border",
                  payType === "full"
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "bg-white text-teal-600 border-teal-200 hover:bg-teal-50"
                )}
              >
                Full Pay
              </button>
            </div>
          </div>

          {/* Enter Amount Input */}
          {payType && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700">
                Enter Amount
              </label>
              <div className="relative group">
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                  <span className="text-base sm:text-lg font-bold">{getCurrencySymbol(clinicCurrency)}</span>
                </div>
                <input
                  type="number"
                  value={enteredAmount}
                  onChange={(e) => {
                    const entered = Number(e.target.value);
                    setEnteredAmount(e.target.value);
                    setPayType("custom");
                    calculateAmountToPay(entered, useAdvanceBalance);
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  max={pendingBalance}
                  className="w-full pl-12 sm:pl-16 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all text-lg sm:text-xl font-bold text-gray-700 placeholder:text-gray-300"
                  required
                />
              </div>
            </div>
          )}

          {/* Advance Balance Option */}
          {advanceBalance > 0 && payType && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-emerald-800">Use Advance Balance</div>
                    <div className="text-[10px] text-emerald-600">Available: {formatCurrency(advanceBalance)}</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useAdvanceBalance}
                  onChange={(e) => {
                    setUseAdvanceBalance(e.target.checked);
                    const entered = Number(enteredAmount);
                    if (entered > 0) {
                      calculateAmountToPay(entered, e.target.checked);
                    }
                  }}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                />
              </label>
              {useAdvanceBalance && advanceUsed > 0 && (
                <div className="mt-2 pt-2 border-t border-emerald-200">
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-700 font-semibold">Advance Applied:</span>
                    <span className="text-emerald-800 font-bold">-{formatCurrency(advanceUsed)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700">
              Amount to Pay
            </label>
            <div className="relative group">
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                <span className="text-base sm:text-lg font-bold">{getCurrencySymbol(clinicCurrency)}</span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setPayType("custom");
                }}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                max={pendingBalance}
                className="w-full pl-12 sm:pl-16 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all text-lg sm:text-xl font-bold text-gray-700 placeholder:text-gray-300"
                required
                readOnly
              />
            </div>
            {payType === "partial" && (
              <div className="text-[10px] text-gray-500 mt-1">
                Partial payment (50% = {formatCurrency(pendingBalance / 2)}){useAdvanceBalance && advanceUsed > 0 ? ` - Advance: {formatCurrency(advanceUsed)}` : ''}
              </div>
            )}
          </div>

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

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700">
              {/* <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" /> */}
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Partial payment for last session..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all h-20 sm:h-24 resize-none text-xs sm:text-sm text-gray-600 placeholder:text-gray-400 font-medium"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 bg-red-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-1">
              <X className="w-4 h-4 shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

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
              className="flex-1 px-6 py-3 sm:py-4 bg-gradient-to-r from-teal-600 to-cyan-700 text-white text-sm font-bold rounded-xl sm:rounded-2xl hover:shadow-lg hover:shadow-teal-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Process Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayPendingBalanceModal;
