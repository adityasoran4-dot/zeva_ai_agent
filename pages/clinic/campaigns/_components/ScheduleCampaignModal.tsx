import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface ScheduleCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduleData: {
    scheduleType: "now" | "later";
    scheduledDate?: string;
    scheduledTime?: string;
  }) => void;
  loading?: boolean;
}

const ScheduleCampaignModal: React.FC<ScheduleCampaignModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
  loading = false,
}) => {
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleSchedule = () => {
    setError(null);

    if (scheduleType === "later") {
      if (!scheduledDate) {
        setError("Please select a date");
        return;
      }
      if (!scheduledTime) {
        setError("Please select a time");
        return;
      }

      // Check if scheduled date/time is in the future
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const now = new Date();
      if (scheduledDateTime <= now) {
        setError("Scheduled date and time must be in the future");
        return;
      }
    }

    onSchedule({
      scheduleType,
      scheduledDate: scheduleType === "later" ? scheduledDate : undefined,
      scheduledTime: scheduleType === "later" ? scheduledTime : undefined,
    });
  };

  const handleClose = () => {
    setScheduleType("later");
    setScheduledDate("");
    setScheduledTime("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  // Get minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  // Get default time (1 hour from now)
  const defaultHour = String(today.getHours() + 1).padStart(2, "0");
  const defaultMinute = String(today.getMinutes()).padStart(2, "0");
  const defaultTime = `${defaultHour}:${defaultMinute}`;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end text-gray-500">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Schedule Campaign
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Choose when to send your campaign
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Schedule Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Schedule Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setScheduleType("now")}
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2",
                  scheduleType === "now"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300",
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <Calendar className="w-5 h-5" />
                  <span>Send Now</span>
                </div>
              </button>
              <button
                onClick={() => setScheduleType("later")}
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2",
                  scheduleType === "later"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300",
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <Clock className="w-5 h-5" />
                  <span>Schedule Later</span>
                </div>
              </button>
            </div>
          </div>

          {/* Date and Time Selection */}
          {scheduleType === "later" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Date Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Select Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={minDate}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-400 hover:border-blue-400 outline-none transition-all"
                />
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Select Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  defaultValue={defaultTime}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-400 hover:border-blue-400 outline-none transition-all"
                />
              </div>

              {/* Selected DateTime Preview */}
              {scheduledDate && scheduledTime && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-bold text-blue-900">
                      Scheduled Date & Time
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 font-medium">
                    {new Date(
                      `${scheduledDate}T${scheduledTime}`,
                    ).toLocaleString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Info Box */}
          {scheduleType === "now" && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-green-900">
                  Send Immediately
                </p>
                <p className="text-xs text-green-700 leading-relaxed font-medium">
                  Your campaign will be sent immediately to all recipients in
                  the selected segment.
                </p>
              </div>
            </div>
          )}

          {scheduleType === "later" && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-blue-900">
                  Scheduled Sending
                </p>
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  Your campaign will be automatically sent at the scheduled date
                  and time. Make sure all recipients are ready before
                  scheduling.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900">Error</p>
                <p className="text-xs text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={
                loading ||
                (scheduleType === "later" && !scheduledDate && !scheduledTime)
              }
              className="flex-1 px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              {scheduleType === "now" ? "Send Now" : "Schedule Campaign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCampaignModal;
