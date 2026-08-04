"use client";
import { Shield, CheckCircle2, IndianRupee } from "lucide-react";

export interface PolicyCardData {
  name: string;
  company?: string;
  premium?: string | number;
  sumInsured?: string;
  highlights?: string[];
  action?: string; // button label, defaults to "Choose this plan"
  prompt?: string; // message to send when button clicked
}

interface Props {
  cards: PolicyCardData[];
  onChoose: (prompt: string) => void;
}

export default function PolicyCards({ cards, onChoose }: Props) {
  return (
    <>
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-[10px] border border-[#e5e7eb] bg-white shadow-sm overflow-hidden"
          style={{ minWidth: 220, maxWidth: 320 }}
        >
          {/* Card header */}
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

          {/* Premium & Sum Insured row */}
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

          {/* Divider + Action button */}
          <div className="border-t border-[#f1f5f9]">
            <button
              onClick={() => onChoose(card.prompt || `I'd like to book the ${card.name} plan`)}
              className="w-full text-xs font-semibold text-[#00a86b] py-2.5 hover:bg-[#f0fdf4] transition-colors text-center"
            >
              {card.action || "Choose this plan"}
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
