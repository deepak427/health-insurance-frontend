"use client";
import { ShieldPlus, MessageSquarePlus, FileText, CalculatorIcon, HelpCircle, FileSearch } from "lucide-react";

interface Props {
  onNewChat: () => void;
  onQuickPrompt: (text: string) => void;
}

const quickActions = [
  { icon: HelpCircle,      label: "What is a deductible?",              prompt: "What is a deductible?" },
  { icon: CalculatorIcon,  label: "Estimate my premium",                prompt: "Estimate my health insurance premium, I'm 30 years old, looking for individual coverage." },
  { icon: FileText,        label: "Health insurance PDF guide",         prompt: "Give me a PDF guide on health insurance." },
  { icon: FileText,        label: "Life insurance PDF guide",           prompt: "Give me a PDF guide on life insurance." },
  { icon: FileSearch,      label: "How to file an auto claim?",        prompt: "How do I file an auto accident claim?" },
  { icon: FileSearch,      label: "How to file a health claim?",       prompt: "Walk me through filing a health insurance claim." },
];

export default function Sidebar({ onNewChat, onQuickPrompt }: Props) {
  return (
    <aside
      className="hidden md:flex flex-col w-64 shrink-0 h-full border-r"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--accent)" }}
        >
          <ShieldPlus size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight" style={{ color: "var(--text)" }}>HIP Agent</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Insurance Assistant</p>
        </div>
      </div>

      {/* New Chat */}
      <div className="px-3 pt-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <MessageSquarePlus size={16} />
          New Conversation
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-3 mt-5 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: "var(--text-muted)" }}>
          Quick Actions
        </p>
        <div className="flex flex-col gap-1">
          {quickActions.map(({ icon: Icon, label, prompt }) => (
            <button
              key={label}
              onClick={() => onQuickPrompt(prompt)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
            >
              <Icon size={14} className="shrink-0" style={{ color: "var(--accent2)" }} />
              <span className="leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        Powered by Gemini 2.5 Flash
      </div>
    </aside>
  );
}
