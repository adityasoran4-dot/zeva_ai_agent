import React, { useState, useRef, useEffect } from "react";

interface WhatsAppChatProps {
  isOpen: boolean;
  onClose: () => void;
  leadName: string;
  phoneNumber: string;
  hideNameAndNumber?: boolean;
}

interface Message {
  id: string;
  from: "me" | "lead";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
}

const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  isOpen,
  onClose,
  leadName,
  phoneNumber,
  hideNameAndNumber = false,
}) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Remove '+' for consistent backend comparison
  const normalizePhone = (num: string) => num.replace(/\+/g, "");
  const leadNumber = normalizePhone(phoneNumber);

  const formatTime = (ts?: string) =>
    ts
      ? new Date(parseInt(ts) * 1000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const getWsUrl = () =>
    process.env.NODE_ENV === "development"
      ? "ws://localhost:3000"
      : "wss://your-production-ws-url";

  // WebSocket connection
  useEffect(() => {
    if (!isOpen) return;

    wsRef.current = new WebSocket(getWsUrl());

    wsRef.current.onopen = () => {
      console.log("✅ WS connected");
      wsRef.current?.send(JSON.stringify({ phoneNumber: leadNumber }));
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        const from = data.from ? normalizePhone(data.from) : null;
        const to = data.to ? normalizePhone(data.to) : null;
        const recipient = data.recipient_id ? normalizePhone(data.recipient_id) : null;

        // Only process messages relevant to this lead
        const isRelevant =
          from === leadNumber || to === leadNumber || recipient === leadNumber;
        if (!isRelevant) return;

        // Incoming message
        if (data.text || data.text?.body) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev;
            return [
              ...prev,
              {
                id: data.id || Date.now().toString(),
                from: from === leadNumber ? "lead" : "me",
                text: typeof data.text === "string" ? data.text : data.text?.body || "",
                time: formatTime(data.timestamp),
                status: data.status,
              },
            ];
          });
        }

        // Status update
        if (data.status && data.id) {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === data.id ? { ...msg, status: data.status } : msg))
          );
        }
      } catch (err) {
        console.error("❌ WS parse error:", err);
      }
    };

    wsRef.current.onerror = (err) => console.error("❌ WS error:", err);
    wsRef.current.onclose = (e) => console.log("❌ WS closed:", e.reason);

    return () => wsRef.current?.close();
  }, [isOpen, leadNumber]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!message.trim()) return;
    const newId = Date.now().toString();
    const newMsg: Message = {
      id: newId,
      from: "me",
      text: message.trim(),
      time: formatTime(),
      status: "sent",
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessage("");

    try {
      await fetch("/api/marketing/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: leadNumber,
          message: newMsg.text,
          id: newMsg.id,
        }),
      });
    } catch (err) {
      console.error("❌ Failed to send message:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/90 p-4">
      <div className="w-full max-w-5xl rounded-lg bg-white shadow-2xl overflow-hidden" style={{ height: '90vh', maxHeight: '800px' }}>
        <div className="grid h-full grid-cols-1 lg:grid-cols-[2fr_1fr]">
          {/* Chat Surface - WhatsApp Style */}
          <div className="flex h-full flex-col bg-[#e5ddd5]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'grid\' width=\'100\' height=\'100\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M 100 0 L 0 0 0 100\' fill=\'none\' stroke=\'%23d4d4d4\' stroke-width=\'0.5\' opacity=\'0.3\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23grid)\'/%3E%3C/svg%3E")' }}>
            {/* Header - WhatsApp Green */}
            <div className="flex items-center justify-between bg-[#075e54] px-4 py-3 shadow-md">
              <div className="flex items-center gap-3">
                {!hideNameAndNumber && (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-sm font-semibold text-gray-700">
                      {leadName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{leadName}</p>
                      <p className="text-xs text-gray-200">online</p>
                    </div>
                  </>
                )}
                {hideNameAndNumber && (
                  <div>
                    <p className="text-sm font-semibold text-white">WhatsApp</p>
                    <p className="text-xs text-gray-200">online</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="p-2 text-gray-200 hover:text-white hover:bg-white/10 rounded-full transition"
                  aria-label="Close chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages - WhatsApp Style */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">No messages yet</p>
                  <p className="text-xs text-gray-500 mt-1">Start the conversation</p>
                </div>
              )}
              {messages.map((msg, _index) => {
                const isMe = msg.from === "me";
                const _showTail = true; // Always show tail for WhatsApp style - reserved for future use
                void _showTail; // Mark as intentionally unused for future use
                return (
                  <div key={msg.id} className={`mb-1 flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[65%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      <div
                        className={`relative rounded-lg px-2 py-1.5 shadow-sm ${
                          isMe
                            ? "bg-[#dcf8c6] rounded-tr-none"
                            : "bg-white rounded-tl-none"
                        }`}
                        style={{
                          borderRadius: isMe 
                            ? '7.5px 7.5px 0 7.5px' 
                            : '7.5px 7.5px 7.5px 0'
                        }}
                      >
                        <p className={`text-sm ${isMe ? "text-gray-900" : "text-gray-900"} whitespace-pre-wrap break-words`}>
                          {msg.text}
                        </p>
                        <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMe ? "text-[#667781]" : "text-[#667781]"}`}>
                          <span className="text-[11px]" style={{ fontSize: '11px' }}>
                            {msg.time}
                          </span>
                          {isMe && msg.status && (
                            <span className={`text-[11px] ${msg.status === "read" ? "text-[#53bdeb]" : ""}`}>
                              {msg.status === "sent" && "✓"}
                              {msg.status === "delivered" && "✓✓"}
                              {msg.status === "read" && "✓✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input - WhatsApp Style */}
            <div className="flex items-center gap-2 bg-[#f0f0f0] px-3 py-2 border-t border-gray-300">
              <button
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition"
                title="Emoji"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition"
                title="Attach"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <div className="flex-1 bg-white rounded-full px-4 py-2 border border-gray-300">
                <textarea
                  className="w-full resize-none border-none outline-none text-sm text-gray-900 placeholder-gray-500 bg-transparent"
                  rows={1}
                  value={message}
                  placeholder="Type a message"
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      await handleSend();
                    }
                  }}
                  style={{ maxHeight: '100px', minHeight: '20px' }}
                />
              </div>
              {message.trim() ? (
                <button
                  onClick={handleSend}
                  className="p-2 bg-[#25d366] text-white rounded-full hover:bg-[#20ba5a] transition shadow-md"
                  aria-label="Send message"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
                  </svg>
                </button>
              ) : (
                <button
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition"
                  title="Microphone"
                  type="button"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Lead summary */}
          <div className="hidden h-full flex-col border-l border-gray-100 bg-white p-5 lg:flex">
            {!hideNameAndNumber && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assigned to</p>
                <p className="mt-1">{leadName}</p>
                <p className="text-xs text-gray-500">{phoneNumber}</p>
              </div>
            )}

            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Smart reply</p>
                <div className="mt-2 flex flex-col gap-2 text-xs">
                  {["We received your inquiry.", "Can we schedule a call?", "Sharing treatment details now."].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setMessage((prev) => (prev ? `${prev}\n${preset}` : preset))}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-left text-gray-800 hover:bg-gray-50"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Messages are routed through your verified WhatsApp business account. Status indicators update in real time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppChat;
