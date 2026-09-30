// Sub-components:
// <HomeEssentialWordsBody>
//   <EssentialWordsHeader /> (Kicker "TU MAZO" + level badge "A1")
//   <EssentialWordsStatAndCTA /> ("0/740 palabras" + CTA "Empezar · 4 min →")
//   <EssentialWordsSegmentedProgress /> (14-segment progress bar)
//   <EssentialWordsFlashcardsPreview /> (3 tilted micro cards + remaining counter)
// </HomeEssentialWordsBody>

import { ArrowRight } from "@/components/icons";
import { cn } from "@/lib/cn";

interface HomeEssentialWordsBodyProps {
  learnedCount: number | null;
  totalLevelWords: number | null;
  levelKey: string;
}

const SAMPLE_FLASHCARDS = [
  { word: "hello", ipa: "/həˈloʊ/", rotate: "-rotate-2" },
  { word: "thanks", ipa: "/θæŋks/", rotate: "rotate-1" },
  { word: "please", ipa: "/pliːz/", rotate: "-rotate-1" },
];

const TOTAL_SEGMENTS = 14;

/**
 * Pure markup for the "TU MAZO" (Palabras esenciales) card.
 * Shared by Dexie-backed count & SSR placeholder to ensure identical geometry.
 */
export default function HomeEssentialWordsBody({
  learnedCount,
  totalLevelWords,
  levelKey,
}: HomeEssentialWordsBodyProps) {
  const hasCount = learnedCount !== null && totalLevelWords !== null;
  const remainingCount = hasCount ? Math.max(0, totalLevelWords - learnedCount) : 0;
  const progressRatio = hasCount && totalLevelWords > 0 ? learnedCount / totalLevelWords : 0;
  const progressPct = Math.min(100, Math.round(progressRatio * 100));
  const activeSegments =
    hasCount && learnedCount > 0 ? Math.max(1, Math.round(progressRatio * TOTAL_SEGMENTS)) : 0;

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      {/* Encabezado: Kicker "TU MAZO" + Badge de nivel */}
      <div className="flex items-center justify-between gap-2">
        <span className="ts-kicker text-ink select-none">
          TU MAZO
        </span>
        <span className="inline-flex items-center rounded-full bg-ink px-2.5 py-0.5 ts-badge text-paper">
          {levelKey}
        </span>
      </div>

      {/* Métrica principal y CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          {hasCount ? (
            <>
              <span className="ts-display-numeral text-ink tabular-nums leading-none">
                {learnedCount}
              </span>
              <span className="ts-numeral-unit text-ink-secondary tabular-nums">
                / {totalLevelWords}
              </span>
              <span className="ts-body text-ink-secondary">
                palabras
              </span>
            </>
          ) : (
            <span className="ts-body text-ink-secondary">Calculando progreso…</span>
          )}
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 ts-pill text-paper transition-all group-hover:bg-ink-secondary shrink-0">
          <span>Empezar · 4 min</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>

      {/* Barra de progreso segmentada */}
      <div
        role="progressbar"
        aria-valuenow={hasCount ? progressPct : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={hasCount
          ? `Progreso de mazo nivel ${levelKey}: ${progressPct}%`
          : `Calculando progreso de mazo nivel ${levelKey}`}
        className="flex w-full items-center gap-1.5 py-1"
      >
        {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors duration-300",
              i < activeSegments ? "bg-ink" : "bg-ink/15",
            )}
          />
        ))}
      </div>

      {/* Vista previa de flashcards e indicador restante */}
      <div className="flex items-end justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {SAMPLE_FLASHCARDS.map((card) => (
            <div
              key={card.word}
              className={cn(
                "flex flex-col justify-center rounded-md border-2 border-ink bg-paper px-3 py-1.5 shadow-xs transition-transform duration-200 group-hover:rotate-0 select-none",
                card.rotate,
              )}
            >
              <span className="ts-flashcard-word leading-tight text-ink">
                {card.word}
              </span>
              <span className="ts-ipa-xs text-ink-secondary leading-tight">
                {card.ipa}
              </span>
            </div>
          ))}
        </div>

        {remainingCount > 0 && (
          <span className="ts-stat text-ink-secondary select-none shrink-0 self-end">
            +{remainingCount}
          </span>
        )}
      </div>
    </div>
  );
}
