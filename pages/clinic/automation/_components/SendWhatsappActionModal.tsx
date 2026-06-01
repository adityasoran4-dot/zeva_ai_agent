import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  X,
  Save,
  Loader2,
  Search,
  ChevronDown,
  MessageSquare,
  Smartphone,
  Info,
  CheckCircle2,
  Phone,
  Reply,
  Upload,
  FileText,
  Eye,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import axios from "axios";
import {
  getMediaTypeFromFile,
  getTokenByPath,
  handleUpload,
  capitalize,
} from "@/lib/helper";
import { clsx, type ClassValue } from "clsx";
import useProvider from "@/hooks/useProvider";
import { Template } from "@/types/templates";
import VariableMappingDropdown from "./VariableMappingDropdown";
import { WorkflowEntity } from "@/types/workflows";
import { toast } from "react-toastify";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface SendWhatsappActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: string | null;
  onUpdate: (updatedAction: any) => void;
  entity?: WorkflowEntity;
}

const SendWhatsappActionModal: React.FC<SendWhatsappActionModalProps> = ({
  isOpen,
  onClose,
  actionId,
  onUpdate,
  entity = "Lead",
}) => {
  const { whatsappProviders } = useProvider();
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [variableMappings, setVariableMappings] = useState<
    Record<string, string>
  >({});
  const [headerVariableMappings, setHeaderVariableMappings] = useState<
    Record<string, string>
  >({});
  const [buttonVariableMappings, setButtonVariableMappings] = useState<
    Record<string, string>
  >({});
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [mediaType, setMediaType] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("{{lead.phone}}");
  const [customRecipient, setCustomRecipient] = useState<string>("");
  const [whatsappMsgType, setWhatsappMsgType] =
    useState<string>("template-message");
  const [message, setMessage] = useState<string>("");
  const [headerText, setHeaderText] = useState<string>("");
  const [footerText, setFooterText] = useState<string>("");
  const [replyButtons, setReplyButtons] = useState<any[]>([]);
  const [listSections, setListSections] = useState<any[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [providerSearchTerm, setProviderSearchTerm] = useState("");
  const [templateSearchTerm, setTemplateSearchTerm] = useState("");
  const providerDropdownRef = useRef<HTMLDivElement>(null);
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedTemplate = templates.find((t) => t._id === selectedTemplateId);
  const selectedProvider = whatsappProviders.find(
    (p) => p._id === selectedProviderId,
  );

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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              className="w-full text-gray-500 text-sm px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl hover:border-green-500 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder={`Enter value for {{${index + 1}}}`}
            />
          </div>
        </div>
        <VariableMappingDropdown
          entity={entity}
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
          nodeId={actionId as string}
          align="right"
        />
      </div>
    </div>
  );

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

  const handleInsertVariable = (variable: string) => {
    if (messageTextareaRef.current) {
      const start = messageTextareaRef.current.selectionStart;
      const end = messageTextareaRef.current.selectionEnd;
      const text = messageTextareaRef.current.value;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setMessage(newText);
      messageTextareaRef.current.focus();
      setTimeout(() => {
        messageTextareaRef.current?.setSelectionRange(
          start + variable.length,
          start + variable.length,
        );
      }, 0);
    }
  };

  const fetchTemplates = useCallback(async () => {
    try {
      const token = getTokenByPath();
      const { data } = await axios.get("/api/all-templates?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        // Filter only WhatsApp templates
        const whatsappTemplates = (data.templates || []).filter(
          (t: any) => t.templateType === "whatsapp",
        );
        setTemplates(whatsappTemplates);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to load templates.");
    }
  }, []);

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
        setSelectedTemplateId(params.templateId || "");
        setSelectedProviderId(params.providerId || "");
        setVariableMappings(params.variableMappings || {});
        setHeaderVariableMappings(params.headerVariableMappings || {});
        setButtonVariableMappings(params.buttonVariableMappings || {});
        setMediaUrl(params.mediaUrl || "");
        setMediaType(params.mediaType || "");
        setMessage(params.content || "");
        setRecipient(
          params.recipient !== "{{lead.phone}}" &&
            params.recipient !== "{{lead.owner}}"
            ? "custom"
            : "{{lead.phone}}",
        );
        setCustomRecipient(
          params.recipient !== "{{lead.phone}}" &&
            params.recipient !== "{{lead.owner}}"
            ? params.recipient
            : "",
        );
        setWhatsappMsgType(params.whatsappMsgType || "template-message");
        setHeaderText(params.headerText || "");
        setFooterText(params.footerText || "");
        setReplyButtons(params.replyButtons || []);
        setListSections(params.listSections || []);
      }
    } catch (err) {
      console.error("Error fetching action:", err);
      setError("Failed to load action details.");
    } finally {
      setIsLoading(false);
    }
  }, [actionId]);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      if (actionId) {
        fetchAction();
      }
    }
  }, [isOpen, actionId, fetchTemplates, fetchAction]);

  const handleSave = async () => {
    if (!actionId) return;

    setIsSaving(true);
    setError(null);
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
        `/api/workflows/actions/update/${actionId}`,
        {
          parameters: {
            providerId: selectedProviderId,
            templateId: selectedTemplateId,
            channel: "whatsapp",
            whatsappMsgType,
            recipient: recipient === "custom" ? customRecipient : recipient,
            templateName: selectedTemplate?.uniqueName,
            content:
              whatsappMsgType === "template-message"
                ? selectedTemplate?.content || ""
                : message,
            variableMappings,
            headerVariableMappings,
            buttonVariableMappings,
            mediaUrl: mediaFileUrl,
            mediaType: mediaFileType,
            headerText,
            footerText,
            replyButtons,
            listSections,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        onUpdate(data.data);
        onClose();
      }
    } catch (err) {
      console.error("Error saving action:", err);
      setError("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTemplates = templates?.filter((item: Template) => {
    const typeMatch = selectedProvider?.type?.includes(item.templateType);
    const statusMatch = item?.status === "approved";
    const providerMatch =
      item?.templateType !== "whatsapp" ||
      item?.provider?._id === selectedProvider?._id;

    // Search term condition (name or uniqueName contains search term)
    const searchMatch =
      templateSearchTerm === "" || // if search is empty, include all
      item.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
      item.uniqueName.toLowerCase().includes(templateSearchTerm.toLowerCase());

    return typeMatch && statusMatch && providerMatch && searchMatch;
  });
  const filteredProviders = whatsappProviders.filter(
    (p) =>
      p.name.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
      p.label.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
      p.phone.toLowerCase().includes(providerSearchTerm.toLowerCase()),
  );

  useEffect(() => {
    if (selectedTemplate && selectedTemplate?.headerFileUrl) {
      setMediaUrl(selectedTemplate?.headerFileUrl || "");
      setMediaType(selectedTemplate?.headerType || "");
    } else {
      setMediaUrl("");
      setMediaType("");
    }
  }, [selectedTemplate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end text-gray-500">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <FaWhatsapp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Send WhatsApp</h3>
              <p className="text-xs text-gray-500 font-medium">
                Send an automated WhatsApp message
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
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium">Loading details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm font-medium">
              {error}
            </div>
          ) : (
            <>
              {/* Meta 24-hour Window Alert */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-blue-900">
                    Meta 24-Hour Policy
                  </p>
                  <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    Non-template messages (Reply Buttons, List Messages, etc.)
                    can only be sent to users who have messaged you within the
                    last <strong>24 hours</strong>. Only{" "}
                    <strong>Template Messages</strong> can be sent outside this
                    window.
                  </p>
                </div>
              </div>

              {/* Provider Selection */}
              <div className="space-y-3 relative" ref={providerDropdownRef}>
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" /> Sender
                </label>
                <div
                  onClick={() =>
                    setIsProviderDropdownOpen(!isProviderDropdownOpen)
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 flex items-center justify-between cursor-pointer hover:border-green-400 transition-all"
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
                          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
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
                                "px-4 py-3 hover:bg-green-50 cursor-pointer transition-colors group",
                                selectedProviderId === p._id && "bg-green-50",
                              )}
                              onClick={() => {
                                setSelectedProviderId(p._id);
                                setIsProviderDropdownOpen(false);
                                setProviderSearchTerm("");
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                                    {p.label}
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    {p.phone}
                                  </span>
                                </div>
                                {selectedProviderId === p._id && (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
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

              {/* Recipient Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" /> Recipient
                </label>
                <div className="flex gap-2">
                  {[
                    { label: "Lead", value: "{{lead.phone}}" },
                    { label: "Lead Owner", value: "{{lead.owner}}" },
                    { label: "Custom", value: "custom" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setRecipient(option.value)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                        recipient === option.value
                          ? "bg-green-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {recipient === "custom" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customRecipient}
                      onChange={(e) => setCustomRecipient(e.target.value)}
                      placeholder="Enter phone number with country code"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    />
                    <VariableMappingDropdown
                      onSelect={(value: string) => setCustomRecipient(value)}
                      entity={entity}
                      align="right"
                      nodeId={actionId as string}
                    />
                  </div>
                )}
              </div>

              {/* Whatsapp Msg Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" /> Message
                  Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Template Message", value: "template-message" },
                    {
                      label: "Non Template Message",
                      value: "non-template-message",
                    },
                    {
                      label: "Reply Button Message",
                      value: "reply-button-message",
                    },
                    { label: "List Message", value: "list-message" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setWhatsappMsgType(option.value)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-sm font-medium transition-all",
                        whatsappMsgType === option.value
                          ? "bg-green-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {whatsappMsgType === "list-message" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900">
                    Header (optional)
                  </h3>
                  <input
                    type="text"
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    placeholder="Enter header text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  />
                </div>
              )}

              {/* Template Selection */}
              {whatsappMsgType === "template-message" && (
                <div className="space-y-3 relative" ref={templateDropdownRef}>
                  <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    Template
                  </label>
                  <div
                    onClick={() =>
                      setIsTemplateDropdownOpen(!isTemplateDropdownOpen)
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 flex items-center justify-between cursor-pointer hover:border-green-400 transition-all"
                  >
                    <span className="truncate">
                      {selectedTemplate
                        ? selectedTemplate.name
                        : "Choose a WhatsApp template"}
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
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
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
                                  "px-4 py-3 hover:bg-green-50 cursor-pointer transition-colors group",
                                  selectedTemplateId === t._id && "bg-green-50",
                                )}
                                onClick={() => {
                                  setSelectedTemplateId(t._id);
                                  setIsTemplateDropdownOpen(false);
                                  setTemplateSearchTerm("");
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                                      {t.name}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-medium">
                                      {t.category.toUpperCase()} • {t.language}
                                    </span>
                                  </div>
                                  {selectedTemplateId === t._id && (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
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

              {/* Variable Mappings for Template */}
              {whatsappMsgType === "template-message" && selectedTemplate && (
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
                          Upload {capitalize(selectedTemplate?.headerType)}
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
                                    : selectedTemplate?.headerType === "video"
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

              {whatsappMsgType !== "template-message" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      Message
                    </label>
                  </div>
                  <textarea
                    ref={messageTextareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your message here"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    rows={4}
                  />
                  <VariableMappingDropdown
                    onSelect={handleInsertVariable}
                    align="left"
                    entity={entity}
                    nodeId={actionId as string}
                  />
                </div>
              )}

              {whatsappMsgType === "reply-button-message" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900">
                    Reply Buttons
                  </h3>
                  {replyButtons.map((button, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={button.reply.title}
                        onChange={(e) =>
                          handleUpdateReplyButton(index, e.target.value)
                        }
                        placeholder="Enter button title"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none transition-all"
                      />
                      <button
                        onClick={() => handleDeleteReplyButton(index)}
                        className="p-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-red-500 hover:text-red-600 shadow-sm border border-red-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}

                  {replyButtons?.length < 3 && (
                    <button
                      onClick={handleAddReplyButton}
                      className="text-sm font-medium text-green-600"
                    >
                      + Add Button
                    </button>
                  )}
                </div>
              )}

              {whatsappMsgType === "list-message" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900">
                    List Sections
                  </h3>

                  {listSections.map((section, sectionIndex) => (
                    <div
                      key={sectionIndex}
                      className="group relative space-y-4 p-5 border border-gray-200 rounded-2xl hover:border-red-200 hover:bg-red-50/10 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-full space-y-1.5">
                          <label className="text-sm font-bold uppercase text-gray-500">
                            Section Title{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) =>
                              handleSectionTitleChange(
                                sectionIndex,
                                e.target.value,
                              )
                            }
                            placeholder="eg: Top Picks"
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      {section.rows.map((row: any, rowIndex: number) => (
                        <div
                          key={rowIndex}
                          className="group/row flex items-end gap-2 p-3 bg-gray-50/50 rounded-xl border border-transparent hover:border-gray-200 hover:bg-white transition-all duration-200"
                        >
                          <div className="w-full space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                              Row Title <span className="text-red-500">*</span>
                            </label>
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
                              placeholder="eg: Starter plan"
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            />
                          </div>
                          <div className="w-full space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                              Description
                            </label>
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
                              placeholder="eg: For small teams"
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            />
                          </div>
                          <button
                            onClick={() =>
                              handleDeleteRow(sectionIndex, rowIndex)
                            }
                            className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-all text-red-500 hover:text-red-600 opacity-0 group-hover/row:opacity-100 border border-red-100 shadow-sm"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => handleAddRow(sectionIndex)}
                        className="flex items-center gap-2 text-xs font-bold text-green-600 hover:text-green-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-green-50"
                      >
                        + Add Row
                      </button>

                      {/* delete button for section */}
                      <button
                        onClick={() => handleDeleteSection(sectionIndex)}
                        className="absolute -top-3 -right-3 p-2 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl transition-all text-red-500 hover:text-red-600 shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
                        title="Delete Section"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleAddSection}
                    className="text-sm font-medium text-green-600"
                  >
                    + Add Section
                  </button>
                </div>
              )}

              {whatsappMsgType === "list-message" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900">
                    Footer (optional)
                  </h3>
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="Enter footer text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  />
                </div>
              )}

              {whatsappMsgType === "non-template-message" && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-900">
                    Attachment
                  </label>
                  <input type="file" onChange={handleFileChange} />
                </div>
              )}

              {/* WhatsApp Preview */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-gray-400" />
                  WhatsApp Preview
                </label>
                <div className="bg-[#e5ddd5] rounded-2xl p-4 min-h-[200px]">
                  {/* WhatsApp Chat Background Pattern */}
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
                              <div className="w-full h-32 bg-gray-300 flex items-center justify-center text-gray-500 text-xs">
                                <img
                                  src={mediaUrl}
                                  alt="Media"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            {selectedTemplate.headerType === "video" && (
                              <div className="w-full h-32 bg-gray-800 flex items-center justify-center text-white text-xs">
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
                                className="w-full flex items-center justify-center py-2 px-3 bg-white/80 hover:bg-white rounded text-center text-sm font-medium text-blue-600 border border-gray-200 transition-colors"
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
                                  className="w-full py-2 px-3 bg-white/80 hover:bg-white rounded text-center text-sm font-medium text-blue-600 border border-gray-200 transition-colors"
                                >
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
              disabled={
                isSaving || !selectedProviderId || !recipient || isLoading
              }
              className="flex-1 px-4 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
};

export default SendWhatsappActionModal;
