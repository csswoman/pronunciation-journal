import { describe, expect, it } from 'vitest'
import {
  resolvePrimarySound,
  sortStepsByPedagogicalProgression,
} from '../candidate-helpers'
import type { Sound } from '@/lib/phoneme-practice/types'
import type { UserLearningState } from '@/lib/ai-practice/learning-state'
import type { DailyStep } from '@/lib/practice/types'

const soundA: Sound = {
  id: 1,
  ipa: 'θ',
  example: 'think',
  category: 'consonant',
  type: 'fricative',
  difficulty: 1,
}

const soundB: Sound = {
  id: 2,
  ipa: 's',
  example: 'sink',
  category: 'consonant',
  type: 'fricative',
  difficulty: 1,
}

const allSounds = [soundA, soundB]

describe('resolvePrimarySound', () => {
  it('prioritizes urgent oral production struggling sound over general weakest sound', () => {
    const aiState = {
      pronunciation: {
        averageAccuracy: 60,
        strugglingSounds: [
          { ipa: 'θ', avgAccuracy: 45, attempts: 2 },
        ],
      },
    } as unknown as UserLearningState

    // Even if soundB is the general weakest, soundA has urgent oral failure
    const chosen = resolvePrimarySound(soundB, aiState, allSounds)
    expect(chosen).toBe(soundA)
  })

  it('prioritizes diagnosticSound over general weakest sound when no urgent oral struggles exist', () => {
    const aiState = {
      pronunciation: {
        averageAccuracy: 80,
        strugglingSounds: [
          { ipa: 'θ', avgAccuracy: 75, attempts: 2 }, // > 65%, not urgent
        ],
      },
    } as unknown as UserLearningState

    const chosen = resolvePrimarySound(soundB, aiState, allSounds, soundA)
    expect(chosen).toBe(soundA)
  })

  it('falls back to weakest sound when no diagnostic sound or urgent oral struggles exist', () => {
    const aiState = {
      pronunciation: {
        averageAccuracy: 80,
        strugglingSounds: [
          { ipa: 'θ', avgAccuracy: 75, attempts: 2 }, // > 65%, not urgent
        ],
      },
    } as unknown as UserLearningState

    const chosen = resolvePrimarySound(soundB, aiState, allSounds, null)
    expect(chosen).toBe(soundB)
  })

  it('falls back to worst struggling sound when weakest is null', () => {
    const aiState = {
      pronunciation: {
        averageAccuracy: 60,
        strugglingSounds: [
          { ipa: 'θ', avgAccuracy: 68, attempts: 3 },
        ],
      },
    } as unknown as UserLearningState

    const chosen = resolvePrimarySound(null, aiState, allSounds)
    expect(chosen).toBe(soundA)
  })

  it('falls back to seed sound when there is no progress or aiState', () => {
    const chosen = resolvePrimarySound(null, null, allSounds)
    expect(allSounds).toContain(chosen)
  })
})

describe('sortStepsByPedagogicalProgression', () => {
  it('orders perception (minimal_pairs) before production (spoken_production)', () => {
    const steps = [
      { kind: 'spoken_production', id: 'step-sp' } as unknown as DailyStep,
      { kind: 'minimal_pairs', id: 'step-mp' } as unknown as DailyStep,
      { kind: 'phoneme_focus', id: 'step-pf' } as unknown as DailyStep,
    ]

    const sorted = sortStepsByPedagogicalProgression(steps)
    expect(sorted.map((s) => s.kind)).toEqual(['minimal_pairs', 'phoneme_focus', 'spoken_production'])
  })

  it('orders journal_entry at the very end as an optional reflection step', () => {
    const steps = [
      { kind: 'concept', id: 'journal_entry' } as unknown as DailyStep,
      { kind: 'spoken_production', id: 'step-sp' } as unknown as DailyStep,
      { kind: 'minimal_pairs', id: 'step-mp' } as unknown as DailyStep,
      { kind: 'phoneme_focus', id: 'step-pf' } as unknown as DailyStep,
    ]

    const sorted = sortStepsByPedagogicalProgression(steps)
    expect(sorted.map((s) => s.id)).toEqual(['step-mp', 'step-pf', 'step-sp', 'journal_entry'])
  })
})
