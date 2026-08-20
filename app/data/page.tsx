"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft, Save, RefreshCw, CheckCircle, AlertCircle, Database,
  Code2, MessageSquareText, Puzzle, HeartPulse, Plus, Pencil, Trash2, X, Check,
} from "lucide-react";
import Link from "next/link";
import { fetchData, saveData, DataKey } from "@/lib/api";

// ─── types ────────────────────────────────────────────────────────────────────
interface CatalogItem {
  name: string;
  description: string;
  categories: string[];
  price_per_person?: number;
  price_flat?: number;
  highlights: string[];
  suitable_for: string;
}
type Catalog = Record<string, CatalogItem>;

// ─── tab config ───────────────────────────────────────────────────────────────
const TABS: {
  key: DataKey;
  label: string;
  description: string;
  icon: React.ReactNode;
  mode: "json" | "prompt" | "catalog";
  accentColor?: string;
}[] = [
  {
    key: "faqs",
    label: "Insurance FAQs",
    description: "Standard Q&A repository for policy inquiries.",
    icon: <Database size={16} />,
    mode: "json",
  },
  {
    key: "claims",
    label: "Claim Filing Guides",
    description: "Step-by-step workflow for health and auto claims.",
    icon: <Database size={16} />,
    mode: "json",
  },
  {
    key: "premium_config",
    label: "Premium Rate Config",
    description: "Rate multipliers and pricing tables for premium estimates.",
    icon: <Database size={16} />,
    mode: "json",
  },
  {
    key: "response_prompt",
    label: "Response Style",
    description: "Customise how the agent formats and tones its responses.",
    icon: <MessageSquareText size={16} />,
    mode: "prompt",
  },
  {
    key: "addons",
    label: "Add-Ons",
    description: "Insurer add-on coverage options available for travel policies.",
    icon: <Puzzle size={16} />,
    mode: "catalog",
    accentColor: "#d97706",
  },
  {
    key: "vas",
    label: "VAS Services",
    description: "Value-added services provided by your agency (Doctor on Call, Air Ambulance, etc.)",
    icon: <HeartPulse size={16} />,
    mode: "catalog",
    accentColor: "#0284c7",
  },
];

// ─── empty item template ──────────────────────────────────────────────────────
const EMPTY_ITEM: CatalogItem = {
  name: "",
  description: "",
  categories: [],
  highlights: [],
  suitable_for: "",
};

