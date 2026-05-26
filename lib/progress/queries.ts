import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getDailyStreak, type DailyStreakResult } from '@/lib/daily/streak'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DailyCompletionStats {
  rate7: number   // 0-100 percentage over last 7 days
  rate30: number  // 0-100 percentage over last 30 days
  completedDays7: number
  completedDays30: number
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
}

export interface ProgressPageData {
  streak: DailyStreakResult
  dailyCompletion: DailyCompletionStats
  accuracy: AccuracyStats
  skillProfile: SkillProfileData
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
    const day = (row.answered_at as string).slice(0, 10)
    countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1)
  }

  const today = new Date()
  let completedDays7 = 0
  let completedDays30 = 0

  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const day = d.toISOString().slice(0, 10)
    const count = countsByDay.get(day) ?? 0
    if (count >= DAILY_THRESHOLD) {
      completedDays30++
      if (i < 7) completedDays7++
    }
  }

  return {
    rate7: Math.round((completedDays7 / 7) * 100),
    rate30: Math.round((completedDays30 / 30) * 100),
    completedDays7,
    completedDays30,
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

  const [wordBankResult, phonemeResult] = await Promise.all([
    supabase
      .from('word_bank')
      .select('srs_status')
      .eq('user_id', userId)
      .eq('status', 'ready'),

    supabase
      .from('user_sound_progress')
      .select('total_attempts, correct_answers, sounds(ipa)')
      .eq('user_id', userId)
      .gt('total_attempts', 0)
      .neq('status', 'locked')
      .order('total_attempts', { ascending: false })
      .limit(20),
  ])

  // Words by SRS status
  const wordsByStatus: WordBankByStatus = { new: 0, learning: 0, review: 0, mastered: 0 }
  for (const row of wordBankResult.data ?? []) {
    const s = row.srs_status as keyof WordBankByStatus
    if (s in wordsByStatus) wordsByStatus[s]++
  }

  // Weakest phonemes: sorted by accuracy ascending, min 5 attempts
  const phonemes = (phonemeResult.data ?? [])
    .filter((r) => (r.total_attempts ?? 0) >= 5)
    .map((r) => {
      const attempts = r.total_attempts ?? 0
      const correct = r.correct_answers ?? 0
      return {
        ipa: (r.sounds as { ipa: string } | null)?.ipa ?? '?',
        accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
        totalAttempts: attempts,
      }
    })
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5)

  return { wordsByStatus, weakestPhonemes: phonemes }
}

export async function getProgressPageData(userId: string): Promise<ProgressPageData> {
  const [streak, dailyCompletion, accuracy, skillProfile] = await Promise.all([
    getDailyStreak(userId),
    getDailyCompletionStats(userId),
    getAccuracyStats(userId),
    getSkillProfileData(userId),
  ])

  return { streak, dailyCompletion, accuracy, skillProfile }
}
