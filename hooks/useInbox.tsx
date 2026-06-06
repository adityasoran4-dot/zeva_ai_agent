import {
  ConversationType,
  MessageData,
  MessageType,
  Provider,
} from "@/types/conversations";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import useProvider from "./useProvider";
import useTemplate from "./useTemplate";
import toast from "react-hot-toast";
import {
  formatFileSize,
  getMediaTypeFromMime,
  getTokenByPath,
  handleError,
  handleUpload,
} from "@/lib/helper";
import debounce from "lodash.debounce";
import { io, Socket } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import useAgents from "./useAgents";
import { User } from "@/types/users";
import { Template } from "@/types/templates";
import { useAuth } from "@/context/AuthContext";
import useRooms from "./useRooms";
import useLeadPatient from "./useLeadPatient";
import useTags from "./useTags";

export type VariableType = {
  type: "text";
  text: string;
};

interface IState {
  conversations: ConversationType[];
  filters: {
    status: string;
    agentId: string;
  };
}

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

export const TAG_COLORS = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-yellow-100 text-yellow-800 border-yellow-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-red-100 text-red-800 border-red-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
];

export const getTagColor = (tag: string) => {
  // Create a simple hash for consistent coloring
  let hash = 0;
  for (let i = 0; i < tag?.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index];
};

export const tags = ["Important", "Follow-up", "Urgent", "Review", "Personal"];

let socket: Socket | null = null;