// ─── CatalogEditor ────────────────────────────────────────────────────────────
function CatalogEditor({
  catalog,
  accentColor = "#00a86b",
  onSave,
  saving,
}: {
  catalog: Catalog;
  accentColor?: string;
  onSave: (updated: Catalog) => void;
  saving: boolean;
}) {
  const [items, setItems] = useState<Catalog>({ ...catalog });
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftKey, setDraftKey] = useState("");
  const [draft, setDraft] = useState<CatalogItem>({ ...EMPTY_ITEM });
  const [isNew, setIsNew] = useState(false);
  const [highlightInput, setHighlightInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");

  // keep in sync if parent reloads
  useEffect(() => { setItems({ ...catalog }); }, [catalog]);

  function startEdit(key: string) {
    setEditingKey(key);
    setDraftKey(key);
    setDraft({ ...items[key], highlights: [...(items[key].highlights ?? [])], categories: [...(items[key].categories ?? [])] });
    setIsNew(false);
    setHighlightInput("");
    setCategoryInput("");
  }

  function startNew() {
    setEditingKey("__new__");
    setDraftKey("");
    setDraft({ ...EMPTY_ITEM, highlights: [], categories: [] });
    setIsNew(true);
    setHighlightInput("");
    setCategoryInput("");
  }

  function cancelEdit() {
    setEditingKey(null);
    setIsNew(false);
  }

  function saveEdit() {
    if (!draftKey.trim()) return;
    const key = draftKey.trim().toLowerCase().replace(/\s+/g, "_");
    const updated = { ...items };
    if (isNew === false && editingKey && editingKey !== key) {
      delete updated[editingKey]; // key was renamed
    }
    updated[key] = { ...draft };
    setItems(updated);
    setEditingKey(null);
    setIsNew(false);
    onSave(updated);
  }

  function deleteItem(key: string) {
    const updated = { ...items };
    delete updated[key];
    setItems(updated);
    onSave(updated);
  }

  function addHighlight() {
    const h = highlightInput.trim();
    if (h && !draft.highlights.includes(h)) {
      setDraft((d) => ({ ...d, highlights: [...d.highlights, h] }));
    }
    setHighlightInput("");
  }

  function removeHighlight(h: string) {
    setDraft((d) => ({ ...d, highlights: d.highlights.filter((x) => x !== h) }));
  }

  function addCategory() {
    const c = categoryInput.trim().toLowerCase();
    if (c && !draft.categories.includes(c)) {
      setDraft((d) => ({ ...d, categories: [...d.categories, c] }));
    }
    setCategoryInput("");
  }

  function removeCategory(c: string) {
    setDraft((d) => ({ ...d, categories: d.categories.filter((x) => x !== c) }));
  }

  const accent = accentColor;
  const accentLight = accentColor === "#d97706" ? "#fffbeb" : accentColor === "#0284c7" ? "#f0f9ff" : "#f0fdf4";
  const accentBorder = accentColor === "#d97706" ? "#fde68a" : accentColor === "#0284c7" ? "#bae6fd" : "#bbf7d0";

  return (
    <div className="flex-1 overflow-y-auto p-5">
      {/* Add new button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={startNew}
          style={{ background: accent }}
          className="flex items-center gap-2 text-xs font-bold text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          Add New
        </button>
      </div>

      {/* New item form inline at top */}
      {editingKey === "__new__" && (
        <ItemForm
          draftKey={draftKey} draft={draft} isNew highlightInput={highlightInput} categoryInput={categoryInput}
          accent={accent} accentLight={accentLight} accentBorder={accentBorder}
          onKeyChange={setDraftKey} onDraftChange={setDraft}
          onHighlightInput={setHighlightInput} onAddHighlight={addHighlight} onRemoveHighlight={removeHighlight}
          onCategoryInput={setCategoryInput} onAddCategory={addCategory} onRemoveCategory={removeCategory}
          onSave={saveEdit} onCancel={cancelEdit}
        />
      )}

      {Object.keys(items).length === 0 && editingKey !== "__new__" && (
        <div className="flex flex-col items-center justify-center py-16 text-[#9ca3af]">
          <Plus size={32} className="mb-2 opacity-30" />
          <p className="text-sm">No items yet. Click "Add New" to create one.</p>
        </div>
      )}

      {/* Item cards */}
      <div className="flex flex-col gap-3">
        {Object.entries(items).map(([key, item]) =>
          editingKey === key ? (
            <ItemForm
              key={key}
              draftKey={draftKey} draft={draft} isNew={false} highlightInput={highlightInput} categoryInput={categoryInput}
              accent={accent} accentLight={accentLight} accentBorder={accentBorder}
              onKeyChange={setDraftKey} onDraftChange={setDraft}
              onHighlightInput={setHighlightInput} onAddHighlight={addHighlight} onRemoveHighlight={removeHighlight}
              onCategoryInput={setCategoryInput} onAddCategory={addCategory} onRemoveCategory={removeCategory}
              onSave={saveEdit} onCancel={cancelEdit}
            />
          ) : (
            <div key={key} className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
              {/* card header */}
              <div className="flex items-start justify-between px-4 py-3 border-b border-[#f1f5f9]"
                style={{ background: accentLight }}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center border text-xs font-black shrink-0"
                    style={{ background: "white", borderColor: accentBorder, color: accent }}>
                    {item.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1f2937]">{item.name}</p>
                    <p className="text-[11px] font-mono text-[#9ca3af]">{key}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs font-black" style={{ color: accent }}>
                    {item.price_per_person ? `₹${item.price_per_person}/person` : item.price_flat ? `₹${item.price_flat} flat` : "—"}
                  </span>
                  <button onClick={() => startEdit(key)}
                    className="p-1.5 rounded text-[#9ca3af] hover:text-[#1f2937] hover:bg-white transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => deleteItem(key)}
                    className="p-1.5 rounded text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* card body */}
              <div className="px-4 py-3 flex flex-col gap-2">
                <p className="text-xs text-[#6b7280]">{item.description}</p>
                {item.highlights?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.highlights.map((h) => (
                      <span key={h} className="text-[10px] px-2 py-0.5 rounded-full border font-medium text-[#374151]"
                        style={{ borderColor: accentBorder, background: accentLight }}>
                        {h}
                      </span>
                    ))}
                  </div>
                )}
                {item.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.categories.map((c) => (
                      <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#6b7280] font-mono">
                        #{c}
                      </span>
                    ))}
                  </div>
                )}
                {item.suitable_for && (
                  <p className="text-[10px] text-[#9ca3af] italic">Suitable for: {item.suitable_for}</p>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── ItemForm ─────────────────────────────────────────────────────────────────
function ItemForm({
  draftKey, draft, isNew, highlightInput, categoryInput,
  accent, accentLight, accentBorder,
  onKeyChange, onDraftChange,
  onHighlightInput, onAddHighlight, onRemoveHighlight,
  onCategoryInput, onAddCategory, onRemoveCategory,
  onSave, onCancel,
}: {
  draftKey: string; draft: CatalogItem; isNew: boolean;
  highlightInput: string; categoryInput: string;
  accent: string; accentLight: string; accentBorder: string;
  onKeyChange: (v: string) => void;
  onDraftChange: React.Dispatch<React.SetStateAction<CatalogItem>>;
  onHighlightInput: (v: string) => void; onAddHighlight: () => void; onRemoveHighlight: (h: string) => void;
  onCategoryInput: (v: string) => void; onAddCategory: () => void; onRemoveCategory: (c: string) => void;
  onSave: () => void; onCancel: () => void;
}) {
  const field = (label: string, children: React.ReactNode) => (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );

  const inp = "text-xs px-3 py-2 rounded-lg border border-[#e5e7eb] outline-none focus:border-[#00a86b] bg-white text-[#1f2937] transition-colors";

  return (
    <div className="bg-white rounded-xl border-2 shadow-md p-4 flex flex-col gap-4 mb-1"
      style={{ borderColor: accent }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-[#1f2937]">{isNew ? "New Item" : "Editing Item"}</p>
        <button onClick={onCancel} className="p-1 text-[#9ca3af] hover:text-[#1f2937]"><X size={16} /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {field("Key (ID)", (
          <input value={draftKey} onChange={(e) => onKeyChange(e.target.value)}
            placeholder="e.g. doctor_on_call" className={inp} disabled={!isNew} />
        ))}
        {field("Name", (
          <input value={draft.name} onChange={(e) => onDraftChange((d) => ({ ...d, name: e.target.value }))}
            placeholder="Display name" className={inp} />
        ))}
      </div>

      {field("Description", (
        <textarea value={draft.description}
          onChange={(e) => onDraftChange((d) => ({ ...d, description: e.target.value }))}
          placeholder="Short description shown to the agent and user" rows={2}
          className={`${inp} resize-none`} />
      ))}

      <div className="grid grid-cols-2 gap-3">
        {field("Price per Person (₹)", (
          <input type="number" value={draft.price_per_person ?? ""}
            onChange={(e) => onDraftChange((d) => ({ ...d, price_per_person: e.target.value ? +e.target.value : undefined }))}
            placeholder="Leave blank if flat price" className={inp} />
        ))}
        {field("Flat Price (₹)", (
          <input type="number" value={draft.price_flat ?? ""}
            onChange={(e) => onDraftChange((d) => ({ ...d, price_flat: e.target.value ? +e.target.value : undefined }))}
            placeholder="Leave blank if per-person" className={inp} />
        ))}
      </div>

      {field("Highlights", (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input value={highlightInput} onChange={(e) => onHighlightInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAddHighlight())}
              placeholder="Type a highlight and press Enter" className={`${inp} flex-1`} />
            <button onClick={onAddHighlight} style={{ background: accent }}
              className="px-3 py-2 rounded-lg text-white text-xs font-bold hover:opacity-90">Add</button>
          </div>
          {draft.highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {draft.highlights.map((h) => (
                <span key={h} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium"
                  style={{ borderColor: accentBorder, background: accentLight, color: accent }}>
                  {h}
                  <button onClick={() => onRemoveHighlight(h)} className="hover:opacity-60"><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {field("Categories (for filtering)", (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input value={categoryInput} onChange={(e) => onCategoryInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAddCategory())}
              placeholder="e.g. medical, travel, emergency" className={`${inp} flex-1`} />
            <button onClick={onAddCategory} style={{ background: accent }}
              className="px-3 py-2 rounded-lg text-white text-xs font-bold hover:opacity-90">Add</button>
          </div>
          {draft.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {draft.categories.map((c) => (
                <span key={c} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#f1f5f9] font-mono text-[#6b7280]">
                  #{c}
                  <button onClick={() => onRemoveCategory(c)} className="hover:opacity-60"><X size={9} /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {field("Suitable For", (
        <input value={draft.suitable_for}
          onChange={(e) => onDraftChange((d) => ({ ...d, suitable_for: e.target.value }))}
          placeholder="e.g. All travellers, Senior citizens, Smokers" className={inp} />
      ))}

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel}
          className="text-xs font-semibold px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f8fafc]">
          Cancel
        </button>
        <button onClick={onSave} disabled={!draftKey.trim() || !draft.name.trim()}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
          style={{ background: accent }}>
          <Check size={13} />
          Save Item
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DataPage() {
  const [activeTab, setActiveTab] = useState<DataKey>("faqs");
  const [editorValue, setEditorValue] = useState("");
  const [promptValue, setPromptValue] = useState("");
  const [catalogValue, setCatalogValue] = useState<Catalog>({});
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const activeInfo = TABS.find((t) => t.key === activeTab)!;

  async function loadTab(key: DataKey) {
    setActiveTab(key);
    setLoaded(false);
    setStatus("loading");
    setErrorMsg("");
    const info = TABS.find((t) => t.key === key)!;
    try {
      const data = await fetchData(key);
      if (info.mode === "prompt") {
        setPromptValue((data as { prompt?: string }).prompt ?? "");
      } else if (info.mode === "catalog") {
        setCatalogValue(data as Catalog);
      } else {
        setEditorValue(JSON.stringify(data, null, 2));
      }
      setLoaded(true);
      setStatus("idle");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to load dataset.");
      setStatus("error");
    }
  }

  async function handleSave() {
    setStatus("saving");
    setErrorMsg("");
    try {
      if (activeInfo.mode === "prompt") {
        await saveData(activeTab, { prompt: promptValue });
      } else if (activeInfo.mode === "catalog") {
        await saveData(activeTab, catalogValue as unknown as Record<string, unknown>);
      } else {
        const parsed = JSON.parse(editorValue);
        await saveData(activeTab, parsed);
      }
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Save failed. Check JSON syntax.");
      setStatus("error");
    }
  }

  async function handleCatalogSave(updated: Catalog) {
    setCatalogValue(updated);
    setStatus("saving");
    try {
      await saveData(activeTab, updated as unknown as Record<string, unknown>);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Save failed.");
      setStatus("error");
    }
  }

  // load on mount
  useEffect(() => {
    loadTab("faqs");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const DolphinLogo = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.984 8.783c-1.332-1.936-3.792-3.14-6.425-3.14-1.295 0-2.527.31-3.626.866.52-2.316 2.584-4.062 5.067-4.062 2.85 0 5.161 2.31 5.161 5.16 0 .438-.057.863-.163 1.267a5.122 5.122 0 0 1-.014-.091zm9.324 7.64c-.958-3.325-3.418-5.748-6.685-6.683-.81-.233-1.666-.363-2.545-.38l-1.077-.021c.542.484 1.002 1.05 1.353 1.68l.215.385c.896 1.62 1.34 3.535 1.272 5.518l-.01.32c1.78-.184 3.393-1.052 4.544-2.355l1.636-1.848.067-1.127a5.534 5.534 0 0 0 .108-.501.996.996 0 0 1-.878.508c-.28 0-.546-.118-.737-.324l-2.072-2.222c-.383-.412-.358-1.055.054-1.439.412-.383 1.055-.357 1.439.055l1.838 1.973c.123.131.295.205.474.205h.001zm-5.75-8.52c-.615-.466-1.286-.867-1.998-1.196-1.293-.598-2.678-.897-4.113-.897-.992 0-1.97.16-2.91.468C3.896 7.425 1.155 9.775.228 12.87l-.147.494 2.112-2.348c.15-.167.315-.327.491-.478l.42-.355c.784-.663 1.678-1.168 2.657-1.498.412-.138.835-.23 1.264-.275l.435-.046c1.67-.176 3.336.262 4.673 1.233.15.108.297.22.441.336l.244.195c1.455 1.164 2.378 2.85 2.628 4.757.065.498.077 1.002.036 1.5l-.019.227c-.234 2.809-1.956 5.176-4.524 6.184l-2.028.794 3.385.163c2.72.13 5.37-1.195 6.953-3.488l2.257-3.265.172-.45c.162-.42.274-.858.337-1.309.055-.398-.016-.807-.205-1.158l-.946-1.745c-.464-.856-1.11-1.577-1.91-2.136z"/>
    </svg>
  );

  return (
    <main className="h-screen w-screen flex flex-col bg-[#f4f7f9] overflow-hidden">
      <div className="flex flex-1 w-full h-full bg-white overflow-hidden">

        {/* Navy Sidebar */}
        <aside className="hidden md:flex flex-col w-[220px] bg-[#0a192f] text-white shrink-0">
          <div className="flex items-center gap-3 px-5 py-5">
            <DolphinLogo />
            <h1 className="text-[15px] font-black tracking-[-0.02em] text-white">
              Dolphin <span className="text-[#00a86b]">Portal</span>
            </h1>
          </div>

          <div className="px-3 mt-2">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#94a3b8] hover:bg-[#132742] hover:text-white transition-colors">
              <ArrowLeft size={18} />
              <span>Back to Hub</span>
            </Link>
          </div>

          {/* Grouped nav */}
          <div className="px-5 mt-6 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Data</span>
          </div>
          <nav className="px-3 flex flex-col gap-1">
            {TABS.filter((t) => !["addons", "vas"].includes(t.key)).map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors text-left w-full ${
                  activeTab === tab.key
                    ? "bg-[#132742] text-white relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#00a86b] before:rounded-r-md"
                    : "text-[#94a3b8] hover:bg-[#132742] hover:text-white"
                }`}>
                {tab.icon}
                <span className="truncate text-xs">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="px-5 mt-5 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Catalog</span>
          </div>
          <nav className="px-3 flex flex-col gap-1">
            {TABS.filter((t) => ["addons", "vas"].includes(t.key)).map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors text-left w-full ${
                  activeTab === tab.key
                    ? "bg-[#132742] text-white relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-md"
                    : "text-[#94a3b8] hover:bg-[#132742] hover:text-white"
                }`}
                style={activeTab === tab.key ? { "--tw-before-bg": tab.accentColor } as React.CSSProperties : {}}>
                <span style={{ color: activeTab === tab.key ? tab.accentColor : undefined }}>{tab.icon}</span>
                <span className="truncate text-xs">{tab.label}</span>
                {activeTab === tab.key && (
                  <span className="ml-auto w-1 absolute left-0 top-2 bottom-2 rounded-r-md"
                    style={{ background: tab.accentColor }} />
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex flex-col flex-1 min-w-0 bg-white overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] shrink-0">
            <div className="flex items-center gap-3">
              <span style={{ color: activeInfo.accentColor ?? "#00a86b" }}>{activeInfo.icon}</span>
              <div>
                <h2 className="text-sm font-bold text-[#1f2937]">{activeInfo.label}</h2>
                <p className="text-xs text-[#6b7280] mt-0.5">{activeInfo.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => loadTab(activeTab)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded border border-[#e5e7eb] bg-white hover:bg-gray-50 text-[#6b7280] transition-colors">
                <RefreshCw size={13} className={status === "loading" ? "animate-spin" : ""} />
                Reload
              </button>
              {activeInfo.mode !== "catalog" && (
                <button onClick={handleSave} disabled={status === "saving" || !loaded}
                  className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded bg-[#00a86b] hover:bg-[#008f5a] text-white transition-colors disabled:opacity-50">
                  <Save size={13} />
                  {status === "saving" ? "Saving…" : "Save Changes"}
                </button>
              )}
            </div>
          </header>

          {/* Status bar */}
          {(status === "saved" || status === "error") && (
            <div className={`flex items-center gap-2 px-6 py-2.5 text-xs font-medium shrink-0 border-b ${
              status === "saved"
                ? "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]"
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {status === "saved"
                ? <><CheckCircle size={14} className="shrink-0" /><span>Saved successfully — agent will use updated data immediately.</span></>
                : <><AlertCircle size={14} className="shrink-0" /><span>{errorMsg}</span></>
              }
            </div>
          )}

          {/* Body */}
          {status === "loading" ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 text-[#6b7280] text-sm">
              <RefreshCw size={22} className="animate-spin text-[#00a86b]" />
              <span>Loading…</span>
            </div>
          ) : activeInfo.mode === "catalog" ? (
            <CatalogEditor
              catalog={catalogValue}
              accentColor={activeInfo.accentColor}
              onSave={handleCatalogSave}
              saving={status === "saving"}
            />
          ) : activeInfo.mode === "prompt" ? (
            <div className="flex-1 p-6 flex flex-col bg-[#f8fafc]">
              <div className="flex-1 flex flex-col gap-3">
                <p className="text-xs text-[#6b7280] leading-relaxed">
                  Write plain instructions for how the agent formats its replies. Takes priority over defaults. Leave blank to use defaults.
                </p>
                <div className="flex-1 flex flex-col bg-white border border-[#e5e7eb] rounded-lg overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-[#e5e7eb] text-xs font-semibold text-[#6b7280]">
                    <MessageSquareText size={13} className="text-[#00a86b]" />
                    Response Style Instructions
                  </div>
                  <textarea value={promptValue} onChange={(e) => setPromptValue(e.target.value)}
                    placeholder="e.g. Keep responses short and friendly. Use bullet points. Talk like a real person."
                    className="w-full flex-1 p-4 text-sm text-[#1f2937] resize-none outline-none leading-relaxed min-h-[240px]" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-6 flex flex-col bg-[#f8fafc]">
              <div className="flex-1 flex flex-col bg-white border border-[#e5e7eb] rounded-lg overflow-hidden shadow-sm">
                <div className="flex items-center px-4 py-2 bg-gray-50 border-b border-[#e5e7eb] text-xs font-semibold text-[#6b7280]">
                  <Code2 size={13} className="text-[#0369a1] mr-2" />
                  {activeTab}.json
                </div>
                <textarea value={editorValue} onChange={(e) => setEditorValue(e.target.value)}
                  spellCheck={false}
                  className="w-full flex-1 p-4 text-sm font-mono text-[#1f2937] resize-none outline-none" />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
