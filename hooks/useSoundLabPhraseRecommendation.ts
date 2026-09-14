import { useMemo } from 'react'
import type { Lesson } from '@/lib/types'
import {
  pickSoundLabPhraseRecommendation,
  type SoundLabPhraseCandidate,
} from '@/lib/sound-lab/recommended-phrase'

export function useSoundLabPhraseRecommendation(
  candidates: readonly SoundLabPhraseCandidate[],
  preferredLesson: Lesson | null,
  soundProgressMap: ReadonlyMap<string, number>,
) {
  return useMemo(
    () => pickSoundLabPhraseRecommendation(candidates, preferredLesson, soundProgressMap),
    [candidates, preferredLesson, soundProgressMap],
  )
}
