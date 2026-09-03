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
import { startOfRollingWindow, sumWeeklyExercises } from '@/lib/progress/windows'
import { deriveWordProgressSignal } from '@/lib/word-bank/progress-state'
import { projectProgress, type ProgressFact, type ProgressProjections } from './projections'
import type { EvidenceAttribution } from '@/lib/practice/attribution'
import type { CanSayAttempt } from './can-say-now'
import { getSpeechLatencyData, type SpeechLatencyData } from './speech-latency-queries'

export type { SpeechLatencyData } from './speech-latency-queries'

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
  /** Separate progress signals; these are not additional SRS buckets. */
  saved?: number
  familiar?: number
  verified?: number
  legacyMastered?: number
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
  profileLevel: string | null
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
  projections: ProgressProjections
  canSayAttempts: CanSayAttempt[]
  speechLatency: SpeechLatencyData
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Cap for the /progress recent-session strip — older sessions are truncated. */
export const RECENT_ACTIVITY_SESSION_LIMIT = 15
/** Cap for contrast rows pulled into the skill-profile phoneme strip. */
export const SKILL_PROFILE_CONTRAST_LIMIT = 40
/** Rolling window (days) for completion heatmap and fluency answer history. */
export const PROGRESS_ANSWER_WINDOW_DAYS = 30
/**
 * Rolling window (days) for exercise_payload evidence pulled into
 * projections' "latest evidence per target" list. projectProgress only
 * ever keeps the single most-recent fact per target, so a target drops
 * out of the list only if its sole evidence predates this window — at
 * which point treating it as not-yet-evidenced is reasonable, not a bug.
 */
export const PROGRESS_PROJECTION_EVIDENCE_WINDOW_DAYS = 180

/** How many qualifying practice days in a window of N days (any context). */
export async function getDailyCompletionStats(userId: string): Promise<DailyCompletionStats> {
  const supabase = await createSupabaseServerClient()

  const since30 = new Date()
  since30.setDate(since30.getDate() - PROGRESS_ANSWER_WINDOW_DAYS)

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

export async function getWeeklySummaryStats(userId: string): Promise<WeeklySummaryStats> {
  const supabase = await createSupabaseServerClient()
  const since7 = startOfRollingWindow(7)

  const [sessionsResult, wordsResult] = await Promise.all([
    supabase
      .from('activity_sessions')
      .select('exercises_total')
      .eq('user_id', userId)
      .gte('completed_at', since7.toISOString()),
    supabase
      .from('word_bank')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since7.toISOString()),
  ])

  return {
    exercises7: sumWeeklyExercises(sessionsResult.data ?? []),
    newWords7: wordsResult.count ?? 0,
  }
}

