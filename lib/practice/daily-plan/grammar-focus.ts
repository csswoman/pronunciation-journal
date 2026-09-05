import { generateSpokenProductionFromWordBank } from '@/lib/exercises/generators/production'
import { constraintIdForDeck } from '@/lib/practice/grammar-constraint-map'
import { fromGenericExercise } from '@/lib/practice/adapters'
import type { DailyStep, PracticeContext } from '@/lib/practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { dedupeByContentId } from './selectors'

/** Production items in the grammar step. Enough reps to feel the pattern. */
const GRAMMAR_PRODUCTION_COUNT = 5

interface DeckRuleRow {
  key: string
  value: string
}

interface LoadedDeckRule {
  title: string
  goal: string
  rows: DeckRuleRow[]
}

/**
 * Read the rule summary out of a grammar deck JSON.
 * Returns null for a missing deck or an unexpected shape — a grammar step is
 * optional, so a bad deck must never break the whole daily plan.
 */
async function loadDeckRule(deckSlug: string): Promise<LoadedDeckRule | null> {
  try {
    const res = await fetch(`/grammar-decks/${deckSlug}.json`)
    if (!res.ok) return null
    const json: unknown = await res.json()
    return extractRule(json)
  } catch {
    return null
  }
}

/** Pure extraction so it can be unit-tested without network. */
export function extractRule(json: unknown): LoadedDeckRule | null {
  if (!json || typeof json !== 'object') return null
  const deck = json as {
    meta?: { title?: unknown; titleEmphasis?: unknown; goal?: unknown }
    cards?: Array<{ blocks?: Array<{ type?: unknown; rows?: unknown }> }>
  }

  const titleParts = [deck.meta?.title, deck.meta?.titleEmphasis]
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
  const title = titleParts.join(' ')
  const goal = typeof deck.meta?.goal === 'string' ? deck.meta.goal : ''
  if (!title) return null

  const rows: DeckRuleRow[] = []
  for (const card of deck.cards ?? []) {
    for (const block of card.blocks ?? []) {
      if (block.type !== 'rules' || !Array.isArray(block.rows)) continue
      for (const row of block.rows) {
        if (!row || typeof row !== 'object') continue
        const { key, value } = row as { key?: unknown; value?: unknown }
        if (typeof key === 'string' && typeof value === 'string') {
          rows.push({ key, value })
        }
        if (rows.length >= 3) break
      }
      if (rows.length >= 3) break
    }
    if (rows.length >= 3) break
  }

  if (rows.length === 0) return null
  return { title, goal, rows }
}

/**
 * Grammar step: show the rule, then make the learner PRODUCE it.
 *
 * Deliberately not reorder_words — being handed every token is recognition
 * with extra steps, and recognition is exactly what the learner already has.
 */
export async function buildGrammarFocusStep(
  deckSlug: string | null,
  words: WordBankEntry[],
  context: PracticeContext = 'daily',
  repairConstraints: readonly string[] = [],
): Promise<DailyStep | null> {
  if (!deckSlug || words.length === 0) return null

  const rule = await loadDeckRule(deckSlug)
  if (!rule) return null

  const constraintId = constraintIdForDeck(deckSlug)
  // Due repairs come first: a scheduled error outranks the day's deck topic.
  const preferred = [
    ...repairConstraints,
    ...(constraintId ? [constraintId] : []),
  ]
  const { exercises: generated } = generateSpokenProductionFromWordBank(
    words,
    GRAMMAR_PRODUCTION_COUNT,
    preferred,
  )

  const exercises = dedupeByContentId(
    generated.map((ex) => {
      const exWithLesson = {
        ...ex,
        lessonSlug: deckSlug,
        sourceRef: { source: 'grammar_deck' as const, id: deckSlug },
      }
      return fromGenericExercise(exWithLesson, context)
    }),
  )
  if (exercises.length === 0) return null

  return {
    kind: 'grammar_focus',
    id: `grammar_focus:${deckSlug}`,
    title: rule.title ? `Estructura: ${rule.title}` : 'Práctica de gramática',
    subtitle: rule.goal || rule.title,
    icon: 'Blocks',
    exercises,
    grammarRule: {
      deckSlug,
      title: rule.title,
      goal: rule.goal,
      rows: rule.rows,
    },
    estMinutes: Math.max(3, Math.round(exercises.length * 1.3)),
  }
}
