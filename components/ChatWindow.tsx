"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createSession, streamMessage } from "@/lib/api";
import { getOrCreateSession, newSession } from "@/lib/session";
import Sidebar from "./Sidebar";
import Message, { Msg } from "./Message";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import WelcomeScreen from "./WelcomeScreen";
import { AlertCircle, RefreshCw, Menu, Shield, CheckCircle2, Phone, Video, Info } from "lucide-react";

export default function ChatWindow() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const initSession = useCallback(async (uid: string, sid: string) => {
    try {
      setError(null);
      await createSession(uid, sid);
      setSessionReady(true);
    } catch {
      setError("Could not connect to backend AI service. Please check server connection.");
    }
  }, []);

  useEffect(() => {
    const { userId: uid, sessionId: sid } = getOrCreateSession();
    setUserId(uid);
    setSessionId(sid);
    initSession(uid, sid);
  }, [initSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(
    text: string,
    file?: { mimeType: string; data: string; name: string }
  ) {
    if (!sessionReady || loading) return;

    const userMsg: Msg = { role: "user", text: file ? `${text}\n📎 ${file.name}` : text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    const agentPlaceholder: Msg = { role: "agent", text: "", artifacts: [] };
    setMessages((prev) => [...prev, agentPlaceholder]);

    try {
      const inlineData = file ? { mimeType: file.mimeType, data: file.data } : undefined;

      for await (const chunk of streamMessage(userId, sessionId, text, inlineData)) {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role !== "agent") return prev;
          const newText = chunk.text ? last.text + chunk.text : last.text;
          const newArtifacts = chunk.artifacts
            ? [...(last.artifacts ?? []), ...chunk.artifacts]
            : last.artifacts;
          updated[updated.length - 1] = { role: "agent", text: newText, artifacts: newArtifacts };
          return updated;
        });
      }

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "agent" && last.text === "" && !last.artifacts?.length) {
          return [
            ...prev.slice(0, -1),
            { role: "agent", text: "I didn't receive a response. Please try sending your message again." },
          ];
        }
        return prev;
      });
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
  }

  async function handleNewChat() {
    const { userId: uid, sessionId: sid } = newSession();
    setUserId(uid);
    setSessionId(sid);
    setMessages([]);
    setSessionReady(false);
    setError(null);
    await initSession(uid, sid);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-950">
      {/* Sidebar / DM Inbox */}
      <Sidebar
        onNewChat={handleNewChat}
        onQuickPrompt={(p) => handleSend(p)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Instagram DM Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full bg-stone-900">
        {/* Instagram DM Top Navigation Bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-900/90 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-stone-400 hover:text-white hover:bg-stone-800"
              aria-label="Open messages list"
            >
              <Menu size={20} />
            </button>

            {/* DM Profile Header */}
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
                  <Shield size={18} />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-stone-900"></span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-sm sm:text-base text-white font-heading leading-none">
                    Dolphin Buddy
                  </h2>
                  <CheckCircle2 size={14} className="text-emerald-400 fill-emerald-400/20" />
                </div>
                <p className="text-[11px] font-medium text-emerald-400 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active now
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-stone-800 hover:bg-stone-700 text-white transition-all border border-stone-700"
              title="Start fresh conversation"
            >
              <RefreshCw size={13} className="text-emerald-400" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Conversation Stream Area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
          {error && (
            <div className="flex items-center gap-2.5 mx-auto mb-4 max-w-xl text-xs sm:text-sm px-4 py-3 rounded-2xl bg-rose-950/80 text-rose-200 border border-rose-800">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {messages.length === 0 && !loading ? (
            <WelcomeScreen onPrompt={(p) => handleSend(p)} />
          ) : (
            <div className="flex flex-col max-w-3xl mx-auto">
              <div className="text-center my-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 bg-stone-800/60 px-3 py-1 rounded-full">
                  Today
                </span>
              </div>
              {messages.map((msg, i) => (
                <Message key={i} msg={msg} userId={userId} sessionId={sessionId} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Instagram DM Floating Input Dock */}
        <div className="shrink-0">
          <ChatInput onSend={handleSend} disabled={loading || !sessionReady} />
        </div>
      </div>
    </div>
  );
}
