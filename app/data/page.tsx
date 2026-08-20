"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Save, RefreshCw, CheckCircle, AlertCircle, Database,
  Code2, MessageSquareText, Puzzle, HeartPulse, Plus, Pencil, Trash2, X, Check,
} from "lucide-react";
import Link from "next/link";
import { fetchData, saveData, DataKey } from "@/lib/api";

// ── Addon: insurer coverage extensions ────────────────────────────────────────
interface AddonItem {
  name: string;
  description: string;
  categories: string[];
  price_per_person?: number;
  price_flat?: number;
  highlights: string[];
  suitable_for: string;
}

// ── VAS: agency-operated services ─────────────────────────────────────────────
interface VasItem {
  name: string;
  description: string;
  categories: string[];
  price_per_person?: number;
  price_flat?: number;
  highlights: string[];
  provider: string;          // "MedAssist Network", "AXA Partners", etc.
  availability: string;      // "24/7", "Mon–Fri 9am–6pm"
  response_time: string;     // "Within 2 hours", "Immediate"
  coverage_scope: string;    // "Worldwide", "50+ major cities", "India only"
  suitable_for: string;
}

type AddonCatalog = Record<string, AddonItem>;
type VasCatalog = Record<string, VasItem>;

// ── Tab config ─────────────────────────────────────────────────────────────────
type TabMode = "json" | "prompt" | "addon-catalog" | "vas-catalog";
interface TabDef { key: DataKey; label: string; description: string; icon: React.ReactNode; mode: TabMode; accent?: string; }

const TABS: TabDef[] = [
  { key: "faqs",           label: "Insurance FAQs",      description: "Q&A repository for policy inquiries.",                       icon: <Database size={16} />,       mode: "json" },
  { key: "claims",         label: "Claim Guides",         description: "Step-by-step workflow for filing claims.",                   icon: <Database size={16} />,       mode: "json" },
  { key: "premium_config", label: "Premium Rate Config",  description: "Rate multipliers and pricing tables.",                       icon: <Database size={16} />,       mode: "json" },
  { key: "response_prompt",label: "Response Style",       description: "Customise agent tone and formatting.",                       icon: <MessageSquareText size={16}/>,mode: "prompt" },
  { key: "addons",         label: "Add-Ons",              description: "Insurer coverage extensions available on travel policies.",  icon: <Puzzle size={16} />,         mode: "addon-catalog", accent: "#d97706" },
  { key: "vas",            label: "VAS Services",         description: "Agency value-added services: Doctor on Call, Air Ambulance…",icon: <HeartPulse size={16} />,     mode: "vas-catalog",   accent: "#0284c7" },
];

