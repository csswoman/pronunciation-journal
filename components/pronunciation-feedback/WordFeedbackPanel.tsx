'use client'

// Planned structure:
// <WordFeedbackPanel>
//   <WordFeedbackHeader />   (kicker, «X de Y palabras bien», leyenda)
//   <WordChipRow />          (una pastilla por palabra)
//   <WordDiagnosis />        (sonido, diagnóstico, audio, «Cómo se hace»)
//   <WordFeedbackFooter />   (solo variante completa: Repetir / Siguiente)

import { useState } from 'react'
import {
  firstWordToImprove,
  nextWordToImprove,
  type WordFeedback,
} from '@/lib/pronunciation/feedback/word-feedback'
import { WordChipRow } from './WordChipRow'
import { WordDiagnosis } from './WordDiagnosis'
import { WordFeedbackFooter } from './WordFeedbackFooter'
import { WordFeedbackHeader } from './WordFeedbackHeader'

interface Props {
  words: WordFeedback[]
  /**
   * `full`: leyenda, acciones Repetir/Siguiente y «Cómo se hace» abierto.
   * `compact`: solo frase y diagnóstico; «Cómo se hace» plegado.
   */
  variant?: 'full' | 'compact'
  userAudioUrl?: string | null
  onRetry?: () => void
  /** Se llama al pulsar «Continuar» cuando ya no quedan palabras por mejorar. */
  onContinue?: () => void
}

export function WordFeedbackPanel({
  words,
  variant = 'full',
  userAudioUrl,
  onRetry,
  onContinue,
}: Props) {
  const [picked, setPicked] = useState<number | null>(null)
  const isFull = variant === 'full'

  const selected = picked !== null && picked < words.length ? picked : firstWordToImprove(words)
  const word = selected >= 0 ? words[selected] : null
  const next = selected >= 0 ? nextWordToImprove(words, selected) : -1
  const correct = words.filter((w) => w.state === 'good').length

  const handleNext = () => {
    if (next >= 0) setPicked(next)
    else onContinue?.()
  }

  return (
    <section data-testid="word-feedback" aria-label="Tu pronunciación" className="flex w-full flex-col gap-4">
      <WordFeedbackHeader correct={correct} total={words.length} showLegend={isFull} />

      <WordChipRow words={words} selectedIndex={selected} onSelect={setPicked} />

      {word && (
        <WordDiagnosis
          key={selected}
          word={word}
          userAudioUrl={userAudioUrl}
          howToOpen={isFull}
        />
      )}

      {isFull && (onRetry || onContinue) && (
        <WordFeedbackFooter
          hasNext={next >= 0}
          onRetry={onRetry}
          onNext={next >= 0 || onContinue ? handleNext : undefined}
        />
      )}
    </section>
  )
}
