"use client";
import { ShieldPlus, User, Download, FileText } from "lucide-react";
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

// Very light markdown-ish renderer (bold, bullets, newlines)
function renderText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // bullet
    if (line.match(/^[\-\*•]\s/)) {
      return (
        <li key={i} className="ml-4 list-disc">
          {inlineFormat(line.slice(2))}
        </li>
      );
    }
    // numbered
    if (line.match(/^\d+\.\s/)) {
      return (
        <li key={i} className="ml-4 list-decimal">
          {inlineFormat(line.replace(/^\d+\.\s/, ""))}
        </li>
      );
    }
    if (line.trim() === "") return <br key={i} />;
    return <p key={i}>{inlineFormat(line)}</p>;
  });
}

function inlineFormat(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function Message({ msg, userId, sessionId }: Props) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-start`}>
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white mt-0.5"
        style={{ background: isUser ? "#4f46e5" : "var(--bg-card2)" }}
      >
        {isUser ? <User size={15} /> : <ShieldPlus size={15} style={{ color: "var(--accent2)" }} />}
      </div>

      {/* Bubble */}
      <div
        className="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed prose"
        style={{
          background: isUser ? "var(--user-bubble)" : "var(--agent-bubble)",
          color: "var(--text)",
          borderTopRightRadius: isUser ? "4px" : undefined,
          borderTopLeftRadius: !isUser ? "4px" : undefined,
          border: "1px solid var(--border)",
        }}
      >
        <div>{renderText(msg.text)}</div>

        {/* Artifact download buttons */}
        {msg.artifacts && msg.artifacts.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {msg.artifacts.map((filename) => (
              <a
                key={filename}
                href={buildDownloadUrl(userId, sessionId, filename)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                style={{ background: "var(--accent)", color: "#fff", textDecoration: "none" }}
              >
                <FileText size={13} />
                <span>{filename}</span>
                <Download size={13} className="ml-auto" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
