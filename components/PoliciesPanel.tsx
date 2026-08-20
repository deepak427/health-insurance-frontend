"use client";
import { useState, useEffect } from "react";
import { X, Shield, RefreshCw, Search, FileText, Calendar, Users, DollarSign, MapPin } from "lucide-react";
import { fetchBookings, Booking, buildAbsoluteDownloadUrl } from "@/lib/api";
import { getOrCreateSession } from "@/lib/session";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PoliciesPanel({ isOpen, onClose }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

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
    if (isOpen) {
      loadBookings();
    }
  }, [isOpen]);

  // Filter bookings by search
  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.ref_number.toLowerCase().includes(q) ||
      b.policy_name.toLowerCase().includes(q) ||
      b.destination.toLowerCase().includes(q) ||
      b.insurer.toLowerCase().includes(q)
    );
  });

  // Group by status
  const grouped = {
    confirmed: filtered.filter((b) => b.status === "confirmed"),
    docs_received: filtered.filter((b) => b.status === "docs_received"),
    claim_filed: filtered.filter((b) => b.status === "claim_filed"),
    cancelled: filtered.filter((b) => b.status === "cancelled"),
  };

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

        {/* Status sections */}
        {["confirmed", "docs_received", "claim_filed", "cancelled"].map((status) => {
          const items = grouped[status as keyof typeof grouped];
          if (items.length === 0) return null;

          const statusConfig = {
            confirmed: { label: "Confirmed", color: "text-[#00a86b]", bg: "bg-[#f0fdf4]", border: "border-[#bbf7d0]" },
            docs_received: { label: "Docs Received", color: "text-[#0ea5e9]", bg: "bg-[#f0f9ff]", border: "border-[#bae6fd]" },
            claim_filed: { label: "Claim Filed", color: "text-[#f59e0b]", bg: "bg-[#fffbeb]", border: "border-[#fde68a]" },
            cancelled: { label: "Cancelled", color: "text-[#ef4444]", bg: "bg-[#fef2f2]", border: "border-[#fecaca]" },
          }[status] || { label: status, color: "text-[#6b7280]", bg: "bg-[#f8fafc]", border: "border-[#e5e7eb]" };

          return (
            <div key={status}>
              {/* Status header */}
              <div className="flex items-center gap-2 px-5 py-2.5 bg-white border-b border-[#f1f5f9] sticky top-0 z-10">
                <span className="text-[11px] font-bold text-[#1f2937]">{statusConfig.label}</span>
                <span className="text-[10px] font-light text-[#9ca3af]">{items.length}</span>
              </div>

              {/* Booking cards */}
              {items.map((booking) => (
                <div
                  key={booking.ref_number}
                  className="mx-4 my-3 bg-white rounded-lg border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header */}
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
                    <div className="text-right">
                      <p className="text-[10px] font-mono font-bold text-[#00a86b]">{booking.ref_number}</p>
                      <p className="text-[9px] text-[#9ca3af]">{new Date(booking.created_at).toLocaleDateString()}</p>
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

                  {/* Footer - artifacts */}
                  {booking.artifact_ids && booking.artifact_ids.length > 0 && (
                    <div className="p-3 border-t border-[#f1f5f9] bg-[#f8fafc]">
                      <div className="flex items-center gap-2 flex-wrap">
                        {booking.artifact_ids.map((filename) => (
                          <a
                            key={filename}
                            href={buildAbsoluteDownloadUrl(booking.user_id, booking.session_id, filename)}
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
    </div>
  );
}
