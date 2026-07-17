'use client'

// Planned structure:
// <PhonemeIntroTray>
//   <TipCard /> — tip cálido para hispanohablantes
//   <ContrastPairs /> — pares mínimos tocables
//   <ArticulationReveal /> — cómo se produce
//   <PrimaryCta />
// </PhonemeIntroTray>

import { Play } from '@/components/icons'
import { PhonemeLessonDetail } from '@/components/phoneme-practice/PhonemeLessonDetail'
import type { PhonemeExtra } from '@/lib/pronunciation/ipa-data'
import { useSpeakWord } from '@/hooks/useSpeakWord'
import { cn } from '@/lib/cn'

interface Props {
  extra: PhonemeExtra | undefined
  showLesson: boolean
  onToggleLesson: () => void
  onStart: () => void
  startLabel: string
}

export function PhonemeIntroTray({
  extra,
  showLesson,
  onToggleLesson,
  onStart,
  startLabel,
}: Props) {
  const { speaking, speak } = useSpeakWord()
  const contrastPairs = extra?.minimalPairs.slice(0, 2) ?? []
  const hasArticulation = (extra?.articulationEs.length ?? 0) > 0

  return (
    <div className="phoneme-intro__tray flex flex-col gap-5 px-5 pb-6 pt-1">
      {extra?.spanishTip && (
        <aside className="phoneme-intro__tip">
          <p className="phoneme-intro__tip-label">El truco</p>
          <p className="phoneme-intro__tip-body">{extra.spanishTip}</p>
        </aside>
      )}

      {contrastPairs.length > 0 && (
        <div className="phoneme-intro__contrast">
          <p className="phoneme-intro__contrast-label">¿Lo oyes distinto?</p>
          <div className="flex flex-col gap-2">
            {contrastPairs.map(({ wordA, wordB }) => (
              <div key={`${wordA}-${wordB}`} className="phoneme-intro__pair">
                <ContrastWord speaking={speaking === wordA} word={wordA} onSpeak={speak} />
                <span className="phoneme-intro__pair-sep" aria-hidden>
                  /
                </span>
                <ContrastWord speaking={speaking === wordB} word={wordB} onSpeak={speak} />
              </div>
            ))}
          </div>
        </div>
      )}

      {showLesson && extra && hasArticulation && (
        <PhonemeLessonDetail extra={extra} articulationOnly />
      )}

      <div className="flex flex-col gap-2 pt-1">
        <button type="button" onClick={onStart} className="pf-cta pf-cta--primary">
          {startLabel}
        </button>

        {hasArticulation && (
          <button
            type="button"
            onClick={onToggleLesson}
            className="phoneme-intro__more"
            aria-expanded={showLesson}
          >
            {showLesson ? 'Ocultar cómo se produce' : 'Cómo se produce este sonido'}
          </button>
        )}
      </div>
    </div>
  )
}

function ContrastWord({
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
        'phoneme-intro__contrast-word',
        speaking && 'phoneme-intro__contrast-word--speaking',
      )}
      aria-label={`Pronunciar ${word}`}
    >
      <Play size={10} className="fill-current" aria-hidden />
      {word}
    </button>
  )
}
