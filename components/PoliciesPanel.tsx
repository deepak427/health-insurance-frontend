"use client";
import { useState, useEffect } from "react";
import {
  X, Shield, RefreshCw, Search, FileText, Calendar, Users,
  DollarSign, MapPin, Pencil, Trash2, AlertTriangle, Check,
} from "lucide-react";
import { fetchBookings, updateBooking, cancelBooking, Booking, buildDownloadUrl } from "@/lib/api";
import { getOrCreateSession } from "@/lib/session";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface EditForm {
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

  const grouped = {
    confirmed: filtered.filter((b) => b.status === "confirmed"),
    docs_received: filtered.filter((b) => b.status === "docs_received"),
    claim_filed: filtered.filter((b) => b.status === "claim_filed"),
    cancelled: filtered.filter((b) => b.status === "cancelled"),
  };

  function openEdit(booking: Booking) {
    setEditForm({
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
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb] shrink-0">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-[#00a86b]" />
          <div>
            <h2 className="text-sm font-bold text-[#1f2937]">My Policies</h2>
            <p className="text-[11px] font-light text-[#6b7280] mt-0.5">
              {bookings.length} {bookings.length === 1 ? "booking" : "bookings"} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadBookings}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border border-[#e5e7eb] bg-white hover:bg-[#f8fafc] text-[#6b7280] transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#1f2937] p-1">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-[#e5e7eb] shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, policy, destination..."
            className="w-full pl-7 pr-3 py-1.5 text-xs font-light bg-[#f8fafc] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#00a86b] transition-colors text-[#1f2937] placeholder:text-[#9ca3af]"
          />
        </div>
      </div>

      {/* Bookings list */}
      <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
        {loading && bookings.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-[#00a86b] border-t-transparent animate-spin" />
            <p className="text-xs font-light text-[#9ca3af]">Loading bookings…</p>
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Shield size={24} className="text-[#e5e7eb]" />
            <p className="text-xs font-light text-[#9ca3af]">No bookings yet</p>
            <p className="text-[10px] text-[#9ca3af]">Book a policy to see it here</p>
          </div>
        )}

        {!loading && filtered.length === 0 && bookings.length > 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Search size={24} className="text-[#e5e7eb]" />
            <p className="text-xs font-light text-[#9ca3af]">No bookings match your search</p>
          </div>
        )}

        {["confirmed", "docs_received", "claim_filed", "cancelled"].map((status) => {
          const items = grouped[status as keyof typeof grouped];
          if (items.length === 0) return null;

          const statusConfig = {
            confirmed: { label: "Confirmed", color: "text-[#00a86b]", bg: "bg-[#f0fdf4]", border: "border-[#bbf7d0]" },
            docs_received: { label: "Docs Received", color: "text-[#0ea5e9]", bg: "bg-[#f0f9ff]", border: "border-[#bae6fd]" },
            claim_filed: { label: "Claim Filed", color: "text-[#f59e0b]", bg: "bg-[#fffbeb]", border: "border-[#fde68a]" },
            cancelled: { label: "Cancelled", color: "text-[#ef4444]", bg: "bg-[#fef2f2]", border: "border-[#fecaca]" },
          }[status] || { label: status, color: "text-[#6b7280]", bg: "bg-[#f8fafc]", border: "border-[#e5e7eb]" };

          const isCancelledSection = status === "cancelled";

          return (
            <div key={status}>
              <div className="flex items-center gap-2 px-5 py-2.5 bg-white border-b border-[#f1f5f9] sticky top-0 z-10">
                <span className="text-[11px] font-bold text-[#1f2937]">{statusConfig.label}</span>
                <span className="text-[10px] font-light text-[#9ca3af]">{items.length}</span>
              </div>

              {items.map((booking) => (
                <div
                  key={booking.ref_number}
                  className={`mx-4 my-3 bg-white rounded-lg border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow ${isCancelledSection ? "opacity-60" : ""}`}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between p-3 border-b border-[#f1f5f9]">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${statusConfig.bg} border ${statusConfig.border} flex items-center justify-center shrink-0`}>
                        <Shield size={14} className={statusConfig.color} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1f2937]">{booking.policy_name}</p>
                        <p className="text-[10px] font-light text-[#9ca3af]">{booking.insurer || "Travel Insurance"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right">
                        <p className="text-[10px] font-mono font-bold text-[#00a86b]">{booking.ref_number}</p>
                        <p className="text-[9px] text-[#9ca3af]">{new Date(booking.created_at).toLocaleDateString()}</p>
                      </div>
                      {/* Action buttons — hidden for cancelled */}
                      {!isCancelledSection && (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={() => openEdit(booking)}
                            title="Edit booking"
                            className="p-1 rounded text-[#9ca3af] hover:text-[#0ea5e9] hover:bg-[#f0f9ff] transition-colors"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => setCancelRef(booking.ref_number)}
                            title="Cancel policy"
                            className="p-1 rounded text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-3 p-3">
                    <div className="flex items-start gap-2">
                      <MapPin size={12} className="text-[#9ca3af] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#9ca3af]">Destination</p>
                        <p className="text-xs font-medium text-[#1f2937]">{booking.destination}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar size={12} className="text-[#9ca3af] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#9ca3af]">Travel Dates</p>
                        <p className="text-xs font-medium text-[#1f2937]">{booking.travel_dates}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users size={12} className="text-[#9ca3af] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#9ca3af]">Travellers</p>
                        <p className="text-xs font-medium text-[#1f2937]">
                          {booking.num_adults} {booking.num_adults === 1 ? "adult" : "adults"}
                          {booking.num_children > 0 && `, ${booking.num_children} ${booking.num_children === 1 ? "child" : "children"}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign size={12} className="text-[#9ca3af] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#9ca3af]">Premium</p>
                        <p className="text-xs font-bold text-[#00a86b]">{booking.premium}</p>
                      </div>
                    </div>
                  </div>

                  {/* Artifacts */}
                  {booking.artifact_ids && booking.artifact_ids.length > 0 && (
                    <div className="p-3 border-t border-[#f1f5f9] bg-[#f8fafc]">
                      <div className="flex items-center gap-2 flex-wrap">
                        {booking.artifact_ids.map((filename) => (
                          <a
                            key={filename}
                            href={buildDownloadUrl(booking.user_id, booking.session_id, filename)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded bg-white border border-[#e5e7eb] text-[#00a86b] hover:bg-[#f0fdf4] hover:border-[#00a86b] transition-colors"
                          >
                            <FileText size={10} />
                            {filename.replace(/^booking_confirmation_/, "").replace(/_/g, " ").replace(".pdf", "")}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {booking.notes && (
                    <div className="p-3 border-t border-[#f1f5f9]">
                      <p className="text-[10px] text-[#6b7280] italic">{booking.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Edit Modal ── */}
      {editingRef && editForm && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
              <div className="flex items-center gap-2">
                <Pencil size={14} className="text-[#0ea5e9]" />
                <span className="text-sm font-bold text-[#1f2937]">Edit Booking</span>
                <span className="text-[10px] font-mono text-[#00a86b]">{editingRef}</span>
              </div>
              <button onClick={() => setEditingRef(null)} className="text-[#9ca3af] hover:text-[#1f2937]">
                <X size={14} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {[
                { label: "Destination", key: "destination" as const, type: "text" },
                { label: "Travel Dates", key: "travel_dates" as const, type: "text" },
                { label: "Traveller Ages", key: "traveller_ages" as const, type: "text" },
                { label: "Sum Insured", key: "sum_insured" as const, type: "text" },
                { label: "Premium", key: "premium" as const, type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-[10px] font-medium text-[#6b7280] mb-1 block">{label}</label>
                  <input
                    type={type}
                    value={editForm[key] as string}
                    onChange={(e) => setEditForm((f) => f ? { ...f, [key]: e.target.value } : f)}
                    className="w-full px-3 py-1.5 text-xs border border-[#e5e7eb] rounded-lg outline-none focus:border-[#00a86b] bg-[#f8fafc] text-[#1f2937]"
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                {(["num_adults", "num_children"] as const).map((key) => (
                  <div key={key}>
                    <label className="text-[10px] font-medium text-[#6b7280] mb-1 block">
                      {key === "num_adults" ? "Adults" : "Children"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editForm[key]}
                      onChange={(e) => setEditForm((f) => f ? { ...f, [key]: parseInt(e.target.value) || 0 } : f)}
                      className="w-full px-3 py-1.5 text-xs border border-[#e5e7eb] rounded-lg outline-none focus:border-[#00a86b] bg-[#f8fafc] text-[#1f2937]"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-medium text-[#6b7280] mb-1 block">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => f ? { ...f, notes: e.target.value } : f)}
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs border border-[#e5e7eb] rounded-lg outline-none focus:border-[#00a86b] bg-[#f8fafc] text-[#1f2937] resize-none"
                />
              </div>

              {editError && (
                <p className="text-[10px] text-[#ef4444]">{editError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditingRef(null)}
                  className="flex-1 py-1.5 text-xs font-medium border border-[#e5e7eb] rounded-lg text-[#6b7280] hover:bg-[#f8fafc] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={editSaving}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-[#00a86b] text-white hover:bg-[#008f5a] transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {editSaving ? (
                    <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <><Check size={11} /> Save</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Confirmation Modal ── */}
      {cancelRef && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xs p-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center">
                <AlertTriangle size={18} className="text-[#ef4444]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1f2937]">Cancel Policy?</p>
                <p className="text-xs text-[#6b7280] mt-1">
                  Booking <span className="font-mono font-semibold text-[#00a86b]">{cancelRef}</span> will be
                  permanently cancelled and can no longer be used.
                </p>
              </div>
              <div className="flex gap-2 w-full pt-1">
                <button
                  onClick={() => setCancelRef(null)}
                  disabled={cancelSaving}
                  className="flex-1 py-1.5 text-xs font-medium border border-[#e5e7eb] rounded-lg text-[#6b7280] hover:bg-[#f8fafc] transition-colors disabled:opacity-50"
                >
                  Keep Policy
                </button>
                <button
                  onClick={confirmCancel}
                  disabled={cancelSaving}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-[#ef4444] text-white hover:bg-[#dc2626] transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {cancelSaving ? (
                    <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
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
