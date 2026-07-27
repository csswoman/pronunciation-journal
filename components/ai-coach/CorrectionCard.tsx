"use client";

import type { ParsedCorrection } from "@/lib/ai-coach/parse-correction";

interface CorrectionCardProps {
  correction: ParsedCorrection;
}

export default function CorrectionCard({ correction }: CorrectionCardProps) {
  return (
    <div
      className="self-end max-w-[88%] rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[var(--success-soft)] px-3.5 py-2.5 text-body-sm leading-relaxed"
    >
      <p className="mb-1 font-kicker font-semibold text-[var(--success)]">
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
