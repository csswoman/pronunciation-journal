'use client'

// Planned structure:
// <CourseCard> — "Ruta guiada" bento card
//   header: kicker + title + description
//   footer: real level label + progress % + current unit/lesson
//           (or an "empieza un curso" prompt when nothing is started)
//   illustration: hand-drawn watermark, bottom-right

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/db'
import { getIllustration } from '@/lib/illustrations/registry'
import type { PracticeHubCourseData } from '@/lib/practice/hub-data-types'

const Illustration = getIllustration('domainProgress')

interface Props {
  data: PracticeHubCourseData | null
}

export default function CourseCard({ data }: Props) {
  return (
    <Link
      href="/courses"
      onClick={() => void setLastPracticeMode('courses')}
      className="group relative flex flex-col justify-between gap-5 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm active:scale-[0.99] focus-ring overflow-hidden"
    >
      <div className="flex flex-col gap-3 z-10">
        <span className="font-kicker text-tiny uppercase tracking-wider text-fg-subtle">guiado</span>
        <div className="flex flex-col gap-1">
          <h2 className="text-h3 font-bold text-fg group-hover:text-primary transition-colors">
            Ruta guiada
          </h2>
          <p className="text-body-sm text-fg-muted text-pretty">
            Continúa tu curso estructurado por niveles.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1 z-10 pt-2">
        {data ? (
          <>
            <div className="flex items-center justify-between font-caption text-tiny text-fg-subtle">
              <span>{data.levelLabel}</span>
              <span className="font-semibold text-fg-muted tabular-nums">{data.progressPct}%</span>
            </div>
            {(data.currentUnitTitle || data.currentLessonTitle) && (
              <span className="font-caption text-body-xs font-semibold text-fg">
                {[data.currentUnitTitle, data.currentLessonTitle].filter(Boolean).join(' · ')}
              </span>
            )}
          </>
        ) : (
          <span className="font-caption text-body-xs font-semibold text-fg">
            Aún no empiezas un curso · elige tu nivel
          </span>
        )}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-4 bottom-3 hidden text-primary/15 transition-colors duration-200 group-hover:text-primary/25 sm:block [&>svg]:h-16 [&>svg]:w-auto"
      >
        <Illustration />
      </div>
    </Link>
  )
}
