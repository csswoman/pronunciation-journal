'use client'

import { PhonemeFeedbackTable } from '@/components/lesson/PhonemeFeedbackTable'
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
//   <PracticeActionBar />
//   <phoneme detail toggle + PhonemeFeedbackTable />
// </SpeakScoredPanel>

interface SpeakScoredPanelProps {
  score: number
  feedbackMessage: string | null
  wordResults: WordResult[]
  showSoundDetail: boolean
  isSubmitting: boolean
  submitError: string | null
  onToggleSoundDetail: () => void
  onRetry: () => void
  onContinue: () => void
}

export function SpeakScoredPanel({
  score,
  feedbackMessage,
  wordResults,
  showSoundDetail,
  isSubmitting,
  submitError,
  onToggleSoundDetail,
  onRetry,
  onContinue,
}: SpeakScoredPanelProps) {
  const hasPhonemeDetail = wordResults.some((word) => word.phonemes?.alignment?.length)

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <InlineFeedback isCorrect={score >= 70} />
      {feedbackMessage && (
        <QuietSpeakFeedback accuracy={score} message={feedbackMessage} />
      )}
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
      {hasPhonemeDetail && (
        <div className="flex w-full flex-col items-center gap-3">
          <button
            type="button"
            aria-expanded={showSoundDetail}
            onClick={onToggleSoundDetail}
            className="rounded-md px-2 py-1 text-caption font-semibold text-primary transition-colors hover:bg-primary-soft focus-ring"
          >
            {showSoundDetail ? 'Ocultar detalle de sonidos' : 'Ver detalle de sonidos'}
          </button>
          {showSoundDetail && <PhonemeFeedbackTable wordResults={wordResults} />}
        </div>
      )}
      {submitError && <p className="m-0 text-center text-caption text-error">{submitError}</p>}
    </div>
  )
}
