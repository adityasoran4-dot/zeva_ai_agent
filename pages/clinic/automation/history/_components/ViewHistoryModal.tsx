import React from "react";
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCw,
  SkipForward,
  Ban,
  Info,
  ChevronRight,
  Database,
  Terminal,
} from "lucide-react";
import { WorkflowHistory, WorkflowStatus } from "@/types/workflows";

interface ViewHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WorkflowHistory | null;
}

const ViewHistoryModal: React.FC<ViewHistoryModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!isOpen || !item) return null;

  const getStatusIcon = (status: WorkflowStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "in-progress":
        return <Play className="w-5 h-5 text-blue-500" />;
      case "waiting":
        return <Pause className="w-5 h-5 text-amber-500" />;
      case "skipped":
        return <SkipForward className="w-5 h-5 text-gray-500" />;
      case "canceled":
        return <Ban className="w-5 h-5 text-red-400" />;
      case "retrying":
        return <RotateCw className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: WorkflowStatus) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "failed":
        return "bg-red-50 text-red-700 border-red-100";
      case "in-progress":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "waiting":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "skipped":
        return "bg-gray-50 text-gray-700 border-gray-100";
      case "canceled":
        return "bg-red-50 text-red-700 border-red-100";
      case "retrying":
        return "bg-orange-50 text-orange-700 border-orange-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const renderJson = (data: any) => {
    if (!data || Object.keys(data).length === 0)
      return <span className="text-gray-400 italic">No data available</span>;
    return (
      <pre className="bg-gray-900 text-blue-300 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed border border-gray-800 shadow-inner">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative bg-[#0A1F44] p-6 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${getStatusColor(item.status)} bg-white/10 border-none`}
            >
              {getStatusIcon(item.status)}
            </div>
            <div>
              <h2 className="text-xl font-bold">Execution Details</h2>
              <p className="text-blue-200 text-sm mt-0.5">
                Log ID: <span className="font-mono">{item._id}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                <Terminal className="w-3.5 h-3.5" />
                Type & Name
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
                  {item.type}
                </span>
                <span className="text-gray-900 font-semibold">
                  {item.type === "trigger"
                    ? item.triggerId?.name
                    : item.type === "action"
                      ? item.actionId?.name
                      : item.conditionId?.name || "Workflow Component"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                <Clock className="w-3.5 h-3.5" />
                Execution Time
              </div>
              <p className="text-gray-900 font-semibold">
                {formatDate(item.executedAt || item.createdAt)}
              </p>
            </div>
          </div>

          {/* Workflow Info */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              <Database className="w-3.5 h-3.5" />
              Workflow Source
            </div>
            <p className="text-gray-900 font-semibold">
              {item.workflowId?.name}
            </p>
          </div>

          {/* Condition Result (if applicable) */}
          {item.type === "condition" && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                <Info className="w-3.5 h-3.5" />
                Condition Result
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    item.conditionResult
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.conditionResult ? "TRUE - Passed" : "FALSE - Failed"}
                </span>
              </div>
            </div>
          )}

          {/* Error Message (if any) */}
          {item.error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
                <AlertCircle className="w-3.5 h-3.5" />
                Error Details
              </div>
              <p className="text-red-700 text-sm font-medium">{item.error}</p>
            </div>
          )}

          {/* Details / Payload */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <ChevronRight className="w-4 h-4" />
              Execution Details (Meta Data)
            </h3>
            {renderJson(item.details)}
          </div>

          {/* Response (if any) */}
          {item.response && Object.keys(item.response).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                System Response
              </h3>
              {renderJson(item.response)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#0A1F44] text-white font-semibold rounded-xl hover:bg-blue-900 transition-all shadow-lg active:scale-95"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewHistoryModal;
