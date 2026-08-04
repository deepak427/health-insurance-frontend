"use client";
import { useEffect, useState } from "react";
import { X, Shield, RefreshCw, AlertCircle, Copy, Check } from "lucide-react";
import { fetchPolicies, fetchCompanies, Policy, Company } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PoliciesPanel({ isOpen, onClose }: Props) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    Promise.all([fetchPolicies(), fetchCompanies()])
      .then(([pols, comps]) => {
        setPolicies(pols);
        const map: Record<string, string> = {};
        comps.forEach((c: Company) => { map[c._id] = c.name; });
        setCompanies(map);
      })
      .catch(() => setError("Couldn't load policies — check backend connection."))
      .finally(() => setLoading(false));
  }, [isOpen]);

  function copyId(id: string) {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0a192f]/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — slides in from the left, right next to the sidebar */}
      <aside className="relative z-10 flex flex-col h-full w-[320px] ml-[220px] bg-white border-r border-[#e5e7eb] shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb] shrink-0">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#00a86b]" />
            <h2 className="text-sm font-bold text-[#1f2937]">My Policies</h2>
            {!loading && policies.length > 0 && (
              <span className="text-[10px] font-bold bg-[#f0fdf4] text-[#00a86b] border border-[#bbf7d0] px-1.5 py-0.5 rounded-full">
                {policies.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setLoading(true); setError(null); Promise.all([fetchPolicies(), fetchCompanies()]).then(([pols, comps]) => { setPolicies(pols); const map: Record<string, string> = {}; comps.forEach((c: Company) => { map[c._id] = c.name; }); setCompanies(map); }).catch(() => setError("Couldn't load policies.")).finally(() => setLoading(false)); }}
              className="w-7 h-7 flex items-center justify-center text-[#6b7280] hover:bg-[#f8fafc] rounded"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-[#6b7280] hover:bg-[#f8fafc] rounded"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Hint */}
        <div className="px-5 py-3 bg-[#f8fafc] border-b border-[#e5e7eb] shrink-0">
          <p className="text-[11px] font-light text-[#6b7280] leading-relaxed">
            Use policy IDs when asking Buddy to compare plans or calculate premiums.
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-[#00a86b] border-t-transparent animate-spin" />
              <p className="text-xs font-light text-[#9ca3af]">Loading policies…</p>
            </div>
          )}

          {error && !loading && (
            <div className="m-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs font-light text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && policies.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Shield size={28} className="text-[#e5e7eb]" />
              <p className="text-xs font-light text-[#9ca3af]">No policies found.</p>
            </div>
          )}

          {!loading && !error && policies.length > 0 && (
            <ul className="divide-y divide-[#f1f5f9]">
              {policies.map((p) => (
                <li key={p._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f8fafc] transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center shrink-0">
                    <Shield size={15} className="text-[#00a86b]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1f2937] leading-tight truncate">{p.name}</p>
                    {companies[p.companyId] && (
                      <p className="text-[10px] font-light text-[#6b7280] mt-0.5 truncate">
                        {companies[p.companyId]}
                      </p>
                    )}
                    <p className="text-[10px] font-light text-[#9ca3af] mt-0.5 font-mono truncate">
                      {p._id}
                    </p>
                  </div>
                  <button
                    onClick={() => copyId(p._id)}
                    className="w-7 h-7 flex items-center justify-center text-[#9ca3af] hover:text-[#00a86b] hover:bg-[#f0fdf4] rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Copy policy ID"
                  >
                    {copiedId === p._id ? (
                      <Check size={13} className="text-[#00a86b]" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
