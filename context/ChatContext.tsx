"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createSession, listSessions, getSession, eventsToMessages, sessionPreview, ADKSession } from "@/lib/api";
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
  setMessages: React.Dispatch<React.SetStateAction<Msg[]>>;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  setSessionReady: (v: boolean) => void;
  handleNewChat: () => Promise<void>;
  switchSession: (sessionId: string) => Promise<void>;
  refreshSessionList: () => Promise<void>;
  setUsername: (name: string) => void;
  logout: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSessionMeta[]>([]);

  const refreshSessionList = useCallback(async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;
    const list = await listSessions(id);
    const sorted = [...list].sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);
    setSessions(sorted.map((s) => ({
      id: s.id,
      preview: sessionPreview(s.events),
      lastUpdateTime: s.lastUpdateTime,
    })));
  }, [userId]);

  const initSession = useCallback(async (uid: string, sid: string) => {
    try {
      setError(null);
      await createSession(uid, sid);
      setSessionReady(true);
      await refreshSessionList(uid);
    } catch {
      setError("Could not connect to backend AI service.");
    }
  }, [refreshSessionList]);

  // Boot: read username + session from localStorage
  useEffect(() => {
    const name = getUsername();
    if (name) {
      setUsernameState(name);
      const { userId: uid, sessionId: sid } = getOrCreateSession();
      setUserId(uid);
      setSessionId(sid);
      initSession(uid, sid);
    }
  }, [initSession]);

  const setUsername = useCallback((name: string) => {
    import("@/lib/session").then(({ setUsername: save }) => save(name));
    setUsernameState(name);
    const sid = `session_${Math.random().toString(36).slice(2, 18)}`;
    setUserId(name);
    setSessionId(sid);
    localStorage.setItem("hip_sessionId", sid);
    initSession(name, sid);
  }, [initSession]);

  const logout = useCallback(() => {
    localStorage.removeItem("hip_username");
    localStorage.removeItem("hip_userId");
    localStorage.removeItem("hip_sessionId");
    setUsernameState(null);
    setUserId("");
    setSessionId("");
    setMessages([]);
    setSessions([]);
    setSessionReady(false);
    setError(null);
  }, []);

  const handleNewChat = useCallback(async () => {
    if (!userId) return;
    const { sessionId: sid } = newSession(userId);
    setSessionId(sid);
    setMessages([]);
    setSessionReady(false);
    setError(null);
    await initSession(userId, sid);
  }, [userId, initSession]);

  const switchSession = useCallback(async (sid: string) => {
    if (!userId) return;
    setActiveSession(sid);
    setSessionId(sid);
    setMessages([]);
    setSessionReady(false);
    setError(null);

    try {
      const session: ADKSession | null = await getSession(userId, sid);
      if (session) {
        const msgs = eventsToMessages(session.events);
        setMessages(msgs);
      }
      setSessionReady(true);
    } catch {
      setError("Could not load conversation.");
    }
  }, [userId]);

  return (
    <ChatContext.Provider value={{
      username,
      userId,
      sessionId,
      messages,
      sessionReady,
      loading,
      error,
      sessions,
      setMessages,
      setLoading,
      setError,
      setSessionReady,
      handleNewChat,
      switchSession,
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
