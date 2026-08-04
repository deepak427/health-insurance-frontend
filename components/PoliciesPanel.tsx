"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { X, Shield, RefreshCw, Search, Building2 } from "lucide-react";
import { useChatContext } from "@/context/ChatContext";
import { resolveCompanyName, fetchPolicies, fetchCompanies, Company, Policy } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PoliciesPanel({ isOpen, onClose }: Props) {
  const { policies, companies, policiesLoading, setPolicies, setCompanies } = useChatContext() as any;
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [activeCompany, setActiveCompany] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  // Suppress scroll-spy briefly after a programmatic scroll
  const suppressRef = useRef(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const [pols, comps] = await Promise.all([fetchPolicies(), fetchCompanies()]);
      setPolicies(pols);
      const map: Record<string, string> = {};
      comps.forEach((c: Company) => { map[c._id] = c.name; });
      setCompanies(map);
    } catch {}
    setRefreshing(false);
  }

  // Group all policies by company (no filtering by selected company)
  const grouped = useMemo(() => {
    const map: Record<string, { name: string; policies: Policy[] }> = {};
    (policies as Policy[]).forEach((p) => {
      const cname = resolveCompanyName(p, companies) || "Other";
      if (!map[cname]) map[cname] = { name: cname, policies: [] };
      map[cname].policies.push(p);
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [policies, companies]);

  // Apply search filter on top of grouped (still shows all companies)
  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    return grouped
      .map((g) => ({ ...g, policies: g.policies.filter((p) => p.name.toLowerCase().includes(q)) }))
      .filter((g) => g.policies.length > 0);
  }, [grouped, search]);

  // Set up IntersectionObserver to track which company section is visible
  useEffect(() => {
    if (!isOpen) return;
    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (suppressRef.current) return;
        // Find the topmost intersecting section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveCompany(visible[0].target.getAttribute("data-company"));
        }
      },
      {
        root: scrollRef.current,
        rootMargin: "0px 0px -70% 0px",
        threshold: 0,
      }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [isOpen, filtered]);

  // Scroll to a company section when clicked in nav
  const scrollToCompany = useCallback((name: string) => {
    const el = sectionRefs.current[name];
    if (!el || !scrollRef.current) return;
    setActiveCompany(name);
    suppressRef.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => { suppressRef.current = false; }, 800);
  }, []);

  // Reset active when search changes
  useEffect(() => { setActiveCompany(null); }, [search]);

  if (!isOpen) return null;

  const isLoading = policiesLoading || refreshing;

  return (
    <div className="absolute inset-0 z-20 flex bg-white">
      {/* Left nav — companies list */}
      <div className="flex flex-col w-[200px] shrink-0 bg-[#f8fafc] border-r border-[#e5e7eb] h-full">
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-[#00a86b]" />
            <span className="text-xs font-bold text-[#1f2937]">My Policies</span>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#1f2937]">
            <X size={15} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {/* All Companies — scrolls to top */}
          <button
            onClick={() => {
              setActiveCompany(null);
              scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs transition-colors mb-1 relative ${
              !activeCompany
                ? "bg-white text-[#1f2937] font-bold shadow-sm border border-[#e5e7eb] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-[#00a86b] before:rounded-r"
                : "text-[#6b7280] hover:bg-white hover:text-[#1f2937] font-light"
            }`}
          >
            <span>All Companies</span>
            <span className="ml-auto text-[10px] text-[#9ca3af]">{policies.length}</span>
          </button>

          {grouped.map((g) => (
            <button
              key={g.name}
              onClick={() => scrollToCompany(g.name)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs transition-colors mb-0.5 relative ${
                activeCompany === g.name
                  ? "bg-white text-[#1f2937] font-bold shadow-sm border border-[#e5e7eb] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-[#00a86b] before:rounded-r"
                  : "text-[#6b7280] hover:bg-white hover:text-[#1f2937] font-light"
              }`}
            >
              <Building2 size={12} className="shrink-0 text-[#9ca3af]" />
              <span className="truncate">{g.name}</span>
              <span className="ml-auto text-[10px] text-[#9ca3af] shrink-0">{g.policies.length}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb] shrink-0">
          <div>
            <h2 className="text-sm font-bold text-[#1f2937]">All Policies</h2>
            <p className="text-[11px] font-light text-[#6b7280] mt-0.5">
              Browse all plans across insurers
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border border-[#e5e7eb] bg-white hover:bg-[#f8fafc] text-[#6b7280] transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-[#e5e7eb] shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search policies…"
              className="w-full pl-7 pr-3 py-1.5 text-xs font-light bg-[#f8fafc] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#00a86b] transition-colors text-[#1f2937] placeholder:text-[#9ca3af]"
            />
          </div>
        </div>

        {/* Policy list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#f8fafc]">
          {isLoading && policies.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-[#00a86b] border-t-transparent animate-spin" />
              <p className="text-xs font-light text-[#9ca3af]">Loading…</p>
            </div>
          )}

          {!isLoading && policies.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <Shield size={24} className="text-[#e5e7eb]" />
              <p className="text-xs font-light text-[#9ca3af]">No policies found</p>
            </div>
          )}

          {filtered.map((group) => (
            <div
              key={group.name}
              data-company={group.name}
              ref={(el) => { sectionRefs.current[group.name] = el; }}
            >
              {/* Company section header */}
              <div className="flex items-center gap-2 px-5 py-2.5 bg-white border-b border-[#f1f5f9] sticky top-0 z-10">
                <Building2 size={12} className="text-[#6b7280]" />
                <span className="text-[11px] font-bold text-[#1f2937]">{group.name}</span>
                <span className="text-[10px] font-light text-[#9ca3af]">{group.policies.length} plans</span>
              </div>

              {group.policies.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center gap-3 px-5 py-3 border-b border-[#f1f5f9] hover:bg-white transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center shrink-0">
                    <Shield size={13} className="text-[#00a86b]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1f2937] truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.policyCategory?.name && (
                        <span className="text-[10px] font-light text-[#6b7280] bg-[#f8fafc] border border-[#e5e7eb] px-1.5 py-0.5 rounded">
                          {p.policyCategory.name}
                        </span>
                      )}
                      {p.subPolicies && p.subPolicies.length > 0 && (
                        <span className="text-[10px] font-light text-[#9ca3af]">
                          {p.subPolicies.length} plans
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
