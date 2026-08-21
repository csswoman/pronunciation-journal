import { beforeEach, describe, expect, it, vi } from 'vitest'

type Row = Record<string, unknown>

const callLog = vi.hoisted(() => ({
  limits: [] as number[],
  gte: [] as Array<{ column: string; value: string }>,
  tables: [] as string[],
}))

const fixtures = vi.hoisted(() => ({
  sessions: [] as Row[],
  answers: [] as Row[],
  contrasts: [] as Row[],
  wordBank: [] as Row[],
  lessons: { count: 0 },
}))

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function makeChain(table: string) {
  let rows: Row[] = []
  if (table === 'activity_sessions') rows = fixtures.sessions
  if (table === 'answer_history') rows = fixtures.answers
  if (table === 'user_contrast_progress') rows = fixtures.contrasts
  if (table === 'word_bank') rows = fixtures.wordBank

  const state = {
    gteColumn: null as string | null,
    gteValue: null as string | null,
    limitN: null as number | null,
    head: false,
  }

  const resolve = () => {
    let data = [...rows]
    if (state.gteColumn && state.gteValue) {
      data = data.filter((row) => {
        const raw = row[state.gteColumn!]
        return typeof raw === 'string' && raw >= state.gteValue!
      })
    }
    if (state.limitN != null) {
      data = data.slice(0, state.limitN)
    }
    if (state.head) {
      return Promise.resolve({ data: null, count: data.length, error: null })
    }
    return Promise.resolve({ data, count: data.length, error: null })
  }

  const chain: Record<string, unknown> = {
    select: (_cols?: string, opts?: { head?: boolean; count?: string }) => {
      if (opts?.head) state.head = true
      return chain
    },
    eq: () => chain,
    gt: () => chain,
    not: () => chain,
    order: () => chain,
    gte: (column: string, value: string) => {
      state.gteColumn = column
      state.gteValue = value
      callLog.gte.push({ column, value })
      return chain
    },
    limit: (n: number) => {
      state.limitN = n
      callLog.limits.push(n)
      return chain
    },
    then: (resolveFn: (value: unknown) => unknown, rejectFn?: (reason: unknown) => unknown) =>
      resolve().then(resolveFn, rejectFn),
  }
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({
    from: (table: string) => {
      callLog.tables.push(table)
      if (table === 'lesson_completions') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: null, count: fixtures.lessons.count, error: null }),
          }),
        }
      }
      return makeChain(table)
    },
  }),
}))

vi.mock('@/lib/phoneme-practice/mastery-pct', () => ({
  rankWeakestSounds: (rows: Array<{ contrast_id: string }>, opts?: { limit?: number }) =>
    rows.slice(0, opts?.limit ?? rows.length).map((r, i) => ({
      ipa: `/${r.contrast_id}/`,
      mastery: 50 - i,
      totalAttempts: 10,
    })),
}))

import {
  getDailyCompletionStats,
  getRecentActivitySessions,
  getSkillProfileData,
  PROGRESS_ANSWER_WINDOW_DAYS,
  RECENT_ACTIVITY_SESSION_LIMIT,
  SKILL_PROFILE_CONTRAST_LIMIT,
} from '../queries'

describe('progress query truncation (oversized histories)', () => {
  beforeEach(() => {
    callLog.limits.length = 0
    callLog.gte.length = 0
    callLog.tables.length = 0
    fixtures.sessions = []
    fixtures.answers = []
    fixtures.contrasts = []
    fixtures.wordBank = []
    fixtures.lessons = { count: 0 }
  })

  it('keeps only RECENT_ACTIVITY_SESSION_LIMIT sessions when more than 30 exist', async () => {
    // 31 sessions — above both the common "30" mental model and the real cap (15).
    fixtures.sessions = Array.from({ length: 31 }, (_, i) => ({
      id: `s-${i}`,
      source: 'daily_plan',
      skill_tags: [],
      exercises_total: 5,
      accuracy_pct: 80,
      xp_earned: 10,
      completed_at: daysAgo(i),
    }))

    const recent = await getRecentActivitySessions('user-1')

    expect(callLog.limits).toContain(RECENT_ACTIVITY_SESSION_LIMIT)
    expect(recent).toHaveLength(RECENT_ACTIVITY_SESSION_LIMIT)
    expect(recent.map((s) => s.id)).toEqual(
      fixtures.sessions.slice(0, RECENT_ACTIVITY_SESSION_LIMIT).map((s) => s.id),
    )
    expect(fixtures.sessions.length).toBeGreaterThan(30)
    expect(recent.length).toBeLessThan(fixtures.sessions.length)
  })

  it('ignores answers older than PROGRESS_ANSWER_WINDOW_DAYS in the completion heatmap', async () => {
    // Need ≥ DAILY_STREAK_THRESHOLD (5) answers per day to count as completed.
    const inWindowDay0 = Array.from({ length: 5 }, () => ({ answered_at: daysAgo(0) }))
    const inWindowDay15 = Array.from({ length: 5 }, () => ({ answered_at: daysAgo(15) }))
    fixtures.answers = [
      ...inWindowDay0,
      ...inWindowDay15,
      // Outside the rolling window — must not create a completed day on its own.
      ...Array.from({ length: 5 }, () => ({
        answered_at: daysAgo(PROGRESS_ANSWER_WINDOW_DAYS + 1),
      })),
      ...Array.from({ length: 5 }, () => ({
        answered_at: daysAgo(PROGRESS_ANSWER_WINDOW_DAYS + 45),
      })),
    ]

    const stats = await getDailyCompletionStats('user-1')

    expect(callLog.gte.some((g) => g.column === 'answered_at')).toBe(true)
    const cutoff = callLog.gte.find((g) => g.column === 'answered_at')!.value
    const cutoffMs = Date.parse(cutoff)
    expect(Number.isFinite(cutoffMs)).toBe(true)
    // Cutoff ≈ now - 30d (allow a few seconds of test skew).
    const expected = Date.now() - PROGRESS_ANSWER_WINDOW_DAYS * 24 * 60 * 60 * 1000
    expect(Math.abs(cutoffMs - expected)).toBeLessThan(10_000)

    // Only answers inside the window survive the mock gte filter → 2 completed days.
    expect(stats.completedDays30).toBe(2)
    expect(stats.heatmap30.filter((level) => level > 0)).toHaveLength(2)
  })

  it('fetches at most SKILL_PROFILE_CONTRAST_LIMIT contrasts when more than 40 exist', async () => {
    fixtures.contrasts = Array.from({ length: 45 }, (_, i) => ({
      contrast_id: `c-${i}`,
      total_attempts: 100 - i,
      correct_answers: 50,
      mastery_pct: 40,
    }))
    fixtures.wordBank = [
      {
        srs_status: 'learning',
        familiarity_status: 'unknown',
        mastery_provenance: 'none',
        objective_evidence_count: 0,
      },
    ]

    const profile = await getSkillProfileData('user-1')

    expect(callLog.limits).toContain(SKILL_PROFILE_CONTRAST_LIMIT)
    expect(fixtures.contrasts.length).toBeGreaterThan(40)
    // rankWeakestSounds is called with the already-truncated row set (≤ 40).
    expect(profile.weakestPhonemes.length).toBeLessThanOrEqual(5)
    expect(profile.weakestPhonemes[0]?.ipa).toBe('/c-0/')
  })
})
