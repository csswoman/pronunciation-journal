// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { describe, expect, it, afterEach } from 'vitest'
import { db, type GeneratedScriptRecord } from '@/lib/db'


function record(overrides: Partial<GeneratedScriptRecord> = {}): GeneratedScriptRecord {
  return {
    id: 'gs-1',
    userId: 'user-a',
    mission: {
      id: 'gs-1', mode: 'scripted', origin: 'generated',
      category: 'workplace', recommendedCefr: 'B1',
      context: 'Backend interview', communicativeGoal: 'Explicar tu stack',
      targets: [],
      script: [{ id: 'g-1', speaker: 'coach', text: 'Tell me about your stack.' }],
    },
    topic: 'backend interview',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('generatedScripts table', () => {
  afterEach(async () => { await db.generatedScripts.clear() })

  it('guarda y recupera por usuario', async () => {
    await db.generatedScripts.put(record())
    const rows = await db.generatedScripts.where('userId').equals('user-a').toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].topic).toBe('backend interview')
  })

  it('aísla los guiones entre usuarios', async () => {
    await db.generatedScripts.put(record())
    await db.generatedScripts.put(record({ id: 'gs-2', userId: 'user-b' }))
    const rows = await db.generatedScripts.where('userId').equals('user-b').toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('gs-2')
  })
})
