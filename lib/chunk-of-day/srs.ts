import { db, getSRSData, saveSRSData } from '@/lib/db'
import { contentSrsPayload } from '@/lib/practice/content-srs-queries'
import { deriveFsrsState } from '@/lib/srs/fsrs-migrate'
import { nextFsrsRealReviews } from '@/lib/srs/fsrs-optimizer-eligibility'
import { scheduleFsrsReview, type Grade } from '@/lib/srs/fsrs-schedule'
import { enqueue } from '@/lib/sync/sync-manager'
import type { SRSData } from '@/lib/types'

const PREFIX = 'chunk:'

export function chunkSrsId(chunkId: string): string {
  return `${PREFIX}${chunkId}`
}

function qualityToGrade(quality: number): Grade {
  if (quality <= 2) return 'Again'
  if (quality === 3) return 'Hard'
  if (quality === 4) return 'Good'
  return 'Easy'
}

export async function upsertChunkSrs(userId: string, chunkId: string, quality: number): Promise<void> {
  const id = chunkSrsId(chunkId)
  const now = new Date()
  const current: SRSData = (await getSRSData(id, userId)) ?? {
    wordId: id,
    word: chunkId,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: now.toISOString(),
  }
  const state = current.stability !== undefined && current.difficulty !== undefined && current.state
    ? {
        stability: current.stability,
        difficulty: current.difficulty,
        state: current.state,
        fsrsRealReviews: current.fsrsRealReviews ?? 0,
      }
    : {
        ...deriveFsrsState(current, now),
        state: current.repetitions > 0 ? 'Review' as const : 'New' as const,
        fsrsRealReviews: 0,
      }
  const grade = qualityToGrade(Math.max(0, Math.min(5, Math.round(quality))))
  const scheduled = scheduleFsrsReview({ ...state, grade, now })
  const next = {
    ...current,
    stability: scheduled.stability,
    difficulty: scheduled.difficulty,
    state: scheduled.state,
    fsrsRealReviews: nextFsrsRealReviews(state.fsrsRealReviews, { isRepair: false }),
    interval: scheduled.interval,
    nextReview: scheduled.dueAt.toISOString(),
    lastReview: now.toISOString(),
    repetitions: current.repetitions + (grade === 'Again' ? 0 : 1),
  }
  await db.transaction('rw', [db.srsData, db.syncOutbox], async () => {
    await saveSRSData(next, userId)
    await enqueue(
      userId,
      'content_srs',
      'upsert',
      contentSrsPayload(userId, 'chunks', chunkId, next),
      undefined,
      'user_id,namespace,content_id',
    )
  })
}
