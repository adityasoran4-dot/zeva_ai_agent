import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  Zap,
  Save,
  Loader2,
  MessageSquare,
  Cpu,
  Settings2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { clsx, type ClassValue } from "clsx";
import VariableMappingDropdown from "./VariableMappingDropdown";
import { WorkflowEntity } from "@/types/workflows";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface AiComposerActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: string | null;
  onUpdate: (updatedAction: any) => void;
  entity?: WorkflowEntity;
}

const AiComposerActionModal: React.FC<AiComposerActionModalProps> = ({
  isOpen,
  onClose,
  actionId,
  onUpdate,
  entity = "Lead",
}) => {
  const [prompt, setPrompt] = useState<string>("");
  const [model, setModel] = useState<string>("gemini-1.5-flash");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [outputKey, setOutputKey] = useState<string>("ai_response");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"prompt" | "settings">("prompt");

  const fetchAction = useCallback(async () => {
    if (!actionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = getTokenByPath();
      const { data } = await axios.get(
        `/api/workflows/actions/update/${actionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data.success) {
        const params = data.data.parameters || {};
        setPrompt(params.prompt || "");
        setModel(params.model || "gemini-1.5-flash");
        setTemperature(params.temperature ?? 0.7);
        setOutputKey(params.outputKey || "ai_response");
      }
    } catch (err: any) {
      console.error("Error fetching AI composer action:", err);
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
    if (!prompt.trim()) {
      setError("Prompt is required.");
      return;
    }
    if (!outputKey.trim()) {
      setError("Output key is required.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const token = getTokenByPath();
      const { data } = await axios.put(
        `/api/workflows/actions/update/${actionId}`,
        {
          parameters: {
            prompt,
            model,
            temperature,
            outputKey,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        onUpdate(data.data);
        onClose();
      }
    } catch (err: any) {
      console.error("Error saving AI composer action:", err);
      setError("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
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
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">AI Composer</h3>
              <p className="text-xs text-gray-500 font-medium">
                Generate dynamic content using AI
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

        {/* Tabs */}
        <div className="flex px-6 border-b border-gray-100 bg-gray-50/30">
          <button
            onClick={() => setActiveTab("prompt")}
            className={cn(
              "px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
              activeTab === "prompt"
                ? "border-yellow-500 text-yellow-600"
                : "border-transparent text-gray-400 hover:text-gray-600",
            )}
          >
            Prompt
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
              activeTab === "settings"
                ? "border-yellow-500 text-yellow-600"
                : "border-transparent text-gray-400 hover:text-gray-600",
            )}
          >
            Model Settings
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium">Loading AI settings...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm font-medium">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === "prompt" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" /> System
                      Prompt
                    </label>
                    <p className="text-xs text-gray-500">
                      Instruct the AI on how it should behave and what it should
                      compose. You can use variables from your workflow context.
                    </p>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. You are a helpful assistant. Draft a personalized follow-up message for {{lead.name}} who is interested in {{lead.service}}."
                      className="w-full h-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-yellow-500 outline-none transition-all resize-none"
                    />
                  </div>
                  <VariableMappingDropdown
                    onSelect={(value: string) =>
                      setPrompt((prev) => `${prev} ${value}`)
                    }
                    entity={entity}
                    nodeId={actionId as string}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-gray-400" /> Output
                      Variable
                    </label>
                    <p className="text-xs text-gray-500">
                      The generated response will be saved in this variable.
                    </p>
                    <input
                      type="text"
                      value={outputKey}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/\s+/g, "_")
                          .replace(/[^a-zA-Z0-9_]/g, "");
                        setOutputKey(val);
                      }}
                      placeholder="e.g. ai_response"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-gray-400" /> AI Model
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setModel("gemini-1.5-flash")}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all",
                          model === "gemini-1.5-flash"
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-gray-100 hover:border-gray-200",
                        )}
                      >
                        <div className="text-xs font-bold text-gray-900 mb-1">
                          Gemini 1.5 Flash
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Fast & cost-effective for most tasks
                        </div>
                      </button>
                      <button
                        onClick={() => setModel("gemini-1.5-pro")}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all",
                          model === "gemini-1.5-pro"
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-gray-100 hover:border-gray-200",
                        )}
                      >
                        <div className="text-xs font-bold text-gray-900 mb-1">
                          Gemini 1.5 Pro
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Advanced reasoning for complex prompts
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-gray-400" />{" "}
                        Temperature
                      </label>
                      <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                        {temperature}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      Higher values make the output more random, lower values
                      make it more focused and deterministic.
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) =>
                        setTemperature(parseFloat(e.target.value))
                      }
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-gray-400">
                      <span>PRECISE</span>
                      <span>CREATIVE</span>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50/50 rounded-xl border border-yellow-100 flex gap-3">
                    <Sparkles className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <p className="text-xs text-yellow-800 font-medium leading-relaxed">
                      Pro Tip: Be specific in your prompt. Include context about
                      the recipient and the goal of the message for better
                      results.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center gap-3 bg-gray-50/30">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 text-white rounded-xl text-sm font-bold hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiComposerActionModal;
