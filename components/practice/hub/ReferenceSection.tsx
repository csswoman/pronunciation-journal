'use client'

// Planned structure:
// <ReferenceSection>
//   Diccionario card (lookup tool, not an exercise — own door per B5/B3)
// </ReferenceSection>

import Link from 'next/link'
import { BookOpen, ArrowRight } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'
import PracticeCategoryLane from './PracticeCategoryLane'
import { PRACTICE_CATEGORIES } from '@/lib/practice/practice-categories'

export default function ReferenceSection() {
  const category = PRACTICE_CATEGORIES.reference

  return (
    <PracticeCategoryLane
      title={category.title}
      kicker={category.kicker}
      description={category.description}
    >
      <Link
        href="/dictionary"
        onClick={() => void setLastPracticeMode('dictionary')}
        className="flex shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none snap-start flex-col justify-between gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised/70 p-4 transition-colors hover:bg-surface-sunken focus-ring group"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-lg)] bg-surface-sunken text-fg-subtle group-hover:text-primary transition-colors">
            <BookOpen size={18} aria-hidden />
          </span>
          <span className="font-caption text-tiny text-fg-subtle">Libre</span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label font-medium text-fg group-hover:text-primary transition-colors">
              Diccionario
            </span>
            <ArrowRight size={15} className="text-fg-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="font-caption text-fg-subtle">
            Busca palabras, significados y pronunciación cuando lo necesites
          </p>
        </div>
      </Link>
    </PracticeCategoryLane>
  )
}
