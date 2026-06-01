import { useState, useEffect, FC, SetStateAction } from "react";
import { toast } from "react-toastify";
import {
  NotepadText,
  Search,
  X,
  Check,
  Upload,
  FileText,
  Eye,
  ExternalLink as Link,
  Phone,
} from "lucide-react";
import { capitalize, handleError } from "@/lib/helper";
import { Template } from "@/types/templates";
import axios from "axios";
import { Provider } from "@/types/conversations";
import { VariableType } from "@/hooks/useInbox";
import VariableMappingDropdown from "@/pages/clinic/automation/_components/VariableMappingDropdown";

interface IProps {
  attachedFile: File | null;
  templates: Template[];
  selectedTemplate: Template | null;
  selectedProvider: Provider | null;
  setMessage: React.Dispatch<SetStateAction<string>>;
  setMediaType: React.Dispatch<
    SetStateAction<"" | "image" | "video" | "audio" | "document">
  >;
  setAttachedFile: React.Dispatch<SetStateAction<File | null>>;
  setBodyParameters: React.Dispatch<SetStateAction<VariableType[]>>;
  setHeaderParameters: React.Dispatch<SetStateAction<VariableType[]>>;
  //   setTemplates: React.Dispatch<SetStateAction<Template[]>>;
  setSelectedTemplate: React.Dispatch<SetStateAction<Template | null>>;
  handleRemoveTemplate: () => void;
  entity?: string;
  nodeId?: string;
}

