"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Mic, PenLine, Headphones, BookOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MODES: { icon: LucideIcon; label: string }[] = [
  { icon: Mic,        label: "Speak" },
  { icon: PenLine,    label: "Write" },
  { icon: Headphones, label: "Listen" },
  { icon: BookOpen,   label: "Vocab" },
];

export default function HomePracticeCard() {
  return (
    <div className="rounded-2xl bg-surface-tooltip p-6 flex items-center justify-between gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-[var(--primary)]" />
          <span className="text-tiny font-bold tracking-widest text-[var(--primary)] uppercase">
            AI Practice
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 uppercase tracking-wide">
            Beta
          </span>
        </div>

        <div>
          <p className="text-lg font-bold text-white leading-snug">Practice with AI feedback</p>
          <p className="text-sm text-white/50 mt-0.5">Improve your speaking and writing skills.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {MODES.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs font-medium"
            >
              <Icon size={12} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <Link
        href="/practice/sounds"
        className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-[var(--primary)] text-on-primary hover:opacity-90 transition-opacity whitespace-nowrap"
      >
        Start Practice
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
