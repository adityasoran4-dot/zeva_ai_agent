import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Sparkles,
  User,
  Calendar,
  Clock,
  Stethoscope,
  UserCircle,
  CheckCircle,
  AlertCircle,
  CalendarX,
  CalendarCheck,
  MapPin,
  CreditCard,
  Phone,
  ChevronRight,
} from "lucide-react";
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

// ─── Utility: parse markdown table into rows ─────────────────────────────────
function parseMarkdownTable(
  content: string,
): { headers: string[]; rows: string[][] } | null {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const tableLines = lines.filter((l) => l.startsWith("|"));
  if (tableLines.length < 3) return null;
  const parse = (line: string) =>
    line
      .split("|")
      .map((c) => c.replace(/\*\*/g, "").trim())
      .filter(Boolean);
  const headers = parse(tableLines[0]);
  const rows = tableLines.slice(2).map(parse);
  return { headers, rows };
}

// ─── Content detectors ────────────────────────────────────────────────────────
const SCHEDULER_LINK_TOKEN = "🔗 SCHEDULER_LINK:";

const hasSchedulerLink = (c: string) => c.includes(SCHEDULER_LINK_TOKEN);

function extractSchedulerLink(c: string): { text: string; link: string } {
  const idx = c.indexOf(SCHEDULER_LINK_TOKEN);

  const text = c.slice(0, idx).trim();

  const raw = c
    .slice(idx + SCHEDULER_LINK_TOKEN.length)
    .trim()
    .split("\n")[0]
    .trim();

  // Markdown link: [Text](URL)
  const markdownMatch = raw.match(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/);

  const link = markdownMatch ? markdownMatch[1] : raw;

  return { text, link };
}

const isBookingConfirmation = (c: string) =>
  c.includes("Treatment") &&
  c.includes("Doctor") &&
  c.includes("Date") &&
  c.includes("Time") &&
  (c.toLowerCase().includes("confirm") ||
    c.toLowerCase().includes("summary") ||
    c.toLowerCase().includes("appointment"));

const isDateTimePicker = (c: string) =>
  c.toLowerCase().includes("please select a new date and time");
const isTimings = (c: string) =>
  c.includes("TIMINGS_START") && c.includes("TIMINGS_END");

const isRescheduleConfirmation = (c: string) =>
  (c.includes("Original Date") || c.includes("New Date")) &&
  (c.toLowerCase().includes("reschedule") ||
    c.toLowerCase().includes("update"));

const isSuccessBanner = (c: string) =>
  (c.toLowerCase().includes("confirmed") ||
    c.toLowerCase().includes("rescheduled")) &&
  (c.includes("🎉") || c.toLowerCase().includes("see you"));

const isErrorBanner = (c: string) =>
  c.toLowerCase().includes("went wrong") ||
  c.toLowerCase().includes("didn't go through") ||
  c.toLowerCase().includes("didn't go through") ||
  c.toLowerCase().includes("failed");
// ─── Detectors ────────────────────────────────────────────────────────────────
const isServicesSummary = (c: string) =>
  c.includes("SERVICES_SUMMARY_START") && c.includes("SERVICES_SUMMARY_END");

const isServicesDetail = (c: string) =>
  c.includes("SERVICES_DETAIL_START") && c.includes("SERVICES_DETAIL_END");
const isDoctorList = (c: string) =>
  (c.toLowerCase().includes("doctor") ||
    c.toLowerCase().includes("dr.") ||
    c.toLowerCase().includes("available for")) &&
  (c.includes("—") || c.includes(" - ")) &&
  (c.includes("- ") || c.includes("* ")) &&
  c.includes("DOCTORS_LIST_START") &&
  c.includes("DOCTORS_LIST_END") &&
  !isBookingConfirmation(c) &&
  !isRescheduleConfirmation(c);

const isFaqAnswer = (c: string) =>
  (c.includes("**Clinic") ||
    c.includes("💡") ||
    c.toLowerCase().includes("hours") ||
    c.toLowerCase().includes("location") ||
    c.toLowerCase().includes("services") ||
    c.toLowerCase().includes("payment") ||
    c.toLowerCase().includes("insurance")) &&
  !isBookingConfirmation(c) &&
  !isRescheduleConfirmation(c) &&
  !isDateTimePicker(c) &&
  !isServicesSummary(c) && // ← add these two
  !isServicesDetail(c);

// ─── Doctor avatar colors ─────────────────────────────────────────────────────
const avatarPalette = [
  { bg: "#e0e7ff", text: "#4338ca", glow: "#6366f1" },
  { bg: "#d1fae5", text: "#065f46", glow: "#10b981" },
  { bg: "#fce7f3", text: "#9d174d", glow: "#ec4899" },
  { bg: "#fef3c7", text: "#92400e", glow: "#f59e0b" },
  { bg: "#dbeafe", text: "#1e40af", glow: "#3b82f6" },
];

function initials(name: string): string {
  return name
    .replace("Dr.", "")
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── FAQ icon map ─────────────────────────────────────────────────────────────
function faqIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("hour") || t.includes("time")) return <Clock size={15} />;
  if (t.includes("location") || t.includes("address") || t.includes("find"))
    return <MapPin size={15} />;
  if (
    t.includes("payment") ||
    t.includes("insurance") ||
    t.includes("cost") ||
    t.includes("price")
  )
    return <CreditCard size={15} />;
  if (t.includes("doctor") || t.includes("specialist"))
    return <Stethoscope size={15} />;
  if (t.includes("phone") || t.includes("contact") || t.includes("call"))
    return <Phone size={15} />;
  return <ChevronRight size={15} />;
}

// ─── Markdown Components (defined first — referenced by BookingLinkCard below) ─
const MarkdownComponents: React.ComponentProps<
  typeof ReactMarkdown
