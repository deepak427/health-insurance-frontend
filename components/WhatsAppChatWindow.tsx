"use client";

/**
 * WhatsAppChatWindow
 *
 * Renders the chat view for a WhatsApp conversation managed via the Meta API.
 * Shown instead of the regular ChatWindow when the active "session" is a
 * WhatsApp contact (id starts with "wa_").
 *
 * Features:
 *  - Displays full message history (inbound + outbound) polled every 3 s
 *  - Renders outbound agent messages with full card UI (policy cards, booking cards, etc.)
 *  - Mute / unmute AI toggle in the header
 *  - Manual reply input (only shown when AI is muted, always available)
 *  - WhatsApp-style bubble layout
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  fetchWhatsAppMessages,
  muteWhatsAppConversation,
  sendWhatsAppReply,
  WhatsAppMessage,
  WhatsAppConversation,
} from "@/lib/api";
import { useChatContext } from "@/context/ChatContext";
import Message from "@/components/Message";
import {
  BotOff,
  Bot,
  Send,
  Phone,
  MoreVertical,
  Loader2,
  Smartphone,
} from "lucide-react";

interface Props {
  conversation: WhatsAppConversation;
  /** Called when mute status changes so parent can refresh contact list */
  onMuteChange?: (phone: string, muted: boolean) => void;
}

