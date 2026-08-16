'use client'

import Link from 'next/link'
import { BookOpen, GraduationCap, ArrowRight } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'
import PracticeCategoryLane from './PracticeCategoryLane'
import { PRACTICE_CATEGORIES } from '@/lib/practice/practice-categories'

export default function ContextReadingSection() {
  const category = PRACTICE_CATEGORIES.contextReading

  return (
    <PracticeCategoryLane title={category.title} kicker={category.kicker}>
      {/* Lectura en contexto */}
      <Link
        href="/practice/reader"
        onClick={() => void setLastPracticeMode('reader')}
        className="flex shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none snap-start flex-col justify-between gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-ring group"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-lg)] bg-[var(--hue-icon-bg)] text-[var(--primary)]">
            <BookOpen size={18} aria-hidden />
          </span>
          <span className="font-caption text-tiny font-medium text-primary">Libre</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label font-semibold text-fg group-hover:text-primary transition-colors">
              Lectura en contexto
            </span>
            <ArrowRight size={15} className="text-fg-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="font-caption text-fg-muted">
            Practica tus palabras recientes en oraciones y pasajes reales
          </p>
        </div>
      </Link>

      {/* Ruta guiada */}
      <Link
        href="/courses"
        onClick={() => void setLastPracticeMode('courses')}
        className="flex shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none snap-start flex-col justify-between gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-ring group"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-lg)] bg-[var(--hue-icon-bg)] text-[var(--primary)]">
            <GraduationCap size={18} aria-hidden />
          </span>
          <span className="font-caption text-tiny font-medium text-fg-subtle">Guiado</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label font-semibold text-fg group-hover:text-primary transition-colors">
              Ruta guiada
            </span>
            <ArrowRight size={15} className="text-fg-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="font-caption text-fg-muted">
            Continúa tus cursos estructurados por niveles y temas
          </p>
        </div>
      </Link>
    </PracticeCategoryLane>
  )
}
