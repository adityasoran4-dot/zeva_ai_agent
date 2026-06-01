import React from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/router";

type Props = {
  onNewChat?: () => void;
  onCreateLead?: () => void;
  canCreate?: boolean;
};

const NoSelectedConversation: React.FC<Props> = ({
  onNewChat,
  onCreateLead,
  canCreate = true,
}) => {
  const router = useRouter();

  const handleNewChat = () => {
    if (onNewChat) return onNewChat();
    // fallback behaviour: navigate to lead creation/search UI
    router.push("/lead/create-lead");
  };

  const handleCreateLead = () => {
    if (onCreateLead) return onCreateLead();
    router.push("/lead/create-lead");
  };

  return (
    <div className="h-full flex items-center justify-center bg-white">
      <div className="max-w-lg text-center px-6 py-12">
        <div className="mx-auto w-40 h-40 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6 shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-20 w-20 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.6 9.6 0 01-4-.8L3 20l1.2-3.6A7.92 7.92 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold text-gray-800">
          No conversation selected
        </h2>
        <p className="text-gray-500 mt-2">
          Select a conversation from the left, or start a new chat.
        </p>

        {canCreate && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={handleNewChat}
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New chat
            </button>

            <button
              onClick={handleCreateLead}
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Create lead
            </button>
          </div>
        )}

        <ul className="mt-6 text-sm text-gray-500 space-y-2">
          <li>• Tip: Use search to find existing leads quickly.</li>
          <li>
            • Tip: Click the plus button in the top-left to start a
            conversation.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NoSelectedConversation;