>["components"] = {
  h1: ({ children }) => (
    <h1
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: "#e0e7ff",
        margin: "10px 0 5px",
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: "#c7d2fe",
        margin: "8px 0 4px",
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: "#a5b4fc",
        margin: "6px 0 3px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p
      style={{
        margin: "0 0 5px",
        fontSize: 13,
        lineHeight: 1.65,
        color: "#cbd5e1",
      }}
    >
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 700, color: "#e0e7ff" }}>{children}</strong>
  ),
  hr: () => (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        margin: "8px 0",
      }}
    />
  ),
  ul: ({ children }) => (
    <ul style={{ margin: "4px 0 6px", paddingLeft: 0, listStyle: "none" }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: "4px 0 6px", paddingLeft: 18 }}>{children}</ol>
  ),
  li: ({ children }) => (
    <li
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 7,
        marginBottom: 4,
        fontSize: 13,
        color: "#94a3b8",
        lineHeight: 1.6,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          marginTop: 6,
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#6366f1",
          display: "inline-block",
        }}
      />
      <span>{children}</span>
    </li>
  ),
  table: ({ children }) => (
    <div style={{ overflowX: "auto", margin: "6px 0" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 12,
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead style={{ background: "rgba(99,102,241,0.12)" }}>{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th
      style={{
        padding: "7px 10px",
        textAlign: "left",
        fontWeight: 700,
        fontSize: 10,
        color: "#818cf8",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      style={{
        padding: "7px 10px",
        color: "#cbd5e1",
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      {children}
    </td>
  ),
  blockquote: ({ children }) => (
    <div
      style={{
        background: "rgba(56,189,248,0.06)",
        borderLeft: "3px solid #38bdf8",
        borderRadius: "0 8px 8px 0",
        padding: "7px 12px",
        margin: "5px 0",
        color: "#7dd3fc",
        fontSize: 12,
      }}
    >
      {children}
    </div>
  ),
  code: ({ children, className }: any) => {
    const isBlock = className?.includes("language-");
    return isBlock ? (
      <pre
        style={{
          background: "#020617",
          color: "#e2e8f0",
          borderRadius: 8,
          padding: "9px 12px",
          fontSize: 11,
          overflowX: "auto",
          margin: "5px 0",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <code>{children}</code>
      </pre>
    ) : (
      <code
        style={{
          background: "rgba(124,58,237,0.15)",
          color: "#c4b5fd",
          fontSize: 12,
          padding: "1px 5px",
          borderRadius: 4,
        }}
      >
        {children}
      </code>
    );
  },
};

// ─── SERVICES SUMMARY CARD ────────────────────────────────────────────────────
const ServicesSummaryCard: React.FC<{
  content: string;
  onSend: (msg: string) => void;
}> = ({ content, onSend }) => {
  const start = content.indexOf("SERVICES_SUMMARY_START");
  const end = content.indexOf("SERVICES_SUMMARY_END");
  const inner = content
    .slice(start + "SERVICES_SUMMARY_START".length, end)
    .trim();

  const deptColors = [
    {
      bg: "rgba(99,102,241,0.08)",
      border: "rgba(99,102,241,0.2)",
      color: "#818cf8",
    },
    {
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.2)",
      color: "#34d399",
    },
    {
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
      color: "#fbbf24",
    },
    {
      bg: "rgba(236,72,153,0.08)",
      border: "rgba(236,72,153,0.2)",
      color: "#f472b6",
    },
    {
      bg: "rgba(56,189,248,0.08)",
      border: "rgba(56,189,248,0.2)",
      color: "#38bdf8",
    },
    {
      bg: "rgba(167,139,250,0.08)",
      border: "rgba(167,139,250,0.2)",
      color: "#a78bfa",
    },
  ];

  const departments: { name: string; count: number }[] = [];
  inner.split("\n").forEach((line) => {
    const match = line.match(/^-\s*(.+?)\s*\|\s*(\d+)/);
    if (match)
      departments.push({ name: match[1].trim(), count: parseInt(match[2]) });
  });

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(99,102,241,0.2)",
        background: "#0f0f23",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b, #312e81)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "rgba(129,140,248,0.2)",
            border: "1px solid rgba(129,140,248,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Stethoscope size={15} color="#a5b4fc" />
        </div>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              color: "#e0e7ff",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Our Services
          </p>
          <p
            style={{ margin: 0, fontSize: 10, color: "rgba(165,180,252,0.7)" }}
          >
            {departments.reduce((a, d) => a + d.count, 0)} treatments across{" "}
            {departments.length} departments
          </p>
        </div>
      </div>

      {/* Department tiles */}
      <div
        style={{
          padding: 12,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          background: "#0f0f23",
        }}
      >
        {departments.map((dept, i) => {
          const col = deptColors[i % deptColors.length];
          return (
            <button
              key={i}
              onClick={() => onSend(`Show me ${dept.name} services`)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                cursor: "pointer",
                background: col.bg,
                border: `1px solid ${col.border}`,
                textAlign: "left",
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-1px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: col.color,
                }}
              >
                {dept.name}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 10,
                  color: "rgba(148,163,184,0.7)",
                }}
              >
                {dept.count} treatment{dept.count !== 1 ? "s" : ""}
              </p>
            </button>
          );
        })}
      </div>

      <div
        style={{
          padding: "10px 16px 12px",
          borderTop: "1px solid rgba(99,102,241,0.1)",
          background: "rgba(99,102,241,0.04)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: "rgba(148,163,184,0.6)",
            textAlign: "center",
          }}
        >
          Tap a department to see treatments & pricing
        </p>
      </div>
    </div>
  );
};

// ─── SERVICES DETAIL CARD ─────────────────────────────────────────────────────
const ServicesDetailCard: React.FC<{ content: string }> = ({ content }) => {
  const start = content.indexOf("SERVICES_DETAIL_START");
  const end = content.indexOf("SERVICES_DETAIL_END");
  const inner = content
    .slice(start + "SERVICES_DETAIL_START".length, end)
    .trim();
  const followUp = content.slice(end + "SERVICES_DETAIL_END".length).trim();

  const lines = inner.split("\n");
  const headerLine =
    lines
      .find((l) => l.includes("**"))
      ?.replace(/\*\*/g, "")
      .trim() ?? "Services";

  const services: { name: string; price: string; duration: string }[] = [];
  lines.forEach((line) => {
    const match = line.match(
      /^-\s*(.+?)\s*\|\s*(₹[\d,]+|[\d,]+)\s*\|\s*(\d+\s*min)/i,
    );
    if (match)
      services.push({
        name: match[1].trim(),
        price: match[2].trim(),
        duration: match[3].trim(),
      });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(99,102,241,0.2)",
          background: "#0f0f23",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e1b4b, #312e81)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "rgba(129,140,248,0.2)",
              border: "1px solid rgba(129,140,248,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Stethoscope size={13} color="#a5b4fc" />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              color: "#e0e7ff",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {headerLine}
          </p>
        </div>

        {/* Column headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            padding: "8px 14px",
            gap: 12,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(99,102,241,0.06)",
          }}
        >
          {["Treatment", "Price", "Duration"].map((h) => (
            <span
              key={h}
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#818cf8",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {services.map((svc, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              padding: "10px 14px",
              gap: 12,
              alignItems: "center",
              borderBottom:
                i < services.length - 1
                  ? "1px solid rgba(255,255,255,0.04)"
                  : "none",
              background:
                i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
            }}
          >
            <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>
              {svc.name}
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#34d399",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {svc.price.startsWith("₹") ? svc.price : `₹${svc.price}`}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "rgba(148,163,184,0.7)",
                whiteSpace: "nowrap",
              }}
            >
              {svc.duration}
            </span>
          </div>
        ))}
      </div>

      {followUp && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={MarkdownComponents}
        >
          {followUp}
        </ReactMarkdown>
      )}
    </div>
  );
};

// ─── BOOKING LINK CARD ────────────────────────────────────────────────────────
// NOTE: defined AFTER MarkdownComponents to avoid reference-before-definition
const BookingLinkCard: React.FC<{ content: string }> = ({ content }) => {
  const { text, link } = extractSchedulerLink(content);
  const [hovered, setHovered] = useState(false);
  console.log("Extracted Link:", link);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Regular message text rendered as markdown */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={MarkdownComponents}
      >
        {text}
      </ReactMarkdown>

      {/* Scheduler link pill */}
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "11px 14px",
          borderRadius: 13,
          background: hovered
            ? "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.18))"
            : "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.10))",
          border: "1px solid rgba(99,102,241,0.3)",
          textDecoration: "none",
          transition: "background 0.15s, transform 0.15s",
          transform: hovered ? "translateY(-1px)" : "translateY(0)",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "rgba(99,102,241,0.2)",
              border: "1px solid rgba(129,140,248,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Calendar size={14} color="#a5b4fc" />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                color: "#e0e7ff",
              }}
            >
              Book Online
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 10,
                color: "rgba(165,180,252,0.6)",
                marginTop: 1,
              }}
            >
              Opens the booking scheduler
            </p>
          </div>
        </div>
        <ChevronRight size={14} color="rgba(165,180,252,0.5)" />
      </a>
    </div>
  );
};
const TimingsCard: React.FC<{ content: string }> = ({ content }) => {
  const start = content.indexOf("TIMINGS_START");
  const end = content.indexOf("TIMINGS_END");
  const inner = content.slice(start + "TIMINGS_START".length, end).trim();
  const followUp = content.slice(end + "TIMINGS_END".length).trim();

  const rows: { day: string; status: string; opens: string; closes: string }[] =
    [];
  inner.split("\n").forEach((line) => {
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length < 2) return;
    if (cells[0].toLowerCase() === "day") return; // skip header
    if (/^[-:]+$/.test(cells[0])) return; // skip separator
    rows.push({
      day: cells[0],
      status: cells[1],
      opens: cells[2] ?? "-",
      closes: cells[3] ?? "-",
    });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(99,102,241,0.2)",
          background: "#0f0f23",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1e1b4b, #312e81)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "rgba(129,140,248,0.2)",
              border: "1px solid rgba(129,140,248,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock size={13} color="#a5b4fc" />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              color: "#e0e7ff",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Clinic Hours
          </p>
        </div>

        {rows.map((row, i) => {
          const isOpen = row.status.toLowerCase() === "open";
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto auto",
                padding: "9px 14px",
                gap: 10,
                alignItems: "center",
                borderBottom:
                  i < rows.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
                background:
                  i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
              }}
            >
              <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>
                {row.day}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 8,
                  background: isOpen
                    ? "rgba(52,211,153,0.15)"
                    : "rgba(239,68,68,0.15)",
                  border: isOpen
                    ? "1px solid rgba(52,211,153,0.3)"
                    : "1px solid rgba(239,68,68,0.3)",
                  color: isOpen ? "#34d399" : "#f87171",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {isOpen ? "OPEN" : "CLOSED"}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(148,163,184,0.85)",
                  whiteSpace: "nowrap",
                }}
              >
                {isOpen ? row.opens : "–"}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(148,163,184,0.85)",
                  whiteSpace: "nowrap",
                }}
              >
                {isOpen ? row.closes : "–"}
              </span>
            </div>
          );
        })}
      </div>

      {followUp && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={MarkdownComponents}
        >
          {followUp}
        </ReactMarkdown>
      )}
    </div>
  );
};

