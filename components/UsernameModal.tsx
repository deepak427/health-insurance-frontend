"use client";

import { useState } from "react";
import { Shield, ArrowRight, CheckCircle2 } from "lucide-react";

interface Props {
  onSubmit: (username: string) => void;
}

export default function UsernameModal({ onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function validate(v: string): string {
    if (!v.trim()) return "Username is required.";
    if (v.length < 3) return "At least 3 characters.";
    if (v.length > 24) return "Max 24 characters.";
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return "Only letters, numbers, and underscores.";
    return "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(value.trim());
    if (err) { setError(err); return; }
    onSubmit(value.trim().toLowerCase());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2937]/50 backdrop-blur-sm px-4">
      <div
        className="bg-white rounded-[24px] shadow-2xl w-full max-w-[380px] p-8 flex flex-col items-center border border-[#e5e7eb]"
        style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.08)" }}
      >
        {/* Avatar — matches Sidebar/WelcomeScreen */}
        <div className="relative mb-5">
          <div className="w-[72px] h-[72px] rounded-full bg-[#00a86b] flex items-center justify-center text-white shadow-sm border-4 border-white">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.984 8.783c-1.332-1.936-3.792-3.14-6.425-3.14-1.295 0-2.527.31-3.626.866.52-2.316 2.584-4.062 5.067-4.062 2.85 0 5.161 2.31 5.161 5.16 0 .438-.057.863-.163 1.267a5.122 5.122 0 0 1-.014-.091zm9.324 7.64c-.958-3.325-3.418-5.748-6.685-6.683-.81-.233-1.666-.363-2.545-.38l-1.077-.021c.542.484 1.002 1.05 1.353 1.68l.215.385c.896 1.62 1.34 3.535 1.272 5.518l-.01.32c1.78-.184 3.393-1.052 4.544-2.355l1.636-1.848.067-1.127a5.534 5.534 0 0 0 .108-.501.996.996 0 0 1-.878.508c-.28 0-.546-.118-.737-.324l-2.072-2.222c-.383-.412-.358-1.055.054-1.439.412-.383 1.055-.357 1.439.055l1.838 1.973c.123.131.295.205.474.205h.001zm-5.75-8.52c-.615-.466-1.286-.867-1.998-1.196-1.293-.598-2.678-.897-4.113-.897-.992 0-1.97.16-2.91.468C3.896 7.425 1.155 9.775.228 12.87l-.147.494 2.112-2.348c.15-.167.315-.327.491-.478l.42-.355c.784-.663 1.678-1.168 2.657-1.498.412-.138.835-.23 1.264-.275l.435-.046c1.67-.176 3.336.262 4.673 1.233.15.108.297.22.441.336l.244.195c1.455 1.164 2.378 2.85 2.628 4.757.065.498.077 1.002.036 1.5l-.019.227c-.234 2.809-1.956 5.176-4.524 6.184l-2.028.794 3.385.163c2.72.13 5.37-1.195 6.953-3.488l2.257-3.265.172-.45c.162-.42.274-.858.337-1.309.055-.398-.016-.807-.205-1.158l-.946-1.745c-.464-.856-1.11-1.577-1.91-2.136z"/>
            </svg>
          </div>
          <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-soft-pulse" />
          </span>
        </div>

        {/* Title */}
        <h2 className="text-[28px] font-bold text-[#1f2937] text-center leading-tight">
          Welcome to<br />Dolphin Buddy
        </h2>

        <div className="flex items-center gap-1.5 mt-2 mb-1">
          <CheckCircle2 size={14} className="text-[#00a86b]" />
          <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-widest">
            Insurance AI Specialist
          </p>
        </div>

        <p className="text-[13px] text-[#6b7280] text-center mt-3 font-medium leading-relaxed max-w-[280px]">
          Pick a username to keep your chats saved and accessible anytime.
        </p>

        <form onSubmit={handleSubmit} className="w-full mt-6 flex flex-col gap-3">
          {/* Input */}
          <div className="flex flex-col gap-1.5">
            <div className={`flex items-center bg-gray-50 rounded-[12px] px-4 border transition-colors shadow-sm ${error ? "border-red-400 focus-within:border-red-500" : "border-[#e5e7eb] focus-within:border-[#00a86b]"}`}>
              <span className="text-[#9ca3af] text-sm font-bold mr-1 select-none">@</span>
              <input
                type="text"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(""); }}
                placeholder="your_username"
                maxLength={24}
                autoFocus
                className="w-full py-3.5 bg-transparent text-[15px] font-medium text-[#1f2937] placeholder-[#9ca3af] outline-none"
              />
            </div>

            {error
              ? <p className="text-[11px] font-bold text-red-600 px-1">{error}</p>
              : <p className="text-[11px] text-[#9ca3af] font-medium px-1">Letters, numbers, underscores · 3–24 chars</p>
            }
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[12px] bg-[#00a86b] hover:bg-[#008f5a] active:scale-[0.98] text-white text-sm font-bold tracking-wide transition-all shadow-sm"
          >
            Start Chatting
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mt-5">
          Saved locally · No sign-up required
        </p>
      </div>
    </div>
  );
}
