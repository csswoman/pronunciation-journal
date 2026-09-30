// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { db } from '@/lib/db'
import { ED_DRILL_CATALOG } from '@/lib/pronunciation/ed-drills/catalog'
import { EdDrillSession } from '../EdDrillSession'

/**
 * -ed runtime exit: real phase cards and clicks into the real attempt and
 * activity writers. TTS, speech capture, auth and the flush are the stubbed
 * seams; speech scoring is unavailable so phase 2 stays unscored.
 */
const USER = '00000000-0000-4000-8000-000000000131'
const cluster = ED_DRILL_CATALOG[0].cluster

vi.mock('@/components/auth/AuthProvider', () => ({ useAuthOptional: () => ({ user: { id: USER } }) }))
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))
vi.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    status: 'idle', result: null, errorCode: null, isSupported: false,
    start: vi.fn(), stop: vi.fn(), reset: vi.fn(),
  }),
}))
vi.mock('@/lib/speech/adapters/webSpeechAdapter', () => ({ canScoreSpeech: () => false }))
vi.mock('@/lib/sync/sync-manager', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/sync/sync-manager')>(),
  flushOutbox: vi.fn().mockResolvedValue({ synced: 0, failed: 0, skipped: 0, operations: [] }),
}))

async function outbox(table: string) {
  return (await db.syncOutbox.where('userId').equals(USER).toArray()).filter((entry) => entry.table === table)
}

beforeEach(async () => {
  window.localStorage.clear()
  db.close()
  await db.delete()
  await db.open()
})

afterEach(() => db.close())

describe('EdDrillSession runtime exit', { timeout: 20_000 }, () => {
  it('writes the evaluated attempt and reconciles only the explicit Daily step', async () => {
    render(<EdDrillSession cluster={cluster} dailyStepId="ed_cluster_drill:daily" />)

    fireEvent.click(await screen.findByRole('button', { name: 'Escuchar opción de pasado' }))
    fireEvent.click(await screen.findByRole('button', { name: /Continuar sin puntuación/i }))
    fireEvent.click(await screen.findByRole('button', { name: /Terminar escalera/i }))
    await screen.findByText('Escalera completada')

    const attempts = await outbox('ed_cluster_attempts')
    expect(attempts).toEqual([expect.objectContaining({ payload: expect.objectContaining({ user_id: USER }) })])
    expect(await outbox('answer_history')).toEqual([])
    await waitFor(async () => expect(await outbox('activity_sessions')).toHaveLength(1))
    expect((await outbox('activity_sessions'))[0]?.payload).toMatchObject({
      user_id: USER, practice_context: 'daily', exercises_total: 1, reconciled_step_ids: ['ed_cluster_drill:daily'],
    })
  })

  it('opening the drill and finishing without an evaluated attempt writes nothing', async () => {
    render(<EdDrillSession cluster={cluster} dailyStepId="ed_cluster_drill:daily" />)
    await screen.findByRole('button', { name: 'Escuchar opción de pasado' })

    expect(await db.syncOutbox.where('userId').equals(USER).count()).toBe(0)
  })
})
