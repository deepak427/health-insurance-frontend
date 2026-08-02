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
import { AlertCircle, Search, Phone, MoreVertical, ShieldCheck, Bell, ChevronDown } from "lucide-react";

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
  // local mobile sidebar state (not needed for logic, kept for UI compat)
  const [, setMobileOpen] = useState(false);

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

    setMessages((prev) => [...prev, { role: "user", text: file ? `${text}\n📎 ${file.name}` : text }]);
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
    <div className="flex h-[85vh] min-h-[600px] w-full bg-white relative">
      {/* Column 1: Navy Sidebar */}
      <Sidebar />

      {/* Columns 2+3+4 wrapper with shared top bar */}
      <div className="flex flex-col flex-1 min-w-0 h-full">

        {/* Top bar: spans col 2+3+4 — Buddy on left, bell+avatar on right */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#e5e7eb] bg-white shrink-0">
          <div className="flex items-center gap-3">
            <svg width="30" height="28" viewBox="0 0 36 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="36" height="28" rx="8" fill="#00a86b"/>
              <polygon points="8,28 4,34 16,28" fill="#00a86b"/>
              <circle cx="11" cy="14" r="2.5" fill="white"/>
              <circle cx="18" cy="14" r="2.5" fill="white"/>
              <circle cx="25" cy="14" r="2.5" fill="white"/>
            </svg>
            <div>
              <h2 className="font-bold text-[#1f2937] text-[19px] leading-tight">Buddy</h2>
              <p className="text-[12px] text-[#6b7280]">Travel Insurance Communication Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell size={20} className="text-[#6b7280]" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
            </div>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="avatar" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[13px] font-semibold text-[#1f2937]">{username}</span>
                <span className="text-[10px] text-[#6b7280]">Partner ID: PT12345</span>
              </div>
              <ChevronDown size={14} className="text-[#6b7280]" />
            </div>
          </div>
        </div>

        {/* Bottom row: col 2 + col 3 + col 4 */}
        <div className="flex flex-1 min-h-0">

      {/* Column 2: Conversation List */}
      <ConversationList onNewChat={handleNewChat} onQuickPrompt={handleSend} />

      {/* Column 3: Main Chat Stream */}
      <div className="flex flex-col flex-1 min-w-0 h-full bg-white relative">
        {/* Chat Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-[#e5e7eb] text-[#00a86b] flex items-center justify-center bg-white">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="font-bold text-[#1f2937] text-sm leading-tight">Travel Insurance Support</h2>
              <p className="text-xs text-[#6b7280]">@{username} · AI Active</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[#6b7280]">
            <button className="hover:text-[#1f2937]"><Search size={18} /></button>
            <button className="hover:text-[#1f2937]"><Phone size={18} /></button>
            <button className="hover:text-[#1f2937]"><MoreVertical size={18} /></button>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-[#f8fafc]">
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
              <div className="flex items-start gap-3 my-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Priya" alt="avatar" />
                </div>
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#1f2937]">Dolphin Buddy</span>
                    <span className="text-xs text-[#6b7280]">| Insurance AI</span>
                  </div>
                  <div className="bg-white border border-[#e5e7eb] rounded-lg px-4 py-3 shadow-sm max-w-[85%]">
                    <p className="text-sm text-[#1f2937]">Hi @{username}! How can I help you with your insurance today?</p>
                  </div>
                  <span className="text-[10px] text-[#6b7280] mt-1 ml-1">Just now</span>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <Message key={i} msg={msg} userId={userId} sessionId={sessionId} />
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
      <ConversationDetails />
        </div>{/* end bottom row */}
      </div>{/* end col 2+3+4 wrapper */}
    </div>
  );
}
