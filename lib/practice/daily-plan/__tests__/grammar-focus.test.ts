import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, afterAll, vi } from 'vitest'
import { buildGrammarFocusStep } from '@/lib/practice/daily-plan/grammar-focus'

const realFetch = globalThis.fetch

beforeAll(() => {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const slug = url.split('/').pop()?.replace('.json', '') ?? ''
    const file = path.join(process.cwd(), 'public', 'grammar-decks', `${slug}.json`)
    if (!fs.existsSync(file)) {
      return new Response('not found', { status: 404 })
    }
    return new Response(fs.readFileSync(file, 'utf8'), { status: 200 })
  }) as typeof fetch
})

afterAll(() => {
  globalThis.fetch = realFetch
})

describe('buildGrammarFocusStep', () => {
  it('returns null without a deck slug', async () => {
    expect(await buildGrammarFocusStep(null)).toBeNull()
  })

  it('builds a step carrying the deck rule', async () => {
    const step = await buildGrammarFocusStep('a2-presente-perfecto-experiencias')
    expect(step).not.toBeNull()
    expect(step!.kind).toBe('grammar_focus')
    expect(step!.title).toContain('Estructura:')
    expect(step!.grammarRule?.deckSlug).toBe('a2-presente-perfecto-experiencias')
    expect(step!.grammarRule?.title.length).toBeGreaterThan(0)
    expect(step!.grammarRule!.rows.length).toBeGreaterThan(0)
  })

  it('produces only exercises authored from the deck rule, never word-bank production', async () => {
    const step = await buildGrammarFocusStep('a1-ingles-principiantes', 'daily', 'A1')
    expect(step).not.toBeNull()
    const types = step!.exercises.map((ex) =>
      ex.payload.kind === 'generic' ? ex.payload.data.type : 'other',
    )
    expect(types).toEqual(['multiple_choice', 'multiple_choice', 'multiple_choice'])
    const first = step!.exercises[0]!.payload
    expect(first.kind).toBe('generic')
    if (first.kind === 'generic' && first.data.type === 'multiple_choice') {
      expect(first.data.question).toContain('I')
      expect(first.data.options).not.toContain('dependency array')
      expect(first.data.level).toBe('A1')
    }
  })

  it('works for a deck without a spoken-production constraint', async () => {
    const step = await buildGrammarFocusStep('b1-voz-pasiva-consejos')
    expect(step).not.toBeNull()
    expect(step!.kind).toBe('grammar_focus')
    expect(step!.exercises.length).toBeGreaterThan(0)
  })

  it('survives an unknown deck slug without throwing', async () => {
    await expect(buildGrammarFocusStep('does-not-exist')).resolves.toBeNull()
  })
})
