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
import {
  AlertCircle, Search, Phone, MoreVertical, ShieldCheck, Bell, ChevronDown,
  Menu, Users, Info, Coins, Plus, X, Check, Loader2, Calendar, FileText,
  Building, Shield, Activity, Sparkles, ChevronUp, ChevronRight
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
        onOpenPolicies={() => setPoliciesOpen(true)}
        onClosePolicies={() => setPoliciesOpen(false)}
        policiesOpen={policiesOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative overflow-hidden bg-[#f4f5f8]">
        
        {/* ── Top Dashboard Header (XLSync style) ── */}
        <div className="px-5 md:px-8 pt-5 pb-3 bg-[#f4f5f8] shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Title & Subtitle */}
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-1.5 -ml-1 text-[#6b7280] hover:bg-white rounded-lg border border-gray-200"
                onClick={() => setSidebarOpen(true)}
                title="Open Navigation"
              >
                <Menu size={18} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight">
                  Dashboard
                </h1>
                <p className="text-xs text-[#6b7280] mt-0.5 font-normal">
                  Overview of studies, uploads, and activity across your network.
                </p>
              </div>
            </div>

            {/* Top Filter Pills & Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Partner Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-[#e5e7eb] rounded-xl px-3 py-1.5 text-xs font-medium text-[#374151] shadow-2xs">
                <span>{selectedHospital}</span>
                <ChevronDown size={14} className="text-[#9ca3af]" />
              </div>

              {/* Users Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-[#e5e7eb] rounded-xl px-3 py-1.5 text-xs font-medium text-[#374151] shadow-2xs">
                <span>{selectedUser}</span>
                <ChevronDown size={14} className="text-[#9ca3af]" />
              </div>

              {/* Date Range Pill */}
              <div className="hidden sm:flex items-center gap-2 bg-white border border-[#e5e7eb] rounded-xl px-3 py-1.5 text-xs text-[#6b7280] shadow-2xs">
                <Calendar size={13} className="text-[#9ca3af]" />
                <span className="font-mono text-[11px] text-[#374151]">dd-mm-yyyy</span>
                <span className="text-[#9ca3af]">to</span>
                <span className="font-mono text-[11px] text-[#374151]">dd-mm-yyyy</span>
              </div>

              {/* Wallet Credits Pill */}
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#e5e7eb] hover:border-[#ff5722] transition-all text-[#111827] text-xs font-semibold shadow-2xs cursor-pointer"
                title="Manage Wallet Credits"
              >
                <Coins size={14} className="text-[#00a86b]" />
                <span>₹{walletBalance.toLocaleString()}</span>
                <span className="text-[10px] bg-[#00a86b] text-white px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                  + Add
                </span>
              </button>

              {/* Toggle Overview Button */}
              <button
                onClick={() => setShowOverview(!showOverview)}
                className="p-1.5 rounded-xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#111827] shadow-2xs transition-colors"
                title={showOverview ? "Collapse metrics" : "Show metrics"}
              >
                {showOverview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {/* ── 4 Metric Cards Row (Exact XLSync Styling) ── */}
          {showOverview && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
              
              {/* Card 1: CT Ratio (Warm Cream Card #faebd7) */}
              <div className="bg-[#faebd7] rounded-2xl p-4 flex flex-col justify-between h-[138px] relative border border-[#f3ddbe] shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111827]">CT Ratio</span>
                  <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">
                    <FileText size={13} />
                  </div>
                </div>
                <div className="flex flex-col items-center my-auto">
                  <div className="flex items-center gap-2 text-2xl font-black text-[#111827]">
                    <span>8</span>
                    <span className="text-amber-500 font-normal">:</span>
                    <span>9</span>
                  </div>
                  <span className="text-[10px] text-[#78542c] font-medium mt-0.5">images : reports</span>
                </div>
              </div>

              {/* Card 2: PATIENTS (White Card with Purple Progress Ring) */}
              <div className="bg-white rounded-2xl p-4 flex flex-col justify-between h-[138px] border-2 border-[#6366f1]/20 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6b7280] tracking-wider uppercase">Patients</span>
                  <div className="w-7 h-7 rounded-full bg-[#f3f4f6] text-[#6366f1] flex items-center justify-center">
                    <Users size={14} />
                  </div>
                </div>
                <div className="flex items-center justify-between my-auto gap-2">
                  {/* Progress donut indicator */}
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg width="48" height="48" viewBox="0 0 36 36" className="-rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#6366f1" strokeWidth="3.5" strokeDasharray="73 27" strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-[10px] font-black text-[#111827]">83%</span>
                  </div>

                  {/* Stat pills */}
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <div className="bg-[#f9fafb] px-2 py-1 rounded-lg text-center">
                      <span className="text-xs font-black text-[#111827] block">12</span>
                      <span className="text-[8px] text-[#9ca3af]">total</span>
                    </div>
                    <div className="bg-[#f9fafb] px-2 py-1 rounded-lg text-center">
                      <span className="text-xs font-black text-[#111827] block">10</span>
                      <span className="text-[8px] text-[#9ca3af]">compl...</span>
                    </div>
                    <div className="bg-black text-white px-2 py-1 rounded-lg text-center">
                      <span className="text-xs font-black text-white block">2</span>
                      <span className="text-[8px] text-gray-300">pending</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: NETWORK (White Card with Orange Accent) */}
              <div className="bg-white rounded-2xl p-4 flex flex-col justify-between h-[138px] border border-[#e5e7eb] shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6b7280] tracking-wider uppercase">Network</span>
                  <div className="w-7 h-7 rounded-full bg-[#fdeee9] text-[#ff5722] flex items-center justify-center">
                    <Building size={14} />
                  </div>
                </div>
                <div className="flex items-center justify-between my-auto gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#9ca3af]">Hospitals</span>
                    <span className="text-lg font-black text-[#111827]">6</span>
                  </div>
                  <div className="bg-black text-white px-3 py-2 rounded-xl flex flex-col items-center">
                    <span className="text-[9px] text-gray-300">Doctors</span>
                    <span className="text-sm font-black text-white">1</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Anonymization / Risk Shield (Soft Peach Card #fdeee9) */}
              <div className="bg-[#fdeee9] rounded-2xl p-4 flex flex-col justify-between h-[138px] border border-[#fbd3c7] shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111827]">Anonymization</span>
                  <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">
                    <Shield size={13} />
                  </div>
                </div>
                <div className="flex items-center justify-between my-auto gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-[#111827]">1</span>
                    <span className="text-[9px] text-[#855141]">of 12</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="bg-white px-2.5 py-1.5 rounded-xl text-center">
                      <span className="text-xs font-black text-[#111827] block">11</span>
                      <span className="text-[8px] text-[#ff5722] font-semibold">fully identified</span>
                    </div>
                    <div className="bg-black text-white px-2.5 py-1.5 rounded-xl text-center">
                      <span className="text-xs font-black text-white block">2</span>
                      <span className="text-[8px] text-gray-300">pending</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ── Main Workspace: Threads (Col 2) + Chat (Col 3) + Details (Col 4) ── */}
        <div className="flex flex-1 min-h-0 px-5 md:px-8 pb-5 gap-4 overflow-hidden">
          
          {/* Main Glass Workspace Container */}
          <div className="flex flex-1 w-full h-full bg-white rounded-3xl border border-[#e5e7eb] shadow-sm overflow-hidden relative">
            
            {/* Column 2: Threads List */}
            <ConversationList
              onNewChat={handleNewChat}
              onQuickPrompt={handleSend}
              isOpenMobile={listOpen}
              onCloseMobile={() => setListOpen(false)}
            />

            {/* Column 3: AI Chat Stream */}
            <div className="flex flex-col flex-1 min-w-0 h-full bg-white relative">
              {/* Top Sub-Bar with Mobile Drawer Toggles */}
              <div className="px-4 py-2.5 border-b border-[#e5e7eb] flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00a86b] animate-pulse" />
                  <span className="text-xs font-bold text-[#111827]">AI Operations Live Stream</span>
                  <span className="text-[10px] text-[#6b7280] bg-[#f3f4f6] px-2 py-0.5 rounded-full hidden sm:inline font-medium">
                    Encrypted Session
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setListOpen(true)}
                    className="lg:hidden text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-[#4b5563]"
                  >
                    Threads
                  </button>
                  <button
                    onClick={() => setDetailsOpen(true)}
                    className="xl:hidden text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-[#4b5563]"
                  >
                    Details
                  </button>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 bg-[#f9fafb]">
                {error && (
                  <div className="flex items-center gap-2 mb-4 text-xs p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
                    <AlertCircle size={15} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col max-w-3xl mx-auto">
                  {/* Date separator */}
                  <div className="text-center my-3">
                    <span className="text-[10px] font-bold text-[#6b7280] bg-white px-3 py-1 rounded-full border border-[#e5e7eb] shadow-2xs">
                      Today
                    </span>
                  </div>

                  {messages.length === 0 && !loading && (
                    <div className="flex items-start gap-3 my-4 p-5 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xs">
                      <div className="w-9 h-9 rounded-xl bg-[#fdeee9] text-[#ff5722] flex items-center justify-center shrink-0">
                        <Sparkles size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#111827]">Dolphin AI Assistant</span>
                        <p className="text-xs text-[#4b5563] mt-1 leading-relaxed">
                          Hello <span className="font-semibold text-[#ff5722]">@{username}</span>! How can I assist you today? You can upload policy files, compare travel insurance coverage, or book policies directly.
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

              {/* Chat Input Dock */}
              <div className="shrink-0">
                <ChatInput onSend={handleSend} disabled={loading} />
              </div>
            </div>

            {/* Column 4: Context Details Panel */}
            <ConversationDetails
              isOpenMobile={detailsOpen}
              onCloseMobile={() => setDetailsOpen(false)}
            />
          </div>
        </div>

        {/* Policies overlay */}
        <PoliciesPanel isOpen={policiesOpen} onClose={() => setPoliciesOpen(false)} />

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
