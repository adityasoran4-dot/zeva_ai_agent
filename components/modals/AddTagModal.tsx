import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { X, Tag, MessageSquare } from "lucide-react";

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  leadId?: string;
  conversationTitle?: string;
  conversationType?: string;
  existingTags?: string[];
  handleAddTagToConversation: (leadId: string, tag: string) => Promise<void>;
  loading: boolean;
}

const AddTagModal: React.FC<IProps> = ({
  isOpen,
  onClose,
  conversationId,
  leadId,
  conversationTitle = "Untitled Conversation",
  conversationType = "chat",
  existingTags = [],
  handleAddTagToConversation,
  loading = false,
}) => {
  const [tagName, setTagName] = useState<string>("");

  // Example tags based on conversation context
  const exampleTags = [
    "Important",
    "Follow-up",
    "Urgent",
    "Resolved",
    "Needs Review",
    "Escalated",
    "Customer Support",
    "Sales Inquiry",
    "Technical Issue",
    "Feature Request",
    "Bug Report",
    "Positive Feedback",
    "Negative Feedback",
    "Billing Issue",
    "Onboarding",
    "VIP Customer",
    "Priority Ticket",
    "Awaiting Response",
    "Internal Discussion",
    "External Communication",
  ];

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  const resetModal = () => {
    setTagName("");
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header - Dark Theme */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-white" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                Add Tag to Conversation
              </h2>
            </div>
            <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
              Add a tag to categorize and organize this conversation
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 space-y-4">
            {/* Conversation Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 text-sm mb-1 truncate">
                    {conversationTitle}
                  </h4>
                  <p className="text-gray-600 text-xs">
                    {conversationType === "chat"
                      ? "Chat Conversation"
                      : conversationType === "email"
                        ? "Email Thread"
                        : conversationType === "call"
                          ? "Call Log"
                          : "Conversation"}{" "}
                    • ID: {conversationId?.substring(0, 8)}...
                  </p>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-500 mr-2 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="font-bold text-blue-800 mb-1">
                    How Tags Help
                  </h4>
                  <p className="text-blue-700 text-sm">
                    Tags help you quickly identify conversation types,
                    priorities, and statuses. Use descriptive tags for easy
                    filtering and searching later.
                  </p>
                </div>
              </div>
            </div>

            {/* Tag Name Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-gray-900">
                  Tag Name *
                </label>
                <span className="text-xs text-gray-500">
                  {tagName.length}/30
                </span>
              </div>
              <input
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value.slice(0, 30))}
                placeholder="Enter a tag name (e.g., Urgent, Follow-up, Resolved)"
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                maxLength={30}
                autoFocus
                disabled={loading}
              />
              {existingTags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-700 mb-1">
                    Existing tags on this conversation:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {existingTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Example Tags */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-900">
                  💡 Quick Select Tags
                </h4>
                <span className="text-xs text-gray-500">Click to select</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {exampleTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTagName(tag)}
                    disabled={loading}
                    className={clsx(
                      "text-left px-3.5 py-2 bg-white rounded-full border transition-all duration-200 text-sm",
                      tagName === tag
                        ? "border-gray-500 bg-gray-50 font-medium"
                        : "border-gray-300 hover:border-gray-500 hover:bg-gray-50",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{tag}</span>
                      {tagName === tag && (
                        <svg
                          className="w-4 h-4 text-gray-800"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Tag Input */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    placeholder="Or type a custom tag"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-800/20 focus:border-gray-800 transition-all"
                    maxLength={30}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tagName.trim()) {
                        const customTag = tagName.trim();
                        if (!exampleTags.includes(customTag)) {
                          // Add to example tags temporarily for this session
                          exampleTags.unshift(customTag);
                        }
                      }
                    }}
                    disabled={!tagName.trim() || loading}
                    className="px-3 py-2 text-sm border border-gray-800 text-gray-800 rounded-lg hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Use
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-t-gray-200 bg-gray-50 px-4 py-3 flex justify-between gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleAddTagToConversation(leadId!, tagName.trim())}
            disabled={!tagName?.trim() || loading}
            className={clsx(
              "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
              tagName?.trim() && !loading
                ? "bg-gray-800 text-white hover:bg-gray-900 cursor-pointer"
                : "bg-gray-400 text-gray-700 cursor-not-allowed",
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-4 w-4 mr-2 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Adding...
              </span>
            ) : (
              "Add Tag"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTagModal;
