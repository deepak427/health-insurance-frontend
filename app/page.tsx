"use client";
import ChatWindow from "@/components/ChatWindow";
import { MessageSquare, ShieldCheck, Lock, Bell } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col px-4 pt-3 pb-4 sm:px-6 sm:pt-4 lg:px-8 bg-[#f4f7f9]">
      {/* Top Outer Marketing Header */}
      <header className="w-full max-w-[1600px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between mb-4">
        {/* Left: Branding */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-[28px] font-bold tracking-tight">
              <span className="text-[#0a192f]">Dolphin</span>
              <span className="text-[#00a86b] ml-2">Buddy</span>
            </h1>
            {/* Chat bubble SVG with 3 dots inside */}
            <svg width="36" height="34" viewBox="0 0 36 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-0.5">
              <rect x="0" y="0" width="36" height="28" rx="8" fill="#00a86b"/>
              <polygon points="8,28 4,34 16,28" fill="#00a86b"/>
              <circle cx="11" cy="14" r="2.5" fill="white"/>
              <circle cx="18" cy="14" r="2.5" fill="white"/>
              <circle cx="25" cy="14" r="2.5" fill="white"/>
            </svg>
          </div>
          <p className="text-[#1f2937] font-semibold text-[14px] mb-0.5">
            One Partner. One Login. All Travel Insurance Conversations.
          </p>
          <p className="text-[#6b7280] text-[12px]">
            Dedicated hub for all Travel Insurance related communication.
          </p>
        </div>

        {/* Right: 4 feature pillars — no card bg, just icon + text, generous gap */}
        <div className="flex flex-wrap xl:flex-nowrap items-start gap-8 xl:gap-12 mt-6 xl:mt-0">
          <div className="flex flex-col items-center text-center w-[120px]">
            <ShieldCheck size={36} className="text-[#00a86b] fill-[#00a86b]/15 mb-2" strokeWidth={1.8} />
            <span className="text-[12px] font-bold text-[#1f2937] mb-1 leading-tight">Travel Insurance<br/>Focused</span>
            <span className="text-[11px] text-[#6b7280] leading-[1.35]">All interactions are strictly travel insurance related.</span>
          </div>
          <div className="flex flex-col items-center text-center w-[120px]">
            <MessageSquare size={36} className="text-[#00a86b] fill-[#00a86b] mb-2" strokeWidth={0} />
            <span className="text-[12px] font-bold text-[#1f2937] mb-1 leading-tight">One Partner,<br/>One Space</span>
            <span className="text-[11px] text-[#6b7280] leading-[1.35]">Everything you need to serve your travelers better.</span>
          </div>
          <div className="flex flex-col items-center text-center w-[120px]">
            <Lock size={36} className="text-[#00a86b] fill-[#00a86b]/15 mb-2" strokeWidth={1.8} />
            <span className="text-[12px] font-bold text-[#1f2937] mb-1 leading-tight">Secure &<br/>Compliant</span>
            <span className="text-[11px] text-[#6b7280] leading-[1.35]">All travel insurance data stays safe inside Dolphin.</span>
          </div>
          <div className="flex flex-col items-center text-center w-[120px]">
            <Bell size={36} className="text-[#00a86b] fill-[#00a86b] mb-2" strokeWidth={0} />
            <span className="text-[12px] font-bold text-[#1f2937] mb-1 leading-tight">Instant<br/>Updates</span>
            <span className="text-[11px] text-[#6b7280] leading-[1.35]">Never miss an important policy or claim update.</span>
          </div>
        </div>
      </header>

      {/* Main Multi-Pane Application Container */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e5e7eb] overflow-hidden">
        <ChatWindow />
      </div>

      {/* Global Secure Footer */}
      <div className="w-full max-w-[1600px] mx-auto flex justify-center mt-4 shrink-0">
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] px-6 py-1.5 rounded-full flex items-center gap-2 text-[11px] font-medium shadow-sm">
          <ShieldCheck size={14} className="text-[#00a86b]" />
          <span>All travel insurance conversations stay within Dolphin. No personal WhatsApp. More security. Better tracking. Complete audit trail.</span>
        </div>
      </div>
    </main>
  );
}
