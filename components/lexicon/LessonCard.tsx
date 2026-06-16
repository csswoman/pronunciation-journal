// Planned structure:
// <LessonCard>
//   <CardInitial />  — color-tinted first-letter block
//   <CardBody />     — title + word count
//   <CardProgress /> — linear bar + percentage
//   <CardTags />     — tag chips
// </LessonCard>

import { cn } from "@/lib/cn";

interface LessonCardProps {
  id: string;
  icon: string;
  title: string;
  color: string;
  wordsCompleted: number;
  totalWords: number;
  progress: number;
  tags: string[];
  onClick?: (id: string) => void;
}

export function LessonCard({
  id,
  title,
  color,
  wordsCompleted,
  totalWords,
  progress,
  tags,
  onClick,
}: LessonCardProps) {
  const displayTags = tags.slice(0, 3);
  const remainingCount = tags.length - displayTags.length;

  return (
    <button
      onClick={() => onClick?.(id)}
      className={cn(
        "flex flex-col gap-3 p-4 rounded-xl border border-border-subtle",
        "transition-all duration-200 hover:shadow-md hover:border-border-strong text-left w-full"
      )}
      style={{ background: `color-mix(in oklch, ${color} 6%, var(--surface-raised))` }}
    >
      {/* Icon + title row */}
      <div className="flex items-center gap-3">
        <div
          className="words-lexicon__card-initial"
          style={{
            background: `color-mix(in oklch, ${color} 18%, var(--surface-raised))`,
            color,
          }}
          aria-hidden
        >
          {title.charAt(0)}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-fg leading-snug truncate">{title}</h3>
          <p className="text-xs text-fg-muted mt-0.5">
            {wordsCompleted} / {totalWords} words
          </p>
        </div>
        <span className="ml-auto text-xs font-semibold tabular-nums shrink-0" style={{ color }}>
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-border-subtle rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {displayTags.map((tag) => (
          <span
            key={tag}
            className="inline-block px-1.5 py-0.5 text-xs rounded bg-surface-sunken text-fg-muted"
          >
            {tag}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="inline-block px-1.5 py-0.5 text-xs text-fg-subtle">
            +{remainingCount}
          </span>
        )}
      </div>
    </button>
  );
}
