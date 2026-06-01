import React, { useEffect, useState, useCallback } from "react";
import { X, Webhook, Save, Loader2, Copy, Check } from "lucide-react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface WebhookTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerId: string | null;
  onUpdate: (updatedTrigger: any) => void;
}

const WebhookTriggerModal: React.FC<WebhookTriggerModalProps> = ({
  isOpen,
  onClose,
  triggerId,
  onUpdate,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookListening, setWebhookListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchTrigger = useCallback(async () => {
    if (!triggerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = getTokenByPath();
      const { data } = await axios.get(
        `/api/workflows/triggers/update/${triggerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data.success) {
        setName(data.data.name || "");
        setDescription(data.data.description || "");
        setWebhookUrl(data.data.webhookUrl || "");
        setWebhookListening(data.data.webhookListening || false);
      }
    } catch (err: any) {
      console.error("Error fetching webhook trigger:", err);
      setError("Failed to load trigger details.");
    } finally {
      setIsLoading(false);
    }
  }, [triggerId]);

  useEffect(() => {
    if (isOpen && triggerId) {
      fetchTrigger();
    }
  }, [isOpen, triggerId, fetchTrigger]);

  const handleSave = async () => {
    if (!triggerId) return;
    setIsSaving(true);
    setError(null);
    try {
      const token = getTokenByPath();
      const { data } = await axios.put(
        `/api/workflows/triggers/update/${triggerId}`,
        { name, description, webhookUrl, webhookListening },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        onUpdate(data.data);
        onClose();
      }
    } catch (err: any) {
      console.error("Error saving webhook trigger:", err);
      setError("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end text-gray-500">
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
            <div className="p-2 bg-amber-50 rounded-lg">
              <Webhook className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Webhook Trigger
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Configure incoming webhook
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Trigger Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder:text-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    placeholder="Enter trigger name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder:text-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 outline-none transition-all min-h-[100px] resize-none"
                    placeholder="What does this webhook do?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Webhook URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl || "Generating URL..."}
                      className="flex-1 px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono text-gray-600 outline-none"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-500"
                      title="Copy URL"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium">
                    Send your HTTP POST requests to this URL to trigger the
                    workflow.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => setWebhookListening(!webhookListening)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                      webhookListening
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-white border-gray-100 text-gray-500 hover:border-gray-200",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full animate-pulse",
                          webhookListening ? "bg-amber-500" : "bg-gray-300",
                        )}
                      />
                      <span className="text-sm font-bold">
                        Listening for Events
                      </span>
                    </div>
                    <div
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors",
                        webhookListening ? "bg-amber-500" : "bg-gray-200",
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                          webhookListening ? "right-1" : "left-1",
                        )}
                      />
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="text-xs font-bold text-blue-800 mb-1">
                  Instructions
                </h4>
                <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                  1. Copy the webhook URL.
                  <br />
                  2. Set up your external service to send POST requests.
                  <br />
                  3. The payload data will be available in the workflow context.
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
              className="flex-1 px-4 py-3 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Trigger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookTriggerModal;
