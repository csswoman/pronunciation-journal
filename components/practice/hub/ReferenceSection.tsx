// Planned structure:
// <ReferenceSection>
//   <PracticeCategoryLane title kicker description>
//     <Link /words>              Diccionario
//     <Link /practice/word-search> Buscar una palabra
//   </PracticeCategoryLane>
// </ReferenceSection>

import Link from 'next/link'
import { BookOpen, Search, ArrowRight } from '@/components/icons'
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
        href="/words"
        onClick={() => void setLastPracticeMode('dictionary')}
        className="flex shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none snap-start flex-col justify-between gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-ring group"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-surface-sunken text-fg-subtle group-hover:text-primary transition-colors">
            <BookOpen size={18} aria-hidden />
          </span>
          <span className="font-caption text-tiny text-fg-subtle">Libre</span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label font-semibold text-fg group-hover:text-primary transition-colors">
              Diccionario
            </span>
            <ArrowRight size={15} className="text-fg-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="font-caption text-fg-muted">
            Busca palabras, significados y pronunciación cuando lo necesites
          </p>
        </div>
      </Link>

      <Link
        href="/practice/word-search"
        onClick={() => void setLastPracticeMode('word-search')}
        className="flex shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none snap-start flex-col justify-between gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-ring group"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-surface-sunken text-fg-subtle group-hover:text-primary transition-colors">
            <Search size={18} aria-hidden />
          </span>
          <span className="font-caption text-tiny text-fg-subtle">Búsqueda</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label font-semibold text-fg group-hover:text-primary transition-colors">
              Buscar una palabra
            </span>
            <ArrowRight size={15} className="text-fg-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="font-caption text-fg-muted">
            Búsqueda rápida y pistas de vocabulario
          </p>
        </div>
      </Link>
    </PracticeCategoryLane>
  )
}
