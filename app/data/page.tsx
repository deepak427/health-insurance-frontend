"use client";

import { useState, useEffect } from "react";
import { Shield, ArrowLeft, Save, RefreshCw, CheckCircle, AlertCircle, Database, Menu, X, Code2 } from "lucide-react";
import Link from "next/link";
import { fetchData, saveData, DataKey } from "@/lib/api";

const TABS: { key: DataKey; label: string; description: string }[] = [
  { key: "faqs", label: "Insurance FAQs", description: "Standard Q&A repository for policy inquiries." },
  { key: "claims", label: "Claim Filing Guides", description: "Step-by-step workflow for health and auto claims." },
  { key: "premium_config", label: "Premium Rate Config", description: "Rate multipliers and pricing tables for premium estimates." },
];

export default function DataPage() {
  const [activeTab, setActiveTab] = useState<DataKey>("faqs");
  const [editorValue, setEditorValue] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  async function loadTab(key: DataKey) {
    setActiveTab(key);
    setLoaded(false);
    setStatus("loading");
    setErrorMsg("");
    try {
      const data = await fetchData(key);
      setEditorValue(JSON.stringify(data, null, 2));
      setLoaded(true);
      setStatus("idle");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to load knowledge dataset.");
      setStatus("error");
    }
  }

  async function handleSave() {
    setStatus("saving");
    setErrorMsg("");
    try {
      const parsed = JSON.parse(editorValue);
      await saveData(activeTab, parsed);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Save failed. Invalid JSON syntax.");
      setStatus("error");
    }
  }

  useEffect(() => {
    loadTab("faqs");
  }, []);

  const activeInfo = TABS.find((t) => t.key === activeTab)!;

  const sidebarContent = (
    <div className="flex flex-col h-full w-full bg-[#f1efe9] text-[#2c2a29] border-r border-[#e2ded7]">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[#e2ded7]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#5b7c72] flex items-center justify-center text-white shadow-sm">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-2xl text-[#2c2a29] font-heading leading-none tracking-wide">
              Dolphin Buddy
            </h1>
            <p className="text-[11px] font-bold text-[#797571] mt-1 tracking-wide uppercase">Knowledge Base</p>
          </div>
        </div>
        {mobileDrawerOpen && (
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-[#797571] hover:text-[#2c2a29]"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Back to Chat button */}
      <div className="px-4 pt-5">
        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-[16px] text-sm font-bold text-[#5b7c72] bg-[#ffffff] hover:bg-[#e2ded7] transition-all border border-[#e2ded7] shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to Direct Chat</span>
        </Link>
      </div>

      {/* Dataset Tabs */}
      <div className="px-3 mt-8 flex-1 overflow-y-auto">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#797571] block px-2 mb-3">
          Select Dataset
        </span>
        <div className="flex flex-col gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                loadTab(tab.key);
                setMobileDrawerOpen(false);
              }}
              className={`flex items-center justify-between px-4 py-3 rounded-[16px] text-sm text-left transition-all font-medium ${
                activeTab === tab.key
                  ? "bg-[#ffffff] text-[#5b7c72] border border-[#e2ded7] shadow-sm font-bold"
                  : "text-[#797571] hover:text-[#2c2a29] hover:bg-[#e2ded7]/50 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <Database size={16} className={activeTab === tab.key ? "text-[#5b7c72]" : "text-[#9e9a95]"} />
                <span>{tab.label}</span>
              </div>
              {activeTab === tab.key && <span className="w-2 h-2 rounded-full bg-[#e8a598]"></span>}
            </button>
          ))}
        </div>
      </div>

      {/* Footer notice */}
      <div className="px-5 py-4 border-t border-[#e2ded7] text-[11px] font-bold uppercase tracking-wider text-[#9e9a95]">
        Changes sync instantly.
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f9f8f6]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[320px] shrink-0 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-[#2c2a29]/40 backdrop-blur-sm" onClick={() => setMobileDrawerOpen(false)} />
          <aside className="relative flex flex-col w-[85vw] max-w-[340px] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content View */}
      <div className="flex flex-col flex-1 min-w-0 h-full bg-[#f9f8f6]">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-[#e2ded7] bg-[#f9f8f6]/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-[#797571] hover:text-[#2c2a29] hover:bg-[#e2ded7]"
              aria-label="Open datasets menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-[20px] font-bold text-[#2c2a29] font-heading leading-none">
                  {activeInfo.label}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-[8px] bg-[#e2ded7] text-[#797571]">
                  Editor
                </span>
              </div>
              <p className="text-[13px] font-medium text-[#797571] mt-1">{activeInfo.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadTab(activeTab)}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-[16px] bg-[#ffffff] hover:bg-[#f1efe9] text-[#797571] transition-all border border-[#e2ded7] shadow-sm"
              title="Reload dataset"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Reload</span>
            </button>
            <button
              onClick={handleSave}
              disabled={status === "saving" || !loaded}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-[16px] bg-[#5b7c72] hover:bg-[#4a665d] active:scale-95 text-white transition-all shadow-sm border border-[#4a665d]/20 disabled:opacity-40"
            >
              <Save size={15} />
              <span>{status === "saving" ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </header>

        {/* Status Notification Banner */}
        {(status === "saved" || status === "error") && (
          <div
            className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold shrink-0 ${
              status === "saved"
                ? "bg-[#ebf4f0] text-[#5b7c72] border-b border-[#5b7c72]/20"
                : "bg-[#fff0ed] text-[#b34040] border-b border-[#e8a598]/40"
            }`}
          >
            {status === "saved" ? (
              <>
                <CheckCircle size={18} className="text-[#5b7c72] shrink-0" />
                <span>Dataset updated successfully — changes are live.</span>
              </>
            ) : (
              <>
                <AlertCircle size={18} className="text-[#b34040] shrink-0" />
                <span>{errorMsg}</span>
              </>
            )}
          </div>
        )}

        {/* JSON Editor Body */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col">
          {status === "loading" ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#797571] text-sm font-bold">
              <RefreshCw size={24} className="animate-spin text-[#5b7c72]" />
              <span>Loading dataset...</span>
            </div>
          ) : (
            <div className="relative flex-1 rounded-[24px] bg-[#ffffff] border border-[#e2ded7] overflow-hidden flex flex-col shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 bg-[#f1efe9] border-b border-[#e2ded7] text-xs font-bold uppercase tracking-wider text-[#797571]">
                <span className="flex items-center gap-2 text-[#5b7c72]">
                  <Code2 size={16} />
                  {activeTab}.json
                </span>
                <span>JSON</span>
              </div>
              <textarea
                value={editorValue}
                onChange={(e) => setEditorValue(e.target.value)}
                spellCheck={false}
                aria-label="JSON dataset editor"
                className="w-full flex-1 p-5 text-[14px] font-mono bg-[#ffffff] text-[#2c2a29] resize-none outline-none leading-relaxed"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
