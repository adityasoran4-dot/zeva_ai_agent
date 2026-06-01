import React, {
  JSX,
  ReactElement,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCw,
  SkipForward,
  Ban,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { NextPageWithLayout } from "@/pages/_app";
import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import Head from "next/head";
import { getTokenByPath } from "@/lib/helper";
import ViewHistoryModal from "./_components/ViewHistoryModal";
import {
  WorkflowActionType,
  WorkflowConditionType,
  WorkflowHistory,
  WorkflowStatus,
} from "@/types/workflows";

interface PaginationData {
  totalResults: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasMore: boolean;
}

interface Stats {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
}

const getActionName = (type: WorkflowActionType) => {
  switch (type) {
    case "send_email":
      return "Send Email";
    case "send_sms":
      return "Send SMS";
    case "send_whatsapp":
      return "Send WhatsApp";
    case "update_lead_status":
      return "Update Lead Status";
    case "add_tag":
      return "Add Tag";
    case "assign_owner":
      return "Assign Owner";
    case "rest_api":
      return "REST API Call";
    case "add_to_segment":
      return "Add to Segment";
    case "ai_composer":
      return "AI Composer";
    case "delay":
      return "Delay";
    case "router":
      return "Router";
    case "book_appointment":
      return "Book Appointment";
    default:
      return "Unknown Action";
  }
};

const getConditionName = (type: WorkflowConditionType) => {
  switch (type) {
    case "if_else":
      return "If-Else";
    case "filter":
      return "Filter";
    default:
      return "Unknown Condition";
  }
};

const WorkflowHistoryPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { workflowId } = router.query;

  const [history, setHistory] = useState<WorkflowHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] =
    useState<WorkflowHistory | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: 0,
  });
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const fetchHistory = useCallback(async () => {
    if (!workflowId) return;

    setLoading(true);
    setError(null);
    try {
      const token = getTokenByPath();
      const { data } = await axios.get(`/api/workflows/history/${workflowId}`, {
        params: {
          page: currentPage,
          limit: 10,
          status: selectedFilter !== "all" ? selectedFilter : undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setHistory(data.data);
        setPagination(data.pagination);

        // Calculate basic stats for this page (or overall if API provides)
        const currentStats = {
          total: data.pagination.totalResults,
          completed: data.pagination.totalCompleted,
          failed: data.pagination.totalFailed,
          inProgress: data.pagination.totalInProgress,
        };
        setStats(currentStats);
      } else {
        setError(data.message || "Failed to fetch history");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "An error occurred",
      );
    } finally {
      setLoading(false);
    }
  }, [workflowId, currentPage, selectedFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getStatusIcon = (status: WorkflowStatus): JSX.Element => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "in-progress":
        return <Play className="w-5 h-5 text-blue-500" />;
      case "waiting":
        return <Pause className="w-5 h-5 text-yellow-500" />;
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

  const getStatusColor = (status: WorkflowStatus): string => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "waiting":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "skipped":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "canceled":
        return "bg-red-50 text-red-700 border-red-100";
      case "retrying":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Not executed";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const toggleSelectItem = (id: string): void => {
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const toggleSelectAll = (): void => {
    if (selectedItems.length === history.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(history.map((item) => item._id));
    }
  };

  const handleRefresh = (): void => {
    fetchHistory();
  };

  const handleExport = async (): Promise<void> => {
    if (!workflowId) return;

    try {
      setIsExporting(true);
      const token = getTokenByPath();
      const response = await axios.get(
        `/api/workflows/history/export/${workflowId}`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `workflow-history-${workflowId}-${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Export failed:", err);
      setError(err.response?.data?.message || err.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRetry = async (item: WorkflowHistory): Promise<void> => {
    if (!item._id) return;
    try {
      const token = getTokenByPath();
      const { data } = await axios.post(
        `/api/workflows/history/retry/${item._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (data && data?.success) {
        setError(null);
        fetchHistory();
      } else {
        setError(data?.message || "Retry failed");
      }
    } catch (err: any) {
      console.error("Retry failed:", err);
      setError(err.response?.data?.message || err.message || "Retry failed");
    }
  };

  const handleView = (item: WorkflowHistory): void => {
    setSelectedHistoryItem(item);
    setIsViewModalOpen(true);
  };

  const getConditionResultColor = (result: boolean | null): string => {
    if (result === true) return "bg-green-100 text-green-800";
    if (result === false) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const getConditionResultText = (result: boolean | null): string => {
    if (result === true) return "Passed";
    if (result === false) return "Failed";
    return "N/A";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      <Head>
        <title>Workflow History | ZEVA</title>
      </Head>

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-3 p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div>
                <h1 className="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Workflow History
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  {history[0]?.workflowId?.name || "Workflow Execution Logs"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm disabled:opacity-50"
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Exporting..." : "Export"}
              </button>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#0A1F44] to-blue-900 hover:from-blue-900 hover:to-[#0A1F44] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Executions
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.total.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.completed.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.failed.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.inProgress.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Play className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left — status pill filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mr-1">
                Status
              </span>
              {[
                { value: "all", label: "All" },
                { value: "completed", label: "Completed" },
                { value: "failed", label: "Failed" },
                { value: "in-progress", label: "In Progress" },
                { value: "pending", label: "Pending" },
                { value: "waiting", label: "Waiting" },
                { value: "skipped", label: "Skipped" },
                { value: "canceled", label: "Canceled" },
                { value: "retrying", label: "Retrying" },
              ].map(({ value, label }) => {
                const isActive = selectedFilter === value;
                const colorMap: Record<string, string> = {
                  all: "bg-gray-900 text-white",
                  completed: "bg-emerald-500 text-white",
                  failed: "bg-red-500 text-white",
                  "in-progress": "bg-blue-500 text-white",
                  pending: "bg-amber-500 text-white",
                  waiting: "bg-cyan-500 text-white",
                  skipped: "bg-purple-500 text-white",
                  canceled: "bg-rose-500 text-white",
                  retrying: "bg-orange-500 text-white",
                };
                return (
                  <button
                    key={value}
                    onClick={() => {
                      setSelectedFilter(value);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 border ${
                      isActive
                        ? colorMap[value] + " border-transparent shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Right — search */}
            {/* <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search histories..."
                value={searchInput}
                onChange={handleSearchChange}
                onKeyDown={handleSearch}
                className="pl-9 pr-4 py-2 w-full bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div> */}
          </div>

          {/* Active filter indicator strip */}
          {selectedFilter !== "all" && (
            <div className="px-5 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
              <p className="text-xs text-blue-600 font-medium">
                Filtering by:{" "}
                <span className="font-bold capitalize">{selectedFilter}</span>
              </p>
              <button
                onClick={() => {
                  setSelectedFilter("all");
                  setCurrentPage(1);
                }}
                className="text-xs text-blue-500 hover:text-blue-700 font-semibold underline underline-offset-2 transition-colors"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>

        {/* Workflow History Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-500 font-medium">
                Loading history logs...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-500">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p className="text-lg font-bold">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900">
                No history logs found
              </h3>
              <p className="text-gray-500 max-w-xs mx-auto mt-2">
                We couldn't find any execution logs for this workflow. Try
                adjusting your filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedItems.length === history.length &&
                          history.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trigger / Condition / Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Condition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Executed At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((item) => (
                    <tr
                      key={item._id}
                      className={`hover:bg-gray-50 transition-colors duration-150 ${
                        selectedItems.includes(item._id) ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item._id)}
                          onChange={() => toggleSelectItem(item._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getStatusIcon(item.status)}
                          <span
                            className={`ml-2 px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${getStatusColor(item.status)} uppercase tracking-tight`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {item?.type === "trigger" && (
                          <div className="text-sm font-semibold text-gray-700">
                            {item.triggerId?.name || "Manual Trigger"}
                          </div>
                        )}
                        {item?.type === "condition" && item?.conditionId && (
                          <div className="text-sm font-semibold text-gray-700">
                            {getConditionName(item.conditionId?.type as any) ||
                              "System Condition"}
                          </div>
                        )}
                        {item?.type === "action" && item?.actionId && (
                          <div className="text-sm font-semibold text-gray-700">
                            {getActionName(item.actionId?.type as any) ||
                              "System Action"}{" "}
                            {item?.actionId?.type === "delay"
                              ? `for ${item?.actionId?.parameters?.delayTime} ${item?.actionId?.parameters?.delayFormat}`
                              : ""}
                          </div>
                        )}
                        <span className="text-xs text-gray-400">
                          {item?.type?.toUpperCase() || ""}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${getConditionResultColor(item.conditionResult)}`}
                          >
                            {getConditionResultText(item.conditionResult)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          {formatDate(item.executedAt || item.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.error ? (
                          <div
                            className="text-xs text-red-600 max-w-xs truncate font-medium flex items-center"
                            title={item.error}
                          >
                            <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                            {item.error}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 italic">
                            {Object.keys(item.details || {}).length > 0
                              ? "View properties"
                              : "No meta data"}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleView(item)}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-gray-600"
                            title="View Payload"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {item.status === "failed" &&
                            item.type === "action" && (
                              <button
                                onClick={() => handleRetry(item)}
                                className="p-1.5 hover:bg-red-200 rounded-lg transition-colors duration-200 text-red-600"
                                title="Retry"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalResults > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-bold text-gray-900">
                    {(currentPage - 1) * 10 + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-gray-900">
                    {Math.min(currentPage * 10, pagination.totalResults)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-gray-900">
                    {pagination.totalResults.toLocaleString()}
                  </span>{" "}
                  logs
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(pagination.totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
                        (pageNum >= currentPage - 1 &&
                          pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                              currentPage === pageNum
                                ? "bg-[#0A1F44] text-white shadow-md"
                                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return (
                          <span key={pageNum} className="text-gray-400 px-1">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasMore}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ViewHistoryModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        item={selectedHistoryItem}
      />
    </div>
  );
};

// Layout configuration
WorkflowHistoryPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={true} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

// Export protected page with auth
const ProtectedWorkflowHistoryPage = withClinicAuth(
  WorkflowHistoryPage,
) as NextPageWithLayout;
ProtectedWorkflowHistoryPage.getLayout = WorkflowHistoryPage.getLayout;

export default ProtectedWorkflowHistoryPage;
