import 'fake-indexeddb/auto'
import { describe, expect, it, afterEach } from 'vitest'
import { db } from '@/lib/db'
import { saveGeneratedScript, listGeneratedScripts } from '../generated-store'

const script = [
  { speaker: 'coach' as const, text: 'Tell me about your stack.' },
  { speaker: 'learner' as const, text: 'I work mostly with Node and Postgres.' },
]

describe('generated script store', () => {
  afterEach(async () => { await db.generatedScripts.clear() })

  it('convierte un guión generado en misión ejecutable', async () => {
    const mission = await saveGeneratedScript('user-a', 'backend interview', 'B1', script)
    expect(mission.mode).toBe('scripted')
    expect(mission.origin).toBe('generated')
    expect(mission.script).toHaveLength(2)
    expect(mission.script[0].id).toBeTruthy()
  })

  it('recupera los guiones guardados del usuario', async () => {
    await saveGeneratedScript('user-a', 'backend interview', 'B1', script)
    const saved = await listGeneratedScripts('user-a')
    expect(saved).toHaveLength(1)
    expect(saved[0].context).toContain('backend interview')
  })

  it('no devuelve los guiones de otro usuario', async () => {
    await saveGeneratedScript('user-a', 'backend interview', 'B1', script)
    expect(await listGeneratedScripts('user-b')).toHaveLength(0)
  })

  it('da un id único a cada línea', async () => {
    const mission = await saveGeneratedScript('user-a', 'cafe', 'A2', script)
    const ids = mission.script.map((line) => line.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
