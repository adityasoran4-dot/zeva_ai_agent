import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, Send, Paperclip, File, Image } from "lucide-react";
import clsx from "clsx";

interface ScheduleMessageProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  conversationTitle?: string;
  onSchedule: (data: {
    scheduledDate: string;
    scheduledTime: string;
    scheduledTimezone: string;
  }) => Promise<void> | void;
  attachedFiles?: File[];
  loading?: boolean;
  message?: string;
}

const ScheduleMessage: React.FC<ScheduleMessageProps> = ({
  isOpen,
  onClose,
  conversationId,
  conversationTitle = "Untitled Conversation",
  onSchedule,
  attachedFiles = [],
  loading = false,
  message = "",
}) => {
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("");

  // Initialize with current date/time and user's timezone
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = `${String(now.getHours() + 1).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;

      setScheduledDate(dateStr);
      setScheduledTime(timeStr);
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [isOpen]);

  // Calculate min date (tomorrow) and min time
  const getMinDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const getMinTime = (): string => {
    const now = new Date();
    const selectedDate = new Date(scheduledDate);

    // If selected date is today, use current time + 5 minutes
    if (selectedDate.toDateString() === now.toDateString()) {
      now.setMinutes(now.getMinutes() + 5);
      return `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
    }

    return "00:00";
  };

  // Handle schedule submission
  const handleSchedule = async () => {
    if (!conversationId || !scheduledDate || !scheduledTime) return;

    const [year, month, day] = scheduledDate.split("-").map(Number);
    const [hours, minutes] = scheduledTime.split(":").map(Number);

    const scheduledDateTime = new Date(year, month - 1, day, hours, minutes);
    console.log({ scheduledDateTime });

    await onSchedule({
      scheduledDate,
      scheduledTime,
      scheduledTimezone: timezone,
    });
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Image className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    if (!scheduledDate || !scheduledTime || !conversationId) return false;

    const [year, month, day] = scheduledDate.split("-").map(Number);
    const [hours, minutes] = scheduledTime.split(":").map(Number);
    const scheduledDateTime = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();

    return scheduledDateTime > now;
  };

  // Calculate scheduled date object
  const getScheduledDateTime = (): Date | null => {
    if (!scheduledDate || !scheduledTime) return null;

    const [year, month, day] = scheduledDate.split("-").map(Number);
    const [hours, minutes] = scheduledTime.split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  };

  const scheduledDateTime = getScheduledDateTime();
  const minDate = getMinDate();
  const minTime = getMinTime();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-white" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                Schedule Message
              </h2>
            </div>
            <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
              Schedule when to send this message
            </p>
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
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 space-y-4">
            {/* Conversation Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Send className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 text-sm mb-1 truncate">
                    {conversationTitle}
                  </h4>
                  <p className="text-gray-600 text-xs">
                    Conversation ID: {conversationId?.substring(0, 8)}...
                  </p>
                </div>
              </div>
            </div>

            {/* Message Display */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Message
              </label>
              <div className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-gray-50 min-h-[80px]">
                {message ? (
                  <p className="text-gray-800 whitespace-pre-wrap">{message}</p>
                ) : (
                  <p className="text-gray-500 italic">No message provided</p>
                )}
              </div>
            </div>

            {/* Attached Files Display */}
            {attachedFiles.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  <Paperclip className="w-4 h-4 inline mr-2" />
                  Attached Files ({attachedFiles.length})
                </label>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="space-y-2">
                    {attachedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${file.size}-${index}`}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="text-gray-600">
                            {getFileIcon(file)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} • {file.type}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    These files will be sent along with the scheduled message.
                  </p>
                </div>
              </div>
            )}

            {/* Date and Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  <Calendar className="w-4 h-4 inline mr-2 mb-1" />
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={minDate}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
                    disabled={loading}
                  />
                </div>
                {scheduledDate && (
                  <p className="text-xs text-gray-600">
                    Selected: {formatDate(scheduledDate)}
                  </p>
                )}
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  <Clock className="w-4 h-4 inline mr-2 mb-1" />
                  Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={minTime}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
                    disabled={loading}
                  />
                </div>
                {timezone && (
                  <p className="text-xs text-gray-600">Timezone: {timezone}</p>
                )}
              </div>
            </div>

            {/* Schedule Preview */}
            {scheduledDateTime && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h4 className="font-bold text-blue-800 mb-1">
                      Schedule Preview
                    </h4>
                    <p className="text-blue-700 text-sm">
                      {message ? "Message and" : "Message"}
                      {attachedFiles.length > 0
                        ? ` ${attachedFiles.length} file${
                            attachedFiles.length > 1 ? "s" : ""
                          }`
                        : ""}
                      {attachedFiles.length > 0 && !message ? " will" : " will"}{" "}
                      be sent on{" "}
                      <span className="font-semibold">
                        {scheduledDateTime.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                    <p className="text-blue-700 text-xs mt-1">
                      {(() => {
                        const now = new Date();
                        const diff =
                          scheduledDateTime.getTime() - now.getTime();
                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const hours = Math.floor(
                          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                        );

                        if (days > 0) {
                          return `(${days} day${days > 1 ? "s" : ""} ${
                            hours > 0
                              ? `and ${hours} hour${hours > 1 ? "s" : ""}`
                              : ""
                          } from now)`;
                        }
                        return `(${hours} hour${
                          hours > 1 ? "s" : ""
                        } from now)`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Information Note */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-gray-500 mr-2 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">
                    About Scheduled Messages
                  </h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Scheduled messages will be sent automatically at the
                      specified time
                    </li>
                    {attachedFiles.length > 0 && (
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        Attached files ({attachedFiles.length}) will be included
                        in the scheduled message
                      </li>
                    )}
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      You can edit or cancel scheduled messages before they are
                      sent
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      All times are in your local timezone ({timezone})
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-t-gray-200 bg-gray-50 px-4 py-3 flex justify-between gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={!isFormValid() || loading}
            className={clsx(
              "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
              isFormValid() && !loading
                ? "bg-gray-800 text-white hover:bg-gray-900 cursor-pointer"
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
                Scheduling...
              </span>
            ) : (
              `Schedule Message`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMessage;
