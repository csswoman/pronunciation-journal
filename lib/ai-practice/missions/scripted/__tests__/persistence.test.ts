// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { describe, expect, it, afterEach } from 'vitest'
import { db } from '@/lib/db'
import { persistScriptedSession, getPreviousBestScore } from '../persistence'
import type { ScriptedMission } from '../../types'

const mission: ScriptedMission = {
  id: 'scripted.cafe.order', mode: 'scripted', origin: 'authored',
  category: 'service', recommendedCefr: 'A2',
  context: 'Café', communicativeGoal: 'Pedir café', targets: [],
  script: [{ id: 'l1', speaker: 'coach', text: 'Hi' }],
}

describe('scripted persistence', () => {
  afterEach(async () => { await db.missionSessions.clear() })

  it('guarda una sesión completada', async () => {
    await persistScriptedSession('user-a', mission, {
      score: 85, scoredLines: 1, correctPhonemes: 17, totalPhonemes: 20,
    }, new Date().toISOString())

    const rows = await db.missionSessions.where('userId').equals('user-a').toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe('completed')
  })

  it('recupera el mejor score previo', async () => {
    const started = new Date().toISOString()
    await persistScriptedSession('user-a', mission, {
      score: 70, scoredLines: 1, correctPhonemes: 14, totalPhonemes: 20,
    }, started)
    await persistScriptedSession('user-a', mission, {
      score: 90, scoredLines: 1, correctPhonemes: 18, totalPhonemes: 20,
    }, started)

    const best = await getPreviousBestScore('user-a', mission.id)
    expect(best).toBe(90)
  })

  it('devuelve null si no hay sesiones previas', async () => {
    const best = await getPreviousBestScore('user-a', 'nonexistent')
    expect(best).toBeNull()
  })
})
