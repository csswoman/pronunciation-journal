import type { SupabaseClient } from '@supabase/supabase-js'
import type { SrsHistoryGroup, SrsHistoryItem } from '@/lib/review/types'
import { SENTENCE_EXERCISE_IDS } from '@/lib/review/failed-sentences-core'

// --- Row types ---

type WordRow = {
  id: string
  text: string
  translation: string | null
  interval_days: number
  next_review_at: string | null
  last_reviewed_at: string | null
}

type SoundRow = {
  contrast_id: string
  interval_days: number
  next_review: string | null
  updated_at: string | null
  ipa: string | null
  example: string | null
}

type SentenceRow = {
  content_id: string | null
  answered_at: string | null
  target_word: string | null
  user_answer: string | null
}

// --- Normalization helpers (exported for unit tests) ---

export function normalizeWordRow(row: WordRow): SrsHistoryItem {
  return {
    id: `words:${row.id}`,
    domain: 'words',
    label: row.text,
    sublabel: row.translation ?? undefined,
    intervalDays: row.interval_days,
    nextReviewAt: row.next_review_at,
    lastPracticedAt: row.last_reviewed_at ?? new Date(0).toISOString(),
  }
}

export function normalizeSoundRow(row: SoundRow): SrsHistoryItem {
  return {
    id: `sounds:${row.contrast_id}`,
    domain: 'sounds',
    label: row.ipa ?? row.contrast_id,
    sublabel: row.example ?? undefined,
    intervalDays: row.interval_days,
    nextReviewAt: row.next_review,
    lastPracticedAt: row.updated_at ?? new Date(0).toISOString(),
  }
}

export function normalizeSentenceRow(row: SentenceRow): SrsHistoryItem | null {
  const contentId = row.content_id
  if (!contentId) return null
  const label =
    row.target_word?.trim() ||
    row.user_answer?.trim() ||
    contentId
  return {
    id: `sentences:${contentId}`,
    domain: 'sentences',
    label,
    intervalDays: 0, // sentences don't have SRS intervals yet
    nextReviewAt: null,
    lastPracticedAt: row.answered_at ?? new Date(0).toISOString(),
  }
}

// --- Queries ---

async function fetchWordHistory(
  supabase: SupabaseClient,
  userId: string,
  limit: number,
): Promise<SrsHistoryItem[]> {
  const { data } = await supabase
    .from('word_bank')
    .select('id, text, translation, interval_days, next_review_at, last_reviewed_at')
    .eq('user_id', userId)
    .not('last_reviewed_at', 'is', null)
    .order('last_reviewed_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map(normalizeWordRow)
}

async function fetchSoundHistory(
  supabase: SupabaseClient,
  userId: string,
  limit: number,
): Promise<SrsHistoryItem[]> {
  const { data } = await supabase
    .from('user_contrast_progress')
    .select('contrast_id, interval_days, next_review, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (!data || data.length === 0) return []

  const ipaList = [...new Set(data.map((r) => r.contrast_id.split('|')[0]))]
  const { data: sounds } = await supabase
    .from('phoneme_sounds')
    .select('ipa, example')
    .in('ipa', ipaList)

  const soundMap = new Map<string, { ipa: string; example: string | null }>(
    (sounds ?? []).map((s) => [s.ipa, s]),
  )

  return data.map((r) => {
    const ipaKey = r.contrast_id.split('|')[0]
    const sound = soundMap.get(ipaKey)
    return normalizeSoundRow({
      ...r,
      ipa: sound ? `/${sound.ipa}/` : `/${ipaKey}/`,
      example: sound?.example ?? null,
    })
  })
}

async function fetchSentenceHistory(
  supabase: SupabaseClient,
  userId: string,
  limit: number,
): Promise<SrsHistoryItem[]> {
  const { data } = await supabase
    .from('answer_history')
    .select('content_id, answered_at, target_word, user_answer')
    .eq('user_id', userId)
    .eq('is_correct', false)
    .in('exercise_type_id', [...SENTENCE_EXERCISE_IDS])
    .order('answered_at', { ascending: false })
    .limit(limit)

  const seen = new Set<string>()
  const items: SrsHistoryItem[] = []
  for (const row of data ?? []) {
    if (!row.content_id || seen.has(row.content_id)) continue
    seen.add(row.content_id)
    const item = normalizeSentenceRow(row)
    if (item) items.push(item)
  }
  return items
}

export async function getSrsHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<SrsHistoryGroup[]> {
  const LIMIT = 20
  const [words, sounds, sentences] = await Promise.all([
    fetchWordHistory(supabase, userId, LIMIT),
    fetchSoundHistory(supabase, userId, LIMIT),
    fetchSentenceHistory(supabase, userId, LIMIT),
  ])

  const groups: SrsHistoryGroup[] = []
  if (words.length > 0) groups.push({ domain: 'words', title: 'Words', items: words })
  if (sounds.length > 0) groups.push({ domain: 'sounds', title: 'Sounds', items: sounds })
  if (sentences.length > 0) groups.push({ domain: 'sentences', title: 'Failed sentences', items: sentences })

  return groups
}
