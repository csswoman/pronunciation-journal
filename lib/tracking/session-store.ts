import { db, type TrackingReviewSessionRecord } from '@/lib/db'
import type { TrackingReviewQueue } from './review-queue'

const TRACKING_REVIEW_TTL_MS = 24 * 60 * 60 * 1000

export async function createTrackingReviewSession(
  userId: string,
  queue: TrackingReviewQueue,
): Promise<TrackingReviewSessionRecord> {
  const createdAt = new Date()
  const record: TrackingReviewSessionRecord = {
    id: crypto.randomUUID(),
    userId,
    queue,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + TRACKING_REVIEW_TTL_MS).toISOString(),
  }
  await db.trackingReviewSessions.put(record)
  return record
}
export async function loadTrackingReviewSession(
  userId: string,
  sessionId: string,
): Promise<TrackingReviewSessionRecord | null> {
  const record = await db.trackingReviewSessions.get(sessionId)
  if (!record || record.userId !== userId) return null
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    await db.trackingReviewSessions.delete(record.id)
    return null
  }
  return record
}

export async function deleteTrackingReviewSession(
  userId: string,
  sessionId: string,
): Promise<void> {
  const record = await db.trackingReviewSessions.get(sessionId)
  if (record?.userId === userId) await db.trackingReviewSessions.delete(sessionId)
}

export async function evictExpiredTrackingReviewSessions(now = new Date()): Promise<void> {
  const expired = await db.trackingReviewSessions
    .where('expiresAt')
    .below(now.toISOString())
    .toArray()
  if (expired.length > 0) {
    await db.trackingReviewSessions.bulkDelete(expired.map((record) => record.id))
  }
}
