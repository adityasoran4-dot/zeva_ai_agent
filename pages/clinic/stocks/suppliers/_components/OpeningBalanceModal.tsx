import React, { useEffect, useState } from "react";
import { CircleDollarSign, X } from "lucide-react";

interface OpeningBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
  currentBalance?: number;
  currentType?: "Debit" | "Credit";
  onSuccess: (updatedSupplier: any) => void;
  token: string;
}

const OpeningBalanceModal: React.FC<OpeningBalanceModalProps> = ({
  isOpen,
  onClose,
  supplierId,
  currentBalance = 0,
  currentType = "Credit",
  onSuccess,
  token,
}) => {
  const [balance, setBalance] = useState<number>(currentBalance);
  const [type, setType] = useState<"Debit" | "Credit">(currentType);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ balance?: string; type?: string }>({});

  useEffect(() => {
    setBalance(currentBalance);
    setType(currentType);
  }, [currentBalance, currentType]);

  const validate = (): boolean => {
    const newErrors: { balance?: string; type?: string } = {};

    if (isNaN(balance) || balance < 0) {
      newErrors.balance = "Opening balance must be a valid positive number";
    }

    if (!type) {
      newErrors.type = "Type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/stocks/suppliers/update-supplier/${supplierId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            openingBalance: parseFloat(balance.toString()),
            openingBalanceType: type,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        onSuccess(data?.data);
        onClose();
      } else {
        throw new Error(data.message || "Failed to update opening balance");
      }
    } catch (error: any) {
      console.error("Error updating opening balance:", error);
      // You might want to add toast/notification here
      alert(
        error.message || "An error occurred while updating the opening balance",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <CircleDollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Update Opening Balance
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Set supplier's opening balance
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Balance Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Opening Balance <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                placeholder="Enter opening balance"
                className={`w-full text-gray-500 px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.balance
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-300"
                }`}
                disabled={loading}
                min="0"
                step="0.01"
                required
              />
              {errors.balance && (
                <p className="text-xs text-red-600 mt-1">{errors.balance}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Enter the initial balance for this supplier
              </p>
            </div>

            {/* Type Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Balance Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "Debit" | "Credit")}
                className={`w-full text-gray-500 px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.type
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-300"
                }`}
                disabled={loading}
                required
              >
                <option value="Credit">Credit</option>
                <option value="Debit">Debit</option>
              </select>
              {errors.type && (
                <p className="text-xs text-red-600 mt-1">{errors.type}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Select whether this is a debit or credit balance
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
              <div className="flex items-start">
                <svg
                  className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Note:</p>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>
                      <strong>Credit</strong>: Supplier has a balance in your
                      favor (they owe you)
                    </li>
                    <li>
                      <strong>Debit</strong>: You have a balance in supplier's
                      favor (you owe them)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              loading || isNaN(balance) || balance < 0 || !type || !supplierId
            }
            className="px-4 py-2.5 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-lg hover:bg-gray-900 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Updating...
              </>
            ) : (
              "Update Balance"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OpeningBalanceModal;
