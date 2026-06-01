import React from "react";
import { X, Eye, Mail, MessageSquare, FileText, Upload } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Campaign } from "@/types/campaigns";

interface PreviewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
}

const PreviewCampaignModal: React.FC<PreviewCampaignModalProps> = ({
  isOpen,
  onClose,
  campaign,
}) => {
  if (!isOpen || !campaign) return null;

  const getThemeColors = () => {
    switch (campaign.type) {
      case "whatsapp":
        return {
          primary: "green",
          primaryBg: "bg-green-600",
          primaryLight: "bg-green-50",
          primaryText: "text-green-600",
          icon: <FaWhatsapp className="w-5 h-5 text-green-500" />,
        };
      case "sms":
        return {
          primary: "blue",
          primaryBg: "bg-blue-600",
          primaryLight: "bg-blue-50",
          primaryText: "text-blue-600",
          icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
        };
      case "email":
        return {
          primary: "red",
          primaryBg: "bg-red-600",
          primaryLight: "bg-red-50",
          primaryText: "text-red-600",
          icon: <Mail className="w-5 h-5 text-red-500" />,
        };
      default:
        return {
          primary: "gray",
          primaryBg: "bg-gray-600",
          primaryLight: "bg-gray-50",
          primaryText: "text-gray-600",
          icon: <MessageSquare className="w-5 h-5 text-gray-500" />,
        };
    }
  };

  const theme = getThemeColors();

  const replaceVariables = (
    content: string,
    mappings: Record<string, string> = {},
  ) => {
    if (!content) return "";
    let result = content;
    Object.keys(mappings).forEach((key) => {
      const placeholder = `{{${key}}}`;
      const value = mappings[key] || placeholder;
      result = result.replace(new RegExp(placeholder, "g"), value);
    });
    return result;
  };

  const renderWhatsAppPreview = () => {
    const content = campaign.content || "";
    const headerText = (campaign as any).headerText || "";
    const footerText = (campaign as any).footerText || "";
    const processedContent = replaceVariables(
      content,
      campaign.variableMappings,
    );
    const processedHeader = headerText
      ? replaceVariables(headerText, campaign.headerVariableMappings)
      : "";

    return (
      <div className="bg-[#e5ddd5] rounded-2xl p-4 min-h-[500px]">
        <div className="relative bg-[#e5ddd5] rounded-lg overflow-hidden">
          {/* Message Bubble */}
          <div className="max-w-[85%] ml-auto bg-[#dcf8c6] rounded-lg shadow-sm p-3 mb-2">
            {/* Message Header */}
            <div className="text-xs text-gray-500 font-medium mb-1">You</div>

            {/* Media Header */}
            {campaign.mediaUrl && campaign.mediaType && (
              <div className="mb-2 rounded-lg overflow-hidden bg-gray-100">
                {campaign.mediaType === "image" && (
                  <div className="w-full h-44 bg-gray-300 flex items-center justify-center text-gray-500 text-xs">
                    <img
                      src={campaign.mediaUrl}
                      alt="Media"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {campaign.mediaType === "video" && (
                  <div className="w-full h-44 bg-gray-800 flex items-center justify-center text-white text-xs">
                    <video
                      src={campaign.mediaUrl}
                      className="w-full h-full object-cover"
                      controls
                    />
                  </div>
                )}
                {campaign.mediaType === "document" && (
                  <div className="p-3 bg-white flex items-center gap-2">
                    <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center text-red-600 text-xs font-bold">
                      PDF
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">
                        Document
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {campaign.mediaUrl}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Text Header */}
            {processedHeader && (
              <div className="font-bold text-gray-900 text-sm mb-1 pb-1 border-b border-gray-300/50">
                {processedHeader}
              </div>
            )}

            {/* Message Content */}
            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {processedContent || "Message content will appear here..."}
            </div>

            {/* Footer */}
            {footerText && (
              <div className="mt-2 text-[11px] text-gray-500 italic">
                {footerText}
              </div>
            )}

            {/* Reply Buttons */}
            {(campaign as any).replyButtons &&
              (campaign as any).replyButtons.length > 0 && (
                <div className="mt-3 space-y-1">
                  {(campaign as any).replyButtons.map(
                    (button: any, idx: number) => (
                      <button
                        key={idx}
                        className="w-full flex items-center justify-center py-2 px-3 bg-white/80 hover:bg-white rounded text-center text-sm font-medium text-green-600 border border-gray-200 transition-colors"
                      >
                        {button.reply?.title || `Button ${idx + 1}`}
                      </button>
                    ),
                  )}
                </div>
              )}

            {/* Template Buttons */}
            {(campaign as any).templateButtons &&
              (campaign as any).templateButtons.length > 0 && (
                <div className="mt-3 space-y-1">
                  {(campaign as any).templateButtons.map(
                    (btn: any, idx: number) => (
                      <button
                        key={idx}
                        className="w-full flex items-center justify-center py-2 px-3 bg-white/80 hover:bg-white rounded text-center text-sm font-medium text-green-600 border border-gray-200 transition-colors"
                      >
                        {btn.text}
                      </button>
                    ),
                  )}
                </div>
              )}

            {/* List Message Button */}
            {(campaign as any).listSections &&
              (campaign as any).listSections.length > 0 && (
                <div className="mt-3">
                  <button className="w-full py-2 px-3 bg-white/80 hover:bg-white rounded text-center text-sm font-medium text-gray-700 border border-gray-200 transition-colors flex items-center justify-between">
                    <span>📋 Menu</span>
                    <span className="text-xs">▼</span>
                  </button>

                  {/* List Sections Preview */}
                  <div className="mt-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {(campaign as any).listSections.map(
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
                          {section.rows &&
                            section.rows.map((row: any, rowIdx: number) => (
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
                            ))}
                        </div>
                      ),
                    )}
                  </div>
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
    );
  };

  const renderSMSPreview = () => {
    const content = campaign.content || "";
    const processedContent = replaceVariables(
      content,
      campaign.variableMappings,
    );
    const charCount = processedContent.length;
    const messageCount = Math.ceil(charCount / 160) || 1;

    return (
      <div className="bg-gradient-to-b from-blue-50 to-white rounded-2xl p-6 min-h-[500px] border border-blue-100">
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
          <div className="p-4 bg-gray-50 min-h-[350px]">
            <div className="max-w-[85%] ml-auto bg-blue-500 text-white rounded-lg rounded-tr-sm p-3 shadow-sm">
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {processedContent || "SMS message content will appear here..."}
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
                <span className="font-bold text-blue-600">{charCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Messages:</span>
                <span className="font-bold text-blue-600">{messageCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmailPreview = () => {
    const subject = campaign.subject || "No Subject";
    const content = campaign.content || "";
    const processedContent = replaceVariables(
      content,
      campaign.variableMappings,
    );

    return (
      <div className="bg-gradient-to-b from-red-50 to-white rounded-2xl p-6 min-h-[500px] border border-red-100">
        {/* Email Client Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Email Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-gray-900">Email Preview</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-gray-500 w-16">
                  From:
                </span>
                <span className="text-sm text-gray-900">
                  clinic@example.com
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-gray-500 w-16">
                  To:
                </span>
                <span className="text-sm text-gray-900">
                  recipient@example.com
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-gray-500 w-16">
                  Subject:
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {subject}
                </span>
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="p-6 bg-white min-h-[300px]">
            {campaign.mediaUrl && campaign.mediaType === "image" && (
              <div className="mb-4">
                <img
                  src={campaign.mediaUrl}
                  alt="Email header"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            <div
              className="text-sm text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />
          </div>

          {/* Email Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>
                This is a preview of how your email will appear to recipients.
              </p>
              <p className="mt-1">
                Actual rendering may vary depending on email client.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-5xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div
            className={`px-6 py-4 flex justify-between items-center border-b ${theme.primaryLight}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                {theme.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {campaign.name}
                </h3>
                <p className="text-gray-600 text-sm capitalize">
                  {campaign.type} Campaign Preview
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-colors"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Message Preview */}
              <div className="lg:col-span-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Message Preview
                </h4>

                {campaign.type === "whatsapp" && renderWhatsAppPreview()}
                {campaign.type === "sms" && renderSMSPreview()}
                {campaign.type === "email" && renderEmailPreview()}
              </div>

              {/* Right Column - Campaign Details */}
              <div className="space-y-4">
                {/* Campaign Info */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Campaign Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                          ${
                            campaign.status === "draft"
                              ? "bg-gray-100 text-gray-800"
                              : campaign.status === "scheduled"
                                ? "bg-blue-100 text-blue-800"
                                : campaign.status === "processing"
                                  ? "bg-green-100 text-green-800"
                                  : campaign.status === "paused"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : campaign.status === "completed"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-red-100 text-red-800"
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">Channel</div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                          ${
                            campaign.type === "whatsapp"
                              ? "bg-green-100 text-green-800"
                              : campaign.type === "email"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {campaign.type}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">Schedule</div>
                      <div className="text-sm text-gray-700">
                        {campaign.scheduleType === "now"
                          ? "Send Immediately"
                          : `Scheduled: ${campaign.scheduleTime?.date} at ${campaign.scheduleTime?.time}`}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Recipients
                      </div>
                      <div className="text-sm text-gray-700">
                        {campaign.recipients?.length || 0} leads
                      </div>
                    </div>

                    {campaign.description && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          Description
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {campaign.description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Variable Mappings */}
                {(campaign.variableMappings ||
                  campaign.headerVariableMappings) && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-blue-600" />
                      Variable Mappings
                    </h4>
                    <div className="space-y-2">
                      {campaign.headerVariableMappings &&
                        Object.keys(campaign.headerVariableMappings).length >
                          0 && (
                          <div>
                            <div className="text-xs font-medium text-blue-700 mb-1">
                              Header Variables
                            </div>
                            {Object.entries(
                              campaign.headerVariableMappings,
                            ).map(([key, value]) => (
                              <div
                                key={key}
                                className="text-xs text-gray-700 mb-1"
                              >
                                <span className="font-medium">{`${key}`}</span>{" "}
                                →{" "}
                                <span className="text-blue-600">
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      {campaign.variableMappings &&
                        Object.keys(campaign.variableMappings).length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-blue-700 mb-1">
                              Body Variables
                            </div>
                            {Object.entries(campaign.variableMappings).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="text-xs text-gray-700 mb-1"
                                >
                                  <span className="font-medium">{`${key}`}</span>{" "}
                                  →{" "}
                                  <span className="text-blue-600">
                                    {String(value)}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Media Info */}
                {campaign.mediaUrl && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      Media Attachment
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Type</div>
                        <div className="text-sm font-medium text-gray-700 capitalize">
                          {campaign.mediaType}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">URL</div>
                        <div className="text-xs text-gray-700 break-all">
                          {campaign.mediaUrl}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCampaignModal;
