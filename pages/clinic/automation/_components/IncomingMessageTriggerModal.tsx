import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  MessageSquare,
  Save,
  Loader2,
  Search,
  CheckCircle2,
  ChevronDown,
  Smartphone,
  Mail,
} from "lucide-react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { clsx, type ClassValue } from "clsx";
import useProvider from "@/hooks/useProvider";
import { FaWhatsapp } from "react-icons/fa";
import { Provider } from "@/types/conversations";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface IncomingMessageTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerId: string | null;
  onUpdate: (updatedTrigger: any) => void;
}

const IncomingMessageTriggerModal: React.FC<
  IncomingMessageTriggerModalProps
> = ({ isOpen, onClose, triggerId, onUpdate }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState<"sms" | "whatsapp" | "email">(
    "whatsapp",
  );
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [providerSearchTerm, setProviderSearchTerm] = useState("");

  const { smsProviders, whatsappProviders, emailProviders } = useProvider();

  const getFilteredProviders = () => {
    let providers: Provider[] = [];
    if (channel === "sms") providers = smsProviders;
    else if (channel === "whatsapp") providers = whatsappProviders;
    else if (channel === "email") providers = emailProviders;

    if (!providerSearchTerm) return providers;
    return providers.filter(
      (p: any) =>
        p.label?.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
        p.phone?.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(providerSearchTerm.toLowerCase()),
    );
  };

  const filteredProviders = getFilteredProviders();
  const selectedProvider = [
    ...smsProviders,
    ...whatsappProviders,
    ...emailProviders,
  ].find((p: any) => p._id === selectedProviderId);

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
        setChannel(data.data.channel || "whatsapp");
        setSelectedProviderId(data.data.providerId || "");
      }
    } catch (err: any) {
      console.error("Error fetching incoming message trigger:", err);
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
        { name, description, channel, providerId: selectedProviderId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        onUpdate(data.data);
        onClose();
      }
    } catch (err: any) {
      console.error("Error saving incoming message trigger:", err);
      setError("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const channelOptions = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: FaWhatsapp,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      id: "sms",
      label: "SMS",
      icon: Smartphone,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      id: "email",
      label: "Email",
      icon: Mail,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
  ];

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
            <div className="p-2 bg-blue-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Incoming Message Trigger
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Configure message reception
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder:text-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder:text-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[80px] resize-none"
                    placeholder="What does this trigger do?"
                  />
                </div>

                {/* Channel Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700">
                    Select Channel
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {channelOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = channel === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setChannel(opt.id as any);
                            setSelectedProviderId(""); // Reset provider when channel changes
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-2",
                            isSelected
                              ? cn(
                                  "border-blue-500 bg-blue-50 shadow-sm",
                                  opt.color,
                                )
                              : "border-gray-100 bg-white text-gray-400 hover:border-gray-200",
                          )}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-xs font-bold">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Provider Selection */}
                <div className="space-y-3 relative">
                  <label className="text-sm font-bold text-gray-700">
                    Select Provider
                  </label>
                  <div
                    onClick={() =>
                      setIsProviderDropdownOpen(!isProviderDropdownOpen)
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all"
                  >
                    <span className="truncate">
                      {selectedProvider
                        ? selectedProvider.label
                        : `Choose a ${channel} provider`}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        isProviderDropdownOpen && "rotate-180",
                      )}
                    />
                  </div>

                  {isProviderDropdownOpen && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                      <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search providers..."
                            value={providerSearchTerm}
                            onChange={(e) =>
                              setProviderSearchTerm(e.target.value)
                            }
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {filteredProviders.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 text-sm italic font-medium">
                            No providers found
                          </div>
                        ) : (
                          <ul className="py-2">
                            {filteredProviders.map((p: any) => (
                              <li
                                key={p._id}
                                className={cn(
                                  "px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors group",
                                  selectedProviderId === p._id && "bg-blue-50",
                                )}
                                onClick={() => {
                                  setSelectedProviderId(p._id);
                                  setIsProviderDropdownOpen(false);
                                  setProviderSearchTerm("");
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                      {p.label}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-medium">
                                      {channel === "email" ? p.email : p.phone}
                                    </span>
                                  </div>
                                  {selectedProviderId === p._id && (
                                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <h4 className="text-xs font-bold text-amber-800 mb-1">
                  How it works
                </h4>
                <p className="text-[11px] text-amber-600 font-medium leading-relaxed">
                  The workflow will trigger automatically whenever a new message
                  is received on the selected{" "}
                  <strong>{channel.toUpperCase()}</strong> provider.
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
              disabled={isSaving || isLoading || !selectedProviderId}
              className="flex-1 px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
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

export default IncomingMessageTriggerModal;
