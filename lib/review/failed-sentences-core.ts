import {
  connectedSpeechDeckTitle,
  humanizeSlug,
  isUuid,
  parseContentRef,
  parseWordBankId,
} from '@/lib/review/content-ref'
import type { FailedSentenceItem } from '@/lib/review/types'

export const SENTENCE_EXERCISE_IDS = [5, 6, 8] as const

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  fill_blank: 'Fill in the blank',
  sentence_dictation: 'Dictation',
  reorder_words: 'Reorder words',
}

export function exerciseTypeLabel(slug: string): string {
  return EXERCISE_TYPE_LABELS[slug] ?? 'Sentence'
}

export type FailedHistoryRow = {
  content_id: string | null
  answered_at: string | null
  target_word: string | null
  user_answer: string | null
  exercise_types: { slug: string } | null
}

type FragmentRow = { id: string; content: string; title: string | null }
type WordRow = { id: string; text: string; example: string | null }

function truncate(text: string, max = 72): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

function pickAnswerLabel(targetWord: string | null, userAnswer: string | null): string | null {
  const target = targetWord?.trim()
  if (target && target.length > 1) return target
  const answer = userAnswer?.trim()
  if (answer && answer.length > 1 && answer.toLowerCase() !== 'skip') return answer
  return null
}

function labelFromFragmentRef(
  ref: { source: string; id: string },
  fragments: Map<string, FragmentRow>,
): string | null {
  if (ref.source !== 'text_fragments') return null

  const byId = fragments.get(ref.id)
  if (byId) {
    return truncate(byId.title?.trim() || byId.content)
  }

  const deckTitle = connectedSpeechDeckTitle(ref.id)
  if (deckTitle) return `Habla conectada · ${deckTitle}`

  if (ref.id.startsWith('grammar-deck:')) {
    return `Gramática · ${humanizeSlug(ref.id.replace('grammar-deck:', ''))}`
  }

  return humanizeSlug(ref.id)
}

function resolvePhrase(
  contentId: string,
  row: FailedHistoryRow,
  fragments: Map<string, FragmentRow>,
  words: Map<string, WordRow>,
): string | null {
  const target = row.target_word?.trim()
  if (target && target.length > 1) return target

  const wordId = parseWordBankId(contentId)
  if (wordId) {
    const word = words.get(wordId)
    if (word?.example) return word.example
  }

  const ref = parseContentRef(contentId)
  if (ref?.source === 'text_fragments') {
    const frag = fragments.get(ref.id)
    if (frag?.content) return frag.content
  }

  return null
}

function isDrillable(contentId: string): boolean {
  const wordId = parseWordBankId(contentId)
  if (wordId) return true

  const ref = parseContentRef(contentId)
  if (ref?.source !== 'text_fragments') return false

  const fragId = ref.id
  if (isUuid(fragId)) return true
  if (connectedSpeechDeckTitle(fragId)) return true
  if (fragId.startsWith('grammar-deck:') || fragId.startsWith('lesson:')) return true

  return false
}

function resolveLabel(
  contentId: string,
  row: FailedHistoryRow,
  fragments: Map<string, FragmentRow>,
  words: Map<string, WordRow>,
): string {
  const direct = pickAnswerLabel(row.target_word, row.user_answer)
  if (direct) return direct

  const wordId = parseWordBankId(contentId)
  if (wordId) {
    const word = words.get(wordId)
    if (word?.example) return truncate(word.example)
    if (word?.text) return word.text
  }

  const ref = parseContentRef(contentId)
  if (ref) {
    const fragmentLabel = labelFromFragmentRef(ref, fragments)
    if (fragmentLabel) return fragmentLabel
  }

  if (ref) return humanizeSlug(ref.id)
  return truncate(contentId)
}

