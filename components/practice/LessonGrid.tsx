'use client'

import LessonCard from '@/components/lesson/LessonCard'
import Grid from '@/components/layout/Grid'
import Card from '@/components/layout/Card'
import Button from '@/components/ui/Button'
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
      <Card className="p-8 text-center">
        <div className="text-sm animate-pulse" style={{ color: 'var(--text-secondary)' }}>
          Loading lessons...
        </div>
      </Card>
    )
  }

  return (
    <>
      <div key={gridKey} className="animate-grid-in">
        <Grid cols="3" gap="lg" responsive={true}>
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              progressPct={
                lesson.id.startsWith('sound-')
                  ? soundProgressMap.get(Number(lesson.id.replace('sound-', '')))
                  : undefined
              }
            />
          ))}
        </Grid>
      </div>

      {totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <Button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            variant="secondary"
            size="sm"
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </Button>
          <span className="text-sm tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
            {currentPage} / {totalPages}
          </span>
          <Button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            variant="secondary"
            size="sm"
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </Button>
        </div>
      )}
    </>
  )
}
