// Planned structure:
// <LessonCard>
//   <CardInitial />    — color-tinted first-letter block
//   <CardBody />       — title + word count
//   <StudyModeBadge />  — "Reconocer" vs "Producir" signal
//   <CardProgress />   — linear bar + percentage
//   <CardTags />       — tag chips
// </LessonCard>

import { cn } from "@/lib/cn";
import type { StudyMode } from "@/lib/lexicon/types";

const STUDY_MODE_LABEL: Record<StudyMode, string> = {
  receptive: "Reconocer",
  productive: "Producir",
};

interface LessonCardProps {
  id: string;
  icon: string;
  title: string;
  wordsCompleted: number;
  totalWords: number;
  progress: number;
  tags: string[];
  studyMode?: StudyMode;
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
  onClick,
  compact = false,
}: LessonCardProps) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onClick?.(id)}
        className="words-lexicon__lesson-row"
      >
        <span className="words-lexicon__lesson-row-initial" aria-hidden>
          {title.charAt(0)}
        </span>
        <span className="words-lexicon__lesson-row-copy">
          <span className="words-lexicon__lesson-row-title">{title}</span>
          <span className="words-lexicon__lesson-row-meta">
            {totalWords} palabras · {progress}% aprendido
            {studyMode ? ` · ${STUDY_MODE_LABEL[studyMode]}` : null}
          </span>
        </span>
        <span className="words-lexicon__lesson-row-arrow" aria-hidden>→</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick?.(id)}
      className={cn( "words-lexicon__category-card flex w-full flex-col gap-3 rounded-lg border border-border-subtle bg-surface-raised p-4 text-left" )}
    >
      {/* Icon + title row */}
      <div className="flex items-center gap-3">
        <div
          className="words-lexicon__card-initial bg-primary-soft text-primary"
          aria-hidden
        >
          {title.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-label text-fg leading-snug truncate">{title}</h3>
            {studyMode ? (
              <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-tiny font-medium text-fg-subtle">
                {STUDY_MODE_LABEL[studyMode]}
              </span>
            ) : null}
          </div>
          <p className="text-caption text-fg-muted mt-1">
            {wordsCompleted} / {totalWords} palabras
          </p>
        </div>
        <span className="ml-auto text-caption font-semibold tabular-nums shrink-0 text-fg-muted">
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-border-subtle rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

    </button>
  );
}
