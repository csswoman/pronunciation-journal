import type { Lesson } from '@/lib/types'
import { ipaFromLessonTitle } from '@/lib/sound-lab/display'

export interface SoundLabPhraseCandidate {
  id: string
  phrase: string
  ipa: string
  meaning: string
  targetIpas: string[]
}

export interface SoundLabPhraseRecommendation extends SoundLabPhraseCandidate {
  reason: string
}

function candidateProgress(
  candidate: SoundLabPhraseCandidate,
  soundProgressMap: ReadonlyMap<string, number>,
): number | null {
  const values = candidate.targetIpas.flatMap((ipa) => {
    const progress = soundProgressMap.get(ipa)
    return progress === undefined ? [] : [progress]
  })
  return values.length > 0 ? Math.min(...values) : null
}

/** Keeps the phrase primary while using existing sound evidence as a bounded tie-breaker. */
export function pickSoundLabPhraseRecommendation(
  candidates: readonly SoundLabPhraseCandidate[],
  preferredLesson: Lesson | null,
  soundProgressMap: ReadonlyMap<string, number>,
): SoundLabPhraseRecommendation | null {
  if (candidates.length === 0) return null

  const preferredIpa = preferredLesson
    ? ipaFromLessonTitle(preferredLesson.title)
    : null
  const preferred = preferredIpa
    ? candidates.find((candidate) => candidate.targetIpas.includes(preferredIpa))
    : undefined

  if (preferred) {
    return {
      ...preferred,
      reason: 'Retoma un sonido que ya empezaste, ahora dentro de una frase útil.',
    }
  }

  const practiced = candidates
    .map((candidate) => ({ candidate, progress: candidateProgress(candidate, soundProgressMap) }))
    .filter((entry): entry is { candidate: SoundLabPhraseCandidate; progress: number } =>
      entry.progress !== null,
    )
    .sort((left, right) => left.progress - right.progress)[0]

  if (practiced) {
    return {
      ...practiced.candidate,
      reason: 'Refuerza un sonido que necesita práctica, sin separarlo de la frase.',
    }
  }

  return {
    ...candidates[0],
    reason: 'Empieza con una frase cotidiana y usa el sonido como apoyo.',
  }
}
