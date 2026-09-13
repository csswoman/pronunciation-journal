'use client'

// Structure:
// <ReviewLessonSection>
//   <ReviewSectionCard title="Lecciones para repasar">
//     <LessonReviewList (items with title, type, daysSinceStudy, Link)>
//   </ReviewSectionCard>
// </ReviewLessonSection>

import Link from 'next/link'
import { ReviewSectionCard } from './ReviewSectionCard'
import type { LessonReviewItem } from '@/lib/review/types'

interface ReviewLessonSectionProps {
  lessons: LessonReviewItem[]
  count: number
}

export function ReviewLessonSection({ lessons, count }: ReviewLessonSectionProps) {
  return (
    <ReviewSectionCard
      title="Lecciones para repasar"
      count={count}
      emptyMessage="No tienes lecciones pendientes de repaso."
    >
      <ul className="flex flex-col gap-2">
        {lessons.slice(0, 4).map((lesson) => (
          <li
            key={lesson.id}
            className="flex items-center justify-between gap-3 font-body-sm text-fg-secondary"
          >
            <div className="min-w-0">
              <p className="font-medium text-fg truncate">{lesson.title}</p>
              <p className="font-caption text-fg-muted">
                {lesson.typeLabel} · {lesson.daysSinceStudy === 0 ? 'estudiada hoy' : `hace ${lesson.daysSinceStudy}d`}
              </p>
            </div>
            <Link
              href={lesson.url}
              className="shrink-0 text-body-sm font-semibold text-primary hover:underline"
            >
              Repasar →
            </Link>
          </li>
        ))}
      </ul>
    </ReviewSectionCard>
  )
}
