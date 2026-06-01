import React, { useEffect, useState, useCallback, useRef } from "react";
import { X, UserPlus, Save, Loader2, Search, ChevronDown } from "lucide-react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface AddToSegmentActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: string | null;
  onUpdate: (updatedAction: any) => void;
}

const AddToSegmentActionModal: React.FC<AddToSegmentActionModalProps> = ({
  isOpen,
  onClose,
  actionId,
  onUpdate,
}) => {
  const [segmentId, setSegmentId] = useState<string | null>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchActionAndSegments = useCallback(async () => {
    if (!actionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = getTokenByPath();
      // Fetch action details
      const actionRes = await axios.get(
        `/api/workflows/actions/update/${actionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (actionRes.data.success) {
        setSegmentId(actionRes.data.data.parameters?.segmentId || null);
      }

      // Fetch segments
      const segmentsRes = await axios.get("/api/segments/get-segments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (segmentsRes.data.success) {
        setSegments(segmentsRes.data.segments || []);
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError("Failed to load details.");
    } finally {
      setIsLoading(false);
    }
  }, [actionId]);

  useEffect(() => {
    if (isOpen && actionId) {
      fetchActionAndSegments();
    }
  }, [isOpen, actionId, fetchActionAndSegments]);

  const handleSave = async () => {
    if (!actionId) return;
    setIsSaving(true);
    setError(null);
    try {
      const token = getTokenByPath();
      const { data } = await axios.put(
        `/api/workflows/actions/update/${actionId}`,
        { parameters: { segmentId } },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        onUpdate(data.data);
        onClose();
      }
    } catch (err: any) {
      console.error("Error saving action:", err);
      setError("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSegments = segments.filter((segment) =>
    segment.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <UserPlus className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Add to Segment
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Add lead to a specific segment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium">Loading segments...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm font-medium">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="block text-sm font-bold text-gray-900">
                  Select Segment <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all flex items-center justify-between cursor-pointer bg-white hover:border-green-400"
                >
                  <span className="truncate">
                    {segmentId
                      ? segments.find((s) => s._id === segmentId)?.name ||
                        "Select Segment"
                      : "Select Lead Segment"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search segments..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {filteredSegments.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm italic font-medium">
                        No segments found
                      </div>
                    ) : (
                      <ul className="py-1">
                        {filteredSegments.map((segment) => (
                          <li
                            key={segment._id}
                            className={cn(
                              "px-4 py-2 text-sm text-gray-700 hover:bg-green-50 cursor-pointer flex flex-col",
                              segmentId === segment._id && "bg-green-50",
                            )}
                            onClick={() => {
                              setSegmentId(segment._id);
                              setIsDropdownOpen(false);
                              setSearchTerm("");
                            }}
                          >
                            <span className="font-bold text-gray-900 leading-none">
                              {segment.name}
                            </span>
                            {segment.description && (
                              <span className="text-[10px] text-gray-500 font-medium mt-1 truncate">
                                {segment.description}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading || !segmentId}
              className="flex-1 px-4 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Segment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToSegmentActionModal;
