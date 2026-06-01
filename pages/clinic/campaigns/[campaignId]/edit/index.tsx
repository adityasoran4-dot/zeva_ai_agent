import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import { NextPageWithLayout } from "@/pages/_app";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import {
  ArrowLeft,
  Save,
  Loader2,
  MessageSquare,
  Smartphone,
  Phone,
  Reply,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronDown,
  Users,
  Calendar,
  Upload,
  FileText,
  Eye,
  X,
  ExternalLink,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useRouter } from "next/router";
import useProvider from "@/hooks/useProvider";
import { Template } from "@/types/templates";
import { clsx, type ClassValue } from "clsx";
import ScheduleCampaignModal from "@/pages/clinic/campaigns/_components/ScheduleCampaignModal";
import { getMediaTypeFromFile, handleUpload, capitalize } from "@/lib/helper";
import { toast } from "react-toastify";
import VariableMappingDropdown from "@/pages/clinic/automation/_components/VariableMappingDropdown";
import { Campaign } from "@/types/campaigns";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const CampaignEditPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { campaignId } = router.query;
  const { whatsappProviders, smsProviders } = useProvider();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [whatsappMsgType, setWhatsappMsgType] =
    useState<string>("template-message");
  const [message, setMessage] = useState<string>("");
  const [headerText, setHeaderText] = useState<string>("");
  const [footerText, setFooterText] = useState<string>("");
  const [replyButtons, setReplyButtons] = useState<any[]>([]);
  const [listSections, setListSections] = useState<any[]>([]);
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [mediaType, setMediaType] = useState<string>("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("");
  const [segments, setSegments] = useState<any[]>([]);

  // Variable mappings
  const [variableMappings, setVariableMappings] = useState<
    Record<string, string>
  >({});
  const [headerVariableMappings, setHeaderVariableMappings] = useState<
    Record<string, string>
  >({});
  const [buttonVariableMappings, setButtonVariableMappings] = useState<
    Record<string, string>
  >({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Dropdown states
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [isSegmentDropdownOpen, setIsSegmentDropdownOpen] = useState(false);
  const [providerSearchTerm, setProviderSearchTerm] = useState("");
  const [templateSearchTerm, setTemplateSearchTerm] = useState("");
  const [segmentSearchTerm, setSegmentSearchTerm] = useState("");
  const providerDropdownRef = useRef<HTMLDivElement>(null);
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const segmentDropdownRef = useRef<HTMLDivElement>(null);

  const [recipientType, setRecipientType] = useState<"segment" | "manual">(
    "segment",
  );
  const [manualNumbers, setManualNumbers] = useState<string>("");

  const selectedTemplate = templates.find((t) => t._id === selectedTemplateId);
  const selectedProvider = (
    campaign?.type === "whatsapp"
      ? whatsappProviders
      : campaign?.type === "sms"
        ? smsProviders
        : []
  ).find((p) => p._id === selectedProviderId);

  const handleRemoveDuplicates = () => {
    const numbers = manualNumbers
      .split("\n")
      .map((num) => num.trim())
      .filter((num) => num !== "");

    const uniqueNumbers = [...new Set(numbers)];
    setManualNumbers(uniqueNumbers.join("\n"));

    const duplicates = numbers.filter(
      (num, index) => numbers.indexOf(num) !== index,
    );
    if (duplicates.length > 0) {
      toast.info(`Removed ${duplicates.length} duplicate number(s)`);
    }
  };

  // Theme colors based on campaign type
  const getThemeColors = () => {
    switch (campaign?.type) {
      case "whatsapp":
        return {
          primary: "green",
          primaryBg: "bg-green-600",
          primaryHover: "hover:bg-green-700",
          primaryShadow: "shadow-green-200",
          primaryLight: "bg-green-50",
          primaryBorder: "border-green-400",
          primaryText: "text-green-600",
          primaryTextHover: "hover:text-green-700",
          icon: <FaWhatsapp className="w-5 h-5 text-green-500" />,
        };
      case "sms":
        return {
          primary: "blue",
          primaryBg: "bg-blue-600",
          primaryHover: "hover:bg-blue-700",
          primaryShadow: "shadow-blue-200",
          primaryLight: "bg-blue-50",
          primaryBorder: "border-blue-400",
          primaryText: "text-blue-600",
          primaryTextHover: "hover:text-blue-700",
          icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
        };
      case "email":
        return {
          primary: "red",
          primaryBg: "bg-red-600",
          primaryHover: "hover:bg-red-700",
          primaryShadow: "shadow-red-200",
          primaryLight: "bg-red-50",
          primaryBorder: "border-red-400",
          primaryText: "text-red-600",
          primaryTextHover: "hover:text-red-700",
          icon: <MessageSquare className="w-5 h-5 text-red-500" />,
        };
      default:
        return {
          primary: "green",
          primaryBg: "bg-green-600",
          primaryHover: "hover:bg-green-700",
          primaryShadow: "shadow-green-200",
          primaryLight: "bg-green-50",
          primaryBorder: "border-green-400",
          primaryText: "text-green-600",
          primaryTextHover: "hover:text-green-700",
          icon: <MessageSquare className="w-5 h-5 text-gray-500" />,
        };
    }
  };

  const theme = getThemeColors();

  // Filter providers based on search
  const filteredProviders = (
    campaign?.type === "whatsapp"
      ? whatsappProviders
      : campaign?.type === "sms"
        ? smsProviders
        : []
  ).filter(
    (p) =>
      p.name.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
      p.label.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
      p.phone.toLowerCase().includes(providerSearchTerm.toLowerCase()),
  );

  // Filter templates based on search and provider
  const filteredTemplates = templates?.filter((item: Template) => {
    const typeMatch = selectedProvider?.type?.includes(item.templateType);
    const statusMatch = item?.status === "approved";
    const providerMatch =
      item?.templateType !== "whatsapp" ||
      item?.provider?._id === selectedProvider?._id;
    const searchMatch =
      templateSearchTerm === "" ||
      item.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
      item.uniqueName.toLowerCase().includes(templateSearchTerm.toLowerCase());

    return typeMatch && statusMatch && providerMatch && searchMatch;
  });

  // Filter segments based on search
  const filteredSegments = segments.filter(
    (s) =>
      s.name.toLowerCase().includes(segmentSearchTerm.toLowerCase()) ||
      (s.description &&
        s.description.toLowerCase().includes(segmentSearchTerm.toLowerCase())),
  );

  const selectedSegment = segments.find((s) => s._id === selectedSegmentId);

  const fetchTemplates = useCallback(async () => {
    try {
      if (!campaign) return;
      const token = getTokenByPath();
      const { data } = await axios.get(
        `/api/all-templates?limit=100&types=${campaign?.type || ""}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data.success) {
        const templatesData = data.templates || [];
        setTemplates(templatesData);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  }, [campaign?.type]);

  const fetchSegments = useCallback(async () => {
    try {
      const token = getTokenByPath();
      const { data } = await axios.get("/api/segments/get-segments?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setSegments(data.segments || []);
      }
    } catch (err) {
      console.error("Error fetching segments:", err);
    }
  }, []);

  const fetchCampaign = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = getTokenByPath();
      const { data } = await axios.get(`/api/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        const camp = data.campaign;
        setCampaign(camp);
        setName(camp.name || "");
        setDescription(camp.description || "");
        setSelectedProviderId(camp.sender?._id || camp.sender || "");
        setSelectedSegmentId(camp.segmentId?._id || camp.segmentId || "");
        setSelectedTemplateId(camp.template?._id || camp.template || "");
        setSelectedSegmentId(camp.segmentId?._id || camp.segmentId || "");
        setWhatsappMsgType(camp.whatsappMsgType || "template-message");
        setMessage(camp.content || "");
        setHeaderText(camp.headerText || "");
        setFooterText(camp.footerText || "");
        setReplyButtons(camp.replyButtons || []);
        setListSections(camp.listSections || []);
        setMediaUrl(camp.mediaUrl || "");
        setMediaType(camp.mediaType || "");
        setVariableMappings(camp.variableMappings || {});
        setHeaderVariableMappings(camp.headerVariableMappings || {});
        setButtonVariableMappings(camp.buttonVariableMappings || {});

        setRecipientType(camp.recipientType || "segment");
        setManualNumbers(camp.manualNumbers || "");
      }
    } catch (err) {
      console.error("Error fetching campaign:", err);
      setError("Failed to load campaign details.");
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchTemplates();
    fetchSegments();
    fetchCampaign();
  }, [fetchTemplates, fetchSegments, fetchCampaign]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        providerDropdownRef.current &&
        !providerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProviderDropdownOpen(false);
      }
      if (
        templateDropdownRef.current &&
        !templateDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTemplateDropdownOpen(false);
      }
      if (
        segmentDropdownRef.current &&
        !segmentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSegmentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddReplyButton = () => {
    setReplyButtons([
      ...replyButtons,
      { type: "reply", reply: { id: "", title: "" } },
    ]);
  };

  const handleUpdateReplyButton = (index: number, value: string) => {
    const newButtons = [...replyButtons];
    newButtons[index].reply.title = value;
    newButtons[index].reply.id = value.toLowerCase().replace(/\s+/g, "_");
    setReplyButtons(newButtons);
  };

  const handleDeleteReplyButton = (index: number) => {
    const newButtons = [...replyButtons];
    newButtons.splice(index, 1);
    setReplyButtons(newButtons);
  };

  const handleAddSection = () => {
    setListSections([
      ...listSections,
      { title: "", rows: [{ id: "", title: "", description: "" }] },
    ]);
  };

  const handleSectionTitleChange = (index: number, value: string) => {
    const newSections = [...listSections];
    newSections[index].title = value;
    setListSections(newSections);
  };

  const handleDeleteSection = (index: number) => {
    const newSections = [...listSections];
    newSections.splice(index, 1);
    setListSections(newSections);
  };

  const handleAddRow = (sectionIndex: number) => {
    const newSections = [...listSections];
    newSections[sectionIndex].rows.push({ id: "", title: "", description: "" });
    setListSections(newSections);
  };

  const handleRowChange = (
    sectionIndex: number,
    rowIndex: number,
    field: string,
    value: string,
  ) => {
    const newSections = [...listSections];
    newSections[sectionIndex].rows[rowIndex][field] = value;
    if (field === "title") {
      newSections[sectionIndex].rows[rowIndex].id = value
        .toLowerCase()
        .replace(/\s+/g, "_");
    }
    setListSections(newSections);
  };

  const handleDeleteRow = (sectionIndex: number, rowIndex: number) => {
    const newSections = [...listSections];
    newSections[sectionIndex].rows.splice(rowIndex, 1);
    setListSections(newSections);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const fileType = selectedFile.type;
      const fileSize = selectedFile.size;

      const maxSize = fileType.startsWith("image/")
        ? 5 * 1024 * 1024
        : fileType.startsWith("video/")
          ? 16 * 1024 * 1024
          : 100 * 1024 * 1024;

      if (fileSize > maxSize) {
        toast.warning(
          `File size exceeds the limit of ${maxSize / (1024 * 1024)}MB`,
        );
        e.target.value = "";
        return;
      }

      const type = selectedFile.type;
      if (type.startsWith("image/")) {
        setMediaType("image");
      } else if (type.startsWith("video/")) {
        setMediaType("video");
      } else if (type === "application/pdf") {
        setMediaType("document");
      }

      setAttachedFile(selectedFile);
    }
  };

  const handleTempVarValueChange = (
    key: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setVariableMappings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTempHeaderVarValueChange = (
    key: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setHeaderVariableMappings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderVariableInput = (
    key: string,
    index: number,
    isHeader: boolean = false,
  ) => (
    <div key={index} className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {isHeader ? "Header" : "Body"} variable {"{{"}
        {index + 1}
        {"}}"}:
      </label>
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={
                isHeader
                  ? headerVariableMappings[key] || ""
                  : variableMappings[key] || ""
              }
              onChange={(event) =>
                isHeader
                  ? handleTempHeaderVarValueChange(key, event)
                  : handleTempVarValueChange(key, event)
              }
              className={`w-full text-gray-500 text-sm px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl hover:border-${theme.primary}-400 focus:border-${theme.primary}-400 focus:outline-none focus:ring-2 focus:ring-${theme.primary}-500 focus:border-transparent transition-all`}
              placeholder={`Enter value for {{${index + 1}}}`}
            />
          </div>
        </div>
        <VariableMappingDropdown
          entity="Lead"
          onSelect={(value: string) => {
            if (isHeader) {
              setHeaderVariableMappings((prev) => ({
                ...prev,
                [key]: value,
              }));
            } else {
              setVariableMappings((prev) => ({
                ...prev,
                [key]: value,
              }));
            }
          }}
          nodeId={""}
        />
      </div>
    </div>
  );

  const handleSave = async () => {
    if (!campaignId) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const token = getTokenByPath();

      let mediaFileUrl = mediaUrl;
      let mediaFileType = mediaType;

      if (attachedFile) {
        const resData = await handleUpload(attachedFile);
        if (resData && resData?.success) {
          mediaFileUrl = resData?.url;
          mediaFileType = getMediaTypeFromFile(attachedFile);
          setMediaUrl(resData?.url);
          setMediaType(mediaFileType);
        }
      }

      const { data } = await axios.put(
        `/api/campaigns/${campaignId}`,
        {
          name,
          description,
          sender: selectedProviderId,
          template: selectedTemplateId,
          whatsappMsgType,
          content:
            whatsappMsgType === "template-message"
              ? selectedTemplate?.content || ""
              : message,
          headerText,
          footerText,
          replyButtons,
          listSections,
          mediaUrl: mediaFileUrl,
          mediaType: mediaFileType,
          variableMappings,
          headerVariableMappings,
          buttonVariableMappings,

          //
          recipientType, // Add this
          segmentId:
            recipientType === "segment" ? selectedSegmentId : undefined,
          manualNumbers: recipientType === "manual" ? manualNumbers : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        setSuccess("Campaign updated successfully!");
        router.back();
      }
    } catch (err: any) {
      console.error("Error saving campaign:", err);
      setError(err.response?.data?.message || "Failed to save campaign.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedule = async (scheduleData: {
    scheduleType: "now" | "later";
    scheduledDate?: string;
    scheduledTime?: string;
  }) => {
    if (!campaignId) return;

    setScheduleLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = getTokenByPath();

      let mediaFileUrl = mediaUrl;
      let mediaFileType = mediaType;

      if (attachedFile) {
        const resData = await handleUpload(attachedFile);
        if (resData && resData?.success) {
          mediaFileUrl = resData?.url;
          mediaFileType = getMediaTypeFromFile(attachedFile);
          setMediaUrl(resData?.url);
          setMediaType(mediaFileType);
        }
      }

      const { data } = await axios.put(
        `/api/campaigns/${campaignId}`,
        {
          name,
          description,
          sender: selectedProviderId,
          template: selectedTemplateId,
          whatsappMsgType,
          content:
            whatsappMsgType === "template-message"
              ? selectedTemplate?.content || ""
              : message,
          headerText,
          footerText,
          replyButtons,
          listSections,
          mediaUrl: mediaFileUrl,
          mediaType: mediaFileType,
          variableMappings,
          headerVariableMappings,
          buttonVariableMappings,
          scheduleType: scheduleData.scheduleType,
          scheduleTime: {
            date: scheduleData.scheduledDate,
            time: scheduleData.scheduledTime,
          },
          isDraft: false,

          recipientType, // Add this
          segmentId:
            recipientType === "segment" ? selectedSegmentId : undefined,
          manualNumbers: recipientType === "manual" ? manualNumbers : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        setShowScheduleModal(false);
        setSuccess(
          scheduleData.scheduleType === "now"
            ? "Campaign sent successfully!"
            : "Campaign scheduled successfully!",
        );
        router.back();
      }
    } catch (err: any) {
      console.error("Error scheduling campaign:", err);
      setError(err.response?.data?.message || "Failed to schedule campaign.");
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTemplate && selectedTemplate?.headerFileUrl) {
      setMediaUrl(selectedTemplate?.headerFileUrl || "");
      setMediaType(selectedTemplate?.headerType || "");
    } else {
      setMediaUrl("");
      setMediaType("");
    }

    // Reset variable mappings when template changes
    if (selectedTemplate) {
      setVariableMappings(campaign?.variableMappings || {} || {});
      setHeaderVariableMappings(campaign?.headerVariableMappings || {} || {});
      setButtonVariableMappings(campaign?.buttonVariableMappings || {});
    }
  }, [selectedTemplate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="p-6 bg-white rounded-2xl border border-red-100 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Error</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/clinic/campaigns")}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Edit Campaign
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Update your campaign details and message
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={
                  isSaving ||
                  !name ||
                  !selectedProviderId ||
                  !selectedTemplateId ||
                  (recipientType === "segment" && !selectedSegmentId) ||
                  (recipientType === "manual" &&
                    (!manualNumbers.trim() ||
                      manualNumbers.split("\n").filter((n) => n.trim()).length >
                        5000)) ||
                  !whatsappMsgType ||
                  (whatsappMsgType === "template-message" && !selectedTemplate)
                }
                className={`px-6 py-2.5 ${theme.primaryBg} text-white text-sm font-bold rounded-xl ${theme.primaryHover} transition-all shadow-lg ${theme.primaryShadow} flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
              <button
                onClick={() => setShowScheduleModal(true)}
                disabled={
                  isSaving ||
                  !name ||
                  !selectedProviderId ||
                  !selectedTemplateId ||
                  (recipientType === "segment" && !selectedSegmentId) ||
                  (recipientType === "manual" &&
                    (!manualNumbers.trim() ||
                      manualNumbers.split("\n").filter((n) => n.trim()).length >
                        5000)) ||
                  !whatsappMsgType ||
                  (whatsappMsgType === "template-message" && !selectedTemplate)
                }
                className="px-6 py-2.5 bg-blue-900 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Campaign Details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                Campaign Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter campaign name"
                    className={`w-full px-4 py-2.5 bg-gray-50 text-gray-500 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-${theme.primary}-500 focus:border-${theme.primary}-400 hover:border-${theme.primary}-400 outline-none transition-all`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter campaign description"
                    rows={3}
                    className={`w-full px-4 py-2.5 text-gray-500 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-${theme.primary}-500 focus:border-${theme.primary}-400 hover:border-${theme.primary}-400 outline-none transition-all resize-none`}
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type
                  </label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 capitalize">
                    {campaign?.type}
                  </div>
                </div> */}
              </div>
            </div>

            {/* WhatsApp Configuration */}
            {(campaign?.type === "whatsapp" || campaign?.type === "sms") && (
              <div
                className={`bg-white rounded-2xl border border-gray-200 p-6 space-y-4`}
              >
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {theme.icon}
                  {campaign?.type === "whatsapp"
                    ? "WhatsApp"
                    : campaign?.type === "sms"
                      ? "SMS"
                      : "Email"}{" "}
                  Configuration
                </h2>

                {/* Provider Selection */}
                <div className="space-y-3 relative" ref={providerDropdownRef}>
                  <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> Sender{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div
                    onClick={() =>
                      setIsProviderDropdownOpen(!isProviderDropdownOpen)
                    }
                    className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 flex items-center justify-between cursor-pointer hover:border-${theme.primary}-400 focus:border-${theme.primary}-400 transition-all`}
                  >
                    <span className="truncate">
                      {selectedProvider
                        ? selectedProvider.label
                        : "Choose a sender"}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        isProviderDropdownOpen && "rotate-180",
                      )}
                    />
                  </div>

                  {isProviderDropdownOpen && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                      <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search senders..."
                            value={providerSearchTerm}
                            onChange={(e) =>
                              setProviderSearchTerm(e.target.value)
                            }
                            className={`w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-${theme.primary}-500 focus:border-${theme.primary}-400 outline-none transition-all`}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {filteredProviders.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 text-sm italic font-medium">
                            No senders found
                          </div>
                        ) : (
                          <ul className="py-2">
                            {filteredProviders.map((p) => (
                              <li
                                key={p._id}
                                className={cn(
                                  "px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors group",
                                  selectedProviderId === p._id
                                    ? theme.primaryLight
                                    : "",
                                )}
                                onClick={() => {
                                  setSelectedProviderId(p._id);
                                  setIsProviderDropdownOpen(false);
                                  setProviderSearchTerm("");
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span
                                      className={`text-sm font-bold text-gray-900 group-hover:${theme.primaryText} transition-colors`}
                                    >
                                      {p.label}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-medium">
                                      {p.phone}
                                    </span>
                                  </div>
                                  {selectedProviderId === p._id && (
                                    <CheckCircle2
                                      className={`w-4 h-4 ${theme.primaryText}`}
                                    />
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

                {/* Recipient Type Tabs */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" /> Recipient Type
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="flex gap-2 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => setRecipientType("segment")}
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition-all relative",
                        recipientType === "segment"
                          ? `${theme.primaryText} border-b-2 border-${theme.primary}-500`
                          : "text-gray-500 hover:text-gray-700",
                      )}
                    >
                      <Users className="w-4 h-4 inline mr-2" />
                      Segment
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientType("manual")}
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition-all relative",
                        recipientType === "manual"
                          ? `${theme.primaryText} border-b-2 border-${theme.primary}-500`
                          : "text-gray-500 hover:text-gray-700",
                      )}
                    >
                      <Phone className="w-4 h-4 inline mr-2" />
                      Manual Numbers
                    </button>
                  </div>
                </div>

                {/* Segment Selection (shown when recipientType is "segment") */}
                {/* Recipients (Segment) Selection */}
                {recipientType === "segment" && (
                  <div className="space-y-3 relative" ref={segmentDropdownRef}>
                    <label className="text-sm font-bold text-gray-900 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" /> Recipients
                        (Segment) <span className="text-red-500">*</span>
                      </div>
                      <button
                        onClick={() => router.push("/clinic/segments")}
                        className="text-sm text-blue-500 underline font-normal flex items-center gap-2"
                      >
                        create segment <ExternalLink className="w-4 h-4" />
                      </button>
                    </label>
                    <div
                      onClick={() =>
                        setIsSegmentDropdownOpen(!isSegmentDropdownOpen)
                      }
                      className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 flex items-center justify-between cursor-pointer hover:border-${theme.primary}-400 focus:border-${theme.primary}-400 transition-all`}
                    >
                      <span className="truncate">
                        {selectedSegment
                          ? `${selectedSegment.name} (${
                              selectedSegment.leads?.length || 0
                            } leads)`
                          : "Choose a segment"}
                      </span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform",
                          isSegmentDropdownOpen && "rotate-180",
                        )}
                      />
                    </div>

                    {isSegmentDropdownOpen && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search segments..."
                              value={segmentSearchTerm}
                              onChange={(e) =>
                                setSegmentSearchTerm(e.target.value)
                              }
                              className={`w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-${theme.primary}-500 focus:border-${theme.primary}-400 outline-none transition-all`}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {filteredSegments.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm italic font-medium">
                              No segments found
                            </div>
                          ) : (
                            <ul className="py-2">
                              {filteredSegments.map((s) => (
                                <li
                                  key={s._id}
                                  className={cn(
                                    "px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors group",
                                    selectedSegmentId === s._id
                                      ? theme.primaryLight
                                      : "",
                                  )}
                                  onClick={() => {
                                    setSelectedSegmentId(s._id);
                                    setIsSegmentDropdownOpen(false);
                                    setSegmentSearchTerm("");
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span
                                        className={`text-sm font-bold text-gray-900 group-hover:${theme.primaryText} transition-colors`}
                                      >
                                        {s.name}
                                      </span>
                                      <span className="text-[10px] text-gray-500 font-medium">
                                        {s.leads?.length || 0} leads
                                      </span>
                                    </div>
                                    {selectedSegmentId === s._id && (
                                      <CheckCircle2
                                        className={`w-4 h-4 ${theme.primaryText}`}
                                      />
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
                )}

                {/* Manual Numbers Input (shown when recipientType is "manual") */}
                {recipientType === "manual" && (
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-900 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" /> WhatsApp
                        Numbers
                        <span className="text-red-500">*</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Max 5000 numbers
                      </span>
                    </label>

                    <div className="relative">
                      <textarea
                        value={manualNumbers}
                        onChange={(e) => setManualNumbers(e.target.value)}
                        placeholder="Enter phone numbers with country code (e.g., 919876543210)
One number per line Max 5000 numbers"
                        rows={8}
                        className={cn(
                          `w-full px-4 py-3 bg-gray-50 text-gray-500 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-${theme.primary}-500 focus:border-${theme.primary}-400 outline-none transition-all resize-y`,
                          !manualNumbers && recipientType === "manual"
                            ? `border-${theme.primary}-500`
                            : "border-gray-200",
                        )}
                      />

                      {/* Remove Duplicate Button */}
                      {manualNumbers.trim() && (
                        <button
                          type="button"
                          onClick={handleRemoveDuplicates}
                          className="absolute bottom-3 right-3 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-1 shadow-sm"
                        >
                          <X className="w-3 h-3" />
                          Remove Duplicate
                        </button>
                      )}
                    </div>

                    {/* Numbers Counter */}
                    {manualNumbers.trim() && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          Total numbers:{" "}
                          <strong className="text-gray-700">
                            {
                              manualNumbers.split("\n").filter((n) => n.trim())
                                .length
                            }
                          </strong>{" "}
                          / 5000
                        </span>
                        {manualNumbers.split("\n").filter((n) => n.trim())
                          .length > 5000 && (
                          <span className="text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Exceeds limit
                          </span>
                        )}
                      </div>
                    )}

                    <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                      💡 Numbers must include country code (e.g., 91 for India).
                      Example: 919876543210
                    </div>
                  </div>
                )}

                {/* Message Type */}
                {/* <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Template Message", value: "template-message" },
                      { label: "Non Template", value: "non-template-message" },
                      { label: "Reply Buttons", value: "reply-button-message" },
                      { label: "List Message", value: "list-message" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setWhatsappMsgType(option.value)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-sm font-medium transition-all",
                          whatsappMsgType === option.value
                            ? `${theme.primaryBg} text-white shadow-md`
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div> */}

                {/* Template Selection */}
                {whatsappMsgType === "template-message" && (
                  <div className="space-y-3 relative" ref={templateDropdownRef}>
                    <label className="text-sm font-bold text-gray-900 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        Template <span className="text-red-500">*</span>
                      </div>
                      <button
                        onClick={() => router.push("/clinic/all-templates")}
                        className="text-sm text-blue-500 underline font-normal flex items-center gap-2"
                      >
                        create template <ExternalLink className="w-4 h-4" />
                      </button>
                    </label>
                    <div
                      onClick={() =>
                        setIsTemplateDropdownOpen(!isTemplateDropdownOpen)
                      }
                      className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 flex items-center justify-between cursor-pointer hover:border-${theme.primary}-400 focus:border-${theme.primary}-400 transition-all`}
                    >
                      <span className="truncate">
                        {selectedTemplate
                          ? selectedTemplate.name
                          : `Choose a ${campaign?.type === "whatsapp" ? "WhatsApp" : "SMS"} template`}
                      </span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform",
                          isTemplateDropdownOpen && "rotate-180",
                        )}
                      />
                    </div>

                    {isTemplateDropdownOpen && (
                      <div
                        ref={templateDropdownRef}
                        className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                      >
                        <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search templates..."
                              value={templateSearchTerm}
                              onChange={(e) =>
                                setTemplateSearchTerm(e.target.value)
                              }
                              className={`w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-${theme.primary}-500 focus:border-${theme.primary}-400 outline-none transition-all`}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {filteredTemplates.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm italic font-medium">
                              No templates found
                            </div>
                          ) : (
                            <ul className="py-2">
                              {filteredTemplates.map((t) => (
                                <li
                                  key={t._id}
                                  className={cn(
                                    "px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors group",
                                    selectedTemplateId === t._id
                                      ? theme.primaryLight
                                      : "",
                                  )}
                                  onClick={() => {
                                    setSelectedTemplateId(t._id);
                                    setIsTemplateDropdownOpen(false);
                                    setTemplateSearchTerm("");
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span
                                        className={`text-sm font-bold text-gray-900 group-hover:${theme.primaryText} transition-colors`}
                                      >
                                        {t.name}
                                      </span>
                                      <span className="text-[10px] text-gray-500 font-medium">
                                        {t.category.toUpperCase()} •{" "}
                                        {t.language}
                                      </span>
                                    </div>
                                    {selectedTemplateId === t._id && (
                                      <CheckCircle2
                                        className={`w-4 h-4 ${theme.primaryText}`}
                                      />
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Variable Mappings for Template */}
                    {selectedTemplate && (
                      <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
                        {/* Header Variables - Text Type */}
                        {selectedTemplate?.headerType === "text" &&
                          selectedTemplate?.headerText && (
                            <div className="mb-6">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                Header
                              </h4>
                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <p className="text-sm text-gray-800">
                                  {selectedTemplate?.headerText}
                                </p>
                              </div>
                            </div>
                          )}

                        {/* Media Template Header */}
                        {selectedTemplate?.headerType &&
                          selectedTemplate?.headerType !== "text" &&
                          selectedTemplate?.headerFileUrl && (
                            <div className="mb-6">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                Attachment
                              </h4>
                              <button
                                onClick={() =>
                                  window.open(
                                    selectedTemplate?.headerFileUrl,
                                    "_blank",
                                  )
                                }
                                className="bg-green-600 rounded-lg flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-green-700 text-white"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                            </div>
                          )}

                        {/* Header Variables */}
                        {selectedTemplate?.headerVariables?.length > 0 && (
                          <div className="space-y-4 mb-6">
                            <h4 className="text-sm font-semibold text-gray-700">
                              Header Variables
                            </h4>
                            {selectedTemplate?.headerVariables?.map(
                              (key: string, index: number) =>
                                renderVariableInput(key, index, true),
                            )}
                          </div>
                        )}

                        {/* Body Section */}
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Message Body
                          </h4>
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                              {selectedTemplate?.content}
                            </pre>
                          </div>
                        </div>

                        {/* Body Variables */}
                        {selectedTemplate &&
                          selectedTemplate?.variables?.length > 0 && (
                            <div className="space-y-4 mb-6">
                              <h4 className="text-sm font-semibold text-gray-700">
                                Fill Variables
                              </h4>
                              {selectedTemplate?.variables?.map(
                                (key: string, index: number) =>
                                  renderVariableInput(key, index, false),
                              )}
                            </div>
                          )}

                        {/* File Upload for Media Headers */}
                        {selectedTemplate?.isHeader &&
                          selectedTemplate?.headerType !== "text" && (
                            <div className="mb-6">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                Upload{" "}
                                {capitalize(selectedTemplate?.headerType)}
                              </h4>
                              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                                <div className="flex flex-col items-center">
                                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                    <Upload className="w-8 h-8 text-gray-500" />
                                  </div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">
                                    Drop your file here or click to browse
                                  </p>
                                  <p className="text-xs text-gray-500 mb-4">
                                    Supports{" "}
                                    {selectedTemplate?.headerType === "image"
                                      ? "JPG, PNG up to 5MB"
                                      : selectedTemplate?.headerType === "video"
                                        ? "MP4, 3GP up to 16MB"
                                        : "PDF, DOC, PPT up to 100MB"}
                                  </p>
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      className="hidden"
                                      onChange={handleFileChange}
                                      accept={
                                        selectedTemplate?.headerType === "image"
                                          ? "image/jpeg,image/jpg,image/png"
                                          : selectedTemplate?.headerType ===
                                              "video"
                                            ? "video/mp4,video/3gp"
                                            : ".pdf,.doc,.docx,.pptx,.xlsx"
                                      }
                                    />
                                    <span className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all inline-flex items-center gap-2">
                                      Browse Files
                                    </span>
                                  </label>
                                  {attachedFile && (
                                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <FileText className="w-5 h-5 text-green-600" />
                                          <div>
                                            <p className="text-sm font-medium text-gray-800">
                                              {attachedFile.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {(
                                                attachedFile.size /
                                                1024 /
                                                1024
                                              ).toFixed(2)}{" "}
                                              MB
                                            </p>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => setAttachedFile(null)}
                                          className="p-1 hover:bg-red-50 rounded-full"
                                        >
                                          <X className="w-4 h-4 text-red-500" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Message */}
                {whatsappMsgType !== "template-message" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter your message"
                        rows={4}
                        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-${theme.primary}-500 focus:border-${theme.primary}-400 hover:border-${theme.primary}-400 outline-none transition-all resize-none`}
                      />
                    </div>
                  </div>
                )}

                {/* Header & Footer for List Messages */}
                {whatsappMsgType === "list-message" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Header (optional)
                      </label>
                      <input
                        type="text"
                        value={headerText}
                        onChange={(e) => setHeaderText(e.target.value)}
                        placeholder="Enter header text"
                        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-${theme.primary}-500 focus:border-${theme.primary}-400 hover:border-${theme.primary}-400 outline-none transition-all`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Footer (optional)
                      </label>
                      <input
                        type="text"
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        placeholder="Enter footer text"
                        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-${theme.primary}-500 focus:border-${theme.primary}-400 hover:border-${theme.primary}-400 outline-none transition-all`}
                      />
                    </div>
                  </>
                )}

                {/* Reply Buttons */}
                {whatsappMsgType === "reply-button-message" && (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Reply Buttons
                    </label>
                    {replyButtons.map((button, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={button.reply.title}
                          onChange={(e) =>
                            handleUpdateReplyButton(index, e.target.value)
                          }
                          placeholder="Button title"
                          className={`flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-${theme.primary}-500 focus:border-${theme.primary}-400 hover:border-${theme.primary}-400 outline-none transition-all`}
                        />
                        <button
                          onClick={() => handleDeleteReplyButton(index)}
                          className="p-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {replyButtons.length < 3 && (
                      <button
                        onClick={handleAddReplyButton}
                        className={`text-sm font-medium text-${theme.primary}-600 hover:text-${theme.primary}-700`}
                      >
                        + Add Button
                      </button>
                    )}
                  </div>
                )}

                {/* List Sections */}
                {whatsappMsgType === "list-message" && (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      List Sections
                    </label>
                    {listSections.map((section, sectionIndex) => (
                      <div
                        key={sectionIndex}
                        className="p-4 border border-gray-200 rounded-xl space-y-3"
                      >
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) =>
                            handleSectionTitleChange(
                              sectionIndex,
                              e.target.value,
                            )
                          }
                          placeholder="Section title"
                          className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-${theme.primary}-500 focus:border-${theme.primary}-400 hover:border-${theme.primary}-400 outline-none transition-all`}
                        />
                        {section.rows.map((row: any, rowIndex: number) => (
                          <div key={rowIndex} className="space-y-2">
                            <input
                              type="text"
                              value={row.title}
                              onChange={(e) =>
                                handleRowChange(
                                  sectionIndex,
                                  rowIndex,
                                  "title",
                                  e.target.value,
                                )
                              }
                              placeholder="Row title"
                              className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-${theme.primary}-500 focus:border-${theme.primary}-400 hover:border-${theme.primary}-400 outline-none transition-all`}
                            />
                            <input
                              type="text"
                              value={row.description}
                              onChange={(e) =>
                                handleRowChange(
                                  sectionIndex,
                                  rowIndex,
                                  "description",
                                  e.target.value,
                                )
                              }
                              placeholder="Row description"
                              className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-${theme.primary}-500 focus:border-${theme.primary}-400 hover:border-${theme.primary}-400 outline-none transition-all`}
                            />
                            <button
                              onClick={() =>
                                handleDeleteRow(sectionIndex, rowIndex)
                              }
                              className="text-xs text-red-500 hover:text-red-600"
                            >
                              Remove Row
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => handleAddRow(sectionIndex)}
                          className={`text-sm font-medium text-${theme.primary}-600 hover:text-${theme.primary}-700`}
                        >
                          + Add Row
                        </button>
                        <button
                          onClick={() => handleDeleteSection(sectionIndex)}
                          className="text-sm font-medium text-red-500 hover:text-red-600 ml-4"
                        >
                          Remove Section
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddSection}
                      className={`text-sm font-medium text-${theme.primary}-600 hover:text-${theme.primary}-700`}
                    >
                      + Add Section
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - WhatsApp Preview */}
          {campaign?.type === "whatsapp" && (
            <div className="lg:sticky lg:top-24 h-fit space-y-3">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gray-400" />
                WhatsApp Preview
              </label>
              <div className="bg-[#e5ddd5] rounded-2xl p-4 min-h-[400px]">
                <div className="relative bg-[#e5ddd5] rounded-lg overflow-hidden">
                  {/* Message Bubble */}
                  <div className="max-w-[85%] ml-auto bg-[#dcf8c6] rounded-lg shadow-sm p-3 mb-2">
                    {/* Message Header */}
                    <div className="text-xs text-gray-500 font-medium mb-1">
                      You
                    </div>

                    {/* Media Header */}
                    {whatsappMsgType === "template-message" &&
                      selectedTemplate?.isHeader &&
                      ["image", "video", "document"].includes(
                        selectedTemplate.headerType || "",
                      ) &&
                      mediaUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden bg-gray-100">
                          {selectedTemplate.headerType === "image" && (
                            <div className="w-full h-44 bg-gray-300 flex items-center justify-center text-gray-500 text-xs">
                              <img
                                src={mediaUrl}
                                alt="Media"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          {selectedTemplate.headerType === "video" && (
                            <div className="w-full h-44 bg-gray-800 flex items-center justify-center text-white text-xs">
                              <video
                                src={mediaUrl}
                                className="w-full h-full object-cover"
                                controls
                              />
                            </div>
                          )}
                          {selectedTemplate.headerType === "document" && (
                            <div className="p-3 bg-white flex items-center gap-2">
                              <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center text-red-600 text-xs font-bold">
                                PDF
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-700 truncate">
                                  Document
                                </p>
                                <p className="text-[10px] text-gray-500 truncate">
                                  {mediaUrl}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Text Header */}
                    {whatsappMsgType === "template-message" &&
                      selectedTemplate?.isHeader &&
                      selectedTemplate.headerType === "text" &&
                      selectedTemplate.headerText && (
                        <div className="font-bold text-gray-900 text-sm mb-1 pb-1 border-b border-gray-300/50">
                          {selectedTemplate.headerText}
                        </div>
                      )}

                    {whatsappMsgType === "list-message" && headerText && (
                      <div className="font-bold text-gray-900 text-sm mb-1 pb-1 border-b border-gray-300/50">
                        {headerText}
                      </div>
                    )}

                    {/* Message Content */}
                    <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {whatsappMsgType === "template-message"
                        ? selectedTemplate?.content ||
                          "Template content will appear here"
                        : message || "Your message will appear here..."}
                    </div>

                    {/* Footer */}
                    {whatsappMsgType === "template-message" &&
                      selectedTemplate?.isFooter &&
                      selectedTemplate.footer && (
                        <div className="mt-2 text-[11px] text-gray-500 italic">
                          {selectedTemplate.footer}
                        </div>
                      )}

                    {whatsappMsgType === "list-message" && footerText && (
                      <div className="mt-2 text-[11px] text-gray-500 italic">
                        {footerText}
                      </div>
                    )}

                    {/* Reply Buttons */}
                    {whatsappMsgType === "reply-button-message" &&
                      replyButtons.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {replyButtons.map((button, idx) => (
                            <button
                              key={idx}
                              className={`w-full flex items-center justify-center py-2 px-3 bg-white/80 hover:bg-white rounded text-center text-sm font-medium ${theme.primaryText} border border-gray-200 transition-colors`}
                            >
                              <Reply className="w-4 h-4 mr-2" />
                              {button.reply.title || `Button ${idx + 1}`}
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Template Buttons */}
                    {whatsappMsgType === "template-message" &&
                      selectedTemplate?.isButton &&
                      selectedTemplate.templateButtons &&
                      selectedTemplate.templateButtons.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {selectedTemplate.templateButtons.map(
                            (btn: any, idx: number) => (
                              <button
                                key={idx}
                                className={`w-full flex items-center justify-center py-2 px-3 bg-white/80 hover:bg-white rounded text-center text-sm font-medium ${theme.primaryText} border border-gray-200 transition-colors`}
                              >
                                <Reply className="w-4 h-4 mr-2" />
                                {btn.text}
                              </button>
                            ),
                          )}
                        </div>
                      )}

                    {/* List Message Button */}
                    {whatsappMsgType === "list-message" && (
                      <div className="mt-3">
                        <button className="w-full py-2 px-3 bg-white/80 hover:bg-white rounded text-center text-sm font-medium text-gray-700 border border-gray-200 transition-colors flex items-center justify-between">
                          <span>📋 Menu</span>
                          <span className="text-xs">▼</span>
                        </button>

                        {/* List Sections Preview */}
                        {listSections.length > 0 && (
                          <div className="mt-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
                            {listSections.map(
                              (section: any, sectionIdx: number) => (
                                <div
                                  key={sectionIdx}
                                  className="border-b border-gray-200 last:border-b-0"
                                >
                                  {section.title && (
                                    <div className="px-3 py-2 bg-gray-50 text-xs font-bold text-gray-700 uppercase">
                                      {section.title}
                                    </div>
                                  )}
                                  {section.rows.map(
                                    (row: any, rowIdx: number) => (
                                      <div
                                        key={rowIdx}
                                        className="px-3 py-2 hover:bg-gray-50 border-t border-gray-100"
                                      >
                                        <div className="text-sm font-medium text-gray-800">
                                          {row.title || "Row title"}
                                        </div>
                                        {row.description && (
                                          <div className="text-xs text-gray-500 mt-0.5">
                                            {row.description}
                                          </div>
                                        )}
                                      </div>
                                    ),
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Timestamp */}
                    <div className="mt-1 text-[10px] text-gray-500 text-right flex items-center justify-end gap-1">
                      12:00 PM
                      <svg
                        className="w-3 h-3 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 16 15"
                        width="16"
                        height="15"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88 5.644 6.3a.365.365 0 0 0-.51.063l-.477.372a.365.365 0 0 0-.063.51l3.547 4.197a.365.365 0 0 0 .51.063l6.353-7.563a.365.365 0 0 0 .063-.51zm-3.51 3.192l-.478-.372a.365.365 0 0 0-.51.063L5.644 9.88 4.32 8.32a.365.365 0 0 0-.51.063l-.477.372a.365.365 0 0 0-.063.51l1.646 1.944a.365.365 0 0 0 .51.063l5.533-6.563a.365.365 0 0 0 .063-.51z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Column - SMS Preview */}
          {campaign?.type === "sms" && (
            <div className="lg:sticky lg:top-24 h-fit space-y-3">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gray-400" />
                SMS Preview
              </label>
              <div className="bg-gradient-to-b from-blue-50 to-white rounded-2xl p-6 min-h-[400px] border border-blue-100">
                {/* Phone Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-blue-600 text-white px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        <span className="font-semibold text-sm">Messages</span>
                      </div>
                      <div className="text-xs opacity-80">Recipient</div>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="p-4 bg-gray-50 min-h-[250px]">
                    <div className="max-w-[85%] ml-auto bg-blue-500 text-white rounded-lg rounded-tr-sm p-3 shadow-sm">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {whatsappMsgType === "template-message"
                          ? selectedTemplate?.content ||
                            "Template content will appear here"
                          : message || "Your SMS message will appear here..."}
                      </div>
                      <div className="mt-2 text-[10px] text-blue-100 text-right">
                        12:00 PM ✓✓
                      </div>
                    </div>
                  </div>

                  {/* SMS Info */}
                  <div className="px-4 py-3 bg-white border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Characters:</span>
                        <span className="font-bold text-blue-600">
                          {
                            (whatsappMsgType === "template-message"
                              ? selectedTemplate?.content || ""
                              : message
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Messages:</span>
                        <span className="font-bold text-blue-600">
                          {Math.ceil(
                            (whatsappMsgType === "template-message"
                              ? selectedTemplate?.content || ""
                              : message
                            ).length / 160,
                          ) || 1}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Campaign Modal */}
      <ScheduleCampaignModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={handleSchedule}
        loading={scheduleLoading}
      />
    </div>
  );
};

// ✅ Correctly typed getLayout
CampaignEditPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

// ✅ Wrap page with auth HOC
const ProtectedCampaignEditPage = withClinicAuth(
  CampaignEditPage,
) as NextPageWithLayout;

// ✅ Re-attach layout
ProtectedCampaignEditPage.getLayout = CampaignEditPage.getLayout;

export default ProtectedCampaignEditPage;
