import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios, { AxiosResponse } from "axios";
import toast, { Toaster } from 'react-hot-toast';

interface Message {
  _id: string;
  sender: { _id: string; name: string };
  senderRole: "user" | "doctor";
  content: string;
  messageType: "text" | "prescription";
  prescription?: string;
  timestamp: string;
  isRead: boolean;
}

// interface User {
//   name: string;
// }

interface Chat {
  _id: string;
  user: { _id: string; name: string };
  doctor: { _id: string; name: string };
  prescriptionRequest: {
    _id: string;
    healthIssue: string;
    symptoms?: string;
    status: string;
  };
  messages: Message[];
  lastMessage: string;
}

interface PrescriptionRequestLite {
  _id: string;
  healthIssue: string;
  symptoms?: string;
  status: string;
}

interface FetchChatResponse {
  success: boolean;
  data: { chat: Chat; prescriptionRequest: PrescriptionRequestLite };
}

interface SendMessageResponse {
  success: boolean;
  data: { chat: Chat };
}

interface DeleteMessageResponse {
  success: boolean;
  data: { chat: Chat };
}

function UserChat() {
  const router = useRouter();
  const { requestId } = router.query as { requestId?: string };
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [deleteModalMessageId, setDeleteModalMessageId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<number | null>(null);
  const isFetchingRef = useRef(false);
  const redirectedRef = useRef(false);
  const redirectTimeoutRef = useRef<number | null>(null);

  // Fetch chat on mount or requestId change
  useEffect(() => {
    if (requestId) fetchChat();
  }, [requestId]);

  // Silent background refresh (no loader)
  useEffect(() => {
    if (!requestId) return;

    const poll = async () => {
      if (isFetchingRef.current || redirectedRef.current) return;
      if (document.hidden) return;
      isFetchingRef.current = true;
      try {
        const token = localStorage.getItem("token");
        const response: AxiosResponse<FetchChatResponse> = await axios.get(
          `/api/chat/get-messages?prescriptionRequestId=${requestId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          const nextChat = response.data.data.chat;
          const prevLastId = chat?.messages[chat.messages.length - 1]?._id;
          const nextLastId = nextChat?.messages[nextChat.messages.length - 1]?._id;
          const prevLen = chat?.messages.length ?? 0;
          const nextLen = nextChat?.messages.length ?? 0;
          if (prevLastId !== nextLastId || prevLen !== nextLen) {
            setChat(nextChat);
          }
        }
      } catch (err: any) {
        const status = err?.response?.status;
        const apiMessage = err?.response?.data?.message;

        if (!redirectedRef.current && status === 404 && apiMessage === "Prescription request not found") {
          redirectedRef.current = true;
          if (pollingRef.current) window.clearInterval(pollingRef.current);

          toast.success("Chat completed. Redirecting to dashboard...", {
            style: { background: "#2D9AA5", color: "#fff" },
          });

          redirectTimeoutRef.current = window.setTimeout(() => {
            router.replace("/user/profile");
          }, 5000);
          return;
        }
      } finally {
        isFetchingRef.current = false;
      }
    };


    pollingRef.current = window.setInterval(poll, 3000);

    const onVisibility = () => {
      if (!document.hidden) {
        void poll();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
      pollingRef.current = null;
      document.removeEventListener('visibilitychange', onVisibility);
      if (redirectTimeoutRef.current) window.clearTimeout(redirectTimeoutRef.current);
    };
  }, [requestId, chat?.messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  // Fetch chat from backend
  const fetchChat = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response: AxiosResponse<FetchChatResponse> = await axios.get(
        `/api/chat/get-messages?prescriptionRequestId=${requestId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const { chat: chatData } = response.data.data;
        setChat(chatData);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const apiMessage = err?.response?.data?.message;

      if (!redirectedRef.current && status === 404 && apiMessage === "Prescription request not found") {
        redirectedRef.current = true;
        toast.success("Chat completed. Redirecting to dashboard...", {
          style: { background: "#2D9AA5", color: "#fff" },
        });
        redirectTimeoutRef.current = window.setTimeout(() => {
          router.replace("/user/profile");
        }, 5000);
        return;
      }
    } finally {
      setLoading(false);
    }
  };


  // Send a message
  const sendMessage = async () => {
    if (!message.trim() || !requestId) return;
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const response: AxiosResponse<SendMessageResponse> = await axios.post(
        "/api/chat/send-message",
        { prescriptionRequestId: requestId, content: message, messageType: "text" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setChat(response.data.data.chat);
        setMessage("");
      }
    } catch {
      // console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  // Trigger confirmation modal for deletion
  const confirmDeleteMessage = (messageId: string) => {
    setDeleteModalMessageId(messageId);
  };

  // Delete message after confirmation
  const deleteMessage = async () => {
    if (!chat?._id || !deleteModalMessageId) return;

    const previousChat = chat; // backup for rollback
    setChat(prev =>
      prev ? { ...prev, messages: prev.messages.filter(m => m._id !== deleteModalMessageId) } : prev
    );

    try {
      const token = localStorage.getItem("token");
      const response: AxiosResponse<DeleteMessageResponse> = await axios.delete("/api/chat/delete", {
        headers: { Authorization: `Bearer ${token}` },
        data: { chatId: chat._id, messageId: deleteModalMessageId },
      });

      if (!response.data.success) throw new Error("Failed to delete message");

      // Only update if backend sends chat
      if (response.data.data?.chat) {
        setChat(response.data.data.chat);
      } else {
        // console.warn("Delete API did not return chat, keeping optimistic update.");
      }
    } catch {
      // console.error("Delete failed:", err);
      setChat(previousChat); // rollback
      alert("Failed to delete message. Please try again.");
    } finally {
      setDeleteModalMessageId(null);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'completed': return 'bg-green-100 text-green-800 border-green-200';
        case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
        {status}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#19242d] to-[#2D9AA5]">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2D9AA5]"></div>
            <span className="text-[#19242d] font-medium">Loading ZEVA Chat...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#19242d] overflow-hidden">
      <Toaster position="top-center" />
      {/* Left Sidebar */}
      <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-30 w-80 lg:w-96 bg-gradient-to-b from-[#19242d] to-[#1a2831] transition-transform duration-300 ease-in-out`}>
        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-white hover:text-[#2D9AA5] transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="h-full flex flex-col">
          {/* Logo/Brand Section */}
          <div className="p-6 border-b border-[#2D9AA5]/20">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#2D9AA5] to-[#3db8c7] rounded-2xl shadow-lg mb-4">
                <span className="text-2xl font-bold text-white">Z</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">ZEVA</h1>
              <p className="text-[#2D9AA5] text-sm font-medium">Healthcare Dashboard</p>
            </div>
          </div>

          {/* Chat Info Section */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="bg-gradient-to-r from-[#2D9AA5]/10 to-[#2D9AA5]/5 rounded-xl p-4 border border-[#2D9AA5]/20">
                <h3 className="text-white font-semibold mb-2">Welcome to ZEVA Chat</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Connect with healthcare professionals and manage your medical consultations seamlessly.
                </p>
              </div>

              {/* Doctor Info */}
              {chat && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Doctor Information
                  </h4>
                  <div className="space-y-2">
                    <p className="text-gray-300 text-sm">
                      <span className="text-[#2D9AA5] font-medium">Dr. {chat.doctor?.name || "Unknown"}</span>
                    </p>
                    <p className="text-gray-400 text-xs">Available for consultation</p>
                  </div>
                </div>
              )}

              {/* Health Issue Info */}
              {chat?.prescriptionRequest && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-semibold mb-3">Health Issue</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[#2D9AA5] font-medium text-sm mb-1">Condition:</p>
                      <p className="text-gray-300 text-sm">{chat.prescriptionRequest.healthIssue}</p>
                    </div>
                    {chat.prescriptionRequest.symptoms && (
                      <div>
                        <p className="text-[#2D9AA5] font-medium text-sm mb-1">Symptoms:</p>
                        <p className="text-gray-300 text-sm">{chat.prescriptionRequest.symptoms}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[#2D9AA5] font-medium text-sm mb-2">Status:</p>
                      <StatusBadge status={chat.prescriptionRequest.status} />
                    </div>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="text-white font-semibold mb-3">Features</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-300 text-sm">
                    <svg className="w-4 h-4 text-[#2D9AA5] mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Real-time messaging
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <svg className="w-4 h-4 text-[#2D9AA5] mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Secure prescriptions
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <svg className="w-4 h-4 text-[#2D9AA5] mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Message history
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="p-6 border-t border-[#2D9AA5]/20">
            <button
              onClick={() => router.push("/user/profile")}
              className="w-full bg-gradient-to-r from-[#2D9AA5] to-[#3db8c7] text-white py-3 px-4 rounded-xl hover:from-[#237b82] hover:to-[#2D9AA5] transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Right Chat Panel */}
      <div className="flex-1 flex flex-col bg-gray-50 lg:ml-0">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:text-[#2D9AA5] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#2D9AA5] to-[#3db8c7] rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {chat ? chat.doctor?.name?.charAt(0) || "D" : "Z"}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg lg:text-xl font-bold text-[#19242d]">
                    {chat ? `Dr. ${chat.doctor?.name || "Unknown"}` : "ZEVA Chat"}
                  </h2>
                  <div className="flex items-center space-x-2">
                    {/* <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div> */}
                    {/* <span className="text-sm text-gray-600">Online</span> */}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm font-medium text-[#19242d]">{chat?.user?.name || "You"}</p>
                <p className="text-xs text-gray-500">Patient</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gradient-to-b from-gray-50 to-gray-100">
          {!chat ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-[#2D9AA5] to-[#3db8c7] rounded-full flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#19242d] mb-2">Welcome to ZEVA Chat</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Start a conversation with your healthcare provider or wait for them to send you a prescription.
              </p>
            </div>
          ) : chat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-[#2D9AA5] to-[#3db8c7] rounded-full flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#19242d] mb-2">No messages yet</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Start the conversation or wait for the doctor to respond.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {chat.messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.senderRole === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex items-end space-x-2 max-w-xs sm:max-w-sm lg:max-w-lg">
                    {msg.senderRole === "doctor" && (
                      <div className="w-8 h-8 bg-gradient-to-r from-[#2D9AA5] to-[#3db8c7] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-xs">
                          {chat.doctor?.name?.charAt(0) || "D"}
                        </span>
                      </div>
                    )}
                    
                    <div
                      className={`relative px-4 py-3 rounded-2xl shadow-sm ${
                        msg.senderRole === "user"
                          ? "bg-gradient-to-r from-[#2D9AA5] to-[#3db8c7] text-white rounded-br-sm"
                          : "bg-white text-[#19242d] border border-gray-200 rounded-bl-sm"
                      }`}
                    >
                      {msg.messageType === "prescription" ? (
                        <div>
                          <div className="flex items-center mb-3">
                            <svg className="w-5 h-5 text-[#2D9AA5] mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold text-sm">Prescription</span>
                          </div>
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 text-[#19242d] p-4 rounded-xl border-l-4 border-[#2D9AA5]">
                            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                              {msg.prescription}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${msg.senderRole === "user" ? "text-white/70" : "text-gray-500"}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        
                        {msg.senderRole === "user" && (
                          <button
                            onClick={() => confirmDeleteMessage(msg._id)}
                            className="text-xs text-white/70 hover:text-white transition-colors ml-2"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {msg.senderRole === "user" && (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-xs">
                          {chat.user?.name?.charAt(0) || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4 lg:p-6 shadow-sm">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="w-full p-3 text-[#19242d] border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent resize-none"
                rows={1}
                disabled={sending}
                style={{ minHeight: '48px', maxHeight: '120px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={sending || !message.trim()}
              className="bg-gradient-to-r from-[#2D9AA5] to-[#3db8c7] text-white p-3 rounded-xl hover:from-[#237b82] hover:to-[#2D9AA5] disabled:from-gray-400 disabled:to-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalMessageId && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl transform transition-all">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#19242d] mb-2">Delete Message</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this message? This action cannot be undone.</p>
              <div className="flex space-x-3">
                <button
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  onClick={() => setDeleteModalMessageId(null)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-lg"
                  onClick={deleteMessage}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserChat;

UserChat.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
};