"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createSession, listSessions, getSession, deleteSession, eventsToMessages, sessionPreview, ADKSession, fetchWallet, fetchUserCampaignMessages, markCampaignMessagesSeen } from "@/lib/api";
import { listGroups, deleteGroup, GroupItem } from "@/lib/groupApi";
import { getUsername, getOrCreateSession, newSession, setActiveSession } from "@/lib/session";
import type { Msg } from "@/components/Message";
import { useRef } from "react";

import type { PreviewDocument } from "@/components/DocumentModal";

export interface ChatSessionMeta {
  id: string;
  preview: string;
  lastUpdateTime: number;
  unreadCount?: number;
  isCampaign?: boolean;
  isGroup?: boolean;
  groupMeta?: GroupItem;
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
  groups: GroupItem[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  refreshGroups: () => Promise<void>;
  walletBalance: number;
  unreadCount: number;
  previewDoc: PreviewDocument | null;
  openDocumentPreview: (doc: PreviewDocument) => void;
  closeDocumentPreview: () => void;
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
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [previewDoc, setPreviewDoc] = useState<PreviewDocument | null>(null);

  const totalUnreadCount =
    sessions.reduce((acc, s) => acc + (s.unreadCount || 0), 0) +
    groups.reduce((acc, g) => acc + (g.unread_count || 0), 0);

  const openDocumentPreview = useCallback((doc: PreviewDocument) => {
    setPreviewDoc(doc);
  }, []);

  const closeDocumentPreview = useCallback(() => {
    setPreviewDoc(null);
  }, []);

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

  const refreshGroups = useCallback(async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;
    try {
      const grps = await listGroups(id);
      setGroups(grps);
    } catch (err) {
      console.warn("Failed to refresh groups:", err);
    }
  }, [userId]);

