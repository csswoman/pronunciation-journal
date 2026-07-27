import { LessonCard } from "./LessonCard";
import type { LessonViewModel } from "@/lib/lexicon/types";

interface LessonGridProps {
  lessons: LessonViewModel[];
  loading?: boolean;
  onLessonClick?: (lessonId: string) => void;
  compact?: boolean;
}

export function LessonGrid({ lessons, loading = false, onLessonClick, compact = false }: LessonGridProps) {
  if (loading) {
    return (
      <div className={compact ? "grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3" : "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 rounded-lg bg-surface-raised animate-pulse" />
        ))}
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-fg-muted text-body-sm">Todavía no hay categorías aquí.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {lessons.map((lesson) => (
        <LessonCard
          key={lesson.id}
          {...lesson}
          onClick={onLessonClick}
          compact={compact}
        />
      ))}
    </div>
  );
}

export type { LessonViewModel as Lesson };