const TemplatesModal: FC<IProps> = ({
  attachedFile,
  templates,
  selectedTemplate,
  selectedProvider,
  setMessage,
  setAttachedFile,
  setMediaType,
  setBodyParameters,
  setHeaderParameters,
  //   setTemplates,
  setSelectedTemplate,
  handleRemoveTemplate,
  entity = "Lead",
  nodeId = "",
}) => {
  const isBusinessHour = true;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] =
    useState<boolean>(false);
  const [tempVariables, setTempVariables] = useState<Record<string, string>>(
    {},
  );
  const [tempHeaderVariables, setTempHeaderVariables] = useState<
    Record<string, string>
  >({});
  const [searchInput, setSearchInput] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("clinicToken") : null;

  const handleTempVarValueChange = (
    key: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setTempVariables((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTempHeaderVarValueChange = (
    key: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setTempHeaderVariables((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFillHeaderVariables = (
    headerText: string,
    message: string,
    headerVariables: Record<string, string>,
  ) => {
    let updatedHeader = headerText;
    let updatedMessage = message;
    let headerParams: VariableType[] = [];

    Object.entries(headerVariables).forEach(([key, value]) => {
      const extractedKey = key.match(/{{\d+}}/)?.[0];

      if (extractedKey && updatedHeader.includes(extractedKey)) {
        updatedHeader = updatedHeader.replaceAll(extractedKey, value);
        headerParams.push({ type: "text", text: value });
      }
    });

    updatedMessage = `${updatedHeader}\n${updatedMessage}`.trim();
    return { updatedMessage, headerParams };
  };

  const handleFillMessageVariables = (
    message: string,
    variables: Record<string, string>,
  ) => {
    let newMessage = message;
    let bodyVariables: VariableType[] = [];

    Object.entries(variables).forEach(([key, value]) => {
      const extractedKey = key.replace(
        /\[?"?({{\d+}})"?\]?/g,
        (_match, p1) => p1,
      );

      if (newMessage?.includes(extractedKey)) {
        newMessage = newMessage.replaceAll(extractedKey, value);
        bodyVariables.push({ type: "text", text: value });
      }
    });

    return { updatedMessage: newMessage, bodyVariables };
  };

  const handleSelectTemplate = (temp: Template) => {
    setSelectedTemplate(temp);
    setTempVariables({});
    setTempHeaderVariables({});
    setIsDropdownOpen(false);
    setIsTemplateSheetOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    let newMessage = selectedTemplate?.content;
    let headerParams: VariableType[] = [];
    let headerText = selectedTemplate?.headerText;

    if (headerText) {
      const headerData = handleFillHeaderVariables(
        headerText,
        selectedTemplate.content,
        tempHeaderVariables,
      );
      newMessage = headerData.updatedMessage;
      headerParams = headerData?.headerParams;
    }

    const { updatedMessage, bodyVariables } = handleFillMessageVariables(
      newMessage,
      tempVariables,
    );

    setHeaderParameters(headerParams);
    setBodyParameters(bodyVariables);
    setMessage(updatedMessage);
    setIsTemplateSheetOpen(false);
  };

  useEffect(() => {
    const fetchAllTemplates = async () => {
      try {
        const { data } = await axios.get(
          `/api/all-templates?limit=1000&search=${searchInput}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, //apiKey
            },
          },
        );
        if (data && data.success) {
          //   dispatch(setTemplates(data.data));
        }
      } catch (error) {
        handleError(error);
      }
    };
    fetchAllTemplates();
  }, [searchInput]);

  const filteredTemplates = templates?.filter((item: Template) => {
    const typeMatch = selectedProvider?.type?.includes(item.templateType);
    const statusMatch = item?.status === "approved";
    const providerMatch =
      item?.templateType !== "whatsapp" ||
      item?.provider?._id === selectedProvider?._id;
    return typeMatch && statusMatch && providerMatch;
  });

  const disableSaveTempBtn = () => {
    if (!selectedTemplate) return false;

    // Check body variables
    const bodyFilled =
      selectedTemplate?.variables?.every((variable: string) =>
        tempVariables[variable]?.trim(),
      ) ?? true;

    // Check header variables
    const headerFilled =
      selectedTemplate?.headerVariables?.every((variable: string) =>
        tempHeaderVariables[variable]?.trim(),
      ) ?? true;

    // Check file upload if needed
    let fileValid = true;

    if (selectedTemplate?.isHeader && selectedTemplate?.headerType !== "text") {
      // If header already has a file URL, allow without checking attachedFile
      if (selectedTemplate?.headerFileUrl) {
        fileValid = true;
      } else {
        // Otherwise, check if we have a new file attached
        fileValid = !!attachedFile;
      }
    }

    return bodyFilled && headerFilled && fileValid;
  };

  // Function to generate preview content based on variables
  const generatePreviewContent = () => {
    if (!selectedTemplate) return "";

    let previewContent = selectedTemplate.content || "";

    // Replace header variables
    Object.entries(tempHeaderVariables).forEach(([key, value]) => {
      const extractedKey = key.match(/{{\d+}}/)?.[0];
      if (extractedKey && previewContent.includes(extractedKey)) {
        previewContent = previewContent.replaceAll(extractedKey, value);
      }
    });

    // Replace body variables
    Object.entries(tempVariables).forEach(([key, value]) => {
      const extractedKey = key.replace(
        /\[?"?({{\d+}})"?\]?/g,
        (_match, p1) => p1,
      );

      if (previewContent?.includes(extractedKey)) {
        previewContent = previewContent.replaceAll(extractedKey, value);
      }
    });

    return previewContent;
  };

  // Function to render WhatsApp preview
  const renderWhatsAppPreview = () => {
    const previewContent = generatePreviewContent();

    return (
      <div className="space-y-4">
        {/* WhatsApp Header */}
        <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-green-50 to-green-100/50 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">WA</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">Business Account</div>
              <div className="text-sm text-gray-600">Verified • Business</div>
            </div>
          </div>

          {selectedTemplate?.category && (
            <div className="px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200">
              <span className="text-xs font-medium text-gray-700">
                {selectedTemplate.category === "marketing"
                  ? "MARKETING"
                  : selectedTemplate.category === "utility"
                    ? "UTILITY"
                    : selectedTemplate.category === "authentication"
                      ? "AUTHENTICATION"
                      : "TEMPLATE"}
              </span>
            </div>
          )}
        </div>

        {/* Preview Container */}
        <div className="space-y-4">
          {/* Header Preview */}
          {selectedTemplate?.isHeader && (
            <div className="relative">
              {selectedTemplate?.headerType === "text" &&
                selectedTemplate?.headerText && (
                  <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-lg">
                    <div className="font-medium text-sm">
                      {selectedTemplate.headerText}
                    </div>
                  </div>
                )}

              {attachedFile && selectedTemplate?.headerType !== "text" && (
                <div className="relative rounded-t-lg overflow-hidden bg-gray-100">
                  {attachedFile.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(attachedFile)}
                      alt="Template header"
                      className="w-full h-48 object-cover"
                    />
                  ) : attachedFile.type.startsWith("video/") ? (
                    <div className="relative h-48 bg-black">
                      <video className="w-full h-full object-cover">
                        <source
                          src={URL.createObjectURL(attachedFile)}
                          type={attachedFile.type}
                        />
                      </video>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center p-6 bg-gray-50">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">
                          {attachedFile.name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {(attachedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* If using headerFileUrl from template */}
              {!attachedFile &&
                selectedTemplate?.headerFileUrl &&
                selectedTemplate?.headerType !== "text" && (
                  <div className="relative rounded-t-lg overflow-hidden bg-gray-100">
                    {selectedTemplate.headerType === "image" ? (
                      <img
                        src={selectedTemplate.headerFileUrl}
                        alt="Template header"
                        className="w-full h-48 object-cover"
                      />
                    ) : selectedTemplate.headerType === "video" ? (
                      <div className="relative h-48 bg-black">
                        <video className="w-full h-full object-cover">
                          <source
                            src={selectedTemplate.headerFileUrl}
                            type={`video/${selectedTemplate.headerType}`}
                          />
                        </video>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 flex flex-col items-center justify-center p-6 bg-gray-50">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-900">
                            Document
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            File attachment
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}

          {/* Message Body */}
          {(previewContent || selectedTemplate?.isHeader) && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4">
                {/* Variable Placeholders */}
                {selectedTemplate?.variables &&
                  selectedTemplate.variables.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-500 mb-2">
                        Variables will appear as:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate?.variables?.map(
                          (variable: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium"
                            >
                              {variable}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Content */}
                {previewContent ? (
                  <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {previewContent.split("{{").map((part, index) => {
                      if (part.includes("}}")) {
                        const [variable, ...rest] = part.split("}}");
                        return (
                          <span key={index}>
                            <span className="inline-flex items-center px-1.5 py-0.5 mx-1 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                              {variable}
                            </span>
                            {rest.join("")}
                          </span>
                        );
                      }
                      return part;
                    })}
                  </div>
                ) : (
                  <div className="text-gray-400 italic">
                    Your message will appear here...
                  </div>
                )}
              </div>

              {/* Footer */}
              {selectedTemplate?.isFooter && selectedTemplate?.footer && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="text-sm text-gray-600">
                    {selectedTemplate.footer}
                  </div>
                </div>
              )}

              {/* Buttons Preview */}
              {selectedTemplate?.isButton &&
                selectedTemplate?.templateButtons?.length > 0 && (
                  <div className="border-t border-gray-100">
                    {selectedTemplate?.templateButtons
                      ?.slice(0, 2)
                      .map((button, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-3 px-4 py-3 ${
                            index > 0 ? "border-t border-gray-100" : ""
                          } hover:bg-gray-50 transition-colors`}
                        >
                          {button?.type === "QUICK_REPLY" && (
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                              </svg>
                            </div>
                          )}
                          {button?.type === "URL" && (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Link className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                          {button?.type === "PHONE_NUMBER" && (
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <Phone className="w-4 h-4 text-purple-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {button?.text}
                            </div>
                            {button?.type === "URL" && (
                              <div className="text-xs text-gray-500">
                                Tap to open link
                              </div>
                            )}
                            {button?.type === "PHONE_NUMBER" && (
                              <div className="text-xs text-gray-500">
                                Call phone number
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                    {selectedTemplate?.templateButtons &&
                      selectedTemplate.templateButtons.length >= 3 && (
                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                          <div className="flex items-center gap-3 text-gray-600">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 6h16M4 12h16M4 18h16"
                                />
                              </svg>
                            </div>
                            <div className="text-sm font-medium">
                              +{selectedTemplate?.templateButtons?.length! - 2}{" "}
                              more options
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                )}
            </div>
          )}

          {/* Empty State */}
          {!previewContent &&
            !selectedTemplate?.isHeader &&
            !attachedFile &&
            !selectedTemplate?.headerFileUrl && (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">
                    No content yet
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Start typing to see a live preview
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Template Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Template Name</div>
              <div className="font-medium text-gray-900">
                {selectedTemplate?.name || "Untitled"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Preview Mode
              </div>
            </div>
            {selectedTemplate?.language && (
              <div>
                <div className="text-xs text-gray-500">Language</div>
                <div className="font-medium text-gray-900">
                  {selectedTemplate.language === "en_US"
                    ? "English"
                    : selectedTemplate.language}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Function to render SMS preview
  const renderSMSPreview = () => {
    const previewContent = generatePreviewContent();

    return (
      <div className="space-y-4">
        <div className="bg-gray-100 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">S</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">SMS Sender</div>
              <div className="text-sm text-gray-600">+1 (555) 123-4567</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            {previewContent ? (
              <div className="text-gray-800 whitespace-pre-wrap">
                {previewContent}
              </div>
            ) : (
              <div className="text-gray-400 italic">
                SMS message will appear here...
              </div>
            )}

            {(attachedFile || selectedTemplate?.headerFileUrl) && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-600">
                  📎 Attachment included
                </div>
              </div>
            )}

            <div className="mt-3 text-right">
              <div className="text-xs text-gray-500">
                {previewContent?.length || 0}/160 characters
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to render Email preview
  const renderEmailPreview = () => {
    const previewContent = generatePreviewContent();

    return (
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Email Header */}
          <div className="bg-gray-50 p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-900">New Message</div>
              <div className="text-xs text-gray-500">Now</div>
            </div>
            <div className="text-sm">
              <div className="mb-1">
                <span className="text-gray-600">From:</span>
                <span className="ml-2 text-gray-900">
                  yourbusiness@company.com
                </span>
              </div>
              <div>
                <span className="text-gray-600">Subject:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {selectedTemplate?.subject || "No subject"}
                </span>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="p-6">
            {previewContent ? (
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: previewContent }} />
              </div>
            ) : (
              <div className="text-gray-400 italic text-center py-8">
                Email content will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Function to render preview based on template type
  const renderTemplatePreview = () => {
    if (!selectedTemplate) return null;

    return (
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                selectedTemplate?.templateType === "whatsapp"
                  ? "bg-green-100 text-green-800"
                  : selectedTemplate?.templateType === "sms"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
              }`}
            >
              {selectedTemplate?.templateType === "whatsapp" && "WhatsApp"}
              {selectedTemplate?.templateType === "sms" && "SMS"}
              {selectedTemplate?.templateType === "email" && "Email"}
            </span>
          </div>
        </div>

        {selectedTemplate?.templateType === "whatsapp" &&
          renderWhatsAppPreview()}
        {selectedTemplate?.templateType === "sms" && renderSMSPreview()}
        {selectedTemplate?.templateType === "email" && renderEmailPreview()}
      </div>
    );
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
                  ? tempHeaderVariables[key] || ""
                  : tempVariables[key] || ""
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
              setTempHeaderVariables((prev) => ({
                ...prev,
                [key]: value,
              }));
            } else {
              setTempVariables((prev) => ({
                ...prev,
                [key]: value,
              }));
            }
          }}
          nodeId={nodeId}
          align="right"
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Template Selector Button */}
      <div className="relative">
        <button
          title="Choose Template"
          disabled={!isBusinessHour}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`
            relative flex items-center cursor-pointer gap-1.5 p-2.5 rounded-lg border transition-all duration-200
            ${
              selectedTemplate
                ? "bg-green-200 border-green-500 hover:border-green-600 text-green-800"
                : "bg-white border-gray-300 hover:border-gray-400 text-gray-700"
            }
          `}
        >
          <NotepadText className="w-5 h-5" />

          {selectedTemplate && (
            <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full flex items-center justify-center w-4 h-4 text-xs font-semibold">
              1
            </span>
          )}
        </button>

        {/* Templates Modal (centered) */}
        {isDropdownOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop (blurred) */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* Centered Modal */}
            <div className="relative min-h-full flex items-center justify-center p-4">
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 text-lg">
                      Templates
                    </h3>
                    <button
                      onClick={() => setIsDropdownOpen(false)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search templates..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Template List */}
                <div className="p-2 overflow-y-auto max-h-[calc(90vh-140px)]">
                  {filteredTemplates?.length === 0 ? (
                    <div className="p-8 text-center">
                      <NotepadText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        No templates found
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Create templates in your dashboard
                      </p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {filteredTemplates?.map((item: Template) => (
                        <div
                          key={item._id}
                          className={`
                            p-3 mb-2 rounded-lg border cursor-pointer transition-all duration-200
                            ${
                              selectedTemplate?._id === item._id
                                ? "bg-blue-50 border-blue-200"
                                : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800 text-sm">
                                {item.name}
                              </h4>
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {item.content?.substring(0, 40)}
                                {item.content?.length > 40 ? "..." : ""}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium
                                  ${
                                    item.templateType === "sms"
                                      ? "bg-blue-100 text-blue-700"
                                      : item.templateType === "whatsapp"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-purple-100 text-purple-700"
                                  }
                                `}
                                >
                                  {capitalize(item.templateType)}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  {item.language}
                                </span>
                              </div>
                            </div>
                            {selectedTemplate?._id === item._id ? (
                              <button
                                onClick={() => {
                                  handleRemoveTemplate();
                                  setIsDropdownOpen(false);
                                }}
                                className="ml-2 p-1 rounded-full border border-red-500 bg-white shadow-sm hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors duration-200 cursor-pointer"
                                title="Remove template"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            ) : (
                              <div
                                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all
                                  border-gray-300 cursor-pointer
                                `}
                                onClick={() => handleSelectTemplate(item)}
                              ></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Details Sheet */}
      {isTemplateSheetOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsTemplateSheetOpen(false)}
          />

          {/* Sheet */}
          <div className="relative min-h-full flex items-end justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Template Details
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Fill in template variables
                    </p>
                  </div>
                  <button
                    onClick={() => setIsTemplateSheetOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div>
                  {/* Template Info Card */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-white rounded-lg border border-blue-200 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {selectedTemplate?.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${
                                selectedTemplate?.templateType === "sms"
                                  ? "bg-blue-100 text-blue-700"
                                  : selectedTemplate?.templateType ===
                                      "whatsapp"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-purple-100 text-purple-700"
                              }
                            `}
                              >
                                {capitalize(
                                  selectedTemplate?.templateType || "",
                                )}
                              </span>
                              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {selectedTemplate?.category || "General"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <Check className="w-3 h-3 mr-1" />
                          Approved
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Header Section */}
                  {selectedTemplate?.headerType === "text" &&
                    selectedTemplate?.headerText && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          Header
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-800">
                            {selectedTemplate?.headerText}
                          </p>
                        </div>
                      </div>
                    )}

                  {/* for media template */}
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
                  {selectedTemplate?.headerVariables?.map(
                    (key: string, index: number) =>
                      renderVariableInput(key, index, true),
                  )}

                  {/* Body Section */}
                  <div className="my-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Message Body
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
                {/* Preview Section */}
                {renderTemplatePreview()}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      setIsTemplateSheetOpen(false);
                    }}
                    className="px-5 py-2.5 cursor-pointer border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!disableSaveTempBtn()}
                    onClick={handleSaveTemplate}
                    className={`
                      px-6 py-2.5 cursor-pointer font-medium rounded-lg transition-all
                      ${
                        disableSaveTempBtn()
                          ? "bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 shadow-md"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }
                    `}
                  >
                    Apply Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field Mapping Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative min-h-full flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Insert Field
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "Customer Name", value: "{customer_name}" },
                    { label: "Order Number", value: "{order_number}" },
                    { label: "Date", value: "{date}" },
                    { label: "Time", value: "{time}" },
                    { label: "Amount", value: "{amount}" },
                    { label: "Reference ID", value: "{reference_id}" },
                  ].map((field) => (
                    <button
                      key={field.value}
                      onClick={() => {
                        // Handle field insertion logic here
                        setIsModalOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          {field.label}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {field.value}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TemplatesModal;
