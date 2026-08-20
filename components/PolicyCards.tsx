"use client";
import { Shield, CheckCircle2, IndianRupee, MapPin, Calendar, Users, BadgeCheck, PlusCircle, Sparkles, HeartPulse } from "lucide-react";

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

interface Props {
  cards: PolicyCardData[];
  onChoose: (prompt: string) => void;
}

function PolicyCard({ card, onChoose }: { card: PolicyCardData; onChoose: (p: string) => void }) {
  return (
    <div
      className="rounded-[10px] border border-[#e5e7eb] bg-white shadow-sm overflow-hidden"
      style={{ minWidth: 220, maxWidth: 300 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center shrink-0">
          <Shield size={15} className="text-[#00a86b]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#1f2937] leading-tight truncate">{card.name}</p>
          {card.company && (
            <p className="text-[10px] text-[#6b7280] truncate">{card.company}</p>
          )}
        </div>
      </div>

      {/* Premium & Sum Insured */}
      {(card.premium !== undefined || card.sumInsured) && (
        <div className="flex items-center gap-3 px-3 pb-2">
          {card.premium !== undefined && (
            <div className="flex items-center gap-0.5">
              <IndianRupee size={11} className="text-[#00a86b] shrink-0" />
              <span className="text-sm font-black text-[#1f2937]">{card.premium}</span>
              <span className="text-[10px] text-[#9ca3af] ml-0.5">/yr</span>
            </div>
          )}
          {card.sumInsured && (
            <span className="text-[10px] font-light text-[#6b7280] bg-[#f8fafc] border border-[#e5e7eb] px-1.5 py-0.5 rounded">
              Cover: {card.sumInsured}
            </span>
          )}
        </div>
      )}

      {/* Highlights */}
      {card.highlights && card.highlights.length > 0 && (
        <div className="flex flex-col gap-0.5 px-3 pb-2">
          {card.highlights.map((h, j) => (
            <div key={j} className="flex items-start gap-1.5">
              <CheckCircle2 size={11} className="text-[#00a86b] mt-0.5 shrink-0" />
              <span className="text-[11px] text-[#374151] leading-tight">{h}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      <div className="border-t border-[#f1f5f9]">
        <button
          onClick={() => onChoose(card.prompt || `I'd like to book the ${card.name} plan`)}
          className="w-full text-xs font-semibold text-[#00a86b] py-2.5 hover:bg-[#f0fdf4] transition-colors text-center"
        >
          {card.action || "Choose this plan"}
        </button>
      </div>
    </div>
  );
}

function ConfirmCard({ card, onChoose }: { card: PolicyCardData; onChoose: (p: string) => void }) {
  const rows = [
    card.destination   && { icon: <MapPin size={11} className="text-[#6b7280]" />,    label: "Destination",  value: card.destination },
    card.travelDates   && { icon: <Calendar size={11} className="text-[#6b7280]" />,  label: "Dates",        value: card.travelDates },
    card.travellers    && { icon: <Users size={11} className="text-[#6b7280]" />,      label: "Travellers",   value: card.travellers },
    card.sumInsured    && { icon: <Shield size={11} className="text-[#6b7280]" />,     label: "Cover",        value: card.sumInsured },
    card.premium !== undefined && {
      icon: <IndianRupee size={11} className="text-[#6b7280]" />,
      label: "Premium",
      value: `₹${card.premium}`,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  return (
    <div
      className="rounded-[10px] border-2 border-[#00a86b] bg-white shadow-sm overflow-hidden"
      style={{ minWidth: 260, maxWidth: 340 }}
    >
      {/* Header */}
      <div className="bg-[#f0fdf4] px-4 pt-3 pb-2 flex items-center gap-2">
        <BadgeCheck size={18} className="text-[#00a86b] shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-black text-[#1f2937] leading-tight truncate">{card.name}</p>
          {card.company && <p className="text-[10px] text-[#6b7280]">{card.company}</p>}
        </div>
      </div>

      {/* Summary rows */}
      {rows.length > 0 && (
        <div className="px-4 py-2 flex flex-col gap-1.5">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              {row.icon}
              <span className="text-[10px] text-[#9ca3af] w-16 shrink-0">{row.label}</span>
              <span className="text-[11px] font-semibold text-[#1f2937] truncate">{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="border-t border-[#e5e7eb] flex">
        <button
          onClick={() => onChoose(card.cancelPrompt || "Cancel the booking")}
          className="flex-1 text-xs font-semibold text-[#9ca3af] py-2.5 hover:bg-[#f8fafc] transition-colors border-r border-[#e5e7eb]"
        >
          Cancel
        </button>
        <button
          onClick={() => onChoose(card.prompt || `Yes, confirm the booking for ${card.name}`)}
          className="flex-1 text-xs font-black text-white bg-[#00a86b] py-2.5 hover:bg-[#008f5a] transition-colors"
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
      className="rounded-[10px] border border-[#e5e7eb] bg-white shadow-sm overflow-hidden"
      style={{ minWidth: 220, maxWidth: 280 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 bg-[#f8fafc]">
        <div className="w-7 h-7 rounded-lg bg-[#fffbeb] border border-[#fde68a] flex items-center justify-center shrink-0">
          <Sparkles size={13} className="text-[#d97706]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#1f2937] leading-tight truncate">{card.name}</p>
          {card.price && (
            <p className="text-[10px] text-[#00a86b] font-semibold">{card.price}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {card.description && (
        <p className="text-[10px] text-[#6b7280] px-3 pt-1.5 pb-1 leading-tight">{card.description}</p>
      )}

      {/* Highlights */}
      {card.highlights && card.highlights.length > 0 && (
        <div className="flex flex-col gap-0.5 px-3 pb-2">
          {card.highlights.map((h, j) => (
            <div key={j} className="flex items-start gap-1.5">
              <CheckCircle2 size={10} className="text-[#d97706] mt-0.5 shrink-0" />
              <span className="text-[10px] text-[#374151] leading-tight">{h}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      <div className="border-t border-[#f1f5f9]">
        <button
          onClick={() => onChoose(card.prompt || `Add ${card.name} addon`)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#d97706] py-2.5 hover:bg-[#fffbeb] transition-colors"
        >
          <PlusCircle size={13} />
          {card.action || "Add this addon"}
        </button>
      </div>
    </div>
  );
}

function VasCard({ card, onChoose }: { card: PolicyCardData; onChoose: (p: string) => void }) {
  return (
    <div
      className="rounded-[10px] border border-[#e5e7eb] bg-white shadow-sm overflow-hidden"
      style={{ minWidth: 220, maxWidth: 280 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 bg-[#f0f9ff]">
        <div className="w-7 h-7 rounded-lg bg-[#e0f2fe] border border-[#bae6fd] flex items-center justify-center shrink-0">
          <HeartPulse size={13} className="text-[#0284c7]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#1f2937] leading-tight truncate">{card.name}</p>
          {card.price && (
            <p className="text-[10px] text-[#0284c7] font-semibold">{card.price}</p>
          )}
        </div>
        <span className="text-[8px] font-bold text-[#0284c7] bg-[#e0f2fe] px-1.5 py-0.5 rounded-full shrink-0">VAS</span>
      </div>

      {/* Description */}
      {card.description && (
        <p className="text-[10px] text-[#6b7280] px-3 pt-1.5 pb-1 leading-tight">{card.description}</p>
      )}

      {/* Highlights */}
      {card.highlights && card.highlights.length > 0 && (
        <div className="flex flex-col gap-0.5 px-3 pb-2">
          {card.highlights.map((h, j) => (
            <div key={j} className="flex items-start gap-1.5">
              <CheckCircle2 size={10} className="text-[#0284c7] mt-0.5 shrink-0" />
              <span className="text-[10px] text-[#374151] leading-tight">{h}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      <div className="border-t border-[#f1f5f9]">
        <button
          onClick={() => onChoose(card.prompt || `Add ${card.name} VAS`)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0284c7] py-2.5 hover:bg-[#f0f9ff] transition-colors"
        >
          <PlusCircle size={13} />
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
