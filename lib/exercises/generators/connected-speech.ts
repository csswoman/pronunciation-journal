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

interface CsPronExample {
  text?: string
}

interface CsBlock {
  type: string
  rows?: CsRuleRow[]
  examples?: CsPronExample[]
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

/** Count whitespace-separated words in a trimmed string. */
function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

/**
 * Extract real example sentences from deck `pronunciation` blocks for dictation.
 *
 * Dictation is "listen and type the sentence", so the target must be an actual
 * sentence — not a reduction key like "gonna" or "sorta" (those are single
 * slang spellings of "going to" / "sort of", not sentences). Reduction keys
 * live in `rules` rows and are intentionally excluded; we use the full example
 * sentences (e.g. "I'm gonna call you later.") that already embed the reduction
 * in context.
 */
function extractPhrases(deck: CsDeck): string[] {
  const sentences: string[] = []
  for (const card of deck.cards) {
    for (const block of card.blocks) {
      if (block.type !== 'pronunciation' || !block.examples) continue
      for (const example of block.examples) {
        if (!example.text) continue
        const sentence = example.text.trim()
        // Require a genuine multi-word sentence, not a lone reduced form.
        if (sentence.length > 0 && sentence.length < 80 && wordCount(sentence) >= 2) {
          sentences.push(sentence)
        }
      }
    }
  }
  return [...new Set(sentences)]
}

/** Generate sentence_dictation exercises from a deck's example phrases. */
export function generateCsDictation(deck: CsDeck, slug: string, count: number): SentenceDictationExercise[] {
  const phrases = pick(extractPhrases(deck), count)
  return phrases.map((phrase, i) => ({
    id: exerciseId('sentence_dictation', `${slug}-dict-${i}-${phrase}`, 'v1'),
    type: 'sentence_dictation' as const,
    sourceRef: { source: 'text_fragments' as const, id: slug },
    sentence: phrase,
    audioUrl: null,
  }))
}

/** Load a connected-speech deck by slug (cached). */
export async function loadConnectedSpeechDeck(slug: CsDeckSlug): Promise<CsDeck | null> {
  return loadDeck(slug)
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
