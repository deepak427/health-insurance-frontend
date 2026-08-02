"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createSession, streamMessage } from "@/lib/api";
import { getOrCreateSession, newSession } from "@/lib/session";
import Sidebar from "./Sidebar";
import Message, { Msg } from "./Message";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import WelcomeScreen from "./WelcomeScreen";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ChatWindow() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const initSession = useCallback(async (uid: string, sid: string) => {
    try {
      setError(null);
      await createSession(uid, sid);
      setSessionReady(true);
    } catch {
      setError("Could not connect to the agent backend. Make sure the server is running.");
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

    // We'll track the agent message by appending a placeholder, then updating it in place
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

      // Remove placeholder if nothing came back
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "agent" && last.text === "" && !last.artifacts?.length) {
          return [
            ...prev.slice(0, -1),
            { role: "agent", text: "I didn't receive a response. Please try again." },
          ];
        }
        return prev;
      });
    } catch (err) {
      // Remove the empty placeholder before showing the error
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "agent" && last.text === "") return prev.slice(0, -1);
        return prev;
      });
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar onNewChat={handleNewChat} onQuickPrompt={(p) => handleSend(p)} />

      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Header */}
        <header
          className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
          style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
        >
          <div>
            <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
              Insurance Support Agent
            </h2>
            <p className="text-xs" style={{ color: sessionReady ? "#34d399" : "var(--text-muted)" }}>
              {sessionReady ? "● Connected" : error ? "● Disconnected" : "● Connecting…"}
            </p>
          </div>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-70"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            <RefreshCw size={12} />
            New Chat
          </button>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {error && (
            <div
              className="flex items-start gap-2 mx-auto mb-4 max-w-xl text-sm px-4 py-3 rounded-xl"
              style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {messages.length === 0 && !loading ? (
            <WelcomeScreen onPrompt={(p) => handleSend(p)} />
          ) : (
            <div className="flex flex-col gap-5 max-w-3xl mx-auto">
              {messages.map((msg, i) => (
                <Message key={i} msg={msg} userId={userId} sessionId={sessionId} />
              ))}
              {loading && <TypingIndicator />}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0">
          <ChatInput onSend={handleSend} disabled={loading || !sessionReady} />
        </div>
      </div>
    </div>
  );
}
