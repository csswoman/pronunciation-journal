import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Acceptance inventory: a case reference is required, but its tier remains explicit. */
const exits = [
  { surface: 'PracticeSession', owner: 'answer_history', answerId: 'attemptId', activity: 'activity_sessions', reconcile: 'matching Daily target', forbidden: 'skip', tier: 'component', file: 'components/practice/session/__tests__/useSessionState.progressStatus.test.tsx', caseName: 'never overwrites an earlier answer enqueue error' },
  { surface: 'Essential Words', owner: 'essential_words', answerId: 'attemptId', activity: 'activity_sessions', reconcile: 'assigned word only', forbidden: 'empty dictation', tier: 'writer-mocked', file: 'lib/essential-words/__tests__/runtime-engine.integration.test.ts', caseName: 'un dictado vacío no acredita production' },
  { surface: 'chunks', owner: 'chunk_srs', answerId: 'attemptId', activity: 'activity_sessions', reconcile: 'canonical chunk id', forbidden: 'exposure', tier: 'contract', file: 'lib/practice/__tests__/chunk-attribution.test.ts', caseName: 'attributes objective answers to the canonical chunk id' },
  { surface: 'courses', owner: 'topic_srs', answerId: 'attemptId', activity: 'activity_sessions', reconcile: 'exact study deck', forbidden: 'navigation', tier: 'runtime', file: 'lib/learning-loop/__tests__/roundtrip.integration.test.ts', caseName: 'keeps selection, writers, reconciliation, and progress projections exact' },
  { surface: 'missions', owner: 'pronunciation_feedback_evidence', answerId: 'launchId + turn', activity: 'activity_sessions', reconcile: 'canonical launch step', forbidden: 'unscored turn', tier: 'writer-mocked', file: 'lib/ai-practice/missions/__tests__/persistence.test.ts', caseName: 'writes one answer and one coherent activity summary' },
  { surface: 'Focus', owner: 'answer_history', answerId: 'executionId + exerciseId', activity: 'activity_sessions', reconcile: 'exact Focus target', forbidden: 'started', tier: 'contract', file: 'lib/focus/__tests__/evidence.test.ts', caseName: 'reconciles only an evaluated Focus target' },
  { surface: '-ed', owner: 'ed_cluster_attempts', answerId: 'attempt.id', activity: 'activity_sessions', reconcile: 'explicit Daily step', forbidden: 'opening drill', tier: 'contract', file: 'lib/pronunciation/ed-drills/__tests__/progress.test.ts', caseName: 'recordAttempt' },
  { surface: 'immersion', owner: 'immersion_lesson_progress', answerId: 'attemptId + questionId', activity: 'activity_sessions', reconcile: 'exact immersion lesson', forbidden: 'watched only', tier: 'runtime', file: 'lib/learning-loop/__tests__/roundtrip.integration.test.ts', caseName: 'persists immersion quiz selections once per attempt' },
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
      expect(readFileSync(resolve(entry.file), 'utf8')).toContain(entry.caseName)
    }
  })
})
