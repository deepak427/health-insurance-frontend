"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, FileText } from "lucide-react";
import { buildDownloadUrl } from "@/lib/api";
import PolicyCards, { PolicyCardData } from "./PolicyCards";

export interface Msg {
  role: "user" | "agent";
  text: string;
  artifacts?: string[];
}

interface Props {
  msg: Msg;
  userId: string;
  sessionId: string;
  onSend?: (text: string) => void;
}

// Parses <!--POLICY_CARDS:[...]-->  out of agent text.
// Returns { displayText, cards } — displayText has the marker stripped.
function parsePolicyCards(raw: string): { displayText: string; cards: PolicyCardData[] } {
  const RE = /<!--POLICY_CARDS:([\s\S]*?)-->/g;
  const cards: PolicyCardData[] = [];
  const displayText = raw.replace(RE, (_, json) => {
    try {
      const parsed = JSON.parse(json.trim());
      const arr: PolicyCardData[] = Array.isArray(parsed) ? parsed : [parsed];
      cards.push(...arr);
    } catch {}
    return ""; // strip the marker from visible text
  }).trim();
  return { displayText, cards };
}

export default function Message({ msg, userId, sessionId, onSend }: Props) {
  const isUser = msg.role === "user";
  const isTyping = !isUser && !msg.text && (!msg.artifacts || msg.artifacts.length === 0);

  const { displayText, cards } = isUser
    ? { displayText: msg.text, cards: [] }
    : parsePolicyCards(msg.text);

  return (
    <div className={`flex gap-2 my-1.5 w-full ${isUser ? "justify-end" : "justify-start"}`}>

      {/* Agent Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#00a86b] shrink-0 flex items-center justify-center overflow-hidden mt-1">
          <span className="text-sm">🎧</span>
        </div>
      )}

      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`} style={{ maxWidth: cards.length > 0 ? "90%" : "75%" }}>
        {/* Author Label */}
        {!isUser && (
          <span className="text-xs font-semibold text-[#00a86b] mb-1 ml-1">Operations Team</span>
        )}

        {/* Bubble — text only, no cards inside */}
        <div
          className={`px-3 py-2 text-sm relative ${
            isUser
              ? "bg-[#dcf8c6] text-[#1f2937] rounded-[10px] rounded-tr-[2px] shadow-sm"
              : "bg-white text-[#1f2937] rounded-[10px] rounded-tl-[2px] shadow-sm"
          }`}
          style={{ wordBreak: "break-word", maxWidth: cards.length > 0 ? "100%" : undefined }}
        >
          {isTyping ? (
            <div className="flex items-center gap-1.5 py-1 px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
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

          {/* Artifacts (PDF Downloads) */}
          {msg.artifacts && msg.artifacts.length > 0 && (
            <div className="mt-3 pt-3 border-t border-black/5 flex flex-col gap-2">
              {msg.artifacts.map((filename) => (
                <div key={filename} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center text-red-600 shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1f2937] truncate">{filename}</p>
                    <p className="text-[10px] text-[#6b7280]">PDF Document</p>
                  </div>
                  <a
                    href={buildDownloadUrl(userId, sessionId, filename)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center text-[#6b7280] hover:bg-gray-100 rounded"
                    aria-label={`Download ${filename}`}
                  >
                    <Download size={16} />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className={`text-[10px] ${isUser ? "text-[#667781]" : "text-[#adb5bd]"}`}>
              Just now
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
      </div>
    </div>
  );
}
