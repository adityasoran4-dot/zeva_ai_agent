import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Loader2, User } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiAgentChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const AiAgentChat: React.FC<AiAgentChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId] = useState(() => uuidv4());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(threadId);

    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      console.log("threadId =", threadId);
      const payload = {
        messages: trimmed,
        threadId,
      };

      console.log("PAYLOAD:", payload);
      console.log("JSON:", JSON.stringify(payload));

      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log("status", response.status);
      console.log("data", data);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data?.response || "Sorry, I couldn't process that.",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-20 left-4 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">AI Agent</p>
            <p className="text-xs text-gray-300">Always here to help</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`p-1.5 rounded-full flex-shrink-0 ${msg.role === "user" ? "bg-gray-800" : "bg-blue-100"}`}
            >
              {msg.role === "user" ? (
                <User className="h-3 w-3 text-white" />
              ) : (
                <Bot className="h-3 w-3 text-blue-600" />
              )}
            </div>
            <div
              className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-gray-800 text-white rounded-br-sm"
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-end gap-2">
            <div className="p-1.5 rounded-full bg-blue-100">
              <Bot className="h-3 w-3 text-blue-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-gray-200 bg-white flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 text-sm border border-gray-300 rounded-xl px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-gray-800 focus:border-transparent max-h-24 overflow-y-auto"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-all"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default AiAgentChat;
