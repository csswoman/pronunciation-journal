'use client'

// Planned structure:
// <SpokenLineFeedback>
//   <WordChip />            (palabra correcta / no oida / fallada con estilo pastel pill y smile curve)
//   <SyllableBreakdown />   (palabra fallada con mapeo silabico fiable)

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { SyllableBreakdown } from './SyllableBreakdown'
import type { SyllableResult } from '@/lib/pronunciation/syllable-scoring'
import type { WordResult, WordStatus } from '@/lib/types'

interface Props {
  wordResults: WordResult[]
  /** Desglose por palabra; ausente ⇒ se pinta la palabra entera. */
  syllableMap: Map<string, SyllableResult[]>
  selectedWordIndex?: number | null
  onSelectWord?: (index: number) => void
}

const WORD_CLASS: Record<WordStatus, string> = {
  correct: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-100 border-emerald-300/50 var(--success)',
  incorrect: 'bg-amber-100 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100 border-amber-300/50 font-bold var(--error)',
  missing: 'bg-rose-100 text-rose-950 dark:bg-rose-900/60 dark:text-rose-100 border-rose-300/50 italic var(--warning)',
  extra: 'bg-rose-100 text-rose-950 dark:bg-rose-900/60 dark:text-rose-100 border-rose-300/50 line-through var(--warning)',
}

const WORD_CURVE: Record<WordStatus, string> = {
  correct: 'text-emerald-600/70 dark:text-emerald-400/80',
  incorrect: 'text-amber-600/70 dark:text-amber-400/80',
  missing: 'text-rose-600/70 dark:text-rose-400/80',
  extra: 'text-rose-600/70 dark:text-rose-400/80',
}

const WORD_LABEL: Record<WordStatus, string> = {
  correct: 'bien',
  incorrect: 'mal',
  missing: 'no se te oyó',
  extra: 'sobra',
}

export function SpokenLineFeedback({ wordResults, syllableMap, selectedWordIndex = null, onSelectWord }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(selectedWordIndex)

  const handleWordClick = (index: number) => {
    const next = activeIdx === index ? null : index
    setActiveIdx(next)
    onSelectWord?.(index)
  }

  return (
    <div
      data-testid="spoken-line"
      className="m-0 flex flex-wrap items-center gap-2 text-body py-1"
    >
      {wordResults.map((word, index) => {
        const syllables = word.status === 'incorrect'
          ? syllableMap.get(word.expected)
          : undefined

        if (syllables) {
          return <SyllableBreakdown key={index} syllables={syllables} />
        }

        const isSelected = activeIdx === index || (activeIdx === null && index === 0 && word.status !== 'correct')
        const curveClass = WORD_CURVE[word.status]

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleWordClick(index)}
            aria-label={`${word.expected}: ${WORD_LABEL[word.status]}`}
            className={cn(
              'inline-flex flex-col items-center justify-center rounded-2xl border px-4 py-1.5 font-bold text-base transition-all cursor-pointer shadow-2xs select-none relative',
              WORD_CLASS[word.status],
              isSelected && 'ring-2 ring-purple-500 ring-offset-2 ring-offset-bg dark:ring-offset-surface-base scale-[1.02]',
            )}
          >
            <span>{word.expected}</span>
            <svg className={cn('w-6 h-1.5 mt-0.5', curveClass)} viewBox="0 0 24 6">
              <path d="M2 2C8 5 16 5 22 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
