import React, { useState, useEffect } from "react";
import { X, Filter, ChevronDown, Users } from "lucide-react";
import { User as UserType } from "@/types/users";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: UserType[];
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string | null) => void;
  onApplyFilters: () => void;
  // Additional filter props that can be added later
  selectedStatus?: string | null;
  onStatusSelect?: (status: string | null) => void;
  dateRange?: { start: string; end: string } | null;
  onDateRangeChange?: (range: { start: string; end: string } | null) => void;
  conversationTypes?: string[];
  selectedType?: string | null;
  onTypeSelect?: (type: string | null) => void;
  loading?: boolean;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  agents,
  selectedAgentId,
  onAgentSelect,
  onApplyFilters,
  selectedStatus = null,
  onStatusSelect,
  dateRange = null,
  onDateRangeChange,
  conversationTypes = [],
  selectedType = null,
  onTypeSelect,
  loading = false,
}) => {
  const { user } = useAuth();
  const [localAgentId, setLocalAgentId] = useState<string | null>(
    selectedAgentId
  );
  const [localStatus, setLocalStatus] = useState<string | null>(selectedStatus);
  const [localType, setLocalType] = useState<string | null>(selectedType);
  const [localDateRange, setLocalDateRange] = useState<{
    start: string;
    end: string;
  } | null>(dateRange);

  // Reset local states when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setLocalAgentId(selectedAgentId);
      setLocalStatus(selectedStatus);
      setLocalType(selectedType);
      setLocalDateRange(dateRange);
    }
  }, [isOpen, selectedAgentId, selectedStatus, selectedType, dateRange]);

  const handleApply = () => {
    onAgentSelect(localAgentId);
    onStatusSelect?.(localStatus);
    onTypeSelect?.(localType);
    onDateRangeChange?.(localDateRange);
    onApplyFilters();
    onClose();
  };

  const handleReset = () => {
    setLocalAgentId(null);
    setLocalStatus(null);
    setLocalType(null);
    setLocalDateRange(null);
  };

  const hasActiveFilters =
    localAgentId || localStatus || localType || localDateRange;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Filter Conversations
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Apply filters to narrow down conversations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Agent Filter */}
            {user?.role === "clinic" && (
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-gray-900">
                  <Users className="w-4 h-4 mr-2" />
                  Assigned Agent
                </label>
                <div className="relative">
                  <select
                    value={localAgentId || ""}
                    onChange={(e) => setLocalAgentId(e.target.value || null)}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    <option value="">All Agents</option>
                    {agents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name ||
                          agent.email ||
                          agent.phone ||
                          "Unknown Agent"}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Status Filter - Can be enabled later */}
            {onStatusSelect && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Active", "Resolved", "Pending", "Closed"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        setLocalStatus(localStatus === status ? null : status)
                      }
                      className={clsx(
                        "px-3 py-2 text-sm rounded-lg border transition-colors",
                        localStatus === status
                          ? "bg-gray-800 text-white border-gray-800"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Type Filter - Can be enabled later */}
            {onTypeSelect && conversationTypes.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Conversation Type
                </label>
                <div className="relative">
                  <select
                    value={localType || ""}
                    onChange={(e) => setLocalType(e.target.value || null)}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    <option value="">All Types</option>
                    {conversationTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Date Range Filter - Can be enabled later */}

            {/* Active Filters Preview */}
            {hasActiveFilters && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 text-sm mb-2">
                  Active Filters
                </h4>
                <div className="flex flex-wrap gap-2">
                  {localAgentId && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Agent:{" "}
                      {agents.find((a) => a._id === localAgentId)?.name ||
                        "Selected"}
                      <button
                        onClick={() => setLocalAgentId(null)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {localStatus && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Status: {localStatus}
                      <button
                        onClick={() => setLocalStatus(null)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {localType && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      Type: {localType}
                      <button
                        onClick={() => setLocalType(null)}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {localDateRange && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                      Date Range
                      <button
                        onClick={() => setLocalDateRange(null)}
                        className="ml-2 text-yellow-600 hover:text-yellow-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
                <button
                  onClick={handleReset}
                  className="mt-3 text-xs text-gray-600 hover:text-gray-800 underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-t-gray-200 bg-gray-50 px-4 py-3 flex justify-between gap-2">
          <button
            onClick={handleReset}
            disabled={!hasActiveFilters || loading}
            className={clsx(
              "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
              hasActiveFilters && !loading
                ? "text-gray-700 hover:bg-gray-100 border border-gray-200"
                : "text-gray-400 cursor-not-allowed"
            )}
          >
            Reset
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={loading}
              className={clsx(
                "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
                !loading
                  ? "bg-gray-800 text-white hover:bg-gray-900"
                  : "bg-gray-400 text-gray-700 cursor-not-allowed"
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
                  Applying...
                </span>
              ) : (
                "Apply Filters"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
