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
  icon,
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
      style={{
        borderColor: color,
        backgroundColor: `color-mix(in srgb, ${color} 8%, var(--surface-raised))`,
      }}
      className="flex flex-col gap-3 p-5 rounded-xl border-2 transition-all hover:shadow-md text-left w-full"
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl leading-none">{icon}</span>
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full" viewBox="0 0 60 60">
            <circle
              cx="30"
              cy="30"
              r="25"
              fill="none"
              stroke="var(--border-default)"
              strokeWidth="3"
            />
            <circle
              cx="30"
              cy="30"
              r="25"
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeDasharray={`${progress * 1.57} 157`}
              strokeLinecap="round"
              transform="rotate(-90 30 30)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-fg">{progress}%</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-fg">{title}</h3>
        <p className="text-sm text-fg-muted mt-0.5">
          {wordsCompleted} / {totalWords} words
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag) => (
          <span
            key={tag}
            className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-surface-raised text-fg-muted border border-border-subtle"
          >
            {tag}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="inline-block px-2.5 py-1 text-xs font-medium text-fg-muted">
            +{remainingCount} more
          </span>
        )}
      </div>
    </button>
  );
}
