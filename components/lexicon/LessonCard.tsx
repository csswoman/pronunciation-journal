import { cn } from "@/lib/cn";
import { getIllustration } from "@/lib/illustrations/registry";
import { illustrationForCategory } from "@/lib/lexicon/category-illustrations";
import type { StudyMode } from "@/lib/lexicon/types";

interface LessonCardProps {
  id: string;
  icon?: string;
  title: string;
  wordsCompleted: number;
  totalWords: number;
  progress?: number;
  tags?: string[];
  studyMode?: StudyMode;
  isNext?: boolean;
  onClick?: (id: string) => void;
  compact?: boolean;
}

export function LessonCard({
  id,
  title,
  wordsCompleted,
  totalWords,
  progress,
  studyMode,
  isNext = false,
  onClick,
}: LessonCardProps) {
  const illustrationKey = illustrationForCategory(id);
  const Illustration = illustrationKey ? getIllustration(illustrationKey) : null;
  const computedProgress = progress ?? (totalWords > 0 ? Math.round((wordsCompleted / totalWords) * 100) : 0);

  return (
    <button
      type="button"
      onClick={() => onClick?.(id)}
      className={cn(
        "group relative flex w-full items-center gap-4 rounded-2xl bg-surface-raised p-4 text-left transition-all duration-150 focus-ring hover:border-primary hover:shadow-md",
        isNext ? "border-2 border-primary shadow-sm" : "border border-border-subtle"
      )}
    >
      <div
        className="flex h-[4.5rem] w-[4.5rem] sm:h-[5rem] sm:w-[5rem] shrink-0 items-center justify-center rounded-2xl bg-primary-soft/60 text-primary p-2 transition-transform group-hover:scale-105"
        aria-hidden
      >
        {Illustration ? (
          <Illustration className="h-full w-full object-contain" />
        ) : (
          <span className="font-bold text-h3">{title.charAt(0)}</span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-semibold text-fg text-body-sm sm:text-body truncate">
            {title}
          </h4>
          {studyMode && (
            <span className="shrink-0 rounded-full bg-primary-soft text-primary px-2 py-0.5 text-[11px] font-medium border border-primary/20">
              {studyMode === "receptive" ? "Reconocer" : "Producir"}
            </span>
          )}
          {isNext ? (
            <span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-on-primary uppercase">
              SIGUIENTE
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-surface-sunken overflow-hidden" aria-hidden>
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${computedProgress}%` }}
            />
          </div>
          <span className="text-caption text-fg-muted font-medium">
            {wordsCompleted} / {totalWords} palabras
          </span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1 text-caption font-semibold text-primary opacity-90 group-hover:opacity-100 transition-opacity">
        <span className="hidden sm:inline">Practicar</span>
        <span aria-hidden className="text-body transition-transform group-hover:translate-x-0.5">→</span>
      </div>
    </button>
  );
}
