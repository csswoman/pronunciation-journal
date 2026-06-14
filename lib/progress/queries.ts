import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getDailyStreak, toLocalDateString, STREAK_TIMEZONE, type DailyStreakResult } from '@/lib/daily/streak'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Activity level per calendar day for heatmap (0 = none, 3 = strong). */
export type ConsistencyHeatLevel = 0 | 1 | 2 | 3

export interface DailyCompletionStats {
  rate7: number   // 0-100 percentage over last 7 days
  rate30: number  // 0-100 percentage over last 30 days
  completedDays7: number
  completedDays30: number
  /** Last 30 days, oldest → today. */
  heatmap30: ConsistencyHeatLevel[]
}

export interface WeeklySummaryStats {
  exercises7: number
  newWords7: number
}

export interface AccuracyStats {
  accuracy7: number  // 0-100 weighted accuracy over last 7 days
  totalAnswers7: number
}

export interface WordBankByStatus {
  new: number
  learning: number
  review: number
  mastered: number
}

export interface WeakestPhoneme {
  ipa: string
  accuracy: number  // 0-100
  totalAttempts: number
}

export interface SkillProfileData {
  wordsByStatus: WordBankByStatus
  weakestPhonemes: WeakestPhoneme[]
  /** Unique Core 1000 words answered correctly at least once. */
  core1000Practiced: number
  /** Total course/mini-lesson completions recorded. */
  lessonsCompleted: number
}

export interface CoachWeakTopic {
  topic: string
  errorRate: number
  sampleCount: number
}

export interface CoachInsights {
  weakTopics: CoachWeakTopic[]
  cefrEstimate: string | null
  avgAccuracy: number | null
}

export interface ProgressPageData {
  streak: DailyStreakResult
  dailyCompletion: DailyCompletionStats
  accuracy: AccuracyStats
  skillProfile: SkillProfileData
  weeklySummary: WeeklySummaryStats
  coachInsights: CoachInsights
}

// ── Queries ───────────────────────────────────────────────────────────────────

const DAILY_THRESHOLD = 5

/** How many qualifying daily-context days in a window of N days. */
async function getDailyCompletionStats(userId: string): Promise<DailyCompletionStats> {
  const supabase = await createSupabaseServerClient()

  const since30 = new Date()
  since30.setDate(since30.getDate() - 30)

  const { data } = await supabase
    .from('answer_history')
    .select('answered_at')
    .eq('user_id', userId)
    .eq('context', 'daily')
    .not('answered_at', 'is', null)
    .gte('answered_at', since30.toISOString())

  const rows = data ?? []

  const countsByDay = new Map<string, number>()
  for (const row of rows) {
    const day = toLocalDateString(row.answered_at as string, STREAK_TIMEZONE)
    countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1)
  }

  const today = new Date()
  let completedDays7 = 0
  let completedDays30 = 0
  const heatmap30: ConsistencyHeatLevel[] = []

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const day = toLocalDateString(d.toISOString(), STREAK_TIMEZONE)
    const count = countsByDay.get(day) ?? 0
    const level: ConsistencyHeatLevel =
      count >= DAILY_THRESHOLD * 2
        ? 3
        : count >= DAILY_THRESHOLD
          ? 2
          : count > 0
            ? 1
            : 0

    heatmap30.push(level)

    if (count >= DAILY_THRESHOLD) {
      completedDays30++
      if (i <= 6) completedDays7++
    }
  }

  return {
    rate7: Math.round((completedDays7 / 7) * 100),
    rate30: Math.round((completedDays30 / 30) * 100),
    completedDays7,
    completedDays30,
    heatmap30,
  }
}

async function getWeeklySummaryStats(userId: string): Promise<WeeklySummaryStats> {
  const supabase = await createSupabaseServerClient()
  const since7 = new Date()
  since7.setDate(since7.getDate() - 7)

  const [answersResult, wordsResult] = await Promise.all([
    supabase
      .from('answer_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('answered_at', since7.toISOString())
      .not('answered_at', 'is', null),
    supabase
      .from('word_bank')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since7.toISOString()),
  ])

  return {
    exercises7: answersResult.count ?? 0,
    newWords7: wordsResult.count ?? 0,
  }
}