export async function getAccuracyStats(userId: string): Promise<AccuracyStats> {
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

export async function getSkillProfileData(userId: string): Promise<SkillProfileData> {
  const supabase = await createSupabaseServerClient()

  const [wordBankResult, phonemeResult, core1000Result, lessonsResult] = await Promise.all([
    supabase
      .from('word_bank')
      .select('srs_status, familiarity_status, mastery_provenance, objective_evidence_count')
      .eq('user_id', userId)
      .eq('status', 'ready'),

    supabase
      .from('user_contrast_progress')
      .select('contrast_id, total_attempts, correct_answers, mastery_pct')
      .eq('user_id', userId)
      .gt('total_attempts', 0)
      .order('total_attempts', { ascending: false })
      .limit(SKILL_PROFILE_CONTRAST_LIMIT),

    supabase
      .from('answer_history')
      .select('content_id', { count: 'exact', head: false })
      .eq('user_id', userId)
      .eq('context', 'essential-words')
      .eq('is_correct', true),

    supabase
      .from('lesson_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
  ])

  // Words by SRS status
  const wordsByStatus: WordBankByStatus = {
    new: 0,
    learning: 0,
    review: 0,
    mastered: 0,
    saved: 0,
    familiar: 0,
    verified: 0,
    legacyMastered: 0,
  }
  for (const row of wordBankResult.data ?? []) {
    const s = row.srs_status as keyof WordBankByStatus
    const signal = deriveWordProgressSignal(row)
    if (s === 'mastered') {
      if (signal === 'mastered') wordsByStatus.mastered++
      else if (signal === 'legacy_mastered') wordsByStatus.legacyMastered!++
    } else if (s in wordsByStatus) {
      wordsByStatus[s]++
    }
    if (signal === 'saved') wordsByStatus.saved!++
    if (signal === 'familiar') wordsByStatus.familiar!++
    if (signal === 'objective_evidence' || signal === 'mastered') wordsByStatus.verified!++
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

export async function getCoachInsights(userId: string): Promise<CoachInsights> {
  try {
    const supabase = await createSupabaseServerClient()
    const [{ data }, { data: profile }] = await Promise.all([
      supabase.from('user_learning_state').select('state').eq('user_id', userId).maybeSingle(),
      supabase.from('user_profiles').select('cefr_level').eq('id', userId).maybeSingle(),
    ])

    if (!data?.state) {
      return { weakTopics: [], cefrEstimate: null, profileLevel: profile?.cefr_level ?? null, avgAccuracy: null }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- jsonb blob, shape validated at write time
    const state = data.state as any
    const weakTopics: CoachWeakTopic[] = (state?.grammar?.weakTopics ?? [])
      .filter((t: CoachWeakTopic) => t.errorRate > 0.3 && t.sampleCount >= 3)
      .sort((a: CoachWeakTopic, b: CoachWeakTopic) => b.errorRate - a.errorRate)
      .slice(0, 5)

    return {
      weakTopics,
      cefrEstimate: state?.level?.cefrEstimate ?? null,
      profileLevel: profile?.cefr_level ?? null,
      avgAccuracy: state?.pronunciation?.averageAccuracy ?? null,
    }
  } catch {
    return { weakTopics: [], cefrEstimate: null, profileLevel: null, avgAccuracy: null }
  }
}

export async function getFluencyProfile(userId: string, skillProfile: SkillProfileData): Promise<FluencyProfileData> {
  const supabase = await createSupabaseServerClient()
  const since30 = new Date()
  since30.setDate(since30.getDate() - PROGRESS_ANSWER_WINDOW_DAYS)
  const since14 = new Date()
  since14.setDate(since14.getDate() - 14)
  const since7 = new Date()
  since7.setDate(since7.getDate() - 7)

  const [answersResult, contrastResult] = await Promise.all([
    supabase
      .from('answer_history')
      .select('exercise_type_id, context, is_correct, grade, exercise_payload, answered_at')
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
    exercise_payload: unknown
    answered_at: string
  }>

  const mapRows = (list: typeof rows): FluencyRawAnswer[] =>
    list.map((row) => ({
      exerciseTypeId: row.exercise_type_id,
      exercisePayload: row.exercise_payload,
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

  // Week comparison measures answers in each window only. Current aggregate
  // vocabulary/completion state must not be projected into both weeks.
  const windowBase = {
    wordsByStatus: { new: 0, learning: 0, review: 0, mastered: 0 },
    contrastCorrect: 0,
    contrastTotal: 0,
    core1000Practiced: 0,
    lessonsCompleted: 0,
  }
  const comparisonLabel = fluencyComparisonLabel(
    computeFluencyScores({ ...windowBase, answers: mapRows(current7) }),
    computeFluencyScores({ ...windowBase, answers: mapRows(previous7) }),
  )

  return { scores, comparisonLabel }
}

export async function getRecentActivitySessions(userId: string): Promise<ActivitySessionSummary[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('activity_sessions')
      .select(
        'id, source, skill_tags, exercises_total, accuracy_pct, xp_earned, completed_at',
      )
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(RECENT_ACTIVITY_SESSION_LIMIT)

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

function attributedAnswerFacts(rows: Array<{
  id: string
  is_correct: boolean
  answered_at: string | null
  exercise_payload: unknown
}>): ProgressFact[] {
  return rows.flatMap((row) => {
    if (!row.exercise_payload || typeof row.exercise_payload !== 'object') return []
    const payload = row.exercise_payload as {
      attributionVersion?: number
      attribution?: EvidenceAttribution
      missionId?: string
      targetId?: string
      modality?: string
    }
    if (
      payload.missionId
      && payload.targetId
      && payload.modality === 'stt_intelligibility'
    ) {
      return [{
        id: row.id,
        signal: 'transfer' as const,
        occurredAt: row.answered_at ?? '',
        targetId: `pronunciation:${payload.targetId}`,
        correct: row.is_correct,
        provenance: 'oral_mission.answer_history',
        modality: 'stt_intelligibility' as const,
      }]
    }
    if (payload.attributionVersion !== 1 || !payload.attribution?.srsEligible) return []
    return payload.attribution.outcomes.map((outcome, index) => ({
      id: `${row.id}:${index}`,
      signal: payload.missionId ? 'transfer' as const : 'objective_evidence' as const,
      occurredAt: row.answered_at ?? '',
      targetId: `${outcome.target.namespace}:${outcome.target.id}`,
      correct: outcome.correct,
      provenance: 'answer_history',
      modality: outcome.modality,
    }))
  })
}

export async function getProgressProjections(userId: string): Promise<ProgressProjections> {
  const supabase = await createSupabaseServerClient()
  const sinceEvidenceWindow = new Date()
  sinceEvidenceWindow.setDate(sinceEvidenceWindow.getDate() - PROGRESS_PROJECTION_EVIDENCE_WINDOW_DAYS)

  const [activityTotals, completionTotal, answers] = await Promise.all([
    supabase.rpc('get_activity_totals'),
    supabase.rpc('get_lesson_completion_total'),
    supabase.from('answer_history')
      .select('id, is_correct, answered_at, exercise_payload')
      .eq('user_id', userId)
      .gte('answered_at', sinceEvidenceWindow.toISOString())
      .not('answered_at', 'is', null),
  ])

  if (activityTotals.error) console.error('getProgressProjections: get_activity_totals failed', activityTotals.error)
  if (completionTotal.error) console.error('getProgressProjections: get_lesson_completion_total failed', completionTotal.error)
  if (answers.error) console.error('getProgressProjections: answer_history query failed', answers.error)

  const row = activityTotals.data?.[0]

  const evidenceFacts = attributedAnswerFacts((answers.data ?? []) as Array<{
    id: string
    is_correct: boolean
    answered_at: string | null
    exercise_payload: unknown
  }>)

  return projectProgress(evidenceFacts, {
    activity: {
      sessions: row?.sessions ?? 0,
      exercises: row?.exercises ?? 0,
      durationMs: row?.duration_ms ?? 0,
      activeDays: row?.active_days ?? 0,
    },
    completedCount: completionTotal.data ?? 0,
  })
}

export async function getCanSayNowAttempts(userId: string): Promise<CanSayAttempt[]> {
  const supabase = await createSupabaseServerClient()
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const { data, error } = await supabase
    .from('answer_history')
    .select('is_correct, user_answer, answered_at, exercise_payload')
    .eq('user_id', userId)
    .eq('exercise_type_id', 16) // spoken_production — see EXERCISE_TYPE_IDS
    .gte('answered_at', since)
    .order('answered_at', { ascending: false })
    .limit(500)

  if (error || !data) return []

  return data.flatMap((row) => {
    const payload = row.exercise_payload as { constraintId?: unknown } | null
    const constraintId = typeof payload?.constraintId === 'string' ? payload.constraintId : null
    if (!constraintId) return []
    return [{
      constraintId,
      isCorrect: Boolean(row.is_correct),
      answeredAt: String(row.answered_at),
      sentence: typeof row.user_answer === 'string' ? row.user_answer : undefined,
    }]
  })
}

export async function getProgressPageData(userId: string): Promise<ProgressPageData> {
  const [streak, dailyCompletion, accuracy, skillProfile, weeklySummary, coachInsights, recentSessions, projections, canSayAttempts, speechLatency] =
    await Promise.all([
      getDailyStreak(userId),
      getDailyCompletionStats(userId),
      getAccuracyStats(userId),
      getSkillProfileData(userId),
      getWeeklySummaryStats(userId),
      getCoachInsights(userId),
      getRecentActivitySessions(userId),
      getProgressProjections(userId),
      getCanSayNowAttempts(userId),
      getSpeechLatencyData(userId),
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
    projections,
    canSayAttempts,
    speechLatency,
  }
}

export interface SkillProfileSnapshot {
  cefr: string | null
  weakestPhonemes: WeakestPhoneme[]
}

export async function loadSkillProfile(userId: string): Promise<SkillProfileSnapshot | null> {
  try {
    const [insights, skillData] = await Promise.all([
      getCoachInsights(userId),
      getSkillProfileData(userId),
    ])
    const rawCefr = insights.cefrEstimate || insights.profileLevel
    return {
      cefr: rawCefr,
      weakestPhonemes: skillData.weakestPhonemes,
    }
  } catch {
    return null
  }
}
