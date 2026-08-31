"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Users,
  ShieldCheck,
  Send,
  Paperclip,
  MoreVertical,
  Trash2,
  LogOut,
  Info,
  Loader2,
  X,
  Sparkles,
  UserPlus,
  UserMinus,
  Plus,
  Check,
  Search,
  Zap,
} from "lucide-react";
import { useChatContext } from "@/context/ChatContext";
import {
  getGroup,
  getGroupMessages,
  postGroupMessage,
  markGroupRead,
  deleteGroup,
  addMember,
  removeMember,
  listUsers,
  streamBuddyGroupMessage,
  getGroupSessionIdentity,
  GroupDetail,
  GroupMessage,
  BUDDY_USER_ID,
  BUDDY_DISPLAY_NAME,
} from "@/lib/groupApi";
import Message, { Msg } from "./Message";

interface Props {
  groupId: string;
  onToggleDetails?: () => void;
  detailsOpen?: boolean;
}

const AVATAR_COLORS = [
  "text-[#e53935]",
  "text-[#1e88e5]",
  "text-[#43a047]",
  "text-[#fb8c00]",
  "text-[#8e24aa]",
  "text-[#00acc1]",
  "text-[#3949ab]",
];

function getMemberColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function GroupChatWindow({ groupId, onToggleDetails, detailsOpen }: Props) {
  const { userId, username, setActiveGroupId, refreshGroups, refreshSessionList, openDocumentPreview } =
    useChatContext();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTypingBuddy, setIsTypingBuddy] = useState(false);
  const [liveBuddyResponse, setLiveBuddyResponse] = useState<Msg | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberQuery, setAddMemberQuery] = useState("");
  const [allUsersList, setAllUsersList] = useState<string[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(-1);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);

  // Group ADK synthetic session for artifact URLs
  const { userId: groupUserId, sessionId: groupSessionId } = getGroupSessionIdentity(groupId);

  // ── Load group info & messages ───────────────────────────────────────────────
  const fetchGroupData = useCallback(async () => {
    if (!groupId) return;
    try {
      const g = await getGroup(groupId);
      if (g) setGroup(g);
      const msgs = await getGroupMessages(groupId, 50);
      setMessages(msgs);
      if (userId) markGroupRead(groupId, userId);
    } catch (err) {
      console.error("Error loading group:", err);
    }
  }, [groupId, userId]);

  useEffect(() => {
    fetchGroupData();
    // Poll every 3 seconds for group messages
    const interval = setInterval(() => {
      if (!isStreamingRef.current) {
        getGroupMessages(groupId, 50).then((msgs) => {
          setMessages((prev) => {
            if (msgs.length !== prev.length || (msgs[msgs.length - 1]?.id !== prev[prev.length - 1]?.id)) {
              return msgs;
            }
            return prev;
          });
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [groupId, fetchGroupData]);

  // Load all users list when opening Add Member picker
  useEffect(() => {
    if (showAddMember || infoOpen) {
      listUsers().then((users) => {
        setAllUsersList(users);
      });
    }
  }, [showAddMember, infoOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveBuddyResponse, isTypingBuddy]);

  // Close menus on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Member Management Handlers ──────────────────────────────────────────────
  async function handleAddMember(targetUserId: string, isBot: number = 0) {
    const trimmed = targetUserId.trim();
    if (!trimmed || addingMember) return;
    setAddingMember(true);
    try {
      await addMember(groupId, trimmed, userId, isBot);
      setAddMemberQuery("");
      setShowAddMember(false);
      await fetchGroupData();
      refreshGroups();
      refreshSessionList();
    } catch (err) {
      console.error("Failed to add member:", err);
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(targetUserId: string) {
    if (!confirm(`Remove ${targetUserId} from group "${group?.name}"?`)) return;
    try {
      await removeMember(groupId, targetUserId);
      if (targetUserId === userId) {
        setActiveGroupId(null);
      } else {
        await fetchGroupData();
      }
      refreshGroups();
      refreshSessionList();
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  }

  // ── Mention Detection ────────────────────────────────────────────────────────
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setInputText(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf("@");

    if (lastAt !== -1 && (lastAt === 0 || /\s/.test(textBeforeCursor[lastAt - 1]))) {
      const q = textBeforeCursor.slice(lastAt + 1);
      if (!/\s/.test(q)) {
        setMentionQuery(q);
        setMentionIndex(lastAt);
        return;
      }
    }
    setMentionQuery(null);
    setMentionIndex(-1);
  }

  function handleSelectMention(targetName: string) {
    if (mentionIndex === -1) return;
    const before = inputText.slice(0, mentionIndex);
    const after = inputText.slice(textareaRef.current?.selectionStart || mentionIndex);
    const nextText = `${before}@${targetName} ${after}`;
    setInputText(nextText);
    setMentionQuery(null);
    setMentionIndex(-1);
    textareaRef.current?.focus();
  }

  // ── Smart Trigger & Send Message ─────────────────────────────────────────────
  async function handleSend(textToSend?: string) {
    const text = (textToSend || inputText).trim();
    if (!text || isStreamingRef.current) return;

    if (!textToSend) setInputText("");
    setMentionQuery(null);

    const senderName = username || userId;

    // Detect human mentions in message
    const members = group?.members || [];
    const humanMemberNames = members
      .filter((m) => m.is_bot === 0 && m.user_id !== BUDDY_USER_ID)
      .map((m) => m.display_name || m.user_id);

    const hasHumanMention = humanMemberNames.some((name) =>
      new RegExp(`@${name}\\b`, "i").test(text)
    );

    const hasBuddyMention =
      /@(dolphin\s?buddy|buddy)/i.test(text) ||
      text.toLowerCase().includes("@dolphin buddy") ||
      text.toLowerCase().includes("@dolphin_buddy");

    // Extract all mentions
    const mentions: string[] = [];
    if (hasBuddyMention) mentions.push(BUDDY_USER_ID);
    members.forEach((m) => {
      if (new RegExp(`@${m.user_id}\\b|@${m.display_name}\\b`, "i").test(text)) {
        mentions.push(m.user_id);
      }
    });

    // 1. Post human message immediately to SQLite
    try {
      const newMsg = await postGroupMessage(
        groupId,
        userId,
        text,
        senderName,
        "text",
        undefined,
        mentions
      );
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error("Failed to post group message:", err);
    }

    // 2. Determine if Dolphin Buddy should respond:
    const shouldBuddyRespond =
      group?.has_buddy && (hasBuddyMention || !hasHumanMention);

    if (shouldBuddyRespond) {
      triggerBuddyResponse(text, senderName);
    }
  }

  async function triggerBuddyResponse(queryText: string, senderName: string) {
    isStreamingRef.current = true;
    setIsTypingBuddy(true);
    setLiveBuddyResponse({ role: "agent", text: "", artifacts: [] });

    let accumulatedText = "";
    const accumulatedArtifacts: string[] = [];

    try {
      const stream = streamBuddyGroupMessage(
        groupId,
        group?.name || "Group",
        userId,
        senderName,
        queryText
      );

      for await (const chunk of stream) {
        setIsTypingBuddy(false);
        if (chunk.text) {
          accumulatedText += chunk.text;
        }
        if (chunk.artifacts) {
          for (const a of chunk.artifacts) {
            if (!accumulatedArtifacts.includes(a)) accumulatedArtifacts.push(a);
          }
        }
        setLiveBuddyResponse({
          role: "agent",
          text: accumulatedText,
          artifacts: [...accumulatedArtifacts],
        });
      }

      // Finalize: save Dolphin Buddy response into group messages table
      if (accumulatedText || accumulatedArtifacts.length > 0) {
        const botMsg = await postGroupMessage(
          groupId,
          BUDDY_USER_ID,
          accumulatedText,
          BUDDY_DISPLAY_NAME,
          "bot_response",
          accumulatedArtifacts
        );
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      console.error("Dolphin Buddy group stream error:", err);
    } finally {
      setIsTypingBuddy(false);
      setLiveBuddyResponse(null);
      isStreamingRef.current = false;
    }
  }

  // ── Group Action Handlers ───────────────────────────────────────────────────
  async function handleDeleteGroup() {
    if (!confirm(`Are you sure you want to delete group "${group?.name}"?`)) return;
    await deleteGroup(groupId, userId);
    setActiveGroupId(null);
    refreshGroups();
    refreshSessionList();
  }

  async function handleLeaveGroup() {
    if (!confirm(`Leave group "${group?.name}"?`)) return;
    await removeMember(groupId, userId);
    setActiveGroupId(null);
    refreshGroups();
    refreshSessionList();
  }

  // Existing member IDs set
  const existingMemberIds = new Set(
    (group?.members || []).map((m) => m.user_id.toLowerCase())
  );

  // Available users to add (exclude existing members)
  const candidateUsersToAdd = allUsersList.filter(
    (u) => !existingMemberIds.has(u.toLowerCase()) && u.toLowerCase() !== "dolphin_buddy"
  );

  const filteredUsersToAdd = candidateUsersToAdd.filter((u) =>
    u.toLowerCase().includes(addMemberQuery.trim().toLowerCase())
  );

  // Mention candidates
  const mentionCandidates = (group?.members || []).filter((m) => {
    if (mentionQuery === null) return false;
    const name = m.is_bot ? BUDDY_DISPLAY_NAME : m.display_name || m.user_id;
    return name.toLowerCase().includes(mentionQuery.toLowerCase());
  });

  const isCreator = group?.created_by.toLowerCase() === userId.toLowerCase();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#efeae2] relative overflow-hidden">
      {/* ── Group Header ────────────────────────────────────────────────────── */}
      <div className="bg-[#f0f2f5] border-b border-[#e9edef] px-4 py-2.5 flex items-center justify-between z-10 select-none shadow-2xs">
        <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => setInfoOpen(!infoOpen)}>
          <div className="w-10 h-10 rounded-full bg-[#008069] text-white flex items-center justify-center font-bold text-sm shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-[#111b21] truncate flex items-center gap-2">
              {group?.name || "Group Chat"}
              {group?.has_buddy && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-[#dcfce7] text-[#166534] px-2 py-0.5 rounded-full font-semibold">
                  <ShieldCheck size={11} /> {BUDDY_DISPLAY_NAME}
                </span>
              )}
            </h1>
            <p className="text-xs text-[#667781] truncate">
              {group?.members?.length || 0} members ·{" "}
              {group?.members
                ?.map((m) => (m.is_bot ? BUDDY_DISPLAY_NAME : m.display_name || m.user_id))
                .join(", ")}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 relative" ref={menuRef}>
          <button
            onClick={() => setShowAddMember(true)}
            className="p-2 text-[#008069] hover:bg-[#008069]/10 rounded-full transition-colors cursor-pointer"
            title="Add Member"
          >
            <UserPlus size={18} />
          </button>
          <button
            onClick={() => onToggleDetails?.()}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              detailsOpen ? "bg-[#6366f1]/15 text-[#4f46e5]" : "text-[#6366f1] hover:bg-[#6366f1]/10"
            }`}
            title="Token Usage & Cost"
          >
            <Zap size={18} />
          </button>
          <button
            onClick={() => setInfoOpen(!infoOpen)}
            className="p-2 text-[#54656f] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
            title="Group Participants"
          >
            <Info size={18} />
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-[#54656f] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
            title="More Options"
          >
            <MoreVertical size={18} />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-11 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onToggleDetails?.();
                }}
                className="w-full text-left px-4 py-2 text-xs text-[#4f46e5] hover:bg-[#f0f4ff] flex items-center gap-2.5 cursor-pointer font-semibold"
              >
                <Zap size={14} className="text-[#6366f1]" /> Token Usage & Cost
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setShowAddMember(true);
                }}
                className="w-full text-left px-4 py-2 text-xs text-[#111b21] hover:bg-[#f5f6f6] flex items-center gap-2.5 cursor-pointer font-medium"
              >
                <UserPlus size={14} className="text-[#008069]" /> Add Members
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setInfoOpen(true);
                }}
                className="w-full text-left px-4 py-2 text-xs text-[#111b21] hover:bg-[#f5f6f6] flex items-center gap-2.5 cursor-pointer"
              >
                <Info size={14} className="text-gray-500" /> Group Participants
              </button>
              <hr className="my-1 border-gray-100" />
              {isCreator ? (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleDeleteGroup();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer font-medium"
                >
                  <Trash2 size={14} /> Delete Group
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLeaveGroup();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer font-medium"
                >
                  <LogOut size={14} /> Leave Group
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Group Info & Member Management Drawer ─────────────────────────── */}
      {infoOpen && (
        <div className="bg-white border-b border-[#e9edef] p-4 flex flex-col gap-3 shadow-md animate-in slide-in-from-top duration-200 max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-[#111b21] uppercase tracking-wider">
                Group Members ({group?.members?.length || 0})
              </h2>
              <p className="text-[11px] text-[#667781]">Created by {group?.created_by}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddMember(true)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#008069] hover:bg-[#006e5a] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <UserPlus size={13} /> Add
              </button>
              <button onClick={() => setInfoOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Members List */}
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {group?.members?.map((m) => {
              const isSelf = m.user_id.toLowerCase() === userId.toLowerCase();
              const isGroupAdmin = m.user_id.toLowerCase() === group.created_by.toLowerCase();
              const canRemove = isCreator || isSelf;

              return (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {m.is_bot ? (
                      <div className="w-7 h-7 rounded-full bg-[#008069] text-white flex items-center justify-center text-xs shrink-0">
                        <ShieldCheck size={14} />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold shrink-0 uppercase">
                        {m.user_id.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-[#111b21] flex items-center gap-1.5">
                        {m.is_bot ? BUDDY_DISPLAY_NAME : m.display_name || m.user_id}
                        {isSelf && <span className="text-[10px] text-[#008069] font-bold">(You)</span>}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {m.is_bot ? "AI Specialist" : isGroupAdmin ? "Group Admin" : "Member"}
                      </p>
                    </div>
                  </div>

                  {/* Remove Button */}
                  {!m.is_bot && canRemove && (
                    <button
                      onClick={() => handleRemoveMember(m.user_id)}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title={isSelf ? "Leave group" : `Remove ${m.user_id}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Dolphin Buddy if not present */}
          {!group?.has_buddy && (
            <button
              onClick={() => handleAddMember(BUDDY_USER_ID, 1)}
              className="flex items-center justify-center gap-2 p-2 rounded-xl bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] text-xs font-bold transition-colors cursor-pointer"
            >
              <ShieldCheck size={15} /> Add Dolphin Buddy to Group
            </button>
          )}
        </div>
      )}

      {/* ── Add Member Popup Modal ─────────────────────────────────────────── */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 flex flex-col">
            <div className="bg-[#008069] px-5 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus size={18} />
                <h3 className="font-bold text-sm">Add Members to Group</h3>
              </div>
              <button onClick={() => setShowAddMember(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Search input */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search user name or type new user..."
                  value={addMemberQuery}
                  onChange={(e) => setAddMemberQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && addMemberQuery.trim()) {
                      e.preventDefault();
                      handleAddMember(addMemberQuery.trim());
                    }
                  }}
                  className="w-full pl-8 pr-3 py-2 bg-[#f0f2f5] rounded-xl text-xs border-none focus:outline-hidden focus:ring-1 focus:ring-[#008069]/40 text-[#111b21]"
                  autoFocus
                />
              </div>

              {/* Add custom member option */}
              {addMemberQuery.trim() && !candidateUsersToAdd.some((u) => u.toLowerCase() === addMemberQuery.trim().toLowerCase()) && (
                <div
                  onClick={() => handleAddMember(addMemberQuery.trim())}
                  className="p-2.5 bg-[#f0fdf4] hover:bg-[#dcfce7] border border-[#bbf7d0] rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#166534]">
                    <Plus size={15} />
                    <span>Add &quot;{addMemberQuery.trim()}&quot;</span>
                  </div>
                  <span className="text-[10px] bg-[#008069] text-white px-2 py-0.5 rounded font-semibold">
                    Press Enter
                  </span>
                </div>
              )}

              {/* Candidates List */}
              <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-100">
                {filteredUsersToAdd.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400">
                    {addMemberQuery.trim()
                      ? `Press Enter to add "${addMemberQuery.trim()}".`
                      : "No new users available to add."}
                  </div>
                ) : (
                  filteredUsersToAdd.map((u) => (
                    <div
                      key={u}
                      onClick={() => handleAddMember(u)}
                      className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[#f0fdf4] cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs uppercase">
                          {u.slice(0, 2)}
                        </div>
                        <span className="text-xs font-semibold text-[#111b21]">{u}</span>
                      </div>
                      <span className="text-xs font-bold text-[#008069] opacity-0 group-hover:opacity-100 transition-opacity">
                        + Add
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowAddMember(false)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Message Thread ─────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.04' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}
      >
        {/* System intro banner */}
        <div className="flex justify-center my-2">
          <div className="bg-[#ffeecd] text-[#54656f] text-xs px-3.5 py-1.5 rounded-lg shadow-2xs text-center max-w-md">
            🔒 Messages and group actions are shared. Ask operations questions or tag members using @.
          </div>
        </div>

        {/* Existing Persisted Messages */}
        {messages.map((m) => {
          const isMe = m.sender_id.trim().toLowerCase() === userId.trim().toLowerCase();
          const isBuddy = m.sender_id === BUDDY_USER_ID;

          const msgObj: Msg = {
            role: isBuddy ? "agent" : "user",
            text: m.content,
            artifacts: m.artifacts,
          };

          const senderName = isBuddy
            ? BUDDY_DISPLAY_NAME
            : m.sender_name || m.sender_id;

          return (
            <Message
              key={m.id}
              msg={msgObj}
              userId={groupUserId}
              sessionId={groupSessionId}
              isSelf={isMe}
              senderLabel={!isMe ? senderName : undefined}
              senderColor={!isMe && !isBuddy ? getMemberColor(senderName) : undefined}
              onSend={handleSend}
            />
          );
        })}

        {/* Live Active Dolphin Buddy Stream */}
        {liveBuddyResponse && (
          <Message
            msg={liveBuddyResponse}
            userId={groupUserId}
            sessionId={groupSessionId}
            isSelf={false}
            senderLabel={BUDDY_DISPLAY_NAME}
            onSend={handleSend}
          />
        )}

        {/* Typing indicator for Dolphin Buddy */}
        {isTypingBuddy && !liveBuddyResponse?.text && (
          <div className="flex items-center gap-2 text-xs text-[#008069] bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-full w-fit shadow-2xs animate-pulse">
            <Sparkles size={14} /> {BUDDY_DISPLAY_NAME} is thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Mention Suggestions Popup ──────────────────────────────────────── */}
      {mentionQuery !== null && mentionCandidates.length > 0 && (
        <div className="absolute bottom-16 left-4 right-4 sm:left-6 sm:max-w-xs bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-30 max-h-48 overflow-y-auto divide-y divide-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-3 py-1.5 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase">
            Mention Member
          </div>
          {mentionCandidates.map((m) => {
            const name = m.is_bot ? BUDDY_DISPLAY_NAME : m.display_name || m.user_id;
            return (
              <div
                key={m.user_id}
                onClick={() => handleSelectMention(name)}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#f0fdf4] cursor-pointer transition-colors"
              >
                {m.is_bot ? (
                  <div className="w-6 h-6 rounded-full bg-[#008069] text-white flex items-center justify-center text-xs shrink-0">
                    <ShieldCheck size={13} />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-[#111b21]">{name}</span>
                {m.is_bot && (
                  <span className="text-[10px] bg-[#dcfce7] text-[#166534] px-1.5 py-0.2 rounded ml-auto">
                    AI Assistant
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Message Input Bar ──────────────────────────────────────────────── */}
      <div className="bg-[#f0f2f5] p-3 flex items-end gap-2 border-t border-[#e9edef] z-20">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={`Message group or tag @${BUDDY_DISPLAY_NAME}...`}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 max-h-32 min-h-[40px] px-4 py-2.5 bg-white rounded-2xl text-sm border-none focus:outline-hidden focus:ring-1 focus:ring-[#008069]/40 resize-none text-[#111b21] placeholder-[#8696a0]"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isTypingBuddy}
          className="w-10 h-10 rounded-full bg-[#008069] hover:bg-[#006e5a] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
          title="Send message"
        >
          {isTypingBuddy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
