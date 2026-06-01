import Link from "next/link";
import { Bot, ArrowRight, BookOpen } from "lucide-react";
import Button from "@/components/ui/Button";

const CHIPS = ["Conversation", "Pronunciation feedback", "Adaptive"];

export default function HomeAiPracticeCard() {
  return (
    <div className="relative flex flex-col gap-3 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--cta-outline-border)] bg-surface-raised p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-70"
        style={{ background: "radial-gradient(circle, var(--hue-blob) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 flex items-center gap-2">
        <span className="icon-wrap-hue flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <Bot size={18} />
        </span>
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">Practice with AI</span>
        <span className="ml-auto rounded-full bg-[var(--hue-icon-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">
          Beta
        </span>
      </div>

      <p className="relative z-10 text-[12px] leading-relaxed text-[var(--text-secondary)]">
        Improve speaking and writing with real-time AI feedback.
      </p>

      <div className="relative z-10 flex flex-wrap gap-1.5">
        {CHIPS.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center rounded-md bg-[var(--hue-icon-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--primary)]"
          >
            {chip}
          </span>
        ))}
      </div>

      <div className="relative z-10 mt-auto flex flex-wrap gap-2">
        <Link href="/practice/sounds">
          <Button variant="primary" size="sm" icon={<ArrowRight size={13} />} iconPosition="right">
            Start session
          </Button>
        </Link>
        <Link href="/practice">
          <Button variant="secondary" size="sm" icon={<BookOpen size={13} />}>
            Topics
          </Button>
        </Link>
      </div>
    </div>
  );
}
