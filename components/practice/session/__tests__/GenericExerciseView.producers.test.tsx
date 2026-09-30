// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { db } from '@/lib/db'
import type { GenericPayload, PracticeExercise } from '@/lib/practice/types'
import { GenericExerciseView } from '../GenericExerciseView'
import { useSessionState } from '../useSessionState'

// Actual producers, registry, session hook and Dexie. Replace only external capabilities.
const seams = vi.hoisted(() => ({
  online: false, supported: true, getStream: vi.fn(), release: vi.fn(),
  reset: vi.fn(), start: vi.fn(), stop: vi.fn(), grade: vi.fn(), clearError: vi.fn(),
  speechState: 'idle' as 'idle' | 'done', transcript: '',
}))
const USER = '00000000-0000-4000-8000-000000000044'
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: USER } }),
  useAuthOptional: () => ({ user: { id: USER } }),
}))
vi.mock('@/hooks/useVoiceRotation', () => ({ useVoiceRotation: () => ({ currentVoice: 'a', nextVoice: vi.fn() }) }))
vi.mock('@/lib/ui-sounds/cues', () => ({ playUiCue: vi.fn() }))
vi.mock('@/hooks/useOnlineStatus', () => ({ useOnlineStatus: () => seams.online }))
vi.mock('@/hooks/useProductionGrading', () => ({ useProductionGrading: () => ({
  grade: seams.grade, clearError: seams.clearError, grading: false, error: null, aiBudgetSpent: false,
}) }))
vi.mock('@/hooks/useSharedMicStream', () => ({ useSharedMicStream: () => ({ getStream: seams.getStream, release: seams.release }) }))
vi.mock('@/hooks/useSpeechInput', () => ({ useSpeechInput: () => ({
  state: seams.speechState,
  result: seams.speechState === 'done' ? { transcript: seams.transcript, source: 'browser' } : null,
  error: null, isSupported: seams.supported,
  start: seams.start, stop: seams.stop, reset: seams.reset,
}) }))
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => { throw new Error('No remote access in offline roundtrip') },
}))
vi.mock('@/lib/sync/sync-manager', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/sync/sync-manager')>(),
  flushOutbox: vi.fn().mockResolvedValue({ synced: 0, failed: 0, skipped: 0, operations: [] }),
}))

function production(type: 'written_production' | 'spoken_production'): PracticeExercise & { payload: GenericPayload } {
  const sourceRef = { source: 'word_bank' as const, id: '550e8400-e29b-41d4-a716-446655440000' }
  return {
    id: type, slug: type, exerciseTypeId: type === 'written_production' ? 15 : 16,
    contentId: sourceRef.id, context: 'practice', sourceRef,
    payload: { kind: 'generic', data: {
      id: type, type, sourceRef, level: 'A1', targetItem: 'home', taskPrompt: 'Write about home.',
      exampleSentence: 'I am at home.', topic: 'grammar:present simple',
    } },
  }
}

// Planned structure: <Harness><GenericExerciseView /></Harness>
function Harness({ exercise }: { exercise: ReturnType<typeof production> }) {
  const session = useSessionState({ context: 'practice', exercises: [exercise], onSessionComplete: vi.fn() })
  return <GenericExerciseView exercise={exercise} onSubmit={session.handleSubmit} />
}

beforeEach(async () => {
  vi.clearAllMocks()
  seams.online = false
  seams.supported = true
  seams.speechState = 'idle'
  seams.transcript = ''
  seams.grade.mockReset()
  seams.reset.mockImplementation(() => { seams.speechState = 'idle' })
  window.localStorage.clear()
  db.close()
  await db.delete()
  await db.open()
})
afterEach(() => { cleanup(); db.close() })

