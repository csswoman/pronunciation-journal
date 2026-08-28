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
  isNext = false,
  onClick,
}: LessonCardProps) {
  const illustrationKey = illustrationForCategory(id);
  const Illustration = illustrationKey ? getIllustration(illustrationKey) : null;

  return (
    <button
      type="button"
      onClick={() => onClick?.(id)}
      className={cn(
        "group relative flex w-full items-center gap-4 rounded-2xl bg-surface-raised p-4 text-left transition-all duration-150 focus-ring hover:border-primary hover:shadow-sm",
        isNext ? "border-2 border-primary shadow-sm" : "border border-border-subtle"
      )}
    >
      <div
        className="flex h-[5rem] w-[5rem] shrink-0 items-center justify-center rounded-2xl bg-primary-soft/60 text-primary p-2 transition-transform group-hover:scale-105"
        aria-hidden
      >
        {Illustration ? (
          <Illustration className="h-full w-full object-contain" />
        ) : (
          <span className="font-bold text-h3">{title.charAt(0)}</span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-semibold text-fg text-body-sm sm:text-body truncate">
            {title}
          </h4>
          {isNext ? (
            <span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-on-primary uppercase">
              SIGUIENTE
            </span>
          ) : null}
        </div>
        <p className="text-caption text-fg-muted">
          {wordsCompleted} / {totalWords} palabras
        </p>
      </div>

      <span className="shrink-0 text-fg-subtle text-body transition-colors group-hover:text-primary" aria-hidden>
        →
      </span>
    </button>
  );
}
