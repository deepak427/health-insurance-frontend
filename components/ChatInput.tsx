"use client";
import { useRef, useState, KeyboardEvent } from "react";
import { Send, Paperclip, X, FileText, Sparkles, Plus } from "lucide-react";

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

    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressedUrl = canvas.toDataURL("image/jpeg", 0.85);
            const base64 = compressedUrl.split(",")[1];
            setFile({ name: f.name.replace(/\.[^/.]+$/, ".jpg"), mimeType: "image/jpeg", data: base64 });
            return;
          }
          const base64 = (ev.target?.result as string).split(",")[1];
          setFile({ name: f.name, mimeType: f.type, data: base64 });
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(f);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setFile({ name: f.name, mimeType: f.type, data: base64 });
      };
      reader.readAsDataURL(f);
    }
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
    <div className="px-4 py-2.5 bg-[#f0f2f5] border-t border-[#e9edef]">
      <div className="flex flex-col gap-2">
        {/* File Preview Badge */}
        {file && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-[#111b21] border border-[#e9edef] self-start text-xs shadow-xs">
            <FileText size={15} className="text-[#008069]" />
            <span className="truncate max-w-xs font-semibold">{file.name}</span>
            <button
              onClick={() => setFile(null)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-gray-200 text-[#667781] cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* WhatsApp Input Bar */}
        <div className="flex items-center gap-2">
          {/* Plus / Attach Button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-[#54656f] hover:text-[#111b21] hover:bg-black/5 transition-colors disabled:opacity-50 cursor-pointer"
            title="Attach documents or images"
          >
            <Plus size={22} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Emoji Button */}
          <button
            disabled={disabled}
            onClick={() => { setText(t => t + " 👍"); textareaRef.current?.focus(); }}
            className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-[#54656f] hover:text-[#111b21] hover:bg-black/5 transition-colors disabled:opacity-50 cursor-pointer"
            title="Emojis"
          >
            <span className="text-xl leading-none">😀</span>
          </button>

          {/* Input Box */}
          <div className="flex-1 flex items-center bg-white rounded-lg px-3.5 py-1 shadow-2xs border border-transparent focus-within:border-[#00a884]/30">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKey}
              disabled={disabled}
              placeholder="Type a message"
              className="w-full resize-none bg-transparent text-[15px] text-[#111b21] placeholder-[#54656f] outline-none py-1.5 disabled:opacity-50 min-h-[28px]"
              style={{ maxHeight: "120px" }}
            />
          </div>

          {/* WhatsApp Send Button or Mic Icon */}
          {text.trim() || file ? (
            <button
              onClick={submit}
              disabled={disabled}
              className="w-10 h-10 shrink-0 rounded-full bg-[#008069] hover:bg-[#00a884] text-white flex items-center justify-center transition-all disabled:opacity-40 shadow-xs cursor-pointer"
              title="Send Message"
            >
              <Send size={18} className="-ml-0.5" />
            </button>
          ) : (
            <button
              disabled={disabled}
              onClick={() => { setText("Check my current travel insurance policy"); textareaRef.current?.focus(); }}
              className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-[#54656f] hover:text-[#111b21] hover:bg-black/5 transition-colors cursor-pointer"
              title="Voice message / Quick prompt"
            >
              {/* WhatsApp Microphone SVG */}
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
