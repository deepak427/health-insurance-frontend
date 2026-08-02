"use client";

import { useState, useRef, useEffect } from "react";
import {
  Shield, MessageSquarePlus, Search, Database, X, Sparkles,
  CheckCircle2, MessageCircle, Clock, LogOut, MoreHorizontal,
  Pencil, Trash2, Check,
} from "lucide-react";
import Link from "next/link";
import { useChatContext } from "@/context/ChatContext";
import type { ChatSessionMeta } from "@/context/ChatContext";

interface Props {
  onQuickPrompt: (text: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Per-session row with rename/delete actions
function SessionRow({
  s,
  isActive,
  onSwitch,
  onRename,
  onDelete,
}: {
  s: ChatSessionMeta;
  isActive: boolean;
  onSwitch: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(s.preview);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Focus input when rename starts
  useEffect(() => {
    if (renaming) {
      setRenameVal(s.preview);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [renaming, s.preview]);

  function submitRename() {
    if (renameVal.trim()) onRename(renameVal.trim());
    setRenaming(false);
  }

  return (
    <div className={`group relative flex items-center gap-3 p-3 rounded-[20px] transition-all ${
      isActive ? "bg-[#ffffff] border border-[#e2ded7] shadow-sm" : "hover:bg-[#ffffff]/60 border border-transparent hover:border-[#e2ded7]"
    }`}>
      {/* Avatar */}
      <button onClick={onSwitch} className="relative shrink-0" tabIndex={-1} aria-label="Open conversation">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${isActive ? "bg-[#5b7c72]" : "bg-[#9e9a95]"}`}>
          <Shield size={20} />
        </div>
        {isActive && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#e8a598] border-2 border-[#f1efe9]" />
        )}
      </button>

      {/* Text area — click to switch */}
      <button onClick={onSwitch} className="flex-1 min-w-0 text-left" aria-label={`Switch to: ${s.preview}`}>
        <div className="flex items-center justify-between gap-1">
          <span className={`text-sm truncate font-heading leading-none flex items-center gap-1 ${isActive ? "text-[#2c2a29] font-bold" : "text-[#2c2a29]"}`}>
            Dolphin Buddy
            {isActive && <CheckCircle2 size={12} className="text-[#5b7c72] shrink-0" />}
          </span>
          <span className="text-[10px] font-bold text-[#9e9a95] shrink-0 flex items-center gap-0.5 uppercase tracking-wider">
            <Clock size={9} />
            {timeAgo(s.lastUpdateTime)}
          </span>
        </div>

        {renaming ? (
          <input
            ref={inputRef}
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            onClick={(e) => e.stopPropagation()}
            maxLength={60}
            className="mt-1 w-full text-xs font-medium bg-[#f1efe9] text-[#2c2a29] border border-[#5b7c72] rounded-[8px] px-2 py-1 outline-none"
          />
        ) : (
          <p className="text-xs text-[#797571] truncate mt-1 font-medium">{s.preview}</p>
        )}
      </button>

      {/* Rename confirm button */}
      {renaming && (
        <button
          onClick={(e) => { e.stopPropagation(); submitRename(); }}
          className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-[#5b7c72] text-white hover:bg-[#4a665d] transition-colors"
          aria-label="Confirm rename"
        >
          <Check size={13} />
        </button>
      )}

      {/* ··· menu button — visible on hover or when active */}
      {!renaming && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); setConfirmDelete(false); }}
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-all text-[#9e9a95] hover:text-[#2c2a29] hover:bg-[#e2ded7] ${
              menuOpen ? "opacity-100 bg-[#e2ded7]" : "opacity-0 group-hover:opacity-100"
            }`}
            aria-label="Session options"
            aria-haspopup="true"
          >
            <MoreHorizontal size={15} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-50 w-44 bg-[#ffffff] rounded-[16px] border border-[#e2ded7] shadow-lg overflow-hidden py-1">
              {/* Rename */}
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setRenaming(true); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-[#2c2a29] hover:bg-[#f1efe9] transition-colors"
              >
                <Pencil size={14} className="text-[#5b7c72]" />
                Rename
              </button>

              {/* Delete — two-step confirm */}
              {!confirmDelete ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-[#797571] hover:bg-[#fff0ed] hover:text-[#b34040] transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setConfirmDelete(false); onDelete(); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-bold text-[#b34040] bg-[#fff0ed] hover:bg-[#ffe4df] transition-colors"
                >
                  <Trash2 size={14} />
                  Confirm Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const QUICK_TOPICS = [
  { label: "Deductibles & Co-pay", prompt: "What is a deductible and how does it work?" },
  { label: "Premium Calculator", prompt: "Estimate my health insurance premium, I'm 30." },
  { label: "Health PDF Guide", prompt: "Give me a PDF guide on health insurance." },
  { label: "Filing Claims", prompt: "How do I file an auto accident claim?" },
];

export default function Sidebar({ onQuickPrompt, isOpenMobile, onCloseMobile }: Props) {
  const { username, sessionId, sessions, handleNewChat, switchSession, removeSession, renameSession, logout } = useChatContext();
  const [searchVal, setSearchVal] = useState("");

  const filtered: ChatSessionMeta[] = sessions.filter((s) =>
    s.preview.toLowerCase().includes(searchVal.toLowerCase())
  );

  // Suggested topics only when user has fewer than 3 real chats
  const showSuggestedTopics = !searchVal && sessions.length < 3;

  function onNewChat() {
    handleNewChat();
    onCloseMobile?.();
  }

  const content = (
    <div className="flex flex-col h-full w-full bg-[#f1efe9] text-[#2c2a29] border-r border-[#e2ded7]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[#e2ded7]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#5b7c72] text-white shadow-sm">
            <Shield size={20} />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#e8a598] border-2 border-[#f1efe9]" />
          </div>
          <div>
            <h1 className="text-2xl text-[#2c2a29] font-heading leading-none tracking-wide">
              Dolphin Buddy
            </h1>
            <p className="text-[11px] font-medium text-[#797571] mt-1 tracking-wide uppercase">
              {username ? `@${username}` : "Direct Messages"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewChat}
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

      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative flex items-center bg-[#ffffff] rounded-2xl px-3 py-2.5 border border-[#e2ded7] focus-within:border-[#5b7c72] shadow-sm transition-all">
          <Search size={16} className="text-[#9e9a95] shrink-0 mr-2" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-transparent text-sm text-[#2c2a29] placeholder-[#9e9a95] outline-none font-medium"
          />
          {searchVal && (
            <button onClick={() => setSearchVal("")} className="text-[#9e9a95] hover:text-[#2c2a29]">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Section label */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#797571]">Messages</span>
        <span className="text-[11px] font-bold text-[#e8a598] flex items-center gap-1 uppercase tracking-wider">
          <Sparkles size={11} /> AI Active
        </span>
      </div>

      {/* Chat list */}
      <div className="px-3 flex-1 overflow-y-auto flex flex-col gap-1.5 py-1">
        {filtered.length === 0 && !searchVal && (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-[#9e9a95]">
            <MessageCircle size={28} className="opacity-40" />
            <p className="text-xs font-bold uppercase tracking-wider">No conversations yet</p>
          </div>
        )}

        {filtered.length === 0 && searchVal && (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-[#9e9a95]">
            <Search size={22} className="opacity-40" />
            <p className="text-xs font-bold uppercase tracking-wider">No results</p>
          </div>
        )}

        {filtered.map((s) => (
          <SessionRow
            key={s.id}
            s={s}
            isActive={s.id === sessionId}
            onSwitch={() => { switchSession(s.id); onCloseMobile?.(); }}
            onRename={(name) => renameSession(s.id, name)}
            onDelete={() => removeSession(s.id)}
          />
        ))}

        {/* Suggested Topics — only for new users with < 3 chats */}
        {showSuggestedTopics && (
          <div className="mt-4 px-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#797571] block mb-3">
              Suggested Topics
            </span>
            <div className="flex flex-col gap-1.5">
              {QUICK_TOPICS.map(({ label, prompt }) => (
                <button
                  key={label}
                  onClick={() => { onQuickPrompt(prompt); onCloseMobile?.(); }}
                  className="flex items-center justify-between px-4 py-2.5 rounded-[16px] text-sm font-medium text-[#797571] hover:text-[#5b7c72] hover:bg-[#ffffff] transition-all text-left border border-transparent hover:border-[#e2ded7] hover:shadow-sm group"
                >
                  <span>{label}</span>
                  <span className="text-[10px] text-[#e8a598] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Ask →</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 border-t border-[#e2ded7] pt-4 flex flex-col gap-1">
        <Link
          href="/data"
          onClick={() => onCloseMobile?.()}
          className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-sm font-bold text-[#5b7c72] hover:bg-[#ffffff] transition-all border border-transparent hover:border-[#e2ded7] hover:shadow-sm"
        >
          <Database size={18} />
          <span>Knowledge Base</span>
        </Link>

        <button
          onClick={() => { logout(); onCloseMobile?.(); }}
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-[16px] text-sm font-bold text-[#797571] hover:text-[#b34040] hover:bg-[#fff0ed] transition-all border border-transparent hover:border-[#e8a598]/40 group"
        >
          <div className="flex items-center gap-3">
            <LogOut size={16} className="group-hover:text-[#b34040] transition-colors" />
            <span>Sign Out</span>
          </div>
          {username && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9e9a95] group-hover:text-[#b34040]/70 truncate max-w-[100px]">
              @{username}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-[320px] shrink-0 h-full">
        {content}
      </aside>

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