  const refreshSessionList = useCallback(async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;
    try {
      const [list, campaignMsgs, groupList] = await Promise.all([
        listSessions(id).catch(() => []),
        fetchUserCampaignMessages(id).catch(() => []),
        listGroups(id).catch(() => []),
      ]);

      setGroups(groupList);

      const sorted = [...list].sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);

      const adkResults = await Promise.all(
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

      const activeAdk = adkResults.filter((s): s is ChatSessionMeta => s !== null);
      const existingIds = new Set(activeAdk.map((s) => s.id));
      const campSessions: ChatSessionMeta[] = [];

      for (const c of campaignMsgs) {
        const sid = c.session_id || `session_camp_${c.id}`;
        const title = `📢 ${c.title}`;
        savePreview(sid, title);
        const isUnread = c.is_seen === 0 && sid !== sessionId;

        if (!existingIds.has(sid)) {
          existingIds.add(sid);
          campSessions.push({
            id: sid,
            preview: title,
            lastUpdateTime: Math.floor(new Date(c.created_at).getTime() / 1000),
            unreadCount: isUnread ? 1 : 0,
            isCampaign: true,
          });
        } else {
          const match = activeAdk.find((s) => s.id === sid);
          if (match) {
            match.unreadCount = isUnread ? 1 : 0;
            match.isCampaign = true;
          }
        }
      }

      // Merge groups into session list
      const groupSessions: ChatSessionMeta[] = groupList.map((g) => ({
        id: g.id,
        preview: g.name,
        lastUpdateTime: Math.floor(new Date(g.updated_at).getTime() / 1000),
        unreadCount: g.id === activeGroupId ? 0 : (g.unread_count || 0),
        isGroup: true,
        groupMeta: g,
      }));

      const merged = [...groupSessions, ...campSessions, ...activeAdk].sort(
        (a, b) => b.lastUpdateTime - a.lastUpdateTime
      );
      setSessions(merged);
    } catch {
      // ignore
    }
  }, [userId, sessionId, activeGroupId]);

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

  const processedCampaignIds = useRef<Set<string>>(new Set());

  const checkCampaignMessages = useCallback(async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;
    try {
      const unseen = await fetchUserCampaignMessages(id, true);
      if (unseen && unseen.length > 0) {
        const seenIds: string[] = [];

        for (const item of unseen) {
          const sid = item.session_id || `session_camp_${item.id}`;
          // If the user currently has this exact campaign session open
          if (sid === sessionId) {
            if (!processedCampaignIds.current.has(item.id)) {
              processedCampaignIds.current.add(item.id);
              setMessages((prev) => [
                ...prev,
                { role: "agent", text: `📢 **${item.title}**\n\n${item.message}` },
              ]);
              setSessionReadyRaw(true);
            }
            seenIds.push(item.id);
          }
        }

        if (seenIds.length > 0) {
          await markCampaignMessagesSeen(id, seenIds);
        }

        // Always refresh session list so new unread badge (1) and campaign session appear on sidebar
        await refreshSessionList(id);
      }
    } catch {
      // ignore network errors during poll
    }
  }, [userId, sessionId, refreshSessionList]);

  useEffect(() => {
    const name = getUsername();
    if (name) {
      setUsernameState(name);
      const { userId: uid, sessionId: sid } = getOrCreateSession();
      setUserId(uid);
      setSessionId(sid);
      getSession(uid, sid).then(async (existing) => {
        if (existing && existing.events.length > 0) {
          setMessages(eventsToMessages(existing.events));
          setSessionReadyRaw(true);
        } else if (existing) {
          setSessionReadyRaw(true);
        } else if (sid.startsWith("session_camp_")) {
          // Check campaign msg fallback
          const campMsgs = await fetchUserCampaignMessages(uid).catch(() => []);
          const match = campMsgs.find((c) => c.session_id === sid);
          if (match) {
            setMessages([{ role: "agent", text: `📢 **${match.title}**\n\n${match.message}` }]);
            setSessionReadyRaw(true);
          } else {
            setSessionReadyRaw(null);
          }
        } else {
          setSessionReadyRaw(null);
        }
      }).catch(() => setSessionReadyRaw(null));
      refreshSessionList(uid);
      refreshWallet(uid);
      checkCampaignMessages(uid);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Live polling for scheduled campaign broadcasts every 5 seconds
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      checkCampaignMessages(userId);
    }, 5000);
    return () => clearInterval(interval);
  }, [userId, checkCampaignMessages]);

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
    setActiveGroupId(null);
    const { sessionId: sid } = newSession(userId);
    setSessionId(sid);
    setMessages([]);
    setSessionReadyRaw(null);
    setError(null);
  }, [userId]);

  const switchSession = useCallback(async (sid: string) => {
    if (!userId) return;

    if (sid.startsWith("grp_")) {
      setActiveGroupId(sid);
      setSessions((prev) => prev.map((s) => s.id === sid ? { ...s, unreadCount: 0 } : s));
      return;
    }

    setActiveGroupId(null);
    setActiveSession(sid);
    setSessionId(sid);
    setMessages([]);
    setError(null);
    try {
      // Ensure session exists in ADK
      createSession(userId, sid).catch(() => {});
      const session: ADKSession | null = await getSession(userId, sid);
      
      let loadedMessages: Msg[] = [];
      if (session && session.events && session.events.length > 0) {
        loadedMessages = eventsToMessages(session.events);
        const preview = sessionPreview(session.events);
        if (preview && preview !== "New conversation") savePreview(sid, preview);
      }

      // If it's a campaign session and ADK events are empty or need campaign message
      if (loadedMessages.length === 0 && (sid.startsWith("session_camp_") || sid.startsWith("campaign_"))) {
        const campMsgs = await fetchUserCampaignMessages(userId).catch(() => []);
        const match = campMsgs.find((c) => c.session_id === sid || `session_camp_${c.id}` === sid || `session_camp_${c.campaign_id?.slice(0, 8)}` === sid);
        if (match) {
          loadedMessages = [{
            role: "agent",
            text: `📢 **${match.title}**\n\n${match.message}`,
          }];
          savePreview(sid, `📢 ${match.title}`);
        }
      }

      setMessages(loadedMessages);
      setSessionReadyRaw(true);

      // Mark this campaign message as read and clear unread badge
      const campMsgs = await fetchUserCampaignMessages(userId, true).catch(() => []);
      const unreadForThis = campMsgs.filter((c) => c.session_id === sid || `session_camp_${c.id}` === sid);
      if (unreadForThis.length > 0) {
        await markCampaignMessagesSeen(userId, unreadForThis.map((c) => c.id)).catch(() => {});
      }
      setSessions((prev) => prev.map((s) => s.id === sid ? { ...s, unreadCount: 0 } : s));
    } catch {
      setError("Could not load conversation.");
    }
  }, [userId]);

  const removeSession = useCallback(async (sid: string) => {
    if (sid.startsWith("grp_")) {
      try {
        await deleteGroup(sid, userId);
      } catch (e) {
        console.error("Failed to delete group:", e);
      }
      if (sid === activeGroupId) {
        setActiveGroupId(null);
      }
      refreshGroups();
      setSessions((prev) => prev.filter((s) => s.id !== sid));
      return;
    }
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
  }, [userId, sessionId, activeGroupId, refreshGroups]);

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
      groups,
      activeGroupId,
      setActiveGroupId,
      refreshGroups,
      walletBalance,
      unreadCount: totalUnreadCount,
      previewDoc,
      openDocumentPreview,
      closeDocumentPreview,
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
