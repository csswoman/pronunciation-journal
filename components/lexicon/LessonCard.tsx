import { cn } from "@/lib/cn";
import { getIllustration } from "@/lib/illustrations/registry";
import { illustrationForCategory } from "@/lib/lexicon/category-illustrations";
import type { StudyMode } from "@/lib/lexicon/types";

// Planned structure:
// <LessonCard>
//   <button (Card Wrapper Container)>
//     <div (Fixed Semi-Square Pastel Icon Box)>
//       <Illustration | FallbackIcon />
//     </div>
//     <div (Content Column)>
//       <div (Title & Badges Row)>
//       <div (Status Text)>
//       <div (Segmented Progress Bar)>
//     </div>
//   </button>
// </LessonCard>

interface LessonCardProps {
  id: string;
  icon?: string;
  title: string;
  wordsCompleted: number;
  totalWords: number;
  wordsReviewing?: number;
  progress?: number;
  tags?: string[];
  studyMode?: StudyMode;
  isNext?: boolean;
  onClick?: (id: string) => void;
  compact?: boolean;
}

const CATEGORY_PASTEL_VARS: Record<string, string> = {
  "artificial-intelligence": "var(--sky)",
  "backend-infra": "var(--lilac)",
  "data-science": "var(--butter)",
  "frontend-dev": "var(--mint)",
  "ux-design": "var(--coral)",
  "design-systems": "var(--lilac)",
  "personal-interview": "var(--butter)",
  professional: "var(--sky)",
  "technical-writing": "var(--mint)",
};

export function LessonCard({
  id,
  title,
  wordsCompleted,
  totalWords,
  wordsReviewing = 0,
  progress,
  isNext = false,
  onClick,
}: LessonCardProps) {
  const illustrationKey = illustrationForCategory(id);
  const Illustration = illustrationKey ? getIllustration(illustrationKey) : null;
  const computedProgress = progress ?? (totalWords > 0 ? Math.round((wordsCompleted / totalWords) * 100) : 0);
  const pastelBg = CATEGORY_PASTEL_VARS[id] ?? "var(--sky)";

  const isStarted = wordsCompleted > 0 || wordsReviewing > 0;
  const statusText = isStarted ? "en curso" : "sin empezar";

  return (
    <button
      type="button"
      onClick={() => onClick?.(id)}
      className={cn(
        "group relative flex w-full items-center gap-3.5 rounded-2xl bg-surface-raised p-4 text-left transition-all duration-150 focus-ring hover:border-primary/60 hover:shadow-xs",
        isNext
          ? "border-2 border-primary shadow-2xs"
          : "border border-border-subtle/80"
      )}
    >
      <div
        className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl border border-black/5 p-3 text-stone-900 transition-transform duration-150 group-hover:scale-[1.03]"
        style={{ backgroundColor: pastelBg }}
        aria-hidden
      >
        {Illustration ? (
          <Illustration className="h-full w-full object-contain text-stone-900" />
        ) : (
          <span className="font-bold text-h4 text-stone-900">{title.charAt(0)}</span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display font-bold text-fg text-body-sm sm:text-body truncate tracking-tight">
            {title}
          </h4>
          {isNext ? (
            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-on-primary uppercase shadow-2xs">
              SIGUIENTE
            </span>
          ) : null}
        </div>

        <p className="text-caption text-fg-muted font-medium">
          {wordsCompleted} de {totalWords} · {statusText}
        </p>

        {/* 5-segment progress bar matching mockup */}
        <div className="flex items-center gap-1 w-full max-w-[130px] pt-1" aria-hidden>
          {Array.from({ length: 5 }).map((_, idx) => {
            const threshold = (idx + 1) * 20;
            const isFilled = computedProgress >= threshold - 10;
            return (
              <div
                key={idx}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-200",
                  isFilled ? "bg-fg/80 dark:bg-fg/80" : "bg-border-subtle/70 dark:bg-border-subtle/50"
                )}
              />
            );
          })}
        </div>
      </div>
    </button>
  );
}
