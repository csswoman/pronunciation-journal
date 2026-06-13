import { describe, it, expect } from 'vitest'
import { generateCsQuiz, generateCsDictation, todaysDeckSlug, type CsDeckSlug } from '../connected-speech'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockDeck = {
  quiz: [
    { q: 'How is "going to" reduced?', options: ['goin\'', 'gonna', 'going', 'gon'], answer: 1, explain: '"going to" → "gonna".' },
    { q: 'What does "wanna" come from?', options: ['will not', 'want to', 'went to', 'was not'], answer: 1, explain: '"want to" → "wanna".' },
    { q: 'How does flap T sound?', options: ['Like /t/ in "top"', 'Like /d/ in "ladder"', 'Silent', 'Like /tʃ/'], answer: 1, explain: 'Flap T between vowels sounds like a soft /d/.' },
  ],
  cards: [
    {
      blocks: [
        {
          type: 'rules',
          rows: [
            { key: 'going to → gonna', value: 'gonna /ˈɡɑnə/' },
            { key: 'pick it up', value: '/ˌpɪ kɪ ˈtʌp/' },
            { key: 'turn it off', value: '/tɜr nɪ ˈtɑf/' },
          ],
        },
        { type: 'pronunciation', rows: [] },
      ],
    },
  ],
}

const SLUG: CsDeckSlug = 'cs-reductions'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('generateCsQuiz', () => {
  it('produces the requested number of exercises', () => {
    const exercises = generateCsQuiz(mockDeck, SLUG, 2)
    expect(exercises).toHaveLength(2)
  })

  it('each exercise has type multiple_choice and valid answerIndex', () => {
    const exercises = generateCsQuiz(mockDeck, SLUG, 3)
    for (const ex of exercises) {
      expect(ex.type).toBe('multiple_choice')
      expect(ex.answerIndex).toBeGreaterThanOrEqual(0)
      expect(ex.answerIndex).toBeLessThan(ex.options.length)
    }
  })

  it('exercise ids are deterministic (same call = same ids)', () => {
    const a = generateCsQuiz(mockDeck, SLUG, 2)
    const b = generateCsQuiz(mockDeck, SLUG, 2)
    expect(a.map(e => e.id)).toEqual(b.map(e => e.id))
  })

  it('includes explanation text', () => {
    const exercises = generateCsQuiz(mockDeck, SLUG, 1)
    expect(exercises[0].explanation).toBeTruthy()
  })
})

describe('generateCsDictation', () => {
  it('produces dictation exercises from rule row keys', () => {
    const exercises = generateCsDictation(mockDeck, SLUG, 2)
    expect(exercises.length).toBeGreaterThan(0)
    expect(exercises.length).toBeLessThanOrEqual(2)
  })

  it('each dictation exercise has type sentence_dictation and audioUrl null', () => {
    const exercises = generateCsDictation(mockDeck, SLUG, 2)
    for (const ex of exercises) {
      expect(ex.type).toBe('sentence_dictation')
      expect(ex.audioUrl).toBeNull()
    }
  })

  it('filters out arrow-notation keys — uses only right side after →', () => {
    const exercises = generateCsDictation(mockDeck, SLUG, 3)
    for (const ex of exercises) {
      expect(ex.sentence).not.toContain('→')
    }
  })
})

describe('todaysDeckSlug', () => {
  it('returns one of the 4 valid slugs', () => {
    const validSlugs = ['cs-linking', 'cs-reductions', 'cs-assimilation', 'cs-elision']
    expect(validSlugs).toContain(todaysDeckSlug())
  })
})
