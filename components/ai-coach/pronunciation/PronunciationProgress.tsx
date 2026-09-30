"use client";

import { Check } from "@/components/icons";

// Planned structure:
// <PronunciationProgress>
//   <PhraseCounter />
//   <SegmentedProgressBar />
//   <MasteredBadge />
// </PronunciationProgress>

interface Props {
  current: number;
  total: number;
  mastered: number;
  pct: number;
}

export default function PronunciationProgress({ current, total, mastered }: Props) {
  const displayCurrent = Math.max(1, Math.min(current, total));
  const safeTotal = Math.max(1, total);

  return (
    <div className="shrink-0 px-4 pt-3 pb-2.5">
      <div className="flex items-center justify-between gap-3">
        {/* Izquierda: Indicador de frase */}
        <span className="text-xs font-bold tracking-tight text-fg shrink-0">
          Frase {displayCurrent} de {safeTotal}
        </span>

        {/* Centro: Barra de progreso segmentada */}
        <div
          className="flex items-center gap-1.5 flex-1 max-w-[200px]"
          aria-label={`Progreso: ${displayCurrent} de ${safeTotal} frases`}
        >
          {Array.from({ length: safeTotal }).map((_, index) => {
            const isCompletedOrCurrent = index < displayCurrent;
            return (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  isCompletedOrCurrent
                    ? "bg-primary/80 dark:bg-primary"
                    : "bg-surface-sunken dark:bg-surface-raised border border-border-subtle/50"
                }`}
              />
            );
          })}
        </div>

        {/* Derecha: Badge de dominadas */}
        <div className="shrink-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-2xs">
            <Check size={13} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400" aria-hidden />
            <span>{mastered} dominadas</span>
          </span>
        </div>
      </div>
    </div>
  );
}
