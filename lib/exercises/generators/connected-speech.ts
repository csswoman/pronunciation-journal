import { exerciseId, pick } from '@/lib/exercises/utils'
import type { MultipleChoiceExercise, SentenceDictationExercise } from '@/lib/exercises/types'

// ── Types local to this module ────────────────────────────────────────────────

interface CsQuizItem {
  q: string
  options: string[]
  answer: number
  explain: string
}

interface CsRuleRow {
  key?: string
}

interface CsBlock {
  type: string
  rows?: CsRuleRow[]
}

interface CsCard {
  blocks: CsBlock[]
}

interface CsDeck {
  quiz: CsQuizItem[]
  cards: CsCard[]
}

// ── Deck loader (in-memory cache) ─────────────────────────────────────────────

const CS_DECK_SLUGS = ['cs-linking', 'cs-reductions', 'cs-assimilation', 'cs-elision'] as const
export type CsDeckSlug = typeof CS_DECK_SLUGS[number]

const deckCache = new Map<CsDeckSlug, CsDeck>()

async function loadDeck(slug: CsDeckSlug): Promise<CsDeck | null> {
  if (deckCache.has(slug)) return deckCache.get(slug)!
  try {
    const res = await fetch(`/grammar-decks/${slug}.json`)
    if (!res.ok) return null
    const data = (await res.json()) as CsDeck
    deckCache.set(slug, data)
    return data
  } catch {
    return null
  }
}

/** Returns the deck slug for today, rotating across all 4 decks. */
export function todaysDeckSlug(): CsDeckSlug {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  )
  return CS_DECK_SLUGS[dayOfYear % CS_DECK_SLUGS.length]
}

// ── Generators ────────────────────────────────────────────────────────────────

/** Generate multiple_choice exercises from a deck's quiz array. */
export function generateCsQuiz(deck: CsDeck, slug: CsDeckSlug, count: number): MultipleChoiceExercise[] {
  const items = pick(deck.quiz, count)
  return items.map((item, i) => ({
    id: exerciseId('multiple_choice', `${slug}-quiz-${i}`, 'v1'),
    type: 'multiple_choice' as const,
    sourceRef: { source: 'text_fragments' as const, id: slug },
    question: item.q,
    options: item.options,
    answerIndex: item.answer,
    explanation: item.explain,
  }))
}

/** Extract short spoken phrases from deck cards for dictation exercises. */
function extractPhrases(deck: CsDeck): string[] {
  const phrases: string[] = []
  for (const card of deck.cards) {
    for (const block of card.blocks) {
      if (block.type !== 'rules' || !block.rows) continue
      for (const row of block.rows) {
        if (!row.key) continue
        // Keys look like "going to → gonna" or "an apple" — take the part after → if present
        const phrase = row.key.includes('→') ? row.key.split('→')[1].trim() : row.key.trim()
        if (phrase.length > 0 && phrase.length < 40 && /^[\w\s''-]+$/.test(phrase)) {
          phrases.push(phrase)
        }
      }
    }
  }
  return [...new Set(phrases)]
}

/** Generate sentence_dictation exercises from a deck's example phrases. */
export function generateCsDictation(deck: CsDeck, slug: CsDeckSlug, count: number): SentenceDictationExercise[] {
  const phrases = pick(extractPhrases(deck), count)
  return phrases.map((phrase, i) => ({
    id: exerciseId('sentence_dictation', `${slug}-dict-${i}-${phrase}`, 'v1'),
    type: 'sentence_dictation' as const,
    sourceRef: { source: 'text_fragments' as const, id: slug },
    sentence: phrase,
    audioUrl: null,
  }))
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface ConnectedSpeechExercises {
  quiz: MultipleChoiceExercise[]
  dictation: SentenceDictationExercise[]
}

/**
 * Load today's connected-speech deck and generate exercises.
 * Returns null if the deck is unavailable (offline without cache).
 */
export async function generateConnectedSpeechExercises(
  quizCount = 2,
  dictationCount = 2,
): Promise<ConnectedSpeechExercises | null> {
  const slug = todaysDeckSlug()
  const deck = await loadDeck(slug)
  if (!deck) return null

  return {
    quiz: generateCsQuiz(deck, slug, quizCount),
    dictation: generateCsDictation(deck, slug, dictationCount),
  }
}
