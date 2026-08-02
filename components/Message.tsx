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
        <li key={i} className="ml-4 list-disc">
          {inlineFormat(line.slice(2))}
        </li>
      );
    }
    if (line.match(/^\d+\.\s/)) {
      return (
        <li key={i} className="ml-4 list-decimal">
          {inlineFormat(line.replace(/^\d+\.\s/, ""))}
        </li>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
    return <p key={i} className="my-0.5">{inlineFormat(line)}</p>;
  });
}

function inlineFormat(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-black/20 px-1.5 py-0.5 rounded text-xs font-mono">
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
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"} items-end my-1.5 group`}>
      {/* Avatar (Instagram DM style) */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs mb-1">
          <Shield size={16} />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        {/* Instagram DM Pill Bubble */}
        <div
          className={`px-4 py-3 text-sm leading-relaxed shadow-2xs transition-all ${
            isUser
              ? "bg-gradient-to-r from-emerald-700 to-teal-600 text-white rounded-[22px] rounded-br-[4px]"
              : "bg-stone-800 text-stone-100 border border-stone-700/80 rounded-[22px] rounded-bl-[4px]"
          }`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1.5 py-1.5 px-1" aria-label="Dolphin Buddy is typing">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <div className="prose max-w-none text-stone-100">{renderText(msg.text)}</div>
          )}

          {/* PDF Artifact Guide Media Attachment (Instagram Shared Link Card Style) */}
          {msg.artifacts && msg.artifacts.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-white/15 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                <CheckCircle2 size={14} />
                <span>Generated Document</span>
              </div>
              {msg.artifacts.map((filename) => (
                <a
                  key={filename}
                  href={buildDownloadUrl(userId, sessionId, filename)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-black/25 hover:bg-black/40 text-white text-xs font-semibold transition-all border border-white/10"
                  aria-label={`Download document: ${filename}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={16} className="text-emerald-300 shrink-0" />
                    <span className="truncate">{filename}</span>
                  </div>
                  <Download size={15} className="text-emerald-300 shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] font-medium text-stone-400 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isUser ? "Sent" : "Dolphin Buddy"}
        </span>
      </div>
    </div>
  );
}
