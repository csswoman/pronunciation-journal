import type { CEFRLevel } from '@/lib/exercises/cefr'
import { fromGenericExercise } from '@/lib/practice/adapters'
import type { DailyStep, PracticeContext } from '@/lib/practice/types'
import { exerciseId } from '@/lib/exercises/utils'
import type { MultipleChoiceExercise } from '@/lib/exercises/types'
import { dedupeByContentId } from './selectors'

interface DeckRuleRow {
  key: string
  value: string
}

function buildRuleExercises(
  deckSlug: string,
  rows: DeckRuleRow[],
  level?: CEFRLevel,
): MultipleChoiceExercise[] {
  if (rows.length < 2) return []

  return rows.map((row, index) => ({
    id: exerciseId('multiple_choice', `${deckSlug}:rule:${index}`, 'v1'),
    type: 'multiple_choice' as const,
    exerciseType: { domain: 'grammar', mode: 'multiple_choice' },
    sourceRef: { source: 'grammar_deck' as const, id: `${deckSlug}:rule:${index}` },
    lessonSlug: deckSlug,
    level,
    question: `¿Qué regla o significado corresponde a "${row.key}"?`,
    options: rows.map(({ value }) => value),
    answerIndex: index,
    explanation: `"${row.key}" corresponde a: ${row.value}`,
  }))
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
 * Grammar step: show the rule, then recall only material authored in that
 * same deck. Vocabulary review belongs to its own word_review step: using a
 * dictionary entry here can turn an A1 pronoun lesson into a prompt about a
 * technical term unrelated to the lesson.
 */
export async function buildGrammarFocusStep(
  deckSlug: string | null,
  context: PracticeContext = 'daily',
  level?: CEFRLevel,
): Promise<DailyStep | null> {
  if (!deckSlug) return null

  const rule = await loadDeckRule(deckSlug)
  if (!rule) return null

  const exercises = dedupeByContentId(
    buildRuleExercises(deckSlug, rule.rows, level).map((ex) => fromGenericExercise(ex, context)),
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