async function getAccuracyStats(userId: string): Promise<AccuracyStats> {
  const supabase = await createSupabaseServerClient()

  const since7 = new Date()
  since7.setDate(since7.getDate() - 7)

  const { data } = await supabase
    .from('answer_history')
    .select('grade, is_correct')
    .eq('user_id', userId)
    .gte('answered_at', since7.toISOString())
    .not('answered_at', 'is', null)

  const rows = data ?? []
  if (rows.length === 0) return { accuracy7: 0, totalAnswers7: 0 }

  // Prefer grade (0-5) when present, fall back to is_correct boolean
  let weightedSum = 0
  for (const row of rows) {
    if (row.grade !== null && row.grade !== undefined) {
      weightedSum += (row.grade / 5) * 100
    } else {
      weightedSum += row.is_correct ? 100 : 0
    }
  }

  return {
    accuracy7: Math.round(weightedSum / rows.length),
    totalAnswers7: rows.length,
  }
}

async function getSkillProfileData(userId: string): Promise<SkillProfileData> {
  const supabase = await createSupabaseServerClient()

  const [wordBankResult, phonemeResult, core1000Result, lessonsResult] = await Promise.all([
    supabase
      .from('word_bank')
      .select('srs_status')
      .eq('user_id', userId)
      .eq('status', 'ready'),

    supabase
      .from('user_contrast_progress')
      .select('contrast_id, total_attempts, correct_answers')
      .eq('user_id', userId)
      .gt('total_attempts', 0)
      .order('total_attempts', { ascending: false })
      .limit(40),

    supabase
      .from('answer_history')
      .select('content_id', { count: 'exact', head: false })
      .eq('user_id', userId)
      .eq('context', 'core-1000')
      .eq('is_correct', true),

    supabase
      .from('answer_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('context', 'courses'),
  ])

  // Words by SRS status
  const wordsByStatus: WordBankByStatus = { new: 0, learning: 0, review: 0, mastered: 0 }
  for (const row of wordBankResult.data ?? []) {
    const s = row.srs_status as keyof WordBankByStatus
    if (s in wordsByStatus) wordsByStatus[s]++
  }

  // Aggregate contrast progress by first IPA, then show weakest sounds
  const byIpa = new Map<string, { correct: number; total: number }>()
  for (const r of phonemeResult.data ?? []) {
    const [ipa] = r.contrast_id.split('|')
    const prev = byIpa.get(ipa) ?? { correct: 0, total: 0 }
    byIpa.set(ipa, { correct: prev.correct + r.correct_answers, total: prev.total + r.total_attempts })
  }

  const phonemes = [...byIpa.entries()]
    .filter(([, v]) => v.total >= 5)
    .map(([ipa, v]) => ({
      ipa,
      accuracy: Math.round((v.correct / v.total) * 100),
      totalAttempts: v.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5)

  // Unique Core 1000 words practiced correctly (dedupe by content_id)
  const core1000Ids = new Set((core1000Result.data ?? []).map((r) => r.content_id))

  return {
    wordsByStatus,
    weakestPhonemes: phonemes,
    core1000Practiced: core1000Ids.size,
    lessonsCompleted: lessonsResult.count ?? 0,
  }
}

async function getCoachInsights(userId: string): Promise<CoachInsights> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('user_learning_state')
      .select('state')
      .eq('user_id', userId)
      .maybeSingle()

    if (!data?.state) return { weakTopics: [], cefrEstimate: null, avgAccuracy: null }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- jsonb blob, shape validated at write time
    const state = data.state as any
    const weakTopics: CoachWeakTopic[] = (state?.grammar?.weakTopics ?? [])
      .filter((t: CoachWeakTopic) => t.errorRate > 0.3 && t.sampleCount >= 3)
      .sort((a: CoachWeakTopic, b: CoachWeakTopic) => b.errorRate - a.errorRate)
      .slice(0, 5)

    return {
      weakTopics,
      cefrEstimate: state?.level?.cefrEstimate ?? null,
      avgAccuracy: state?.pronunciation?.averageAccuracy ?? null,
    }
  } catch {
    return { weakTopics: [], cefrEstimate: null, avgAccuracy: null }
  }
}

export async function getProgressPageData(userId: string): Promise<ProgressPageData> {
  const [streak, dailyCompletion, accuracy, skillProfile, weeklySummary, coachInsights] =
    await Promise.all([
      getDailyStreak(userId),
      getDailyCompletionStats(userId),
      getAccuracyStats(userId),
      getSkillProfileData(userId),
      getWeeklySummaryStats(userId),
      getCoachInsights(userId),
    ])

  return { streak, dailyCompletion, accuracy, skillProfile, weeklySummary, coachInsights }
}
