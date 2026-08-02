"use client";

import { useEffect, useRef, useCallback } from "react";
import { streamMessage } from "@/lib/api";
import { useChatContext, savePreview } from "@/context/ChatContext";
import Sidebar from "./Sidebar";
import Message from "./Message";
import ChatInput from "./ChatInput";
import WelcomeScreen from "./WelcomeScreen";
import UsernameModal from "./UsernameModal";
import { AlertCircle, RefreshCw, Menu, Shield, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function ChatWindow() {
  const {
    username,
    userId,
    sessionId,
    messages,
    sessionReady,
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = useCallback(async (
    text: string,
    file?: { mimeType: string; data: string; name: string }
  ) => {
    if (loading) return;

    // Lazily create the session on backend the first time a message is sent
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

      // Cache preview from first user message, then refresh sidebar
      if (isFirstMessage) {
        savePreview(sessionId, text);
      }
      await refreshSessionList();
    } catch (err) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "agent" && last.text === "") return prev.slice(0, -1);
        return prev;
      });
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [loading, ensureSession, messages.length, userId, sessionId, setMessages, setLoading, setError, refreshSessionList]);

  // Show username modal if not set
  if (!username) {
    return <UsernameModal onSubmit={setUsername} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f9f8f6]">
      <Sidebar
        onQuickPrompt={(p) => handleSend(p)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 h-full bg-[#f9f8f6]">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#e2ded7] bg-[#f9f8f6]/90 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-[#797571] hover:text-[#2c2a29] hover:bg-[#e2ded7]"
              aria-label="Open messages list"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full bg-[#5b7c72] flex items-center justify-center text-white shadow-sm border border-[#e2ded7]">
                  <Shield size={20} />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#e8a598] border-2 border-[#f9f8f6]"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[17px] text-[#2c2a29] font-heading leading-none font-bold">
                    Dolphin Buddy
                  </h2>
                  <CheckCircle2 size={16} className="text-[#5b7c72] fill-[#5b7c72]/10" />
                </div>
                <p className="text-[11px] font-bold text-[#e8a598] mt-1.5 flex items-center gap-1 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e8a598] animate-soft-pulse"></span>
                  Active now
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-[16px] bg-[#ffffff] hover:bg-[#f1efe9] text-[#5b7c72] transition-all border border-[#e2ded7] shadow-sm"
              title="Start fresh conversation"
            >
              <RefreshCw size={14} className="text-[#e8a598]" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          {error && (
            <div className="flex items-center gap-3 mx-auto mb-5 max-w-xl text-sm px-5 py-4 rounded-[20px] bg-[#fff0ed] text-[#b34040] border border-[#e8a598]/40 shadow-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {messages.length === 0 && !loading ? (
            <WelcomeScreen onPrompt={(p) => handleSend(p)} />
          ) : (
            <div className="flex flex-col max-w-3xl mx-auto">
              <div className="text-center my-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#9e9a95]">Today</span>
              </div>
              {messages.map((msg, i) => (
                <Message key={i} msg={msg} userId={userId} sessionId={sessionId} />
              ))}
              {loading && (
                <div className="flex items-center gap-2 px-4 py-3 text-[#797571] text-sm">
                  <span className="w-2 h-2 rounded-full bg-[#5b7c72] animate-bounce [animation-delay:0ms]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#5b7c72] animate-bounce [animation-delay:150ms]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#5b7c72] animate-bounce [animation-delay:300ms]"></span>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0">
          <ChatInput onSend={handleSend} disabled={loading} />
        </div>
      </div>
    </div>
  );
}
