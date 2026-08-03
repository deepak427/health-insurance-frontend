"use client";
import { useRef, useState, KeyboardEvent } from "react";
import { Send, Paperclip, X, FileText } from "lucide-react";

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
    <div className="px-6 py-4 bg-white border-t border-[#e5e7eb]">
      <div className="flex flex-col gap-2">
        {/* File Preview Badge */}
        {file && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-100 text-[#1f2937] border border-[#e5e7eb] self-start text-xs shadow-sm">
            <FileText size={14} className="text-red-500" />
            <span className="truncate max-w-xs">{file.name}</span>
            <button
              onClick={() => setFile(null)}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-[#6b7280]"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-end gap-2 px-1">
          {/* Attach Button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="w-8 h-8 shrink-0 rounded flex items-center justify-center text-[#9ca3af] hover:text-[#6b7280] transition-colors disabled:opacity-50 mb-1"
          >
            <Paperclip size={20} />
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
            placeholder="Type a travel insurance message..."
            className="flex-1 resize-none bg-transparent text-sm font-light text-[#1f2937] placeholder-[#9ca3af] outline-none py-2 px-2 disabled:opacity-50 min-h-[36px]"
            style={{ maxHeight: "120px" }}
          />

          {/* Send Button */}
          <button
            onClick={submit}
            disabled={disabled || (!text.trim() && !file)}
            className="w-8 h-8 shrink-0 rounded bg-[#00a86b] hover:bg-[#008f5a] text-white flex items-center justify-center transition-colors disabled:opacity-50 mb-1"
          >
            <Send size={14} className="-ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
