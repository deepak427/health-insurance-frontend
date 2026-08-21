"use client";
import { useState, useEffect } from "react";
import {
  X, Shield, RefreshCw, Search, FileText, Calendar, Users,
  DollarSign, MapPin, Pencil, Trash2, AlertTriangle, Check,
} from "lucide-react";
import { fetchBookings, updateBooking, cancelBooking, Booking, buildBookingDownloadUrl, BASE_URL, APP_NAME } from "@/lib/api";
import { getOrCreateSession } from "@/lib/session";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface EditForm {
  policy_name: string;
  insurer: string;
  destination: string;
  travel_dates: string;
  num_adults: number;
  num_children: number;
  traveller_ages: string;
  sum_insured: string;
  premium: string;
  notes: string;
}

export default function PoliciesPanel({ isOpen, onClose }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Edit state
  const [editingRef, setEditingRef] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Cancel state
  const [cancelRef, setCancelRef] = useState<string | null>(null);
  const [cancelSaving, setCancelSaving] = useState(false);

  async function loadBookings() {
    setLoading(true);
    try {
      const { userId } = getOrCreateSession();
      const data = await fetchBookings(userId);
      setBookings(data);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isOpen) loadBookings();
  }, [isOpen]);

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.ref_number.toLowerCase().includes(q) ||
      b.policy_name.toLowerCase().includes(q) ||
      b.destination.toLowerCase().includes(q) ||
      b.insurer.toLowerCase().includes(q)
    );
  });

  const filterTabs = [
    { id: "all", label: "All", count: filtered.length },
    { id: "complete", label: "Complete", count: filtered.filter((b) => b.status === "complete").length },
    { id: "pending_docs", label: "Pending Docs", count: filtered.filter((b) => b.status === "pending_docs" || b.status === "partial").length },
    { id: "confirmed", label: "Confirmed", count: filtered.filter((b) => b.status === "confirmed").length },
    { id: "docs_received", label: "Docs Received", count: filtered.filter((b) => b.status === "docs_received").length },
    { id: "claim_filed", label: "Claim Filed", count: filtered.filter((b) => b.status === "claim_filed").length },
    { id: "cancelled", label: "Cancelled", count: filtered.filter((b) => b.status === "cancelled").length },
  ];

  const displayedBookings = filtered
    .filter((b) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "pending_docs") return b.status === "pending_docs" || b.status === "partial";
      return b.status === activeFilter;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    complete:      { label: "Complete",      color: "text-[#00a86b]", bg: "bg-[#f0fdf4]", border: "border-[#86efac]" },
    confirmed:     { label: "Confirmed",     color: "text-[#0ea5e9]", bg: "bg-[#f0f9ff]", border: "border-[#bae6fd]" },
    partial:       { label: "Pending Docs",  color: "text-[#f59e0b]", bg: "bg-[#fffbeb]", border: "border-[#fde68a]" },
    pending_docs:  { label: "Pending Docs",  color: "text-[#f59e0b]", bg: "bg-[#fffbeb]", border: "border-[#fde68a]" },
    docs_received: { label: "Docs Received", color: "text-[#8b5cf6]", bg: "bg-[#f5f3ff]", border: "border-[#ddd6fe]" },
    claim_filed:   { label: "Claim Filed",   color: "text-[#f97316]", bg: "bg-[#fff7ed]", border: "border-[#fed7aa]" },
    cancelled:     { label: "Cancelled",     color: "text-[#ef4444]", bg: "bg-[#fef2f2]", border: "border-[#fecaca]" },
  };

  function openEdit(booking: Booking) {
    setEditForm({
      policy_name: booking.policy_name,
      insurer: booking.insurer,
      destination: booking.destination,
      travel_dates: booking.travel_dates,
      num_adults: booking.num_adults,
      num_children: booking.num_children,
      traveller_ages: booking.traveller_ages,
      sum_insured: booking.sum_insured,
      premium: booking.premium,
      notes: booking.notes,
    });
    setEditError("");
    setEditingRef(booking.ref_number);
  }

  async function saveEdit() {
    if (!editingRef || !editForm) return;
    setEditSaving(true);
    setEditError("");
    try {
      const updated = await updateBooking(editingRef, editForm);
      setBookings((prev) => prev.map((b) => b.ref_number === editingRef ? { ...b, ...updated } : b));
      setEditingRef(null);
    } catch {
      setEditError("Failed to save changes. Please try again.");
    }
    setEditSaving(false);
  }

  async function confirmCancel() {
    if (!cancelRef) return;
    setCancelSaving(true);
    try {
      await cancelBooking(cancelRef);
      setBookings((prev) =>
        prev.map((b) => b.ref_number === cancelRef ? { ...b, status: "cancelled" } : b)
      );
      setCancelRef(null);
    } catch {
      // silent — keep dialog open so user can retry
    }
    setCancelSaving(false);
  }

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#f4f5f8] text-[#111827]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e5e7eb] shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#fdeee9] border border-[#fbd3c7] flex items-center justify-center text-[#ff5722] shadow-2xs">
            <Shield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[#111827] tracking-tight">Policies & Bookings</h2>
              <span className="text-[11px] font-bold bg-[#ecfdf5] text-[#065f46] px-2.5 py-0.5 rounded-full border border-[#a7f3d0]">
                {bookings.length} {bookings.length === 1 ? "policy" : "policies"}
              </span>
            </div>
            <p className="text-xs text-[#6b7280] font-normal mt-0.5">
              Live underwritten certificates, traveler details, and policy operation history.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadBookings}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border border-[#e5e7eb] bg-white hover:bg-gray-50 text-[#374151] transition-all shadow-2xs disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-[#ff5722]" : ""} />
            Refresh
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6b7280] hover:text-[#111827] hover:bg-gray-100 transition-colors"
            title="Close panel"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="px-6 py-3.5 bg-white border-b border-[#e5e7eb] shrink-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, policy name, traveler, destination..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[#f9fafb] border border-[#e5e7eb] rounded-xl outline-none focus:border-[#ff5722] transition-colors text-[#111827] placeholder:text-[#9ca3af]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? "bg-[#ff5722] text-white shadow-2xs"
                    : "bg-[#f9fafb] text-[#4b5563] hover:bg-gray-200 border border-[#e5e7eb]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? "bg-white/30 text-white" : "bg-[#e5e7eb] text-[#6b7280]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bookings list — Responsive Grid / Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading && bookings.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-[#ff5722] border-t-transparent animate-spin" />
            <p className="text-xs font-semibold text-[#6b7280]">Loading live policy certificates…</p>
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-2 bg-white rounded-3xl p-8 border border-[#e5e7eb] shadow-sm max-w-md mx-auto text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#fdeee9] text-[#ff5722] flex items-center justify-center">
              <Shield size={24} />
            </div>
            <p className="text-sm font-bold text-[#111827]">No policies issued yet</p>
            <p className="text-xs text-[#6b7280]">Create a new quote or book a policy with Buddy Assistant.</p>
          </div>
        )}

        {!loading && displayedBookings.length === 0 && bookings.length > 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-2 bg-white rounded-3xl p-8 border border-[#e5e7eb] shadow-sm max-w-md mx-auto text-center">
            <Search size={24} className="text-[#9ca3af]" />
            <p className="text-sm font-bold text-[#111827]">No policies match your filter</p>
            <p className="text-xs text-[#6b7280]">Try searching with a different keyword or reset filters.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayedBookings.map((booking) => {
            const cfg = statusConfig[booking.status] ?? {
              label: booking.status,
              color: "text-[#6b7280]",
              bg: "bg-[#f8fafc]",
              border: "border-[#e5e7eb]",
            };
            const isCancelled = booking.status === "cancelled";

            return (
              <div
                key={booking.ref_number}
                className={`bg-white rounded-3xl border border-[#e5e7eb] shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
                  isCancelled ? "opacity-60" : ""
                }`}
              >
                <div>
                  {/* Card header */}
                  <div className="flex items-start justify-between p-4 md:p-5 border-b border-[#f1f5f9] bg-[#fafafa]">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                        <Shield size={18} className={cfg.color} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-black text-[#111827]">{booking.policy_name}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#6b7280] mt-0.5">{booking.insurer || "Travel Underwriter"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="text-right">
                        <p className="text-xs font-mono font-black text-[#ff5722]">{booking.ref_number}</p>
                        <p className="text-[10px] font-medium text-[#9ca3af]">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {/* Action buttons */}
                      {!isCancelled && (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={() => openEdit(booking)}
                            title="Edit booking"
                            className="p-1.5 rounded-xl text-[#6b7280] hover:text-[#ff5722] hover:bg-[#fdeee9] transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setCancelRef(booking.ref_number)}
                            title="Cancel policy"
                            className="p-1.5 rounded-xl text-[#6b7280] hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details grid with standard comfortable text sizing */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-4 md:p-5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <MapPin size={15} className="text-[#9ca3af] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Destination</p>
                        <p className="text-xs font-semibold text-[#111827] mt-0.5">{booking.destination || "—"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Calendar size={15} className="text-[#9ca3af] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Travel Dates</p>
                        <p className="text-xs font-semibold text-[#111827] mt-0.5">{booking.travel_dates || "—"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Users size={15} className="text-[#9ca3af] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Travellers</p>
                        <p className="text-xs font-semibold text-[#111827] mt-0.5">
                          {booking.num_adults} {booking.num_adults === 1 ? "adult" : "adults"}
                          {booking.num_children > 0 && `, ${booking.num_children} ${booking.num_children === 1 ? "child" : "children"}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <DollarSign size={15} className="text-[#00a86b] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Premium</p>
                        <p className="text-xs font-black text-[#00a86b] mt-0.5">{booking.premium || "—"}</p>
                      </div>
                    </div>

                    {booking.sum_insured && (
                      <div className="flex items-start gap-2.5">
                        <Shield size={15} className="text-[#6366f1] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Sum Insured</p>
                          <p className="text-xs font-semibold text-[#111827] mt-0.5">{booking.sum_insured}</p>
                        </div>
                      </div>
                    )}

                    {booking.traveller_ages && (
                      <div className="flex items-start gap-2.5">
                        <Users size={15} className="text-[#9ca3af] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Ages</p>
                          <p className="text-xs font-semibold text-[#111827] mt-0.5">{booking.traveller_ages}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Compact Documents & Certificates Pills */}
                {booking.artifact_ids && booking.artifact_ids.length > 0 && (
                  <div className="p-4 md:p-5 border-t border-[#f1f5f9] bg-[#fafafa]">
                    <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-2.5">
                      Attached Documents & Certificates
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {booking.artifact_ids.map((filename) => {
                        const isUserDoc = !filename.startsWith("booking_") && !filename.startsWith("quotation_");
                        const isImage = /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(filename);
                        const href = `${BASE_URL}/download-artifact/${APP_NAME}/${booking.user_id}/${encodeURIComponent(filename)}`;
                        const label = isUserDoc
                          ? filename
                          : filename
                              .replace(/^booking_confirmation_/, "")
                              .replace(/^quotation_comparison_/, "Comparison ")
                              .replace(/_/g, " ")
                              .replace(/\.pdf$/i, "")
                              .trim();

                        if (isImage && isUserDoc) {
                          return (
                            <a
                              key={filename}
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 max-w-[230px] bg-white border border-[#e5e7eb] rounded-xl p-1.5 pr-3 hover:border-[#ff5722] hover:shadow-2xs transition-all"
                              title={filename}
                            >
                              <img
                                src={href}
                                alt={filename}
                                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-100"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#111827] truncate">{label}</p>
                                <p className="text-[10px] text-[#6b7280]">Photo ID</p>
                              </div>
                            </a>
                          );
                        }

                        return (
                          <a
                            key={filename}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 max-w-[240px] text-xs font-bold px-3 py-2 rounded-xl border transition-all shadow-2xs ${
                              isUserDoc
                                ? "bg-white border-[#e5e7eb] text-[#374151] hover:border-[#ff5722] hover:text-[#ff5722]"
                                : "bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46] hover:bg-[#d1fae5]"
                            }`}
                            title={filename}
                          >
                            <FileText size={14} className={isUserDoc ? "text-[#ff5722]" : "text-[#00a86b]"} />
                            <span className="truncate">{label}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {booking.notes && (
                  <div className="px-4 md:px-5 py-3 border-t border-[#f1f5f9] bg-white">
                    <p className="text-xs text-[#4b5563] font-medium leading-relaxed">{booking.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editingRef && editForm && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-[#e5e7eb]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb] sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#fdeee9] text-[#ff5722] flex items-center justify-center">
                  <Pencil size={15} />
                </div>
                <div>
                  <span className="text-sm font-black text-[#111827]">Edit Policy Booking</span>
                  <span className="text-xs font-mono font-bold text-[#ff5722] block">{editingRef}</span>
                </div>
              </div>
              <button onClick={() => setEditingRef(null)} className="p-1.5 rounded-xl text-[#9ca3af] hover:text-[#111827] hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3.5 text-xs">
              {[
                { label: "Policy Name", key: "policy_name" as const, type: "text" },
                { label: "Insurer Partner", key: "insurer" as const, type: "text" },
                { label: "Destination", key: "destination" as const, type: "text" },
                { label: "Travel Dates", key: "travel_dates" as const, type: "text" },
                { label: "Traveller Ages", key: "traveller_ages" as const, type: "text" },
                { label: "Sum Insured", key: "sum_insured" as const, type: "text" },
                { label: "Premium (₹)", key: "premium" as const, type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-1 block">{label}</label>
                  <input
                    type={type}
                    value={editForm[key] as string}
                    onChange={(e) => setEditForm((f) => f ? { ...f, [key]: e.target.value } : f)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#e5e7eb] rounded-xl outline-none focus:border-[#ff5722] bg-[#f9fafb] text-[#111827]"
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                {(["num_adults", "num_children"] as const).map((key) => (
                  <div key={key}>
                    <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-1 block">
                      {key === "num_adults" ? "Adults" : "Children"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editForm[key]}
                      onChange={(e) => setEditForm((f) => f ? { ...f, [key]: parseInt(e.target.value) || 0 } : f)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#e5e7eb] rounded-xl outline-none focus:border-[#ff5722] bg-[#f9fafb] text-[#111827]"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-1 block">Notes / KYC Status</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => f ? { ...f, notes: e.target.value } : f)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-[#e5e7eb] rounded-xl outline-none focus:border-[#ff5722] bg-[#f9fafb] text-[#111827] resize-none"
                />
              </div>

              {editError && (
                <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{editError}</p>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setEditingRef(null)}
                  className="flex-1 py-2.5 text-xs font-bold border border-[#e5e7eb] rounded-xl text-[#6b7280] hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={editSaving}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-black text-white hover:bg-neutral-800 transition-all shadow-2xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {editSaving ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <><Check size={14} /> Save Changes</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Confirmation Modal ── */}
      {cancelRef && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-[#e5e7eb]">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="text-base font-black text-[#111827]">Cancel Policy Booking?</p>
                <p className="text-xs text-[#6b7280] mt-1.5 leading-relaxed">
                  Booking <span className="font-mono font-bold text-[#ff5722]">{cancelRef}</span> will be
                  marked as cancelled in the central registry.
                </p>
              </div>
              <div className="flex gap-2.5 w-full pt-3">
                <button
                  onClick={() => setCancelRef(null)}
                  disabled={cancelSaving}
                  className="flex-1 py-2.5 text-xs font-bold border border-[#e5e7eb] rounded-xl text-[#6b7280] hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Keep Policy
                </button>
                <button
                  onClick={confirmCancel}
                  disabled={cancelSaving}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  {cancelSaving ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
