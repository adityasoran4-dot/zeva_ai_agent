import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  X,
  Tag,
  Save,
  Loader2,
  Search,
  Plus,
  Check,
  ChevronDown,
} from "lucide-react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface AddTagActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: string | null;
  onUpdate: (updatedAction: any) => void;
}

const AddTagActionModal: React.FC<AddTagActionModalProps> = ({
  isOpen,
  onClose,
  actionId,
  onUpdate,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
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

  const fetchData = useCallback(async () => {
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
        setSelectedTag(actionRes.data.data.parameters?.tag || "");
      }

      // Fetch existing tags
      const tagsRes = await axios.get("/api/tags", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tagsRes.data.success) {
        setAvailableTags(tagsRes.data.tags || []);
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
      fetchData();
    }
  }, [isOpen, actionId, fetchData]);

  const handleSave = async () => {
    if (!actionId || !selectedTag) return;
    setIsSaving(true);
    setError(null);
    try {
      const token = getTokenByPath();
      const { data } = await axios.put(
        `/api/workflows/actions/update/${actionId}`,
        { parameters: { tag: selectedTag } },
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

  const filteredTags = availableTags.filter((t) =>
    t.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const isNewTag =
    searchTerm && !availableTags.includes(searchTerm.toLowerCase());

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
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Tag className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Add Tag</h3>
              <p className="text-xs text-gray-500 font-medium">
                Configure tag for this action
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
              <p className="text-sm font-medium">Loading tags...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm font-medium">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="block text-sm font-bold text-gray-900">
                  Select or Create Tag <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={cn(
                    "w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all flex items-center justify-between cursor-pointer bg-white hover:border-indigo-400",
                    isDropdownOpen &&
                      "ring-2 ring-indigo-500/20 border-indigo-500",
                  )}
                >
                  <span
                    className={cn(
                      "truncate",
                      selectedTag && "font-bold text-gray-900 capitalize",
                    )}
                  >
                    {selectedTag || "Choose a tag..."}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto overflow-x-hidden">
                    <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search or type new tag..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <div className="py-1">
                      {filteredTags.length > 0
                        ? filteredTags.map((t) => (
                            <div
                              key={t}
                              className={cn(
                                "px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer flex items-center justify-between group",
                                selectedTag === t && "bg-indigo-50",
                              )}
                              onClick={() => {
                                setSelectedTag(t);
                                setIsDropdownOpen(false);
                                setSearchTerm("");
                              }}
                            >
                              <span
                                className={cn(
                                  "capitalize font-medium",
                                  selectedTag === t &&
                                    "font-bold text-indigo-700",
                                )}
                              >
                                {t}
                              </span>
                              {selectedTag === t && (
                                <Check className="w-4 h-4 text-indigo-600" />
                              )}
                            </div>
                          ))
                        : !isNewTag && (
                            <div className="p-4 text-center text-gray-500 text-sm italic font-medium">
                              No existing tags found
                            </div>
                          )}

                      {isNewTag && (
                        <div
                          className="px-4 py-3 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer transition-all flex items-center gap-3 border-t border-indigo-100 mt-1"
                          onClick={() => {
                            setSelectedTag(searchTerm.toLowerCase());
                            setIsDropdownOpen(false);
                            setSearchTerm("");
                          }}
                        >
                          <div className="bg-indigo-600 p-1 rounded-md shrink-0">
                            <Plus className="w-3 h-3 text-white" />
                          </div>
                          <span className="font-semibold">
                            Create "
                            <span className="capitalize">{searchTerm}</span>"
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-700 leading-relaxed flex items-start gap-2">
                  <span className="mt-0.5 inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  This tag will be automatically applied to the lead when this
                  step of the workflow is executed.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 mt-auto">
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
              disabled={isSaving || isLoading || !selectedTag}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Tag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTagActionModal;
