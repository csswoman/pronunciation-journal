"use client";

import type { ParsedCorrection } from "@/lib/ai-coach/parse-correction";

interface CorrectionCardProps {
  correction: ParsedCorrection;
}

export default function CorrectionCard({ correction }: CorrectionCardProps) {
  return (
    <div
      className="self-end max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed"
      style={{
        backgroundColor: "var(--success-soft)",
        border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
      }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-wide mb-1"
        style={{ color: "var(--success)" }}
      >
        ✓ Small correction
      </p>
      <p>
        <s className="text-[var(--text-tertiary)]">{correction.original}</s>
        <br />
        <span className="text-[var(--text-tertiary)]">→ </span>
        <b className="font-semibold text-[var(--text-primary)]">{correction.corrected}</b>
      </p>
    </div>
  );
}
