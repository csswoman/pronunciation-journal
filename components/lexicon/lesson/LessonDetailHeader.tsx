// Planned structure:
// <LessonDetailHeader>
//   <Breadcrumb />
//   <TitleRow: dot + title + subtitle />
//   <ProgressStats: bar + legend />
// </LessonDetailHeader>

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface LessonDetailHeaderProps {
  title: string;
  totalWords: number;
  wordsLearned: number;
  wordsReviewing: number;
  sortLabel?: string;
  color: string;
}

export function LessonDetailHeader({
  title,
  totalWords,
  wordsLearned,
  wordsReviewing,
  sortLabel = "sorted alphabetically",
  color,
}: LessonDetailHeaderProps) {
  const learnedPct = (wordsLearned / totalWords) * 100;
  const reviewingPct = (wordsReviewing / totalWords) * 100;

  return (
    <div className="flex items-start justify-between gap-6">
      {/* Left: breadcrumb + title */}
      <div className="space-y-1">
        <nav className="flex items-center gap-1 text-xs text-fg-muted">
          <Link href="/lexicon" className="hover:text-fg transition-colors">
            Lexicon
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-fg">{title}</span>
        </nav>

        <div className="flex items-center gap-2 mt-1">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <h1 className="text-3xl font-bold text-fg">{title}</h1>
        </div>

        <p className="text-sm text-fg-muted pl-5">
          {totalWords.toLocaleString()} words · {sortLabel}
        </p>
      </div>

      {/* Right: progress stats */}
      <div className="flex-shrink-0 min-w-48 space-y-2 text-right">
        <div>
          <span className="text-2xl font-semibold text-fg">{wordsLearned.toLocaleString()}</span>
          <span className="text-sm text-fg-muted"> learned</span>
          <span className="text-sm text-fg-muted"> / of {totalWords.toLocaleString()}</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
          <div className="h-full flex">
            <div className="bg-primary h-full" style={{ width: `${learnedPct}%` }} />
            <div className="bg-warning h-full" style={{ width: `${reviewingPct}%` }} />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-3 text-xs text-fg-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Learned</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning inline-block" />Reviewing</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-border-default inline-block" />New</span>
        </div>
      </div>
    </div>
  );
}
