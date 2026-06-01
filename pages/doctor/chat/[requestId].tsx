import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import DoctorLayout from "../../../components/DoctorLayout";
import withDoctorAuth from "../../../components/withDoctorAuth";
import type { NextPageWithLayout } from "../../_app";
import {
  ChevronLeft,
  Send,
  Paperclip,
  FileText
} from 'lucide-react';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
  };
  senderRole: "user" | "doctor";
  content: string;
  messageType: "text" | "prescription";
  prescription?: string;
  timestamp: string;
  isRead: boolean;
}

interface Chat {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  doctor: {
    _id: string;
    name: string;
  };
  prescriptionRequest: {
    _id: string;
    healthIssue: string;
    symptoms: string;
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

function DoctorChat({ requestId: propRequestId, onClose }: { requestId?: string; onClose?: () => void } = {}) {
  const router = useRouter();
  const requestId = propRequestId || router.query.requestId;
  const isEmbedded = Boolean(propRequestId);
  const [chat, setChat] = useState<Chat | null>(null);
  const [prescriptionRequest, setPrescriptionRequest] = useState<PrescriptionRequestLite | null>(null);
  const [initialLoading, setInitialLoading] = useState(true); // Only for first load
  const [message, setMessage] = useState("");
  const [prescription, setPrescription] = useState("");
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (requestId) {
      fetchChat(true); // initial load
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  useEffect(() => {
    // Only auto-scroll when sending a new message, not on refresh or initial load
    // This will be triggered by sendMessage function instead
  }, []);

  useEffect(() => {
    if (chat && chat.messages.length > 0) {
      // Find unread messages not sent by the doctor
      const unread = chat.messages.filter(
        (msg) => !msg.isRead && msg.senderRole !== "doctor"
      );
      if (unread.length > 0) {
        markMessagesAsRead();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat]);

  const markMessagesAsRead = async () => {
    try {
      const token = localStorage.getItem("doctorToken");
      await axios.post(
        "/api/chat/mark-messages-read",
        { prescriptionRequestId: requestId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refetch chat to get updated isRead status
      fetchChat(false);
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  // Auto-refresh chat every 5 seconds (no loader)
  useEffect(() => {
    if (!requestId) return;
    const interval = setInterval(() => {
      fetchChat(false);
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  // fetchChat: pass true for initial load, false for silent refresh
  const fetchChat = async (showLoader = false) => {
    try {
      if (showLoader) setInitialLoading(true);
      const token = localStorage.getItem("doctorToken");
      const response = await axios.get(
        `/api/chat/get-messages?prescriptionRequestId=${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        setChat(response.data.data.chat);
        setPrescriptionRequest(response.data.data.prescriptionRequest);
      }
    } catch (error) {
      console.error("Failed to fetch chat:", error);
    } finally {
      if (showLoader) setInitialLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      const token = localStorage.getItem("doctorToken");
      const response = await axios.post(
        "/api/chat/send-message",
        {
          prescriptionRequestId: requestId,
          content: message,
          messageType: "text",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setChat(response.data.data.chat);
        setMessage("");
        // Auto-scroll only the messages container, not the whole page
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
              top: messagesContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const sendPrescription = async () => {
    if (!prescription.trim()) return;

    setSending(true);
    try {
      const token = localStorage.getItem("doctorToken");
      const response = await axios.post(
        "/api/chat/send-message",
        {
          prescriptionRequestId: requestId,
          content: "Prescription sent",
          messageType: "prescription",
          prescription: prescription,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setChat(response.data.data.chat);
        setPrescription("");
        setShowPrescriptionModal(false);
        // Auto-scroll only the messages container, not the whole page
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
              top: messagesContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    } catch (error) {
      console.error("Failed to send prescription:", error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem("doctorToken");
      const response = await axios.delete("/api/prescription/delete-message", {
        headers: { Authorization: `Bearer ${token}` },
        data: { chatId: chat?._id, messageId }
      });

      if (response.data.success) {
        setChat(response.data.chat);
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const openDeleteConfirm = (messageId: string) => {
    setDeleteMessageId(messageId);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeleteMessageId(null);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (initialLoading) {
    return (
      <div className={`${isEmbedded ? 'h-full' : 'min-h-screen'} flex items-center justify-center bg-white overflow-x-hidden`}>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-[#2D9AA5] rounded-full animate-spin mb-4"></div>
          <div className="text-gray-800 text-lg">Loading ZEVA Chat...</div>
        </div>
      </div>
    );
  }

  // Allow new chat creation: if no chat yet, show UI with prescriptionRequest info and input
  if (!chat) {
    return (
      <div className={`${isEmbedded ? 'h-full' : 'min-h-screen'} flex flex-col bg-gradient-to-b from-white to-gray-50 overflow-x-hidden`}>
        {/* Header - Professional Design */}
        <div className="bg-[#2D9AA5] shadow-xl border-b border-[#2D9AA5]/30">
          <div className="px-3 sm:px-4 py-2.5 sm:py-3">
            <div className="flex items-center justify-between w-full max-w-6xl mx-auto px-2 sm:px-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/20">
                    <span className="text-white text-lg font-bold">Z</span>
                  </div>
                  {/* <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#4CAF50] rounded-full border-2 border-[#2D9AA5] shadow-sm"></div> */}
                </div>
                <div>
                  <h1 className="text-white text-lg font-semibold leading-tight">ZEVA Chat Pannel</h1>
                  <p className="text-white/80 text-xs font-medium leading-tight">Medical Consultation Platform</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setShowPrescriptionModal(true)}
                  className="p-2.5 hover:bg-white/15 rounded-lg transition-all duration-200 group shadow-lg"
                >
                  <FileText size={18} className="text-white" />
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-2.5 hover:bg-white/15 rounded-lg transition-all duration-200 group shadow-lg"
                    aria-label="Close chat"
                  >
                    <span className="text-white text-base leading-none">×</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Patient Info Banner */}
        {prescriptionRequest && (
          <div className="bg-white border-b border-gray-200">
            <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-4">
              <div className="bg-gradient-to-r from-[#2D9AA5]/15 to-[#2D9AA5]/10 border-l-4 border-[#2D9AA5] rounded-r-2xl px-5 py-4 backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-[#2D9AA5] rounded-full animate-pulse shadow-lg"></div>
                  <div className="flex-1">
                    <h3 className="text-[#2D9AA5] font-semibold text-base mb-2">Patient Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 font-medium">Health Issue:</span>
                        <span className="text-gray-900 font-medium bg-[#2D9AA5]/10 px-3 py-1 rounded-lg">{prescriptionRequest.healthIssue}</span>
                      </div>
                      {prescriptionRequest.symptoms && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400 font-medium">Symptoms:</span>
                          <span className="text-gray-900 font-medium bg-[#2D9AA5]/10 px-3 py-1 rounded-lg">{prescriptionRequest.symptoms}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty Chat State */}
        <div className="flex-1 bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center p-6 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-20 w-40 h-40 bg-[#2D9AA5] rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-[#2D9AA5] rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>

          <div className="text-center relative z-10 max-w-lg mx-auto">
           
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 shadow-2xl pb-[env(safe-area-inset-bottom)]">
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-100 rounded-[16px] px-3 py-2 flex items-center space-x-2 shadow-xl border border-gray-300 backdrop-blur-sm">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type your message here..."
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none text-sm font-medium"
                  disabled={sending}
                />
                <button className="text-gray-400 hover:text-[#2D9AA5] transition-all duration-200">
                  <Paperclip size={16} />
                </button>
              </div>
              <button
                onClick={sendMessage}
                disabled={sending || !message.trim()}
                className={`p-2.5 rounded-full transition-all duration-200 shadow-xl ${message.trim() && !sending
                    ? 'bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/90 text-white hover:shadow-2xl hover:scale-110 hover:rotate-12'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Prescription Modal */}
        {showPrescriptionModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn overflow-y-auto overscroll-contain">
            <div className="bg-[#1A252E] rounded-2xl sm:rounded-3xl w-full max-w-full sm:max-w-6xl my-6 sm:my-8 shadow-2xl border border-gray-600/40 backdrop-blur-sm transform animate-slideUp flex flex-col max-h-[92vh] sm:max-h-[90vh]">

              {/* Modal Header - Fixed */}
              <div className="bg-gradient-to-r from-[#2D9AA5] to-[#1B7A85] px-8 py-6 relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4 min-w-0 flex-1">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg flex-shrink-0">
                      <FileText size={32} className="text-white drop-shadow-sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-2xl font-bold text-white drop-shadow-sm">
                          Digital Prescription
                        </h3>
                        <div className="px-3 py-1 bg-white/15 rounded-full backdrop-blur-sm flex-shrink-0">
                          <span className="text-white/90 text-sm font-semibold">ZEVA</span>
                        </div>
                      </div>
                      <p className="text-white/85 text-base font-medium">Create and send secure medical prescription</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPrescriptionModal(false)}
                    className="text-white/70 hover:text-white text-2xl w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/15 transition-all duration-300 hover:rotate-90 hover:scale-110 flex-shrink-0 ml-4"
                    aria-label="Close prescription modal"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 min-h-0">

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

                  {/* Left Column - Prescription Text Area */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-gray-200 text-xl font-semibold flex items-center">
                        <div className="w-2 h-2 bg-[#2D9AA5] rounded-full mr-3 flex-shrink-0"></div>
                        Prescription Details
                      </label>
                      <div className="flex items-center space-x-3 text-sm text-gray-400">
                        <span>Characters: {prescription.length}</span>
                        <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                        <span>Words: {prescription.trim().split(/\s+/).filter(word => word.length > 0).length}</span>
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        value={prescription}
                        onChange={(e) => setPrescription(e.target.value)}
                        placeholder="Enter prescription details here...

You can write freely or use the quick templates on the right to add structured content.

Example:
• Patient: John Doe
• Diagnosis: Upper respiratory tract infection
• Medication: Amoxicillin 500mg, take 1 tablet every 8 hours for 7 days
• Instructions: Take with food, complete full course
• Follow-up: Return if symptoms persist after 3 days"
                        className="w-full h-96 p-6 bg-[#2A3B47] border border-gray-600/50 rounded-2xl resize-none focus:outline-none focus:ring-3 focus:ring-[#2D9AA5]/50 focus:border-[#2D9AA5] text-white placeholder-gray-400 text-base leading-relaxed shadow-inner backdrop-blur-sm transition-all duration-300 hover:border-gray-500/70 font-mono"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#2D9AA5 #2A3B47'
                        }}
                      />

                      {/* Status indicator */}
                      <div className="absolute bottom-4 right-4">
                        {prescription.trim().length > 0 && (
                          <div className="flex items-center space-x-2 bg-[#1A252E]/90 px-3 py-2 rounded-lg backdrop-blur-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-gray-300">Ready</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Quick Actions & Templates */}
                  <div className="space-y-6">

                    {/* Quick Templates */}
                    <div className="p-5 sm:p-6 bg-[#243441] rounded-2xl border border-gray-600/30">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <div className="w-2 h-2 bg-[#2D9AA5] rounded-full mr-3 flex-shrink-0"></div>
                        Quick Templates
                      </h4>
                      <div className="space-y-3">
                        <button
                          onClick={() => setPrescription(prev => prev + (prev ? '\n\n' : '') + '• Medication: \n• Dosage: \n• Frequency: \n• Duration: \n• Instructions: ')}
                          className="w-full px-4 py-3 bg-[#2D9AA5]/20 text-[#2D9AA5] rounded-xl hover:bg-[#2D9AA5]/30 transition-all duration-300 text-sm font-medium border border-[#2D9AA5]/30 text-left flex items-center space-x-3"
                        >
                          <span>📋</span>
                          <span>Add Medication Template</span>
                        </button>
                        <button
                          onClick={() => setPrescription(prev => prev + (prev ? '\n\n' : '') + '• Diagnosis: \n• Treatment: \n• Follow-up: ')}
                          className="w-full px-4 py-3 bg-[#2D9AA5]/20 text-[#2D9AA5] rounded-xl hover:bg-[#2D9AA5]/30 transition-all duration-300 text-sm font-medium border border-[#2D9AA5]/30 text-left flex items-center space-x-3"
                        >
                          <span>🏥</span>
                          <span>Add Diagnosis Template</span>
                        </button>
                        <button
                          onClick={() => setPrescription(prev => prev + (prev ? '\n\n' : '') + '• Lab tests required: \n• Precautions: \n• Next appointment: ')}
                          className="w-full px-4 py-3 bg-[#2D9AA5]/20 text-[#2D9AA5] rounded-xl hover:bg-[#2D9AA5]/30 transition-all duration-300 text-sm font-medium border border-[#2D9AA5]/30 text-left flex items-center space-x-3"
                        >
                          <span>📝</span>
                          <span>Add Instructions Template</span>
                        </button>
                        <button
                          onClick={() => setPrescription(prev => prev + (prev ? '\n\n' : '') + '• Patient: \n• Age: \n• Contact: ')}
                          className="w-full px-4 py-3 bg-[#2D9AA5]/20 text-[#2D9AA5] rounded-xl hover:bg-[#2D9AA5]/30 transition-all duration-300 text-sm font-medium border border-[#2D9AA5]/30 text-left flex items-center space-x-3"
                        >
                          <span>👤</span>
                          <span>Add Patient Info (Optional)</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="p-5 sm:p-6 bg-[#243441] rounded-2xl border border-gray-600/30">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <div className="w-2 h-2 bg-[#2D9AA5] rounded-full mr-3 flex-shrink-0"></div>
                        Quick Actions
                      </h4>
                      <div className="space-y-3">
                        <button
                          onClick={() => setPrescription('')}
                          className="w-full px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all duration-300 text-sm font-medium border border-red-500/30 text-left flex items-center space-x-3"
                        >
                          <span>🗑️</span>
                          <span>Clear All</span>
                        </button>
                        <button
                          onClick={() => {
                            const timestamp = new Date().toLocaleString();
                            setPrescription(prev => prev + (prev ? '\n\n' : '') + `Date: ${timestamp}\nDoctor: [Your Name]\nSignature: [Digital Signature]`);
                          }}
                          className="w-full px-4 py-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-all duration-300 text-sm font-medium border border-green-500/30 text-left flex items-center space-x-3"
                        >
                          <span>✍️</span>
                          <span>Add Signature Block</span>
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(prescription)}
                          disabled={!prescription.trim()}
                          className="w-full px-4 py-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all duration-300 text-sm font-medium border border-blue-500/30 text-left flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span>📋</span>
                          <span>Copy to Clipboard</span>
                        </button>
                      </div>
                    </div>


                  </div>
                </div>
              </div>

              {/* Modal Footer - Fixed */}
              <div className="px-5 sm:px-8 pb-6 sm:pb-8 bg-[#1A252E] border-t border-gray-600/30 flex-shrink-0">
                <div className="flex items-center justify-between pt-4 sm:pt-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-[#2D9AA5] rounded-full animate-pulse flex-shrink-0"></div>
                    <span>Powered by ZEVA Healthcare</span>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowPrescriptionModal(false)}
                      className="px-8 py-4 border-2 border-gray-600/50 text-gray-300 rounded-2xl hover:bg-gray-700/50 hover:border-gray-500 hover:text-white transition-all duration-300 font-semibold hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={sendPrescription}
                      disabled={sending}
                      className="bg-gradient-to-r from-[#2D9AA5] to-[#1B7A85] text-white py-3 sm:py-4 px-6 sm:px-8 rounded-2xl hover:shadow-2xl disabled:bg-gray-600 disabled:cursor-not-allowed font-semibold transition-all duration-300 flex items-center space-x-3 hover:scale-105 disabled:hover:scale-100 min-w-[160px] sm:min-w-[200px] relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/10 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700"></div>
                      <div className="relative flex items-center space-x-3">
                        {sending ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0"></div>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send size={20} className="flex-shrink-0" />
                            <span>Send Prescription</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <p className="text-xs text-gray-500 text-center">
                    This prescription will be encrypted and securely transmitted. You can send with any content - templates are optional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${isEmbedded ? 'h-full' : 'min-h-screen'} flex flex-col bg-gradient-to-b from-white to-gray-50 overflow-x-hidden`}>
      {/* Header - Professional Design */}
      <div className="bg-[#2D9AA5] shadow-xl border-b border-[#2D9AA5]/30">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between w-full max-w-6xl mx-auto px-2 sm:px-0">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="lg:hidden p-2 hover:bg-white/15 rounded-xl transition-all duration-300 mr-2"
            >
              <ChevronLeft size={26} className="text-white" />
            </button>

            {/* User Avatar & Info */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg border-2 border-white/30">
                {(chat?.user?.name?.[0] || 'U').toUpperCase()}
              </div>
              {/* <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#4CAF50] rounded-full border-2 border-[#2D9AA5] shadow-sm"></div> */}
            </div>
            <div className="flex-1 min-w-0 ml-3">
              <h1 className="font-bold text-white text-lg leading-tight">ZEVA Chat Pannel</h1>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-white/90 font-medium truncate">{chat?.user?.name || 'Patient'}</span>
                <span className="text-white/60">•</span>
                <span className="text-white/80 text-xs truncate bg-white/20 px-2 py-0.5 rounded-md">{chat?.prescriptionRequest?.healthIssue || ''}</span>
              </div>
            </div>
            {onClose && (
              <div className="ml-2">
                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-white/15 rounded-lg transition-all duration-200"
                  aria-label="Close chat"
                >
                  <span className="text-white text-base leading-none">×</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-gray-50 to-white relative">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute top-32 left-32 w-40 h-40 bg-[#2D9AA5] rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-32 w-32 h-32 bg-[#2D9AA5] rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 p-3 sm:p-5 space-y-4 sm:space-y-5">
          <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-5">
            {chat.messages.map((msg, index) => (
              <div
                key={msg._id}
                className={`flex ${msg.senderRole === "doctor" ? "justify-end" : "justify-start"} animate-fadeIn`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`relative group w-fit max-w-[95vw] sm:max-w-[88%] md:max-w-sm lg:max-w-md xl:max-w-lg ${msg.senderRole === "doctor"
                      ? "bg-white text-gray-900 border border-gray-200 rounded-[20px] rounded-br-[8px] shadow-xl backdrop-blur-sm"
                      : "bg-gradient-to-br from-[#2D9AA5] to-[#2D9AA5]/90 text-white rounded-[20px] rounded-bl-[8px] shadow-xl"
                    } px-3 sm:px-4 py-2 sm:py-3 break-words`}
                >
                  {/* Message Content */}
                  {msg.messageType === "prescription" ? (
                    <div>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
                          <FileText size={16} />
                        </div>
                        <span className="font-semibold text-base">Medical Prescription</span>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5">
                        <pre className="whitespace-pre-wrap text-base font-mono leading-relaxed">
                          {msg.prescription}
                        </pre>
                      </div>
                      <div className={`flex items-center justify-end space-x-2 mt-2 ${msg.senderRole === "doctor" ? "text-gray-500" : "text-white/70"
                        } text-xs whitespace-nowrap`}>
                        <span className="font-semibold">{formatTime(msg.timestamp)}</span>
                        {msg.senderRole === "doctor" && (
                          <div className="relative w-4 h-4">
                            <svg className="absolute top-0 left-0 w-3.5 h-3.5" fill={msg.isRead ? '#3B82F6' : 'currentColor'} viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <svg className="absolute top-0 left-1 w-3.5 h-3.5" fill={msg.isRead ? '#3B82F6' : 'currentColor'} viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end gap-2">
                      <div className="text-sm leading-snug font-medium break-words">{msg.content}</div>
                      <div className={`flex items-center gap-1 ${msg.senderRole === "doctor" ? "text-gray-500" : "text-white/70"
                        } text-xs whitespace-nowrap`}>
                        <span className="font-semibold">{formatTime(msg.timestamp)}</span>
                        {msg.senderRole === "doctor" && (
                          <div className="relative w-4 h-4">
                            <svg className="absolute top-0 left-0 w-3.5 h-3.5" fill={msg.isRead ? '#3B82F6' : 'currentColor'} viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <svg className="absolute top-0 left-1 w-3.5 h-3.5" fill={msg.isRead ? '#3B82F6' : 'currentColor'} viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delete button */}
                  {msg.sender._id === chat.doctor._id && (
                    <button
                      onClick={() => openDeleteConfirm(msg._id)}
                      className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center shadow-xl hover:scale-125 font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Enhanced Design */}
      <div className="bg-white px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 shadow-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-100 rounded-[16px] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center space-x-2 sm:space-x-2.5 shadow-xl border border-gray-300 backdrop-blur-sm">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message here..."
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none text-sm sm:text-sm font-medium"
                disabled={sending}
              />
              <button
                onClick={() => setShowPrescriptionModal(true)}
                className="text-gray-400 hover:text-[#2D9AA5] transition-all duration-200"
              >
                <FileText size={16} />
              </button>
            </div>
            <button
              onClick={sendMessage}
              disabled={sending || !message.trim()}
              className={`p-2.5 sm:p-3 rounded-full transition-all duration-200 shadow-xl ${message.trim() && !sending
                  ? 'bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/90 text-white hover:shadow-2xl hover:scale-110 hover:rotate-12'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Prescription Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn overflow-y-auto overscroll-contain">
          <div className="bg-[#1A252E] rounded-2xl sm:rounded-3xl w-full max-w-full sm:max-w-6xl my-6 sm:my-8 shadow-2xl border border-gray-600/40 backdrop-blur-sm transform animate-slideUp flex flex-col max-h-[92vh] sm:max-h-[90vh]">

            {/* Modal Header - Fixed */}
            <div className="bg-gradient-to-r from-[#2D9AA5] to-[#1B7A85] px-8 py-6 relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg flex-shrink-0">
                    <FileText size={32} className="text-white drop-shadow-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-2xl font-bold text-white drop-shadow-sm">
                        Digital Prescription
                      </h3>
                      <div className="px-3 py-1 bg-white/15 rounded-full backdrop-blur-sm flex-shrink-0">
                        <span className="text-white/90 text-sm font-semibold">ZEVA</span>
                      </div>
                    </div>
                    <p className="text-white/85 text-base font-medium">Create and send secure medical prescription</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="text-white/70 hover:text-white text-2xl w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/15 transition-all duration-300 hover:rotate-90 hover:scale-110 flex-shrink-0 ml-4"
                  aria-label="Close prescription modal"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 min-h-0">

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

                {/* Left Column - Prescription Text Area */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-gray-200 text-xl font-semibold flex items-center">
                      <div className="w-2 h-2 bg-[#2D9AA5] rounded-full mr-3 flex-shrink-0"></div>
                      Prescription Details
                    </label>
                    <div className="flex items-center space-x-3 text-sm text-gray-400">
                      <span>Characters: {prescription.length}</span>
                      <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                      <span>Words: {prescription.trim().split(/\s+/).filter(word => word.length > 0).length}</span>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                      placeholder="Enter prescription details here...

You can write freely or use the quick templates on the right to add structured content.

Example:
• Patient: John Doe
• Diagnosis: Upper respiratory tract infection
• Medication: Amoxicillin 500mg, take 1 tablet every 8 hours for 7 days
• Instructions: Take with food, complete full course
• Follow-up: Return if symptoms persist after 3 days"
                      className="w-full h-96 p-6 bg-[#2A3B47] border border-gray-600/50 rounded-2xl resize-none focus:outline-none focus:ring-3 focus:ring-[#2D9AA5]/50 focus:border-[#2D9AA5] text-white placeholder-gray-400 text-base leading-relaxed shadow-inner backdrop-blur-sm transition-all duration-300 hover:border-gray-500/70 font-mono"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#2D9AA5 #2A3B47'
                      }}
                    />

                    {/* Status indicator */}
                    <div className="absolute bottom-4 right-4">
                      {prescription.trim().length > 0 && (
                        <div className="flex items-center space-x-2 bg-[#1A252E]/90 px-3 py-2 rounded-lg backdrop-blur-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-gray-300">Ready</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Quick Actions & Templates */}
                <div className="space-y-6">

                  {/* Quick Templates */}
                  <div className="p-5 sm:p-6 bg-[#243441] rounded-2xl border border-gray-600/30">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <div className="w-2 h-2 bg-[#2D9AA5] rounded-full mr-3 flex-shrink-0"></div>
                      Quick Templates
                    </h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => setPrescription(prev => prev + (prev ? '\n\n' : '') + '• Medication: \n• Dosage: \n• Frequency: \n• Duration: \n• Instructions: ')}
                        className="w-full px-4 py-3 bg-[#2D9AA5]/20 text-[#2D9AA5] rounded-xl hover:bg-[#2D9AA5]/30 transition-all duration-300 text-sm font-medium border border-[#2D9AA5]/30 text-left flex items-center space-x-3"
                      >
                        <span>📋</span>
                        <span>Add Medication Template</span>
                      </button>
                      <button
                        onClick={() => setPrescription(prev => prev + (prev ? '\n\n' : '') + '• Diagnosis: \n• Treatment: \n• Follow-up: ')}
                        className="w-full px-4 py-3 bg-[#2D9AA5]/20 text-[#2D9AA5] rounded-xl hover:bg-[#2D9AA5]/30 transition-all duration-300 text-sm font-medium border border-[#2D9AA5]/30 text-left flex items-center space-x-3"
                      >
                        <span>🏥</span>
                        <span>Add Diagnosis Template</span>
                      </button>
                      <button
                        onClick={() => setPrescription(prev => prev + (prev ? '\n\n' : '') + '• Lab tests required: \n• Precautions: \n• Next appointment: ')}
                        className="w-full px-4 py-3 bg-[#2D9AA5]/20 text-[#2D9AA5] rounded-xl hover:bg-[#2D9AA5]/30 transition-all duration-300 text-sm font-medium border border-[#2D9AA5]/30 text-left flex items-center space-x-3"
                      >
                        <span>📝</span>
                        <span>Add Instructions Template</span>
                      </button>
                      <button
                        onClick={() => setPrescription(prev => prev + (prev ? '\n\n' : '') + '• Patient: \n• Age: \n• Contact: ')}
                        className="w-full px-4 py-3 bg-[#2D9AA5]/20 text-[#2D9AA5] rounded-xl hover:bg-[#2D9AA5]/30 transition-all duration-300 text-sm font-medium border border-[#2D9AA5]/30 text-left flex items-center space-x-3"
                      >
                        <span>👤</span>
                        <span>Add Patient Info (Optional)</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="p-5 sm:p-6 bg-[#243441] rounded-2xl border border-gray-600/30">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <div className="w-2 h-2 bg-[#2D9AA5] rounded-full mr-3 flex-shrink-0"></div>
                      Quick Actions
                    </h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => setPrescription('')}
                        className="w-full px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all duration-300 text-sm font-medium border border-red-500/30 text-left flex items-center space-x-3"
                      >
                        <span>🗑️</span>
                        <span>Clear All</span>
                      </button>
                      <button
                        onClick={() => {
                          const timestamp = new Date().toLocaleString();
                          setPrescription(prev => prev + (prev ? '\n\n' : '') + `Date: ${timestamp}\nDoctor: [Your Name]\nSignature: [Digital Signature]`);
                        }}
                        className="w-full px-4 py-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-all duration-300 text-sm font-medium border border-green-500/30 text-left flex items-center space-x-3"
                      >
                        <span>✍️</span>
                        <span>Add Signature Block</span>
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(prescription)}
                        disabled={!prescription.trim()}
                        className="w-full px-4 py-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all duration-300 text-sm font-medium border border-blue-500/30 text-left flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>📋</span>
                        <span>Copy to Clipboard</span>
                      </button>
                    </div>
                  </div>


                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="px-5 sm:px-8 pb-6 sm:pb-8 bg-[#1A252E] border-t border-gray-600/30 flex-shrink-0">
              <div className="flex items-center justify-between pt-4 sm:pt-6">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-[#2D9AA5] rounded-full animate-pulse flex-shrink-0"></div>
                  <span>Powered by ZEVA Healthcare</span>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowPrescriptionModal(false)}
                    className="px-8 py-4 border-2 border-gray-600/50 text-gray-300 rounded-2xl hover:bg-gray-700/50 hover:border-gray-500 hover:text-white transition-all duration-300 font-semibold hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendPrescription}
                    disabled={sending}
                    className="bg-gradient-to-r from-[#2D9AA5] to-[#1B7A85] text-white py-3 sm:py-4 px-6 sm:px-8 rounded-2xl hover:shadow-2xl disabled:bg-gray-600 disabled:cursor-not-allowed font-semibold transition-all duration-300 flex items-center space-x-3 hover:scale-105 disabled:hover:scale-100 min-w-[160px] sm:min-w-[200px] relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/10 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="relative flex items-center space-x-3">
                      {sending ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send size={20} className="flex-shrink-0" />
                          <span>Send Prescription</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Footer Info */}
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <p className="text-xs text-gray-500 text-center">
                  This prescription will be encrypted and securely transmitted. You can send with any content - templates are optional.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-gray-900 text-base font-semibold">Delete message?</h3>
              <p className="text-gray-600 text-sm mt-1">Are you sure you want to delete this message? This action cannot be undone.</p>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-3 bg-white">
              <button
                onClick={closeDeleteConfirm}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => { if (deleteMessageId) { await handleDeleteMessage(deleteMessageId); } closeDeleteConfirm(); }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold shadow"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .animate-fadeIn {
        animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      
      /* Custom scrollbar */
      .overflow-y-auto::-webkit-scrollbar {
        width: 8px;
      }
      .overflow-y-auto::-webkit-scrollbar-track {
        background: rgba(45, 154, 165, 0.1);
        border-radius: 4px;
      }
      .overflow-y-auto::-webkit-scrollbar-thumb {
        background: rgba(45, 154, 165, 0.4);
        border-radius: 4px;
      }
      .overflow-y-auto::-webkit-scrollbar-thumb:hover {
        background: rgba(45, 154, 165, 0.6);
      }

      /* Responsive adjustments */
      @media (max-width: 640px) {
        .max-w-\[85\%\] {
          max-width: 92%;
        }
        .px-6 {
          padding-left: 1rem;
          padding-right: 1rem;
        }
        .py-4 {
          padding-top: 0.875rem;
          padding-bottom: 0.875rem;
        }
      }
      
      @media (max-width: 768px) {
        .rounded-\[28px\] {
          border-radius: 20px;
        }
        .text-xl {
          font-size: 1.125rem;
        }
        .text-2xl {
          font-size: 1.5rem;
        }
      }

      /* Enhanced hover effects */
      .group:hover .group-hover\\:scale-110 {
        transform: scale(1.1);
      }
      
      .hover\\:rotate-12:hover {
        transform: rotate(12deg);
      }
      
      .hover\\:rotate-90:hover {
        transform: rotate(90deg);
      }
    `}</style>
    </div>
  );
}

DoctorChat.getLayout = function PageLayout(page: React.ReactNode) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedDoctorChat: NextPageWithLayout = withDoctorAuth(DoctorChat);
ProtectedDoctorChat.getLayout = DoctorChat.getLayout;

export { DoctorChat };

export default ProtectedDoctorChat;