'use client'

// Planned structure:
// <PhonemeLessonDetail>
//   <ArticulationSteps /> — instrucciones numeradas del sonido
//   <MinimalPairAudioPills /> — pares mínimos tocables (modo full)
// </PhonemeLessonDetail>

import { Play } from '@/components/icons'
import type { PhonemeExtra } from '@/lib/pronunciation/ipa-data'
import { useSpeakWord } from '@/hooks/useSpeakWord'
import { cn } from '@/lib/cn'

interface Props {
  extra: PhonemeExtra
  /** When true, only articulation steps (pairs live in the intro tray). */
  articulationOnly?: boolean
}

export function PhonemeLessonDetail({ extra, articulationOnly = false }: Props) {
  const { speaking, speak } = useSpeakWord()
  const showPairs = !articulationOnly && extra.minimalPairs.length > 0

  return (
    <div className="flex flex-col gap-4">
      {extra.articulationEs.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-fg-secondary">
            Cómo se produce
          </p>
          <ol className="flex flex-col gap-2">
            {extra.articulationEs.map((step, i) => (
              <li key={step} className="flex gap-2.5 text-sm text-fg-secondary">
                <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-surface-base text-[10px] font-bold text-fg-subtle">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {showPairs && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-fg-secondary">
            Pares mínimos
          </p>
          <div className="flex flex-wrap gap-1.5">
            {extra.minimalPairs.map(({ wordA, wordB }) => (
              <span key={`${wordA}-${wordB}`} className="inline-flex items-center gap-1">
                <PairWordButton speaking={speaking === wordA} word={wordA} onSpeak={speak} />
                <span className="text-xs text-fg-subtle" aria-hidden>/</span>
                <PairWordButton speaking={speaking === wordB} word={wordB} onSpeak={speak} />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PairWordButton({
  speaking,
  word,
  onSpeak,
}: {
  speaking: boolean
  word: string
  onSpeak: (word: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSpeak(word)}
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-surface-base px-2.5 py-1 text-xs font-medium text-fg-secondary transition-colors hover:text-fg',
        speaking && 'bg-primary/10 text-primary',
      )}
      aria-label={`Pronunciar ${word}`}
    >
      <Play size={8} className="fill-current" aria-hidden />
      {word}
    </button>
  )
}
