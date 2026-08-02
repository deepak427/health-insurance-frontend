"use client";
import { Shield, CheckCircle2, MessageCircle, Sparkles, ArrowUpRight } from "lucide-react";

const quickPrompts = [
  { label: "Deductible & Co-pay", prompt: "What is a deductible and how does it work?" },
  { label: "Estimate Premium", prompt: "Estimate my health insurance premium, I'm 28." },
  { label: "Generate Life PDF", prompt: "Generate a PDF guide for life insurance." },
  { label: "Filing Claims Guide", prompt: "How do I file a home damage insurance claim?" },
];

interface Props { onPrompt: (text: string) => void; }

export default function WelcomeScreen({ onPrompt }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 text-center py-8 my-auto">
      {/* Instagram Profile DM Header */}
      <div className="flex flex-col items-center gap-3 max-w-sm">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-1 shadow-lg">
            <div className="w-full h-full rounded-full bg-stone-900 flex items-center justify-center text-white border-2 border-stone-900">
              <Shield size={42} className="text-emerald-400" />
            </div>
          </div>
          <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-stone-900 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white"></span>
          </span>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-xl font-extrabold text-white font-heading">Dolphin Buddy</h1>
            <CheckCircle2 size={16} className="text-emerald-400 fill-emerald-400/20" />
          </div>
          <p className="text-xs text-stone-400 mt-0.5">Insurance Agent • AI Support Specialist</p>
          <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-stone-800 text-[11px] font-semibold text-emerald-400 border border-stone-700">
            <Sparkles size={11} /> Active Now
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-stone-300 max-w-md mt-4 leading-relaxed">
        Start messaging Dolphin Buddy to analyze policy documents, get instant answers to insurance questions, or generate PDF guides.
      </p>

      {/* Instagram DM Quick Reply Options */}
      <div className="w-full max-w-md mt-6">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-3">
          Suggested Quick Messages
        </span>
        <div className="flex flex-col gap-2 text-left">
          {quickPrompts.map(({ label, prompt }) => (
            <button
              key={label}
              onClick={() => onPrompt(prompt)}
              className="flex items-center justify-between px-4 py-3 rounded-2xl bg-stone-800/90 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-700/80 transition-all text-xs font-semibold group"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle size={15} className="text-emerald-400 shrink-0" />
                <span>{label}</span>
              </div>
              <ArrowUpRight size={14} className="text-stone-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
