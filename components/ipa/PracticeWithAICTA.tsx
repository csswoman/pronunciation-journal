"use client";

import Link from "next/link";
import { Sparkles, MessageCircle } from "lucide-react";

export default function PracticeWithAICTA({
  focusedSymbol,
}: {
  focusedSymbol: string;
}) {
  return (
    <section
      className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
      style={{ backgroundColor: "var(--primary)" }}
    >
      <div
        className="w-11 h-11 shrink-0 rounded-xl inline-flex items-center justify-center"
        style={{ backgroundColor: "var(--overlay-light)" }}
      >
        <Sparkles size={18} className="text-on-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-on-primary mb-0.5">
          Practice with AI
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "rgba(var(--on-primary), 0.8)" }}
        >
          Have a quick conversation focused on{" "}
          <span className="font-serif font-semibold">{focusedSymbol}</span> — get
          pronunciation feedback in real time.
        </p>
      </div>

      <Link
        href="/daily"
        className="shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-transform hover:scale-[1.02]"
        style={{
          backgroundColor: "var(--card-bg)",
          color: "var(--primary)",
        }}
      >
        <MessageCircle size={14} />
        Start session
      </Link>
    </section>
  );
}
