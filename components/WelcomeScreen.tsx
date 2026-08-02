"use client";
import { ShieldPlus, FileText, Calculator, FileSearch, HelpCircle } from "lucide-react";

const suggestions = [
  { icon: HelpCircle,    text: "What is a deductible and how does it work?" },
  { icon: Calculator,    text: "Estimate my health insurance premium, I'm 28." },
  { icon: FileText,      text: "Generate a PDF guide for life insurance." },
  { icon: FileSearch,    text: "How do I file a home damage insurance claim?" },
];

interface Props { onPrompt: (text: string) => void; }

export default function WelcomeScreen({ onPrompt }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-8">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--accent)", boxShadow: "0 0 40px var(--accent-glow)" }}
        >
          <ShieldPlus size={32} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            Hi, I&apos;m your Insurance Assistant
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Ask me anything about health, life, auto, home, or travel insurance.
            <br />
            I can explain terms, guide claims, estimate premiums, and generate PDF guides.
          </p>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {suggestions.map(({ icon: Icon, text }) => (
          <button
            key={text}
            onClick={() => onPrompt(text)}
            className="flex items-start gap-3 px-4 py-3 rounded-xl text-left text-sm transition-all hover:opacity-80"
            style={{
              background: "var(--bg-card2)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
          >
            <Icon size={15} className="shrink-0 mt-0.5" style={{ color: "var(--accent2)" }} />
            <span>{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
