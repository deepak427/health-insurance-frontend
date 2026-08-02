import { ShieldPlus } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 items-start">
      <div
        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-0.5"
        style={{ background: "var(--bg-card2)" }}
      >
        <ShieldPlus size={15} style={{ color: "var(--accent2)" }} />
      </div>
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
        style={{ background: "var(--agent-bubble)", border: "1px solid var(--border)", borderTopLeftRadius: "4px" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ background: "var(--accent2)", animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
