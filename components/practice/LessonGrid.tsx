'use client'

import LessonCard from '@/components/lesson/LessonCard'
import type { Lesson } from '@/lib/types'

const PAGE_SIZE = 6

interface LessonGridProps {
  lessons: Lesson[]
  totalCount: number
  currentPage: number
  totalPages: number
  gridKey: number
  soundProgressMap: Map<string, number>
  isLoading: boolean
  onPageChange: (page: number) => void
  onClearFilters?: () => void
}

export { PAGE_SIZE }

export default function LessonGrid({
  lessons,
  totalCount,
  currentPage,
  totalPages,
  gridKey,
  soundProgressMap,
  isLoading,
  onPageChange,
  onClearFilters,
}: LessonGridProps) {
  if (isLoading) {
    return (
      <div
        className="p-8 text-center"
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <span
          className="animate-pulse"
          style={{ font: "var(--font-body-sm)", color: "var(--text-tertiary)" }}
        >
          Loading lessons…
        </span>
      </div>
    )
  }

  if (lessons.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-16 text-center"
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <span style={{ font: "var(--font-body-sm)", color: "var(--text-secondary)" }}>
          No lessons match your search.
        </span>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            style={{
              font: "var(--font-caption)",
              fontWeight: 500,
              color: "var(--primary)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Clear filters
          </button>
        )}
      </div>
    )
  }

  function getProgress(lesson: Lesson) {
    if (!lesson.id.startsWith('sound-')) return undefined
    const ipaMatch = lesson.title.match(/^(\/[^/]+\/)/)
    if (ipaMatch) return soundProgressMap.get(ipaMatch[1])
    return undefined
  }

  // Bento: 6-col grid on page 1 with enough lessons
  const useBento = currentPage === 1 && lessons.length >= 3

  return (
    <>
      <div key={gridKey} className="animate-grid-in">
        {useBento ? (
          <div
            className="grid grid-cols-2 sm:grid-cols-6"
            style={{ gap: "var(--space-4)" }}
          >
            {/* Featured: col-span-2 mobile, col-span-3 row-span-2 sm+ */}
            <div className="col-span-2 sm:col-span-3 sm:row-span-2">
              <LessonCard
                lesson={lessons[0]}
                progressPct={getProgress(lessons[0])}
                isFeatured
              />
            </div>

            {/* Wide: col-span-2 mobile, col-span-3 sm+ */}
            {lessons.slice(1, 3).map((lesson) => (
              <div key={lesson.id} className="col-span-2 sm:col-span-3">
                <LessonCard lesson={lesson} progressPct={getProgress(lesson)} />
              </div>
            ))}

            {/* Normal: col-span-1 mobile, col-span-2 sm+ */}
            {lessons.slice(3).map((lesson) => (
              <div key={lesson.id} className="col-span-1 sm:col-span-2">
                <LessonCard lesson={lesson} progressPct={getProgress(lesson)} />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={{ gap: "var(--space-4)" }}
          >
            {lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                progressPct={getProgress(lesson)}
              />
            ))}
          </div>
        )}
      </div>

      {totalCount > PAGE_SIZE && (
        <div
          className="flex items-center justify-center"
          style={{ gap: "var(--space-4)", marginTop: "var(--space-6)" }}
        >
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="text-[color:var(--text-secondary)] border-[color:var(--border-subtle)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--border-default)] transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              font: "var(--font-body-sm)",
              border: "1px solid",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-2) var(--space-4)",
              background: "var(--surface-raised)",
              cursor: "pointer",
            }}
          >
            ← Previous
          </button>

          <span style={{ font: "var(--font-caption)", color: "var(--text-tertiary)" }}>
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="text-[color:var(--text-secondary)] border-[color:var(--border-subtle)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--border-default)] transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              font: "var(--font-body-sm)",
              border: "1px solid",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-2) var(--space-4)",
              background: "var(--surface-raised)",
              cursor: "pointer",
            }}
          >
            Next →
          </button>
        </div>
      )}
    </>
  )
}
