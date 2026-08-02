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
    <div className="flex flex-col h-full w-full bg-stone-900 text-stone-100 border-r border-stone-800">
      {/* Instagram DM Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md">
            <Shield size={18} />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-stone-900"></span>
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white font-heading leading-none">
              Dolphin<span className="text-emerald-400">Buddy</span>
            </h1>
            <p className="text-[11px] font-medium text-stone-400 mt-0.5">Direct Messages</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onNewChat();
              onCloseMobile?.();
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-stone-800 hover:bg-stone-700 text-white transition-all"
            title="Start new conversation"
            aria-label="Start new chat"
          >
            <MessageSquarePlus size={18} />
          </button>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-stone-400 hover:text-white"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="px-3.5 pt-3 pb-2">
        <div className="relative flex items-center bg-stone-800/80 rounded-xl px-3 py-2 border border-stone-700/60 focus-within:border-emerald-500/50">
          <Search size={15} className="text-stone-400 shrink-0 mr-2" />
          <input
            type="text"
            placeholder="Search messages or insurance topics..."
            className="w-full bg-transparent text-xs text-white placeholder-stone-400 outline-none"
          />
        </div>
      </div>

      {/* Primary Message Threads Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
          Messages
        </span>
        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
          <Sparkles size={11} /> AI Active
        </span>
      </div>

      {/* Conversation Thread List (Instagram DM Style) */}
      <div className="px-2 flex-1 overflow-y-auto flex flex-col gap-1 py-1">
        {/* Active Conversation with Agent */}
        <div className="relative flex items-center gap-3 p-2.5 rounded-2xl bg-stone-800/90 border border-stone-700/80 cursor-pointer transition-all">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <Shield size={22} />
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-stone-900"></span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white truncate font-heading flex items-center gap-1">
                Dolphin Buddy AI
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              </h3>
              <span className="text-[10px] font-medium text-stone-400 shrink-0">Now</span>
            </div>
            <p className="text-xs text-stone-300 truncate mt-0.5">
              Online • Ready for policy Q&A & PDF analysis
            </p>
          </div>
        </div>

        {/* Quick Topic Shortcuts */}
        <div className="mt-4 px-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
            Insurance Quick Topics
          </span>
          <div className="flex flex-col gap-1">
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
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-stone-300 hover:text-white hover:bg-stone-800 transition-all text-left"
              >
                <span>{label}</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Ask →</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Nav */}
      <div className="px-3 pb-3 border-t border-stone-800 pt-3">
        <Link
          href="/data"
          onClick={() => onCloseMobile?.()}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-stone-400 hover:text-white hover:bg-stone-800 transition-all"
        >
          <Database size={16} className="text-emerald-400" />
          <span>Knowledge Base Settings</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 shrink-0 h-full">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onCloseMobile} />
          <aside className="relative flex flex-col w-80 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
