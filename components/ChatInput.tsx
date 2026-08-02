"use client";
import { useRef, useState, KeyboardEvent } from "react";
import { Send, X, FileText, Plus } from "lucide-react";

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
    <div className="px-4 py-4 sm:py-5 border-t border-[#e2ded7] bg-[#f9f8f6]">
      <div className="max-w-3xl mx-auto flex flex-col gap-2.5">
        {/* File Preview Badge */}
        {file && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-[16px] bg-[#ffffff] text-[#5b7c72] border border-[#e2ded7] self-start text-xs font-bold shadow-sm animate-in fade-in">
            <FileText size={15} className="text-[#e8a598]" />
            <span className="truncate max-w-xs">{file.name}</span>
            <button
              onClick={() => setFile(null)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#f1efe9] text-[#9e9a95]"
              aria-label="Remove attached file"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-end gap-2 bg-[#ffffff] rounded-[24px] px-2.5 py-2.5 border border-[#e2ded7] focus-within:border-[#5b7c72] shadow-sm transition-all focus-within:shadow-md">
          {/* Attach Button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="w-10 h-10 shrink-0 rounded-full bg-[#f1efe9] hover:bg-[#e2ded7] text-[#5b7c72] flex items-center justify-center transition-all disabled:opacity-30"
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
            className="flex-1 resize-none bg-transparent text-[15px] font-medium text-[#2c2a29] placeholder-[#9e9a95] outline-none py-2.5 px-3 disabled:opacity-50 min-h-[44px]"
            style={{ maxHeight: "120px" }}
          />

          {/* Send Button */}
          <button
            onClick={submit}
            disabled={disabled || (!text.trim() && !file)}
            className="w-10 h-10 shrink-0 rounded-full bg-[#5b7c72] hover:bg-[#4a665d] text-[#ffffff] flex items-center justify-center transition-all disabled:opacity-30 shadow-sm"
            aria-label="Send message"
          >
            <Send size={16} className="-ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
