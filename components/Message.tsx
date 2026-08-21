"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, FileText } from "lucide-react";
import { buildDownloadUrl, isAgentGeneratedArtifact } from "@/lib/api";
import PolicyCards, { PolicyCardData, BookingCards, BookingsTable, BookingCardData, BookingTableRow } from "./PolicyCards";

export interface Msg {
  role: "user" | "agent";
  text: string;
  artifacts?: string[];
  userAttachment?: { name: string; mimeType: string; data?: string }; // user-uploaded file
}

interface Props {
  msg: Msg;
  userId: string;
  sessionId: string;
  onSend?: (text: string) => void;
}

interface ParsedContent {
  displayText: string;
  cards: PolicyCardData[];
  bookingCards: BookingCardData[];
  bookingTable: BookingTableRow[] | null;
}

// Parses all card markers out of agent text and returns displayText + typed card arrays.
function parseContent(raw: string): ParsedContent {
  const cards: PolicyCardData[] = [];
  const bookingCards: BookingCardData[] = [];
  let bookingTable: BookingTableRow[] | null = null;

  const displayText = raw
    .replace(/<!--(?:POLICY|ADDON|VAS)_CARDS:([\s\S]*?)-->/g, (_, json) => {
      try {
        const parsed = JSON.parse(json.trim());
        const arr: PolicyCardData[] = Array.isArray(parsed) ? parsed : [parsed];
        cards.push(...arr);
      } catch {}
      return "";
    })
    .replace(/<!--BOOKING_CARDS:([\s\S]*?)-->/g, (_, json) => {
      try {
        const parsed = JSON.parse(json.trim());
        const arr: BookingCardData[] = Array.isArray(parsed) ? parsed : [parsed];
        bookingCards.push(...arr);
      } catch {}
      return "";
    })
    .replace(/<!--BOOKING_TABLE:([\s\S]*?)-->/g, (_, json) => {
      try {
        const parsed = JSON.parse(json.trim());
        bookingTable = Array.isArray(parsed) ? parsed : [parsed];
      } catch {}
      return "";
    })
    .trim();

  return { displayText, cards, bookingCards, bookingTable };
}