const useInbox = () => {
  const { user } = useAuth();
  const { providers } = useProvider();
  const { templates } = useTemplate();
  const { agents, loading: agentFetchLoading } = useAgents({
    role: "agent",
  })?.state;
  const { agents: doctors, loading: doctorFetchLoading } = useAgents({
    role: "doctorStaff",
  })?.state;
  const { rooms, loading: roomFetchLoading } = useRooms();

  const [userId, setUserId] = useState<string | null>(null);
  const [fetchConvLoading, setFetchConvLoading] = useState<boolean>(true);
  const [fetchMsgsLoading, setFetchMsgsLoading] = useState<boolean>(true);
  const [conversations, setConversations] = useState<IState["conversations"]>(
    [],
  );
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationType | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  );
  const [currentConvPage, setCurrentConvPage] = useState<number>(1);
  const [totalConversations, setTotalConversations] = useState<number>(0);
  const [hasMoreConversations, setHasMoreConversations] =
    useState<boolean>(true);

  const [currentMsgPage, setCurrentMsgPage] = useState<number>(1);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string>("");
  const [mediaType, setMediaType] = useState<any>("");
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [bodyParameters, setBodyParameters] = useState<VariableType[]>([]);
  const [headerParameters, setHeaderParameters] = useState<VariableType[]>([]);
  const [sendMsgLoading, setSendMsgLoading] = useState<boolean>(false);
  const [isLiveChatSelected, setIsLiveChatSelected] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>("");
  const [selectedMessage, setSelectedMessage] = useState<MessageType | null>(
    null,
  );
  const [isScrolledToBottom, setIsScrolledToBottom] = useState<boolean>(false);

  const [searchConvInput, setSearchConvInput] = useState<string>("");
  const [whatsappRemainingTime, setWhatsappRemainingTime] =
    useState<string>("");

  // conversation status options
  const [conversationStatusOptions, setConversationStatusOptions] = useState<
    { label: string; value: string }[]
  >([
    { label: "All", value: "all" },
    { label: "Read", value: "read" },
    { label: "Unread", value: "unread" },
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
    { label: "Archived", value: "archived" },
    { label: "Blocked", value: "blocked" },
    { label: "Trashed", value: "trashed" },
  ]);
  const [filters, setFilters] = useState<IState["filters"]>({
    status: "all",
    agentId: "",
  });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [isProfileView, setIsProfileView] = useState<boolean>(false);
  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState<boolean>(false);
  const [isDeleteConversationModalOpen, setIsDeleteConversationModalOpen] =
    useState<boolean>(false);
  const [isDeletingConversation, setIsDeletingConversation] =
    useState<boolean>(false);

  const [isAddingTag, setIsAddingTag] = useState<boolean>(false);

  // Lead Editing State
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isUpdatingLead, setIsUpdatingLead] = useState<boolean>(false);

  const handleEditLead = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value || "");
  };

  const cancelEditLead = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleUpdateLead = async () => {
    if (!selectedConversation?.leadId?._id || !editingField) return;
    setIsUpdatingLead(true);
    try {
      const fieldName =
        editingField === "name"
          ? "name"
          : editingField === "email"
            ? "email"
            : "phone";
      const { data } = await axios.put(
        `/api/lead-ms/update-lead`,
        { leadId: selectedConversation.leadId._id, [fieldName]: editValue },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (data.success) {
        toast.success("Lead updated successfully");
        // Update local state
        const updatedLead = {
          ...selectedConversation.leadId,
          [fieldName]: editValue,
        };
        const updatedConversation = {
          ...selectedConversation,
          leadId: updatedLead,
        };
        setSelectedConversation(updatedConversation);

        // Also update in the conversations list
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === selectedConversation._id
              ? { ...conv, leadId: updatedLead }
              : conv,
          ),
        );

        cancelEditLead();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update lead");
    } finally {
      setIsUpdatingLead(false);
    }
  };

  const canSend = (() => {
    if (!selectedConversation || !selectedProvider) return false;

    // Check provider-specific requirements
    if (selectedProvider?.type?.includes("email")) {
      if (!selectedConversation?.leadId?.email || !subject) return false;
    } else if (selectedProvider?.type?.includes("whatsapp")) {
      if (!selectedConversation?.leadId?.phone) return false;
    }

    // Check message content
    const hasContent =
      message.trim().length > 0 ||
      attachedFile ||
      (attachedFiles && attachedFiles.length > 0);

    return hasContent;
  })();

  const canSchedule = (() => {
    if (!selectedConversation || !selectedProvider) return false;

    // Check provider-specific requirements
    if (selectedProvider?.type?.includes("email")) {
      if (!selectedConversation?.leadId?.email || !subject) return false;
    } else if (selectedProvider?.type?.includes("whatsapp")) {
      if (!selectedConversation?.leadId?.phone) return false;
    }

    // Schedule usually requires at least some text message
    // Check message content
    const hasContent =
      message.trim().length > 0 ||
      attachedFile ||
      (attachedFiles && attachedFiles.length > 0);

    return hasContent;
  })();

  // Conversation assignment logic
  const [selectedAgent, setSelectedAgent] = useState<User | null>(null);

  // schedule message state
  const [isScheduleModalOpen, setIsScheduleModalOpen] =
    useState<boolean>(false);

  // filter modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);

  // book appointment modal
  const [isOpenBookAppointmentModal, setIsOpenBookAppointmentModal] =
    useState<boolean>(false);

  // location picker modal
  const [isLocationPickerOpen, setIsLocationPickerOpen] =
    useState<boolean>(false);

  const statusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const statusBtnRef = React.useRef<HTMLButtonElement | null>(null);

  const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const conversationRef = React.useRef<HTMLDivElement | null>(null);
  const scrollMsgsRef = React.useRef<HTMLDivElement | null>(null);
  const previousScrollTopRef = React.useRef<number | null>(0); // Track previous scroll position for messages to stop fetching when scroll top to bottom
  const messageRef = React.useRef<HTMLDivElement | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // fetch lead patient details
  const { state: leadPatient } = useLeadPatient({
    lead: selectedConversation?.leadId || null,
  });
  const { patient } = leadPatient;

  // fetch tags
  const {
    tags,
    loading: tagsLoading,
    setTags,
  } = useTags({
    leadId: selectedConversation?.leadId?._id || "",
  });

  const token = getTokenByPath();

  // Scroll to bottom
  const handleScrollMsgsToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = useCallback(
    debounce(async (page = 1) => {
      if (!token) return;
      try {
        setFetchConvLoading(true);
        const res = await axios.get("/api/conversations", {
          params: {
            page: page,
            limit: 10,
            search: searchConvInput,
            status: filters.status,
            ownerId: filters.agentId,
          },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          // If requesting first page, replace conversations; otherwise append
          const newConvs: ConversationType[] = res.data.conversations || [];
          if (page === 1) {
            const sortedConvs = newConvs.sort((a, b) => {
              const dateA = a.recentMessage?.createdAt
                ? new Date(a.recentMessage.createdAt).getTime()
                : 0;
              const dateB = b.recentMessage?.createdAt
                ? new Date(b.recentMessage.createdAt).getTime()
                : 0;
              return dateB - dateA;
            });
            setConversations(sortedConvs);
          } else {
            setConversations((prev) =>
              [...prev, ...newConvs]?.sort((a, b) => {
                const dateA = a.recentMessage?.createdAt
                  ? new Date(a.recentMessage.createdAt).getTime()
                  : 0;
                const dateB = b.recentMessage?.createdAt
                  ? new Date(b.recentMessage.createdAt).getTime()
                  : 0;
                return dateB - dateA;
              }),
            );
          }
          setTotalConversations(res?.data?.pagination?.totalConversations || 0);
          setHasMoreConversations(Boolean(res?.data?.pagination?.hasMore));
        } else {
          setConversations([]);
        }
      } catch (error) {
        setConversations([]);
      } finally {
        setFetchConvLoading(false);
      }
    }, 300),
    [currentConvPage, token, searchConvInput, filters],
  );

  const fetchMessages = async (page = 1) => {
    if (!token || !selectedConversation) return;

    try {
      setFetchMsgsLoading(true);

      const res = await axios.get(
        `/api/messages/get-messages/${selectedConversation?._id}`,
        {
          params: { page, limit: 5 },
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.data?.success) {
        setMessages([]);
        return;
      }

      const incomingGroups: MessageData[] = res.data?.data || [];

      if (page === 1) {
        setMessages(incomingGroups);
      } else {
        setMessages((prev) => {
          // Deep copy previous messages
          const merged = prev.map((g) => ({
            ...g,
            messages: [...g.messages],
          }));

          // Create set of existing message IDs
          const existingMsgIds = new Set(
            merged.flatMap((g) => g.messages.map((m) => m._id)),
          );

          incomingGroups.forEach((newGroup) => {
            const index = merged.findIndex((g) => g.date === newGroup.date);

            // Filter out duplicate messages
            const uniqueMessages = newGroup.messages.filter(
              (m) => !existingMsgIds.has(m._id),
            );

            if (!uniqueMessages.length) return;

            if (index !== -1) {
              // prepend older messages
              merged[index].messages = [
                ...uniqueMessages,
                ...merged[index].messages,
              ];
            } else {
              // add new date group at top
              merged.unshift({
                ...newGroup,
                messages: uniqueMessages,
              });
            }

            // update set
            uniqueMessages.forEach((m) => existingMsgIds.add(m._id));
          });

          return merged;
        });
      }

      setTotalMessages(res.data.pagination?.totalMessages || 0);
      setHasMoreMessages(Boolean(res.data.pagination?.hasMore));
      setCurrentMsgPage(page);
    } catch (error) {
      console.error(error);
      setMessages([]);
    } finally {
      setFetchMsgsLoading(false);
    }
  };

  const handleSendMessage = async (location?: null) => {
    console.log({
      selectedConversation,
      location,
    });
    if (!selectedConversation) return;
    if (
      !textAreaRef?.current?.value &&
      !attachedFile &&
      attachedFiles.length === 0 &&
      !location
    )
      return;
    if (!selectedProvider && !isLiveChatSelected) {
      toast.error("Please select a provider");
      return;
    }

    const channel = selectedProvider?.type[0];

    let mediaFileUrl = mediaUrl;
    let mediaFileType = mediaType;

    let attachmentFile = attachedFile;
    // Use attachedFiles (multiple) if present, otherwise fallback to single attachedFile
    const attachmentsFilesToUse =
      attachedFiles && attachedFiles.length
        ? attachedFiles
        : attachedFile
          ? [attachedFile]
          : [];
    console.log("Attachments to use:", attachmentsFilesToUse);
    setSendMsgLoading(true);

    let attachments: any[] = [];
    // for attachments upload
    if (attachmentsFilesToUse.length > 0) {
      for (const file of attachmentsFilesToUse) {
        const resData = await handleUpload(file);
        if (resData && resData?.success) {
          attachments.push({
            fileName: file?.name,
            fileSize: formatFileSize(file?.size),
            mimeType: file?.type,
            mediaUrl: resData?.url,
            mediaType: getMediaTypeFromMime(file?.type),
          });

          // For legacy compatibility/single file logic
          if (!mediaFileUrl) {
            mediaFileUrl = resData?.url;
            mediaFileType = getMediaTypeFromMime(file?.type);
            setMediaUrl(resData?.url);
          }
        }
      }
    }

    const tempMessageId = Date.now()?.toString(); // Ensure a unique identifier
    const dateString = new Date().toISOString().split("T")[0];
    const tempMessage = {
      _id: tempMessageId,
      conversationId: selectedConversation._id,
      senderId: "",
      recipientId: selectedConversation.leadId?._id,
      channel: isLiveChatSelected ? "chat" : channel,
      messageType: "conversational",
      direction: "outgoing",
      subject: subject,
      content: textAreaRef?.current?.value,
      provider: {
        _id: selectedProvider?._id,
        emailProviderType: selectedProvider?.emailProviderType,
        type: selectedProvider?.type,
        label: selectedProvider?.label,
        phone: selectedProvider?.phone,
        email: selectedProvider?.email,
      },
      status: "sending", // Temporary status
      mediaUrl: mediaFileUrl,
      mediaType: mediaFileType,
      source: "Zeva",
      replyToMessageId: selectedMessage,
      attachments,
      location: location ? location : {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSelectedMessage(null);

    // If the date group does not exist, add it at the end to preserve order
    const tempMessages = messages.map((group) => ({
      ...group,
      messages: [...group.messages],
    }));

    let dateGroupExists = false;
    const updatedMessages = tempMessages.map((group) => {
      if (group?.date === dateString) {
        dateGroupExists = true;
        return {
          ...group,
          messages: [...group.messages, tempMessage],
        };
      }
      return group;
    });
    const finalMessages = dateGroupExists
      ? updatedMessages
      : [...updatedMessages, { date: dateString, messages: [tempMessage] }];

    // @ts-ignore
    setMessages(finalMessages);
    setIsScrolledToBottom(!isScrolledToBottom);
    setMessage("");
    setMediaType("");
    setMediaUrl("");
    setAttachedFile(null);
    setAttachedFiles([]);
    setSubject("");

    try {
      let data;
      if (isLiveChatSelected) {
        const payload = {
          conversationId: selectedConversation._id,
          recipientId: selectedConversation.leadId?._id,
          channel: "chat",
          content: tempMessage.content,
          mediaUrl: tempMessage.mediaUrl,
          mediaType: tempMessage.mediaType,
          attachments: tempMessage?.attachments,
          source: "Zeva",
        };
        const response = await axios.post(
          "/api/messages/sendLiveMessage",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        data = response?.data;
      } else if (selectedProvider?.type?.includes("email")) {
        const payload = {
          conversationId: selectedConversation._id,
          recipientIds: [selectedConversation.leadId?._id],
          channel: "email",
          subject: tempMessage.subject,
          content: tempMessage.content,
          source: "Zeva",
          providerId: selectedProvider?._id,
          replyToMessageId: tempMessage?.replyToMessageId?._id,
          quotedMessageId: tempMessage?.replyToMessageId?.providerMessageId,
          attachments: attachmentFile ? attachments : [],
        };

        const response = await axios.post(
          "/api/messages/send-email-message",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        data = response?.data;
      } else {
        const response = await axios.post(
          "/api/messages/send-message",
          {
            conversationId: selectedConversation._id,
            recipientId: selectedConversation.leadId?._id,
            providerId: selectedProvider?._id,
            channel,
            content: tempMessage.content,
            mediaUrl: tempMessage.mediaUrl,
            mediaType: tempMessage.mediaType,
            source: "Zeva",
            messageType: tempMessage?.messageType,
            templateId: selectedTemplate?._id,
            // for reply message
            replyToMessageId: tempMessage?.replyToMessageId?._id,
            quotedMessageId: tempMessage?.replyToMessageId?.providerMessageId,
            // for whatsapp template if body variables exist
            headerParameters,
            bodyParameters,
            attachments,

            // location
            location: location ? location : null,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        data = response?.data;
      }

      if (data && data.success) {
        const newMessage = data.data;

        const updatedFinalMessages = finalMessages.map((group) =>
          group?.date === dateString
            ? {
                ...group,
                messages: group.messages.map((msg) =>
                  msg?._id === tempMessageId ? newMessage : msg,
                ),
              }
            : group,
        );

        // @ts-ignore
        setMessages(updatedFinalMessages);
        setSelectedTemplate(null);

        let updatedConversations = conversations?.map((c) =>
          c?._id === selectedConversation?._id
            ? { ...selectedConversation, recentMessage: newMessage }
            : c,
        );

        // updatedConversations = getUniqueConversations(updatedConversations);

        // Move the updated conversation to the front
        const sortedConversations = updatedConversations?.sort((a) =>
          a?._id === selectedConversation?._id ? -1 : 1,
        );

        setConversations(sortedConversations);

        // empty body and header variables
        setHeaderParameters([]);
        setBodyParameters([]);
        // clear attached files after successful send
        setAttachedFile(null);
        setAttachedFiles([]);
      }
    } catch (error) {
      const errorHandledMessages = finalMessages.map((g) =>
        g?.date === dateString
          ? {
              ...g,
              messages: g?.messages?.filter(
                (msg) => msg?._id !== tempMessageId,
              ),
            }
          : g,
      );
      //   @ts-ignore
      setMessages(errorHandledMessages);
      handleError(error);
    } finally {
      setSendMsgLoading(false);
    }
  };

  const handleScheduleMessage = async (scheduledData: {
    scheduledDate: string;
    scheduledTime: string;
    scheduledTimezone: string;
  }) => {
    console.log("Scheduling message:", scheduledData);

    if (!selectedConversation) return;
    if (
      !textAreaRef?.current?.value &&
      !attachedFile &&
      attachedFiles.length === 0
    )
      return;
    if (!selectedProvider && !isLiveChatSelected) {
      toast.error("Please select a provider");
      return;
    }

    const channel = selectedProvider?.type[0];

    let mediaFileUrl = "";
    let mediaFileType = "";

    let attachmentFile = attachedFile;
    // Use attachedFiles (multiple) if present, otherwise fallback to single attachedFile
    const attachmentsFilesToUse =
      attachedFiles && attachedFiles.length
        ? attachedFiles
        : attachedFile
          ? [attachedFile]
          : [];
    console.log("Attachments to use:", attachmentsFilesToUse);
    setSendMsgLoading(true);

    let attachments: any[] = [];
    // for attachments upload
    if (attachmentsFilesToUse.length > 0) {
      for (const file of attachmentsFilesToUse) {
        const resData = await handleUpload(file);
        if (resData && resData?.success) {
          attachments.push({
            fileName: file?.name,
            fileSize: formatFileSize(file?.size),
            mimeType: file?.type,
            mediaUrl: resData?.url,
            mediaType: getMediaTypeFromMime(file?.type),
          });

          // For legacy compatibility/single file logic
          if (!mediaFileUrl) {
            mediaFileUrl = resData?.url;
            mediaFileType = getMediaTypeFromMime(file?.type);
            setMediaUrl(resData?.url);
          }
        }
      }
    }

    const tempMessageId = Date.now()?.toString(); // Ensure a unique identifier
    const dateString = new Date().toISOString().split("T")[0];
    const tempMessage = {
      _id: tempMessageId,
      conversationId: selectedConversation._id,
      senderId: "",
      recipientId: selectedConversation.leadId?._id,
      channel: isLiveChatSelected ? "chat" : channel,
      messageType: "conversational",
      direction: "outgoing",
      subject: subject,
      content: textAreaRef?.current?.value,
      provider: selectedProvider?._id,
      status: "sending", // Temporary status
      mediaUrl: mediaFileUrl,
      mediaType: mediaFileType,
      source: "Zeva",
      replyToMessageId: selectedMessage,
      attachments,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSelectedMessage(null);

    // If the date group does not exist, add it at the end to preserve order
    // If the date group does not exist, add it at the end to preserve order
    const tempMessages = messages.map((group) => ({
      ...group,
      messages: [...group.messages],
    }));

    let dateGroupExists = false;
    const updatedMessages = tempMessages.map((group) => {
      if (group.date === dateString) {
        dateGroupExists = true;
        return {
          ...group,
          messages: [...group.messages, tempMessage],
        };
      }
      return group;
    });
    const finalMessages = dateGroupExists
      ? updatedMessages
      : [...updatedMessages, { date: dateString, messages: [tempMessage] }];

    // @ts-ignore
    setMessages(finalMessages);
    setIsScrolledToBottom(!isScrolledToBottom);
    setMessage("");
    setMediaType("");
    setMediaUrl("");
    setAttachedFile(null);
    setAttachedFiles([]);
    setSubject("");

    try {
      let data;
      if (isLiveChatSelected) {
        const payload = {
          conversationId: selectedConversation._id,
          recipientId: selectedConversation.leadId?._id,
          channel: "chat",
          content: tempMessage.content,
          mediaUrl: tempMessage.mediaUrl,
          mediaType: tempMessage.mediaType,
          attachments: tempMessage?.attachments,
          source: "Zeva",
        };
        const response = await axios.post(
          "/api/messages/sendLiveMessage",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        data = response?.data;
      } else if (selectedProvider?.type?.includes("email")) {
        const payload = {
          conversationId: selectedConversation._id,
          recipientIds: [selectedConversation.leadId?._id],
          channel: "email",
          subject: tempMessage.subject,
          content: tempMessage.content,
          source: "Zeva",
          providerId: selectedProvider?._id,
          replyToMessageId: tempMessage?.replyToMessageId?._id,
          quotedMessageId: tempMessage?.replyToMessageId?.providerMessageId,
          attachments: attachmentFile ? attachments : [],
          ...scheduledData,
        };

        const response = await axios.post(
          "/api/messages/schedule-email-message",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        data = response?.data;
      } else {
        const response = await axios.post(
          "/api/messages/schedule-message",
          {
            conversationId: selectedConversation._id,
            recipientId: selectedConversation.leadId?._id,
            providerId: selectedProvider?._id,
            channel,
            content: tempMessage.content,
            mediaUrl: tempMessage.mediaUrl,
            mediaType: tempMessage.mediaType,
            source: "Zeva",
            messageType: tempMessage?.messageType,
            templateId: selectedTemplate?._id,
            // for reply message
            replyToMessageId: tempMessage?.replyToMessageId?._id,
            quotedMessageId: tempMessage?.replyToMessageId?.providerMessageId,
            // for whatsapp template if body variables exist
            headerParameters,
            bodyParameters,
            attachments,
            ...scheduledData,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        data = response?.data;
      }

      if (data && data.success) {
        const newMessage = data.data;

        const updatedFinalMessages = finalMessages.map((group) =>
          group?.date === dateString
            ? {
                ...group,
                messages: group.messages.map((msg) =>
                  msg?._id === tempMessageId ? newMessage : msg,
                ),
              }
            : group,
        );

        // @ts-ignore
        setMessages(updatedFinalMessages);
        setSelectedTemplate(null);

        let updatedConversations = conversations?.map((c) =>
          c?._id === selectedConversation?._id
            ? { ...selectedConversation, recentMessage: newMessage }
            : c,
        );

        // updatedConversations = getUniqueConversations(updatedConversations);

        // Move the updated conversation to the front
        const sortedConversations = updatedConversations?.sort((a) =>
          a?._id === selectedConversation?._id ? -1 : 1,
        );

        setConversations(sortedConversations);

        // empty body and header variables
        setHeaderParameters([]);
        setBodyParameters([]);
        // clear attached files after successful send
        setAttachedFile(null);
        setAttachedFiles([]);
      }
    } catch (error) {
      const errorHandledMessages = finalMessages.map((g) =>
        g?.date === dateString
          ? {
              ...g,
              messages: g?.messages?.filter(
                (msg) => msg?._id !== tempMessageId,
              ),
            }
          : g,
      );
      //   @ts-ignore
      setMessages(errorHandledMessages);
      handleError(error);
    } finally {
      setSendMsgLoading(false);
      setIsScheduleModalOpen(false);
    }
  };

  const handleReadConversation = async (conversationId: string) => {
    if (!token) return;
    if (!conversationId) return;
    try {
      const { data } = await axios.patch(
        `/api/conversations/read-conversation/${conversationId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data && data?.success) {
        // Update conversations state to mark as read
        const updatedConversations = conversations.map((conv) =>
          conv._id === conversationId ? { ...conv, unreadMessages: [] } : conv,
        );
        setConversations(updatedConversations);
      }
    } catch (error) {
      handleError(error);
    }
  };

  // Infinite scroll handler
  const handleConvScroll = () => {
    const el = conversationRef.current;
    if (!el || !hasMoreConversations) return;
    const nearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 60; // 60px threshold
    if (nearBottom) {
      setCurrentConvPage((p) => p + 1);
    }
  };

  const handleScrollMessages = () => {
    if (!scrollMsgsRef.current || fetchMsgsLoading || !hasMoreMessages) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollMsgsRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

    setIsScrolledToBottom(!isAtBottom);

    if (previousScrollTopRef.current === null) {
      previousScrollTopRef.current = scrollTop;
      return;
    }

    // Only load more messages if we're near the top and haven't reached the limit
    if (
      scrollTop < previousScrollTopRef.current &&
      scrollTop <= 20 &&
      hasMoreMessages
    ) {
      const nextPage = currentMsgPage + 1;
      const prevHeight = scrollMsgsRef.current.scrollHeight; // âœ… Store scroll height before fetching
      fetchMessages(nextPage).then(() => {
        requestAnimationFrame(() => {
          if (scrollMsgsRef.current) {
            const newHeight = scrollMsgsRef.current.scrollHeight;
            scrollMsgsRef.current.scrollTop += newHeight - prevHeight; // âœ… Adjust scroll after messages append
          }
        });
      });
    }

    previousScrollTopRef.current = scrollTop;
  };

  const checkWhatsappAvailabilityWindow = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `/api/conversations/whatsapp-window/${selectedConversation?._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (data && data?.success) {
        setWhatsappRemainingTime(data?.remainingTime);
      }
    } catch (error) {
      handleError(error);
    }
  }, [selectedConversation]);

  const handleDeleteConversation = async (conversationId: string) => {
    if (!token) return;
    try {
      setIsDeletingConversation(true);
      const { data } = await axios.delete(
        `/api/conversations/delete-conversation/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data && data?.success) {
        // Remove conversation from list (soft deleted = trashed)
        const updatedConversations = conversations.filter(
          (conv) => conv._id !== conversationId,
        );
        setConversations(updatedConversations);
        setSelectedConversation(null);
        setIsDeleteConversationModalOpen(false);
        setTotalConversations((prev) => prev - 1);
        toast.success("Conversation moved to trash");
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsDeletingConversation(false);
    }
  };

  const handleUpdateConversationStatus = async (
    conversationId: string,
    status: string,
  ) => {
    if (!token) return;
    try {
      const { data } = await axios.patch(
        `/api/conversations/update-conversation/${conversationId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data && data?.success) {
        // If status is trashed/archived/closed, remove from current list
        if (
          status === "trashed" ||
          status === "archived" ||
          status === "closed"
        ) {
          const updatedConversations = conversations.filter(
            (conv) => conv._id !== conversationId,
          );
          setConversations(updatedConversations);
          setSelectedConversation(null);
          setTotalConversations((prev) => prev - 1);
        } else {
          // Update conversation status in state
          const updatedConversations = conversations.map((conv) =>
            conv._id === conversationId ? { ...conv, status } : conv,
          );
          setConversations(updatedConversations as any);
          setSelectedConversation((prev: any) =>
            prev && prev._id === conversationId ? { ...prev, status } : prev,
          );
        }
        toast.success(`Conversation marked as ${status}`);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleAddTagToConversation = async (leadId: string, tag: string) => {
    if (!token) return;
    try {
      setIsAddingTag(true);
      const { data } = await axios.post(
        `/api/tags/${leadId}`,
        { tag },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data && data?.success) {
        // Update conversation in state
        const tags = data?.tags || [];
        setTags(tags || []);
        setIsAddTagModalOpen(false);
        toast.success("Tag added successfully");
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleRemoveTagFromConversation = async (
    leadId: string,
    tag: string,
  ) => {
    if (!token) return;
    try {
      const { data } = await axios.post(
        `/api/tags/remove/${leadId}`,
        { tag: tag },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data && data?.success) {
        // Update conversation in state
        const updatedTags = data?.tags || [];
        setTags(updatedTags);
        toast.success("Tag removed successfully");
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleAgentSelect = async (
    agent: User | null,
    conversationId: string,
  ) => {
    setSelectedAgent(agent);
    // Here you would typically make an API call to assign the conversation
    console.log("Assigned conversation to:", agent);
    if (!agent) return;
    try {
      const { data } = await axios.post(
        `/api/conversations/assign-conversation/${conversationId}`,
        {
          ownerId: agent?._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (data && data?.success) {
        // Update conversation in state
        const updatedConversations = conversations.map((conv) =>
          conv._id === conversationId ? { ...conv, ownerId: agent?._id } : conv,
        );
        setSelectedConversation((prev) =>
          prev && prev._id === conversationId
            ? { ...prev, ownerId: agent?._id }
            : prev,
        );
        setConversations(updatedConversations);
        toast.success("Conversation assigned successfully");
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleAgentFilterChange = (agentId: string | null) => {
    setFilters((prev) => ({
      ...prev,
      agentId: agentId || "", // Convert null to '' to remove the filter
    }));
  };

  const handleApplyFilters = () => {
    // Fetch conversations with new filters
    setCurrentConvPage(1);
  };

  const handleRemoveTemplate = () => {
    setSelectedTemplate(null);
    setMediaUrl("");
    setMediaType("");
    setAttachedFile(null);
    setAttachedFiles([]);
    setBodyParameters([]);
    setHeaderParameters([]);
    setSubject("");
    setMessage("");
  };

  // select agent by default based on selected conversation
  useEffect(() => {
    if (selectedConversation && agents?.length > 0) {
      const findConvOwner = agents?.find(
        (agent) => agent?._id === selectedConversation?.ownerId,
      );
      if (findConvOwner) setSelectedAgent(findConvOwner);
      else setSelectedAgent(null);
    }
  }, [agents, selectedConversation]);

  // Reset inbox area if select a different conversation
  useEffect(() => {
    if (selectedConversation) {
      setSelectedTemplate(null);
      setMediaUrl("");
      setMediaType("");
      setAttachedFile(null);
      setAttachedFiles([]);
      setBodyParameters([]);
      setHeaderParameters([]);
      setSubject("");
      setMessage("");
      setSelectedMessage(null);
    }
  }, [selectedConversation]);

  // Check viewport on mount and window resize
  useEffect(() => {
    const checkMobileView = () => {
      // Using common mobile breakpoint (768px)
      setIsMobileView(window.innerWidth < 768);
    };

    // Initial check
    checkMobileView();

    // Add resize event listener
    window.addEventListener("resize", checkMobileView);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkMobileView);
    };
  }, []);

  // Socket connection
  useEffect(() => {
    if (!token && !userId) return;

    const decoded = jwtDecode(token || "{}") as DecodedToken;
    const currentUserId = userId || decoded?.userId;
    setUserId(currentUserId);
    try {
      // Create socket if it doesn't exist or is disconnected
      socket = io({
        path: "/api/messages/socketio",
        query: { userId: currentUserId },
      });

      // Log socket events for debugging
      socket.on("connect", () => {
        console.log("Socket connected with ID:", socket?.id);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });

      socket.emit("register", currentUserId);

      // Set up message listeners
      socket.on("incomingMessage", (message: MessageType) => {
        console.log("Incoming message via socket:", message);

        // Update conversations list
        setConversations((prevConversations) => {
          let convExists = false;
          const updatedConversations = prevConversations.map((conv) => {
            if (conv._id === message.conversationId) {
              convExists = true;
              return {
                ...conv,
                recentMessage: message,
                unreadMessages: [...(conv.unreadMessages || []), message._id],
              };
            }
            return conv;
          });

          if (!convExists) {
            return prevConversations;
          }

          // Move the updated conversation to the front
          updatedConversations.sort((a, b) =>
            a._id === message.conversationId
              ? -1
              : b._id === message.conversationId
                ? 1
                : 0,
          );
          return updatedConversations;
        });

        // Update messages if it belongs to the selected conversation
        if (message.conversationId === selectedConversation?._id) {
          setMessages((prevMessages) => {
            const lastGroup = prevMessages[prevMessages.length - 1];
            const today = new Date().toISOString().split("T")[0];

            if (lastGroup && lastGroup.date === today) {
              // Add to existing today's group
              return prevMessages.map((group, index) =>
                index === prevMessages.length - 1
                  ? { ...group, messages: [...group.messages, message] }
                  : group,
              );
            } else {
              // Create new group for today
              return [...prevMessages, { date: today, messages: [message] }];
            }
          });
        }
      });
      socket.on("messageStatusUpdate", (message: MessageType) => {
        console.log("Message status update:", message);

        if (message.conversationId === selectedConversation?._id) {
          setMessages((prevMessages) =>
            prevMessages.map((group) => {
              const updatedMessages = group.messages.map((msg) =>
                msg._id === message._id ? message : msg,
              );

              // Check if any message was actually updated
              const hasChange = updatedMessages.some(
                (msg, index) => msg._id !== group.messages[index]?._id,
              );

              return hasChange
                ? { ...group, messages: updatedMessages }
                : group;
            }),
          );
        }
      });
    } catch (error) {
      console.log("Error: ", error);
    }

    // Cleanup function
    return () => {
      socket?.disconnect();
    };
  }, []); // Remove messages from dependencies

  // status filter dropdown click outside handler
  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target as Node) &&
        statusBtnRef.current &&
        !statusBtnRef.current.contains(e.target as Node)
      ) {
        setShowStatusDropdown(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowStatusDropdown(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    fetchConversations(currentConvPage);
  }, [currentConvPage, token, searchConvInput, fetchConversations]);

  useEffect(() => {
    setCurrentConvPage(1);
    fetchConversations(1);
  }, [filters]);

  useEffect(() => {
    if (!selectedConversation) return;

    // Reset messages and pagination when conversation changes
    setMessages([]);
    setCurrentMsgPage(1);

    // Fetch messages for the newly selected conversation
    fetchMessages(1);
  }, [selectedConversation, token]);

  // Effect for pagination - only runs when currentMsgPage changes after initial load
  useEffect(() => {
    if (!selectedConversation || currentMsgPage <= 1) return;
    fetchMessages(currentMsgPage);
  }, [currentMsgPage]);

  useEffect(() => {
    if (providers.length === 0) return;
    setSelectedProvider(providers[0]);
  }, [providers]);

  useEffect(() => {
    setCurrentConvPage(1);
  }, [searchConvInput]);

  useEffect(() => {
    if (selectedConversation) {
      handleReadConversation(selectedConversation._id);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom only when switching conversations, not when loading more messages via pagination
  useEffect(() => {
    // Only auto-scroll when first loading a conversation (when messages are initially loaded)
    // We can detect this by checking if we're on page 1 and it's the initial load
    if (currentMsgPage === 1 && messages.length > 0) {
      // Use setTimeout to ensure DOM has updated before scrolling
      setTimeout(() => {
        handleScrollMsgsToBottom();
      }, 0);
    }
  }, [messages, currentMsgPage]);

  useEffect(() => {
    if (!selectedConversation) return;
    checkWhatsappAvailabilityWindow();
  }, [selectedConversation]);

  useEffect(() => {
    if (
      selectedTemplate?.headerFileUrl &&
      selectedTemplate?.headerType !== "text"
    ) {
      let mediaFileType = selectedTemplate?.headerType;
      setMediaUrl(selectedTemplate?.headerFileUrl);
      setMediaType(mediaFileType);
    } else {
      setMediaType("");
      setMediaUrl("");
    }

    if (selectedTemplate) {
      setSubject(selectedTemplate?.subject);
    } else {
      setSubject("");
    }
  }, [selectedTemplate]);
 

  const state = {
    user,
    conversations,
    selectedConversation,
    selectedProvider,
    hasMoreConversations,
    fetchConvLoading,
    totalConversations,
    currentConvPage,
    setCurrentConvPage,
    conversationRef,
    providers,
    templates,
    attachedFile,
    attachedFiles,
    selectedTemplate,
    message,
    textAreaRef,
    mediaType,
    mediaUrl,
    sendMsgLoading,
    fetchMsgsLoading,
    messages,
    scrollMsgsRef,
    messageRef,
    messagesEndRef,
    totalMessages,
    hasMoreMessages,
    isScrolledToBottom,
    subject,
    bodyParameters,
    headerParameters,
    isLiveChatSelected,
    searchConvInput,
    whatsappRemainingTime,
    selectedMessage,
    conversationStatusOptions,
    // conversation status
    filters,
    showStatusDropdown,
    statusDropdownRef,
    statusBtnRef,
    isMobileView,
    isProfileView,
    isAddTagModalOpen,
    isDeleteConversationModalOpen,
    isDeletingConversation,
    isAddingTag,
    canSend,
    canSchedule,
    agents,
    selectedAgent,
    agentFetchLoading,
    isScheduleModalOpen,
    isFilterModalOpen,
    isOpenBookAppointmentModal,
    isLocationPickerOpen,
    rooms,
    doctors,
    roomFetchLoading,
    doctorFetchLoading,
    patient,
    // tags
    tags,
    tagsLoading,

    // Lead Editing
    editingField,
    editValue,
    isUpdatingLead,
  };

  return {
    state,
    setConversations,
    setFetchConvLoading,
    setSelectedConversation,
    setSelectedProvider,
    setAttachedFile,
    setAttachedFiles,
    setSelectedTemplate,
    setSubject,
    setMessage,
    setMediaType,
    setMediaUrl,
    setBodyParameters,
    setHeaderParameters,
    setIsLiveChatSelected,
    setSearchConvInput,
    setSelectedMessage,
    setConversationStatusOptions,
    // conversation filters
    setFilters,
    setShowStatusDropdown,
    setIsMobileView,
    setIsProfileView,
    setIsAddTagModalOpen,
    setIsDeleteConversationModalOpen,
    setIsDeletingConversation,
    setIsAddingTag,
    setSelectedAgent,
    setIsScheduleModalOpen,
    setIsFilterModalOpen,
    setIsOpenBookAppointmentModal,
    setIsLocationPickerOpen,

    fetchConversations,
    fetchMessages,
    handleSendMessage,
    handleReadConversation,
    handleConvScroll,
    handleScrollMessages,
    handleScrollMsgsToBottom,
    handleDeleteConversation,
    handleUpdateConversationStatus,
    handleAddTagToConversation,
    handleRemoveTagFromConversation,
    handleAgentSelect,
    handleAgentFilterChange,
    handleApplyFilters,
    handleScheduleMessage,
    handleRemoveTemplate,
    handleEditLead,
    cancelEditLead,
    handleUpdateLead,
    setEditValue,
  };
};

export default useInbox;
