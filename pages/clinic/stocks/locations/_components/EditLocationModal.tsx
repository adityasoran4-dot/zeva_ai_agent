import React, { useState, useEffect } from "react";
import { X, Edit3 } from "lucide-react";

interface EditLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditLocation: (locationData: { location: string; status: string }) => void;
  locationData?: {
    _id: string;
    location: string;
    status: string;
  };
  loading?: boolean;
}

const EditLocationModal: React.FC<EditLocationModalProps> = ({
  isOpen,
  onClose,
  onEditLocation,
  locationData,
  loading = false,
}) => {
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("Active");

  // Update local state when modal opens or locationData changes
  useEffect(() => {
    if (isOpen && locationData) {
      setLocation(locationData.location || "");
      setStatus(locationData.status || "Active");
    }
  }, [isOpen, locationData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;

    onEditLocation({
      location: location.trim(),
      status,
    });

    // Reset form
    setLocation("");
    setStatus("Active");
  };

  const handleClose = () => {
    setLocation("");
    setStatus("Active");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Edit Stock Location
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Update storage location for your inventory
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
          <form
            onSubmit={handleSubmit}
            className="space-y-4 grid grid-cols-1 gap-5"
          >
            {/* Location Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Location Name *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location name (e.g., Warehouse, Pharmacy, Storage Room)"
                className="w-full px-4 py-3 text-sm border border-gray-300 text-gray-600 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a unique name for the stock location
              </p>
            </div>

            {/* Status Selection - Select Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
                disabled={loading}
                required
              >
                <option value="">Select Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Allocated">Allocated</option>
              </select>
              <div className="flex gap-2 text-xs text-gray-600 mt-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                  <span>Active: Operational</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                  <span>Inactive: Not available</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
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
            disabled={loading || !location.trim() || !status}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              loading || !location.trim() || !status
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
              "Update Location"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditLocationModal;
