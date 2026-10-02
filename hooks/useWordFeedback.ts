'use client'

import { useMemo } from 'react'
import { useSyllableFeedback } from '@/hooks/useSyllableFeedback'
import { buildWordFeedback, type WordFeedback } from '@/lib/pronunciation/feedback/word-feedback'
import type { WordResult } from '@/lib/types'

/** Scored words → per-word diagnoses (resolves syllable mapping asynchronously). */
export function useWordFeedback(wordResults: WordResult[]): WordFeedback[] {
  const syllableMap = useSyllableFeedback(wordResults)
  return useMemo(() => buildWordFeedback(wordResults, syllableMap), [wordResults, syllableMap])
}
