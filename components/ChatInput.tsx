"use client";
import { useRef, useState, KeyboardEvent } from "react";
import { Send, Paperclip, X, FileText, Sparkles } from "lucide-react";

interface Props {
  onSend: (text: string, file?: { mimeType: string; data: string; name: string }) => void;
  disabled?: boolean;
}

/** Guess a human-friendly document type from filename */
function _docLabel(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("passport")) return "passport";
  if (lower.includes("aadhaar") || lower.includes("aadhar")) return "Aadhaar card";
  if (lower.includes("pan")) return "PAN card";
  if (lower.includes("visa")) return "visa document";
  if (lower.includes("ticket") || lower.includes("boarding")) return "boarding pass";
  if (lower.endsWith(".pdf")) return "PDF document";
  return "document";
}

const QUICK_PROMPTS = [
  "Compare travel insurance plans for Europe",
  "How do I file an emergency medical claim?",
  "Show me add-ons for adventure sports",
  "View my current policy status",
];

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<{ name: string; mimeType: string; data: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setFile({ name: f.name, mimeType: f.type, data: base64 });
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  function submit() {
    const trimmed = text.trim();
    if (!trimmed && !file) return;
    const fallback = file
      ? `Here is my ${_docLabel(file.name)}`
      : "";
    onSend(trimmed || fallback, file ?? undefined);
    setText("");
    setFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  return (
    <div className="px-4 md:px-6 py-3 bg-white border-t border-[#e5e7eb]">
      <div className="flex flex-col gap-2">
        {/* File Preview Badge */}
        {file && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#f3f4f6] text-[#111827] border border-[#e5e7eb] self-start text-xs shadow-2xs">
            <FileText size={13} className="text-[#ff5722]" />
            <span className="truncate max-w-xs font-semibold">{file.name}</span>
            <button
              onClick={() => setFile(null)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-gray-200 text-[#6b7280]"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-end gap-2 p-1.5 bg-[#f9fafb] border border-[#d1d5db] focus-within:border-[#ff5722] focus-within:ring-1 focus-within:ring-[#ff5722] rounded-2xl transition-all">
          {/* Attach Button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] hover:bg-white transition-colors disabled:opacity-50 mb-0.5"
            title="Upload Document / PDF / Image"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKey}
            disabled={disabled}
            placeholder="Type your insurance message or query..."
            className="flex-1 resize-none bg-transparent text-xs sm:text-sm text-[#111827] placeholder-[#9ca3af] outline-none py-2 px-1 disabled:opacity-50 min-h-[34px]"
            style={{ maxHeight: "120px" }}
          />

          {/* Send Button */}
          <button
            onClick={submit}
            disabled={disabled || (!text.trim() && !file)}
            className="w-8 h-8 shrink-0 rounded-xl bg-[#ff5722] hover:bg-[#f4511e] text-white flex items-center justify-center transition-colors disabled:opacity-40 mb-0.5 shadow-sm"
            title="Send Message"
          >
            <Send size={14} className="-ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
