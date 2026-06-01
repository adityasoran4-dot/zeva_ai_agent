import React, { useState, useEffect } from "react";
import { X, Edit3 } from "lucide-react";

interface EditUomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditUom: (uomData: {
    name: string;
    category: string;
    status: "Active" | "Inactive" | "Allocated";
  }) => void;
  uomData?: {
    _id: string;
    name: string;
    category: string;
    status: "Active" | "Inactive" | "Allocated";
  };
  loading?: boolean;
}

const EditUomModal: React.FC<EditUomModalProps> = ({
  isOpen,
  onClose,
  onEditUom,
  uomData,
  loading = false,
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Main");
  const [status, setStatus] = useState<"Active" | "Inactive" | "Allocated">(
    "Allocated",
  );

  useEffect(() => {
    if (isOpen && uomData) {
      setName(uomData.name || "");
      setCategory(uomData.category || "Main");
      setStatus(uomData.status || "Allocated");
    }
  }, [isOpen, uomData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onEditUom({
      name: name.trim(),
      category,
      status,
    });

    setName("");
    setCategory("Main");
    setStatus("Allocated");
  };

  const handleClose = () => {
    setName("");
    setCategory("Main");
    setStatus("Allocated");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Edit Unit of Measurement
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Update measurement unit for your inventory
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

        <div className="flex-1 overflow-y-auto p-4">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 grid grid-cols-1 gap-4"
          >
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                UOM Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter unit of measurement name (e.g., Piece, Box, Pack)"
                className="w-full px-4 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a unique name for the unit of measurement
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
                disabled={loading}
                required
              >
                <option value="">Select Category</option>
                <option value="Main">Main</option>
                <option value="Sub">Sub</option>
              </select>
              <div className="flex gap-2 text-xs text-gray-600 mt-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                  <span>Main: Primary units</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
                  <span>Sub: Secondary units</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as "Active" | "Inactive" | "Allocated",
                  )
                }
                className="w-full px-4 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
                disabled={loading}
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Allocated">Allocated</option>
              </select>
              <div className="flex gap-2 text-xs text-gray-600 mt-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                  <span>Active: Available for use</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                  <span>Inactive: Hidden from selection</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                  <span>Allocated: Reserved or in use</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="border-t border-t-gray-200 bg-gray-50 px-4 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !category || !status}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              loading || !name.trim() || !category || !status
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-gray-800 text-white hover:bg-gray-900"
            }`}
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
                Updating...
              </span>
            ) : (
              "Update UOM"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUomModal;
