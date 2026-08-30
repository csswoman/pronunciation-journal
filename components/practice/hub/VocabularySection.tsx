// Planned structure:
// <VocabularySection>
//   <PracticeCategoryLane title kicker>
//     <Link /practice/decks> Tus mazos
//   </PracticeCategoryLane>
// </VocabularySection>

import Link from 'next/link'
import { Layers, ArrowRight } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'
import PracticeCategoryLane from './PracticeCategoryLane'
import { PRACTICE_CATEGORIES } from '@/lib/practice/practice-categories'

export default function VocabularySection() {
  const category = PRACTICE_CATEGORIES.vocabulary

  return (
    <PracticeCategoryLane title={category.title} kicker={category.kicker}>
      <Link
        href="/practice/decks"
        onClick={() => void setLastPracticeMode('decks')}
        className="flex shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none snap-start flex-col justify-between gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-ring group"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-[var(--hue-icon-bg)] text-[var(--primary)]">
            <Layers size={18} aria-hidden />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label font-semibold text-fg group-hover:text-primary transition-colors">Tus mazos</span>
            <ArrowRight size={15} className="text-fg-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="font-caption text-fg-muted">Practica el vocabulario que guardaste en tus listas</p>
        </div>
      </Link>
    </PracticeCategoryLane>
  )
}
