import { describe, expect, it } from 'vitest'
import { reconcileDailySteps } from '@/lib/progress/daily-reconcile'
import type { ExerciseSource } from '@/lib/exercises/types'
import type { DailyStep, ExerciseResult, SessionResult } from '@/lib/practice/types'

function emptySession(): SessionResult {
  return { results: [], accuracy: 0, totalTimeMs: 0, bySlug: {} as SessionResult['bySlug'] }
}

function result(partial: Partial<ExerciseResult> & Pick<ExerciseResult, 'contentId'>): ExerciseResult {
  const { contentId, ...rest } = partial
  return {
    exerciseId: partial.exerciseId ?? contentId,
    slug: partial.slug ?? 'fill_blank',
    exerciseTypeId: partial.exerciseTypeId ?? 5,
    isCorrect: partial.isCorrect ?? true,
    timeMs: partial.timeMs ?? 1000,
    contentId,
    context: partial.context ?? 'practice',
    completedAt: partial.completedAt ?? new Date(),
    ...rest,
  }
}

function step(kind: DailyStep['kind'], id: string, contentIds: string[], source: ExerciseSource = 'word_bank'): DailyStep {
  return {
    kind, id, title: 'Test', subtitle: 'test', icon: 'BookMarked', estMinutes: 3,
    exercises: contentIds.map((contentId, index) => ({
      id: `${id}-${index}`, slug: 'fill_blank', exerciseTypeId: 5, contentId, context: 'daily',
      payload: { kind: 'generic', data: {} as never },
      sourceRef: { source, id: contentId },
    })),
  }
}

const wordReviewStep = step('word_review', 'word_review', ['word-a', 'word-b'])

