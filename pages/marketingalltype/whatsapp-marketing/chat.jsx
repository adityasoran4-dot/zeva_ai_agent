"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  User,
  UserPlus,
  ArrowLeft,
  Check,
  CheckCheck,
  Info,
  MessageSquare,
} from "lucide-react";
import ClinicLayout from "../../../components/ClinicLayout";
import withClinicAuth from "../../../components/withClinicAuth";
import WhatsAppMarketingSidebar from "../../../components/WhatsAppMarketingSidebar";

const ChatPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  const [chats, setChats] = useState([
    {
      id: 1,
      name: "John Doe",
      phone: "+91 98765 43210",
      lastMessage: "Hello, I need help with my order",
      timestamp: "10:30 AM",
      unread: 2,
      status: "online",
      assignedTo: "You",
      avatar: null,
    },
    {
      id: 2,
      name: "Sarah Smith",
      phone: "+91 98765 43211",
      lastMessage: "Thank you for your help!",
      timestamp: "9:15 AM",
      unread: 0,
      status: "offline",
      assignedTo: "Agent 1",
      avatar: null,
    },
    {
      id: 3,
      name: "Mike Johnson",
      phone: "+91 98765 43212",
      lastMessage: "When will my order be delivered?",
      timestamp: "Yesterday",
      unread: 1,
      status: "online",
      assignedTo: "You",
      avatar: null,
    },
  ]);

  const [messages, setMessages] = useState({
    1: [
      { id: 1, text: "Hello, I need help with my order", sender: "user", timestamp: "10:25 AM", status: "read" },
      { id: 2, text: "Hi! I'd be happy to help you. Can you please share your order number?", sender: "agent", timestamp: "10:26 AM", status: "read" },
      { id: 3, text: "Sure, it's #12345", sender: "user", timestamp: "10:27 AM", status: "read" },
      { id: 4, text: "Thank you! Let me check that for you.", sender: "agent", timestamp: "10:28 AM", status: "read" },
    ],
    2: [
      { id: 1, text: "Thank you for your help!", sender: "user", timestamp: "9:10 AM", status: "read" },
      { id: 2, text: "You're welcome! Is there anything else I can help you with?", sender: "agent", timestamp: "9:12 AM", status: "read" },
    ],
    3: [
      { id: 1, text: "When will my order be delivered?", sender: "user", timestamp: "Yesterday 5:30 PM", status: "read" },
    ],
  });

  const teamMembers = [
    { id: "you", name: "You", status: "online" },
    { id: "agent1", name: "Agent 1", status: "online" },
    { id: "agent2", name: "Agent 2", status: "offline" },
    { id: "agent3", name: "Agent 3", status: "online" },
  ];

  useEffect(() => {
    if (selectedChat && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedChat]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat) return;

    const newMessage = {
      id: Date.now(),
      text: message,
      sender: "agent",
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };

    setMessages((prev) => ({
      ...prev,
      [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage],
    }));

    // Update chat list
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChat.id
          ? { ...chat, lastMessage: message, timestamp: "Just now", unread: 0 }
          : chat
      )
    );

    setMessage("");
  };

  const handleReassign = (newAssignee) => {
    if (!selectedChat) return;

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChat.id ? { ...chat, assignedTo: newAssignee } : chat
      )
    );

    setSelectedChat((prev) => (prev ? { ...prev, assignedTo: newAssignee } : null));
    setShowReassignModal(false);
  };

  const filteredChats = chats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedChat ? messages[selectedChat.id] || [] : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="h-screen sticky top-0 z-30">
        <WhatsAppMarketingSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                  selectedChat?.id === chat.id ? "bg-purple-50 border-l-4 border-l-purple-600" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    {chat.status === "online" && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{chat.name}</h3>
                      <span className="text-xs text-gray-500">{chat.timestamp}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                      {chat.unread > 0 && (
                        <span className="bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span className="text-xs text-gray-500">Assigned to: {chat.assignedTo}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col bg-gray-100">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  {selectedChat.status === "online" && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedChat.name}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title="Info"
                >
                  <Info className="w-5 h-5 text-gray-600" />
                </button>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <button
                        onClick={() => {
                          setShowReassignModal(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Reassign Chat
                      </button>
                      <button
                        onClick={() => {
                          setShowInfoModal(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Info className="w-4 h-4" />
                        Chat Info
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.sender === "agent"
                        ? "bg-purple-600 text-white rounded-br-none"
                        : "bg-white text-gray-900 rounded-bl-none shadow-sm"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <div
                      className={`flex items-center gap-1 mt-1 ${
                        msg.sender === "agent" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span className="text-xs opacity-70">{msg.timestamp}</span>
                      {msg.sender === "agent" && (
                        <span>
                          {msg.status === "read" ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : msg.status === "sent" ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <span className="w-3 h-3 inline-block">⏱</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Smile className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a chat</h3>
              <p className="text-gray-600">Choose a conversation from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reassign Chat</h3>
              <p className="text-sm text-gray-600 mt-1">
                Select a team member to reassign this chat to
              </p>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleReassign(member.name)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition ${
                      selectedChat?.assignedTo === member.name
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      {member.status === "online" && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{member.status}</p>
                    </div>
                    {selectedChat?.assignedTo === member.name && (
                      <Check className="w-5 h-5 text-purple-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowReassignModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && selectedChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Chat Information</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <span className="text-gray-600">×</span>
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedChat.name}</h3>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      selectedChat.status === "online"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        selectedChat.status === "online" ? "bg-green-500" : "bg-gray-400"
                      }`}
                    ></div>
                    {selectedChat.status === "online" ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Assigned To</label>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-gray-900">{selectedChat.assignedTo}</span>
                    <button
                      onClick={() => {
                        setShowInfoModal(false);
                        setShowReassignModal(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      Reassign
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Layout
ChatPage.getLayout = function PageLayout(page) {
  return (
    <ClinicLayout hideSidebar={true} hideHeader={true}>
      {page}
    </ClinicLayout>
  );
};

// Protect and preserve layout
const ProtectedChatPage = withClinicAuth(ChatPage);
ProtectedChatPage.getLayout = ChatPage.getLayout;

export default ProtectedChatPage;

