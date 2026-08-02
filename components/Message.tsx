"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, FileText } from "lucide-react";
import { buildDownloadUrl } from "@/lib/api";

export interface Msg {
  role: "user" | "agent";
  text: string;
  artifacts?: string[];
}

interface Props {
  msg: Msg;
  userId: string;
  sessionId: string;
}

export default function Message({ msg, userId, sessionId }: Props) {
  const isUser = msg.role === "user";
  const isTyping = !isUser && !msg.text && (!msg.artifacts || msg.artifacts.length === 0);

  return (
    <div className={`flex gap-3 my-3 w-full ${isUser ? "justify-end" : "justify-start"}`}>

      {/* Agent Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-100 shrink-0 flex items-center justify-center overflow-hidden border border-[#e5e7eb]">
          <span className="text-sm">🎧</span>
        </div>
      )}

      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
        {/* Author Label */}
        {!isUser && (
          <span className="text-xs font-bold text-[#0369a1] mb-1 pl-1">Operations Team</span>
        )}

        {/* Bubble */}
        <div
          className={`px-4 py-3 text-sm relative ${
            isUser
              ? "bg-[#dcf8c6] text-[#1f2937] rounded-lg rounded-tr-none"
              : "bg-white text-[#1f2937] rounded-lg rounded-tl-none border border-[#e5e7eb] shadow-sm"
          }`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1.5 py-1 px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
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
                {msg.text}
              </ReactMarkdown>
            </div>
          )}

          {/* Artifacts (PDF Guides) */}
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
          <div className={`text-[9px] text-right mt-1 ${isUser ? "text-emerald-800/60" : "text-[#9ca3af]"}`}>
            {isUser ? "Just now • " : ""}
            <span className={isUser ? "text-emerald-600" : ""}>{isUser ? "✓✓" : "Just now"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
