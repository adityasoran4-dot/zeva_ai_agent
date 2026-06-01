import { OptionType } from "@/components/shared/CustomAsyncSelect";
import axios from "axios";
import moment from "moment";
import momentTimezone from "moment-timezone";
import toast from "react-hot-toast";

export const loadSegmentOptions = async (
  inputValue: string,
  token: string
): Promise<OptionType[]> => {
  let options: OptionType[] = [];
  try {
    const { data } = await axios.get("/api/segments/get-segments", {
      params: {
        name: inputValue,
        status: "active",
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    if (data?.success) {
      const segments = data?.segments || [];
      options = segments?.map((s: any) => ({ label: s?.name, value: s?._id }));
    }
  } catch (error) {
    options = [];
  }
  return options;
};

export const getChannelTitle = (
  channel: "sms" | "whatsapp" | "voice" | "email" | "chat"
) => {
  switch (channel) {
    case "sms":
      return "SMS";
    case "whatsapp":
      return "WhatsApp";
    case "email":
      return "Email";
    case "chat":
      return "Live Chat";
    default:
      return "";
  }
};

export const getFormatedTime = (timestamp: string) => {
  if (!timestamp) return "";

  const now = moment();
  const createdAt = moment(timestamp);
  const diffInSeconds = now.diff(createdAt, "seconds");
  const diffInDays = now.diff(createdAt, "days");

  if (diffInSeconds < 60) {
    return diffInSeconds === 1 ? "1 sec ago" : `${diffInSeconds} sec ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = moment.duration(diffInSeconds, "seconds").minutes();
    return minutes === 1 ? "1 min ago" : `${minutes} min ago`;
  } else if (diffInDays === 0) {
    return createdAt.format("h:mm A"); // Show time if today
  } else if (diffInDays === 1) {
    return "Yesterday"; // Show "Yesterday" if it's from the previous day
  } else if (diffInDays < 7) {
    return createdAt.format("dddd"); // Show the weekday if within the last week
  } else {
    return createdAt.format("MM/DD/YYYY"); // Show full date for older timestamps
  }
};

export const capitalize = (s: string) => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const handleError = (error: any) => {
  if (
    error &&
    error.response &&
    error.response.data &&
    error.response.data.message
  ) {
    toast.error(error.response.data.message);
  } else {
    toast.error(error?.message || "An unexpected error occurred");
  }
};

export const getMediaTypeFromMime = (mimetype: string) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "file";
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;

  if (bytes < mb) return `${(bytes / kb).toFixed(2)} KB`;
  if (bytes < gb) return `${(bytes / mb).toFixed(2)} MB`;
  return `${(bytes / gb).toFixed(2)} GB`;
};

export const handleUpload = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    // Get auth headers if available
    const authHeaders = getAuthHeaders() || {};
    
    const { data } = await axios.post("/api/upload", formData, {
      headers: {
        ...authHeaders,
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  } catch (error) {
    handleError(error);
    return null;
  }
};

export function getMediaTypeFromFile(
  file?: File | null
): "image" | "video" | "document" | "file" {
  if (!file) return "file";

  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";

  const docMimes = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "application/rtf",
    "application/vnd.oasis.opendocument.text",
  ]);
  if (docMimes.has(mime)) return "document";

  const ext = (file.name || "").split(".").pop()?.toLowerCase() || "";
  const imageExts = new Set([
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "bmp",
    "svg",
    "heic",
    "heif",
  ]);
  const videoExts = new Set([
    "mp4",
    "mov",
    "webm",
    "mkv",
    "avi",
    "flv",
    "wmv",
    "mpeg",
  ]);
  const docExts = new Set([
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
    "csv",
    "rtf",
    "odt",
  ]);
  if (imageExts.has(ext)) return "image";
  if (videoExts.has(ext)) return "video";
  if (docExts.has(ext) || ["zip", "rar", "7z"].includes(ext)) return "document";

  return "file";
}

export const formatScheduledTime = (
  scheduleDate: string,
  scheduleTime: string,
  timezone: string
): string => {
  try {
    if (!scheduleDate || !scheduleTime || !timezone) {
      return "Scheduled time not set";
    }

    // Combine date and time
    const scheduledMoment = momentTimezone.tz(
      `${scheduleDate} ${scheduleTime}`,
      "YYYY-MM-DD HH:mm",
      timezone
    );

    if (!scheduledMoment.isValid()) {
      return "Invalid schedule time";
    }

    // Format: "Jan 15, 2024 at 2:30 PM (EST)"
    return scheduledMoment.format("MMM D, YYYY [at] h:mm A [(]z[)]");
  } catch (error) {
    console.error("Error formatting scheduled time:", error);
    return "Error formatting schedule";
  }
};

export const getTokenByPath = () => {
  if (typeof window === "undefined") return null;

  const pathname = window.location.pathname;

  if (pathname?.includes("/clinic")) {
    return localStorage.getItem("clinicToken");
  } else if (pathname?.includes("/staff")) {
    return localStorage.getItem("agentToken");
  } else {
    // return localStorage.getItem("userToken");
    return localStorage.getItem("clinicToken");
  }
};

// Utility functions for masking sensitive information
export const maskSensitiveInfo = (info: string): string => {
  if (!info) return "—";

  if (info.includes("@")) {
    return maskEmail(info);
  } else {
    return maskPhoneNumber(info);
  }
};

export const maskPhoneNumber = (phone: string): string => {
  if (!phone) return "—";

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  if (digits.length <= 4) {
    return "XXX-XXXX";
  }

  // Show last 4 digits, mask the rest
  const lastFour = digits.slice(-4);
  const maskedPart = "X".repeat(Math.max(0, digits.length - 4));

  // Format based on length
  if (digits.length >= 10) {
    // For 10+ digit numbers, show area code pattern
    return `(${maskedPart.slice(0, 3)}) ${maskedPart.slice(3, 6)}-${lastFour}`;
  } else {
    return `${maskedPart}-${lastFour}`;
  }
};

export const maskEmail = (email: string): string => {
  if (!email) return "—";

  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "XXX@XXX.XXX";

  // Keep first character, mask the rest of local part
  const firstChar = localPart.charAt(0);
  const maskedLocal = firstChar + "X".repeat(Math.max(0, localPart.length - 1));

  // Mask domain (keep last part of domain like .com)
  const domainParts = domain.split(".");
  if (domainParts.length < 2) return `${maskedLocal}@XXX.XXX`;

  const maskedDomain = "X".repeat(Math.max(0, domainParts[0].length));
  const tld = domainParts.slice(1).join(".");

  return `${maskedLocal}@${maskedDomain}.${tld}`;
};

// Get authentication headers based on current user context
export const getAuthHeaders = () => {
  if (typeof window === "undefined") return null;

  const pathname = window.location.pathname;
  let token = null;

  if (pathname?.includes("/clinic")) {
    token = localStorage.getItem("clinicToken");
  } else if (pathname?.includes("/staff") || pathname?.includes("/agent")) {
    token = localStorage.getItem("agentToken") || localStorage.getItem("staffToken");
  } else if (pathname?.includes("/doctor")) {
    token = localStorage.getItem("doctorToken");
  } else {
    token = localStorage.getItem("userToken");
  }

  if (!token) {
    return null;
  }

  return {
    Authorization: `Bearer ${token}`,
    // Don't set Content-Type here - let axios/browser set it automatically for FormData
    // "Content-Type": "application/json",  // Removed to avoid conflicts with FormData
  };
};

// Get user role from current context
export const getUserRole = () => {
  if (typeof window === "undefined") return null;

  const pathname = window.location.pathname;
  
  if (pathname?.includes("/clinic")) return "clinic";
  if (pathname?.includes("/staff")) return "staff";
  if (pathname?.includes("/agent")) return "agent";
  if (pathname?.includes("/doctor")) return "doctor";
  return "user";
};
