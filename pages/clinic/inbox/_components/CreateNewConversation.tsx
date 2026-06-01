import AvatarComponent from "@/components/shared/AvatarComponent";
import { Lead } from "@/types/leads";
import { ChevronDown, Plus } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { ConversationType } from "@/types/conversations";

interface IProps {
  conversations: ConversationType[];
  setConversations: React.Dispatch<React.SetStateAction<ConversationType[]>>;
  setSelectedConversation?: React.Dispatch<
    React.SetStateAction<ConversationType | null>
  >;
}

const CreateNewConversation: React.FC<IProps> = ({
  conversations,
  setConversations,
  setSelectedConversation,
}) => {
  const router = useRouter();
  const [search, setSearch] = useState<string>("");
  const [showNewChatDropdown, setShowNewChatDropdown] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [_totalLeads, setTotalLeads] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const newChatRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("clinicToken") : null;

  const fetchLeads = useCallback(
    async (query = "") => {
      if (!token) return;

      try {
        setLoading(true);
        const res = await axios.get("/api/lead-ms/leadFilter", {
          params: { page: currentPage, limit: 20, name: query },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success) {
          // If requesting first page, replace leads; otherwise append
          const newLeads = res.data.leads || [];
          if (currentPage === 1) {
            setLeads(newLeads);
          } else {
            setLeads((prev) => [...prev, ...newLeads]);
          }
          setTotalLeads(res?.data?.pagination?.totalLeads || 0);
          setHasMore(Boolean(res?.data?.pagination?.hasMore));
        } else {
          setLeads([]);
        }
      } catch (err) {
        // on error, clear leads
        setLeads([]);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, token]
  );

  const handleCreateNewConversation = async (leadId: string) => {
    try {
      const { data } = await axios.post(
        "/api/conversations/create-conversation",
        {
          leadId: leadId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.success && data?.conversation) {
        const newConv = data?.conversation;
        let conExists = false;
        for (let con of conversations) {
          if (con._id === newConv._id) {
            conExists = true;
            break;
          }
        }
        if (conExists) {
          setShowNewChatDropdown(false);
          if (setSelectedConversation) setSelectedConversation(newConv);
          return;
        }
        setConversations((prev) => [newConv, ...prev]);
        setShowNewChatDropdown(false);
        if (setSelectedConversation) setSelectedConversation(newConv);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  // Close dropdown when clicking outside this component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        newChatRef &&
        newChatRef.current &&
        !newChatRef.current.contains(event.target as Node)
      ) {
        setShowNewChatDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [newChatRef]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Fetch leads when page or search changes
  useEffect(() => {
    fetchLeads(search.trim());
  }, [currentPage, search, fetchLeads]);

  // Infinite scroll handler for dropdown list
  const handleListScroll = () => {
    const el = listRef.current;
    if (!el || !hasMore) return;
    const nearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 60; // 60px threshold
    if (nearBottom) {
      setCurrentPage((p) => p + 1);
    }
  };
  return (
    <div className="flex items-center gap-2 relative" ref={newChatRef}>
      <button
        onClick={() => setShowNewChatDropdown((s) => !s)}
        className="bg-white text-gray-600 border border-gray-300 hover:bg-gray-100 cursor-pointer px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm inline-flex items-center gap-2"
        aria-expanded={showNewChatDropdown}
        aria-haspopup="true"
      >
        <Plus className="h-4 w-4" />
        <ChevronDown className="h-4 w-4" />
      </button>

      {showNewChatDropdown && (
        <div className="absolute right-0 sm:left-0 top-7 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div
            ref={listRef}
            onScroll={handleListScroll}
            className="max-h-[63vh] sm:max-h-[70vh] overflow-y-auto divide-y divide-gray-100"
          >
            {leads.length > 0 ? (
              leads.map((lead) => (
                <button
                  key={lead._id}
                  onClick={() => handleCreateNewConversation(lead._id)}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                >
                  <AvatarComponent name={lead.name} size="sm" />
                  <div className="flex-1">
                    <div className="font-medium text-sm truncate">
                      {lead?.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {lead?.phone || lead?.email}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              // no leads and no search
              <div className="p-4 text-center">
                <div className="text-sm text-gray-600 mb-2">No leads yet</div>
                <div className="flex justify-center">
                  <button
                    onClick={() => router.push("/lead/create-lead")}
                    className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900"
                  >
                    <Plus className="h-4 w-4" />
                    New Lead
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-3">
                <span className="text-sm text-gray-500 text-center block">
                  Loading...
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CreateNewConversation);
