import { db } from '@/lib/db'
import type {
  EdAllophone,
  EdCluster,
  EdEnvironment,
  UserEdClusterProgress,
} from './types'

export const LADDER_STABILITY_ACCURACY = 0.8

export interface RecordEdDrillAttempt {
  correct: boolean
  suspectedEpenthesis: boolean
  level?: EdEnvironment
}

const T_CLUSTERS = new Set<EdCluster>(['kt', 'pt', 'ft', 'st', 'ʃt', 'tʃt'])
const ID_CLUSTERS = new Set<EdCluster>(['t-id', 'd-id'])

function allophoneForCluster(cluster: EdCluster): EdAllophone {
  if (ID_CLUSTERS.has(cluster)) return 'id'
  return T_CLUSTERS.has(cluster) ? 't' : 'd'
}

export async function readClusterProgress(
  userId: string,
): Promise<Map<EdCluster, UserEdClusterProgress>> {
  const rows = await db.userEdClusterProgress.where('userId').equals(userId).toArray()
  return new Map(rows.map((row) => [row.cluster, row]))
}

export async function recordAttempt(
  userId: string,
  cluster: EdCluster,
  { correct, suspectedEpenthesis, level = 1 }: RecordEdDrillAttempt,
): Promise<UserEdClusterProgress> {
  const id = `${userId}:${cluster}`
  const existing = await db.userEdClusterProgress.get(id)
  const attemptsCount = (existing?.attemptsCount ?? 0) + 1
  const previousAccuracy = existing?.accuracy ?? 0
  const accuracy = (previousAccuracy * (attemptsCount - 1) + Number(correct)) / attemptsCount
  const reachedStableLevel = level === existing?.unlockedLevel && accuracy >= LADDER_STABILITY_ACCURACY
  const unlockedLevel = reachedStableLevel
    ? Math.min(3, level + 1) as EdEnvironment
    : existing?.unlockedLevel ?? 1
  const progress: UserEdClusterProgress = {
    id,
    userId,
    cluster,
    allophone: existing?.allophone ?? allophoneForCluster(cluster),
    attemptsCount,
    accuracy,
    unlockedLevel,
    epenthesisWarningsCount: (existing?.epenthesisWarningsCount ?? 0) + Number(suspectedEpenthesis),
    lastPracticedAt: new Date().toISOString(),
  }

  await db.userEdClusterProgress.put(progress)
  return progress
}
