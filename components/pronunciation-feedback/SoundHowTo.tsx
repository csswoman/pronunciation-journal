// components/pronunciation-feedback/SoundHowTo.tsx
'use client'

// Planned structure:
// <SoundHowTo>  — bloque plegable "Cómo se hace"
//   <button> toggle
//   <div> panel
//     <p> título (hook)
//     <ol> pasos numerados en el color del estado
//     <div> tip en menta con bombilla
//     <MinimalPairs>

import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb } from '@/components/icons'
import { speak } from '@/lib/phoneme-practice/tts'
import { cn } from '@/lib/cn'
import type { WordFeedbackState, WordFix } from '@/lib/pronunciation/feedback/word-feedback'
import { WORD_TONE } from './word-feedback-tone'

interface Props {
  fix: WordFix
  state: WordFeedbackState
  /** Abierto desde el inicio (variante completa); plegado en la compacta. */
  defaultOpen?: boolean
}

export function SoundHowTo({ fix, state, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const pairs = fix.minimalPairs.slice(0, 2)

  if (fix.steps.length === 0 && !fix.tip) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-body-sm font-semibold text-fg-muted transition-colors hover:text-fg focus-ring"
      >
        <span>Cómo se hace</span>
        {open ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
      </button>

      {open && (
        <div className="mt-1 flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-sunken p-4">
          <p className="m-0 text-body-sm font-bold text-fg">{fix.title ?? fix.ipa}</p>

          {fix.steps.length > 0 && (
            <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
              {fix.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-body-sm leading-relaxed text-fg-muted">
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-bold text-ink',
                      WORD_TONE[state].fill,
                    )}
                  >
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}

          {fix.tip && (
            <div className="flex items-start gap-2.5 rounded-xl bg-mint-soft p-3 text-body-sm text-ink">
              <Lightbulb size={16} className="mt-0.5 shrink-0" aria-hidden />
              <p className="m-0 leading-normal">{fix.tip}</p>
            </div>
          )}

          {pairs.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-kicker text-fg-subtle">Compara</span>
              {pairs.flatMap((pair) => [pair.wordA, pair.wordB]).map((word, i) => (
                <button
                  key={`${word}-${i}`}
                  type="button"
                  onClick={() => speak(word)}
                  className="min-h-11 cursor-pointer rounded-full border border-border-subtle px-3 text-body-sm text-fg hover:bg-surface-raised focus-ring"
                >
                  {word}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
