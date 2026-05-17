import { LucideIcon } from "lucide-react";

interface LessonCardProps {
  id: string;
  icon: LucideIcon;
  title: string;
  wordsCompleted: number;
  totalWords: number;
  progress: number;
  tags: string[];
  accentColor: "primary" | "success" | "warning";
  onClick?: (id: string) => void;
}

const colorScheme = {
  primary: {
    variable: "--primary",
  },
  success: {
    variable: "--success",
  },
  warning: {
    variable: "--warning",
  },
};

export function LessonCard({
  id,
  icon: Icon,
  title,
  wordsCompleted,
  totalWords,
  progress,
  tags,
  accentColor,
  onClick,
}: LessonCardProps) {
  const colors = colorScheme[accentColor];
  const displayTags = tags.slice(0, 3);
  const remainingCount = tags.length - displayTags.length;

  return (
    <button
      onClick={() => onClick?.(id)}
      style={{
        borderColor: `var(${colors.variable})`,
        backgroundColor: `color-mix(in srgb, var(${colors.variable}) 8%, var(--surface-raised))`,
      }}
      className="flex flex-col gap-3 p-5 rounded-xl border-2 transition-all hover:shadow-md"
    >
      {/* Header with icon and progress */}
      <div className="flex items-start justify-between">
        <Icon className="w-6 h-6 text-fg flex-shrink-0" />
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
              stroke={`var(${colors.variable})`}
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

      {/* Title and word count */}
      <div className="text-left">
        <h3 className="text-lg font-semibold text-fg">{title}</h3>
        <p className="text-sm text-fg-muted mt-0.5">
          {wordsCompleted} / {totalWords} words
        </p>
      </div>

      {/* Tags */}
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
