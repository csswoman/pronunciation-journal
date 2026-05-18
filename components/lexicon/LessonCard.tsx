// Planned structure:
// <LessonCard>
//   <CardIcon />     — colored icon container
//   <CardBody />     — title + word count
//   <CardProgress /> — linear bar + percentage
//   <CardTags />     — tag chips
// </LessonCard>

import {
  Layers,
  Code2,
  Component,
  Briefcase,
  FileText,
  Server,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "ux-design":         Layers,
  "frontend-dev":      Code2,
  "design-systems":    Component,
  "professional":      Briefcase,
  "technical-writing": FileText,
  "backend-infra":     Server,
};

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
  const Icon = CATEGORY_ICONS[id] ?? BookOpen;
  const displayTags = tags.slice(0, 3);
  const remainingCount = tags.length - displayTags.length;

  return (
    <button
      onClick={() => onClick?.(id)}
      className={cn(
        "flex flex-col gap-4 p-5 rounded-xl border border-border-subtle bg-surface-raised",
        "transition-all duration-200 hover:shadow-md hover:border-border-default text-left w-full"
      )}
    >
      {/* Icon + progress % */}
      <div className="flex items-start justify-between">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, var(--surface-sunken))` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <span className="text-sm font-semibold tabular-nums" style={{ color }}>
          {progress}%
        </span>
      </div>

      {/* Title + word count */}
      <div>
        <h3 className="text-base font-semibold text-fg leading-snug">{title}</h3>
        <p className="text-sm text-fg-muted mt-0.5">
          {wordsCompleted.toLocaleString()} / {totalWords.toLocaleString()} words
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-surface-sunken rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {displayTags.map((tag) => (
          <span
            key={tag}
            className="inline-block px-2 py-0.5 text-xs rounded-md bg-surface-sunken text-fg-muted"
          >
            {tag}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="inline-block px-2 py-0.5 text-xs text-fg-subtle">
            +{remainingCount}
          </span>
        )}
      </div>
    </button>
  );
}
