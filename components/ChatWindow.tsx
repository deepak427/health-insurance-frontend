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
  Menu, Users, Info, Coins, Plus, X, Check, Loader2, GitBranch, GitCommit,
  Sparkles, Layers, SlidersHorizontal, RefreshCw, Eye, MessageSquare
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
    switchSession,
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

  // GitLab-style Branch / Revision Dropdown Popover
  const [branchPopoverOpen, setBranchPopoverOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");
  const [activeBranch, setActiveBranch] = useState("main");
  const branchPopoverRef = useRef<HTMLDivElement>(null);

  // Global Quick Search Filter in Toolbar
  const [revisionQuery, setRevisionQuery] = useState("");
  const [historyMode, setHistoryMode] = useState<"all" | "compact">("all");

  // Wallet top-up modal state
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [walletOpLoading, setWalletOpLoading] = useState(false);
  const [walletSuccessMsg, setWalletSuccessMsg] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Click outside branch popover
  useEffect(() => {
    if (!branchPopoverOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (branchPopoverRef.current && !branchPopoverRef.current.contains(e.target as Node)) {
        setBranchPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [branchPopoverOpen]);

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

  // Filter messages by revisionQuery if searched
  const filteredMessages = revisionQuery
    ? messages.filter((m) => m.text.toLowerCase().includes(revisionQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex h-full min-h-0 w-full bg-white relative font-sans">
      {/* Column 1: Left Navigation Sidebar */}
      <Sidebar
        isOpenMobile={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        onOpenPolicies={() => setPoliciesOpen(true)}
        onClosePolicies={() => setPoliciesOpen(false)}
        policiesOpen={policiesOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        
        {/* ── Top Navigation Bar (Exact GitLab Style) ── */}
        <header className="h-[48px] px-3 md:px-5 flex items-center justify-between border-b border-[#e5e7eb] bg-white shrink-0 z-20">
          {/* Left: Mobile Drawer Trigger + Breadcrumbs */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              className="md:hidden p-1.5 -ml-1 text-[#6b7280] hover:bg-gray-100 rounded-md"
              onClick={() => setSidebarOpen(true)}
              title="Open Navigation"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-1.5 text-xs text-[#6b7280] truncate">
              <span className="hover:text-[#1f2937] cursor-pointer">DolphinPortal</span>
              <span className="text-[#9ca3af]">/</span>
              <span className="hover:text-[#1f2937] cursor-pointer hidden sm:inline">Travel Insurance</span>
              <span className="text-[#9ca3af] hidden sm:inline">/</span>
              <span className="font-semibold text-[#1f2937] truncate">Repository graph</span>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="hidden lg:flex items-center max-w-sm w-full mx-4">
            <div className="relative w-full flex items-center">
              <Search size={13} className="absolute left-3 text-[#9ca3af]" />
              <input
                type="text"
                placeholder="Search or go to..."
                className="w-full pl-8 pr-8 py-1 text-xs bg-[#f8fafc] border border-[#d1d5db] rounded-md outline-none focus:bg-white focus:border-[#7b58dc] focus:ring-1 focus:ring-[#7b58dc] text-[#1f2937] placeholder-[#9ca3af] transition-all"
              />
              <span className="absolute right-2.5 text-[10px] font-mono text-[#9ca3af] bg-white border border-[#e5e7eb] px-1 rounded">
                /
              </span>
            </div>
          </div>

          {/* Right: Actions & User Menu */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Quick Action Button */}
            <button
              onClick={() => handleNewChat()}
              className="w-7 h-7 rounded border border-[#d1d5db] text-[#4b5563] hover:text-[#1f2937] hover:bg-gray-50 flex items-center justify-center transition-colors"
              title="Create new thread"
            >
              <Plus size={14} />
            </button>

            {/* Wallet Credits Badge */}
            <button
              onClick={() => setShowWalletModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ecfdf5] border border-[#a7f3d0] hover:bg-[#d1fae5] transition-all text-[#065f46] text-xs font-semibold cursor-pointer"
              title="Manage Wallet Credits"
            >
              <Coins size={13} className="text-[#059669]" />
              <span>₹{walletBalance.toLocaleString()}</span>
              <span className="hidden sm:inline-block text-[10px] bg-[#059669] text-white px-1 rounded-xs ml-0.5">
                Top up
              </span>
            </button>

            {/* Notifications with badge count */}
            <div className="relative cursor-pointer p-1 text-[#6b7280] hover:text-[#1f2937]">
              <Bell size={16} />
              <span className="absolute 0 top-0.5 right-0.5 w-3.5 h-3.5 bg-[#7b58dc] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                1
              </span>
            </div>

            {/* User Avatar Pill */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-[#e5e7eb] cursor-pointer">
              <div className="w-6 h-6 rounded-full bg-[#ece7fe] border border-[#7b58dc]/30 overflow-hidden shrink-0">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="avatar" />
              </div>
              <span className="text-xs font-semibold text-[#1f2937] hidden sm:inline">{username}</span>
              <ChevronDown size={12} className="text-[#9ca3af]" />
            </div>
          </div>
        </header>

        {/* ── Subheader Title & Instructions (Exact GitLab Layout) ── */}
        <div className="px-4 md:px-6 pt-4 pb-2 bg-white border-b border-[#f1f5f9]">
          <h1 className="text-xl md:text-2xl font-bold text-[#1f2937] tracking-tight">
            Repository graph
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            You can move around the graph by using the arrow keys or filter conversation states.
          </p>
        </div>

        {/* ── Filter & Control Bar (GitLab Revision Selector Bar) ── */}
        <div className="px-4 md:px-6 py-2.5 bg-white border-b border-[#e5e7eb] flex flex-wrap items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Branch / Revision Popover Selector */}
            <div className="relative" ref={branchPopoverRef}>
              <button
                onClick={() => setBranchPopoverOpen(!branchPopoverOpen)}
                className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-[#d1d5db] hover:border-[#7b58dc] rounded-md text-xs font-medium text-[#1f2937] min-w-[130px] shadow-2xs transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <GitBranch size={13} className="text-[#6b7280]" />
                  <span className="truncate">{activeBranch}</span>
                </div>
                <ChevronDown size={12} className="text-[#6b7280] shrink-0" />
              </button>

              {/* GitLab Branch Popover Card */}
              {branchPopoverOpen && (
                <div className="absolute left-0 top-9 w-64 bg-white border border-[#e5e7eb] rounded-lg shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 pb-2 border-b border-[#f1f5f9]">
                    <span className="text-[11px] font-bold text-[#1f2937]">Select Git revision</span>
                    <div className="relative mt-1.5">
                      <Search size={12} className="absolute left-2.5 top-2 text-[#9ca3af]" />
                      <input
                        type="text"
                        placeholder="Search by Git revision"
                        value={branchSearch}
                        onChange={(e) => setBranchSearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 text-xs border border-[#d1d5db] rounded outline-none focus:border-[#7b58dc]"
                      />
                    </div>
                  </div>

                  {/* Selected Group */}
                  <div className="px-3 py-1.5 border-b border-[#f1f5f9]">
                    <span className="text-[10px] font-semibold text-[#6b7280] uppercase">Selected</span>
                    <div className="flex items-center justify-between mt-1 px-1.5 py-1 bg-[#f8fafc] rounded text-xs">
                      <div className="flex items-center gap-1.5">
                        <Check size={12} className="text-[#7b58dc]" />
                        <span className="font-semibold text-[#1f2937]">{activeBranch}</span>
                        <span className="text-[9px] bg-[#ece7fe] text-[#5925dc] px-1 rounded font-medium">default</span>
                        <span className="text-[9px] bg-[#f1f5f9] text-[#6b7280] px-1 rounded font-medium">protected</span>
                      </div>
                    </div>
                  </div>

                  {/* Branches List */}
                  <div className="px-3 pt-1.5">
                    <span className="text-[10px] font-semibold text-[#6b7280] uppercase">Branches ({sessions.length})</span>
                    <div className="flex flex-col gap-0.5 mt-1 max-h-36 overflow-y-auto">
                      {["main", "dev", "prod"].map((b) => (
                        <button
                          key={b}
                          onClick={() => { setActiveBranch(b); setBranchPopoverOpen(false); }}
                          className={`flex items-center justify-between px-2 py-1 rounded text-xs text-left hover:bg-[#f8fafc] ${
                            activeBranch === b ? "font-bold text-[#7b58dc]" : "text-[#374151]"
                          }`}
                        >
                          <span>{b}</span>
                          {activeBranch === b && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Display History Selector */}
            <select
              value={historyMode}
              onChange={(e) => setHistoryMode(e.target.value as "all" | "compact")}
              className="px-2.5 py-1.5 bg-white border border-[#d1d5db] rounded-md text-xs font-medium text-[#374151] outline-none hover:border-[#7b58dc] transition-colors"
            >
              <option value="all">Display full history</option>
              <option value="compact">Compact summary</option>
            </select>

            {/* Revision Query Search Box */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Enter a Git revision..."
                value={revisionQuery}
                onChange={(e) => setRevisionQuery(e.target.value)}
                className="pl-3 pr-7 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-md outline-none focus:border-[#7b58dc] text-[#1f2937] placeholder-[#9ca3af] w-44 md:w-56"
              />
              <Search size={13} className="absolute right-2.5 text-[#9ca3af]" />
            </div>
          </div>

          {/* Quick Drawer Toggles for Mobile / Responsive */}
          <div className="flex items-center gap-1.5 text-[#6b7280]">
            <button
              onClick={() => setListOpen(true)}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1 rounded border border-[#d1d5db] hover:bg-gray-50 text-xs font-medium"
              title="Show Threads"
            >
              <MessageSquare size={13} />
              <span>Threads</span>
            </button>
            <button
              onClick={() => setDetailsOpen(true)}
              className="xl:hidden flex items-center gap-1 px-2.5 py-1 rounded border border-[#d1d5db] hover:bg-gray-50 text-xs font-medium"
              title="Show Details"
            >
              <Info size={13} />
              <span>Details</span>
            </button>
          </div>
        </div>

        {/* ── Bottom Row: Columns 2 (List) + Column 3 (Chat) + Column 4 (Details) ── */}
        <div className="flex flex-1 min-h-0 relative bg-[#fbfbfd]">
          
          {/* Column 2: Threads List */}
          <ConversationList
            onNewChat={handleNewChat}
            onQuickPrompt={handleSend}
            isOpenMobile={listOpen}
            onCloseMobile={() => setListOpen(false)}
          />

          {/* Column 3: Main Chat Stream */}
          <div className="flex flex-col flex-1 min-w-0 h-full bg-white relative">
            
            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 bg-[#fbfbfd]">
              {error && (
                <div className="flex items-center gap-2 mb-4 text-xs p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col max-w-4xl mx-auto">
                {/* Date separator pill */}
                <div className="text-center my-3">
                  <span className="text-[10px] font-bold text-[#6b7280] bg-white px-3 py-1 rounded-full border border-[#e5e7eb] shadow-2xs">
                    Today
                  </span>
                </div>

                {filteredMessages.length === 0 && !loading && (
                  <div className="flex items-start gap-3 my-4 p-4 rounded-xl bg-white border border-[#e5e7eb] shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-[#ece7fe] text-[#5925dc] flex items-center justify-center shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#1f2937]">Dolphin AI Operations</span>
                      <p className="text-xs text-[#4b5563] mt-1 leading-relaxed">
                        Welcome <span className="font-semibold text-[#5925dc]">@{username}</span>! I am your enterprise travel insurance assistant. You can ask for policy comparisons, upload documents for automated analysis, book coverage, or manage claims.
                      </p>
                    </div>
                  </div>
                )}

                {filteredMessages.map((msg, i) => (
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

            {/* Sticky Chat Input Dock */}
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

        {/* Policies overlay */}
        <PoliciesPanel isOpen={policiesOpen} onClose={() => setPoliciesOpen(false)} />

        {/* ── Wallet Management Modal ── */}
        {showWalletModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-[#e5e7eb]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-[#fbfbfd] border-b border-[#e5e7eb]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#059669] flex items-center justify-center">
                    <Coins size={15} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[#1f2937]">Agent Wallet Balance</h3>
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
                <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-[#166534] font-medium">Available Balance</p>
                    <p className="text-xl font-bold text-[#15803d]">₹{walletBalance.toLocaleString()}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-[#dcfce7] text-[#15803d] font-bold rounded">
                    Active
                  </span>
                </div>

                {walletSuccessMsg && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#15803d] bg-[#dcfce7] p-2 rounded-md border border-[#86efac]">
                    <Check size={13} />
                    <span>{walletSuccessMsg}</span>
                  </div>
                )}

                {/* Quick Top-up Buttons */}
                <div>
                  <p className="text-xs font-bold text-[#1f2937] mb-2">Quick Top-up</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => handleAddCredits(amt)}
                        disabled={walletOpLoading}
                        className="py-1.5 px-2 text-xs font-semibold rounded-md border border-[#d1d5db] bg-[#f8fafc] hover:bg-[#7b58dc] hover:text-white hover:border-[#7b58dc] transition-all disabled:opacity-50"
                      >
                        +₹{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Balance Input */}
                <div className="flex flex-col gap-2 pt-2 border-t border-[#e5e7eb]">
                  <p className="text-xs font-bold text-[#1f2937]">Set Custom Balance</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Enter amount (e.g. 5000)"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-[#f8fafc] border border-[#d1d5db] rounded-md outline-none focus:border-[#7b58dc] transition-colors"
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
                      className="px-3 py-1.5 text-xs font-bold rounded-md bg-[#7b58dc] text-white hover:bg-[#6e49cb] transition-colors disabled:opacity-40 flex items-center gap-1 shrink-0"
                    >
                      {walletOpLoading && <Loader2 size={12} className="animate-spin" />}
                      Set
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-2.5 bg-[#f8fafc] border-t border-[#e5e7eb] flex justify-end">
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="px-3.5 py-1 text-xs font-semibold text-[#374151] hover:bg-gray-200 rounded-md transition-colors"
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