export default function WhatsAppChatWindow({ conversation, onMuteChange }: Props) {
  const { username } = useChatContext();

  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(conversation.ai_muted === 1);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [muteLoading, setMuteLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const displayName =
    conversation.display_name ||
    conversation.phone;

  // ── Fetch messages ─────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    const msgs = await fetchWhatsAppMessages(conversation.phone);
    setMessages(msgs);
  }, [conversation.phone]);

  useEffect(() => {
    loadMessages();
    // Poll every 3 s for new incoming messages (same cadence as group chat)
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keep local mute state in sync if parent passes a new conversation object
  useEffect(() => {
    setIsMuted(conversation.ai_muted === 1);
  }, [conversation.ai_muted]);

  // ── Mute toggle ────────────────────────────────────────────────────────────
  async function handleMuteToggle() {
    setMuteLoading(true);
    const newMuted = !isMuted;
    const ok = await muteWhatsAppConversation(conversation.phone, newMuted);
    if (ok) {
      setIsMuted(newMuted);
      onMuteChange?.(conversation.phone, newMuted);
    }
    setMuteLoading(false);
  }

  // ── Manual reply ───────────────────────────────────────────────────────────
  async function handleSend() {
    const text = replyText.trim();
    if (!text || sending) return;

    setSending(true);
    setSendError(null);

    const ok = await sendWhatsAppReply(
      conversation.phone,
      text,
      username || "Agent"
    );

    if (ok) {
      setReplyText("");
      // Optimistically add the message to local state before next poll
      const optimistic: WhatsAppMessage = {
        id: Date.now(),
        phone: conversation.phone,
        direction: "outbound",
        sender_label: username || "Agent",
        text,
        wa_message_id: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
    } else {
      setSendError("Failed to send. Please try again.");
    }

    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Formatting helpers ─────────────────────────────────────────────────────
  function formatTime(iso: string) {
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      if (d.toDateString() === today.toDateString()) return "Today";
      if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
      return d.toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }

  // Group messages by date for WhatsApp-style date separators
  const grouped: { date: string; msgs: WhatsAppMessage[] }[] = [];
  for (const msg of messages) {
    const dateLabel = formatDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateLabel) {
      last.msgs.push(msg);
    } else {
      grouped.push({ date: dateLabel, msgs: [msg] });
    }
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full bg-[#efeae2] relative">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-b border-[#e9edef] flex items-center justify-between bg-[#f0f2f5] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#25d366] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Smartphone size={18} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-[#111b21] truncate">
                {displayName}
              </span>
              {/* WhatsApp badge */}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#25d366] text-white shrink-0">
                WhatsApp
              </span>
            </div>
            <span className="text-[12px] text-[#667781] truncate">
              {conversation.phone}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 text-[#54656f]">
          {/* Mute / Unmute AI toggle */}
          <button
            onClick={handleMuteToggle}
            disabled={muteLoading}
            title={isMuted ? "AI is muted — click to re-enable" : "AI is active — click to mute"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isMuted
                ? "bg-[#fff3cd] border-[#ffc107] text-[#856404] hover:bg-[#ffe69c]"
                : "bg-[#d1fae5] border-[#6ee7b7] text-[#065f46] hover:bg-[#a7f3d0]"
            }`}
          >
            {muteLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : isMuted ? (
              <BotOff size={13} />
            ) : (
              <Bot size={13} />
            )}
            <span className="hidden sm:inline">
              {isMuted ? "AI Muted" : "AI Active"}
            </span>
          </button>

          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors hidden sm:flex">
            <Phone size={18} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* ── Muted banner ────────────────────────────────────────────────────── */}
      {isMuted && (
        <div className="bg-[#fff3cd] border-b border-[#ffc107] px-4 py-2 flex items-center gap-2 text-xs text-[#856404] font-medium shrink-0">
          <BotOff size={14} className="shrink-0" />
          <span>
            AI auto-reply is <strong>muted</strong>. Messages from this contact
            will not get an automatic response — reply manually below.
          </span>
        </div>
      )}

      {/* ── Message feed ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 md:px-6 py-3 whatsapp-chat-bg">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#667781] text-sm">
            No messages yet — waiting for this contact to send a message.
          </div>
        ) : (
          grouped.map(({ date, msgs: dayMsgs }) => (
            <div key={date}>
              {/* Date separator */}
              <div className="text-center my-3">
                <span className="text-[12px] font-medium text-[#54656f] bg-white px-3 py-1 rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
                  {date}
                </span>
              </div>

              {dayMsgs.map((msg) => {
                const isOutbound = msg.direction === "outbound";

                // Outbound AI/agent messages: use the full Message component so
                // embedded card markers (<!--POLICY_CARDS:...-->, etc.) are
                // parsed and rendered as rich UI cards — same as normal web chat.
                if (isOutbound) {
                  return (
                    <div key={msg.id} className="mb-1.5">
                      <Message
                        msg={{ role: "agent", text: msg.text }}
                        userId={conversation.user_id}
                        sessionId={conversation.session_id}
                        onSend={(prompt) => {
                          setReplyText(prompt);
                          inputRef.current?.focus();
                        }}
                        senderLabel={msg.sender_label || "Buddy"}
                      />
                    </div>
                  );
                }

                // Inbound (user) messages: plain WhatsApp-style bubble
                return (
                  <div
                    key={msg.id}
                    className="flex mb-1.5 justify-start"
                  >
                    <div className="max-w-[75%] sm:max-w-[65%] rounded-lg px-3 py-2 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] text-[14px] leading-relaxed bg-white text-[#111b21] rounded-tl-none">
                      {/* Message text — preserve line breaks */}
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                      {/* Timestamp */}
                      <p className="text-[11px] mt-1 text-right text-[#667781]">
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Reply input ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 py-2 bg-[#f0f2f5] border-t border-[#e9edef]">
        {sendError && (
          <p className="text-xs text-red-600 mb-1 px-1">{sendError}</p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={replyText}
            onChange={(e) => {
              setReplyText(e.target.value);
              // Auto-resize
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isMuted
                ? "Type a manual reply…"
                : "Type a message (AI will also auto-reply)…"
            }
            className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm bg-white border border-[#e9edef] outline-none focus:border-[#008069] text-[#111b21] placeholder-[#667781] transition-colors leading-relaxed"
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            className="w-10 h-10 rounded-full bg-[#008069] hover:bg-[#006e5a] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 transition-colors shadow-sm"
            title="Send reply to WhatsApp"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>

        <p className="text-[10px] text-[#667781] mt-1.5 text-center">
          {isMuted
            ? "AI is muted — your reply goes directly to WhatsApp"
            : "Manual reply sent alongside AI auto-reply"}
        </p>
      </div>
    </div>
  );
}
