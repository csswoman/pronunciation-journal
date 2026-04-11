/**
 * Skill Profile types - derived from get_skill_profile RPC
 */

export type SkillLevel = 'low' | 'medium' | 'high'

export interface SkillMetric {
  score: number
  confidence?: SkillLevel
  attempts?: number
  accuracy?: number
}

export interface SkillScores {
  pronunciation: SkillMetric & {
    attempts: number
    accuracy: number
  }
  listening: SkillMetric & {
    attempts: number
    accuracy: number
  }
  vocabulary: SkillMetric & {
    totalEntries: number
    masteredEntries: number
  }
  speaking: SkillMetric & {
    note: string
  }
  reading: SkillMetric & {
    note: string
  }
  writing: SkillMetric & {
    note: string
  }
}

export interface DailyTrend {
  date: string
  accuracy: number
  attempts: number
}

export interface StreakInfo {
  current: number
  best: number
  soundsPracticed: number
  totalSounds: number
}

export interface TodayStats {
  attempts: number
  correct: number
  accuracy: number
  streak: number
}

export interface SkillProfile {
  skills: SkillScores
  today: TodayStats
  streak: StreakInfo
  trend7d: DailyTrend[]
  soundsDueToday: number
  overallScore: number
}

/**
 * Skill insight generation - for dashboard copy
 */
export interface SkillInsight {
  title: string
  message: string
  action?: {
    label: string
    href: string
  }
}

/**
 * Skill name to display label
 */
export const SKILL_LABELS: Record<keyof Omit<SkillScores, 'speaking' | 'reading' | 'writing'>, string> = {
  pronunciation: 'Pronunciation',
  listening: 'Listening',
  vocabulary: 'Vocabulary',
}

/**
 * Available skill names for the radar chart
 */
export type SkillDimension = keyof SkillScores

export const SKILL_DIMENSIONS: SkillDimension[] = [
  'pronunciation',
  'listening',
  'vocabulary',
  'speaking',
  'reading',
  'writing',
]

/**
 * Skill categories for filtering and grouping
 */
export const SKILL_CATEGORIES = {
  receptive: ['listening', 'reading'],
  productive: ['pronunciation', 'speaking', 'writing'],
  knowledge: ['vocabulary'],
} as const

/**
 * Color mapping for radar chart
 */
export const SKILL_COLORS: Record<SkillDimension, string> = {
  pronunciation: 'from-blue-500 to-blue-600',
  listening: 'from-green-500 to-green-600',
  vocabulary: 'from-purple-500 to-purple-600',
  speaking: 'from-orange-500 to-orange-600',
  reading: 'from-pink-500 to-pink-600',
  writing: 'from-indigo-500 to-indigo-600',
}
