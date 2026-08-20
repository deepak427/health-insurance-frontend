"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { streamMessage } from "@/lib/api";
import { useChatContext, savePreview } from "@/context/ChatContext";
import Sidebar from "./Sidebar";
import ConversationList from "./ConversationList";
import ConversationDetails from "./ConversationDetails";
import Message from "./Message";
import ChatInput from "./ChatInput";
import UsernameModal from "./UsernameModal";
import PoliciesPanel from "./PoliciesPanel";
import { AlertCircle, Search, Phone, MoreVertical, ShieldCheck, Bell, ChevronDown, Menu, Users, Info } from "lucide-react";

export default function ChatWindow() {
  const {
    username,
    userId,
    sessionId,
    messages,
    loading,
    error,
    setMessages,
    setLoading,
    setError,
    handleNewChat,
    ensureSession,
    refreshSessionList,
    setUsername,
  } = useChatContext();

  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Mobile responsive state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = useCallback(async (
    text: string,
    file?: { mimeType: string; data: string; name: string }
  ) => {
    if (loading) return;

    // Lazily create session on first message
    const ready = await ensureSession();
    if (!ready) return;

    const isFirstMessage = messages.length === 0;

    setMessages((prev) => [...prev, { 
      role: "user", 
      text: file ? `${text}\n📎 ${file.name}` : text,
      userAttachment: file ? { name: file.name, mimeType: file.mimeType, data: file.data } : undefined,
    }]);
    setLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: "agent", text: "", artifacts: [] }]);

    try {
      const inlineData = file ? { mimeType: file.mimeType, data: file.data } : undefined;

      for await (const chunk of streamMessage(userId, sessionId, text, inlineData)) {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role !== "agent") return prev;
          return [
            ...updated.slice(0, -1),
            {
              role: "agent",
              text: chunk.text ? last.text + chunk.text : last.text,
              artifacts: chunk.artifacts ? [...(last.artifacts ?? []), ...chunk.artifacts] : last.artifacts,
            },
          ];
        });
      }

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "agent" && last.text === "" && !last.artifacts?.length) {
          return [...prev.slice(0, -1), { role: "agent", text: "I didn't receive a response. Please try again." }];
        }
        return prev;
      });

      if (isFirstMessage) savePreview(sessionId, text);
      await refreshSessionList();
    } catch (err) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "agent" && last.text === "") return prev.slice(0, -1);
        return prev;
      });
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [loading, ensureSession, messages.length, userId, sessionId, setMessages, setLoading, setError, refreshSessionList]);

  // Show username modal if not logged in
  if (!username) {
    return <UsernameModal onSubmit={setUsername} />;
  }

  return (
    <div className="flex h-full min-h-0 w-full bg-white relative">
      {/* Column 1: Navy Sidebar */}
      <Sidebar isOpenMobile={sidebarOpen} onCloseMobile={() => setSidebarOpen(false)} onOpenPolicies={() => setPoliciesOpen(true)} onClosePolicies={() => setPoliciesOpen(false)} policiesOpen={policiesOpen} />

      {/* Columns 2+3+4 wrapper with shared top bar */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative">

        {/* Top bar: spans col 2+3+4 — Buddy on left, bell+avatar on right */}
        <div className="flex items-center justify-between px-3 md:px-5 py-3 border-b border-[#e5e7eb] bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 -ml-1 text-[#6b7280] hover:bg-gray-100 rounded-md" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <svg width="30" height="28" viewBox="0 0 36 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="hidden sm:block">
              <rect x="0" y="0" width="36" height="28" rx="8" fill="#00a86b"/>
              <polygon points="8,28 4,34 16,28" fill="#00a86b"/>
              <circle cx="11" cy="14" r="2.5" fill="white"/>
              <circle cx="18" cy="14" r="2.5" fill="white"/>
              <circle cx="25" cy="14" r="2.5" fill="white"/>
            </svg>
              <div>
              <h2 className="font-black text-[#1f2937] text-[20px] leading-none tracking-[-0.03em]">Buddy</h2>
                <p className="text-[12px] text-[#6b7280] font-light mt-0.5">Travel Insurance Communication Hub</p>
              </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative">
              <Bell size={20} className="text-[#6b7280]" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
            </div>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="avatar" />
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-[13px] font-semibold text-[#1f2937]">{username}</span>
                <span className="text-[10px] font-light text-[#6b7280]">Partner ID: PT12345</span>
              </div>
              <ChevronDown size={14} className="text-[#6b7280]" />
            </div>
          </div>
        </div>

        {/* Bottom row: col 2 + col 3 + col 4 */}
        <div className="flex flex-1 min-h-0 relative">

      {/* Column 2: Conversation List */}
      <ConversationList 
        onNewChat={handleNewChat} 
        onQuickPrompt={handleSend} 
        isOpenMobile={listOpen} 
        onCloseMobile={() => setListOpen(false)} 
      />

      {/* Column 3: Main Chat Stream */}
      <div className="flex flex-col flex-1 min-w-0 h-full bg-white relative">
        {/* Chat Header */}
        <header className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-2 md:gap-3">
            <button className="lg:hidden p-1.5 -ml-1 text-[#6b7280] hover:bg-gray-100 rounded-md" onClick={() => setListOpen(true)}>
              <Users size={20} />
            </button>
            <div className="w-8 h-8 rounded border border-[#e5e7eb] text-[#00a86b] flex items-center justify-center bg-white shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-[#1f2937] text-sm leading-tight truncate">Travel Insurance Support</h2>
              <p className="text-xs font-light text-[#6b7280] truncate">@{username} · AI Active</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 text-[#6b7280] shrink-0">
            <button className="hover:text-[#1f2937] hidden sm:block"><Search size={18} /></button>
            <button className="hover:text-[#1f2937] hidden sm:block"><Phone size={18} /></button>
            <button className="xl:hidden p-1.5 text-[#6b7280] hover:bg-gray-100 rounded-md" onClick={() => setDetailsOpen(true)}>
              <Info size={20} />
            </button>
            <button className="hover:text-[#1f2937]"><MoreVertical size={18} /></button>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 bg-[#efeae2]">
          {error && (
            <div className="flex items-center gap-2 mb-4 text-xs p-3 rounded bg-red-50 text-red-700 border border-red-200">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col max-w-3xl mx-auto">
            <div className="text-center my-4">
              <span className="text-[10px] font-semibold text-[#6b7280] bg-white px-3 py-1 rounded-full border border-[#e5e7eb]">
                Today
              </span>
            </div>

            {messages.length === 0 && !loading && (
              <div className="flex items-start gap-2 my-2">
                <div className="w-8 h-8 rounded-full bg-[#00a86b] shrink-0 flex items-center justify-center mt-5">
                  <span className="text-sm">🎧</span>
                </div>
                <div className="flex flex-col items-start max-w-[75%]">
                  <span className="text-xs font-semibold text-[#00a86b] mb-1 ml-1">Operations Team</span>
                  <div className="bg-white rounded-[10px] rounded-tl-[2px] shadow-sm px-3 py-2">
                    <p className="text-sm text-[#1f2937]">Hey @{username}, how can I help you today?</p>
                    <span className="text-[10px] text-[#adb5bd] block text-right mt-1">Just now</span>
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <Message key={i} msg={msg} userId={userId} sessionId={sessionId} onSend={(text) => handleSend(text)} />
            ))}
          </div>
          <div ref={bottomRef} />
        </div>

        {/* Chat Input Dock */}
        <div className="shrink-0">
          <ChatInput onSend={handleSend} disabled={loading} />
        </div>

      </div>

      {/* Column 4: Conversation Details Panel */}
      <ConversationDetails 
        isOpenMobile={detailsOpen} 
        onCloseMobile={() => setDetailsOpen(false)} 
      />
        </div>{/* end bottom row */}

        {/* Policies overlay — covers full col 2+3+4 area */}
        <PoliciesPanel isOpen={policiesOpen} onClose={() => setPoliciesOpen(false)} />

      </div>{/* end col 2+3+4 wrapper */}
    </div>
  );
}
