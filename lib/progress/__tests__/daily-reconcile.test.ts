import { describe, expect, it } from 'vitest'
import { reconcileDailySteps } from '@/lib/progress/daily-reconcile'
import type { DailyStep, SessionResult } from '@/lib/practice/types'

function emptySession(): SessionResult {
  return { results: [], accuracy: 0, totalTimeMs: 0, bySlug: {} as SessionResult['bySlug'] }
}

function result(
  partial: Partial<SessionResult['results'][number]> &
    Pick<SessionResult['results'][number], 'contentId'>,
): SessionResult['results'][number] {
  const { contentId, ...rest } = partial
  return {
    exerciseId: partial.exerciseId ?? contentId,
    slug: partial.slug ?? 'fill_blank',
    exerciseTypeId: partial.exerciseTypeId ?? 5,
    isCorrect: partial.isCorrect ?? true,
    timeMs: partial.timeMs ?? 1000,
    contentId,
    context: partial.context ?? 'sound_lab',
    completedAt: partial.completedAt ?? new Date(),
    ...rest,
  }
}

const wordReviewStep: DailyStep = {
  kind: 'word_review',
  id: 'word_review',
  title: 'Repaso',
  subtitle: 'test',
  icon: 'BookMarked',
  exercises: [
    {
      id: 'a',
      slug: 'fill_blank',
      exerciseTypeId: 5,
      contentId: 'word-a',
      context: 'daily',
      payload: { kind: 'generic', data: {} as never },
    },
    {
      id: 'b',
      slug: 'fill_blank',
      exerciseTypeId: 5,
      contentId: 'word-b',
      context: 'daily',
      payload: { kind: 'generic', data: {} as never },
    },
  ],
  estMinutes: 3,
}

describe('reconcileDailySteps', () => {
  it('returns empty for daily context', () => {
    const session = {
      ...emptySession(),
      results: [result({ contentId: 'x', context: 'daily' })],
      accuracy: 100,
    }
    expect(reconcileDailySteps([wordReviewStep], session, 'daily')).toEqual([])
  })

  it('resolves word_review after essential words session', () => {
    const session = {
      ...emptySession(),
      results: Array.from({ length: 3 }, (_, i) =>
        result({ contentId: `c1k:w${i}`, context: 'core-1000', slug: 'speak_word' }),
      ),
      accuracy: 90,
    }
    expect(reconcileDailySteps([wordReviewStep], session, 'core-1000')).toContain('word_review')
  })

  it('resolves phoneme_focus when enough answers share soundId', () => {
    const phonemeStep: DailyStep = {
      kind: 'phoneme_focus',
      id: 'phoneme_focus:7',
      title: '/æ/',
      subtitle: 'test',
      icon: 'Waves',
      exercises: [],
      estMinutes: 3,
      ipa: 'æ',
    }
    const session = {
      ...emptySession(),
      results: Array.from({ length: 3 }, (_, i) =>
        result({ contentId: `7:pick_word:w${i}`, soundId: 7, slug: 'pick_word' }),
      ),
      accuracy: 100,
    }
    expect(reconcileDailySteps([phonemeStep], session, 'sound_lab')).toContain('phoneme_focus:7')
  })

  it('resolves word_review on content overlap', () => {
    const session = {
      ...emptySession(),
      results: [result({ contentId: 'word-a' }), result({ contentId: 'word-b' })],
      accuracy: 100,
    }
    expect(reconcileDailySteps([wordReviewStep], session, 'practice')).toContain('word_review')
  })
})
