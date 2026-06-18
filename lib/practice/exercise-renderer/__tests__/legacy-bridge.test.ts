import { describe, it, expect } from 'vitest'
import { toLegacyExercise } from '../legacy-bridge'
import type { PhonemePayload, PracticeExercise } from '@/lib/practice/types'

describe('toLegacyExercise', () => {
  it('maps discrimination stimuli back to the legacy exercise shape', () => {
    const payload: PhonemePayload = {
      kind: 'phoneme',
      ipa: 'iː',
      options: [
        { id: 'same', label: 'Igual', isCorrect: false },
        { id: 'diff', label: 'Diferente', isCorrect: true },
      ],
      correctIds: ['diff'],
      stimuli: [
        { word: 'seat', ipa: 'iː' },
        { word: 'sit', ipa: 'ɪ' },
      ],
    }
    const exercise: PracticeExercise & { payload: PhonemePayload } = {
      id: 'ax-1',
      slug: 'ax_same_different',
      exerciseTypeId: 12,
      contentId: '7:ax_same_different::same,diff',
      context: 'sound_lab',
      payload,
      soundId: 7,
    }

    const legacy = toLegacyExercise(exercise)

    expect(legacy.type).toBe('ax_same_different')
    expect(legacy.stimuli).toEqual(payload.stimuli)
  })
})
