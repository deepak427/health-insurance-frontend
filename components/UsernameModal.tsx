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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2937]/50 backdrop-blur-sm px-3 sm:px-4 py-4 overflow-y-auto">
      <div
        className="bg-white rounded-[24px] shadow-2xl w-full max-w-[380px] p-5 sm:p-8 flex flex-col items-center border border-[#e5e7eb] my-auto"
        style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.08)" }}
      >
        {/* Avatar — matches Dolphin Buddy ring */}
        <div className="relative mb-5">
          <div className="w-[72px] h-[72px] rounded-full bg-[#fdeee9] flex items-center justify-center text-[#ff5722] shadow-sm border-4 border-white">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="15" stroke="url(#modal_grad)" strokeWidth="3" strokeLinecap="round" strokeDasharray="75 25" />
              <circle cx="18" cy="18" r="4" fill="#ff5722" />
              <defs>
                <linearGradient id="modal_grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ff5722" />
                  <stop offset="0.5" stopColor="#6366f1" />
                  <stop offset="1" stopColor="#00a86b" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#00a86b] border-2 border-white flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </span>
        </div>

        {/* Title */}
        <h2 className="text-[26px] font-black text-[#111827] text-center leading-none tracking-tight">
          Welcome to<br /><span className="text-[#ff5722]">Dolphin Buddy</span>
        </h2>

        <div className="flex items-center gap-1.5 mt-2 mb-1">
          <CheckCircle2 size={14} className="text-[#00a86b]" />
          <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-widest">
            AI Travel Insurance Specialist
          </p>
        </div>

        <p className="text-[13px] text-[#6b7280] text-center mt-3 font-medium leading-relaxed max-w-[280px]">
          Pick a username to keep your policy quotes and chats accessible anytime.
        </p>

        <form onSubmit={handleSubmit} className="w-full mt-6 flex flex-col gap-3">
          {/* Input */}
          <div className="flex flex-col gap-1.5">
            <div className={`flex items-center bg-[#f9fafb] rounded-2xl px-4 border transition-colors shadow-2xs ${error ? "border-red-400 focus-within:border-red-500" : "border-[#e5e7eb] focus-within:border-[#ff5722]"}`}>
              <span className="text-[#9ca3af] text-sm font-bold mr-1 select-none">@</span>
              <input
                type="text"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(""); }}
                placeholder="your_username"
                maxLength={24}
                autoFocus
                className="w-full py-3.5 bg-transparent text-[15px] font-semibold text-[#111827] placeholder-[#9ca3af] outline-none"
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
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-sm font-bold tracking-wide transition-all shadow-sm"
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
