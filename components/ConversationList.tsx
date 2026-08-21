"use client";

import { useState, useRef, useEffect } from "react";
import { Building2, Plus, ShieldCheck, ChevronRight, MoreVertical, Pencil, Trash2, Check, Search, MessageSquare } from "lucide-react";
import { useChatContext } from "@/context/ChatContext";
import type { ChatSessionMeta } from "@/context/ChatContext";

interface Props {
  onNewChat?: () => void;
  onQuickPrompt?: (text: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

function timeLabel(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return `${Math.floor(diff / 86400)}d ago`;
}

// Row with inline rename + two-step delete
function SessionRow({ s, isActive, onSwitch, onRename, onDelete }: {
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

  function startRename() {
    setRenameVal(s.preview);
    setRenaming(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function submitRename() {
    if (renameVal.trim()) onRename(renameVal.trim());
    setRenaming(false);
  }

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3 border-l-4 cursor-pointer transition-all border-b border-[#f1f5f9] ${
        isActive
          ? "bg-[#f6f3ff] border-[#7b58dc]"
          : "border-transparent hover:bg-[#f8fafc]"
      }`}
    >
      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
        isActive ? "bg-[#7b58dc] text-white" : "bg-[#f1f5f9] text-[#6b7280] group-hover:bg-[#e2e8f0]"
      }`}>
        <MessageSquare size={13} />
      </div>

      <div className="flex-1 min-w-0" onClick={onSwitch}>
        <div className="flex items-center justify-between">
          <p className={`text-xs truncate ${isActive ? "font-bold text-[#1f2937]" : "font-medium text-[#374151]"}`}>
            {s.preview || "Insurance Support"}
          </p>
          <span className="text-[10px] text-[#9ca3af] shrink-0 ml-1">{timeLabel(s.lastUpdateTime)}</span>
        </div>
        {renaming ? (
          <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
                if (e.key === "Escape") setRenaming(false);
              }}
              className="flex-1 text-xs bg-white border border-[#7b58dc] rounded px-2 py-0.5 outline-none text-[#1f2937]"
              maxLength={60}
            />
            <button onClick={submitRename} className="w-5 h-5 flex items-center justify-center rounded bg-[#7b58dc] text-white">
              <Check size={11} />
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-[#6b7280] truncate mt-0.5">
            {s.preview ? "Travel Insurance Query" : "New thread"}
          </p>
        )}
      </div>

      {/* ··· Menu */}
      {!renaming && (
        <div className="relative shrink-0 self-center" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); setConfirmDelete(false); }}
            className={`w-6 h-6 flex items-center justify-center rounded text-[#9ca3af] hover:text-[#1f2937] hover:bg-white transition-all ${
              menuOpen ? "opacity-100 bg-white" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <MoreVertical size={13} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-7 z-50 w-36 bg-white rounded-lg border border-[#e5e7eb] shadow-lg overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); startRename(); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium text-[#1f2937] hover:bg-[#f8fafc]"
              >
                <Pencil size={12} className="text-[#7b58dc]" /> Rename
              </button>
              {!confirmDelete ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium text-[#6b7280] hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={12} /> Delete
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100"
                >
                  <Trash2 size={12} /> Confirm Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConversationList({ onNewChat, onQuickPrompt, isOpenMobile, onCloseMobile }: Props) {
  const { sessionId, sessions, switchSession, removeSession, renameSession } = useChatContext();
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = sessions.filter((s) =>
    s.preview.toLowerCase().includes(search.toLowerCase())
  );
  const visible = showAll ? filtered : filtered.slice(0, 10);

  const content = (
    <div className="flex flex-col h-full w-full lg:w-[280px] bg-white border-r border-[#e5e7eb]">
      {/* Search and Header */}
      <div className="p-3 border-b border-[#e5e7eb] flex flex-col gap-2 bg-[#fbfbfd]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">
            Threads ({sessions.length})
          </span>
          <button
            onClick={onNewChat}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#d1d5db] hover:border-[#7b58dc] hover:text-[#5925dc] rounded-md text-[11px] font-semibold text-[#374151] transition-all shadow-2xs"
            title="Start new thread"
          >
            <Plus size={12} /> New Thread
          </button>
        </div>

        {/* Filter input */}
        <div className="relative flex items-center">
          <Search size={13} className="absolute left-2.5 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Filter threads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-[#d1d5db] rounded-md outline-none focus:border-[#7b58dc] focus:ring-1 focus:ring-[#7b58dc] text-[#1f2937] placeholder-[#9ca3af] transition-all"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-[#9ca3af]">
            <MessageSquare size={24} className="mb-2 opacity-30" />
            <p className="text-xs">{search ? "No matching threads" : "No threads yet"}</p>
          </div>
        ) : (
          visible.map((s) => (
            <SessionRow
              key={s.id}
              s={s}
              isActive={s.id === sessionId}
              onSwitch={() => { switchSession(s.id); onCloseMobile?.(); }}
              onRename={(name) => renameSession(s.id, name)}
              onDelete={() => removeSession(s.id)}
            />
          ))
        )}

        {filtered.length > 10 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center justify-center gap-1 mx-4 my-3 py-1.5 text-xs font-semibold text-[#5925dc] hover:bg-[#f4f0ff] rounded-md transition-colors"
          >
            View All ({filtered.length}) <ChevronRight size={13} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col shrink-0 h-full">
        {content}
      </aside>

      {isOpenMobile && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onCloseMobile} />
          <aside className="relative flex flex-col h-full shadow-2xl z-10 w-[85%] max-w-[300px] bg-white animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