// ── Shared helpers ─────────────────────────────────────────────────────────────
const inp = "text-xs px-3 py-2 rounded-lg border border-[#e5e7eb] outline-none focus:border-[#00a86b] bg-white text-[#1f2937] transition-colors w-full";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function TagInput({ values, inputVal, placeholder, accent, accentLight, accentBorder, onInput, onAdd, onRemove }: {
  values: string[]; inputVal: string; placeholder: string;
  accent: string; accentLight: string; accentBorder: string;
  onInput: (v: string) => void; onAdd: () => void; onRemove: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input value={inputVal} onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder} className={`${inp} flex-1`} />
        <button type="button" onClick={onAdd} style={{ background: accent }}
          className="px-3 py-1.5 rounded-lg text-white text-xs font-bold hover:opacity-90 shrink-0">Add</button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span key={v} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium"
              style={{ borderColor: accentBorder, background: accentLight, color: accent }}>
              {v}
              <button type="button" onClick={() => onRemove(v)} className="hover:opacity-60 leading-none"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Addon catalog editor ───────────────────────────────────────────────────────
const EMPTY_ADDON: AddonItem = { name: "", description: "", categories: [], highlights: [], suitable_for: "" };

function AddonCatalogEditor({ catalog, accent = "#d97706", onSave }: {
  catalog: AddonCatalog; accent?: string; onSave: (c: AddonCatalog) => void;
}) {
  const accentLight  = "#fffbeb";
  const accentBorder = "#fde68a";

  const [items, setItems] = useState<AddonCatalog>({ ...catalog });
  const [editKey, setEditKey] = useState<string | null>(null);
  const [draftKey, setDraftKey] = useState("");
  const [draft, setDraft] = useState<AddonItem>({ ...EMPTY_ADDON });
  const [isNew, setIsNew] = useState(false);
  const [hlInput, setHlInput] = useState("");
  const [catInput, setCatInput] = useState("");

  useEffect(() => { setItems({ ...catalog }); }, [catalog]);

  function startNew() {
    setEditKey("__new__"); setDraftKey(""); setDraft({ ...EMPTY_ADDON, categories: [], highlights: [] });
    setIsNew(true); setHlInput(""); setCatInput("");
  }
  function startEdit(key: string) {
    const it = items[key];
    setEditKey(key); setDraftKey(key);
    setDraft({ ...it, highlights: [...(it.highlights ?? [])], categories: [...(it.categories ?? [])] });
    setIsNew(false); setHlInput(""); setCatInput("");
  }
  function cancel() { setEditKey(null); setIsNew(false); }

  function commit() {
    if (!draftKey.trim() || !draft.name.trim()) return;
    const key = draftKey.trim().toLowerCase().replace(/\s+/g, "_");
    const next = { ...items };
    if (!isNew && editKey && editKey !== key) delete next[editKey];
    next[key] = { ...draft };
    setItems(next); setEditKey(null); setIsNew(false); onSave(next);
  }
  function remove(key: string) {
    const next = { ...items }; delete next[key];
    setItems(next); onSave(next);
  }

  const addHl  = () => { const v = hlInput.trim();  if (v && !draft.highlights.includes(v))  setDraft(d => ({...d, highlights:  [...d.highlights,  v]})); setHlInput(""); };
  const addCat = () => { const v = catInput.trim().toLowerCase(); if (v && !draft.categories.includes(v)) setDraft(d => ({...d, categories: [...d.categories, v]})); setCatInput(""); };

  const FormBody = () => (
    <div className="bg-white rounded-xl border-2 shadow-md p-4 flex flex-col gap-3 mb-2" style={{ borderColor: accent }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-[#1f2937]">{isNew ? "New Add-On" : "Edit Add-On"}</p>
        <button onClick={cancel}><X size={16} className="text-[#9ca3af]" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Key (ID)">
          <input value={draftKey} onChange={e => setDraftKey(e.target.value)}
            placeholder="e.g. adventure_sports" className={inp} disabled={!isNew} />
        </Field>
        <Field label="Name">
          <input value={draft.name} onChange={e => setDraft(d => ({...d, name: e.target.value}))}
            placeholder="Display name" className={inp} />
        </Field>
      </div>

      <Field label="Description">
        <textarea value={draft.description} rows={2}
          onChange={e => setDraft(d => ({...d, description: e.target.value}))}
          placeholder="What this add-on covers" className={`${inp} resize-none`} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Price per Person (₹)">
          <input type="number" value={draft.price_per_person ?? ""}
            onChange={e => setDraft(d => ({...d, price_per_person: e.target.value ? +e.target.value : undefined}))}
            placeholder="Per traveller" className={inp} />
        </Field>
        <Field label="Flat Price (₹)">
          <input type="number" value={draft.price_flat ?? ""}
            onChange={e => setDraft(d => ({...d, price_flat: e.target.value ? +e.target.value : undefined}))}
            placeholder="Per policy (not per person)" className={inp} />
        </Field>
      </div>

      <Field label="Coverage Highlights">
        <TagInput values={draft.highlights} inputVal={hlInput} placeholder="e.g. Emergency medical covered"
          accent={accent} accentLight={accentLight} accentBorder={accentBorder}
          onInput={setHlInput} onAdd={addHl} onRemove={h => setDraft(d => ({...d, highlights: d.highlights.filter(x=>x!==h)}))} />
      </Field>

      <Field label="Filter Categories">
        <TagInput values={draft.categories} inputVal={catInput} placeholder="e.g. health, sports, travel"
          accent={accent} accentLight={accentLight} accentBorder="#e5e7eb"
          onInput={setCatInput} onAdd={addCat} onRemove={c => setDraft(d => ({...d, categories: d.categories.filter(x=>x!==c)}))} />
      </Field>

      <Field label="Suitable For">
        <input value={draft.suitable_for} onChange={e => setDraft(d => ({...d, suitable_for: e.target.value}))}
          placeholder="e.g. Smokers, Adventure travellers, Senior citizens" className={inp} />
      </Field>

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={cancel} className="text-xs font-semibold px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f8fafc]">Cancel</button>
        <button onClick={commit} disabled={!draftKey.trim() || !draft.name.trim()}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg text-white disabled:opacity-40"
          style={{ background: accent }}>
          <Check size={13} />Save
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex justify-end mb-4">
        <button onClick={startNew} style={{ background: accent }}
          className="flex items-center gap-2 text-xs font-bold text-white px-4 py-2 rounded-lg hover:opacity-90">
          <Plus size={14} />Add Add-On
        </button>
      </div>

      {editKey === "__new__" && <FormBody />}

      {Object.keys(items).length === 0 && editKey !== "__new__" && (
        <div className="flex flex-col items-center justify-center py-20 text-[#9ca3af]">
          <Puzzle size={36} className="mb-3 opacity-20" />
          <p className="text-sm">No add-ons yet.</p>
          <p className="text-xs mt-1">Click "Add Add-On" to create one.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {Object.entries(items).map(([key, item]) =>
          editKey === key ? <FormBody key={key} /> : (
            <div key={key} className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
              <div className="flex items-start justify-between px-4 py-3 border-b border-[#f1f5f9]" style={{ background: accentLight }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border text-[10px] font-black shrink-0"
                    style={{ background: "white", borderColor: accentBorder, color: accent }}>
                    {item.name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1f2937]">{item.name}</p>
                    <p className="text-[10px] font-mono text-[#9ca3af]">{key}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <span className="text-xs font-black" style={{ color: accent }}>
                    {item.price_per_person ? `₹${item.price_per_person}/person` : item.price_flat ? `₹${item.price_flat} flat` : "—"}
                  </span>
                  <button onClick={() => startEdit(key)} className="p-1.5 rounded text-[#9ca3af] hover:text-[#1f2937] hover:bg-white transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => remove(key)} className="p-1.5 rounded text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                <p className="text-xs text-[#6b7280]">{item.description}</p>
                {item.highlights?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.highlights.map(h => (
                      <span key={h} className="text-[10px] px-2 py-0.5 rounded-full border font-medium text-[#374151]"
                        style={{ borderColor: accentBorder, background: accentLight }}>{h}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  {item.categories?.map(c => (
                    <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#6b7280] font-mono">#{c}</span>
                  ))}
                  {item.suitable_for && <p className="text-[10px] text-[#9ca3af] italic">For: {item.suitable_for}</p>}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── VAS catalog editor ─────────────────────────────────────────────────────────
const EMPTY_VAS: VasItem = {
  name: "", description: "", categories: [], highlights: [],
  provider: "", availability: "", response_time: "", coverage_scope: "", suitable_for: "",
};

function VasCatalogEditor({ catalog, accent = "#0284c7", onSave }: {
  catalog: VasCatalog; accent?: string; onSave: (c: VasCatalog) => void;
}) {
  const accentLight  = "#f0f9ff";
  const accentBorder = "#bae6fd";

  const [items, setItems] = useState<VasCatalog>({ ...catalog });
  const [editKey, setEditKey] = useState<string | null>(null);
  const [draftKey, setDraftKey] = useState("");
  const [draft, setDraft] = useState<VasItem>({ ...EMPTY_VAS });
  const [isNew, setIsNew] = useState(false);
  const [hlInput, setHlInput] = useState("");
  const [catInput, setCatInput] = useState("");

  useEffect(() => { setItems({ ...catalog }); }, [catalog]);

  function startNew() {
    setEditKey("__new__"); setDraftKey(""); setDraft({ ...EMPTY_VAS, categories: [], highlights: [] });
    setIsNew(true); setHlInput(""); setCatInput("");
  }
  function startEdit(key: string) {
    const it = items[key];
    setEditKey(key); setDraftKey(key);
    setDraft({ ...it, highlights: [...(it.highlights ?? [])], categories: [...(it.categories ?? [])] });
    setIsNew(false); setHlInput(""); setCatInput("");
  }
  function cancel() { setEditKey(null); setIsNew(false); }

  function commit() {
    if (!draftKey.trim() || !draft.name.trim()) return;
    const key = draftKey.trim().toLowerCase().replace(/\s+/g, "_");
    const next = { ...items };
    if (!isNew && editKey && editKey !== key) delete next[editKey];
    next[key] = { ...draft };
    setItems(next); setEditKey(null); setIsNew(false); onSave(next);
  }
  function remove(key: string) {
    const next = { ...items }; delete next[key];
    setItems(next); onSave(next);
  }

  const addHl  = () => { const v = hlInput.trim();  if (v && !draft.highlights.includes(v))  setDraft(d => ({...d, highlights:  [...d.highlights,  v]})); setHlInput(""); };
  const addCat = () => { const v = catInput.trim().toLowerCase(); if (v && !draft.categories.includes(v)) setDraft(d => ({...d, categories: [...d.categories, v]})); setCatInput(""); };

  const FormBody = () => (
    <div className="bg-white rounded-xl border-2 shadow-md p-4 flex flex-col gap-3 mb-2" style={{ borderColor: accent }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-[#1f2937]">{isNew ? "New VAS Service" : "Edit VAS Service"}</p>
        <button onClick={cancel}><X size={16} className="text-[#9ca3af]" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Key (ID)">
          <input value={draftKey} onChange={e => setDraftKey(e.target.value)}
            placeholder="e.g. doctor_on_call" className={inp} disabled={!isNew} />
        </Field>
        <Field label="Service Name">
          <input value={draft.name} onChange={e => setDraft(d => ({...d, name: e.target.value}))}
            placeholder="e.g. Doctor on Call" className={inp} />
        </Field>
      </div>

      <Field label="Description">
        <textarea value={draft.description} rows={2}
          onChange={e => setDraft(d => ({...d, description: e.target.value}))}
          placeholder="What this service provides" className={`${inp} resize-none`} />
      </Field>

      {/* VAS-specific fields — not in addons */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Service Provider">
          <input value={draft.provider} onChange={e => setDraft(d => ({...d, provider: e.target.value}))}
            placeholder="e.g. MedAssist Network, AXA Partners" className={inp} />
        </Field>
        <Field label="Availability">
          <input value={draft.availability} onChange={e => setDraft(d => ({...d, availability: e.target.value}))}
            placeholder="e.g. 24/7, Mon–Fri 9am–6pm" className={inp} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Response Time">
          <input value={draft.response_time} onChange={e => setDraft(d => ({...d, response_time: e.target.value}))}
            placeholder="e.g. Immediate, Within 2 hours" className={inp} />
        </Field>
        <Field label="Coverage Scope">
          <input value={draft.coverage_scope} onChange={e => setDraft(d => ({...d, coverage_scope: e.target.value}))}
            placeholder="e.g. Worldwide, 50+ major cities" className={inp} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Price per Person (₹)">
          <input type="number" value={draft.price_per_person ?? ""}
            onChange={e => setDraft(d => ({...d, price_per_person: e.target.value ? +e.target.value : undefined}))}
            placeholder="Per traveller" className={inp} />
        </Field>
        <Field label="Flat Price (₹)">
          <input type="number" value={draft.price_flat ?? ""}
            onChange={e => setDraft(d => ({...d, price_flat: e.target.value ? +e.target.value : undefined}))}
            placeholder="Per policy" className={inp} />
        </Field>
      </div>

      <Field label="Service Highlights">
        <TagInput values={draft.highlights} inputVal={hlInput} placeholder="e.g. Available in 10+ languages"
          accent={accent} accentLight={accentLight} accentBorder={accentBorder}
          onInput={setHlInput} onAdd={addHl} onRemove={h => setDraft(d => ({...d, highlights: d.highlights.filter(x=>x!==h)}))} />
      </Field>

      <Field label="Filter Categories">
        <TagInput values={draft.categories} inputVal={catInput} placeholder="e.g. medical, emergency, travel"
          accent={accent} accentLight={accentLight} accentBorder="#e5e7eb"
          onInput={setCatInput} onAdd={addCat} onRemove={c => setDraft(d => ({...d, categories: d.categories.filter(x=>x!==c)}))} />
      </Field>

      <Field label="Suitable For">
        <input value={draft.suitable_for} onChange={e => setDraft(d => ({...d, suitable_for: e.target.value}))}
          placeholder="e.g. All travellers, Senior citizens" className={inp} />
      </Field>

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={cancel} className="text-xs font-semibold px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f8fafc]">Cancel</button>
        <button onClick={commit} disabled={!draftKey.trim() || !draft.name.trim()}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg text-white disabled:opacity-40"
          style={{ background: accent }}>
          <Check size={13} />Save
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex justify-end mb-4">
        <button onClick={startNew} style={{ background: accent }}
          className="flex items-center gap-2 text-xs font-bold text-white px-4 py-2 rounded-lg hover:opacity-90">
          <Plus size={14} />Add VAS Service
        </button>
      </div>

      {editKey === "__new__" && <FormBody />}

      {Object.keys(items).length === 0 && editKey !== "__new__" && (
        <div className="flex flex-col items-center justify-center py-20 text-[#9ca3af]">
          <HeartPulse size={36} className="mb-3 opacity-20" />
          <p className="text-sm">No VAS services yet.</p>
          <p className="text-xs mt-1">Click "Add VAS Service" to create one.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {Object.entries(items).map(([key, item]) =>
          editKey === key ? <FormBody key={key} /> : (
            <div key={key} className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
              <div className="flex items-start justify-between px-4 py-3 border-b border-[#f1f5f9]" style={{ background: accentLight }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border text-[10px] font-black shrink-0"
                    style={{ background: "white", borderColor: accentBorder, color: accent }}>
                    {item.name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1f2937]">{item.name}</p>
                    <p className="text-[10px] font-mono text-[#9ca3af]">{key}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <span className="text-xs font-black" style={{ color: accent }}>
                    {item.price_per_person ? `₹${item.price_per_person}/person` : item.price_flat ? `₹${item.price_flat} flat` : "—"}
                  </span>
                  <button onClick={() => startEdit(key)} className="p-1.5 rounded text-[#9ca3af] hover:text-[#1f2937] hover:bg-white transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => remove(key)} className="p-1.5 rounded text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                <p className="text-xs text-[#6b7280]">{item.description}</p>
                {/* VAS-specific metadata row */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {item.provider      && <p className="text-[10px] text-[#6b7280]"><span className="font-semibold text-[#374151]">Provider:</span> {item.provider}</p>}
                  {item.availability  && <p className="text-[10px] text-[#6b7280]"><span className="font-semibold text-[#374151]">Available:</span> {item.availability}</p>}
                  {item.response_time && <p className="text-[10px] text-[#6b7280]"><span className="font-semibold text-[#374151]">Response:</span> {item.response_time}</p>}
                  {item.coverage_scope&& <p className="text-[10px] text-[#6b7280]"><span className="font-semibold text-[#374151]">Scope:</span> {item.coverage_scope}</p>}
                </div>
                {item.highlights?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.highlights.map(h => (
                      <span key={h} className="text-[10px] px-2 py-0.5 rounded-full border font-medium text-[#374151]"
                        style={{ borderColor: accentBorder, background: accentLight }}>{h}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  {item.categories?.map(c => (
                    <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#6b7280] font-mono">#{c}</span>
                  ))}
                  {item.suitable_for && <p className="text-[10px] text-[#9ca3af] italic">For: {item.suitable_for}</p>}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DataPage() {
  const [activeTab, setActiveTab] = useState<DataKey>("faqs");
  const [editorValue, setEditorValue] = useState("");
  const [promptValue, setPromptValue] = useState("");
  const [addonCatalog, setAddonCatalog] = useState<AddonCatalog>({});
  const [vasCatalog, setVasCatalog]   = useState<VasCatalog>({});
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const activeInfo = TABS.find((t) => t.key === activeTab)!;

  const loadTab = useCallback(async (key: DataKey) => {
    setActiveTab(key);
    setLoaded(false);
    setStatus("loading");
    setErrorMsg("");
    const info = TABS.find((t) => t.key === key)!;
    try {
      const data = await fetchData(key);
      if (info.mode === "prompt") {
        setPromptValue((data as { prompt?: string }).prompt ?? "");
      } else if (info.mode === "addon-catalog") {
        setAddonCatalog(data as AddonCatalog);
      } else if (info.mode === "vas-catalog") {
        setVasCatalog(data as VasCatalog);
      } else {
        setEditorValue(JSON.stringify(data, null, 2));
      }
      setLoaded(true);
      setStatus("idle");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to load.");
      setStatus("error");
    }
  }, []);

  useEffect(() => { loadTab("faqs"); }, [loadTab]);

  async function handleSave() {
    setStatus("saving");
    try {
      if (activeInfo.mode === "prompt") {
        await saveData(activeTab, { prompt: promptValue });
      } else {
        const parsed = JSON.parse(editorValue);
        await saveData(activeTab, parsed);
      }
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Save failed.");
      setStatus("error");
    }
  }

  async function handleCatalogSave(updated: AddonCatalog | VasCatalog) {
    if (activeInfo.mode === "addon-catalog") setAddonCatalog(updated as AddonCatalog);
    else setVasCatalog(updated as VasCatalog);
    setStatus("saving");
    try {
      await saveData(activeTab, updated as Record<string, unknown>);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Save failed.");
      setStatus("error");
    }
  }

  const DolphinLogo = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M12.984 8.783c-1.332-1.936-3.792-3.14-6.425-3.14-1.295 0-2.527.31-3.626.866.52-2.316 2.584-4.062 5.067-4.062 2.85 0 5.161 2.31 5.161 5.16 0 .438-.057.863-.163 1.267a5.122 5.122 0 0 1-.014-.091zm9.324 7.64c-.958-3.325-3.418-5.748-6.685-6.683-.81-.233-1.666-.363-2.545-.38l-1.077-.021c.542.484 1.002 1.05 1.353 1.68l.215.385c.896 1.62 1.34 3.535 1.272 5.518l-.01.32c1.78-.184 3.393-1.052 4.544-2.355l1.636-1.848.067-1.127a5.534 5.534 0 0 0 .108-.501.996.996 0 0 1-.878.508c-.28 0-.546-.118-.737-.324l-2.072-2.222c-.383-.412-.358-1.055.054-1.439.412-.383 1.055-.357 1.439.055l1.838 1.973c.123.131.295.205.474.205h.001zm-5.75-8.52c-.615-.466-1.286-.867-1.998-1.196-1.293-.598-2.678-.897-4.113-.897-.992 0-1.97.16-2.91.468C3.896 7.425 1.155 9.775.228 12.87l-.147.494 2.112-2.348c.15-.167.315-.327.491-.478l.42-.355c.784-.663 1.678-1.168 2.657-1.498.412-.138.835-.23 1.264-.275l.435-.046c1.67-.176 3.336.262 4.673 1.233.15.108.297.22.441.336l.244.195c1.455 1.164 2.378 2.85 2.628 4.757.065.498.077 1.002.036 1.5l-.019.227c-.234 2.809-1.956 5.176-4.524 6.184l-2.028.794 3.385.163c2.72.13 5.37-1.195 6.953-3.488l2.257-3.265.172-.45c.162-.42.274-.858.337-1.309.055-.398-.016-.807-.205-1.158l-.946-1.745c-.464-.856-1.11-1.577-1.91-2.136z"/>
    </svg>
  );

  const isCatalog = activeInfo.mode === "addon-catalog" || activeInfo.mode === "vas-catalog";

  return (
    <main className="h-screen w-screen flex overflow-hidden">
      <div className="flex flex-1 w-full h-full bg-white overflow-hidden">

        {/* Navy sidebar */}
        <aside className="hidden md:flex flex-col w-[220px] bg-[#0a192f] text-white shrink-0">
          <div className="flex items-center gap-3 px-5 py-5">
            <DolphinLogo />
            <h1 className="text-[15px] font-black tracking-[-0.02em]">Dolphin <span className="text-[#00a86b]">Portal</span></h1>
          </div>
          <div className="px-3 mt-1">
            <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs text-[#94a3b8] hover:bg-[#132742] hover:text-white transition-colors">
              <ArrowLeft size={16} /><span>Back to Hub</span>
            </Link>
          </div>

          <p className="px-5 mt-5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Data</p>
          <nav className="px-3 flex flex-col gap-1">
            {TABS.filter(t => !["addons","vas"].includes(t.key)).map(tab => (
              <button key={tab.key} onClick={() => loadTab(tab.key)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs transition-colors text-left w-full relative ${
                  activeTab === tab.key ? "bg-[#132742] text-white font-semibold" : "text-[#94a3b8] hover:bg-[#132742] hover:text-white font-light"
                }`}>
                {activeTab === tab.key && <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#00a86b] rounded-r-md" />}
                {tab.icon}<span className="truncate">{tab.label}</span>
              </button>
            ))}
          </nav>

          <p className="px-5 mt-5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Catalog</p>
          <nav className="px-3 flex flex-col gap-1">
            {TABS.filter(t => ["addons","vas"].includes(t.key)).map(tab => (
              <button key={tab.key} onClick={() => loadTab(tab.key)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs transition-colors text-left w-full relative ${
                  activeTab === tab.key ? "bg-[#132742] text-white font-semibold" : "text-[#94a3b8] hover:bg-[#132742] hover:text-white font-light"
                }`}>
                {activeTab === tab.key && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md" style={{ background: tab.accent }} />}
                <span style={{ color: activeTab === tab.key ? tab.accent : undefined }}>{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <header className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] shrink-0">
            <div className="flex items-center gap-3">
              <span style={{ color: activeInfo.accent ?? "#00a86b" }}>{activeInfo.icon}</span>
              <div>
                <h2 className="text-sm font-bold text-[#1f2937]">{activeInfo.label}</h2>
                <p className="text-xs text-[#6b7280] mt-0.5">{activeInfo.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => loadTab(activeTab)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded border border-[#e5e7eb] hover:bg-gray-50 text-[#6b7280]">
                <RefreshCw size={13} className={status === "loading" ? "animate-spin" : ""} />Reload
              </button>
              {!isCatalog && (
                <button onClick={handleSave} disabled={status === "saving" || !loaded}
                  className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded bg-[#00a86b] hover:bg-[#008f5a] text-white disabled:opacity-50">
                  <Save size={13} />{status === "saving" ? "Saving…" : "Save Changes"}
                </button>
              )}
            </div>
          </header>

          {(status === "saved" || status === "error") && (
            <div className={`flex items-center gap-2 px-6 py-2.5 text-xs font-medium shrink-0 border-b ${
              status === "saved" ? "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]" : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {status === "saved"
                ? <><CheckCircle size={14} className="shrink-0" /><span>Saved — agent picks up changes immediately.</span></>
                : <><AlertCircle size={14} className="shrink-0" /><span>{errorMsg}</span></>}
            </div>
          )}

          {status === "loading" ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 text-[#6b7280]">
              <RefreshCw size={22} className="animate-spin text-[#00a86b]" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : activeInfo.mode === "addon-catalog" ? (
            <AddonCatalogEditor catalog={addonCatalog} accent={activeInfo.accent} onSave={handleCatalogSave} />
          ) : activeInfo.mode === "vas-catalog" ? (
            <VasCatalogEditor catalog={vasCatalog} accent={activeInfo.accent} onSave={handleCatalogSave} />
          ) : activeInfo.mode === "prompt" ? (
            <div className="flex-1 p-6 flex flex-col bg-[#f8fafc] overflow-hidden">
              <p className="text-xs text-[#6b7280] mb-3 leading-relaxed">
                Plain instructions for how the agent formats replies. Takes priority over defaults. Leave blank to use defaults.
              </p>
              <div className="flex-1 flex flex-col bg-white border border-[#e5e7eb] rounded-lg overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-[#e5e7eb] text-xs font-semibold text-[#6b7280]">
                  <MessageSquareText size={13} className="text-[#00a86b]" />Response Style Instructions
                </div>
                <textarea value={promptValue} onChange={e => setPromptValue(e.target.value)}
                  placeholder="e.g. Keep responses short and friendly. Use bullet points."
                  className="w-full flex-1 p-4 text-sm text-[#1f2937] resize-none outline-none leading-relaxed min-h-[240px]" />
              </div>
            </div>
          ) : (
            <div className="flex-1 p-6 flex flex-col bg-[#f8fafc] overflow-hidden">
              <div className="flex-1 flex flex-col bg-white border border-[#e5e7eb] rounded-lg overflow-hidden shadow-sm">
                <div className="flex items-center px-4 py-2 bg-gray-50 border-b border-[#e5e7eb] text-xs font-semibold text-[#6b7280]">
                  <Code2 size={13} className="text-[#0369a1] mr-2" />{activeTab}.json
                </div>
                <textarea value={editorValue} onChange={e => setEditorValue(e.target.value)}
                  spellCheck={false} className="w-full flex-1 p-4 text-sm font-mono text-[#1f2937] resize-none outline-none" />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
