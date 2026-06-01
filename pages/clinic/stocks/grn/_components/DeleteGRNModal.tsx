import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface DeleteGRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  grnName?: string;
  loading?: boolean;
}

const DeleteGRNModal: React.FC<DeleteGRNModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  grnName = "GRN",
  loading = false,
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
    if (!validateInput(confirmationText)) {
      return;
    }
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
              Delete Goods Receipt Note
            </h2>
            <p className="text-red-700 text-[10px] sm:text-xs mt-0.5">
              This action cannot be undone
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-red-600 hover:bg-red-100 rounded-lg p-1.5 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Are you absolutely sure?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You're about to delete the GRN{" "}
              <span className="font-semibold text-gray-900">"{grnName}"</span>.
              This action is permanent and cannot be undone.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-left">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Warning:</strong> All data associated with this GRN
                    will be permanently removed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To confirm, type{" "}
              <span className="font-mono font-bold text-red-600">
                {confirmationPhrase}
              </span>
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={handleInputChange}
              placeholder={confirmationPhrase}
              className={`w-full px-3 py-2 text-gray-500 border rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm ${
                validationError
                  ? "border-red-300 placeholder-red-300"
                  : "border-gray-300"
              }`}
              disabled={loading}
            />
            {validationError && (
              <p className="mt-2 text-sm text-red-600">{validationError}</p>
            )}
          </div>
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
            onClick={handleConfirmClick}
            disabled={isConfirmDisabled}
            className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                Deleting...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete GRN
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteGRNModal;
