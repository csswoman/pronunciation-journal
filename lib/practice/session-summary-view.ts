import type { ExerciseSlug, SessionResult } from '@/lib/practice/types'

export const REINFORCE_THRESHOLD = 60

/** Compact action facets for session summary (verbs the learner actually does). */
export type SessionFacet =
  | 'listen'
  | 'choose'
  | 'match'
  | 'write'
  | 'speak'
  | 'reading'
  | 'vocabulary'
  | 'grammar'

const FACET_LABELS: Record<SessionFacet, string> = {
  listen: 'Escuchar',
  choose: 'Elegir',
  match: 'Emparejar',
  write: 'Escribir',
  speak: 'Hablar',
  reading: 'Lectura',
  vocabulary: 'Vocabulario',
  grammar: 'Gramática',
}

const FACET_ORDER: SessionFacet[] = [
  'listen',
  'choose',
  'match',
  'write',
  'speak',
  'reading',
  'vocabulary',
  'grammar',
]

/**
 * One primary facet per slug so exercises are not double-counted.
 * Mapped to the real tap/type/speak action, not abstract skills.
 */
const SLUG_FACET: Record<ExerciseSlug, SessionFacet> = {
  pick_word: 'choose',
  pick_sound: 'choose',
  minimal_pair: 'listen',
  dictation: 'write',
  fill_blank: 'vocabulary',
  sentence_dictation: 'write',
  match_pairs: 'match',
  reorder_words: 'grammar',
  speak_word: 'speak',
  identify: 'listen',
  ax_same_different: 'listen',
  odd_one_out: 'listen',
  abx: 'listen',
  sentence_context: 'vocabulary',
  multiple_choice: 'reading',
  reader: 'reading',
  written_production: 'reading',
  spoken_production: 'speak',
  error_correction: 'grammar',
  conjugation_blank: 'grammar',
  sentence_transformation: 'grammar',
  translation_es_en: 'vocabulary',
  cs_shadow_phrase: 'speak',
}

export type PerformanceRow = {
  facet: SessionFacet
  label: string
  correct: number
  total: number
  pct: number
  needsReinforce: boolean
}

export function formatSlugLabel(slug: string): string {
  if (isExerciseSlug(slug)) {
    return FACET_LABELS[SLUG_FACET[slug]]
  }
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatExerciseLabel(slug: string, exercisePayload: unknown): string {
  if (exercisePayload && typeof exercisePayload === 'object') {
    const targetWord = (exercisePayload as { targetWord?: unknown }).targetWord
    if (typeof targetWord === 'string' && targetWord.trim().length > 0) return targetWord.trim()
  }
  return formatSlugLabel(slug)
}

function isExerciseSlug(slug: string): slug is ExerciseSlug {
  return Object.prototype.hasOwnProperty.call(SLUG_FACET, slug)
}

function targetWordFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const targetWord = (payload as { targetWord?: unknown }).targetWord
  if (typeof targetWord !== 'string') return null
  const trimmed = targetWord.trim()
  return trimmed.length > 0 ? trimmed : null
}

function joinSpanishList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]!
  if (items.length === 2) return `${items[0]} y ${items[1]}`
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

export function buildPerformanceRows(
  bySlug: SessionResult['bySlug'],
  _options?: { soundMode?: boolean },
): PerformanceRow[] {
  const buckets = new Map<SessionFacet, { correct: number; total: number }>()

  for (const [slug, stats] of Object.entries(bySlug)) {
    if (stats.total <= 0 || !isExerciseSlug(slug)) continue
    const facet = SLUG_FACET[slug]
    const entry = buckets.get(facet) ?? { correct: 0, total: 0 }
    entry.correct += stats.correct
    entry.total += stats.total
    buckets.set(facet, entry)
  }

  return FACET_ORDER.filter((facet) => buckets.has(facet)).map((facet) => {
    const stats = buckets.get(facet)!
    const pct = Math.round((stats.correct / stats.total) * 100)
    return {
      facet,
      label: FACET_LABELS[facet],
      correct: stats.correct,
      total: stats.total,
      pct,
      needsReinforce: pct < REINFORCE_THRESHOLD,
    }
  }).sort((a, b) => {
    if (a.needsReinforce !== b.needsReinforce) return a.needsReinforce ? -1 : 1
    return FACET_ORDER.indexOf(a.facet) - FACET_ORDER.indexOf(b.facet)
  })
}

/**
 * Companion-tone insight: what to reinforce, never "fallaste".
 * Prefers target words from weak facets; falls back to facet labels.
 */
export function buildSessionInsight(
  result: SessionResult,
  options?: { soundMode?: boolean },
): string {
  const rows = buildPerformanceRows(result.bySlug, options)
  const weakRows = rows.filter((r) => r.needsReinforce)

  if (weakRows.length === 0) {
    return 'Buen ritmo en esta tanda.'
  }

  const weakFacets = new Set(weakRows.map((r) => r.facet))
  const words: string[] = []
  const seen = new Set<string>()

  for (const r of result.results) {
    if (r.isCorrect || !isExerciseSlug(r.slug)) continue
    if (!weakFacets.has(SLUG_FACET[r.slug])) continue
    const word = targetWordFromPayload(r.exercisePayload)
    if (!word) continue
    const key = word.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    words.push(word)
    if (words.length >= 3) break
  }

  if (words.length > 0) {
    return `Hoy conviene reforzar ${joinSpanishList(words)}.`
  }

  const facetLabels = weakRows.slice(0, 3).map((r) => r.label.toLowerCase())
  return `Hoy conviene reforzar ${joinSpanishList(facetLabels)}.`
}
