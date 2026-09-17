// Planned structure:
// <HomeEssentialWordsBody>  (leaf — pure presentation, no data access)

import { BookOpen } from "@/components/icons";

interface HomeEssentialWordsBodyProps {
  learnedCount: number;
  totalLevelWords: number;
  levelKey: string;
}

/**
 * Pure markup for the "Palabras esenciales" card. Shared by the Dexie-backed
 * HomeEssentialWordsCount and by its dynamic-import fallback, so both render
 * identical geometry and the deferred load costs no layout shift.
 */
export default function HomeEssentialWordsBody({
  learnedCount,
  totalLevelWords,
  levelKey,
}: HomeEssentialWordsBodyProps) {
  const progressPct =
    totalLevelWords > 0
      ? Math.min(100, Math.round((learnedCount / totalLevelWords) * 100))
      : 0;

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4.5 text-ink shrink-0" aria-hidden />
          <span className="font-label text-body-xs font-medium text-ink-secondary">
            Palabras esenciales · {levelKey}
          </span>
        </div>
        <span className="font-mono text-caption font-semibold tabular-nums text-ink">
          {progressPct}%
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-sans text-heading-md font-bold tabular-nums text-ink leading-none">
            {learnedCount}{" "}
            <span className="font-body-sm font-normal text-ink-secondary">
              de {totalLevelWords}
            </span>
          </p>
          <span className="text-caption text-ink-secondary">
            {learnedCount === 0 ? "Comenzar" : `${totalLevelWords - learnedCount} restantes`}
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso de palabras esenciales nivel ${levelKey}: ${progressPct}% (${learnedCount} de ${totalLevelWords})`}
          className="h-2 w-full overflow-hidden rounded-full border-[1.5px] border-ink bg-coral-deep"
        >
          <div
            className="h-full rounded-full bg-ink transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </>
  );
}
