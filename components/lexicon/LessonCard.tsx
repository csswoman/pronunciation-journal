import { cn } from "@/lib/cn";
import { getIllustration } from "@/lib/illustrations/registry";
import { illustrationForCategory } from "@/lib/lexicon/category-illustrations";
import type { StudyMode } from "@/lib/lexicon/types";

// Subcomponent structure:
// <LessonCard>
//   <button (Card Wrapper)>
//     <div (Illustration Container)>
//     <div (Copy & Progress Area)>
//       <div (Title & Mode Badges)>
//       <div (Progress Bar & Counts)>
//     <div (Action Link Indicator)>
//   </button>
// </LessonCard>

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
        "group relative flex w-full items-center gap-4 rounded-2xl bg-surface-raised p-4 text-left transition-all duration-150 focus-ring hover:border-primary/70 hover:shadow-xs",
        isNext
          ? "border border-primary ring-1 ring-primary/30 shadow-xs"
          : "border border-border-subtle"
      )}
    >
      <div
        className="flex h-16 w-16 sm:h-18 sm:w-18 shrink-0 items-center justify-center rounded-xl bg-surface-sunken border border-border-subtle/50 text-primary p-2 transition-transform duration-150 group-hover:scale-[1.03]"
        aria-hidden
      >
        {Illustration ? (
          <Illustration className="h-full w-full object-contain" />
        ) : (
          <span className="font-bold text-h3 text-primary">{title.charAt(0)}</span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-semibold text-fg text-body-sm sm:text-body truncate">
            {title}
          </h4>
          {studyMode && (
            <span className="shrink-0 rounded-full bg-primary-soft/70 text-primary px-2 py-0.5 text-[11px] font-medium border border-primary/20">
              {studyMode === "receptive" ? "Reconocer" : "Producir"}
            </span>
          )}
          {isNext ? (
            <span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-on-primary uppercase shadow-xs">
              SIGUIENTE
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-surface-sunken overflow-hidden" aria-hidden>
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${computedProgress}%` }}
            />
          </div>
          <span className="text-caption text-fg-muted font-medium font-mono text-tiny">
            {wordsCompleted}/{totalWords}
          </span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1 text-caption font-semibold text-primary opacity-80 group-hover:opacity-100 transition-opacity">
        <span className="hidden sm:inline">Practicar</span>
        <span aria-hidden className="text-body transition-transform group-hover:translate-x-0.5">→</span>
      </div>
    </button>
  );
}

