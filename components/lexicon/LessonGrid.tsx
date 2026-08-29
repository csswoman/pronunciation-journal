import { LessonCard } from "./LessonCard";
import type { LessonViewModel } from "@/lib/lexicon/types";

interface LessonGridProps {
  lessons: LessonViewModel[];
  loading?: boolean;
  onLessonClick?: (lessonId: string) => void;
  compact?: boolean;
  nextLessonId?: string;
}

export function LessonGrid({
  lessons,
  loading = false,
  onLessonClick,
  compact = false,
  nextLessonId,
}: LessonGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-surface-raised animate-pulse border border-border-subtle" />
        ))}
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-fg-muted text-body-sm">Todavía no hay categorías aquí.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {lessons.map((lesson) => (
        <LessonCard
          key={lesson.id}
          {...lesson}
          isNext={lesson.id === nextLessonId}
          onClick={onLessonClick}
          compact={compact}
        />
      ))}
    </div>
  );
}

export type { LessonViewModel as Lesson };
