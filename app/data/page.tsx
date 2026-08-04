"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, RefreshCw, CheckCircle, AlertCircle, Database, Code2, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { fetchData, saveData, DataKey } from "@/lib/api";

const TABS: { key: DataKey; label: string; description: string; isPrompt?: boolean }[] = [
  { key: "faqs", label: "Insurance FAQs", description: "Standard Q&A repository for policy inquiries." },
  { key: "claims", label: "Claim Filing Guides", description: "Step-by-step workflow for health and auto claims." },
  { key: "premium_config", label: "Premium Rate Config", description: "Rate multipliers and pricing tables for premium estimates." },
  { key: "response_prompt", label: "Response Style", description: "Customize how the agent formats and tones its responses.", isPrompt: true },
];

export default function DataPage() {
  const [activeTab, setActiveTab] = useState<DataKey>("faqs");
  const [editorValue, setEditorValue] = useState("");
  const [promptValue, setPromptValue] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const activeInfo = TABS.find((t) => t.key === activeTab)!;
  const isPromptTab = activeInfo?.isPrompt;

  async function loadTab(key: DataKey) {
    setActiveTab(key);
    setLoaded(false);
    setStatus("loading");
    setErrorMsg("");
    try {
      const data = await fetchData(key);
      if (key === "response_prompt") {
        setPromptValue((data as { prompt?: string }).prompt ?? "");
      } else {
        setEditorValue(JSON.stringify(data, null, 2));
      }
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
      if (isPromptTab) {
        await saveData(activeTab, { prompt: promptValue });
      } else {
        const parsed = JSON.parse(editorValue);
        await saveData(activeTab, parsed);
      }
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

  return (
    <main className="h-screen w-screen flex flex-col bg-[#f4f7f9] overflow-hidden">
      {/* Main Multi-Pane Container */}
      <div className="flex flex-1 w-full h-full bg-white overflow-hidden">
        
        {/* Navy Sidebar for Data Page */}
        <aside className="hidden md:flex flex-col w-[220px] bg-[#0a192f] text-white shrink-0">
          <div className="flex items-center gap-3 px-5 py-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.984 8.783c-1.332-1.936-3.792-3.14-6.425-3.14-1.295 0-2.527.31-3.626.866.52-2.316 2.584-4.062 5.067-4.062 2.85 0 5.161 2.31 5.161 5.16 0 .438-.057.863-.163 1.267a5.122 5.122 0 0 1-.014-.091zm9.324 7.64c-.958-3.325-3.418-5.748-6.685-6.683-.81-.233-1.666-.363-2.545-.38l-1.077-.021c.542.484 1.002 1.05 1.353 1.68l.215.385c.896 1.62 1.34 3.535 1.272 5.518l-.01.32c1.78-.184 3.393-1.052 4.544-2.355l1.636-1.848.067-1.127a5.534 5.534 0 0 0 .108-.501.996.996 0 0 1-.878.508c-.28 0-.546-.118-.737-.324l-2.072-2.222c-.383-.412-.358-1.055.054-1.439.412-.383 1.055-.357 1.439.055l1.838 1.973c.123.131.295.205.474.205h.001zm-5.75-8.52c-.615-.466-1.286-.867-1.998-1.196-1.293-.598-2.678-.897-4.113-.897-.992 0-1.97.16-2.91.468C3.896 7.425 1.155 9.775.228 12.87l-.147.494 2.112-2.348c.15-.167.315-.327.491-.478l.42-.355c.784-.663 1.678-1.168 2.657-1.498.412-.138.835-.23 1.264-.275l.435-.046c1.67-.176 3.336.262 4.673 1.233.15.108.297.22.441.336l.244.195c1.455 1.164 2.378 2.85 2.628 4.757.065.498.077 1.002.036 1.5l-.019.227c-.234 2.809-1.956 5.176-4.524 6.184l-2.028.794 3.385.163c2.72.13 5.37-1.195 6.953-3.488l2.257-3.265.172-.45c.162-.42.274-.858.337-1.309.055-.398-.016-.807-.205-1.158l-.946-1.745c-.464-.856-1.11-1.577-1.91-2.136z"/>
            </svg>
            <h1 className="text-[15px] font-black tracking-[-0.02em] text-white">
              Dolphin <span className="text-[#00a86b]">Portal</span>
            </h1>
          </div>
          
          <div className="px-3 mt-4">
             <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#94a3b8] hover:bg-[#132742] hover:text-white transition-colors">
              <ArrowLeft size={18} />
              <span>Back to Hub</span>
            </Link>
          </div>

          <div className="px-5 mt-8 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
              Knowledge Base
            </span>
          </div>
          
          <nav className="flex-1 px-3 flex flex-col gap-1.5 overflow-y-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => loadTab(tab.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left ${
                  activeTab === tab.key
                    ? "bg-[#132742] text-white relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#00a86b] before:rounded-r-md"
                    : "text-[#94a3b8] hover:bg-[#132742] hover:text-white"
                }`}
              >
                {tab.isPrompt ? <MessageSquareText size={16} /> : <Database size={16} />}
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Editor View */}
        <div className="flex flex-col flex-1 min-w-0 bg-white">
          <header className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
            <div>
              <h2 className="text-sm font-bold text-[#1f2937] leading-tight">
                {activeInfo.label}
              </h2>
              <p className="text-xs text-[#6b7280] mt-0.5">{activeInfo.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadTab(activeTab)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded bg-white hover:bg-gray-50 text-[#6b7280] transition-colors border border-[#e5e7eb]"
              >
                <RefreshCw size={14} />
                <span>Reload</span>
              </button>
              <button
                onClick={handleSave}
                disabled={status === "saving" || !loaded}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded bg-[#00a86b] hover:bg-[#008f5a] text-white transition-colors disabled:opacity-50"
              >
                <Save size={14} />
                <span>{status === "saving" ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </header>

          {(status === "saved" || status === "error") && (
            <div
              className={`flex items-center gap-2 px-6 py-3 text-xs font-medium shrink-0 border-b ${
                status === "saved"
                  ? "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {status === "saved" ? (
                <>
                  <CheckCircle size={16} className="text-[#166534] shrink-0" />
                  <span>Dataset updated successfully.</span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </>
              )}
            </div>
          )}

          <div className="flex-1 p-6 flex flex-col bg-[#f8fafc]">
            {status === "loading" ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-[#6b7280] text-sm font-semibold">
                <RefreshCw size={24} className="animate-spin text-[#00a86b]" />
                <span>Loading dataset...</span>
              </div>
            ) : isPromptTab ? (
              <div className="flex-1 flex flex-col gap-3">
                <p className="text-xs text-[#6b7280] leading-relaxed">
                  Write plain instructions for how the agent should format and tone its replies.
                  For example: <span className="italic">&quot;Keep answers short. Use bullet points. Be friendly.&quot;</span>
                  <br />
                  This takes priority over the default formatting. Leave blank to use defaults.
                </p>
                <div className="flex-1 flex flex-col bg-white border border-[#e5e7eb] rounded-lg overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-[#e5e7eb] text-xs font-semibold text-[#6b7280]">
                    <MessageSquareText size={14} className="text-[#00a86b]" />
                    Response Style Instructions
                  </div>
                  <textarea
                    value={promptValue}
                    onChange={(e) => setPromptValue(e.target.value)}
                    placeholder="e.g. Keep responses short and friendly. Use bullet points and markdown headers. Talk like a real person, not a formal document."
                    spellCheck
                    className="w-full flex-1 p-4 text-sm text-[#1f2937] resize-none outline-none leading-relaxed min-h-[240px]"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col bg-white border border-[#e5e7eb] rounded-lg overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-[#e5e7eb] text-xs font-semibold text-[#6b7280]">
                  <span className="flex items-center gap-2">
                    <Code2 size={14} className="text-[#0369a1]" />
                    {activeTab}.json
                  </span>
                </div>
                <textarea
                  value={editorValue}
                  onChange={(e) => setEditorValue(e.target.value)}
                  spellCheck={false}
                  className="w-full flex-1 p-4 text-sm font-mono text-[#1f2937] resize-none outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