// ─── BOOKING CONFIRMATION CARD ────────────────────────────────────────────────
const BookingCard: React.FC<{
  content: string;
  onSend: (msg: string) => void;
}> = ({ content, onSend }) => {
  const parsed = parseMarkdownTable(content);
  const rows = parsed?.rows ?? [];

  const fieldMap: Record<string, { icon: React.ReactNode; color: string }> = {
    patient: { icon: <User size={13} />, color: "#818cf8" },
    treatment: { icon: <Stethoscope size={13} />, color: "#34d399" },
    doctor: { icon: <UserCircle size={13} />, color: "#60a5fa" },
    date: { icon: <Calendar size={13} />, color: "#f472b6" },
    time: { icon: <Clock size={13} />, color: "#fb923c" },
  };

  const getField = (key: string) =>
    fieldMap[key.toLowerCase().replace(/\*\*/g, "").trim()] ?? {
      icon: <ChevronRight size={13} />,
      color: "#a78bfa",
    };

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(99,102,241,0.25)",
        background: "#0f0f23",
      }}
    >
      {/* Header */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -20,
            top: -20,
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(129,140,248,0.15)",
            border: "1px solid rgba(129,140,248,0.2)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 10,
            top: 10,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(167,139,250,0.12)",
          }}
        />
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, zIndex: 1 }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "rgba(129,140,248,0.2)",
              border: "1px solid rgba(129,140,248,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Calendar size={15} color="#a5b4fc" />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                color: "#e0e7ff",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Appointment Summary
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 10,
                color: "rgba(165,180,252,0.7)",
              }}
            >
              Review before confirming
            </p>
          </div>
        </div>
        <span
          style={{
            zIndex: 1,
            fontSize: 10,
            padding: "3px 10px",
            borderRadius: 20,
            background: "rgba(234,179,8,0.15)",
            border: "1px solid rgba(234,179,8,0.3)",
            color: "#fde68a",
            fontWeight: 600,
          }}
        >
          PENDING
        </span>
      </div>

      {/* Rows */}
      <div style={{ background: "#0f0f23", padding: "4px 0" }}>
        {rows.map(([field, value], i) => {
          const { icon, color } = getField(field);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderBottom:
                  i < rows.length - 1
                    ? "1px solid rgba(255,255,255,0.05)"
                    : "none",
                background:
                  i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: `${color}18`,
                    border: `1px solid ${color}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color,
                  }}
                >
                  {icon}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: "rgba(148,163,184,0.9)",
                    fontWeight: 500,
                  }}
                >
                  {field.replace(/\*\*/g, "")}
                </span>
              </div>
              <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>
                {value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          background: "rgba(99,102,241,0.06)",
          borderTop: "1px solid rgba(99,102,241,0.15)",
          padding: "12px 16px",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onSend("Confirm")}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.3px",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              color: "#fff",
              boxShadow:
                "0 4px 14px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            ✓ Confirm Booking
          </button>
          <button
            onClick={() => onSend("Cancel")}
            style={{
              padding: "9px 16px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
              background: "transparent",
              border: "1px solid rgba(148,163,184,0.2)",
              color: "rgba(148,163,184,0.7)",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── DATE TIME PICKER CARD ────────────────────────────────────────────────────
const DateTimePicker: React.FC<{ onSend: (msg: string) => void }> = ({
  onSend,
}) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const timeSlots = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
  ];

  const today = new Date().toISOString().split("T")[0];

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return;
    const formatted = new Date(selectedDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    onSend(`Reschedule to ${formatted} at ${selectedTime}`);
  };

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(99,102,241,0.25)",
        background: "#0f0f23",
      }}
    >
      {/* Header */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -20,
            top: -20,
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(129,140,248,0.15)",
          }}
        />
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "rgba(129,140,248,0.2)",
            border: "1px solid rgba(129,140,248,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <Calendar size={15} color="#a5b4fc" />
        </div>
        <div style={{ zIndex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              color: "#e0e7ff",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            Pick New Date & Time
          </p>
          <p
            style={{ margin: 0, fontSize: 10, color: "rgba(165,180,252,0.7)" }}
          >
            Choose your preferred slot
          </p>
        </div>
      </div>

      {/* Date picker */}
      <div style={{ padding: "14px 16px 0", background: "#0f0f23" }}>
        <p
          style={{
            margin: "0 0 7px",
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(148,163,184,0.7)",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
          }}
        >
          Select Date
        </p>
        <input
          type="date"
          min={today}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            width: "100%",
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid rgba(99,102,241,0.25)",
            background: "rgba(99,102,241,0.08)",
            color: selectedDate ? "#e2e8f0" : "rgba(148,163,184,0.5)",
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
            colorScheme: "dark",
          }}
        />
      </div>

      {/* Time slots */}
      <div style={{ padding: "14px 16px", background: "#0f0f23" }}>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(148,163,184,0.7)",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
          }}
        >
          Select Time
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6,
          }}
        >
          {timeSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedTime(slot)}
              style={{
                padding: "7px 4px",
                borderRadius: 8,
                border:
                  selectedTime === slot
                    ? "1px solid rgba(99,102,241,0.7)"
                    : "1px solid rgba(255,255,255,0.07)",
                background:
                  selectedTime === slot
                    ? "rgba(99,102,241,0.25)"
                    : "rgba(255,255,255,0.03)",
                color:
                  selectedTime === slot ? "#a5b4fc" : "rgba(148,163,184,0.7)",
                fontSize: 11,
                fontWeight: selectedTime === slot ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          background: "rgba(99,102,241,0.06)",
          borderTop: "1px solid rgba(99,102,241,0.15)",
          padding: "12px 16px",
        }}
      >
        <button
          onClick={handleConfirm}
          disabled={!selectedDate || !selectedTime}
          style={{
            width: "100%",
            padding: "9px 0",
            borderRadius: 10,
            border: "none",
            cursor: !selectedDate || !selectedTime ? "not-allowed" : "pointer",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: "0.3px",
            background:
              !selectedDate || !selectedTime
                ? "rgba(99,102,241,0.15)"
                : "linear-gradient(135deg, #4f46e5, #7c3aed)",
            color:
              !selectedDate || !selectedTime ? "rgba(165,180,252,0.4)" : "#fff",
            boxShadow:
              !selectedDate || !selectedTime
                ? "none"
                : "0 4px 14px rgba(99,102,241,0.4)",
            transition: "all 0.2s",
            fontFamily: "inherit",
          }}
        >
          {!selectedDate || !selectedTime
            ? "Select date and time to continue"
            : "→ Confirm New Slot"}
        </button>
      </div>
    </div>
  );
};

// ─── RESCHEDULE TIMELINE CARD ─────────────────────────────────────────────────
const RescheduleCard: React.FC<{
  content: string;
  onSend: (msg: string) => void;
}> = ({ content, onSend }) => {
  const parsed = parseMarkdownTable(content);
  const rows = parsed?.rows ?? [];

  const origDate =
    rows.find(([f]) => f.toLowerCase().includes("original date"))?.[1] ?? "–";
  const origTime =
    rows.find(([f]) => f.toLowerCase().includes("original time"))?.[1] ?? "–";
  const newDate =
    rows.find(([f]) => f.toLowerCase().includes("new date"))?.[1] ?? "–";
  const newTime =
    rows.find(([f]) => f.toLowerCase().includes("new time"))?.[1] ?? "–";
  const doctor =
    rows.find(([f]) => f.toLowerCase().includes("doctor"))?.[1] ?? "–";

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(99,102,241,0.2)",
        background: "#0f0f23",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b, #312e81)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -10,
            top: -10,
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "rgba(167,139,250,0.12)",
          }}
        />
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "rgba(129,140,248,0.2)",
            border: "1px solid rgba(129,140,248,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Calendar size={15} color="#a5b4fc" />
        </div>
        <div style={{ zIndex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              color: "#e0e7ff",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            Reschedule Request
          </p>
          <p
            style={{ margin: 0, fontSize: 10, color: "rgba(165,180,252,0.7)" }}
          >
            Dr. {doctor.replace("Dr.", "").trim()}
          </p>
        </div>
        <span
          style={{
            marginLeft: "auto",
            zIndex: 1,
            fontSize: 10,
            padding: "3px 10px",
            borderRadius: 20,
            background: "rgba(251,191,36,0.12)",
            border: "1px solid rgba(251,191,36,0.25)",
            color: "#fde68a",
            fontWeight: 600,
          }}
        >
          UPDATE PENDING
        </span>
      </div>

      {/* Timeline */}
      <div style={{ padding: "20px 20px 16px", background: "#0f0f23" }}>
        {/* Old slot */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.12)",
                border: "1.5px solid rgba(239,68,68,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarX size={15} color="#f87171" />
            </div>
            <div
              style={{
                width: 1.5,
                height: 28,
                background:
                  "linear-gradient(to bottom, rgba(239,68,68,0.3), rgba(99,102,241,0.3))",
                margin: "4px 0",
              }}
            />
          </div>
          <div style={{ paddingTop: 6 }}>
            <p
              style={{
                margin: "0 0 2px",
                fontSize: 10,
                fontWeight: 700,
                color: "#f87171",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
              }}
            >
              Current Appointment
            </p>
            <p
              style={{
                margin: "0 0 1px",
                fontSize: 14,
                fontWeight: 700,
                color: "#fca5a5",
              }}
            >
              {origDate}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "rgba(248,113,113,0.7)",
              }}
            >
              {origTime}
            </p>
          </div>
        </div>

        {/* New slot */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(52,211,153,0.12)",
                border: "1.5px solid rgba(52,211,153,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarCheck size={15} color="#34d399" />
            </div>
          </div>
          <div style={{ paddingTop: 6 }}>
            <p
              style={{
                margin: "0 0 2px",
                fontSize: 10,
                fontWeight: 700,
                color: "#34d399",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
              }}
            >
              New Appointment
            </p>
            <p
              style={{
                margin: "0 0 1px",
                fontSize: 14,
                fontWeight: 700,
                color: "#6ee7b7",
              }}
            >
              {newDate}
            </p>
            <p
              style={{ margin: 0, fontSize: 12, color: "rgba(52,211,153,0.7)" }}
            >
              {newTime}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          background: "rgba(99,102,241,0.06)",
          borderTop: "1px solid rgba(99,102,241,0.15)",
          padding: "12px 16px",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onSend("Confirm")}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 12,
              background: "linear-gradient(135deg, #059669, #10b981)",
              color: "#fff",
              boxShadow:
                "0 4px 14px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            ✓ Confirm Reschedule
          </button>
          <button
            onClick={() => onSend("Cancel")}
            style={{
              padding: "9px 16px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
              background: "transparent",
              border: "1px solid rgba(148,163,184,0.2)",
              color: "rgba(148,163,184,0.7)",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── SUCCESS BANNER ───────────────────────────────────────────────────────────
const SuccessBanner: React.FC<{ content: string }> = ({ content }) => {
  const clean = content.replace(/\*\*/g, "").replace(/🎉/g, "").trim();
  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(52,211,153,0.25)",
        background: "#0f0f23",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #064e3b, #065f46, #047857)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -15,
            top: -15,
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: "rgba(52,211,153,0.1)",
          }}
        />
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(52,211,153,0.2)",
            border: "1.5px solid rgba(52,211,153,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
            flexShrink: 0,
          }}
        >
          <CheckCircle size={16} color="#34d399" />
        </div>
        <div style={{ zIndex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              color: "#6ee7b7",
            }}
          >
            Appointment Confirmed! 🎉
          </p>
        </div>
      </div>
      <div
        style={{ padding: "12px 16px", background: "rgba(52,211,153,0.04)" }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => (
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: "rgba(110,231,183,0.9)",
                }}
              >
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong style={{ color: "#6ee7b7", fontWeight: 700 }}>
                {children}
              </strong>
            ),
          }}
        >
          {clean}
        </ReactMarkdown>
      </div>
    </div>
  );
};

// ─── ERROR BANNER ─────────────────────────────────────────────────────────────
const ErrorBanner: React.FC<{ content: string }> = ({ content }) => (
  <div
    style={{
      borderRadius: 14,
      overflow: "hidden",
      border: "1px solid rgba(239,68,68,0.2)",
      background: "#0f0f23",
    }}
  >
    <div
      style={{
        background: "linear-gradient(135deg, #450a0a, #7f1d1d, #991b1b)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "rgba(239,68,68,0.18)",
          border: "1.5px solid rgba(239,68,68,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <AlertCircle size={16} color="#f87171" />
      </div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fca5a5" }}>
        Something went wrong
      </p>
    </div>
    <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.04)" }}>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          lineHeight: 1.7,
          color: "rgba(252,165,165,0.85)",
        }}
      >
        {content.replace(/\*\*/g, "").trim()}
      </p>
    </div>
  </div>
);

// ─── DOCTOR GRID ──────────────────────────────────────────────────────────────
const DoctorGrid: React.FC<{ content: string }> = ({ content }) => {
  // Extract only the content between sentinel tags
  const start = content.indexOf("DOCTORS_LIST_START");
  const end = content.indexOf("DOCTORS_LIST_END");
  const inner = content.slice(start + "DOCTORS_LIST_START".length, end).trim();

  // Extract the follow-up text after DOCTORS_LIST_END
  const followUp = content.slice(end + "DOCTORS_LIST_END".length).trim();

  const lines = inner.split("\n");
  const doctors: { name: string; specialty: string }[] = [];

  lines.forEach((line) => {
    const cleaned = line.replace(/\*\*/g, "").trim();
    const match = cleaned.match(/^-\s*(.+?)\s*—\s*(.+)/);
    if (match) {
      doctors.push({
        name: match[1].trim(),
        specialty: match[2].trim(),
      });
    }
  });

  const headerLine =
    lines
      .find((l) => l.includes("**"))
      ?.replace(/\*\*/g, "")
      .trim() ?? "Available Doctors";

  // rest of your existing DoctorGrid JSX unchanged,
  // just add followUp text below the grid:
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid rgba(99,102,241,0.2)",
          background: "#0f0f23",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e1b4b, #312e81)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "rgba(129,140,248,0.2)",
              border: "1px solid rgba(129,140,248,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Stethoscope size={13} color="#a5b4fc" />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              color: "#e0e7ff",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            {headerLine}
          </p>
        </div>

        {/* Doctor grid */}
        <div
          style={{
            padding: "12px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            background: "#0f0f23",
          }}
        >
          {doctors.map((doc, i) => {
            const palette = avatarPalette[i % avatarPalette.length];
            return (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: palette.bg,
                    color: palette.text,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    boxShadow: `0 0 0 2px ${palette.glow}30`,
                  }}
                >
                  {initials(doc.name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: "0 0 1px",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#e2e8f0",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {doc.name}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      color: "rgba(148,163,184,0.7)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {doc.specialty}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Follow-up question rendered as plain markdown */}
      {followUp && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={MarkdownComponents}
        >
          {followUp}
        </ReactMarkdown>
      )}
    </div>
  );
};

// ─── FAQ CARD ─────────────────────────────────────────────────────────────────
const FaqCard: React.FC<{ content: string }> = ({ content }) => {
  const faqColors = [
    {
      bg: "rgba(99,102,241,0.08)",
      border: "rgba(99,102,241,0.2)",
      icon: "rgba(129,140,248,0.2)",
      iconColor: "#818cf8",
    },
    {
      bg: "rgba(16,185,129,0.06)",
      border: "rgba(16,185,129,0.18)",
      icon: "rgba(52,211,153,0.15)",
      iconColor: "#34d399",
    },
    {
      bg: "rgba(245,158,11,0.06)",
      border: "rgba(245,158,11,0.18)",
      icon: "rgba(251,191,36,0.15)",
      iconColor: "#fbbf24",
    },
    {
      bg: "rgba(236,72,153,0.06)",
      border: "rgba(236,72,153,0.18)",
      icon: "rgba(244,114,182,0.15)",
      iconColor: "#f472b6",
    },
  ];

  const sections: { title: string; body: string }[] = [];
  const lines = content.split("\n");
  let current: { title: string; body: string } | null = null;

  lines.forEach((line) => {
    const boldTitle = line.match(/^\*\*(.+)\*\*\s*$/);
    const emojiTitle = line.match(/^(💡|📍|💰|🕐|📞|ℹ️)\s+\*?\*?(.+?)\*?\*?$/);
    const hashTitle = line.match(/^#{1,3}\s+(.+)/);
    if (boldTitle || emojiTitle || hashTitle) {
      if (current) sections.push(current);
      const title = (boldTitle?.[1] ?? emojiTitle?.[2] ?? hashTitle?.[1] ?? "")
        .replace(/\*\*/g, "")
        .trim();
      current = { title, body: "" };
    } else if (current) {
      current.body += line + "\n";
    }
  });
  if (current) sections.push(current);

  if (sections.length === 0) {
    return (
      <div
        style={{
          padding: "10px 14px",
          background: "#0f0f23",
          borderRadius: 14,
          border: "1px solid rgba(99,102,241,0.2)",
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => (
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: 13,
                  color: "#cbd5e1",
                  lineHeight: 1.65,
                }}
              >
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong style={{ color: "#e0e7ff", fontWeight: 600 }}>
                {children}
              </strong>
            ),
            li: ({ children }) => (
              <li
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: 4,
                  fontSize: 13,
                  color: "#94a3b8",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    marginTop: 6,
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#6366f1",
                    display: "inline-block",
                  }}
                />
                <span>{children}</span>
              </li>
            ),
            ul: ({ children }) => (
              <ul style={{ padding: 0, margin: "4px 0", listStyle: "none" }}>
                {children}
              </ul>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sections.map((sec, i) => {
        const col = faqColors[i % faqColors.length];
        return (
          <div
            key={i}
            style={{
              borderRadius: 13,
              overflow: "hidden",
              border: `1px solid ${col.border}`,
              background: "#0f0f23",
            }}
          >
            <div
              style={{
                background: col.bg,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderBottom: `1px solid ${col.border}`,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: col.icon,
                  border: `1px solid ${col.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: col.iconColor,
                  flexShrink: 0,
                }}
              >
                {faqIcon(sec.title)}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: col.iconColor,
                  letterSpacing: "0.2px",
                }}
              >
                {sec.title}
              </p>
            </div>
            <div style={{ padding: "10px 14px" }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontSize: 12,
                        color: "rgba(148,163,184,0.9)",
                        lineHeight: 1.7,
                      }}
                    >
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ color: "#e2e8f0", fontWeight: 600 }}>
                      {children}
                    </strong>
                  ),
                  table: ({ children }) => (
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {children}
                    </table>
                  ),
                  thead: ({ children }) => <thead>{children}</thead>,
                  th: ({ children }) => (
                    <th
                      style={{
                        padding: "5px 0",
                        textAlign: "left",
                        color: col.iconColor,
                        fontWeight: 600,
                        borderBottom: `1px solid ${col.border}`,
                        fontSize: 11,
                      }}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td
                      style={{
                        padding: "5px 0",
                        color: "rgba(148,163,184,0.85)",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        fontSize: 12,
                      }}
                    >
                      {children}
                    </td>
                  ),
                  tr: ({ children }) => <tr>{children}</tr>,
                  li: ({ children }) => (
                    <li
                      style={{
                        display: "flex",
                        gap: 6,
                        marginBottom: 3,
                        fontSize: 12,
                        color: "rgba(148,163,184,0.85)",
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          marginTop: 5,
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: col.iconColor,
                          display: "inline-block",
                        }}
                      />
                      <span>{children}</span>
                    </li>
                  ),
                  ul: ({ children }) => (
                    <ul
                      style={{ padding: 0, margin: "4px 0", listStyle: "none" }}
                    >
                      {children}
                    </ul>
                  ),
                }}
              >
                {sec.body.trim()}
              </ReactMarkdown>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Smart renderer ───────────────────────────────────────────────────────────
