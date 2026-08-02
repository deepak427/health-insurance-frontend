"use client";
import { useState } from "react";
import { ShieldPlus, ArrowLeft, Save, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { fetchData, saveData, DataKey } from "@/lib/api";

const TABS: { key: DataKey; label: string; description: string }[] = [
  { key: "faqs", label: "FAQs", description: "Insurance FAQ entries the agent uses to answer common questions." },
  { key: "claims", label: "Claim Guides", description: "Step-by-step claim filing guides per claim type." },
  { key: "premium_config", label: "Premium Config", description: "Rate tables and multipliers used for premium estimates." },
];

export default function DataPage() {
  const [activeTab, setActiveTab] = useState<DataKey>("faqs");
  const [editorValue, setEditorValue] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

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
      setErrorMsg(e instanceof Error ? e.message : "Failed to load");
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
      setErrorMsg(e instanceof Error ? e.message : "Save failed. Check JSON syntax.");
      setStatus("error");
    }
  }

  // Load first tab on mount
  useState(() => { loadTab("faqs"); });

  const activeInfo = TABS.find(t => t.key === activeTab)!;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 shrink-0 h-full border-r"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <ShieldPlus size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight" style={{ color: "var(--text)" }}>HIP Agent</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Insurance Assistant</p>
          </div>
        </div>

        {/* Back to chat */}
        <div className="px-3 pt-4">
          <Link
            href="/"
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ background: "var(--bg-card2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            <ArrowLeft size={15} />
            Back to Chat
          </Link>
        </div>

        {/* Data tabs */}
        <div className="px-3 mt-5 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: "var(--text-muted)" }}>
            Data Sets
          </p>
          <div className="flex flex-col gap-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => loadTab(tab.key)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all"
                style={{
                  color: activeTab === tab.key ? "var(--text)" : "var(--text-muted)",
                  background: activeTab === tab.key ? "var(--accent)22" : "transparent",
                  borderLeft: activeTab === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          Changes take effect immediately
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Header */}
        <header
          className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
          style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
        >
          <div>
            <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
              {activeInfo.label}
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{activeInfo.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadTab(activeTab)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-70"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              <RefreshCw size={12} />
              Reload
            </button>
            <button
              onClick={handleSave}
              disabled={status === "saving" || !loaded}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Save size={12} />
              {status === "saving" ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </header>

        {/* Status bar */}
        {(status === "saved" || status === "error") && (
          <div
            className="flex items-center gap-2 px-5 py-2 text-xs shrink-0"
            style={{
              background: status === "saved" ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
              color: status === "saved" ? "#34d399" : "#fca5a5",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {status === "saved"
              ? <><CheckCircle size={13} /> Saved — agent will use updated data on next request</>
              : <><AlertCircle size={13} /> {errorMsg}</>
            }
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 overflow-hidden p-4">
          {status === "loading" ? (
            <div className="flex items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
              Loading…
            </div>
          ) : (
            <textarea
              value={editorValue}
              onChange={(e) => setEditorValue(e.target.value)}
              spellCheck={false}
              className="w-full h-full rounded-xl p-4 text-sm font-mono resize-none outline-none"
              style={{
                background: "var(--bg-card2)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                lineHeight: "1.6",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
