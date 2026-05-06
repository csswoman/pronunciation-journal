"use client";

import Link from "next/link";
import { MessageCircle, PenLine, Headphones, BookOpen, Sparkles } from "lucide-react";

const MODES = [
  { icon: MessageCircle, label: "Speak", sub: "Practice conversations", href: "/ai-practice" },
  { icon: PenLine, label: "Write", sub: "Get feedback on writing", href: "/ai-practice" },
  { icon: Headphones, label: "Listen", sub: "Improve listening skills", href: "/practice" },
  { icon: BookOpen, label: "Vocabulary", sub: "Expand your words", href: "/decks" },
];

export default function HomePracticeCard() {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={17} className="text-[var(--primary)]" />
            <span className="text-base font-semibold text-[var(--deep-text)]">Practice with AI</span>
            <span className="text-tiny font-semibold px-2 py-0.5 rounded-full bg-[var(--primary)] text-on-primary">Beta</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Improve your speaking and writing with AI feedback.</p>
        </div>
        <Link
          href="/ai-practice"
          className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          Start Practice
        </Link>
      </div>

      {/* Mode grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MODES.map(({ icon: Icon, label, sub, href }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col gap-2 p-4 rounded-xl bg-[var(--btn-regular-bg)] hover:bg-[var(--line-divider)] transition-colors"
          >
            <Icon size={18} className="text-[var(--primary)]" />
            <span className="text-sm font-semibold text-[var(--deep-text)]">{label}</span>
            <span className="text-xs text-[var(--text-tertiary)] leading-snug">{sub}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
