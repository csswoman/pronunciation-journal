"use client";

import { useState } from "react";
import { NavButtons } from "./NavButtons";

export function SpeakingStep({
  data,
  onComplete,
  onPrev,
}: {
  data: { prompt: string; target: string };
  onComplete: () => void;
  onPrev?: () => void;
}) {
  const [done, setDone] = useState(false);

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="w-full max-w-lg px-8 py-8 rounded-2xl border-2 text-center" style={{ borderColor: "var(--text-primary)", backgroundColor: "var(--card-bg)" }}>
        <p className="text-xs mb-3 uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
          {data.prompt}
        </p>
        <p className="text-xl leading-snug" style={{ fontFamily: "var(--font-serif, 'DM Serif Display', serif)", color: "var(--text-primary)" }}>
          &ldquo;{data.target}&rdquo;
        </p>
      </div>

      {!done ? (
        <button
          onClick={() => setDone(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          I said it
        </button>
      ) : (
        <NavButtons onPrev={onPrev} onNext={onComplete} nextLabel="Continue →" />
      )}
    </div>
  );
}
