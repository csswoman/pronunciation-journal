import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getDailyStreak } from '@/lib/daily/streak'
import {
  DAILY_STREAK_THRESHOLD,
  toLocalDateString,
  STREAK_TIMEZONE,
  type DailyStreakResult,
} from '@/lib/daily/streak-core'
import {
  ACTIVITY_SOURCE_LABELS,
  type ActivitySessionSummary,
  type ActivitySource,
  type SkillTag,
} from '@/lib/progress/activity-types'
import {
  computeFluencyScores,
  fluencyComparisonLabel,
  type FluencyRawAnswer,
  type FluencyScores,
} from '@/lib/progress/fluency-scores'
import { rankWeakestSounds } from '@/lib/phoneme-practice/mastery-pct'
import type { UserContrastProgress } from '@/lib/phoneme-practice/types'

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

export interface FluencyProfileData {
  scores: FluencyScores
  comparisonLabel?: string
}

export interface ProgressPageData {
  streak: DailyStreakResult
  dailyCompletion: DailyCompletionStats
  accuracy: AccuracyStats
  skillProfile: SkillProfileData
  fluencyProfile: FluencyProfileData
  weeklySummary: WeeklySummaryStats
  coachInsights: CoachInsights
  recentSessions: ActivitySessionSummary[]
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** How many qualifying practice days in a window of N days (any context). */
async function getDailyCompletionStats(userId: string): Promise<DailyCompletionStats> {
  const supabase = await createSupabaseServerClient()

  const since30 = new Date()
  since30.setDate(since30.getDate() - 30)

  const { data } = await supabase
    .from('answer_history')
    .select('answered_at')
    .eq('user_id', userId)
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
      count >= DAILY_STREAK_THRESHOLD * 2
        ? 3
        : count >= DAILY_STREAK_THRESHOLD
          ? 2
          : count > 0
            ? 1
            : 0

    heatmap30.push(level)

    if (count >= DAILY_STREAK_THRESHOLD) {
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
      .select('contrast_id, total_attempts, correct_answers, mastery_pct')
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

  const contrastRows = (phonemeResult.data ?? []) as Pick<
    UserContrastProgress,
    'contrast_id' | 'total_attempts' | 'correct_answers' | 'mastery_pct'
  >[]

  const phonemes = rankWeakestSounds(contrastRows as UserContrastProgress[], { limit: 5 }).map((r) => ({
    ipa: r.ipa,
    accuracy: r.mastery,
    totalAttempts: r.totalAttempts,
  }))

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

async function getFluencyProfile(userId: string, skillProfile: SkillProfileData): Promise<FluencyProfileData> {
  const supabase = await createSupabaseServerClient()
  const since30 = new Date()
  since30.setDate(since30.getDate() - 30)
  const since14 = new Date()
  since14.setDate(since14.getDate() - 14)
  const since7 = new Date()
  since7.setDate(since7.getDate() - 7)

  const [answersResult, contrastResult] = await Promise.all([
    supabase
      .from('answer_history')
      .select('exercise_type_id, context, is_correct, grade, answered_at')
      .eq('user_id', userId)
      .gte('answered_at', since30.toISOString())
      .not('answered_at', 'is', null),
    supabase
      .from('user_contrast_progress')
      .select('correct_answers, total_attempts')
      .eq('user_id', userId),
  ])

  let contrastCorrect = 0
  let contrastTotal = 0
  for (const row of contrastResult.data ?? []) {
    contrastCorrect += row.correct_answers as number
    contrastTotal += row.total_attempts as number
  }

  const rows = (answersResult.data ?? []) as Array<{
    exercise_type_id: number
    context: string | null
    is_correct: boolean
    grade: number | null
    answered_at: string
  }>

  const mapRows = (list: typeof rows): FluencyRawAnswer[] =>
    list.map((row) => ({
      exerciseTypeId: row.exercise_type_id,
      context: row.context,
      isCorrect: row.is_correct,
      grade: row.grade,
    }))

  const base = {
    wordsByStatus: skillProfile.wordsByStatus,
    contrastCorrect,
    contrastTotal,
    core1000Practiced: skillProfile.core1000Practiced,
    lessonsCompleted: skillProfile.lessonsCompleted,
  }

  const scores = computeFluencyScores({ ...base, answers: mapRows(rows) })

  const current7 = rows.filter((r) => new Date(r.answered_at) >= since7)
  const previous7 = rows.filter((r) => {
    const d = new Date(r.answered_at)
    return d >= since14 && d < since7
  })

  const comparisonLabel = fluencyComparisonLabel(
    computeFluencyScores({ ...base, answers: mapRows(current7) }),
    computeFluencyScores({ ...base, answers: mapRows(previous7) }),
  )

  return { scores, comparisonLabel }
}

async function getRecentActivitySessions(userId: string): Promise<ActivitySessionSummary[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('activity_sessions')
      .select(
        'id, source, skill_tags, exercises_total, accuracy_pct, xp_earned, completed_at',
      )
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(15)

    if (error) throw error

    return (data ?? []).map((row) => {
      const source = row.source as ActivitySource
      return {
        id: row.id as string,
        source,
        sourceLabel: ACTIVITY_SOURCE_LABELS[source] ?? (row.source as string),
        skillTags: (row.skill_tags ?? []) as SkillTag[],
        exercisesTotal: row.exercises_total as number,
        accuracyPct: row.accuracy_pct as number,
        xpEarned: row.xp_earned as number,
        completedAt: row.completed_at as string,
      }
    })
  } catch {
    return []
  }
}

export async function getProgressPageData(userId: string): Promise<ProgressPageData> {
  const [streak, dailyCompletion, accuracy, skillProfile, weeklySummary, coachInsights, recentSessions] =
    await Promise.all([
      getDailyStreak(userId),
      getDailyCompletionStats(userId),
      getAccuracyStats(userId),
      getSkillProfileData(userId),
      getWeeklySummaryStats(userId),
      getCoachInsights(userId),
      getRecentActivitySessions(userId),
    ])

  const fluencyProfile = await getFluencyProfile(userId, skillProfile)

  return {
    streak,
    dailyCompletion,
    accuracy,
    skillProfile,
    fluencyProfile,
    weeklySummary,
    coachInsights,
    recentSessions,
  }
}
