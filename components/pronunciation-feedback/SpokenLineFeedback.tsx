'use client'

// Planned structure:
// <SpokenLineFeedback>
//   <WordChip />            (palabra correcta / no oida / fallada sin silabas)
//   <SyllableBreakdown />   (palabra fallada con mapeo silabico fiable)

import { cn } from '@/lib/cn'
import { SyllableBreakdown } from './SyllableBreakdown'
import type { SyllableResult } from '@/lib/pronunciation/syllable-scoring'
import type { WordResult, WordStatus } from '@/lib/types'

interface Props {
  wordResults: WordResult[]
  /** Desglose por palabra; ausente ⇒ se pinta la palabra entera. */
  syllableMap: Map<string, SyllableResult[]>
}

const WORD_CLASS: Record<WordStatus, string> = {
  correct: 'border-transparent text-fg-muted',
  incorrect: 'border-[var(--error)] text-fg font-semibold',
  missing: 'border-[var(--admonitions-color-warning)] text-fg-subtle italic',
  extra: 'border-[var(--admonitions-color-warning)] text-fg-subtle line-through',
}

const WORD_LABEL: Record<WordStatus, string> = {
  correct: 'bien',
  incorrect: 'mal',
  missing: 'no se te oyó',
  extra: 'sobra',
}

/**
 * La frase dicha, palabra a palabra y en color.
 *
 * Se pinta la linea *entera*, no solo lo fallado: sin las palabras correctas
 * en verde no hay forma de saber si el intento fue bien, y un acierto se veia
 * igual que un fallo. Cuando el mapeo silabico de una palabra fallada es
 * fiable, se baja al detalle de silaba; si no, la palabra entera se marca.
 */
export function SpokenLineFeedback({ wordResults, syllableMap }: Props) {
  return (
    <p
      data-testid="spoken-line"
      className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-body"
    >
      {wordResults.map((word, index) => {
        const syllables = word.status === 'incorrect'
          ? syllableMap.get(word.expected)
          : undefined

        if (syllables) {
          return <SyllableBreakdown key={index} syllables={syllables} />
        }

        return (
          <span
            key={index}
            aria-label={`${word.expected}: ${WORD_LABEL[word.status]}`}
            className={cn('rounded-md border-b-2 px-0.5', WORD_CLASS[word.status])}
          >
            {word.expected}
          </span>
        )
      })}
    </p>
  )
}
