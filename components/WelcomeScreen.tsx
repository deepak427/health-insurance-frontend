"use client";
import Image from "next/image";
import { CheckCircle2, MessageCircle, Sparkles, ArrowRight } from "lucide-react";

const quickPrompts = [
  { label: "Deductible & Co-pay", prompt: "What is a deductible and how does it work?" },
  { label: "Estimate Premium", prompt: "Estimate my health insurance premium, I'm 28." },
  { label: "Generate Life PDF", prompt: "Generate a PDF guide for life insurance." },
  { label: "Filing Claims Guide", prompt: "How do I file a home damage insurance claim?" },
];

interface Props { onPrompt: (text: string) => void; }

export default function WelcomeScreen({ onPrompt }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 text-center py-10 my-auto">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 max-w-sm">
        <div className="relative">
          <div className="w-[100px] h-[100px] rounded-full bg-[#e2ded7] p-1.5 shadow-sm flex items-center justify-center">
            <Image src="/aesgo_logo.png" alt="Aesgo Logo" width={80} height={80} className="object-contain rounded-full" priority />
          </div>
          <span className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#e8a598] border-[3px] border-[#f9f8f6] flex items-center justify-center shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-soft-pulse"></span>
          </span>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-black text-[#2c2a29] tracking-[-0.03em] leading-none">Dolphin Buddy</h1>
            <CheckCircle2 size={18} className="text-[#5b7c72]" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#797571] mt-2">Insurance AI Specialist</p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full bg-[#ffffff] text-[11px] font-bold text-[#e8a598] border border-[#e2ded7] shadow-sm uppercase tracking-wider">
            <Sparkles size={12} /> Active Now
          </div>
        </div>
      </div>

      <p className="text-[15px] text-[#797571] max-w-md mt-6 leading-relaxed font-[450]">
        Start messaging Dolphin Buddy to safely analyze your policy documents, get instant answers to insurance questions, or generate PDF guides.
      </p>

      {/* Suggested Topics */}
      <div className="w-full max-w-lg mt-10">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9e9a95] block mb-4">
          Suggested Topics
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {quickPrompts.map(({ label, prompt }) => (
            <button
              key={label}
              onClick={() => onPrompt(prompt)}
              className="flex flex-col justify-between p-4 min-h-[96px] rounded-[24px] bg-[#ffffff] hover:bg-[#f1efe9] text-[#2c2a29] border border-[#e2ded7] transition-all group shadow-[0_4px_20px_rgba(44,42,41,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-[#d1ccc4]"
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="w-8 h-8 rounded-full bg-[#f9f8f6] flex items-center justify-center text-[#5b7c72] group-hover:bg-[#ffffff]">
                  <MessageCircle size={15} />
                </div>
                <ArrowRight size={16} className="text-[#d1ccc4] group-hover:text-[#5b7c72] group-hover:translate-x-1 transition-transform" />
              </div>
              <span className="text-sm font-bold text-[#2c2a29] mt-2 tracking-[-0.01em]">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