describe('reconcileDailySteps', () => {
  it('returns empty for Daily, empty, and wholly non-evaluable sessions', () => {
    expect(reconcileDailySteps([wordReviewStep], emptySession(), 'practice')).toEqual([])
    expect(reconcileDailySteps([wordReviewStep], { ...emptySession(), results: [result({ contentId: 'word-a', context: 'daily' })] }, 'daily')).toEqual([])
    for (const status of ['skipped', 'unscored', 'evaluator_failed'] as const) {
      expect(reconcileDailySteps([wordReviewStep], { ...emptySession(), results: [result({ contentId: 'word-a', sourceRef: { source: 'word_bank', id: 'word-a' }, status })] }, 'practice')).toEqual([])
    }
  })

  it('does not resolve word_review from three unrelated Essential Words answers', () => {
    const session = { ...emptySession(), results: ['other-a', 'other-b', 'other-c'].map((contentId) => result({ contentId, context: 'essential-words', sourceRef: { source: 'word_bank', id: contentId } })) }
    expect(reconcileDailySteps([wordReviewStep], session, 'essential-words')).toEqual([])
  })

  it('resolves Essential Words only from the assigned canonical word targets', () => {
    const session = { ...emptySession(), results: [result({ contentId: 'different-presentation', context: 'essential-words', sourceRef: { source: 'word_bank', id: 'word-a' } })] }
    expect(reconcileDailySteps([wordReviewStep], session, 'essential-words')).toEqual(['word_review'])
  })

  it('does not treat equal text from a different source as the same objective', () => {
    const session = { ...emptySession(), results: [result({ contentId: 'word-a', sourceRef: { source: 'grammar_deck', id: 'word-a' } })] }
    expect(reconcileDailySteps([wordReviewStep], session, 'practice')).toEqual([])
  })

  it('uses legacy content ids only when both sides have no sourceRef', () => {
    const legacy = { ...wordReviewStep, exercises: wordReviewStep.exercises.map((exercise) => ({ ...exercise, sourceRef: undefined })) }
    const session = { ...emptySession(), results: [result({ contentId: 'word-a' })] }
    expect(reconcileDailySteps([legacy], session, 'practice')).toEqual(['word_review'])
  })

  it('resolves phoneme focus after three distinct evaluated answers for its exact sound', () => {
    const phonemeStep: DailyStep = { kind: 'phoneme_focus', id: 'phoneme_focus:7', title: '/æ/', subtitle: 'test', icon: 'Waves', exercises: [], estMinutes: 3, ipa: 'æ' }
    const sameSound = { ...emptySession(), results: ['a', 'b', 'c'].map((contentId) => result({ contentId, soundId: 7 })) }
    const otherSound = { ...emptySession(), results: ['a', 'b', 'c'].map((contentId) => result({ contentId, soundId: 8 })) }
    expect(reconcileDailySteps([phonemeStep], sameSound, 'sound_lab')).toEqual(['phoneme_focus:7'])
    expect(reconcileDailySteps([phonemeStep], otherSound, 'sound_lab')).toEqual([])
  })

  it.each(['chunk_review', 'grammar_focus', 'false_friends', 'sentence_builder', 'connected_speech', 'ed_cluster_drill'] as const)(
    'resolves %s only on an evaluated target identity',
    (kind) => {
      const dailyStep = step(kind, `${kind}:target`, ['target-a'], kind === 'grammar_focus' ? 'grammar_deck' : 'word_bank')
      const matched = { ...emptySession(), results: [result({ contentId: 'rendered-differently', sourceRef: dailyStep.exercises[0].sourceRef })] }
      const missed = { ...emptySession(), results: [result({ contentId: 'target-a', sourceRef: { source: 'word_bank', id: 'other-target' } })] }
      expect(reconcileDailySteps([dailyStep], matched, 'practice')).toEqual([dailyStep.id])
      expect(reconcileDailySteps([dailyStep], missed, 'practice')).toEqual([])
    },
  )

  it('does not reconcile a reader without its explicit passage identity', () => {
    const reader: DailyStep = { kind: 'reader', id: 'reader', title: 'Reader', subtitle: 'test', icon: 'Book', exercises: [], estMinutes: 3, readerPassage: { id: 'passage-a' } as DailyStep['readerPassage'] }
    const session = { ...emptySession(), results: [result({ contentId: 'passage-a' })] }
    expect(reconcileDailySteps([reader], session, 'practice')).toEqual([])
  })

  it('resolves only the exact assigned course target', () => {
    const assigned: DailyStep = { kind: 'study_deck', id: 'study_deck:a1:lesson-1', title: 'Estudia teoría', subtitle: 'Lesson 1', icon: 'GraduationCap', exercises: [], estMinutes: 5, href: '/courses/a1/1' }
    const other = { ...assigned, id: 'study_deck:a1:lesson-2' }
    const session = { ...emptySession(), results: [result({ contentId: 'a1:lesson-1:quiz:1', context: 'courses' })] }
    expect(reconcileDailySteps([assigned, other], session, 'courses', { dailyTargetId: 'a1:lesson-1' })).toEqual(['study_deck:a1:lesson-1'])
    expect(reconcileDailySteps([assigned, other], session, 'courses', { dailyTargetId: 'a1:lesson-3' })).toEqual([])
  })

  it('resolves only the assigned immersion lesson from its completed quiz evidence', () => {
    const assigned = step('immersion_lesson', 'immersion_lesson:lesson-a', [])
    const other = step('immersion_lesson', 'immersion_lesson:lesson-b', [])
    const session = {
      ...emptySession(),
      results: [result({
        contentId: 'immersion:lesson-a:q1',
        exercisePayload: { immersionLessonId: 'lesson-a' },
      })],
    }
    expect(reconcileDailySteps([assigned, other], session, 'practice', { immersionLessonId: 'lesson-a' }))
      .toEqual(['immersion_lesson:lesson-a'])
    expect(reconcileDailySteps([assigned, other], session, 'practice', { immersionLessonId: 'lesson-b' }))
      .toEqual([])
  })

})
