import { getTokenByPath } from "@/lib/helper";
import { Campaign } from "@/types/campaigns";
import axios from "axios";
import {
  Calendar,
  CheckCircle,
  FileText,
  Mail,
  MessageSquare,
  PauseCircle,
  RefreshCcw,
  Send,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaWhatsapp } from "react-icons/fa";

const useCampaigns = () => {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCampaigns, setTotalCampaigns] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [showDeleteCampaignModal, setShowDeleteCampaignModal] =
    useState<boolean>(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [deleteCampaignLoading, setDeleteCampaignLoading] =
    useState<boolean>(false);

  // Preview modal state
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // Create campaign modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);

  // Campaign actions modal
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [actionType, setActionType] = useState<
    "pause" | "resume" | "cancel" | ""
  >("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const campaignsPerPage = 9;

  const fetchCampaigns = useCallback(async () => {
    const token = getTokenByPath();
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get("/api/campaigns", {
        params: {
          page: currentPage,
          limit: campaignsPerPage,
          search: searchQuery,
          status: filterStatus === "all" ? undefined : filterStatus,
          type: filterType === "all" ? undefined : filterType,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res?.data?.success) {
        setCampaigns(res?.data?.data || []);
        setTotalPages(res?.data?.pagination?.totalPages || 1);
        setTotalCampaigns(res?.data?.pagination?.totalResults || 0);
      }
    } catch (error) {
      console.log("Error fetching campaigns: ", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterStatus, filterType, searchQuery, campaignsPerPage]);

  const refreshCampaigns = async () => {
    const token = getTokenByPath();
    if (!token) return;
    try {
      setIsRefreshing(true);
      await fetchCampaigns();
    } catch (error) {
      console.log("Error refreshing campaigns: ", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get campaign type icon
  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case "whatsapp":
        return <FaWhatsapp className="h-5 w-5 text-green-600" />;
      case "email":
        return <Mail className="h-5 w-5 text-red-500" />;
      case "sms":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      default:
        return <Send className="h-5 w-5" />;
    }
  };

  // Get campaign type badge
  const getCampaignTypeBadge = (type: string) => {
    const config: Record<string, { color: string; bg: string }> = {
      whatsapp: {
        color: "text-green-700",
        bg: "bg-green-50 border-green-100",
      },
      email: {
        color: "text-red-700",
        bg: "bg-red-50 border-red-100",
      },
      sms: {
        color: "text-blue-700",
        bg: "bg-blue-50 border-blue-100",
      },
    };

    const { color, bg } = config[type] || {
      color: "text-gray-700",
      bg: "bg-gray-50",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${bg} ${color}`}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { color: string; bg: string; icon: React.ReactNode; label: string }
    > = {
      draft: {
        color: "text-gray-700",
        bg: "bg-gray-50 border-gray-100",
        icon: <FileText className="h-3 w-3" />,
        label: "Draft",
      },
      scheduled: {
        color: "text-blue-700",
        bg: "bg-blue-50 border-blue-100",
        icon: <Calendar className="h-3 w-3" />,
        label: "Scheduled",
      },
      processing: {
        color: "text-purple-700",
        bg: "bg-purple-50 border-purple-100",
        icon: <RefreshCcw className="h-3 w-3" />,
        label: "Processing",
      },
      paused: {
        color: "text-yellow-700",
        bg: "bg-yellow-50 border-yellow-100",
        icon: <PauseCircle className="h-3 w-3" />,
        label: "Paused",
      },
      completed: {
        color: "text-green-700",
        bg: "bg-green-50 border-green-100",
        icon: <CheckCircle className="h-3 w-3" />,
        label: "Completed",
      },
      failed: {
        color: "text-red-700",
        bg: "bg-red-50 border-red-100",
        icon: <XCircle className="h-3 w-3" />,
        label: "Failed",
      },
    };

    const { color, bg, icon, label } = config[status] || {
      color: "text-gray-700",
      bg: "bg-gray-50",
      icon: <FileText className="h-3 w-3" />,
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${bg} ${color}`}
      >
        {icon}
        {label}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Calculate campaign progress percentage
  const calculateProgress = (campaign: Campaign) => {
    if (campaign.totalMessages === 0) return 0;
    if (campaign.status === "completed") return 100;

    const sent = campaign.sentMessages;
    const total = campaign.totalMessages;
    return Math.round((sent / total) * 100);
  };

  const handleCreateCampaign = async (campaignData: {
    name: string;
    description: string;
    type: "whatsapp" | "sms" | "email";
  }) => {
    const token = getTokenByPath();
    if (!token) return;

    try {
      setCreateLoading(true);
      const res = await axios.post(
        "/api/campaigns/create-campaign",
        campaignData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.success) {
        router.push(`/clinic/campaigns/${res.data.data._id}/edit`);
        setShowCreateModal(false);
        fetchCampaigns();
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle campaign actions
  const handleCampaignAction = async (action: string, campaignId: string) => {
    const token = getTokenByPath();
    if (!token) return;

    if (action === "edit") {
      router.push(`/clinic/campaigns/${campaignId}/edit`);
      return;
    }

    if (action === "preview") {
      const camp = campaigns.find((c) => c._id === campaignId) || null;
      if (camp) {
        setPreviewCampaign(camp);
        setShowPreviewModal(true);
      }
      return;
    }

    if (action === "duplicate") {
      const toastId = toast.loading("Duplicating campaign...");
      try {
        setIsDuplicating(true);
        const res = await axios.post(
          `/api/campaigns/duplicate/${campaignId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (res.data.success) {
          toast.success("Campaign duplicated successfully!", {
            id: toastId,
          });
          fetchCampaigns(); // Refresh the campaigns list
        } else {
          toast.error(res.data.message || "Failed to duplicate campaign", {
            id: toastId,
          });
        }
      } catch (error: any) {
        console.error("Error duplicating campaign: ", error);
        toast.error(
          error.response?.data?.message ||
            "An error occurred while duplicating the campaign",
          { id: toastId },
        );
      } finally {
        setIsDuplicating(false);
      }
      return;
    }

    if (action === "export") {
      try {
        const token = getTokenByPath();
        if (!token) return;
        setIsExporting(true);
        // Fetch the CSV file from the API
        const response = await axios.get(
          `/api/campaigns/export/${campaignId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: "blob", // Important for file download
          },
        );

        // Create a blob from the response
        const blob = new Blob([response.data], { type: "text/csv" });

        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Get campaign name for filename
        const campaign = campaigns.find((c) => c._id === campaignId);
        const fileName = campaign
          ? `${campaign.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_analytics.csv`
          : "campaign_analytics.csv";

        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error: any) {
        console.error("Error exporting campaign analytics:", error);

        // Handle error response
        if (error.response) {
          const errorData = await error.response.data.text();
          try {
            const errorJson = JSON.parse(errorData);
            alert(errorJson.message || "Failed to export campaign analytics");
          } catch {
            alert("Failed to export campaign analytics");
          }
        } else {
          alert("Failed to export campaign analytics");
        }
      } finally {
        setIsExporting(false);
      }
      return;
    }
  };

  const handleActionConfirm = async () => {
    const token = getTokenByPath();
    if (!selectedCampaign || !token) return;

    try {
      setActionLoading(true);
      let endpoint = "";
      let method: "post" | "put" = "post";

      switch (actionType) {
        case "pause":
          endpoint = `/api/campaigns/pause/${selectedCampaign._id}`;
          break;
        case "resume":
          endpoint = `/api/campaigns/resume/${selectedCampaign._id}`;
          break;
        case "cancel":
          endpoint = `/api/campaigns/cancel/${selectedCampaign._id}`;
          break;
      }

      const res = await axios[method](
        endpoint,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.success) {
        fetchCampaigns();
        setShowActionModal(false);
        setActionType("");
      }
    } catch (error) {
      console.log("Error performing campaign action: ", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCampaign = async (
    campaignId: string | undefined,
  ): Promise<void> => {
    const token = getTokenByPath();
    if (!token || !campaignId) {
      throw new Error("Missing required parameters");
    }

    setDeleteCampaignLoading(true);
    try {
      const res = await axios.delete(`/api/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.data?.success) {
        const filteredCampaigns = campaigns.filter((c) => c._id !== campaignId);
        setCampaigns(filteredCampaigns);
        setShowDeleteCampaignModal(false);
      } else {
        throw new Error(res?.data?.message || "Failed to delete campaign");
      }
    } catch (error: any) {
      console.error("Error deleting campaign: ", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete campaign",
      );
    } finally {
      setDeleteCampaignLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const state = {
    campaigns,
    currentPage,
    totalPages,
    totalCampaigns,
    loading,
    searchQuery,
    filterType,
    filterStatus,
    viewMode,
    isRefreshing,
    selectedCampaign,
    previewCampaign,
    showPreviewModal,
    showCreateModal,
    createLoading,
    showActionModal,
    actionType,
    actionLoading,
    showDeleteCampaignModal,
    deleteCampaignLoading,
    campaignsPerPage,
    isDuplicating,
    isExporting,
  };
  return {
    state,
    setCurrentPage,
    setFilterType,
    setFilterStatus,
    setViewMode,
    setIsRefreshing,
    setSelectedCampaign,
    setPreviewCampaign,
    setShowPreviewModal,
    setShowCreateModal,
    setCreateLoading,
    setShowActionModal,
    setActionType,
    setActionLoading,
    setSearchQuery,
    setShowDeleteCampaignModal,
    fetchCampaigns,
    handleCreateCampaign,
    handleCampaignAction,
    refreshCampaigns,
    handleActionConfirm,
    calculateProgress,
    formatDate,
    formatNumber,
    getStatusBadge,
    getCampaignTypeBadge,
    getCampaignTypeIcon,
    handleDeleteCampaign,
  };
};

export default useCampaigns;
