// NotificationBell.tsx
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { io, Socket } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import SignaturePad from "signature_pad";
import { 
  BellIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserCircleIcon,
  CalendarIcon,
  TagIcon,
  ArrowTopRightOnSquareIcon,
  EnvelopeIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import { ClipboardListIcon } from "lucide-react";

interface AppNotification {
  _id: string;
  message: string;
  isRead: boolean;
  type?: string;
  relatedBlog?: string;
  relatedComment?: string;
  relatedJob?: string;
  relatedAcknowledgment?: string;
  createdAt: string;
  metadata?: {
    staffName?: string;
    phoneOtp?: string;
    emailOtp?: string;
    staffId?: string;
    staffEmail?: string;
    expiresAt?: string;
  };
}

interface DecodedToken {
  userId?: string;
  id?: string;
  [key: string]: unknown;
}

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => Promise<void>;
  title?: string;
  acknowledgmentId?: string;
}

let socket: Socket | null = null;

// Professional Signature Modal Component
const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title = "Draw Your eSignature",
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureExists, setSignatureExists] = useState(false);
  const signaturePadRef = useRef<SignaturePad>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Clear signature
  const clearSignature = useCallback(() => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setSignatureExists(false);
      setError(null);
    }
  }, []);

  // Helper function to trim canvas whitespace
  const trimCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = pixels.data;
    let top = canvas.height;
    let left = canvas.width;
    let right = 0;
    let bottom = 0;

    // Find the bounding box of non-transparent pixels
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = data[(y * canvas.width + x) * 4 + 3];
        if (alpha > 0) {
          if (y < top) top = y;
          if (y > bottom) bottom = y;
          if (x < left) left = x;
          if (x > right) right = x;
        }
      }
    }

    // Add padding
    const padding = 10;
    top = Math.max(0, top - padding);
    left = Math.max(0, left - padding);
    bottom = Math.min(canvas.height, bottom + padding);
    right = Math.min(canvas.width, right + padding);

    const width = right - left;
    const height = bottom - top;

    if (width <= 0 || height <= 0) return canvas;

    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = width;
    trimmedCanvas.height = height;
    const trimmedCtx = trimmedCanvas.getContext('2d');
    
    if (trimmedCtx) {
      trimmedCtx.drawImage(canvas, left, top, width, height, 0, 0, width, height);
    }

    return trimmedCanvas;
  };

  // Handle save with validation and error handling
  const handleSave = async () => {
    try {
      setError(null);
      
      if (!signaturePadRef.current) {
        throw new Error("Signature pad not initialized");
      }

      if (signaturePadRef.current.isEmpty()) {
        throw new Error("Please draw your signature before submitting");
      }

      setLoading(true);

      // Get the canvas element from the signature pad
      const canvas = signaturePadRef.current.canvas;
      
      // Trim the canvas to remove whitespace
      const trimmedCanvas = trimCanvas(canvas);
      
      // Convert to high-quality PNG
      const dataUrl = trimmedCanvas.toDataURL("image/png", 1.0);
      
      await onSave(dataUrl);
      
      clearSignature();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save signature");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div 
        ref={containerRef}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">Use mouse or touch to draw your signature</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Signature Pad Area */}
        <div className="p-6 space-y-4">
          <div className="relative bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-200">
            {/* <SignatureCanvas
              ref={signaturePadRef}
              {...SIGNATURE_CONFIG}
              onBegin={checkSignature}
              onEnd={checkSignature}
            /> */}
            
            {/* Watermark when empty */}
            {!signatureExists && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-gray-300 text-sm font-medium select-none">
                  Draw your signature here
                </span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={clearSignature}
              disabled={!signatureExists}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2
                ${signatureExists 
                  ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400' 
                  : 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed'
                }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !signatureExists}
                className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 flex items-center gap-2
                  ${loading || !signatureExists
                    ? 'bg-gradient-to-r from-blue-400 to-indigo-400 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                  }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit Signature
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Signature Tips */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-xs text-blue-700 flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Tips:</strong> Draw slowly for smoother lines • Use a stylus for best results • Sign within the box for proper scaling
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Hook for managing signature state
const useSignature = (acknowledgmentId?: string, token?: string | null) => {
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveSignature = async (dataUrl: string) => {
    try {
      setError(null);
      if (acknowledgmentId) {
        const response = await fetch(`/api/compliance/acknowledgments`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            acknowledgmentId,
            signatureDataUrl: dataUrl,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to save signature");
        }

        const json = await response.json();
        if (json.success && json.item) {
          setSignatureData(json.item.signatureDataUrl || dataUrl);
        }
      } else {
        setSignatureData(dataUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save signature");
      throw err;
    }
  };

  const clearSignature = () => {
    setSignatureData(null);
  };

  return {
    signatureData,
    isModalOpen,
    error,
    openModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
    saveSignature,
    clearSignature,
  };
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selected, setSelected] = useState<AppNotification | null>(null);
  const [ackDetails, setAckDetails] = useState<any | null>(null);
  const [docDetails, setDocDetails] = useState<any | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>("Document Preview");
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

  // Use the enhanced signature hook
  const {
    signatureData,
    isModalOpen: sigOpen,
    openModal: openSignatureModal,
    closeModal: closeSignatureModal,
    saveSignature,
    clearSignature: clearSignatureData,
  } = useSignature(selected?.relatedAcknowledgment, token);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const showToast = (message: string, type: "success" | "error" | "warning" = "error") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setIsClient(true);
    const t =
      (typeof window !== "undefined" &&
        (localStorage.getItem("agentToken") ||
         sessionStorage.getItem("agentToken") ||
         localStorage.getItem("userToken") ||
         sessionStorage.getItem("userToken") ||
         localStorage.getItem("token") ||
         sessionStorage.getItem("token"))) ||
      null;
    if (!t) return;
    setToken(t);

    const decoded = jwtDecode(t) as DecodedToken;
    const uid = decoded.userId || decoded.id as string | undefined;
    if (!uid) return;
    setUserId(uid);

    // Warm up Socket.IO server (Next.js API) to ensure namespace is ready
    fetch(`/api/push-notification/socketio`).catch(() => {});

    fetch(`/api/push-notification/reply-notifications?userId=${uid}`)
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch((err) => console.error("Error fetching notifications:", err));

    socket = io({
      path: "/api/push-notification/socketio",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      if (uid) socket?.emit("register", uid);
    });
    socket.emit("register", uid);

    socket.on("newNotification", (notif: AppNotification) => {
      if (Notification.permission === "granted") {
        new Notification("New Notification", { body: notif.message });
      }
      setNotifications((prev) => [{ ...notif, isRead: false }, ...prev]);
    });
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err?.message || err);
    });
    socket.on("reconnect", () => {
      if (uid) socket?.emit("register", uid);
    });

    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    return () => {
      socket?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (showPanel) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showPanel]);

  const handleTogglePanel = () => {
    const newState = !showPanel;
    setShowPanel(newState);

    if (newState && unreadCount > 0) {
      fetch(`/api/push-notification/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: notifications.filter((n) => !n.isRead).map((n) => n._id),
        }),
      }).then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      });
    }
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    fetch(`/api/push-notification/delete-notification?id=${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (selected?._id === id) {
          setSelected(null);
          setAckDetails(null);
          setDocDetails(null);
          clearSignatureData();
        }
      })
      .catch((err) => console.error("Delete error:", err));
  };

  const clearAllNotifications = () => {
    if (!userId) return;
    fetch(`/api/push-notification/clearAll-notification?userId=${userId}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() => {
        setNotifications([]);
        setSelected(null);
        setAckDetails(null);
        setDocDetails(null);
        clearSignatureData();
      })
      .catch((err) => console.error("Clear all error:", err));
  };

  const openAckDetails = async (n: AppNotification) => {
    setSelected(n);
    setAckDetails(null);
    setDocDetails(null);
    clearSignatureData();
    
    if (n.relatedAcknowledgment) {
      try {
        const res = await fetch(`/api/compliance/acknowledgments?id=${n.relatedAcknowledgment}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await res.json();
        if (json.success) {
          setAckDetails(json.item);
          
          // Set signature data if exists
          if (json.item.signatureDataUrl) {
            await saveSignature(json.item.signatureDataUrl);
          }
          
          if (json.item.status !== "Acknowledged") {
            try {
              await fetch(`/api/compliance/acknowledgments`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ acknowledgmentId: json.item._id, status: "Viewed" }),
              });
              setAckDetails((prev: any) => prev ? { ...prev, status: "Viewed" } : prev);
            } catch {}
          }
          try {
            const t = json.item.documentType;
            const id = json.item.documentId;
            const endpoint = t === "SOP" ? `/api/compliance/sops?id=${id}` : t === "Policy" ? `/api/compliance/policies?id=${id}` : `/api/compliance/playbooks?id=${id}`;
            const r2 = await fetch(endpoint, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
            const j2 = await r2.json();
            if (j2.success && j2.item) setDocDetails(j2.item);
          } catch {}
        }
      } catch (e) {}
    }
  };

  const getAuthHeaders = (): HeadersInit => {
    const t =
      (typeof window !== "undefined" &&
        (localStorage.getItem("agentToken") ||
         localStorage.getItem("userToken") ||
         localStorage.getItem("token"))) || null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const openViewer = (url?: string, title?: string) => {
    if (!url && !ackDetails) return;
    let targetUrl = url || "";
    const dt = ackDetails?.documentType;
    const did = ackDetails?.documentId;
    if (dt && did) {
      const t = dt === "SOP" ? "sops" : dt === "Playbook" ? "playbooks" : "policies";
      if (t) {
        targetUrl = `/api/compliance/file?type=${t}&id=${did}`;
      }
    }
    setViewerUrl(targetUrl);
    setViewerTitle(title || "Document Preview");
    setViewerError(null);
    setViewerOpen(true);
  };

  const loadPdfIntoModal = async (pdfUrl: string) => {
    try {
      setLoading(true);
      setViewerError(null);
      
      // Load PDF.js if not already loaded
      const w = window as any;
      if (!w.pdfjsLib) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load PDF viewer"));
          document.body.appendChild(s);
        });
        await new Promise<void>((resolve, reject) => {
          const sw = document.createElement("script");
          sw.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          sw.onload = () => resolve();
          sw.onerror = () => reject(new Error("Failed to load PDF worker"));
          document.body.appendChild(sw);
        });
      }
      
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      const origin = window.location.origin;
      let fullUrl = pdfUrl;
      if (pdfUrl.startsWith("http")) {
        try {
          const u = new URL(pdfUrl);
          if (origin.includes("localhost") && u.hostname !== "localhost") {
            fullUrl = `${origin}${u.pathname}`;
          }
        } catch {
          fullUrl = pdfUrl;
        }
      } else {
        fullUrl = `${origin}${pdfUrl}`;
      }

      const resp = await fetch(fullUrl, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (!resp.ok) throw new Error(`Failed to fetch PDF: ${resp.status} ${resp.statusText}`);
      
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      const task = pdfjsLib.getDocument({ url: objectUrl });
      const pdf = await task.promise;

      const container = document.getElementById("notif-pdf-container") as HTMLDivElement;
      if (!container) return;
      container.innerHTML = "";

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 1.3 });
        const canvas = document.createElement("canvas");
        canvas.style.display = "block";
        canvas.style.margin = "0 auto 20px auto";
        canvas.style.maxWidth = "100%";
        canvas.style.height = "auto";
        canvas.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
        canvas.style.borderRadius = "4px";
        
        const ctx = canvas.getContext("2d")!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        container.appendChild(canvas);
        
        await page.render({ canvasContext: ctx, viewport }).promise;
        
        // Add signature if document is acknowledged and has signature
        const shouldPlaceSignature = (ackDetails?.status === "Acknowledged" || !!ackDetails?.acknowledgedOn) && !!signatureData;
        if (shouldPlaceSignature && signatureData) {
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => {
              // Position signature at bottom right
              const padding = 20;
              const sigW = Math.min(200, canvas.width * 0.30);
              const sigH = Math.round(sigW * 0.40);
              const sx = canvas.width - sigW - padding;
              const sy = canvas.height - sigH - padding;
              ctx.save();
              ctx.globalAlpha = 0.98;
              ctx.drawImage(img, sx, sy, sigW, sigH);
              // Digital timestamp next to signature
              const whenStr = (() => {
                const ts =
                  (ackDetails as any)?.signatureAt
                    ? new Date((ackDetails as any).signatureAt)
                    : (ackDetails?.acknowledgedOn ? new Date(ackDetails.acknowledgedOn) : new Date());
                try {
                  return ts.toLocaleString(undefined, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  });
                } catch {
                  return ts.toISOString();
                }
              })();
              ctx.globalAlpha = 1;
              ctx.font = "11px Segoe UI, Arial, sans-serif";
              ctx.fillStyle = "#374151";
              const textY = sy + sigH + 14;
              ctx.fillText(`Signed: ${whenStr}`, Math.max(padding, sx - 160), textY);
              ctx.restore();
              resolve();
            };
            img.onerror = () => resolve();
            img.src = signatureData;
          });
        }
      }
      
      URL.revokeObjectURL(objectUrl);
      setLoading(false);
    } catch (error: any) {
      setViewerError(error?.message || "Failed to load document");
      const container = document.getElementById("notif-pdf-container") as HTMLDivElement;
      if (container) {
        container.innerHTML = `<div class="p-8 text-center">
          <div class="text-red-600 mb-2 font-semibold">Failed to load document</div>
          <div class="text-sm text-gray-500">${error?.message || "Unknown error"}</div>
          <button class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" onclick="window.location.reload()">Retry</button>
        </div>`;
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewerOpen && viewerUrl) {
      const prevent = (e: Event) => e.preventDefault();
      document.addEventListener("contextmenu", prevent);
      loadPdfIntoModal(viewerUrl);
      return () => {
        document.removeEventListener("contextmenu", prevent);
      };
    }
  }, [viewerOpen, viewerUrl]);

  const markAckStatus = async (status: "Viewed" | "Acknowledged") => {
    if (!ackDetails) return;
    try {
      if (status === "Acknowledged" && !signatureData && !ackDetails?.signatureDataUrl) {
        showToast("Signature is required to acknowledge", "warning");
        return;
      }
      setLoading(true);
      const res = await fetch(`/api/compliance/acknowledgments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ acknowledgmentId: ackDetails._id, status }),
      });
      const json = await res.json();
      if (json.success) {
        setAckDetails(json.item);
        if (viewerOpen && viewerUrl) {
          await loadPdfIntoModal(viewerUrl);
        }
      } else {
        showToast(json.message || "Unable to acknowledge", "error");
      }
      setLoading(false);
    } catch (e) {
      setLoading(false);
      showToast("Failed to update acknowledgment", "error");
    }
  };

  const handleSignatureSave = async (dataUrl: string) => {
    await saveSignature(dataUrl);
    if (ackDetails) {
      setAckDetails((prev: any) => ({
        ...prev,
        signatureDataUrl: dataUrl,
        signatureAt: new Date().toISOString(),
      }));
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch(type) {
      case 'acknowledgment':
        return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
      case 'blog-reply':
        return <EnvelopeIcon className="h-5 w-5 text-green-500" />;
      case 'job-status':
        return <CheckCircleIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Acknowledged':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircleSolid className="h-3 w-3 mr-1" /> Acknowledged</span>;
      case 'Viewed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><EyeIcon className="h-3 w-3 mr-1" /> Viewed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><ClockIcon className="h-3 w-3 mr-1" /> Pending</span>;
    }
  };

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="relative">
      <button 
        onClick={handleTogglePanel} 
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" 
        aria-label="Open notifications"
      >
        <BellIcon className="h-5 w-5 text-gray-600"/>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && isClient && createPortal(
        <div className="fixed inset-0 z-[1000]">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={handleTogglePanel} />
          {toast && (
            <div className={`absolute top-4 right-4 z-[1200] px-4 py-3 rounded-lg shadow-lg border text-sm ${toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : toast.type === "warning" ? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-red-50 border-red-200 text-red-800"}`}>
              {toast.message}
            </div>
          )}
          
          {/* Main Panel */}
          <div className="absolute inset-2 w-auto rounded-xl bg-white border border-gray-200 shadow-2xl flex flex-col overflow-hidden min-h-0 max-h-[90vh] animate-slide-in-right sm:inset-auto sm:right-4 sm:top-20 sm:bottom-4 sm:w-[480px] sm:rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <BellIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Notifications</h2>
                  <p className="text-xs text-gray-500">Stay updated with your activities</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button 
                    onClick={clearAllNotifications} 
                    className="text-xs px-2 sm:px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 font-medium"
                  >
                    Clear All
                  </button>
                )}
                <button 
                  onClick={handleTogglePanel} 
                  className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg hover:bg-gray-200/50 transition-colors duration-200"
                >
                  <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-4 sm:px-6 pt-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'all' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'unread' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50/50">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <BellIcon className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">No notifications</p>
                  <p className="text-gray-400 text-xs mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((n) => (
                    <button
                      key={n._id}
                      className={`w-full text-left p-3 sm:p-4 hover:bg-gray-50 transition-colors duration-200 group ${
                        selected?._id === n._id ? 'bg-blue-50/50' : ''
                      } ${!n.isRead ? 'bg-white' : 'bg-gray-50/50'}`}
                      onClick={() => {
                        if (n.type === "acknowledgment") {
                          openAckDetails(n);
                        } else if (n.type === "blog-reply" && n.relatedBlog) {
                          window.location.href = `/blogs/${n.relatedBlog}#${n.relatedComment}`;
                        } else if (n.type === "job-status" && n.relatedJob) {
                          window.location.href = `/job-details/${n.relatedJob}`;
                        }
                      }}
                    >
                      <div className="flex gap-2 sm:gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs sm:text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'} break-words pr-2`}>
                              {n.message}
                            </p>
                            <button
                              onClick={(e) => deleteNotification(n._id, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-50 rounded flex-shrink-0"
                            >
                              <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-xs text-gray-400">
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                            {!n.isRead && (
                              <span className="inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                            )}
                          </div>
                          {n.metadata && n.type === "acknowledgment" && (
                            <div className="mt-2 text-xs bg-blue-50 p-2 rounded-lg">
                              {n.metadata.staffName && (
                                <div className="flex items-center gap-1 text-blue-700">
                                  <UserCircleIcon className="h-3 w-3" />
                                  <span>{n.metadata.staffName}</span>
                                </div>
                              )}
                              {n.metadata.phoneOtp && n.metadata.emailOtp && (
                                <div className="mt-1 grid grid-cols-2 gap-2">
                                  <div className="bg-green-50 p-1 rounded text-center">
                                    <span className="text-green-700 font-bold">📱 {n.metadata.phoneOtp}</span>
                                  </div>
                                  <div className="bg-blue-50 p-1 rounded text-center">
                                    <span className="text-blue-700 font-bold">📧 {n.metadata.emailOtp}</span>
                                  </div>
                                </div>
                              )}
                              {n.metadata.expiresAt && (
                                <div className="mt-1 text-amber-600 flex items-center gap-1">
                                  <ClockIcon className="h-3 w-3" />
                                  <span>Expires: {new Date(n.metadata.expiresAt).toLocaleTimeString()}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Acknowledgment Details Modal */}
            {selected && ackDetails && (
              <div className="border-t border-gray-200 bg-white rounded-t-2xl shadow-lg flex-shrink-0 max-h-[50vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-900">Acknowledgment Details</h3>
                    </div>
                    <button 
                      onClick={() => {
                        setSelected(null);
                        setAckDetails(null);
                        setDocDetails(null);
                        clearSignatureData();
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <XMarkIcon className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="max-h-[40vh] overflow-y-auto pr-2">
                    <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-2">
                          <UserCircleIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">Staff Name</p>
                            <p className="text-sm font-medium text-gray-900 break-words">{ackDetails.staffName || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TagIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">Role</p>
                            <p className="text-sm font-medium text-gray-900 capitalize break-words">{ackDetails.role || '-'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">Document Name</p>
                            <p className="text-sm font-medium text-gray-900 break-words">{ackDetails.documentName || '-'}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <TagIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500">Type</p>
                              <p className="text-sm font-medium text-gray-900 break-words">{ackDetails.documentType || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TagIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500">Version</p>
                              <p className="text-sm font-medium text-gray-900 break-words">{ackDetails.version || '-'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusBadge(ackDetails.status)}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500">Assigned Date</p>
                              <p className="text-sm text-gray-900 break-words">
                                {ackDetails.assignedDate ? new Date(ackDetails.assignedDate).toLocaleDateString() : '-'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500">Due Date</p>
                              <p className="text-sm text-gray-900 break-words">
                                {ackDetails.dueDate ? new Date(ackDetails.dueDate).toLocaleDateString() : '-'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {ackDetails.acknowledgedOn && (
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500">Acknowledged On</p>
                              <p className="text-sm text-gray-900 break-words">
                                {new Date(ackDetails.acknowledgedOn).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {docDetails && (
                        <div className="space-y-3 mt-4 pt-3 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-700">Document Preview</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ackDetails.documentType === "SOP" && (
                              <>
                                <div className="flex items-center gap-2">
                                  <TagIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs text-gray-500">Category</p>
                                    <p className="text-sm font-medium text-gray-900 break-words">{docDetails.category || "-"}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TagIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs text-gray-500">Risk Level</p>
                                    <p className="text-sm font-medium text-gray-900 break-words">{docDetails.riskLevel || "-"}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2 col-span-2">
                                  <DocumentTextIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-500">SOP Content</p>
                                    <p className="text-sm text-gray-900 break-words whitespace-pre-wrap max-h-32 overflow-y-auto">
                                      {docDetails.content || "-"}
                                    </p>
                                  </div>
                                </div>
                                 {Array.isArray(docDetails.checklist) && docDetails.checklist.length > 0 && (
                                  <div className="flex items-start gap-2 col-span-2">
                                    <ClipboardListIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs text-gray-500">Step-by-Step Checklist</p>
                                      <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                                        {docDetails.checklist.slice(0, 6).map((step: any, idx: number) => (
                                          <div key={idx} className="text-sm text-gray-900 break-words">
                                            • {typeof step === "string" ? step : step?.text || step?.title || ""}
                                          </div>
                                        ))}
                                        {docDetails.checklist.length > 6 && (
                                          <div className="text-xs text-gray-500">+ {docDetails.checklist.length - 6} more</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            {ackDetails.documentType === "Policy" && (
                              <>
                                <div className="flex items-center gap-2">
                                  <TagIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs text-gray-500">Policy Type</p>
                                    <p className="text-sm font-medium text-gray-900 break-words">{docDetails.policyType || "-"}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2 col-span-2">
                                  <DocumentTextIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-500">Policy Description</p>
                                    <p className="text-sm text-gray-900 break-words whitespace-pre-wrap max-h-32 overflow-y-auto">{docDetails.description || "-"}</p>
                                  </div>
                                </div>
                              </>
                            )}
                            {ackDetails.documentType === "Playbook" && (
                              <>
                                <div className="flex items-center gap-2">
                                  <TagIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs text-gray-500">Trigger</p>
                                    <p className="text-sm font-medium text-gray-900 break-words">{docDetails.triggerCondition || "-"}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <UserCircleIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs text-gray-500">Owner</p>
                                    <p className="text-sm font-medium text-gray-900 break-words">{docDetails.ownerName || "-"}</p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                              {(docDetails.documentUrl || ackDetails.documentId) && (
                                <button 
                                  onClick={() => openViewer(docDetails.documentUrl, ackDetails.documentName)}
                                  className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1 hover:bg-blue-100 transition-colors"
                                >
                                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                  View Full Document
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      {ackDetails.status !== "Acknowledged" && (
                        <button 
                          onClick={() => markAckStatus("Acknowledged")} 
                          disabled={loading}
                          className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm flex items-center gap-1 disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircleSolid className="h-3 w-3 sm:h-4 sm:w-4" />
                              Acknowledge
                            </>
                          )}
                        </button>
                      )}
                      {ackDetails.status !== "Acknowledged" && (
                        <button
                          onClick={openSignatureModal}
                          className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                        >
                          {signatureData ? "Update Signature" : "Add Signature"}
                        </button>
                      )}
                      {ackDetails.status === "Acknowledged" && (
                        <span className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg flex items-center gap-1">
                          <CheckCircleSolid className="h-3 w-3 sm:h-4 sm:w-4" />
                          Acknowledged
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Document Viewer Modal */}
          {viewerOpen && viewerUrl && createPortal(
            <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-2 sm:p-4">
              <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl overflow-hidden mx-2 sm:mx-0">
                <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                    <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[70%]">{viewerTitle}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {loading && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        Loading...
                      </div>
                    )}
                    <button
                      onClick={() => { setViewerOpen(false); setViewerError(null); }}
                      className="rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm border hover:bg-gray-100 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
                {viewerError && (
                  <div className="p-3 sm:p-4 bg-red-50 border-b border-red-200">
                    <div className="text-red-700 text-xs sm:text-sm">{viewerError}</div>
                  </div>
                )}
                <div id="notif-pdf-container" className="h-[70vh] sm:h-[80vh] overflow-y-auto p-3 sm:p-4 bg-gray-100"></div>
              </div>
            </div>,
            document.body
          )}
        </div>,
        document.body
      )}

      {/* Signature Modal */}
      <SignatureModal
        isOpen={sigOpen}
        onClose={closeSignatureModal}
        onSave={handleSignatureSave}
        title="Draw Your eSignature"
        acknowledgmentId={selected?.relatedAcknowledgment}
      />

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
