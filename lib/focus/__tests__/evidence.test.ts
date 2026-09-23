import { describe, expect, it } from 'vitest'
import { focusTargetId, focusTargetRefs, reconcileFocusDailySteps, withFocusEvidence } from '../evidence'
import type { DailyStep } from '@/lib/practice/types'
import type { FocusContent } from '../types'
import type { ExerciseResult } from '@/lib/practice/types'

function content(gapIds: string[]): FocusContent {
  return {
    id: 'focus-content', sprintId: 'sprint', kind: 'drill', gapIds,
    body: { sentences: [{ text: 'I walked home.', translation: 'Caminé a casa.', gapWord: 'walked' }] },
    exercises: [], media: { audioNarrationUrl: null, audioSentencesUrls: [], imageSceneUrl: null, imagePromptUrl: null, videoClipUrl: null }, createdAt: new Date().toISOString(),
  }
}

function result(): ExerciseResult {
  return {
    exerciseId: 'exercise-1', slug: 'fill_blank', exerciseTypeId: 5, isCorrect: true,
    userAnswer: 'walked', timeMs: 1000, status: 'answered', contentId: 'exercise-1',
    context: 'practice', exercisePayload: {}, completedAt: new Date(),
  }
}

describe('Focus evidence attribution', () => {
  it('uses its only grammar gap as the canonical topic target', () => {
    const focused = withFocusEvidence(content(['grammar:past simple']), result(), { attemptId: 'attempt', allowTarget: true })
    expect(focusTargetId(content(['grammar:past simple']))).toBe('grammar:past simple')
    expect(focused.attribution).toMatchObject({ srsEligible: true, outcomes: [{ target: { namespace: 'topic', id: 'grammar:past simple' } }] })
    expect(focusTargetRefs([focused])).toEqual(['topic:grammar:past simple'])
  })

  it('keeps multiple, absent, and phoneme gaps as activity without a chosen target', () => {
    for (const gaps of [[], ['grammar:past simple', 'grammar:present perfect'], ['vowel:/ɪ/']]) {
      const focused = withFocusEvidence(content(gaps), result(), { attemptId: 'attempt', allowTarget: true })
      expect(focusTargetId(content(gaps))).toBeNull()
      expect(focused.attribution).toMatchObject({ srsEligible: false, reason: 'no_target' })
      expect(focusTargetRefs([focused])).toEqual([])
    }
  })

  it('does not attribute song word recognition to its surrounding gap', () => {
    const focused = withFocusEvidence(content(['grammar:past simple']), { ...result(), slug: 'speak_word', exerciseTypeId: 10 }, { attemptId: 'attempt', allowTarget: false })
    expect(focused.attribution).toMatchObject({ srsEligible: false, reason: 'no_target' })
  })

  it('reconciles only an evaluated Focus target with the exact Daily selection', () => {
    const focused = withFocusEvidence(content(['grammar:past simple']), result(), { attemptId: 'attempt', allowTarget: true })
    const exact: DailyStep = { kind: 'grammar_focus', id: 'grammar', title: 'Grammar', subtitle: '', icon: 'Book', exercises: [], estMinutes: 3, selection: { reason: 'grammar_slot', targetRefs: ['topic:grammar:past simple'], source: 'test' } }
    const different = { ...exact, id: 'different', selection: { ...exact.selection!, targetRefs: ['topic:grammar:present perfect'] } }
    expect(reconcileFocusDailySteps([exact, different], [focused])).toEqual(['grammar'])
    expect(reconcileFocusDailySteps([exact], [{ ...focused, status: 'skipped' }])).toEqual([])
  })
})
