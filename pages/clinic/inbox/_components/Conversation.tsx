import AvatarComponent from "@/components/shared/AvatarComponent";
import { getFormatedTime } from "@/lib/helper";
import { ConversationType } from "@/types/conversations";
import React from "react";

interface IProps {
  conversation: ConversationType;
  selectedConversation: ConversationType | null;
  setSelectedConversation: React.Dispatch<
    React.SetStateAction<ConversationType | null>
  >;
}

const Conversation: React.FC<IProps> = ({
  conversation,
  selectedConversation,
  setSelectedConversation,
}) => {
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };
  return (
    <div
      key={conversation._id}
      className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
        selectedConversation?._id === conversation?._id
          ? "bg-gray-100 border-l-4 border-l-gray-700"
          : "hover:bg-gray-50"
      }`}
      onClick={() => setSelectedConversation(conversation)}
    >
      <div className="flex items-start space-x-3">
        <AvatarComponent
          name={conversation?.leadId?.name}
          size="md"
          className="flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-800 truncate">
                {conversation?.leadId?.name}
              </span>
            </div>
            <span className="text-xs text-gray-500 font-medium mt-1">
              {getFormatedTime(conversation?.recentMessage?.createdAt)}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <p
              className={`text-sm truncate mt-1 ${
                conversation?.unreadMessages?.length > 0
                  ? "text-gray-800 font-medium"
                  : "text-gray-500"
              }`}
            >
              {(() => {
                const recent = conversation?.recentMessage || ({} as any);
                let preview = recent.content || "";
                if (recent?.channel === "email") return recent?.subject || "";
                if (!preview || preview.trim() === "") {
                  // try multiple possible media indicators
                  const mediaType =
                    recent.mediaType ||
                    recent.attachments?.[0]?.mediaType ||
                    (recent.mediaUrl
                      ? recent.mediaUrl.match(
                          /\.(jpg|jpeg|png|gif|mp4|mp3|pdf|docx?)$/i,
                        )
                        ? "document"
                        : "file"
                      : undefined);

                  const filename =
                    recent.fileName ||
                    recent.attachments?.[0]?.fileName ||
                    (recent.mediaUrl
                      ? recent.mediaUrl.split("/").pop().split("?")[0]
                      : undefined);

                  const caption =
                    recent.caption || recent.attachments?.[0]?.caption;

                  if (mediaType) {
                    const typeLabel =
                      mediaType === "image"
                        ? "Image"
                        : mediaType === "video"
                          ? "Video"
                          : mediaType === "audio"
                            ? "Audio"
                            : mediaType === "document"
                              ? "Document"
                              : "File";

                    if (filename) {
                      preview = `${typeLabel}: ${filename}`;
                    } else if (caption) {
                      preview = `${typeLabel}: ${caption}`;
                    } else {
                      preview = typeLabel;
                    }
                  }
                }

                return truncateText(preview || "", 22);
              })()}
            </p>
            {conversation?.unreadMessages?.length > 0 && (
              <span className="text-xs bg-gray-700 text-white px-2.5 py-0.5 rounded-full font-medium mt-1">
                {conversation?.unreadMessages?.length > 99
                  ? `99+`
                  : conversation?.unreadMessages?.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Conversation);
