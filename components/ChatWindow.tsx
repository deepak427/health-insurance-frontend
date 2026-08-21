"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { streamMessage, uploadArtifact, updateWallet, topupWallet } from "@/lib/api";
import { useChatContext, savePreview } from "@/context/ChatContext";
import Sidebar from "./Sidebar";
import ConversationList from "./ConversationList";
import ConversationDetails from "./ConversationDetails";
import Message from "./Message";
import ChatInput from "./ChatInput";
import UsernameModal from "./UsernameModal";
import PoliciesPanel from "./PoliciesPanel";
import CampaignsPanel from "./CampaignsPanel";
import DocumentModal from "./DocumentModal";
import {
  AlertCircle, Search, Phone, MoreVertical, ShieldCheck, Bell, ChevronDown,
  Menu, Users, Info, Coins, Plus, X, Check, Loader2, Calendar, FileText,
  Building, Shield, Activity, Sparkles, ChevronUp, ChevronRight, MessageSquare
} from "lucide-react";

export default function ChatWindow() {
  const {
    username,
    userId,
    sessionId,
    sessions,
    messages,
    loading,
    error,
    walletBalance,
    unreadCount,
    previewDoc,
    closeDocumentPreview,
    refreshWallet,
    setWalletBalance,
    setMessages,
    setLoading,
    setError,
    handleNewChat,
    ensureSession,
    refreshSessionList,
    setUsername,
  } = useChatContext();

  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Mobile responsive panels
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [campaignsOpen, setCampaignsOpen] = useState(false);

  // Dashboard Overview Collapse State
  const [showOverview, setShowOverview] = useState(true);

  // Selected filter states
  const [selectedHospital, setSelectedHospital] = useState("All partners");
  const [selectedUser, setSelectedUser] = useState("All users");

  // Wallet top-up modal state
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [walletOpLoading, setWalletOpLoading] = useState(false);
  const [walletSuccessMsg, setWalletSuccessMsg] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleAddCredits(amount: number) {
    if (!userId || amount <= 0) return;
    setWalletOpLoading(true);
    setWalletSuccessMsg("");
    try {
      const res = await topupWallet(userId, amount);
      setWalletBalance(res.balance);
      setWalletSuccessMsg(`Added ₹${amount.toLocaleString()} credits!`);
      setTimeout(() => setWalletSuccessMsg(""), 2500);
    } catch (e) {
      console.error(e);
    }
    setWalletOpLoading(false);
  }

  async function handleSetExactCredits(balance: number) {
    if (!userId || balance < 0) return;
    setWalletOpLoading(true);
    setWalletSuccessMsg("");
    try {
      const res = await updateWallet(userId, balance);
      setWalletBalance(res.balance);
      setWalletSuccessMsg(`Balance updated to ₹${balance.toLocaleString()}!`);
      setTimeout(() => setWalletSuccessMsg(""), 2500);
    } catch (e) {
      console.error(e);
    }
    setWalletOpLoading(false);
  }

  const handleSend = useCallback(async (
    text: string,
    file?: { mimeType: string; data: string; name: string }
  ) => {
    if (loading) return;

    const ready = await ensureSession();
    if (!ready) return;

    const isFirstMessage = messages.length === 0;
    const userMessageText = file ? `${text}\n📎 ${file.name}` : text;

    setMessages((prev) => [...prev, { 
      role: "user", 
      text: userMessageText,
      userAttachment: file ? { name: file.name, mimeType: file.mimeType, data: file.data } : undefined,
    }]);
    setLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: "agent", text: "", artifacts: [] }]);

    try {
      if (file) {
        try {
          await uploadArtifact(userId, sessionId, file.name, file.mimeType, file.data);
        } catch (uploadErr) {
          console.warn("Failed to upload artifact to server:", uploadErr);
        }
      }

      const inlineData = file ? { mimeType: file.mimeType, data: file.data } : undefined;

      for await (const chunk of streamMessage(userId, sessionId, userMessageText, inlineData)) {
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
      await refreshWallet();
    } catch (err) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "agent" && last.text === "") return prev.slice(0, -1);
        return prev;
      });
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
      await refreshWallet();
    }
  }, [loading, ensureSession, messages.length, userId, sessionId, setMessages, setLoading, setError, refreshSessionList, refreshWallet]);

  if (!username) {
    return <UsernameModal onSubmit={setUsername} />;
  }

  return (
    <div className="flex h-full min-h-0 w-full bg-[#f4f5f8] relative font-sans text-[#111827]">
      {/* Column 1: Left Navigation Sidebar */}
      <Sidebar
        isOpenMobile={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        onOpenPolicies={() => { setPoliciesOpen(true); setCampaignsOpen(false); }}
        onClosePolicies={() => setPoliciesOpen(false)}
        policiesOpen={policiesOpen}
        onOpenCampaigns={() => { setCampaignsOpen(true); setPoliciesOpen(false); }}
        onCloseCampaigns={() => setCampaignsOpen(false)}
        campaignsOpen={campaignsOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative overflow-hidden bg-[#f4f5f8]">
        
        {/* ── Sleek Top Navigation Header ── */}
        <header className="h-[52px] px-2.5 sm:px-4 md:px-6 flex items-center justify-between border-b border-[#e5e7eb] bg-white shrink-0 z-20 shadow-2xs">
          {/* Left: Mobile trigger & Breadcrumb */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <button
              className="md:hidden p-1.5 text-[#6b7280] hover:bg-gray-100 rounded-lg border border-gray-200"
              onClick={() => setSidebarOpen(true)}
              title="Open Navigation"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-[#6b7280] truncate">
              <span className="font-bold text-[#111827]">Dolphin</span>
              <span className="text-[#d1d5db] hidden xs:inline">/</span>
              <span className="text-[#4b5563] hidden sm:inline">AI Travel Assistant</span>
              <span className="text-[#d1d5db] hidden sm:inline">/</span>
              <span className="flex items-center gap-1 text-[#ff5722] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#00a86b] animate-pulse" />
                <span className="hidden xs:inline">Live Session</span>
                <span className="xs:hidden">Live</span>
              </span>
            </div>
          </div>

          {/* Right: Actions & Wallet Dock */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick New Chat Button */}
            <button
              onClick={() => handleNewChat()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] text-xs font-semibold shadow-2xs transition-colors"
              title="Start fresh conversation"
            >
              <Plus size={13} />
              <span>New Thread</span>
            </button>

            {/* Wallet Credits Badge */}
            <button
              onClick={() => setShowWalletModal(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] hover:bg-[#d1fae5] transition-all text-[#065f46] text-xs font-bold shadow-2xs cursor-pointer"
              title="Manage Wallet Credits"
            >
              <Coins size={14} className="text-[#00a86b]" />
              <span>₹{walletBalance.toLocaleString()}</span>
              <span className="hidden sm:inline text-[10px] bg-[#00a86b] text-white px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                + Top up
              </span>
            </button>

            {/* Notifications */}
            <div className="relative p-1 text-[#6b7280] hover:text-[#111827] cursor-pointer hidden sm:block">
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#25d366] text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-in zoom-in-50">
                  {unreadCount}
                </span>
              )}
            </div>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-[#e5e7eb]">
              <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                {(username || "DP").slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-[#111827] hidden md:inline">{username}</span>
            </div>
          </div>
        </header>

        {/* ── Main Workspace: Threads (Col 2) + Chat (Col 3) + Details (Col 4) ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          
          {/* Main WhatsApp Workspace Container */}
          <div className="flex flex-1 w-full h-full bg-white overflow-hidden relative">
            
            {/* Column 2: Threads List */}
            <ConversationList
              onNewChat={handleNewChat}
              onQuickPrompt={handleSend}
              isOpenMobile={listOpen}
              onCloseMobile={() => setListOpen(false)}
            />

            {/* Column 3: WhatsApp Chat Stream */}
            <div className="flex flex-col flex-1 min-w-0 h-full bg-[#efeae2] relative">
              {/* WhatsApp Web Chat Header Bar */}
              <div className="px-2.5 sm:px-4 py-2 sm:py-2.5 border-b border-[#e9edef] flex items-center justify-between bg-[#f0f2f5] shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Mobile Thread List Drawer Trigger */}
                  <button
                    onClick={() => setListOpen(true)}
                    className="lg:hidden p-1.5 -ml-1 text-[#54656f] hover:text-[#111b21] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
                    title="Open Conversations"
                  >
                    <MessageSquare size={18} />
                  </button>

                  {/* Contact Avatar */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#008069] text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 select-none shadow-2xs">
                    <Shield size={17} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] sm:text-[16px] font-bold text-[#111b21] truncate leading-tight">
                        Dolphin Operations
                      </span>
                    </div>
                    <span className="text-[11px] sm:text-[12px] text-[#008069] font-medium truncate leading-tight mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00a86b] animate-pulse" />
                      <span className="truncate">Online · Insurance Agent</span>
                    </span>
                  </div>
                </div>

                {/* Right WhatsApp Action Icons */}
                <div className="flex items-center gap-1 sm:gap-2 text-[#54656f]">
                  <button
                    onClick={() => setPoliciesOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 text-[#54656f] hover:text-[#111b21] transition-colors"
                    title="Policies & Plans"
                  >
                    <Shield size={18} />
                  </button>
                  <button
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 text-[#54656f] hover:text-[#111b21] transition-colors hidden sm:flex"
                    title="Video Call"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    onClick={() => setDetailsOpen((v) => !v)}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 text-[#54656f] hover:text-[#111b21] transition-colors"
                    title="Search chat"
                  >
                    <Search size={18} />
                  </button>
                  {/* Three dots button after search to toggle right sidebar */}
                  <button
                    onClick={() => setDetailsOpen((v) => !v)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 text-[#54656f] hover:text-[#111b21] transition-colors cursor-pointer ${
                      detailsOpen ? "bg-black/10 text-[#111b21]" : ""
                    }`}
                    title="Session & Contact info"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Feed on WhatsApp Doodle Background */}
              <div className="flex-1 overflow-y-auto px-3 md:px-6 py-3 whatsapp-chat-bg">
                {error && (
                  <div className="flex items-center gap-2 mb-4 text-xs p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 shadow-2xs">
                    <AlertCircle size={15} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col w-full">
                  {/* WhatsApp Date separator pill */}
                  <div className="text-center my-2">
                    <span className="text-[12px] font-medium text-[#54656f] bg-white px-3 py-1 rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] uppercase">
                      Today
                    </span>
                  </div>

                  {messages.length === 0 && !loading && (
                    <div className="flex items-start gap-3 my-4 p-4 rounded-lg bg-white border border-[#e9edef] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] max-w-md mx-auto">
                      <div className="w-9 h-9 rounded-full bg-[#d9fdd3] text-[#008069] flex items-center justify-center shrink-0">
                        <Sparkles size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#111b21]">Dolphin Insurance Support</span>
                        <p className="text-xs text-[#667781] mt-1 leading-relaxed">
                          Hello <span className="font-semibold text-[#008069]">@{username}</span>! Ask any question, compare travel policies, or upload travel documents directly.
                        </p>
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <Message
                      key={i}
                      msg={msg}
                      userId={userId}
                      sessionId={sessionId}
                      onSend={(text) => handleSend(text)}
                    />
                  ))}
                </div>
                <div ref={bottomRef} />
              </div>

              {/* WhatsApp Chat Input Dock */}
              <div className="shrink-0">
                <ChatInput onSend={handleSend} disabled={loading} />
              </div>
            </div>

            {/* Column 4: Context Details Panel (Off by default, toggled via 3 dots) */}
            <ConversationDetails
              isOpen={detailsOpen}
              onClose={() => setDetailsOpen(false)}
              isOpenMobile={detailsOpen}
              onCloseMobile={() => setDetailsOpen(false)}
            />
          </div>
        </div>

        {/* Policies overlay */}
        <PoliciesPanel isOpen={policiesOpen} onClose={() => setPoliciesOpen(false)} />

        {/* Campaigns overlay */}
        <CampaignsPanel isOpen={campaignsOpen} onClose={() => setCampaignsOpen(false)} />

        {/* In-App Document Preview Modal */}
        <DocumentModal doc={previewDoc} onClose={closeDocumentPreview} />

        {/* ── Wallet Management Modal ── */}
        {showWalletModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-[#e5e7eb]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#e5e7eb]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#ecfdf5] text-[#00a86b] flex items-center justify-center">
                    <Coins size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[#111827]">Agent Wallet Balance</h3>
                    <p className="text-[10px] text-[#6b7280]">Used to book insurance policies</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-4">
                {/* Current Balance Card */}
                <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-[#166534] font-medium">Available Balance</p>
                    <p className="text-2xl font-black text-[#15803d]">₹{walletBalance.toLocaleString()}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-[#dcfce7] text-[#15803d] font-bold rounded-full">
                    Active
                  </span>
                </div>

                {walletSuccessMsg && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#15803d] bg-[#dcfce7] p-2 rounded-xl border border-[#86efac]">
                    <Check size={13} />
                    <span>{walletSuccessMsg}</span>
                  </div>
                )}

                {/* Quick Top-up Buttons */}
                <div>
                  <p className="text-xs font-bold text-[#111827] mb-2">Quick Top-up</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => handleAddCredits(amt)}
                        disabled={walletOpLoading}
                        className="py-2 px-2 text-xs font-semibold rounded-xl border border-[#d1d5db] bg-[#f9fafb] hover:bg-black hover:text-white hover:border-black transition-all disabled:opacity-50"
                      >
                        +₹{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Balance Input */}
                <div className="flex flex-col gap-2 pt-2 border-t border-[#e5e7eb]">
                  <p className="text-xs font-bold text-[#111827]">Set Custom Balance</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Enter amount (e.g. 5000)"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-[#f9fafb] border border-[#d1d5db] rounded-xl outline-none focus:border-[#ff5722] transition-colors"
                    />
                    <button
                      onClick={() => {
                        const amt = parseFloat(customAmount);
                        if (!isNaN(amt)) {
                          handleSetExactCredits(amt);
                          setCustomAmount("");
                        }
                      }}
                      disabled={walletOpLoading || !customAmount}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-40 flex items-center gap-1 shrink-0"
                    >
                      {walletOpLoading && <Loader2 size={12} className="animate-spin" />}
                      Set
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 bg-[#f9fafb] border-t border-[#e5e7eb] flex justify-end">
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-[#374151] hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
