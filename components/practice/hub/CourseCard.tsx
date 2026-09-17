'use client'

// Planned structure:
// <CourseCard> — "Ruta guiada" bento card in PastelCard tone="sky"
//   Header: GUIADO kicker + "{progressPct} %" badge
//   Title: Ruta guiada + subtitle
//   Progress bar segmentado
//   CTA: "Continuar la ruta" button (tinta sólida)
//   Watermark: "A1" big text outline

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/practice/last-practice-mode'
import { ArrowRight } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { PracticeHubCourseData } from '@/lib/practice/hub-data-types'

const TOTAL_SEGMENTS = 10

interface Props {
  data: PracticeHubCourseData | null
}

export default function CourseCard({ data }: Props) {
  const progressPct = data?.progressPct ?? 0
  const progressRatio = Math.min(1, Math.max(0, progressPct / 100))
  const activeSegments = progressPct > 0 ? Math.max(1, Math.round(progressRatio * TOTAL_SEGMENTS)) : 0

  return (
    <Link
      href="/courses"
      onClick={() => void setLastPracticeMode('courses')}
      data-tone="sky"
      className="pastel-card focus-ring group relative flex flex-col justify-between gap-5 rounded-3xl p-5 transition-transform hover:-translate-y-px overflow-hidden select-none"
    >
      <div className="flex flex-col gap-3 z-10">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-ink select-none">
            GUIADO
          </span>
          <span className="inline-flex items-center rounded-full bg-ink/12 px-2.5 py-0.5 font-sans text-caption font-bold text-ink">
            {progressPct} %
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-h3 font-extrabold text-ink leading-tight">
            Ruta guiada
          </h2>
          <p className="font-sans text-body-sm text-ink-secondary text-pretty">
            {data?.currentUnitTitle || data?.currentLessonTitle
              ? [data.currentUnitTitle, data.currentLessonTitle].filter(Boolean).join(' · ')
              : '28 lecciones clave · Cómo estudiar por tu cuenta'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3.5 z-10">
        <div
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso de ruta guiada: ${progressPct}%`}
          className="flex w-full items-center gap-1.5 py-0.5"
        >
          {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors duration-300',
                i < activeSegments ? 'bg-ink' : 'bg-ink/15',
              )}
            />
          ))}
        </div>

        <div className="pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-label text-body-sm font-semibold text-paper transition-all group-hover:bg-ink-secondary shrink-0">
            <span>Continuar la ruta</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>

      {/* Marca de agua grande de A1 (letra normal suave) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 bottom-0.5 font-heading text-6xl sm:text-7xl font-black text-ink/10 select-none transition-colors group-hover:text-ink/15"
      >
        A1
      </span>
    </Link>
  )
}
