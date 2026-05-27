"use client";

// Planned structure:
// <HomePracticeCard>
//   <blob div /> (decorative)
//   <header row: icon-wrap + title + beta badge />
//   <subtitle />
//   <chips: Conversation · Pronunciation · Adaptive />
//   <CTA row: "Start session" (dark) + "Browse topics" (ghost) />
// </HomePracticeCard>

import Link from "next/link";
import { Bot, ArrowRight, BookOpen } from "lucide-react";

const CHIPS = ["Conversation", "Pronunciation feedback", "Adaptive"];

export default function HomePracticeCard() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-4 bg-surface-raised"
      style={{ border: "1px solid var(--cta-outline-border)" }}
    >
      {/* Decorative hue blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-70"
        style={{ background: "radial-gradient(circle, var(--hue-blob) 0%, transparent 70%)" }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2">
        <span className="icon-wrap-hue flex items-center justify-center w-9 h-9 rounded-lg shrink-0">
          <Bot size={18} />
        </span>
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">Practice with AI</span>
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--hue-icon-bg)] text-[var(--primary)] uppercase tracking-wide">
          Beta
        </span>
      </div>

      {/* Subtitle */}
      <p className="relative z-10 text-[11px] text-[var(--text-secondary)] leading-relaxed -mt-1">
        Improve speaking and writing with real-time AI feedback.
      </p>

      {/* Chips */}
      <div className="relative z-10 flex flex-wrap gap-1.5">
        {CHIPS.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium"
            style={{ background: "var(--hue-icon-bg)", color: "var(--primary)" }}
          >
            {chip}
          </span>
        ))}
      </div>

      {/* CTA row */}
      <div className="relative z-10 flex gap-2 flex-wrap mt-auto">
        <Link
          href="/practice/sounds"
          className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold"
        >
          Start session
          <ArrowRight size={13} />
        </Link>
        <Link
          href="/practice/topics"
          className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium"
        >
          <BookOpen size={13} />
          Topics
        </Link>
      </div>
    </div>
  );
}
