"use client";
import { Shield, CheckCircle2, IndianRupee, MapPin, Calendar, Users, BadgeCheck, PlusCircle, Sparkles, HeartPulse, FileSpreadsheet, ExternalLink, Clock } from "lucide-react";

export interface PolicyCardData {
  type?: "policy" | "confirm" | "addon" | "vas";
  name: string;
  company?: string;
  premium?: string | number;
  sumInsured?: string;
  highlights?: string[];
  action?: string;
  prompt?: string;
  // confirm-card fields
  destination?: string;
  travelDates?: string;
  travellers?: string;
  cancelPrompt?: string;
  // addon / vas fields
  key?: string;
  price?: string;
  description?: string;
}

export interface BookingCardData {
  ref: string;
  policy: string;
  destination?: string;
  dates?: string;
  premium?: string;
  status?: string;
  prompt?: string;
}

export interface BookingTableRow {
  ref: string;
  policy: string;
  destination?: string;
  dates?: string;
  travellers?: string;
  premium?: string;
  status?: string;
  created?: string;
}

interface Props {
  cards: PolicyCardData[];
  onChoose: (prompt: string) => void;
}

export interface BookingCardsProps {
  bookings: BookingCardData[];
  onChoose: (prompt: string) => void;
}

export interface BookingTableProps {
  rows: BookingTableRow[];
}

