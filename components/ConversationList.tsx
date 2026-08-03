"use client";

import { useState, useRef, useEffect } from "react";
import { Building2, Plus, ShieldCheck, ChevronRight, MoreVertical, Pencil, Trash2, Check, Search } from "lucide-react";
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
    <div
      className={`group flex items-start gap-3 px-5 py-3 border-l-4 cursor-pointer transition-colors ${
        isActive ? "bg-[#f8fafc] border-[#00a86b]" : "border-transparent hover:bg-[#f8fafc]"
      }`}
    >
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[#00a86b] text-white">
        <ShieldCheck size={14} />
      </div>

      <div className="flex-1 min-w-0" onClick={onSwitch}>
        <div className="flex items-center justify-between">
          <p className={`text-sm truncate ${isActive ? "font-semibold text-[#1f2937]" : "font-medium text-[#374151]"}`}>
            Insurance Support
          </p>
          <span className="text-[10px] text-[#6b7280] shrink-0">{timeLabel(s.lastUpdateTime)}</span>
        </div>
        {renaming ? (
          <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
                if (e.key === "Escape") setRenaming(false);
              }}
              className="flex-1 text-xs bg-white border border-[#00a86b] rounded px-2 py-0.5 outline-none text-[#1f2937]"
              maxLength={60}
            />
            <button onClick={submitRename} className="w-5 h-5 flex items-center justify-center rounded bg-[#00a86b] text-white">
              <Check size={11} />
            </button>
          </div>
        ) : (
          <p className="text-xs font-light text-[#6b7280] truncate mt-0.5">{s.preview}</p>
        )}
      </div>

      {/* ··· menu */}
      {!renaming && (
        <div className="relative shrink-0 self-center" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); setConfirmDelete(false); }}
            className={`w-6 h-6 flex items-center justify-center rounded text-[#9ca3af] hover:text-[#6b7280] hover:bg-gray-100 transition-all ${
              menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <MoreVertical size={14} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-7 z-50 w-40 bg-white rounded-lg border border-[#e5e7eb] shadow-lg overflow-hidden py-1">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setRenaming(true); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-[#1f2937] hover:bg-[#f8fafc]"
              >
                <Pencil size={13} className="text-[#00a86b]" /> Rename
              </button>
              {!confirmDelete ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-[#6b7280] hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={13} /> Delete
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100"
                >
                  <Trash2 size={13} /> Confirm Delete
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
  const { username, sessionId, sessions, switchSession, removeSession, renameSession } = useChatContext();
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = sessions.filter((s) =>
    s.preview.toLowerCase().includes(search.toLowerCase())
  );
  const visible = showAll ? filtered : filtered.slice(0, 5);

  const content = (
    <div className="flex flex-col h-full w-full lg:w-[340px] bg-white border-r border-[#e5e7eb]">
      {/* User card */}
      <div className="px-5 py-6">
        <p className="text-[10px] font-bold text-[#1f2937] mb-3 tracking-[0.08em] uppercase">Your Partner</p>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-[#f3f4f6] text-[#6b7280] rounded">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1f2937]">SOTC Travel Limited</p>
              <p className="text-[11px] font-light text-[#6b7280] mt-0.5">Partner ID: PT12345</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#00a86b]">Active</span>
        </div>
      </div>

      {/* Conversations List Header */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-[#e5e7eb]">
        <h3 className="text-xs font-bold text-[#1f2937] tracking-[0.04em]">Travel Insurance Conversations</h3>
        <button
          onClick={onNewChat}
          className="flex items-center gap-1 px-2 py-1 bg-white border border-[#00a86b] rounded text-[10px] font-semibold text-[#00a86b] hover:bg-[#f0fdf4]"
        >
          <Plus size={10} /> New Conversation
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 flex flex-col overflow-y-auto">

        <div className="flex flex-col mt-1">
          {visible.length === 0 && (
            <p className="text-xs text-[#9ca3af] text-center py-8">
              {search ? "No results" : "No conversations yet — start chatting!"}
            </p>
          )}

          {visible.map((s) => (
            <SessionRow
              key={s.id}
              s={s}
              isActive={s.id === sessionId}
              onSwitch={() => switchSession(s.id)}
              onRename={(name) => renameSession(s.id, name)}
              onDelete={() => removeSession(s.id)}
            />
          ))}

          {filtered.length > 5 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="flex items-center justify-center gap-1 mx-5 mt-4 py-2 text-xs font-semibold text-[#0369a1] hover:underline"
            >
              View All ({filtered.length}) <ChevronRight size={14} />
            </button>
          )}
        </div>


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
          <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="relative flex flex-col h-full shadow-2xl z-10 w-[85%] max-w-[340px] bg-white animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
