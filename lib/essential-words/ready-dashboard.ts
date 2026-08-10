import { db } from '@/lib/db'
import { ESSENTIAL_WORD_PREFIX } from './types'
import { getAttemptLogs, getLearningItems } from './queries'
import { deriveSkillStatus, parseLearningItemId } from './skill-item'
import { addLocalDays } from './ready-date'
import { bucketDueForecast, type ForecastDay } from './ready-forecast'
import {
  classifyTouchedWord,
  tallyVocabularyBuckets,
  type VocabBucket,
} from './ready-vocabulary'
import { computeRetention30d } from './ready-retention'
import { collectLeeches, type LeechWord } from './ready-leeches'
import { buildHeatmap12w, type HeatmapDay } from './ready-heatmap'
import { buildStreakMarks } from './ready-streak-marks'
import {
  loadLastEssentialWordsSession,
  type LastEssentialWordsSession,
} from './ready-last-session'

export interface EssentialWordsReadyDashboard {
  forecast: ForecastDay[]
  vocabulary: Record<VocabBucket, number> | null
  retention: { pct: number; sampleSize: number } | null
  leeches: LeechWord[]
  streakMarks: boolean[]
  heatmap: HeatmapDay[] | null
  lastSession: LastEssentialWordsSession | null
}

function displayWord(wordId: string, fallback?: string): string {
  if (fallback) return fallback
  return wordId.startsWith(ESSENTIAL_WORD_PREFIX)
    ? wordId.slice(ESSENTIAL_WORD_PREFIX.length)
    : wordId
}

export async function loadEssentialWordsReadyDashboard(
  userId: string,
  now = new Date(),
): Promise<EssentialWordsReadyDashboard> {
  const from = addLocalDays(now, -83).toISOString()
  const [learningItems, attempts, srsEntries] = await Promise.all([
    getLearningItems(userId),
    getAttemptLogs(userId, { from }),
    db.srsData
      .filter((e) => e.userId === userId && e.wordId.startsWith(ESSENTIAL_WORD_PREFIX))
      .toArray(),
  ])

  const srsByWordId = new Map(srsEntries.map((e) => [e.wordId, e]))

  const dueAts: string[] = []
  for (const item of learningItems) {
    if (item.schedule.kind === 'fsrs' && item.schedule.dueAt) {
      dueAts.push(item.schedule.dueAt)
    } else if (item.schedule.kind === 'provisional' && item.schedule.dueAt) {
      dueAts.push(item.schedule.dueAt)
    }
  }
  if (dueAts.length === 0) {
    for (const entry of srsEntries) {
      if (entry.status === 'mastered' || entry.status === 'snoozed') continue
      dueAts.push(entry.nextReview)
    }
  }

  const meaningByWord = new Map<string, ReturnType<typeof deriveSkillStatus>>()
  const maxLapsesByWord = new Map<string, number>()
  for (const item of learningItems) {
    const parsed = parseLearningItemId(item.id)
    const wordId = parsed?.wordId ?? item.wordId
    if (item.skill === 'meaning') {
      meaningByWord.set(wordId, deriveSkillStatus(item))
    }
    const prev = maxLapsesByWord.get(wordId) ?? 0
    if (item.lapses > prev) maxLapsesByWord.set(wordId, item.lapses)
  }

  const touchedIds = new Set<string>([
    ...meaningByWord.keys(),
    ...srsEntries.map((e) => e.wordId),
    ...learningItems.map((item) => parseLearningItemId(item.id)?.wordId ?? item.wordId),
  ])

  const classified = Array.from(touchedIds).map((wordId) => {
    const srs = srsByWordId.get(wordId)
    return {
      wordId,
      bucket: classifyTouchedWord({
        meaningStatus: meaningByWord.get(wordId) ?? null,
        vaultStatus: srs?.status,
        legacyState: srs?.state,
      }),
    }
  })

  const vocabulary =
    classified.length === 0 ? null : tallyVocabularyBuckets(classified)

  const retention = computeRetention30d(
    attempts.map((a) => ({
      occurredAt: a.occurredAt,
      correct: a.assessment.correct,
      eventType: a.eventType,
    })),
    now,
  )

  const leeches = collectLeeches(
    Array.from(maxLapsesByWord.entries()).map(([wordId, lapses]) => ({
      wordId,
      word: displayWord(wordId, srsByWordId.get(wordId)?.word),
      lapses,
    })),
  )

  const occurredAts = attempts.map((a) => a.occurredAt)
  const heatmapDays = buildHeatmap12w(occurredAts, now)
  const heatmap = occurredAts.length === 0 ? null : heatmapDays

  return {
    forecast: bucketDueForecast(dueAts, now),
    vocabulary,
    retention,
    leeches,
    streakMarks: buildStreakMarks(occurredAts, now),
    heatmap,
    lastSession: loadLastEssentialWordsSession(userId),
  }
}