function PolicyCard({ card, onChoose }: { card: PolicyCardData; onChoose: (p: string) => void }) {
  return (
    <div
      className="rounded-2xl border border-[#e5e7eb] bg-white shadow-2xs overflow-hidden flex flex-col justify-between hover:border-[#ff5722]/40 transition-all"
      style={{ minWidth: 260, maxWidth: 320 }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#fdeee9] border border-[#fbd3c7] flex items-center justify-center shrink-0">
            <Shield size={18} className="text-[#ff5722]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-[#111827] leading-tight truncate">{card.name}</p>
            {card.company && (
              <p className="text-xs text-[#6b7280] truncate font-medium mt-0.5">{card.company}</p>
            )}
          </div>
        </div>

        {/* Premium & Sum Insured */}
        {(card.premium !== undefined || card.sumInsured) && (
          <div className="flex items-center gap-2.5 px-4 pb-3 flex-wrap">
            {card.premium !== undefined && (
              <div className="flex items-center gap-0.5 bg-[#f0fdf4] border border-[#bbf7d0] px-2.5 py-1 rounded-xl">
                <IndianRupee size={13} className="text-[#15803d] shrink-0" />
                <span className="text-sm font-black text-[#15803d]">{card.premium}</span>
              </div>
            )}
            {card.sumInsured && (
              <span className="text-xs font-bold text-[#4b5563] bg-[#f3f4f6] px-2.5 py-1 rounded-xl">
                Cover: {card.sumInsured}
              </span>
            )}
          </div>
        )}

        {/* Highlights */}
        {card.highlights && card.highlights.length > 0 && (
          <div className="flex flex-col gap-1.5 px-4 pb-3.5">
            {card.highlights.map((h, j) => (
              <div key={j} className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#00a86b] mt-0.5 shrink-0" />
                <span className="text-xs text-[#374151] leading-tight font-medium">{h}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action CTA */}
      <div className="p-2.5 border-t border-[#f1f5f9] bg-[#f9fafb]">
        <button
          onClick={() => onChoose(card.prompt || `I'd like to book the ${card.name} plan`)}
          className="w-full text-xs font-bold text-white bg-[#ff5722] hover:bg-[#f4511e] py-2.5 rounded-xl transition-all text-center shadow-2xs cursor-pointer"
        >
          {card.action || "Choose this plan"}
        </button>
      </div>
    </div>
  );
}

function ConfirmCard({ card, onChoose }: { card: PolicyCardData; onChoose: (p: string) => void }) {
  const rows = [
    card.destination   && { icon: <MapPin size={14} className="text-[#6b7280]" />,    label: "Destination",  value: card.destination },
    card.travelDates   && { icon: <Calendar size={14} className="text-[#6b7280]" />,  label: "Dates",        value: card.travelDates },
    card.travellers    && { icon: <Users size={14} className="text-[#6b7280]" />,      label: "Travellers",   value: card.travellers },
    card.sumInsured    && { icon: <Shield size={14} className="text-[#6b7280]" />,     label: "Cover",        value: card.sumInsured },
    card.premium !== undefined && {
      icon: <IndianRupee size={14} className="text-[#15803d]" />,
      label: "Premium",
      value: `₹${card.premium}`,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  return (
    <div
      className="rounded-3xl border-2 border-[#ff5722] bg-white shadow-md overflow-hidden flex flex-col justify-between"
      style={{ minWidth: 280, maxWidth: 360 }}
    >
      <div>
        {/* Header */}
        <div className="bg-[#fdeee9] px-5 pt-4 pb-3 flex items-center gap-3">
          <BadgeCheck size={22} className="text-[#ff5722] shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-black text-[#111827] leading-tight truncate">{card.name}</p>
            {card.company && <p className="text-xs text-[#6b7280] font-semibold mt-0.5">{card.company}</p>}
          </div>
        </div>

        {/* Summary rows */}
        {rows.length > 0 && (
          <div className="px-5 py-3.5 flex flex-col gap-2.5">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs">
                {row.icon}
                <span className="text-xs text-[#6b7280] font-semibold w-20 shrink-0">{row.label}</span>
                <span className="text-xs font-black text-[#111827] truncate">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="p-3 border-t border-[#e5e7eb] bg-[#f9fafb] flex gap-2.5">
        <button
          onClick={() => onChoose(card.cancelPrompt || "Cancel the booking")}
          className="flex-1 text-xs font-bold text-[#4b5563] py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-center cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => onChoose(card.prompt || `Yes, confirm the booking for ${card.name}`)}
          className="flex-1 text-xs font-black text-white bg-black hover:bg-neutral-800 py-2.5 rounded-xl transition-colors shadow-2xs text-center cursor-pointer"
        >
          {card.action || "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}

function AddonCard({ card, onChoose }: { card: PolicyCardData; onChoose: (p: string) => void }) {
  return (
    <div
      className="rounded-2xl border border-[#e5e7eb] bg-white shadow-2xs overflow-hidden flex flex-col justify-between"
      style={{ minWidth: 240, maxWidth: 300 }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2 bg-[#f9fafb]">
          <div className="w-8 h-8 rounded-xl bg-[#fffbeb] border border-[#fde68a] flex items-center justify-center shrink-0">
            <Sparkles size={15} className="text-[#d97706]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#111827] leading-tight truncate">{card.name}</p>
            {card.price && (
              <p className="text-xs text-[#00a86b] font-bold mt-0.5">{card.price}</p>
            )}
          </div>
        </div>

        {/* Description */}
        {card.description && (
          <p className="text-xs text-[#6b7280] px-4 pt-2 pb-1.5 leading-relaxed font-normal">{card.description}</p>
        )}

        {/* Highlights */}
        {card.highlights && card.highlights.length > 0 && (
          <div className="flex flex-col gap-1 px-4 pb-3">
            {card.highlights.map((h, j) => (
              <div key={j} className="flex items-start gap-1.5">
                <CheckCircle2 size={12} className="text-[#d97706] mt-0.5 shrink-0" />
                <span className="text-xs text-[#374151] leading-tight font-medium">{h}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="p-2 border-t border-[#f1f5f9] bg-[#f9fafb]">
        <button
          onClick={() => onChoose(card.prompt || `Add ${card.name} addon`)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#d97706] py-2 rounded-xl hover:bg-[#fffbeb] transition-colors"
        >
          <PlusCircle size={14} />
          {card.action || "Add this addon"}
        </button>
      </div>
    </div>
  );
}

function VasCard({ card, onChoose }: { card: PolicyCardData; onChoose: (p: string) => void }) {
  return (
    <div
      className="rounded-2xl border border-[#e5e7eb] bg-white shadow-2xs overflow-hidden flex flex-col justify-between"
      style={{ minWidth: 240, maxWidth: 300 }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2 bg-[#f0f9ff]">
          <div className="w-8 h-8 rounded-xl bg-[#e0f2fe] border border-[#bae6fd] flex items-center justify-center shrink-0">
            <HeartPulse size={15} className="text-[#0284c7]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#111827] leading-tight truncate">{card.name}</p>
            {card.price && (
              <p className="text-xs text-[#0284c7] font-bold mt-0.5">{card.price}</p>
            )}
          </div>
          <span className="text-[10px] font-bold text-[#0284c7] bg-[#e0f2fe] px-2 py-0.5 rounded-full shrink-0">VAS</span>
        </div>

        {/* Description */}
        {card.description && (
          <p className="text-xs text-[#6b7280] px-4 pt-2 pb-1.5 leading-relaxed font-normal">{card.description}</p>
        )}

        {/* Highlights */}
        {card.highlights && card.highlights.length > 0 && (
          <div className="flex flex-col gap-1 px-4 pb-3">
            {card.highlights.map((h, j) => (
              <div key={j} className="flex items-start gap-1.5">
                <CheckCircle2 size={12} className="text-[#0284c7] mt-0.5 shrink-0" />
                <span className="text-xs text-[#374151] leading-tight font-medium">{h}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="p-2 border-t border-[#f1f5f9] bg-[#f9fafb]">
        <button
          onClick={() => onChoose(card.prompt || `Add ${card.name} VAS`)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#0284c7] py-2 rounded-xl hover:bg-[#f0f9ff] transition-colors"
        >
          <PlusCircle size={14} />
          {card.action || "Add this service"}
        </button>
      </div>
    </div>
  );
}

export default function PolicyCards({ cards, onChoose }: Props) {
  return (
    <>
      {cards.map((card, i) =>
        card.type === "confirm" ? (
          <ConfirmCard key={i} card={card} onChoose={onChoose} />
        ) : card.type === "addon" ? (
          <AddonCard key={i} card={card} onChoose={onChoose} />
        ) : card.type === "vas" ? (
          <VasCard key={i} card={card} onChoose={onChoose} />
        ) : (
          <PolicyCard key={i} card={card} onChoose={onChoose} />
        )
      )}
    </>
  );
}

// ── Booking History Cards ─────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  confirmed:    { bg: "bg-[#f0fdf4]", text: "text-[#16a34a]", dot: "bg-[#16a34a]" },
  pending_docs: { bg: "bg-[#fffbeb]", text: "text-[#d97706]", dot: "bg-[#d97706]" },
  complete:     { bg: "bg-[#eff6ff]", text: "text-[#2563eb]", dot: "bg-[#2563eb]" },
  cancelled:    { bg: "bg-[#fef2f2]", text: "text-[#dc2626]", dot: "bg-[#dc2626]" },
};

function statusStyle(s?: string) {
  return STATUS_STYLES[s ?? "confirmed"] ?? STATUS_STYLES["confirmed"];
}

function BookingCard({ booking, onChoose }: { booking: BookingCardData; onChoose: (p: string) => void }) {
  const st = statusStyle(booking.status);
  return (
    <div
      className="rounded-2xl border border-[#e5e7eb] bg-white shadow-2xs overflow-hidden flex flex-col justify-between hover:border-[#ff5722]/40 transition-all"
      style={{ minWidth: 240, maxWidth: 290 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 pt-3.5 pb-2 bg-[#f9fafb]">
        <div className="w-8 h-8 rounded-xl bg-[#fdeee9] border border-[#fbd3c7] flex items-center justify-center shrink-0">
          <Shield size={14} className="text-[#ff5722]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#111827] leading-tight truncate">{booking.policy}</p>
          <p className="text-[10px] font-mono text-[#ff5722] font-semibold">{booking.ref}</p>
        </div>
        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${st.bg} ${st.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          {(booking.status ?? "confirmed").replace("_", " ")}
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1.5 px-3.5 py-2.5 text-xs">
        {booking.destination && (
          <div className="flex items-center gap-1.5">
            <MapPin size={11} className="text-[#9ca3af] shrink-0" />
            <span className="text-[#4b5563] truncate">{booking.destination}</span>
          </div>
        )}
        {booking.dates && (
          <div className="flex items-center gap-1.5">
            <Calendar size={11} className="text-[#9ca3af] shrink-0" />
            <span className="text-[#4b5563] truncate">{booking.dates}</span>
          </div>
        )}
        {booking.premium && (
          <div className="flex items-center gap-1.5">
            <IndianRupee size={11} className="text-[#00a86b] shrink-0" />
            <span className="font-black text-[#111827]">{booking.premium}</span>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="p-2 border-t border-[#f1f5f9] bg-[#f9fafb]">
        <button
          onClick={() => onChoose(booking.prompt || `Show me full details for booking ${booking.ref}`)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#111827] hover:text-[#ff5722] py-2 rounded-xl border border-[#e5e7eb] hover:bg-white transition-colors"
        >
          <ExternalLink size={12} />
          View Details
        </button>
      </div>
    </div>
  );
}

export function BookingCards({ bookings, onChoose }: BookingCardsProps) {
  return (
    <>
      {bookings.map((b, i) => (
        <BookingCard key={i} booking={b} onChoose={onChoose} />
      ))}
    </>
  );
}

// ── Bookings Table with Excel export ─────────────────────────────────────────

export function BookingsTable({ rows }: BookingTableProps) {
  const handleExcel = async () => {
    const XLSX = await import("xlsx");
    const data = rows.map((r) => ({
      "Reference":   r.ref,
      "Policy":      r.policy,
      "Destination": r.destination ?? "",
      "Travel Dates": r.dates ?? "",
      "Travellers":  r.travellers ?? "",
      "Premium":     r.premium ?? "",
      "Status":      r.status ?? "",
      "Created":     r.created ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    // Column widths
    ws["!cols"] = [14, 26, 20, 22, 14, 12, 14, 14].map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, "bookings.xlsx");
  };

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm overflow-hidden w-full" style={{ minWidth: 520 }}>
      {/* Table header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#f9fafb] border-b border-[#e5e7eb]">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[#6b7280]" />
          <span className="text-xs font-bold text-[#111827]">Booking History</span>
          <span className="text-[10px] font-bold text-[#4b5563] bg-[#e5e7eb] px-2 py-0.5 rounded-full">{rows.length}</span>
        </div>
        <button
          onClick={handleExcel}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-black hover:bg-neutral-800 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
        >
          <FileSpreadsheet size={13} />
          Export Excel
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-white text-[#6b7280]">
              {["Ref", "Policy", "Destination", "Dates", "Premium", "Status"].map((h) => (
                <th key={h} className="text-left px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {rows.map((r, i) => {
              const st = statusStyle(r.status);
              return (
                <tr key={i} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-3.5 py-2.5 font-mono font-bold text-[#ff5722] whitespace-nowrap">{r.ref}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-[#111827] max-w-[160px] truncate">{r.policy}</td>
                  <td className="px-3.5 py-2.5 text-[#4b5563] whitespace-nowrap">{r.destination ?? "—"}</td>
                  <td className="px-3.5 py-2.5 text-[#4b5563] whitespace-nowrap">{r.dates ?? "—"}</td>
                  <td className="px-3.5 py-2.5 font-bold text-[#00a86b] whitespace-nowrap">{r.premium ?? "—"}</td>
                  <td className="px-3.5 py-2.5">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {(r.status ?? "confirmed").replace("_", " ")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
