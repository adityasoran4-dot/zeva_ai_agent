import React, { useState, useEffect } from "react";
import clsx from "clsx";

interface DeleteSegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  segmentName?: string;
  leadCount: number;
  loading?: boolean;
}

const DeleteSegmentModal: React.FC<DeleteSegmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  segmentName = "Segment",
  leadCount,
  loading = false,
}) => {
  const [confirmationText, setConfirmationText] = useState("");
  const [validationError, setValidationError] = useState("");
  const confirmationPhrase = "DELETE"; // You can also use segmentName here

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
        `Please type "${confirmationPhrase}" to confirm deletion`
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
              Delete Segment
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
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

          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Delete "{segmentName}"?
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Are you sure you want to delete this segment? This will remove the
              segment but will not delete the leads within it.
            </p>

            {leadCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.406 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <div className="text-left">
                    <h4 className="font-bold text-yellow-800 text-sm mb-1">
                      Contains {leadCount} Lead{leadCount !== 1 ? "s" : ""}
                    </h4>
                    <p className="text-yellow-700 text-xs">
                      The {leadCount} lead{leadCount !== 1 ? "s" : ""} in this
                      segment will remain in your system, only the segment
                      grouping will be removed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-bold text-left text-gray-900 text-sm mb-2">
                What happens when you delete:
              </h4>
              <ul className="text-left text-xs text-gray-600 space-y-2">
                <li className="flex items-start">
                  <svg
                    className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span>Segment will be permanently deleted</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Leads will remain in your system</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>No lead data will be lost</span>
                </li>
              </ul>
            </div>

            {/* Confirmation Input */}
            <div className="space-y-2">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type{" "}
                  <span className="font-bold text-red-600">
                    "{confirmationPhrase}"
                  </span>{" "}
                  to confirm:
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={handleInputChange}
                  className={clsx(
                    "w-full text-gray-500 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-colors",
                    validationError
                      ? "border-red-500 bg-red-50"
                      : confirmationText.trim().toUpperCase() ===
                        confirmationPhrase.toUpperCase()
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300"
                  )}
                  placeholder={`Type "${confirmationPhrase}" here`}
                  autoFocus
                  disabled={loading}
                />
                {validationError && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.406 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    {validationError}
                  </p>
                )}
                {!validationError &&
                  confirmationText.trim().toUpperCase() ===
                    confirmationPhrase.toUpperCase() && (
                    <p className="text-green-600 text-xs mt-1 flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Confirmed! You can now delete the segment.
                    </p>
                  )}
              </div>
              <p className="text-xs text-gray-500 text-left">
                This extra step helps prevent accidental deletions
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-4 py-3 flex justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmClick}
            disabled={isConfirmDisabled}
            className={clsx(
              "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
              isConfirmDisabled
                ? "bg-red-300 text-white cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            )}
          >
            {loading ? (
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
                Deleting...
              </span>
            ) : (
              "Delete Segment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSegmentModal;
