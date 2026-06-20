import type { PracticeContext } from '@/lib/practice/types'

/** Canonical activity source stored in activity_sessions.source */
export type ActivitySource =
  | 'essential_words'
  | 'sound_lab'
  | 'daily_plan'
  | 'review'
  | 'practice'
  | 'lexicon'
  | 'courses'
  | 'ai_coach'

export type SkillTag =
  | 'speaking'
  | 'vocabulary'
  | 'grammar'
  | 'pronunciation'
  | 'listening'
  | 'reading'

export const ACTIVITY_SOURCE_LABELS: Record<ActivitySource, string> = {
  essential_words: 'Essential Words',
  sound_lab: 'Sound Lab',
  daily_plan: 'Daily Plan',
  review: 'Review',
  practice: 'Practice',
  lexicon: 'Dictionary',
  courses: 'Ruta',
  ai_coach: 'AI Coach',
}

export function practiceContextToSource(context: PracticeContext): ActivitySource {
  switch (context) {
    case 'core-1000':
      return 'essential_words'
    case 'sound_lab':
      return 'sound_lab'
    case 'daily':
      return 'daily_plan'
    case 'review':
      return 'review'
    case 'courses':
      return 'courses'
    case 'ai_coach':
      return 'ai_coach'
    case 'practice':
    default:
      return 'practice'
  }
}

export interface ActivitySessionRow {
  id: string
  source: ActivitySource
  practice_context: PracticeContext | null
  skill_tags: SkillTag[]
  exercises_total: number
  exercises_correct: number
  accuracy_pct: number
  duration_ms: number
  xp_earned: number
  reconciled_step_ids: string[]
  completed_at: string
}

export interface ActivitySessionSummary {
  id: string
  source: ActivitySource
  sourceLabel: string
  skillTags: SkillTag[]
  exercisesTotal: number
  accuracyPct: number
  xpEarned: number
  completedAt: string
}
