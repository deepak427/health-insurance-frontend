"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, MoreVertical, Pencil, Trash2, Check, Search, BellOff, MessageSquarePlus, Filter, X } from "lucide-react";
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
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800) return "Yesterday";
  return new Date(ts * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Consistent colors for session avatars like WhatsApp group icons
const AVATAR_COLORS = [
  "bg-[#dfa694] text-white",
  "bg-[#97d8b2] text-[#065f46]",
  "bg-[#8ecae6] text-[#023e8a]",
  "bg-[#b8c0ff] text-[#3a0ca3]",
  "bg-[#fde2e4] text-[#9b2226]",
  "bg-[#fed9b7] text-[#9a031e]",
];

function getAvatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// WhatsApp Chat Thread Row
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

  const title = s.preview || "Dolphin Insurance Support";
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase() || "DB";
  const avatarBg = getAvatarColor(s.id);

  return (
    <div
      onClick={onSwitch}
      className={`group relative flex items-center gap-3.5 px-3.5 py-3 cursor-pointer transition-colors border-b border-[#f0f2f5] ${
        isActive ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6] bg-white"
      }`}
    >
      {/* Circular Avatar */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 select-none ${avatarBg}`}>
        {initials}
      </div>

      {/* Main Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[15px] font-semibold text-[#111b21] truncate leading-tight">
            {title}
          </p>
          <span className={`text-[12px] shrink-0 ${isActive ? "text-[#008069] font-medium" : "text-[#667781]"}`}>
            {timeLabel(s.lastUpdateTime)}
          </span>
        </div>

        {renaming ? (
          <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
                if (e.key === "Escape") setRenaming(false);
              }}
              className="flex-1 text-xs bg-white border border-[#008069] rounded px-2 py-1 outline-none text-[#111b21]"
              maxLength={60}
            />
            <button onClick={submitRename} className="w-6 h-6 flex items-center justify-center rounded bg-[#008069] text-white">
              <Check size={13} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <div className="flex items-center gap-1 min-w-0">
              {/* WhatsApp double checkmark */}
              <svg viewBox="0 0 18 11" width="15" height="10" className="text-[#53bdeb] shrink-0">
                <path fill="currentColor" d="M17.394 .57 6.23 11.733l-5.624-5.625 1.414-1.414 4.21 4.21L15.98-.844z"/>
                <path fill="currentColor" d="M11.394 .57.23 11.733l1.414 1.414L12.808 1.984z" opacity=".4"/>
              </svg>
              <p className="text-[13px] text-[#667781] truncate">
                {s.preview ? "Travel Insurance Query" : "Tap to start conversation..."}
              </p>
            </div>

            {/* Unread / Active indicator pill */}
            {isActive && (
              <span className="w-2 h-2 rounded-full bg-[#008069] shrink-0" />
            )}
          </div>
        )}
      </div>

      {/* ··· Hover Options Menu */}
      {!renaming && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); setConfirmDelete(false); }}
            className={`w-7 h-7 flex items-center justify-center rounded-full text-[#667781] hover:text-[#111b21] hover:bg-black/5 transition-all ${
              menuOpen ? "opacity-100 bg-black/5" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-50 w-44 bg-white rounded-xl border border-[#e9edef] shadow-xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); startRename(); }}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-semibold text-[#111b21] hover:bg-[#f5f6f6]"
              >
                <Pencil size={14} className="text-[#008069]" /> Rename chat
              </button>
              {!confirmDelete ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-semibold text-[#667781] hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} /> Delete chat
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100"
                >
                  <Trash2 size={14} /> Confirm Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConversationList({ onNewChat, isOpenMobile, onCloseMobile }: Props) {
  const { sessionId, sessions, switchSession, removeSession, renameSession } = useChatContext();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "groups">("all");
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);

  const filtered = sessions.filter((s) =>
    s.preview.toLowerCase().includes(search.toLowerCase())
  );

  const content = (
    <div className="flex flex-col h-full w-full lg:w-[360px] xl:w-[400px] bg-white border-r border-[#e9edef]">
      {/* WhatsApp-style Header with Dolphin Buddy Branding */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-white shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-black text-[#111b21] tracking-tight">Dolphin</span>
          <span className="text-xl font-bold text-[#ff5722] tracking-tight">Buddy</span>
        </div>
        <div className="flex items-center gap-2 text-[#54656f]">
          <button
            onClick={onNewChat}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21] transition-colors"
            title="New Chat"
          >
            <MessageSquarePlus size={20} />
          </button>
          <button
            onClick={onNewChat}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f0f2f5] text-[#54656f] hover:text-[#111827] transition-colors"
            title="Options"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* WhatsApp Search & Filter Bar */}
      <div className="px-3 py-1.5 bg-white flex items-center gap-2 shrink-0">
        <div className="flex-1 relative flex items-center bg-[#f0f2f5] rounded-lg">
          <Search size={16} className="absolute left-3 text-[#54656f]" />
          <input
            type="text"
            placeholder="Search or start a new chat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs text-[#111b21] placeholder-[#54656f] bg-transparent outline-none"
          />
        </div>
        <button className="p-1.5 text-[#54656f] hover:bg-[#f0f2f5] rounded-lg transition-colors" title="Filter unread">
          <Filter size={16} />
        </button>
      </div>

      {/* WhatsApp Filter Pills: All, Unread, Groups */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-white shrink-0">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            activeFilter === "all"
              ? "bg-[#d9fdd3] text-[#008069]"
              : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter("unread")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
            activeFilter === "unread"
              ? "bg-[#d9fdd3] text-[#008069]"
              : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
          }`}
        >
          Unread
          <span className="w-4 h-4 rounded-full bg-[#25d366] text-white text-[10px] flex items-center justify-center font-bold">
            3
          </span>
        </button>
        <button
          onClick={() => setActiveFilter("groups")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
            activeFilter === "groups"
              ? "bg-[#d9fdd3] text-[#008069]"
              : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
          }`}
        >
          Groups
          <span className="w-4 h-4 rounded-full bg-black/10 text-[#54656f] text-[10px] flex items-center justify-center font-bold">
            1
          </span>
        </button>
        <button
          onClick={onNewChat}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef] text-xs font-bold ml-auto"
          title="New thread"
        >
          +
        </button>
      </div>

      {/* WhatsApp Notification Banner (dismissible) */}
      {showNotificationBanner && (
        <div className="flex items-center justify-between px-4 py-3 bg-[#d9fdd3] border-b border-[#a7f3d0] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#008069] text-white flex items-center justify-center shrink-0">
              <BellOff size={16} />
            </div>
            <div className="text-xs text-[#111b21]">
              <p className="font-semibold leading-tight">Message notifications are off.</p>
              <button onClick={() => setShowNotificationBanner(false)} className="text-[#008069] underline font-bold mt-0.5">
                Turn on
              </button>
            </div>
          </div>
          <button onClick={() => setShowNotificationBanner(false)} className="text-[#54656f] hover:text-[#111b21]">
            <X size={16} />
          </button>
        </div>
      )}

      {/* WhatsApp Thread List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#f0f2f5]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-[#667781]">
            <p className="text-sm font-medium">{search ? "No chats found" : "No conversations yet"}</p>
            <p className="text-xs mt-1">Click + above to start an insurance query.</p>
          </div>
        ) : (
          filtered.map((s) => (
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
          <aside className="relative flex flex-col h-full shadow-2xl z-10 w-[85%] max-w-[340px] bg-white animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
