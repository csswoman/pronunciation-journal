import { SoundLabLessonCard } from "./SoundLabLessonCard";
import type { Lesson } from "@/lib/types";

interface Props {
  lessons: Lesson[];
  soundProgressMap: Map<number, number>;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

function getProgress(lesson: Lesson, map: Map<number, number>): number | undefined {
  if (!lesson.id.startsWith("sound-")) return undefined;
  return map.get(Number(lesson.id.replace("sound-", "")));
}

export function SoundLabLessonGrid({ lessons, soundProgressMap, totalCount, currentPage, totalPages, isLoading, onPageChange }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-space-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[280px] animate-pulse rounded-lg bg-surface-raised" />
        ))}
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <p className="py-space-16 text-center text-body-sm text-fg-muted">
        No lessons match this filter.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-space-6 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => (
          <SoundLabLessonCard
            key={lesson.id}
            lesson={lesson}
            progressPct={getProgress(lesson, soundProgressMap)}
          />
        ))}
      </div>

      {totalCount > lessons.length && (
        <div className="mt-space-8 flex items-center justify-center gap-space-4">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-border-subtle bg-surface-raised px-space-4 py-space-2 text-body-sm text-fg-muted transition-all hover:border-border-default hover:text-fg disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-caption text-fg-subtle">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="rounded-md border border-border-subtle bg-surface-raised px-space-4 py-space-2 text-body-sm text-fg-muted transition-all hover:border-border-default hover:text-fg disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </>
  );
}
