import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  strNo?: string;
}

const DeleteStockTransferRequestModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  strNo = "",
}) => {
  const [confirmationText, setConfirmationText] = useState("");
  const [validationError, setValidationError] = useState("");
  const confirmationPhrase = "DELETE";

  useEffect(() => {
    if (isOpen) {
      setConfirmationText("");
      setValidationError("");
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmationText(value);
    validateInput(value);
  };

  const handleConfirmClick = () => {
    if (!validateInput(confirmationText)) return;
    onConfirm();
  };

  const handleClose = () => {
    setConfirmationText("");
    setValidationError("");
    onClose();
  };

  const isConfirmDisabled =
    loading ||
    confirmationText.trim().toUpperCase() !== confirmationPhrase.toUpperCase();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-50 px-4 py-3 flex justify-between items-center border-b border-red-200">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-red-800">
              Delete Stock Transfer Request
            </h2>
            <p className="text-red-700 text-[10px] sm:text-xs mt-0.5">
              This action cannot be undone
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-6 bg-white">
          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-2">
              You're about to delete:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
              <p className="text-sm font-medium text-gray-900">{strNo}</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            To confirm deletion, type <span className="font-bold">DELETE</span>:
          </p>

          <input
            type="text"
            value={confirmationText}
            onChange={handleInputChange}
            placeholder="Type DELETE"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
              validationError
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-red-500"
            }`}
          />

          {validationError && (
            <p className="text-xs text-red-600 mt-2">{validationError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmClick}
            disabled={isConfirmDisabled}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              isConfirmDisabled
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteStockTransferRequestModal;
