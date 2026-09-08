"use client";

import { ArrowRight, Check } from "@/components/icons";

export interface CorrectionCardData {
  original: string;
  corrected: string;
  /** Present only on tool-provided corrections; the regex fallback has none. */
  rule?: string;
  kind?: "error" | "unnatural";
}

interface CorrectionCardProps {
  correction: CorrectionCardData;
}

export default function CorrectionCard({ correction }: CorrectionCardProps) {
  const label = correction.kind === "unnatural" ? "Suena más natural" : "Corrección rápida";

  return (
    <div className="self-end max-w-[88%] rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[var(--success-soft)] px-3.5 py-2.5 text-body-sm leading-relaxed">
      <p className="mb-1 flex items-center gap-1.5 font-kicker font-semibold text-[var(--success)]">
        <Check size={14} strokeWidth={2.25} aria-hidden />
        {label}
      </p>
      <p className="flex flex-wrap items-center gap-1.5">
        <s className="text-[var(--text-tertiary)]">{correction.original}</s>
        <ArrowRight size={14} strokeWidth={2} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden />
        <b className="font-semibold text-[var(--text-primary)]">{correction.corrected}</b>
      </p>
      {correction.rule && (
        <p className="mt-1.5 text-caption text-[var(--text-tertiary)]">{correction.rule}</p>
      )}
    </div>
  );
}
