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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2a29]/50 backdrop-blur-sm px-4">
      <div
        className="bg-[#f9f8f6] rounded-[32px] shadow-2xl w-full max-w-[380px] p-8 flex flex-col items-center border border-[#e2ded7]"
        style={{ boxShadow: "0 24px 60px rgba(44,42,41,0.12)" }}
      >
        {/* Avatar — matches Sidebar/WelcomeScreen */}
        <div className="relative mb-5">
          <div className="w-[72px] h-[72px] rounded-full bg-[#5b7c72] flex items-center justify-center text-white shadow-sm border-4 border-[#f9f8f6]">
            <Shield size={30} />
          </div>
          <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#e8a598] border-2 border-[#f9f8f6] flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-soft-pulse" />
          </span>
        </div>

        {/* Title — Instrument Serif like the rest of the app */}
        <h2
          className="text-[28px] text-[#2c2a29] text-center leading-tight"
          style={{ fontFamily: "var(--font-heading)", fontWeight: 400 }}
        >
          Welcome to<br />Dolphin Buddy
        </h2>

        <div className="flex items-center gap-1.5 mt-2 mb-1">
          <CheckCircle2 size={14} className="text-[#5b7c72]" />
          <p className="text-[11px] font-bold text-[#797571] uppercase tracking-widest">
            Insurance AI Specialist
          </p>
        </div>

        <p className="text-[13px] text-[#797571] text-center mt-3 font-medium leading-relaxed max-w-[280px]">
          Pick a username to keep your chats saved and accessible anytime.
        </p>

        <form onSubmit={handleSubmit} className="w-full mt-6 flex flex-col gap-3">
          {/* Input — same style as ChatInput bar */}
          <div className="flex flex-col gap-1.5">
            <div className={`flex items-center bg-[#ffffff] rounded-[16px] px-4 border transition-colors shadow-sm ${error ? "border-[#e8a598]" : "border-[#e2ded7] focus-within:border-[#5b7c72]"}`}>
              <span className="text-[#9e9a95] text-sm font-bold mr-1 select-none">@</span>
              <input
                type="text"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(""); }}
                placeholder="your_username"
                maxLength={24}
                autoFocus
                className="w-full py-3.5 bg-transparent text-[15px] font-medium text-[#2c2a29] placeholder-[#9e9a95] outline-none"
              />
            </div>

            {error
              ? <p className="text-[11px] font-bold text-[#b34040] px-1">{error}</p>
              : <p className="text-[11px] text-[#9e9a95] font-medium px-1">Letters, numbers, underscores · 3–24 chars</p>
            }
          </div>

          {/* Submit — matches other primary buttons */}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[16px] bg-[#5b7c72] hover:bg-[#4a665d] active:scale-[0.98] text-white text-sm font-bold uppercase tracking-wider transition-all shadow-sm"
          >
            Start Chatting
            <ArrowRight size={15} />
          </button>
        </form>

        <p className="text-[10px] font-bold text-[#9e9a95] uppercase tracking-widest mt-5">
          Saved locally · No sign-up required
        </p>
      </div>
    </div>
  );
}