export function rowsToFailedItems(
  rows: FailedHistoryRow[],
  limit: number,
  fragments: Map<string, FragmentRow> = new Map(),
  words: Map<string, WordRow> = new Map(),
): FailedSentenceItem[] {
  const seen = new Set<string>()
  const items: FailedSentenceItem[] = []

  for (const row of rows) {
    const contentId = row.content_id
    if (!contentId || seen.has(contentId)) continue
    seen.add(contentId)

    const drillable = isDrillable(contentId)
    if (!drillable) continue

    const slug = row.exercise_types?.slug ?? 'sentence'
    const wordBankId = parseWordBankId(contentId)

    items.push({
      contentId,
      wordBankId,
      slug,
      label: resolveLabel(contentId, row, fragments, words),
      typeLabel: exerciseTypeLabel(slug),
      drillable: true,
      phrase: resolvePhrase(contentId, row, fragments, words),
      failedAt: row.answered_at ?? new Date().toISOString(),
    })

    if (items.length >= limit) break
  }

  return items
}

export function computeCanStartReview(summary: {
  failedSentences: FailedSentenceItem[]
  weakWords: unknown[]
  dueWords: unknown[]
  soundsDue: unknown[]
}): boolean {
  return (
    summary.dueWords.length > 0 ||
    summary.weakWords.length > 0 ||
    summary.soundsDue.length > 0 ||
    summary.failedSentences.some((item) => item.drillable)
  )
}

export function buildReviewHubCounts(
  failedSentences: FailedSentenceItem[],
  weakWords: unknown[],
  dueWords: unknown[],
  soundsDue: unknown[],
  dueTopics: unknown[] = [],
  weakTopics: unknown[] = [],
) {
  const reviewable =
    dueWords.length + weakWords.length + soundsDue.length + failedSentences.filter((f) => f.drillable).length + dueTopics.length

  return {
    failedSentences: failedSentences.length,
    weakWords: weakWords.length,
    dueWords: dueWords.length,
    soundsDue: soundsDue.length,
    dueTopics: dueTopics.length,
    weakTopics: weakTopics.length,
    reviewable,
    total: failedSentences.length + weakWords.length + dueWords.length + soundsDue.length + dueTopics.length + weakTopics.length,
  }
}

async function fetchFragmentMap(
  fragmentIds: string[],
  query: (ids: string[]) => Promise<FragmentRow[]>,
): Promise<Map<string, FragmentRow>> {
  const map = new Map<string, FragmentRow>()
  if (fragmentIds.length === 0) return map
  for (const row of await query(fragmentIds)) map.set(row.id, row)
  return map
}

async function fetchWordMap(
  wordIds: string[],
  query: (ids: string[]) => Promise<WordRow[]>,
): Promise<Map<string, WordRow>> {
  const map = new Map<string, WordRow>()
  if (wordIds.length === 0) return map
  for (const row of await query(wordIds)) map.set(row.id, row)
  return map
}

export function collectFailedSentenceLookups(rows: FailedHistoryRow[]): {
  fragmentIds: string[]
  wordIds: string[]
} {
  const fragmentIds = new Set<string>()
  const wordIds = new Set<string>()

  for (const row of rows) {
    const contentId = row.content_id
    if (!contentId) continue
    const wordId = parseWordBankId(contentId)
    if (wordId) wordIds.add(wordId)
    const ref = parseContentRef(contentId)
    if (ref?.source === 'text_fragments' && isUuid(ref.id)) fragmentIds.add(ref.id)
  }

  return { fragmentIds: [...fragmentIds], wordIds: [...wordIds] }
}

export async function resolveFailedSentenceLookups(
  rows: FailedHistoryRow[],
  queryFragments: (ids: string[]) => Promise<FragmentRow[]>,
  queryWords: (ids: string[]) => Promise<WordRow[]>,
): Promise<{ fragments: Map<string, FragmentRow>; words: Map<string, WordRow> }> {
  const { fragmentIds, wordIds } = collectFailedSentenceLookups(rows)
  const [fragments, words] = await Promise.all([
    fetchFragmentMap(fragmentIds, queryFragments),
    fetchWordMap(wordIds, queryWords),
  ])
  return { fragments, words }
}
