// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { db } from '@/lib/db'
import { saveCachedDailyPlan } from '@/lib/daily/plan-storage'
import type { DailyStep } from '@/lib/practice/types'
import type { FocusContent, FocusSprint } from '@/lib/focus/types'
import { FocusContentViewer } from '../FocusContentViewer'

/**
 * Focus runtime exit: real viewer + runner + exercise widget clicks into the
 * real sprint, answer and activity writers. Only auth and the flush are stubbed.
 */
const USER = '00000000-0000-4000-8000-000000000130'
const SPRINT = 'focus-sprint-127'

vi.mock('@/components/auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: USER } }) }))
vi.mock('@/lib/sync/sync-manager', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/sync/sync-manager')>(),
  flushOutbox: vi.fn().mockResolvedValue({ synced: 0, failed: 0, skipped: 0, operations: [] }),
}))

function content(gapIds: string[]): FocusContent {
  const id = `focus-content-${gapIds.length}`
  return {
    id, userId: USER, sprintId: SPRINT, kind: 'story', gapIds,
    body: { title: 'Last weekend', passage: 'I walked home.', explanation: 'Past simple.', keyPhrases: [] },
    exercises: [{
      id: 'focus-mc-1', type: 'multiple_choice', sourceRef: { source: 'focus_content', id }, question: 'Yesterday I ___ home.',
      options: ['walked', 'walk', 'walking', 'walks'], answerIndex: 0,
    }],
    media: { audioNarrationUrl: null, audioSentencesUrls: [], imageSceneUrl: null, imagePromptUrl: null, videoClipUrl: null },
    createdAt: new Date().toISOString(),
  }
}

function grammarStep(id: string, target: string): DailyStep {
  return {
    kind: 'grammar_focus', id, title: id, subtitle: '', icon: 'Book', exercises: [], estMinutes: 3,
    selection: { reason: 'grammar_slot', targetRefs: [target], source: 'fixture' },
  }
}

async function outbox(table: string) {
  return (await db.syncOutbox.where('userId').equals(USER).toArray()).filter((entry) => entry.table === table)
}

async function answerFocusExercise(focus: FocusContent) {
  await db.focusContent.put(focus)
  render(<FocusContentViewer content={focus} sprintId={SPRINT} />)
  fireEvent.click(screen.getByRole('button', { name: 'Comenzar ejercicios' }))
  fireEvent.click(await screen.findByRole('button', { name: /^walked$/ }))
  fireEvent.click(await screen.findByRole('button', { name: /continuar/i }))
  await screen.findByText('Práctica terminada')
  await waitFor(async () => expect(await outbox('activity_sessions')).toHaveLength(1))
}

beforeEach(async () => {
  window.localStorage.clear()
  db.close()
  await db.delete()
  await db.open()
  const now = Date.now()
  const sprint: FocusSprint = {
    id: SPRINT, userId: USER, gaps: [], status: 'active',
    startsAt: new Date(now - 60_000).toISOString(), endsAt: new Date(now + 6 * 86_400_000).toISOString(),
    createdAt: new Date(now - 60_000).toISOString(),
  }
  await db.focusSprints.put(sprint)
})

afterEach(() => db.close())

describe('FocusContentViewer runtime exit', { timeout: 20_000 }, () => {
  it('answers write topic evidence and reconcile only the exact Focus target step', async () => {
    saveCachedDailyPlan(USER, {
      steps: [grammarStep('grammar', 'topic:grammar:past simple'), grammarStep('other', 'topic:grammar:present perfect')],
      totalExercises: 0, isNewUser: false,
    })

    await answerFocusExercise(content(['grammar:past simple']))

    const [answer] = await outbox('answer_history')
    expect(answer?.payload).toMatchObject({
      id: expect.stringMatching(/^[0-9a-f-]{36}:.+/), user_id: USER, is_correct: true, topic: 'grammar:past simple',
      exercise_payload: expect.objectContaining({ focusTargetId: 'grammar:past simple' }),
    })
    expect((await outbox('activity_sessions'))[0]?.payload).toMatchObject({
      id: expect.stringMatching(/^focus:/), exercises_total: 1, reconciled_step_ids: ['grammar'],
    })
    expect((await db.focusSprints.get(SPRINT))?.practice).toBeDefined()
  })

  it('content without a single grammar gap stays activity-only and resolves nothing', async () => {
    saveCachedDailyPlan(USER, { steps: [grammarStep('grammar', 'topic:grammar:past simple')], totalExercises: 0, isNewUser: false })

    await answerFocusExercise(content([]))

    expect((await outbox('answer_history'))[0]?.payload).toMatchObject({
      exercise_payload: expect.objectContaining({ attribution: expect.objectContaining({ srsEligible: false }) }),
    })
    expect((await outbox('activity_sessions'))[0]?.payload).toMatchObject({ reconciled_step_ids: [] })
  })

  it('starting without answering writes no answer or activity', async () => {
    const focus = content(['grammar:past simple'])
    await db.focusContent.put(focus)
    render(<FocusContentViewer content={focus} sprintId={SPRINT} />)
    fireEvent.click(screen.getByRole('button', { name: 'Comenzar ejercicios' }))
    await screen.findByRole('button', { name: /^walked$/ })

    expect(await outbox('answer_history')).toEqual([])
    expect(await outbox('activity_sessions')).toEqual([])
  })
})
