import { Provider } from "@/types/conversations";
import { Timer } from "lucide-react";
import React, { useState, useEffect } from "react";

interface IProps {
  selectedProvider: Provider | null;
  whatsappRemainingTime: string; // Format: "HH:MM"
}

const WhatsappTimer: React.FC<IProps> = ({
  whatsappRemainingTime,
  selectedProvider,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    const totalSeconds = convertToSeconds(whatsappRemainingTime);
    setTimeLeft(totalSeconds);

    if (totalSeconds <= 0) return;

    const newInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(newInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setIntervalId(newInterval);

    return () => clearInterval(newInterval);
  }, [whatsappRemainingTime]);

  function convertToSeconds(time: string) {
    if (!time || !time.includes(":")) return 0;
    const [hours, minutes] = time.split(":").map(Number);
    return isNaN(hours) || isNaN(minutes) ? 0 : hours * 3600 + minutes * 60;
  }

  function formatTime(seconds: number) {
    if (seconds <= 0) return "00:00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  }

  return (
    <>
      {selectedProvider?.type?.includes("whatsapp") ? (
        <div className="text-sm font-medium text-gray-700">
          <div
            className={`
              inline-flex items-center justify-center
              rounded-full px-3 py-1
              cursor-pointer gap-1.5 text-white
              transition-colors duration-200
              ${
                timeLeft > 0
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
              }
            `}
            title="WhatsApp conversation window"
          >
            <Timer size={14} className="flex-shrink-0" />
            <span className="text-xs font-semibold tracking-wide whitespace-nowrap">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default WhatsappTimer;
