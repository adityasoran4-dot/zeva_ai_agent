import React, { useEffect, useState } from "react";
import {
  X,
  AlertTriangle,
  Trash2,
  Shield,
  AlertCircle,
  Loader2,
  Ban,
} from "lucide-react";
import axios from "axios";
import { getAuthHeaders } from "@/lib/helper";

interface DeleteAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedAllocatedItem: any;
}

const DeleteAllocationModal: React.FC<DeleteAllocationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedAllocatedItem,
}) => {
  const [confirmationText, setConfirmationText] = useState("");
  const [validationError, setValidationError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmationPhrase = "DELETE";

  useEffect(() => {
    if (isOpen) {
      setConfirmationText("");
      setValidationError("");
      setError(null);
    }
  }, [isOpen]);

  const validateInput = (text: string) => {
    if (text.trim() === "") {
      setValidationError("");
      return false;
    }
    if (text.trim().toUpperCase() !== confirmationPhrase.toUpperCase()) {
      setValidationError(
        `Please type "${confirmationPhrase}" to confirm deletion`,
      );
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleDelete = async () => {
    if (!validateInput(confirmationText) || !selectedAllocatedItem) return;

    try {
      setLoading(true);
      setError(null);
      const headers = getAuthHeaders() || {};
      await axios.delete(
        `/api/stocks/allocated-stock-items/delete/${selectedAllocatedItem?._id}`,
        { headers },
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to delete allocation";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Delete Allocation
              </h2>
              <p className="text-red-100 text-xs sm:text-sm mt-0.5 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                This action is irreversible
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl p-2 transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Warning Icon with animation */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center animate-pulse">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              <div className="absolute -top-2 -right-2">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce">
                  !
                </div>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Are you absolutely sure?
            </h3>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800">
                You're about to delete{" "}
                <span className="font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">
                  "{selectedAllocatedItem?.stockItem?.name}"
                </span>
              </p>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center justify-center gap-2">
                <Ban className="w-4 h-4 text-red-500" />
                This action{" "}
                <span className="font-bold text-red-600">cannot</span> be undone
              </p>
              <p className="flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                All associated records will be{" "}
                <span className="font-bold">permanently removed</span>
              </p>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To confirm, type{" "}
              <span className="font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500 px-2 py-0.5 bg-red-50 rounded-lg">
                {confirmationPhrase}
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => {
                  setConfirmationText(e.target.value);
                  validateInput(e.target.value);
                }}
                placeholder={confirmationPhrase}
                className={`w-full px-4 py-3 text-gray-900 border-2 rounded-xl shadow-sm focus:ring-4 transition-all text-sm ${
                  validationError
                    ? "border-red-300 focus:ring-red-200 focus:border-red-500"
                    : confirmationText.trim().toUpperCase() ===
                        confirmationPhrase.toUpperCase()
                      ? "border-green-300 focus:ring-green-200 focus:border-green-500"
                      : "border-gray-200 focus:ring-red-200 focus:border-red-500"
                }`}
                disabled={loading}
              />
              {confirmationText.trim().toUpperCase() ===
                confirmationPhrase.toUpperCase() && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            {validationError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationError}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 focus:ring-4 focus:ring-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={
                loading ||
                !selectedAllocatedItem ||
                confirmationText.trim().toUpperCase() !==
                  confirmationPhrase.toUpperCase()
              }
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 rounded-xl hover:from-red-700 hover:to-red-600 focus:ring-4 focus:ring-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Forever
                </>
              )}
            </button>
          </div>

          {/* Security Note */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              This action will be logged for security purposes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAllocationModal;
