import React, { useEffect, useState, useCallback } from "react";
import { X, Clock, Save, Loader2 } from "lucide-react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";

interface DelayActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: string | null;
  onUpdate: (updatedAction: any) => void;
}

const DelayActionModal: React.FC<DelayActionModalProps> = ({
  isOpen,
  onClose,
  actionId,
  onUpdate,
}) => {
  const [delayTime, setDelayTime] = useState<number>(0);
  const [delayFormat, setDelayFormat] = useState<string>("minutes");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAction = useCallback(async () => {
    if (!actionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = getTokenByPath();
      const { data } = await axios.get(
        `/api/workflows/actions/get/${actionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data.success) {
        const action = data?.data || {};
        setDelayTime(action.parameters?.delayTime || 0);
        setDelayFormat(action.parameters?.delayFormat || "minutes");
      }
    } catch (err: any) {
      console.error("Error fetching delay action:", err);
      setError("Failed to load action details.");
    } finally {
      setIsLoading(false);
    }
  }, [actionId]);

  useEffect(() => {
    if (isOpen && actionId) {
      fetchAction();
    }
  }, [isOpen, actionId, fetchAction]);

  const handleSave = async () => {
    if (!actionId) return;
    setIsSaving(true);
    setError(null);
    try {
      const token = getTokenByPath();
      const { data } = await axios.put(
        `/api/workflows/actions/update/${actionId}`,
        {
          parameters: {
            delayTime,
            delayFormat,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        onUpdate(data.data);
        onClose();
      }
    } catch (err: any) {
      console.error("Error saving delay action:", err);
      setError("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Content */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Clock className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Delay Settings
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Configure wait duration
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium">Loading settings...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm font-medium">
              {error}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Wait Duration
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={delayTime}
                      onChange={(e) =>
                        setDelayTime(parseInt(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500 outline-none transition-all"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="w-40">
                    <select
                      value={delayFormat}
                      onChange={(e) => setDelayFormat(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    >
                      <option value="seconds">Seconds</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 font-medium">
                  The workflow will pause for this amount of time before
                  continuing.
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="text-xs font-bold text-blue-800 mb-1">
                  Preview
                </h4>
                <p className="text-xs text-blue-600 font-medium">
                  Workflow will wait for{" "}
                  <span className="font-bold">
                    {delayTime} {delayFormat}
                  </span>
                  .
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
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
              disabled={isSaving || isLoading}
              className="flex-1 px-4 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DelayActionModal;
