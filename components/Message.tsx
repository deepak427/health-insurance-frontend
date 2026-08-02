"use client";
import { Download, FileText, CheckCircle2 } from "lucide-react";
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

function renderText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.match(/^[\-\*•]\s/)) {
      return <li key={i} className="ml-4 list-disc">{inlineFormat(line.slice(2))}</li>;
    }
    if (line.match(/^\d+\.\s/)) {
      return <li key={i} className="ml-4 list-decimal">{inlineFormat(line.replace(/^\d+\.\s/, ""))}</li>;
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
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
      return <code key={i} className="bg-black/5 px-1 rounded font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function Message({ msg, userId, sessionId }: Props) {
  const isUser = msg.role === "user";
  const isTyping = !isUser && !msg.text && (!msg.artifacts || msg.artifacts.length === 0);

  return (
    <div className={`flex gap-3 my-3 w-full ${isUser ? "justify-end" : "justify-start"}`}>
      
      {/* Agent Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-100 shrink-0 flex items-center justify-center overflow-hidden border border-[#e5e7eb]">
          {/* using generic operations team headset avatar style */}
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
            <div className="prose max-w-none text-[#1f2937]">
              {renderText(msg.text)}
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

          {/* Timestamp inline bottom right */}
          <div className={`text-[9px] text-right mt-1 ${isUser ? "text-emerald-800/60" : "text-[#9ca3af]"}`}>
            {isUser ? "Just now • " : ""} 
            <span className={isUser ? "text-emerald-600" : ""}>{isUser ? "✓✓" : "Just now"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
