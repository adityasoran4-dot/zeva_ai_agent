import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiAgentChatProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
}

const AiAgentChat: React.FC<AiAgentChatProps> = ({
  isOpen,
  onClose,
  conversationId,
}) => {
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

    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const clinicToken = localStorage.getItem("clinicToken");
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: trimmed,
          threadId,
          clinicToken,
          conversation_id: conversationId ?? "",
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data?.response || "Sorry, I couldn't process that.",
        },
      ]);
    } catch {
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
    <div className="absolute bottom-20 left-4 z-50 w-[22rem] sm:w-[26rem] md:w-[30rem] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">AI Assistant</p>
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
      <div
        className="overflow-y-auto p-4 space-y-4 bg-gray-50"
        style={{ height: "380px", minHeight: "380px", maxHeight: "380px" }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            <div
              className={`p-1.5 rounded-full flex-shrink-0 mt-1 ${
                msg.role === "user" ? "bg-gray-800" : "bg-blue-100"
              }`}
            >
              {msg.role === "user" ? (
                <User className="h-3 w-3 text-white" />
              ) : (
                <Bot className="h-3 w-3 text-blue-600" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed break-words min-w-0 max-w-[80%] ${
                msg.role === "user"
                  ? "bg-gray-800 text-white rounded-tr-sm"
                  : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // ── Headings ──────────────────────────────────────
                    h1: ({ children }) => (
                      <h1 className="text-base font-bold mb-1">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-sm font-bold mb-1">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold mb-1">{children}</h3>
                    ),

                    // ── Paragraph ─────────────────────────────────────
                    p: ({ children }) => (
                      <p className="mb-1 last:mb-0">{children}</p>
                    ),

                    // ── Bold ──────────────────────────────────────────
                    strong: ({ children }) => (
                      <span className="font-semibold text-gray-900">
                        {children}
                      </span>
                    ),

                    // ── Lists ─────────────────────────────────────────
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-0.5 mb-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-0.5 mb-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm">{children}</li>
                    ),

                    // ── Divider ───────────────────────────────────────
                    hr: () => <hr className="my-2 border-gray-200" />,

                    // ── Inline code ───────────────────────────────────
                    code: ({ children }) => (
                      <code className="bg-gray-100 text-gray-800 text-xs px-1 py-0.5 rounded">
                        {children}
                      </code>
                    ),

                    // Hide the "Field | Details" header row
                    thead: () => null,

                    tbody: ({ children }) => <tbody>{children}</tbody>,

                    tr: ({ children }) => (
                      <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                        {children}
                      </tr>
                    ),

                    td: ({ children, node }) => {
                      // ✅ Reliable column detection: find index among sibling <td>s
                      const parent = (node as any)?.parent;
                      const siblings =
                        parent?.children?.filter(
                          (c: any) => c.tagName === "td",
                        ) ?? [];
                      const idx = siblings.indexOf(node);
                      const isLabel = idx === 0;

                      // Hide the Status row entirely from the table body
                      // (status is shown in the header pill instead)
                      const rawText = (node as any)?.children?.[0]?.value ?? "";
                      if (isLabel && rawText.toLowerCase().includes("status")) {
                        return <></>;
                      }

                      return (
                        <td
                          style={{
                            padding: "9px 14px",
                            width: isLabel ? "38%" : "62%",
                            fontSize: isLabel ? "11px" : "13px",
                            color: isLabel ? "#6b7280" : "#111827",
                            fontWeight: isLabel ? 400 : 600,
                            textTransform: isLabel ? "uppercase" : "none",
                            letterSpacing: isLabel ? "0.4px" : "0",
                          }}
                        >
                          {children}
                        </td>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded-full bg-blue-100 mt-1">
              <Bot className="h-3 w-3 text-blue-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-gray-200 bg-white flex items-end gap-2 flex-shrink-0"
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
          className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-all flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default AiAgentChat;
