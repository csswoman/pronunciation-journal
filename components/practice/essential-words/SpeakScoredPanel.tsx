'use client'

import { SelfPlaybackAudioBar } from '@/components/pronunciation/SelfPlaybackAudioBar'
import { WordFeedbackPanel } from '@/components/pronunciation-feedback/WordFeedbackPanel'
import { useWordFeedback } from '@/hooks/useWordFeedback'
import { QuietSpeakFeedback } from './QuietSpeakFeedback'
import { InlineFeedback } from '@/components/practice/session/InlineFeedback'
import {
  PracticeActionBar,
  PracticeContinueButton,
} from '@/components/practice/session/PracticeActionBar'
import { PillButton } from '@/components/ui/PillButton'
import type { WordResult } from '@/lib/types'

// Planned structure:
// <SpeakScoredPanel>
//   <InlineFeedback + QuietSpeakFeedback />
//   <WordFeedbackPanel compact />   — palabras por color + diagnóstico del sonido
//   <SelfPlaybackAudioBar />        — tu grabación vs. el modelo
//   <PracticeActionBar />
// </SpeakScoredPanel>

interface SpeakScoredPanelProps {
  score: number
  feedbackMessage: string | null
  wordResults: WordResult[]
  /** Texto del modelo, para reproducirlo con el TTS del navegador. */
  modelText: string
  /** Grabación del intento, solo en memoria. Null si no se pudo grabar. */
  userAudioUrl: string | null
  isSubmitting: boolean
  submitError: string | null
  onRetry: () => void
  onContinue: () => void
}

export function SpeakScoredPanel({
  score,
  feedbackMessage,
  wordResults,
  modelText,
  userAudioUrl,
  isSubmitting,
  submitError,
  onRetry,
  onContinue,
}: SpeakScoredPanelProps) {
  const words = useWordFeedback(wordResults)

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <InlineFeedback isCorrect={score >= 70} />
      {feedbackMessage && (
        <QuietSpeakFeedback accuracy={score} message={feedbackMessage} />
      )}
      <WordFeedbackPanel words={words} variant="compact" />
      <SelfPlaybackAudioBar targetWord={modelText} userAudioUrl={userAudioUrl} />
      <PracticeActionBar>
        <PillButton variant="outline" size="md" className="w-full" onClick={onRetry}>
          Intentar de nuevo
        </PillButton>
        <PracticeContinueButton
          onClick={onContinue}
          disabled={isSubmitting}
          isLoading={isSubmitting}
          shortcutLabel="Enter"
        >
          Guardar y ver la siguiente
        </PracticeContinueButton>
      </PracticeActionBar>
      {submitError && <p className="m-0 text-center text-caption text-error">{submitError}</p>}
    </div>
  )
}
