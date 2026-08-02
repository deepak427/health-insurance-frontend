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
    <div
      className="px-4 py-3 border-t"
      style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
    >
      {/* File preview */}
      {file && (
        <div
          className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg text-xs"
          style={{ background: "var(--bg-card2)", color: "var(--text-muted)" }}
        >
          <FileText size={13} style={{ color: "var(--accent2)" }} />
          <span className="truncate flex-1">{file.name}</span>
          <button onClick={() => setFile(null)} className="hover:opacity-70">
            <X size={13} />
          </button>
        </div>
      )}

      <div
        className="flex items-end gap-2 rounded-xl px-3 py-2"
        style={{ background: "var(--bg-card2)", border: "1px solid var(--border)" }}
      >
        {/* Attach */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="mb-1 p-1 rounded-md transition-all hover:opacity-70 disabled:opacity-30"
          style={{ color: "var(--text-muted)" }}
          title="Attach PDF"
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
          placeholder="Ask about insurance, upload a policy PDF…"
          className="flex-1 resize-none bg-transparent text-sm outline-none py-1 disabled:opacity-50"
          style={{ color: "var(--text)", maxHeight: "140px" }}
        />

        {/* Send */}
        <button
          onClick={submit}
          disabled={disabled || (!text.trim() && !file)}
          className="mb-1 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30"
          style={{ background: "var(--accent)" }}
        >
          <Send size={15} className="text-white" />
        </button>
      </div>

      <p className="text-center text-xs mt-2" style={{ color: "var(--text-muted)" }}>
        AI responses are for informational purposes only — consult a professional for legal/medical advice.
      </p>
    </div>
  );
}
