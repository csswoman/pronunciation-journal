import { enqueue } from '@/lib/sync/sync-manager'
import { calculateXP } from '@/lib/pronunciation/scoring'
import {
  loadCachedDailyPlan,
  loadResolvedIds,
  saveResolvedIds,
} from '@/lib/daily/plan-storage'
import { reconcileDailySteps } from '@/lib/progress/daily-reconcile'
import {
  practiceContextToSource,
  type ActivitySource,
  type SkillTag,
} from '@/lib/progress/activity-types'
import type { DailyStep, PracticeContext, SessionResult } from '@/lib/practice/types'
import type { PracticeAnswer } from '@/lib/practice/types'

export type ActivitySessionInput = {
  practiceContext: PracticeContext
  sessionResult: SessionResult
  /** Override inferred source (e.g. lexicon). */
  source?: ActivitySource
  /** When omitted, today's cached daily plan is used for reconciliation. */
  dailyPlanSteps?: DailyStep[]
  /** Domain routing data; deliberately not persisted as free-form session text. */
  metadata?: {
    contrastId?: string
    lessonSlug?: string
    coachTool?: string
  }
}

const LISTENING_SLUGS = new Set(['dictation', 'sentence_dictation', 'minimal_pair'])
const SPEAKING_SLUGS = new Set(['speak_word'])
const GRAMMAR_SLUGS = new Set(['reorder_words', 'fill_blank'])
const READING_SLUGS = new Set(['fill_blank', 'sentence_context', 'multiple_choice'])

export function deriveSkillTags(context: PracticeContext, result: SessionResult): SkillTag[] {
  const tags = new Set<SkillTag>()

  switch (context) {
    case 'core-1000':
      tags.add('vocabulary')
      tags.add('speaking')
      break
    case 'sound_lab':
      tags.add('pronunciation')
      tags.add('listening')
      break
    case 'courses':
      tags.add('reading')
      tags.add('grammar')
      break
    case 'ai_coach':
      tags.add('speaking')
      break
    case 'daily':
    case 'practice':
    case 'review':
      break
    default:
      break
  }

  for (const r of result.results) {
    if (SPEAKING_SLUGS.has(r.slug)) tags.add('speaking')
    if (LISTENING_SLUGS.has(r.slug)) tags.add('listening')
    if (GRAMMAR_SLUGS.has(r.slug)) tags.add('grammar')
    if (READING_SLUGS.has(r.slug)) tags.add('reading')
    if (r.soundId != null) tags.add('pronunciation')
    if (r.sourceRef?.source === 'word_bank' || context === 'core-1000') {
      tags.add('vocabulary')
    }
  }

  return [...tags]
}

export function sessionXp(result: SessionResult): number {
  let xp = 0
  for (const r of result.results) {
    if (r.score != null) {
      xp += calculateXP(r.score)
    } else {
      xp += r.isCorrect ? 10 : 2
    }
  }
  return xp
}

export type RecordActivityOutcome = {
  reconciledStepIds: string[]
}

export type ActivitySessionInsert = {
  id: string
  user_id: string
  source: ActivitySource
  practice_context: PracticeContext
  skill_tags: SkillTag[]
  exercises_total: number
  exercises_correct: number
  accuracy_pct: number
  duration_ms: number
  xp_earned: number
  reconciled_step_ids: string[]
  completed_at: string
}

export type SessionTelemetry = {
  activitySession: ActivitySessionInsert
  answers: PracticeAnswer[]
  reconciledStepIds: string[]
  skillTags: SkillTag[]
}

export type BuildSessionTelemetryOptions = {
  id?: string
  completedAt?: Date
}

/** Pure normalized contract shared by every completed practice surface. */
export function buildSessionTelemetry(
  userId: string,
  input: ActivitySessionInput,
  options: BuildSessionTelemetryOptions = {},
): SessionTelemetry {
  const { practiceContext, sessionResult } = input
  const total = sessionResult.results.length
  const source = input.source ?? practiceContextToSource(practiceContext)
  const skillTags = deriveSkillTags(practiceContext, sessionResult)
  const correct = sessionResult.results.filter((r) => r.isCorrect).length
  const planSteps = input.dailyPlanSteps ?? []
  const reconciledStepIds =
    practiceContext === 'daily'
      ? []
      : reconcileDailySteps(planSteps, sessionResult, practiceContext)

  return {
    activitySession: {
      id: options.id ?? crypto.randomUUID(),
      user_id: userId,
      source,
      practice_context: practiceContext,
      skill_tags: skillTags,
      exercises_total: total,
      exercises_correct: correct,
      accuracy_pct: Math.round(sessionResult.accuracy),
      duration_ms: sessionResult.totalTimeMs,
      xp_earned: sessionXp(sessionResult),
      reconciled_step_ids: reconciledStepIds,
      completed_at: (options.completedAt ?? new Date()).toISOString(),
    },
    answers: sessionResult.results.map((result) => {
      const { completedAt, ...answer } = result
      void completedAt
      return { ...answer, context: practiceContext }
    }),
    reconciledStepIds,
    skillTags,
  }
}

/**
 * Single exit point when a practice session completes.
 * Persists a summary row and reconciles the daily plan (best-effort).
 */
export async function recordActivitySession(
  userId: string,
  input: ActivitySessionInput,
): Promise<RecordActivityOutcome> {
  const { sessionResult } = input
  const total = sessionResult.results.length
  if (total === 0) return { reconciledStepIds: [] }

  const planSteps =
    input.dailyPlanSteps ?? loadCachedDailyPlan(userId)?.steps ?? []
  const telemetry = buildSessionTelemetry(userId, {
    ...input,
    dailyPlanSteps: planSteps,
  })
  const { reconciledStepIds } = telemetry

  if (reconciledStepIds.length > 0) {
    const merged = loadResolvedIds(userId)
    for (const id of reconciledStepIds) merged.add(id)
    saveResolvedIds(userId, merged)
  }

  try {
    await enqueue(
      'activity_sessions',
      'insert',
      telemetry.activitySession as unknown as Record<string, unknown>,
    )
  } catch (err) {
    console.error('[activity-hub] enqueue activity_sessions failed', err)
  }

  return { reconciledStepIds }
}
