import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Acceptance inventory: a case reference is required, but its tier remains explicit.
 * Every tier below runs the production answer/activity writers against a real
 * outbox; `hook-`/`component-runtime` drive them through the public UI seam.
 */
const exits = [
  { surface: 'PracticeSession', owner: 'answer_history', answerId: 'sessionId + index + exerciseId (attemptId)', activity: 'activity_sessions', reconcile: 'matching Daily target', forbidden: 'skip', tier: 'hook-runtime', file: 'components/practice/session/__tests__/useSessionState.roundtrip.test.tsx', caseName: 'a skipped-only session writes no chunk SRS and resolves no step' },
  { surface: 'Essential Words', owner: 'essential_words', answerId: 'attemptId', activity: 'activity_sessions', reconcile: 'assigned word only', forbidden: 'empty dictation', tier: 'runtime', file: 'lib/essential-words/__tests__/runtime-writers.integration.test.ts', caseName: 'an empty dictation is recorded as a failed answer without production credit' },
  { surface: 'chunks', owner: 'chunk_srs', answerId: 'sessionId + index + exerciseId (attemptId)', activity: 'activity_sessions', reconcile: 'canonical chunk id', forbidden: 'exposure', tier: 'hook-runtime', file: 'components/practice/session/__tests__/useSessionState.roundtrip.test.tsx', caseName: 'writes answers, canonical chunk SRS and reconciles only the practised chunk step' },
  { surface: 'courses', owner: 'topic_srs', answerId: 'attemptId + questionId', activity: 'activity_sessions', reconcile: 'exact study deck', forbidden: 'navigation', tier: 'runtime', file: 'lib/learning-loop/__tests__/producer-roundtrip.integration.test.ts', caseName: 'writes each answer and reconciles only the exact study deck' },
  { surface: 'missions', owner: 'pronunciation_feedback_evidence', answerId: 'launchId + turn', activity: 'activity_sessions', reconcile: 'canonical launch step', forbidden: 'unscored turn', tier: 'runtime', file: 'lib/learning-loop/__tests__/producer-roundtrip.integration.test.ts', caseName: 'an unscored-only mission keeps activity but writes no answer, evidence or reconciliation' },
  { surface: 'Focus', owner: 'answer_history', answerId: 'executionId + exerciseId', activity: 'activity_sessions', reconcile: 'exact Focus target', forbidden: 'started', tier: 'component-runtime', file: 'components/focus/__tests__/FocusContentViewer.roundtrip.test.tsx', caseName: 'starting without answering writes no answer or activity' },
  { surface: '-ed', owner: 'ed_cluster_attempts', answerId: 'attempt.id', activity: 'activity_sessions', reconcile: 'explicit Daily step', forbidden: 'opening drill', tier: 'component-runtime', file: 'components/pronunciation/ed-drills/__tests__/EdDrillSession.roundtrip.test.tsx', caseName: 'opening the drill and finishing without an evaluated attempt writes nothing' },
  { surface: 'immersion', owner: 'immersion_lesson_progress', answerId: 'attemptId + questionId', activity: 'activity_sessions', reconcile: 'exact immersion lesson', forbidden: 'watched only', tier: 'runtime', file: 'lib/learning-loop/__tests__/producer-roundtrip.integration.test.ts', caseName: 'reconciles the exact immersion lesson step in the same activity row' },
  { surface: 'games', owner: 'activity_sessions', answerId: 'none', activity: 'activity_sessions', reconcile: 'none', forbidden: 'answer evidence', tier: 'runtime', file: 'lib/learning-loop/__tests__/roundtrip.integration.test.ts', caseName: 'records %s activity without answer evidence' },
  { surface: 'reader', owner: 'answer_history', answerId: 'passageId', activity: 'activity_sessions', reconcile: 'none', forbidden: 'passage exposure', tier: 'runtime', file: 'lib/learning-loop/__tests__/roundtrip.integration.test.ts', caseName: 'persists a completed Reader task' },
] as const

describe('runtime learning-exit acceptance inventory', () => {
  it('has a named case and negative signal for every declared surface', () => {
    expect(exits.map((entry) => entry.surface)).toEqual([
      'PracticeSession', 'Essential Words', 'chunks', 'courses', 'missions',
      'Focus', '-ed', 'immersion', 'games', 'reader',
    ])
    for (const entry of exits) {
      expect(entry.owner && entry.answerId && entry.activity && entry.reconcile && entry.forbidden).toBeTruthy()
      expect(entry.tier).toMatch(/runtime$/)
      expect(readFileSync(resolve(entry.file), 'utf8')).toContain(entry.caseName)
    }
  })
})
