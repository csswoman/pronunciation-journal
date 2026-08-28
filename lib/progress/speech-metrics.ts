import { SPEECH_CONSTRAINTS } from '@/lib/exercises/speech-constraints'

/**
 * Capability metrics for speaking.
 *
 * These answer "what can I do now that I could not do before", which streaks
 * and lesson counts cannot. Latency is the direct measure of freezing: it is
 * the number that moves when hesitation turns into automaticity.
 */

export interface SpeechAnswerRow {
  slug: string
  timeMs: number | null
  /** Constraint the exercise required, when it had one. */
  constraintId: string | null
  isCorrect: boolean
  answeredAt: string
}

/** Above this an "attempt" is a walked-away session, not thinking time. */
const MAX_PLAUSIBLE_LATENCY_MS = 120_000

const SPOKEN_SLUGS = new Set(['spoken_production', 'speak_word', 'cs_shadow_phrase'])

function spokenRows(rows: readonly SpeechAnswerRow[]): SpeechAnswerRow[] {
  return rows.filter(
    (r) =>
      SPOKEN_SLUGS.has(r.slug) &&
      typeof r.timeMs === 'number' &&
      r.timeMs > 0 &&
      r.timeMs <= MAX_PLAUSIBLE_LATENCY_MS,
  )
}

/** Mean time-to-answer on spoken items, or null when there is no data. */
export function averageSpeechLatencyMs(rows: readonly SpeechAnswerRow[]): number | null {
  const spoken = spokenRows(rows)
  if (spoken.length === 0) return null
  const total = spoken.reduce((sum, r) => sum + (r.timeMs ?? 0), 0)
  return Math.round(total / spoken.length)
}

export interface TenseVariety {
  /** Distinct constraints the learner has produced correctly. */
  distinct: number
  /** Total constraints available. */
  total: number
  /** Constraint ids not yet produced correctly. */
  missing: string[]
}

/** Which structures the learner can actually produce, not just recognise. */
export function tenseVarietyScore(rows: readonly SpeechAnswerRow[]): TenseVariety {
  const produced = new Set(
    rows
      .filter((r) => r.isCorrect && r.constraintId)
      .map((r) => r.constraintId as string),
  )
  const all = SPEECH_CONSTRAINTS.map((c) => c.id as string)
  return {
    distinct: produced.size,
    total: all.length,
    missing: all.filter((id) => !produced.has(id)),
  }
}

export interface LatencyTrend {
  recentMs: number
  olderMs: number
  /** Positive means the learner got faster. */
  improvedMs: number
}

const WINDOW_MS = 14 * 86_400_000

/**
 * Compare the last two weeks against the two before them.
 * Null when either window has no spoken data.
 */
export function latencyTrend(
  rows: readonly SpeechAnswerRow[],
  now: number = Date.now(),
): LatencyTrend | null {
  const recentRows: SpeechAnswerRow[] = []
  const olderRows: SpeechAnswerRow[] = []

  for (const row of rows) {
    const at = Date.parse(row.answeredAt)
    if (Number.isNaN(at)) continue
    const age = now - at
    if (age <= WINDOW_MS) recentRows.push(row)
    else if (age <= WINDOW_MS * 2) olderRows.push(row)
  }

  const recentMs = averageSpeechLatencyMs(recentRows)
  const olderMs = averageSpeechLatencyMs(olderRows)
  if (recentMs === null || olderMs === null) return null

  return { recentMs, olderMs, improvedMs: olderMs - recentMs }
}
