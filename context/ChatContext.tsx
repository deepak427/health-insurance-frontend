"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createSession, listSessions, getSession, deleteSession, eventsToMessages, sessionPreview, ADKSession, fetchWallet } from "@/lib/api";
import { getUsername, getOrCreateSession, newSession, setActiveSession } from "@/lib/session";
import type { Msg } from "@/components/Message";

export interface ChatSessionMeta {
  id: string;
  preview: string;
  lastUpdateTime: number;
}

interface ChatContextValue {
  username: string | null;
  userId: string;
  sessionId: string;
  messages: Msg[];
  sessionReady: boolean;
  loading: boolean;
  error: string | null;
  sessions: ChatSessionMeta[];
  walletBalance: number;
  setWalletBalance: (v: number) => void;
  refreshWallet: () => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Msg[]>>;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  setSessionReady: (v: boolean) => void;
  ensureSession: () => Promise<boolean>;
  handleNewChat: () => void;
  switchSession: (sessionId: string) => Promise<void>;
  removeSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, newName: string) => void;
  refreshSessionList: () => Promise<void>;
  setUsername: (name: string) => void;
  logout: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// ── localStorage preview cache ────────────────────────────────────────────────
export function savePreview(sessionId: string, text: string) {
  try {
    const raw = localStorage.getItem("hip_previews") ?? "{}";
    const map = JSON.parse(raw);
    map[sessionId] = text.slice(0, 60) + (text.length > 60 ? "…" : "");
    localStorage.setItem("hip_previews", JSON.stringify(map));
  } catch {}
}

function loadPreview(sid: string): string {
  try {
    const raw = localStorage.getItem("hip_previews") ?? "{}";
    return JSON.parse(raw)[sid] ?? "";
  } catch { return ""; }
}

function removePreview(sid: string) {
  try {
    const raw = localStorage.getItem("hip_previews") ?? "{}";
    const map = JSON.parse(raw);
    delete map[sid];
    localStorage.setItem("hip_previews", JSON.stringify(map));
  } catch {}
}
// ─────────────────────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sessionReady, setSessionReadyRaw] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSessionMeta[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const refreshWallet = useCallback(async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;
    try {
      const w = await fetchWallet(id);
      setWalletBalance(w.balance);
    } catch {
      // ignore
    }
  }, [userId]);

  const refreshSessionList = useCallback(async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;
    const list = await listSessions(id);
    const sorted = [...list].sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);

    // ADK list endpoint returns sessions WITHOUT events populated (metadata only).
    // Strategy:
    //  1. If we have a cached preview for a session → show it immediately (fast path)
    //  2. If no cache → fetch full session to check events (backfill for older sessions)
    //  3. Sessions with no cache AND no events → blank/unused, skip them
    const results = await Promise.all(
      sorted.map(async (s) => {
        const cached = loadPreview(s.id);
        if (cached) return { id: s.id, preview: cached, lastUpdateTime: s.lastUpdateTime };

        try {
          const full = await getSession(id, s.id);
          if (!full || !full.events || full.events.length === 0) return null;
          const preview = sessionPreview(full.events);
          if (preview && preview !== "New conversation") savePreview(s.id, preview);
          return { id: s.id, preview: preview || "Conversation", lastUpdateTime: s.lastUpdateTime };
        } catch {
          return null;
        }
      })
    );

    setSessions(results.filter((s): s is ChatSessionMeta => s !== null));
  }, [userId]);

  const ensureSession = useCallback(async (): Promise<boolean> => {
    if (sessionReady === true) return true;
    try {
      setError(null);
      await createSession(userId, sessionId);
      setSessionReadyRaw(true);
      return true;
    } catch {
      setError("Could not connect to backend AI service.");
      return false;
    }
  }, [sessionReady, userId, sessionId]);

  useEffect(() => {
    const name = getUsername();
    if (name) {
      setUsernameState(name);
      const { userId: uid, sessionId: sid } = getOrCreateSession();
      setUserId(uid);
      setSessionId(sid);
      getSession(uid, sid).then((existing) => {
        if (existing && existing.events.length > 0) {
          setMessages(eventsToMessages(existing.events));
          setSessionReadyRaw(true);
        } else if (existing) {
          setSessionReadyRaw(true);
        } else {
          setSessionReadyRaw(null);
        }
      }).catch(() => setSessionReadyRaw(null));
      refreshSessionList(uid);
      refreshWallet(uid);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setUsername = useCallback((name: string) => {
    import("@/lib/session").then(({ setUsername: save }) => save(name));
    setUsernameState(name);
    const sid = `session_${Math.random().toString(36).slice(2, 18)}`;
    setUserId(name);
    setSessionId(sid);
    localStorage.setItem("hip_sessionId", sid);
    setSessionReadyRaw(null);
    refreshSessionList(name);
    refreshWallet(name);
  }, [refreshSessionList, refreshWallet]);

  const logout = useCallback(() => {
    localStorage.removeItem("hip_username");
    localStorage.removeItem("hip_userId");
    localStorage.removeItem("hip_sessionId");
    setUsernameState(null);
    setUserId("");
    setSessionId("");
    setMessages([]);
    setSessions([]);
    setSessionReadyRaw(null);
    setError(null);
  }, []);

  const handleNewChat = useCallback(() => {
    if (!userId) return;
    const { sessionId: sid } = newSession(userId);
    setSessionId(sid);
    setMessages([]);
    setSessionReadyRaw(null);
    setError(null);
  }, [userId]);

  const switchSession = useCallback(async (sid: string) => {
    if (!userId) return;
    setActiveSession(sid);
    setSessionId(sid);
    setMessages([]);
    setError(null);
    try {
      const session: ADKSession | null = await getSession(userId, sid);
      if (session) {
        setMessages(eventsToMessages(session.events));
        const preview = sessionPreview(session.events);
        if (preview && preview !== "New conversation") savePreview(sid, preview);
      }
      setSessionReadyRaw(true);
    } catch {
      setError("Could not load conversation.");
    }
  }, [userId]);

  const removeSession = useCallback(async (sid: string) => {
    await deleteSession(userId, sid);
    removePreview(sid);
    // If deleting the active session, start a fresh new chat
    if (sid === sessionId) {
      const { sessionId: newSid } = newSession(userId);
      setSessionId(newSid);
      setMessages([]);
      setSessionReadyRaw(null);
    }
    setSessions((prev) => prev.filter((s) => s.id !== sid));
  }, [userId, sessionId]);

  const renameSession = useCallback((sid: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    savePreview(sid, trimmed);
    setSessions((prev) => prev.map((s) => s.id === sid ? { ...s, preview: trimmed } : s));
  }, []);

  return (
    <ChatContext.Provider value={{
      username,
      userId,
      sessionId,
      messages,
      sessionReady: sessionReady === true,
      loading,
      error,
      sessions,
      walletBalance,
      setWalletBalance,
      refreshWallet,
      setMessages,
      setLoading,
      setError,
      setSessionReady: (v) => setSessionReadyRaw(v),
      ensureSession,
      handleNewChat,
      switchSession,
      removeSession,
      renameSession,
      refreshSessionList,
      setUsername,
      logout,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}
