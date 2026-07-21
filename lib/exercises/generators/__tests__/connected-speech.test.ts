import { describe, it, expect } from 'vitest'
import { generateCsQuiz, generateCsDictation, generateCsShadowPhrase, todaysDeckSlug, type CsDeckSlug } from '../connected-speech'

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
            // Reduction keys — single slang forms, NOT sentences. Must be excluded.
            { key: 'going to → gonna', value: 'gonna /ˈɡɑnə/' },
            { key: 'sort of → sorta', value: 'sorta /ˈsɔrtə/' },
            { key: 'of', value: 'cup of tea → /kʌp ə tiː/' },
          ],
        },
        {
          type: 'pronunciation',
          examples: [
            { text: "I'm gonna call you later.", ipa: '/aɪm ˈɡɑnə ˈkɔl jə ˈleɪtər/' },
            { text: 'We wanna leave early.', ipa: '/wɪ ˈwɑnə liːv ˈɜrli/' },
            { text: 'She sorta likes it.', ipa: '/ʃi ˈsɔrtə laɪks ɪt/' },
          ],
        },
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
  it('produces dictation exercises from example sentences', () => {
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

  it('targets are real sentences (≥2 words), never lone reduction forms', () => {
    const exercises = generateCsDictation(mockDeck, SLUG, 3)
    expect(exercises.length).toBeGreaterThan(0)
    for (const ex of exercises) {
      // "gonna" / "sorta" are slang spellings, not sentences — must never be a target.
      expect(ex.sentence.trim().split(/\s+/).length).toBeGreaterThanOrEqual(2)
      expect(['gonna', 'sorta', 'wanna', 'of']).not.toContain(ex.sentence.trim().toLowerCase())
    }
  })

  it('never emits arrow-notation or reduction keys as dictation targets', () => {
    const exercises = generateCsDictation(mockDeck, SLUG, 3)
    for (const ex of exercises) {
      expect(ex.sentence).not.toContain('→')
    }
  })
})

describe('generateCsShadowPhrase', () => {
  it('produces at least one production step from real example sentences', () => {
    const exercises = generateCsShadowPhrase(mockDeck, SLUG, 1)
    expect(exercises.length).toBeGreaterThan(0)
    expect(exercises.length).toBeLessThanOrEqual(1)
  })

  it('each exercise has type cs_shadow_phrase, a real sentence, and the deck slug', () => {
    const exercises = generateCsShadowPhrase(mockDeck, SLUG, 3)
    for (const ex of exercises) {
      expect(ex.type).toBe('cs_shadow_phrase')
      expect(ex.deckSlug).toBe(SLUG)
      expect(ex.phrase.trim().split(/\s+/).length).toBeGreaterThanOrEqual(2)
      expect(ex.phrase).not.toContain('→')
    }
  })

  it('never emits a lone reduction key as the shadow phrase', () => {
    const exercises = generateCsShadowPhrase(mockDeck, SLUG, 3)
    for (const ex of exercises) {
      expect(['gonna', 'sorta', 'wanna', 'of']).not.toContain(ex.phrase.trim().toLowerCase())
    }
  })

  it('exercise ids are deterministic for the same phrase', () => {
    // pick() randomizes selection order, so requesting fewer than all
    // available phrases can select a different one across calls — determinism
    // means "same phrase always yields the same id", not "same call, same pick".
    const all = generateCsShadowPhrase(mockDeck, SLUG, 10)
    const byPhrase = new Map(all.map((e) => [e.phrase, e.id]))
    const again = generateCsShadowPhrase(mockDeck, SLUG, 10)
    for (const ex of again) {
      expect(ex.id).toBe(byPhrase.get(ex.phrase))
    }
  })

  it('returns an empty array when the deck has no usable example sentences', () => {
    const emptyDeck = { quiz: [], cards: [{ blocks: [{ type: 'rules', rows: [] }] }] }
    const exercises = generateCsShadowPhrase(emptyDeck, SLUG, 2)
    expect(exercises).toHaveLength(0)
  })
})

describe('todaysDeckSlug', () => {
  it('returns one of the 4 valid slugs', () => {
    const validSlugs = ['cs-linking', 'cs-reductions', 'cs-assimilation', 'cs-elision']
    expect(validSlugs).toContain(todaysDeckSlug())
  })
})
