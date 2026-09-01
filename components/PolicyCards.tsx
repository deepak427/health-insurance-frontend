"use client";
import { useState } from "react";
import {
  Shield,
  CheckCircle2,
  IndianRupee,
  MapPin,
  Calendar,
  Users,
  BadgeCheck,
  PlusCircle,
  Sparkles,
  HeartPulse,
  FileSpreadsheet,
  ExternalLink,
  Clock,
  Check,
} from "lucide-react";

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
  const anyCard = card as any;
  const name = card.name || anyCard.title || "Custom Structured Plan";
  const company = card.company || anyCard.insurer;
  const rawPremium = card.premium !== undefined ? card.premium : anyCard.price;
  const premium = rawPremium ? String(rawPremium).replace("₹", "").trim() : undefined;
  const sumInsured = card.sumInsured || anyCard.sum_insured;
  const highlights = (card.highlights && card.highlights.length > 0) ? card.highlights : (anyCard.features || []);
  const actionText = card.action || "Choose this plan";
  const promptText = card.prompt || `I'd like to book the ${name} plan`;

  return (
    <div
      className="rounded-2xl border border-[#e5e7eb] bg-white shadow-2xs overflow-hidden flex flex-col justify-between hover:border-[#ff5722]/40 transition-all w-full sm:w-[280px] max-w-[340px]"
    >
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#fdeee9] border border-[#fbd3c7] flex items-center justify-center shrink-0">
            <Shield size={18} className="text-[#ff5722]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-[#111827] leading-tight truncate">{name}</p>
            {company && (
              <p className="text-xs text-[#6b7280] truncate font-medium mt-0.5">{company}</p>
            )}
          </div>
        </div>

        {/* Premium & Sum Insured */}
        {(premium !== undefined || sumInsured) && (
          <div className="flex items-center gap-2.5 px-4 pb-3 flex-wrap">
            {premium !== undefined && (
              <div className="flex items-center gap-0.5 bg-[#f0fdf4] border border-[#bbf7d0] px-2.5 py-1 rounded-xl">
                <IndianRupee size={13} className="text-[#15803d] shrink-0" />
                <span className="text-sm font-black text-[#15803d]">{premium}</span>
              </div>
            )}
            {sumInsured && (
              <span className="text-xs font-bold text-[#4b5563] bg-[#f3f4f6] px-2.5 py-1 rounded-xl">
                Cover: {sumInsured}
              </span>
            )}
          </div>
        )}

        {/* Highlights */}
        {highlights && highlights.length > 0 && (
          <div className="flex flex-col gap-1.5 px-4 pb-3.5">
            {highlights.map((h: string, j: number) => (
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
          onClick={() => onChoose(promptText)}
          className="w-full text-xs font-bold text-white bg-[#ff5722] hover:bg-[#f4511e] py-2.5 rounded-xl transition-all text-center shadow-2xs cursor-pointer"
        >
          {actionText}
        </button>
      </div>
    </div>
  );
}

function ConfirmCard({ card, onChoose }: { card: PolicyCardData; onChoose: (p: string) => void }) {
  const rows = [
    card.destination && { icon: <MapPin size={14} className="text-[#6b7280]" />, label: "Destination", value: card.destination },
    card.travelDates && { icon: <Calendar size={14} className="text-[#6b7280]" />, label: "Dates", value: card.travelDates },
    card.travellers && { icon: <Users size={14} className="text-[#6b7280]" />, label: "Travellers", value: card.travellers },
    card.sumInsured && { icon: <Shield size={14} className="text-[#6b7280]" />, label: "Cover", value: card.sumInsured },
    card.premium !== undefined && {
      icon: <IndianRupee size={14} className="text-[#15803d]" />,
      label: "Premium",
      value: `₹${card.premium}`,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  return (
    <div
      className="rounded-3xl border-2 border-[#ff5722] bg-white shadow-md overflow-hidden flex flex-col justify-between w-full sm:w-[320px] max-w-[360px]"
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

// ── Multi-Select Add-ons Component (Compact List Cards) ────────────────────────

export function MultiSelectAddons({ cards, onChoose }: Props) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleAddSelected = () => {
    if (selectedKeys.size === 0) return;
    const selectedList = cards.filter((c) => selectedKeys.has(c.key || c.name));
    const keysToSend = selectedList.map((c) => c.key || c.name).join(", ");
    onChoose(`Add ${keysToSend} addons`);
  };

  return (
    <div className="w-full max-w-lg rounded-2xl border border-[#e5e7eb] bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#f9fafb] border-b border-[#f1f5f9]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#fffbeb] border border-[#fde68a] flex items-center justify-center shrink-0">
            <Sparkles size={13} className="text-[#d97706]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#111827]">Available Add-ons</p>
            <p className="text-[10px] text-[#6b7280]">Select one or multiple add-ons</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#d97706] bg-[#fffbeb] px-2 py-0.5 rounded-full border border-[#fde68a]">
          {selectedKeys.size} selected
        </span>
      </div>

      {/* Compact List */}
      <div className="divide-y divide-[#f1f5f9] max-h-72 overflow-y-auto">
        {cards.map((card, i) => {
          const itemKey = card.key || card.name;
          const isSelected = selectedKeys.has(itemKey);

          return (
            <div
              key={i}
              onClick={() => toggleKey(itemKey)}
              className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                isSelected ? "bg-[#fff8f5] hover:bg-[#ffede6]" : "hover:bg-[#f9fafb]"
              }`}
            >
              {/* Checkbox */}
              <div
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${
                  isSelected
                    ? "bg-[#ff5722] text-white"
                    : "border border-[#d1d5db] bg-white"
                }`}
              >
                {isSelected && <Check size={11} strokeWidth={3} />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[#111827] truncate leading-tight">{card.name}</p>
                  {card.price && (
                    <span className="text-xs font-bold text-[#00a86b] shrink-0">{card.price}</span>
                  )}
                </div>
                {card.description && (
                  <p className="text-[11px] text-[#6b7280] truncate leading-tight mt-0.5">
                    {card.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="p-2.5 bg-[#f9fafb] border-t border-[#f1f5f9] flex items-center justify-between gap-3">
        <span className="text-[11px] text-[#6b7280]">
          {selectedKeys.size > 0 ? `${selectedKeys.size} item(s) selected` : "Select add-on(s) above"}
        </span>
        <button
          onClick={handleAddSelected}
          disabled={selectedKeys.size === 0}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-2xs ${
            selectedKeys.size > 0
              ? "bg-[#ff5722] hover:bg-[#f4511e] text-white cursor-pointer"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <PlusCircle size={13} />
          {selectedKeys.size > 0 ? `Add Selected (${selectedKeys.size})` : "Add Add-ons"}
        </button>
      </div>
    </div>
  );
}

// ── Multi-Select VAS Component (Compact List Cards) ───────────────────────────

export function MultiSelectVas({ cards, onChoose }: Props) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleAddSelected = () => {
    if (selectedKeys.size === 0) return;
    const selectedList = cards.filter((c) => selectedKeys.has(c.key || c.name));
    const keysToSend = selectedList.map((c) => c.key || c.name).join(", ");
    onChoose(`Add ${keysToSend} VAS`);
  };

  return (
    <div className="w-full max-w-lg rounded-2xl border border-[#e5e7eb] bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#f0f9ff] border-b border-[#e0f2fe]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#e0f2fe] border border-[#bae6fd] flex items-center justify-center shrink-0">
            <HeartPulse size={13} className="text-[#0284c7]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#111827]">Agency Value-Added Services (VAS)</p>
            <p className="text-[10px] text-[#6b7280]">Select one or multiple agency services</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#0284c7] bg-[#e0f2fe] px-2 py-0.5 rounded-full border border-[#bae6fd]">
          {selectedKeys.size} selected
        </span>
      </div>

      {/* Compact List */}
      <div className="divide-y divide-[#f1f5f9] max-h-72 overflow-y-auto">
        {cards.map((card, i) => {
          const itemKey = card.key || card.name;
          const isSelected = selectedKeys.has(itemKey);

          return (
            <div
              key={i}
              onClick={() => toggleKey(itemKey)}
              className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                isSelected ? "bg-[#f0f9ff] hover:bg-[#e0f2fe]" : "hover:bg-[#f9fafb]"
              }`}
            >
              {/* Checkbox */}
              <div
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${
                  isSelected
                    ? "bg-[#0284c7] text-white"
                    : "border border-[#d1d5db] bg-white"
                }`}
              >
                {isSelected && <Check size={11} strokeWidth={3} />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[#111827] truncate leading-tight">{card.name}</p>
                  {card.price && (
                    <span className="text-xs font-bold text-[#0284c7] shrink-0">{card.price}</span>
                  )}
                </div>
                {card.description && (
                  <p className="text-[11px] text-[#6b7280] truncate leading-tight mt-0.5">
                    {card.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="p-2.5 bg-[#f9fafb] border-t border-[#f1f5f9] flex items-center justify-between gap-3">
        <span className="text-[11px] text-[#6b7280]">
          {selectedKeys.size > 0 ? `${selectedKeys.size} service(s) selected` : "Select service(s) above"}
        </span>
        <button
          onClick={handleAddSelected}
          disabled={selectedKeys.size === 0}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-2xs ${
            selectedKeys.size > 0
              ? "bg-[#0284c7] hover:bg-[#0369a1] text-white cursor-pointer"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <PlusCircle size={13} />
          {selectedKeys.size > 0 ? `Add Selected (${selectedKeys.size})` : "Add Services"}
        </button>
      </div>
    </div>
  );
}

export default function PolicyCards({ cards, onChoose }: Props) {
  const policyOrConfirmCards = cards.filter((c) => c.type !== "addon" && c.type !== "vas");
  const addonCards = cards.filter((c) => c.type === "addon");
  const vasCards = cards.filter((c) => c.type === "vas");

  return (
    <div className="flex flex-col gap-3 w-full">
      {policyOrConfirmCards.length > 0 && (
        <div className="flex flex-row gap-3 flex-wrap">
          {policyOrConfirmCards.map((card, i) =>
            card.type === "confirm" ? (
              <ConfirmCard key={i} card={card} onChoose={onChoose} />
            ) : (
              <PolicyCard key={i} card={card} onChoose={onChoose} />
            )
          )}
        </div>
      )}

      {addonCards.length > 0 && (
        <MultiSelectAddons cards={addonCards} onChoose={onChoose} />
      )}

      {vasCards.length > 0 && (
        <MultiSelectVas cards={vasCards} onChoose={onChoose} />
      )}
    </div>
  );
}

// ── Compact Booking History Cards (Max 4, Small Height) ─────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  confirmed:    { bg: "bg-[#f0fdf4]", text: "text-[#16a34a]", dot: "bg-[#16a34a]" },
  pending_docs: { bg: "bg-[#fffbeb]", text: "text-[#d97706]", dot: "bg-[#d97706]" },
  complete:     { bg: "bg-[#eff6ff]", text: "text-[#2563eb]", dot: "bg-[#2563eb]" },
  cancelled:    { bg: "bg-[#fef2f2]", text: "text-[#dc2626]", dot: "bg-[#dc2626]" },
};

function statusStyle(s?: string) {
  return STATUS_STYLES[s ?? "confirmed"] ?? STATUS_STYLES["confirmed"];
}

function CompactBookingCard({ booking, onChoose }: { booking: BookingCardData; onChoose: (p: string) => void }) {
  const st = statusStyle(booking.status);
  return (
    <div
      className="rounded-xl border border-[#e5e7eb] bg-white shadow-2xs hover:border-[#ff5722]/50 transition-all p-3 flex flex-col justify-between gap-2 w-full sm:w-[240px] max-w-[280px]"
    >
      {/* Top row: Title, ref, status */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[#111827] truncate leading-tight">{booking.policy}</p>
          <span className="text-[10px] font-mono text-[#ff5722] font-semibold">{booking.ref}</span>
        </div>
        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${st.bg} ${st.text}`}>
          <span className={`w-1 h-1 rounded-full ${st.dot}`} />
          {(booking.status ?? "confirmed").replace("_", " ")}
        </span>
      </div>

      {/* Middle row: Destination & Dates in single compact line */}
      <div className="flex items-center gap-2 text-[11px] text-[#6b7280] truncate">
        {booking.destination && (
          <span className="flex items-center gap-1 truncate">
            <MapPin size={10} className="text-[#9ca3af] shrink-0" />
            <span className="truncate">{booking.destination}</span>
          </span>
        )}
        {booking.dates && (
          <span className="flex items-center gap-1 shrink-0">
            <Calendar size={10} className="text-[#9ca3af] shrink-0" />
            <span>{booking.dates}</span>
          </span>
        )}
      </div>

      {/* Bottom row: Premium & Action Button */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#f1f5f9]">
        <div className="flex items-center text-xs font-black text-[#111827]">
          {booking.premium ? (
            <span className="text-[#00a86b]">{booking.premium}</span>
          ) : (
            <span className="text-[#9ca3af] text-[10px]">--</span>
          )}
        </div>
        <button
          onClick={() => onChoose(booking.prompt || `Show me full details for booking ${booking.ref}`)}
          className="flex items-center gap-1 text-[10px] font-bold text-[#111827] hover:text-[#ff5722] px-2 py-1 rounded-lg border border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors cursor-pointer"
        >
          <ExternalLink size={10} />
          Details
        </button>
      </div>
    </div>
  );
}

export function BookingCards({ bookings, onChoose }: BookingCardsProps) {
  // Show at most 4 small cards
  const displayBookings = bookings.slice(0, 4);

  return (
    <div className="flex flex-row gap-2.5 flex-wrap">
      {displayBookings.map((b, i) => (
        <CompactBookingCard key={i} booking={b} onChoose={onChoose} />
      ))}
    </div>
  );
}

// ── Bookings Table with Excel export ─────────────────────────────────────────

export function BookingsTable({ rows }: BookingTableProps) {
  const handleExcel = async () => {
    const XLSX = await import("xlsx");
    const data = rows.map((r) => ({
      "Reference":    r.ref,
      "Policy":       r.policy,
      "Destination":  r.destination ?? "",
      "Travel Dates": r.dates ?? "",
      "Travellers":   r.travellers ?? "",
      "Premium":      r.premium ?? "",
      "Status":       r.status ?? "",
      "Created":      r.created ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    // Column widths
    ws["!cols"] = [14, 26, 20, 22, 14, 12, 14, 14].map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, "bookings.xlsx");
  };

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm overflow-hidden w-full max-w-full">
      {/* Table header bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-[#f9fafb] border-b border-[#e5e7eb]">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[#6b7280]" />
          <span className="text-xs font-bold text-[#111827]">Booking History</span>
          <span className="text-[10px] font-bold text-[#4b5563] bg-[#e5e7eb] px-2 py-0.5 rounded-full">{rows.length}</span>
        </div>
        <button
          onClick={handleExcel}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-black hover:bg-neutral-800 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
        >
          <FileSpreadsheet size={13} />
          <span className="hidden sm:inline">Export Excel</span>
          <span className="sm:hidden">Excel</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[500px] text-xs">
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
