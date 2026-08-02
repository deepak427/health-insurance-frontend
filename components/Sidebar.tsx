"use client";
import { Shield, MessageSquarePlus, Search, Database, X, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Props {
  onNewChat: () => void;
  onQuickPrompt: (text: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ onNewChat, onQuickPrompt, isOpenMobile, onCloseMobile }: Props) {
  const content = (
    <div className="flex flex-col h-full w-full bg-[#f1efe9] text-[#2c2a29] border-r border-[#e2ded7]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[#e2ded7]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#5b7c72] text-white shadow-sm">
            <Shield size={20} />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#e8a598] border-2 border-[#f1efe9]"></span>
          </div>
          <div>
            <h1 className="text-2xl text-[#2c2a29] font-heading leading-none tracking-wide">
              Dolphin Buddy
            </h1>
            <p className="text-[11px] font-medium text-[#797571] mt-1 tracking-wide uppercase">Direct Messages</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onNewChat();
              onCloseMobile?.();
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#e2ded7] hover:bg-[#d1ccc4] text-[#5b7c72] transition-all"
            title="Start new conversation"
            aria-label="Start new chat"
          >
            <MessageSquarePlus size={18} />
          </button>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-[#797571] hover:text-[#2c2a29]"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative flex items-center bg-[#ffffff] rounded-2xl px-3 py-2.5 border border-[#e2ded7] focus-within:border-[#5b7c72] shadow-sm transition-all">
          <Search size={16} className="text-[#9e9a95] shrink-0 mr-2" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full bg-transparent text-sm text-[#2c2a29] placeholder-[#9e9a95] outline-none font-medium"
          />
        </div>
      </div>

      {/* Primary Message Threads Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#797571]">
          Messages
        </span>
        <span className="text-[11px] font-bold text-[#e8a598] flex items-center gap-1 uppercase tracking-wider">
          <Sparkles size={11} /> AI Active
        </span>
      </div>

      {/* Conversation Thread List */}
      <div className="px-3 flex-1 overflow-y-auto flex flex-col gap-2 py-1">
        {/* Active Conversation with Agent */}
        <div className="relative flex items-center gap-3 p-3 rounded-[20px] bg-[#ffffff] border border-[#e2ded7] shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-[#5b7c72] flex items-center justify-center text-white">
              <Shield size={22} />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#e8a598] border-2 border-[#ffffff]"></span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg text-[#2c2a29] truncate font-heading flex items-center gap-1.5 leading-none">
                Dolphin Buddy AI
                <CheckCircle2 size={14} className="text-[#5b7c72] shrink-0" />
              </h3>
              <span className="text-[10px] font-bold text-[#9e9a95] shrink-0 uppercase tracking-wider">Now</span>
            </div>
            <p className="text-xs font-medium text-[#797571] truncate mt-1">
              Online • Ready for policy Q&A
            </p>
          </div>
        </div>

        {/* Quick Topic Shortcuts */}
        <div className="mt-6 px-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#797571] block mb-3">
            Suggested Topics
          </span>
          <div className="flex flex-col gap-1.5">
            {[
              { label: "Deductibles & Co-pay", prompt: "What is a deductible and how does it work?" },
              { label: "Premium Calculator", prompt: "Estimate my health insurance premium, I'm 30 years old looking for individual coverage." },
              { label: "Health PDF Guide", prompt: "Give me a PDF guide on health insurance." },
              { label: "Life PDF Guide", prompt: "Give me a PDF guide on life insurance." },
              { label: "Filing Claims", prompt: "How do I file an auto accident claim?" },
            ].map(({ label, prompt }) => (
              <button
                key={label}
                onClick={() => {
                  onQuickPrompt(prompt);
                  onCloseMobile?.();
                }}
                className="flex items-center justify-between px-4 py-2.5 rounded-[16px] text-sm font-medium text-[#797571] hover:text-[#5b7c72] hover:bg-[#ffffff] transition-all text-left border border-transparent hover:border-[#e2ded7] hover:shadow-sm group"
              >
                <span>{label}</span>
                <span className="text-[10px] text-[#e8a598] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Ask →</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Nav */}
      <div className="px-4 pb-4 border-t border-[#e2ded7] pt-4">
        <Link
          href="/data"
          onClick={() => onCloseMobile?.()}
          className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-sm font-bold text-[#5b7c72] hover:bg-[#ffffff] transition-all border border-transparent hover:border-[#e2ded7] hover:shadow-sm"
        >
          <Database size={18} />
          <span>Knowledge Base</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[320px] shrink-0 h-full">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-[#2c2a29]/40 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="relative flex flex-col w-[85vw] max-w-[340px] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-300">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
