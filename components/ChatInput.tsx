"use client";
import { useRef, useState, KeyboardEvent } from "react";
import { Send, Paperclip, X, FileText, Plus } from "lucide-react";

interface Props {
  onSend: (text: string, file?: { mimeType: string; data: string; name: string }) => void;
  disabled?: boolean;
}

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
    onSend(trimmed || "Analyze this document", file ?? undefined);
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
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  }

  return (
    <div className="px-3 sm:px-4 py-3 border-t border-stone-800 bg-stone-900">
      <div className="max-w-3xl mx-auto flex flex-col gap-2">
        {/* File Preview Badge */}
        {file && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 text-emerald-200 border border-emerald-700/60 self-start text-xs font-semibold animate-in fade-in">
            <FileText size={14} className="text-emerald-400" />
            <span className="truncate max-w-xs">{file.name}</span>
            <button
              onClick={() => setFile(null)}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-stone-300"
              aria-label="Remove attached file"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Instagram DM Pill Input Bar */}
        <div className="flex items-end gap-2 bg-stone-800 rounded-full px-2 py-1.5 border border-stone-700/80 focus-within:border-emerald-500/60 shadow-md">
          {/* Attach Button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="w-10 h-10 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all disabled:opacity-30"
            aria-label="Attach policy document"
            title="Attach policy document (PDF or image)"
          >
            <Plus size={20} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={handleFileChange}
            aria-label="File input"
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKey}
            disabled={disabled}
            placeholder="Message Dolphin Buddy..."
            aria-label="Message prompt"
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder-stone-400 outline-none py-2.5 px-2 disabled:opacity-50 min-h-[40px]"
            style={{ maxHeight: "120px" }}
          />

          {/* Send Button */}
          <button
            onClick={submit}
            disabled={disabled || (!text.trim() && !file)}
            className="w-10 h-10 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all disabled:opacity-30"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
