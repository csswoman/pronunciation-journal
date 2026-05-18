import { LessonCard } from "./LessonCard";
import type { LessonViewModel } from "@/lib/lexicon/types";

const CARD_PALETTE = [
  "oklch(.8 .1 0)",
  "oklch(.8 .1 30)",
  "oklch(.8 .1 60)",
  "oklch(.8 .1 90)",
  "oklch(.8 .1 120)",
  "oklch(.8 .1 150)",
  "oklch(.8 .1 180)",
  "oklch(.8 .1 210)",
  "oklch(.8 .1 240)",
  "oklch(.8 .1 270)",
  "oklch(.8 .1 300)",
  "oklch(.8 .1 330)",
];

interface LessonGridProps {
  lessons: LessonViewModel[];
  loading?: boolean;
  onLessonClick?: (lessonId: string) => void;
}

export function LessonGrid({ lessons, loading = false, onLessonClick }: LessonGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 rounded-xl bg-surface-raised animate-pulse" />
        ))}
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-fg-muted text-sm">No lessons found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {lessons.map((lesson, i) => (
        <LessonCard
          key={lesson.id}
          {...lesson}
          color={CARD_PALETTE[i % CARD_PALETTE.length]}
          onClick={onLessonClick}
        />
      ))}
    </div>
  );
}

export type { LessonViewModel as Lesson };
