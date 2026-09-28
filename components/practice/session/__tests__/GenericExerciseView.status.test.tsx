// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { db } from '@/lib/db'
import { savePracticeAnswer } from '@/lib/practice/queries'
import { recordActivitySession } from '@/lib/progress/activity-hub'
import { buildSessionResult } from '@/lib/practice/session-result'
import type { GenericRenderContext, GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'
import type { GenericPayload, PracticeExercise, PracticeSubmitExtras } from '@/lib/practice/types'
import { GenericExerciseView } from '../GenericExerciseView'
import { buildExerciseResult } from '../session-state-helpers'

// Only the producer is controlled: shell, result builder, query writers and Dexie are real.
let producer: GenericRenderContext
vi.mock('@/lib/practice/exercise-renderer/generic-registry', () => ({
  getGenericTitle: () => 'Fixture',
  getGenericSupportsHint: () => true,
  renderGenericExercise: (_data: unknown, ctx: GenericRenderContext) => {
    producer = ctx
    return <button onClick={() => ctx.onResult(true, 'answer', 900, evidence)}>Responder</button>
  },
}))
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => { throw new Error('This test must stay offline') },
}))

let evidence: GenericRenderExtras & PracticeSubmitExtras & { hintsUsed?: number }
const USER = '00000000-0000-4000-8000-000000000044'
const sourceRef = { source: 'word_bank' as const, id: '550e8400-e29b-41d4-a716-446655440000' }
const exercise: PracticeExercise & { payload: GenericPayload } = {
  id: 'evidence-044', slug: 'fill_blank', exerciseTypeId: 5, contentId: sourceRef.id,
  context: 'practice', sourceRef,
  payload: { kind: 'generic', data: {
    id: 'evidence-044', type: 'fill_blank', sourceRef, level: 'A1',
    topic: 'grammar:present simple', sentence: 'An ___', answer: 'answer', options: [],
  } },
}

beforeEach(async () => {
  evidence = {}
  window.localStorage.clear()
  db.close()
  await db.delete()
  await db.open()
})
afterEach(() => { cleanup(); db.close() })

function mount(current = exercise) {
  const submit = vi.fn(async (isCorrect: boolean, userAnswer: string, extras?: PracticeSubmitExtras) => {
    const result = buildExerciseResult({ current, isCorrect, userAnswer, extras, timeMs: 8000, context: 'practice' })
    await savePracticeAnswer(USER, result)
    await recordActivitySession(USER, { practiceContext: 'practice', sessionResult: buildSessionResult([result]) })
  })
  render(<GenericExerciseView exercise={current} onSubmit={submit} />)
  return submit
}

async function savedAnswer() {
  await waitFor(async () => expect(await db.syncOutbox.filter(row => row.table === 'activity_sessions').count()).toBe(1))
  const rows = await db.syncOutbox.toArray()
  return rows.find(row => row.table === 'answer_history')!.payload
}

describe('GenericExerciseView → real Dexie evidence', () => {
  it.each(['unscored', 'evaluator_failed', 'skipped'] as const)(
    'Continue preserves %s and emits zero SRS effects', async (resultStatus) => {
      evidence = { resultStatus, score: 100 }
      mount()
      fireEvent.click(screen.getByText('Responder'))
      fireEvent.click(screen.getByRole('button', { name: /Continuar/i }))
      expect(await savedAnswer()).toMatchObject({
        grade: null, is_correct: false, exercise_payload: { status: resultStatus, firstTryFailed: false },
      })
      expect(await db.srsRatingEvents.count()).toBe(0)
      expect(await db.srsData.count()).toBe(0)
      const rows = await db.syncOutbox.toArray()
      expect(rows.map(row => row.table).sort()).toEqual(['activity_sessions', 'answer_history'])
      expect(rows.find(row => row.table === 'activity_sessions')!.payload).toMatchObject({
        skill_tags: [], reconciled_step_ids: [],
      })
    },
  )

  it('production preserves child status and does not turn a technical failure into an academic failure', async () => {
    evidence = { resultStatus: 'evaluator_failed' }
    const current: typeof exercise = { ...exercise, slug: 'written_production', exerciseTypeId: 15,
      payload: { kind: 'generic', data: {
        id: 'production', type: 'written_production', sourceRef, level: 'A1',
        targetItem: 'answer', targetMeaning: 'respuesta', taskPrompt: 'Write', exampleSentence: 'An answer.',
      } },
    }
    const submit = mount(current)
    act(() => producer.onResult(false, '', 900, evidence))
    expect(await savedAnswer()).toMatchObject({ grade: null, exercise_payload: { status: 'evaluator_failed', firstTryFailed: false } })
    expect(submit).toHaveBeenCalledWith(false, '', expect.objectContaining({ status: 'evaluator_failed', firstTryFailed: false }))
  })

  it('Continue preserves child metadata and two container hints without double counting', async () => {
    evidence = { score: 30, firstTryFailed: true, hintsUsed: 2, responseTimeMs: 123,
      totalInteractionMs: 5000, attemptId: 'child-attempt', feedback: { immediate: 'Try again' } }
    const submit = mount()
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar pista' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar pista' }))
    fireEvent.click(screen.getByText('Responder'))
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }))
    expect(await savedAnswer()).toMatchObject({ time_ms: 123,
      exercise_payload: { score: 30, hintsUsed: 2, firstTryFailed: true, totalInteractionMs: 5000 } })
    expect(submit).toHaveBeenCalledWith(true, 'answer', expect.objectContaining(evidence))
  })

  it('a technical error followed by a valid evaluation is not penalized as a retry failure', async () => {
    evidence = { resultStatus: 'evaluator_failed', feedback: { immediate: 'Unavailable', canRetry: true } }
    const submit = mount()
    fireEvent.click(screen.getByText('Responder'))
    fireEvent.click(screen.getByRole('button', { name: /Intentar de nuevo/i }))
    evidence = { score: 100 }
    fireEvent.click(screen.getByText('Responder'))
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }))
    expect(await savedAnswer()).toMatchObject({ grade: 5, exercise_payload: { status: 'answered', firstTryFailed: false } })
    expect(submit).toHaveBeenCalledOnce()
  })

  it('skip keeps hints and remains ungraded', async () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar pista' }))
    fireEvent.click(screen.getByRole('button', { name: /Omitir/i }))
    expect(await savedAnswer()).toMatchObject({ grade: null, exercise_payload: { status: 'skipped', hintsUsed: 1 } })
    expect(await db.srsRatingEvents.count()).toBe(0)
  })

  it('an evaluated failure survives a container retry and the next child reporting false', async () => {
    mount()
    act(() => producer.onResult(false, 'wrong', 1100, { hintsUsed: 2, feedback: { immediate: 'Retry', canRetry: true } }))
    fireEvent.click(screen.getByRole('button', { name: /Intentar de nuevo/i }))
    evidence = { firstTryFailed: false, responseTimeMs: 100 }
    fireEvent.click(screen.getByText('Responder'))
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }))
    expect(await savedAnswer()).toMatchObject({ grade: 1, time_ms: 1100, exercise_payload: { firstTryFailed: true, hintsUsed: 2 } })
    expect(await db.srsRatingEvents.count()).toBeGreaterThan(0)
  })

  it('one container hint reaches the payload even when the producer omits its count', async () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar pista' }))
    fireEvent.click(screen.getByText('Responder'))
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }))
    expect(await savedAnswer()).toMatchObject({ grade: 5, exercise_payload: { hintsUsed: 1 } })
  })
})
