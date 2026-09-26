"use client";

import { Check } from "@/components/icons";
import { type ErrorPatternId, describeErrorPattern } from "@/lib/exercises/error-patterns";

export interface CorrectionCardData {
  original: string;
  corrected: string;
  rule?: string;
  kind?: "error" | "unnatural";
  /** Set only when kind is "error" and the model identified the pattern. */
  errorPattern?: ErrorPatternId;
  /** Client persistence result; omitted for legacy messages and guest turns. */
  recurrenceStatus?: "saved" | "failed";
}

interface CorrectionCardProps {
  correction: CorrectionCardData;
}

export default function CorrectionCard({ correction }: CorrectionCardProps) {
  const isNatural = correction.kind === "unnatural";
  const label = isNatural ? "Suena más natural" : "Corrección rápida";

  return (
    <div className="flex w-full items-center gap-3 rounded-3xl bg-[var(--ej-mint,#a3e635)] p-4 text-ink shadow-xs">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black text-white">
        <Check size={18} strokeWidth={2.5} aria-hidden />
      </span>

      <div className="layout-stack-tight min-w-0 flex-1">
        <p className="m-0 text-sm font-bold text-ink">{label}</p>
        <p className="m-0 text-xs font-medium text-ink-secondary">
          <b className="font-bold text-ink">{correction.corrected}</b>
          {correction.rule ? ` = ${correction.rule}` : correction.original ? ` (${correction.original})` : ""}
        </p>
        {correction.errorPattern && !isNatural && (
          <p className="m-0 text-xs text-ink-secondary">
            {correction.recurrenceStatus === "saved"
              ? "Lo repasarás en tu práctica: " + describeErrorPattern(correction.errorPattern)
              : correction.recurrenceStatus === "failed"
                ? "No se pudo guardar el repaso de " + describeErrorPattern(correction.errorPattern) + "."
                : "Patrón detectado: " + describeErrorPattern(correction.errorPattern)}
          </p>
        )}
      </div>
    </div>
  );
}