async function expectNoEvaluatedEvidence(status: 'unscored' | 'skipped') {
  await waitFor(async () => {
    const rows = await db.syncOutbox.toArray()
    expect(rows.find(row => row.table === 'activity_sessions')).toBeDefined()
  }, { timeout: 5000 })
  const rows = await db.syncOutbox.toArray()
  expect(rows.find(row => row.table === 'answer_history')!.payload).toMatchObject({
    grade: null, is_correct: false, exercise_payload: { status, firstTryFailed: false },
  })
  expect(rows.map(row => row.table).sort()).toEqual(['activity_sessions', 'answer_history'])
  expect(rows.find(row => row.table === 'activity_sessions')!.payload).toMatchObject({ skill_tags: [], reconciled_step_ids: [] })
  expect(await db.srsRatingEvents.count()).toBe(0)
  expect(await db.srsData.count()).toBe(0)
  expect(seams.grade).not.toHaveBeenCalled()
}

describe('real producers → session → Dexie', () => {
  it('offline self-check is activity without an SRS grade', async () => {
    render(<Harness exercise={production('written_production')} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'I am at home.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Autoevaluar con ejemplo' }))
    await expectNoEvaluatedEvidence('unscored')
  })

  it('unsupported microphone finishes unscored', async () => {
    seams.supported = false
    render(<Harness exercise={production('spoken_production')} />)
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }))
    await expectNoEvaluatedEvidence('unscored')
  })

  it('denied microphone permits skip without recording a student failure', async () => {
    seams.online = true
    seams.getStream.mockRejectedValueOnce(new Error('not-allowed'))
    render(<Harness exercise={production('spoken_production')} />)
    fireEvent.click(screen.getByRole('button', { name: 'Grabar mi voz' }))
    await screen.findByText(/Se denegó el acceso al micrófono/)
    fireEvent.click(screen.getByRole('button', { name: /Omitir/i }))
    await expectNoEvaluatedEvidence('skipped')
  })

  it.each(['written_production', 'spoken_production'] as const)(
    '%s retains an internal academic failure after a successful retry', async (type) => {
      seams.online = true
      seams.grade.mockResolvedValueOnce({
        correct: false, usedTarget: true, grammaticallyCorrect: false, score: 20, feedback: 'First evaluation failed.',
      }).mockResolvedValueOnce({
        correct: true, usedTarget: true, grammaticallyCorrect: true, score: 100, feedback: 'Second evaluation passed.',
      })
      const exercise = production(type)
      const view = render(<Harness exercise={exercise} />)
      const answer = (text: string) => {
        if (type === 'written_production') {
          fireEvent.change(screen.getByRole('textbox'), { target: { value: text } })
          fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
        } else {
          seams.speechState = 'done'
          seams.transcript = text
          view.rerender(<Harness exercise={exercise} />)
        }
      }
      answer('I at home.')
      await screen.findByText('First evaluation failed.')
      fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }))
      answer('I am at home.')
      await screen.findByText('Second evaluation passed.')
      fireEvent.click(screen.getByRole('button', { name: /^Continuar$/i }))
      await waitFor(async () => {
        const row = await db.syncOutbox.filter(entry => entry.table === 'answer_history').first()
        expect(row?.payload).toMatchObject({
          grade: 1, is_correct: true, exercise_payload: { status: 'answered', firstTryFailed: true, score: 100 },
        })
      })
    },
  )

  it('an unavailable written evaluator followed by a valid result keeps full quality', async () => {
    seams.online = true
    seams.grade.mockResolvedValueOnce(null).mockResolvedValueOnce({
      correct: true, usedTarget: true, grammaticallyCorrect: true, score: 100, feedback: 'Evaluated now.',
    })
    render(<Harness exercise={production('written_production')} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'I am at home.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    await waitFor(() => expect(seams.grade).toHaveBeenCalledTimes(1))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    await screen.findByText('Evaluated now.')
    fireEvent.click(screen.getByRole('button', { name: /^Continuar$/i }))
    await waitFor(async () => {
      const row = await db.syncOutbox.filter(entry => entry.table === 'answer_history').first()
      expect(row?.payload).toMatchObject({ grade: 5, exercise_payload: { firstTryFailed: false } })
    })
  })
})
