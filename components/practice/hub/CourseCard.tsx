'use client'

// Planned structure:
// <CourseCard> — "Ruta guiada" bento card (kicker guiado, level & unit progress, node path graphic)

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/db'

export default function CourseCard() {
  return (
    <Link
      href="/courses"
      onClick={() => void setLastPracticeMode('courses')}
      className="group relative flex flex-col justify-between gap-5 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-xs transition-colors hover:border-border-strong focus-ring h-full overflow-hidden"
    >
      <div className="flex flex-col gap-3 z-10">
        <span className="font-kicker text-fg-subtle text-tiny">guiado</span>
        <div className="flex flex-col gap-1">
          <h2 className="text-h3 font-bold text-fg group-hover:text-primary transition-colors">
            Ruta guiada
          </h2>
          <p className="text-body-sm text-fg-muted text-pretty">
            Continúa tus cursos estructurados por niveles y temas.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1 z-10 pt-2">
        <div className="flex items-center justify-between font-caption text-tiny text-fg-subtle">
          <span>Nivel B1 · Intermedio</span>
          <span className="font-semibold text-fg-muted">65%</span>
        </div>
        <span className="font-caption text-body-xs font-semibold text-fg">
          Unidad 4 · Pasado simple
        </span>
      </div>


      {/* Progress node path graphic illustration (bottom right) */}
      <div className="absolute right-4 bottom-4 hidden sm:flex items-center gap-1.5 opacity-40 transition-opacity group-hover:opacity-70">
        <span className="h-2 w-2 rounded-full bg-primary" />
        <span className="h-0.5 w-3 bg-border-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
        <span className="h-0.5 w-3 bg-border-strong" />
        <span className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
      </div>
    </Link>
  )
}
