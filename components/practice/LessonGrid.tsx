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
  soundProgressMap: Map<number, number>
  isLoading: boolean
  onPageChange: (page: number) => void
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

  function getProgress(lesson: Lesson) {
    return lesson.id.startsWith('sound-')
      ? soundProgressMap.get(Number(lesson.id.replace('sound-', '')))
      : undefined
  }

  // Bento: 6-col grid on page 1 with enough lessons
  const useBento = currentPage === 1 && lessons.length >= 3

  return (
    <>
      <div key={gridKey} className="animate-grid-in">
        {useBento ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "var(--space-3)",
            }}
          >
            {/* Featured: col-span-3, row-span-2 */}
            <div style={{ gridColumn: "span 3", gridRow: "span 2" }}>
              <LessonCard
                lesson={lessons[0]}
                progressPct={getProgress(lessons[0])}
                isFeatured
              />
            </div>

            {/* Wide: col-span-3, rows 1 & 2 */}
            {lessons.slice(1, 3).map((lesson) => (
              <div key={lesson.id} style={{ gridColumn: "span 3" }}>
                <LessonCard lesson={lesson} progressPct={getProgress(lesson)} />
              </div>
            ))}

            {/* Normal: col-span-2, row 3 */}
            {lessons.slice(3).map((lesson) => (
              <div key={lesson.id} style={{ gridColumn: "span 2" }}>
                <LessonCard lesson={lesson} progressPct={getProgress(lesson)} />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={{ gap: "var(--space-3)" }}
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
            style={{
              font: "var(--font-body-sm)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-2) var(--space-4)",
              background: "var(--surface-raised)",
              cursor: "pointer",
              transition: `all var(--transition-fast)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.borderColor = "var(--border-default)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
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
            style={{
              font: "var(--font-body-sm)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-2) var(--space-4)",
              background: "var(--surface-raised)",
              cursor: "pointer",
              transition: `all var(--transition-fast)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.borderColor = "var(--border-default)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          >
            Next →
          </button>
        </div>
      )}
    </>
  )
}
