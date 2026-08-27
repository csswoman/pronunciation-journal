import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, afterAll, vi } from 'vitest'
import { buildGrammarFocusStep } from '@/lib/practice/daily-plan/grammar-focus'
import type { WordBankEntry } from '@/lib/word-bank/types'

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

function entry(i: number): WordBankEntry {
  return {
    id: `w${i}`,
    text: `word${i}`,
    meaning: `meaning ${i}`,
    example: `I really enjoyed the word${i} last summer.`,
    ipa: null,
    difficulty: 3,
    source: 'word_bank',
    srs_status: 'review',
  } as unknown as WordBankEntry
}

const words = Array.from({ length: 6 }, (_, i) => entry(i))

describe('buildGrammarFocusStep', () => {
  it('returns null without a deck slug', async () => {
    expect(await buildGrammarFocusStep(null, words)).toBeNull()
  })

  it('returns null when there are no usable words', async () => {
    expect(await buildGrammarFocusStep('b1-segundo-condicional', [])).toBeNull()
  })

  it('builds a step carrying the deck rule', async () => {
    const step = await buildGrammarFocusStep('a2-presente-perfecto-experiencias', words)
    expect(step).not.toBeNull()
    expect(step!.kind).toBe('grammar_focus')
    expect(step!.grammarRule?.deckSlug).toBe('a2-presente-perfecto-experiencias')
    expect(step!.grammarRule?.title.length).toBeGreaterThan(0)
    expect(step!.grammarRule!.rows.length).toBeGreaterThan(0)
  })

  it('produces spoken production exercises, never reorder', async () => {
    const step = await buildGrammarFocusStep('b1-segundo-condicional', words)
    expect(step).not.toBeNull()
    const types = step!.exercises.map((ex) =>
      ex.payload.kind === 'generic' ? ex.payload.data.type : 'other',
    )
    expect(types).toContain('spoken_production')
    expect(types).not.toContain('reorder_words')
  })

  it('applies the deck constraint to its exercises', async () => {
    const step = await buildGrammarFocusStep('b1-segundo-condicional', words)
    const first = step!.exercises.find((ex) => ex.payload.kind === 'generic')
    expect(first).toBeDefined()
    const data = (first!.payload as { data: { constraint?: { id: string } } }).data
    expect(data.constraint?.id).toBe('second_conditional')
  })

  it('prioritizes repairConstraints over the deck constraint', async () => {
    const step = await buildGrammarFocusStep(
      'b1-segundo-condicional',
      words,
      'daily',
      ['past_simple_narrative'],
    )
    expect(step).not.toBeNull()
    const first = step!.exercises.find((ex) => ex.payload.kind === 'generic')
    expect(first).toBeDefined()
    const data = (first!.payload as { data: { constraint?: { id: string } } }).data
    expect(data.constraint?.id).toBe('past_simple_narrative')
  })

  it('falls back gracefully when deck has no spoken constraint (e.g. passive voice)', async () => {
    const step = await buildGrammarFocusStep('b1-voz-pasiva-consejos', words)
    expect(step).not.toBeNull()
    expect(step!.kind).toBe('grammar_focus')
    expect(step!.exercises.length).toBeGreaterThan(0)
  })

  it('survives an unknown deck slug without throwing', async () => {
    await expect(buildGrammarFocusStep('does-not-exist', words)).resolves.toBeNull()
  })
})
