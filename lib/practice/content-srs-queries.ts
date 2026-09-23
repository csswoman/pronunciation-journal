import { db, ensureDbReady } from '@/lib/db'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { FsrsCardState, SRSData } from '@/lib/types'

export type ContentSrsNamespace = 'chunks' | 'text_fragments'

type RemoteContentSrs = {
  user_id: string
  content_id: string
  namespace: ContentSrsNamespace
  stability: number
  difficulty: number
  state: string
  interval: number
  repetitions: number
  fsrs_real_reviews: number | null
  next_review_at: string
  last_review_at: string | null
  updated_at: string
}

const FSRS_STATES: ReadonlySet<FsrsCardState> = new Set(['New', 'Learning', 'Review', 'Relearning'])

function localId(namespace: ContentSrsNamespace, contentId: string): string {
  return namespace === 'chunks' ? `chunk:${contentId}` : `fragment:${contentId}`
}

function isFsrsCardState(value: string): value is FsrsCardState {
  return FSRS_STATES.has(value as FsrsCardState)
}

/** Converts an FSRS schedule to the remote, user-owned content_srs contract. */
export function contentSrsPayload(
  userId: string,
  namespace: ContentSrsNamespace,
  contentId: string,
  schedule: SRSData,
): Record<string, unknown> {
  if (schedule.stability === undefined || schedule.difficulty === undefined || schedule.state === undefined) {
    throw new Error('content SRS rows require a complete FSRS schedule')
  }

  return {
    user_id: userId,
    content_id: contentId,
    namespace,
    stability: schedule.stability,
    difficulty: schedule.difficulty,
    state: schedule.state,
    interval: schedule.interval,
    repetitions: schedule.repetitions,
    fsrs_real_reviews: schedule.fsrsRealReviews ?? null,
    next_review_at: schedule.nextReview,
    last_review_at: schedule.lastReview ?? null,
    updated_at: schedule.lastReview ?? new Date().toISOString(),
  }
}

function toLocalRow(row: RemoteContentSrs): SRSData | null {
  if (!isFsrsCardState(row.state)) return null

  return {
    userId: row.user_id,
    wordId: localId(row.namespace, row.content_id),
    word: row.content_id,
    ease: 2.5,
    interval: row.interval,
    repetitions: row.repetitions,
    fsrsRealReviews: row.fsrs_real_reviews ?? undefined,
    nextReview: row.next_review_at,
    lastReview: row.last_review_at ?? undefined,
    stability: row.stability,
    difficulty: row.difficulty,
    state: row.state,
  }
}

/**
 * Hydrates chunk and system-fragment schedules with last-write-wins semantics.
 * A remote row replaces its local counterpart only when its `updated_at` is
 * newer than the local review timestamp, preserving offline work queued here.
 */
export async function hydrateContentSrs(userId: string): Promise<void> {
  await ensureDbReady()

  const { data, error } = await getSupabaseBrowserClient()
    // Generated Supabase types lag this migration until it is applied remotely.
    .from('content_srs' as never)
    .select('user_id, content_id, namespace, stability, difficulty, state, interval, repetitions, fsrs_real_reviews, next_review_at, last_review_at, updated_at')
    .eq('user_id' as never, userId)

  if (error) throw error

  const candidates = ((data ?? []) as unknown as RemoteContentSrs[])
    .map((row) => ({ remote: row, local: toLocalRow(row) }))
    .filter((candidate): candidate is { remote: RemoteContentSrs; local: SRSData } => candidate.local !== null)

  const newerRows: SRSData[] = []
  for (const { remote, local } of candidates) {
    const current = await db.srsData.where('[userId+wordId]').equals([userId, local.wordId]).first()
    const localTime = current?.lastReview ? new Date(current.lastReview).getTime() : 0
    if (new Date(remote.updated_at).getTime() > localTime) newerRows.push(local)
  }

  if (newerRows.length > 0) await db.srsData.bulkPut(newerRows)
}
