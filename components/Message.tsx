"use client";
import { Shield, User, Download, FileText, CheckCircle2 } from "lucide-react";
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

// Inline formatting helper for bold and code blocks
function renderText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.match(/^[\-\*•]\s/)) {
      return (
        <li key={i} className="ml-4 list-disc marker:text-[#5b7c72]">
          {inlineFormat(line.slice(2))}
        </li>
      );
    }
    if (line.match(/^\d+\.\s/)) {
      return (
        <li key={i} className="ml-4 list-decimal marker:text-[#5b7c72]">
          {inlineFormat(line.replace(/^\d+\.\s/, ""))}
        </li>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return <p key={i} className="my-1">{inlineFormat(line)}</p>;
  });
}

function inlineFormat(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-[#5b7c72]">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-[#f1efe9] text-[#5b7c72] px-1.5 py-0.5 rounded-md text-[0.85em] font-mono border border-[#e2ded7]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function Message({ msg, userId, sessionId }: Props) {
  const isUser = msg.role === "user";
  const isTyping = !isUser && !msg.text && (!msg.artifacts || msg.artifacts.length === 0);

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-end my-2 group`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-9 h-9 rounded-full shrink-0 bg-[#5b7c72] flex items-center justify-center text-white shadow-sm mb-1 border border-[#4a665d]/20">
          <Shield size={18} />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        {/* Soft Pill Bubble */}
        <div
          className={`px-5 py-4 text-[15px] leading-relaxed transition-all ${
            isUser
              ? "bg-[#5b7c72] text-[#ffffff] rounded-[24px] rounded-br-[6px] shadow-sm"
              : "bg-[#ffffff] text-[#2c2a29] border border-[#e2ded7] rounded-[24px] rounded-bl-[6px] shadow-[0_4px_20px_rgba(44,42,41,0.04)]"
          }`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1.5 py-2 px-2" aria-label="Dolphin Buddy is typing">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e8a598] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2.5 h-2.5 rounded-full bg-[#e8a598] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2.5 h-2.5 rounded-full bg-[#e8a598] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <div className={`prose max-w-none ${isUser ? "text-white" : "text-[#2c2a29]"}`}>
              {renderText(msg.text)}
            </div>
          )}

          {/* PDF Artifact Guide Media Attachment */}
          {msg.artifacts && msg.artifacts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#e2ded7] flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#5b7c72] uppercase tracking-wider">
                <CheckCircle2 size={14} />
                <span>Generated Document</span>
              </div>
              {msg.artifacts.map((filename) => (
                <a
                  key={filename}
                  href={buildDownloadUrl(userId, sessionId, filename)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link flex items-center justify-between gap-3 px-4 py-3 rounded-[16px] bg-[#f9f8f6] hover:bg-[#f1efe9] text-[#2c2a29] text-sm font-semibold transition-all border border-[#e2ded7] hover:border-[#d1ccc4] shadow-sm"
                  aria-label={`Download document: ${filename}`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-8 h-8 rounded-full bg-[#ffffff] flex items-center justify-center shrink-0 border border-[#e2ded7] shadow-sm group-hover/link:bg-[#5b7c72] group-hover/link:text-white group-hover/link:border-[#5b7c72] transition-colors">
                      <FileText size={14} className={isUser ? "text-white" : "text-[#5b7c72] group-hover/link:text-white"} />
                    </div>
                    <span className="truncate">{filename}</span>
                  </div>
                  <Download size={16} className="text-[#9e9a95] shrink-0 group-hover/link:text-[#5b7c72]" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] font-bold text-[#9e9a95] mt-1.5 px-2 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
          {isUser ? "Sent" : "Dolphin Buddy"}
        </span>
      </div>
    </div>
  );
}
