import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface DeleteWorkflowConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  workflowName?: string;
}

const DeleteWorkflowConfirmModal: React.FC<DeleteWorkflowConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  workflowName,
}) => {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (confirmText !== "Delete") return;
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete workflow");
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Delete Workflow
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-bold text-gray-900">
                {workflowName || "this workflow"}
              </span>
              ? This action is permanent and cannot be undone. All associated
              history and actions will be removed.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Type <span className="text-red-600">Delete</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type Delete here..."
              className="w-full px-4 py-3 text-gray-500 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none transition-all"
              autoFocus
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  confirmText === "Delete" &&
                  !isDeleting
                ) {
                  handleConfirm();
                }
              }}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmText !== "Delete" || isDeleting}
            className={cn(
              "flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-50",
              confirmText === "Delete"
                ? "bg-red-600 text-white hover:bg-red-700 shadow-red-100"
                : "bg-gray-100 text-gray-400 shadow-none cursor-not-allowed",
            )}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {isDeleting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteWorkflowConfirmModal;
