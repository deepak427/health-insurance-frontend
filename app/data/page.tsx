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
    <div className="flex flex-col h-full w-full bg-stone-900 text-stone-100 border-r border-stone-800">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
            <Shield size={18} />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white font-heading leading-none">
              Dolphin<span className="text-emerald-400">Buddy</span>
            </h1>
            <p className="text-[11px] font-medium text-stone-400 mt-0.5">Knowledge Base</p>
          </div>
        </div>
        {mobileDrawerOpen && (
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-stone-400 hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Back to Chat button */}
      <div className="px-3.5 pt-4">
        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-white bg-stone-800 hover:bg-stone-700 transition-all border border-stone-700"
        >
          <ArrowLeft size={16} />
          <span>Back to Direct Chat</span>
        </Link>
      </div>

      {/* Dataset Tabs */}
      <div className="px-3 mt-6 flex-1 overflow-y-auto">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block px-2 mb-2">
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
              className={`flex items-center justify-between px-3.5 py-3 min-h-[44px] rounded-xl text-xs text-left transition-all ${
                activeTab === tab.key
                  ? "bg-emerald-950/80 text-white font-bold border border-emerald-600/50 shadow-xs"
                  : "text-stone-300 hover:text-white hover:bg-stone-800/80"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database size={15} className={activeTab === tab.key ? "text-emerald-400" : "text-stone-400"} />
                <span>{tab.label}</span>
              </div>
              {activeTab === tab.key && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
            </button>
          ))}
        </div>
      </div>

      {/* Footer notice */}
      <div className="px-5 py-3 border-t border-stone-800 text-[11px] font-medium text-stone-400">
        Changes sync immediately with Dolphin Buddy AI.
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-stone-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 shrink-0 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileDrawerOpen(false)} />
          <aside className="relative flex flex-col w-80 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content View */}
      <div className="flex flex-col flex-1 min-w-0 h-full bg-stone-900">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-stone-800 bg-stone-900/90 backdrop-blur-md shrink-0 min-h-[60px]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-stone-400 hover:text-white hover:bg-stone-800"
              aria-label="Open datasets menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base text-white font-heading">
                  {activeInfo.label}
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                  JSON Editor
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">{activeInfo.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadTab(activeTab)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-stone-800 hover:bg-stone-700 text-white transition-all border border-stone-700"
              title="Reload dataset"
            >
              <RefreshCw size={13} className="text-stone-300" />
              <span className="hidden sm:inline">Reload</span>
            </button>
            <button
              onClick={handleSave}
              disabled={status === "saving" || !loaded}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 min-h-[40px] rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all shadow-xs disabled:opacity-40"
            >
              <Save size={14} />
              <span>{status === "saving" ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </header>

        {/* Status Notification Banner */}
        {(status === "saved" || status === "error") && (
          <div
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-medium shrink-0 ${
              status === "saved"
                ? "bg-emerald-950/80 text-emerald-200 border-b border-emerald-800"
                : "bg-rose-950/80 text-rose-200 border-b border-rose-800"
            }`}
          >
            {status === "saved" ? (
              <>
                <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                <span>Dataset updated successfully — Dolphin Buddy will utilize updated rules immediately.</span>
              </>
            ) : (
              <>
                <AlertCircle size={15} className="text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </>
            )}
          </div>
        )}

        {/* JSON Editor Body */}
        <div className="flex-1 overflow-hidden p-3 sm:p-5 flex flex-col">
          {status === "loading" ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-stone-400 text-sm">
              <RefreshCw size={24} className="animate-spin text-emerald-400" />
              <span>Loading {activeInfo.label}...</span>
            </div>
          ) : (
            <div className="relative flex-1 rounded-2xl bg-stone-950 border border-stone-800 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 bg-stone-900 border-b border-stone-800 text-xs text-stone-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Code2 size={14} className="text-emerald-400" />
                  {activeTab}.json
                </span>
                <span>UTF-8 • JSON</span>
              </div>
              <textarea
                value={editorValue}
                onChange={(e) => setEditorValue(e.target.value)}
                spellCheck={false}
                aria-label="JSON dataset editor"
                className="w-full flex-1 p-4 text-xs sm:text-sm font-mono bg-transparent text-emerald-300 resize-none outline-none leading-relaxed"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