const SmartRenderer: React.FC<{
  content: string;
  onSend: (msg: string) => void;
}> = ({ content, onSend }) => {
  // Scheduler link check MUST come first — it can co-exist with other keywords
  if (hasSchedulerLink(content)) return <BookingLinkCard content={content} />;
  if (isDateTimePicker(content)) return <DateTimePicker onSend={onSend} />;
  if (isSuccessBanner(content)) return <SuccessBanner content={content} />;
  if (isErrorBanner(content)) return <ErrorBanner content={content} />;
  if (isServicesSummary(content))
    return <ServicesSummaryCard content={content} onSend={onSend} />;
  if (isServicesDetail(content))
    return <ServicesDetailCard content={content} />;
  if (isBookingConfirmation(content))
    return <BookingCard content={content} onSend={onSend} />;
  if (isRescheduleConfirmation(content))
    return <RescheduleCard content={content} onSend={onSend} />;
  if (isDoctorList(content)) return <DoctorGrid content={content} />;
  if (isTimings(content)) return <TimingsCard content={content} />;
  if (isFaqAnswer(content)) return <FaqCard content={content} />;
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
      {content}
    </ReactMarkdown>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const AiAgentChat: React.FC<AiAgentChatProps> = ({
  isOpen,
  onClose,
  conversationId,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to **ZEVA Clinic** ✨\n\nI'm KAKA, your appointment agent. I can help you:\n- Book or reschedule an appointment\n- Answer any clinic questions\n\nWhat can I help you with today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [threadId, setThreadId] = useState(() => uuidv4());

  useEffect(() => {
    setThreadId(uuidv4());
    setMessages([
      {
        role: "assistant",
        content:
          "Welcome to **ZEVA Clinic** ✨\n\nI'm KAKA, your appointment agent. I can help you:\n- Book or reschedule an appointment\n- Answer any clinic questions\n\nWhat can I help you with today?",
      },
    ]);
    setInput("");
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 96) + "px";
  }, [input]);
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content:
          "Welcome to **ZEVA Clinic** ✨\n\nI'm KAKA, your appointment agent. I can help you:\n- Book or reschedule an appointment\n- Answer any clinic questions\n\nWhat can I help you with today?",
      },
    ]);
    setInput("");
  }, [conversationId]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await sendMessage(input);
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
          70%  { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
          100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .kaka-msg-in { animation: slideUp 0.25s ease forwards; }
        .kaka-scroll::-webkit-scrollbar { width: 4px; }
        .kaka-scroll::-webkit-scrollbar-track { background: transparent; }
        .kaka-scroll::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 4px; }
        .kaka-quick-btn:hover { background: rgba(99,102,241,0.18) !important; border-color: rgba(99,102,241,0.5) !important; transform: translateY(-1px); }
        .kaka-quick-btn { transition: all 0.15s ease; }
        .kaka-send:hover:not(:disabled) { transform: scale(1.05); }
        .kaka-send { transition: all 0.15s ease; }
      `}</style>

      <div
        style={{
          position: "absolute",
          bottom: 84,
          left: 16,
          zIndex: 50,
          width: "clamp(320px, 90vw, 400px)",
          background: "#080818",
          borderRadius: 22,
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.2), 0 0 80px rgba(99,102,241,0.06)",
          border: "1px solid rgba(99,102,241,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #0d0d2b 0%, #1a1050 40%, #231175 75%, #2d1a8a 100%)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
            borderBottom: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 30,
              top: -30,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "rgba(99,102,241,0.12)",
              filter: "blur(20px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -20,
              bottom: -20,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(139,92,246,0.1)",
              filter: "blur(16px)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              zIndex: 1,
            }}
          >
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background:
                    "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.25))",
                  border: "1.5px solid rgba(129,140,248,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "pulseRing 3s infinite",
                }}
              >
                <Sparkles size={17} color="#a5b4fc" />
              </div>
              <span
                style={{
                  position: "absolute",
                  bottom: 1,
                  right: 1,
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "#4ade80",
                  border: "2px solid #1a1050",
                  display: "block",
                }}
              />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#e0e7ff",
                  letterSpacing: "-0.2px",
                }}
              >
                KAKA
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 10.5,
                  color: "rgba(165,180,252,0.65)",
                  letterSpacing: "0.2px",
                }}
              >
                ZEVA Clinic · AI Agent
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              zIndex: 1,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 9,
              padding: "5px 7px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "rgba(165,180,252,0.8)",
              transition: "background 0.15s",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* ── MESSAGES ── */}
        <div
          className="kaka-scroll"
          style={{
            height: 400,
            overflowY: "auto",
            padding: "14px 12px",
            background: "#080818",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className="kaka-msg-in"
              style={{
                display: "flex",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                alignItems: "flex-end",
                gap: 7,
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                      : "rgba(99,102,241,0.1)",
                  border:
                    msg.role === "assistant"
                      ? "1px solid rgba(99,102,241,0.25)"
                      : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 2,
                }}
              >
                {msg.role === "user" ? (
                  <User size={12} color="#fff" />
                ) : (
                  <Sparkles size={12} color="#818cf8" />
                )}
              </div>

              {/* Bubble */}
              <div
                style={{
                  maxWidth: msg.role === "assistant" ? "90%" : "78%",
                  minWidth: 0,
                  borderRadius:
                    msg.role === "user"
                      ? "16px 4px 16px 16px"
                      : "4px 16px 16px 16px",
                  overflow: "hidden",
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg, #3730a3, #4f46e5, #6366f1)"
                      : "transparent",
                  boxShadow:
                    msg.role === "user"
                      ? "0 4px 16px rgba(79,70,229,0.3), inset 0 1px 0 rgba(255,255,255,0.08)"
                      : "none",
                }}
              >
                {msg.role === "user" ? (
                  <div style={{ padding: "9px 13px" }}>
                    <span
                      style={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "#e0e7ff",
                      }}
                    >
                      {msg.content}
                    </span>
                  </div>
                ) : (
                  <SmartRenderer content={msg.content} onSend={sendMessage} />
                )}
              </div>
            </div>
          ))}

          {/* Typing dots */}
          {isLoading && (
            <div
              className="kaka-msg-in"
              style={{ display: "flex", alignItems: "flex-end", gap: 7 }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Sparkles size={12} color="#818cf8" />
              </div>
              <div
                style={{
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.15)",
                  borderRadius: "4px 16px 16px 16px",
                  padding: "11px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#6366f1",
                      display: "inline-block",
                      animation: `bounce 1.2s ${delay}ms infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── QUICK REPLIES ── */}
        <div
          style={{
            padding: "8px 12px 4px",
            background: "#0a0a1e",
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            borderTop: "1px solid rgba(99,102,241,0.1)",
          }}
        >
          {["📅 Book appointment", "🔄 Reschedule", "❓ Clinic FAQs"].map(
            (label) => (
              <button
                key={label}
                className="kaka-quick-btn"
                onClick={() => setInput(label.replace(/^[^\s]+\s/, ""))}
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: "1px solid rgba(99,102,241,0.25)",
                  background: "rgba(99,102,241,0.08)",
                  color: "#a5b4fc",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {label}
              </button>
            ),
          )}
        </div>

        {/* ── INPUT ── */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "10px 12px 13px",
            background: "#0a0a1e",
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            borderTop: "1px solid rgba(99,102,241,0.1)",
            flexShrink: 0,
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Message KAKA..."
            rows={1}
            style={{
              flex: 1,
              fontSize: 13,
              border: "1.5px solid rgba(99,102,241,0.2)",
              borderRadius: 12,
              padding: "9px 12px",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              color: "#e2e8f0",
              background: "rgba(255,255,255,0.04)",
              lineHeight: 1.5,
              maxHeight: 96,
              overflowY: "auto",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(99,102,241,0.55)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(99,102,241,0.2)")
            }
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="kaka-send"
            style={
              {
                width: 38,
                height: 38,
                borderRadius: 11,
                background:
                  !input.trim() || isLoading
                    ? "rgba(99,102,241,0.08)"
                    : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow:
                  !input.trim() || isLoading
                    ? "none"
                    : "0 4px 14px rgba(99,102,241,0.4)",
                border:
                  !input.trim() || isLoading
                    ? "1px solid rgba(99,102,241,0.15)"
                    : "none",
              } as React.CSSProperties
            }
          >
            <Send
              size={14}
              color={
                !input.trim() || isLoading ? "rgba(99,102,241,0.35)" : "#fff"
              }
            />
          </button>
        </form>
      </div>
    </>
  );
};
export default AiAgentChat;
