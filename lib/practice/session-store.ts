import { db, type PracticeSessionRecord } from '@/lib/db'
import type { ExerciseResult, PracticeExercise } from './types'

const TTL_MS = 24 * 60 * 60 * 1000

function compositeKey(userId: string, soundId: number): string {
  return `${userId}:${soundId}`
}

function isExpired(record: PracticeSessionRecord, now = Date.now()): boolean {
  return new Date(record.expiresAt).getTime() <= now
}

/**
 * Delete all sessions whose `expiresAt` is in the past. Called once on mount
 * to keep the table from accumulating dead rows.
 */
export async function evictExpiredSessions(): Promise<void> {
  const nowIso = new Date().toISOString()
  await db.practiceSessions.where('expiresAt').below(nowIso).delete()
}

export async function loadActiveSession(
  userId: string,
  soundId: number,
): Promise<PracticeSessionRecord | null> {
  const record = await db.practiceSessions.get(compositeKey(userId, soundId))
  if (!record) return null
  if (isExpired(record)) {
    await db.practiceSessions.delete(record.id)
    return null
  }
  return record
}

export async function createSession(params: {
  userId: string
  soundId: number
  exercises: PracticeExercise[]
}): Promise<PracticeSessionRecord> {
  const now = Date.now()
  const record: PracticeSessionRecord = {
    id: compositeKey(params.userId, params.soundId),
    userId: params.userId,
    soundId: params.soundId,
    exercises: params.exercises,
    currentIndex: 0,
    answers: [],
    startedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TTL_MS).toISOString(),
  }
  await db.practiceSessions.put(record)
  return record
}

export async function updateSessionProgress(
  userId: string,
  soundId: number,
  patch: { currentIndex: number; answers: ExerciseResult[] },
): Promise<void> {
  await db.practiceSessions.update(compositeKey(userId, soundId), patch)
}

export async function deleteSession(
  userId: string,
  soundId: number,
): Promise<void> {
  await db.practiceSessions.delete(compositeKey(userId, soundId))
}