export default function Message({ msg, userId, sessionId, onSend }: Props) {
  const isUser = msg.role === "user";
  const isTyping = !isUser && !msg.text && (!msg.artifacts || msg.artifacts.length === 0);

  // For user messages: strip the 📎 attachment line and extract the filename
  const userAttachmentName = isUser
    ? (msg.text.match(/\n?📎 (.+)$/) ?? [])[1] ?? msg.userAttachment?.name ?? null
    : null;
  const userDisplayText = isUser && userAttachmentName
    ? msg.text.replace(/\n?📎 .+$/, "").trim()
    : msg.text;

  const { displayText, cards, bookingCards, bookingTable } = isUser
    ? { displayText: userDisplayText, cards: [], bookingCards: [], bookingTable: null }
    : parseContent(msg.text);

  const hasExtraContent = cards.length > 0 || bookingCards.length > 0 || bookingTable !== null;

  // Build openable URL for user-uploaded attachment
  // Images: use blob URL from inline data (avoids about:blank#blocked with data: URLs)
  // PDFs: use backend artifact endpoint (agent saves them)
  // History reconstructed messages: no data available, skip the chip
  const attachmentData = msg.userAttachment?.data;
  let attachmentMime = msg.userAttachment?.mimeType ?? "";
  if (!attachmentMime || attachmentMime === "application/octet-stream") {
    const ext = userAttachmentName?.split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(ext)) {
      attachmentMime = `image/${ext === "jpg" ? "jpeg" : ext}`;
    } else if (ext === "pdf") {
      attachmentMime = "application/pdf";
    }
  }
  const attachmentIsImage = attachmentMime.startsWith("image/");

  // Always show attachment chip when userAttachmentName exists
  const showAttachmentChip = !!userAttachmentName;

  return (
    <div className={`flex items-end gap-2 my-1 w-full ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Left Avatar for Incoming message (like WhatsApp RH circle) */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#8ecae6] text-[#023e8a] flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs mb-0.5">
          DO
        </div>
      )}

      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`} style={{ maxWidth: hasExtraContent ? "85%" : "65%" }}>
        {/* WhatsApp Message Bubble */}
        <div
          className={`relative px-3.5 pt-2 pb-1.5 text-[14.5px] leading-relaxed shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
            isUser
              ? "bg-[#d9fdd3] text-[#111b21] rounded-lg rounded-tr-none ml-4"
              : "bg-white text-[#111b21] rounded-lg rounded-tl-none border border-[#e9edef]/40"
          }`}
          style={{ wordBreak: "break-word" }}
        >
          {/* Author Name for Incoming Agent/Bot message in WhatsApp Blue */}
          {!isUser && (
            <div className="flex items-center gap-1.5 mb-1 select-none">
              <span className="text-[13px] font-bold text-[#027eb5]">Dolphin Operations</span>
              <span className="text-[9px] font-bold text-[#667781] bg-[#f0f2f5] px-1.5 py-0.2 rounded">BOT</span>
            </div>
          )}

          {isTyping ? (
            <div className="flex items-center gap-1.5 py-1.5 px-1">
              <span className="w-2 h-2 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <>
              {/* Text content (with marker stripped) */}
              {displayText && (
                <div className="agent-prose">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="agent-h1">{children}</h1>,
                      h2: ({ children }) => <h2 className="agent-h2">{children}</h2>,
                      h3: ({ children }) => <h3 className="agent-h3">{children}</h3>,
                      h4: ({ children }) => <h4 className="agent-h4">{children}</h4>,
                      p: ({ children }) => <p className="agent-p">{children}</p>,
                      ul: ({ children }) => <ul className="agent-ul">{children}</ul>,
                      ol: ({ children }) => <ol className="agent-ol">{children}</ol>,
                      li: ({ children }) => <li className="agent-li">{children}</li>,
                      strong: ({ children }) => <strong className="agent-strong">{children}</strong>,
                      em: ({ children }) => <em className="agent-em">{children}</em>,
                      code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
                        inline ? (
                          <code className="agent-code-inline">{children}</code>
                        ) : (
                          <pre className="agent-pre"><code>{children}</code></pre>
                        ),
                      blockquote: ({ children }) => <blockquote className="agent-blockquote">{children}</blockquote>,
                      hr: () => <hr className="agent-hr" />,
                      table: ({ children }) => (
                        <div className="agent-table-wrapper">
                          <table className="agent-table">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => <thead className="agent-thead">{children}</thead>,
                      tbody: ({ children }) => <tbody>{children}</tbody>,
                      tr: ({ children }) => <tr className="agent-tr">{children}</tr>,
                      th: ({ children }) => <th className="agent-th">{children}</th>,
                      td: ({ children }) => <td className="agent-td">{children}</td>,
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="agent-link">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {displayText}
                  </ReactMarkdown>
                </div>
              )}
            </>
          )}

          {/* Artifacts (Agent-Generated PDF Downloads) */}
          {!isUser && msg.artifacts && msg.artifacts.filter(isAgentGeneratedArtifact).length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-black/5 flex flex-col gap-2">
              {msg.artifacts.filter(isAgentGeneratedArtifact).map((filename) => (
                <div key={filename} className="flex items-center gap-3 bg-[#f0f2f5] p-2.5 rounded-lg border border-[#e9edef] max-w-[280px]">
                  <div className="w-9 h-9 bg-red-100 rounded flex items-center justify-center text-red-600 shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#111b21] truncate">{filename}</p>
                    <p className="text-[11px] text-[#667781]">PDF Certificate</p>
                  </div>
                  <a
                    href={buildDownloadUrl(userId, sessionId, filename)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center text-[#54656f] hover:text-[#008069] hover:bg-white rounded transition-colors"
                    aria-label={`Download ${filename}`}
                  >
                    <Download size={16} />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* User-uploaded attachment chip */}
          {isUser && showAttachmentChip && (
            <div className="mt-2 pt-1.5 border-t border-black/5">
              {attachmentIsImage ? (
                // Render image inline
                <div className="rounded-lg overflow-hidden border border-black/10 bg-white" style={{ maxWidth: 260 }}>
                  <img
                    src={
                      attachmentData
                        ? `data:${attachmentMime};base64,${attachmentData}`
                        : buildDownloadUrl(userId, sessionId, userAttachmentName!)
                    }
                    alt={userAttachmentName ?? "attachment"}
                    className="w-full h-auto object-contain block bg-white"
                    style={{ maxHeight: 200 }}
                  />
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-[#f0f2f5] border-t border-[#e9edef]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText size={13} className="text-[#667781] shrink-0" />
                      <p className="text-xs text-[#111b21] font-medium truncate">{userAttachmentName}</p>
                    </div>
                    <a
                      href={buildDownloadUrl(userId, sessionId, userAttachmentName!)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#667781] hover:text-[#008069]"
                      aria-label="Download image"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                </div>
              ) : (
                // PDF / other document
                <a
                  href={buildDownloadUrl(userId, sessionId, userAttachmentName!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/80 border border-black/10 hover:bg-white transition-colors shadow-2xs max-w-[260px]"
                >
                  <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center text-red-600 shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#111b21] truncate">{userAttachmentName}</p>
                    <p className="text-[10px] text-[#667781]">Attached Document</p>
                  </div>
                  <Download size={14} className="text-[#667781] shrink-0" />
                </a>
              )}
            </div>
          )}

          {/* Timestamp & Checks */}
          <div className="flex items-center justify-end gap-1 mt-1 select-none">
            <span className="text-[11px] text-[#667781]">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isUser && (
              <svg viewBox="0 0 18 11" width="16" height="11" className="text-[#53bdeb]">
                <path fill="currentColor" d="M17.394 .57 6.23 11.733l-5.624-5.625 1.414-1.414 4.21 4.21L15.98-.844z"/>
                <path fill="currentColor" d="M11.394 .57.23 11.733l1.414 1.414L12.808 1.984z" opacity=".4"/>
              </svg>
            )}
          </div>
        </div>

        {/* Policy Cards — outside the bubble, side by side */}
        {cards.length > 0 && (
          <div className="mt-2 flex flex-row gap-3 flex-wrap">
            <PolicyCards
              cards={cards}
              onChoose={onSend ?? (() => {})}
            />
          </div>
        )}

        {/* Booking History Cards */}
        {bookingCards.length > 0 && (
          <div className="mt-2 flex flex-row gap-3 flex-wrap">
            <BookingCards
              bookings={bookingCards}
              onChoose={onSend ?? (() => {})}
            />
          </div>
        )}

        {/* Bookings Table with Excel export */}
        {bookingTable && (
          <div className="mt-2 w-full">
            <BookingsTable rows={bookingTable} />
          </div>
        )}
      </div>
    </div>
  );
}
