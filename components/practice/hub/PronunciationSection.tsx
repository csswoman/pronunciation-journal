// Planned structure:
// <PronunciationSection>
//   <PracticeCategoryLane title kicker>
//     <Link /practice/connected-speech>  Habla conectada
//     <Link /practice/intonation>        Entonación
//     <Link /practice/minimal-pairs>     Pares mínimos
//   </PracticeCategoryLane>
// </PronunciationSection>

import Link from 'next/link'
import { Sparkles, Waves, Layers, ArrowRight } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'
import PracticeCategoryLane from './PracticeCategoryLane'
import { PRACTICE_CATEGORIES } from '@/lib/practice/practice-categories'

export default function PronunciationSection() {
  const category = PRACTICE_CATEGORIES.pronunciation

  return (
    <PracticeCategoryLane title={category.title} kicker={category.kicker}>
      <Link
        href="/practice/connected-speech"
        onClick={() => void setLastPracticeMode('connected-speech')}
        className="flex shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none snap-start flex-col justify-between gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-ring group"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-[var(--hue-icon-bg)] text-[var(--primary)]">
            <Sparkles size={18} aria-hidden />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label font-semibold text-fg group-hover:text-primary transition-colors">Habla conectada</span>
            <ArrowRight size={15} className="text-fg-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="font-caption text-fg-muted">Une palabras al hablar, como en una conversación real</p>
        </div>
      </Link>

      <Link
        href="/practice/intonation"
        onClick={() => void setLastPracticeMode('intonation')}
        className="flex shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none snap-start flex-col justify-between gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-ring group"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-[var(--hue-icon-bg)] text-[var(--primary)]">
            <Waves size={18} aria-hidden />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label font-semibold text-fg group-hover:text-primary transition-colors">Entonación</span>
            <ArrowRight size={15} className="text-fg-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="font-caption text-fg-muted">Observa cómo cambia el tono en preguntas y oraciones</p>
        </div>
      </Link>

      <Link
        href="/practice/minimal-pairs"
        onClick={() => void setLastPracticeMode('minimal-pairs')}
        className="flex shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none snap-start flex-col justify-between gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-ring group"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-[var(--hue-icon-bg)] text-[var(--primary)]">
            <Layers size={18} aria-hidden />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label font-semibold text-fg group-hover:text-primary transition-colors">Pares mínimos</span>
            <ArrowRight size={15} className="text-fg-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="font-caption text-fg-muted">Entrena la discriminación entre sonidos que se confunden fácilmente</p>
        </div>
      </Link>
    </PracticeCategoryLane>
  )
}
