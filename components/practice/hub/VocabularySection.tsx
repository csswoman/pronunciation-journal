'use client'

import Link from 'next/link'
import { ListOrdered, RotateCcw, Search, ArrowRight, Layers } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'
import PracticeCategoryLane from './PracticeCategoryLane'
import { PRACTICE_CATEGORIES } from '@/lib/practice/practice-categories'

interface Props {
  dueCount: number | null
}

export default function VocabularySection({ dueCount }: Props) {
  const category = PRACTICE_CATEGORIES.vocabulary

  return (
    <PracticeCategoryLane title={category.title} kicker={category.kicker}>
      <Link
        href="/practice/essential-words"
        onClick={() => void setLastPracticeMode('essential-words')}
        className="flex shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none snap-start flex-col justify-between gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-ring group"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-lg)] bg-[var(--hue-icon-bg)] text-[var(--primary)]">
            <ListOrdered size={18} aria-hidden />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label font-semibold text-fg group-hover:text-primary transition-colors">Palabras esenciales</span>
            <ArrowRight size={15} className="text-fg-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="font-caption text-fg-muted">Aprende y repasa las palabras más frecuentes del inglés</p>
        </div>
      </Link>

      <Link
        href="/practice/decks"
        onClick={() => void setLastPracticeMode('decks')}
        className="flex shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none snap-start flex-col justify-between gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-ring group"
      >
        <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-lg)] bg-[var(--hue-icon-bg)] text-[var(--primary)]"><Layers size={18} aria-hidden /></span>
        <div className="flex flex-col gap-1"><div className="flex items-center justify-between gap-1"><span className="font-label font-semibold text-fg group-hover:text-primary transition-colors">Tus mazos</span><ArrowRight size={15} className="text-fg-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-transform" /></div><p className="font-caption text-fg-muted">Practica el vocabulario que guardaste para ti</p></div>
      </Link>

      {/* Tarjeta Repaso con Badge SRS */}
      <Link
        href="/practice/review"
        onClick={() => void setLastPracticeMode('review')}
        className="flex shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none snap-start flex-col justify-between gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-ring group"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-lg)] bg-[var(--hue-icon-bg)] text-[var(--primary)]">
            <RotateCcw size={18} aria-hidden />
          </span>
          {dueCount !== null && dueCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-0.5 font-caption text-tiny font-bold text-warning border border-warning/20">
              <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
              {dueCount} pendientes
            </span>
          ) : dueCount === 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 font-caption text-tiny font-medium text-success">
              Al día
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label font-semibold text-fg group-hover:text-primary transition-colors">
              Repaso
            </span>
            <ArrowRight size={15} className="text-fg-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="font-caption text-fg-muted">
            Palabras pendientes de repaso espaciado
          </p>
        </div>
      </Link>

      {/* Utilidad Buscar una palabra */}
      <Link
        href="/practice/word-search"
        onClick={() => void setLastPracticeMode('word-search')}
        className="flex shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none snap-start flex-col justify-between gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised/70 p-4 transition-colors hover:bg-surface-sunken focus-ring group"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-lg)] bg-surface-sunken text-fg-subtle group-hover:text-primary transition-colors">
            <Search size={18} aria-hidden />
          </span>
          <span className="font-caption text-tiny text-fg-subtle">Utilidad</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label font-medium text-fg group-hover:text-primary transition-colors">
              Buscar una palabra
            </span>
            <ArrowRight size={15} className="text-fg-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="font-caption text-fg-subtle">
            Búsqueda rápida y pistas de vocabulario
          </p>
        </div>
      </Link>
    </PracticeCategoryLane>
  )
}
