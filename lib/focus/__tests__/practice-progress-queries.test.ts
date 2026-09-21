// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { recordFocusPractice } from '../queries'
import type { FocusContent, FocusSprint } from '../types'

const userId = 'guest-local-user'
const sprintId = 'sprint-progress-test'
const contentId = 'content-progress-test'

beforeEach(async () => {
  db.close()
  await db.delete()
  await db.open()
  const now = Date.now()
  const sprint: FocusSprint = {
    id: sprintId, userId, gaps: [], status: 'active',
    startsAt: new Date(now - 60_000).toISOString(),
    endsAt: new Date(now + 7 * 86_400_000 - 60_000).toISOString(),
    createdAt: new Date(now - 60_000).toISOString(),
  }
  const content: FocusContent = {
    id: contentId, userId, sprintId, kind: 'story', gapIds: [],
    body: { title: 'Test', passage: 'A test story.', explanation: 'Test.', keyPhrases: [] },
    exercises: [], media: { audioNarrationUrl: null, audioSentencesUrls: [], imageSceneUrl: null, imagePromptUrl: null, videoClipUrl: null },
    createdAt: new Date(now).toISOString(),
  }
  await db.focusSprints.put(sprint)
  await db.focusContent.put(content)
})

afterEach(() => db.close())

describe('recordFocusPractice', () => {
  it('persiste el inicio y la respuesta sin contar el inicio como día practicado', async () => {
    expect(await recordFocusPractice(userId, sprintId, contentId, { kind: 'started' })).toBe(true)
    expect((await db.focusSprints.get(sprintId))?.practice?.days[0].answeredExerciseKeys).toEqual([])
    expect(await recordFocusPractice(userId, sprintId, contentId, { kind: 'answered', exerciseId: 'exercise-1' })).toBe(true)
    expect((await db.focusSprints.get(sprintId))?.practice?.days[0].answeredExerciseKeys).toEqual([`${contentId}:exercise-1`])
  })

  it('no deja registrar progreso de otra cuenta', async () => {
    expect(await recordFocusPractice('another-user', sprintId, contentId, { kind: 'answered', exerciseId: 'exercise-1' })).toBe(false)
    expect((await db.focusSprints.get(sprintId))?.practice).toBeUndefined()
  })

  it('encola el progreso de una cuenta autenticada para sincronización', async () => {
    const accountId = 'account-1'
    await db.focusSprints.update(sprintId, { userId: accountId })
    await db.focusContent.update(contentId, { userId: accountId })
    expect(await recordFocusPractice(accountId, sprintId, contentId, { kind: 'answered', exerciseId: 'exercise-1' })).toBe(true)
    const entry = await db.syncOutbox.where('userId').equals(accountId).first()
    expect(entry).toMatchObject({ table: 'focus_sprints', operation: 'update', matchKey: { id: sprintId } })
    expect(entry?.payload.practice_progress).toMatchObject({ days: [{ day: 1, answeredExerciseKeys: [`${contentId}:exercise-1`] }] })
  })
})
