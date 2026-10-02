'use client'

// Planned structure:
// <WordFeedbackHeader>
//   <div> kicker «TU PRONUNCIACIÓN» + «X de Y palabras bien»
//   <ul> leyenda Bien · Casi · No se oyó (solo variante completa)

import { cn } from '@/lib/cn'
import { WORD_TONE, WORD_TONE_ORDER } from './word-feedback-tone'

interface Props {
  correct: number
  total: number
  showLegend: boolean
}

export function WordFeedbackHeader({ correct, total, showLegend }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div>
        <p className="m-0 font-kicker text-fg-subtle">TU PRONUNCIACIÓN</p>
        <h3 className="m-0 font-display text-2xl font-bold text-fg text-balance">
          {correct} de {total} palabras bien
        </h3>
      </div>

      {showLegend && (
        <ul className="m-0 flex list-none items-center gap-3 p-0 pt-1 text-caption font-medium text-fg-muted">
          {WORD_TONE_ORDER.map((state) => (
            <li key={state} className="inline-flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', WORD_TONE[state].dot)} aria-hidden="true" />
              {WORD_TONE[state].label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
