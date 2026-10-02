// components/ai-coach/missions/scripted/LineResult.tsx
'use client'

// Planned structure:
// <LineResult>  — resultado de un turno hablado: delega todo en el panel compartido
//   <WordFeedbackPanel variant="full" />

import { WordFeedbackPanel } from '@/components/pronunciation-feedback/WordFeedbackPanel'
import { useWordFeedback } from '@/hooks/useWordFeedback'
import type { WordResult } from '@/lib/types'

interface Props {
  wordResults: WordResult[]
  userAudioUrl: string | null | undefined
  onRetry: () => void
  onContinue: () => void
}

export function LineResult({ wordResults, userAudioUrl, onRetry, onContinue }: Props) {
  const words = useWordFeedback(wordResults)

  return (
    <WordFeedbackPanel
      words={words}
      variant="full"
      userAudioUrl={userAudioUrl}
      onRetry={onRetry}
      onContinue={onContinue}
    />
  )
}
