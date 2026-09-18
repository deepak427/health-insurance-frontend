"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  fetchWhatsAppMessages,
  muteWhatsAppConversation,
  sendWhatsAppReply,
  WhatsAppMessage,
  WhatsAppConversation,
} from "@/lib/api";
import { useChatContext } from "@/context/ChatContext";
import { BotOff, Bot, Send, Phone, MoreVertical, Loader2, Smartphone } from "lucide-react";

interface Props {
  conversation: WhatsAppConversation;
  onMuteChange?: (phone: string, muted: boolean) => void;
}

// Format agent message for WhatsApp display (mimics hip/whatsapp/formatter.py)
function formatForWhatsApp(raw: string): string {
  if (!raw) return "";

  let result = raw;

  // Policy cards → Check if it's confirm type or regular policy list
  result = result.replace(/<!--POLICY_CARDS:([\s\S]*?)-->/g, (_, json) => {
    try {
      const cards = JSON.parse(json.trim());
      const arr = Array.isArray(cards) ? cards : [cards];
      const firstCard = arr[0];
      
      // Check if it's a confirm card
      const isConfirm = firstCard?.type === "confirm" || firstCard?.destination || firstCard?.travelDates;
      
      if (isConfirm) {
        // Interactive Buttons preview for confirmation
        const c = firstCard;
        const policy = c.name || c.policy_name || c.plan || "Policy";
        const company = c.company || c.insurer || "";
        const dest = c.destination || "";
        const dates = c.travelDates || c.travel_dates || "";
        const travellers = c.travellers || "";
        const adults = c.num_adults || "";
        const children = c.num_children || "";
        const premium = c.premium || "";
        const cover = c.sumInsured || c.sum_insured || "";
        
        const lines = ["📋 *Booking Confirmation*\n", `*Plan:* ${policy}`];
        if (company) lines.push(`*Insurer:* ${company}`);
        if (dest) lines.push(`*Destination:* ${dest}`);
        if (dates) lines.push(`*Dates:* ${dates}`);
        if (travellers) {
          lines.push(`*Travellers:* ${travellers}`);
        } else if (adults || children) {
          let pax = adults ? `${adults} adult(s)` : "";
          if (children) pax += (pax ? ", " : "") + `${children} child(ren)`;
          if (pax) lines.push(`*Travellers:* ${pax}`);
        }
        if (cover) lines.push(`*Cover:* ${cover}`);
        if (premium) lines.push(`\n*Total Premium:* ${premium}`);
        lines.push("\n[✅ Confirm]  [✏️ Modify]  [❌ Cancel]");
        return "\n" + lines.join("\n");
      } else {
        // Interactive List preview for policy selection
        const lines = ["🛡️ *Travel Insurance Plans*\n"];
        arr.slice(0, 5).forEach((c, i) => {
          const name = c.name || c.plan_name || "Plan";
          const premium = c.premium || c.price || "";
          const cover = c.sumInsured || c.sum_insured || c.coverage || c.cover || "";
          let line = `${i + 1}. ${name}`;
          if (premium) line += ` — ₹${premium}`;
          if (cover) line += ` | ${cover}`;
          lines.push(line);
        });
        if (arr.length > 5) lines.push(`\n...and ${arr.length - 5} more options`);
        lines.push("\n_Tap 'View Plans' to see all options_");
        return "\n" + lines.join("\n");
      }
    } catch { return ""; }
  });

  // Addon cards → Interactive List preview
  result = result.replace(/<!--ADDON_CARDS:([\s\S]*?)-->/g, (_, json) => {
    try {
      const cards = JSON.parse(json.trim());
      const arr = Array.isArray(cards) ? cards : [cards];
      const lines = ["✨ *Available Add-ons*\n"];
      arr.slice(0, 5).forEach((c) => {
        const name = c.name || c.title || "Addon";
        const price = c.price || c.premium || "";
        let line = `• ${name}`;
        if (price) line += ` — ₹${price}`;
        lines.push(line);
      });
      if (arr.length > 5) lines.push(`\n...and ${arr.length - 5} more add-ons`);
      lines.push("\n_Tap 'View Add-ons' to see all_");
      return "\n" + lines.join("\n");
    } catch { return ""; }
  });

  // VAS cards → Interactive List preview
  result = result.replace(/<!--VAS_CARDS:([\s\S]*?)-->/g, (_, json) => {
    try {
      const cards = JSON.parse(json.trim());
      const arr = Array.isArray(cards) ? cards : [cards];
      const lines = ["💼 *Value Added Services*\n"];
      arr.slice(0, 5).forEach((c) => {
        const name = c.name || c.title || "Service";
        const price = c.price || c.cost || "";
        let line = `• ${name}`;
        if (price) line += ` — ₹${price}`;
        lines.push(line);
      });
      if (arr.length > 5) lines.push(`\n...and ${arr.length - 5} more services`);
      lines.push("\n_Tap 'View Services' to explore_");
      return "\n" + lines.join("\n");
    } catch { return ""; }
  });

  // Confirm card → Interactive Buttons preview
  result = result.replace(/<!--CONFIRM_CARD:([\s\S]*?)-->/g, (_, json) => {
    try {
      const data = JSON.parse(json.trim());
      const c = Array.isArray(data) ? data[0] : data;
      const policy = c.policy_name || c.plan || "Policy";
      const insurer = c.insurer || "";
      const dest = c.destination || "";
      const dates = c.travel_dates || "";
      const adults = c.num_adults || "";
      const children = c.num_children || "";
      const premium = c.premium || "";
      const lines = ["📋 *Booking Confirmation*\n", `*Plan:* ${policy}`];
      if (insurer) lines.push(`*Insurer:* ${insurer}`);
      if (dest) lines.push(`*Destination:* ${dest}`);
      if (dates) lines.push(`*Dates:* ${dates}`);
      if (adults || children) {
        let pax = adults ? `${adults} adult(s)` : "";
        if (children) pax += (pax ? ", " : "") + `${children} child(ren)`;
        lines.push(`*Travellers:* ${pax}`);
      }
      if (premium) lines.push(`\n*Total Premium:* ${premium}`);
      lines.push("\n[✅ Confirm]  [✏️ Modify]  [❌ Cancel]");
      return "\n" + lines.join("\n");
    } catch { return ""; }
  });

  // Booking cards → block summaries
  result = result.replace(/<!--BOOKING_CARDS:([\s\S]*?)-->/g, (_, json) => {
    try {
      const cards = JSON.parse(json.trim());
      const arr = Array.isArray(cards) ? cards : [cards];
      const blocks: string[] = [];
      arr.forEach((c) => {
        const ref = c.ref_number || c.ref || "";
        const policy = c.policy_name || c.plan || "Policy";
        const dest = c.destination || "";
        const dates = c.travel_dates || c.dates || "";
        const premium = c.premium || "";
        const status = c.status || "";
        const insurer = c.insurer || "";
        const lines = [`📋 *Booking${ref ? " — " + ref : ""}*`];
        if (policy) lines.push(`Plan: ${policy}`);
        if (insurer) lines.push(`Insurer: ${insurer}`);
        if (dest) lines.push(`Destination: ${dest}`);
        if (dates) lines.push(`Dates: ${dates}`);
        if (premium) lines.push(`Premium: ${premium}`);
        if (status) lines.push(`Status: ${status}`);
        blocks.push(lines.join("\n"));
      });
      return "\n" + blocks.join("\n\n");
    } catch { return ""; }
  });

  // Booking table → plain text list
  result = result.replace(/<!--BOOKING_TABLE:([\s\S]*?)-->/g, (_, json) => {
    try {
      const data = JSON.parse(json.trim());
      const bookings = Array.isArray(data) ? data : [data];
      if (bookings.length === 0) return "\nNo recent bookings found.";
      const lines = ["*Recent Bookings:*\n"];
      bookings.slice(0, 5).forEach((b) => {
        const ref = b.ref_number || b.ref || "—";
        const dest = b.destination || "—";
        const dates = b.travel_dates || "—";
        const premium = b.premium || "—";
        const status = b.status || "—";
        lines.push(`• ${ref} | ${dest} | ${dates} | ${premium} | ${status}`);
      });
      return "\n" + lines.join("\n");
    } catch { return ""; }
  });

  // Also handle BOOKINGS_TABLE variant
  result = result.replace(/<!--BOOKINGS_TABLE:([\s\S]*?)-->/g, (_, json) => {
    try {
      const data = JSON.parse(json.trim());
      const bookings = Array.isArray(data) ? data : [data];
      if (bookings.length === 0) return "\nNo recent bookings found.";
      const lines = ["*Recent Bookings:*\n"];
      bookings.slice(0, 5).forEach((b) => {
        const ref = b.ref_number || b.ref || "—";
        const dest = b.destination || "—";
        const dates = b.travel_dates || "—";
        const premium = b.premium || "—";
        const status = b.status || "—";
        lines.push(`• ${ref} | ${dest} | ${dates} | ${premium} | ${status}`);
      });
      return "\n" + lines.join("\n");
    } catch { return ""; }
  });

  // Clean up any remaining HTML comments
  result = result.replace(/<!--[\s\S]*?-->/g, "");

  // Collapse 3+ blank lines into 2
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

// Render WhatsApp-formatted text (converts *bold* to <strong>)
function WhatsAppText({ text }: { text: string }) {
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  const boldRegex = /\*([^*]+)\*/g;
  let match;
  let key = 0;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the bold
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // Add bold text
    parts.push(<strong key={key++} className="font-bold">{match[1]}</strong>);
    lastIndex = boldRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
}

export default function WhatsAppChatWindow({ conversation, onMuteChange }: Props) {
  const { username } = useChatContext();

  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(conversation.ai_muted === 1);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [muteLoading, setMuteLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const displayName = conversation.display_name || conversation.phone;

  const loadMessages = useCallback(async () => {
    const msgs = await fetchWhatsAppMessages(conversation.phone);
    setMessages(msgs);
  }, [conversation.phone]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Only auto-scroll if user hasn't scrolled up manually
  useEffect(() => {
    if (!userScrolledUp) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, userScrolledUp]);

  useEffect(() => { setIsMuted(conversation.ai_muted === 1); }, [conversation.ai_muted]);

  // Detect when user scrolls up (not at bottom)
  function handleScroll() {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setUserScrolledUp(!isAtBottom);
  }

  async function handleMuteToggle() {
    setMuteLoading(true);
    const newMuted = !isMuted;
    const ok = await muteWhatsAppConversation(conversation.phone, newMuted);
    if (ok) { setIsMuted(newMuted); onMuteChange?.(conversation.phone, newMuted); }
    setMuteLoading(false);
  }

  async function handleSend() {
    const text = replyText.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError(null);
    const ok = await sendWhatsAppReply(conversation.phone, text, username || "Agent");
    if (ok) {
      setReplyText("");
      setMessages((prev) => [...prev, {
        id: Date.now(), phone: conversation.phone, direction: "outbound",
        sender_label: username || "Agent", text, wa_message_id: null,
        created_at: new Date().toISOString(),
      }]);
    } else {
      setSendError("Failed to send. Please try again.");
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function formatTime(iso: string) {
    try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  }

  function formatDate(iso: string) {
    try {
      const d = new Date(iso), today = new Date(), yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      if (d.toDateString() === today.toDateString()) return "Today";
      if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
      return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
    } catch { return ""; }
  }

  const grouped: { date: string; msgs: WhatsAppMessage[] }[] = [];
  for (const msg of messages) {
    const dateLabel = formatDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last?.date === dateLabel) last.msgs.push(msg);
    else grouped.push({ date: dateLabel, msgs: [msg] });
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full bg-[#efeae2] relative">
      <div className="px-4 py-2.5 border-b border-[#e9edef] flex items-center justify-between bg-[#f0f2f5] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#25d366] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Smartphone size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-[#111b21] truncate">{displayName}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#25d366] text-white shrink-0">WhatsApp</span>
            </div>
            <span className="text-[12px] text-[#667781] truncate">{conversation.phone}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[#54656f]">
          <button
            onClick={handleMuteToggle}
            disabled={muteLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isMuted
                ? "bg-[#fff3cd] border-[#ffc107] text-[#856404] hover:bg-[#ffe69c]"
                : "bg-[#d1fae5] border-[#6ee7b7] text-[#065f46] hover:bg-[#a7f3d0]"
            }`}
          >
            {muteLoading ? <Loader2 size={13} className="animate-spin" /> : isMuted ? <BotOff size={13} /> : <Bot size={13} />}
            <span className="hidden sm:inline">{isMuted ? "AI Muted" : "AI Active"}</span>
          </button>
          <button className="w-9 h-9 hidden sm:flex items-center justify-center rounded-full hover:bg-black/5 transition-colors">
            <Phone size={18} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {isMuted && (
        <div className="bg-[#fff3cd] border-b border-[#ffc107] px-4 py-2 flex items-center gap-2 text-xs text-[#856404] font-medium shrink-0">
          <BotOff size={14} className="shrink-0" />
          <span>AI auto-reply is <strong>muted</strong>. Reply manually below.</span>
        </div>
      )}

      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-3 md:px-6 py-3 whatsapp-chat-bg">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#667781] text-sm">
            No messages yet — waiting for this contact to send a message.
          </div>
        ) : (
          grouped.map(({ date, msgs: dayMsgs }) => (
            <div key={date}>
              <div className="text-center my-3">
                <span className="text-[12px] font-medium text-[#54656f] bg-white px-3 py-1 rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
                  {date}
                </span>
              </div>

              {dayMsgs.map((msg) => {
                const isOutbound = msg.direction === "outbound";

                if (isOutbound) {
                  // Format the message exactly as WhatsApp users see it (plain text, no cards)
                  const plainText = formatForWhatsApp(msg.text);

                  return (
                    <div key={msg.id} className="flex mb-2 justify-end items-end">
                      <div className="flex flex-col items-end max-w-[75%] sm:max-w-[65%]">
                        <div className="bg-[#dbeafe] text-[#111b21] rounded-lg rounded-tr-none px-3 py-2 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] w-full">
                          <p className="text-[11px] font-bold text-[#1d4ed8] mb-1 flex items-center gap-1">
                            <Bot size={11} />
                            {msg.sender_label || "Buddy"}
                          </p>

                          <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                            <WhatsAppText text={plainText} />
                          </p>

                          <p className="text-[11px] text-right text-[#4b5563] mt-1">{formatTime(msg.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  );
                }


                // Inbound message from WhatsApp user
                return (
                  <div key={msg.id} className="flex mb-2 justify-start items-end">
                    <div className="w-7 h-7 rounded-full bg-[#e9edef] text-[#54656f] flex items-center justify-center font-bold text-[11px] shrink-0 mr-1.5 mb-0.5">
                      {(conversation.display_name || conversation.phone).charAt(0).toUpperCase()}
                    </div>
                    <div className="max-w-[75%] sm:max-w-[65%] bg-white text-[#111b21] rounded-lg rounded-tl-none px-3 py-2 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] text-[14px] leading-relaxed">
                      <p className="text-[11px] font-bold text-[#25d366] mb-0.5">{displayName}</p>
                      
                      {/* Check if message is a document attachment (starts with emoji) */}
                      {(() => {
                        const attachmentMatch = msg.text.match(/^(📷|📄|📎)\s+(.+)$/);
                        if (attachmentMatch) {
                          const [, emoji, filename] = attachmentMatch;
                          const isImage = emoji === '📷';
                          const isPDF = emoji === '📄';
                          
                          // Build download URL - WhatsApp files are stored with wa_ prefix
                          const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/download/my_agent/${conversation.user_id}/${conversation.session_id}/${filename}`;
                          
                          if (isImage) {
                            // Render image preview
                            return (
                              <div className="rounded-lg overflow-hidden border border-black/10 bg-gray-50 max-w-[240px] mb-1">
                                <img 
                                  src={downloadUrl} 
                                  alt={filename}
                                  className="w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(downloadUrl, '_blank')}
                                  style={{ maxHeight: '200px' }}
                                />
                                <div className="px-2 py-1 bg-[#f0f2f5] text-[11px] text-[#667781] flex items-center justify-between">
                                  <span className="truncate flex-1">{filename}</span>
                                  <a href={downloadUrl} download={filename} className="ml-2 text-[#008069] hover:underline">↓</a>
                                </div>
                              </div>
                            );
                          } else {
                            // Render document chip
                            return (
                              <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#f0f2f5] hover:bg-[#e9edef] border border-[#e9edef] transition-all mb-1 max-w-full"
                              >
                                <span className="text-lg">{emoji}</span>
                                <span className="text-xs font-medium text-[#111b21] truncate flex-1">{filename}</span>
                                <span className="text-[10px] text-[#667781]">View</span>
                              </a>
                            );
                          }
                        }
                        
                        // Regular text message
                        return <p className="whitespace-pre-wrap break-words">{msg.text}</p>;
                      })()}
                      
                      <p className="text-[11px] mt-1 text-right text-[#667781]">{formatTime(msg.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 px-3 py-2 bg-[#f0f2f5] border-t border-[#e9edef]">
        {sendError && <p className="text-xs text-red-600 mb-1 px-1">{sendError}</p>}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={replyText}
            onChange={(e) => {
              setReplyText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={isMuted ? "Type a manual reply…" : "Type a message (AI will also auto-reply)…"}
            className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm bg-white border border-[#e9edef] outline-none focus:border-[#008069] text-[#111b21] placeholder-[#667781] transition-colors leading-relaxed"
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            className="w-10 h-10 rounded-full bg-[#008069] hover:bg-[#006e5a] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 transition-colors shadow-sm"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-[10px] text-[#667781] mt-1.5 text-center">
          {isMuted ? "AI is muted — your reply goes directly to WhatsApp" : "Manual reply sent alongside AI auto-reply"}
        </p>
      </div>
    </div>
  );
}
